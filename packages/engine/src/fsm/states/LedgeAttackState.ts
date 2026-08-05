import { PHYSICS, PlayerStateEnum } from '@smash/shared';
import type { FSMContext, FSMTransition } from '../index.js';
import { BaseState, transition } from './utils.js';

// LedgeAttackState: player performs an attack while getting up from the ledge.
// After LEDGE_ATTACK_FRAMES (60), transitions to IDLE.
// Hitbox activation (frames 20-27) is managed by GameEngine.withHitboxState, not here.
export class LedgeAttackState extends BaseState {
  update(_ctx: FSMContext, frame: number): FSMTransition | null {
    return frame >= PHYSICS.LEDGE_ATTACK_FRAMES - 1
      ? transition(PlayerStateEnum.IDLE)
      : null;
  }
}
