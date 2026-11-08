import {it,expect} from 'vitest';import {prepareActionInput as step,ACTION_BUFFER_TICKS} from './actionBuffer.js';import{INPUT_BITS as B,type PlayerState,type InputEvent}from'@smash/shared';
const p=(state='ATTACK')=>({id:'a',state,stateFrame:0,isGrounded:true,hitstunFramesRemaining:0,respawnTimer:0,isKnockedOut:false}as PlayerState);
const input=(pressed:number,held=pressed,extra={})=>({playerId:'a',tick:1,seq:1,pressed,held,released:0,...extra}as InputEvent);
it('replays a released jump once on the first actionable grounded tick',()=>{const queued=step(p(),input(B.JUMP)).player;expect(queued.actionBuffer?.framesLeft).toBe(ACTION_BUFFER_TICKS);const ready=step({...queued,state:'IDLE'},null);expect(ready.input?.pressed).toBe(B.JUMP);expect(ready.input?.held&B.JUMP).toBe(0);expect(ready.player.actionBuffer).toBeUndefined();expect(step(ready.player,null).input).toBeNull();});
it('expires old edges and does not refresh a held button',()=>{let player=step(p(),input(B.JUMP)).player;for(let t=0;t<6;t++)player=step(player,input(0,B.JUMP)).player;expect(player.actionBuffer).toBeUndefined();expect(step({...player,state:'IDLE'},input(0)).input?.pressed).toBe(0);});
it('fresh action supersedes pending intent and retains press-time direction',()=>{const queued=step(p(),input(B.SPECIAL,B.SPECIAL|B.LEFT,{stickX:-1,stickY:0})).player;const replay=step({...queued,state:'IDLE'},input(0)).input!;expect(replay.held&B.LEFT).toBe(B.LEFT);expect(replay.stickX).toBe(-1);expect(step({...queued,state:'IDLE'},input(B.ATTACK)).input?.pressed).toBe(B.ATTACK);});
it('clears on damage, KO, grabbed/ledge interruption and does not queue normal airborne actions',()=>{const queued=step(p(),input(B.JUMP)).player;for(const changes of[{hitstunFramesRemaining:10},{isKnockedOut:true},{state:'GRABBED'},{state:'LEDGE_HANG'},{state:'AIRBORNE',isGrounded:false}])expect(step({...queued,...changes},null).player.actionBuffer).toBeUndefined();});
it('normalizes a grounded airborne state without delaying the fresh action',()=>{const result=step(p('AIRBORNE'),input(B.JUMP));expect(result.player.state).toBe('IDLE');expect(result.input?.pressed).toBe(B.JUMP);});



it('does not convert a held right-stick attack into a held face-button command',()=>{
 let player={...p('LANDING_LAG'),landingLagFrames:16};
 player=step(player,input(B.ATTACK,B.ATTACK,{faceAttackHeld:true})).player;
 for(let remaining=15;remaining>0;remaining--){
  player=step({...player,landingLagFrames:remaining},input(0,B.ATTACK,{faceAttackHeld:false})).player;
 }
 const ready=step({...player,landingLagFrames:0},input(0,B.ATTACK,{faceAttackHeld:false}));
 expect(ready.input?.pressed).toBe(0);
});

const airborneHit = (stun:number)=>({
 ...p('HITSTUN'),isGrounded:false,isTumbling:true,lastHitKnockbackAngle:0,
 hitstunFramesRemaining:stun,hitlagFramesRemaining:0,
});

it.each([B.JUMP,B.ATTACK,B.SPECIAL])('buffers airborne hitstun action %i only on the unlocked tick', bit=>{
 for(const age of [9,10]){
  let player=step(airborneHit(age),input(bit)).player;
  for(let remaining=age-1;remaining>0;remaining--){
   const waiting=step({...player,hitstunFramesRemaining:remaining},input(0));
   expect(waiting.input?.pressed).toBe(0);
   player=waiting.player;
  }
  const ready=step({...player,hitstunFramesRemaining:0},input(0));
  expect(ready.input?.pressed).toBe(age===9?bit:0);
  expect(ready.player.actionBuffer).toBeUndefined();
 }
});

it.each([B.JUMP,B.ATTACK,B.SPECIAL])('commits a long hold for action %i at the third locked tick', bit=>{
 for(const holdUntil of [3,4]){
  let player=step(airborneHit(14),input(bit)).player;
  for(let remaining=13;remaining>0;remaining--){
   player=step({...player,hitstunFramesRemaining:remaining},input(0,remaining>=holdUntil?bit:0)).player;
  }
  expect(step({...player,hitstunFramesRemaining:0},input(0)).input?.pressed).toBe(holdUntil===3?bit:0);
 }
});

it('preserves tapped right-stick aim without promoting a stale stick hold',()=>{
 const stick={cStickX:0,cStickY:-1,faceAttackHeld:false};
 let player=step(airborneHit(2),input(B.ATTACK,B.ATTACK,stick)).player;
 player=step({...player,hitstunFramesRemaining:1},input(0)).player;
 expect(step({...player,hitstunFramesRemaining:0},input(0)).input).toMatchObject({pressed:B.ATTACK,cStickY:-1});
 player=step(airborneHit(14),input(B.ATTACK,B.ATTACK,stick)).player;
 for(let remaining=13;remaining>0;remaining--){
  player=step({...player,hitstunFramesRemaining:remaining},input(0,B.ATTACK,stick)).player;
 }
 expect(step({...player,hitstunFramesRemaining:0},input(0)).input?.pressed).toBe(0);
});

it('prefers a fresh action or Shield to an earlier airborne recovery buffer',()=>{
 const player=step(airborneHit(1),input(B.ATTACK)).player;
 for(const bit of [B.JUMP,B.SPECIAL,B.SHIELD])expect(step({...player,hitstunFramesRemaining:0},input(bit)).input?.pressed).toBe(bit);
});


const parryRecovery=(remaining:number)=>({...p('SHIELD'),shieldParryConsumed:true,
 hitlagFramesRemaining:0,shieldStunFrames:remaining});

it.each([29,30])('uses a parry tap only inside the %i-tick lead boundary',lead=>{
 let player=step(parryRecovery(lead),input(B.JUMP)).player;
 for(let remaining=lead-1;remaining>0;remaining--){
  player=step({...player,shieldStunFrames:remaining},input(0)).player;
 }
 expect(step({...player,shieldStunFrames:0},input(0)).input?.pressed).toBe(lead===29?B.JUMP:0);
});

it.each([3,4])('qualifies an early parry hold at the three-tick cutoff when released after %i',cutoff=>{
 let player=step(parryRecovery(32),input(B.SPECIAL,B.SPECIAL|B.LEFT)).player;
 for(let remaining=31;remaining>0;remaining--){
  player=step({...player,shieldStunFrames:remaining},
   input(0,remaining>=cutoff?B.SPECIAL|B.UP:0)).player;
 }
 const ready={...player,shieldStunFrames:0};
 const replay=step(ready,input(0)).input!;
 expect(replay.pressed).toBe(cutoff===3?B.SPECIAL:0);
 expect(replay.held&B.UP).toBe(cutoff===3?B.UP:0);
 expect(step(ready,input(B.JUMP)).input?.pressed).toBe(B.JUMP);
});

it.each([[true,2,-1],[true,3,1],[false,3,-1],[false,4,1]])(
 'retains a side attack independently of direction expiry (tilt %s, lead %i)', (tilt,lead,facing)=>{
  const stick=input(B.ATTACK,B.ATTACK,{cStickX:-1,cStickY:0,cStickTilt:tilt,rightStickHeld:true,faceAttackPressed:false});
  let player=step({...parryRecovery(lead),facing:1},stick).player;
  for(let remaining=lead-1;remaining>0;remaining--){
   player=step({...player,shieldStunFrames:remaining},input(0,B.ATTACK,{rightStickHeld:true})).player;
  }
  const ready=step({...player,shieldStunFrames:0},input(0,B.RIGHT|B.ATTACK,{rightStickHeld:true}));
  expect(ready.input).toMatchObject({pressed:B.ATTACK,cStickX:facing,cStickTilt:tilt});
  expect(ready.player.actionBuffer).toBeUndefined();
 },
);

it('a tilt flick while face Attack is held preserves the earlier face press',()=>{
 const face=step(parryRecovery(2),input(B.ATTACK,B.UP|B.ATTACK,{faceAttackHeld:true,faceAttackPressed:true})).player;
 const stick=input(B.ATTACK,B.ATTACK|B.DOWN,{faceAttackHeld:true,faceAttackPressed:false,
  cStickX:0,cStickY:1,cStickTilt:true,rightStickHeld:true});
 const player=step({...face,shieldStunFrames:1},stick).player;
 const ready=step({...player,shieldStunFrames:0},input(0));
 expect(ready.input?.held&B.UP).toBe(B.UP);
 expect(ready.input?.cStickY).toBeUndefined();
});
