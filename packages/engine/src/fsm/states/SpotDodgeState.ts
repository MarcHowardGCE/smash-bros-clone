import {beginDodge,dodgeTiming} from '../../physics/dodgeFatigue.js';
import {BaseState,PlayerStateEnum as S,INPUT_BITS as B,isPressed,isHeld,transition} from './utils.js';
import type {FSMContext,FSMTransition} from '../index.js';
/** Fighter-specific spot-dodge recovery and ground-attack cancel. */
export class SpotDodgeState extends BaseState {
 override enter(ctx:FSMContext):void {beginDodge(ctx.player);ctx.player.vx=0;ctx.player.vy=0;}
 update(ctx:FSMContext,frame:number):FSMTransition|null {
  if(!ctx.isGrounded)return transition(S.AIRBORNE);
  const timing=dodgeTiming(ctx.player);
  const grab=isPressed(ctx.input,B.GRAB)||(ctx.input?.stickX!==undefined&&isHeld(ctx.input,B.SHIELD)&&isPressed(ctx.input,B.ATTACK));
  if(frame>=timing.attackCancel!-1&&!grab&&(isPressed(ctx.input,B.ATTACK)||isPressed(ctx.input,B.SPECIAL)))return transition(S.ATTACK);
  return frame>=timing.total-1?transition(S.IDLE):null;
 }
}
