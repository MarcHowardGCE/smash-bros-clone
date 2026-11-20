import { writeFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

for (const fighter of ['zane-corvo','velvet-reply']) {
test(fighter+' three squat poses preserve tapped and held jump timing in both facings',async({page},info)=>{
 test.setTimeout(60000);
 await page.addInitScript(id=>localStorage.setItem('eth:dojo:setup:v1',JSON.stringify({fighter:id,dummy:'all-rounder',dummyMode:'still'})),fighter);
 await page.goto('/');await page.locator('#splash-screen').click();await page.locator('#practice-btn').click();await page.locator('#practice-free').click();
 await page.waitForFunction(()=>{const d=window.__smashDebug;return d&&Object.values(d.getSnapshot()?.players??{}).some(p=>p.slotIndex===0&&p.isGrounded)&&d.getArtState?.().players.some(p=>p.slot===0&&p.bodyVisible);});
 const sample=()=>page.evaluate(()=>{const d=window.__smashDebug!;const p=Object.values(d.getSnapshot()?.players??{}).find(p=>p.slotIndex===0)!;const a=d.getArtState?.().players.find(p=>p.slot===0)!;return {state:p.state,frame:p.stateFrame,grounded:p.isGrounded,x:p.x,y:p.y,vy:p.vy,clip:a.clip,rect:a.frameRect,visible:a.bodyVisible,facing:a.bodyFacing,offsetY:a.bodyY-p.y};});
 await expect.poll(sample).toMatchObject({state:'IDLE',clip:'idle'});await page.keyboard.press('F6');const step=()=>page.keyboard.press('F7');
 const m=await(await page.request.get('/fighter-art-pack-04-v1/production/manifest.json')).json();const clip=m.characters[fighter].clips.jump_squat;expect(clip.durations).toEqual([1,1,1]);const expected=clip.frames.map((f:{rect:number[]})=>f.rect.join(','));expect(new Set(expected).size).toBe(3);
 const results=[];
 for(const facing of [-1,1])for(const held of [false,true]){
  await page.keyboard.press('r');for(let i=0;i<30;i++)await step();const key=facing<0?'ArrowLeft':'ArrowRight';await page.keyboard.down(key);await step();await page.keyboard.up(key);for(let i=0;i<30;i++)await step();
  await page.keyboard.down('KeyX');await step();const trace=[await sample()];if(!held)await page.keyboard.up('KeyX');
  for(let i=0;i<3;i++){
   if(i>0)trace.push(await sample());
   expect(trace[i]).toMatchObject({state:'JUMPSQUAT',frame:i,grounded:true,clip:'jump_squat',visible:true,facing,rect:expected[i]});expect(trace[i]!.offsetY).toBeCloseTo(28);expect(trace[i]!.y).toBe(472);
   await page.screenshot({path:info.outputPath(`${facing}-${held?'held':'tap'}-squat-${i}.png`)});await step();
  }
  const launch=await sample();expect(launch).toMatchObject({state:'AIRBORNE',frame:0,grounded:false,visible:true,facing});expect(launch.vy).toBeCloseTo(held?-15.35:-9.35);await page.keyboard.up('KeyX');
  let minimumY=launch.y,ticks=0;while(!(await sample()).grounded&&ticks<100){await step();minimumY=Math.min(minimumY,(await sample()).y);ticks++;}
  expect((await sample()).grounded).toBe(true);expect(minimumY).toBeCloseTo(held?283:400);expect(ticks).toBe(held?48:29);results.push({facing,held,squat:trace,launch,minimumY,airStepsToLanding:ticks});
 }
 expect(results[0]!.minimumY).toBeGreaterThan(results[1]!.minimumY);expect(results[2]!.minimumY).toBeGreaterThan(results[3]!.minimumY);
 writeFileSync(info.outputPath('squat-jump-results.json'),JSON.stringify(results,null,2));console.log('SQUAT_TIMING',JSON.stringify(results.map(({squat,...r})=>r)));
});


test(fighter+' jump-squat sole roots stay planted for all three drawings',async({page})=>{
 await page.goto('/');
 await page.evaluate(async id=>{
  const path='/src/renderer/fullbody/FullBodyPilot.ts';const {FullBodyPilot,preloadFullBodyPilot}=await import(path);
  const assets=await preloadFullBodyPilot(true,[id],false,true);const pilot=new FullBodyPilot(assets,id,id);
  for(const facing of [-1,1])for(let tick=0;tick<3;tick++){
   pilot.update('JUMPSQUAT',tick,null,true,0,true,false,1,0,false,1,facing,undefined,undefined,{isGrounded:true});
   const sprite=pilot.sprite;const floor=sprite.toGlobal({x:sprite.pivot.x,y:sprite.texture.frame.height});
   if(!sprite.visible||sprite.label!=='jump_squat'||Math.abs(floor.y-28)>.001)throw Error(`Squat sole drift ${facing}:${tick}`);
  }
  pilot.sprite.destroy();pilot.effectSprite.destroy();
 },fighter);
});

}
