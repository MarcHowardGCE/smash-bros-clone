import {
  BaseState,
  DEFAULT_MOVE_TOTAL_FRAMES,
  PlayerStateEnum,
  isSmashMoveId,
  resolveMoveTotalFrames,
  transition,
} from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

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
