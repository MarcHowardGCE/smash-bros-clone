// Types
export type { Vec2, Circle, HitboxData, PlayerState, GameState, StateSnapshot, PlayerId, HitEventData, KOEventData } from './types/GameState.js';
export type { InputBitmask, InputEvent } from './types/InputEvent.js';
export { INPUT_BITS } from './types/InputEvent.js';
export type { MoveData } from './types/MoveData.js';
export { MoveId } from './types/MoveData.js';
export { PlayerStateEnum } from './types/PlayerFSMState.js';

// Constants
export { PHYSICS, SMASH_CHARGE_MAX_FRAMES } from './constants/physics.js';
export type { Physics } from './constants/physics.js';
export { STAGE } from './constants/stage.js';
export type { Stage } from './constants/stage.js';
export { MATCH_CONFIG } from './constants/matchConfig.js';

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
