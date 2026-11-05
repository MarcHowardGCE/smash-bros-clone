import {INPUT_BITS as B,PHYSICS,type InputEvent,type PlayerState} from '@smash/shared';
export const ACTION_BUFFER_TICKS=6;
const ACTIONS=B.JUMP|B.ATTACK|B.SPECIAL|B.GRAB|B.SHIELD;
const DIRECTIONS=B.LEFT|B.RIGHT|B.UP|B.DOWN;
const WAITING=['ATTACK','AIR_ATTACK','LANDING_LAG','HELPLESS_LAND'];
const READY=['IDLE','WALK','DASH','RUN','CROUCH'];
/** Edge buffer for grounded action recovery only; no held-repeat or hitstun escape policy. */
export function prepareActionInput(player:PlayerState,input:InputEvent|null):{player:PlayerState;input:InputEvent|null} {
 const groundedArrival=player.isGrounded&&player.state==='AIRBORNE';
 const recoveryReady=player.isGrounded&&((player.state==='LANDING_LAG'&&player.landingLagFrames===0)||(player.state==='HELPLESS_LAND'&&player.stateFrame>=PHYSICS.HELPLESS_LANDING_FRAMES-1));
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
   stickX:saved.stickX,stickY:saved.stickY,cStickX:saved.cStickX,cStickY:saved.cStickY,
   smashAttack:saved.smashAttack,jumpButtons:live.jumpButtons}};
 }
 if(fresh&&input)buffer={input:{...input,pressed:fresh},framesLeft:ACTION_BUFFER_TICKS};
 else if(buffer)buffer=buffer.framesLeft>1?{...buffer,framesLeft:buffer.framesLeft-1}:undefined;
 return {player:{...next,actionBuffer:buffer},input};
}


