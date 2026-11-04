import{BaseState,PHYSICS,PlayerStateEnum,transition}from'./utils.js';import type{FSMContext,FSMTransition}from'../index.js';
/** Recovery commitment: drift is handled by physics, action inputs are ignored. */
export class HelplessState extends BaseState{update(ctx:FSMContext):FSMTransition|null{return ctx.isGrounded?transition(PlayerStateEnum.HELPLESS_LAND):null;}}
export class HelplessLandState extends BaseState{update(ctx:FSMContext,frame:number):FSMTransition|null{if(!ctx.isGrounded)return transition(PlayerStateEnum.HELPLESS);return frame>=PHYSICS.HELPLESS_LANDING_FRAMES-1?transition(PlayerStateEnum.IDLE):null;}}
