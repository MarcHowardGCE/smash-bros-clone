import { describe, expect, it } from 'vitest';
import { INPUT_BITS, PHYSICS, PlayerStateEnum } from '@smash/shared';
import type { InputEvent, PlayerState } from '@smash/shared';
import { FSMController } from './FSMController.js';

function makePlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: 'p1',
    slotIndex: 0,
    x: 640,
    y: 480,
    vx: 0,
    vy: 0,
    facing: 1,
    state: PlayerStateEnum.IDLE,
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

function makeInput(pressed = 0, held = 0): InputEvent {
  return { tick: 0, seq: 0, playerId: 'p1', held, pressed, released: 0 };
}

describe('FSM - Idle transitions', () => {
  it('Idle → Jumpsquat on JUMP pressed', () => {
    const controller = new FSMController(PlayerStateEnum.IDLE);
    const result = controller.tick(makePlayer(), makeInput(INPUT_BITS.JUMP, INPUT_BITS.JUMP));

    expect(result.state).toBe(PlayerStateEnum.JUMPSQUAT);
    expect(result.stateFrame).toBe(0);
    expect(controller.getCurrentStateName()).toBe(PlayerStateEnum.JUMPSQUAT);
  });

  it('Idle → Walk on RIGHT held', () => {
    const controller = new FSMController(PlayerStateEnum.IDLE);
    const result = controller.tick(makePlayer(), makeInput(0, INPUT_BITS.RIGHT));

    expect(result.state).toBe(PlayerStateEnum.WALK);
    expect(result.stateFrame).toBe(0);
  });

  it('Idle → Attack on ATTACK pressed', () => {
    const controller = new FSMController(PlayerStateEnum.IDLE);
    const result = controller.tick(makePlayer(), makeInput(INPUT_BITS.ATTACK, INPUT_BITS.ATTACK));

    expect(result.state).toBe(PlayerStateEnum.ATTACK);
  });

  it('Idle stays Idle with no input', () => {
    const controller = new FSMController(PlayerStateEnum.IDLE);
    const result = controller.tick(makePlayer(), makeInput());

    expect(result.state).toBe(PlayerStateEnum.IDLE);
    expect(result.stateFrame).toBe(1);
  });
});

describe('FSM - Jumpsquat', () => {
  it(`transitions to Airborne after exactly ${PHYSICS.JUMPSQUAT_FRAMES} frames`, () => {
    const controller = new FSMController(PlayerStateEnum.JUMPSQUAT);
    let player = makePlayer({ state: PlayerStateEnum.JUMPSQUAT, stateFrame: 0, isGrounded: true });

    for (let i = 0; i < PHYSICS.JUMPSQUAT_FRAMES - 1; i += 1) {
      player = controller.tick(player, makeInput());
      expect(player.state).toBe(PlayerStateEnum.JUMPSQUAT);
      expect(player.stateFrame).toBe(i + 1);
    }

    player = controller.tick(player, makeInput());
    expect(player.state).toBe(PlayerStateEnum.AIRBORNE);
    expect(player.stateFrame).toBe(0);
  });
});

describe('FSM - Airborne transitions', () => {
  it('Airborne → Idle when isGrounded becomes true', () => {
    const controller = new FSMController(PlayerStateEnum.AIRBORNE);
    const result = controller.tick(makePlayer({ state: PlayerStateEnum.AIRBORNE, isGrounded: true }), makeInput());

    expect(result.state).toBe(PlayerStateEnum.IDLE);
  });

  it('Airborne → Double Jump on jump press when available', () => {
    const controller = new FSMController(PlayerStateEnum.AIRBORNE);
    const result = controller.tick(
      makePlayer({ state: PlayerStateEnum.AIRBORNE, isGrounded: false, hasDoubleJump: true }),
      makeInput(INPUT_BITS.JUMP, INPUT_BITS.JUMP),
    );

    expect(result.state).toBe(PlayerStateEnum.DOUBLE_JUMP);
  });
});

describe('FSM - Attack state duration', () => {
  it('Attack → Idle after default totalFrames (20)', () => {
    const controller = new FSMController(PlayerStateEnum.ATTACK);
    let player = makePlayer({ state: PlayerStateEnum.ATTACK, stateFrame: 0 });

    for (let i = 0; i < 20; i += 1) {
      player = controller.tick(player, makeInput());
      if (i < 19) {
        expect(player.state).toBe(PlayerStateEnum.ATTACK);
      }
    }

    expect(player.state).toBe(PlayerStateEnum.IDLE);
    expect(player.stateFrame).toBe(0);
  });
});

describe('FSM - Grab states', () => {
  it('Grab → GrabHolding when a player is successfully grabbed', () => {
    const controller = new FSMController(PlayerStateEnum.GRAB);
    const result = controller.tick(makePlayer({ state: PlayerStateEnum.GRAB, isGrabbing: true }), makeInput());

    expect(result.state).toBe(PlayerStateEnum.GRAB_HOLDING);
  });

  it('GrabHolding → Idle after 90 frames', () => {
    const controller = new FSMController(PlayerStateEnum.GRAB_HOLDING);
    let player = makePlayer({ state: PlayerStateEnum.GRAB_HOLDING, isGrabbing: true, stateFrame: 0 });

    for (let i = 0; i < 90; i += 1) {
      player = controller.tick(player, makeInput());
    }

    expect(player.state).toBe(PlayerStateEnum.IDLE);
  });
});

describe('FSM - Hitstun', () => {
  it('Hitstun stays for exactly hitstunFramesRemaining frames', () => {
    const controller = new FSMController(PlayerStateEnum.HITSTUN);
    let player = makePlayer({
      state: PlayerStateEnum.HITSTUN,
      hitstunFramesRemaining: 3,
      isGrounded: false,
    });

    player = controller.tick(player, makeInput());
    expect(player.state).toBe(PlayerStateEnum.HITSTUN);
    expect(player.hitstunFramesRemaining).toBe(2);

    player = controller.tick(player, makeInput());
    expect(player.state).toBe(PlayerStateEnum.HITSTUN);
    expect(player.hitstunFramesRemaining).toBe(1);

    player = controller.tick(player, makeInput());
    expect(player.state).toBe(PlayerStateEnum.HITSTUN);
    expect(player.hitstunFramesRemaining).toBe(0);

    player = controller.tick(player, makeInput());
    expect(player.state).toBe(PlayerStateEnum.AIRBORNE);
    expect(player.stateFrame).toBe(0);
  });
});

describe('FSM - Hitlag', () => {
  it('stateFrame does NOT increment during hitlag', () => {
    const controller = new FSMController(PlayerStateEnum.IDLE);
    let player = makePlayer({
      state: PlayerStateEnum.IDLE,
      stateFrame: 5,
      hitlagFramesRemaining: 3,
      vx: 4,
      vy: -2,
    });

    player = controller.tick(player, makeInput());
    expect(player.stateFrame).toBe(5);
    expect(player.hitlagFramesRemaining).toBe(2);
    expect(player.vx).toBe(0);
    expect(player.vy).toBe(0);

    player = controller.tick(player, makeInput());
    expect(player.stateFrame).toBe(5);
    expect(player.hitlagFramesRemaining).toBe(1);

    player = controller.tick(player, makeInput());
    expect(player.stateFrame).toBe(5);
    expect(player.hitlagFramesRemaining).toBe(0);

    player = controller.tick(player, makeInput());
    expect(player.stateFrame).toBe(6);
  });
});
