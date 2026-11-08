/**
 * @fileoverview DOUBLE_JUMP state — single-frame aerial jump trigger.
 *
 * GameEngine applies the launch and consumes the jump on entry.
 * The next tick hands off to AIRBORNE or starts a fresh normal aerial.
 *
 * Entered from: AIRBORNE (jump pressed + hasDoubleJump true).
 *
 * Transitions out to: AIRBORNE or AIR_ATTACK.
 */
import { BaseState, INPUT_BITS, PlayerStateEnum, isPressed, transition } from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

export class DoubleJumpState extends BaseState {
  update(ctx: FSMContext): FSMTransition | null {
    const aerial = !ctx.isGrounded && isPressed(ctx.input, INPUT_BITS.ATTACK) &&
      !isPressed(ctx.input, INPUT_BITS.SPECIAL | INPUT_BITS.GRAB | INPUT_BITS.SHIELD);
    return transition(aerial ? PlayerStateEnum.AIR_ATTACK : PlayerStateEnum.AIRBORNE);
  }
}
