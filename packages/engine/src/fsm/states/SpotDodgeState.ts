/**
 * @fileoverview SPOT_DODGE state — grounded in-place evasion with invincibility window.
 *
 * Lasts 20 frames (frame 0–19). The fighter stays planted; invincibility is
 * applied by the hitbox layer, not here. Mechanically identical frame-count
 * logic to ROLL but without positional movement.
 *
 * Entered from: SHIELD (shield + down input pressed).
 *
 * Transitions out to: IDLE (frame >= 19).
 */
import { BaseState, PlayerStateEnum, transition } from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

/**
 * In-place grounded evasion. Lasts 20 frames then returns to IDLE.
 * Invincibility window is handled by the hitbox layer, not this state.
 */
export class SpotDodgeState extends BaseState {
  update(_ctx: FSMContext, frame: number): FSMTransition | null {
    return frame >= 19 ? transition(PlayerStateEnum.IDLE) : null;
  }
}
