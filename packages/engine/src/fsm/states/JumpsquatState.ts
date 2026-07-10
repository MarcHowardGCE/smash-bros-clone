import { BaseState, PHYSICS, PlayerStateEnum, transition } from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

export class JumpsquatState extends BaseState {
  update(_ctx: FSMContext, frame: number): FSMTransition | null {
    return frame >= PHYSICS.JUMPSQUAT_FRAMES - 1 ? transition(PlayerStateEnum.AIRBORNE) : null;
  }
}
