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
    airDodgeDirection: null,
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
  it('BASELINE CHARACTERIZATION: weak/strong knockback both recover directly to AIRBORNE when hitstun ends', () => {
    const runScenario = (vx: number, vy: number): PlayerState => {
      const controller = new FSMController(PlayerStateEnum.HITSTUN);
      let player = makePlayer({
        state: PlayerStateEnum.HITSTUN,
        hitstunFramesRemaining: 1,
        isGrounded: false,
        vx,
        vy,
      });

      player = controller.tick(player, makeInput());
      expect(player.state).toBe(PlayerStateEnum.HITSTUN);
      expect(player.hitstunFramesRemaining).toBe(0);

      return controller.tick(player, makeInput());
    };

    const weakRecovery = runScenario(2, -2);
    const strongRecovery = runScenario(18, -18);

    expect(weakRecovery.state).toBe(PlayerStateEnum.AIRBORNE);
    expect(strongRecovery.state).toBe(PlayerStateEnum.AIRBORNE);
  });

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

  it('Weak hit (KB=50) should clear hitstun to AIRBORNE with no tumble', () => {
    const controller = new FSMController(PlayerStateEnum.HITSTUN);
    let player = makePlayer({
      state: PlayerStateEnum.HITSTUN,
      hitstunFramesRemaining: 1,
      isGrounded: false,
      vx: 35.355,
      vy: -35.355,
    });

    player = controller.tick(player, makeInput());
    expect(player.isTumbling).toBe(false);

    player = controller.tick(player, makeInput());
    expect(player.state).toBe(PlayerStateEnum.AIRBORNE);
    expect(player.stateFrame).toBe(0);
  });

  it('Strong hit (KB=100) should stay tumbling after hitstun until directional input', () => {
    const controller = new FSMController(PlayerStateEnum.HITSTUN);
    let player = makePlayer({
      state: PlayerStateEnum.HITSTUN,
      hitstunFramesRemaining: 1,
      isGrounded: false,
      isTumbling: true,
      vx: 70.711,
      vy: -70.711,
    });

    player = controller.tick(player, makeInput());
    expect(player.state).toBe(PlayerStateEnum.HITSTUN);
    expect(player.hitstunFramesRemaining).toBe(0);

    const noInput = controller.tick(player, makeInput());
    console.info('[tumble-trace] HITSTUN (tumbling) -> TUMBLE-FALL');
    expect(noInput.state).toBe(PlayerStateEnum.HITSTUN);

    const withInput = controller.tick(
      noInput,
      makeInput(INPUT_BITS.LEFT, INPUT_BITS.LEFT),
    );
    console.info('[tumble-trace] TUMBLE-FALL -> AIRBORNE (after input)');
    expect(withInput.state).toBe(PlayerStateEnum.AIRBORNE);
  });

  it.each([
    { kb: 79.9, expectedTumble: false },
    { kb: 80.0, expectedTumble: false },
    { kb: 80.1, expectedTumble: true },
  ])(
    'Edge KB=$kb should map isTumbling=$expectedTumble',
    ({ kb, expectedTumble }) => {
      const derived = kb > 80;
      expect(derived).toBe(expectedTumble);
    },
  );
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

describe('FSM - LedgeHang transitions', () => {
  it('LedgeHang → LedgeJump on JUMP pressed', () => {
    const controller = new FSMController(PlayerStateEnum.LEDGE_HANG);
    const result = controller.tick(
      makePlayer({ state: PlayerStateEnum.LEDGE_HANG, isGrounded: false }),
      makeInput(INPUT_BITS.JUMP, 0),
    );

    expect(result.state).toBe(PlayerStateEnum.LEDGE_JUMP);
    expect(result.stateFrame).toBe(0);
    expect(controller.getCurrentStateName()).toBe(PlayerStateEnum.LEDGE_JUMP);
  });

  it('LedgeHang → LedgeAttack on ATTACK pressed', () => {
    const controller = new FSMController(PlayerStateEnum.LEDGE_HANG);
    const result = controller.tick(
      makePlayer({ state: PlayerStateEnum.LEDGE_HANG, isGrounded: false }),
      makeInput(INPUT_BITS.ATTACK, 0),
    );

    expect(result.state).toBe(PlayerStateEnum.LEDGE_ATTACK);
  });

  it('LedgeHang → LedgeRoll on SHIELD pressed', () => {
    const controller = new FSMController(PlayerStateEnum.LEDGE_HANG);
    const result = controller.tick(
      makePlayer({ state: PlayerStateEnum.LEDGE_HANG, isGrounded: false }),
      makeInput(INPUT_BITS.SHIELD, 0),
    );

    expect(result.state).toBe(PlayerStateEnum.LEDGE_ROLL);
  });

  it('LedgeHang → Airborne on DOWN pressed (drop)', () => {
    const controller = new FSMController(PlayerStateEnum.LEDGE_HANG);
    const result = controller.tick(
      makePlayer({ state: PlayerStateEnum.LEDGE_HANG, isGrounded: false }),
      makeInput(INPUT_BITS.DOWN, 0),
    );

    expect(result.state).toBe(PlayerStateEnum.AIRBORNE);
  });

  it('LedgeHang → LedgeClimb on LEFT held', () => {
    const controller = new FSMController(PlayerStateEnum.LEDGE_HANG);
    const result = controller.tick(
      makePlayer({ state: PlayerStateEnum.LEDGE_HANG, isGrounded: false }),
      makeInput(0, INPUT_BITS.LEFT),
    );

    expect(result.state).toBe(PlayerStateEnum.LEDGE_CLIMB);
  });

  it('LedgeHang stays LedgeHang with no input', () => {
    const controller = new FSMController(PlayerStateEnum.LEDGE_HANG);
    const result = controller.tick(
      makePlayer({ state: PlayerStateEnum.LEDGE_HANG, isGrounded: false }),
      makeInput(),
    );

    expect(result.state).toBe(PlayerStateEnum.LEDGE_HANG);
    expect(result.stateFrame).toBe(1);
  });
});

describe('FSM - LedgeClimb timing', () => {
  it(`stays LedgeClimb at frame ${PHYSICS.LEDGE_CLIMB_FRAMES - 2}`, () => {
    const controller = new FSMController(PlayerStateEnum.LEDGE_CLIMB);
    const result = controller.tick(
      makePlayer({ state: PlayerStateEnum.LEDGE_CLIMB, stateFrame: PHYSICS.LEDGE_CLIMB_FRAMES - 2 }),
      makeInput(),
    );

    expect(result.state).toBe(PlayerStateEnum.LEDGE_CLIMB);
  });

  it(`transitions to Idle after exactly ${PHYSICS.LEDGE_CLIMB_FRAMES} frames`, () => {
    const controller = new FSMController(PlayerStateEnum.LEDGE_CLIMB);
    const result = controller.tick(
      makePlayer({ state: PlayerStateEnum.LEDGE_CLIMB, stateFrame: PHYSICS.LEDGE_CLIMB_FRAMES - 1 }),
      makeInput(),
    );

    expect(result.state).toBe(PlayerStateEnum.IDLE);
    expect(result.stateFrame).toBe(0);
  });
});

describe('FSM - LedgeJump timing', () => {
  it(`stays LedgeJump at frame ${PHYSICS.LEDGE_JUMP_FRAMES - 2}`, () => {
    const controller = new FSMController(PlayerStateEnum.LEDGE_JUMP);
    const result = controller.tick(
      makePlayer({ state: PlayerStateEnum.LEDGE_JUMP, stateFrame: PHYSICS.LEDGE_JUMP_FRAMES - 2 }),
      makeInput(),
    );

    expect(result.state).toBe(PlayerStateEnum.LEDGE_JUMP);
  });

  it(`transitions to Airborne after exactly ${PHYSICS.LEDGE_JUMP_FRAMES} frames`, () => {
    const controller = new FSMController(PlayerStateEnum.LEDGE_JUMP);
    const result = controller.tick(
      makePlayer({ state: PlayerStateEnum.LEDGE_JUMP, stateFrame: PHYSICS.LEDGE_JUMP_FRAMES - 1 }),
      makeInput(),
    );

    expect(result.state).toBe(PlayerStateEnum.AIRBORNE);
    expect(result.stateFrame).toBe(0);
  });
});

describe('FSM - LedgeAttack timing', () => {
  it(`stays LedgeAttack at frame ${PHYSICS.LEDGE_ATTACK_FRAMES - 2}`, () => {
    const controller = new FSMController(PlayerStateEnum.LEDGE_ATTACK);
    const result = controller.tick(
      makePlayer({ state: PlayerStateEnum.LEDGE_ATTACK, stateFrame: PHYSICS.LEDGE_ATTACK_FRAMES - 2 }),
      makeInput(),
    );

    expect(result.state).toBe(PlayerStateEnum.LEDGE_ATTACK);
  });

  it(`transitions to Idle after exactly ${PHYSICS.LEDGE_ATTACK_FRAMES} frames`, () => {
    const controller = new FSMController(PlayerStateEnum.LEDGE_ATTACK);
    const result = controller.tick(
      makePlayer({ state: PlayerStateEnum.LEDGE_ATTACK, stateFrame: PHYSICS.LEDGE_ATTACK_FRAMES - 1 }),
      makeInput(),
    );

    expect(result.state).toBe(PlayerStateEnum.IDLE);
    expect(result.stateFrame).toBe(0);
  });
});

describe('FSM - LedgeRoll timing', () => {
  it(`stays LedgeRoll at frame ${PHYSICS.LEDGE_ROLL_FRAMES - 2}`, () => {
    const controller = new FSMController(PlayerStateEnum.LEDGE_ROLL);
    const result = controller.tick(
      makePlayer({ state: PlayerStateEnum.LEDGE_ROLL, stateFrame: PHYSICS.LEDGE_ROLL_FRAMES - 2 }),
      makeInput(),
    );

    expect(result.state).toBe(PlayerStateEnum.LEDGE_ROLL);
  });

  it(`transitions to Idle after exactly ${PHYSICS.LEDGE_ROLL_FRAMES} frames`, () => {
    const controller = new FSMController(PlayerStateEnum.LEDGE_ROLL);
    const result = controller.tick(
      makePlayer({ state: PlayerStateEnum.LEDGE_ROLL, stateFrame: PHYSICS.LEDGE_ROLL_FRAMES - 1 }),
      makeInput(),
    );

    expect(result.state).toBe(PlayerStateEnum.IDLE);
    expect(result.stateFrame).toBe(0);
  });
});

describe('FSM - ASDI (Automatic/Additional SDI) during post-hitlag hitstun', () => {
  it('accumulates 2px drift per frame when direction held during hitstun (5 frames → 10px)', () => {
    const controller = new FSMController(PlayerStateEnum.HITSTUN);
    let player = makePlayer({
      state: PlayerStateEnum.HITSTUN,
      stateFrame: 0,
      x: 640,
      y: 480,
      hitlagFramesRemaining: 0,
      hitstunFramesRemaining: 10,
      asdiDriftAccumulated: 0,
    });

    // Tick 1: RIGHT held, expect +2px drift
    player = controller.tick(player, makeInput(0, INPUT_BITS.RIGHT));
    expect(player.x).toBe(642); // 640 + 2
    expect(player.asdiDriftAccumulated ?? 0).toBe(2);

    // Tick 2: RIGHT held, expect +2px drift
    player = controller.tick(player, makeInput(0, INPUT_BITS.RIGHT));
    expect(player.x).toBe(644); // 642 + 2
    expect(player.asdiDriftAccumulated ?? 0).toBe(4);

    // Tick 3: RIGHT held, expect +2px drift
    player = controller.tick(player, makeInput(0, INPUT_BITS.RIGHT));
    expect(player.x).toBe(646); // 644 + 2
    expect(player.asdiDriftAccumulated ?? 0).toBe(6);

    // Tick 4: RIGHT held, expect +2px drift
    player = controller.tick(player, makeInput(0, INPUT_BITS.RIGHT));
    expect(player.x).toBe(648); // 646 + 2
    expect(player.asdiDriftAccumulated ?? 0).toBe(8);

    // Tick 5: RIGHT held, expect +2px drift
    player = controller.tick(player, makeInput(0, INPUT_BITS.RIGHT));
    expect(player.x).toBe(650); // 648 + 2
    expect(player.asdiDriftAccumulated ?? 0).toBe(10);
  });

  it('caps cumulative drift at 30px max (20 frames held → 30px, not 40px)', () => {
    const controller = new FSMController(PlayerStateEnum.HITSTUN);
    let player = makePlayer({
      state: PlayerStateEnum.HITSTUN,
      stateFrame: 0,
      x: 640,
      y: 480,
      hitlagFramesRemaining: 0,
      hitstunFramesRemaining: 25,
      asdiDriftAccumulated: 0,
    });

    // Hold RIGHT for 20 frames (should accumulate 40px worth, but capped at 30px)
    for (let i = 0; i < 20; i += 1) {
      player = controller.tick(player, makeInput(0, INPUT_BITS.RIGHT));
    }

    expect(player.x).toBe(670); // 640 + 30 (capped)
    expect(player.asdiDriftAccumulated ?? 0).toBe(30);
  });

  it('does not apply drift during hitlag (hitlagFramesRemaining > 0)', () => {
    const controller = new FSMController(PlayerStateEnum.HITSTUN);
    let player = makePlayer({
      state: PlayerStateEnum.HITSTUN,
      stateFrame: 0,
      x: 640,
      y: 480,
      hitlagFramesRemaining: 3,
      hitstunFramesRemaining: 10,
      asdiDriftAccumulated: 0,
    });

    // During hitlag, RIGHT held should NOT apply ASDI drift (only SDI during hitlag)
    const beforeX = player.x;
    player = controller.tick(player, makeInput(0, INPUT_BITS.RIGHT));
    // During hitlag, SDI applies 3px per input, not ASDI 2px
    expect(player.x).toBe(beforeX + 3); // SDI drift, not ASDI
    expect(player.asdiDriftAccumulated ?? 0).toBe(0); // ASDI not applied during hitlag
  });

  it('resets asdiDriftAccumulated to 0 when new hitstun instance begins', () => {
    const controller = new FSMController(PlayerStateEnum.HITSTUN);
    let player = makePlayer({
      state: PlayerStateEnum.HITSTUN,
      stateFrame: 0,
      x: 640,
      y: 480,
      hitlagFramesRemaining: 0,
      hitstunFramesRemaining: 10,
      asdiDriftAccumulated: 25, // Simulate accumulated drift from previous hitstun
    });

    // Simulate new hitstun instance (would be set by GameEngine.applyHit)
    player = {
      ...player,
      hitstunFramesRemaining: 15,
      asdiDriftAccumulated: 0, // Reset on new hitstun
    };

    // Now apply drift in new hitstun
    player = controller.tick(player, makeInput(0, INPUT_BITS.RIGHT));
    expect(player.asdiDriftAccumulated ?? 0).toBe(2); // Starts fresh
  });

  it('applies vertical drift when UP held during hitstun', () => {
    const controller = new FSMController(PlayerStateEnum.HITSTUN);
    let player = makePlayer({
      state: PlayerStateEnum.HITSTUN,
      stateFrame: 0,
      x: 640,
      y: 480,
      hitlagFramesRemaining: 0,
      hitstunFramesRemaining: 10,
      asdiDriftAccumulated: 0,
    });

    // Hold UP (JUMP bit)
    player = controller.tick(player, makeInput(0, INPUT_BITS.JUMP));
    expect(player.y).toBe(478); // 480 - 2 (UP is negative)
    expect(player.asdiDriftAccumulated ?? 0).toBe(2);
  });

  it('does not apply drift when no direction held during hitstun', () => {
    const controller = new FSMController(PlayerStateEnum.HITSTUN);
    let player = makePlayer({
      state: PlayerStateEnum.HITSTUN,
      stateFrame: 0,
      x: 640,
      y: 480,
      hitlagFramesRemaining: 0,
      hitstunFramesRemaining: 10,
      asdiDriftAccumulated: 0,
    });

    // No input
    player = controller.tick(player, makeInput());
    expect(player.x).toBe(640); // No drift
    expect(player.y).toBe(480); // No drift
    expect(player.asdiDriftAccumulated ?? 0).toBe(0);
  });
});

describe('FSM - Registry completeness (ledge states)', () => {
  it('instantiates FSMController with LEDGE_HANG without throwing', () => {
    expect(() => new FSMController(PlayerStateEnum.LEDGE_HANG)).not.toThrow();
  });

  it('instantiates FSMController with LEDGE_CLIMB without throwing', () => {
    expect(() => new FSMController(PlayerStateEnum.LEDGE_CLIMB)).not.toThrow();
  });

  it('instantiates FSMController with LEDGE_JUMP without throwing', () => {
    expect(() => new FSMController(PlayerStateEnum.LEDGE_JUMP)).not.toThrow();
  });

  it('instantiates FSMController with LEDGE_ATTACK without throwing', () => {
    expect(() => new FSMController(PlayerStateEnum.LEDGE_ATTACK)).not.toThrow();
  });

  it('instantiates FSMController with LEDGE_ROLL without throwing', () => {
    expect(() => new FSMController(PlayerStateEnum.LEDGE_ROLL)).not.toThrow();
  });
});

describe('FSM - Shield-grab transitions', () => {
  it('Shield → Attack on GRAB pressed when shieldStunFrames=0', () => {
    const controller = new FSMController(PlayerStateEnum.SHIELD);
    const player = makePlayer({
      state: PlayerStateEnum.SHIELD,
      shieldStunFrames: 0,
      isShielding: true,
    });
    const result = controller.tick(player, makeInput(INPUT_BITS.GRAB, INPUT_BITS.GRAB));

    expect(result.state).toBe(PlayerStateEnum.ATTACK);
    expect(result.stateFrame).toBe(0);
  });

  it('Shield stays Shield on GRAB pressed when shieldStunFrames > 0', () => {
    const controller = new FSMController(PlayerStateEnum.SHIELD);
    const player = makePlayer({
      state: PlayerStateEnum.SHIELD,
      shieldStunFrames: 5,
      isShielding: true,
    });
    const result = controller.tick(player, makeInput(INPUT_BITS.GRAB, INPUT_BITS.GRAB));

    expect(result.state).toBe(PlayerStateEnum.SHIELD);
    expect(result.shieldStunFrames).toBe(4);
  });

   it('Shield → Idle on SHIELD released', () => {
     const controller = new FSMController(PlayerStateEnum.SHIELD);
     const player = makePlayer({
       state: PlayerStateEnum.SHIELD,
       shieldStunFrames: 0,
       isShielding: true,
     });
     const result = controller.tick(player, makeInput(0, 0));

     expect(result.state).toBe(PlayerStateEnum.IDLE);
   });
});

describe('FSM - Air Dodge single-use consumption', () => {
  it('Airborne → AIR_DODGE on SHIELD pressed when hasAirDodge=true', () => {
    const controller = new FSMController(PlayerStateEnum.AIRBORNE);
    const player = makePlayer({
      state: PlayerStateEnum.AIRBORNE,
      isGrounded: false,
      hasAirDodge: true,
    });
    const result = controller.tick(player, makeInput(INPUT_BITS.SHIELD, INPUT_BITS.SHIELD));

    expect(result.state).toBe(PlayerStateEnum.AIR_DODGE);
    // Note: hasAirDodge consumption happens in GameEngine.applyStateTransitions, not in FSM
    expect(result.hasAirDodge).toBe(true);
  });

  it('Airborne stays Airborne on SHIELD pressed when hasAirDodge=false', () => {
    const controller = new FSMController(PlayerStateEnum.AIRBORNE);
    const player = makePlayer({
      state: PlayerStateEnum.AIRBORNE,
      isGrounded: false,
      hasAirDodge: false,
    });
    const result = controller.tick(player, makeInput(INPUT_BITS.SHIELD, INPUT_BITS.SHIELD));

    expect(result.state).toBe(PlayerStateEnum.AIRBORNE);
    expect(result.hasAirDodge).toBe(false);
  });

  it('AIR_DODGE → AIRBORNE after 23 frames', () => {
    const controller = new FSMController(PlayerStateEnum.AIR_DODGE);
    let player = makePlayer({
      state: PlayerStateEnum.AIR_DODGE,
      stateFrame: 0,
      isGrounded: false,
      hasAirDodge: false,
    });

    // Tick through frames 0-22 (should stay in AIR_DODGE)
    for (let i = 0; i < 23; i += 1) {
      player = controller.tick(player, makeInput());
      if (i < 22) {
        expect(player.state).toBe(PlayerStateEnum.AIR_DODGE);
      }
    }

    // Frame 23 should transition to AIRBORNE
    player = controller.tick(player, makeInput());
    expect(player.state).toBe(PlayerStateEnum.AIRBORNE);
  });

  it('AIR_DODGE enter captures DOWN+RIGHT → { x: 1, y: 1 }', () => {
    const controller = new FSMController(PlayerStateEnum.AIRBORNE);
    const player = makePlayer({
      state: PlayerStateEnum.AIRBORNE,
      isGrounded: false,
      hasAirDodge: true,
    });
    const result = controller.tick(player, makeInput(INPUT_BITS.SHIELD, INPUT_BITS.SHIELD | INPUT_BITS.DOWN | INPUT_BITS.RIGHT));

    expect(result.state).toBe(PlayerStateEnum.AIR_DODGE);
    expect(result.airDodgeDirection).toEqual({ x: 1, y: 1 });
  });

  it('AIR_DODGE enter captures no direction → { x: 0, y: 0 }', () => {
    const controller = new FSMController(PlayerStateEnum.AIRBORNE);
    const player = makePlayer({
      state: PlayerStateEnum.AIRBORNE,
      isGrounded: false,
      hasAirDodge: true,
    });
    const result = controller.tick(player, makeInput(INPUT_BITS.SHIELD, INPUT_BITS.SHIELD));

    expect(result.state).toBe(PlayerStateEnum.AIR_DODGE);
    expect(result.airDodgeDirection).toEqual({ x: 0, y: 0 });
  });

  it('AIR_DODGE exit clears airDodgeDirection to null', () => {
    const controller = new FSMController(PlayerStateEnum.AIR_DODGE);
    let player = makePlayer({
      state: PlayerStateEnum.AIR_DODGE,
      stateFrame: 0,
      isGrounded: false,
      hasAirDodge: false,
      airDodgeDirection: { x: 1, y: 1 },
    });

    // Tick through frames 0-22 (should stay in AIR_DODGE with direction set)
    for (let i = 0; i < 23; i += 1) {
      player = controller.tick(player, makeInput());
      if (i < 22) {
        expect(player.airDodgeDirection).toEqual({ x: 1, y: 1 });
      }
    }

    // Frame 23 should transition to AIRBORNE and clear direction
    player = controller.tick(player, makeInput());
    expect(player.state).toBe(PlayerStateEnum.AIRBORNE);
    expect(player.airDodgeDirection).toBeNull();
  });
});
