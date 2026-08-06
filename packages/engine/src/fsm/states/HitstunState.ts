import { BaseState, INPUT_BITS, PlayerStateEnum, isHeld, isPressed, transition } from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

const METEOR_CANCEL_MIN_ANGLE = (260 * Math.PI) / 180;
const METEOR_CANCEL_MAX_ANGLE = (280 * Math.PI) / 180;
const METEOR_CANCEL_ELAPSED_FRAMES = 8;

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
