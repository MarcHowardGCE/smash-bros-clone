/**
 * @fileoverview CPU/AI player controller for local offline matches.
 *
 * Implements {@link ITickController} using the engine's `decideBotInput` /
 * `selectTarget` functions. Each frame, {@link AIPlayerController.pollInput}
 * runs the bot decision loop against the last observed {@link GameState} and
 * returns an {@link InputEvent} that {@link LocalMatch} feeds to the engine.
 *
 * Difficulty is parameterized via {@link BotDifficulty}: Easy reacts slowly
 * with high execution error; Hard reacts quickly with near-perfect execution.
 */
import type { InputEvent, PlayerId, GameState, BotDifficulty, InputBitmask } from '@smash/shared';
import { BOT_DIFFICULTY_PRESETS, INPUT_BITS } from '@smash/shared';
import { decideBotInput, createBotMemory, selectTarget, type BotMemory } from '@smash/engine';
import type { ITickController } from './types.js';

/** Configuration for an AI-controlled player slot. */
export interface AIPlayerControllerConfig {
  playerId: PlayerId;
  slotIndex: number;
  opponentPlayerIds: PlayerId[];
  difficulty: BotDifficulty;
  seed: number;
}

/**
 * CPU player controller driven by the engine's bot AI.
 *
 * Observe game state each tick via {@link observe}, then call
 * {@link pollInput} to get the bot's next input decision.
 */
export class AIPlayerController implements ITickController {
  readonly playerId: PlayerId;
  readonly slotIndex: number;
  private readonly opponentPlayerIds: PlayerId[];
  private readonly difficultyConfig: {
    reactionDelayFrames: number;
    decisionQuality: number;
    executionErrorRate: number;
  };
  private botMemory: BotMemory;
  private lastHeld: InputBitmask = 0;
  private seqCounter = 0;
  private latestState: GameState | null = null;

  /**
   * Create an AI player controller.
   *
   * @param config - Bot configuration including player ID, slot, opponents, difficulty, and RNG seed
   */
  constructor(config: AIPlayerControllerConfig) {
    this.playerId = config.playerId;
    this.slotIndex = config.slotIndex;
    this.opponentPlayerIds = config.opponentPlayerIds;
    this.difficultyConfig = BOT_DIFFICULTY_PRESETS[config.difficulty];
    this.botMemory = createBotMemory(config.seed);
  }

  /**
   * Feed the latest game state to the bot. Called by {@link LocalMatch} after each engine tick.
   *
   * @param state - Full game state from the engine tick
   */
  observe(state: GameState): void {
    this.latestState = state;
  }

  pollInput(): InputEvent | null {
    if (this.latestState === null) {
      return null;
    }

    const targetId = selectTarget(
      this.latestState,
      this.playerId,
      this.opponentPlayerIds,
      this.difficultyConfig.reactionDelayFrames
    );

    if (targetId === null) {
      return null;
    }

    const { bits, memory } = decideBotInput(
      this.latestState,
      this.playerId,
      targetId,
      this.difficultyConfig,
      this.botMemory
    );
    this.botMemory = memory;

    // Compute pressed/released from bits and lastHeld (same logic as InputManager.ts:92-93)
    const held = bits;
    const prev = this.lastHeld;

    const pressed = held & ~prev;   // newly pressed this frame
    const released = prev & ~held;  // newly released this frame

    // Update lastHeld with new bits
    this.lastHeld = held;

    // Only emit event if something changed OR if we're holding keys
    if (held === 0 && pressed === 0 && released === 0) return null;

    const event: InputEvent = {
      tick: 0, // AIPlayerController doesn't track ticks; server will assign
      seq: this.seqCounter++,
      playerId: this.playerId,
      held,
      pressed,
      released,
    };

    return event;
  }

  setTick(tick: number): void {
    // no-op
  }

  destroy(): void {
    // no-op
  }
}
