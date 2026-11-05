import {it,expect}from'vitest';import{GameEngine}from'./GameEngine.js';import{INPUT_BITS as B,PHYSICS,MoveId as M,isActiveShield}from'@smash/shared';
const input=(pressed=0,held=pressed)=>({playerId:'a',tick:0,seq:0,pressed,held,released:0});
function make(state='SHIELD',extra={}){const e=new GameEngine({playerIds:['a','b']}),s=(e as any).state;Object.assign(s.players.a,{x:600,y:472,vx:0,vy:0,state,stateFrame:10,isGrounded:true,isShielding:state==='SHIELD',shieldStunFrames:0,shieldHealth:100,respawnTimer:0,...extra});s.players.b.x=1100;return e;}
const tick=(e:GameEngine,i:any=null)=>e.tickGame(new Map([['a',i]])).players.a!;
it('parry opportunity ends before the eleven-tick release lockout',()=>{const e=make();for(let frame=0;frame<PHYSICS.SHIELD_DROP_FRAMES;frame++){const p=tick(e);expect(p.state).toBe('SHIELD');expect(p.shieldReleaseFrame).toBe(frame);expect(isActiveShield(p)).toBe(frame<PHYSICS.PERFECT_SHIELD_WINDOW_FRAMES);}expect(tick(e).state).toBe('IDLE');});
it('reholding and jump+attack cannot skip a shield drop already in progress',()=>{const e=make();tick(e);const p=tick(e,input(B.JUMP|B.ATTACK,B.SHIELD|B.JUMP|B.ATTACK));expect(p.state).toBe('SHIELD');expect(p.shieldReleaseFrame).toBe(1);});
it('late shield-drop contact damages the body instead of shield health',()=>{const e=make('SHIELD',{shieldReleaseFrame:5,shieldReleaseEligible:true}),p=(e as any).state.players.a;const hit={hit:true,damage:3,hitlagFrames:0,hitstunFrames:8,knockbackVx:30,knockbackVy:-10};const after=(e as any).applyHit(p,hit,1);expect(after.state).toBe('HITSTUN');expect(after.percent).toBeGreaterThan(p.percent);expect(after.shieldHealth).toBe(p.shieldHealth);});
it('up special may start from an unstunned held shield',()=>{const p=tick(make(),input(B.SPECIAL,B.SHIELD|B.UP|B.SPECIAL));expect(p.currentMoveId).toBe(M.UP_SPECIAL);});
for(const frame of[0,10,18])it('spot dodge cannot attack before cancel frame '+frame,()=>{expect(tick(make('SPOT_DODGE',{stateFrame:frame}),input(B.ATTACK)).state).toBe('SPOT_DODGE');});
for(const bit of[B.ATTACK,B.SPECIAL])it('spot dodge accepts eligible ground attack at frame20 '+bit,()=>{expect(tick(make('SPOT_DODGE',{stateFrame:19}),input(bit)).state).toBe('ATTACK');});
for(const bit of[B.JUMP,B.GRAB,B.SHIELD])it('spot dodge keeps nonattack action locked through its extra recovery '+bit,()=>{for(const frame of[19,20,23])expect(tick(make('SPOT_DODGE',{stateFrame:frame}),input(bit)).state).toBe('SPOT_DODGE');});
it('controller shield+attack grab shortcut is not a spot-dodge cancel',()=>{const p=tick(make('SPOT_DODGE',{stateFrame:19}),{...input(B.ATTACK,B.SHIELD|B.ATTACK),stickX:0,stickY:0});expect(p.state).toBe('SPOT_DODGE');});
it('spot dodge finishes naturally at its full recovery boundary',()=>{expect(tick(make('SPOT_DODGE',{stateFrame:24})).state).toBe('IDLE');});


it('late shield-drop attack waits for recovery, then consumes its buffer once',()=>{const e=make();for(let n=0;n<8;n++)tick(e);let p=tick(e,input(B.ATTACK));expect(p.state).toBe('SHIELD');expect(p.actionBuffer).toBeDefined();for(let n=0;n<5&&p.state!=='ATTACK';n++)p=tick(e);expect(p.state).toBe('ATTACK');expect(p.currentMoveId).toBe(M.JAB);expect(p.actionBuffer).toBeUndefined();});
it('jump+attack during spot cancel stays grounded instead of short-hop attacking',()=>{const p=tick(make('SPOT_DODGE',{stateFrame:19}),input(B.JUMP|B.ATTACK));expect(p.state).toBe('ATTACK');expect(p.currentMoveId).toBe(M.JAB);expect(p.isGrounded).toBe(true);});


it('raising a new shield clears the old release artwork cue',()=>{const e=make('SHIELD',{shieldReleaseFrame:10,shieldReleaseEligible:true,shieldReaction:'drop',shieldReactionFrame:10});let p=tick(e,input(0,B.SHIELD));p=tick(e,input(0,B.SHIELD));expect(p.state).toBe('SHIELD');expect(p.shieldReleaseFrame).toBeUndefined();expect(p.shieldReaction).toBeUndefined();});

