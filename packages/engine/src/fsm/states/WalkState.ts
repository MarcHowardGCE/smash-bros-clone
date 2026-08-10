/**
 * @fileoverview WALK state — brief transitional grounded movement state.
 *
 * Walk is a 1-frame bridge between IDLE and DASH. It exists so that tilt
 * attacks can be buffered on the very first frame of movement (input window
 * where you're walking but haven't committed to a dash yet). If no action
 * input fires within this frame, WALK auto-escalates to DASH.
 *
 * Entered from: IDLE (direction held).
 *
 * Transitions out to: ATTACK (attack/special/grab pressed), IDLE (direction
 * released), JUMPSQUAT (jump pressed), SHIELD (shield held), DASH (default).
 */
import { BaseState, INPUT_BITS, PlayerStateEnum, isDirectionHeld, isHeld, isPressed, transition } from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

/**
 * Brief transitional state that lets the fighter buffer a tilt attack on the
 * first frame of directional input before committing to dash speed. Auto-escalates
 * to DASH on the same frame if no other action fires.
 */
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
