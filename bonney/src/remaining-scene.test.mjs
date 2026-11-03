import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,update} from './engine.mjs';
import {STRUCTURES,PROPS,BUILDINGS,buildingRoofs,roofHeight,platformFootings} from './remaining-scene.mjs';
import {cameraTarget,inPolishedDistrict} from './market-scene.mjs';
test('remaining structures and decorations are anchored to real ground',()=>{
 const g=createGame('full');
 for(const [key,x,bottom,w,h]of [...STRUCTURES,...BUILDINGS.map(b=>[b.key,b.x,b.bottom,b.w,b.h])]){
  assert.equal(bottom,400);
  assert.ok(g.platforms.some(s=>s.h>8&&x>=s.x&&x+w<=s.x+s.w),
   'structure foundation: '+key);
 }
 for(const [key,x,y,w,h]of PROPS)
  assert.ok(g.platforms.some(s=>s.h>8&&x>=s.x&&x+w<=s.x+s.w&&y+h===s.y),'prop grounding: '+key+' '+x);
});
test('remaining reward patterns keep enemy cue lanes clear and required outfits intact',()=>{
 const g=createGame('full');
 for(const e of g.enemies.filter(e=>e.x>=2176))for(const c of g.coinsList.filter(c=>c.x>=2176))
  assert.ok(c.x+c.w<e.min-20||c.x>e.max+20,'coin overlaps '+e.type+' at '+e.x);
 assert.equal(g.pickups.length,12);assert.equal(g.treasures.length,3);assert.equal(g.switches.length,3);
 assert.equal(new Set(g.coinsList.map(c=>c.id)).size,g.coinsList.length);
 assert.ok(g.coinsList.length<100);
});
test('all districts retain consistent ground framing and high-route look-ahead',()=>{
 const g=createGame('full');
 for(const x of [100,1100,2400,3700,5000,5800]){
  g.player.x=x;g.player.y=372;assert.equal(cameraTarget(g),148);assert.equal(inPolishedDistrict(g),true);
  g.player.y=100;assert.equal(cameraTarget(g),116);
 }
});


test('every building has playable roofs and no platforms across its facade',()=>{
 const g=createGame('full');
 for(const b of BUILDINGS){
  assert.ok(g.platforms.some(s=>s.kind==='roof'&&s.building===b.key+'-'+b.x));
  for(const s of g.platforms.filter(s=>s.oneWay&&s.kind!=='roof'))
   assert.ok(!(s.x<b.x+b.w&&s.x+s.w>b.x&&s.y>b.bottom-b.h&&s.y<b.bottom),'facade obstruction: '+b.key+' '+s.x);
 }
});
test('all ages can land, walk both ways and jump from every building roof',()=>{
 for(const b of BUILDINGS)for(const hits of [1,2,3])for(const direction of [-1,1]){
  const g=createGame('full');g.enemies=[];g.hazards=[];g.gates=[];g.pickups=[];
  const roof=buildingRoofs().filter(s=>s.building===b.key+'-'+b.x),mid=roof[Math.floor(roof.length/2)];
  Object.assign(g.player,{x:mid.x,y:mid.y-60,hits,grounded:false,vy:0});
  for(let n=0;n<50;n++)update(g,1/120);
  assert.equal(g.player.grounded,true,'land on '+b.key);
  const startY=g.player.y;
  for(let n=0;n<24;n++)update(g,1/120,{left:direction<0,right:direction>0});
  assert.ok(g.player.y<startY+25,'walk stays on roof '+b.key);
  for(let n=0;n<20&&!g.player.grounded;n++)update(g,1/120);
  update(g,1/120,{jumpPressed:true});assert.ok(g.player.vy<0,'jump from '+b.key);
 }
});


test('running is faster at every age and follows inclines continuously in either direction',()=>{
 for(const hits of [1,2,3])for(const direction of [-1,1])for(const runHeld of [false,true]){
  const g=createGame('full'),b=BUILDINGS[3];g.enemies=[];g.hazards=[];g.gates=[];g.pickups=[];
  const x=b.x+b.w*(direction>0?.28:.72)-8;
  Object.assign(g.player,{x,y:roofHeight(b,x+8)-28,hits,grounded:true,vy:0});
  let previous=g.player.y;
  for(let n=0;n<24;n++){
   update(g,1/120,{left:direction<0,right:direction>0,runHeld});
   assert.ok(g.player.grounded,'roof contact stays grounded');
   assert.ok(Math.abs(g.player.y+28-roofHeight(b,g.player.x+8))<1e-8,'feet follow exact slope');
   assert.ok(Math.abs(g.player.y-previous)<1.3,'no roof stair-step jumps');previous=g.player.y;
   assert.equal(Math.abs(g.player.vx),runHeld?168:105);
  }
  update(g,1/120,{jumpPressed:true,runHeld});assert.ok(g.player.vy<0);assert.equal(g.player.grounded,false);
 }
});


test('all elevated platforms and bird perches have real ground foundations',()=>{
 const g=createGame('full');
 for(const s of g.platforms.filter(s=>s.oneWay&&s.kind!=='roof')){
  for(const x of platformFootings(g,s))assert.ok(g.platforms.some(f=>f.h>8&&x>=f.x&&x+4<=f.x+f.w),'foundation beneath '+s.x);
 }
 assert.equal(g.movers[1].anchorY+2,134,'lift crank sits on service gantry');
});


test('ground pickups and machinery control points sit on supported routes',()=>{
 const g=createGame('full');
 for(const p of g.pickups.filter(p=>p.y===376))
  assert.ok(g.platforms.some(f=>f.h>8&&p.x>=f.x&&p.x+p.w<=f.x+f.w),'pickup above gap '+p.x);
 for(const s of g.switches.filter(s=>s.id!=='bell'))
  assert.ok(g.platforms.some(p=>s.x>=p.x&&s.x+s.w<=p.x+p.w&&s.y+s.h===p.y),'switch support '+s.id);
});


test('moving lift travel never passes through a building facade',()=>{
 const g=createGame('full');
 for(const m of g.movers)for(const b of BUILDINGS)
  assert.ok(!(m.x<b.x+b.w&&m.x+m.w>b.x&&m.baseY>b.bottom-b.h&&m.baseY-m.range<b.bottom),'lift sweeps facade '+b.key);
});
