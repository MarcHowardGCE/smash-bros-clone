import{it,expect}from'vitest';import{GameEngine}from'./GameEngine.js';import{MoveId as M,INPUT_BITS as B,PHYSICS,MATCH_CONFIG}from'@smash/shared';
const input=(held=0)=>({playerId:'a',tick:0,seq:0,held,pressed:held,released:0});
function make(practice=true){const e=new GameEngine({playerIds:['a','b'],practice});if(practice)e.resetPractice();const s=(e as any).state;Object.assign(s.players.a,{x:600,y:472,state:'IDLE',isGrounded:true});Object.assign(s.players.b,{x:630,y:472,state:'IDLE',isGrounded:true});return e;}
it('practice preserves real contact and freeze while both percentages and event damage stay zero',()=>{const e=make(),s=(e as any).state;Object.assign(s.players.a,{state:'ATTACK',stateFrame:2,currentMoveId:M.JAB});const q=e.tickGame(new Map());expect(q.players.b!.percent).toBe(0);expect(q.players.b!.state).toBe('HITSTUN');expect(q.players.b!.hitlagFramesRemaining).toBeGreaterThan(0);expect(e.getSnapshot(0,{}).hitEvents[0]?.damage).toBe(0);expect(q.players.a!.percent).toBe(0);});
it('shield contacts retain shieldstun without shield damage',()=>{const e=make(),s=(e as any).state;Object.assign(s.players.a,{state:'ATTACK',stateFrame:2,currentMoveId:M.JAB});Object.assign(s.players.b,{state:'SHIELD',stateFrame:10,isShielding:true});const q=e.tickGame(new Map([['b',{...input(B.SHIELD),playerId:'b'}]]));expect(q.players.b!.shieldHealth).toBe(PHYSICS.SHIELD_MAX_HEALTH);expect(q.players.b!.shieldStunFrames).toBeGreaterThan(0);});
it('repeated arena exits reset both fighters without consuming lives or declaring a winner',()=>{const e=make();for(let n=0;n<12;n++){const s=(e as any).state;s.players.a.isKnockedOut=true;s.players.a.x=-1000;const q=e.tickGame(new Map());expect(q.matchPhase).toBe('match');expect(q.winnerId).toBeNull();expect(q.players.a!.stocks).toBe(MATCH_CONFIG.STOCKS);expect(q.players.a!.isKnockedOut).toBe(false);expect(q.players.b!.isGrounded).toBe(true);expect(e.getKOEvents()).toEqual([expect.objectContaining({playerId:'a',boundary:'left'})]);}});
it('manual reset clears interrupted grabs, hitlag, fatigue, buffers and shield-release metadata',()=>{const e=make(),s=(e as any).state;Object.assign(s.players.a,{isGrabbing:true,grabbedPlayerId:'b',hitlagFramesRemaining:10,dodgeFatigue:5,shieldReleaseFrame:2,actionBuffer:{pressed:B.ATTACK}});Object.assign(s.players.b,{state:'GRAB_HOLDING',percent:80});expect(e.resetPractice()).toBe(true);const p=e.getSnapshot(0,{}).players.a!;expect(p.isGrabbing).toBe(false);expect(p.grabbedPlayerId).toBeNull();expect(p.hitlagFramesRemaining).toBe(0);expect(p.dodgeFatigue??0).toBe(0);expect(p.actionBuffer).toBeUndefined();expect(p.shieldReleaseFrame).toBeUndefined();expect(p.percent).toBe(0);});
it('normal matches keep damage and reject practice reset',()=>{const e=make(false),s=(e as any).state;expect(e.resetPractice()).toBe(false);Object.assign(s.players.a,{state:'ATTACK',stateFrame:2,currentMoveId:M.JAB});expect(e.tickGame(new Map()).players.b!.percent).toBeGreaterThan(0);});
it('a parry still requires the real release opportunity in practice',()=>{const e=make(),s=(e as any).state;Object.assign(s.players.a,{state:'ATTACK',stateFrame:2,currentMoveId:M.JAB});Object.assign(s.players.b,{state:'SHIELD',stateFrame:10,isShielding:true,shieldReleaseFrame:0,shieldReleaseEligible:true});const q=e.tickGame(new Map());expect(q.players.b!.shieldReaction).toBe('parry');expect(q.players.b!.shieldParryConsumed).toBe(true);});

it('fatigue presets are practice-only and preserve a dodge already in progress',()=>{expect(make(false).setPracticeDodgeFatigue(5)).toBe(false);const e=make();for(const level of[0,1,2,3,4,5]){expect(e.setPracticeDodgeFatigue(level)).toBe(true);expect(e.getPracticeDodgeFatigue()).toBe(level);}for(const level of[-1,6,.5,NaN])expect(e.setPracticeDodgeFatigue(level)).toBe(false);const p=(e as any).state.players.a;p.dodgeLevel=2;expect(e.setPracticeDodgeFatigue(5)).toBe(true);expect(p.dodgeLevel).toBe(2);});


it('uses independent fixed percentages for launch without spending stocks',()=>{
 const launches=[0,150].map(percent=>{
  const e=make(),state=(e as any).state;
  expect(e.setPracticePercent('a',50)).toBe(true);
  expect(e.setPracticePercent('b',percent)).toBe(true);
  expect(e.setPracticePercent('missing',100)).toBe(false);
  expect(e.setPracticePercent('a',-1)).toBe(false);
  expect(e.setPracticePercent('a',NaN)).toBe(false);
  Object.assign(state.players.a,{state:'ATTACK',stateFrame:2,currentMoveId:M.JAB});
  const hit=e.tickGame(new Map());
  expect(hit.players.a!.percent).toBe(50);
  expect(hit.players.b!.percent).toBe(percent);
  expect(e.getSnapshot(0,{}).hitEvents[0]?.damage).toBe(0);
  const magnitude=e.getSnapshot(0,{}).hitEvents[0]!.knockbackMagnitude;
  expect(e.resetPractice()).toBe(true);
  expect(e.getSnapshot(0,{}).players.b!.percent).toBe(percent);
  return magnitude;
 });
 expect(launches[1]!).toBeGreaterThan(launches[0]!);
 expect(make(false).setPracticePercent('a',100)).toBe(false);
});

it('reports the actual blast-zone exit once and resets both fighters at their presets',()=>{
 const e=make();
 e.setPracticePercent('b',150);
 Object.assign((e as any).state.players.b,{x:1700,y:300,state:'AIRBORNE',isGrounded:false});
 const result=e.tickGame(new Map());
 expect(e.getKOEvents()).toEqual([expect.objectContaining({playerId:'b',boundary:'right',tick:result.tick,exitPosition:expect.objectContaining({x:1700})})]);
 expect(e.getKOEvents()).toEqual([]);
 expect(result.players.b).toMatchObject({percent:150,stocks:MATCH_CONFIG.STOCKS,isGrounded:true,isKnockedOut:false});
 expect(result).toMatchObject({matchPhase:'match',winnerId:null});
});


it('uses low impact art for a real non-trip down tilt and heavy art for a smash at fixed percent', () => {
 for (const [move, startup, percent, reaction] of [
  [M.DOWN_TILT, 5, 50, 'low'], [M.FORWARD_SMASH, 15, 0, 'heavy'],
 ] as const) {
  const e = make();
  e.setPracticePercent('b', percent);
  const s = (e as any).state;
  Object.assign(s.players.a, { state: 'ATTACK', stateFrame: startup - 1, currentMoveId: move });
  const hit = e.tickGame(new Map()).players.b!;
  expect(hit).toMatchObject({ state: 'HITSTUN', hitReaction: reaction, percent });
  expect(e.getSnapshot(0, {}).hitEvents[0]?.damage).toBe(0);
 }
});
