import {writeFileSync} from 'node:fs';
import {test,expect} from '@playwright/test';
for(const fighter of ['mr-wrong'] as const){
for (const mode of ['stepped', 'normal-speed'] as const) {
test(fighter + ' double-jump to six-pose rise ' + mode + ' in both facings', async ({ page }, testInfo) => {
  await page.addInitScript(id => localStorage.setItem('eth:dojo:setup:v1', JSON.stringify({
    fighter: id, dummy: 'all-rounder', dummyMode: 'still',
  })), fighter);
  await page.goto('/'); await page.locator('#splash-screen').click();
  await page.locator('#practice-btn').click(); await page.locator('#practice-free').click();
  const sample = () => page.evaluate(() => {
    const d = window.__smashDebug!;
    const p = Object.values(d.getSnapshot()?.players ?? {}).find(p => p.slotIndex === 0);
    const a = d.getArtState?.().players.find(p => p.slot === 0);
    return { clip: a?.clip, rect: a?.frameRect, facing: a?.bodyFacing, visible: a?.bodyVisible,
      grounded: p?.isGrounded, offsetX: a && p ? a.bodyX-p.x : null, offsetY: a && p ? a.bodyY-p.y : null };
  });
  await expect.poll(sample).toMatchObject({ grounded: true, clip: 'idle' });
  const manifest = await (await page.request.get('/fighter-art-pack-03-v1/production/manifest.json')).json();
  const expected = manifest.characters[fighter].clips.double_jump_transition.frames.map((f: {rect:number[]}) => f.rect.join(','));
  expect(new Set(expected).size).toBe(6);
  if (mode === 'stepped') await page.keyboard.press('F6');
  const step = () => page.keyboard.press('F7');
  for (const [key, facing] of [['ArrowLeft', -1], ['ArrowRight', 1]] as const) {
    if (mode === 'stepped') { await page.keyboard.press('r'); await step(); }
    await page.keyboard.down(key);
    if (mode === 'stepped') await step(); else await page.waitForTimeout(80);
    await page.keyboard.up(key);
    if (mode === 'normal-speed') await expect.poll(sample).toMatchObject({ grounded: true, clip: 'idle' });
    await page.keyboard.down('KeyX');
    if (mode === 'stepped') for (let i=0;i<12;i++) await step(); else await page.waitForTimeout(180);
    await page.keyboard.up('KeyX');
    if (mode === 'stepped') await step(); else await page.waitForTimeout(50);
    let trace: Awaited<ReturnType<typeof sample>>[] = [];
    if (mode === 'stepped') {
      await page.keyboard.down('KeyX'); await step(); await page.keyboard.up('KeyX');
      let last: string | undefined;
      for (let i=0;i<100;i++) {
        const f=await sample(); trace.push(f);
        if (f.clip === 'double_jump_transition' && f.rect !== last) {
          last=f.rect; await page.screenshot({ path:testInfo.outputPath(`double-${facing}-${new Set(trace.filter(t=>t.clip==='double_jump_transition').map(t=>t.rect)).size}.png`) });
        }
        await step();
      }
    } else {
      const recording=page.evaluate(() => new Promise<any[]>(resolve => {
        const frames:any[]=[]; const start=performance.now();
        const tick=()=>{const d=window.__smashDebug!; const p=Object.values(d.getSnapshot()?.players??{}).find(p=>p.slotIndex===0); const a=d.getArtState?.().players.find(p=>p.slot===0);
          frames.push({elapsed:performance.now()-start,clip:a?.clip,rect:a?.frameRect,facing:a?.bodyFacing,visible:a?.bodyVisible,grounded:p?.isGrounded,offsetX:a&&p?a.bodyX-p.x:null,offsetY:a&&p?a.bodyY-p.y:null});
          if(performance.now()-start>1600)resolve(frames);else requestAnimationFrame(tick);}; requestAnimationFrame(tick);
      }));
      await page.keyboard.down('KeyX'); await page.waitForTimeout(80); await page.keyboard.up('KeyX');
      trace=await recording;
    }
    writeFileSync(testInfo.outputPath(`double-${facing}.json`),JSON.stringify(trace,null,2));
    await testInfo.attach(`double-preassert-${facing}`,{body:JSON.stringify(trace,null,2),contentType:'application/json'});
    const observed=[...new Set(trace.filter(f=>f.clip==='double_jump_transition').map(f=>f.rect))];
    expect(observed).toEqual(expected);
    const end=trace.findIndex(f=>f.clip==='double_jump_transition');
    expect(trace.slice(end).some(f=>f.clip==='air_rise_loop')).toBe(true);
    const firstRise=trace.slice(end).find(f=>f.clip==='air_rise_loop');
    expect(firstRise?.rect).toBe(manifest.characters[fighter].clips.air_rise_loop.frames[0].rect.join(','));
    for(const f of trace.filter(f=>['double_jump_transition','air_rise_loop','air_apex_loop','air_fall_loop'].includes(f.clip!))) {
      expect(f).toMatchObject({facing,visible:true}); expect(Number.isFinite(f.offsetX)).toBe(true); expect(Number.isFinite(f.offsetY)).toBe(true);
    }
    await testInfo.attach(`double-${facing}`,{body:JSON.stringify(trace,null,2),contentType:'application/json'});
    if(mode==='normal-speed') await expect.poll(sample).toMatchObject({grounded:true,clip:'idle'});
  }
});
}

}
