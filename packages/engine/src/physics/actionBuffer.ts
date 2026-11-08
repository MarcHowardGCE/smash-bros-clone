import {INPUT_BITS as B,PHYSICS,type InputEvent,type PlayerState} from '@smash/shared';
import {isRunTransition,runTransitionAge,RUN_BRAKE_EARLY_AGE,RUN_TRANSITION_ACTION_AGE} from './groundIntent.js';
export const ACTION_BUFFER_TICKS=6;
const ACTIONS=B.JUMP|B.ATTACK|B.SPECIAL|B.GRAB|B.SHIELD;
const LANDING_PRESS_TICKS=9;
const LANDING_HOLD_TICKS=3;
const LANDING_BUTTONS=B.JUMP|B.ATTACK;
const DIRECTIONS=B.LEFT|B.RIGHT|B.UP|B.DOWN;
const WAITING=['ATTACK','AIR_ATTACK','LANDING_LAG','HELPLESS_LAND'];
const READY=['IDLE','WALK','DASH','RUN','CROUCH'];
const AIR_HITSTUN_ACTIONS = B.JUMP | B.ATTACK | B.SPECIAL;
const AIR_HITSTUN_PRESS_TICKS = 9;
const AIR_HITSTUN_HOLD_TICKS = 3;

function prepareAirHitstunInput(player: PlayerState, input: InputEvent | null) {
 const fresh = (input?.pressed ?? 0) & AIR_HITSTUN_ACTIONS;
 const saved = player.actionBuffer;
 const unlocked = player.hitstunFramesRemaining <= 0 && player.hitlagFramesRemaining === 0 &&
  !player.launchImpact?.remaining;

 if (unlocked) {
  const next = {...player, actionBuffer:undefined};
  if (!saved || saved.framesLeft <= 0 || fresh || (input?.pressed ?? 0) & (B.SHIELD | B.GRAB) ||
   (input?.held ?? 0) & B.SHIELD) return {player:next,input};
  const live = input ?? {...saved.input,held:0,pressed:0,released:0};
  const command = saved.input;
  return {player:next,input:{...live,pressed:command.pressed,
   held:(live.held & ~DIRECTIONS) | (command.held & DIRECTIONS),
   stickX:command.stickX,stickY:command.stickY,cStickX:command.cStickX,cStickY:command.cStickY,
   attackAim:command.attackAim}};
 }

 if (fresh && input) {
  return {player:{...player,actionBuffer:{input:{...input,pressed:fresh},framesLeft:AIR_HITSTUN_PRESS_TICKS}},input};
 }
 if (!saved) return {player,input};

 const framesLeft = Math.max(0, saved.framesLeft - 1);
 const rightStick = Math.hypot(saved.input.cStickX ?? 0,saved.input.cStickY ?? 0) >= .55;
 const holdable = rightStick || input?.faceAttackHeld === false ? B.JUMP | B.SPECIAL : AIR_HITSTUN_ACTIONS;
 const held = (input?.held ?? 0) & saved.input.pressed & holdable;
 if (input && held && player.hitstunFramesRemaining === AIR_HITSTUN_HOLD_TICKS &&
  player.hitlagFramesRemaining === 0 && !player.launchImpact?.remaining && framesLeft < AIR_HITSTUN_HOLD_TICKS) {
  const command = {...input,pressed:held,attackAim:undefined,cStickX:undefined,cStickY:undefined};
  return {player:{...player,actionBuffer:{input:command,framesLeft:AIR_HITSTUN_HOLD_TICKS}},input};
 }
 return {player:{...player,actionBuffer:framesLeft || held ? {...saved,framesLeft} : undefined},input};
}

const PARRY_PRESS_TICKS = 29;
const PARRY_HOLD_TICKS = 3;
const PARRY_TILT_DIRECTION_TICKS = 3;
const PARRY_SMASH_DIRECTION_TICKS = 4;

function parryStickHeld(input: InputEvent | null) {
 return input?.rightStickHeld ?? (input?.faceAttackHeld !== true && !!((input?.held ?? 0) & B.ATTACK));
}

function replayParryStick(player: PlayerState, live: InputEvent, command: InputEvent, directionActive: boolean) {
 const x = command.cStickX ?? 0;
 const y = command.cStickY ?? 0;
 const left = !!(live.held & B.LEFT);
 const right = !!(live.held & B.RIGHT);
 const expiredSide = !directionActive && Math.abs(x) >= Math.abs(y);
 // Keep the queued side attack, but let live left-stick direction choose its facing.
 return {...live,pressed:B.ATTACK,held:live.held & ~B.SHIELD,smashAttack:false,attackAim:undefined,
  cStickX:expiredSide ? (left === right ? player.facing : left ? -1 : 1) : x,
  cStickY:expiredSide ? 0 : y,cStickTilt:command.cStickTilt};
}

function prepareParryInput(player: PlayerState, input: InputEvent | null, contact: boolean) {
 // Hitstop and guardstun tick in sequence. Contact is one tick before either clock counts down.
 const remaining = player.hitlagFramesRemaining + player.shieldStunFrames + Number(contact);
 const saved = contact ? undefined : player.actionBuffer;
 const pressed = input?.pressed ?? 0;
 const stickEdge = !!(pressed & B.ATTACK) && Math.hypot(input?.cStickX ?? 0,input?.cStickY ?? 0) >= .55;
 const faceHeldAtPress = input?.attackAim?.faceAttackHeld ?? input?.faceAttackHeld;
 const faceEdge = !!(pressed & B.ATTACK) && (input?.faceAttackPressed ?? (!stickEdge || faceHeldAtPress === true));
 const stickAllowed = stickEdge && (!input?.cStickTilt || !faceHeldAtPress || faceEdge);
 const buttonPress = pressed & (ACTIONS & ~(faceEdge ? 0 : B.ATTACK));
 const stickHeld = parryStickHeld(input);

 if (remaining <= 0) {
  const next = {...player,state:'IDLE',stateFrame:0,isShielding:false,shieldParryConsumed:false,
   shieldReleaseFrame:undefined,shieldReleaseEligible:false,actionBuffer:undefined};
  if (stickAllowed) return {player:next,input};
  const live = stickEdge && input ? {...input,pressed:pressed & ~B.ATTACK,cStickX:undefined,cStickY:undefined,cStickTilt:undefined} : input;
  if (buttonPress || !saved || saved.framesLeft <= 0) return {player:next,input:live};
  const command = saved.input;
  const current = live ?? {...command,held:0,pressed:0,released:0,stickX:undefined,stickY:undefined};
  if (saved.parryStickDirectionTicks !== undefined) {
   return {player:next,input:replayParryStick(next,current,command,stickHeld && saved.parryStickDirectionTicks > 1)};
  }
  return {player:next,input:{...current,pressed:command.pressed,
   held:(current.held & ~(DIRECTIONS | B.SHIELD)) | (command.held & DIRECTIONS),
   stickX:command.stickX,stickY:command.stickY,cStickX:undefined,cStickY:undefined,cStickTilt:undefined,
   smashAttack:command.smashAttack,attackAim:command.attackAim,jumpButtons:command.jumpButtons}};
 }

 const queueStick = stickAllowed && !(buttonPress & (B.JUMP | B.SPECIAL | B.GRAB));
 const fresh = queueStick ? B.ATTACK : buttonPress & ~B.SHIELD;
 if (fresh && input) {
  const framesLeft = remaining <= PARRY_PRESS_TICKS ? remaining + 1 : 0;
  const command = queueStick ? input : {...input,cStickX:undefined,cStickY:undefined,cStickTilt:undefined};
  const directionTicks = input.cStickTilt ? PARRY_TILT_DIRECTION_TICKS : PARRY_SMASH_DIRECTION_TICKS;
  return {player:{...player,actionBuffer:{input:{...command,pressed:fresh},framesLeft,
   ...(queueStick ? {parryStickDirectionTicks:directionTicks} : {})}},input};
 }
 if (!saved) return {player:contact ? {...player,actionBuffer:undefined} : player,input};
 if (saved.parryStickDirectionTicks !== undefined) {
  const direction = stickHeld ? Math.max(0,saved.parryStickDirectionTicks - 1) : 0;
  const framesLeft = saved.framesLeft > 0 ? saved.framesLeft - 1 : stickHeld && remaining === PARRY_HOLD_TICKS ? remaining + 1 : 0;
  const buffer = framesLeft || stickHeld ? {...saved,framesLeft,parryStickDirectionTicks:direction} : undefined;
  return {player:{...player,actionBuffer:buffer},input};
 }
 if (saved.framesLeft > 0) {
  return {player:{...player,actionBuffer:{...saved,framesLeft:saved.framesLeft - 1}},input};
 }

 const held = (input?.held ?? 0) & saved.input.pressed & (input?.faceAttackHeld === false ? ~B.ATTACK : ACTIONS);
 if (!input || !held) return {player:{...player,actionBuffer:undefined},input};
 if (remaining === PARRY_HOLD_TICKS) {
  return {player:{...player,actionBuffer:{
   input:{...input,pressed:held,attackAim:undefined,smashAttack:undefined},framesLeft:remaining + 1,
  }},input};
 }
 return {player:{...player,actionBuffer:{...saved,input:{...saved.input,pressed:held}}},input};
}

/** Buffers recovery presses and qualifies held inputs once, before recovery ends. */
export function prepareActionInput(player:PlayerState,input:InputEvent|null,parryContact=false):{player:PlayerState;input:InputEvent|null} {
 if(player.state==='SHIELD'&&player.shieldParryConsumed&&!player.isKnockedOut&&player.respawnTimer<=0)
  return prepareParryInput(player,input,parryContact);
 if(player.state==='HITSTUN'&&!player.isGrounded&&player.lastHitKnockbackAngle!=null&&!player.footstoolRole&&
  !player.isKnockedOut&&player.respawnTimer<=0)return prepareAirHitstunInput(player,input);
 if(player.isGrounded&&!player.isKnockedOut&&player.respawnTimer<=0&&player.hitstunFramesRemaining<=0&&isRunTransition(player.state)){
  const age=runTransitionAge(player),pressed=input?.pressed??0;
  const brake=player.state==='RUN_BRAKE';
  const middleBrake=brake&&age>=RUN_BRAKE_EARLY_AGE&&age<RUN_TRANSITION_ACTION_AGE;
  const direction=(input?.held??0)&(B.LEFT|B.RIGHT);
  const pivot=direction===(player.facing===1?B.LEFT:B.RIGHT);
  const deferred=pressed&B.GRAB?(pivot?0:B.GRAB):pressed&B.SPECIAL;
  if(middleBrake&&deferred&&!(pressed&B.JUMP)&&input){
   return {player:{...player,actionBuffer:{input:{...input,pressed:deferred},framesLeft:ACTION_BUFFER_TICKS}},
    input:{...input,pressed:pressed&~deferred}};
  }
  const saved=player.actionBuffer?.input;
  if(age>=RUN_TRANSITION_ACTION_AGE&&saved){
   const next={...player,actionBuffer:undefined};
   if(pressed&ACTIONS)return {player:next,input};
   const live=input??{...saved,held:0,pressed:0,released:0};
   return {player:next,input:{...live,pressed:saved.pressed,held:(live.held&~DIRECTIONS)|(saved.held&DIRECTIONS)}};
  }
  return {player,input};
 }

 const groundedArrival=player.isGrounded&&player.state==='AIRBORNE';
 const landing=player.isGrounded&&player.state==='LANDING_LAG';
 const recoveryReady=player.isGrounded&&((landing&&player.landingLagFrames===0)||(player.state==='HELPLESS_LAND'&&player.stateFrame>=PHYSICS.HELPLESS_LANDING_FRAMES-1));
 const shieldDropping=player.state==='SHIELD'&&player.shieldStunFrames<=0&&!player.shieldParryConsumed&&(player.shieldReleaseFrame!==undefined||!((input?.held??0)&B.SHIELD));
 const shieldReady=shieldDropping&&(player.shieldReleaseFrame??-1)>=PHYSICS.SHIELD_DROP_FRAMES;
 const ready=player.isGrounded&&(READY.includes(player.state)||groundedArrival||recoveryReady||shieldReady);
 const airborneLanding=player.state==='AIRBORNE'&&!player.isGrounded&&!player.hasDoubleJump&&player.vy>=0;
 const waiting=WAITING.includes(player.state)||airborneLanding||shieldDropping;
 if(player.isKnockedOut||player.respawnTimer>0||player.hitstunFramesRemaining>0||(!ready&&!waiting))
  return {player:{...player,actionBuffer:undefined},input};
 let next=groundedArrival||recoveryReady||shieldReady?{...player,state:'IDLE',stateFrame:0}:player;
 const rawFresh=(input?.pressed??0)&ACTIONS;
 const fresh=airborneLanding?(rawFresh===B.JUMP?B.JUMP:0):rawFresh;
 let buffer=airborneLanding&&rawFresh&&rawFresh!==B.JUMP?undefined:player.actionBuffer;
 if(ready){
  next={...next,actionBuffer:undefined};
  if(fresh||!buffer||buffer.framesLeft<=0)return {player:next,input};
  const live=input??{...buffer.input,pressed:0,held:0,released:0};
  const saved=buffer.input;
  return {player:next,input:{...live,pressed:saved.pressed&ACTIONS,
   held:(live.held&~DIRECTIONS)|(saved.held&DIRECTIONS)|(saved.pressed&B.SHIELD),
   stickX:saved.stickX,stickY:saved.stickY,cStickX:saved.cStickX,cStickY:saved.cStickY,cStickTilt:saved.cStickTilt,
   smashAttack:saved.smashAttack,attackAim:saved.attackAim,jumpButtons:live.jumpButtons}};
 }
 const canCarryHold=landing||player.state==='AIR_ATTACK';
 const heldButtons=(input?.held??0)&(input?.faceAttackHeld===false?B.JUMP:LANDING_BUTTONS);
 if(fresh&&input){
  const rightStick=Math.hypot(input.cStickX??0,input.cStickY??0)>=.55;
  const landingButtons=fresh&(rightStick?B.JUMP:LANDING_BUTTONS);
  const buttonCommand=landingButtons===fresh;
  buffer={
   input:{...input,pressed:fresh},
   framesLeft:landing&&buttonCommand?LANDING_PRESS_TICKS:ACTION_BUFFER_TICKS,
   landingHold:canCarryHold?landingButtons&heldButtons:0,
  };
 }else if(buffer){
  const landingHold=canCarryHold?(buffer.landingHold??0)&heldButtons:0;
  const framesLeft=Math.max(0,buffer.framesLeft-1);
  // Before this tick is processed, the landing counter includes this locked tick.
  // A hold on the third tick before action becomes a committed one-shot press.
  if(landing&&player.landingLagFrames===LANDING_HOLD_TICKS&&landingHold&&input&&framesLeft<LANDING_HOLD_TICKS){
   buffer={input:{...input,pressed:landingHold,attackAim:undefined,cStickX:undefined,cStickY:undefined,cStickTilt:undefined},framesLeft:LANDING_HOLD_TICKS};
  }else{
   buffer=framesLeft||landingHold?{...buffer,framesLeft,landingHold}:undefined;
  }
 }
 return {player:{...next,actionBuffer:buffer},input};
}


