import {it,expect,afterEach} from 'vitest';
import {GameEngine} from './GameEngine.js';
import {getMoveDataForCharacter} from '@smash/engine';
import {MoveId as M,INPUT_BITS as B,type InputEvent} from '@smash/shared';
const move=getMoveDataForCharacter('all-rounder',M.NEUTRAL_SPECIAL);
const original={...move};afterEach(()=>{Object.assign(move,original);});
function make(groups:number[],interval?:number){
 const box={...original.hitboxPerActiveFrame[0]!,offsetX:0,offsetY:0,radius:200,damage:1,baseKnockback:0,knockbackGrowth:0,hitlagFrames:0,hitlagMultiplier:0,hitstunFrames:0};
 Object.assign(move,{startupFrames:0,activeFrames:groups.length,recoveryFrames:10,hitboxPerActiveFrame:groups.map(hitGroup=>({...box,hitGroup,rehitFrames:interval}))});
 const e=new GameEngine({playerIds:['a','b']}),s=(e as any).state;
 for(const p of Object.values(s.players) as any[])Object.assign(p,{x:640,y:300,isGrounded:false,isInvincible:false,invincibilityFrames:0,respawnTimer:0,hitlagFramesRemaining:0,state:'IDLE',percent:0,activeHitbox:null});
 Object.assign(s.players.a,{state:'ATTACK',currentMoveId:M.NEUTRAL_SPECIAL});
 return {e,s};
}
function contact(e:GameEngine,s:any,frame:number){s.players.a=(e as any).withHitboxState({...s.players.a,stateFrame:frame,hitlagFramesRemaining:0},null);Object.assign(s.players.b,{state:'IDLE',hitlagFramesRemaining:0,isInvincible:false,invincibilityFrames:0});const before=s.players.b.percent;(e as any).applyHitDetection(s.players);return s.players.b.percent>before;}
it('authored hit groups contact once per wave and occupy one stale slot per victim',()=>{const {e,s}=make([0,0,1,1,2,2]);expect([0,1,2,3,4,5].map(f=>contact(e,s,f))).toEqual([true,false,true,false,true,false]);expect(s.players.a.staleMoveQueue).toEqual([M.NEUTRAL_SPECIAL]);expect(Object.keys(s.players.a.hitContactFrames.b)).toHaveLength(3);});
it('interval contacts follow action frames and repeated frozen frames cannot reopen contact',()=>{const {e,s}=make(Array(8).fill(0),3);expect(contact(e,s,0)).toBe(true);for(let n=0;n<20;n++)expect(contact(e,s,0)).toBe(false);expect([1,2,3,4,5,6].map(f=>contact(e,s,f))).toEqual([false,false,true,false,false,true]);expect(s.players.a.staleMoveQueue).toHaveLength(1);});
it('unannotated ordinary active frames remain once per victim',()=>{const {e,s}=make([0,0,0]);expect([0,1,2].map(f=>contact(e,s,f))).toEqual([true,false,false]);});

for(const frozen of[false,true])it('full tick loop schedules separate hit waves with real hitlag '+frozen,()=>{
 const {e,s}=make([0,0,1,1,2,2]);
 if(frozen)for(const box of move.hitboxPerActiveFrame){box.hitlagMultiplier=1;box.hitlagFrames=1;}
 for(const id of['a','b'])Object.assign(s.players[id],{x:id==='a'?600:630,y:472,isGrounded:true,state:'IDLE',stateFrame:0,vx:0,vy:0});
 const frames:number[]=[],ticks:number[]=[];
 let lastFrame=-1,frozenTicks=0;
 for(let n=0;n<100;n++){
  const before=s.players.a,frame=before.stateFrame,remaining=before.hitlagFramesRemaining;
  const input=n===0?{playerId:'a',tick:0,seq:0,pressed:B.SPECIAL,held:B.SPECIAL,released:0}:null;
  e.clearHitEvents();e.tickGame(new Map([['a',input]]));s.players=(e as any).state.players;
  const p=s.players.a;
  if(remaining>1){expect(p.stateFrame).toBe(frame);frozenTicks++;}
  const events=e.getSnapshot(0,{}).hitEvents.filter(h=>h.attackerId==='a');
  if(events.length){frames.push(p.stateFrame);ticks.push(n);expect(p.stateFrame).not.toBe(lastFrame);lastFrame=p.stateFrame;}
  if(p.state==='IDLE'&&n>0)break;
 }
 expect(frames).toEqual([0,2,4]);expect(s.players.a.staleMoveQueue).toEqual([M.NEUTRAL_SPECIAL]);
 if(frozen){expect(frozenTicks).toBeGreaterThan(0);expect(ticks[1]!-ticks[0]!).toBeGreaterThan(2);}
 expect(s.players.a.hitContactFrames).toBeUndefined();
});
it('a held shield receives each scheduled wave through the full tick pipeline',()=>{
 const {e,s}=make([0,0,1,1,2,2]);
 for(const id of['a','b'])Object.assign(s.players[id],{x:id==='a'?600:630,y:472,isGrounded:true,state:'IDLE',stateFrame:0,vx:0,vy:0});
 let hits=0;for(let n=0;n<60;n++){
  const inputs=new Map<string,InputEvent|null>([['a',n===0?{playerId:'a',tick:0,seq:0,held:B.SPECIAL,pressed:B.SPECIAL,released:0}:null],['b',{playerId:'b',tick:0,seq:0,held:B.SHIELD,pressed:n===0?B.SHIELD:0,released:0}]]);
  e.clearHitEvents();e.tickGame(inputs);s.players=(e as any).state.players;hits+=e.getSnapshot(0,{}).hitEvents.filter(h=>h.attackerId==='a').length;
 }
 expect(hits).toBe(3);expect(s.players.b.percent).toBe(0);expect(s.players.b.shieldHealth).toBeLessThan(100);expect(s.players.a.staleMoveQueue).toEqual([M.NEUTRAL_SPECIAL]);
});

it('same-instance waves do not acquire broad automatic parries from one release',()=>{
 const {e,s}=make([0,0,1,1,2,2]);
 for(const id of['a','b'])Object.assign(s.players[id],{x:id==='a'?600:630,y:472,isGrounded:true,state:'IDLE',stateFrame:0,vx:0,vy:0});
 Object.assign(s.players.b,{state:'SHIELD',stateFrame:10,isShielding:true,shieldReleaseFrame:undefined,shieldReleaseEligible:false,shieldParryConsumed:false,shieldStunFrames:0});
 const contacts:{frame:number;reaction:string}[]=[];
 for(let n=0;n<100;n++){
  const inputs=new Map<string,InputEvent|null>([['a',n===0?{playerId:'a',tick:0,seq:0,held:B.SPECIAL,pressed:B.SPECIAL,released:0}:null],['b',{playerId:'b',tick:0,seq:0,held:n===0?0:B.SHIELD,pressed:0,released:n===0?B.SHIELD:0}]]);
  e.clearHitEvents();e.tickGame(inputs);s.players=(e as any).state.players;
  if(e.getSnapshot(0,{}).hitEvents.some(h=>h.attackerId==='a'))contacts.push({frame:s.players.a.stateFrame,reaction:s.players.b.shieldReaction});
 }
 expect(contacts.map(c=>c.frame)).toEqual([0,2,4]);expect(contacts.map(c=>c.reaction)).toEqual(['parry','hit','hit']);
});
