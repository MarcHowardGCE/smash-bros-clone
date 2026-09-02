/**
 * @fileoverview Barrel export for the `@smash/shared` package.
 * Re-exports every public type, enum, constant, and math utility so consumers
 * can import from a single entry point rather than individual module paths.
 */

// Types
export type { Vec2, Circle, HitboxData, PlayerState, GameState, StateSnapshot, PlayerId, HitEventData, KOEventData } from './types/GameState.js';
export type { InputBitmask, InputEvent } from './types/InputEvent.js';
export { INPUT_BITS } from './types/InputEvent.js';
export type { MoveData } from './types/MoveData.js';
export { MoveId } from './types/MoveData.js';
export type { CharacterId, CharacterStats } from './types/Character.js';
export { PlayerStateEnum } from './types/PlayerFSMState.js';

// Constants
export { PHYSICS, SMASH_CHARGE_MAX_FRAMES } from './constants/physics.js';
export type { Physics } from './constants/physics.js';
export { STAGE } from './constants/stage.js';
export type { Stage } from './constants/stage.js';
export { MATCH_CONFIG } from './constants/matchConfig.js';
export { BOT_DIFFICULTY_PRESETS } from './constants/botDifficulty.js';
export type { BotDifficulty } from './constants/botDifficulty.js';
export { ALL_ROUNDER_STATS, ABE_LINCOLN_STATS, SWIFT_STATS, CHARACTER_REGISTRY, CHARACTER_IDS, getCharacterStats, isCharacterId } from './constants/characters.js';
export { VERSION } from './version.js';

// Math utilities
export {
  lerp,
  clamp,
  vecAdd,
  vecScale,
  vecLength,
  vecNormalize,
  circleOverlap,
  degreesToRadians,
  knockbackAngleToVelocity,
} from './math/vectors.js';
