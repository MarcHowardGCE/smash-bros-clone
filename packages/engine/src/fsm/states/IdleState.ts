/** Grounded input priorities; jump+attack shortcut is handled by FSMController. */
import{BaseState,INPUT_BITS,PlayerStateEnum,isHeld,isPressed,transition}from'./utils.js';import type{FSMContext,FSMTransition}from'../index.js';
export class IdleState extends BaseState{update(ctx:FSMContext):FSMTransition|null{
 if(isPressed(ctx.input,INPUT_BITS.ATTACK)||isPressed(ctx.input,INPUT_BITS.SPECIAL)||isPressed(ctx.input,INPUT_BITS.GRAB))return transition(PlayerStateEnum.ATTACK);
 if(isPressed(ctx.input,INPUT_BITS.JUMP))return transition(PlayerStateEnum.JUMPSQUAT);
 if(isHeld(ctx.input,INPUT_BITS.SHIELD))return transition(PlayerStateEnum.SHIELD);
 if(isHeld(ctx.input,INPUT_BITS.DOWN))return transition(PlayerStateEnum.CROUCH);
 if(isHeld(ctx.input,INPUT_BITS.LEFT)||isHeld(ctx.input,INPUT_BITS.RIGHT))return transition(PlayerStateEnum.WALK);
 if(isPressed(ctx.input,INPUT_BITS.TAUNT_UP)||isPressed(ctx.input,INPUT_BITS.TAUNT_SIDE)||isPressed(ctx.input,INPUT_BITS.TAUNT_DOWN))return transition(PlayerStateEnum.TAUNT);
 return null;
}}
