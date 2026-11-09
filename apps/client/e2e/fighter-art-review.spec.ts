import { expect, test } from '@playwright/test';
test('review animates, pauses and steps through the new jab drawings', async ({page}) => {
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/fighter-art-pilot-v1/index.html');
 const status=page.locator('#status');
 await expect(status).toHaveAttribute('data-state','ready');
 await page.getByLabel('Animation',{exact:true}).selectOption('jab');
 await page.getByRole('button',{name:'Pause',exact:true}).click();
 await page.getByLabel('Drawing',{exact:true}).fill('0');
 const first=await page.locator('canvas').screenshot();
 for(let index=1;index<9;index++){
  await page.getByRole('button',{name:'Next drawing',exact:true}).click();
  await expect(status).toHaveAttribute('data-frame',String(index));
 }
 await page.getByLabel('Drawing',{exact:true}).fill('3');
 const punch=await page.locator('canvas').screenshot();
 expect(Buffer.compare(first,punch)).not.toBe(0);
 await page.getByRole('button',{name:'Play',exact:true}).click();
 const tick=await status.getAttribute('data-tick');
 await expect.poll(()=>status.getAttribute('data-tick')).not.toBe(tick);
 expect(errors).toEqual([]);
});
test('walk shows distinct opposite half-cycle drawings and working controls',async({page})=>{
 await page.goto('/fighter-art-pilot-v1/index.html');
 await expect(page.locator('#status')).toHaveAttribute('data-state','ready');
 await page.getByLabel('Animation',{exact:true}).selectOption('walk');
 await page.getByRole('button',{name:'Pause',exact:true}).click();
 await page.getByLabel('Drawing',{exact:true}).fill('0');
 const near=await page.locator('canvas').screenshot();
 await page.getByLabel('Drawing',{exact:true}).fill('3');
 const far=await page.locator('canvas').screenshot();
 expect(Buffer.compare(near,far)).not.toBe(0);
 await page.getByRole('button',{name:'Light / dark',exact:true}).click();
 await expect(page.locator('body')).toHaveClass('light');
 await page.getByLabel('Show gameplay collision circles',{exact:true}).check();
 await expect(page.getByLabel('Show gameplay collision circles',{exact:true})).toBeChecked();
});
test('missing animation images show an error instead of a silent blank canvas',async({page})=>{
 await page.route('**/all-rounder-walk-v2.png',route=>route.abort());
 await page.goto('/fighter-art-pilot-v1/index.html');
 await expect(page.locator('#status')).toHaveAttribute('data-state','ready');
 await page.getByLabel('Animation',{exact:true}).selectOption('walk');
 await expect(page.locator('#status')).toHaveAttribute('data-state','error');
 await expect(page.locator('#load-error')).toBeVisible();
 await expect(page.getByRole('button',{name:'Play',exact:true})).toBeDisabled();
});

test('new movement clips load and have distinct rise and fall poses', async ({page}) => {
 await page.goto('/fighter-art-pilot-v1/index.html');
 await expect(page.locator('#status')).toHaveAttribute('data-state','ready');
 await page.getByLabel('Animation',{exact:true}).selectOption('run');
 await expect(page.locator('#status')).toContainText('run');
 await page.getByRole('button',{name:'Pause',exact:true}).click();
 await page.getByLabel('Animation',{exact:true}).selectOption('jump');
 await page.getByLabel('Drawing',{exact:true}).fill('1');
 const rise=await page.locator('canvas').screenshot();
 await page.getByLabel('Drawing',{exact:true}).fill('3');
 const fall=await page.locator('canvas').screenshot();
 expect(Buffer.compare(rise,fall)).not.toBe(0);
 await page.screenshot({path:'C:/Users/misac/Documents/Codex/2026-11-02/referenced-chatgpt-conversation-this-is-an/outputs/fighter-art-v1/review-revision-3.png',fullPage:true});
});

test('defense and reaction sheets load and step through their poses', async ({page}) => {
 await page.goto('/fighter-art-pilot-v1/index.html');
 await expect(page.locator('#status')).toHaveAttribute('data-state','ready');
 await page.getByRole('button',{name:'Pause',exact:true}).click();
 for(const [clip,count]of [['shield',4],['dodge',6],['roll',6],['reaction',4]] as const){
  await page.getByLabel('Animation',{exact:true}).selectOption(clip);
  await page.getByLabel('Drawing',{exact:true}).fill('0');
  const first=await page.locator('canvas').screenshot();
  await page.getByLabel('Drawing',{exact:true}).fill(String(count-1));
  await expect(page.locator('#status')).toHaveAttribute('data-frame',String(count-1));
  const last=await page.locator('canvas').screenshot();
  expect(Buffer.compare(first,last)).not.toBe(0);
 }
 await page.getByLabel('Animation',{exact:true}).selectOption('roll');
 await page.getByLabel('Drawing',{exact:true}).fill('2');
 await page.screenshot({path:'C:/Users/misac/Documents/Codex/2026-11-02/referenced-chatgpt-conversation-this-is-an/outputs/fighter-art-v1/review-revision-4.png',fullPage:true});
});
test('game adapter supports guard, reverse roll, tumble and KO fallback',async({page})=>{
 await page.goto('/fighter-art-pilot-v1/index.html?renderer=fullbody&atlas=source');
 await expect(page.locator('#status')).toHaveAttribute('data-state','ready');
 const result=await page.evaluate(async()=>{
  const {FullBodyPilot,preloadFullBodyPilot}=await import('/src/renderer/fullbody/FullBodyPilot.ts');
  const {FighterRenderer}=await import('/src/renderer/FighterRenderer.ts');
  const assets=await preloadFullBodyPilot();if(!assets)throw Error('Pilot assets unavailable');
  const clips=assets.characters['all-rounder'];if(!clips)throw Error('All-Rounder missing');
  const pilot=new FullBodyPilot(assets,'all-rounder');
  pilot.update('ROLL',6,null,true,0,true,false,-1);
  const reverseRoll=pilot.sprite.scale.x<0&&pilot.sprite.position.y===0;
  pilot.update('HITSTUN',7,null,true,0,true,true);
  const tumble=pilot.sprite.texture===clips.tumble!.frames[2].texture&&pilot.sprite.position.y===0&&pilot.sprite.scale.x>0;
  pilot.update('HARD_LANDING',25,null,true);
  const grounded=pilot.sprite.position.y===28&&pilot.sprite.texture===clips.prone_up!.frames[1].texture;
  const Parent=pilot.sprite.constructor as new()=>any;const parent=new Parent();
  const fighter=new FighterRenderer(parent,0,'all-rounder',{mode:'polygon',fullBodyPilot:assets});
  const player={x:0,y:0,facing:1 as const,isInvincible:false,isKnockedOut:false,isShielding:true,shieldHealth:60,state:'SHIELD',stateFrame:0,slotIndex:0,currentMoveId:null};
  fighter.update(player);
  const guard=fighter.container.children.find((child:any)=>child.texture===clips.shield_raise!.frames[0].texture);
  const visibleGuard=Boolean(guard?.visible);
  fighter.update({...player,isKnockedOut:true});
  const koFallback=guard?.visible===false;
  fighter.destroy();pilot.sprite.destroy();parent.destroy();
  return {reverseRoll,tumble,grounded,visibleGuard,koFallback};
 });
 expect(result).toEqual({reverseRoll:true,tumble:true,grounded:true,visibleGuard:true,koFallback:true});
});

test('all fighters expose registered kicks and independent idle/walk artwork',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/fighter-art-pilot-v1/index.html');
 await expect(page.locator('#status')).toHaveAttribute('data-state','ready');
 await page.getByRole('button',{name:'Pause',exact:true}).click();
 for(const id of ['all-rounder','abe-lincoln','swift']){
  await page.locator('#fighter').selectOption(id);
  await expect(page.locator('#status')).toHaveAttribute('data-state','ready');
  for(const clip of ['idle','walk','forward_tilt','up_tilt','down_tilt']){
   await page.locator('#clip').selectOption(clip);
   await page.locator('#scrub').fill('0');const first=await page.locator('canvas').screenshot();
   await page.locator('#scrub').fill('3');await expect(page.locator('#status')).toHaveAttribute('data-frame','3');
   expect(Buffer.compare(first,await page.locator('canvas').screenshot())).not.toBe(0);
  }
  await page.screenshot({path:'C:/Users/misac/Documents/Codex/2026-11-02/referenced-chatgpt-conversation-this-is-an/outputs/fighter-art-roster-v1/'+id+'-review.png',fullPage:true});
 }
 expect(errors).toEqual([]);
});
test('roster adapter selects each fighters kick and falls back for unfinished moves',async({page})=>{
 await page.goto('/fighter-art-pilot-v1/index.html?renderer=fullbody&atlas=source');
 await expect(page.locator('#status')).toHaveAttribute('data-state','ready');
 const result=await page.evaluate(async()=>{
  const {FullBodyPilot,preloadFullBodyPilot}=await import('/src/renderer/fullbody/FullBodyPilot.ts');
  const assets=await preloadFullBodyPilot();if(!assets)throw Error('No roster assets');
  const manifest=await(await fetch('/fighter-art-pilot-v1/manifest.json')).json();
  for(const [id,height]of [['all-rounder',28],['abe-lincoln',32],['swift',26]] as const){
   const pilot=new FullBodyPilot(assets,id),clips=assets.characters[id]!;
   for(const [move,clip]of [['FORWARD_TILT','forward_tilt'],['UP_TILT','up_tilt'],['DOWN_TILT','down_tilt']] as const){
    const data=manifest.characters[id].clips[clip];
    if(!pilot.update('ATTACK',data.activeWindow[0],move as any,true)||pilot.sprite.texture!==clips[clip]!.frames[3].texture||pilot.sprite.position.y!==height)throw Error('Wrong kick '+id+'/'+clip);
    const positions=data.frames.map((f:any)=>(f.sockets.supportFoot[0]-f.root[0])*data.scale);
    if(Math.max(...positions)-Math.min(...positions)>.001)throw Error('Support foot drift');
   }
   if(id!=='all-rounder'&&pilot.update('ATTACK',0,'TECH_ROLL' as any,true))throw Error('Unfinished move did not fall back');
   pilot.sprite.destroy();
  }
  return true;
 });expect(result).toBe(true);
});

test('smashes load for every fighter, hold charge, and show front/rear contacts',async({page})=>{
 await page.goto('/fighter-art-pilot-v1/index.html?renderer=fullbody&atlas=source');
 await expect(page.locator('#status')).toHaveAttribute('data-state','ready');
 for(const id of ['all-rounder','abe-lincoln','swift']){
  await page.locator('#fighter').selectOption(id);
  await expect(page.locator('#status')).toHaveAttribute('data-state','ready');
  for(const clip of ['forward_smash','up_smash','down_smash']){
   await page.locator('#clip').selectOption(clip);await page.locator('#scrub').fill('1');
   await expect(page.locator('#status')).toContainText('charge hold');
   const hold=await page.locator('canvas').screenshot();
   await page.locator('#scrub').fill('3');expect(Buffer.compare(hold,await page.locator('canvas').screenshot())).not.toBe(0);
   if(clip==='down_smash'){const rear=await page.locator('canvas').screenshot();await page.locator('#scrub').fill('2');expect(Buffer.compare(rear,await page.locator('canvas').screenshot())).not.toBe(0);}
  }
 }
 await page.locator('#charge').selectOption('60');await page.locator('#scrub').fill('1');
 await page.getByRole('button',{name:'Play',exact:true}).click();
 await page.waitForTimeout(180);await expect(page.locator('#status')).toHaveAttribute('data-frame','1');
 const result=await page.evaluate(async()=>{
  const {FullBodyPilot,preloadFullBodyPilot}=await import('/src/renderer/fullbody/FullBodyPilot.ts');
  const assets=await preloadFullBodyPilot();if(!assets)throw Error('No assets');
  const manifest=await(await fetch('/fighter-art-pilot-v1/manifest.json')).json();
  for(const id of ['all-rounder','abe-lincoln','swift'] as const){
   const pilot=new FullBodyPilot(assets,id);
   for(const [clip,move]of [['forward_smash','FORWARD_SMASH'],['up_smash','UP_SMASH'],['down_smash','DOWN_SMASH']] as const){
    const c=manifest.characters[id].clips[clip],loaded=assets.characters[id]![clip]!;
    pilot.update('ATTACK',30,move as any,true,0,true,false,1,30);
    if(pilot.sprite.texture!==loaded.frames[1].texture)throw Error('No charge hold');
    pilot.update('ATTACK',c.activeWindow[0]+30,move as any,true,0,true,false,1,30);
    if(pilot.sprite.texture!==loaded.frames[clip==='down_smash'?2:3].texture)throw Error('Wrong release');
   }
   pilot.sprite.destroy();
  }return true;
 });expect(result).toBe(true);
});

test('Lincoln and Swift match all fifteen clips and render the newly completed states',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/fighter-art-pilot-v1/index.html?renderer=fullbody&atlas=source');
 await expect(page.locator('#status')).toHaveAttribute('data-state','ready');
 for(const id of ['abe-lincoln','swift']){
  await page.locator('#fighter').selectOption(id);await expect(page.locator('#status')).toHaveAttribute('data-state','ready');
  await expect(page.locator('#clip option')).toHaveCount(136);
  for(const [clip,count]of [['jab',9],['run',6],['jump',6],['shield',4],['dodge',6],['roll',6],['reaction',4]] as const){
   await page.locator('#clip').selectOption(clip);await page.locator('#scrub').fill('0');
   const first=await page.locator('canvas').screenshot();
   await page.locator('#scrub').fill(String(count-1));await expect(page.locator('#status')).toHaveAttribute('data-frame',String(count-1));
   expect(Buffer.compare(first,await page.locator('canvas').screenshot())).not.toBe(0);
  }
  await page.screenshot({path:'C:/Users/misac/Documents/Codex/2026-11-02/referenced-chatgpt-conversation-this-is-an/outputs/fighter-art-roster-v1/'+id+'-gap-review.png',fullPage:true});
 }
 const result=await page.evaluate(async()=>{
  const {FullBodyPilot,preloadFullBodyPilot}=await import('/src/renderer/fullbody/FullBodyPilot.ts');
  const assets=await preloadFullBodyPilot();if(!assets)throw Error('No assets');
  const manifest=await(await fetch('/fighter-art-pilot-v1/manifest.json')).json();
  const expected=Object.keys(manifest.characters['all-rounder'].clips).sort();
  for(const[id,offset]of [['abe-lincoln',32],['swift',26]] as const){
   const data=manifest.characters[id].clips,clips=assets.characters[id]!;
   if(JSON.stringify(Object.keys(data).sort())!==JSON.stringify(expected))throw Error('Clip gap');
   if(Object.values(data).reduce((n:number,c:any)=>n+c.frames.length,0)!==763)throw Error('Drawing gap');
   const pilot=new FullBodyPilot(assets,id);
   for(const[state,frame,clip,index,vy,dj,tumble,y]of [
    ['RUN',9,'run',3,0,true,false,offset],
    ['AIRBORNE',0,'air_rise_loop',0,-10,true,false,0],
    ['AIRBORNE',0,'air_fall_loop',0,10,true,false,0],
    ['DOUBLE_JUMP',0,'double_jump_transition',0,0,false,false,0],
    ['SHIELD',0,'shield_raise',0,0,true,false,offset],
    ['SPOT_DODGE',19,'dodge',5,0,true,false,offset],
    ['ROLL',6,'roll',2,0,true,false,0],
    ['HITSTUN',9,'tumble',3,0,true,true,0],
    ['HARD_LANDING',0,'knockdown_up',0,0,true,false,offset-16],
   ] as const){
    if(!pilot.update(state,frame,null,true,vy,dj,tumble,-1)||pilot.sprite.texture!==clips[clip]!.frames[index].texture||pilot.sprite.position.y!==y)throw Error('Bad state '+id+'/'+state);
   }
   const jab=data.jab;pilot.update('ATTACK',jab.activeWindow[0],'JAB' as any,true);
   if(pilot.sprite.texture!==clips.jab!.frames[3].texture)throw Error('Wrong jab contact');
   const support=jab.frames.map((f:any)=>(f.sockets.supportFoot[0]-f.root[0])*jab.scale);
   if(Math.max(...support)-Math.min(...support)>.001)throw Error('Jab slides');
   if(pilot.update('AIR_ATTACK',0,'TECH_ROLL' as any,true))throw Error('Missing aerial must fall back');
   pilot.sprite.destroy();
  }return true;
 });expect(result).toBe(true);expect(errors).toEqual([]);
});

test('synchronized roster review covers every clip and actual state transitions',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/fighter-art-pilot-v1/roster-consistency.html');
 await expect(page.locator('#status')).toHaveAttribute('data-state','ready');
 await page.getByRole('button',{name:'Pause',exact:true}).click();
 await expect(page.locator('#clip option')).toHaveCount(136);
 for(const clip of ['idle','walk','jab','run','jump','shield','dodge','roll','reaction','forward_tilt','up_tilt','down_tilt','forward_smash','up_smash','down_smash']){
  await page.locator('#clip').selectOption(clip);
  await expect(page.locator('#status')).toHaveAttribute('data-clip',clip);
  await page.getByRole('button',{name:'Next tick',exact:true}).click();
  await expect(page.locator('#status')).toHaveAttribute('data-tick','1');
 }
 await page.locator('#clip').selectOption('idle');await page.locator('#ghost').check();
 await page.screenshot({path:'C:/Users/misac/Documents/Codex/2026-11-02/referenced-chatgpt-conversation-this-is-an/outputs/fighter-art-roster-v1/consistency-idle.png',fullPage:true});
 await page.locator('#mode').selectOption('sequence');await expect(page.locator('#clip')).toBeDisabled();
 for(const[tick,clip]of [[0,'idle'],[48,'walk'],[96,'run'],[135,'jump'],[191,'jab'],[224,'shield_raise'],[248,'dodge'],[280,'roll'],[310,'tumble'],[322,'knockdown_up'],[340,'idle']] as const){
  await page.locator('#tick').fill(String(tick));await expect(page.locator('#status')).toHaveAttribute('data-clip',clip);
 }
 await page.locator('#tick').fill('120');await page.getByRole('button',{name:'Light / dark',exact:true}).click();
 await page.screenshot({path:'C:/Users/misac/Documents/Codex/2026-11-02/referenced-chatgpt-conversation-this-is-an/outputs/fighter-art-roster-v1/consistency-run.png',fullPage:true});
 expect(errors).toEqual([]);
});

test('all fifteen aerial clips render airborne contact and interrupt to landing',async({page})=>{
 await page.goto('/fighter-art-pilot-v1/index.html?renderer=fullbody&atlas=source');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');
 for(const id of ['all-rounder','abe-lincoln','swift']){
  await page.locator('#fighter').selectOption(id);await expect(page.locator('#status')).toHaveAttribute('data-state','ready');
  for(const clip of ['neutral_air','forward_air','back_air','up_air','down_air']){
   await page.locator('#clip').selectOption(clip);await page.locator('#scrub').fill('0');const ready=await page.locator('canvas').screenshot();
   await page.locator('#scrub').fill('3');await expect(page.locator('#status')).toContainText('contact');expect(Buffer.compare(ready,await page.locator('canvas').screenshot())).not.toBe(0);
  }
 }
 const result=await page.evaluate(async()=>{
  const {FullBodyPilot,preloadFullBodyPilot}=await import('/src/renderer/fullbody/FullBodyPilot.ts');const assets=await preloadFullBodyPilot();if(!assets)throw Error('Missing assets');
  const m=await(await fetch('/fighter-art-pilot-v1/manifest.json')).json();
  for(const id of ['all-rounder','abe-lincoln','swift'] as const){
   const p=new FullBodyPilot(assets,id),clips=assets.characters[id]!;
   for(const[clip,move]of [['neutral_air','NEUTRAL_AIR'],['forward_air','FORWARD_AIR'],['back_air','BACK_AIR'],['up_air','UP_AIR'],['down_air','DOWN_AIR']]as const){
    const c=m.characters[id].clips[clip];p.update('AIR_ATTACK',c.activeWindow[0],move as any,true,0);
    if(p.sprite.texture!==clips[clip]!.frames[3].texture||p.sprite.position.y!==0)throw Error('Wrong airborne contact');
    for(const f of c.frames)if(f.offsetY!==0||f.registration!=='cell-torso')throw Error('Foot anchored aerial');
    p.update('LANDING_LAG',0,move as any,true,0);
    if(p.sprite.texture!==clips.land_soft!.frames[0].texture||p.sprite.position.y!==m.characters[id].groundOffset)throw Error('Landing did not interrupt');
   }p.sprite.destroy();
  }return true;
 });expect(result).toBe(true);
 await page.goto('/fighter-art-pilot-v1/roster-consistency.html');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');
 await page.locator('#clip').selectOption('back_air');await expect(page.locator('#status')).toHaveAttribute('data-clip','back_air');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.locator('#tick').fill('9');
 await page.screenshot({path:'C:/Users/misac/Documents/Codex/2026-11-02/referenced-chatgpt-conversation-this-is-an/outputs/fighter-art-roster-v1/aerial-comparison.png',fullPage:true});
});

test('specials support ground and air anchors; counter success requires an event',async({page})=>{
 await page.goto('/fighter-art-pilot-v1/index.html?renderer=fullbody&atlas=source');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');
 for(const id of ['all-rounder','abe-lincoln','swift']){
  await page.locator('#fighter').selectOption(id);await expect(page.locator('#status')).toHaveAttribute('data-state','ready');
  for(const clip of ['neutral_special','side_special','up_special','down_special','counter_success']){
   await page.locator('#clip').selectOption(clip);await page.locator('#scrub').fill('0');const first=await page.locator('canvas').screenshot();
   await page.locator('#scrub').fill(clip==='counter_success'?'2':'3');expect(Buffer.compare(first,await page.locator('canvas').screenshot())).not.toBe(0);
   await page.locator('#air-special').check();await page.locator('#air-special').uncheck();
  }
 }
 const result=await page.evaluate(async()=>{
  const{FullBodyPilot,preloadFullBodyPilot}=await import('/src/renderer/fullbody/FullBodyPilot.ts');const assets=await preloadFullBodyPilot();if(!assets)throw Error('No pack');const m=await(await fetch('/fighter-art-pilot-v1/manifest.json')).json();
  if(Object.keys(m.effects).length!==4)throw Error('Missing effects');
  for(const id of ['all-rounder','abe-lincoln','swift']as const){
   const p=new FullBodyPilot(assets,id),clips=assets.characters[id]!,c=m.characters[id];
   for(const[clip,move]of [['neutral_special','NEUTRAL_SPECIAL'],['side_special','SIDE_SPECIAL'],['up_special','UP_SPECIAL'],['down_special','DOWN_SPECIAL']]as const){
    const tick=c.clips[clip].activeWindow[0];
    p.update('ATTACK',tick,move as any,true);if(p.sprite.texture!==clips[clip]!.frames[3].texture)throw Error('No special contact');
    p.update('AIR_ATTACK',tick,move as any,true);if(p.sprite.position.y!==0)throw Error('Air feet pinned');
    const frame=c.clips[clip].frames[3];if(p.sprite.pivot.x!==frame.airRoot[0]||p.sprite.pivot.y!==frame.airRoot[1])throw Error('Wrong air root');
   }
   p.update('ATTACK',2,'DOWN_SPECIAL' as any,true);
   if(p.sprite.texture===clips.counter_success!.frames[0].texture)throw Error('False retaliation');
   p.startCounterReaction();p.update('ATTACK',2,'DOWN_SPECIAL' as any,true);if(p.sprite.texture!==clips.counter_success!.frames[0].texture)throw Error('No event reaction');
   p.update('ATTACK',5,'DOWN_SPECIAL' as any,true);if(p.sprite.texture!==clips.counter_success!.frames[1].texture)throw Error('No retaliation progress');
   p.update('HITSTUN',0,null,true);if(p.sprite.texture===clips.counter_success!.frames[1].texture)throw Error('Counter did not interrupt');
   p.sprite.destroy();
  }return true;
 });expect(result).toBe(true);
 await page.locator('#clip').selectOption('neutral_special');await page.locator('#scrub').fill('3');await page.locator('#effects').check();
 await page.screenshot({path:'C:/Users/misac/Documents/Codex/2026-11-02/referenced-chatgpt-conversation-this-is-an/outputs/fighter-art-roster-v1/specials-review.png',fullPage:true});
});

test('grab roles and confirmed victim events select matching artwork',async({page})=>{
 await page.goto('/fighter-art-pilot-v1/index.html?renderer=fullbody&atlas=source');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');
 expect(await page.evaluate(async()=>{
 const {FullBodyPilot,preloadFullBodyPilot}=await import('/src/renderer/fullbody/FullBodyPilot.ts');
 const assets=await preloadFullBodyPilot();if(!assets)throw Error('Missing pack');
 for(const id of ['all-rounder','abe-lincoln','swift']as const){
 const p=new FullBodyPilot(assets,id),c=assets.characters[id]!;
 if(Object.keys(c).length!==135)throw Error('Incomplete fighter');
 p.update('GRAB_HOLDING',0,null,true,0,true,false,1,0,false);
 if(p.sprite.texture!==c.grab_hold!.frames[0].texture)throw Error('Holder role');
 p.update('GRAB_HOLDING',0,null,true,0,true,false,1,0,true,-1,-1);
 if(p.sprite.texture!==c.grabbed!.frames[0].texture||p.sprite.scale.x>=0)throw Error('Victim facing');
 p.startGrabReaction('PUMMEL' as any,1);p.update('GRAB_HOLDING',1,null,true,0,true,false,1,0,true,-1,-1);
 if(p.sprite.texture!==c.pummel_victim!.frames[0].texture)throw Error('No pummel reaction');
 if(Math.sign(p.sprite.scale.x)!==(id==='swift'?-1:1))throw Error('Source-facing correction');
 p.update('GRAB_HOLDING',10,null,true,0,true,false,1,0,true,-1,-1);
 p.update('IDLE',0,null,true,0,true,false,1,0,false,1,-1);
 if(p.sprite.texture!==c.grab_release!.frames[0].texture||p.sprite.scale.x>=0)throw Error('Release orientation');
 for(const[move,index]of [['FORWARD_THROW',0],['BACK_THROW',1],['UP_THROW',2],['DOWN_THROW',3]]as const){
 p.startGrabReaction(move as any,1);p.update('HITSTUN',0,null,true);
 if(p.sprite.texture!==c.throw_victim!.frames[index].texture)throw Error('Wrong launch '+move);
 p.update('HITSTUN',7,null,true);
 if(p.sprite.texture!==c.throw_victim!.frames[move==='DOWN_THROW'?4:5].texture)throw Error('Wrong bounce/tumble');
 p.update('IDLE',0,null,true);if(p.sprite.texture!==c.idle!.frames[0].texture)throw Error('Reaction did not interrupt');
 }p.sprite.destroy();
 }return true;
 })).toBe(true);
});
test('paired grab review covers every fighter combination and release direction',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/fighter-art-pilot-v1/grab-pairs.html');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');
 await page.locator('#play').click();
 for(const a of ['all-rounder','abe-lincoln','swift'])for(const v of ['all-rounder','abe-lincoln','swift']){
 await page.locator('#attacker').selectOption(a);await page.locator('#victim').selectOption(v);
 for(const action of ['grab_hold','pummel','forward_throw','back_throw','up_throw','down_throw']){
 await page.locator('#action').selectOption(action);await expect(page.locator('#status')).toHaveAttribute('data-state','ready');
 await page.locator('#tick').fill(action==='pummel'?'3':action.endsWith('_throw')?(action==='forward_throw'?'10':action==='down_throw'?'14':'12'):'0');
 await expect(page.locator('#status')).toHaveAttribute('data-victim-clip',action==='pummel'?'pummel_victim':action.endsWith('_throw')?'throw_victim':'grabbed');
 }
 }
 await page.locator('#attacker').selectOption('abe-lincoln');await page.locator('#victim').selectOption('swift');await page.locator('#action').selectOption('grab_hold');
 await expect(page.locator('#status')).toHaveAttribute('data-state','ready');
 await page.screenshot({path:'C:/Users/misac/Documents/Codex/2026-11-02/referenced-chatgpt-conversation-this-is-an/outputs/fighter-art-roster-v1/grab-pair-review.png',fullPage:true});
 await page.locator('#facing').selectOption('-1');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');expect(errors).toEqual([]);
});

test('live contact adapter supports all fighter sizes and keeps offsets visual',async({page})=>{
 await page.goto('/fighter-art-pilot-v1/index.html?renderer=fullbody&atlas=source');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');
 expect(await page.evaluate(async()=>{
 const{FullBodyPilot,preloadFullBodyPilot}=await import('/src/renderer/fullbody/FullBodyPilot.ts');const{solveGrabContact}=await import('/src/renderer/fullbody/contactPose.ts');const assets=await preloadFullBodyPilot();if(!assets)throw Error('No pack');
 for(const a of ['all-rounder','abe-lincoln','swift']as const)for(const v of ['all-rounder','abe-lincoln','swift']as const)for(const facing of [1,-1]as const){
 const p=new FullBodyPilot(assets,v),h=assets.characters[a]!.grab_hold!,c=assets.characters[v]!.grabbed!,offset=solveGrabContact(h,0,c,0,40,0);
 p.update('GRAB_HOLDING',0,null,true,0,true,false,1,0,true,facing,facing,{characterId:a,state:'GRAB_HOLDING',frame:0,move:null,dx:40,dy:0,facing});
 if(Math.abs(p.sprite.position.x-offset[0])>.001||Math.abs(p.sprite.position.y-c.frames[0]!.offsetY-offset[1])>.001)throw Error('Contact mismatch');
 p.update('IDLE',0,null,true);p.update('IDLE',13,null,true);if(p.sprite.position.x!==0)throw Error('Stale attachment');
 p.sprite.destroy();
 }return true;
 })).toBe(true);
 await page.goto('/fighter-art-pilot-v1/grab-pairs.html');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.locator('#play').click();await page.locator('#action').selectOption('grab_hold');await page.locator('#sockets').check();
 for(const a of ['all-rounder','abe-lincoln','swift'])for(const v of ['all-rounder','abe-lincoln','swift']){await page.locator('#attacker').selectOption(a);await page.locator('#victim').selectOption(v);await expect(page.locator('#status')).toHaveAttribute('data-state','ready');const x=Number(await page.locator('#status').getAttribute('data-contact-x'));expect(Number.isFinite(x)).toBe(true);}
 await page.locator('#attacker').selectOption('swift');await page.locator('#victim').selectOption('abe-lincoln');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');
 await page.screenshot({path:'C:/Users/misac/Documents/Codex/2026-11-02/referenced-chatgpt-conversation-this-is-an/outputs/fighter-art-roster-v1/contact-polish.png',fullPage:true});
});
test('ledge suite plays on both edges and runtime cancels catch and release correctly',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/fighter-art-pilot-v1/ledge-review.html');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.locator('#play').click();
 for(const edge of ['left','right']){await page.locator('#edge').selectOption(edge);for(const clip of ['ledge_catch','ledge_hang','ledge_climb','ledge_roll','ledge_attack','ledge_jump','ledge_drop','ledge_trump']){await page.locator('#clip').selectOption(clip);await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.locator('#tick').fill(clip==='ledge_attack'?'20':'1');await expect(page.locator('#status')).toHaveAttribute('data-clip',clip);}}
 await page.locator('#edge').selectOption('left');await page.locator('#clip').selectOption('ledge_hang');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');
 await page.screenshot({path:'C:/Users/misac/Documents/Codex/2026-11-02/referenced-chatgpt-conversation-this-is-an/outputs/fighter-art-roster-v1/ledge-hang-review.png',fullPage:true});
 await page.locator('#mode').selectOption('sequence');await page.locator('#clip').selectOption('ledge_attack');await page.locator('#tick').fill('76');await expect(page.locator('#status')).toContainText('attack contact');
 await page.goto('/fighter-art-pilot-v1/index.html?renderer=fullbody&atlas=source');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');
 expect(await page.evaluate(async()=>{
 const{FullBodyPilot,preloadFullBodyPilot}=await import('/src/renderer/fullbody/FullBodyPilot.ts');const assets=await preloadFullBodyPilot();if(!assets)throw Error('No pack');
 for(const id of ['all-rounder','abe-lincoln','swift']as const){const p=new FullBodyPilot(assets,id),c=assets.characters[id]!;
 for(const edge of ['left','right']){p.update('LEDGE_HANG',0,null,true,0,true,false,1,0,false,1,1,undefined,edge);if(p.sprite.texture!==c.ledge_catch!.frames[0].texture||Math.sign(p.sprite.scale.x)!==(edge==='left'?1:-1))throw Error('Catch orientation');
 p.update('LEDGE_HANG',8,null,true,0,true,false,1,0,false,1,1,undefined,edge);if(p.sprite.texture!==c.ledge_hang!.frames[0].texture)throw Error('Hang');
 p.update('AIRBORNE',0,null,true,0);if(p.sprite.texture!==c.ledge_drop!.frames[0].texture)throw Error('Drop');
 p.update('LEDGE_HANG',10,null,true);p.update('AIRBORNE',0,null,true,-6);if(p.sprite.texture!==c.ledge_trump!.frames[0].texture)throw Error('Trump');
 p.update('HITSTUN',0,null,true);if(p.sprite.texture!==c.hit_mid!.frames[0].texture)throw Error('Release did not interrupt');}
 p.sprite.destroy();}return true;
 })).toBe(true);expect(errors).toEqual([]);
});


test('recovery preview covers all fighters, ground variants and staged surface techs',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/fighter-art-pilot-v1/recovery-review.html');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.locator('#play').click();
 const clips=['knockdown_up','knockdown_down','prone_up','prone_down','getup_up','getup_down','getup_roll_up','getup_roll_down','floor_attack_up','floor_attack_down','trip_fall','trip_prone','trip_getup','floor_attack_trip','tech_neutral','tech_roll','wall_tech','wall_tech_jump','ceiling_tech','trip_roll'];
 for(const facing of ['left','right']){await page.locator('#edge').selectOption(facing);for(const clip of clips){await page.locator('#clip').selectOption(clip);await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.locator('#tick').fill(clip.startsWith('floor_attack_')?'8':'1');await expect(page.locator('#status')).toHaveAttribute('data-clip',clip);if(clip.startsWith('floor_attack_'))await expect(page.locator('#status')).toContainText('sweep contact');}}
 await page.locator('#edge').selectOption('left');await page.locator('#clip').selectOption('floor_attack_up');await expect(page.locator('#status')).toHaveAttribute('data-clip','floor_attack_up');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.locator('#tick').fill('8');await expect(page.locator('#status')).toHaveAttribute('data-index','2');
 await page.screenshot({path:'C:/Users/misac/Documents/Codex/2026-11-02/referenced-chatgpt-conversation-this-is-an/outputs/fighter-art-roster-v1/floor-attack-review.png',fullPage:true});
 await page.locator('#mode').selectOption('sequence');await page.locator('#clip').selectOption('getup_up');
 for(const [tick,clip] of [['0','knockdown_up'],['18','prone_up'],['42','getup_up'],['66','idle']]){await page.locator('#tick').fill(tick);await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await expect(page.locator('#status')).toHaveAttribute('data-clip',clip);}
 await page.locator('#tick').fill('18');await page.screenshot({path:'C:/Users/misac/Documents/Codex/2026-11-02/referenced-chatgpt-conversation-this-is-an/outputs/fighter-art-roster-v1/recovery-review.png',fullPage:true});
 await page.locator('#clip').selectOption('getup_roll_down');await page.locator('#roll-direction').selectOption('back');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');expect(errors).toEqual([]);
});
test('live recovery sprites use engine states and leave prepared getup art unloaded',async({page})=>{
 await page.goto('/fighter-art-pilot-v1/index.html?renderer=fullbody&atlas=source');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');
 expect(await page.evaluate(async()=>{
 const{FullBodyPilot,preloadFullBodyPilot}=await import('/src/renderer/fullbody/FullBodyPilot.ts');const assets=await preloadFullBodyPilot();if(!assets)throw Error('No pack');
 for(const id of ['all-rounder','abe-lincoln','swift']as const){const p=new FullBodyPilot(assets,id),c=assets.characters[id]!;
 if(!c.getup_up||!c.wall_tech||!c.ceiling_tech)throw Error('Preview art loaded at runtime');
 for(const[state,tick,clip,index]of [['HARD_LANDING',0,'knockdown_up',0],['HARD_LANDING',18,'prone_up',0],['TECH_NEUTRAL',25,'tech_neutral',5],['TECH_ROLL',39,'tech_roll',5]]as const){p.update(state,tick,null,true);if(p.sprite.texture!==c[clip]!.frames[index].texture)throw Error('Recovery mismatch '+id+state);}
 p.update('HITSTUN',0,null,true);if(p.sprite.texture!==c.hit_mid!.frames[0].texture)throw Error('Tech interruption');
 p.update('IDLE',0,null,true);if(p.sprite.texture!==c.idle!.frames[0].texture)throw Error('Stale recovery');
 p.sprite.destroy();}return true;
 })).toBe(true);
});

test('movement and defense previews load every new family in both facings',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/fighter-art-pilot-v1/transition-review.html');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.locator('#play').click();
 for(const facing of ['left','right']){await page.locator('#edge').selectOption(facing);for(const clip of ["dash_start","turn_stand","turn_run","brake","crouch_enter","crouch_hold","crouch_exit","jump_squat","land_soft","land_heavy","platform_drop","teeter_front","teeter_back","shield_raise","shield_hit","shield_drop","parry","air_dodge_neutral","air_dodge_directional","air_dodge_land","shield_break_launch","shield_break_dizzy","shield_break_recover","grab_dash","grab_pivot"]){await page.locator('#clip').selectOption(clip);await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await expect(page.locator('#status')).toHaveAttribute('data-clip',clip);await page.locator('#tick').fill(clip.startsWith('grab_')?'9':'1');if(clip.startsWith('grab_'))await expect(page.locator('#status')).toContainText('catch / whiff pose');}}
 await page.locator('#edge').selectOption('left');await page.locator('#clip').selectOption('grab_dash');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.locator('#tick').fill('9');await expect(page.locator('#status')).toHaveAttribute('data-index','3');
 await page.screenshot({path:'C:/Users/misac/Documents/Codex/2026-11-02/referenced-chatgpt-conversation-this-is-an/outputs/fighter-art-roster-v1/dash-grab-review.png',fullPage:true});
 await page.locator('#mode').selectOption('sequence');await page.locator('#clip').selectOption('dash_start');
 for(const[tick,clip]of [['0','idle'],['12','dash_start'],['27','run']]){await page.locator('#tick').fill(tick);await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await expect(page.locator('#status')).toHaveAttribute('data-clip',clip);}
 await page.locator('#clip').selectOption('shield_raise');await page.locator('#tick').fill('18');await expect(page.locator('#status')).toHaveAttribute('data-clip','shield');
 expect(errors).toEqual([]);
});
test('live movement art follows states while unimplemented transitions remain unloaded',async({page})=>{
 await page.goto('/fighter-art-pilot-v1/index.html?renderer=fullbody&atlas=source');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');
 expect(await page.evaluate(async()=>{
 const{FullBodyPilot,preloadFullBodyPilot}=await import('/src/renderer/fullbody/FullBodyPilot.ts');const a=await preloadFullBodyPilot();if(!a)throw Error('Pack absent');
 for(const id of ['all-rounder','abe-lincoln','swift']as const){const p=new FullBodyPilot(a,id),c=a.characters[id]!;
 if(Object.keys(c).length!==135||!c.grab_dash||!c.grab_pivot||!c.parry||!c.crouch_enter||c.air_dodge_directional)throw Error('Preview-only clip loaded');
 for(const[state,tick,clip,index]of [['DASH',14,'dash_start',5],['JUMPSQUAT',2,'jump_squat',5],['SHIELD',3,'shield_raise',3],['SHIELD',6,'shield',0],['AIR_DODGE',22,'air_dodge_neutral',5]]as const){p.update(state,tick,null,true);if(p.sprite.texture!==c[clip]!.frames[index].texture)throw Error('Wrong live pose '+state);}
 p.update('HITSTUN',0,null,true);if(p.sprite.texture!==c.hit_mid!.frames[0].texture)throw Error('Stale dodge');
 p.sprite.destroy();}return true;
 })).toBe(true);
});

test('saved review folder loads local sprite files without a web server',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const base='file:///C:/Users/misac/Documents/Codex/2026-11-02/referenced-chatgpt-conversation-this-is-an/outputs/fighter-art-roster-v1/';
 await page.goto(base+'index.html');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.getByLabel('Animation',{exact:true}).selectOption('grab_pivot');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');
 await page.goto(base+'transition-review.html');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.locator('#play').click();await page.locator('#clip').selectOption('grab_pivot');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.locator('#tick').fill('9');await expect(page.locator('#status')).toHaveAttribute('data-index','3');
 await page.screenshot({path:'C:/Users/misac/Documents/Codex/2026-11-02/referenced-chatgpt-conversation-this-is-an/outputs/fighter-art-roster-v1/pivot-grab-review.png',fullPage:true});expect(errors).toEqual([]);
});

test('combat and presentation review covers all new families in both facings',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/fighter-art-pilot-v1/action-review.html');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.locator('#play').click();
 for(const facing of ['1','-1']){await page.locator('#facing').selectOption(facing);for(const clip of ["dash_attack","hit_high","hit_mid","hit_low","hit_heavy","hit_air","tumble","tumble_recover","jab_lock_up","jab_lock_down","footstool_attacker","footstool_ground_victim","footstool_air_victim","entry","respawn_wait","respawn_drop","taunt_up","taunt_side","taunt_down","victory_1","victory_2","victory_3","defeat","ko_launch","ko_screen","ko_star"]){await page.locator('#clip').selectOption(clip);await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await expect(page.locator('#status')).toHaveAttribute('data-clip',clip);await page.locator('#tick').fill(clip==='dash_attack'?'12':'1');if(clip==='dash_attack')await expect(page.locator('#status')).toContainText('contact pose');}}
 await page.locator('#facing').selectOption('1');await page.locator('#clip').selectOption('dash_attack');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.locator('#tick').fill('12');await expect(page.locator('#status')).toHaveAttribute('data-index','3');
 await page.screenshot({path:'C:/Users/misac/Documents/Codex/2026-11-02/referenced-chatgpt-conversation-this-is-an/outputs/fighter-art-roster-v1/dash-attack-review.png',fullPage:true});
 await page.locator('#mode').selectOption('sequence');await page.locator('#clip').selectOption('tumble');await page.locator('#tick').fill('48');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await expect(page.locator('#status')).toHaveAttribute('data-clip','tumble_recover');expect(errors).toEqual([]);
});
test('paired footstools align all sizes, both facings and ground/air victims',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/fighter-art-pilot-v1/footstool-pairs.html');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.locator('#play').click();
 for(const mode of ['ground','air'])for(const facing of ['1','-1'])for(const a of ['all-rounder','abe-lincoln','swift'])for(const v of ['all-rounder','abe-lincoln','swift']){await page.locator('#mode').selectOption(mode);await page.locator('#facing').selectOption(facing);await page.locator('#attacker').selectOption(a);await page.locator('#victim').selectOption(v);await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.locator('#tick').fill('12');await expect(page.locator('#status')).toHaveAttribute('data-contact','true');expect(Number(await page.locator('#status').getAttribute('data-gap'))).toBeLessThan(.001);}
 await page.locator('#mode').selectOption('ground');await page.locator('#facing').selectOption('1');await page.locator('#attacker').selectOption('abe-lincoln');await page.locator('#victim').selectOption('swift');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.locator('#tick').fill('12');await expect(page.locator('#status')).toHaveAttribute('data-contact','true');await page.screenshot({path:'C:/Users/misac/Documents/Codex/2026-11-02/referenced-chatgpt-conversation-this-is-an/outputs/fighter-art-roster-v1/footstool-contact-review.png',fullPage:true});expect(errors).toEqual([]);
});
test('live hit and tumble art interrupts correctly and presentation folders work offline',async({page})=>{
 await page.goto('/fighter-art-pilot-v1/index.html?renderer=fullbody&atlas=source');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');
 expect(await page.evaluate(async()=>{const{FullBodyPilot,preloadFullBodyPilot}=await import('/src/renderer/fullbody/FullBodyPilot.ts');const a=await preloadFullBodyPilot();if(!a)throw Error('Pack absent');for(const id of ['all-rounder','abe-lincoln','swift']as const){const p=new FullBodyPilot(a,id),c=a.characters[id]!;if(Object.keys(c).length!==135||!c.dash_attack||!c.footstool_attacker||!c.entry||!c.victory_1)throw Error('Preview-only art loaded');
 p.update('HITSTUN',0,null,true);if(p.sprite.texture!==c.hit_mid!.frames[0].texture)throw Error('Generic hit');p.update('HITSTUN',99,null,true);if(p.sprite.texture!==c.hit_mid!.frames[3].texture)throw Error('Hit recovery looped');
 p.update('HITSTUN',18,null,true,0,true,true);if(p.sprite.texture!==c.tumble!.frames[0].texture)throw Error('Tumble loop');
 p.update('AIRBORNE',0,null,true,-10);if(p.sprite.texture!==c.air_rise_loop!.frames[0].texture)throw Error('Tumble exit');p.update('HITSTUN',0,null,false);if(p.sprite.visible)throw Error('KO fallback');p.sprite.destroy();}return true;})).toBe(true);
 const base='file:///C:/Users/misac/Documents/Codex/2026-11-02/referenced-chatgpt-conversation-this-is-an/outputs/fighter-art-roster-v1/';await page.goto(base+'footstool-pairs.html');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.goto(base+'action-review.html');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.locator('#play').click();await page.locator('#clip').selectOption('victory_1');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.locator('#tick').fill('28');await expect(page.locator('#status')).toHaveAttribute('data-index','3');await page.screenshot({path:'C:/Users/misac/Documents/Codex/2026-11-02/referenced-chatgpt-conversation-this-is-an/outputs/fighter-art-roster-v1/victory-review.png',fullPage:true});
});

test('airborne preview covers every new family and both facings',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/fighter-art-pilot-v1/airborne-review.html');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.locator('#play').click();
 for(const facing of ['1','-1']){await page.locator('#facing').selectOption(facing);for(const clip of ["takeoff_neutral","takeoff_forward","takeoff_backward","air_rise_loop","air_apex_loop","air_fall_loop","air_fastfall_loop","double_jump_transition","air_dodge_up","air_dodge_down","air_dodge_side","air_dodge_up_diagonal","air_dodge_down_diagonal","helpless_enter","helpless_loop","helpless_land","jab_2","jab_3"]){await page.locator('#clip').selectOption(clip);await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await expect(page.locator('#status')).toHaveAttribute('data-clip',clip);await page.locator('#tick').fill('1');await page.locator('#step').click();await expect(page.locator('#status')).toHaveAttribute('data-tick','2');}}
 await page.locator('#facing').selectOption('1');await page.locator('#clip').selectOption('air_apex_loop');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.locator('#tick').fill('18');await expect(page.locator('#status')).toHaveAttribute('data-index','3');await page.screenshot({path:'C:/Users/misac/Documents/Codex/2026-11-02/referenced-chatgpt-conversation-this-is-an/outputs/fighter-art-roster-v1/airborne-loop-review.png',fullPage:true});expect(errors).toEqual([]);
});
test('airborne sequences cover hops, double jump, helpless recovery, jab chains and eight dodge directions',async({page})=>{
 await page.goto('/fighter-art-pilot-v1/airborne-review.html');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.locator('#play').click();
 for(const takeoff of ['takeoff_neutral','takeoff_forward','takeoff_backward']){await page.locator('#takeoff').selectOption(takeoff);await page.locator('#mode').selectOption('flight');for(const[tick,clip]of [['0',takeoff],['24','air_rise_loop'],['60','air_apex_loop'],['96','air_fall_loop'],['132','land_soft']]){await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.locator('#tick').fill(tick);await expect(page.locator('#status')).toHaveAttribute('data-clip',clip);}}
 await page.locator('#mode').selectOption('double');for(const[t,c]of [['18','double_jump_transition'],['42','air_rise_loop']]){await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.locator('#tick').fill(t);await expect(page.locator('#status')).toHaveAttribute('data-clip',c);}
 await page.locator('#mode').selectOption('recovery');for(const[t,c]of [['37','helpless_enter'],['61','helpless_loop'],['97','helpless_land']]){await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.locator('#tick').fill(t);await expect(page.locator('#status')).toHaveAttribute('data-clip',c);}
 await page.locator('#mode').selectOption('chain');for(const[t,c]of [['15','jab_2'],['33','jab_3'],['51','idle']]){await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.locator('#tick').fill(t);await expect(page.locator('#status')).toHaveAttribute('data-clip',c);}
 await page.locator('#tick').fill('42');await expect(page.locator('#status')).toHaveAttribute('data-index','3');await page.screenshot({path:'C:/Users/misac/Documents/Codex/2026-11-02/referenced-chatgpt-conversation-this-is-an/outputs/fighter-art-roster-v1/jab-chain-review.png',fullPage:true});
 await page.locator('#mode').selectOption('dodge');for(const facing of ['1','-1']){await page.locator('#facing').selectOption(facing);for(const dir of ['up','up_right','right','down_right','down','down_left','left','up_left']){await page.locator('#direction').selectOption(dir);await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.locator('#tick').fill('12');await expect(page.locator('#status')).toHaveAttribute('data-index','3');await expect(page.locator('#status')).toHaveAttribute('data-direction',dir);}}
 await page.screenshot({path:'C:/Users/misac/Documents/Codex/2026-11-02/referenced-chatgpt-conversation-this-is-an/outputs/fighter-art-roster-v1/directional-dodge-review.png',fullPage:true});
});
test('airborne folders work offline and new moves stay preview-only',async({page})=>{
 await page.goto('/fighter-art-pilot-v1/index.html?renderer=fullbody&atlas=source');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');expect(await page.evaluate(async()=>{const{preloadFullBodyPilot}=await import('/src/renderer/fullbody/FullBodyPilot.ts');const a=await preloadFullBodyPilot();if(!a)throw Error('Pack absent');for(const c of Object.values(a.characters)){if(!c||Object.keys(c).length!==135||!c.jab_2||!c.jab_3||!c.air_rise_loop||!c.helpless_loop)throw Error('Preview-only art loaded');}return true;})).toBe(true);
 const b='file:///C:/Users/misac/Documents/Codex/2026-11-02/referenced-chatgpt-conversation-this-is-an/outputs/fighter-art-roster-v1/';await page.goto(b+'airborne-review.html');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.locator('#play').click();await page.locator('#mode').selectOption('dodge');await page.locator('#direction').selectOption('down_left');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.goto(b+'moveset-decisions.html');await expect(page.getByRole('heading',{name:'Roster moveset baseline',exact:true})).toBeVisible();await expect(page.locator('body')).toContainText('Swift only');
});


test('polished dodges preserve facing and staged flight boundaries stay continuous',async({page})=>{
 await page.goto('/fighter-art-pilot-v1/airborne-review.html');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.locator('#play').click();await page.locator('#mode').selectOption('dodge');
 const dirs=['up','up_right','right','down_right','down','down_left','left','up_left'],right=['air_dodge_up','air_dodge_up_diagonal','air_dodge_side','air_dodge_down_diagonal','air_dodge_down','air_dodge_down_back','air_dodge_back','air_dodge_up_back'],left=['air_dodge_up','air_dodge_up_back','air_dodge_back','air_dodge_down_back','air_dodge_down','air_dodge_down_diagonal','air_dodge_side','air_dodge_up_diagonal'];
 for(const[facing,clips]of [['1',right],['-1',left]]as const){await page.locator('#facing').selectOption(facing);for(let i=0;i<dirs.length;i++){await page.locator('#direction').selectOption(dirs[i]);await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.locator('#tick').fill('12');await expect(page.locator('#status')).toHaveAttribute('data-clip',clips[i]);await expect(page.locator('#status')).toHaveAttribute('data-facing',facing);}}
 await page.locator('#facing').selectOption('1');await page.locator('#direction').selectOption('left');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.locator('#tick').fill('12');await page.screenshot({path:'C:/Users/misac/Documents/Codex/2026-11-02/referenced-chatgpt-conversation-this-is-an/outputs/fighter-art-roster-v1/backward-dodge-polish.png',fullPage:true});
 for(const[mode,boundaries]of [['flight',[24,60,96,132]],['double',[18,42]],['recovery',[37,61,97]],['dodge',[24]]]as const){await page.locator('#mode').selectOption(mode);for(const t of boundaries){await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.locator('#tick').fill(String(t-1));await expect(page.locator('#status')).toHaveAttribute('data-tick',String(t-1));const a=JSON.parse((await page.locator('#status').getAttribute('data-torsos'))!);await page.locator('#tick').fill(String(t));await expect(page.locator('#status')).toHaveAttribute('data-tick',String(t));const b=JSON.parse((await page.locator('#status').getAttribute('data-torsos'))!);for(let i=0;i<3;i++)expect(Math.hypot(a[i][0]-b[i][0],a[i][1]-b[i][1])).toBeLessThan(10);}}
});
test('uniform tumble follows simulation ticks and loop before after works offline',async({page})=>{
 await page.goto('/fighter-art-pilot-v1/index.html?renderer=fullbody&atlas=source');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');expect(await page.evaluate(async()=>{const{FullBodyPilot,preloadFullBodyPilot}=await import('/src/renderer/fullbody/FullBodyPilot.ts');const a=await preloadFullBodyPilot();if(!a)throw Error('No pack');const m=await(await fetch('/fighter-art-pilot-v1/manifest.json')).json(),old=await(await fetch('/fighter-art-pilot-v1/loop-polish-before.json')).json();for(const id of ['all-rounder','abe-lincoln','swift']as const){if(JSON.stringify(m.characters[id].clips.walk)!==JSON.stringify(old.characters[id].clips.walk)||JSON.stringify(m.characters[id].clips.jab)!==JSON.stringify(old.characters[id].clips.jab))throw Error('Accepted art changed');if(!m.characters[id].clips.run.image.endsWith('-run-v2.png'))throw Error('Old run');
 const p=new FullBodyPilot(a,id);for(let t=0;t<=18;t++){p.update('HITSTUN',t,null,true,0,true,true);if(Math.abs(p.sprite.rotation-(t%18)/18*Math.PI*2)>1e-8)throw Error('Uneven spin');}p.update('HITSTUN',5,null,true,0,true,true);const r=p.sprite.rotation;p.update('HITSTUN',5,null,true,0,true,true);if(p.sprite.rotation!==r)throw Error('Repeated snapshot advanced rotation');p.update('IDLE',0,null,true);if(p.sprite.rotation!==0)throw Error('Stale rotation');p.sprite.destroy();}return true;})).toBe(true);
 await page.goto('file:///C:/Users/misac/Documents/Codex/2026-11-02/referenced-chatgpt-conversation-this-is-an/outputs/fighter-art-roster-v1/loop-polish-review.html');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.locator('#play').click();for(const clip of ['run','tumble','walk']){await page.locator('#clip').selectOption(clip);await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.locator('#tick').fill('9');await expect(page.locator('#status')).toHaveAttribute('data-clip',clip);}await page.locator('#clip').selectOption('run');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.locator('#tick').fill('9');await page.screenshot({path:'C:/Users/misac/Documents/Codex/2026-11-02/referenced-chatgpt-conversation-this-is-an/outputs/fighter-art-roster-v1/run-loop-polish.png',fullPage:true});await page.locator('#clip').selectOption('tumble');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.locator('#tick').fill('11');await page.screenshot({path:'C:/Users/misac/Documents/Codex/2026-11-02/referenced-chatgpt-conversation-this-is-an/outputs/fighter-art-roster-v1/tumble-loop-polish.png',fullPage:true});
});


test('contact review covers every pair/action at gameplay and distant sprite scales',async({page})=>{
 test.setTimeout(90000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/fighter-art-pilot-v1/grab-pairs.html?scale=1');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await expect(page.locator('#zoom')).toHaveValue('1');await page.locator('#play').click();
 for(const a of ['all-rounder','abe-lincoln','swift'])for(const v of ['all-rounder','abe-lincoln','swift']){await page.locator('#attacker').selectOption(a);await page.locator('#victim').selectOption(v);for(const action of ['grab','grab_hold','pummel','forward_throw','back_throw','up_throw','down_throw','grab_release']){await page.locator('#action').selectOption(action);await expect(page.locator('#status')).toHaveAttribute('data-state','ready');for(const scale of ['1','0.4'])for(const facing of ['1','-1']){await page.locator('#zoom').selectOption(scale);await page.locator('#facing').selectOption(facing);await expect(page.locator('#status')).toHaveAttribute('data-state','ready');expect(await page.evaluate(()=>{const c=document.querySelector('canvas')!;return c.width===1100&&c.height===700;})).toBe(true);}}}
 await page.locator('#action').selectOption('grab_hold');await page.locator('#zoom').selectOption('1');await page.locator('#facing').selectOption('1');await page.evaluate(()=>{const c=document.createElement('canvas');c.width=1200;c.height=750;(window as any).__contactBoard=c;const ctx=c.getContext('2d')!;ctx.fillStyle='#313d50';ctx.fillRect(0,0,1200,750);});
 let tile=0;for(const a of ['all-rounder','abe-lincoln','swift'])for(const v of ['all-rounder','abe-lincoln','swift']){await page.locator('#attacker').selectOption(a);await page.locator('#victim').selectOption(v);await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.locator('#tick').fill('12');await page.evaluate(({a,v,tile})=>{const out=(window as any).__contactBoard as HTMLCanvasElement,ctx=out.getContext('2d')!,x=tile%3*400,y=Math.floor(tile/3)*250;ctx.fillStyle='#f5eedf';ctx.font='14px system-ui';ctx.fillText(a+' holds '+v,x+12,y+20);ctx.drawImage(document.querySelector('canvas')!,300,440,400,180,x,y+25,400,180);},{a,v,tile:tile++});}
 const data=await page.evaluate(()=>(window as any).__contactBoard.toDataURL('image/png'));const{writeFileSync}=await import('node:fs');writeFileSync('C:/Users/misac/Documents/Codex/2026-11-02/referenced-chatgpt-conversation-this-is-an/outputs/fighter-art-roster-v1/contact-gameplay-pairs.png',Buffer.from(data.split(',')[1],'base64'));expect(errors).toEqual([]);
});
test('footstool and ledge contacts load at native and distant scales',async({page})=>{
 test.setTimeout(60000);await page.goto('/fighter-art-pilot-v1/footstool-pairs.html?scale=1');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.locator('#play').click();
 for(const scale of ['1','0.4'])for(const mode of ['ground','air'])for(const facing of ['1','-1'])for(const a of ['all-rounder','abe-lincoln','swift'])for(const v of ['all-rounder','abe-lincoln','swift']){await page.locator('#zoom').selectOption(scale);await page.locator('#mode').selectOption(mode);await page.locator('#facing').selectOption(facing);await page.locator('#attacker').selectOption(a);await page.locator('#victim').selectOption(v);await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.locator('#tick').fill('12');await expect(page.locator('#status')).toHaveAttribute('data-contact','true');expect(Number(await page.locator('#status').getAttribute('data-gap'))).toBeLessThan(.001);}
 await page.goto('/fighter-art-pilot-v1/ledge-review.html?scale=1');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.locator('#play').click();for(const scale of ['1','0.4'])for(const edge of ['left','right'])for(const clip of ['ledge_catch','ledge_hang','ledge_climb','ledge_roll','ledge_attack','ledge_jump','ledge_drop','ledge_trump']){await page.locator('#zoom').selectOption(scale);await page.locator('#edge').selectOption(edge);await page.locator('#clip').selectOption(clip);await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.locator('#tick').fill('1');await expect(page.locator('#status')).toHaveAttribute('data-clip',clip);}
 await page.locator('#zoom').selectOption('1');await page.locator('#edge').selectOption('left');await page.locator('#clip').selectOption('ledge_hang');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');await page.locator('#tick').fill('36');await page.screenshot({path:'C:/Users/misac/Documents/Codex/2026-11-02/referenced-chatgpt-conversation-this-is-an/outputs/fighter-art-roster-v1/ledge-contact-gameplay.png',fullPage:true});
});


test('production atlas pages preserve contacts and drive replicated airborne hooks',async({page})=>{
 await page.goto('/fighter-art-pilot-v1/index.html?renderer=fullbody');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');
 expect(await page.evaluate(async()=>{const{preloadFullBodyPilot,FullBodyPilot}=await import('/src/renderer/fullbody/FullBodyPilot.ts');const a=await preloadFullBodyPilot();if(!a||a.packing!=='atlas')throw Error('Atlas unavailable');
 for(const id of ['all-rounder','abe-lincoln','swift']as const){const c=a.characters[id]!;if(Object.keys(c).length!==135)throw Error('Live policy gap');const p=new FullBodyPilot(a,id);p.update('AIRBORNE',8,null,true,8,true,false,1,0,false,1,1,undefined,undefined,{isFastFalling:true});if(p.sprite.texture!==c.air_fastfall_loop!.frames[2].texture)throw Error('Fastfall hook');p.update('AIR_DODGE',12,null,true,0,true,false,1,0,false,1,-1,undefined,undefined,{airDodgeDirection:{x:1,y:1}});if(p.sprite.texture!==c.air_dodge_down_back!.frames[3].texture)throw Error('Dodge facing hook');p.update('HITSTUN',0,null,true);if(p.sprite.texture!==c.hit_mid!.frames[0].texture)throw Error('Interruption');p.sprite.destroy();}return true;})).toBe(true);
});
test('missing production manifest falls back to original source sheets',async({page})=>{await page.route('**/fighter-art-pilot-v1/production/manifest.json',r=>r.fulfill({status:404,body:'Unavailable'}));await page.goto('/fighter-art-pilot-v1/index.html?renderer=fullbody');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');expect(await page.evaluate(async()=>{const{preloadFullBodyPilot}=await import('/src/renderer/fullbody/FullBodyPilot.ts');const a=await preloadFullBodyPilot();return a?.packing==='source'&&Object.keys(a.characters['swift']??{}).length===135;})).toBe(true);});


test('jab links and dash attack use canonical active and recovery drawings',async({page})=>{await page.goto('/fighter-art-pilot-v1/index.html?renderer=fullbody');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');expect(await page.evaluate(async()=>{const{preloadFullBodyPilot,FullBodyPilot}=await import('/src/renderer/fullbody/FullBodyPilot.ts');const a=await preloadFullBodyPilot();if(!a)throw Error('No assets');for(const id of ['all-rounder','abe-lincoln','swift']as const){const p=new FullBodyPilot(a,id),c=a.characters[id]!;for(const[move,clip,start,active,total]of [['JAB_2','jab_2',3,2,15],['JAB_3','jab_3',4,3,25],['DASH_ATTACK','dash_attack',8,5,33]]as const){p.update('ATTACK',start-1,move as any,true);if(p.sprite.label!==clip||p.sprite.texture===c[clip]!.frames[3].texture)throw Error('Early contact');p.update('ATTACK',start,move as any,true);if(p.sprite.texture!==c[clip]!.frames[3].texture)throw Error('Contact mismatch');p.update('ATTACK',start+active,move as any,true);if(p.sprite.texture!==c[clip]!.frames[4].texture)throw Error('Recovery mismatch');p.update('ATTACK',total-1,move as any,true);if(p.sprite.texture!==c[clip]!.frames[5].texture)throw Error('Final recovery mismatch');}p.sprite.destroy();}return true;})).toBe(true);});


test('ground recovery renders both orientations, roll directions and floor contacts',async({page})=>{await page.goto('/fighter-art-pilot-v1/index.html?renderer=fullbody');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');expect(await page.evaluate(async()=>{const{FullBodyPilot,preloadFullBodyPilot}=await import('/src/renderer/fullbody/FullBodyPilot.ts');const a=await preloadFullBodyPilot();if(!a)throw Error('Missing atlas');for(const id of ['all-rounder','abe-lincoln','swift']as const){const p=new FullBodyPilot(a,id),c=a.characters[id]!;for(const floorOrientation of ['up','down']as const)for(const facing of [-1,1]as const){const ctx={floorOrientation,floorRollDirection:-1 as const};for(const state of ['GETUP','GETUP_ROLL'])for(const t of [0,4,8,12,16,23]){p.update(state,t,null,true,0,true,false,1,0,false,1,facing,undefined,undefined,ctx);const clip=(state==='GETUP'?'getup_':'getup_roll_')+floorOrientation;if(p.sprite.label!==clip||!p.sprite.visible)throw Error('Recovery gap '+id+'/'+clip);}p.update('ATTACK',6,('FLOOR_ATTACK_'+floorOrientation.toUpperCase())as any,true);if(p.sprite.texture!==c[('floor_attack_'+floorOrientation)as 'floor_attack_up']!.frames[2].texture)throw Error('Floor contact mismatch');}p.sprite.destroy();}return true;})).toBe(true);});



test('shield reactions load for the roster and follow authoritative cue frames',async({page})=>{await page.goto('/fighter-art-pilot-v1/index.html');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');expect(await page.evaluate(async()=>{const{FullBodyPilot,preloadFullBodyPilot}=await import('/src/renderer/fullbody/FullBodyPilot.ts');const a=await preloadFullBodyPilot();if(!a||a.packing!=='atlas')throw Error('Default atlas missing');for(const id of['all-rounder','abe-lincoln','swift']as const){const p=new FullBodyPilot(a,id),c=a.characters[id]!;for(const facing of[-1,1]as const)for(const[state,frame,ctx,clip,index]of[['SHIELD',3,{},'shield_raise',3],['SHIELD',40,{shieldReaction:'hit',shieldReactionFrame:9},'shield_hit',3],['SHIELD',40,{shieldReaction:'parry',shieldReactionFrame:9},'parry',3],['IDLE',0,{shieldReaction:'drop',shieldReactionFrame:9},'shield_drop',3],['HITSTUN',0,{shieldReaction:'break',shieldReactionFrame:0},'shield_break_launch',0],['HITSTUN',40,{shieldReaction:'break',shieldReactionFrame:24,hitstunFramesRemaining:50},'shield_break_dizzy',1],['HITSTUN',80,{shieldReaction:'break',shieldReactionFrame:80,hitstunFramesRemaining:3},'shield_break_recover',5]]as const){p.update(state,frame,null,true,0,true,false,1,0,false,1,facing,undefined,undefined,ctx);if(p.sprite.label!==clip||p.sprite.texture!==c[clip]!.frames[index].texture)throw Error(id+' '+clip+' hook');}p.update('IDLE',20,null,true);if(p.sprite.label!=='idle')throw Error('Cue interruption');p.sprite.destroy();}return true;})).toBe(true);});

test('footstool pairs use authoritative ages and align soles with heads across every roster pairing',async({page})=>{await page.goto('/fighter-art-pilot-v1/index.html');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');expect(await page.evaluate(async()=>{const{FullBodyPilot,preloadFullBodyPilot}=await import('/src/renderer/fullbody/FullBodyPilot.ts');const{footstoolPoint}=await import('/src/renderer/fullbody/footstoolPose.ts');const a=await preloadFullBodyPilot();if(!a)throw Error('Missing atlas');for(const id of['all-rounder','abe-lincoln','swift']as const)for(const victimId of['all-rounder','abe-lincoln','swift']as const)for(const role of['ground','air']as const)for(const facing of[-1,1]as const)for(const vf of[-1,1]as const){const p=new FullBodyPilot(a,id),c=a.characters[id]!,v=a.characters[victimId]!,victimClip=role==='ground'?'footstool_ground_victim':'footstool_air_victim';const context={footstoolRole:'attacker' as const,footstoolFrame:0,footstoolContact:{characterId:victimId,role,frame:0,dx:4,dy:56,facing:vf}};p.update('AIRBORNE',0,null,true,-14,true,false,1,0,false,1,facing,undefined,undefined,context);if(p.sprite.label!=='footstool_attacker')throw Error('Attacker cue');const sole=footstoolPoint(c.footstool_attacker!,0,'footstoolSole',facing)!,head=footstoolPoint(v[victimClip]!,0,'footstoolHead',vf)!;if(Math.abs(p.sprite.position.x*facing+sole[0]-4-head[0])>.001||Math.abs(p.sprite.position.y+sole[1]-c.footstool_attacker!.frames[0].offsetY-56-head[1])>.001)throw Error('Contact gap');p.update('HITSTUN',9,null,true,5,true,role==='air',1,0,false,1,vf,undefined,undefined,{footstoolRole:role,footstoolFrame:9});if(p.sprite.texture!==c[victimClip]!.frames[3].texture)throw Error('Victim cue');p.update('IDLE',0,null,true);if(p.sprite.label!=='idle')throw Error('Interruption');p.sprite.destroy();}return true;})).toBe(true);});
test('helpless entry loop and landing follow simulation states and cancel for hits and ledges',async({page})=>{await page.goto('/fighter-art-pilot-v1/index.html');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');expect(await page.evaluate(async()=>{const{FullBodyPilot,preloadFullBodyPilot}=await import('/src/renderer/fullbody/FullBodyPilot.ts');const a=await preloadFullBodyPilot();if(!a)throw Error('Missing atlas');for(const id of['all-rounder','abe-lincoln','swift']as const)for(const facing of[-1,1]as const){const p=new FullBodyPilot(a,id),c=a.characters[id]!;for(const[state,t,clip,index]of[['HELPLESS',0,'helpless_enter',0],['HELPLESS',23,'helpless_enter',5],['HELPLESS',24,'helpless_loop',0],['HELPLESS',59,'helpless_loop',5],['HELPLESS',60,'helpless_loop',0],['HELPLESS_LAND',0,'helpless_land',0],['HELPLESS_LAND',13,'helpless_land',5]]as const){p.update(state,t,null,true,5,true,false,1,0,false,1,facing);if(p.sprite.texture!==c[clip]!.frames[index].texture)throw Error(id+' '+clip);const texture=p.sprite.texture;p.update(state,t,null,true,5,true,false,1,0,false,1,facing);if(p.sprite.texture!==texture)throw Error('Repeated snapshot advanced');}p.update('HITSTUN',0,null,true);if(p.sprite.label!=='hit_mid')throw Error('Hit interrupt');p.update('LEDGE_HANG',0,null,true,0,true,false,1,0,false,1,facing,undefined,'left');if(p.sprite.label!=='ledge_catch')throw Error('Ledge interrupt');p.sprite.destroy();}return true;})).toBe(true);});
test('movement and presentation clips render for every fighter in both facings',async({page})=>{await page.goto('/fighter-art-pilot-v1/index.html');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');expect(await page.evaluate(async()=>{const{FullBodyPilot,preloadFullBodyPilot}=await import('/src/renderer/fullbody/FullBodyPilot.ts');const a=await preloadFullBodyPilot();if(!a)throw Error('Missing atlas');for(const id of['all-rounder','abe-lincoln','swift']as const)for(const facing of[-1,1]as const){const p=new FullBodyPilot(a,id),c=a.characters[id]!;for(const clip of['turn_stand','turn_run','brake','crouch_exit','land_heavy','platform_drop','takeoff_neutral','takeoff_forward','takeoff_backward']as const){p.update('AIRBORNE',0,null,true,0,true,false,1,0,false,1,facing,undefined,undefined,{artCue:clip,artCueFrame:9});if(p.sprite.texture!==c[clip]!.frames[3].texture)throw Error(clip);}for(const[state,t,clip,index,ctx]of[['CROUCH',17,'crouch_enter',5,{}],['CROUCH',24,'crouch_hold',1,{}],['IDLE',0,'teeter_front',2,{artCue:'teeter_front',artCueFrame:12}],['IDLE',0,'teeter_back',2,{artCue:'teeter_back',artCueFrame:12}],['AIRBORNE',0,'entry',5,{artCue:'entry',artCueFrame:53}],['AIRBORNE',0,'respawn_wait',2,{respawnTimer:24}],['AIRBORNE',0,'respawn_drop',3,{artCue:'respawn_drop',artCueFrame:18}]]as const){p.update(state,t,null,true,0,true,false,1,0,false,1,facing,undefined,undefined,ctx);if(p.sprite.texture!==c[clip]!.frames[index].texture)throw Error(clip);}for(let variant=0;variant<3;variant++){p.update('IDLE',0,null,false,0,true,false,1,0,false,1,facing,undefined,undefined,{result:'win',presentationVariant:variant});if(p.sprite.label!=='victory_'+(variant+1)||!p.sprite.visible)throw Error('Victory');p.update('IDLE',0,null,true);}p.update('IDLE',0,null,false,0,true,false,1,0,false,1,facing,undefined,undefined,{result:'lose'});if(p.sprite.label!=='defeat'||!p.sprite.visible)throw Error('Defeat');p.sprite.destroy();}return true;})).toBe(true);});
test('actual local match shows crouch and animates victory after simulation ends',async({page})=>{await page.goto('/');await page.locator('#splash-screen').click();await page.locator('#local-play-btn').click();await page.locator('#lps-start-btn').click();await page.keyboard.press('Enter');await page.locator('[data-stage-idx="0"]').click();await page.waitForFunction(()=>window.__smashDebug?.getSnapshot()?.matchPhase==='match');await page.waitForTimeout(1600);await page.keyboard.down('ArrowDown');await expect.poll(()=>page.evaluate(()=>window.__smashDebug.getArtState().players.find(p=>p.slot===0)?.clip)).toMatch(/^crouch_/);await page.keyboard.up('ArrowDown');await page.evaluate(()=>{const d=window.__smashDebug,s=d.getSnapshot();for(const p of Object.values(s.players)){if(p.slotIndex===0)continue;p.stocks=1;d.forcePosition(p.id,9999,9999);}});await page.waitForFunction(()=>window.__smashDebug.getSnapshot().matchPhase==='result');await expect.poll(()=>page.evaluate(()=>window.__smashDebug.getArtState().players.find(p=>p.slot===0)?.clip)).toBe('victory_1');const first=await page.evaluate(()=>({tick:window.__smashDebug.getSnapshot().tick,rect:window.__smashDebug.getArtState().players.find(p=>p.slot===0).frameRect}));await page.waitForTimeout(500);const next=await page.evaluate(()=>({tick:window.__smashDebug.getSnapshot().tick,players:window.__smashDebug.getArtState().players}));expect(next.tick).toBe(first.tick);expect(next.players.find(p=>p.slot===0).frameRect).not.toBe(first.rect);expect(next.players.filter(p=>p.slot!==0).every(p=>p.clip==='defeat'&&p.bodyVisible)).toBe(true);await page.screenshot({path:'C:/Users/misac/Documents/Codex/2026-11-02/referenced-chatgpt-conversation-this-is-an/outputs/fighter-art-roster-v1/result-presentation.png'});});
test('taunts grabs hits techs and KO copies render across the complete roster',async({page})=>{await page.goto('/fighter-art-pilot-v1/index.html');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');expect(await page.evaluate(async()=>{const{FullBodyPilot,preloadFullBodyPilot}=await import('/src/renderer/fullbody/FullBodyPilot.ts');const{KOPresentation}=await import('/src/renderer/fullbody/KOPresentation.ts');const source=await(await fetch('/src/renderer/fullbody/KOPresentation.ts')).text(),url=source.match(/from\s*["']([^"']*pixi[^"']*)["']/)![1]!,{Container}=await import(url);const a=await preloadFullBodyPilot();if(!a)throw Error('Missing assets');let event=1;for(const id of['all-rounder','abe-lincoln','swift']as const){const c=a.characters[id]!,p=new FullBodyPilot(a,id);for(const facing of[-1,1]as const){for(const tauntKind of['up','side','down']as const){p.update('TAUNT',63,null,true,0,true,false,1,0,false,1,facing,undefined,undefined,{tauntKind});if(p.sprite.texture!==c['taunt_'+tauntKind]!.frames[5].texture)throw Error('Taunt');}for(const[move,clip,start,total]of[['GRAB_DASH','grab_dash',8,32],['GRAB_PIVOT','grab_pivot',10,35]]as const){p.update('ATTACK',start,move as any,true);if(p.sprite.texture!==c[clip]!.frames[3].texture)throw Error('Grab contact');p.update('ATTACK',total-1,move as any,true);if(p.sprite.texture!==c[clip]!.frames[5].texture)throw Error('Grab recovery');}for(const hitReaction of['high','low','heavy','air']as const){p.update('HITSTUN',8,null,true,0,true,false,1,0,false,1,facing,undefined,undefined,{hitReaction});if(p.sprite.label!=='hit_'+hitReaction)throw Error('Hit');}for(const artCue of['wall_tech','wall_tech_jump','ceiling_tech','tumble_recover']){p.update('AIRBORNE',0,null,true,0,true,false,1,0,false,1,facing,undefined,undefined,{artCue,artCueFrame:12});if(p.sprite.label!==artCue)throw Error('Tech');}}
const parent=new Container(),viewport=parent.addChild(new Container()),ko=new KOPresentation(parent,viewport,a);for(const kind of['launch','screen','star']as const){const cue={id:event++,kind,x:400,y:300,facing:1 as const},players=[{id:'ghost',characterId:id,koVisual:cue}];ko.update(players,1000);if(ko.getDiagnostics()[0]?.clip!=='ko_'+kind)throw Error('KO kind');const first=ko.getDiagnostics()[0]!.frameRect;ko.tick(1140);if(ko.getDiagnostics()[0]!.frameRect===first)throw Error('KO frozen');ko.tick(2600);if(ko.getDiagnostics().length)throw Error('KO linger');ko.update(players,2700);if(ko.getDiagnostics().length)throw Error('KO duplicate');}ko.clear();parent.destroy();p.sprite.destroy();}return true;})).toBe(true);});
test('actual local taunts and KO copies preserve stock loss and respawn',async({page})=>{await page.goto('/');await page.locator('#splash-screen').click();await page.locator('#local-play-btn').click();await page.locator('#lps-start-btn').click();await page.keyboard.press('Enter');await page.locator('[data-stage-idx="0"]').click();await page.waitForFunction(()=>window.__smashDebug?.getSnapshot()?.matchPhase==='match');await page.evaluate(()=>{const d=window.__smashDebug;for(const p of Object.values(d.getSnapshot().players)){if(p.slotIndex===0){p.stocks=3;d.forcePosition(p.id,640,472);}else p.respawnTimer=10000;}});await page.waitForFunction(()=>Object.values(window.__smashDebug.getSnapshot().players).some(p=>p.slotIndex===0&&p.isGrounded&&p.state==='IDLE'));for(const[key,kind]of[['Digit1','up'],['Digit2','side'],['Digit3','down']]){await page.keyboard.press(key);await expect.poll(()=>page.evaluate(()=>window.__smashDebug.getArtState().players.find(p=>p.slot===0)?.clip)).toBe('taunt_'+kind);await page.waitForFunction(()=>Object.values(window.__smashDebug.getSnapshot().players).find(p=>p.slotIndex===0).state!=='TAUNT');}await page.evaluate(()=>{const d=window.__smashDebug,p=Object.values(d.getSnapshot().players).find(p=>p.slotIndex===0);p.isInvincible=false;d.forcePosition(p.id,-400,300);});await page.waitForFunction(()=>window.__smashDebug.getArtState().ko?.some(k=>k.clip==='ko_launch'));const snapshot=await page.evaluate(()=>Object.values(window.__smashDebug.getSnapshot().players).find(p=>p.slotIndex===0));expect(snapshot.stocks).toBe(2);expect(snapshot.respawnTimer).toBeGreaterThan(0);await expect.poll(()=>page.evaluate(()=>window.__smashDebug.getArtState().players.find(p=>p.slot===0)?.clip)).toBe('respawn_wait');await page.screenshot({path:'C:/Users/misac/Documents/Codex/2026-11-02/referenced-chatgpt-conversation-this-is-an/outputs/fighter-art-roster-v1/taunt-ko-runtime.png'});});

test('trip and jab-lock atlas clips cover every fighter, facing and floor orientation',async({page})=>{await page.goto('/fighter-art-pilot-v1/index.html');await expect(page.locator('#status')).toHaveAttribute('data-state','ready');expect(await page.evaluate(async()=>{const{FullBodyPilot,preloadFullBodyPilot}=await import('/src/renderer/fullbody/FullBodyPilot.ts');const a=await preloadFullBodyPilot(),m=await(await fetch('/fighter-art-pilot-v1/production/manifest.json')).json();if(!a)throw Error('Missing pack');for(const id of['all-rounder','abe-lincoln','swift']as const){const p=new FullBodyPilot(a,id),c=a.characters[id]!;if(Object.keys(c).length!==135||c.air_dodge_directional||!m.characters[id].clips.air_dodge_directional.legacy)throw Error('Legacy policy');for(const facing of[-1,1]as const)for(const floorOrientation of['up','down']as const){for(const[state,t,clip,index]of[['TRIP_FALL',23,'trip_fall',5],['TRIP_PRONE',6,'trip_prone',1],['TRIP_GETUP',12,'trip_getup',3],['TRIP_ROLL',12,'trip_roll',3],['JAB_LOCK',15,'jab_lock_'+floorOrientation,3]]as const){p.update(state,t,null,true,0,true,false,1,0,false,1,facing,undefined,undefined,{floorOrientation,floorRollDirection:-1});if(p.sprite.texture!==c[clip]!.frames[index].texture)throw Error(id+' '+clip);const texture=p.sprite.texture;p.update(state,t,null,true,0,true,false,1,0,false,1,facing,undefined,undefined,{floorOrientation,floorRollDirection:-1});if(p.sprite.texture!==texture)throw Error('Snapshot advanced');}p.update('ATTACK',6,'FLOOR_ATTACK_TRIP' as any,true);if(p.sprite.texture!==c.floor_attack_trip!.frames[2].texture)throw Error('Floor attack contact');p.update('HITSTUN',0,null,true);if(p.sprite.label!=='hit_mid')throw Error('Interruption');}p.sprite.destroy();}return true;})).toBe(true);});
test('actual local down tilt trips and jab hits lock a prone victim',async({page})=>{await page.goto('/');await page.locator('#splash-screen').click();await page.locator('#local-play-btn').click();await page.locator('#lps-start-btn').click();await page.keyboard.press('Enter');await page.locator('[data-stage-idx="0"]').click();await page.waitForFunction(()=>window.__smashDebug?.getSnapshot()?.matchPhase==='match');await page.evaluate(()=>{const d=window.__smashDebug,players=Object.values(d.getSnapshot().players);for(const p of players)d.forcePosition(p.id,p.slotIndex===0?600:630,472);for(const p of Object.values(d.getSnapshot().players))Object.assign(p,{state:p.slotIndex===0?'IDLE':'TAUNT',stateFrame:0,isGrounded:true,isInvincible:false,invincibilityFrames:0,respawnTimer:0,percent:0,stocks:3,vx:0,vy:0,hitlagFramesRemaining:0,hitstunFramesRemaining:0});});await page.keyboard.down('ArrowDown');await page.keyboard.down('KeyZ');await page.waitForFunction(()=>Object.values(window.__smashDebug.getSnapshot().players).some(p=>p.slotIndex===1&&p.state==='TRIP_FALL'));await page.keyboard.up('KeyZ');await page.keyboard.up('ArrowDown');await expect.poll(()=>page.evaluate(()=>window.__smashDebug.getArtState().players.find(p=>p.slot===1)?.clip)).toBe('trip_fall');await page.screenshot({path:'C:/Users/misac/Documents/Codex/2026-11-02/referenced-chatgpt-conversation-this-is-an/outputs/fighter-art-roster-v1/trip-runtime.png'});await page.waitForTimeout(50);await page.evaluate(()=>{const d=window.__smashDebug;for(const p of Object.values(d.getSnapshot().players))d.forcePosition(p.id,p.slotIndex===0?600:630,472);for(const p of Object.values(d.getSnapshot().players))Object.assign(p,{state:p.slotIndex===0?'IDLE':'HARD_LANDING',stateFrame:0,isGrounded:true,isInvincible:false,invincibilityFrames:0,respawnTimer:0,percent:0,stocks:3,vx:0,vy:0,hitlagFramesRemaining:0,hitstunFramesRemaining:0,jabLockCount:0,floorOrientation:'down'});});await page.keyboard.down('KeyZ');await page.waitForFunction(()=>Object.values(window.__smashDebug.getSnapshot().players).some(p=>p.slotIndex===1&&p.state==='JAB_LOCK'&&p.jabLockCount===1));await page.keyboard.up('KeyZ');await expect.poll(()=>page.evaluate(()=>window.__smashDebug.getArtState().players.find(p=>p.slot===1)?.clip)).toBe('jab_lock_down');await page.screenshot({path:'C:/Users/misac/Documents/Codex/2026-11-02/referenced-chatgpt-conversation-this-is-an/outputs/fighter-art-roster-v1/jab-lock-runtime.png'});});

test('actual keyboard shield evasions and short-hop attack reach the live sprites',async({page})=>{
 await page.goto('/');await page.locator('#splash-screen').click();await page.locator('#local-play-btn').click();await page.locator('#lps-start-btn').click();await page.keyboard.press('Enter');await page.locator('[data-stage-idx="0"]').click();await page.waitForFunction(()=>window.__smashDebug?.getSnapshot()?.matchPhase==='match');
 const reset=async()=>{await page.keyboard.up('ShiftLeft');await page.keyboard.up('ArrowLeft');await page.keyboard.up('ArrowRight');await page.keyboard.up('ArrowDown');await page.keyboard.up('KeyX');await page.keyboard.up('KeyZ');await page.waitForTimeout(40);await page.evaluate(()=>{const d=window.__smashDebug;for(const p of Object.values(d.getSnapshot().players))d.forcePosition(p.id,p.slotIndex===0?600:1100,472);for(const p of Object.values(d.getSnapshot().players))Object.assign(p,{state:'IDLE',stateFrame:0,isGrounded:true,isInvincible:false,invincibilityFrames:0,respawnTimer:p.slotIndex===0?0:10000,percent:0,stocks:3,vx:0,vy:0,hitlagFramesRemaining:0,hitstunFramesRemaining:0,shieldStunFramesRemaining:0,shieldHealth:100,currentMoveId:null,activeHitbox:null});});};
 for(const[key,state]of [['ArrowLeft','ROLL'],['ArrowRight','ROLL'],['ArrowDown','SPOT_DODGE']]as const){await reset();await page.keyboard.down('ShiftLeft');await page.waitForFunction(()=>Object.values(window.__smashDebug.getSnapshot().players).some(p=>p.slotIndex===0&&p.state==='SHIELD'));await page.keyboard.down(key);await page.waitForFunction(s=>Object.values(window.__smashDebug.getSnapshot().players).some(p=>p.slotIndex===0&&p.state===s),state);await expect.poll(()=>page.evaluate(()=>window.__smashDebug.getArtState().players.find(p=>p.slot===0)?.clip)).toMatch(state==='ROLL'?/roll/:/dodge/);}
 await reset();await page.evaluate(()=>{window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyX',key:'x',bubbles:true}));window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyZ',key:'z',bubbles:true}));});await page.waitForFunction(()=>Object.values(window.__smashDebug.getSnapshot().players).some(p=>p.slotIndex===0&&p.state==='AIR_ATTACK'&&p.currentMoveId==='NEUTRAL_AIR'));await page.screenshot({path:'C:/Users/misac/Documents/Codex/2026-11-02/referenced-chatgpt-conversation-this-is-an/outputs/ultimate-parity-v1/short-hop-runtime.png'});
 await page.evaluate(()=>{for(const code of['KeyX','KeyZ'])window.dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}));});
});

test('actual independent Up input selects a short-hop up aerial and release parry renders in game',async({page})=>{
 await page.goto('/');await page.locator('#splash-screen').click();await page.locator('#local-play-btn').click();await page.locator('#lps-start-btn').click();await page.keyboard.press('Enter');await page.locator('[data-stage-idx="0"]').click();await page.waitForFunction(()=>window.__smashDebug?.getSnapshot()?.matchPhase==='match');
 const prime=async()=>page.evaluate(()=>{const d=window.__smashDebug;for(const p of Object.values(d.getSnapshot().players))d.forcePosition(p.id,p.slotIndex===0?600:1100,472);for(const p of Object.values(d.getSnapshot().players))Object.assign(p,{state:'IDLE',stateFrame:0,isGrounded:true,isInvincible:false,invincibilityFrames:0,respawnTimer:p.slotIndex===0?0:10000,percent:0,stocks:3,vx:0,vy:0,hitlagFramesRemaining:0,hitstunFramesRemaining:0,shieldStunFrames:0,shieldHealth:100,isShielding:false,currentMoveId:null,activeHitbox:null,shieldReleaseFrame:undefined,shieldReleaseEligible:false,shieldParryConsumed:false});});
 await prime();await page.keyboard.down('ArrowUp');await page.waitForTimeout(100);expect(await page.evaluate(()=>Object.values(window.__smashDebug.getSnapshot().players).find(p=>p.slotIndex===0)?.state)).toBe('IDLE');await page.evaluate(()=>{for(const code of['KeyX','KeyZ'])window.dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true}));});await page.waitForFunction(()=>Object.values(window.__smashDebug.getSnapshot().players).some(p=>p.slotIndex===0&&p.currentMoveId==='UP_AIR'&&p.shortHop));await page.keyboard.up('ArrowUp');await page.evaluate(()=>{for(const code of['KeyX','KeyZ'])window.dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}));});
 await prime();await page.keyboard.down('ShiftLeft');await page.waitForFunction(()=>Object.values(window.__smashDebug.getSnapshot().players).some(p=>p.slotIndex===0&&p.state==='SHIELD'&&p.stateFrame>=4));await page.evaluate(()=>{const id=Object.values(window.__smashDebug.getSnapshot().players).find(p=>p.slotIndex===1)!.id;window.__smashDebug.forcePosition(id,630,472);const p=window.__smashDebug.getSnapshot().players[id]!;Object.assign(p,{isGrounded:true,state:'ATTACK',stateFrame:2,currentMoveId:'JAB',facing:-1,respawnTimer:0,hitPlayerIds:new Set(),hitlagFramesRemaining:0});window.dispatchEvent(new KeyboardEvent('keyup',{code:'ShiftLeft',bubbles:true}));});await page.waitForFunction(()=>Object.values(window.__smashDebug.getSnapshot().players).some(p=>p.slotIndex===0&&p.shieldReaction==='parry'&&p.percent===0),null,{timeout:2000}).catch(async error=>{console.log(JSON.stringify(await page.evaluate(()=>window.__smashDebug.getSnapshot())));throw error;});await expect.poll(()=>page.evaluate(()=>window.__smashDebug.getArtState().players.find(p=>p.slot===0)?.clip)).toBe('parry');await page.screenshot({path:'C:/Users/misac/Documents/Codex/2026-11-02/referenced-chatgpt-conversation-this-is-an/outputs/ultimate-parity-v1/release-parry-runtime.png'});await page.keyboard.up('ShiftLeft');
});

test('actual jab misses across empty space and connects only at close range',async({page})=>{
 await page.goto('/');await page.locator('#splash-screen').click();await page.locator('#local-play-btn').click();await page.locator('#lps-start-btn').click();await page.keyboard.press('Enter');await page.locator('[data-stage-idx="0"]').click();await page.waitForFunction(()=>window.__smashDebug?.getSnapshot()?.matchPhase==='match');
 const prime=async(gap:number)=>page.evaluate(gap=>{const d=window.__smashDebug;for(const p of Object.values(d.getSnapshot().players))d.forcePosition(p.id,p.slotIndex===0?600:600+gap,472);for(const p of Object.values(d.getSnapshot().players))Object.assign(p,{state:p.slotIndex===0?'IDLE':'TAUNT',stateFrame:0,isGrounded:true,isInvincible:false,invincibilityFrames:0,respawnTimer:0,percent:0,stocks:3,vx:0,vy:0,facing:p.slotIndex===0?1:-1,hitlagFramesRemaining:0,hitstunFramesRemaining:0,shieldStunFrames:0,isShielding:false,currentMoveId:null,currentMove:undefined,activeHitbox:null,hitPlayerIds:new Set(),shortHop:false,shieldReleaseFrame:undefined,shieldParryConsumed:false});},gap);
 await prime(75);await page.keyboard.down('KeyZ');await page.waitForFunction(()=>Object.values(window.__smashDebug.getSnapshot().players).some(p=>p.slotIndex===0&&p.currentMoveId==='JAB'));await page.keyboard.up('KeyZ');await page.waitForFunction(()=>Object.values(window.__smashDebug.getSnapshot().players).some(p=>p.slotIndex===0&&p.state==='IDLE'));expect(await page.evaluate(()=>Object.values(window.__smashDebug.getSnapshot().players).find(p=>p.slotIndex===1)!.percent)).toBe(0);
 await prime(30);await page.keyboard.down('KeyZ');await page.waitForFunction(()=>Object.values(window.__smashDebug.getSnapshot().players).some(p=>p.slotIndex===1&&p.percent>0));await page.keyboard.up('KeyZ');await page.screenshot({path:'C:/Users/misac/Documents/Codex/2026-11-02/referenced-chatgpt-conversation-this-is-an/outputs/ultimate-parity-v2/close-contact-runtime.png'});
});

test('real contact freezes animation frames and victim SDI does not repeat while held',async({page})=>{
 await page.goto('/');await page.locator('#splash-screen').click();await page.locator('#local-play-btn').click();await page.locator('#lps-start-btn').click();await page.keyboard.press('Enter');await page.locator('[data-stage-idx="0"]').click();await page.waitForFunction(()=>window.__smashDebug?.getSnapshot()?.matchPhase==='match');
 await page.evaluate(()=>{const d=window.__smashDebug;for(const p of Object.values(d.getSnapshot().players))d.forcePosition(p.id,p.slotIndex===0?600:630,472);for(const p of Object.values(d.getSnapshot().players))Object.assign(p,{state:p.slotIndex===0?'IDLE':'ATTACK',stateFrame:p.slotIndex===0?0:2,isGrounded:true,isInvincible:false,invincibilityFrames:0,respawnTimer:0,stocks:3,percent:0,vx:0,vy:0,hitlagFramesRemaining:0,hitstunFramesRemaining:0,currentMoveId:p.slotIndex===0?null:'JAB',currentMove:undefined,activeHitbox:null,hitPlayerIds:new Set(),facing:p.slotIndex===0?1:-1,isShielding:false,shieldReleaseFrame:undefined});});
 await page.waitForFunction(()=>Object.values(window.__smashDebug.getSnapshot().players).some(p=>p.slotIndex===0&&p.state==='HITSTUN'&&p.hitlagFramesRemaining>0));
 // Extend the already-confirmed hitstop for deterministic visual sampling; derived duration is covered by authoritative tests.
 const start=await page.evaluate(()=>{const s=window.__smashDebug.getSnapshot();for(const p of Object.values(s.players))p.hitlagFramesRemaining=30;const p=Object.values(s.players).find(p=>p.slotIndex===0)!;return{x:p.x,frame:p.stateFrame,tick:s.tick};});await page.keyboard.down('ArrowLeft');await page.waitForFunction(t=>window.__smashDebug.getSnapshot().tick>=t+3,start.tick);const sample=await page.evaluate(()=>{const s=window.__smashDebug.getSnapshot(),p=Object.values(s.players).find(p=>p.slotIndex===0)!;return{x:p.x,frame:p.stateFrame,tick:s.tick};});expect(sample.x).toBeCloseTo(start.x-3);expect(sample.frame).toBe(start.frame);await page.waitForFunction(t=>window.__smashDebug.getSnapshot().tick>=t+5,sample.tick);const end=await page.evaluate(()=>Object.values(window.__smashDebug.getSnapshot().players).find(p=>p.slotIndex===0)!);expect(end.x).toBeCloseTo(sample.x);expect(end.stateFrame).toBe(start.frame);await page.screenshot({path:'C:/Users/misac/Documents/Codex/2026-11-02/referenced-chatgpt-conversation-this-is-an/outputs/hitstop-v1/hitstop-runtime.png'});await page.keyboard.up('ArrowLeft');
});

test('actual shield contact freezes and accepts horizontal shield SDI without vertical drift',async({page})=>{
 await page.goto('/');await page.locator('#splash-screen').click();await page.locator('#local-play-btn').click();await page.locator('#lps-start-btn').click();await page.keyboard.press('Enter');await page.locator('[data-stage-idx="0"]').click();await page.waitForFunction(()=>window.__smashDebug?.getSnapshot()?.matchPhase==='match');await page.keyboard.down('ShiftLeft');
 await page.evaluate(()=>{const d=window.__smashDebug;for(const p of Object.values(d.getSnapshot().players)){d.forcePosition(p.id,p.slotIndex===0?600:630,472);Object.assign(p,{state:p.slotIndex===0?'SHIELD':'ATTACK',stateFrame:p.slotIndex===0?10:2,isGrounded:true,isInvincible:false,invincibilityFrames:0,respawnTimer:0,stocks:3,percent:0,vx:0,vy:0,hitlagFramesRemaining:0,hitstunFramesRemaining:0,currentMoveId:p.slotIndex===0?null:'JAB',currentMove:undefined,activeHitbox:null,hitPlayerIds:new Set(),facing:p.slotIndex===0?1:-1,isShielding:p.slotIndex===0,shieldHealth:100,shieldStunFrames:0,shieldReleaseEligible:false,shieldReleaseFrame:undefined,shieldParryConsumed:false});}});
 await page.waitForFunction(()=>Object.values(window.__smashDebug.getSnapshot().players).some(p=>p.slotIndex===0&&p.sdiMode==='shield'&&p.hitlagFramesRemaining>0));
 // Extend confirmed shield contact only for repeatable browser sampling; five-tick jab shield freeze is asserted in server tests.
 const start=await page.evaluate(()=>{const s=window.__smashDebug.getSnapshot();for(const p of Object.values(s.players))p.hitlagFramesRemaining=30;const p=Object.values(s.players).find(p=>p.slotIndex===0)!;return{x:p.x,y:p.y,tick:s.tick};});await page.keyboard.down('ArrowLeft');await page.keyboard.down('ArrowUp');await page.waitForFunction(t=>window.__smashDebug.getSnapshot().tick>=t+3,start.tick);const sample=await page.evaluate(()=>{const s=window.__smashDebug.getSnapshot(),p=Object.values(s.players).find(p=>p.slotIndex===0)!;return{x:p.x,y:p.y,tick:s.tick,percent:p.percent};});expect(sample.x).toBeCloseTo(start.x-1.98);expect(sample.y).toBe(start.y);expect(sample.percent).toBe(0);await page.waitForFunction(t=>window.__smashDebug.getSnapshot().tick>=t+4,sample.tick);const end=await page.evaluate(()=>Object.values(window.__smashDebug.getSnapshot().players).find(p=>p.slotIndex===0)!);expect(end.x).toBeCloseTo(sample.x);expect(end.y).toBe(start.y);await page.screenshot({path:'C:/Users/misac/Documents/Codex/2026-11-02/referenced-chatgpt-conversation-this-is-an/outputs/defensive-hitstop-v1/shield-sdi.png'});await page.keyboard.up('ArrowLeft');await page.keyboard.up('ArrowUp');await page.keyboard.up('ShiftLeft');
});
