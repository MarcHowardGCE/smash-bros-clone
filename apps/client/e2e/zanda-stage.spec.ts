import {expect,test} from '@playwright/test';
for(const [index,variant]of ['studio','archive','broadcast'].entries()){
 test('Zanda '+variant+' keeps its selected preview in the local match',async({page})=>{
  await page.goto('/');await page.locator('#splash-screen').click();
  await page.locator('#local-play-btn').click();await page.locator('#lps-start-btn').click();
  await page.evaluate(i=>{const original=Math.random;Math.random=()=>[.01,.4,.9][i]!;setTimeout(()=>Math.random=original,5000);},index);
  await page.locator('[data-ready-slot="0"]').click();const tile=page.getByRole('button',{name:'Zanda Infinity',exact:true});
  await tile.focus();await expect(page.locator('#stage-preview img')).toHaveAttribute('src',new RegExp('stage10-'+variant+'\\.webp'));
  await tile.click();await page.waitForFunction(()=>window.__smashDebug?.getSnapshot()?.matchPhase==='match');
  await expect(page.locator('#background-layer .scene-art')).toHaveCSS('background-image',new RegExp('stage10-'+variant+'\\.webp'));
  expect(await page.evaluate(()=>window.__smashDebug!.getSnapshot().stageId)).toBe('stage10');
 });
}
test('Zanda guest preview and reconnect retain the host background',async({browser,baseURL})=>{
 test.setTimeout(90000);const host=await browser.newContext(),guest=await browser.newContext();
 try{const h=await host.newPage(),g=await guest.newPage();
  await h.goto(baseURL!);await h.locator('#splash-screen').click();await h.locator('#online-play-btn').click();await h.locator('#create-btn').click();await h.waitForURL(/room=/);
  await g.goto(h.url());await g.locator('#splash-screen').click();await h.waitForFunction(()=>document.querySelectorAll('#player-list > div').length===2);
  await h.locator('#ready-btn').click();await g.locator('#ready-btn').click();
  for(const p of[h,g]){await p.locator('.network-fighter-option[data-id="all-rounder"]').click();await p.locator('#network-charselect-confirm-btn').click();}
  const tile=h.getByRole('button',{name:'Zanda Infinity',exact:true});await tile.focus();
  const src=await h.locator('#stage-preview img').getAttribute('src');
  await expect(g.locator('#guest-world-preview img')).toHaveAttribute('src',src!);
  const pattern=new RegExp(src!.split('/').at(-1)!.replace('.','\\.'));
  await tile.click();for(const p of[h,g]){await p.waitForFunction(()=>window.__smashDebug?.getSnapshot()?.matchPhase==='match');await expect(p.locator('#background-layer .scene-art')).toHaveCSS('background-image',pattern);}
  await g.reload();await g.waitForFunction(()=>window.__smashDebug?.getSnapshot()?.matchPhase==='match');
  await expect(g.locator('#background-layer .scene-art')).toHaveCSS('background-image',pattern);
 }finally{await host.close();await guest.close();}
});
