/**
 * @fileoverview GRAB_HOLDING state — the fighter is holding a grabbed opponent.
 *
 * Holds the fighter in the grab pose for up to 90 frames. During this window
 * the player can pummel (ATTACK) or throw (directional press or JUMP/DOWN).
 * Both pummel and throw transition to ATTACK, where the specific move ID
 * (`MoveId.PUMMEL` or a throw) determines what happens.
 *
 * Pummel stale-move accumulation: `GameEngine` tracks pummel hits in a stale-
 * move queue. Each successive pummel deals slightly less damage — the same
 * staleness mechanic that applies to all other moves. This state doesn't
 * manage the queue directly; it just fires the ATTACK transition on each
 * pummel press and `GameEngine` handles the queue accumulation.
 *
 * If the grab times out (frame >= 90) or the opponent escapes (`isGrabbing`
 * becomes false), the state exits to IDLE immediately.
 *
 * Entered from: GRAB (isGrabbing becomes true).
 *
 * Transitions out to: IDLE (isGrabbing lost or frame >= 90), ATTACK (pummel or
 * throw input pressed).
 */
import {
  BaseState,
  INPUT_BITS,
  PlayerStateEnum,
  isPressed,
  transition,
} from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

/**
 * Grab-holding pose. Accepts pummel (ATTACK) and throw (directional/JUMP/DOWN)
 * inputs for up to 90 frames. Exits immediately if the opponent escapes or the
 * timeout expires. Pummel stale-move accumulation is tracked by `GameEngine`, not here.
 */
export class GrabHoldingState extends BaseState {
  update(ctx: FSMContext, frame: number): FSMTransition | null {
    if (!ctx.player.isGrabbing) {
      return transition(PlayerStateEnum.IDLE);
    }

    if (frame >= 89) {
      return transition(PlayerStateEnum.IDLE);
    }

    const wantsThrowDirection =
      isPressed(ctx.input, INPUT_BITS.LEFT) ||
      isPressed(ctx.input, INPUT_BITS.RIGHT) ||
      isPressed(ctx.input, INPUT_BITS.JUMP) ||
      isPressed(ctx.input, INPUT_BITS.DOWN);

    if (isPressed(ctx.input, INPUT_BITS.ATTACK) || wantsThrowDirection) {
      return transition(PlayerStateEnum.ATTACK);
    }

    return null;
  }
}
