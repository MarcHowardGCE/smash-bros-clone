/**
 * @fileoverview Hitbox collision and knockback resolution for the deterministic game engine.
 *
 * All functions are pure transformations — no mutation, no I/O. Collision is
 * modelled as circle overlap between a hitbox circle (positioned relative to the
 * attacker's facing direction) and the defender's hurtbox circle.
 *
 * Key design decisions:
 * - **Knockback formula**: derived from Super Smash Bros. — magnitude scales with
 *   the defender's current damage percent, so early hits do little knockback but
 *   the same move at high percent can KO.
 * - **Stale-move negation**: repeated use of the same move reduces damage by up to
 *   40% (5% per entry in the stale queue, floor at 0.6×).
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

const MIN_HITSTUN_FRAMES = 4;
const HITSTUN_KNOCKBACK_SCALE = 0.4;
const HITSTUN_HIGH_KB_OFFSET = 3;

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
 * @param percent - Defender's current damage percentage.
 * @param damage - Damage dealt by this hit (after stale-move negation).
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
export function getActiveHitboxWorldPos(player: PlayerState, hitbox: HitboxData): Circle {
  return {
    x: player.x + hitbox.offsetX * player.facing,
    y: player.y + hitbox.offsetY,
    radius: hitbox.radius,
  };
}

/**
 * Returns the world-space hurtbox circle for a player.
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
 * - **Stale-move negation**: damage is reduced by 5% per repeat of the same move
 *   in the stale queue (minimum 0.6× multiplier, maximum 1.05× on first use).
 * - **Knockback**: computed with `calculateKnockback` using the defender's current
 *   percent — higher percent means more launch distance.
 * - **Crouch cancel**: if the defender is grounded and holding DOWN, knockback is
 *   reduced by 15% (`× 0.85`).
 * - **Rage**: attacker at high percent deals slightly more knockback (up to ~10%
 *   bonus at 150% damage).
 * - **Hitstun**: `floor(knockbackMagnitude × 0.4) - 3`, floored at
 *   `MIN_HITSTUN_FRAMES (4)`. The `−3` offset fixes Bug #5 where high-knockback
 *   moves over-locked defenders by ~3 frames.
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
): HitResult {
  const hitboxCircle = getActiveHitboxWorldPos(attacker, hitbox);
  const hurtboxCircle = getHurtbox(defender);

  if (!circleOverlap(hitboxCircle, hurtboxCircle)) {
    return NO_HIT;
  }

	const staleMoveQueue = attacker.staleMoveQueue ?? [];
	const staleCount = attacker.currentMoveId
		? staleMoveQueue.filter((moveId) => moveId === attacker.currentMoveId).length
		: 0;
	const staleMultiplier = Math.max(0.6, 1.05 - staleCount * 0.05);
	const scaledDamage = hitbox.damage * staleMultiplier;

	// Knockback scales with defender's current percent — the higher the damage already
	// taken, the more the next hit launches them. This is the core Smash Bros feel:
	// early hits do little knockback, but the same move at high percent can KO.
	const baseKnockbackMagnitude = calculateKnockback(
		defender.percent,
		scaledDamage,
		hitbox.baseKnockback,
		hitbox.knockbackGrowth,
		getCharacterStats(defender.characterId).fighterWeight
	);
		const crouchAdjustedKnockbackMagnitude =
			defender.isGrounded && isDownHeld(defenderInput)
				? baseKnockbackMagnitude * 0.85
				: baseKnockbackMagnitude;
		const rageMult = Math.max(
			1.0,
			1 + (Math.min(attacker.percent, 150) - 35) * (0.1 / 115),
		);
		const knockbackMagnitude = crouchAdjustedKnockbackMagnitude * rageMult;

  const { x: vx, y: vy } = knockbackAngleToVelocity(
    knockbackMagnitude,
    hitbox.knockbackAngle,
    attacker.facing
  );

	return {
		hit: true,
		damage: Math.floor(scaledDamage),
		knockbackVx: vx,
		knockbackVy: vy,
		hitlagFrames: hitbox.hitlagFrames,
	    // Smash-style hitstun uses knockback scaling with a small high-KB offset.
	    // Without subtracting this offset, high knockback moves over-lock defenders
	    // by ~3 frames (Bug #5: fsmash@120% was 82 instead of 79).
	    hitstunFrames: Math.max(
	      MIN_HITSTUN_FRAMES,
	      Math.floor(knockbackMagnitude * HITSTUN_KNOCKBACK_SCALE) - HITSTUN_HIGH_KB_OFFSET,
	    ),
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
): HitResult {
	if (!attacker.activeHitbox) return NO_HIT;
	return resolveHit(attacker, defender, attacker.activeHitbox, defenderInput);
}

// When both fighters have active hitboxes simultaneously, we resolve priority rather
// than always applying both hits. Higher-priority hitbox wins; the other player's
// hit is cancelled. Equal priority = both hits land (a true trade). This mirrors
// Smash Bros priority rules and prevents both players from always trading on
// simultaneous attacks.
/**
 * Resolves simultaneous hitbox clashes between two fighters by priority.
 *
 * When both players have an `activeHitbox` this frame, naively applying both hits
 * would mean every simultaneous attack always trades. Instead, priority rules decide:
 * - **Higher priority wins**: the lower-priority hit is cancelled (`NO_HIT`), only
 *   the higher-priority hit lands.
 * - **Equal priority**: both hits land — a true trade, matching Smash Bros behaviour.
 * - **One or both hitboxes absent**: returns `[NO_HIT, NO_HIT]` immediately.
 *
 * Result tuple order mirrors the input: `[hitOnPlayerB, hitOnPlayerA]` — i.e.
 * `result[0]` is the effect applied to `playerB` (playerA's hit landing on B),
 * and `result[1]` is the effect applied to `playerA`.
 *
 * @param playerA - First fighter state.
 * @param playerB - Second fighter state.
 * @param playerAInput - playerA's input this frame (used for crouch-cancel on playerA). Pass `null` if unavailable.
 * @param playerBInput - playerB's input this frame (used for crouch-cancel on playerB). Pass `null` if unavailable.
 * @returns A tuple `[HitResult for playerB, HitResult for playerA]` after priority resolution.
 */
export function resolveHitTrade(
	playerA: PlayerState,
	playerB: PlayerState,
	playerAInput: InputEvent | null = null,
	playerBInput: InputEvent | null = null,
): [HitResult, HitResult] {
  if (!playerA.activeHitbox || !playerB.activeHitbox) {
    return [NO_HIT, NO_HIT];
  }

	const hitA = resolveHit(playerA, playerB, playerA.activeHitbox, playerBInput);
	const hitB = resolveHit(playerB, playerA, playerB.activeHitbox, playerAInput);

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
