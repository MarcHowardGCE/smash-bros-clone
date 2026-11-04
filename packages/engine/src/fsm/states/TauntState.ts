import{BaseState,PlayerStateEnum,transition}from'./utils.js';import type{FSMContext,FSMTransition}from'../index.js';
/** Initial custom 64-tick commitment; incoming hits and losing footing interrupt. */
export class TauntState extends BaseState{update(ctx:FSMContext,frame:number):FSMTransition|null{if(!ctx.isGrounded)return transition(PlayerStateEnum.AIRBORNE);return frame>=63?transition(PlayerStateEnum.IDLE):null;}}
