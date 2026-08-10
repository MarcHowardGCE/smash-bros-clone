/**
 * @fileoverview GRAB state — grab attempt window.
 *
 * A brief window (5 frames) during which the grab hitbox is active. If the
 * grab connects, `GameEngine` sets `player.isGrabbing = true`, and this state
 * immediately escalates to GRAB_HOLDING on the same tick. If nothing is caught
 * by frame 5, the state returns to IDLE (whiff animation ends).
 *
 * Entered from: IDLE, WALK, SHIELD (grab input pressed).
 *
 * Transitions out to: GRAB_HOLDING (isGrabbing becomes true), IDLE (frame >= 5
 * with no grab connection).
 */
import { BaseState, PlayerStateEnum, transition } from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

/**
 * Grab attempt state. Waits up to 5 frames for `isGrabbing` to be set by
 * `GameEngine` (grab connected). If it connects, escalates to GRAB_HOLDING
 * immediately. If not, returns to IDLE after 5 frames.
 */
export class GrabState extends BaseState {
  update(ctx: FSMContext, frame: number): FSMTransition | null {
    if (ctx.player.isGrabbing) {
      return transition(PlayerStateEnum.GRAB_HOLDING);
    }

    return frame >= 5 ? transition(PlayerStateEnum.IDLE) : null;
  }
}
