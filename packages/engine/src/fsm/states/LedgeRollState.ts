import { PHYSICS, PlayerStateEnum } from '@smash/shared';
import type { FSMContext, FSMTransition } from '../index.js';
import { BaseState, transition } from './utils.js';

// LedgeRollState: player rolls from the ledge onto the platform.
// After LEDGE_ROLL_FRAMES (45), transitions to IDLE.
// Any roll invincibility is applied by GameEngine.applyStateTransitions, not here.
export class LedgeRollState extends BaseState {
  update(_ctx: FSMContext, frame: number): FSMTransition | null {
    return frame >= PHYSICS.LEDGE_ROLL_FRAMES - 1
      ? transition(PlayerStateEnum.IDLE)
      : null;
  }
}
