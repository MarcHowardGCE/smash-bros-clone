import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(new URL('../../package.json',import.meta.url)),{chromium}=require('playwright');
const out=new URL('../docs/screenshots/cloud-refinement-v2/',import.meta.url);await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true}),page=await browser.newPage();const errors=[];
page.on('pageerror',e=>errors.push(e.message));
const capture=async name=>{await page.evaluate(()=>window.__bonney.game.player.invulnerableMs=0);await page.waitForTimeout(20);await writeFile(new URL(name+'.png',out),Buffer.from(await page.evaluate(()=>document.querySelector('canvas').toDataURL('image/png').split(',')[1]),'base64'));};
try{
 await page.goto('http://127.0.0.1:4174/?test=1&mode=full');await page.waitForFunction(()=>window.__bonney?.loaded);await page.getByRole('button',{name:'Start playing'}).click();
 for(const hero of ['bonney','luffy']){
  await page.evaluate(()=>{window.__bonney.restart();const g=window.__bonney.game;g.enemies=[];g.hazards=[];g.pickups=[];g.crates=[];g.movers=[];g.gates=[];g.platforms=[{x:0,y:400,w:6400,h:80}];Object.assign(g.player,{x:200,y:372,power:'gear',hits:3});});
  await page.getByLabel('Character',{exact:true}).selectOption(hero);
  for(let hit=0;hit<4;hit++){
   await page.evaluate(()=>{const g=window.__bonney.game;Object.assign(g.player,{x:200,y:372,vy:0,grounded:true,invulnerableMs:0});g.projectiles=[{x:200,y:382,w:6,h:4,vx:0,life:1}];});
   const expected=hit===0?3:3-hit;
   await page.waitForFunction(h=>window.__bonney.game.player.power==='none'&&window.__bonney.game.player.hits===h,expected);
   if(hit===0){assert.ok(await page.evaluate(()=>window.__bonney.game.player.pickupLockMs>0));await capture(hero+'-power-lost-adult');}
   assert.equal(await page.evaluate(()=>window.__bonney.game.status),hit===3?'dead':'playing');
  }
  assert.equal(await page.getByRole('button',{name:'Continue from checkpoint'}).isVisible(),true);
 }
 await page.evaluate(async()=>{window.__bonney.restart();const {enterCloud}=await import('/src/cloud-level.mjs');enterCloud(window.__bonney.game);Object.assign(window.__bonney.game.player,{x:128,y:196,invulnerableMs:0});});
 assert.equal(await page.evaluate(()=>window.__bonney.game.pickups.length),6);await page.keyboard.press('KeyP');await capture('gear-fruit-cloud');
 assert.equal((await page.request.get('http://127.0.0.1:4174/assets/powerups-v1/gear-fruit.png')).status(),200);
 assert.deepEqual(errors,[]);console.log('PASS: both heroes take exactly four projectile hits when powered adult; first hit removes power and preserves age, recollection lockout, normal death/retry UI, six cloud pickups and real Gear fruit artwork.');
}finally{await browser.close();}
