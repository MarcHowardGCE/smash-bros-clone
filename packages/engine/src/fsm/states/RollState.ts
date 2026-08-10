/**
 * @fileoverview ROLL state — grounded evasive roll with invincibility window.
 *
 * Lasts 20 frames (frame 0–19). Invincibility frames are applied by the
 * physics/hitbox layer, not here. The FSM just counts frames and exits.
 *
 * Entered from: SHIELD (directional input pressed while shielding).
 *
 * Transitions out to: IDLE (frame >= 19).
 */
import { BaseState, PlayerStateEnum, transition } from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

/**
 * Grounded evasive roll. Lasts 20 frames then returns to IDLE.
 * Invincibility window is handled by the hitbox layer, not this state.
 */
export class RollState extends BaseState {
  update(_ctx: FSMContext, frame: number): FSMTransition | null {
    return frame >= 19 ? transition(PlayerStateEnum.IDLE) : null;
  }
}
