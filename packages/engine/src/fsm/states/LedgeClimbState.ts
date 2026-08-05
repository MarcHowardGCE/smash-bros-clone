import { PHYSICS, PlayerStateEnum } from '@smash/shared';
import type { FSMContext, FSMTransition } from '../index.js';
import { BaseState, transition } from './utils.js';

// LedgeClimbState: player climbs from the ledge onto the platform.
// After LEDGE_CLIMB_FRAMES, transitions to IDLE (standing on the platform).
// Actual position snap to the platform happens in GameEngine.applyStateTransitions.
export class LedgeClimbState extends BaseState {
  update(_ctx: FSMContext, frame: number): FSMTransition | null {
    return frame >= PHYSICS.LEDGE_CLIMB_FRAMES - 1
      ? transition(PlayerStateEnum.IDLE)
      : null;
  }
}
