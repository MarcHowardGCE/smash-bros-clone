import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,update,equipPower,activateAbility} from './engine.mjs';
import {enterCloud,returnHarbor} from './cloud-level.mjs';
const tick=(g,n,input={})=>{for(let i=0;i<n;i++)update(g,1/120,input);};
function arena(power='none',hits=3,dir=1,type='patrol'){
 const g=createGame('full');g.platforms=[{x:0,y:400,w:1500,h:80}];g.gates=[];g.crates=[];g.hazards=[];g.pickups=[];g.movers=[];
 Object.assign(g.player,{x:100,y:372,power,hits,facing:dir,grounded:true});
 const x=dir>0?126:74;
 g.enemies=[{x,y:372,w:16,h:28,hp:3,maxHp:3,type,dir:-dir,min:x,max:x,homeX:x,homeY:372,state:'guard',timer:0}];return g;
}
test('punch and kick work in every outfit, age and facing without repeated frame damage',()=>{
 for(const power of ['none','egghead','pirateCaptain','gear'])for(const hits of [1,2,3])for(const dir of [-1,1])for(const kind of ['punch','kick']){
  const g=arena(power,hits,dir);if(kind==='punch'&&power==='gear'){update(g,1/120,{punchHeld:true});update(g,1/120);}
  else update(g,1/120,{[kind+'Pressed']:true});
  tick(g,23);assert.equal(g.enemies[0].hp,2,power+' '+kind+' '+dir);assert.equal(g.player.hits,hits);
  tick(g,30);assert.equal(g.enemies[0].hp,2,'one hit per attack');
 }
});
test('shield front blocks normal strikes while recovery exposes it',()=>{
 for(const kind of ['punch','kick']){
  const g=arena('none',3,1,'shield');update(g,1/120,{[kind+'Pressed']:true});tick(g,20);assert.equal(g.enemies[0].hp,3);
  g.enemies[0].state='recover';g.enemies[0].timer=2.3;tick(g,40);
  g.enemies[0].timer=2.3;update(g,1/120,{[kind+'Pressed']:true});tick(g,20);assert.equal(g.enemies[0].hp,2);
 }
});
test('Gear charged punch breaks front shields, hits multiple enemies and lunges a bounded distance',()=>{
 const g=arena('gear',3,1,'shield');g.enemies.push({...g.enemies[0],x:164,min:164,max:164,type:'patrol'});
 tick(g,90,{punchHeld:true});assert.ok(g.player.chargingPunch);assert.equal(g.enemies[0].hp,3);
 update(g,1/120);assert.equal(g.player.attackKind,'charged');tick(g,33);
 assert.ok(g.enemies.every(e=>e.hp===0));assert.equal(g.defeated,2);assert.ok(g.player.x>150&&g.player.x<185);assert.equal(g.player.ability,'cooldown');
});
test('early punch release is normal, partial energy shortens lunge, and empty energy cannot charge-lunge',()=>{
 const normal=arena('gear');tick(normal,10,{punchHeld:true});update(normal,1/120);assert.equal(normal.player.attackKind,'punch');
 const lengths=[];
 for(const cooldownMs of [0,2500]){
  const g=arena('gear');g.enemies=[];tick(g,90,{punchHeld:true});Object.assign(g.player,{ability:cooldownMs?'cooldown':'ready',cooldownMs});
  update(g,1/120);lengths.push(g.player.attackMs);
 }
 assert.ok(lengths[0]>lengths[1]*1.9);
 const empty=arena('gear');tick(empty,90,{punchHeld:true});Object.assign(empty.player,{ability:'cooldown',cooldownMs:5000});update(empty,0);assert.equal(empty.player.attackKind,'punch');
});
test('Gear multiplier is exactly 1.5 for walk/run at every age',()=>{
 for(const hits of [1,2,3])for(const runHeld of [false,true]){
  const g=arena('gear',hits);g.enemies=[];update(g,1/120,{right:true,runHeld});assert.equal(g.player.vx,(runHeld?168:105)*1.5);
 }
});
test('Gear grants exactly one spinning second jump per airtime and resets on landing',()=>{
 const g=arena('gear');g.enemies=[];update(g,1/120,{jumpPressed:true});tick(g,15);
 update(g,1/120,{jumpPressed:true});assert.ok(g.player.spinMs>0);assert.equal(g.player.airJumpUsed,true);
 tick(g,15);const before=g.player.vy;update(g,1/120,{jumpPressed:true});assert.ok(g.player.vy>before,'third jump is rejected');
 tick(g,160);assert.equal(g.player.grounded,true);assert.equal(g.player.airJumpUsed,false);assert.equal(g.player.spinMs,0);
});
test('charged punches respect solid walls and locked crate prerequisites',()=>{
 const g=arena('gear');g.enemies=[];g.platforms.push({x:132,y:330,w:16,h:70});
 tick(g,90,{punchHeld:true});update(g,1/120);tick(g,40);assert.ok(g.player.x+g.player.w<=132);
 const h=arena('gear');h.enemies=[];h.crates=[{x:126,y:372,w:16,h:28,hp:1,requires:'bell'}];tick(h,90,{punchHeld:true});update(h,1/120);tick(h,35);assert.equal(h.crates[0].hp,1);
});
test('cloud pickup equips Gear, replaces powers, and survives a harbor drop',()=>{
 const g=createGame('full');enterCloud(g);Object.assign(g.player,{x:176,y:164});update(g,1/120);
 assert.equal(g.player.power,'gear');assert.equal(g.checkpointState.power,'gear');assert.equal(g.gearUnlocked,true);
 returnHarbor(g,{fall:true});assert.equal(g.player.power,'gear');
 equipPower(g,'egghead');assert.equal(g.player.attackMs,0);assert.equal(g.player.power,'egghead');
});


test('a quick Gear punch tap between simulation ticks is not lost',()=>{
 const g=arena('gear');update(g,1/120,{punchPressed:true,punchHeld:false});tick(g,20);assert.equal(g.enemies[0].hp,2);
});
