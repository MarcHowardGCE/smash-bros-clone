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

const DASH_FRAMES = 15;

export class DashState extends BaseState {
	update(ctx: FSMContext, frame: number): FSMTransition | null {
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

		if (frame >= DASH_FRAMES - 1) {
			return transition(PlayerStateEnum.RUN);
		}

		return null;
	}
}
