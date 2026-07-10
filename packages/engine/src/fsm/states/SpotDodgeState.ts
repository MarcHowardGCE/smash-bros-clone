import { BaseState, PlayerStateEnum, transition } from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

export class SpotDodgeState extends BaseState {
  update(_ctx: FSMContext, frame: number): FSMTransition | null {
    return frame >= 19 ? transition(PlayerStateEnum.IDLE) : null;
  }
}
