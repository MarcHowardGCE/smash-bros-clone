import { describe, expect, it } from 'vitest';
import {
  BOT_DIFFICULTY_PRESETS,
  INPUT_BITS,
  MoveId,
  PlayerStateEnum,
  type GameState,
  type PlayerState,
} from '@smash/shared';
import { createBotMemory, decideBotInput, selectTarget, type BotMemory } from './botAI.js';

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

function createStateWithPlayers(players: PlayerState[]): GameState {
  return {
    tick: 0,
    players: Object.fromEntries(players.map((player) => [player.id, player])),
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

  it('edge-guard offense: high-quality aggressive roll jumps from IDLE with jump-only input', () => {
    const self = createPlayerFixture({
      id: 'bot',
      state: PlayerStateEnum.IDLE,
      x: 640,
      y: 500,
      isGrounded: true,
    });
    const opponent = createPlayerFixture({
      id: 'opponent',
      x: 100,
      y: 600,
      state: PlayerStateEnum.AIRBORNE,
      isGrounded: false,
      respawnTimer: 60,
    });
    const state = createState(self, opponent);

    const result = decideBotInput(
      state,
      'bot',
      'opponent',
      { ...BOT_DIFFICULTY_PRESETS.hard, executionErrorRate: 0 },
      createBotMemory(0)
    );

    expect(result.bits).toBe(INPUT_BITS.JUMP);
  });

  it('edge-guard offense: high-quality aggressive roll jumps from RUN with direction|jump input', () => {
    const self = createPlayerFixture({
      id: 'bot',
      state: PlayerStateEnum.RUN,
      x: 640,
      y: 500,
      isGrounded: true,
    });
    const opponent = createPlayerFixture({
      id: 'opponent',
      x: 100,
      y: 600,
      state: PlayerStateEnum.AIRBORNE,
      isGrounded: false,
      respawnTimer: 60,
    });
    const state = createState(self, opponent);

    const result = decideBotInput(
      state,
      'bot',
      'opponent',
      { ...BOT_DIFFICULTY_PRESETS.hard, executionErrorRate: 0 },
      createBotMemory(0)
    );

    expect(result.bits).toBe(INPUT_BITS.LEFT | INPUT_BITS.JUMP);
  });

  it('edge-guard offense: passive roll walks to ledge with direction-only input', () => {
    const self = createPlayerFixture({
      id: 'bot',
      state: PlayerStateEnum.RUN,
      x: 640,
      y: 500,
      isGrounded: true,
    });
    const opponent = createPlayerFixture({
      id: 'opponent',
      x: 100,
      y: 600,
      state: PlayerStateEnum.AIRBORNE,
      isGrounded: false,
      respawnTimer: 60,
    });
    const state = createState(self, opponent);

    const result = decideBotInput(
      state,
      'bot',
      'opponent',
      { ...BOT_DIFFICULTY_PRESETS.hard, executionErrorRate: 0 },
      createBotMemory(4)
    );

    expect(result.bits).toBe(INPUT_BITS.LEFT);
  });

  it('edge-guard offense safety gate: airborne self does not trigger jump while opponent is off-stage', () => {
    const self = createPlayerFixture({
      id: 'bot',
      state: PlayerStateEnum.AIRBORNE,
      x: 640,
      y: 480,
      isGrounded: false,
    });
    const opponent = createPlayerFixture({
      id: 'opponent',
      x: 100,
      y: 600,
      state: PlayerStateEnum.AIRBORNE,
      isGrounded: false,
      respawnTimer: 60,
    });
    const state = createState(self, opponent);

    const result = decideBotInput(
      state,
      'bot',
      'opponent',
      { ...BOT_DIFFICULTY_PRESETS.hard, executionErrorRate: 0 },
      createBotMemory(0)
    );

    expect((result.bits & INPUT_BITS.JUMP) !== 0).toBe(false);
  });

  it('approaches opponent when no higher-priority rule matches (rule 6)', () => {
    const self = createPlayerFixture({ id: 'bot', x: 640, y: 400 });
    const opponent = createPlayerFixture({ id: 'opponent', x: 900, y: 400, respawnTimer: 60 });
    const state = createState(self, opponent);

    const result = decideBotInput(
      state,
      'bot',
      'opponent',
      { ...BOT_DIFFICULTY_PRESETS.medium, executionErrorRate: 0 },
      createBotMemory(10)
    );

    expect(result.bits).toBe(INPUT_BITS.RIGHT);
    expect((result.bits & INPUT_BITS.JUMP) !== 0).toBe(false);
  });

  it('platform jump: IDLE state outputs jump only when opponent is 150px above and reachable', () => {
    const self = createPlayerFixture({
      id: 'bot',
      state: PlayerStateEnum.IDLE,
      x: 640,
      y: 500,
      isGrounded: true,
    });
    const opponent = createPlayerFixture({
      id: 'opponent',
      x: 700,
      y: 350,
      isGrounded: true,
      respawnTimer: 60,
    });
    const state = createState(self, opponent);

    const result = decideBotInput(
      state,
      'bot',
      'opponent',
      { ...BOT_DIFFICULTY_PRESETS.hard, executionErrorRate: 0 },
      createBotMemory(22)
    );

    expect(result.bits).toBe(INPUT_BITS.JUMP);
  });

  it('platform jump: RUN state outputs direction|jump when opponent is 150px above and reachable', () => {
    const self = createPlayerFixture({
      id: 'bot',
      state: PlayerStateEnum.RUN,
      x: 640,
      y: 500,
      isGrounded: true,
    });
    const opponent = createPlayerFixture({
      id: 'opponent',
      x: 700,
      y: 350,
      isGrounded: true,
      respawnTimer: 60,
    });
    const state = createState(self, opponent);

    const result = decideBotInput(
      state,
      'bot',
      'opponent',
      { ...BOT_DIFFICULTY_PRESETS.hard, executionErrorRate: 0 },
      createBotMemory(23)
    );

    expect(result.bits).toBe(INPUT_BITS.RIGHT | INPUT_BITS.JUMP);
  });

  it('platform jump: flat ground does not jump and keeps normal approach direction', () => {
    const self = createPlayerFixture({
      id: 'bot',
      state: PlayerStateEnum.IDLE,
      x: 640,
      y: 500,
      isGrounded: true,
    });
    const opponent = createPlayerFixture({
      id: 'opponent',
      x: 900,
      y: 500,
      isGrounded: true,
      respawnTimer: 60,
    });
    const state = createState(self, opponent);

    const result = decideBotInput(
      state,
      'bot',
      'opponent',
      { ...BOT_DIFFICULTY_PRESETS.hard, executionErrorRate: 0 },
      createBotMemory(24)
    );

    expect(result.bits).toBe(INPUT_BITS.RIGHT);
  });

  it('platform jump: airborne opponent above does not trigger jump', () => {
    const self = createPlayerFixture({
      id: 'bot',
      state: PlayerStateEnum.IDLE,
      x: 640,
      y: 500,
      isGrounded: true,
    });
    const opponent = createPlayerFixture({
      id: 'opponent',
      x: 900,
      y: 350,
      isGrounded: false,
      respawnTimer: 60,
    });
    const state = createState(self, opponent);

    const result = decideBotInput(
      state,
      'bot',
      'opponent',
      { ...BOT_DIFFICULTY_PRESETS.hard, executionErrorRate: 0 },
      createBotMemory(25)
    );

    expect(result.bits).toBe(INPUT_BITS.RIGHT);
  });

  it('platform jump: opponent only 77px above does not trigger jump', () => {
    const self = createPlayerFixture({
      id: 'bot',
      state: PlayerStateEnum.IDLE,
      x: 640,
      y: 500,
      isGrounded: true,
    });
    const opponent = createPlayerFixture({
      id: 'opponent',
      x: 900,
      y: 423,
      isGrounded: true,
      respawnTimer: 60,
    });
    const state = createState(self, opponent);

    const result = decideBotInput(
      state,
      'bot',
      'opponent',
      { ...BOT_DIFFICULTY_PRESETS.hard, executionErrorRate: 0 },
      createBotMemory(26)
    );

    expect(result.bits).toBe(INPUT_BITS.RIGHT);
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

describe('selectTarget', () => {
  it('selects nearest alive candidate when other factors are equal', () => {
    const bot = createPlayerFixture({ id: 'bot', x: 640, y: 400 });
    const near = createPlayerFixture({ id: 'p1', x: 660, y: 400, percent: 0, stocks: 3 });
    const mid = createPlayerFixture({ id: 'p2', x: 760, y: 400, percent: 0, stocks: 3 });
    const far = createPlayerFixture({ id: 'p3', x: 940, y: 400, percent: 0, stocks: 3 });

    const state = createStateWithPlayers([bot, near, mid, far]);

    expect(selectTarget(state, 'bot', ['p1', 'p2', 'p3'], 3)).toBe('p1');
  });

  it('prefers threatening candidate over slightly nearer non-threatening candidate', () => {
    const bot = createPlayerFixture({ id: 'bot', x: 640, y: 400 });
    const nearNonThreat = createPlayerFixture({
      id: 'p1',
      x: 660,
      y: 400,
      percent: 10,
      stocks: 3,
      currentMoveId: null,
      activeHitbox: null,
    });
    const threat = createPlayerFixture({
      id: 'p2',
      x: 700,
      y: 400,
      percent: 10,
      stocks: 3,
      currentMoveId: MoveId.JAB,
      stateFrame: 10,
      activeHitbox: makeHitbox(),
    });

    const state = createStateWithPlayers([bot, nearNonThreat, threat]);

    expect(selectTarget(state, 'bot', ['p1', 'p2'], 3)).toBe('p2');
  });

  it('ignores knocked-out or respawning candidates even if they are nearest', () => {
    const bot = createPlayerFixture({ id: 'bot', x: 640, y: 400 });
    const nearestRespawning = createPlayerFixture({
      id: 'p1',
      x: 645,
      y: 400,
      isKnockedOut: false,
      respawnTimer: 120,
    });
    const nearestKnockedOut = createPlayerFixture({
      id: 'p2',
      x: 650,
      y: 400,
      isKnockedOut: true,
      respawnTimer: 0,
    });
    const aliveFarther = createPlayerFixture({
      id: 'p3',
      x: 760,
      y: 400,
      isKnockedOut: false,
      respawnTimer: 0,
    });

    const state = createStateWithPlayers([bot, nearestRespawning, nearestKnockedOut, aliveFarther]);

    expect(selectTarget(state, 'bot', ['p1', 'p2', 'p3'], 3)).toBe('p3');
  });

  it('returns null when no alive candidates exist', () => {
    const bot = createPlayerFixture({ id: 'bot', x: 640, y: 400 });
    const downed = createPlayerFixture({ id: 'p1', isKnockedOut: true, respawnTimer: 60 });
    const state = createStateWithPlayers([bot, downed]);

    expect(selectTarget(state, 'bot', [], 3)).toBeNull();
    expect(selectTarget(state, 'bot', ['p1'], 3)).toBeNull();
  });

  it('is deterministic for identical input state and candidates', () => {
    const bot = createPlayerFixture({ id: 'bot', x: 640, y: 400 });
    const a = createPlayerFixture({ id: 'p1', x: 740, y: 400, percent: 20, stocks: 2 });
    const b = createPlayerFixture({ id: 'p2', x: 740, y: 400, percent: 20, stocks: 2 });
    const state = createStateWithPlayers([bot, a, b]);

    const resultA = selectTarget(state, 'bot', ['p1', 'p2'], 3);
    const resultB = selectTarget(state, 'bot', ['p1', 'p2'], 3);

    expect(resultA).toBe(resultB);
  });
});
