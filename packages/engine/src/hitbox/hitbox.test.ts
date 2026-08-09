import { describe, it, expect } from 'vitest';
import { PHYSICS, circleOverlap, getCharacterStats } from '@smash/shared';
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
    isTumbling: false,
    techWindowFrames: 0,
    techLockoutFrames: 0,
    landingLagFrames: 0,
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
    shieldStunFrames: 0,
    isGrabbing: false,
    grabbedPlayerId: null,
    ledgeId: null,
    activeHitbox: null,
    currentMoveId: null,
    staleMoveQueue: [],
    currentMove: undefined,
    hitPlayerIds: new Set<string>(),
    chargeFrames: 0,
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

const hitstunFromKnockback = (knockback: number): number => Math.max(4, Math.floor(knockback * 0.4) - 3);

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
    const kb0 = calculateKnockback(0, 8, 5, 50, PHYSICS.FIGHTER_WEIGHT);
    expect(kb0).toBeGreaterThan(0);
  });

  it('knockback at 150% is strictly greater than at 0%', () => {
    const kb0 = calculateKnockback(0, 8, 5, 50, PHYSICS.FIGHTER_WEIGHT);
    const kb150 = calculateKnockback(150, 8, 5, 50, PHYSICS.FIGHTER_WEIGHT);
    expect(kb150).toBeGreaterThan(kb0);
  });

  it('knockback scales monotonically with percent', () => {
    const kb50 = calculateKnockback(50, 8, 5, 50, PHYSICS.FIGHTER_WEIGHT);
    const kb100 = calculateKnockback(100, 8, 5, 50, PHYSICS.FIGHTER_WEIGHT);
    const kb150 = calculateKnockback(150, 8, 5, 50, PHYSICS.FIGHTER_WEIGHT);
    expect(kb100).toBeGreaterThan(kb50);
    expect(kb150).toBeGreaterThan(kb100);
  });

  it('heavier fighter takes less knockback than lighter fighter', () => {
    const kbLight = calculateKnockback(100, 8, 5, 50, 80);
    const kbHeavy = calculateKnockback(100, 8, 5, 50, 120);
    expect(kbLight).toBeGreaterThan(kbHeavy);
  });

  it('malformed damage values still produce finite outputs', () => {
    const kbZeroDamage = calculateKnockback(100, 0, 30, 100, PHYSICS.FIGHTER_WEIGHT);
    const kbHugeDamage = calculateKnockback(100, 999, 30, 100, PHYSICS.FIGHTER_WEIGHT);
    const kbNegativeDamage = calculateKnockback(100, -10, 30, 100, PHYSICS.FIGHTER_WEIGHT);

    expect(Number.isFinite(kbZeroDamage)).toBe(true);
    expect(Number.isFinite(kbHugeDamage)).toBe(true);
    expect(Number.isFinite(kbNegativeDamage)).toBe(true);
    expect(kbHugeDamage).toBeGreaterThan(kbZeroDamage);
    expect(kbNegativeDamage).toBeLessThan(kbZeroDamage);
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
  it('BUG CHARACTERIZATION (legacy formula): d=baseKnockback makes 3% and 18% moves identical at 100%', () => {
    const legacyBugFormula = (percent: number, damage: number, baseKnockback: number): number => {
      const p = percent;
      const d = baseKnockback;
      const w = PHYSICS.FIGHTER_WEIGHT;
      const kbg = 100;
      const bkb = baseKnockback;
      return ((p / 10 + (p * d) / 20) * (200 / (w + 100)) * 1.4 + 18) * (kbg / 100) + bkb;
    };

    const jabKb = legacyBugFormula(100, 3, 30);
    const fsmashKb = legacyBugFormula(100, 18, 30);

    console.info(`[baseline-bug] KB_jab=${jabKb.toFixed(4)} KB_fsmash=${fsmashKb.toFixed(4)}`);

    expect(Math.abs(fsmashKb - jabKb)).toBeLessThan(0.000001);
  });

  it('REGRESSION TARGET: at 100%, fsmash(18%) should launch substantially harder than jab(3%)', () => {
    const attacker = makePlayer({ x: 0, y: 0, facing: 1 });
    const defender = makePlayer({ x: 50, y: 0, percent: 100 });

    const jabHitbox = makeHitbox({
      offsetX: 40,
      radius: 30,
      damage: 3,
      baseKnockback: 30,
      knockbackGrowth: 100,
      knockbackAngle: 45,
    });

    const fsmashHitbox = makeHitbox({
      offsetX: 40,
      radius: 30,
      damage: 18,
      baseKnockback: 30,
      knockbackGrowth: 100,
      knockbackAngle: 45,
    });

    const jabResult = resolveHit(attacker, defender, jabHitbox);
    const fsmashResult = resolveHit(attacker, defender, fsmashHitbox);

    const jabKb = Math.hypot(jabResult.knockbackVx, jabResult.knockbackVy);
    const fsmashKb = Math.hypot(fsmashResult.knockbackVx, fsmashResult.knockbackVy);

    console.info(`[regression-target] KB_jab=${jabKb.toFixed(4)} KB_fsmash=${fsmashKb.toFixed(4)}`);

    expect(fsmashKb).toBeGreaterThan(jabKb * 2);
  });

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

  it('returns hitlag from hitbox', () => {
    const attacker = makePlayer({ x: 0, y: 0, facing: 1 });
    const defender = makePlayer({ x: 50, y: 0 });
    const hitbox = makeHitbox({ offsetX: 40, radius: 20, hitlagFrames: 7 });
    const result = resolveHit(attacker, defender, hitbox);
    expect(result.hit).toBe(true);
    expect(result.hitlagFrames).toBe(7);
  });

  it.skip('baseline characterization (pre-change): static hitstun ignored knockback magnitude differences', () => {
    const attacker = makePlayer({ x: 0, y: 0, facing: 1 });
    const jabTarget = makePlayer({ x: 50, y: 0, percent: 0 });
    const smashTarget = makePlayer({ x: 50, y: 0, percent: 120 });

    const sharedStaticHitstun = 15;
    const jabHitbox = makeHitbox({
      offsetX: 40,
      radius: 30,
      damage: 3,
      baseKnockback: 2,
      knockbackGrowth: 30,
      hitstunFrames: sharedStaticHitstun,
    });
    const smashHitbox = makeHitbox({
      offsetX: 40,
      radius: 30,
      damage: 18,
      baseKnockback: 12,
      knockbackGrowth: 100,
      hitstunFrames: sharedStaticHitstun,
    });

    const jabResult = resolveHit(attacker, jabTarget, jabHitbox);
    const smashResult = resolveHit(attacker, smashTarget, smashHitbox);

    const jabKnockbackMagnitude = Math.hypot(jabResult.knockbackVx, jabResult.knockbackVy);
    const smashKnockbackMagnitude = Math.hypot(smashResult.knockbackVx, smashResult.knockbackVy);

    expect(smashKnockbackMagnitude).toBeGreaterThan(jabKnockbackMagnitude);
    expect(jabResult.hitstunFrames).toBe(sharedStaticHitstun);
    expect(smashResult.hitstunFrames).toBe(sharedStaticHitstun);
  });

  it('hitstun scales with knockback (jab 0% low, fsmash 120% high)', () => {
    const attacker = makePlayer({ x: 0, y: 0, facing: 1 });
    const jabTarget = makePlayer({ x: 50, y: 0, percent: 0 });
    const smashTarget = makePlayer({ x: 50, y: 0, percent: 120 });

    const jabHitbox = makeHitbox({
      offsetX: 40,
      radius: 30,
      damage: 3,
      baseKnockback: 2,
      knockbackGrowth: 30,
    });
    const smashHitbox = makeHitbox({
      offsetX: 40,
      radius: 30,
      damage: 18,
      baseKnockback: 12,
      knockbackGrowth: 100,
    });

    const jabResult = resolveHit(attacker, jabTarget, jabHitbox);
    const smashResult = resolveHit(attacker, smashTarget, smashHitbox);

    // Account for stale move multiplier (1.05 since currentMoveId is null)
    const staleMultiplier = 1.05;
    const scaledJabDamage = jabHitbox.damage * staleMultiplier;
    const scaledSmashDamage = smashHitbox.damage * staleMultiplier;

    const jabExpected = hitstunFromKnockback(
      calculateKnockback(
        jabTarget.percent,
        scaledJabDamage,
        jabHitbox.baseKnockback,
        jabHitbox.knockbackGrowth,
        PHYSICS.FIGHTER_WEIGHT,
      ),
    );
    const smashExpected = hitstunFromKnockback(
      calculateKnockback(
        smashTarget.percent,
        scaledSmashDamage,
        smashHitbox.baseKnockback,
        smashHitbox.knockbackGrowth,
        PHYSICS.FIGHTER_WEIGHT,
      ),
    );

    console.info(
      `[hitstun-scaling] jab0=${jabResult.hitstunFrames} expected=${jabExpected} fsmash120=${smashResult.hitstunFrames} expected=${smashExpected}`,
    );

    expect(jabResult.hitstunFrames, `jab hitstun=${jabResult.hitstunFrames}, expected=${jabExpected}`).toBe(jabExpected);
    expect(smashResult.hitstunFrames, `fsmash hitstun=${smashResult.hitstunFrames}, expected=${smashExpected}`).toBe(smashExpected);
    expect(smashResult.hitstunFrames).toBe(79);
    expect(jabResult.hitstunFrames).toBeGreaterThanOrEqual(4);
    expect(jabResult.hitstunFrames).toBeLessThanOrEqual(8);
    expect(smashResult.hitstunFrames).toBeGreaterThanOrEqual(30);
  });

  it('hitstun has a minimum floor of 4 frames even at zero knockback', () => {
    const attacker = makePlayer({ x: 0, y: 0, facing: 1 });
    const defender = makePlayer({ x: 50, y: 0, percent: 999 });
    const hitbox = makeHitbox({
      offsetX: 40,
      radius: 30,
      damage: 0,
      baseKnockback: 0,
      knockbackGrowth: 0,
    });

    const result = resolveHit(attacker, defender, hitbox);
    const expected = hitstunFromKnockback(
      calculateKnockback(
        defender.percent,
        hitbox.damage,
        hitbox.baseKnockback,
        hitbox.knockbackGrowth,
        PHYSICS.FIGHTER_WEIGHT,
      ),
    );

    console.info(`[hitstun-floor] percent=${defender.percent} hitstun=${result.hitstunFrames} expected=${expected}`);

    expect(result.hitstunFrames, `min-floor case hitstun=${result.hitstunFrames}, expected=${expected}`).toBe(expected);
    expect(result.hitstunFrames).toBe(4);
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

  it('character weight affects knockback: Lincoln (118) takes less knockback than default (100) for identical hit', () => {
    const attacker = makePlayer({ x: 0, y: 0, facing: 1 });
    const defenderDefault = makePlayer({ x: 50, y: 0, percent: 100, characterId: 'all-rounder' });
    const defenderLincoln = makePlayer({ x: 50, y: 0, percent: 100, characterId: 'abe-lincoln' });
    const hitbox = makeHitbox({ offsetX: 40, radius: 30, damage: 10, baseKnockback: 5, knockbackGrowth: 50 });

    const resultDefault = resolveHit(attacker, defenderDefault, hitbox);
    const resultLincoln = resolveHit(attacker, defenderLincoln, hitbox);

    const kbDefault = Math.hypot(resultDefault.knockbackVx, resultDefault.knockbackVy);
    const kbLincoln = Math.hypot(resultLincoln.knockbackVx, resultLincoln.knockbackVy);

    // Verify weights are different
    const defaultWeight = getCharacterStats('all-rounder').fighterWeight;
    const lincolnWeight = getCharacterStats('abe-lincoln').fighterWeight;
    expect(lincolnWeight).toBeGreaterThan(defaultWeight);
    expect(lincolnWeight).toBe(118);
    expect(defaultWeight).toBe(100);

    // Heavier fighter (Lincoln) should take less knockback
    expect(kbLincoln).toBeLessThan(kbDefault);
    console.info(`[character-weight] KB_default=${kbDefault.toFixed(4)} KB_lincoln=${kbLincoln.toFixed(4)} ratio=${(kbLincoln/kbDefault).toFixed(4)}`);
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
