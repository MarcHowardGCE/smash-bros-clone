import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,update,activateAbility,damagePlayer,respawn} from './engine.mjs';
import {enterCloud,returnHarbor} from './cloud-level.mjs';
function launch(hits=3,charge=1,x=2992,y=116){
 const g=createGame('full');g.enemies=[];g.hazards=[];
 Object.assign(g.player,{x,y,hits,power:'egghead',grounded:true,ability:charge===1?'ready':'cooldown',cooldownMs:5000*(1-charge)});
 update(g,1/120,{jumpPressed:true,jumpHeld:true});update(g,1/120,{jumpPressed:true,jumpHeld:true});
 for(let n=0;n<610&&g.scene!=='cloud';n++)update(g,1/120,{jumpHeld:true});
 return g;
}
test('full-flight ascent from the highest crane route discovers clouds at every age',()=>{
 for(const hits of [1,2,3]){
  const g=launch(hits);assert.equal(g.scene,'cloud');assert.equal(g.skyUnlocked,true);assert.equal(g.player.hits,hits);
  assert.equal(g.width,3840);assert.equal(g.player.power,'egghead');assert.equal(g.checkpointState.y,196);
 }
});
test('partial fuel, lower launches and off-route flight cannot reveal the secret',()=>{
 assert.notEqual(launch(3,.75).scene,'cloud');assert.notEqual(launch(3,.99).scene,'cloud');assert.notEqual(launch(3,1,2992,372).scene,'cloud');
 assert.notEqual(launch(3,1,1800,116).scene,'cloud');
});
test('falling from clouds returns to the harbor without damage or lost progress',()=>{
 const g=launch();g.player.x=500;g.player.y=g.height+30;const hits=g.player.hits;update(g,1/120);
 assert.equal(g.scene,'harbor');assert.equal(g.player.hits,hits);assert.ok(g.player.x>3500);assert.equal(g.player.grounded,false);
});
test('cloud flag has its own completion and future entry, without unlocking harbor gates',()=>{
 const g=launch();g.latches.reactorSeal=true;g.latches.skyConsole=true;g.player.x=3750;g.player.y=292;update(g,1/120);
 assert.equal(g.scene,'cloud');assert.equal(g.status,'won');assert.equal(g.cloudCompleted,true);assert.equal(g.nextLevelEntry.entry,'sky-observatory');
 returnHarbor(g,{completed:true});assert.equal(g.latches.customsLock,undefined);assert.ok(g.player.x+g.player.w<=g.gates[0].x);
});
test('return transport preserves harbor puzzles, rewards, enemies and cloud progress',()=>{
 const g=createGame('full');g.latches.customsLock=true;g.treasures[0].collected=true;g.coinsList[0].collected=true;g.enemies[0].hp=0;
 const harborEnemies=g.enemies;enterCloud(g);g.coinsList[0].collected=true;g.treasures[0].collected=true;
 Object.assign(g.player,{x:104,y:196,grounded:true});update(g,1/120,{interactPressed:true});
 assert.equal(g.scene,'harbor');assert.equal(g.enemies,harborEnemies);assert.equal(g.enemies[0].hp,0);assert.equal(g.latches.customsLock,true);
 assert.equal(g.treasures[0].collected,true);assert.equal(g.coinsList[0].collected,true);assert.equal(g.skyChartCollected,true);
 enterCloud(g);assert.equal(g.coinsList[0].collected,true);assert.equal(g.treasures[0].collected,true);
 returnHarbor(g);assert.equal(g.player.y,116);
});
