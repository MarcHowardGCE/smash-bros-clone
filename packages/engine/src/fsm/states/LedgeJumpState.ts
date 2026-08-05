import { PHYSICS, PlayerStateEnum } from '@smash/shared';
import type { FSMContext, FSMTransition } from '../index.js';
import { BaseState, transition } from './utils.js';

// LedgeJumpState: player jumps off the ledge.
// After LEDGE_JUMP_FRAMES, transitions to AIRBORNE; jump velocity applied by GameEngine.applyStateTransitions.
export class LedgeJumpState extends BaseState {
  update(_ctx: FSMContext, frame: number): FSMTransition | null {
    return frame >= PHYSICS.LEDGE_JUMP_FRAMES - 1
      ? transition(PlayerStateEnum.AIRBORNE)
      : null;
  }
}
