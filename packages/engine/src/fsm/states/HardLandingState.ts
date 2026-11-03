import{BaseState,PHYSICS,INPUT_BITS,PlayerStateEnum,isPressed,transition}from'./utils.js';import type{FSMContext,FSMTransition}from'../index.js';
export class HardLandingState extends BaseState{
 update(ctx:FSMContext,frame:number):FSMTransition|null{
  if(!ctx.isGrounded)return transition(PlayerStateEnum.AIRBORNE);
  if(frame>=18){if(isPressed(ctx.input,INPUT_BITS.ATTACK))return transition(PlayerStateEnum.ATTACK);if(isPressed(ctx.input,INPUT_BITS.LEFT)||isPressed(ctx.input,INPUT_BITS.RIGHT))return transition(PlayerStateEnum.GETUP_ROLL);if(isPressed(ctx.input,INPUT_BITS.JUMP)||isPressed(ctx.input,INPUT_BITS.SHIELD))return transition(PlayerStateEnum.GETUP);}
  return frame>=PHYSICS.TECH_MISS_LANDING_FRAMES-1?transition(PlayerStateEnum.GETUP):null;
 }
}
