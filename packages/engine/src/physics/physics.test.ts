import { describe, expect, it } from 'vitest';
import { INPUT_BITS, PHYSICS, STAGE, type InputEvent, type PlayerState } from '@smash/shared';
import { applyDI, applyFastFall, applyGravity, applyKnockbackDecay, applyMovement, applyMovementInput, checkLedgeGrab, checkPlatformCollision, checkWallCollision, startJump } from './index.js';

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
    walls: STAGE.WALLS.map((wall) => ({ ...wall })),
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
    expect(result.vy).toBe(0.5); // vy unchanged on activation
  });

  it('applies progressive acceleration via applyGravity when fast falling', () => {
    // Frame 1: activate fast fall
    let player = makePlayer({ isGrounded: false, vy: 0.5, isFastFalling: false });
    const input = makeInput({ held: INPUT_BITS.DOWN });
    player = applyFastFall(player, input);
    expect(player.isFastFalling).toBe(true);
    expect(player.vy).toBe(0.5);

    // Frame 2: gravity applies GRAVITY * FAST_FALL_MULTIPLIER
    player = applyGravity(player);
    const expectedVy2 = 0.5 + PHYSICS.GRAVITY * PHYSICS.FAST_FALL_MULTIPLIER;
    expect(player.vy).toBeCloseTo(expectedVy2);

    // Frame 3: continues accelerating
    player = applyGravity(player);
    const expectedVy3 = expectedVy2 + PHYSICS.GRAVITY * PHYSICS.FAST_FALL_MULTIPLIER;
    expect(player.vy).toBeCloseTo(expectedVy3);

    // Verify it's capped by TERMINAL_VELOCITY
    expect(player.vy).toBeLessThanOrEqual(PHYSICS.TERMINAL_VELOCITY);
  });

  it('does not activate while rising', () => {
    const player = makePlayer({ isGrounded: false, vy: -1, isFastFalling: false });
    const input = makeInput({ held: INPUT_BITS.DOWN });
    const result = applyFastFall(player, input);

    expect(result).toBe(player);
  });

  it('applies fast-fall acceleration on activation frame and clamps to shared terminal ceiling', () => {
    const player = makePlayer({ isGrounded: false, vy: 17.2, isFastFalling: false });
    const input = makeInput({ held: INPUT_BITS.DOWN });

    const result = applyGravity(applyFastFall(player, input));

    expect(result.isFastFalling).toBe(true);
    expect(result.vy).toBe(PHYSICS.TERMINAL_VELOCITY);
  });

  it('keeps non-fast-fall descent capped at TERMINAL_VELOCITY', () => {
    const player = makePlayer({ isGrounded: false, vy: 17.6, isFastFalling: false });
    const input = makeInput({ held: 0 });

    const result = applyGravity(applyFastFall(player, input));

    expect(result.isFastFalling).toBe(false);
    expect(result.vy).toBe(PHYSICS.TERMINAL_VELOCITY);
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

  it('wall-contact repro: second jump while flush to platform side still fires double jump', () => {
    const stage = makeStage();
    const player = makePlayer({
      isGrounded: true,
      hasDoubleJump: true,
      x: stage.mainPlatform.x,
      y: stage.mainPlatform.y - PHYSICS.HURTBOX_RADIUS,
    });

    const firstJump = startJump(player, false);
    expect(firstJump.isGrounded).toBe(false);

    const stillTouchingWallSide = checkPlatformCollision(
      {
        ...firstJump,
        x: stage.mainPlatform.x,
        y: stage.mainPlatform.y - PHYSICS.HURTBOX_RADIUS + 1,
        vy: 1,
      },
      stage,
    );

    const secondJump = startJump(stillTouchingWallSide, false);

    expect(stillTouchingWallSide.isGrounded).toBe(false);
    expect(secondJump.vy).toBe(PHYSICS.DOUBLE_JUMP_VELOCITY);
    expect(secondJump.hasDoubleJump).toBe(false);
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

describe('Physics Engine - applyDI', () => {
  it('returns knockback angle unchanged when no input', () => {
    const angle = Math.PI / 4; // 45°
    const result = applyDI(angle, 0, 0, 1);
    expect(result).toBe(angle);
  });

  it('clamps DI angle shift to ±0.314159 radians (±18°)', () => {
    const knockbackAngle = 0; // horizontal right
    // Input perpendicular to knockback (straight up) should max out at ±18°
    const resultUp = applyDI(knockbackAngle, 0, 1, 1);
    const resultDown = applyDI(knockbackAngle, 0, -1, 1);

    // Should be clamped to ±0.314159
    expect(Math.abs(resultUp - knockbackAngle)).toBeLessThanOrEqual(0.314159 + 0.0001);
    expect(Math.abs(resultDown - knockbackAngle)).toBeLessThanOrEqual(0.314159 + 0.0001);
  });

  it('shifts angle upward when input is perpendicular upward', () => {
    const knockbackAngle = 0; // horizontal right
    const result = applyDI(knockbackAngle, 0, 1, 1);
    expect(result).toBeGreaterThan(knockbackAngle);
  });

  it('shifts angle downward when input is perpendicular downward', () => {
    const knockbackAngle = 0; // horizontal right
    const result = applyDI(knockbackAngle, 0, -1, 1);
    expect(result).toBeLessThan(knockbackAngle);
  });

  it('does not shift angle when input is parallel to knockback', () => {
    const knockbackAngle = 0; // horizontal right
    const result = applyDI(knockbackAngle, 1, 0, 1); // input also right
    expect(result).toBeCloseTo(knockbackAngle);
  });

  it('applies partial shift for diagonal input', () => {
    const knockbackAngle = 0; // horizontal right
    const result = applyDI(knockbackAngle, 1, 1, 1); // diagonal up-right
    expect(result).toBeGreaterThan(knockbackAngle);
    expect(result).toBeLessThan(0.314159 + 0.0001); // less than max shift
  });

  it('18° cone: max positive shift is ~0.314159 radians', () => {
    const knockbackAngle = 0;
    const result = applyDI(knockbackAngle, 0, 1, 1);
    const shift = result - knockbackAngle;
    expect(shift).toBeCloseTo(0.314159, 5);
  });

  it('18° cone: max negative shift is ~-0.314159 radians', () => {
    const knockbackAngle = 0;
    const result = applyDI(knockbackAngle, 0, -1, 1);
    const shift = result - knockbackAngle;
    expect(shift).toBeCloseTo(-0.314159, 5);
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
    const player = makePlayer({ x: 190, y: 505, isGrounded: false, hitstunFramesRemaining: 0 });
    const stage = makeStage();
    const result = checkLedgeGrab(player, stage);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('left');
  });

  it('returns right LedgeData when player is near the right ledge', () => {
    const player = makePlayer({ x: 1090, y: 505, isGrounded: false, hitstunFramesRemaining: 0 });
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
    const player = makePlayer({ x: 1090, y: 505, isGrounded: false, hitstunFramesRemaining: 0, facing: -1 });
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

describe('Physics Engine - checkWallCollision', () => {
  it('returns null when player is grounded', () => {
    const player = makePlayer({ x: 50, y: 450, isGrounded: true });
    const stage = makeStage();
    expect(checkWallCollision(player, stage)).toBeNull();
  });

  it('detects left wall when player is within contact tolerance and vertical bounds', () => {
    const leftWall = STAGE.WALLS[0];
    const player = makePlayer({
      x: leftWall.x + PHYSICS.WALL_CONTACT_TOLERANCE_PX - 1,
      y: (leftWall.yTop + leftWall.yBottom) / 2,
      isGrounded: false,
    });
    const stage = makeStage();
    const result = checkWallCollision(player, stage);
    expect(result).toBe('left');
  });

  it('detects right wall when player is within contact tolerance and vertical bounds', () => {
    const rightWall = STAGE.WALLS[1];
    const player = makePlayer({
      x: rightWall.x - PHYSICS.WALL_CONTACT_TOLERANCE_PX + 1,
      y: (rightWall.yTop + rightWall.yBottom) / 2,
      isGrounded: false,
    });
    const stage = makeStage();
    const result = checkWallCollision(player, stage);
    expect(result).toBe('right');
  });

  it('returns null when player is outside horizontal contact tolerance', () => {
    const leftWall = STAGE.WALLS[0];
    const player = makePlayer({
      x: leftWall.x + PHYSICS.WALL_CONTACT_TOLERANCE_PX + 5,
      y: (leftWall.yTop + leftWall.yBottom) / 2,
      isGrounded: false,
    });
    const stage = makeStage();
    expect(checkWallCollision(player, stage)).toBeNull();
  });

  it('returns null when player is outside vertical bounds of wall', () => {
    const leftWall = STAGE.WALLS[0];
    const player = makePlayer({
      x: leftWall.x,
      y: leftWall.yTop - 10,
      isGrounded: false,
    });
    const stage = makeStage();
    expect(checkWallCollision(player, stage)).toBeNull();
  });

  it('returns first matching wall when multiple walls are in range', () => {
    const leftWall = STAGE.WALLS[0];
    const player = makePlayer({
      x: leftWall.x,
      y: (leftWall.yTop + leftWall.yBottom) / 2,
      isGrounded: false,
    });
    const stage = makeStage();
    const result = checkWallCollision(player, stage);
    expect(result).toBe('left');
  });
});

describe('Physics Engine - Character-Specific Stats', () => {
  it('Lincoln jump sets vy to -15.2 immediately', () => {
    const player = makePlayer({ isGrounded: true, characterId: 'abe-lincoln' });
    const result = startJump(player, false);

    expect(result.vy).toBe(-15.2);
    expect(result.isGrounded).toBe(false);
  });

  it('Lincoln short hop sets vy to -9.5 immediately', () => {
    const player = makePlayer({ isGrounded: true, characterId: 'abe-lincoln' });
    const result = startJump(player, true);

    expect(result.vy).toBe(-9.5);
    expect(result.isGrounded).toBe(false);
  });

  it('Lincoln run speed clamps at 5.8 after acceleration', () => {
    let player = makePlayer({ isGrounded: true, vx: 0, characterId: 'abe-lincoln' });
    const input = makeInput({ held: INPUT_BITS.RIGHT });

    // Accelerate over multiple frames until we hit the clamp
    for (let i = 0; i < 100; i += 1) {
      player = applyMovement(player, input);
    }

    expect(player.vx).toBeCloseTo(5.8, 1);
  });

  it('Lincoln walk speed clamps at -5.8 when moving left after acceleration', () => {
    let player = makePlayer({ isGrounded: true, vx: 0, characterId: 'abe-lincoln' });
    const input = makeInput({ held: INPUT_BITS.LEFT });

    // Accelerate over multiple frames until we hit the clamp
    for (let i = 0; i < 100; i += 1) {
      player = applyMovement(player, input);
    }

    expect(player.vx).toBeCloseTo(-5.8, 1);
  });

  it('All-Rounder maintains original behavior - jump sets vy to -16', () => {
    const player = makePlayer({ isGrounded: true, characterId: 'all-rounder' });
    const result = startJump(player, false);

    expect(result.vy).toBe(PHYSICS.JUMP_VELOCITY);
    expect(result.vy).toBe(-16);
  });

  it('All-Rounder maintains original behavior - run speed clamps at 6.5', () => {
    let player = makePlayer({ isGrounded: true, vx: 0, characterId: 'all-rounder' });
    const input = makeInput({ held: INPUT_BITS.RIGHT });

    // Accelerate over multiple frames until we hit the clamp
    for (let i = 0; i < 100; i += 1) {
      player = applyMovement(player, input);
    }

    expect(player.vx).toBeCloseTo(PHYSICS.RUN_SPEED, 1);
    expect(player.vx).toBeCloseTo(6.5, 1);
  });

  it('Undefined characterId falls back to All-Rounder stats', () => {
    const player = makePlayer({ isGrounded: true, characterId: undefined });
    const result = startJump(player, false);

    expect(result.vy).toBe(PHYSICS.JUMP_VELOCITY);
    expect(result.vy).toBe(-16);
  });
});
