import { BaseState, PlayerStateEnum, transition } from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

export class DoubleJumpState extends BaseState {
  update(_ctx: FSMContext): FSMTransition | null {
    return transition(PlayerStateEnum.AIRBORNE);
  }
}
