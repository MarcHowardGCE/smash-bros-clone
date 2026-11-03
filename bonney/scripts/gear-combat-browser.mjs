import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(new URL('../../package.json',import.meta.url)),{chromium}=require('playwright'),{PNG}=require('pngjs');
const browser=await chromium.launch({headless:true}),page=await browser.newPage();const errors=[];
const out=new URL('../docs/screenshots/gear-combat-v1/',import.meta.url);await mkdir(out,{recursive:true});
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('127.0.0.1:4174')&&r.status()>=400)errors.push(r.status()+' '+r.url());});
const capture=async name=>{await page.evaluate(()=>window.__bonney.game.player.invulnerableMs=0);await page.waitForTimeout(18);await writeFile(new URL(name+'.png',out),Buffer.from(await page.evaluate(()=>document.querySelector('canvas').toDataURL('image/png').split(',')[1]),'base64'));};
const arena=async(power,type='patrol')=>page.evaluate(({power,type})=>{
 const g=window.__bonney.game;g.scene='harbor';g.status='playing';g.width=6400;g.height=480;g.platforms=[{x:0,y:400,w:6400,h:80}];g.pickups=[];g.hazards=[];g.movers=[];g.gates=[];g.crates=[];
 Object.assign(g.player,{x:200,y:372,vx:0,vy:0,power,hits:3,facing:1,grounded:true,ability:'ready',cooldownMs:0,attackMs:0,attackCooldownMs:0,chargingPunch:false,chargePunchMs:0,invulnerableMs:10000,airJumpUsed:false});
 g.enemies=[{x:228,y:372,w:16,h:28,hp:3,maxHp:3,type,dir:-1,min:228,max:228,homeX:228,homeY:372,state:'guard',timer:0}];
},{power,type});
try{
 await page.goto('http://127.0.0.1:4174/?test=1&mode=full');await page.waitForFunction(()=>window.__bonney?.loaded);await page.getByRole('button',{name:'Start playing'}).click();
 for(const power of ['none','egghead','pirateCaptain','gear'])for(const key of ['KeyZ','KeyC']){
  await arena(power);await page.keyboard.press(key);await page.waitForTimeout(100);
  assert.equal(await page.evaluate(()=>window.__bonney.game.enemies[0].hp),2,power+' '+key);await capture(power+'-'+key);
 }
 await arena('gear','shield');await page.keyboard.down('KeyZ');await page.waitForTimeout(820);assert.ok(await page.evaluate(()=>window.__bonney.game.player.chargePunchMs>=700));
 await page.keyboard.up('KeyZ');await page.waitForTimeout(75);assert.equal(await page.evaluate(()=>window.__bonney.game.enemies[0].hp),0);await capture('charged-shield-break');
 await arena('gear');await page.evaluate(()=>window.__bonney.game.enemies=[]);await page.keyboard.down('ArrowRight');await page.waitForTimeout(60);assert.equal(await page.evaluate(()=>window.__bonney.game.player.vx),157.5);await page.keyboard.up('ArrowRight');
 await page.keyboard.press('Space');await page.waitForTimeout(100);await page.keyboard.press('Space');await page.waitForTimeout(60);assert.ok(await page.evaluate(()=>window.__bonney.game.player.spinMs>0));await capture('spin-jump');
 await page.evaluate(async()=>{const {enterCloud}=await import('/src/cloud-level.mjs');enterCloud(window.__bonney.game);Object.assign(window.__bonney.game.player,{x:176,y:164,invulnerableMs:0});});
 await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>window.__bonney.game.player.power),'gear');await capture('gear-cloud-arrival');
 await page.keyboard.press('KeyP');
 const review=await page.evaluate(async()=>{
  const paths=['gear-atlas','gear-walk-atlas','gear-attacks','default-attacks','captain-attacks','egghead-attacks'];
  const images=await Promise.all(paths.map(async path=>{const im=new Image();im.src='assets/gear-combat-v1/'+path+'.png';await im.decode();return im;}));
  const c=document.createElement('canvas');c.width=1728;c.height=384;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;
  for(let row=0;row<3;row++)for(const [col,im,sx,cw]of [[0,images[0],0,64],[1,images[1],0,96],[2,images[1],288,96],[3,images[0],192,64],[4,images[2],0,96],[5,images[2],96,96],[6,images[3],0,96],[7,images[4],0,96],[8,images[5],0,96]])ctx.drawImage(im,sx,row*64,cw,64,col*192+(192-cw*2)/2,row*128,cw*2,128);
  return c.toDataURL('image/png').split(',')[1];
 });await writeFile(new URL('sprite-review.png',out),Buffer.from(review,'base64'));
 for(const [age,target]of [['adult',60],['teenage',50],['baby',36]])for(let col=0;col<=6;col++){
  const response=await page.request.get('http://127.0.0.1:4174/assets/gear-combat-v1/gear-'+age+'-'+col+'.png');
  const png=PNG.sync.read(await response.body());let top=64,bottom=-1;
  for(let y=0;y<64;y++)for(let x=0;x<png.width;x++)if(png.data[(y*png.width+x)*4+3]>=20){top=Math.min(top,y);bottom=Math.max(bottom,y);}
  assert.ok(bottom-top+1>=target-2&&bottom-top+1<=target,age+' stride height '+col);
  assert.ok(bottom>=61&&bottom<=62,age+' foot anchor '+col);
 }
 assert.deepEqual(errors,[]);console.log('PASS: real keyboard punch/kick for all outfits, Gear shield-break charge, 1.5x speed, spin jump, cloud pickup, attack visuals.');
}finally{await browser.close();}
