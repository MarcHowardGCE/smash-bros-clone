import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(new URL('../../package.json',import.meta.url));
const {chromium}=require('playwright');
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1200,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:4174/?test=1');
 await page.waitForFunction(()=>window.__bonney?.loaded);
 await page.getByRole('button',{name:'Start playing'}).click();
 for(const power of ['egghead','pirateCaptain'])for(const hits of [1,2,3])for(const direction of ['left','right']){
  await page.evaluate(({power,hits})=>{
   window.__bonney.restart();
   const g=window.__bonney.game;g.pickups=[];g.enemies=[];g.crates=[];
   Object.assign(g.player,{x:180,y:148,power,hits,grounded:true});
  },{power,hits});
  await page.locator('canvas').focus();
  const key=direction==='left'?'ArrowLeft':'ArrowRight';
  await page.keyboard.down(key);
  const sample=await page.evaluate(()=>new Promise(resolve=>{
   const seen=new Set(),flip=new Set();let count=0;
   function sample(){
    const a=window.__bonney.animationFrame;
    if(a.source==='walk'){seen.add(a.column);flip.add(a.flip);}
    if(++count<40)requestAnimationFrame(sample);
    else resolve({seen:[...seen].sort(),flip:[...flip],x:window.__bonney.game.player.x});
   }requestAnimationFrame(sample);
  }));
  await page.keyboard.up(key);
  assert.deepEqual(sample.seen,[0,1,2,3,4,5],power+' '+hits+' '+direction);
  assert.deepEqual(sample.flip,[direction==='left']);
  assert.ok(direction==='left'?sample.x<170:sample.x>190);
  await page.waitForTimeout(40);
  assert.equal(await page.evaluate(()=>window.__bonney.animationFrame.source),'poses');
 }
 // Collect a visible contact sheet from actual canvas rendering, in both directions.
 const strips=await page.evaluate(()=>new Promise(async resolve=>{
  const g=window.__bonney.game;
  Object.assign(g.player,{x:180,y:148,power:'egghead',hits:3,grounded:true});
  const source=document.querySelector('canvas'),output=document.createElement('canvas');
  output.width=6*136;output.height=2*112;
  const c=output.getContext('2d');c.imageSmoothingEnabled=false;
  c.fillStyle='#172538';c.fillRect(0,0,output.width,output.height);
  for(let row=0;row<2;row++){
   const key=row===0?'ArrowRight':'ArrowLeft';
   source.dispatchEvent(new KeyboardEvent('keydown',{code:key,bubbles:true}));
   const seen=new Set();
   await new Promise(done=>{
    function capture(){
     const p=g.player,a=window.__bonney.animationFrame,cam=Math.max(0,Math.min(1920-384,p.x-104));
     if(a.source==='walk'&&!seen.has(a.column)){
      seen.add(a.column);
      c.drawImage(source,Math.round((p.x-cam-16)*2),Math.round((p.y-3)*2),96,64,a.column*136+8,row*112+8,120,80);
     }
     if(seen.size===6)done();else requestAnimationFrame(capture);
    }requestAnimationFrame(capture);
   });
   source.dispatchEvent(new KeyboardEvent('keyup',{code:key,bubbles:true}));
   await new Promise(r=>requestAnimationFrame(r));
  }
  resolve(output.toDataURL('image/png').split(',')[1]);
 }));
 const {writeFile}=await import('node:fs/promises');
 await mkdir(new URL('../docs/screenshots/',import.meta.url),{recursive:true});
 await writeFile(new URL('../docs/screenshots/walking-both-directions-v3.png',import.meta.url),Buffer.from(strips,'base64'));
 assert.deepEqual(errors,[]);
 console.log('PASS: all six frames rendered during actual left/right movement for both outfits and all three ages; stopping returns idle. Saved two-direction contact sheet.');
}finally{await browser.close();}
