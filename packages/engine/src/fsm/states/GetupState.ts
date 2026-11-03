import{BaseState,INPUT_BITS,PlayerStateEnum,isHeld,transition}from'./utils.js';import type{FSMContext,FSMTransition}from'../index.js';
/** Initial roster tuning: 24 ticks, first 8 intangible (18 for a roll). */
export class GetupState extends BaseState{
 constructor(private readonly rolling=false){super();}
 override enter(ctx:FSMContext):void{const p=ctx.player;p.vx=0;p.vy=0;p.isInvincible=true;p.invincibilityFrames=this.rolling?18:8;p.floorRollDirection=isHeld(ctx.input,INPUT_BITS.LEFT)?-1:1;}
 update(ctx:FSMContext,frame:number):FSMTransition|null{return !ctx.isGrounded?transition(PlayerStateEnum.AIRBORNE):frame>=23?transition(PlayerStateEnum.IDLE):null;}
}
