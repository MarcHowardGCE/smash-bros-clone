import {expect,test} from '@playwright/test';

for (const fighter of ['moonshine', 'hulk-hoagie']) {
test(fighter + ' Pack 02 takeoff plays all three poses in both facings', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  await page.addInitScript(id => localStorage.setItem('eth:dojo:setup:v1',
    JSON.stringify({ fighter: id, dummy: 'all-rounder', dummyMode: 'still' })), fighter);
  await page.goto('/');
  await page.locator('#splash-screen').click();
  await page.locator('#practice-btn').click();
  await page.locator('#practice-free').click();
  const sample = () => page.evaluate(() => {
    const debug = window.__smashDebug!;
    const player = Object.values(debug.getSnapshot()?.players ?? {}).find(p => p.slotIndex === 0);
    const art = debug.getArtState?.().players.find(p => p.slot === 0);
    return { state: player?.state, stateFrame: player?.stateFrame, grounded: player?.isGrounded, clip: art?.clip, rect: art?.frameRect,
      cue: player?.artCue, cueAge: player?.artCueFrame, facing: art?.bodyFacing, visible: art?.bodyVisible,
      x: player?.x, y: player?.y, vx: player?.vx, vy: player?.vy,
      offsetX: art && player ? art.bodyX - player.x : null,
      offsetY: art && player ? art.bodyY - player.y : null };
  });
  await expect.poll(sample).toMatchObject({ grounded: true, clip: 'idle' });
  await page.keyboard.press('F6');
  const step = () => page.keyboard.press('F7');
  for (const facing of [-1, 1]) for (const direction of ['neutral', 'forward', 'backward']) {
    await page.keyboard.press('r'); await step();
    const face = facing < 0 ? 'ArrowLeft' : 'ArrowRight';
    await page.keyboard.down(face); await step(); await page.keyboard.up(face);
    for (let tick = 0; tick < 12; tick++) await step();
    const approach = direction === 'backward' ? (facing < 0 ? 'ArrowRight' : 'ArrowLeft') : face;
    if (direction !== 'neutral') {
      await page.keyboard.down(approach);
      for (let tick = 0; tick < 4; tick++) await step();
    }
    await page.keyboard.down('KeyX'); await step();
    const squatTrace = [await sample()];
    await page.screenshot({path:testInfo.outputPath(`${facing}-${direction}-squat-first.png`)});
    // Preserve approach momentum while turning during the grounded squat.
    if (direction === 'backward') await page.keyboard.up(approach);
    const drift = direction === 'neutral' ? null : face;
    if (drift) await page.keyboard.down(drift);
    await step();
    squatTrace.push(await sample());
    await page.screenshot({path:testInfo.outputPath(`${facing}-${direction}-squat-second.png`)});
    const trace: Awaited<ReturnType<typeof sample>>[] = [];
    let previous = '';
    let previousRect = '';
    for (let tick = 0; tick < 100; tick++) {
      if (tick === 14) {
        await page.keyboard.up('KeyX');
        if (drift) await page.keyboard.up(drift);
      }
      const frame = await sample(); trace.push(frame);
      expect(frame).toMatchObject({ facing, visible: true });
      if (frame.clip !== previous || frame.rect !== previousRect) {
        await page.screenshot({ path: testInfo.outputPath(`${facing}-${direction}-${tick}-${frame.clip}.png`) });
        previous = frame.clip!; previousRect = frame.rect!;
      }
      if (tick > 5 && frame.grounded) break;
      await step();
    }
    await page.keyboard.up('KeyX'); if (drift) await page.keyboard.up(drift);
    const takeoff = trace.find(frame => frame.clip === `takeoff_${direction}`)!;
    expect(takeoff.cueAge).toBe(0);
    if (direction === 'backward') expect(takeoff.vx! * facing).toBeLessThan(-0.5);
    if (direction === 'forward') expect(takeoff.vx! * facing).toBeGreaterThan(0.5);
    {
      const m=await(await page.request.get('/fighter-art-newcomers-v1/dojo/manifest.json')).json();
      const clip=m.characters[fighter].clips[`takeoff_${direction}`];expect(clip.durations).toEqual([2,2,2]);
      const expected=clip.frames.map((f:{rect:number[]})=>f.rect.join(','));expect(new Set(expected).size).toBe(3);
      const launch=trace.filter(f=>f.clip===`takeoff_${direction}`);expect(launch.map(f=>f.cueAge)).toEqual([0,1,2,3,4,5]);
      expect(launch.map(f=>f.rect)).toEqual(expected.flatMap((r:string)=>[r,r]));
      const {writeFileSync}=await import('node:fs');writeFileSync(testInfo.outputPath(`${facing}-${direction}-takeoff-trace.json`),JSON.stringify(trace,null,2));
    }
    const clips = trace.map(frame => frame.clip);
    expect(clips).toEqual(expect.arrayContaining([`takeoff_${direction}`, 'air_rise_loop', 'air_apex_loop', 'air_fall_loop']));
    for (const frame of trace.filter(f => ['air_rise_loop', 'air_apex_loop', 'air_fall_loop'].includes(f.clip!))) {
      expect(Number.isFinite(frame.offsetX)).toBe(true); expect(Number.isFinite(frame.offsetY)).toBe(true);
    }
    expect(trace.at(-1)?.grounded).toBe(true);
    console.log('TAKEOFF_BUDGET',JSON.stringify({fighter,facing,direction,squat:squatTrace,early:trace.filter(f=>f.cue?.startsWith('takeoff_')&&f.cueAge!==undefined&&f.cueAge<8).map(f=>({clip:f.clip,cueAge:f.cueAge,rect:f.rect,offsetY:f.offsetY}))}));
    await testInfo.attach(`${facing}-${direction}-squat-trace`,{body:JSON.stringify(squatTrace,null,2),contentType:'application/json'});
    await testInfo.attach(`${facing}-${direction}-trace`, { body: JSON.stringify(trace, null, 2), contentType: 'application/json' });
  }
});
}

for(const fighter of ['moonshine','hulk-hoagie'] as const){
test(fighter+' landing window contact and actionable handoff audit',async({page},testInfo)=>{
 test.setTimeout(120_000);
 await page.addInitScript(id=>localStorage.setItem('eth:dojo:setup:v1',JSON.stringify({fighter:id,dummy:'all-rounder',dummyMode:'still'})),fighter);
 await page.goto('/');await page.locator('#splash-screen').click();await page.locator('#practice-btn').click();await page.locator('#practice-free').click();
 const sample=()=>page.evaluate(()=>{const d=window.__smashDebug!;const p=Object.values(d.getSnapshot()?.players??{}).find(p=>p.slotIndex===0);const a=d.getArtState?.().players.find(p=>p.slot===0);return{state:p?.state,age:p?.stateFrame,cue:p?.artCue,cueAge:p?.artCueFrame,grounded:p?.isGrounded,lag:p?.landingLagFrames,move:p?.currentMoveId,y:p?.y,vy:p?.vy,clip:a?.clip,rect:a?.frameRect,facing:a?.bodyFacing,visible:a?.bodyVisible,offsetY:a&&p?a.bodyY-p.y:null};});
 await expect.poll(sample).toMatchObject({state:'IDLE',grounded:true});await page.keyboard.press('F6');const step=()=>page.keyboard.press('F7');const results=[];
 const m=await(await page.request.get('/fighter-art-newcomers-v1/dojo/manifest.json')).json();
 for(const facing of [-1,1])for(const kind of ['soft','heavy'] as const)for(const action of ['none','Jump','Attack','Shield','Special'] as const){
  await page.keyboard.press('r');for(let i=0;i<30;i++)await step();const key=facing<0?'ArrowLeft':'ArrowRight';await page.keyboard.down(key);await step();await page.keyboard.up(key);for(let i=0;i<30;i++)await step();
  await expect.poll(sample).toMatchObject({state:'IDLE',grounded:true});
  expect(await page.evaluate(y=>{const d=window.__smashDebug!;const p=Object.values(d.getSnapshot()?.players??{}).find(p=>p.slotIndex===0);return p&&d.forcePosition(p.id,640,y);},kind==='soft'?452:300)).toBe(true);
  let contact=await sample();let found=false;
  for(let i=0;i<60;i++){await step();contact=await sample();if(contact.grounded){found=true;break;}}
  expect(found).toBe(true);expect(contact).toMatchObject({clip:'land_'+kind,cue:'land_'+kind,cueAge:0,lag:0,facing,visible:true});expect(contact.offsetY).toBeCloseTo(fighter==='moonshine'?27:30);
  const trace=[contact];
  if(action==='none'){
   let last=contact.rect;await page.screenshot({path:testInfo.outputPath(`land-${kind}-${facing}-1.png`)});
   for(let i=0;i<22;i++){await step();const f=await sample();trace.push(f);expect(f).toMatchObject({grounded:true,facing,visible:true,lag:0});expect(f.offsetY).toBeCloseTo(fighter==='moonshine'?27:30);if(f.clip==='land_'+kind&&f.rect!==last){last=f.rect;await page.screenshot({path:testInfo.outputPath(`land-${kind}-${facing}-${new Set(trace.filter(t=>t.clip==='land_'+kind).map(t=>t.rect)).size}.png`)});}}
   const active=trace.filter(f=>f.clip==='land_'+kind);expect(active.length).toBe(kind==='soft'?12:18);
   expect([...new Set(active.map(f=>f.rect))]).toEqual(m.characters[fighter].clips['land_'+kind].frames.map((f:{rect:number[]})=>f.rect.join(',')));
   expect(trace.at(-1)?.clip).toBe('idle');
  }else{
   const actionKey={Jump:'KeyX',Attack:'KeyZ',Shield:'ShiftLeft',Special:'KeyS'}[action];await page.keyboard.down(actionKey);await step();trace.push(await sample());await page.keyboard.up(actionKey);
   const expected={Jump:'JUMPSQUAT',Attack:'ATTACK',Shield:'SHIELD',Special:'ATTACK'}[action];expect(trace[1]?.state).toBe(expected);expect(trace[1]?.clip).not.toBe('land_'+kind);
  }
  {const {writeFileSync}=await import('node:fs');writeFileSync(testInfo.outputPath(`${kind}-${facing}-${action}.json`),JSON.stringify(trace,null,2));}
  results.push({facing,kind,action,contactState:contact.state,contactLag:contact.lag,visualTicks:action==='none'?trace.filter(f=>f.clip==='land_'+kind).length:undefined,firstInputState:action==='none'?undefined:trace[1]?.state});
  await testInfo.attach(`${kind}-${facing}-${action}`,{body:JSON.stringify(trace,null,2),contentType:'application/json'});
 }
 const {writeFileSync}=await import('node:fs');writeFileSync(testInfo.outputPath('landing-action-results.json'),JSON.stringify(results,null,2));console.log('LANDING_AUDIT '+fighter+' '+JSON.stringify(results));
});
}
