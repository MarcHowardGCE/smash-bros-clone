import {BaseState,INPUT_BITS as B,PlayerStateEnum as S,PHYSICS,isHeld,isPressed,transition} from './utils.js';
import type {FSMContext,FSMTransition} from '../index.js';
/** Shield protection/parry eligibility is separate from the release lockout. */
export class ShieldState extends BaseState {
 override enter(ctx:FSMContext):void {Object.assign(ctx.player,{vx:0,vy:0,shieldParryLockFrames:0,shieldWasHit:false,shieldGrabStartup:0,shieldReleaseFrame:undefined,shieldReleaseEligible:false,shieldParryConsumed:false,shieldReaction:undefined,shieldReactionFrame:undefined,shieldDodgeIntent:(ctx.input?.pressed??0)&(B.LEFT|B.RIGHT|B.DOWN)});}
 update(ctx:FSMContext,frame:number):FSMTransition|null {
  if(ctx.player.shieldStunFrames>0){ctx.player.shieldStunFrames--;ctx.player.shieldParryLockFrames=PHYSICS.SHIELD_PARRY_MIN_HOLD_FRAMES;return null;}
  if(ctx.player.shieldParryConsumed)return transition(isHeld(ctx.input,B.SHIELD)?S.SHIELD:S.IDLE);
  if(ctx.player.shieldReleaseFrame!==undefined){
   ctx.player.shieldReleaseFrame++;
   return ctx.player.shieldReleaseFrame>=PHYSICS.SHIELD_DROP_FRAMES?transition(S.IDLE):null;
  }
  const cUp=isPressed(ctx.input,B.ATTACK)&&(ctx.input?.cStickY??0)<=-.55&&Math.abs(ctx.input?.cStickY??0)>Math.abs(ctx.input?.cStickX??0);
  const upSmash=isPressed(ctx.input,B.ATTACK)&&!isPressed(ctx.input,B.GRAB)&&(cUp||(ctx.input?.smashAttack===true&&isHeld(ctx.input,B.UP)));
  if(upSmash)return transition(S.ATTACK);
  if(isPressed(ctx.input,B.JUMP))return transition(S.JUMPSQUAT);
  if(isPressed(ctx.input,B.GRAB)||(isHeld(ctx.input,B.SHIELD)&&isPressed(ctx.input,B.ATTACK)))return transition(S.ATTACK);
  if(isHeld(ctx.input,B.UP)&&isPressed(ctx.input,B.SPECIAL))return transition(S.ATTACK);
  if(!isHeld(ctx.input,B.SHIELD)){
   ctx.player.shieldReleaseFrame=0;ctx.player.shieldReleaseEligible=frame>=PHYSICS.SHIELD_PARRY_MIN_HOLD_FRAMES&&(ctx.player.shieldParryLockFrames??0)===0;
   ctx.player.shieldReaction='drop';ctx.player.shieldReactionFrame=0;
   return null;
  }
  if((ctx.player.shieldParryLockFrames??0)>0)ctx.player.shieldParryLockFrames!--;
  const dodge=(ctx.input?.pressed??0)|(frame===0?(ctx.player.shieldDodgeIntent??0):0);ctx.player.shieldDodgeIntent=0;
  if(dodge&B.DOWN)return transition(S.SPOT_DODGE);
  if(dodge&(B.LEFT|B.RIGHT))return transition(S.ROLL);
  return null;
 }
}

