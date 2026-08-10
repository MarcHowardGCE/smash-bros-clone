/**
 * @fileoverview LANDING_LAG state — post-aerial-attack landing penalty.
 *
 * Fires when a fighter lands from the air while in an aerial attack animation.
 * The lag duration is set in `player.landingLagFrames` by `GameEngine` at the
 * moment of landing. This state simply holds until that counter drains to zero.
 *
 * L-cancel: if the player presses shield within a window before landing,
 * `GameEngine` halves `landingLagFrames` before this state takes over — giving
 * an effective 50% reduction in landing lag for skilled players.
 *
 * Entered from: externally by `GameEngine` when an aerial attack lands
 * (state forced to LANDING_LAG via player.state override).
 *
 * Transitions out to: IDLE (landingLagFrames reaches 0).
 */
import { BaseState, PlayerStateEnum, transition } from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

/**
 * Post-aerial landing lag. Holds until `player.landingLagFrames` drains to zero
 * then returns to IDLE. The frame count is set externally by `GameEngine` and
 * halved by a successful L-cancel before this state activates.
 */
export class LandingLagState extends BaseState {
	update(ctx: FSMContext): FSMTransition | null {
		if (ctx.player.landingLagFrames > 0) {
			return null;
		}

		return transition(PlayerStateEnum.IDLE);
	}
}
