/**
 * Tracked body launches permit an early air dodge or aerial when both the
 * live-hitstun and remaining launch-speed gates are met.
 */
import { BaseState, INPUT_BITS, PlayerStateEnum, isHeld, isPressed, transition } from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';
import { AirborneState } from './AirborneState.js';
import { IdleState } from './IdleState.js';
import { hasLaunch, LAUNCH } from '../../physics/launchMotion.js';

const airborne = new AirborneState();
const idle = new IdleState();

const METEOR_CANCEL_MIN_ANGLE = (260 * Math.PI) / 180;
const METEOR_CANCEL_MAX_ANGLE = (280 * Math.PI) / 180;
const METEOR_CANCEL_ELAPSED_FRAMES = 8;

export class HitstunState extends BaseState {
  update(ctx: FSMContext): FSMTransition | null {
    const { player, input } = ctx;
    if (player.hitstunFramesRemaining > 0 && hasLaunch(player)) {
      if (ctx.isGrounded) return null;
      const elapsed = player.stateFrame + Number(player.launchThawStep === true);
      const electricDelay = Number(player.launchElectric === true);
      const speed = Math.hypot(player.launchVx!, player.launchVy!) / LAUNCH.WORLD_UNITS_PER_REFERENCE_UNIT;
      if (elapsed >= 45 + electricDelay && speed <= 2 && isPressed(input, INPUT_BITS.ATTACK) && !isPressed(input, INPUT_BITS.SPECIAL)) {
        return transition(PlayerStateEnum.AIR_ATTACK);
      }
      if (elapsed >= 40 + electricDelay && speed <= 2.5 && player.hasAirDodge && isPressed(input, INPUT_BITS.SHIELD)) {
        return transition(PlayerStateEnum.AIR_DODGE);
      }
      return null;
    }

    // Legacy reactions without a tracked body launch retain their existing exit.
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

    if (ctx.isGrounded && !player.isTumbling && player.shieldReaction !== 'break') {
      return idle.update(ctx) ?? transition(PlayerStateEnum.IDLE);
    }

    const airAction = !ctx.isGrounded ? airborne.update(ctx) : null;
    if (ctx.tumbleRecovery === 'floor' &&
      (!airAction || airAction.nextState === PlayerStateEnum.AIR_DODGE)) {
      return null;
    }
    if (airAction && (!player.isTumbling || airAction.nextState !== PlayerStateEnum.AIR_DODGE ||
      ctx.tumbleRecovery === 'buffered-dodge')) return airAction;
    if (ctx.tumbleRecovery === 'buffered-dodge' && player.hasAirDodge) {
      return transition(PlayerStateEnum.AIR_DODGE);
    }

    if (!ctx.player.isTumbling) {
      return transition(PlayerStateEnum.AIRBORNE);
    }

    const directionalInputHeld =
      isHeld(ctx.input, INPUT_BITS.LEFT) ||
      isHeld(ctx.input, INPUT_BITS.RIGHT) ||
      isHeld(ctx.input, INPUT_BITS.UP) ||
      isHeld(ctx.input, INPUT_BITS.DOWN);

    return directionalInputHeld ? transition(PlayerStateEnum.AIRBORNE) : null;
  }
}
