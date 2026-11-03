import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
const require=createRequire(new URL('../../package.json',import.meta.url)),{chromium}=require('playwright'),{PNG}=require('pngjs');
const out=new URL('../docs/screenshots/whole-level-audit/',import.meta.url);await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true}),page=await browser.newPage();const errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:4174/?test=1&mode=full');await page.waitForFunction(()=>window.__bonney?.loaded);
 await page.getByRole('button',{name:'Start playing'}).click();await page.keyboard.press('KeyP');
 const views=[];
 for(const y of [372,200])for(let x=128;x<6400;x+=256){
  await page.evaluate(({x,y})=>{const g=window.__bonney.game;Object.assign(g.player,{x,y,power:'egghead',grounded:true,vx:0,vy:0});g.status='playing';g.noticeMs=0;},{x,y});
  await page.waitForTimeout(25);
  const data=Buffer.from(await page.evaluate(()=>document.querySelector('canvas').toDataURL('image/png').split(',')[1]),'base64');
  const name=(y===372?'ground':'high')+'-'+x+'.png';await writeFile(new URL(name,out),data);views.push(PNG.sync.read(data));
 }
 for(let band=0;band<2;band++){
  const sheet=new PNG({width:384*5,height:216*5});
  for(let i=0;i<25;i++){
   const src=views[band*25+i];
   for(let y=0;y<216;y++)for(let x=0;x<384;x++){
    const si=((y*2)*src.width+x*2)*4,di=((Math.floor(i/5)*216+y)*sheet.width+(i%5)*384+x)*4;
    src.data.copy(sheet.data,di,si,si+4);
   }
  }await writeFile(new URL(band?'high-review.png':'ground-review.png',out),PNG.sync.write(sheet));
 }
 if(errors.length)throw new Error(errors.join('\n'));console.log('PASS: 50 overlapping whole-level ground/high captures, no page errors.');
}finally{await browser.close();}
