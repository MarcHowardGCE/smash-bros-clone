import {it,expect} from 'vitest';
import {GameEngine} from './GameEngine.js';
import {airDodgeLandingLag,isDamageImmune} from '@smash/engine';
import {INPUT_BITS as B,PHYSICS,getCharacterStats,type CharacterId,type InputEvent} from '@smash/shared';
const inp=(pressed=0,held=pressed):InputEvent=>({playerId:'a',tick:0,seq:0,held,pressed,released:0});
const state=(e:GameEngine)=>(e as any).state;
const tick=(e:GameEngine,i:InputEvent|null=null)=>e.tickGame(new Map([['a',i]])).players.a!;
function make(characterId:CharacterId='all-rounder',extra={}){const e=new GameEngine({playerIds:['a'],characterIds:{a:characterId}});Object.assign(state(e).players.a,{x:640,y:100,vx:0,vy:0,state:'AIRBORNE',stateFrame:0,isGrounded:false,hasAirDodge:true,respawnTimer:0,...extra});return e;}
for(const characterId of['all-rounder','abe-lincoln','swift','moonshine','hulk-hoagie']as const)for(const dir of[B.RIGHT,B.LEFT,B.UP|B.RIGHT]as const)it('captured stale travel ratio '+characterId+' '+dir,()=>{
 const travel=(fatigue:number)=>{const e=make(characterId,{dodgeFatigue:fatigue,dodgeRecoveryTicks:120});let p=tick(e,inp(B.SHIELD,B.SHIELD|dir));expect(p.dodgeLevel).toBe(fatigue);let distance=0;
 for(let n=0;n<12;n++){const before={x:p.x,y:p.y};state(e).players.a.dodgeFatigue=0;p=tick(e);if(p.stateFrame>=PHYSICS.AIR_DODGE_TRAVEL_START&&p.stateFrame<PHYSICS.AIR_DODGE_TRAVEL_END)distance+=Math.hypot(p.x-before.x,p.y-before.y);}
 expect(p.state).toBe('AIR_DODGE');expect(p.dodgeLevel).toBe(fatigue);return distance;};
 const fresh=travel(0),stale=travel(5);expect(fresh).toBeCloseTo(60);expect(stale).toBeCloseTo(40);expect(stale/fresh).toBeCloseTo(2/3);
});
const hit={hit:true,damage:3,hitlagFrames:0,hitstunFrames:4,knockbackVx:1,knockbackVy:0};
it('body hit restores spent air dodge without granting double jump',()=>{const e=make('all-rounder',{hasAirDodge:false,hasDoubleJump:false});state(e).players.a=(e as any).applyHit(state(e).players.a,hit,1);let p=state(e).players.a;expect(p.hasAirDodge).toBe(true);expect(p.hasDoubleJump).toBe(false);for(let n=0;n<8&&p.state!=='AIRBORNE';n++)p=tick(e);expect(p.state).toBe('AIRBORNE');expect(tick(e,inp(B.SHIELD)).state).toBe('AIR_DODGE');});
it('shield block and intangible dodge contact do not restore spent air dodge',()=>{for(const extra of[{state:'SHIELD',isShielding:true,isGrounded:true,shieldHealth:100},{state:'AIR_DODGE',stateFrame:5,airDodgeDirection:{x:0,y:0}}]){const e=make('all-rounder',{hasAirDodge:false,...extra});const p=(e as any).applyHit(state(e).players.a,hit,1);expect(p.hasAirDodge).toBe(false);}});
for(const frame of[23,24])for(const direction of[{x:0,y:0},{x:1,y:0}])it('server ledge gate '+frame+' '+direction.x,()=>{const e=make('all-rounder',{x:200,y:500,state:'AIR_DODGE',stateFrame:frame,airDodgeDirection:direction});const p=tick(e);expect(p.state==='LEDGE_HANG').toBe(direction.x===1&&frame===24);if(p.state==='LEDGE_HANG'){expect(p.hasAirDodge).toBe(true);expect(p.dodgeRefreshTicks).toBe(60);}});

for(const characterId of['all-rounder','abe-lincoln','swift','moonshine','hulk-hoagie']as const)it('fatigue changes directional travel but not landing lag '+characterId,()=>{const lag=(level:number,directional:boolean)=>{const e=make(characterId,{x:640,y:500-getCharacterStats(characterId).hurtboxRadius-1,state:'AIR_DODGE',stateFrame:5,vy:4,dodgeLevel:level,airDodgeDirection:directional?{x:1,y:1}:{x:0,y:0}});const p=tick(e);expect(p.state).toBe('LANDING_LAG');return p.landingLagFrames;};for(let n=0;n<=5;n++){expect(lag(n,true)).toBe(lag(0,true));expect(lag(n,false)).toBe(9);}});

for(const airDodgeDirection of [{x:0,y:0},{x:1,y:1}]){
 it.each([[B.JUMP,'JUMPSQUAT'],[B.ATTACK,'ATTACK'],[B.SHIELD,'SHIELD']] as const)(
  'counts air-dodge contact as recovery tick one and unlocks %i on schedule',
  (button,expected)=>{
   const e=make('all-rounder',{x:640,y:471,state:'AIR_DODGE',stateFrame:7,vy:4,airDodgeDirection,dodgeLevel:0,hasAirDodge:false});
   expect(isDamageImmune(state(e).players.a)).toBe(true);
   const total=airDodgeLandingLag({characterId:'all-rounder',stateFrame:8,airDodgeDirection});
   const contact=tick(e);
   expect(contact).toMatchObject({state:'LANDING_LAG',isGrounded:true,landingLagFrames:total-1,hasAirDodge:true});
   expect(isDamageImmune(contact)).toBe(false);
   for(let elapsed=1;elapsed<total;elapsed++){
    const locked=tick(e,elapsed===total-1?inp(button):null);
    expect(locked).toMatchObject({state:'LANDING_LAG',landingLagFrames:total-1-elapsed});
    expect(isDamageImmune(locked)).toBe(false);
   }
   expect(tick(e,inp(button)).state).toBe(expected);
  },
 );
}


it.each(['left','right'] as const)('held Down delays directional dodge grab on the %s ledge', side => {
 const e=make();
 const ledge=(e as any).stage.ledges.find((entry:{id:string})=>entry.id===side);
 const inward=side==='left'?1:-1;
 Object.assign(state(e).players.a,{
  x:ledge.x-12*inward,y:ledge.y+2,state:'AIR_DODGE',stateFrame:24,
  airDodgeDirection:{x:inward,y:1},hasAirDodge:false,
 });
 expect(tick(e,inp(0,B.DOWN))).toMatchObject({
  state:'AIR_DODGE',hasAirDodge:false,airDodgeDirection:{x:inward,y:1},
 });
 expect(tick(e,{...inp(),released:B.DOWN})).toMatchObject({
  state:'LEDGE_HANG',ledgeId:side,hasAirDodge:true,dodgeRefreshTicks:60,
 });
});

it('held Down lets a late directional dodge land on the solid floor beside a ledge',()=>{
 const e=make('all-rounder',{
  x:212,y:500-getCharacterStats('all-rounder').hurtboxRadius-1,vy:4,
  state:'AIR_DODGE',stateFrame:24,airDodgeDirection:{x:1,y:1},hasAirDodge:false,
 });
 const total=airDodgeLandingLag({...state(e).players.a,stateFrame:25});
 expect(tick(e,inp(0,B.DOWN))).toMatchObject({
  state:'LANDING_LAG',isGrounded:true,landingLagFrames:total-1,hasAirDodge:true,
 });
});
it.each([[500, 0], [536, 2]])('keeps the fatigue clocks running through ledge approach and catch at y=%i', (y, approachTicks) => {
 const e=make('all-rounder',{
  x:188,y,state:'AIR_DODGE',stateFrame:24,airDodgeDirection:{x:1,y:0},
  hasAirDodge:false,dodgeFatigue:4,dodgeRecoveryTicks:90,
 });
 for(let elapsed=1;elapsed<=approachTicks;elapsed++){
  expect(tick(e)).toMatchObject({state:'LEDGE_APPROACH',dodgeRecoveryTicks:90-elapsed});
  expect(state(e).players.a.dodgeRefreshTicks).toBeUndefined();
 }
 expect(tick(e)).toMatchObject({
  state:'LEDGE_HANG',dodgeRecoveryTicks:89-approachTicks,dodgeRefreshTicks:60,dodgeFatigue:4,
 });
 for(let elapsed=1;elapsed<60;elapsed++){
  expect(tick(e)).toMatchObject({dodgeRefreshTicks:60-elapsed,dodgeFatigue:4});
 }
 expect(tick(e)).toMatchObject({dodgeRecoveryTicks:29-approachTicks,dodgeFatigue:3});
 expect(state(e).players.a.dodgeRefreshTicks).toBeUndefined();
});