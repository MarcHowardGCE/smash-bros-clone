import { BaseState, INPUT_BITS, PlayerStateEnum, isDirectionHeld, isPressed, transition } from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

export class RunState extends BaseState {
  update(ctx: FSMContext): FSMTransition | null {
    if (!isDirectionHeld(ctx.input)) {
      return transition(PlayerStateEnum.IDLE);
    }

    if (isPressed(ctx.input, INPUT_BITS.JUMP)) {
      return transition(PlayerStateEnum.JUMPSQUAT);
    }

    if (isPressed(ctx.input, INPUT_BITS.ATTACK)) {
      return transition(PlayerStateEnum.ATTACK);
    }

    return null;
  }
}
