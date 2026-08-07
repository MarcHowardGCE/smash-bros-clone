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

    // If direction is still held and no other action taken, auto-escalate to DASH.
    // This makes WALK a brief 1-frame transitional state that allows tilt attacks
    // from movement start, but quickly escalates to dash speed for normal movement.
    return transition(PlayerStateEnum.DASH);
  }
}
