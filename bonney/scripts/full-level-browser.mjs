import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(new URL('../../package.json',import.meta.url));
const {chromium}=require('playwright'),{PNG}=require('pngjs');
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1280,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
page.on('response',r=>{if(r.status()>=400&&r.url().startsWith('http://127.0.0.1:4174/'))errors.push(r.status()+' '+r.url());});
const out=new URL('../docs/screenshots/full-level/',import.meta.url);
await mkdir(out,{recursive:true});
const place=async(x,y,power='egghead')=>page.evaluate(({x,y,power})=>{
 const p=window.__bonney.game.player;
 Object.assign(p,{x,y,power,vx:0,vy:0,grounded:false,ability:'ready',activeMs:0,cooldownMs:0,invulnerableMs:10000});
},{x,y,power});
try{
 await page.goto('http://127.0.0.1:4174/?test=1&mode=full');
 await page.waitForFunction(()=>window.__bonney?.loaded);
 assert.equal(await page.locator('#level-select').inputValue(),'full');
 await page.getByRole('button',{name:'Start playing'}).click();
 await page.keyboard.down('ArrowRight');await page.waitForTimeout(250);await page.keyboard.up('ArrowRight');
 assert.ok(await page.evaluate(()=>window.__bonney.game.player.x>50));
 const screens=[];await page.keyboard.press('KeyP');
 for(const [name,x,y]of [['market',210,372],['warehouse',1440,266],['cranes',2660,210],['customs',3940,240],['shipyard',5000,372],['flagship',5520,372]]){
  await place(x,y);await page.evaluate(()=>{window.__bonney.game.player.invulnerableMs=64000;});await page.waitForTimeout(75);
  const buffer=Buffer.from(await page.evaluate(()=>document.querySelector('canvas').toDataURL('image/png').split(',')[1]),'base64');
  screens.push(PNG.sync.read(buffer));await writeFile(new URL(name+'.png',out),buffer);
 }
 const montage=new PNG({width:768*2,height:432*3});
 screens.forEach((p,i)=>PNG.bitblt(p,montage,0,0,768,432,(i%2)*768,Math.floor(i/2)*432));
 await writeFile(new URL('districts.png',out),PNG.sync.write(montage));
 await page.keyboard.press('KeyP');
 // Use keyboard abilities/interaction against the actual scene objects.
 await place(3600,372,'pirateCaptain');await page.keyboard.press('KeyX');
 await page.waitForFunction(()=>window.__bonney.game.latches.customsLock);
 await place(4000,200);await page.keyboard.press('KeyE');
 await page.waitForFunction(()=>window.__bonney.game.latches.customsLever);
 await place(4060,372,'pirateCaptain');await page.keyboard.press('KeyX');
 await page.waitForFunction(()=>window.__bonney.game.player.x>4130);
 // Actual death -> checkpoint retry must preserve progress.
 await page.evaluate(()=>{
  const g=window.__bonney.game,p=g.player;g.treasures[0].collected=true;
  p.hits=1;p.y=520;p.invulnerableMs=0;
 });
 await page.waitForFunction(()=>window.__bonney.game.status==='dead');
 await page.getByRole('button',{name:'Continue from checkpoint'}).click();
 assert.equal(await page.evaluate(()=>window.__bonney.game.player.hits),3);
 assert.equal(await page.evaluate(()=>window.__bonney.game.treasures[0].collected),true);
 assert.equal(await page.evaluate(()=>window.__bonney.game.latches.customsLock),true);
 // Rigging / winch / bell / cabin progression.
 await place(5460,372,'pirateCaptain');await page.keyboard.press('KeyX');
 await page.waitForFunction(()=>window.__bonney.game.latches.winch);
 await place(5888,224);await page.keyboard.press('KeyE');
 await page.waitForFunction(()=>window.__bonney.game.latches.rigging);
 await place(6128,168);await page.keyboard.press('KeyE');
 await page.waitForFunction(()=>window.__bonney.game.latches.bell);
 await place(6048,372,'pirateCaptain');await page.keyboard.press('KeyX');
 await page.waitForFunction(()=>window.__bonney.game.latches.cabinSeal);
 await place(6176,372);await page.waitForFunction(()=>window.__bonney.game.treasures[2].collected);
 await place(6315,372);await page.waitForFunction(()=>window.__bonney.game.status==='won');
 await page.screenshot({path:new URL('victory.png',out).pathname.replace(/^\/([A-Za-z]:)/,'$1'),fullPage:true});
 assert.equal(await page.getByText('Harbor cleared!',{exact:true}).isVisible(),true);
 // Course chooser retains separate tutorial.
 await page.locator('#level-select').selectOption('tutorial');
 assert.equal(await page.evaluate(()=>window.__bonney.game.mode),'tutorial');
 assert.equal(await page.evaluate(()=>window.__bonney.game.width),1920);
 assert.deepEqual(errors,[]);
 console.log('PASS: full-level assets and six district renders, keyboard movement, customs lock+lever, gate passage, checkpoint retry/persistence, winch+rigging, bell+cabin treasure, victory, tutorial chooser.');
}finally{await browser.close();}
