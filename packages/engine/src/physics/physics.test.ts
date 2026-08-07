import { describe, expect, it } from 'vitest';
import { INPUT_BITS, PHYSICS, STAGE, type InputEvent, type PlayerState } from '@smash/shared';
import { applyFastFall, applyGravity, applyKnockbackDecay, applyMovement, applyMovementInput, checkLedgeGrab, checkPlatformCollision, startJump } from './index.js';

function makePlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: 'p1',
    slotIndex: 0,
    x: 640,
    y: 450,
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
    currentMove: undefined,
    hitPlayerIds: new Set<string>(),
    chargeFrames: 0,
    respawnTimer: 0,
    ...overrides,
  };
}

function makeInput(overrides: Partial<InputEvent> = {}): InputEvent {
  return {
    tick: 1,
    seq: 1,
    playerId: 'p1',
    held: 0,
    pressed: 0,
    released: 0,
    ...overrides,
  };
}

function makeStage() {
  return {
    width: STAGE.WIDTH,
    height: STAGE.HEIGHT,
    blastTop: STAGE.BLAST_TOP,
    blastBottom: STAGE.BLAST_BOTTOM,
    blastLeft: STAGE.BLAST_LEFT,
    blastRight: STAGE.BLAST_RIGHT,
    mainPlatform: { ...STAGE.MAIN_PLATFORM, id: 'main' },
    platforms: STAGE.PLATFORMS.map((platform) => ({ ...platform })),
    ledges: STAGE.LEDGES.map((ledge) => ({ ...ledge })),
    spawnPositions: [...STAGE.SPAWN_POSITIONS],
  };
}

describe('Physics Engine - applyGravity', () => {
  it('adds GRAVITY to vy when airborne', () => {
    const player = makePlayer({ isGrounded: false, vy: 0 });
    const result = applyGravity(player);

    expect(result.vy).toBeCloseTo(PHYSICS.GRAVITY);
  });

  it('accumulates gravity over multiple frames', () => {
    let player = makePlayer({ isGrounded: false, vy: 0 });

    for (let i = 0; i < 10; i += 1) {
      player = applyGravity(player);
    }

    expect(player.vy).toBeCloseTo(PHYSICS.GRAVITY * 10);
  });

  it('clamps vy at TERMINAL_VELOCITY', () => {
    let player = makePlayer({ isGrounded: false, vy: 0 });

    for (let i = 0; i < 100; i += 1) {
      player = applyGravity(player);
    }

    expect(player.vy).toBeLessThanOrEqual(PHYSICS.TERMINAL_VELOCITY);
    expect(player.vy).toBeCloseTo(PHYSICS.TERMINAL_VELOCITY);
  });

  it('does not apply gravity when grounded', () => {
    const player = makePlayer({ isGrounded: true, vy: 0 });
    const result = applyGravity(player);

    expect(result).toBe(player);
  });
});

describe('Physics Engine - applyMovement', () => {
  it('accelerates grounded movement to the right and applies position change', () => {
    const player = makePlayer({ isGrounded: true, vx: 0, x: 100, y: 200, vy: 3 });
    const input = makeInput({ held: INPUT_BITS.RIGHT });
    const result = applyMovement(player, input);

    expect(result.vx).toBeCloseTo(PHYSICS.WALK_SPEED * 0.2);
    expect(result.x).toBeCloseTo(100 + PHYSICS.WALK_SPEED * 0.2);
    expect(result.y).toBe(203);
  });

  it('applies air friction when airborne with no horizontal input', () => {
    const player = makePlayer({ isGrounded: false, vx: 4, vy: 2 });
    const result = applyMovement(player, makeInput());

    expect(result.vx).toBeCloseTo(4 * PHYSICS.AIR_FRICTION);
  });
});

describe('Physics Engine - applyKnockbackDecay', () => {
  it('does not decay when hitstun has ended', () => {
    const player = makePlayer({ vx: 3, hitstunFramesRemaining: 0 });
    expect(applyKnockbackDecay(player)).toBe(player);
  });

  it('keeps zero velocity at zero while in hitstun', () => {
    const player = makePlayer({ vx: 0, hitstunFramesRemaining: 5 });
    const result = applyKnockbackDecay(player);

    expect(result.vx).toBe(0);
  });

  it('decays negative vx toward zero while in hitstun', () => {
    const player = makePlayer({ vx: -10, hitstunFramesRemaining: 5 });
    const result = applyKnockbackDecay(player);

    expect(result.vx).toBeCloseTo(-9.5);
    expect(Math.abs(result.vx)).toBeLessThan(Math.abs(player.vx));
  });
});

describe('Physics Engine - startJump', () => {
  it('full hop velocity equals JUMP_VELOCITY', () => {
    const player = makePlayer({ isGrounded: true });
    const result = startJump(player, false);

    expect(result.vy).toBe(PHYSICS.JUMP_VELOCITY);
    expect(result.isGrounded).toBe(false);
  });

  it('short hop velocity equals SHORT_HOP_VELOCITY', () => {
    const player = makePlayer({ isGrounded: true });
    const result = startJump(player, true);

    expect(result.vy).toBe(PHYSICS.SHORT_HOP_VELOCITY);
  });

  it('short hop velocity is less negative than full hop', () => {
    const player = makePlayer({ isGrounded: true });
    const shortHop = startJump(player, true);
    const fullHop = startJump(player, false);

    expect(shortHop.vy).toBe(PHYSICS.SHORT_HOP_VELOCITY);
    expect(fullHop.vy).toBe(PHYSICS.JUMP_VELOCITY);
    expect(shortHop.vy).toBeGreaterThan(fullHop.vy);
  });

  it('double jump consumes hasDoubleJump resource', () => {
    const player = makePlayer({ isGrounded: false, hasDoubleJump: true });
    const result = startJump(player, false);

    expect(result.hasDoubleJump).toBe(false);
    expect(result.vy).toBe(PHYSICS.DOUBLE_JUMP_VELOCITY);
  });

  it('double jump does nothing if hasDoubleJump is false', () => {
    const player = makePlayer({ isGrounded: false, hasDoubleJump: false, vy: 5 });
    const result = startJump(player, false);

    expect(result).toBe(player);
  });

  it('landing resets double jump on platform collision', () => {
    const stage = makeStage();
    const player = makePlayer({
      isGrounded: false,
      hasDoubleJump: false,
      y: stage.mainPlatform.y - PHYSICS.HURTBOX_RADIUS + 1,
      vy: 5,
    });

    const result = checkPlatformCollision(player, stage);

    expect(result.isGrounded).toBe(true);
    expect(result.hasDoubleJump).toBe(true);
  });
});

describe('Physics Engine - applyFastFall', () => {
  it('activates fast fall only while airborne and descending with down held', () => {
    const player = makePlayer({ isGrounded: false, vy: 0.5, isFastFalling: false });
    const input = makeInput({ held: INPUT_BITS.DOWN });
    const result = applyFastFall(player, input);

    expect(result.isFastFalling).toBe(true);
    expect(result.vy).toBeCloseTo(PHYSICS.TERMINAL_VELOCITY * 0.8);
  });

  it('does not activate while rising', () => {
    const player = makePlayer({ isGrounded: false, vy: -1, isFastFalling: false });
    const input = makeInput({ held: INPUT_BITS.DOWN });
    const result = applyFastFall(player, input);

    expect(result).toBe(player);
  });
});

describe('Physics Engine - checkPlatformCollision', () => {
  it('crossing bottom blast zone sets isKnockedOut to true', () => {
    const stage = makeStage();
    const player = makePlayer({ y: STAGE.BLAST_BOTTOM + 10 });
    const result = checkPlatformCollision(player, stage);

    expect(result.isKnockedOut).toBe(true);
  });

  it('crossing top blast zone sets isKnockedOut to true', () => {
    const stage = makeStage();
    const player = makePlayer({ y: STAGE.BLAST_TOP - 10 });
    const result = checkPlatformCollision(player, stage);

    expect(result.isKnockedOut).toBe(true);
  });

  it('crossing left blast zone sets isKnockedOut to true', () => {
    const stage = makeStage();
    const player = makePlayer({ x: STAGE.BLAST_LEFT - 10 });
    const result = checkPlatformCollision(player, stage);

    expect(result.isKnockedOut).toBe(true);
  });

  it('crossing right blast zone sets isKnockedOut to true', () => {
    const stage = makeStage();
    const player = makePlayer({ x: STAGE.BLAST_RIGHT + 10 });
    const result = checkPlatformCollision(player, stage);

    expect(result.isKnockedOut).toBe(true);
  });

  it('landing on main platform snaps y, sets isGrounded, and clears vy', () => {
    const stage = makeStage();
    const platformTop = STAGE.MAIN_PLATFORM.y;
    const player = makePlayer({
      isGrounded: false,
      y: platformTop - PHYSICS.HURTBOX_RADIUS + 2,
      vy: 8,
    });
    const result = checkPlatformCollision(player, stage);

    expect(result.isGrounded).toBe(true);
    expect(result.vy).toBe(0);
    expect(result.y).toBe(platformTop - PHYSICS.HURTBOX_RADIUS);
  });

  it('player above main platform is not landed before crossing', () => {
    const stage = makeStage();
    const platformTop = STAGE.MAIN_PLATFORM.y;
    const player = makePlayer({
      isGrounded: false,
      y: platformTop - PHYSICS.HURTBOX_RADIUS - 20,
      vy: 5,
    });
    const result = checkPlatformCollision(player, stage);

    expect(result.isGrounded).toBe(false);
  });

  it('lands on a soft platform when crossing from above', () => {
    const stage = makeStage();
    const platform = stage.platforms[0];
    expect(platform).toBeDefined();

    if (!platform) {
      throw new Error('Expected left platform test fixture');
    }

    const player = makePlayer({
      isGrounded: false,
      x: platform.x + platform.width / 2,
      y: platform.y - PHYSICS.HURTBOX_RADIUS + 2,
      vy: 7,
    });
    const result = checkPlatformCollision(player, stage);

    expect(result.isGrounded).toBe(true);
    expect(result.y).toBe(platform.y - PHYSICS.HURTBOX_RADIUS);
  });

  it('wall-side contact at platform lip keeps player airborne and preserves double jump', () => {
    const stage = makeStage();
    const platform = stage.platforms[0];
    expect(platform).toBeDefined();

    if (!platform) {
      throw new Error('Expected left platform test fixture');
    }

    const player = makePlayer({
      isGrounded: false,
      hasDoubleJump: true,
      x: platform.x,
      y: platform.y - PHYSICS.HURTBOX_RADIUS,
      vx: -3,
      vy: 0,
    });

    const collided = checkPlatformCollision(player, stage);
    const jumped = startJump(collided, false);

    expect(collided.isGrounded).toBe(false);
    expect(jumped.vy).toBe(PHYSICS.DOUBLE_JUMP_VELOCITY);
    expect(jumped.hasDoubleJump).toBe(false);
  });
});

describe('Physics Engine - applyMovementInput', () => {
  it('baseline characterization: gravity+movement path keeps horizontal velocity constant while gravity changes vy', () => {
    const input = makeInput({ held: INPUT_BITS.LEFT | INPUT_BITS.RIGHT });
    let player = makePlayer({
      isGrounded: false,
      x: 100,
      y: 300,
      vx: 10,
      vy: 0,
      hitstunFramesRemaining: 30,
    });

    const vxFrames: number[] = [];
    const vyFrames: number[] = [];

    for (let frame = 0; frame < 5; frame += 1) {
      player = applyMovement(applyGravity(player), input);
      vxFrames.push(player.vx);
      vyFrames.push(player.vy);
      player = {
        ...player,
        hitstunFramesRemaining: Math.max(0, player.hitstunFramesRemaining - 1),
      };
    }

    expect(vxFrames).toEqual([10, 10, 10, 10, 10]);
    expect(vyFrames[0]).toBeCloseTo(PHYSICS.GRAVITY);
    expect(vyFrames[4]).toBeGreaterThan(vyFrames[0] ?? 0);
  });

  it('decays knockback vx during hitstun over 30 frames', () => {
    const input = makeInput({ held: INPUT_BITS.LEFT | INPUT_BITS.RIGHT });
    let player = makePlayer({
      isGrounded: false,
      x: 100,
      y: 300,
      vx: 10,
      vy: 0,
      hitstunFramesRemaining: 30,
    });

    const vxFrames: number[] = [player.vx];
    const vyFrames: number[] = [player.vy];

    for (let frame = 0; frame < 30; frame += 1) {
      player = applyMovementInput(player, input);
      vxFrames.push(player.vx);
      vyFrames.push(player.vy);
      player = {
        ...player,
        hitstunFramesRemaining: Math.max(0, player.hitstunFramesRemaining - 1),
      };
    }

    // Visual sanity check for decay curve when running tests.
    console.info('hitstun vx decay curve', vxFrames.map((vx) => Number(vx.toFixed(4))));

    for (let i = 1; i < vxFrames.length; i += 1) {
      expect(Math.abs(vxFrames[i] ?? 0)).toBeLessThan(Math.abs(vxFrames[i - 1] ?? 0));
    }

    expect(vxFrames[10]).toBeCloseTo(5.99, 2);
    expect(vxFrames[30]).toBeCloseTo(2.15, 2);
    expect(vyFrames[1]).toBeCloseTo(PHYSICS.GRAVITY);
  });

  it('stops decaying once hitstun ends and weak knockback is near-zero', () => {
    const input = makeInput({ held: INPUT_BITS.LEFT | INPUT_BITS.RIGHT });
    let player = makePlayer({
      isGrounded: false,
      x: 100,
      y: 300,
      vx: 1,
      vy: 0,
      hitstunFramesRemaining: 10,
    });

    for (let frame = 0; frame < 10; frame += 1) {
      player = applyMovementInput(player, input);
      player = {
        ...player,
        hitstunFramesRemaining: Math.max(0, player.hitstunFramesRemaining - 1),
      };
    }

    const vxAfterHitstun = player.vx;
    expect(Math.abs(vxAfterHitstun)).toBeLessThan(1);

    player = applyMovementInput(player, input);
    expect(player.vx).toBeCloseTo(vxAfterHitstun);
  });

  it('composes gravity, movement, and collision checks for client prediction', () => {
    const player = makePlayer({
      isGrounded: false,
      x: 200,
      y: STAGE.MAIN_PLATFORM.y - PHYSICS.HURTBOX_RADIUS - 0.5,
      vx: 0,
      vy: 0,
    });
    const input = makeInput({ held: INPUT_BITS.RIGHT });
    const result = applyMovementInput(player, input);

    expect(result.x).toBeCloseTo(200 + PHYSICS.AIR_SPEED * 0.15);
    expect(result.y).toBe(STAGE.MAIN_PLATFORM.y - PHYSICS.HURTBOX_RADIUS);
    expect(result.isGrounded).toBe(true);
  });
});

describe('Physics Engine - Stage Geometry Regression Guard', () => {
  it('validates stage geometry margins and ledge alignment', () => {
    const stage = makeStage();
    const mainPlatform = stage.mainPlatform;
    const ledges = stage.ledges;

    // Right margin ratio: distance from platform right edge to blast zone / half-platform-width
    const rightMarginRatio = (stage.blastRight - mainPlatform.x - mainPlatform.width) / (mainPlatform.width / 2);
    expect(rightMarginRatio).toBeGreaterThanOrEqual(1.0);

    // Left margin ratio: distance from blast zone to platform left edge / half-platform-width
    const leftMarginRatio = (mainPlatform.x - stage.blastLeft) / (mainPlatform.width / 2);
    expect(leftMarginRatio).toBeGreaterThanOrEqual(1.0);

    // Left ledge x should align with platform left edge
    expect(ledges[0]!.x).toBe(mainPlatform.x);

    // Right ledge x should align with platform right edge
    expect(ledges[1]!.x).toBe(mainPlatform.x + mainPlatform.width);
  });
});

describe('Physics Engine - checkLedgeGrab', () => {
  it('returns left LedgeData when player is near the left ledge', () => {
    const player = makePlayer({ x: 10, y: 505, isGrounded: false, hitstunFramesRemaining: 0 });
    const stage = makeStage();
    const result = checkLedgeGrab(player, stage);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('left');
  });

  it('returns right LedgeData when player is near the right ledge', () => {
    const player = makePlayer({ x: 1270, y: 505, isGrounded: false, hitstunFramesRemaining: 0 });
    const stage = makeStage();
    const result = checkLedgeGrab(player, stage);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('right');
  });

  it('returns null when player is far from all ledges (center stage)', () => {
    const player = makePlayer({ x: 640, y: 505, isGrounded: false, hitstunFramesRemaining: 0 });
    const stage = makeStage();
    expect(checkLedgeGrab(player, stage)).toBeNull();
  });

  it('returns null when player is grounded', () => {
    const player = makePlayer({ x: 10, y: 505, isGrounded: true, hitstunFramesRemaining: 0 });
    const stage = makeStage();
    expect(checkLedgeGrab(player, stage)).toBeNull();
  });

  it('returns null when player is in hitstun', () => {
    const player = makePlayer({ x: 10, y: 505, isGrounded: false, hitstunFramesRemaining: 15 });
    const stage = makeStage();
    expect(checkLedgeGrab(player, stage)).toBeNull();
  });

  it('allows grab when player faces away from ledge (no facing check)', () => {
    const player = makePlayer({ x: 1270, y: 505, isGrounded: false, hitstunFramesRemaining: 0, facing: -1 });
    const stage = makeStage();
    const result = checkLedgeGrab(player, stage);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('right');
  });

  it('returns null when player is outside vertical tolerance', () => {
    const player = makePlayer({ x: 10, y: 700, isGrounded: false, hitstunFramesRemaining: 0 });
    const stage = makeStage();
    expect(checkLedgeGrab(player, stage)).toBeNull();
  });
});
