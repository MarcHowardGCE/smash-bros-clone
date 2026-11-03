import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(new URL('../../package.json',import.meta.url));
const {chromium}=require('playwright'),{PNG}=require('pngjs');
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1280,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const out=new URL('../docs/screenshots/market-polish-v1/',import.meta.url);await mkdir(out,{recursive:true});
try{
 await page.goto('http://127.0.0.1:4174/?test=1&mode=full');await page.waitForFunction(()=>window.__bonney?.loaded);
 await page.getByRole('button',{name:'Start playing'}).click();
 const screens=[];
 await page.keyboard.press('KeyP');
 for(const [name,x]of [['opening',80],['gap',440],['lookout',760]]){
  await page.evaluate(x=>{const g=window.__bonney.game;Object.assign(g.player,{x,y:372,hits:3,power:'egghead',ability:'ready',invulnerableMs:64000,grounded:true,vx:0,vy:0});g.noticeMs=0;},x);
  await page.waitForTimeout(60);
  const data=await page.evaluate(()=>document.querySelector('canvas').toDataURL('image/png').split(',')[1]);
  const buffer=Buffer.from(data,'base64');await writeFile(new URL(name+'.png',out),buffer);screens.push(PNG.sync.read(buffer));
 }
 const sheet=new PNG({width:768,height:432*3});screens.forEach((p,i)=>PNG.bitblt(p,sheet,0,0,768,432,0,i*432));
 await writeFile(new URL('three-screen-review.png',out),PNG.sync.write(sheet));
 await page.keyboard.press('KeyP');
 for(const hits of [1,2,3])for(const power of ['egghead','pirateCaptain']){
  await page.evaluate(({hits,power})=>{
   window.__bonney.restart();const g=window.__bonney.game;g.enemies=[];g.pickups=[];
   Object.assign(g.player,{x:40,y:372,hits,power,invulnerableMs:0,grounded:true});
  },{hits,power});
  await page.locator('canvas').focus();await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(240);await page.keyboard.up('ArrowRight');
  assert.ok(await page.evaluate(()=>window.__bonney.game.player.x>55));
  assert.equal(await page.evaluate(()=>window.__bonney.game.player.hits),hits);
  await page.keyboard.press('Space');await page.waitForTimeout(120);
  assert.ok(await page.evaluate(()=>window.__bonney.game.player.y<372));
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: polished opening/gap/lookout captures, movement/jump at all ages and both outfits; no page errors.');
}finally{await browser.close();}
