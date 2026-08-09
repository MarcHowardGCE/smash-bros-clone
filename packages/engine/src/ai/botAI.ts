import {
  INPUT_BITS,
  PlayerStateEnum,
  STAGE,
  type GameState,
  type InputBitmask,
  type PlayerId,
} from '@smash/shared';
import * as sensors from './sensors.js';

export interface BotMemory {
  rngState: number;
}

export function createBotMemory(seed: number): BotMemory {
  return { rngState: seed };
}

function nextRandom(memory: BotMemory): { value: number; nextMemory: BotMemory } {
  const nextState = (memory.rngState + 0x6D2B79F5) | 0; // the persisted state advances by this constant every call
  let t = nextState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t = (t + Math.imul(t ^ (t >>> 7), t | 61)) ^ t;
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, nextMemory: { rngState: nextState } }; // persist nextState, NEVER the scrambled t
}

interface BotDifficultyConfig {
  reactionDelayFrames: number;
  decisionQuality: number;
  executionErrorRate: number;
}

const APPROACH_DEADZONE_X = 36;
const ATTACK_PRESSURE_RANGE_X = 90;

function applyExecutionError(
  intendedBits: InputBitmask,
  executionErrorRate: number,
  memory: BotMemory
): { bits: InputBitmask; memory: BotMemory } {
  const executionRoll = nextRandom(memory);
  if (executionRoll.value < executionErrorRate) {
    return { bits: 0, memory: executionRoll.nextMemory };
  }

  return { bits: intendedBits, memory: executionRoll.nextMemory };
}

function jumpInputForState(selfState: string, directionBits: InputBitmask): InputBitmask {
  return selfState === PlayerStateEnum.IDLE
    ? INPUT_BITS.JUMP
    : (directionBits | INPUT_BITS.JUMP);
}

export function selectTarget(
  state: GameState,
  botPlayerId: PlayerId,
  candidateIds: PlayerId[],
  reactionDelayFrames: number
): PlayerId | null {
  const self = state.players[botPlayerId];
  if (self === undefined) {
    throw new Error(`Bot player not found in GameState: ${botPlayerId}`);
  }

  let bestTargetId: PlayerId | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const candidateId of candidateIds) {
    const candidate = state.players[candidateId];
    if (
      candidate === undefined ||
      candidate.isKnockedOut ||
      candidate.respawnTimer > 0
    ) {
      continue;
    }

    const score =
      1000 / (1 + sensors.distanceBetween(self, candidate)) +
      (sensors.isThreatIncoming(self, candidate, reactionDelayFrames) ? 500 : 0) +
      candidate.percent * 0.5 -
      candidate.stocks * 20;

    if (
      score > bestScore ||
      (score === bestScore && (bestTargetId === null || candidateId < bestTargetId))
    ) {
      bestScore = score;
      bestTargetId = candidateId;
    }
  }

  return bestTargetId;
}

export function decideBotInput(
  state: GameState,
  botPlayerId: PlayerId,
  opponentPlayerId: PlayerId,
  difficultyConfig: BotDifficultyConfig,
  memory: BotMemory
): { bits: InputBitmask; memory: BotMemory } {
  const self = state.players[botPlayerId];
  const opponent = state.players[opponentPlayerId];

  if (self === undefined) {
    throw new Error(`Bot player not found in GameState: ${botPlayerId}`);
  }
  if (opponent === undefined) {
    throw new Error(`Opponent player not found in GameState: ${opponentPlayerId}`);
  }

  // (1)
  if (self.hitstunFramesRemaining > 0 || self.respawnTimer > 0) {
    return { bits: 0, memory };
  }

  // (2)
  if (sensors.isOffStage(self, STAGE) && self.ledgeId === null) {
    const towardCenterBits = self.x < 640 ? INPUT_BITS.RIGHT : INPUT_BITS.LEFT;
    const recoveryBits = self.hasDoubleJump ? INPUT_BITS.JUMP : INPUT_BITS.SPECIAL;
    return applyExecutionError(
      towardCenterBits | recoveryBits,
      difficultyConfig.executionErrorRate,
      memory
    );
  }

  // (3)
  if (self.ledgeId !== null) {
    const decisionRoll = nextRandom(memory);
    const isHighQuality = difficultyConfig.decisionQuality >= 0.75;
    const climbWeight = isHighQuality ? 0.5 : 1 / 3;
    const rollWeight = isHighQuality ? 0.25 : 1 / 3;

    let intendedBits: InputBitmask;
    if (decisionRoll.value < climbWeight) {
      intendedBits = self.x < 640 ? INPUT_BITS.RIGHT : INPUT_BITS.LEFT;
    } else if (decisionRoll.value < climbWeight + rollWeight) {
      intendedBits = INPUT_BITS.SHIELD;
    } else {
      intendedBits = INPUT_BITS.ATTACK;
    }

    return applyExecutionError(
      intendedBits,
      difficultyConfig.executionErrorRate,
      decisionRoll.nextMemory
    );
  }

  // (4)
  if (sensors.isThreatIncoming(self, opponent, difficultyConfig.reactionDelayFrames)) {
    const decisionRoll = nextRandom(memory);
    const shieldWeight = difficultyConfig.decisionQuality >= 0.75 ? 0.7 : 0.5;
    const intendedBits =
      decisionRoll.value < shieldWeight ? INPUT_BITS.SHIELD : INPUT_BITS.SHIELD;

    return applyExecutionError(
      intendedBits,
      difficultyConfig.executionErrorRate,
      decisionRoll.nextMemory
    );
  }

  // (5)
  if (sensors.isPunishWindow(opponent) && opponent.isInvincible === false) {
    const decisionRoll = nextRandom(memory);
    const attackWeight = difficultyConfig.decisionQuality >= 0.75 ? 0.6 : 0.5;
    const intendedBits =
      decisionRoll.value < attackWeight ? INPUT_BITS.ATTACK : INPUT_BITS.GRAB;

    return applyExecutionError(
      intendedBits,
      difficultyConfig.executionErrorRate,
      decisionRoll.nextMemory
    );
  }

  // (5.5) edge-guard offense: challenge opponent off-stage or wait at ledge
  if (
    sensors.isOffStage(opponent, STAGE) &&
    !sensors.isOffStage(self, STAGE) &&
    self.isGrounded
  ) {
    const decisionRoll = nextRandom(memory);
    const aggressiveWeight = difficultyConfig.decisionQuality >= 0.75 ? 0.7 : 0.3;
    const directionBits = (opponent.x - self.x) > 0 ? INPUT_BITS.RIGHT : INPUT_BITS.LEFT;

    const intendedBits = decisionRoll.value < aggressiveWeight
      ? jumpInputForState(self.state, directionBits)
      : directionBits;

    return applyExecutionError(
      intendedBits,
      difficultyConfig.executionErrorRate,
      decisionRoll.nextMemory
    );
  }

  // (6) neutral pressure: approach opponent and occasionally throw out a button in range.
  const horizontalDelta = opponent.x - self.x;

  if (sensors.platformJumpNeeded(self, opponent) && self.isGrounded) {
    const directionBits = horizontalDelta > 0 ? INPUT_BITS.RIGHT : INPUT_BITS.LEFT;
    return applyExecutionError(
      jumpInputForState(self.state, directionBits),
      difficultyConfig.executionErrorRate,
      memory
    );
  }

  if (Math.abs(horizontalDelta) > APPROACH_DEADZONE_X) {
    const towardOpponentBits =
      horizontalDelta > 0 ? INPUT_BITS.RIGHT : INPUT_BITS.LEFT;
    return applyExecutionError(
      towardOpponentBits,
      difficultyConfig.executionErrorRate,
      memory
    );
  }

  if (
    Math.abs(horizontalDelta) <= ATTACK_PRESSURE_RANGE_X &&
    self.isGrounded &&
    opponent.isInvincible === false
  ) {
    const decisionRoll = nextRandom(memory);
    const attackWeight =
      difficultyConfig.decisionQuality >= 0.75 ? 0.3 : 0.15;
    const intendedBits =
      decisionRoll.value < attackWeight ? INPUT_BITS.ATTACK : 0;
    return applyExecutionError(
      intendedBits,
      difficultyConfig.executionErrorRate,
      decisionRoll.nextMemory
    );
  }

  return { bits: 0, memory };
}
