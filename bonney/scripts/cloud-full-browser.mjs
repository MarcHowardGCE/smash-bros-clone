import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(new URL('../../package.json',import.meta.url)),{chromium}=require('playwright'),{PNG}=require('pngjs');
const out=new URL('../docs/screenshots/cloud-full-v1/',import.meta.url);await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true}),page=await browser.newPage();const errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('127.0.0.1:4174')&&r.status()>=400)errors.push(r.status()+' '+r.url());});
const place=async(x,y,power='egghead')=>page.evaluate(({x,y,power})=>{const g=window.__bonney.game;Object.assign(g.player,{x,y,power,vx:0,vy:0,grounded:false,ability:'ready',cooldownMs:0,attackMs:0,attackCooldownMs:0,chargingPunch:false,chargePunchMs:0,invulnerableMs:64000});},{x,y,power});
const capture=async name=>{await page.evaluate(()=>window.__bonney.game.player.invulnerableMs=0);await page.waitForTimeout(60);const buffer=Buffer.from(await page.evaluate(()=>document.querySelector('canvas').toDataURL('image/png').split(',')[1]),'base64');await writeFile(new URL(name+'.png',out),buffer);return PNG.sync.read(buffer);};
try{
 await page.goto('http://127.0.0.1:4174/?test=1&mode=full');await page.waitForFunction(()=>window.__bonney?.loaded);if(process.argv.includes('--luffy'))await page.getByLabel('Character',{exact:true}).selectOption('luffy');
 await page.getByRole('button',{name:'Start playing'}).click();
 await page.evaluate(async()=>{const {enterCloud}=await import('/src/cloud-level.mjs');enterCloud(window.__bonney.game);});
 assert.deepEqual(await page.evaluate(()=>[...new Set(window.__bonney.game.pickups.map(p=>p.power))].sort()),['egghead','gear']);
 await page.keyboard.press('KeyP');const screens=[];
 for(const [name,x,y,power]of [['arrival',176,196,'gear'],['habitat-roof',792,124,'egghead'],['nimbus',1280,292,'gear'],['updraft',1416,210,'egghead'],['research-roof',2160,180,'gear'],['console',2536,196,'egghead'],['energy-gate',2700,292,'gear'],['observatory',3520,180,'gear'],['sky-flag',3712,292,'egghead']]){
  await place(x,y,power);await page.evaluate(()=>window.__bonney.game.noticeMs=0);screens.push(await capture(name));
 }
 const sheet=new PNG({width:1536,height:432*5});screens.forEach((im,i)=>PNG.bitblt(im,sheet,0,0,768,432,(i%2)*768,Math.floor(i/2)*432));await writeFile(new URL('review.png',out),PNG.sync.write(sheet));
 await page.keyboard.press('KeyP');
 // Drone aims and fires in a visible local encounter.
 await place(1024,228);await page.waitForTimeout(1300);assert.ok(await page.evaluate(()=>window.__bonney.game.projectiles.length>0||window.__bonney.game.enemies.some(e=>e.type==='lookout'&&e.fired)));
 await page.evaluate(()=>{window.__bonney.game.enemies=[];window.__bonney.game.hazards=[];});
 // Mandatory gate seals the high route before the controls are complete.
 await place(2720,80,'gear');await page.keyboard.down('ArrowRight');await page.waitForTimeout(500);await page.keyboard.up('ArrowRight');assert.ok(await page.evaluate(()=>window.__bonney.game.player.x+16<=2768));
 await place(2336,292,'gear');await page.keyboard.down('KeyZ');await page.waitForTimeout(820);await page.keyboard.up('KeyZ');await page.waitForFunction(()=>window.__bonney.game.latches.reactorSeal);
 await place(2560,196,'egghead');await page.keyboard.press('KeyE');await page.waitForFunction(()=>window.__bonney.game.latches.skyConsole);
 await place(2720,200,'egghead');await page.keyboard.down('ArrowRight');await page.waitForTimeout(650);await page.keyboard.up('ArrowRight');assert.ok(await page.evaluate(()=>window.__bonney.game.player.x>2784));
 // All three distinct rewards remain collectible; reactor reward requires the sealed casing.
 for(const id of ['skyChart','nimbusCrystal','reactorPrism']){
  const t=await page.evaluate(id=>window.__bonney.game.treasures.find(t=>t.id===id),id);await place(t.x,t.y);await page.waitForFunction(id=>window.__bonney.game.treasures.find(t=>t.id===id).collected,id);
 }
 await place(2950,292,'gear');await page.waitForTimeout(60);assert.equal(await page.evaluate(()=>window.__bonney.game.checkpointIndex),3);
 await page.evaluate(()=>{const g=window.__bonney.game;g.player.hits=1;g.player.power='none';g.player.invulnerableMs=0;g.projectiles=[{x:g.player.x,y:g.player.y+10,w:6,h:4,vx:0,life:1}];});
 await page.waitForFunction(()=>window.__bonney.game.status==='dead');await page.getByRole('button',{name:'Continue from checkpoint'}).click();
 assert.equal(await page.evaluate(()=>window.__bonney.game.player.x),2944);assert.equal(await page.evaluate(()=>window.__bonney.game.treasures.filter(t=>t.collected).length),3);
 await place(3750,292);await page.waitForFunction(()=>window.__bonney.game.status==='won');
 assert.equal(await page.getByText('Cloud course cleared!',{exact:true}).isVisible(),true);assert.deepEqual(await page.evaluate(()=>window.__bonney.game.nextLevelEntry),{level:'next-level',entry:'sky-observatory',route:'cloud'});await capture('victory');
 await page.getByRole('button',{name:'Return to harbor'}).click();assert.equal(await page.evaluate(()=>window.__bonney.game.scene),'harbor');assert.ok(await page.evaluate(()=>window.__bonney.game.player.x+16<=window.__bonney.game.gates[0].x));
 assert.deepEqual(errors,[]);console.log('PASS: 9 cloud scenes, drone AI, aerial gate block, Gear reactor and Egghead console, all treasures, checkpoint retry, independent cyan flag and future exit metadata, safe harbor return.');
}finally{await browser.close();}

