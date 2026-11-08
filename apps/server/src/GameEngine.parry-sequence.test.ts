import{it,expect}from 'vitest';
import{GameEngine}from './GameEngine.js';
import{INPUT_BITS as B}from '@smash/shared';
const input=(held=0,pressed=0)=>({playerId:'a',tick:0,seq:0,held,pressed,released:0});
function make(){const e=new GameEngine({playerIds:['a','b']}),s=(e as any).state;Object.assign(s.players.a,{x:600,y:472,isGrounded:true,state:'SHIELD',stateFrame:10,isShielding:true,shieldHealth:100,shieldStunFrames:0,shieldReleaseFrame:0,shieldReleaseEligible:true,shieldParryConsumed:false,respawnTimer:0});s.players.b.x=1100;return e;}
const tick=(e:GameEngine,held=0)=>e.tickGame(new Map([['a',input(held)]])).players.a!;
const hit={hit:true,damage:3,hitlagFrames:2,shieldStunFrames:4,hitstunFrames:5,knockbackVx:1,knockbackVy:0};
function contact(e:GameEngine){const s=(e as any).state;return s.players.a=(e as any).applyHit(s.players.a,hit,1);}
function finishRecovery(e: GameEngine, held = 0) {
 for (let age = 0; age < hit.hitlagFrames + hit.shieldStunFrames; age++) tick(e, held);
}
it('a second contact during parry recovery grants no additional parry',()=>{
 const e=make(), first=contact(e);
 expect(first.shieldReaction).toBe('parry');
 expect(first.shieldHealth).toBe(100);
 expect(contact(e)).toEqual(first);
 finishRecovery(e);
 expect(contact(e)).toMatchObject({shieldParryConsumed:true,shieldHealth:100,shieldStunFrames:0});
});
it('holding shield re-raises on the first tick after hitstop and guardstun',()=>{
 const e=make();contact(e);finishRecovery(e,B.SHIELD);
 expect(tick(e,B.SHIELD)).toMatchObject({state:'SHIELD',stateFrame:0,shieldParryConsumed:false,shieldReleaseFrame:undefined});
});
it('separate timed releases can parry successive hits, each with its own clocks',()=>{
 const e=make();contact(e);finishRecovery(e,B.SHIELD);tick(e,B.SHIELD);
 for(let i=0;i<3;i++)tick(e,B.SHIELD);
 const release=tick(e);
 expect(release.shieldReleaseEligible).toBe(true);
 expect(contact(e)).toMatchObject({shieldReaction:'parry',shieldHealth:release.shieldHealth,shieldStunFrames:4,hitlagFramesRemaining:2});
});
it('releasing a newly raised shield too early does not automatically chain a parry',()=>{
 const e=make();contact(e);finishRecovery(e,B.SHIELD);tick(e,B.SHIELD);
 const p=tick(e);
 expect(p.shieldReleaseEligible).toBe(false);
 expect(contact(e).state).toBe('HITSTUN');
});
it('keeping shield released returns to idle after recovery and exposes the body',()=>{
 const e=make();contact(e);finishRecovery(e);
 expect(tick(e).state).toBe('IDLE');
 expect(contact(e).state).toBe('HITSTUN');
});
it('a fresh roll snapshots forward/backward identity from facing and input',()=>{for(const [facing,dir,kind]of[[1,B.RIGHT,'forward'],[1,B.LEFT,'backward'],[-1,B.LEFT,'forward'],[-1,B.RIGHT,'backward']]as const){const e=make(),s=(e as any).state;Object.assign(s.players.a,{facing,shieldReleaseFrame:undefined,shieldReleaseEligible:false,dodgeFatigue:5});const p=e.tickGame(new Map([['a',input(B.SHIELD|dir,dir)]])).players.a!;expect(p.dodgeKind).toBe(kind);expect(p.dodgeLevel).toBe(5);}});

it('fatigued rolls travel the same distance over a longer animation',()=>{const distance=(kind:'forward'|'backward',level:number)=>{const e=make(),s=(e as any).state;let p={...s.players.a,state:'ROLL',stateFrame:0,shieldReleaseFrame:undefined,dodgeKind:kind,dodgeLevel:level,floorRollDirection:1};const x=p.x;for(let frame=0;frame<40;frame++)p=(e as any).applyPhysicsToPlayer('a',{...p,stateFrame:frame},null,true);return p.x-x;};for(const kind of['forward','backward']as const)expect(distance(kind,5)).toBeCloseTo(distance(kind,0),6);});
