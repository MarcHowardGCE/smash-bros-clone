import { circleOverlap, knockbackAngleToVelocity, PHYSICS } from '@smash/shared';
import type { PlayerState, HitboxData, Circle } from '@smash/shared';

export interface HitResult {
  hit: boolean;
  damage: number;
  knockbackVx: number;
  knockbackVy: number;
  hitlagFrames: number;
  hitstunFrames: number;
}

export const NO_HIT: HitResult = {
  hit: false,
  damage: 0,
  knockbackVx: 0,
  knockbackVy: 0,
  hitlagFrames: 0,
  hitstunFrames: 0,
};

// Smash Bros knockback formula: ((p/10 + (p*d)/20) * (200/(w+100)) * 1.4 + 18) * (kbg/100) + bkb
export function calculateKnockback(
  percent: number,
  baseKnockback: number,
  knockbackGrowth: number,
  weight: number
): number {
  const p = percent;
  const d = baseKnockback;
  const w = weight;
  const kbg = knockbackGrowth;
  const bkb = baseKnockback;
  return ((p / 10 + (p * d) / 20) * (200 / (w + 100)) * 1.4 + 18) * (kbg / 100) + bkb;
}

export function getActiveHitboxWorldPos(player: PlayerState, hitbox: HitboxData): Circle {
  return {
    x: player.x + hitbox.offsetX * player.facing,
    y: player.y + hitbox.offsetY,
    radius: hitbox.radius,
  };
}

export function getHurtbox(player: PlayerState): Circle {
  return {
    x: player.x,
    y: player.y,
    radius: PHYSICS.HURTBOX_RADIUS,
  };
}

export function resolveHit(
  attacker: PlayerState,
  defender: PlayerState,
  hitbox: HitboxData
): HitResult {
  const hitboxCircle = getActiveHitboxWorldPos(attacker, hitbox);
  const hurtboxCircle = getHurtbox(defender);

  if (!circleOverlap(hitboxCircle, hurtboxCircle)) {
    return NO_HIT;
  }

  const knockbackMagnitude = calculateKnockback(
    defender.percent,
    hitbox.baseKnockback,
    hitbox.knockbackGrowth,
    PHYSICS.FIGHTER_WEIGHT
  );

  const { x: vx, y: vy } = knockbackAngleToVelocity(
    knockbackMagnitude,
    hitbox.knockbackAngle,
    attacker.facing
  );

  return {
    hit: true,
    damage: hitbox.damage,
    knockbackVx: vx,
    knockbackVy: vy,
    hitlagFrames: hitbox.hitlagFrames,
    hitstunFrames: hitbox.hitstunFrames,
  };
}

export function checkHitboxCollision(
  attacker: PlayerState,
  defender: PlayerState
): HitResult {
  if (!attacker.activeHitbox) return NO_HIT;
  return resolveHit(attacker, defender, attacker.activeHitbox);
}

export function resolveHitTrade(
  playerA: PlayerState,
  playerB: PlayerState
): [HitResult, HitResult] {
  if (!playerA.activeHitbox || !playerB.activeHitbox) {
    return [NO_HIT, NO_HIT];
  }

  const hitA = resolveHit(playerA, playerB, playerA.activeHitbox);
  const hitB = resolveHit(playerB, playerA, playerB.activeHitbox);

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
