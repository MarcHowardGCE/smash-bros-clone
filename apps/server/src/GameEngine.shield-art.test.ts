import{describe,it,expect}from'vitest';import{GameEngine}from'./GameEngine.js';import{INPUT_BITS,type GameState,type PlayerState}from'@smash/shared';
const make=()=>{const e=new GameEngine({playerIds:['a','b']});const s=(e as unknown as{state:GameState}).state;Object.assign(s.players.a!,{state:'SHIELD',stateFrame:10,x:640,y:472,isGrounded:true,isShielding:true,shieldHealth:50,isInvincible:false,invincibilityFrames:0});return{e,s};};
const hit={damage:8,hitlagFrames:3};
const apply=(e:GameEngine,p:PlayerState)=>(e as unknown as{applyHit(p:PlayerState,h:typeof hit,f:number):PlayerState}).applyHit(p,hit,1);
describe('shield art events',()=>{
it('records damage and perfect shield as distinct authoritative cues',()=>{const{e,s}=make();const p=s.players.a!;expect(apply(e,p)).toMatchObject({shieldReaction:'hit',shieldReactionFrame:0,shieldHealth:42,percent:0});expect(apply(e,{...p,stateFrame:10,shieldReleaseFrame:0,shieldReleaseEligible:true,shieldHealth:1})).toMatchObject({shieldReaction:'parry',shieldHealth:1,shieldStunFrames:8});});
it('records a depleted shield as break instead of ordinary hitstun',()=>{const{e,s}=make();expect(apply(e,{...s.players.a!,shieldHealth:1})).toMatchObject({shieldReaction:'break',state:'HITSTUN',shieldHealth:0});});
it('release cue cancels when another action begins',()=>{const{e}=make();let p=e.tickGame(new Map()).players.a!;for(let i=0;i<11;i++)p=e.tickGame(new Map()).players.a!;expect(p).toMatchObject({state:'IDLE',shieldReaction:'drop',shieldReactionFrame:11});e.tickGame(new Map([['a',{playerId:'a',tick:0,seq:0,pressed:INPUT_BITS.ATTACK,held:INPUT_BITS.ATTACK,released:0}]]));p=e.tickGame(new Map()).players.a!;expect(p.shieldReaction).toBeUndefined();});
});


it('previews the real shield-break sequence only on an idle Dojo fighter', () => {
 const competitive = new GameEngine({ playerIds: ['a', 'b'] });
 expect(competitive.previewPracticeShieldBreak('a')).toBe(false);
 const practice = new GameEngine({ playerIds: ['a', 'b'], practice: true });
 practice.resetPractice();
 practice.setPracticePercent('a', 75);
 expect(practice.previewPracticeShieldBreak('missing')).toBe(false);
 const tick = practice.getCurrentTick();
 const before = practice.getSnapshot(0, {}).players;
 expect(practice.previewPracticeShieldBreak('a')).toBe(true);
 const preview = practice.getSnapshot(0, {}).players;
 expect(practice.getCurrentTick()).toBe(tick);
 expect(preview.a).toMatchObject({
  state: 'HITSTUN', shieldReaction: 'break', shieldReactionFrame: 0, hitstunFramesRemaining: 150,
  isGrounded: false, vx: 0, vy: -8, percent: 75, stocks: before.a!.stocks,
 });
 expect(preview.b).toEqual(before.b);
 expect(practice.previewPracticeShieldBreak('a')).toBe(false);
 expect(practice.tickGame(new Map()).players.a).toMatchObject({
  shieldReactionFrame: 1, percent: 75, shieldHealth: 100, stocks: before.a!.stocks,
 });
 practice.resetPractice();
 expect(practice.previewPracticeShieldBreak('a')).toBe(true);
});
