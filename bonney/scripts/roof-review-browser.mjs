import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(new URL('../../package.json',import.meta.url)),{chromium}=require('playwright');
const out=new URL('../docs/screenshots/roof-review/',import.meta.url);await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true}),page=await browser.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:4174/?test=1&mode=full');await page.waitForFunction(()=>window.__bonney?.loaded);
 await page.getByRole('button',{name:'Start playing'}).click();await page.keyboard.press('KeyP');
 const result=await page.evaluate(async()=>{
  const {BUILDINGS,buildingRoofs}=await import('/src/remaining-scene.mjs');
  const {update}=await import('/src/engine.mjs');
  const g=window.__bonney.game;g.enemies=[];g.hazards=[];g.gates=[];g.pickups=[];
  const views=[];
  for(const b of BUILDINGS){
   const roofs=buildingRoofs().filter(s=>s.building===b.key+'-'+b.x),s=roofs[Math.floor(roofs.length/2)];
   Object.assign(g.player,{x:s.x,y:s.y-60,vx:0,vy:0,grounded:false,power:'egghead',ability:'ready'});
   for(let n=0;n<50;n++)update(g,1/120);
   views.push({key:b.key+'-'+b.x,x:g.player.x,y:g.player.y,grounded:g.player.grounded});
  }return views;
 });
 for(const v of result){
  assert.equal(v.grounded,true,v.key);
  await page.evaluate(v=>{Object.assign(window.__bonney.game.player,v);window.__bonney.game.noticeMs=0;},v);
  await page.waitForTimeout(70);
  const data=await page.evaluate(()=>document.querySelector('canvas').toDataURL('image/png').split(',')[1]);
  await writeFile(new URL(v.key+'.png',out),Buffer.from(data,'base64'));
 }
 assert.deepEqual(errors,[]);console.log('PASS: landed on all ten building/deck roofs; ten review captures saved.');
}finally{await browser.close();}
