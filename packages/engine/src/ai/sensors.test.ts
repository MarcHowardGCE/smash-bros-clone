import { describe, it, expect } from 'vitest';
import type { PlayerState } from '@smash/shared';
import { MoveId, STAGE } from '@smash/shared';
import {
  distanceBetween,
  isOffStage,
  isThreatIncoming,
  isPunishWindow,
} from './sensors.js';
import { getMoveData } from '../moves/index.js';

/**
 * Helper to create a minimal PlayerState fixture
 */
function createPlayerFixture(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: 'test-player',
    slotIndex: 0,
    x: 640,
    y: 400,
    vx: 0,
    vy: 0,
    facing: 1,
    state: 'Idle',
    stateFrame: 0,
    hitlagFramesRemaining: 0,
    hitstunFramesRemaining: 0,
    isTumbling: false,
    techWindowFrames: 0,
    techLockoutFrames: 0,
    lCancelWindowFrames: 0,
    landingLagFrames: 0,
    percent: 0,
    stocks: 3,
    isGrounded: true,
    isKnockedOut: false,
    hasDoubleJump: true,
    hasAirDodge: true,
    wallJumpStreak: 0,
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
    hitPlayerIds: new Set(),
    chargeFrames: 0,
    respawnTimer: 0,
    airDodgeDirection: null,
    ...overrides,
  };
}

describe('distanceBetween', () => {
  it('should calculate distance between two players at same position', () => {
    const p1 = createPlayerFixture({ x: 100, y: 100 });
    const p2 = createPlayerFixture({ x: 100, y: 100 });
    expect(distanceBetween(p1, p2)).toBe(0);
  });

  it('should calculate distance with 3-4-5 triangle', () => {
    const p1 = createPlayerFixture({ x: 0, y: 0 });
    const p2 = createPlayerFixture({ x: 3, y: 4 });
    expect(distanceBetween(p1, p2)).toBe(5);
  });

  it('should calculate distance with negative coordinates', () => {
    const p1 = createPlayerFixture({ x: -10, y: -10 });
    const p2 = createPlayerFixture({ x: 10, y: 10 });
    expect(distanceBetween(p1, p2)).toBeCloseTo(Math.sqrt(800), 5);
  });

  it('should be symmetric', () => {
    const p1 = createPlayerFixture({ x: 100, y: 200 });
    const p2 = createPlayerFixture({ x: 300, y: 400 });
    expect(distanceBetween(p1, p2)).toBe(distanceBetween(p2, p1));
  });
});

describe('isOffStage', () => {
  it('should return false for player centered on main platform', () => {
    const player = createPlayerFixture({ x: 640, y: 400 });
    expect(isOffStage(player, STAGE)).toBe(false);
  });

  it('should return false for player at left edge of main platform', () => {
    const player = createPlayerFixture({ x: 190, y: 400 });
    expect(isOffStage(player, STAGE)).toBe(false);
  });

  it('should return false for player at right edge of main platform', () => {
    const player = createPlayerFixture({ x: 1090, y: 400 });
    expect(isOffStage(player, STAGE)).toBe(false);
  });

  it('should return true for player left of platform (x < 150)', () => {
    const player = createPlayerFixture({ x: 100, y: 400 });
    expect(isOffStage(player, STAGE)).toBe(true);
  });

  it('should return true for player right of platform (x > 1130)', () => {
    const player = createPlayerFixture({ x: 1150, y: 400 });
    expect(isOffStage(player, STAGE)).toBe(true);
  });

  it('should return true for player below platform (y > 560)', () => {
    const player = createPlayerFixture({ x: 640, y: 600 });
    expect(isOffStage(player, STAGE)).toBe(true);
  });

  it('should return true for player already past BLAST_LEFT (-300)', () => {
    const player = createPlayerFixture({ x: -350, y: 400 });
    expect(isOffStage(player, STAGE)).toBe(true);
  });

  it('should return true for player already past BLAST_RIGHT (1580)', () => {
    const player = createPlayerFixture({ x: 1600, y: 400 });
    expect(isOffStage(player, STAGE)).toBe(true);
  });

  it('should return false for player just inside left boundary (x = 150)', () => {
    const player = createPlayerFixture({ x: 150, y: 400 });
    expect(isOffStage(player, STAGE)).toBe(false);
  });

  it('should return false for player just inside right boundary (x = 1130)', () => {
    const player = createPlayerFixture({ x: 1130, y: 400 });
    expect(isOffStage(player, STAGE)).toBe(false);
  });

  it('should return false for player just above bottom boundary (y = 560)', () => {
    const player = createPlayerFixture({ x: 640, y: 560 });
    expect(isOffStage(player, STAGE)).toBe(false);
  });
});

describe('isThreatIncoming', () => {
  it('should return false when opponent has no active hitbox', () => {
    const self = createPlayerFixture({ x: 640, y: 400 });
    const opponent = createPlayerFixture({
      x: 700,
      y: 400,
      currentMoveId: MoveId.JAB,
      stateFrame: 5,
      activeHitbox: null,
    });
    expect(isThreatIncoming(self, opponent, 0)).toBe(false);
  });

  it('should return false when opponent has no current move', () => {
    const self = createPlayerFixture({ x: 640, y: 400 });
    const opponent = createPlayerFixture({
      x: 700,
      y: 400,
      currentMoveId: null,
      stateFrame: 5,
      activeHitbox: { offsetX: 0, offsetY: 0, radius: 20, damage: 3, baseKnockback: 2, knockbackGrowth: 30, knockbackAngle: 30, hitlagFrames: 3, priority: 1 },
    });
    expect(isThreatIncoming(self, opponent, 0)).toBe(false);
  });

  it('should return false when hitbox is not yet active (during startup)', () => {
    const self = createPlayerFixture({ x: 640, y: 400 });
    const jabData = getMoveData(MoveId.JAB);
    // JAB has 3 startup frames, so stateFrame=2 means hitbox not yet active
    const opponent = createPlayerFixture({
      x: 700,
      y: 400,
      currentMoveId: MoveId.JAB,
      stateFrame: 2,
      activeHitbox: { offsetX: 0, offsetY: 0, radius: 20, damage: 3, baseKnockback: 2, knockbackGrowth: 30, knockbackAngle: 30, hitlagFrames: 3, priority: 1 },
    });
    expect(isThreatIncoming(self, opponent, 0)).toBe(false);
  });

  it('should return true when hitbox is active and in range', () => {
    const self = createPlayerFixture({ x: 640, y: 400 });
    const jabData = getMoveData(MoveId.JAB);
    // JAB: startup=3, so at stateFrame=3, hitbox just became active
    const opponent = createPlayerFixture({
      x: 700,
      y: 400,
      currentMoveId: MoveId.JAB,
      stateFrame: 3,
      activeHitbox: { offsetX: 0, offsetY: 0, radius: 20, damage: 3, baseKnockback: 2, knockbackGrowth: 30, knockbackAngle: 30, hitlagFrames: 3, priority: 1 },
    });
    expect(isThreatIncoming(self, opponent, 0)).toBe(true);
  });

  it('should respect reactionDelayFrames threshold', () => {
    const self = createPlayerFixture({ x: 640, y: 400 });
    const jabData = getMoveData(MoveId.JAB);
    // JAB: startup=3, so framesSinceActive = 4 - 3 = 1
    const opponent = createPlayerFixture({
      x: 700,
      y: 400,
      currentMoveId: MoveId.JAB,
      stateFrame: 4,
      activeHitbox: { offsetX: 0, offsetY: 0, radius: 20, damage: 3, baseKnockback: 2, knockbackGrowth: 30, knockbackAngle: 30, hitlagFrames: 3, priority: 1 },
    });
    // reactionDelayFrames=0: should be true (1 >= 0)
    expect(isThreatIncoming(self, opponent, 0)).toBe(true);
    // reactionDelayFrames=1: should be true (1 >= 1)
    expect(isThreatIncoming(self, opponent, 1)).toBe(true);
    // reactionDelayFrames=2: should be false (1 >= 2 is false)
    expect(isThreatIncoming(self, opponent, 2)).toBe(false);
  });

  it('should return false when opponent is out of range', () => {
    const self = createPlayerFixture({ x: 640, y: 400 });
    const jabData = getMoveData(MoveId.JAB);
    // Distance > 150 (THREAT_RANGE)
    const opponent = createPlayerFixture({
      x: 800,
      y: 400,
      currentMoveId: MoveId.JAB,
      stateFrame: 3,
      activeHitbox: { offsetX: 0, offsetY: 0, radius: 20, damage: 3, baseKnockback: 2, knockbackGrowth: 30, knockbackAngle: 30, hitlagFrames: 3, priority: 1 },
    });
    expect(isThreatIncoming(self, opponent, 0)).toBe(false);
  });

  it('should return true when opponent is exactly at THREAT_RANGE', () => {
    const self = createPlayerFixture({ x: 640, y: 400 });
    const jabData = getMoveData(MoveId.JAB);
    // Distance = 150 (exactly THREAT_RANGE)
    const opponent = createPlayerFixture({
      x: 790,
      y: 400,
      currentMoveId: MoveId.JAB,
      stateFrame: 3,
      activeHitbox: { offsetX: 0, offsetY: 0, radius: 20, damage: 3, baseKnockback: 2, knockbackGrowth: 30, knockbackAngle: 30, hitlagFrames: 3, priority: 1 },
    });
    expect(isThreatIncoming(self, opponent, 0)).toBe(true);
  });

  it('should measure frames since hitbox became active, not move age', () => {
    const self = createPlayerFixture({ x: 640, y: 400 });
    const forwardTiltData = getMoveData(MoveId.FORWARD_TILT);
    // FORWARD_TILT: startup=7, so at stateFrame=10, framesSinceActive = 10 - 7 = 3
    const opponent = createPlayerFixture({
      x: 700,
      y: 400,
      currentMoveId: MoveId.FORWARD_TILT,
      stateFrame: 10,
      activeHitbox: { offsetX: 0, offsetY: 0, radius: 20, damage: 3, baseKnockback: 2, knockbackGrowth: 30, knockbackAngle: 30, hitlagFrames: 3, priority: 1 },
    });
    // reactionDelayFrames=3: should be true (3 >= 3)
    expect(isThreatIncoming(self, opponent, 3)).toBe(true);
    // reactionDelayFrames=4: should be false (3 >= 4 is false)
    expect(isThreatIncoming(self, opponent, 4)).toBe(false);
  });
});

describe('isPunishWindow', () => {
  it('should return false when opponent has no current move', () => {
    const opponent = createPlayerFixture({
      currentMoveId: null,
      stateFrame: 0,
    });
    expect(isPunishWindow(opponent)).toBe(false);
  });

  it('should return false during startup frames', () => {
    const jabData = getMoveData(MoveId.JAB);
    // JAB: startup=3, so stateFrame=0,1,2 are startup
    const opponent = createPlayerFixture({
      currentMoveId: MoveId.JAB,
      stateFrame: 1,
    });
    expect(isPunishWindow(opponent)).toBe(false);
  });

  it('should return false during active frames', () => {
    const jabData = getMoveData(MoveId.JAB);
    // JAB: startup=3, activeFrames=2, so stateFrame=3,4 are active
    const opponent = createPlayerFixture({
      currentMoveId: MoveId.JAB,
      stateFrame: 3,
    });
    expect(isPunishWindow(opponent)).toBe(false);
  });

  it('should return true during recovery frames', () => {
    const jabData = getMoveData(MoveId.JAB);
    // JAB: startup=3, activeFrames=2, recoveryFrames=10
    // Recovery window: [5, 15)
    const opponent = createPlayerFixture({
      currentMoveId: MoveId.JAB,
      stateFrame: 5,
    });
    expect(isPunishWindow(opponent)).toBe(true);
  });

  it('should return true in middle of recovery', () => {
    const jabData = getMoveData(MoveId.JAB);
    // JAB: startup=3, activeFrames=2, recoveryFrames=10
    // Recovery window: [5, 15)
    const opponent = createPlayerFixture({
      currentMoveId: MoveId.JAB,
      stateFrame: 10,
    });
    expect(isPunishWindow(opponent)).toBe(true);
  });

  it('should return true at last frame of recovery', () => {
    const jabData = getMoveData(MoveId.JAB);
    // JAB: startup=3, activeFrames=2, recoveryFrames=10
    // Recovery window: [5, 15), so frame 14 is last
    const opponent = createPlayerFixture({
      currentMoveId: MoveId.JAB,
      stateFrame: 14,
    });
    expect(isPunishWindow(opponent)).toBe(true);
  });

  it('should return false after recovery ends', () => {
    const jabData = getMoveData(MoveId.JAB);
    // JAB: startup=3, activeFrames=2, recoveryFrames=10
    // Recovery window: [5, 15), so frame 15 is outside
    const opponent = createPlayerFixture({
      currentMoveId: MoveId.JAB,
      stateFrame: 15,
    });
    expect(isPunishWindow(opponent)).toBe(false);
  });

  it('should work with longer moves like FORWARD_SMASH', () => {
    const forwardSmashData = getMoveData(MoveId.FORWARD_SMASH);
    // FORWARD_SMASH: startup=15, activeFrames=3, recoveryFrames=25
    // Recovery window: [18, 43)
    const opponent = createPlayerFixture({
      currentMoveId: MoveId.FORWARD_SMASH,
      stateFrame: 18,
    });
    expect(isPunishWindow(opponent)).toBe(true);

    const opponentAfterRecovery = createPlayerFixture({
      currentMoveId: MoveId.FORWARD_SMASH,
      stateFrame: 43,
    });
    expect(isPunishWindow(opponentAfterRecovery)).toBe(false);
  });

  it('should return false at exact recovery start boundary (off by one check)', () => {
    const jabData = getMoveData(MoveId.JAB);
    // JAB: startup=3, activeFrames=2, so recovery starts at frame 5
    // But we want to verify the boundary is inclusive
    const opponent = createPlayerFixture({
      currentMoveId: MoveId.JAB,
      stateFrame: 4,
    });
    expect(isPunishWindow(opponent)).toBe(false);
  });
});
