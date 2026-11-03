import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
const require=createRequire(new URL('../../package.json',import.meta.url)),{chromium}=require('playwright'),{PNG}=require('pngjs');
const out=new URL('../docs/screenshots/warehouse-polish-v1/',import.meta.url);await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true}),page=await browser.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:4174/?test=1&mode=full');await page.waitForFunction(()=>window.__bonney?.loaded);
 await page.getByRole('button',{name:'Start playing'}).click();await page.keyboard.press('KeyP');
 const imgs=[];
 for(const [name,x,y]of [['market-grounding',80,372],['warehouse-entry',1180,372],['warehouse-secret',1400,372],['warehouse-roof',1496,240],['warehouse-exit',1900,372]]){
  await page.evaluate(({x,y})=>{const g=window.__bonney.game;Object.assign(g.player,{x,y,invulnerableMs:64000,power:'egghead',grounded:true,vx:0,vy:0});g.noticeMs=0;},{x,y});
  await page.waitForTimeout(60);
  const data=await page.evaluate(()=>document.querySelector('canvas').toDataURL('image/png').split(',')[1]),b=Buffer.from(data,'base64');
  await writeFile(new URL(name+'.png',out),b);imgs.push(PNG.sync.read(b));
 }
 const sheet=new PNG({width:1536,height:432*3});imgs.forEach((p,i)=>PNG.bitblt(p,sheet,0,0,768,432,(i%2)*768,Math.floor(i/2)*432));
 await writeFile(new URL('review.png',out),PNG.sync.write(sheet));
 if(errors.length)throw new Error(errors.join('\n'));
 console.log('PASS: market foundation and four warehouse review views loaded without page errors.');
}finally{await browser.close();}
