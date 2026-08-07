import { BaseState, INPUT_BITS, PlayerStateEnum, isHeld, isPressed, transition } from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

export class ShieldState extends BaseState {
  update(ctx: FSMContext, frame: number): FSMTransition | null {
    if (ctx.player.shieldStunFrames > 0) {
      ctx.player.shieldStunFrames -= 1;
      return null;
    }

    // Shield-grab: allow grab directly out of shield via ATTACK state
    if (ctx.player.shieldStunFrames <= 0 && isPressed(ctx.input, INPUT_BITS.GRAB)) {
      return transition(PlayerStateEnum.ATTACK);
    }

    if (!isHeld(ctx.input, INPUT_BITS.SHIELD)) {
      return transition(PlayerStateEnum.IDLE);
    }

    return null;
  }
}
