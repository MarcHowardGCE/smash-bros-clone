import {writeFileSync} from 'node:fs';
import {test,expect} from '@playwright/test';
for(const mode of ['stepped','normal-speed'] as const)test('Mrs Tasselbottom soft landing '+mode,async({page},info)=>{
 await page.addInitScript(()=>localStorage.setItem('eth:dojo:setup:v1',JSON.stringify({fighter:'mrs-tasselbottom',dummy:'all-rounder',dummyMode:'still'})));
 await page.goto('/');await page.locator('#splash-screen').click();await page.locator('#practice-btn').click();await page.locator('#practice-free').click();
 const sample=()=>page.evaluate(()=>{const d=window.__smashDebug!,p=Object.values(d.getSnapshot()?.players??{}).find(p=>p.slotIndex===0)!,a=d.getArtState?.().players.find(p=>p.slot===0)!;if(!p||!a)return null;return{clip:a.clip,rect:a.frameRect,facing:a.bodyFacing,visible:a.bodyVisible,grounded:p.isGrounded,y:p.y,offsetX:a.bodyX-p.x,offsetY:a.bodyY-p.y};});
 await expect.poll(sample).toMatchObject({grounded:true,clip:'idle'});const m=await(await page.request.get('/fighter-art-pack-03-v1/production/manifest.json')).json(),expected=m.characters['mrs-tasselbottom'].clips.land_soft.frames.map((f:{rect:number[]})=>f.rect.join(','));expect(new Set(expected).size).toBe(6);
 if(mode==='stepped')await page.keyboard.press('F6');const step=()=>page.keyboard.press('F7');
 for(const[key,facing]of [['ArrowLeft',-1],['ArrowRight',1]]as const){
  await page.keyboard.down(key);if(mode==='stepped')await step();else await page.waitForTimeout(80);await page.keyboard.up(key);if(mode==='stepped')for(let i=0;i<30;i++)await step();else await expect.poll(sample).toMatchObject({grounded:true,clip:'idle'});
  let trace:any[]=[];
  if(mode==='stepped'){await page.keyboard.down('KeyX');await step();await page.keyboard.up('KeyX');let last:string|undefined;for(let i=0;i<80;i++){const f=await sample();trace.push(f);if(f.clip==='land_soft'&&f.rect!==last){last=f.rect;await page.screenshot({path:info.outputPath(`soft-${facing}-${new Set(trace.filter(t=>t.clip==='land_soft').map(t=>t.rect)).size}.png`)});}await step();}}
  else{const recording=page.evaluate(()=>new Promise<any[]>(resolve=>{const out:any[]=[];const start=performance.now();const tick=()=>{const d=window.__smashDebug!,p=Object.values(d.getSnapshot()?.players??{}).find(p=>p.slotIndex===0)!,a=d.getArtState?.().players.find(p=>p.slot===0)!;out.push({elapsed:performance.now()-start,clip:a.clip,rect:a.frameRect,facing:a.bodyFacing,visible:a.bodyVisible,grounded:p.isGrounded,y:p.y,offsetX:a.bodyX-p.x,offsetY:a.bodyY-p.y});if(performance.now()-start>=1400)resolve(out);else requestAnimationFrame(tick);};requestAnimationFrame(tick);}));await page.keyboard.down('KeyX');await page.waitForTimeout(30);await page.keyboard.up('KeyX');trace=await recording;}
  writeFileSync(info.outputPath(`soft-${facing}.json`),JSON.stringify(trace,null,2));const land=trace.filter(f=>f.clip==='land_soft');expect([...new Set(land.map(f=>f.rect))]).toEqual(expected);if(mode==='stepped'){expect(land).toHaveLength(12);expect(land.map(f=>f.rect)).toEqual(expected.flatMap((r:string)=>[r,r]));}for(const f of land){expect(f).toMatchObject({grounded:true,visible:true,facing,y:466,offsetX:0,offsetY:34});}expect(trace.at(-1)).toMatchObject({clip:'idle',grounded:true,visible:true,facing});
 }
});


test('Mrs Tasselbottom soft landing yields to fresh Attack before the visual cue ends',async({page},info)=>{
 await page.addInitScript(()=>localStorage.setItem('eth:dojo:setup:v1',JSON.stringify({fighter:'mrs-tasselbottom',dummy:'all-rounder',dummyMode:'still'})));
 await page.goto('/');await page.locator('#splash-screen').click();await page.locator('#practice-btn').click();await page.locator('#practice-free').click();
 const sample=()=>page.evaluate(()=>{const d=window.__smashDebug!,p=Object.values(d.getSnapshot()?.players??{}).find(p=>p.slotIndex===0),a=d.getArtState?.().players.find(p=>p.slot===0);return{state:p?.state,cueAge:p?.artCueFrame,grounded:p?.isGrounded,clip:a?.clip,facing:a?.bodyFacing,visible:a?.bodyVisible};});
 await expect.poll(sample).toMatchObject({grounded:true,clip:'idle'});await page.keyboard.press('F6');const step=()=>page.keyboard.press('F7');const results=[];
 for(const[key,facing]of [['ArrowLeft',-1],['ArrowRight',1]]as const){await page.keyboard.press('r');for(let i=0;i<30;i++)await step();await page.keyboard.down(key);await step();await page.keyboard.up(key);for(let i=0;i<30;i++)await step();await page.keyboard.down('KeyX');await step();await page.keyboard.up('KeyX');let before=await sample();for(let i=0;i<80&&!(before.clip==='land_soft'&&before.cueAge===1);i++){await step();before=await sample();}expect(before).toMatchObject({state:'IDLE',grounded:true,clip:'land_soft',cueAge:1});await page.keyboard.down('KeyZ');await step();await page.keyboard.up('KeyZ');const after=await sample();expect(after).toMatchObject({state:'ATTACK',visible:true,facing});expect(after.clip).not.toBe('land_soft');results.push({facing,before,after});}
 writeFileSync(info.outputPath('landing-attack-interruption.json'),JSON.stringify(results,null,2));
});
