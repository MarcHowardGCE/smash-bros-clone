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
import { BaseState, INPUT_BITS, PlayerStateEnum, PHYSICS, isHeld, isPressed, transition } from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

/**
 * Grounded defensive parry state. Counts down `shieldStunFrames` before
 * accepting input. Supports shield-grab (grab while not in stun transitions
 * to ATTACK). Exits to IDLE when the shield button is released.
 */
export class ShieldState extends BaseState {
  override enter(ctx:FSMContext):void{ctx.player.shieldReleaseFrame=undefined;ctx.player.shieldReleaseEligible=false;ctx.player.shieldParryConsumed=false;ctx.player.shieldDodgeIntent=(ctx.input?.pressed??0)&(INPUT_BITS.LEFT|INPUT_BITS.RIGHT|INPUT_BITS.DOWN);}
  update(ctx: FSMContext, frame: number): FSMTransition | null {
    if (ctx.player.shieldStunFrames > 0) {
      ctx.player.shieldStunFrames -= 1;
      return null;
    }

    if(ctx.player.shieldReleaseFrame===undefined){if(isPressed(ctx.input,INPUT_BITS.GRAB)||isPressed(ctx.input,INPUT_BITS.ATTACK))return transition(PlayerStateEnum.ATTACK);if(isPressed(ctx.input,INPUT_BITS.JUMP))return transition(PlayerStateEnum.JUMPSQUAT);}
    if(ctx.player.shieldParryConsumed)return transition(PlayerStateEnum.IDLE);
    if(!isHeld(ctx.input,INPUT_BITS.SHIELD)){
      if(ctx.player.shieldReleaseFrame===undefined){ctx.player.shieldReleaseFrame=0;ctx.player.shieldReleaseEligible=frame>=PHYSICS.SHIELD_PARRY_MIN_HOLD_FRAMES;}
      else ctx.player.shieldReleaseFrame++;
      return ctx.player.shieldReleaseFrame>=PHYSICS.PERFECT_SHIELD_WINDOW_FRAMES?transition(PlayerStateEnum.IDLE):null;
    }
    ctx.player.shieldReleaseFrame=undefined;ctx.player.shieldReleaseEligible=false;
    // Shield-grab: allow grab directly out of shield via ATTACK state
    if (ctx.player.shieldStunFrames <= 0 && (isPressed(ctx.input, INPUT_BITS.GRAB)||isPressed(ctx.input,INPUT_BITS.ATTACK))) {
      return transition(PlayerStateEnum.ATTACK);
    }

    if(isPressed(ctx.input,INPUT_BITS.JUMP))return transition(PlayerStateEnum.JUMPSQUAT);
    const dodge=(ctx.input?.pressed??0)|(frame===0?(ctx.player.shieldDodgeIntent??0):0);ctx.player.shieldDodgeIntent=0;
    if(isHeld(ctx.input,INPUT_BITS.SHIELD)){if(dodge&INPUT_BITS.DOWN)return transition(PlayerStateEnum.SPOT_DODGE);if(dodge&(INPUT_BITS.LEFT|INPUT_BITS.RIGHT))return transition(PlayerStateEnum.ROLL);}
    if (!isHeld(ctx.input, INPUT_BITS.SHIELD)) {
      return transition(PlayerStateEnum.IDLE);
    }

    return null;
  }
}
