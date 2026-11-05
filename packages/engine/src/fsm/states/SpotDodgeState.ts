import {BaseState,PlayerStateEnum as S,INPUT_BITS as B,PHYSICS,isPressed,isHeld,transition} from './utils.js';
import type {FSMContext,FSMTransition} from '../index.js';
/** Shared roster baseline: attack cancel at frame 20, full recovery after 25 frames. */
export class SpotDodgeState extends BaseState {
 override enter(ctx:FSMContext):void {ctx.player.vx=0;ctx.player.vy=0;}
 update(ctx:FSMContext,frame:number):FSMTransition|null {
  if(!ctx.isGrounded)return transition(S.AIRBORNE);
  const grab=isPressed(ctx.input,B.GRAB)||(ctx.input?.stickX!==undefined&&isHeld(ctx.input,B.SHIELD)&&isPressed(ctx.input,B.ATTACK));
  if(frame>=PHYSICS.SPOT_DODGE_ATTACK_CANCEL_FRAME&&!grab&&(isPressed(ctx.input,B.ATTACK)||isPressed(ctx.input,B.SPECIAL)))return transition(S.ATTACK);
  return frame>=PHYSICS.SPOT_DODGE_TOTAL_FRAMES-1?transition(S.IDLE):null;
 }
}
