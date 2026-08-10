/**
 * @fileoverview SHIELD state — grounded defensive parry bubble.
 *
 * Holds the fighter in place with a shrinking shield bubble. If the shield
 * absorbs a hit, `shieldStunFrames` is set by `GameEngine`; this state
 * counts down the stun before accepting further input.
 *
 * Shield-grab: the player can grab directly out of shield without releasing
 * shield first. The grab input while shieldStunFrames <= 0 transitions to
 * ATTACK (which resolves the grab move).
 *
 * Entered from: IDLE, WALK (shield held); ROLL, SPOT_DODGE (via shield
 * re-application — though typically those return to IDLE first).
 *
 * Transitions out to: ATTACK (grab pressed while not in stun — shield-grab),
 * IDLE (shield button released and not in stun).
 */
import { BaseState, INPUT_BITS, PlayerStateEnum, isHeld, isPressed, transition } from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

/**
 * Grounded defensive parry state. Counts down `shieldStunFrames` before
 * accepting input. Supports shield-grab (grab while not in stun transitions
 * to ATTACK). Exits to IDLE when the shield button is released.
 */
export class ShieldState extends BaseState {
  update(ctx: FSMContext, frame: number): FSMTransition | null {
    if (ctx.player.shieldStunFrames > 0) {
      ctx.player.shieldStunFrames -= 1;
      return null;
    }

    // Shield-grab: allow grab directly out of shield via ATTACK state
    if (ctx.player.shieldStunFrames <= 0 && isPressed(ctx.input, INPUT_BITS.GRAB)) {
      return transition(PlayerStateEnum.ATTACK);
    }

    if (!isHeld(ctx.input, INPUT_BITS.SHIELD)) {
      return transition(PlayerStateEnum.IDLE);
    }

    return null;
  }
}
