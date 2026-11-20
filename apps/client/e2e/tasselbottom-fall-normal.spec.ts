import { writeFileSync } from 'node:fs';
import { expect,test } from '@playwright/test';

for(const fighter of ['mrs-tasselbottom'])test(fighter+' fall through landing at normal speed in both facings',async({page},info)=>{
 test.setTimeout(180000);
 await page.addInitScript(id=>localStorage.setItem('eth:dojo:setup:v1',JSON.stringify({fighter:id,dummy:'all-rounder',dummyMode:'still'})),fighter);
 await page.goto('/');await page.locator('#splash-screen').click();await page.locator('#practice-btn').click();await page.locator('#practice-free').click();
 await page.waitForFunction(()=>{const d=window.__smashDebug;return d&&Object.values(d.getSnapshot()?.players??{}).some(p=>p.slotIndex===0&&p.isGrounded)&&d.getArtState?.().players.some(p=>p.slot===0&&p.clip==='idle');});
 await page.keyboard.press('F6');const step=()=>page.keyboard.press('F7');
 const m=await(await page.request.get('/fighter-art-pack-03-v1/production/manifest.json')).json();
 const cases=[];
 for(const facing of [-1,1])for(const direction of ['neutral','forward','backward'])for(const held of [false,true]){
  await page.keyboard.press('r');for(let n=0;n<30;n++)await step();const face=facing<0?'ArrowLeft':'ArrowRight';await page.keyboard.down(face);await step();await page.keyboard.up(face);for(let n=0;n<30;n++)await step();
  const approach=direction==='backward'?(facing<0?'ArrowRight':'ArrowLeft'):face;
  if(direction!=='neutral'){await page.keyboard.down(approach);for(let n=0;n<4;n++)await step();}
  const recording=page.evaluate(()=>new Promise<any[]>(resolve=>{const out:any[]=[];const start=performance.now();const tick=()=>{const d=window.__smashDebug!;const p=Object.values(d.getSnapshot()?.players??{}).find(p=>p.slotIndex===0)!;const a=d.getArtState?.().players.find(a=>a.slot===0)!;out.push({elapsed:performance.now()-start,state:p.state,stateFrame:p.stateFrame,grounded:p.isGrounded,x:p.x,y:p.y,vx:p.vx,vy:p.vy,clip:a.clip,rect:a.frameRect,visible:a.bodyVisible,facing:a.bodyFacing,cue:p.artCue,cueAge:p.artCueFrame,offsetX:a.bodyX-p.x,offsetY:a.bodyY-p.y});if(performance.now()-start>=1400)resolve(out);else requestAnimationFrame(tick);};requestAnimationFrame(tick);}));
  if(direction==='backward'){
   // Prepare the precise opposite-momentum facing reversal, then run takeoff through landing at 1x.
   await page.keyboard.down('KeyX');await step();await page.keyboard.up(approach);await page.keyboard.down(face);await step();if(!held)await page.keyboard.up('KeyX');await page.keyboard.press('F6');
  }else{
   // Neutral/forward jumps start from idle/movement and include the entire squat at 1x.
   await page.keyboard.press('F6');await page.waitForTimeout(80);await page.keyboard.down('KeyX');if(!held){await page.waitForTimeout(30);await page.keyboard.up('KeyX');}
  }
  await page.waitForTimeout(180);await page.keyboard.up('KeyX');if(direction!=='neutral')await page.keyboard.up(face);
  const trace=await recording;await page.keyboard.press('F6');
  const label=`${facing}-${direction}-${held?'full':'short'}`;writeFileSync(info.outputPath(label+'.json'),JSON.stringify(trace,null,2));
  const air=trace.filter(f=>!f.grounded);expect(air.length).toBeGreaterThan(5);for(const f of air){expect(f.visible).toBe(true);expect(f.facing).toBe(facing);expect(Number.isFinite(f.offsetY)).toBe(true);}
  const launch=air.filter(f=>f.clip==='takeoff_'+direction);expect(launch.length).toBeGreaterThan(0);
  const expected=m.characters[fighter].clips['takeoff_'+direction].frames.map((f:{rect:number[]})=>f.rect.join(','));const observed=[...new Set(launch.map(f=>f.rect))];expect(observed).toEqual(expected);
  if(held){const expected=m.characters[fighter].clips.air_rise_loop.frames.map((f:{rect:number[]})=>f.rect.join(','));const observed=trace.filter(f=>f.clip==='air_rise_loop').map(f=>expected.indexOf(f.rect));expect(observed.length).toBeGreaterThan(3);expect(observed.every(i=>i>=0)).toBe(true);expect(observed).toEqual([...observed].sort((a,b)=>a-b));expect(observed.at(-1)).toBe(5);}
  const expectedApex=m.characters[fighter].clips.air_apex_loop.frames.map((f:{rect:number[]})=>f.rect.join(','));expect([...new Set(trace.filter(f=>f.clip==='air_apex_loop').map(f=>f.rect))]).toEqual(expectedApex);if(held){const expectedFall=m.characters[fighter].clips.air_fall_loop.frames.map((f:{rect:number[]})=>f.rect.join(','));const o=trace.filter(f=>f.clip==='air_fall_loop').map(f=>expectedFall.indexOf(f.rect));expect(o.length).toBeGreaterThan(2);expect(o.every(i=>i>=0)).toBe(true);expect(o).toEqual([...o].sort((a,b)=>a-b));expect(o.at(-1)).toBe(5);} /* Short-hop fall lasts one tick; exact coverage is checked in the stepped budget. */expect(trace.some(f=>f.clip==='land_heavy'||f.clip==='land_soft')).toBe(true);expect(trace.at(-1)).toMatchObject({grounded:true,clip:'idle',visible:true});
  if(direction==='backward')expect(launch[0].vx*facing).toBeLessThan(0);
  cases.push({label,frames:trace.length,minimumY:Math.min(...air.map(f=>f.y)),observedTakeoff:observed,clips:[...new Set(trace.map(f=>f.clip))],maxRafGap:Math.max(...trace.slice(1).map((f,i)=>f.elapsed-trace[i].elapsed))});
 }
 writeFileSync(info.outputPath('normal-speed-summary.json'),JSON.stringify(cases,null,2));console.log('NORMAL_JUMPS',fighter,JSON.stringify(cases.map(({observedTakeoff,...v})=>v)));
});
