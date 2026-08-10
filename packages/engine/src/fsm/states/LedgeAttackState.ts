/**
 * @fileoverview LEDGE_ATTACK state — hitbox-active getup attack from the ledge.
 *
 * Triggered by pressing ATTACK while hanging. Lasts `PHYSICS.LEDGE_ATTACK_FRAMES`
 * (60) frames. The hitbox is active during frames 20–27, managed by
 * `GameEngine.withHitboxState` — not here. This state just counts frames and exits.
 *
 * Entered from: LEDGE_HANG (attack pressed).
 *
 * Transitions out to: IDLE (frame >= PHYSICS.LEDGE_ATTACK_FRAMES - 1).
 */
import { PHYSICS, PlayerStateEnum } from '@smash/shared';
import type { FSMContext, FSMTransition } from '../index.js';
import { BaseState, transition } from './utils.js';

/**
 * Ledge attack getup. Lasts `PHYSICS.LEDGE_ATTACK_FRAMES` (60) then returns to
 * IDLE. Hitbox activation (frames 20–27) is handled by `GameEngine`, not here.
 */
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
