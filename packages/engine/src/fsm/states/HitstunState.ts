import { BaseState, PlayerStateEnum, transition } from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

export class HitstunState extends BaseState {
  update(ctx: FSMContext): FSMTransition | null {
    return ctx.player.hitstunFramesRemaining <= 0 ? transition(PlayerStateEnum.AIRBORNE) : null;
  }
}
