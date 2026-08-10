/**
 * @fileoverview TECH_NEUTRAL state — in-place tech getup animation.
 *
 * Fires when a fighter successfully techs a grounded impact (pressed shield
 * within the tech window). The fighter stands up in place without rolling.
 * Lasts `PHYSICS.TECH_NEUTRAL_FRAMES` frames, then returns to IDLE.
 *
 * Entered from: externally by `GameEngine` when a successful neutral tech
 * is detected (state forced to TECH_NEUTRAL via player.state override).
 *
 * Transitions out to: IDLE (frame >= PHYSICS.TECH_NEUTRAL_FRAMES - 1).
 */
import { BaseState, PHYSICS, PlayerStateEnum, transition } from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

/**
 * In-place tech getup. Lasts `PHYSICS.TECH_NEUTRAL_FRAMES` then returns to IDLE.
 * Actual invincibility during the getup is handled by the hitbox layer.
 */
export class TechNeutralState extends BaseState {
	update(_ctx: FSMContext, frame: number): FSMTransition | null {
		return frame >= PHYSICS.TECH_NEUTRAL_FRAMES - 1
			? transition(PlayerStateEnum.IDLE)
			: null;
	}
}
