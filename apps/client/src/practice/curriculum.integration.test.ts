import{it,expect}from'vitest';import{GameEngine}from'@smash/server/engine';import{INPUT_BITS as B,type CharacterId}from'@smash/shared';import{LESSONS,LessonTracker}from'./curriculum.js';
for(const characterId of['all-rounder','abe-lincoln','swift']as CharacterId[])for(const lesson of LESSONS)it(characterId+' can complete '+lesson.id+' with three real engine executions',()=>{
 const e=new GameEngine({playerIds:['local-p1','local-p2'],characterIds:{'local-p1':characterId,'local-p2':characterId},practice:true}),tracker=new LessonTracker(lesson);let held=[0,0];
 const step=(a=0,b=0,n=1)=>{for(let j=0;j<n;j++){const inputs=new Map(['local-p1','local-p2'].map((id,k)=>{const mask=k?b:a,input={playerId:id,tick:e.getCurrentTick(),seq:e.getCurrentTick(),held:mask,pressed:mask&~held[k]!,released:held[k]!&~mask};held[k]=mask;return[id,input]as const;}));const s=e.tickGame(inputs);tracker.observe(s,inputs.get('local-p1'),'local-p1');e.clearHitEvents();} };
 for(let repetition=1;repetition<=3;repetition++){
  e.resetPractice();held=[0,0];step();
  const near=()=>{step(B.RIGHT,0,2);step(0,0,2);};
  const guard=()=>step(B.SHIELD,0,6);
  switch(lesson.id){
   case'walk':case'dash':step(B.RIGHT,0,6);break;
   case'jump':step(B.JUMP,0,5);step(0,0,8);break;
   case'jab':step(B.ATTACK,0,2);break;
   case'up-tilt':step(B.UP,0,4);step(B.UP|B.ATTACK);break;
   case'special':step(B.SPECIAL);break;
   case'shield':near();guard();step(B.SHIELD,B.ATTACK);step(B.SHIELD,0,18);break;
   case'grab':near();step(B.GRAB);step(0,0,20);break;
   case'throw':near();step(B.GRAB);step(0,0,16);step(B.RIGHT);step(0,0,8);break;
   case'double-jump':step(B.JUMP,0,5);step();step(B.JUMP);break;
   case'aerial':step(B.JUMP,0,5);step(B.ATTACK);break;
   case'short-hop':step(B.JUMP);step(0,0,8);break;
   case'fast-fall':step(B.JUMP,0,5);for(let i=0;i<80&&e.getSnapshot(0,{}).players['local-p1']!.vy<=0;i++)step();step(B.DOWN);break;
   case'spot-dodge':guard();step(B.SHIELD|B.DOWN);break;
   case'roll':guard();step(B.SHIELD|B.RIGHT);break;
   case'parry':near();guard();step(B.SHIELD,B.ATTACK);step(0,0,6);break;
   case'oos-special':guard();step(B.SHIELD|B.UP|B.SPECIAL);break;
   case'oos-smash':guard();step(B.SHIELD|B.UP|B.ATTACK);break;
  }
  expect(tracker.count).toBe(repetition);
 }
});
