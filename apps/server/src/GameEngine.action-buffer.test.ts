import {it,expect}from'vitest';import{GameEngine}from'./GameEngine.js';import{INPUT_BITS as B,MoveId as M}from'@smash/shared';
const input=(pressed:number,held=pressed)=>({playerId:'a',tick:0,seq:0,pressed,held,released:0});
function make(state='LANDING_LAG',lag=2){const e=new GameEngine({playerIds:['a','b']}),s=(e as any).state;Object.assign(s.players.a,{state,stateFrame:0,x:600,y:472,vx:0,vy:0,isGrounded:true,landingLagFrames:lag,hitstunFramesRemaining:0,respawnTimer:0,currentMoveId:null});s.players.b.x=1100;return e;}
const tick=(e:GameEngine,i:any=null)=>e.tickGame(new Map([['a',i]])).players.a!;
it('jump on the grounded airborne transition is not lost',()=>{const p=tick(make('AIRBORNE',0),input(B.JUMP));expect(p.state).toBe('JUMPSQUAT');});
it('released jump waits for landing lag and produces one short hop',()=>{const e=make(),first=tick(e,input(B.JUMP));expect(first.state).toBe('LANDING_LAG');let p=first;for(let n=0;n<8&&p.state!=='AIRBORNE';n++)p=tick(e);expect(p.state).toBe('AIRBORNE');expect(p.vy).toBeCloseTo(-9.35);expect(p.hasDoubleJump).toBe(true);expect(p.actionBuffer).toBeUndefined();});
it('attack and special execute after recovery using their buffered direction',()=>{for(const [bit,move]of[[B.ATTACK,M.FORWARD_TILT],[B.SPECIAL,M.SIDE_SPECIAL]] as const){const e=make();tick(e,input(bit!,bit!|B.RIGHT));let p=tick(e);for(let n=0;n<5&&p.state!=='ATTACK';n++)p=tick(e);expect(p.state).toBe('ATTACK');expect(p.currentMoveId).toBe(move);expect(p.actionBuffer).toBeUndefined();}});
it('long recovery expires a tap and pause clearing prevents stale execution',()=>{const e=make('LANDING_LAG',20);tick(e,input(B.JUMP));for(let n=0;n<25;n++)tick(e);expect(tick(e).state).toBe('IDLE');const paused=make();tick(paused,input(B.JUMP));paused.clearActionBuffers();for(let n=0;n<8;n++)tick(paused);expect(tick(paused).state).toBe('IDLE');});



it('buffered jump+attack preserves the short-hop aerial shortcut',()=>{
 const e=make();tick(e,input(B.JUMP|B.ATTACK));let p=tick(e);
 for(let n=0;n<10&&p.state!=='AIR_ATTACK';n++)p=tick(e);
 expect(p.state).toBe('AIR_ATTACK');expect(p.currentMoveId).toBe(M.NEUTRAL_AIR);expect(p.shortHop).toBe(true);expect(p.hasDoubleJump).toBe(true);
});


it('a descending fighter with no double jump can buffer a fresh jump for landing',()=>{
 const e=make('AIRBORNE',0),s=(e as any).state;
 Object.assign(s.players.a,{isGrounded:false,y:466,vy:2,hasDoubleJump:false});
 let p=tick(e,input(B.JUMP));expect(p.state).toBe('AIRBORNE');expect(p.actionBuffer).toBeDefined();
 for(let n=0;n<8&&p.state!=='JUMPSQUAT';n++)p=tick(e);
 expect(p.state).toBe('JUMPSQUAT');expect(p.hasDoubleJump).toBe(true);expect(p.actionBuffer).toBeUndefined();
});
it('an available double jump executes in air rather than being saved for landing',()=>{
 const e=make('AIRBORNE',0),s=(e as any).state;
 Object.assign(s.players.a,{isGrounded:false,y:350,vy:2,hasDoubleJump:true});
 const p=tick(e,input(B.JUMP));expect(p.state).toBe('DOUBLE_JUMP');expect(p.actionBuffer).toBeUndefined();
});

it('zero landing lag routes a fresh jump without an idle flash',()=>{expect(tick(make('LANDING_LAG',0),input(B.JUMP)).state).toBe('JUMPSQUAT');});
