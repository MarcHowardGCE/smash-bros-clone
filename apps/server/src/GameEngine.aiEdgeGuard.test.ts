import { describe, expect, it } from 'vitest';
import { createBotMemory, decideBotInput, type BotMemory } from '@smash/engine';
import {
  BOT_DIFFICULTY_PRESETS,
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

describe('GameEngine AI edge-guard integration', () => {
  it('jumps to edge-guard off-stage opponent and survives while victim is KOd', () => {
    const guardId: PlayerId = 'guard';
    const victimId: PlayerId = 'victim';
    const engine = new GameEngine({ playerIds: [guardId, victimId] });

    const mainPlatform = STAGE.MAIN_PLATFORM;
    primePlayer(engine, guardId, {
      x: mainPlatform.x + mainPlatform.width - 30,
      y: mainPlatform.y - PHYSICS.HURTBOX_RADIUS,
      vx: 6.5,
      vy: 0,
      facing: 1,
      state: PlayerStateEnum.RUN,
      stateFrame: 5,
      isGrounded: true,
      hitlagFramesRemaining: 0,
      hitstunFramesRemaining: 0,
      respawnTimer: 0,
      ledgeId: null,
      isKnockedOut: false,
      stocks: 3,
    });

    primePlayer(engine, victimId, {
      x: STAGE.BLAST_RIGHT - 10,
      y: STAGE.BLAST_BOTTOM - 10,
      vx: 2,
      vy: 5,
      facing: -1,
      state: PlayerStateEnum.AIRBORNE,
      stateFrame: 12,
      isGrounded: false,
      hasDoubleJump: false,
      hasAirDodge: false,
      hitlagFramesRemaining: 0,
      hitstunFramesRemaining: 0,
      respawnTimer: 0,
      ledgeId: null,
      isKnockedOut: false,
      stocks: 3,
    });

    const difficulty: BotDifficultyConfig = {
      ...BOT_DIFFICULTY_PRESETS.hard,
      executionErrorRate: 0,
    };

    let memory = createBotMemory(0);
    let lastHeld: InputBitmask = 0;
    let sawJumpSquat = false;
    let sawVictimKnockedOut = false;

    for (let tick = 1; tick <= 180; tick += 1) {
      const state = getMutableState(engine);
      const aiInput = computeAiInputEvent(
        state,
        guardId,
        victimId,
        difficulty,
        memory,
        lastHeld,
        tick
      );

      memory = aiInput.nextMemory;
      lastHeld = aiInput.nextLastHeld;

      const inputMap = new Map<PlayerId, InputEvent | null>();
      inputMap.set(guardId, aiInput.event);
      inputMap.set(victimId, null);

      const nextState = engine.tickGame(inputMap);
      const guard = nextState.players[guardId];
      const victim = nextState.players[victimId];

      if (!guard || !victim) {
        throw new Error('Expected guard and victim players to exist');
      }

      if (guard.state === PlayerStateEnum.JUMPSQUAT) {
        sawJumpSquat = true;
      }

      if (victim.isKnockedOut) {
        sawVictimKnockedOut = true;
      }

      const koEvents = engine.getKOEvents();
      if (koEvents.some((event) => event.playerId === victimId)) {
        sawVictimKnockedOut = true;
      }
    }

    const finalState = getMutableState(engine);
    const guard = finalState.players[guardId];
    const victim = finalState.players[victimId];

    if (!guard || !victim) {
      throw new Error('Expected final guard and victim players to exist');
    }

    expect(sawJumpSquat).toBe(true);
    expect(sawVictimKnockedOut).toBe(true);
    expect(victim.stocks).toBeLessThan(3);
    expect(guard.stocks).toBe(3);
  });
});
