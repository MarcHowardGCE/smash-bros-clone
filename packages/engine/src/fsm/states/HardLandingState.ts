import { BaseState, PHYSICS, PlayerStateEnum, transition } from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

export class HardLandingState extends BaseState {
	update(_ctx: FSMContext, frame: number): FSMTransition | null {
		return frame >= PHYSICS.TECH_MISS_LANDING_FRAMES - 1
			? transition(PlayerStateEnum.IDLE)
			: null;
	}
}
