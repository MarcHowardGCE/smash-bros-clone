import { BaseState, INPUT_BITS, PlayerStateEnum, isPressed, transition } from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

export class AirborneState extends BaseState {
  update(ctx: FSMContext): FSMTransition | null {
    if (ctx.isGrounded) {
      return transition(PlayerStateEnum.IDLE);
    }

		if (
			isPressed(ctx.input, INPUT_BITS.ATTACK) ||
			isPressed(ctx.input, INPUT_BITS.SPECIAL) ||
			isPressed(ctx.input, INPUT_BITS.GRAB)
		) {
			return transition(PlayerStateEnum.AIR_ATTACK);
		}

    if (isPressed(ctx.input, INPUT_BITS.JUMP) && ctx.player.hasDoubleJump) {
      return transition(PlayerStateEnum.DOUBLE_JUMP);
    }

    if (isPressed(ctx.input, INPUT_BITS.SHIELD)) {
      return transition(PlayerStateEnum.AIR_DODGE);
    }

    return null;
  }
}
