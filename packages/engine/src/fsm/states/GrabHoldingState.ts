import {
  BaseState,
  INPUT_BITS,
  PlayerStateEnum,
  isPressed,
  transition,
} from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

export class GrabHoldingState extends BaseState {
  update(ctx: FSMContext, frame: number): FSMTransition | null {
    if (!ctx.player.isGrabbing) {
      return transition(PlayerStateEnum.IDLE);
    }

    if (frame >= 89) {
      return transition(PlayerStateEnum.IDLE);
    }

    const wantsThrowDirection =
      isPressed(ctx.input, INPUT_BITS.LEFT) ||
      isPressed(ctx.input, INPUT_BITS.RIGHT) ||
      isPressed(ctx.input, INPUT_BITS.JUMP) ||
      isPressed(ctx.input, INPUT_BITS.DOWN);

    if (isPressed(ctx.input, INPUT_BITS.ATTACK) || wantsThrowDirection) {
      return transition(PlayerStateEnum.ATTACK);
    }

    return null;
  }
}
