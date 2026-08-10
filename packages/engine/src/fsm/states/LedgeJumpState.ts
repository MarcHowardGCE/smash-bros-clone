/**
 * @fileoverview LEDGE_JUMP state — aerial getup from the ledge with jump velocity.
 *
 * Triggered by pressing JUMP while hanging. The fighter launches off the ledge
 * into the air. Jump velocity is applied by `GameEngine.applyStateTransitions`
 * when this transition fires; this state just counts frames.
 *
 * Entered from: LEDGE_HANG (jump pressed).
 *
 * Transitions out to: AIRBORNE (frame >= PHYSICS.LEDGE_JUMP_FRAMES - 1).
 */
import { PHYSICS, PlayerStateEnum } from '@smash/shared';
import type { FSMContext, FSMTransition } from '../index.js';
import { BaseState, transition } from './utils.js';

/**
 * Ledge jump getup. Lasts `PHYSICS.LEDGE_JUMP_FRAMES` then transitions to AIRBORNE.
 * Jump velocity is applied by `GameEngine` at the transition frame.
 */
// LedgeJumpState: player jumps off the ledge.
// After LEDGE_JUMP_FRAMES, transitions to AIRBORNE; jump velocity applied by GameEngine.applyStateTransitions.
export class LedgeJumpState extends BaseState {
  update(_ctx: FSMContext, frame: number): FSMTransition | null {
    return frame >= PHYSICS.LEDGE_JUMP_FRAMES - 1
      ? transition(PlayerStateEnum.AIRBORNE)
      : null;
  }
}
