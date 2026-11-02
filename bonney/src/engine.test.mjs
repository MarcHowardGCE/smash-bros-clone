import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,update,equipPower,activateAbility,damagePlayer,CONFIG} from './engine.mjs';
const advance=(g,seconds,input={})=>{for(let n=0;n<Math.round(seconds*120);n++)update(g,1/120,input);};
test('damage stages and grace period',()=>{
 const g=createGame();damagePlayer(g);assert.equal(g.player.hits,2);
 assert.equal(damagePlayer(g),false);g.player.invulnerableMs=0;damagePlayer(g);assert.equal(g.player.hits,1);
 g.player.invulnerableMs=0;damagePlayer(g);assert.equal(g.status,'dead');
});
test('flight fuel depletes only under airborne lift; empty fuel waits for landing to recharge',()=>{
 const g=createGame();g.enemies=[];g.pickups=[];equipPower(g,'egghead');
 g.player.y=90;g.player.grounded=false;activateAbility(g);
 advance(g,4,{jumpHeld:true});assert.equal(g.player.ability,'active');
 assert.ok(Math.abs(g.player.activeMs-1000)<1);
 advance(g,1.01,{jumpHeld:true});assert.equal(g.player.activeMs,0);
 assert.equal(g.player.ability,'active');assert.equal(g.player.cooldownMs,0);
 for(let i=0;i<120&&g.player.ability==='active';i++)update(g,1/120);
 assert.equal(g.player.ability,'cooldown');assert.equal(g.player.cooldownMs,5000);
 advance(g,5.01);assert.equal(g.player.ability,'ready');
});
test('release preserves fuel and landing starts a full cooldown immediately',()=>{
 const g=createGame();g.enemies=[];g.pickups=[];equipPower(g,'egghead');
 g.player.y=90;g.player.grounded=false;activateAbility(g);
 update(g,1/120,{jumpHeld:true});const fuel=g.player.activeMs;
 advance(g,.2);assert.equal(g.player.activeMs,fuel);
 for(let i=0;i<120&&g.player.ability==='active';i++)update(g,1/120);
 assert.equal(g.player.grounded,true);assert.equal(g.player.ability,'cooldown');
 assert.equal(g.player.cooldownMs,5000);assert.equal(g.player.activeMs,0);
 advance(g,.5,{right:true});assert.equal(g.player.ability,'cooldown');
 assert.ok(Math.abs(g.player.cooldownMs-4500)<1);
});
test('double jump activates flight only for ready Egghead',()=>{
 const g=createGame();equipPower(g,'egghead');
 update(g,1/120,{jumpPressed:true});assert.equal(g.player.ability,'ready');
 update(g,1/120,{jumpPressed:true});assert.equal(g.player.ability,'active');
});
test('new power-up replaces an active ability and resets cooldown immediately',()=>{
 const g=createGame();equipPower(g,'egghead');activateAbility(g);equipPower(g,'pirateCaptain');
 assert.equal(g.player.power,'pirateCaptain');assert.equal(g.player.ability,'ready');
 assert.equal(g.player.cooldownMs,0);assert.equal(g.player.activeMs,0);
 assert.equal(activateAbility(g),true);
 g.player.ability='cooldown';g.player.cooldownMs=3000;
 equipPower(g,'egghead');assert.equal(g.player.ability,'ready');assert.equal(g.player.cooldownMs,0);
 assert.equal(activateAbility(g),true);
});
test('flight rises only while jump is held, falls on release, and resumes on hold',()=>{
 for(const hits of [1,2,3]){
  const g=createGame();g.enemies=[];g.pickups=[];g.player.hits=hits;
  equipPower(g,'egghead');g.player.y=90;g.player.grounded=false;activateAbility(g);
  update(g,1/120,{jumpHeld:true});assert.ok(g.player.vy<0);
  const high=g.player.y;
  advance(g,.3,{up:true});assert.ok(g.player.vy>0);assert.ok(g.player.y>high);
  assert.equal(g.player.ability,'active');
  update(g,1/120,{jumpHeld:true});assert.ok(g.player.vy<0);
 }
});
test('collecting a different pickup clears recharge without healing',()=>{
 const g=createGame();g.player.hits=1;g.player.power='egghead';
 g.player.ability='cooldown';g.player.cooldownMs=4000;
 g.player.x=752;g.player.y=148;update(g,1/120);
 assert.equal(g.player.power,'pirateCaptain');assert.equal(g.player.ability,'ready');
 assert.equal(g.player.cooldownMs,0);assert.equal(g.player.hits,1);
});
test('normal movement and jumping identical across all ages',()=>{
 const samples=[1,2,3].map(hits=>{
  const g=createGame();g.player.hits=hits;
  update(g,1/120,{right:true,jumpPressed:true});advance(g,.2,{right:true});
  return [g.player.x,g.player.y,g.player.vx,g.player.vy];
 });assert.deepEqual(samples[0],samples[1]);assert.deepEqual(samples[1],samples[2]);
});
test('both abilities activate at every age',()=>{
 for(const hits of [1,2,3])for(const power of ['egghead','pirateCaptain']){
  const g=createGame();g.player.hits=hits;equipPower(g,power);assert.equal(activateAbility(g),true);
 }
});
test('cannonball defeats enemy and breaks crate',()=>{
 const g=createGame();equipPower(g,'pirateCaptain');
 g.enemies=[{x:60,y:154,w:16,h:22,hp:3,min:60,max:80,dir:1}];
 g.crates=[{x:96,y:160,w:16,h:16,hp:1}];activateAbility(g);advance(g,.25);
 assert.equal(g.enemies[0].hp,0);assert.equal(g.crates[0].hp,0);assert.equal(g.defeated,1);
});
test('falls consume a stage and return to checkpoint; baby fall is death',()=>{
 const g=createGame();g.player.y=240;update(g,1/120);
 assert.equal(g.player.hits,2);assert.equal(g.player.x,24);
 g.player.hits=1;g.player.y=240;update(g,1/120);assert.equal(g.status,'dead');
});
test('finish and checkpoint are reachable states',()=>{
 const g=createGame();g.player.x=990;update(g,1/120);assert.equal(g.checkpointReached,true);
 g.player.x=1850;update(g,1/120);assert.equal(g.status,'won');
});
test('physics lands player on platforms',()=>{
 const g=createGame();g.player.y=80;g.player.vy=100;advance(g,1);
 assert.equal(g.player.y,176-CONFIG.playerH);assert.equal(g.player.grounded,true);
});

test('all ages can cross the entire course without abilities or damage',()=>{
 for(const hits of [1,2,3]){
  const g=createGame();g.player.hits=hits;
  // Isolate the terrain contract from combat: ages must not affect route clearance.
  g.enemies=[];g.pickups=[];
  for(let i=0;i<120*40&&g.status==='playing';i++){
   const p=g.player;
   const floor=[...g.platforms,...g.crates.filter(c=>c.hp>0)]
    .find(s=>Math.abs(p.y+p.h-s.y)<.5&&p.x+p.w>s.x&&p.x<s.x+s.w);
   const safeLanding=floor&&g.platforms.some(s=>s.h>8&&s.x<=floor.x+floor.w&&s.x+s.w>=floor.x+floor.w+40);
   const nearEdge=floor&&(!safeLanding||floor.h>=40)&&floor.x+floor.w-(p.x+p.w)<10;
   const nearCrate=g.crates.some(c=>c.hp>0&&c.x>=p.x+p.w&&c.x-(p.x+p.w)<28);
   const approachPlatform=g.platforms.some(s=>s.h===8&&s.x>=p.x+p.w&&s.x-(p.x+p.w)<28&&p.y+p.h-s.y>0&&p.y+p.h-s.y<=42);
   update(g,1/120,{right:true,jumpPressed:p.grounded&&(nearEdge||nearCrate||approachPlatform)});
  }
  assert.equal(g.status,'won','route completes at '+hits+' hits; stopped at x='+g.player.x);
  assert.equal(g.player.hits,hits,'route requires no damage at age '+hits);
 }
});

test('both powers can use partial charge with proportional duration at every age',()=>{
 for(const hits of [1,2,3])for(const power of ['egghead','pirateCaptain']){
  const g=createGame();g.player.hits=hits;equipPower(g,power);
  g.player.ability='cooldown';g.player.cooldownMs=2500;
  assert.equal(activateAbility(g),true);
  assert.equal(g.player.activeMs,(power==='egghead'?CONFIG.flightMs:CONFIG.chargeMs)/2);
  assert.equal(g.player.cooldownMs,0);
  assert.equal(activateAbility(g),false,'cannot restart an already active ability');
 }
});
test('empty charge blocks activation, any recovered charge permits it',()=>{
 for(const power of ['egghead','pirateCaptain']){
  const g=createGame();equipPower(g,power);
  g.player.ability='cooldown';g.player.cooldownMs=5000;
  assert.equal(activateAbility(g),false);
  update(g,1/120);
  assert.equal(activateAbility(g),true);
  assert.ok(g.player.activeMs>0);
 }
});
test('partial flight uses its shorter fuel budget and still recharges on landing',()=>{
 const g=createGame();g.enemies=[];g.pickups=[];equipPower(g,'egghead');
 g.player.ability='cooldown';g.player.cooldownMs=2500;
 g.player.y=90;g.player.grounded=false;activateAbility(g);
 advance(g,2.51,{jumpHeld:true});assert.equal(g.player.activeMs,0);
 assert.equal(g.player.ability,'active');
 for(let i=0;i<120&&g.player.ability==='active';i++)update(g,1/120);
 assert.equal(g.player.ability,'cooldown');assert.equal(g.player.cooldownMs,5000);
});
