import { BaseState, DEFAULT_MOVE_TOTAL_FRAMES, PlayerStateEnum, resolveMoveTotalFrames, transition } from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

export class AttackState extends BaseState {
  private totalFrames = DEFAULT_MOVE_TOTAL_FRAMES;

  override enter(ctx: FSMContext): void {
    this.totalFrames = resolveMoveTotalFrames(ctx.player.currentMoveId);
  }

  update(ctx: FSMContext, frame: number): FSMTransition | null {
    this.totalFrames = resolveMoveTotalFrames(ctx.player.currentMoveId);
    return frame >= this.totalFrames - 1 ? transition(PlayerStateEnum.IDLE) : null;
  }
}
