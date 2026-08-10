/**
 * @fileoverview AIR_ATTACK state — aerial attack animation playback.
 *
 * Handles all aerial offensive moves: neutral air, forward air, back air,
 * up air, down air, and aerial specials. Duration is resolved from
 * `currentMoveId` via `resolveMoveTotalFrames()`. No charge extension —
 * smash attacks are grounded only.
 *
 * Entered from: AIRBORNE (attack/special/grab pressed while airborne).
 *
 * Transitions out to: AIRBORNE (frame >= totalFrames - 1).
 */
import { BaseState, DEFAULT_MOVE_TOTAL_FRAMES, PlayerStateEnum, resolveMoveTotalFrames, transition } from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

/**
 * Aerial attack animation state. Resolves total frame count from `currentMoveId`
 * each tick. No charge extension (smash attacks are grounded only). Returns to
 * AIRBORNE when the animation completes.
 */
export class AirAttackState extends BaseState {
  private totalFrames = DEFAULT_MOVE_TOTAL_FRAMES;

  override enter(ctx: FSMContext): void {
    this.totalFrames = resolveMoveTotalFrames(ctx.player.currentMoveId);
  }

  update(ctx: FSMContext, frame: number): FSMTransition | null {
    this.totalFrames = resolveMoveTotalFrames(ctx.player.currentMoveId);
    return frame >= this.totalFrames - 1 ? transition(PlayerStateEnum.AIRBORNE) : null;
  }
}
