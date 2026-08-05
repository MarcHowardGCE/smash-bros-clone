import { INPUT_BITS, PlayerStateEnum } from '@smash/shared';
import type { FSMContext, FSMTransition } from '../index.js';
import { BaseState, isHeld, isPressed, transition } from './utils.js';

// LedgeHangState: player is hanging on a ledge.
// Inputs map to getup options; position snap and invincibility are managed by GameEngine.
// No input → null (keep hanging indefinitely until player acts).
export class LedgeHangState extends BaseState {
  update(ctx: FSMContext, _frame: number): FSMTransition | null {
    if (isPressed(ctx.input, INPUT_BITS.JUMP)) {
      return transition(PlayerStateEnum.LEDGE_JUMP);
    }
    if (isPressed(ctx.input, INPUT_BITS.ATTACK)) {
      return transition(PlayerStateEnum.LEDGE_ATTACK);
    }
    if (isPressed(ctx.input, INPUT_BITS.SHIELD)) {
      return transition(PlayerStateEnum.LEDGE_ROLL);
    }
    if (isPressed(ctx.input, INPUT_BITS.DOWN)) {
      // Drop: no dedicated LEDGE_DROP state — transitions directly to AIRBORNE
      return transition(PlayerStateEnum.AIRBORNE);
    }
    if (isHeld(ctx.input, INPUT_BITS.LEFT) || isHeld(ctx.input, INPUT_BITS.RIGHT)) {
      // Climb: any directional hold toward/away from stage triggers climb getup
      return transition(PlayerStateEnum.LEDGE_CLIMB);
    }
    return null; // Keep hanging
  }
}
