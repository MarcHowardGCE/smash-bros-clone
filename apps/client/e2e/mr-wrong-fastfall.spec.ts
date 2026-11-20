import {writeFileSync} from 'node:fs';
import {test,expect} from '@playwright/test';
for(const fighter of ['mr-wrong'] as const){
for(const mode of ['stepped','normal-speed'] as const) {
test(fighter+' six fast-fall poses high-drop '+mode,async({page},testInfo)=>{
 await page.addInitScript(id=>localStorage.setItem('eth:dojo:setup:v1',JSON.stringify({fighter:id,dummy:'all-rounder',dummyMode:'still'})),fighter);
 await page.goto('/');await page.locator('#splash-screen').click();await page.locator('#practice-btn').click();await page.locator('#practice-free').click();
 const sample=()=>page.evaluate(()=>{const d=window.__smashDebug!;const p=Object.values(d.getSnapshot()?.players??{}).find(p=>p.slotIndex===0);const a=d.getArtState?.().players.find(p=>p.slot===0);return{y:p?.y,age:p?.stateFrame,tick:d.getSnapshot()?.tick,clip:a?.clip,rect:a?.frameRect,visible:a?.bodyVisible,facing:a?.bodyFacing,grounded:p?.isGrounded,fast:p?.isFastFalling,offsetX:a&&p?a.bodyX-p.x:null,offsetY:a&&p?a.bodyY-p.y:null};});
 await expect.poll(sample).toMatchObject({grounded:true,clip:'idle'});
 const manifest=await(await page.request.get('/fighter-art-pack-03-v1/production/manifest.json')).json();const expected=manifest.characters[fighter].clips.air_fastfall_loop.frames.map((f:{rect:number[]})=>f.rect.join(','));expect(new Set(expected).size).toBe(6);
 if(mode==='stepped')await page.keyboard.press('F6');const step=()=>page.keyboard.press('F7');
 for(const[key,facing]of [['ArrowLeft',-1],['ArrowRight',1]] as const){
  if(mode==='stepped'){await page.keyboard.press('r');for(let settle=0;settle<30;settle++)await step();await expect.poll(sample).toMatchObject({grounded:true,clip:'idle'});}
  await page.keyboard.down(key);if(mode==='stepped')await step();else await page.waitForTimeout(80);await page.keyboard.up(key);
  if(mode==='stepped'){for(let settle=0;settle<30;settle++)await step();await expect.poll(sample).toMatchObject({grounded:true,clip:'idle'});}
  if(mode==='normal-speed')await expect.poll(sample).toMatchObject({grounded:true,clip:'idle'});
  // Controlled visual fixture, not a naturally reachable jump: start at (640, -100) and zero velocity, inside the top blast boundary.
  expect(await page.evaluate(()=>{const d=window.__smashDebug!;const p=Object.values(d.getSnapshot()?.players??{}).find(p=>p.slotIndex===0);return p&&d.forcePosition(p.id,640,-100);})).toBe(true);
  if(mode==='stepped')for(let settle=0;settle<8;settle++)await step();else await page.waitForTimeout(120);
  let trace:any[]=[];
  if(mode==='stepped'){
   await page.keyboard.down('ArrowDown');await step();await page.keyboard.up('ArrowDown');let last:string|undefined;
   for(let i=0;i<60;i++){const f=await sample();trace.push(f);if(f.clip==='air_fastfall_loop'&&f.rect!==last){last=f.rect;await page.screenshot({path:testInfo.outputPath(`fast-${facing}-${new Set(trace.filter(t=>t.clip==='air_fastfall_loop').map(t=>t.rect)).size}.png`)});}if(f.grounded)break;await step();}
  }else{
   const recording=page.evaluate(()=>new Promise<any[]>(resolve=>{const out:any[]=[];const start=performance.now();const tick=()=>{const d=window.__smashDebug!;const p=Object.values(d.getSnapshot()?.players??{}).find(p=>p.slotIndex===0);const a=d.getArtState?.().players.find(p=>p.slot===0);out.push({elapsed:performance.now()-start,clip:a?.clip,rect:a?.frameRect,visible:a?.bodyVisible,facing:a?.bodyFacing,grounded:p?.isGrounded,fast:p?.isFastFalling,offsetX:a&&p?a.bodyX-p.x:null,offsetY:a&&p?a.bodyY-p.y:null});if(performance.now()-start>1200)resolve(out);else requestAnimationFrame(tick);};requestAnimationFrame(tick);}));
   await page.keyboard.down('ArrowDown');await page.waitForTimeout(80);await page.keyboard.up('ArrowDown');trace=await recording;
  }
  writeFileSync(testInfo.outputPath(`high-drop-${facing}.json`),JSON.stringify(trace,null,2));
  await testInfo.attach(`high-drop-${facing}`,{body:JSON.stringify(trace,null,2),contentType:'application/json'});
  const air=trace.filter(f=>f.clip==='air_fastfall_loop');expect([...new Set(air.map(f=>f.rect))]).toEqual(expected);
  for(const f of air){expect(f).toMatchObject({visible:true,facing,fast:true,grounded:false});expect(Number.isFinite(f.offsetX)).toBe(true);expect(Number.isFinite(f.offsetY)).toBe(true);}
  const first=trace.findIndex(f=>f.clip==='air_fastfall_loop');const landing=trace.slice(first).find(f=>f.grounded);expect(landing?.fast).toBe(false);expect(['land_soft','land_heavy']).toContain(landing?.clip);
  if(mode==='normal-speed')await expect.poll(sample).toMatchObject({grounded:true,clip:'idle'});
 }
});
}

}
