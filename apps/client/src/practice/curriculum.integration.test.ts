import{it,expect}from'vitest';import{GameEngine}from'@smash/server/engine';import{INPUT_BITS as B,type CharacterId}from'@smash/shared';import{KO_LESSON_PERCENT,LESSONS,LessonTracker}from'./curriculum.js';
for(const characterId of['all-rounder','abe-lincoln','swift','moonshine','hulk-hoagie']as CharacterId[])for(const lesson of LESSONS)it(characterId+' can complete '+lesson.id+' with real engine executions',()=>{
 const e=new GameEngine({playerIds:['local-p1','local-p2'],characterIds:{'local-p1':characterId,'local-p2':characterId},practice:true}),tracker=new LessonTracker(lesson);let held=[0,0],confirmed=0;
 const step=(a=0,b=0,n=1)=>{for(let j=0;j<n;j++){const inputs=new Map(['local-p1','local-p2'].map((id,k)=>{const mask=k?b:a,input={playerId:id,tick:e.getCurrentTick(),seq:e.getCurrentTick(),held:mask,pressed:mask&~held[k]!,released:held[k]!&~mask};held[k]=mask;return[id,input]as const;}));const s=e.tickGame(inputs);const exits=e.getKOEvents();if(tracker.observe(s,inputs.get('local-p1'),'local-p1',e.getSnapshot(0,{}).hitEvents,exits)){
   confirmed++;
   if(lesson.ko){
    const exit=exits.find(event=>event.playerId==='local-p2');
    expect(exit).toMatchObject({
     boundary:'top',exitPosition:{x:expect.any(Number),y:expect.any(Number)},
     exitVelocity:{x:expect.any(Number),y:expect.any(Number)},exitFacing:expect.any(Number),
    });
    expect(exit!.exitVelocity!.y).toBeLessThan(0);
   }
  }e.clearHitEvents();} };
 for(let repetition=1;repetition<=(lesson.ko?5:3);repetition++){
  e.setPracticeSpawn(lesson.setup ?? 'center');e.setPracticePercent('local-p2',lesson.ko?KO_LESSON_PERCENT:0);
  e.resetPractice();tracker.resetAttempt();held=[0,0];step();
  const near=()=>{step(B.RIGHT,0,2);step(0,0,2);};
  const guard=()=>step(B.SHIELD,0,6);
  switch(lesson.id){

   case'forward-smash':step(B.SHIELD|B.RIGHT|B.ATTACK);step(0,0,35);break;
   case'up-smash':case'star-ko':case'screen-ko':step(B.SHIELD|B.UP|B.ATTACK);step(0,0,175);break;
   case'down-smash':step(B.SHIELD|B.DOWN|B.ATTACK);step(0,0,35);break;
   case'neutral-air':case'forward-air':case'back-air':case'up-air':case'down-air':{
    const directions:Record<string,number>={'forward-air':B.RIGHT,'back-air':B.LEFT,'up-air':B.UP,'down-air':B.DOWN};
    step(B.JUMP,0,6);step((directions[lesson.id]??0)|B.ATTACK);step(0,0,10);break;
   }
   case'neutral-air-dodge':case'directional-air-dodge':
    step(B.JUMP,0,6);step(B.SHIELD|(lesson.id==='directional-air-dodge'?B.RIGHT:0));break;
   case'grab-escape':{
    step(0,B.GRAB);step(0,0,14);
    for(let i=0;i<6;i++){step(B.JUMP);step();}
    step(0,0,16);break;
   }
   case'pummel':case'back-throw':case'up-throw':case'down-throw':{
    step(B.GRAB);step(0,0,20);
    const directions:Record<string,number>={pummel:B.ATTACK,'back-throw':B.LEFT,'up-throw':B.UP,'down-throw':B.DOWN};
    step(directions[lesson.id]!);step(0,0,35);break;
   }
   case'ledge-climb':case'ledge-roll':case'ledge-jump':case'ledge-attack':{
    step(0,0,45);
    const buttons:Record<string,number>={'ledge-climb':B.RIGHT,'ledge-roll':B.SHIELD,'ledge-jump':B.JUMP,'ledge-attack':B.ATTACK};
    step(buttons[lesson.id]!);step(0,0,5);break;
   }
   case'floor-tech-neutral':case'floor-tech-roll':step(B.SHIELD);step(lesson.id==='floor-tech-roll'?B.RIGHT:0,0,30);break;
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
  expect(tracker.count).toBe(Math.min(repetition,3));
  if(lesson.ko)expect(confirmed).toBe(repetition);
 }
});
