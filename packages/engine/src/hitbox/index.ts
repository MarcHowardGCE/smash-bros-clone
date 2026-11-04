import{calculateHitlag,calculateShieldHitlag,calculateShieldStun,calculateParryHitlag}from'./hitlag.js';
import{asdiPolicy}from'./displacement.js';
import{directionZone,inputDirectionZone}from'../fsm/hitstop.js';
import{staleMultiplier,rageMultiplier,hitstunFromKnockback}from'./combatFormulas.js';
import{isDamageImmune}from'./immunity.js';
/**
 * @fileoverview Hitbox collision and knockback resolution for the deterministic game engine.
 *
 * All functions are pure transformations — no mutation, no I/O. Collision is
 * modelled with sprite-scale attack circles (positioned relative to the
 * attacker's facing direction) and narrow body capsules or shield circles.
 *
 * Key design decisions:
 * - **Knockback formula**: derived from Super Smash Bros. — magnitude scales with
 *   the defender's current damage percent, so early hits do little knockback but
 *   the same move at high percent can KO.
 * - **Stale-move negation**: recency-weighted history with shield-contact weighting.
 * - **Rage multiplier**: attacker deals slightly more knockback as their own percent
 *   rises (up to ~10% bonus at 150%), rewarding survival under pressure.
 * - **Hit trading**: `resolveHitTrade` resolves simultaneous hitbox clashes by
 *   priority — higher priority wins; equal priority means both hits land.
 * - **`NO_HIT` sentinel**: a frozen zero-value `HitResult` returned whenever no
 *   collision is detected, avoiding `null` checks at call sites.
 */

import { circleOverlap, INPUT_BITS, knockbackAngleToVelocity, PHYSICS, getCharacterStats } from '@smash/shared';
import type { PlayerState, HitboxData, Circle, InputEvent } from '@smash/shared';

/**
 * Result returned by hitbox collision queries.
 *
 * When no collision occurs, the `NO_HIT` sentinel is returned instead of this
 * interface with `hit: false` — callers should check `result === NO_HIT` or
 * `result.hit` before consuming the other fields.
 */
export interface HitResult {
  attackerHitlagFrames?:number;
  shieldStunFrames?:number;
  asdiImpactX?:number;
  asdiImpactY?:number;
  sdiMultiplier?:number;
  asdiMultiplier?:number;
  sdiInitialDirection?:number;
  hit: boolean;
  damage: number;
  knockbackVx: number;
  knockbackVy: number;
  hitlagFrames: number;
  hitstunFrames: number;
}

/**
 * Sentinel value returned when no hitbox collision is detected.
 *
 * Using a frozen zero-value object avoids `null` checks at every call site.
 * Callers can do `result === NO_HIT` or simply check `result.hit` to branch.
 */
export const NO_HIT: HitResult = {
  hit: false,
  damage: 0,
  knockbackVx: 0,
  knockbackVy: 0,
  hitlagFrames: 0,
  hitstunFrames: 0,
};

function isDownHeld(input: InputEvent | null): boolean {
	return Boolean((input?.held ?? 0) & INPUT_BITS.DOWN);
}


// Smash Bros knockback formula: ((p/10 + (p*d)/20) * (200/(w+100)) * 1.4 + 18) * (kbg/100) + bkb
/**
 * Calculates raw knockback magnitude using the Smash Bros formula.
 *
 * Formula: `((p/10 + (p*d)/20) * (200/(w+100)) * 1.4 + 18) * (kbg/100) + bkb`
 *
 * - `p` (percent) and `d` (damage) together produce a percent-scaling term:
 *   the higher the defender's existing damage, the more the hit launches them.
 * - `200/(w+100)` is the weight divisor — heavier fighters take less knockback.
 * - `1.4` is a global scaling constant carried over from Smash Bros.
 * - The `+18` floor prevents very-low-percent hits from having zero launch.
 * - `kbg/100` (knockback growth) scales the whole result — smash attacks have
 *   high growth so they KO at lower percents.
 * - `bkb` (base knockback) is added last as a flat offset, useful for moves
 *   that need a minimum launch distance regardless of percent.
 *
 * @param percent - Launch percent, including this hit's damage before the one-on-one modifier.
 * @param damage - Launch base damage after the 30% stale adjustment.
 * @param baseKnockback - Flat knockback added after all scaling (the `bkb` term).
 * @param knockbackGrowth - Per-move growth coefficient (the `kbg` term).
 * @param weight - Defender's fighter weight (higher = less knockback).
 * @returns Raw knockback magnitude (unitless; passed to `knockbackAngleToVelocity`).
 */
export function calculateKnockback(
  percent: number,
  damage: number,
  baseKnockback: number,
  knockbackGrowth: number,
  weight: number
): number {
  const p = percent;
  const d = damage;
  const w = weight;
  const kbg = knockbackGrowth;
  const bkb = baseKnockback;
  return ((p / 10 + (p * d) / 20) * (200 / (w + 100)) * 1.4 + 18) * (kbg / 100) + bkb;
}

/**
 * Computes the world-space position and radius of a hitbox relative to the attacker.
 *
 * The offset is mirrored on the x-axis by `player.facing` (+1 right, -1 left) so
 * moves always extend in the direction the fighter is looking without needing
 * separate left/right hitbox definitions.
 *
 * @param player - The attacking player state (provides `x`, `y`, and `facing`).
 * @param hitbox - Move hitbox definition with `offsetX`, `offsetY`, and `radius`.
 * @returns A `Circle` in world coordinates ready for `circleOverlap` testing.
 */
/** Attack data predates full-body art: convert legacy melee geometry to sprite world units. */
function isHeldContact(player:PlayerState):boolean{return player.currentMoveId==='PUMMEL'||['FORWARD_THROW','BACK_THROW','UP_THROW','DOWN_THROW'].includes(player.currentMoveId??'');}
export function getActiveHitboxWorldPos(player:PlayerState,hitbox:HitboxData):Circle{
 const scaled=!!player.currentMoveId&&!isHeldContact(player);
 const scale=scaled?(player.currentMoveId?.startsWith('GRAB')?0.75:0.5):1;
 return{x:player.x+hitbox.offsetX*player.facing*scale,y:player.y+hitbox.offsetY*scale-(scaled&&player.isGrounded?20:0),radius:hitbox.radius*scale};
}
/** Narrow vertical damage capsule; physics/ground/ledge radius is deliberately independent. */
export function getDamageHurtbox(player:PlayerState):{x:number;top:number;bottom:number;radius:number}{
 const radius=player.characterId==='abe-lincoln'?15:player.characterId==='swift'?11:12;
 const height=player.characterId==='abe-lincoln'?98:player.characterId==='swift'?78:82;
 const feet=player.y+getCharacterStats(player.characterId).hurtboxRadius;
 const crouched=player.state==='CROUCH',h=crouched?height*.6:height;
 const center=player.isGrounded?feet-h/2:player.y;
 return{x:player.x,top:center-h/2+radius,bottom:center+h/2-radius,radius};
}
function overlapsDamageHurtbox(hit:Circle,player:PlayerState):boolean{
 if(player.isShielding||player.state==='SHIELD')return circleOverlap(hit,getHurtbox(player));
 const body=getDamageHurtbox(player),nearY=Math.max(body.top,Math.min(body.bottom,hit.y));
 return (hit.x-body.x)**2+(hit.y-nearY)**2<(hit.radius+body.radius)**2;
}

/**
 * Returns the legacy physics/shield bounding circle. Body damage uses getDamageHurtbox.
 *
 * The hurtbox is centred on the player's position. Its radius comes from the
 * character's stats so different fighters can have different body sizes.
 *
 * @param player - Current immutable player state.
 * @returns A `Circle` in world coordinates representing the player's vulnerable area.
 */
export function getHurtbox(player: PlayerState): Circle {
  return {
    x: player.x,
    y: player.y,
    radius: getCharacterStats(player.characterId).hurtboxRadius,
  };
}

/**
 * Tests hitbox-vs-hurtbox circle overlap and computes the full hit result.
 *
 * Returns `NO_HIT` immediately if the circles don't overlap. When they do:
 * - **Stale moves / knockback**: weighted history changes damage and launch base;
 *   launch percent includes the current hit. See combatFormulas.ts and referenceCases.test.ts.
 * - **Crouch cancel**: if the defender is grounded and holding DOWN, knockback is
 *   reduced by 15% (`× 0.85`).
 * - **Rage**: attacker at high percent deals slightly more knockback (up to ~10%
 *   bonus at 150% damage).
 * - **Hitstun**: floor(knockback * 0.4) - 1, minimum four ticks.
 *
 * @param attacker - Attacking player state (provides position, facing, currentMoveId, staleMoveQueue, percent).
 * @param defender - Defending player state (provides position, percent, characterId).
 * @param hitbox - The specific hitbox being tested (from the attacker's active move).
 * @param defenderInput - Defender's input this frame, used for crouch-cancel check. Pass `null` if unavailable.
 * @returns A populated `HitResult` on collision, or `NO_HIT` if the circles don't overlap.
 */
export function resolveHit(
	attacker: PlayerState,
	defender: PlayerState,
	hitbox: HitboxData,
	defenderInput: InputEvent | null = null,
 context:{playerCount?:number}={},
): HitResult {
  if(isDamageImmune(defender))return NO_HIT;
  const hitboxCircle = getActiveHitboxWorldPos(attacker, hitbox);
  const hurtboxCircle = getHurtbox(defender);

  if (!(attacker.currentMoveId&&!isHeldContact(attacker)?(overlapsDamageHurtbox(hitboxCircle,defender)||(attacker.isGrounded&&hitbox.offsetX!==0&&Math.abs(hitbox.offsetY)<=20&&overlapsDamageHurtbox({x:attacker.x,y:hitboxCircle.y,radius:Math.min(hitboxCircle.radius,6)},defender))):circleOverlap(hitboxCircle, hurtboxCircle))) {
    return NO_HIT;
  }

	const stale=staleMultiplier(attacker.currentMoveId,attacker.staleMoveQueue??[],attacker.staleMoveShieldQueue);
 const shortHop=attacker.shortHop&&attacker.state==='AIR_ATTACK'&&['NEUTRAL_AIR','FORWARD_AIR','BACK_AIR','UP_AIR','DOWN_AIR'].includes(attacker.currentMoveId??'');
 const scaledDamage=hitbox.damage*stale*(shortHop?PHYSICS.SHORT_HOP_AERIAL_DAMAGE_MULTIPLIER:1);
 const launchBaseDamage=hitbox.damage*(1-(1-stale)*.3);

	// Knockback scales with defender's current percent — the higher the damage already
	// taken, the more the next hit launches them. This is the core Smash Bros feel:
	// early hits do little knockback, but the same move at high percent can KO.
	const baseKnockbackMagnitude = calculateKnockback(
		defender.percent+scaledDamage,
		launchBaseDamage,
		hitbox.baseKnockback,
		hitbox.knockbackGrowth,
		getCharacterStats(defender.characterId).fighterWeight
	);
		const crouchAdjustedKnockbackMagnitude =
			defender.isGrounded && isDownHeld(defenderInput)
				? baseKnockbackMagnitude * 0.85
				: baseKnockbackMagnitude;
		const rageMult = rageMultiplier(attacker.percent);
		const knockbackMagnitude = crouchAdjustedKnockbackMagnitude * rageMult;

  const { x: vx, y: vy } = knockbackAngleToVelocity(
    knockbackMagnitude,
    hitbox.knockbackAngle,
    attacker.facing
  );

 const multiplier=hitbox.hitlagMultiplier??(hitbox.hitlagFrames===0?0:1);
 const electric=(hitbox.effect??(hitbox.electric?'electric':'normal'))==='electric';
 const shielding=(defender.isShielding||defender.state==='SHIELD')&&defender.shieldHealth>0;
 const parry=shielding&&defender.shieldReleaseEligible===true&&!defender.shieldParryConsumed&&defender.shieldReleaseFrame!==undefined&&defender.shieldReleaseFrame<PHYSICS.PERFECT_SHIELD_WINDOW_FRAMES;
 const shield=calculateShieldHitlag(scaledDamage,multiplier,electric,hitbox.isProjectile,hitbox.projectileAttached);
 const parryFreeze=calculateParryHitlag(scaledDamage,multiplier,electric,hitbox.isProjectile,hitbox.projectileAttached,hitbox.direct??true);
 const shieldStun=calculateShieldStun(scaledDamage,hitbox.shieldstunMultiplier??1,hitbox.isProjectile,hitbox.projectileAttached,attacker.currentMoveId?.endsWith('_SMASH'),['NEUTRAL_AIR','FORWARD_AIR','BACK_AIR','UP_AIR','DOWN_AIR'].includes(attacker.currentMoveId??''));
 const displacement=asdiPolicy(hitbox,defenderInput?.held??0,defender.isGrounded,isHeldContact(attacker)||shielding);
	return {
		hit: true,
		damage: scaledDamage,
		knockbackVx: vx,
		knockbackVy: vy,
		shieldStunFrames:shieldStun,
        hitlagFrames:shielding?(parry?parryFreeze.target:shield.target):calculateHitlag(scaledDamage,multiplier,hitbox.isProjectile?2:context.playerCount??2,electric,defender.isGrounded&&isDownHeld(defenderInput)),
        attackerHitlagFrames:shielding?(parry?parryFreeze.attacker:shield.attacker):hitbox.isProjectile&&!hitbox.projectileAttached?0:calculateHitlag(scaledDamage,multiplier,context.playerCount??2,electric),
        sdiMultiplier:isHeldContact(attacker)?0:(hitbox.sdiMultiplier??1),asdiMultiplier:displacement.exitMultiplier,asdiImpactX:displacement.impactX,asdiImpactY:displacement.impactY,sdiInitialDirection:inputDirectionZone(defenderInput),
	    // Reference hitstun: floor(0.4 * knockback) - 1, minimum four frames.
	    hitstunFrames: hitstunFromKnockback(knockbackMagnitude),
	  };
}

/**
 * Convenience wrapper: tests the attacker's currently active hitbox against the defender.
 *
 * Returns `NO_HIT` immediately if the attacker has no `activeHitbox`. Otherwise
 * delegates to `resolveHit` for the full circle-overlap and knockback calculation.
 *
 * This is the primary entry point called by GameEngine each tick — it avoids the
 * caller having to null-check `activeHitbox` before every collision test.
 *
 * @param attacker - Attacking player state. Must have `activeHitbox` set for a hit to register.
 * @param defender - Defending player state.
 * @param defenderInput - Defender's input this frame (used for crouch-cancel). Pass `null` if unavailable.
 * @returns A populated `HitResult` on collision, or `NO_HIT` if no active hitbox or circles don't overlap.
 */
export function checkHitboxCollision(
	attacker: PlayerState,
	defender: PlayerState,
	defenderInput: InputEvent | null = null,
 context:{playerCount?:number}={},
): HitResult {
	if (!attacker.activeHitbox) return NO_HIT;
	return resolveHit(attacker, defender, attacker.activeHitbox, defenderInput,context);
}

// Project-specific priority resolution; not a complete Ultimate clank model.
/**
 * Resolves simultaneous hitbox clashes between two fighters by priority.
 *
 * When both players have an `activeHitbox` this frame, naively applying both hits
 * would mean every simultaneous attack always trades. Instead, priority rules decide:
 * - **Higher priority wins**: the lower-priority hit is cancelled (`NO_HIT`), only
 *   the higher-priority hit lands.
 * - **Equal priority**: both hits land — a true trade, under this project's priority model.
 * - **One or both hitboxes absent**: returns `[NO_HIT, NO_HIT]` immediately.
 *
 * Results are ordered by receiving fighter: [damage to A, damage to B].
 *
 * @param playerA - First fighter state.
 * @param playerB - Second fighter state.
 * @param playerAInput - playerA's input this frame (used for crouch-cancel on playerA). Pass `null` if unavailable.
 * @param playerBInput - playerB's input this frame (used for crouch-cancel on playerB). Pass `null` if unavailable.
 * @returns A tuple `[damage to playerA, damage to playerB]` after priority resolution.
 */
export function resolveHitTrade(
	playerA: PlayerState,
	playerB: PlayerState,
	playerAInput: InputEvent | null = null,
	playerBInput: InputEvent | null = null,
 context:{playerCount?:number}={},
): [HitResult, HitResult] {
  if (!playerA.activeHitbox || !playerB.activeHitbox) {
    return [NO_HIT, NO_HIT];
  }

	const hitB = resolveHit(playerA, playerB, playerA.activeHitbox, playerBInput,context);
	const hitA = resolveHit(playerB, playerA, playerB.activeHitbox, playerAInput,context);

  if (!hitA.hit || !hitB.hit) {
    return [hitA, hitB];
  }

  const priorityA = playerA.activeHitbox.priority;
  const priorityB = playerB.activeHitbox.priority;

  if (priorityA > priorityB) {
    return [NO_HIT, hitB];
  } else if (priorityB > priorityA) {
    return [hitA, NO_HIT];
  } else {
    return [hitA, hitB];
  }
}
