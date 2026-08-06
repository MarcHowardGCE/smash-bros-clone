import { BaseState, PHYSICS, PlayerStateEnum, transition } from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

export class TechNeutralState extends BaseState {
	update(_ctx: FSMContext, frame: number): FSMTransition | null {
		return frame >= PHYSICS.TECH_NEUTRAL_FRAMES - 1
			? transition(PlayerStateEnum.IDLE)
			: null;
	}
}
