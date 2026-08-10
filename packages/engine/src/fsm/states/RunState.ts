/**
 * @fileoverview RUN state — sustained full-speed directional movement.
 *
 * Entered from DASH after 15 frames of uninterrupted directional hold.
 * Run continues until the player releases the direction, reverses (which
 * snaps to IDLE rather than re-dashing — no dash-dancing from run), jumps,
 * or attacks.
 *
 * Entered from: DASH (frame >= DASH_FRAMES - 1 with direction still held).
 *
 * Transitions out to: IDLE (direction reversed or released), JUMPSQUAT
 * (jump pressed), ATTACK (attack pressed).
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
 * Full-speed sustained movement state. Direction reversal snaps directly to IDLE
 * (no dash-dance from run). Continues until input is released, reversed, or an
 * action interrupt fires.
 */
export class RunState extends BaseState {
	update(ctx: FSMContext): FSMTransition | null {
		const holdingLeft = isHeld(ctx.input, INPUT_BITS.LEFT);
		const holdingRight = isHeld(ctx.input, INPUT_BITS.RIGHT);
		const isSingleDirection = holdingLeft !== holdingRight;
		const isReversingDirection =
			isSingleDirection &&
			((ctx.player.facing === 1 && holdingLeft) ||
				(ctx.player.facing === -1 && holdingRight));

		if (isReversingDirection) {
			return transition(PlayerStateEnum.IDLE);
		}

		if (!isDirectionHeld(ctx.input)) {
			return transition(PlayerStateEnum.IDLE);
		}

    if (isPressed(ctx.input, INPUT_BITS.JUMP)) {
      return transition(PlayerStateEnum.JUMPSQUAT);
    }

    if (isPressed(ctx.input, INPUT_BITS.ATTACK)) {
      return transition(PlayerStateEnum.ATTACK);
    }

    return null;
  }
}
