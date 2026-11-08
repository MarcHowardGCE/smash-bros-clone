import {describe,it,expect} from 'vitest';
import {GameEngine} from './GameEngine.js';
import {PlayerStateEnum,INPUT_BITS as B,getCharacterStats} from '@smash/shared';
function fixture() {
 const engine=new GameEngine({playerIds:['a','b']});
 const p=engine.getSnapshot(0,{}).players.a!;
 const before={...p,state:PlayerStateEnum.HITSTUN,hitlagFramesRemaining:1,hitstunFramesRemaining:30,isTumbling:true,pendingKnockbackVx:10,pendingKnockbackVy:0};
 const after={...before,hitlagFramesRemaining:0,vx:0,vy:0};
 const launch=(input:any,beforeOverride:any={})=>(engine as any).applyLaunchInfluence({...before,...beforeOverride},after,input);
 return {launch,after};
}
const input=(held:number,extra={})=>({playerId:'a',held,pressed:0,released:0,tick:0,seq:0,...extra});
describe('authoritative launch-speed influence boundary',()=>{
 it('uses the final held direction and consumes pending launch once',()=>{
  const {launch}=fixture(),up=launch(input(B.UP)),down=launch(input(B.DOWN));
  expect(Math.hypot(up.vx,up.vy)).toBeCloseTo(1.314);
  expect(Math.hypot(down.vx,down.vy)).toBeCloseTo(1.104);
  expect(up.pendingKnockbackVx).toBeNull();
  expect(up.pendingKnockbackVy).toBeNull();
 });
 it('uses analog magnitude instead of full digital strength',()=>{const {launch}=fixture();expect(launch(input(B.UP,{stickX:0,stickY:-.5})).vx).toBeCloseTo(1.257);});
 it('leaves non-tumble, neutral and vertical launches unscaled',()=>{
  const {launch}=fixture();expect(launch(input(B.UP),{isTumbling:false}).vx).toBeCloseTo(1.2);
  expect(launch(null).vx).toBeCloseTo(1.2);
  const p=launch(input(B.UP),{pendingKnockbackVx:0,pendingKnockbackVy:-10});
  expect(Math.hypot(p.vx,p.vy)).toBeCloseTo(1.2);
 });
 it('does not apply early or repeat after pending launch is consumed',()=>{
  const {launch,after}=fixture();expect(launch(input(B.UP),{hitlagFramesRemaining:2})).toBe(after);
  expect(launch(input(B.UP),{pendingKnockbackVx:null,pendingKnockbackVy:null})).toBe(after);
 });
});

it('actual simulation samples LSI once when victim hitlag ends',()=>{
 const run=(held:number)=>{
  const engine=new GameEngine({playerIds:['a','b']});
  const state=(engine as any).state;
  Object.assign(state.players.a,{x:600,y:180,state:PlayerStateEnum.HITSTUN,isGrounded:false,hitlagFramesRemaining:1,hitstunFramesRemaining:30,isTumbling:true,pendingKnockbackVx:10,pendingKnockbackVy:0,vx:0,vy:0,respawnTimer:0,isInvincible:false,invincibilityFrames:0,sdiEligible:true});
  Object.assign(state.players.b,{x:1000,y:300,respawnTimer:0,state:PlayerStateEnum.AIRBORNE,isGrounded:false});
  const first=engine.tickGame(new Map([['a',input(held)]] )).players.a!;
  const firstVx=first.vx;
  expect(first.pendingKnockbackVx).toBeNull();
  const second=engine.tickGame(new Map([['a',input(held)]])).players.a!;
  // The next tick only applies fixed launch decay; LSI must not compound.
  expect(second.vx).toBeCloseTo(firstVx-.204);
  return firstVx;
 };
 expect(run(B.UP)-run(B.DOWN)).toBeCloseTo(.21);
});




it('consumes strong launch timing on thaw and accepts an aerial on the first unlocked tick',()=>{
 const engine=new GameEngine({playerIds:['a','b'],practice:true});
 engine.resetPractice();
 engine.setPracticePercent('b',100);
 const {a,b}=(engine as any).state.players;
 Object.assign(a,{x:628,y:472,state:PlayerStateEnum.ATTACK,stateFrame:12,currentMoveId:'UP_SMASH'});
 Object.assign(b,{x:640,y:472});
 let victim=engine.tickGame(new Map()).players.b!;
 let strongContact;
 for(let tick=0;tick<60;tick++){
  if(victim.launchTiming){strongContact=victim;break;}
  victim=engine.tickGame(new Map()).players.b!;
 }
 expect(strongContact?.launchTiming?.end).toBe(52);
 const realTicks=strongContact!.hitstunFramesRemaining;
 expect(realTicks).toBeLessThan(52);
 expect(victim.launchTiming?.elapsed).toBe(0);
 while(victim.hitlagFramesRemaining>1)victim=engine.tickGame(new Map()).players.b!;
 expect(victim.launchTiming?.elapsed).toBe(0);
 victim=engine.tickGame(new Map()).players.b!;
 expect(victim.hitlagFramesRemaining).toBe(0);
 expect(victim.hitstunFramesRemaining).toBe(realTicks-1);
 expect(victim.launchTiming?.elapsed).toBeGreaterThan(1);
 for(let tick=1;tick<realTicks;tick++){
  victim=engine.tickGame(new Map([['b',{...input(B.ATTACK),playerId:'b',pressed:B.ATTACK}]])).players.b!;
  expect(victim.state).toBe(PlayerStateEnum.HITSTUN);
 }
 expect(victim.hitstunFramesRemaining).toBe(0);
 expect(victim.launchTiming).toBeUndefined();
 victim=engine.tickGame(new Map([['b',{...input(B.ATTACK),playerId:'b',pressed:B.ATTACK}]])).players.b!;
 expect(victim.state).toBe(PlayerStateEnum.AIR_ATTACK);
 expect(victim.isTumbling).toBe(false);
});



const contactFighters=['all-rounder','abe-lincoln','swift','moonshine','hulk-hoagie'] as const;
const surfaces=['floor','wall','ceiling'] as const;
for(const fighter of contactFighters)for(const surface of surfaces){
 it(fighter+' uses the rebound and lockout for '+surface,()=>{
  const {step}=impactFixture(fighter,surface,150);
  const hit=step();
  const impact=hit.launchImpact!;
  expect(impact.surface).toBe(surface);
  expect(impact.teched).toBe(false);
  expect(impact.after).toBeLessThan(impact.before);
  expect(Math.sign(surface==='wall'?hit.launchVx!:hit.launchVy!)).toBe(surface==='ceiling'?1:-1);
  if(surface==='floor'){
   expect(impact.freeze).toBe(0);
   expect(impact.techable).toBe(false);
  }else{
   expect(impact.freeze).toBeGreaterThanOrEqual(2);
   expect(impact.techable).toBe(true);
   for(let i=0;i<impact.freeze;i++){
    const frozen=step();
    expect(frozen).toMatchObject({x:hit.x,y:hit.y,hitstunFramesRemaining:impact.after});
   }
   expect(step().x!==hit.x||surface==='ceiling').toBe(true);
  }
 });
}

function impactFixture(fighter:typeof contactFighters[number],surface:typeof surfaces[number],raw:number,grounded=false,techRestriction?:'floor'|'all'){
 const engine=new GameEngine({playerIds:['a','b'],characterIds:{b:fighter},stageId:'stage2',practice:true});
 engine.resetPractice();
 const state=(engine as any).state;
 const target=state.players.b;
 const radius=getCharacterStats(fighter).hurtboxRadius;
 const wall=surface==='wall',floor=surface==='floor';
 Object.assign(target,{x:wall?226:640,y:wall?520:floor?510-radius-(grounded?0:5):530+radius+5,isGrounded:grounded});
 state.players.b=(engine as any).applyHit(target,{
  damage:10,knockbackVx:wall?raw:0,knockbackVy:wall?0:floor?raw:-raw,
  hitstunFrames:Math.floor(raw*.4)-1,hitlagFrames:0,techRestriction,
 },1);
 return {engine,step:(held=0)=>engine.tickGame(new Map([['b',{...input(held),playerId:'b',pressed:held}]])).players.b!};
}


for(const fighter of contactFighters)for(const surface of surfaces){
 it(`${fighter}: uses per-hit tech restrictions on the first ${surface} collision`,()=>{
  const raw=surface==='floor'?85:150;
  for(const restriction of ['all','floor'] as const){
   const {step}=impactFixture(fighter,surface,raw,false,restriction);
   const blocked=restriction==='all'||surface==='floor';
   const contact=step(B.SHIELD);
   expect(contact.launchImpact).toMatchObject({surface,techable:!blocked,teched:!blocked});
   expect(contact.launchImpact?.blockedByHitbox).toBe(blocked?true:undefined);
   expect(contact.launchTechRestriction).toBeUndefined();
  }
 });
}
it('keeps a restricted wall collision untechable during freeze and clears the restriction for the next collision',()=>{
 const {engine,step}=impactFixture('all-rounder','wall',150,false,'all');
 const contact=step();
 expect(contact.launchImpact).toMatchObject({surface:'wall',techable:false,blockedByHitbox:true});
 expect(contact.launchImpact!.freeze).toBeGreaterThan(1);
 expect(step(B.SHIELD).launchImpact?.teched).toBe(false);
 const victim=(engine as any).state.players.b;
 Object.assign(victim,{x:226,y:520,vx:18,vy:0,launchVx:18,launchVy:0,
  launchImpact:{...victim.launchImpact,remaining:0},techLockoutFrames:0,
  techLastInputTick:undefined,techAcceptedInputTick:engine.getCurrentTick()});
 expect(step().launchImpact).toMatchObject({surface:'wall',techable:true,teched:true});
});
it('expires a restriction when hitstun ends in open air',()=>{
 const {engine,step}=impactFixture('swift','wall',150,false,'all');
 const victim=(engine as any).state.players.b;
 Object.assign(victim,{x:640,y:160,launchTiming:undefined,hitstunFramesRemaining:1});
 const recovered=step();
 expect(recovered.launchImpact).toBeUndefined();
 expect(recovered.hitstunFramesRemaining).toBe(0);
 expect(recovered.launchTechRestriction).toBeUndefined();
});

it('honors a buffered floor tech at low speed, but rejects one on a grounded spike',()=>{
 const airborne=impactFixture('all-rounder','floor',85).step(B.SHIELD);
 expect(airborne.state).toBe(PlayerStateEnum.TECH_NEUTRAL);
 expect(airborne.launchImpact?.teched).toBe(true);
 const grounded=impactFixture('all-rounder','floor',85,true).step(B.SHIELD);
 expect(grounded.launchImpact).toMatchObject({techable:false,teched:false});
});
it('rejects high-speed wall techs and permits a lower-speed ceiling tech during freeze',()=>{
 const wall=impactFixture('all-rounder','wall',250).step(B.SHIELD);
 expect(wall.launchImpact).toMatchObject({surface:'wall',techable:false,teched:false});
 const {step}=impactFixture('all-rounder','ceiling',150);
 const hit=step();
 let next=step(B.SHIELD);
 for(let i=1;i<hit.launchImpact!.freeze;i++)next=step();
 expect(next.launchImpact).toMatchObject({surface:'ceiling',teched:true,after:0});
 expect(next.artCue).toBe('ceiling_tech');
});



for(const fighter of contactFighters){
 it(fighter+' accepts an input at age 12 but rejects one at age 13',()=>{
  for(const age of [12,13]){
   const {engine,step}=impactFixture(fighter,'floor',85);
   (engine as any).state.players.b.techAcceptedInputTick=engine.getCurrentTick()+1-age;
   const hit=step();
   expect(hit.launchImpact?.teched).toBe(age===12);
  }
 });
 it(fighter+' re-arms a repeat tech press at 28 ticks and accepts Grab',()=>{
  for(const age of [27,28]){
   const {engine,step}=impactFixture(fighter,'floor',85);
   (engine as any).state.players.b.techLastInputTick=engine.getCurrentTick()+1-age;
   expect(step(B.GRAB).launchImpact?.teched).toBe(age===28);
  }
 });
 it(fighter+' carries a recent air dodge through 15 ticks',()=>{
  for(const age of [15,16]){
   const {engine,step}=impactFixture(fighter,'floor',85);
   (engine as any).state.players.b.techAirDodgeTick=engine.getCurrentTick()+1-age;
   expect(step().launchImpact?.teched).toBe(age===15);
  }
 });
 it(fighter+' holds ceiling-tech actions for 26 ticks and grants 17 ticks of intangibility',()=>{
  const {step}=impactFixture(fighter,'ceiling',150);
  const tech=step(B.SHIELD);
  expect(tech.launchImpact?.teched).toBe(true);
  expect(tech.invincibilityFrames).toBe(17);
  for(let i=1;i<26;i++){
   const current=step(B.ATTACK);
   expect(current.state).toBe(PlayerStateEnum.AIRBORNE);
   expect(current.isInvincible).toBe(i<17);
  }
  expect(step(B.ATTACK).state).toBe(PlayerStateEnum.AIR_ATTACK);
 });
}
it('counts a pre-hit Shield edge and keeps its repeat lockout through the hit',()=>{
 const {engine,step}=impactFixture('all-rounder','floor',85);
 const internal=engine as any;
 const hit=internal.state.players.b;
 internal.state.players.b={...hit,state:PlayerStateEnum.IDLE,isGrounded:true,isTumbling:false};
 const before=step(B.SHIELD);
 expect(before.techAcceptedInputTick).toBe(engine.getCurrentTick());
 internal.state.players.b={...hit,techAcceptedInputTick:before.techAcceptedInputTick,techLastInputTick:before.techLastInputTick};
 expect(step().launchImpact?.teched).toBe(true);
});



for(const fighter of contactFighters){
 it(fighter+' can choose wall-jump tech on tick five and moves on tick six',()=>{
  const {step}=impactFixture(fighter,'wall',150);
  const contact=step(B.SHIELD);
  expect(contact.artCue).toBe('wall_tech');
  for(let age=1;age<=5;age++){
   const recovery=step(age===5?B.UP:0);
   expect(recovery.x).toBe(contact.x);
   expect(recovery.y).toBe(contact.y);
   if(age===5)expect(recovery.artCue).toBe('wall_tech_jump');
  }
  const jump=step();
  expect(jump.x).toBeLessThan(contact.x);
  expect(jump.y).toBeLessThan(contact.y);
 });
 it(fighter+' can cancel a normal wall tech on tick six and loses its intangibility',()=>{
  const {step}=impactFixture(fighter,'wall',150);
  expect(step(B.SHIELD).artCue).toBe('wall_tech');
  for(let age=1;age<=5;age++)expect(step(B.ATTACK).state).toBe(PlayerStateEnum.AIRBORNE);
  const canceled=step(B.ATTACK);
  expect(canceled.state).toBe(PlayerStateEnum.AIR_ATTACK);
  expect(canceled.isInvincible).toBe(false);
 });
}


describe('zero-hitlag launch influence', () => {
  function run(raw: number, angle: number, held: number) {
    const engine = new GameEngine({playerIds:['a','b'],practice:true});
    engine.resetPractice();
    const state = (engine as any).state;
    const victim = {...state.players.a, x:640, y:150, isGrounded:false};
    const launch = (engine as any).applyHit(victim, {
      hit:true, damage:10, hitlagFrames:0, hitstunFrames:60,
      knockbackVx:raw * Math.cos(angle), knockbackVy:-raw * Math.sin(angle),
    }, 1);
    state.players.a = launch;
    const step = (bits: number) => engine.tickGame(new Map([['a',input(bits)]])).players.a!;
    const first = step(held);
    const next = step(held === B.UP ? B.DOWN : B.UP);
    return {launch, first, next};
  }

  it('uses the first movement input once and advances the strong launch clock exactly one tick', () => {
    const angle = Math.PI / 6;
    const neutral = run(100, angle, 0);
    const up = run(100, angle, B.UP);
    const down = run(100, angle, B.DOWN);
    const speed = (p: typeof up.first) => Math.hypot(p.launchVx!, p.launchVy!);
    expect(up.first.lastHitKnockbackAngle).toBeCloseTo(angle + .17 * Math.cos(angle));
    expect(down.first.lastHitKnockbackAngle).toBeCloseTo(angle - .17 * Math.cos(angle));
    expect(speed(up.first)).toBeGreaterThan(speed(neutral.first));
    expect(speed(down.first)).toBeLessThan(speed(neutral.first));
    expect(up.first).toMatchObject({
      hitlagFramesRemaining:0, pendingKnockbackVx:null, pendingKnockbackVy:null,
      stateFrame:1, hitstunFramesRemaining:up.launch.hitstunFramesRemaining - 1,
    });
    expect(up.first.launchThawStep).toBeUndefined();
    expect(up.first.launchTiming!.elapsed).toBeCloseTo(neutral.first.launchTiming!.elapsed);
    expect(up.next.lastHitKnockbackAngle).toBe(up.first.lastHitKnockbackAngle);
    expect(speed(up.next)).toBeLessThan(speed(up.first));
  });

  it('leaves weak launches unchanged and retains the steep-angle LSI exclusion', () => {
    const weak = run(30, Math.PI / 6, B.UP);
    expect(weak.first.lastHitKnockbackAngle).toBeCloseTo(Math.PI / 6);
    expect(weak.launch.pendingKnockbackVx).toBeNull();
    const steep = run(100, Math.PI / 2, B.RIGHT | B.UP).first;
    const neutral = run(100, Math.PI / 2, 0).first;
    expect(steep.lastHitKnockbackAngle).not.toBeCloseTo(Math.PI / 2);
    expect(Math.hypot(steep.launchVx!,steep.launchVy!)).toBeCloseTo(Math.hypot(neutral.launchVx!,neutral.launchVy!));
  });
});


function tumbleRecovery(stun: number, floor = false, hasAirDodge = true) {
 const engine = new GameEngine({playerIds:['a','b'],stageId:'stage2',practice:true});
 engine.resetPractice();
 const state = (engine as any).state;
 const victim = state.players.a;
 Object.assign(victim,{
  x:640,y:floor?victim.y-2:160,vy:floor?4:0,state:PlayerStateEnum.HITSTUN,stateFrame:4,
  isGrounded:false,isTumbling:true,hitstunFramesRemaining:stun,lastHitKnockbackAngle:0,hasAirDodge,
 });
 const step = (held=0,pressed=0) => engine.tickGame(new Map([['a',input(held,{pressed})]])).players.a!;
 return {engine,victim,step};
}

describe('airborne body-tumble Shield handoff', () => {
 it('accepts a fresh neutral dodge immediately on the first unlocked tick', () => {
  const {step}=tumbleRecovery(1);
  expect(step().state).toBe(PlayerStateEnum.HITSTUN);
  expect(step(B.SHIELD,B.SHIELD)).toMatchObject({
   state:PlayerStateEnum.AIR_DODGE,stateFrame:0,isTumbling:false,hasAirDodge:false,airDodgeDirection:{x:0,y:0},
  });
 });
 it('accepts held Shield once at unlock without a second edge', () => {
  const {step}=tumbleRecovery(12);
  expect(step(B.SHIELD,B.SHIELD).state).toBe(PlayerStateEnum.HITSTUN);
  for(let tick=1;tick<12;tick++)expect(step(B.SHIELD).state).toBe(PlayerStateEnum.HITSTUN);
  expect(step(B.SHIELD).state).toBe(PlayerStateEnum.AIR_DODGE);
  expect(step(B.SHIELD).tumbleShieldPressedTick).toBeUndefined();
 });
 it.each([[9,PlayerStateEnum.AIR_DODGE],[10,PlayerStateEnum.HITSTUN]])('checks the released tap at input age %i', (age,state) => {
  const {step}=tumbleRecovery(age);
  step(B.SHIELD,B.SHIELD);
  for(let tick=1;tick<age;tick++)step();
  expect(step().state).toBe(state);
 });
 it('still allows direction first and uses live direction if Shield is pressed immediately', () => {
  const direct=tumbleRecovery(0).step(B.RIGHT|B.SHIELD,B.RIGHT|B.SHIELD);
  expect(direct).toMatchObject({state:PlayerStateEnum.AIR_DODGE,airDodgeDirection:{x:1,y:0}});
  const {step}=tumbleRecovery(0);
  expect(step(B.RIGHT,B.RIGHT).state).toBe(PlayerStateEnum.AIRBORNE);
  expect(step(B.SHIELD,B.SHIELD).state).toBe(PlayerStateEnum.AIR_DODGE);
 });
 it('gives the floor to a fresh Shield tech without spending the air dodge', () => {
  const {step}=tumbleRecovery(0,true);
  expect(step(B.RIGHT|B.SHIELD,B.RIGHT|B.SHIELD)).toMatchObject({
   state:PlayerStateEnum.TECH_ROLL,hasAirDodge:true,isInvincible:true,
  });
 });
 it('routes an expired tech press held through floor contact to knockdown', () => {
  const {engine,victim,step}=tumbleRecovery(0,true);
  victim.techAcceptedInputTick=engine.getCurrentTick()-13;
  victim.tumbleShieldPressedTick=victim.techAcceptedInputTick;
  expect(step(B.SHIELD)).toMatchObject({state:PlayerStateEnum.HARD_LANDING,hasAirDodge:true});
 });
 it('does not bypass spent air dodge availability', () => {
  expect(tumbleRecovery(0,false,false).step(B.SHIELD,B.SHIELD).state).toBe(PlayerStateEnum.HITSTUN);
 });
});

