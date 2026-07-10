import { BaseState, INPUT_BITS, PlayerStateEnum, isHeld, transition } from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

export class ShieldState extends BaseState {
  update(ctx: FSMContext): FSMTransition | null {
    if (!isHeld(ctx.input, INPUT_BITS.SHIELD)) {
      return transition(PlayerStateEnum.IDLE);
    }

    return null;
  }
}
