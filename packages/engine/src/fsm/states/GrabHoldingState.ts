import { BaseState, PlayerStateEnum, transition } from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

export class GrabHoldingState extends BaseState {
  update(ctx: FSMContext, frame: number): FSMTransition | null {
    if (!ctx.player.isGrabbing) {
      return transition(PlayerStateEnum.IDLE);
    }

    return frame >= 89 ? transition(PlayerStateEnum.IDLE) : null;
  }
}
