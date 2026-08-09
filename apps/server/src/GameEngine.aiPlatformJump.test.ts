import { describe, expect, it } from 'vitest';
import { createBotMemory, decideBotInput, type BotMemory } from '@smash/engine';
import {
  BOT_DIFFICULTY_PRESETS,
  INPUT_BITS,
  PHYSICS,
  PlayerStateEnum,
  STAGE,
  type GameState,
  type InputBitmask,
  type InputEvent,
  type PlayerId,
  type PlayerState,
} from '@smash/shared';
import { GameEngine } from './GameEngine.js';

interface BotDifficultyConfig {
  reactionDelayFrames: number;
  decisionQuality: number;
  executionErrorRate: number;
}

function getMutableState(engine: GameEngine): GameState {
  return (engine as unknown as { state: GameState }).state;
}

function primePlayer(
  engine: GameEngine,
  playerId: PlayerId,
  overrides: Partial<PlayerState>
): void {
  const state = getMutableState(engine);
  const player = state.players[playerId];

  if (!player) {
    throw new Error(`Unknown player: ${playerId}`);
  }

  state.players[playerId] = {
    ...player,
    ...overrides,
  };
}

function makeInputEvent(
  playerId: PlayerId,
  tick: number,
  seq: number,
  held: InputBitmask,
  pressed: InputBitmask,
  released: InputBitmask
): InputEvent {
  return {
    playerId,
    tick,
    seq,
    held,
    pressed,
    released,
  };
}

function computeAiInputEvent(
  state: GameState,
  botPlayerId: PlayerId,
  opponentPlayerId: PlayerId,
  difficulty: BotDifficultyConfig,
  memory: BotMemory,
  lastHeld: InputBitmask,
  tick: number
): { event: InputEvent | null; nextMemory: BotMemory; nextLastHeld: InputBitmask } {
  const { bits, memory: nextMemory } = decideBotInput(
    state,
    botPlayerId,
    opponentPlayerId,
    difficulty,
    memory
  );

  const held = bits;
  const pressed = held & ~lastHeld;
  const released = lastHeld & ~held;
  const nextLastHeld = held;

  if (held === 0 && pressed === 0 && released === 0) {
    return { event: null, nextMemory, nextLastHeld };
  }

  return {
    event: makeInputEvent(botPlayerId, tick, tick, held, pressed, released),
    nextMemory,
    nextLastHeld,
  };
}

describe('GameEngine AI platform jump integration', () => {
  it('reaches JUMPSQUAT and ascends toward platform when opponent is grounded above', () => {
    const botId: PlayerId = 'bot';
    const opponentId: PlayerId = 'opponent';
    const engine = new GameEngine({ playerIds: [botId, opponentId] });

    const leftPlatform = STAGE.PLATFORMS[0];
    if (!leftPlatform) {
      throw new Error('Expected left platform to exist');
    }

    primePlayer(engine, botId, {
      x: leftPlatform.x + 40,
      y: STAGE.MAIN_PLATFORM.y - PHYSICS.HURTBOX_RADIUS,
      vx: 0,
      vy: 0,
      state: PlayerStateEnum.IDLE,
      stateFrame: 0,
      isGrounded: true,
      hitlagFramesRemaining: 0,
      hitstunFramesRemaining: 0,
      respawnTimer: 0,
      ledgeId: null,
    });

    primePlayer(engine, opponentId, {
      x: leftPlatform.x + 100,
      y: leftPlatform.y - PHYSICS.HURTBOX_RADIUS,
      vx: 0,
      vy: 0,
      state: PlayerStateEnum.IDLE,
      stateFrame: 0,
      isGrounded: true,
      hitlagFramesRemaining: 0,
      hitstunFramesRemaining: 0,
      respawnTimer: 0,
      ledgeId: null,
    });

    const difficulty: BotDifficultyConfig = {
      ...BOT_DIFFICULTY_PRESETS.hard,
      executionErrorRate: 0,
    };

    let memory = createBotMemory(1337);
    let lastHeld: InputBitmask = 0;
    let sawJumpSquat = false;
    let minY = getMutableState(engine).players[botId]?.y ?? 0;
    const startY = minY;

    for (let tick = 1; tick <= 180; tick += 1) {
      const state = getMutableState(engine);
      const aiInput = computeAiInputEvent(
        state,
        botId,
        opponentId,
        difficulty,
        memory,
        lastHeld,
        tick
      );

      memory = aiInput.nextMemory;
      lastHeld = aiInput.nextLastHeld;

      const inputMap = new Map<PlayerId, InputEvent | null>();
      inputMap.set(botId, aiInput.event);
      inputMap.set(opponentId, null);

      const nextState = engine.tickGame(inputMap);
      const bot = nextState.players[botId];
      if (!bot) {
        throw new Error('Expected bot player to exist');
      }

      if (bot.state === PlayerStateEnum.JUMPSQUAT) {
        sawJumpSquat = true;
      }

      if (bot.y < minY) {
        minY = bot.y;
      }
    }

    expect(sawJumpSquat).toBe(true);
    expect(minY).toBeLessThan(startY);
  });
});
