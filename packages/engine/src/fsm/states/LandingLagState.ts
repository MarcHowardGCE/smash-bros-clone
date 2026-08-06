import { BaseState, PlayerStateEnum, transition } from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

export class LandingLagState extends BaseState {
	update(ctx: FSMContext): FSMTransition | null {
		if (ctx.player.landingLagFrames > 0) {
			return null;
		}

		return transition(PlayerStateEnum.IDLE);
	}
}
