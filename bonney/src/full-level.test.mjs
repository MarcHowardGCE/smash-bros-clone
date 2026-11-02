import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,update,equipPower,activateAbility,damagePlayer,respawn} from './engine.mjs';
import {gateClosed} from './encounters.mjs';
const tick=(g,n,input={})=>{for(let i=0;i<n;i++)update(g,1/120,input);};
const quiet=()=>{const g=createGame('full');g.enemies=[];g.hazards=[];return g;};
test('full course is separate, contains six districts and four enemy families',()=>{
 const g=createGame('full');assert.equal(g.width,6400);assert.equal(g.height,480);
 assert.equal(g.zones.length,6);assert.equal(g.checkpoints.length,3);assert.equal(g.treasures.length,3);
 assert.deepEqual([...new Set(g.enemies.map(e=>e.type))].sort(),['gull','lookout','patrol','shield']);
 assert.equal(createGame().mode,'tutorial');
});
test('lookout telegraphs before firing and waits while offscreen',()=>{
 const g=createGame('full'),e=g.enemies.find(e=>e.type==='lookout');
 g.enemies=[e];g.player.x=e.x-100;tick(g,80);assert.equal(g.projectiles.length,0);
 tick(g,30);assert.ok(g.projectiles.length>0);
 const h=createGame('full');h.enemies=[h.enemies.find(e=>e.type==='lookout')];tick(h,500);
 assert.equal(h.projectiles.length,0);
});
test('moving lift carries grounded player and landing starts flight recharge once',()=>{
 const g=quiet(),m=g.movers[0];Object.assign(g.player,{x:m.x+8,y:m.y-28,grounded:true});
 tick(g,30);assert.ok(Math.abs(g.player.y+28-m.y)<.1);
 g.player.power='egghead';g.player.ability='active';g.player.activeMs=2500;
 update(g,1/120);assert.equal(g.player.ability,'cooldown');assert.equal(g.player.cooldownMs,5000);
 tick(g,12);assert.ok(g.player.cooldownMs<5000);
});
test('switches require Egghead and E, and both customs latches open its gate',()=>{
 const g=quiet(),s=g.switches[0];Object.assign(g.player,{x:s.x,y:s.y,grounded:false,power:'pirateCaptain'});
 update(g,1/120,{interactPressed:true});assert.ok(!g.latches[s.id]);
 g.player.power='egghead';update(g,1/120);assert.ok(!g.latches[s.id]);
 update(g,1/120,{interactPressed:true});assert.equal(g.latches[s.id],true);
 g.latches.customsLock=true;assert.equal(gateClosed(g,g.gates[0]),false);
});
test('cannonball breaks marked lock and unlocks hidden stash without a health gate',()=>{
 for(const hits of [1,2,3]){
  const g=quiet();g.player.hits=hits;g.player.x=1360;g.player.y=372;equipPower(g,'pirateCaptain');
  activateAbility(g);tick(g,16);assert.equal(g.latches.stashWall,true);
  g.player.x=1552;g.player.y=372;update(g,1/120);assert.equal(g.treasures[0].collected,true);
 }
});
test('bell must latch before cabin seal can be broken',()=>{
 const g=quiet(),seal=g.crates.find(c=>c.latch==='cabinSeal');
 g.player.x=6048;g.player.y=372;equipPower(g,'pirateCaptain');activateAbility(g);tick(g,16);
 assert.equal(seal.hp,1);
 g.latches.bell=true;g.player.x=6048;g.player.y=372;g.player.ability='ready';activateAbility(g);tick(g,16);
 assert.equal(g.latches.cabinSeal,true);
});
test('checkpoint death restores adult and power while retaining treasures and latches',()=>{
 const g=createGame('full');g.player.x=3350;update(g,1/120);
 assert.equal(g.checkpointIndex,1);g.latches.customsLock=true;g.treasures[0].collected=true;
 g.player.hits=1;g.player.invulnerableMs=0;damagePlayer(g);assert.equal(g.status,'dead');
 respawn(g);assert.equal(g.player.hits,3);assert.equal(g.player.x,3344);
 assert.equal(g.player.power,'pirateCaptain');assert.equal(g.player.cooldownMs,0);
 assert.equal(g.latches.customsLock,true);assert.equal(g.treasures[0].collected,true);
});
test('shield blocks front charge, but exposed rear is vulnerable',()=>{
 for(const front of [true,false]){
  const g=createGame('full'),e=g.enemies.find(e=>e.type==='shield');
  g.enemies=[e];g.hazards=[];e.timer=1.4;e.dir=1;e.state='windup';
  Object.assign(g.player,{x:front?e.x+10:e.x-10,y:372,grounded:true,power:'pirateCaptain',facing:front?-1:1});
  activateAbility(g);update(g,1/120);
  assert.equal(e.hp===0,!front);
 }
});
test('food restores one stage; final exit needs both gate puzzles',()=>{
 const g=quiet();g.player.hits=1;g.player.x=g.food[0].x;update(g,1/120);
 assert.equal(g.player.hits,2);
 g.player.x=6330;update(g,1/120);assert.equal(g.status,'playing');
 Object.assign(g.latches,{customsLock:true,customsLever:true,winch:true,rigging:true});
 update(g,1/120);assert.equal(g.status,'won');
});
test('full terrain has an age-independent route through gaps and one-way ledges',()=>{
 for(const hits of [1,2,3]){
  const g=quiet();g.pickups=[];g.crates=[];g.gates=[];g.switches=[];g.food=[];
  g.player.hits=hits;
  for(let i=0;i<120*90&&g.player.x<6300&&g.status==='playing';i++){
   const p=g.player,f=g.platforms.find(s=>s.h>8&&Math.abs(p.y+p.h-s.y)<1&&p.x+p.w>s.x&&p.x<s.x+s.w);
   const nearEdge=f&&f.x+f.w-p.x-p.w<10;
   update(g,1/120,{right:true,jumpPressed:p.grounded&&nearEdge});
  }
  assert.ok(g.player.x>=6300,'route stopped at '+g.player.x);
  assert.equal(g.player.hits,hits);
 }
});

test('full course supports a short coyote jump and buffered landing jump',()=>{
 const g=quiet();g.player.x=507;g.player.y=372;g.player.grounded=true;
 tick(g,12,{right:true});assert.equal(g.player.grounded,false);
 update(g,1/120,{jumpPressed:true});assert.ok(g.player.vy<0);
 const h=quiet();h.player.x=80;h.player.y=370;h.player.vy=40;h.player.grounded=false;
 update(h,1/120,{jumpPressed:true});tick(h,8);
 assert.ok(h.player.vy<0,'buffered jump occurs after landing');
});
test('gull commits to a warned dive target instead of continuously homing',()=>{
 const g=createGame('full'),e=g.enemies.find(e=>e.type==='gull');g.enemies=[e];
 g.player.x=e.x-20;g.player.y=e.y+30;g.player.ability='active';g.player.power='egghead';g.player.activeMs=5000;
 tick(g,90,{jumpHeld:true});assert.equal(e.state,'warn');
 const target=e.targetX;g.player.x+=80;tick(g,90,{jumpHeld:true});
 assert.equal(e.targetX,target);
});

function flyRoute(g,x,y,limit=12){
 for(let i=0;i<120*limit&&g.status==='playing';i++){
  const p=g.player,ready=p.ability==='ready'||(p.ability==='cooldown'&&p.cooldownMs<2500);
  const launch=p.grounded&&ready;
  const airborneStart=!p.grounded&&p.ability!=='active'&&ready;
  update(g,1/120,{right:p.x<x-2,left:p.x>x+2,jumpPressed:launch||airborneStart,
   jumpHeld:p.ability==='active'&&p.y>y,interactPressed:true});
  if(Math.abs(p.x-x)<5&&Math.abs(p.y-y)<20)return true;
 }
 return false;
}
test('crane keepsake and high customs lever are physically reachable using flight',()=>{
 for(const hits of [1,2,3]){
  const g=quiet();g.player.x=2704;g.player.y=372;g.player.hits=hits;equipPower(g,'egghead');
  assert.equal(flyRoute(g,2976,112),true,'crane route at age '+hits);
  tick(g,4);assert.equal(g.treasures[1].collected,true);
  const h=quiet();h.player.x=3840;h.player.y=372;h.player.hits=hits;equipPower(h,'egghead');
  assert.equal(flyRoute(h,4000,204),true,'customs route at age '+hits);
  update(h,1/120,{interactPressed:true});assert.equal(h.latches.customsLever,true);
 }
});
