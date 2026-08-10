/**
 * @fileoverview LEDGE_CLIMB state — slow climb getup from the ledge onto the platform.
 *
 * Triggered by holding LEFT or RIGHT while hanging. The fighter slowly climbs
 * up with a long animation. Position snap to the platform top happens in
 * `GameEngine.applyStateTransitions` when this state fires its transition.
 *
 * Entered from: LEDGE_HANG (direction held).
 *
 * Transitions out to: IDLE (frame >= PHYSICS.LEDGE_CLIMB_FRAMES - 1).
 */
import { PHYSICS, PlayerStateEnum } from '@smash/shared';
import type { FSMContext, FSMTransition } from '../index.js';
import { BaseState, transition } from './utils.js';

/**
 * Slow directional climb getup from the ledge. Lasts `PHYSICS.LEDGE_CLIMB_FRAMES`
 * then resolves to IDLE. Platform position snap is applied by `GameEngine`.
 */
// LedgeClimbState: player climbs from the ledge onto the platform.
// After LEDGE_CLIMB_FRAMES, transitions to IDLE (standing on the platform).
// Actual position snap to the platform happens in GameEngine.applyStateTransitions.
export class LedgeClimbState extends BaseState {
  update(_ctx: FSMContext, frame: number): FSMTransition | null {
    return frame >= PHYSICS.LEDGE_CLIMB_FRAMES - 1
      ? transition(PlayerStateEnum.IDLE)
      : null;
  }
}
