import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
const require=createRequire(new URL('../../package.json',import.meta.url));
const {chromium}=require('playwright'),{PNG}=require('pngjs');
const out=new URL('../docs/visual-audit-2026-11-02/',import.meta.url);
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1280,height:1000}});
try{
 await page.goto('http://127.0.0.1:4174/?test=1&mode=full');
 await page.waitForFunction(()=>window.__bonney?.loaded);
 await page.getByRole('button',{name:'Start playing'}).click();
 await page.keyboard.press('KeyP');
 const positions=[];
 for(let x=100;x<6400;x+=300)positions.push({x,y:372,name:'ground-'+x});
 for(const [x,y,name]of [[1440,266,'warehouse-roof'],[2660,210,'crane-lifts'],[2976,112,'crane-secret'],
 [4000,200,'customs-lever'],[5888,224,'rigging'],[6128,168,'bell']])positions.push({x,y,name});
 const sheet=new PNG({width:1536,height:Math.ceil(positions.length/4)*236}),entries=[];
 for(let i=0;i<positions.length;i++){
  const pos=positions[i];
  await page.evaluate(pos=>{
   const g=window.__bonney.game;Object.assign(g.player,{x:pos.x,y:pos.y,power:'egghead',ability:'ready',vx:0,vy:0,hits:3,invulnerableMs:64000});
   g.noticeMs=0;
  },pos);
  await page.waitForTimeout(35);
  const data=await page.evaluate(({name,x,y})=>{
   const source=document.querySelector('canvas'),o=document.createElement('canvas');o.width=384;o.height=236;
   const c=o.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(source,0,0,384,216);
   c.fillStyle='#101b2b';c.fillRect(0,216,384,20);c.fillStyle='#fff0ce';c.font='11px monospace';
   c.fillText(name+' / x='+x+' y='+y,7,230);return o.toDataURL('image/png').split(',')[1];
  },pos);
  const buffer=Buffer.from(data,'base64'),png=PNG.sync.read(buffer);
  PNG.bitblt(png,sheet,0,0,384,236,(i%4)*384,Math.floor(i/4)*236);
  await writeFile(new URL(String(i+1).padStart(2,'0')+'-'+pos.name+'.png',out),buffer);
  entries.push({...pos,index:i+1});
 }
 await writeFile(new URL('route-contact-sheet.png',out),PNG.sync.write(sheet));
 await writeFile(new URL('capture-index.json',out),JSON.stringify(entries,null,2));
 console.log('Captured '+positions.length+' route and vertical-view samples without modifying game files.');
}finally{await browser.close();}
