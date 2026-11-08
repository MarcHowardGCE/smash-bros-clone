import type{GamepadPoller}from'@smash/gamepad-input';
import{applyRadialDeadzone,loadStickCalibration,STANDARD_BUTTON_INDEX as I}from'@smash/gamepad-input';
import{INPUT_BITS as B,type InputBitmask}from'@smash/shared';
import { getControllerProfile } from './controllerProfiles';
export class GamepadInputSource{
 constructor(private gamepadPoller:GamepadPoller,private gamepadIndex:number,private readonly resolveIndex?:()=>number){}
 updateGamepadIndex(index:number):void{this.gamepadIndex=index;}
 getHeldBits():InputBitmask{return this.sampleInput().held;}
 sampleInput():{connected:boolean;held:number;stickX:number;stickY:number;cStickX:number;cStickY:number;jumpButtons:number;smashAttack:boolean;faceAttackHeld:boolean;rightStickNeutral:boolean;smashSensitivity:-1|0|1;cStickTilt?:boolean}{
  const state=this.gamepadPoller.poll().get(this.resolveIndex?.()??this.gamepadIndex);
  if(!state)return{connected:false,held:0,stickX:0,stickY:0,cStickX:0,cStickY:0,jumpButtons:0,smashAttack:false,faceAttackHeld:false,rightStickNeutral:true,smashSensitivity:0};
  const pad=state.gamepad,axes=pad?.axes??[],buttons=pad?.buttons??[],profile=loadStickCalibration(pad?.id??'default');
  const controller=getControllerProfile(pad?.id??'');
  const {attack,special,jumpLeft,jumpTop}=controller.positions;
  const[x,y]=applyRadialDeadzone((axes[0]??0)-profile.centerX,(axes[1]??0)-profile.centerY,profile.deadzone);
  const [rightX,rightY]=applyRadialDeadzone(axes[2]??0,axes[3]??0,.2);
  const q=(v:number)=>Math.round(v*1000)/1000;
  const cx=q(rightX),cy=q(rightY),cActive=Math.hypot(cx,cy)>=.55;
  let held=0;for(const binding of controller.bindings)if(state.bits&binding.mask)held|=binding.bit;
  if(x>=profile.threshold)held|=B.RIGHT;if(x<=-profile.threshold)held|=B.LEFT;
  if(y>=profile.threshold)held|=B.DOWN;if(y<=-profile.threshold)held|=B.UP;
  if(profile.stickJump&&y<=-.7)held|=B.JUMP;
  if(buttons[I.DPAD_UP]?.pressed)held|=B.TAUNT_UP;if(buttons[I.DPAD_DOWN]?.pressed)held|=B.TAUNT_DOWN;if(buttons[I.DPAD_LEFT]?.pressed||buttons[I.DPAD_RIGHT]?.pressed)held|=B.TAUNT_SIDE;
  if(cActive)held|=B.ATTACK;
  const jumpButtons=((state.bits&jumpLeft)?1:0)|((state.bits&jumpTop)?2:0);
  return{connected:true,held,smashSensitivity:profile.smashSensitivity,faceAttackHeld:Boolean(state.bits&attack),stickX:q(x),stickY:q(y),rightStickNeutral:rightX===0&&rightY===0,cStickX:cActive?cx:0,cStickY:cActive?cy:0,jumpButtons,cStickTilt:profile.rightStick==="tilt"||undefined,smashAttack:profile.abSmash&&!!((state.bits&special)&&(state.bits&attack))};
 }
}
