import{it,expect}from'vitest';import{GameEngine}from'./GameEngine.js';import{INPUT_BITS as B,MoveId as M,PHYSICS}from'@smash/shared';
const input=(pressed:number,held=pressed)=>({playerId:'a',tick:0,seq:0,pressed,held,released:0});
function make(state:string,extra={}){const e=new GameEngine({playerIds:['a','b']}),s=(e as any).state;Object.assign(s.players.a,{x:600,y:472,vx:0,vy:0,state,stateFrame:0,isGrounded:true,hitstunFramesRemaining:0,respawnTimer:0,isInvincible:false,invincibilityFrames:0,...extra});s.players.b.x=1100;return e;}
const tick=(e:GameEngine,i:any=null)=>e.tickGame(new Map([['a',i]])).players.a!;
it('running accepts shield and special without requiring direction release',()=>{expect(tick(make('RUN'),input(B.SHIELD,B.RIGHT|B.SHIELD)).state).toBe('SHIELD');const special=tick(make('RUN'),input(B.SPECIAL,B.RIGHT|B.SPECIAL));expect(special.state).toBe('ATTACK');expect(special.currentMoveId).toBe(M.SIDE_SPECIAL);});
for(const stun of[1,2,10])it('jump+attack cannot escape '+stun+' ticks of shieldstun',()=>{const p=tick(make('SHIELD',{shieldStunFrames:stun,isShielding:true,shieldReleaseFrame:undefined}),input(B.JUMP|B.ATTACK,B.SHIELD|B.JUMP|B.ATTACK));expect(p.state).toBe('SHIELD');expect(p.shieldStunFrames).toBe(stun-1);expect(p.currentMoveId).toBeNull();});
it('the jump+attack shortcut still works from an unstunned shield',()=>{expect(tick(make('SHIELD',{shieldStunFrames:0,isShielding:true}),input(B.JUMP|B.ATTACK,B.SHIELD|B.JUMP|B.ATTACK)).state).toBe('JUMPSQUAT');});
it('helpless blocks attacks, jumps and air dodges even when resources remain',()=>{for(const bit of[B.JUMP,B.ATTACK,B.SPECIAL,B.SHIELD])expect(tick(make('HELPLESS',{isGrounded:false,y:100,hasDoubleJump:true,hasAirDodge:true}),input(bit)).state).toBe('HELPLESS');});
it('helpless landing holds every recovery tick then accepts a buffered jump without idle flash',()=>{
 const e=make('HELPLESS_LAND');let p;
 for(let frame=0;frame<PHYSICS.HELPLESS_LANDING_FRAMES-1;frame++){p=tick(e,frame===PHYSICS.HELPLESS_LANDING_FRAMES-3?input(B.JUMP):null);expect(p.state).toBe('HELPLESS_LAND');}
 p=tick(e);expect(p.state).toBe('JUMPSQUAT');expect(p.actionBuffer).toBeUndefined();
});
it('roll and spot dodge do not gain an early jump+attack cancel',()=>{for(const state of['ROLL','SPOT_DODGE'])for(const frame of[0,8,18])expect(tick(make(state,{stateFrame:frame}),input(B.JUMP|B.ATTACK)).state).toBe(state);});


it('run-to-shield stops old momentum instead of restoring it on shield release',()=>{
 const e=make('RUN',{vx:6.5});let p=tick(e,input(B.SHIELD,B.RIGHT|B.SHIELD));
 expect(p.vx).toBe(0);const x=p.x;
 for(let t=0;t<3;t++)p=tick(e,input(0,B.SHIELD));
 for(let t=0;t<8;t++)p=tick(e);
 expect(p.x).toBeCloseTo(x);expect(p.vx).toBe(0);
});
it('forced ledge catch clears an interrupted air-dodge vector and pending action',()=>{
 const e=make('AIR_DODGE'),p=(e as any).state.players.a;
 const caught=(e as any).snapPlayerToLedge({...p,airDodgeDirection:{x:1,y:1},actionBuffer:{input:input(B.JUMP),framesLeft:4}},'left');
 expect(caught.state).toBe('LEDGE_HANG');expect(caught.airDodgeDirection).toBeNull();expect(caught.actionBuffer).toBeUndefined();expect(caught.hasDoubleJump).toBe(true);expect(caught.hasAirDodge).toBe(true);
});

