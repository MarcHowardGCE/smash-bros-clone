/**
 * @fileoverview DOUBLE_JUMP state — single-frame aerial jump trigger.
 *
 * Consumes the fighter's double jump and immediately hands off to AIRBORNE.
 * The physics layer detects the DOUBLE_JUMP → AIRBORNE transition and applies
 * the double-jump velocity on that same tick. `hasDoubleJump` is cleared by
 * `GameEngine` when the transition fires.
 *
 * Entered from: AIRBORNE (jump pressed + hasDoubleJump true).
 *
 * Transitions out to: AIRBORNE (immediately, every frame).
 */
import { BaseState, PlayerStateEnum, transition } from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

/**
 * Single-frame trigger state that consumes the double jump and immediately
 * transitions to AIRBORNE. The physics layer applies double-jump velocity on
 * the same tick this transition fires.
 */
export class DoubleJumpState extends BaseState {
  update(_ctx: FSMContext): FSMTransition | null {
    return transition(PlayerStateEnum.AIRBORNE);
  }
}
