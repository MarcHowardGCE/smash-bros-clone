/**
 * @fileoverview HARD_LANDING state — missed-tech landing penalty.
 *
 * Fires when a fighter fails to tech a hard landing (tumble state hits the
 * ground without a tech input in the window). The fighter bounces and lies
 * prone for `PHYSICS.TECH_MISS_LANDING_FRAMES` frames before recovering.
 *
 * Entered from: externally by `GameEngine` when a missed-tech landing is
 * detected (state forced to HARD_LANDING via player.state override).
 *
 * Transitions out to: IDLE (frame >= PHYSICS.TECH_MISS_LANDING_FRAMES - 1).
 */
import { BaseState, PHYSICS, PlayerStateEnum, transition } from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

/**
 * Missed-tech landing penalty state. Holds the fighter prone for
 * `PHYSICS.TECH_MISS_LANDING_FRAMES` then returns to IDLE.
 */
export class HardLandingState extends BaseState {
	update(_ctx: FSMContext, frame: number): FSMTransition | null {
		return frame >= PHYSICS.TECH_MISS_LANDING_FRAMES - 1
			? transition(PlayerStateEnum.IDLE)
			: null;
	}
}
