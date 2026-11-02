import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const require=createRequire(new URL('../../package.json',import.meta.url));
const {chromium}=require('playwright');
const base=process.env.BONNEY_URL||'http://127.0.0.1:4174';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1280,height:960}});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('response',r=>{if(r.status()>=400&&new URL(r.url()).origin===base)errors.push(r.status()+' '+r.url());});
const root=fileURLToPath(new URL('../',import.meta.url));
await mkdir(new URL('../docs/screenshots/',import.meta.url),{recursive:true});
try{
 await page.goto(base+'/?test=1');
 await page.waitForFunction(()=>window.__bonney?.loaded);
 assert.equal(await page.locator('canvas').getAttribute('width'),'768');
 assert.equal(await page.locator('canvas').getAttribute('height'),'432');
 await page.getByRole('button',{name:'Start playing'}).click();
 await page.locator('canvas').focus();
 await page.keyboard.down('ArrowRight');await page.waitForTimeout(950);await page.keyboard.up('ArrowRight');
 await page.waitForFunction(()=>window.__bonney.game.player.power==='egghead');
 assert.ok(await page.evaluate(()=>window.__bonney.game.player.x>100));
 await page.evaluate(()=>{const p=window.__bonney.game.player;p.ability='cooldown';p.cooldownMs=2500;});
 await page.keyboard.press('Space');await page.waitForTimeout(120);await page.keyboard.press('Space');
 await page.waitForFunction(()=>window.__bonney.game.player.ability==='active');
 assert.equal(await page.evaluate(()=>window.__bonney.game.player.power),'egghead');
 assert.ok(await page.evaluate(()=>window.__bonney.game.player.activeMs>1000&&window.__bonney.game.player.activeMs<3000));
 await page.keyboard.down('Space');
 await page.waitForTimeout(100);
 assert.ok(await page.evaluate(()=>window.__bonney.game.player.vy<0));
 await page.keyboard.up('Space');
 await page.waitForTimeout(220);
 assert.ok(await page.evaluate(()=>window.__bonney.game.player.vy>0));
 assert.equal(await page.evaluate(()=>window.__bonney.game.player.ability),'active');
 await page.keyboard.down('Space');await page.waitForTimeout(70);
 assert.ok(await page.evaluate(()=>window.__bonney.game.player.vy<0));
 await page.keyboard.up('Space');

 await page.keyboard.press('KeyP');
 const before=await page.evaluate(()=>window.__bonney.game.player.activeMs);
 await page.waitForTimeout(200);
 assert.equal(await page.evaluate(()=>window.__bonney.game.player.activeMs),before);
 await page.keyboard.press('KeyP');
 await page.evaluate(()=>{const g=window.__bonney.game;g.player.activeMs=20;g.player.x=40;g.player.y=100;g.enemies=[];});
 await page.waitForFunction(()=>window.__bonney.game.player.ability==='cooldown');
 assert.ok(await page.evaluate(()=>window.__bonney.game.player.cooldownMs>4500));
 // Swap by physically overlapping a Captain pickup; new power-up must be ready immediately.
 await page.evaluate(()=>{const p=window.__bonney.game.player;p.x=752;p.y=148;p.vx=0;});
 await page.waitForFunction(()=>window.__bonney.game.player.power==='pirateCaptain');
 assert.equal(await page.evaluate(()=>window.__bonney.game.player.ability),'ready');
 assert.equal(await page.evaluate(()=>window.__bonney.game.player.cooldownMs),0);
 await page.evaluate(()=>{const p=window.__bonney.game.player;p.x=800;p.y=148;});
 await page.waitForFunction(()=>window.__bonney.game.player.ability==='ready');
 await page.evaluate(()=>{const p=window.__bonney.game.player;p.ability='cooldown';p.cooldownMs=2500;});
 await page.keyboard.press('KeyX');
 await page.waitForFunction(()=>window.__bonney.game.player.ability==='active');
 assert.ok(await page.evaluate(()=>window.__bonney.game.player.activeMs<=300));
 await page.waitForFunction(()=>window.__bonney.game.player.ability==='cooldown');
 // Damage through real collision, one stage per contact grace period.
 await page.evaluate(()=>{
  const g=window.__bonney.game,p=g.player;p.x=1000;p.y=148;p.vx=0;p.vy=0;p.invulnerableMs=0;
  g.enemies=[{x:1000,y:154,w:16,h:22,hp:3,min:1000,max:1010,dir:1}];
 });
 await page.waitForFunction(()=>window.__bonney.game.player.hits===2);
 await page.evaluate(()=>{
  const g=window.__bonney.game,p=g.player;p.x=1000;p.y=148;p.vx=0;p.vy=0;p.invulnerableMs=0;
 });
 await page.waitForFunction(()=>window.__bonney.game.player.hits===1);
 await page.evaluate(()=>{
  const p=window.__bonney.game.player;p.x=1000;p.y=148;p.vx=0;p.vy=0;p.invulnerableMs=0;
 });
 await page.waitForFunction(()=>window.__bonney.game.status==='dead');
 assert.equal(await page.getByRole('button',{name:'Play again'}).isVisible(),true);
 await page.getByRole('button',{name:'Play again'}).click();
 await page.evaluate(()=>{window.__bonney.game.player.x=1850;});
 await page.waitForFunction(()=>window.__bonney.game.status==='won');
 assert.equal(await page.getByText('Harbor cleared!',{exact:true}).isVisible(),true);
 await page.getByRole('button',{name:'Play again'}).click();
 await page.evaluate(()=>{const g=window.__bonney.game;g.player.x=420;g.player.power='egghead';g.player.ability='active';g.player.activeMs=4500;g.player.y=70;});
 await page.waitForTimeout(80);
 await page.screenshot({path:root+'docs/screenshots/refined-world-v7.png',fullPage:true});
 await page.setViewportSize({width:700,height:900});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);
 console.log('PASS: browser assets, keyboard movement, double-jump flight, pause, recharge, replacement, charge, age damage, death/restart, victory, layout, and screenshot.');
}finally{await browser.close();}
