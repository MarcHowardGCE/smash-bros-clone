/**
 * @fileoverview JUMPSQUAT state — pre-jump crouch window before leaving the ground.
 *
 * Lasts exactly `PHYSICS.JUMPSQUAT_FRAMES` frames. The jump held/released
 * distinction for short-hop vs full-hop is NOT evaluated here — it's handled
 * by the physics layer when AIRBORNE begins. This state simply counts frames
 * and fires the transition.
 *
 * Short-hop detection: physics checks whether the jump button is still held at
 * the moment `AIRBORNE` `enter()` runs. If released within `PHYSICS.SHORT_HOP_THRESHOLD_FRAMES`
 * of the jump press, the initial vertical velocity is set to `PHYSICS.SHORT_HOP_VY`
 * instead of `PHYSICS.FULL_HOP_VY`.
 *
 * Entered from: IDLE, WALK, DASH, RUN (jump pressed while grounded).
 *
 * Transitions out to: AIRBORNE (frame >= PHYSICS.JUMPSQUAT_FRAMES - 1).
 */
import { BaseState, PHYSICS, PlayerStateEnum, transition } from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

/**
 * Pre-jump crouch window. Counts frames and transitions to AIRBORNE once
 * `PHYSICS.JUMPSQUAT_FRAMES` have elapsed. Short-hop vs full-hop distinction
 * is deferred to the physics layer on AIRBORNE entry.
 */
export class JumpsquatState extends BaseState {
  update(_ctx: FSMContext, frame: number): FSMTransition | null {
    return frame >= PHYSICS.JUMPSQUAT_FRAMES - 1 ? transition(PlayerStateEnum.AIRBORNE) : null;
  }
}
