import { describe, expect, it } from 'vitest';
import {
  BOT_DIFFICULTY_PRESETS,
  INPUT_BITS,
  MoveId,
  type GameState,
  type PlayerState,
} from '@smash/shared';
import { createBotMemory, decideBotInput, type BotMemory } from './botAI.js';

function createPlayerFixture(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: 'player',
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

function createState(self: PlayerState, opponent: PlayerState): GameState {
  return {
    tick: 0,
    players: {
      [self.id]: self,
      [opponent.id]: opponent,
    },
    matchPhase: 'match',
    winnerId: null,
    ledges: {},
  };
}

function makeHitbox(): NonNullable<PlayerState['activeHitbox']> {
  return {
    offsetX: 0,
    offsetY: 0,
    radius: 20,
    damage: 3,
    baseKnockback: 2,
    knockbackGrowth: 30,
    knockbackAngle: 30,
    hitlagFrames: 3,
    priority: 1,
  };
}

describe('createBotMemory', () => {
  it('returns seed-backed rng state', () => {
    expect(createBotMemory(1234)).toEqual({ rngState: 1234 });
  });
});

describe('decideBotInput', () => {
  it('returns no input and unchanged memory during self hitstun (rule 1)', () => {
    const self = createPlayerFixture({ id: 'bot', hitstunFramesRemaining: 5 });
    const opponent = createPlayerFixture({ id: 'opponent' });
    const state = createState(self, opponent);
    const memory = createBotMemory(7);

    const result = decideBotInput(
      state,
      'bot',
      'opponent',
      BOT_DIFFICULTY_PRESETS.hard,
      memory
    );

    expect(result).toEqual({ bits: 0, memory });
  });

  it('returns no input and unchanged memory during self respawn (rule 1)', () => {
    const self = createPlayerFixture({ id: 'bot', respawnTimer: 60 });
    const opponent = createPlayerFixture({ id: 'opponent' });
    const state = createState(self, opponent);
    const memory = createBotMemory(7);

    const result = decideBotInput(
      state,
      'bot',
      'opponent',
      BOT_DIFFICULTY_PRESETS.hard,
      memory
    );

    expect(result).toEqual({ bits: 0, memory });
  });

  it('recovers toward center with jump when off-stage and double jump is available (rule 2)', () => {
    const self = createPlayerFixture({ id: 'bot', x: 100, y: 600, hasDoubleJump: true });
    const opponent = createPlayerFixture({ id: 'opponent' });
    const state = createState(self, opponent);

    const result = decideBotInput(
      state,
      'bot',
      'opponent',
      { ...BOT_DIFFICULTY_PRESETS.hard, executionErrorRate: 0 },
      createBotMemory(7)
    );

    expect((result.bits & INPUT_BITS.RIGHT) !== 0).toBe(true);
    expect((result.bits & INPUT_BITS.JUMP) !== 0).toBe(true);
  });

  it('recovers toward center with special when off-stage and no double jump (rule 2)', () => {
    const self = createPlayerFixture({ id: 'bot', x: 100, y: 600, hasDoubleJump: false });
    const opponent = createPlayerFixture({ id: 'opponent' });
    const state = createState(self, opponent);

    const result = decideBotInput(
      state,
      'bot',
      'opponent',
      { ...BOT_DIFFICULTY_PRESETS.hard, executionErrorRate: 0 },
      createBotMemory(7)
    );

    expect((result.bits & INPUT_BITS.RIGHT) !== 0).toBe(true);
    expect((result.bits & INPUT_BITS.SPECIAL) !== 0).toBe(true);
  });

  it('uses ledge climb directional mapping on high quality when roll falls into climb bucket (rule 3)', () => {
    const self = createPlayerFixture({ id: 'bot', x: 500, ledgeId: 'ledge-left' });
    const opponent = createPlayerFixture({ id: 'opponent' });
    const state = createState(self, opponent);

    const result = decideBotInput(
      state,
      'bot',
      'opponent',
      { ...BOT_DIFFICULTY_PRESETS.hard, executionErrorRate: 0 },
      createBotMemory(0)
    );

    expect(result.bits).toBe(INPUT_BITS.RIGHT);
  });

  it('uses ledge shield mapping when decision roll is in roll bucket (rule 3)', () => {
    const self = createPlayerFixture({ id: 'bot', x: 500, ledgeId: 'ledge-left' });
    const opponent = createPlayerFixture({ id: 'opponent' });
    const state = createState(self, opponent);

    const result = decideBotInput(
      state,
      'bot',
      'opponent',
      { ...BOT_DIFFICULTY_PRESETS.hard, executionErrorRate: 0 },
      createBotMemory(1)
    );

    expect(result.bits).toBe(INPUT_BITS.SHIELD);
  });

  it('uses ledge attack mapping when decision roll is in attack bucket (rule 3)', () => {
    const self = createPlayerFixture({ id: 'bot', x: 500, ledgeId: 'ledge-left' });
    const opponent = createPlayerFixture({ id: 'opponent' });
    const state = createState(self, opponent);

    const result = decideBotInput(
      state,
      'bot',
      'opponent',
      { ...BOT_DIFFICULTY_PRESETS.hard, executionErrorRate: 0 },
      createBotMemory(4)
    );

    expect(result.bits).toBe(INPUT_BITS.ATTACK);
  });

  it('shields when incoming threat reaches hard reaction delay and no fumble occurs (rule 4)', () => {
    const self = createPlayerFixture({ id: 'bot', x: 640, y: 400 });
    const opponent = createPlayerFixture({
      id: 'opponent',
      x: 700,
      y: 400,
      currentMoveId: MoveId.JAB,
      stateFrame: 6,
      activeHitbox: makeHitbox(),
    });
    const state = createState(self, opponent);

    const result = decideBotInput(
      state,
      'bot',
      'opponent',
      { ...BOT_DIFFICULTY_PRESETS.hard, executionErrorRate: 0 },
      createBotMemory(7)
    );

    expect((result.bits & INPUT_BITS.SHIELD) !== 0).toBe(true);
  });

  it('can choose punish grab branch for high quality when in punish window (rule 5)', () => {
    const self = createPlayerFixture({ id: 'bot' });
    const opponent = createPlayerFixture({
      id: 'opponent',
      currentMoveId: MoveId.JAB,
      stateFrame: 5,
      isInvincible: false,
    });
    const state = createState(self, opponent);

    const result = decideBotInput(
      state,
      'bot',
      'opponent',
      { ...BOT_DIFFICULTY_PRESETS.hard, executionErrorRate: 0 },
      createBotMemory(4)
    );

    expect(result.bits).toBe(INPUT_BITS.GRAB);
  });

  it('does not punish invincible opponent even in punish window', () => {
    const self = createPlayerFixture({ id: 'bot' });
    const opponent = createPlayerFixture({
      id: 'opponent',
      currentMoveId: MoveId.JAB,
      stateFrame: 5,
      isInvincible: true,
    });
    const state = createState(self, opponent);
    const memory = createBotMemory(12);

    const result = decideBotInput(
      state,
      'bot',
      'opponent',
      BOT_DIFFICULTY_PRESETS.hard,
      memory
    );

    expect(result).toEqual({ bits: 0, memory });
    expect(result.bits).not.toBe(INPUT_BITS.ATTACK);
  });

  it('returns neutral no-input with unchanged memory when no rule 2-5 matches (rule 6)', () => {
    const self = createPlayerFixture({ id: 'bot', x: 640, y: 400 });
    const opponent = createPlayerFixture({ id: 'opponent', respawnTimer: 60 });
    const state = createState(self, opponent);
    const memory = createBotMemory(10);

    const result = decideBotInput(
      state,
      'bot',
      'opponent',
      BOT_DIFFICULTY_PRESETS.medium,
      memory
    );

    expect(result).toEqual({ bits: 0, memory });
  });

  it('fumbles to neutral input when executionErrorRate is 1.0', () => {
    const self = createPlayerFixture({ id: 'bot' });
    const opponent = createPlayerFixture({
      id: 'opponent',
      currentMoveId: MoveId.JAB,
      stateFrame: 5,
      isInvincible: false,
    });
    const state = createState(self, opponent);

    const result = decideBotInput(
      state,
      'bot',
      'opponent',
      { ...BOT_DIFFICULTY_PRESETS.hard, executionErrorRate: 1 },
      createBotMemory(0)
    );

    expect(result.bits).toBe(0);
  });

  it('is deterministic for byte-identical input state and memory', () => {
    const self = createPlayerFixture({
      id: 'bot',
      x: 640,
      y: 400,
    });
    const opponent = createPlayerFixture({
      id: 'opponent',
      x: 700,
      y: 400,
      currentMoveId: MoveId.JAB,
      stateFrame: 6,
      activeHitbox: makeHitbox(),
    });
    const state = createState(self, opponent);
    const memory: BotMemory = { rngState: 7 };

    const resultA = decideBotInput(
      state,
      'bot',
      'opponent',
      BOT_DIFFICULTY_PRESETS.hard,
      memory
    );
    const resultB = decideBotInput(
      state,
      'bot',
      'opponent',
      BOT_DIFFICULTY_PRESETS.hard,
      memory
    );

    expect(resultA).toEqual(resultB);
  });
});
