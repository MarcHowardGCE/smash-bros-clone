import { BaseState, PlayerStateEnum, transition } from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

export class AirDodgeState extends BaseState {
  update(ctx: FSMContext, frame: number): FSMTransition | null {
    return frame >= 23 || ctx.isGrounded ? transition(PlayerStateEnum.AIRBORNE) : null;
  }
}
