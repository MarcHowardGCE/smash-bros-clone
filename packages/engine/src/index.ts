/**
 * @fileoverview Entry point for the `@smash/engine` package.
 *
 * Re-exports everything the server and client need from the deterministic game
 * simulation layer: physics, finite-state machine, hitbox resolution, move data,
 * and bot AI. No Node.js or browser APIs are used anywhere in this package — all
 * code is pure TypeScript safe to run in any environment.
 */

export type { FSMContext, FSMTransition, IFSMState } from "./fsm/index.js";
export { createFSM, FSMController, tickFSM } from "./fsm/index.js";
export type { HitResult } from "./hitbox/index.js";
export {
	calculateKnockback,
	checkHitboxCollision,
	NO_HIT,
	resolveHit,
	resolveHitTrade,
} from "./hitbox/index.js";
export { getMoveData, getMoveDataForCharacter } from "./moves/index.js";
export {
	applyFastFall,
	applyGravity,
	applyDI,
	applyKnockbackDecay,
	applyMovement,
	applyMovementInput,
	checkLedgeGrab,
	checkPlatformCollision,
	checkWallCollision,
	DEFAULT_STAGE,
	resolveJump,
	startJump,
} from "./physics/index.js";
export type { StageData } from "./physics/types.js";
export type { BotMemory } from "./ai/botAI.js";
export { createBotMemory, decideBotInput, selectTarget } from "./ai/botAI.js";
