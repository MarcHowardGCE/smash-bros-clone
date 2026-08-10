/**
 * @fileoverview HITSTUN state — defender lockout during knockback.
 *
 * The fighter is locked out of all actions while `hitstunFramesRemaining > 0`.
 * `FSMController.tick()` decrements that counter every tick regardless of which
 * state is active, so this state just reads the remaining count.
 *
 * Two exit paths:
 * 1. Normal: hitstun expires → AIRBORNE (or, if `isTumbling`, waits for
 *    directional input before releasing control).
 * 2. Meteor cancel: if the knockback angle is within the downward meteor window
 *    (260°–280°) and the player presses JUMP or SPECIAL after frame 8, the state
 *    transitions early to AIRBORNE — cancelling the downward spike trajectory.
 *
 * ASDI drift (Automatic/Additional Smash DI) is applied by `FSMController.tick()`
 * before calling `update()` here — this state doesn't need to handle it.
 *
 * Entered from: externally by `GameEngine` when a hit lands (state forced to
 * HITSTUN via `player.state` override, detected by FSMController re-sync).
 *
 * Transitions out to: AIRBORNE (hitstun expires or meteor cancel triggered).
 */
import { BaseState, INPUT_BITS, PlayerStateEnum, isHeld, isPressed, transition } from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

const METEOR_CANCEL_MIN_ANGLE = (260 * Math.PI) / 180;
const METEOR_CANCEL_MAX_ANGLE = (280 * Math.PI) / 180;
const METEOR_CANCEL_ELAPSED_FRAMES = 8;

/**
 * Defender lockout state during knockback. Holds until `hitstunFramesRemaining`
 * reaches zero. Supports meteor-cancel escape (JUMP/SPECIAL after frame 8 on a
 * downward spike trajectory). Tumble mode requires directional input to release
 * control even after hitstun expires.
 */
export class HitstunState extends BaseState {
  update(ctx: FSMContext): FSMTransition | null {
    const knockbackAngle = ctx.player.lastHitKnockbackAngle;
    const isDownwardMeteor =
      knockbackAngle !== null &&
      knockbackAngle !== undefined &&
      knockbackAngle >= METEOR_CANCEL_MIN_ANGLE &&
      knockbackAngle <= METEOR_CANCEL_MAX_ANGLE;
    const hitstunElapsed = ctx.player.stateFrame;
    const meteorCancelWindowOpen = hitstunElapsed > METEOR_CANCEL_ELAPSED_FRAMES;
    const meteorCancelInput =
      isPressed(ctx.input, INPUT_BITS.JUMP) || isPressed(ctx.input, INPUT_BITS.SPECIAL);

    if (
      ctx.player.hitstunFramesRemaining > 0 &&
      isDownwardMeteor &&
      meteorCancelWindowOpen &&
      meteorCancelInput
    ) {
      return transition(PlayerStateEnum.AIRBORNE);
    }

    if (ctx.player.hitstunFramesRemaining > 0) {
      return null;
    }

    if (!ctx.player.isTumbling) {
      return transition(PlayerStateEnum.AIRBORNE);
    }

    const directionalInputHeld =
      isHeld(ctx.input, INPUT_BITS.LEFT) ||
      isHeld(ctx.input, INPUT_BITS.RIGHT) ||
      isHeld(ctx.input, INPUT_BITS.JUMP) ||
      isHeld(ctx.input, INPUT_BITS.DOWN);

    return directionalInputHeld ? transition(PlayerStateEnum.AIRBORNE) : null;
  }
}
