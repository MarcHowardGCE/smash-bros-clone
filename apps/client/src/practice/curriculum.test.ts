import{it,expect}from'vitest';import{INPUT_BITS as B,MoveId as M,type GameState,type PlayerState}from'@smash/shared';import{LESSONS,LessonTracker}from'./curriculum.js';
const tracker=(id:string)=>new LessonTracker(LESSONS.find(l=>l.id===id)!);const input=(pressed=0,released=0)=>({playerId:'a',tick:0,seq:0,pressed,held:pressed,released});
const state=(tick:number,extra:Partial<PlayerState>={})=>({tick,players:{a:{id:'a',state:'IDLE',stateFrame:0,currentMoveId:null,isGrounded:true,...extra}as PlayerState},matchPhase:'match',winnerId:null,ledges:{}}as GameState);
it('button presses without the engine move earn no credit',()=>{const t=tracker('jab');t.observe(state(0),null,'a');for(let n=1;n<10;n++)t.observe(state(n),input(B.ATTACK),'a');expect(t.count).toBe(0);});
it('three distinct correctly armed executions complete the lesson; held poses cannot inflate the count',()=>{const t=tracker('jab');for(let n=0;n<3;n++){t.observe(state(n*10),null,'a');t.observe(state(n*10+1,{state:'ATTACK',currentMoveId:M.JAB}),input(B.ATTACK),'a');for(let k=2;k<8;k++)t.observe(state(n*10+k,{state:'ATTACK',currentMoveId:M.JAB}),null,'a');expect(t.count).toBe(n+1);}t.observe(state(50,{state:'ATTACK',currentMoveId:M.JAB}),input(B.ATTACK),'a');expect(t.count).toBe(3);});
it('a different move does not satisfy the requested jab',()=>{const t=tracker('jab');t.observe(state(0),null,'a');t.observe(state(1,{state:'ATTACK',currentMoveId:M.UP_SMASH}),input(B.ATTACK),'a');expect(t.count).toBe(0);});
it('a real parry must be armed by a shield release and counts once through freeze',()=>{const t=tracker('parry');t.observe(state(0,{state:'SHIELD'}),null,'a');const parry={state:'SHIELD',shieldParryConsumed:true,shieldReaction:'parry' as const};t.observe(state(1,parry),input(0,B.SHIELD),'a');for(let n=2;n<15;n++)t.observe(state(n,parry),null,'a');expect(t.count).toBe(1);});
it('reset clears partial progress and old input arming',()=>{const t=tracker('jab');t.observe(state(0),null,'a');t.observe(state(1,{state:'ATTACK',currentMoveId:M.JAB}),input(B.ATTACK),'a');t.reset();expect(t.count).toBe(0);t.observe(state(2,{state:'ATTACK',currentMoveId:M.JAB}),null,'a');expect(t.count).toBe(0);});
it('all lesson ids are unique and every tier is represented',()=>{expect(new Set(LESSONS.map(l=>l.id)).size).toBe(LESSONS.length);expect(new Set(LESSONS.map(l=>l.tier)).size).toBe(3);});

for(const id of ['star-ko','screen-ko'])it(id+' requires the same partner to be hit by up smash and exit at the top',()=>{
 const t=tracker(id);
 const hit={attackerId:'a',defenderId:'local-p2',moveId:M.UP_SMASH,damage:0,knockbackMagnitude:100,worldX:0,worldY:0};
 const top={playerId:'local-p2',boundary:'top' as const,tick:5};
 t.observe(state(1),input(B.ATTACK),'a',[],[top]);
 t.observe(state(2),null,'a',[{...hit,moveId:M.JAB}],[top]);
 t.observe(state(3),null,'a',[hit],[{...top,boundary:'left'}]);
 t.observe(state(4),null,'a',[],[top]);
 expect(t.count).toBe(0);
 t.observe(state(5),input(B.ATTACK),'a',[hit]);
 t.resetAttempt();
 t.observe(state(6),null,'a',[],[top]);
 expect(t.count).toBe(0);
 t.observe(state(7),input(B.ATTACK),'a',[hit]);
 expect(t.observe(state(8),null,'a',[],[top])).toBe(true);
 expect(t.observe(state(9),null,'a',[],[top])).toBe(false);
 expect(t.count).toBe(1);
});
