import { BaseState, INPUT_BITS, PlayerStateEnum, isDirectionHeld, isHeld, isPressed, transition } from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

export class WalkState extends BaseState {
  update(ctx: FSMContext): FSMTransition | null {
		if (
			isPressed(ctx.input, INPUT_BITS.ATTACK) ||
			isPressed(ctx.input, INPUT_BITS.SPECIAL) ||
			isPressed(ctx.input, INPUT_BITS.GRAB)
		) {
			return transition(PlayerStateEnum.ATTACK);
		}

    if (!isDirectionHeld(ctx.input)) {
      return transition(PlayerStateEnum.IDLE);
    }

    if (isPressed(ctx.input, INPUT_BITS.JUMP)) {
      return transition(PlayerStateEnum.JUMPSQUAT);
    }

    if (isHeld(ctx.input, INPUT_BITS.SHIELD)) {
      return transition(PlayerStateEnum.SHIELD);
    }

    return null;
  }
}
