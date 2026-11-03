import {createRequire} from 'node:module';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(new URL('../../package.json',import.meta.url)),{chromium}=require('playwright'),{PNG}=require('pngjs');
const out=new URL('../docs/screenshots/flight-v1/',import.meta.url);await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true}),page=await browser.newPage();const errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('127.0.0.1:4174')&&r.status()>=400)errors.push(r.status()+' '+r.url());});
const fixture=async(hits,facing=1)=>page.evaluate(({hits,facing})=>{
 const g=window.__bonney.game;g.enemies=[];g.hazards=[];g.pickups=[];g.gates=[];g.crates=[];g.movers=[];g.platforms=[{x:0,y:400,w:6400,h:80}];
 Object.assign(g.player,{x:220,y:180,vx:0,vy:0,hits,facing,grounded:false,power:'egghead',ability:'active',activeMs:4000,cooldownMs:0,attackMs:0,attackCooldownMs:0,invulnerableMs:0});
},{hits,facing});
const capture=async name=>{await writeFile(new URL(name+'.png',out),Buffer.from(await page.evaluate(()=>document.querySelector('canvas').toDataURL('image/png').split(',')[1]),'base64'));};
try{
 await page.goto('http://127.0.0.1:4174/?test=1&mode=full');await page.waitForFunction(()=>window.__bonney?.loaded);await page.getByRole('button',{name:'Start playing'}).click();
 for(const character of ['bonney','luffy']){
  await page.getByLabel('Character',{exact:true}).selectOption(character);
  for(const hits of [3,2,1])for(const facing of [1,-1]){
   await fixture(hits,facing);await page.keyboard.down('Space');await page.waitForTimeout(100);
   assert.equal(await page.evaluate(()=>window.__bonney.animationFrame.source),'flight');
   const jets=await page.evaluate(()=>window.__bonney.flightJets);assert.equal(jets.length,2);assert.ok(jets.every(j=>j.row===(character==='luffy'?1:0)));
   await capture(character+'-'+hits+'-'+facing);
   await page.keyboard.up('Space');await page.waitForTimeout(40);assert.deepEqual(await page.evaluate(()=>window.__bonney.flightJets),[]);
   const fuel=await page.evaluate(()=>window.__bonney.game.player.activeMs);await page.waitForTimeout(80);assert.equal(await page.evaluate(()=>window.__bonney.game.player.activeMs),fuel);
  }
  await fixture(3);await page.keyboard.down('Space');await page.keyboard.press('KeyZ');await page.waitForTimeout(70);assert.equal(await page.evaluate(()=>window.__bonney.flightJets.length),2);await capture(character+'-air-punch');
  await page.waitForTimeout(330);await page.keyboard.press('KeyC');await page.waitForTimeout(80);assert.equal(await page.evaluate(()=>window.__bonney.flightJets.length),1);await capture(character+'-air-kick');
  await page.evaluate(()=>window.__bonney.game.player.activeMs=0);await page.waitForTimeout(30);assert.deepEqual(await page.evaluate(()=>window.__bonney.flightJets),[]);
  await page.keyboard.up('Space');await page.evaluate(()=>Object.assign(window.__bonney.game.player,{y:371,vy:80,activeMs:500}));await page.waitForTimeout(80);assert.equal(await page.evaluate(()=>window.__bonney.game.player.grounded),true);assert.deepEqual(await page.evaluate(()=>window.__bonney.flightJets),[]);
  for(const [age,target]of [['adult',60],['teenage',50],['baby',36]]){
   const hashes=[];
   const idleResponse=await page.request.get('http://127.0.0.1:4174/assets/sprites-v2/egghead-atlas.png');const idle=PNG.sync.read(await idleResponse.body());
   const row=['adult','teenage','baby'].indexOf(age);let idleArea=0,idleLeft=64,idleRight=-1;
   for(let yy=0;yy<64;yy++)for(let xx=0;xx<64;xx++)if(idle.data[((row*64+yy)*idle.width+xx)*4+3]>128){idleArea++;idleLeft=Math.min(idleLeft,xx);idleRight=Math.max(idleRight,xx);}
   for(let col=0;col<4;col++){
    const buffer=await readFile(new URL('../assets/flight-v1/'+character+'-'+age+'-'+col+'.png',import.meta.url)),p=PNG.sync.read(buffer);let top=64,bottom=-1,left=96,right=-1,area=0;
    for(let y=0;y<64;y++)for(let x=0;x<96;x++)if(p.data[(y*96+x)*4+3]>100){top=Math.min(top,y);bottom=Math.max(bottom,y);left=Math.min(left,x);right=Math.max(right,x);area++;}
    assert.ok(bottom-top+1>=target-2&&bottom-top+1<=target);assert.equal(bottom,62);
    if(character==='bonney'){assert.ok(right-left+1>=idleRight-idleLeft-1,'flight width matches approved age '+age);assert.ok(area>=idleArea*.85,'flight silhouette area matches approved age '+age);}
    hashes.push(buffer.toString('base64'));
   }assert.equal(new Set(hashes).size,4,'four distinct hover frames '+character+' '+age);
  }
 }
 assert.deepEqual(errors,[]);console.log('PASS: both characters/all ages/both facings, measured dual jets, four hover frames, airborne punch/kick attachment, release/empty-fuel/landing cutoff, preserved fuel on release.');
}finally{await browser.close();}
