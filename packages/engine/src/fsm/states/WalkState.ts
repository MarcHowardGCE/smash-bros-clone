import {horizontalMovementInput,wantsGroundDash} from '../../physics/groundIntent.js';
/**
 * @fileoverview WALK state — brief transitional grounded movement state.
 *
 * Analog walk is sustained; digital movement retains the 1-frame bridge to DASH. It exists so that tilt
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

    if(isPressed(ctx.input,INPUT_BITS.JUMP))return transition(PlayerStateEnum.JUMPSQUAT);
    if(isHeld(ctx.input,INPUT_BITS.DOWN)&&!isHeld(ctx.input,INPUT_BITS.LEFT)&&!isHeld(ctx.input,INPUT_BITS.RIGHT))return transition(PlayerStateEnum.CROUCH);
    if (horizontalMovementInput(ctx.input)===0) {
      return transition(PlayerStateEnum.IDLE);
    }

    if (isPressed(ctx.input, INPUT_BITS.JUMP)) {
      return transition(PlayerStateEnum.JUMPSQUAT);
    }

    if (isHeld(ctx.input, INPUT_BITS.SHIELD)) {
      return transition(PlayerStateEnum.SHIELD);
    }

    // Digital movement keeps its original dash bridge; analog input requires a fresh flick.
    // This makes WALK a brief 1-frame transitional state that allows tilt attacks
    // from movement start, but quickly escalates to dash speed for normal movement.
    return wantsGroundDash(ctx.player,ctx.input)?transition(PlayerStateEnum.DASH):null;
  }
}
