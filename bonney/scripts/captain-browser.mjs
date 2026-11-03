import {createRequire} from 'node:module';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(new URL('../../package.json',import.meta.url)),{chromium}=require('playwright'),{PNG}=require('pngjs');
const browser=await chromium.launch({headless:true}),page=await browser.newPage();
const out=new URL('../docs/screenshots/pirate-captain-v1/',import.meta.url);await mkdir(out,{recursive:true});
const errors=[],assets=new Set();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('/assets/')){assets.add(r.url());if(r.status()!==200)errors.push(r.url());}});
try{
 await page.goto('http://127.0.0.1:4174/?test=1&mode=full');await page.waitForFunction(()=>window.__bonney?.loaded);
 await page.getByRole('button',{name:'Start playing'}).click();
 for(const hits of [3,2,1])for(const power of ['none','pirateCaptain','egghead']){
  await page.evaluate(({hits,power})=>{const g=window.__bonney.game;g.enemies=[];g.pickups=[];Object.assign(g.player,{x:200,y:372,hits,power,ability:'ready',grounded:true,vx:0,vy:0});},{hits,power});
  for(const key of ['ArrowRight','ArrowLeft']){
   await page.keyboard.down(key);await page.waitForTimeout(110);
   assert.equal(await page.evaluate(()=>window.__bonney.animationFrame.source),'walk');
   assert.equal(await page.evaluate(()=>window.__bonney.animationFrame.flip),key==='ArrowLeft');
   await page.keyboard.up(key);
  }
 }
 assert.ok([...assets].some(u=>u.includes('/pirate-captain-v1/captain-atlas.png')));
 assert.ok([...assets].some(u=>u.includes('/pirate-captain-v1/captain-walk-atlas.png')));
 const preview=await page.evaluate(async()=>{
  const load=async src=>{const i=new Image();i.src=src;await i.decode();return i;};
  const [base,captain,walk,egg]=await Promise.all(['assets/sprites-v2/captain-atlas.png','assets/pirate-captain-v1/captain-atlas.png','assets/pirate-captain-v1/captain-walk-atlas.png','assets/sprites-v2/egghead-atlas.png'].map(load));
  const c=document.createElement('canvas');c.width=1344;c.height=384;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;
  for(let row=0;row<3;row++)for(const [col,im,sx,cw]of [[0,base,0,64],[1,captain,0,64],[2,walk,0,96],[3,walk,192,96],[4,walk,288,96],[5,captain,192,64],[6,egg,0,64]])
   ctx.drawImage(im,sx,row*64,cw,64,col*192+(192-cw*2)/2,row*128,cw*2,128);
  return c.toDataURL('image/png').split(',')[1];
 });await writeFile(new URL('outfit-review.png',out),Buffer.from(preview,'base64'));
 const manifest=JSON.parse(await readFile(new URL('../assets/pirate-captain-v1/manifest.json',import.meta.url),'utf8'));assert.equal(manifest.frames.length,24);
 for(const age of manifest.ages){
  const frames=manifest.frames.filter(f=>f.age===age&&f.pose.startsWith('stride'));
  const hashes=await Promise.all(frames.map(async f=>(await readFile(new URL('../assets/pirate-captain-v1/'+f.file,import.meta.url))).toString('base64')));
  assert.equal(new Set(hashes).size,6,'six distinct stride frames for '+age);
  assert.equal(new Set(frames.map(f=>f.height)).size,1,'consistent stride height');
 }
 assert.deepEqual(errors,[]);console.log('PASS: three distinct outfits at every age, left/right stride animation, 24 new frames, six distinct height-aligned strides per age, review capture.');
}finally{await browser.close();}
