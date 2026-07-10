import { BaseState, PlayerStateEnum, transition } from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

export class GrabState extends BaseState {
  update(ctx: FSMContext, frame: number): FSMTransition | null {
    if (ctx.player.isGrabbing) {
      return transition(PlayerStateEnum.GRAB_HOLDING);
    }

    return frame >= 5 ? transition(PlayerStateEnum.IDLE) : null;
  }
}
