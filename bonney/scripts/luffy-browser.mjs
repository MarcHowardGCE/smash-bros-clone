import {createRequire} from 'node:module';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(new URL('../../package.json',import.meta.url)),{chromium}=require('playwright'),{PNG}=require('pngjs');
const out=new URL('../docs/screenshots/luffy-v1/',import.meta.url);await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true}),page=await browser.newPage();const errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('127.0.0.1:4174')&&r.status()>=400)errors.push(r.status()+' '+r.url());});
const capture=async name=>{await page.waitForTimeout(65);await writeFile(new URL(name+'.png',out),Buffer.from(await page.evaluate(()=>document.querySelector('canvas').toDataURL('image/png').split(',')[1]),'base64'));};
try{
 await page.goto('http://127.0.0.1:4174/?test=1&mode=full');await page.waitForFunction(()=>window.__bonney?.loaded);
 await page.getByRole('button',{name:'Start playing'}).click();await page.keyboard.press('KeyP');
 await page.evaluate(()=>{const g=window.__bonney.game;Object.assign(g.player,{x:220,y:372,hits:2,power:'egghead',grounded:true,ability:'cooldown',cooldownMs:3400,invulnerableMs:0});g.latches.customsLock=true;g.coins=17;});
 const before=await page.evaluate(()=>JSON.stringify(window.__bonney.game));
 const bonney=await page.evaluate(()=>document.querySelector('canvas').toDataURL());
 await page.getByLabel('Character',{exact:true}).selectOption('luffy');await page.waitForTimeout(70);
 assert.equal(await page.evaluate(()=>JSON.stringify(window.__bonney.game)),before,'switching must not mutate any gameplay state');
 assert.notEqual(await page.evaluate(()=>document.querySelector('canvas').toDataURL()),bonney,'sprite pixels change');
 assert.equal(await page.evaluate(()=>window.__bonney.selectedCharacter),'luffy');assert.equal(await page.locator('#character-name').textContent(),'Luffy');
 for(const [power,outfit]of [['none','default'],['pirateCaptain','captain'],['egghead','egghead'],['gear','gear']])for(const hits of [3,2,1]){
  for(const facing of [-1,1]){
   await page.evaluate(({power,hits,facing})=>Object.assign(window.__bonney.game.player,{power,hits,facing,grounded:true,vx:0,attackMs:0,invulnerableMs:0}),{power,hits,facing});
   assert.equal(await page.evaluate(()=>window.__bonney.spriteKey),'luffy_'+outfit+'Atlas');
   await page.evaluate(()=>window.__bonney.game.player.vx=105);assert.equal(await page.evaluate(()=>window.__bonney.spriteKey),'luffy_'+outfit+'Walk');
   await page.evaluate(()=>Object.assign(window.__bonney.game.player,{vx:0,attackMs:100,attackKind:'kick'}));assert.equal(await page.evaluate(()=>window.__bonney.spriteKey),'luffy_'+outfit+'Attack');
  }
  await page.evaluate(()=>Object.assign(window.__bonney.game.player,{facing:1,attackMs:0,vx:0,grounded:true}));
  await capture(outfit+'-'+hits);
 }
 const manifest=JSON.parse(await readFile(new URL('../assets/luffy-v1/manifest.json',import.meta.url),'utf8'));
 assert.equal(Object.values(manifest.outfits).flat().length,120);
 for(const outfit of Object.keys(manifest.outfits))for(const [age,target]of [['adult',60],['teenage',50],['baby',36]]){
  const frames=manifest.outfits[outfit].filter(f=>f.age===age&&(f.pose==='idle'||f.pose.startsWith('walk'))),hashes=[];
  for(const f of frames){
   const buffer=await readFile(new URL('../assets/luffy-v1/'+f.file,import.meta.url)),png=PNG.sync.read(buffer);let top=64,bottom=-1;
   for(let y=0;y<64;y++)for(let x=0;x<png.width;x++)if(png.data[(y*png.width+x)*4+3]>=20){top=Math.min(top,y);bottom=Math.max(bottom,y);}
   assert.ok(bottom-top+1>=target-2&&bottom-top+1<=target,age+' '+outfit+' height '+f.pose);assert.ok(bottom>=61&&bottom<=62,'foot baseline');
   if(f.pose.startsWith('walk'))hashes.push(buffer.toString('base64'));
  }assert.equal(new Set(hashes).size,6,'six distinct strides '+outfit+' '+age);
 }
 // Cloud transitions and checkpoint recovery keep the visual roster selection.
 await page.evaluate(async()=>{const {enterCloud}=await import('/src/cloud-level.mjs');enterCloud(window.__bonney.game);Object.assign(window.__bonney.game.player,{x:176,y:196,power:'gear',hits:3,invulnerableMs:0});});
 await capture('luffy-gear-cloud');assert.equal(await page.evaluate(()=>window.__bonney.spriteKey),'luffy_gearAtlas');
 await page.evaluate(async()=>{const {respawn}=await import('/src/engine.mjs');respawn(window.__bonney.game);});assert.equal(await page.evaluate(()=>window.__bonney.selectedCharacter),'luffy');
 await page.evaluate(async()=>{const {returnHarbor}=await import('/src/cloud-level.mjs');returnHarbor(window.__bonney.game);});assert.equal(await page.evaluate(()=>window.__bonney.selectedCharacter),'luffy');
 await page.getByLabel('Character',{exact:true}).selectOption('bonney');assert.equal(await page.evaluate(()=>window.__bonney.selectedCharacter),'bonney');
 await page.getByLabel('Character',{exact:true}).selectOption('luffy');
 await page.locator('#level-select').selectOption('tutorial');assert.equal(await page.evaluate(()=>window.__bonney.selectedCharacter),'luffy');
 // Check normal punch input with Luffy visible in a real running tutorial.
 await page.evaluate(()=>{const g=window.__bonney.game;g.pickups=[];Object.assign(g.player,{x:100,y:148,power:'none',facing:1,grounded:true,attackMs:0,attackCooldownMs:0});g.enemies=[{x:126,y:148,w:16,h:28,hp:3,dir:-1,min:126,max:126}];});
 await page.keyboard.press('KeyZ');await page.waitForTimeout(110);assert.equal(await page.evaluate(()=>window.__bonney.game.enemies[0].hp),2);
 await page.reload();await page.waitForFunction(()=>window.__bonney?.loaded);assert.equal(await page.getByLabel('Character',{exact:true}).inputValue(),'luffy','preference survives reload');
 assert.deepEqual(errors,[]);console.log('PASS: visual-only roster swap with unchanged game state, all4 outfits/all3 ages/both facings, 120 frames, stable idle/walk heights, six strides, cloud/respawn/course/reload persistence, real punch control.');
}finally{await browser.close();}
