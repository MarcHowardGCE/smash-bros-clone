/**
 * @fileoverview ATTACK state — grounded attack animation playback.
 *
 * Handles all grounded offensive moves: jabs, tilts, smash attacks, grabs,
 * pummels, and throws. The total duration is resolved from `currentMoveId`
 * via `resolveMoveTotalFrames()`. Smash attacks add `chargeFrames` on top of
 * the base duration to account for charge hold time.
 *
 * Entered from: IDLE, WALK, DASH, RUN, SHIELD (attack/special/grab pressed);
 * GRAB_HOLDING (attack pressed — pummel, or directional press — throw).
 *
 * Transitions out to: IDLE (frame >= totalFrames + chargeExtensionFrames - 1).
 */
import {
  BaseState,
  DEFAULT_MOVE_TOTAL_FRAMES,
  PlayerStateEnum,
  isSmashMoveId,
  resolveMoveTotalFrames,
  transition,
} from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

/**
 * Grounded attack animation state. Resolves total frame count from `currentMoveId`
 * on every tick (re-resolved in case `currentMoveId` changes mid-state). Smash
 * attacks extend duration by `chargeFrames` accumulated during the charge hold.
 *
 * `totalFrames` is cached in `enter()` as a fast path and re-resolved in `update()`
 * for correctness when a new move fires mid-state.
 */
export class AttackState extends BaseState {
  private totalFrames = DEFAULT_MOVE_TOTAL_FRAMES;

  override enter(ctx: FSMContext): void {
    this.totalFrames = resolveMoveTotalFrames(ctx.player.currentMoveId);
  }

  update(ctx: FSMContext, frame: number): FSMTransition | null {
    const moveId = ctx.player.currentMoveId;
    this.totalFrames = resolveMoveTotalFrames(moveId);

    const chargeExtensionFrames = isSmashMoveId(moveId)
      ? Number.isFinite(ctx.player.chargeFrames)
        ? ctx.player.chargeFrames
        : 0
      : 0;

    return frame >= this.totalFrames + chargeExtensionFrames - 1
      ? transition(PlayerStateEnum.IDLE)
      : null;
  }
}
