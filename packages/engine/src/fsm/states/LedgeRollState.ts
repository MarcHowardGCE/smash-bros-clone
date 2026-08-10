/**
 * @fileoverview LEDGE_ROLL state — invincible roll getup from the ledge onto the platform.
 *
 * Triggered by pressing SHIELD while hanging. The fighter rolls onto the stage
 * with invincibility frames. Lasts `PHYSICS.LEDGE_ROLL_FRAMES` (45) frames.
 * Invincibility and position snap are applied by `GameEngine.applyStateTransitions`,
 * not here. This state just counts frames.
 *
 * Entered from: LEDGE_HANG (shield pressed).
 *
 * Transitions out to: IDLE (frame >= PHYSICS.LEDGE_ROLL_FRAMES - 1).
 */
import { PHYSICS, PlayerStateEnum } from '@smash/shared';
import type { FSMContext, FSMTransition } from '../index.js';
import { BaseState, transition } from './utils.js';

/**
 * Ledge roll getup. Lasts `PHYSICS.LEDGE_ROLL_FRAMES` (45) then returns to IDLE.
 * Invincibility and platform position snap are handled by `GameEngine`, not here.
 */
// LedgeRollState: player rolls from the ledge onto the platform.
// After LEDGE_ROLL_FRAMES (45), transitions to IDLE.
// Any roll invincibility is applied by GameEngine.applyStateTransitions, not here.
export class LedgeRollState extends BaseState {
  update(_ctx: FSMContext, frame: number): FSMTransition | null {
    return frame >= PHYSICS.LEDGE_ROLL_FRAMES - 1
      ? transition(PlayerStateEnum.IDLE)
      : null;
  }
}
