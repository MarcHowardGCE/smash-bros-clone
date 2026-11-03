import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(new URL('../../package.json',import.meta.url)),{chromium}=require('playwright'),{PNG}=require('pngjs');
const out=new URL('../docs/screenshots/asset-audit-v2/',import.meta.url);await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true}),page=await browser.newPage();
const errors=[],paths=new Set();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{
 if(r.url().includes('/assets/')&&r.url().endsWith('.png')){paths.add(r.url());if(r.status()!==200)errors.push(r.status()+' '+r.url());}
});
try{
 await page.goto('http://127.0.0.1:4174/?test=1&mode=full');await page.waitForFunction(()=>window.__bonney?.loaded);
 const assets=[];
 for(const url of paths){
  const response=await page.request.get(url);assert.equal(response.status(),200);
  const p=PNG.sync.read(await response.body());let visible=0;
  for(let i=3;i<p.data.length;i+=4)if(p.data[i]>0)visible++;
  assert.ok(visible>0,'empty texture '+url);
  assets.push({path:new URL(url).pathname,width:p.width,height:p.height,visiblePixels:visible,status:200});
 }
 await writeFile(new URL('runtime-assets.json',out),JSON.stringify(assets,null,2));
 await page.getByRole('button',{name:'Start playing'}).click();await page.keyboard.press('KeyP');
 for(const [name,x,y]of [['food',2010,372],['seal',1360,372],['cargo-warning',4900,372]]){
  await page.evaluate(({x,y,name})=>{
   const g=window.__bonney.game;Object.assign(g.player,{x,y,hits:2,invulnerableMs:64000,grounded:true,power:'egghead'});g.noticeMs=0;
   if(name==='cargo-warning'){const h=g.hazards.find(h=>h.type==='cargo');h.warning=true;h.live=false;h.y=h.baseY;g.projectiles=[{x:x+70,y:382,w:6,h:4,vx:-125,life:2}];}
  },{x,y,name});
  await page.waitForTimeout(60);
  const b=Buffer.from(await page.evaluate(()=>document.querySelector('canvas').toDataURL('image/png').split(',')[1]),'base64');
  await writeFile(new URL(name+'.png',out),b);
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: '+assets.length+' runtime textures loaded, nonempty, and captured food / cracked seal / cargo warning / projectile states.');
}finally{await browser.close();}
