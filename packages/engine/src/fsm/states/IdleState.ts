/**
 * @fileoverview IDLE state — the fighter's neutral grounded resting state.
 *
 * Entered from: WALK (direction released), DASH (direction released),
 * RUN (direction reversed or released), ATTACK (animation complete),
 * SHIELD (shield button released), ROLL, SPOT_DODGE, TECH_NEUTRAL,
 * TECH_ROLL, HARD_LANDING, LANDING_LAG, GRAB_HOLDING (timeout or throw),
 * LEDGE_CLIMB, LEDGE_ATTACK, LEDGE_ROLL, AIRBORNE (on landing).
 *
 * Transitions out to: ATTACK (attack/special/grab pressed), WALK (direction held),
 * JUMPSQUAT (jump pressed), SHIELD (shield held).
 */
import { BaseState, INPUT_BITS, PlayerStateEnum, isHeld, isPressed, transition } from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

/**
 * The fighter's grounded neutral resting state. No velocity is applied here;
 * physics applies friction each tick. All action inputs are checked on every
 * frame so there is no input-buffering window to miss.
 */
export class IdleState extends BaseState {
  update(ctx: FSMContext): FSMTransition | null {
		if (
			isPressed(ctx.input, INPUT_BITS.ATTACK) ||
			isPressed(ctx.input, INPUT_BITS.SPECIAL) ||
			isPressed(ctx.input, INPUT_BITS.GRAB)
		) {
			return transition(PlayerStateEnum.ATTACK);
		}

    if (isHeld(ctx.input, INPUT_BITS.LEFT) || isHeld(ctx.input, INPUT_BITS.RIGHT)) {
      return transition(PlayerStateEnum.WALK);
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
