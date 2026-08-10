/**
 * @fileoverview TECH_ROLL state — directional tech roll getup animation.
 *
 * Fires when a fighter successfully techs a grounded impact and holds a
 * direction. The fighter rolls in that direction with invincibility frames.
 * Lasts `PHYSICS.TECH_ROLL_FRAMES` frames, then returns to IDLE.
 *
 * Entered from: externally by `GameEngine` when a successful directional tech
 * is detected (state forced to TECH_ROLL via player.state override).
 *
 * Transitions out to: IDLE (frame >= PHYSICS.TECH_ROLL_FRAMES - 1).
 */
import { BaseState, PHYSICS, PlayerStateEnum, transition } from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

/**
 * Directional tech roll getup. Lasts `PHYSICS.TECH_ROLL_FRAMES` then returns
 * to IDLE. Roll distance and invincibility are handled by the physics/hitbox layer.
 */
export class TechRollState extends BaseState {
	update(_ctx: FSMContext, frame: number): FSMTransition | null {
		return frame >= PHYSICS.TECH_ROLL_FRAMES - 1
			? transition(PlayerStateEnum.IDLE)
			: null;
	}
}
