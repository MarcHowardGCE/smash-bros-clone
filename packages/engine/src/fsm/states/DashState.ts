import {horizontalMovementInput,GROUND_INPUT,initialDashFrames} from '../../physics/groundIntent.js';
/**
 * @fileoverview DASH state — initial directional movement with a commit window.
 *
 * Analog duration comes from the fighter profile; digital dash lasts 15 frames. During this window the fighter moves at
 * dash speed. A direction reversal mid-dash restarts the state from frame 0
 * (dash-dancing). After 15 frames without interruption the fighter escalates to
 * RUN.
 *
 * Entered from: a qualifying analog flick or the digital walk bridge.
 *
 * Transitions out to: ATTACK (attack/special/grab pressed), IDLE (direction
 * released), JUMPSQUAT (jump pressed), SHIELD (shield held),
 * DASH (direction reversed — dash-dance), RUN (initial dash completes).
 */
import {
	BaseState,
	INPUT_BITS,
	PlayerStateEnum,
	isDirectionHeld,
	isHeld,
	isPressed,
	transition,
} from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';



/**
 * Initial directional movement state.
 * Direction reversal mid-dash restarts the state (dash-dancing). Escalates to RUN
 * after the commit window expires.
 */
export class DashState extends BaseState {
	update(ctx: FSMContext, frame: number): FSMTransition | null {
		if (
			isPressed(ctx.input, INPUT_BITS.ATTACK) ||
			isPressed(ctx.input, INPUT_BITS.SPECIAL) ||
			isPressed(ctx.input, INPUT_BITS.GRAB)
		) {
			return transition(PlayerStateEnum.ATTACK);
		}

		if (horizontalMovementInput(ctx.input)===0) {
			return transition(PlayerStateEnum.IDLE);
		}

		if (isPressed(ctx.input, INPUT_BITS.JUMP)) {
			return transition(PlayerStateEnum.JUMPSQUAT);
		}

		if (isHeld(ctx.input, INPUT_BITS.SHIELD)) {
			return transition(PlayerStateEnum.SHIELD);
		}

    if(ctx.input?.stickX!==undefined&&Math.abs(horizontalMovementInput(ctx.input))<GROUND_INPUT.DASH_THRESHOLD&&horizontalMovementInput(ctx.input)!==0)return transition(PlayerStateEnum.WALK);
		const holdingLeft = isHeld(ctx.input, INPUT_BITS.LEFT);
		const holdingRight = isHeld(ctx.input, INPUT_BITS.RIGHT);
		const isSingleDirection = holdingLeft !== holdingRight;
		const isReversingDirection =
			isSingleDirection &&
			((ctx.player.facing === 1 && holdingLeft) ||
				(ctx.player.facing === -1 && holdingRight));

		if (isReversingDirection) {
			return transition(PlayerStateEnum.DASH);
		}

		if (frame >= initialDashFrames(ctx.player,ctx.input) - 1) {
			return transition(PlayerStateEnum.RUN);
		}

		return null;
	}
}
