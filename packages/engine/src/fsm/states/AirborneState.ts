/**
 * @fileoverview AIRBORNE state — the fighter is in the air with no active action.
 *
 * The default aerial state. Gravity is applied by the physics layer every tick
 * regardless of which FSM state is active. This state checks for landing, aerial
 * attacks, double jump, and air dodge each frame.
 *
 * Entered from: JUMPSQUAT (jump squat complete), DOUBLE_JUMP (immediately),
 * AIR_DODGE (duration elapsed or grounded), AIR_ATTACK (animation complete),
 * HITSTUN (hitstun countdown expires and not tumbling), LEDGE_JUMP (launch
 * frames elapsed), LEDGE_HANG (DOWN pressed — drop).
 *
 * Transitions out to: IDLE (landed — isGrounded becomes true), AIR_ATTACK
 * (attack/special/grab pressed), DOUBLE_JUMP (jump pressed + hasDoubleJump),
 * AIR_DODGE (shield pressed + hasAirDodge).
 */
import { BaseState, INPUT_BITS, PlayerStateEnum, isPressed, transition } from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

/**
 * Default aerial state — fighter is airborne with no active action. Checks landing,
 * aerial attack input, double jump availability, and air dodge availability each frame.
 */
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
      return ctx.player.hasAirDodge ? transition(PlayerStateEnum.AIR_DODGE) : null;
    }

    return null;
  }
}
