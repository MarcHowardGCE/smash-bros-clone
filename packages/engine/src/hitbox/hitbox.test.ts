import { describe, it, expect } from 'vitest';
import { PHYSICS, circleOverlap } from '@smash/shared';
import {
  calculateKnockback,
  resolveHit,
  getActiveHitboxWorldPos,
  getHurtbox,
  checkHitboxCollision,
  resolveHitTrade,
  NO_HIT,
} from './index.js';
import type { PlayerState, HitboxData } from '@smash/shared';

function makePlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: 'p1',
    slotIndex: 0,
    x: 640,
    y: 480,
    vx: 0,
    vy: 0,
    facing: 1,
    state: 'IDLE',
    stateFrame: 0,
    hitlagFramesRemaining: 0,
    hitstunFramesRemaining: 0,
    percent: 0,
    stocks: 3,
    isGrounded: true,
    isKnockedOut: false,
    hasDoubleJump: true,
    isFastFalling: false,
    isInvincible: false,
    invincibilityFrames: 0,
    isShielding: false,
    shieldHealth: 100,
    isGrabbing: false,
    grabbedPlayerId: null,
    activeHitbox: null,
    currentMoveId: null,
    respawnTimer: 0,
    ...overrides,
  };
}

function makeHitbox(overrides: Partial<HitboxData> = {}): HitboxData {
  return {
    offsetX: 40,
    offsetY: 0,
    radius: 20,
    damage: 8,
    baseKnockback: 5,
    knockbackGrowth: 50,
    knockbackAngle: 45,
    hitlagFrames: 5,
    hitstunFrames: 15,
    priority: 1,
    ...overrides,
  };
}

describe('circleOverlap (from shared)', () => {
  it('overlapping circles returns true', () => {
    expect(circleOverlap({ x: 0, y: 0, radius: 10 }, { x: 5, y: 0, radius: 10 })).toBe(true);
  });

  it('non-overlapping circles returns false', () => {
    expect(circleOverlap({ x: 0, y: 0, radius: 10 }, { x: 25, y: 0, radius: 10 })).toBe(false);
  });

  it('touching circles (distance == sum of radii) returns false', () => {
    expect(circleOverlap({ x: 0, y: 0, radius: 10 }, { x: 20, y: 0, radius: 10 })).toBe(false);
  });
});

describe('calculateKnockback', () => {
  it('knockback at 0% returns a positive value', () => {
    const kb0 = calculateKnockback(0, 5, 50, PHYSICS.FIGHTER_WEIGHT);
    expect(kb0).toBeGreaterThan(0);
  });

  it('knockback at 150% is strictly greater than at 0%', () => {
    const kb0 = calculateKnockback(0, 5, 50, PHYSICS.FIGHTER_WEIGHT);
    const kb150 = calculateKnockback(150, 5, 50, PHYSICS.FIGHTER_WEIGHT);
    expect(kb150).toBeGreaterThan(kb0);
  });

  it('knockback scales monotonically with percent', () => {
    const kb50 = calculateKnockback(50, 5, 50, PHYSICS.FIGHTER_WEIGHT);
    const kb100 = calculateKnockback(100, 5, 50, PHYSICS.FIGHTER_WEIGHT);
    const kb150 = calculateKnockback(150, 5, 50, PHYSICS.FIGHTER_WEIGHT);
    expect(kb100).toBeGreaterThan(kb50);
    expect(kb150).toBeGreaterThan(kb100);
  });

  it('heavier fighter takes less knockback than lighter fighter', () => {
    const kbLight = calculateKnockback(100, 5, 50, 80);
    const kbHeavy = calculateKnockback(100, 5, 50, 120);
    expect(kbLight).toBeGreaterThan(kbHeavy);
  });
});

describe('getActiveHitboxWorldPos', () => {
  it('facing right: hitbox offset adds to x', () => {
    const player = makePlayer({ x: 100, y: 200, facing: 1 });
    const hitbox = makeHitbox({ offsetX: 40, offsetY: 10, radius: 20 });
    const circle = getActiveHitboxWorldPos(player, hitbox);
    expect(circle.x).toBe(140);
    expect(circle.y).toBe(210);
    expect(circle.radius).toBe(20);
  });

  it('facing left: hitbox offset subtracts from x', () => {
    const player = makePlayer({ x: 100, y: 200, facing: -1 });
    const hitbox = makeHitbox({ offsetX: 40, offsetY: 0, radius: 20 });
    const circle = getActiveHitboxWorldPos(player, hitbox);
    expect(circle.x).toBe(60);
  });
});

describe('getHurtbox', () => {
  it('centers on player position with HURTBOX_RADIUS', () => {
    const player = makePlayer({ x: 300, y: 400 });
    const hurtbox = getHurtbox(player);
    expect(hurtbox.x).toBe(300);
    expect(hurtbox.y).toBe(400);
    expect(hurtbox.radius).toBe(PHYSICS.HURTBOX_RADIUS);
  });
});

describe('resolveHit', () => {
  it('non-overlapping hitbox/hurtbox returns hit: false', () => {
    const attacker = makePlayer({ x: 0, y: 0, facing: 1 });
    const defender = makePlayer({ x: 500, y: 0 });
    const hitbox = makeHitbox({ offsetX: 40, radius: 20 });
    const result = resolveHit(attacker, defender, hitbox);
    expect(result.hit).toBe(false);
  });

  it('overlapping hitbox/hurtbox returns hit: true with correct damage', () => {
    const attacker = makePlayer({ x: 0, y: 0, facing: 1 });
    const defender = makePlayer({ x: 50, y: 0 });
    const hitbox = makeHitbox({ offsetX: 40, radius: 20, damage: 8 });
    const result = resolveHit(attacker, defender, hitbox);
    expect(result.hit).toBe(true);
    expect(result.damage).toBe(8);
  });

  it('returns hitlag and hitstun frames from hitbox', () => {
    const attacker = makePlayer({ x: 0, y: 0, facing: 1 });
    const defender = makePlayer({ x: 50, y: 0 });
    const hitbox = makeHitbox({ offsetX: 40, radius: 20, hitlagFrames: 7, hitstunFrames: 20 });
    const result = resolveHit(attacker, defender, hitbox);
    expect(result.hit).toBe(true);
    expect(result.hitlagFrames).toBe(7);
    expect(result.hitstunFrames).toBe(20);
  });

  it('facing right with 0° angle: positive knockbackVx', () => {
    const attacker = makePlayer({ x: 0, y: 0, facing: 1 });
    const defender = makePlayer({ x: 50, y: 0 });
    const hitbox = makeHitbox({ offsetX: 40, radius: 30, knockbackAngle: 0 });
    const result = resolveHit(attacker, defender, hitbox);
    expect(result.hit).toBe(true);
    expect(result.knockbackVx).toBeGreaterThan(0);
  });

  it('facing left with 0° angle: negative knockbackVx', () => {
    const attacker = makePlayer({ x: 0, y: 0, facing: -1 });
    const defender = makePlayer({ x: -50, y: 0 });
    const hitbox = makeHitbox({ offsetX: 40, radius: 30, knockbackAngle: 0 });
    const result = resolveHit(attacker, defender, hitbox);
    expect(result.hit).toBe(true);
    expect(result.knockbackVx).toBeLessThan(0);
  });

  it('90° knockback angle: vy is dominant and negative (upward)', () => {
    const attacker = makePlayer({ x: 0, y: 0, facing: 1 });
    const defender = makePlayer({ x: 50, y: 0 });
    const hitbox = makeHitbox({
      offsetX: 40,
      radius: 30,
      knockbackAngle: 90,
      baseKnockback: 20,
      knockbackGrowth: 100,
    });
    const result = resolveHit(attacker, defender, hitbox);
    expect(result.hit).toBe(true);
    expect(result.knockbackVy).toBeLessThan(0);
    expect(Math.abs(result.knockbackVy)).toBeGreaterThan(Math.abs(result.knockbackVx));
  });

  it('higher percent defender receives more knockback magnitude', () => {
    const attacker = makePlayer({ x: 0, y: 0, facing: 1 });
    const defenderLow = makePlayer({ x: 50, y: 0, percent: 0 });
    const defenderHigh = makePlayer({ x: 50, y: 0, percent: 150 });
    const hitbox = makeHitbox({ offsetX: 40, radius: 30, knockbackAngle: 45 });

    const resultLow = resolveHit(attacker, defenderLow, hitbox);
    const resultHigh = resolveHit(attacker, defenderHigh, hitbox);

    const magLow = Math.sqrt(resultLow.knockbackVx ** 2 + resultLow.knockbackVy ** 2);
    const magHigh = Math.sqrt(resultHigh.knockbackVx ** 2 + resultHigh.knockbackVy ** 2);
    expect(magHigh).toBeGreaterThan(magLow);
  });

  it('returns NO_HIT when circles do not overlap', () => {
    const attacker = makePlayer({ x: 0, y: 0, facing: 1 });
    const defender = makePlayer({ x: 1000, y: 1000 });
    const hitbox = makeHitbox({ offsetX: 40, radius: 20 });
    const result = resolveHit(attacker, defender, hitbox);
    expect(result).toEqual(NO_HIT);
  });
});

describe('checkHitboxCollision', () => {
  it('returns NO_HIT when attacker has no activeHitbox', () => {
    const attacker = makePlayer({ x: 0, y: 0, activeHitbox: null });
    const defender = makePlayer({ x: 10, y: 0 });
    expect(checkHitboxCollision(attacker, defender)).toEqual(NO_HIT);
  });

  it('returns hit result when attacker has activeHitbox that overlaps', () => {
    const hitbox = makeHitbox({ offsetX: 40, radius: 30 });
    const attacker = makePlayer({ x: 0, y: 0, facing: 1, activeHitbox: hitbox });
    const defender = makePlayer({ x: 50, y: 0 });
    const result = checkHitboxCollision(attacker, defender);
    expect(result.hit).toBe(true);
  });
});

describe('resolveHitTrade', () => {
  it('returns [NO_HIT, NO_HIT] when playerA has no activeHitbox', () => {
    const playerA = makePlayer({ activeHitbox: null });
    const playerB = makePlayer({ activeHitbox: makeHitbox() });
    const [a, b] = resolveHitTrade(playerA, playerB);
    expect(a).toEqual(NO_HIT);
    expect(b).toEqual(NO_HIT);
  });

  it('returns [NO_HIT, NO_HIT] when playerB has no activeHitbox', () => {
    const playerA = makePlayer({ activeHitbox: makeHitbox() });
    const playerB = makePlayer({ activeHitbox: null });
    const [a, b] = resolveHitTrade(playerA, playerB);
    expect(a).toEqual(NO_HIT);
    expect(b).toEqual(NO_HIT);
  });

  it('higher priority hitbox wins: opponent takes damage, winner does not', () => {
    const playerA = makePlayer({
      x: 0,
      y: 0,
      facing: 1,
      percent: 50,
      activeHitbox: makeHitbox({ offsetX: 40, radius: 30, priority: 2 }),
    });
    const playerB = makePlayer({
      x: 60,
      y: 0,
      facing: -1,
      percent: 30,
      activeHitbox: makeHitbox({ offsetX: 40, radius: 30, priority: 1 }),
    });

    const [resultA, resultB] = resolveHitTrade(playerA, playerB);
    expect(resultB.hit).toBe(true);
    expect(resultA.hit).toBe(false);
  });

  it('lower priority hitbox loses: winner does not take damage', () => {
    const playerA = makePlayer({
      x: 0,
      y: 0,
      facing: 1,
      percent: 50,
      activeHitbox: makeHitbox({ offsetX: 40, radius: 30, priority: 1 }),
    });
    const playerB = makePlayer({
      x: 60,
      y: 0,
      facing: -1,
      percent: 30,
      activeHitbox: makeHitbox({ offsetX: 40, radius: 30, priority: 2 }),
    });

    const [resultA, resultB] = resolveHitTrade(playerA, playerB);
    expect(resultA.hit).toBe(true);
    expect(resultB.hit).toBe(false);
  });

  it('equal priority: both players take damage (true trade)', () => {
    const playerA = makePlayer({
      x: 0,
      y: 0,
      facing: 1,
      percent: 50,
      activeHitbox: makeHitbox({ offsetX: 40, radius: 30, priority: 1 }),
    });
    const playerB = makePlayer({
      x: 60,
      y: 0,
      facing: -1,
      percent: 30,
      activeHitbox: makeHitbox({ offsetX: 40, radius: 30, priority: 1 }),
    });

    const [resultA, resultB] = resolveHitTrade(playerA, playerB);
    expect(resultA.hit).toBe(true);
    expect(resultB.hit).toBe(true);
  });
});
