import { BaseState, INPUT_BITS, PlayerStateEnum, isPressed, transition } from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

/** Holder action selection. The match engine owns the paired release clock. */
export class GrabHoldingState extends BaseState {
  update(ctx: FSMContext): FSMTransition | null {
    if (!ctx.player.isGrabbing) {
      return transition(PlayerStateEnum.IDLE);
    }

    if (!ctx.player.grabbedPlayerId) return null;

    const holderActions = INPUT_BITS.ATTACK | INPUT_BITS.LEFT | INPUT_BITS.RIGHT | INPUT_BITS.UP | INPUT_BITS.DOWN;
    return isPressed(ctx.input, holderActions) ? transition(PlayerStateEnum.ATTACK) : null;
  }
}
