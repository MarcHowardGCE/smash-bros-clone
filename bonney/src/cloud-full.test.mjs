import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,update,respawn,activateAbility} from './engine.mjs';
import {enterCloud,returnHarbor} from './cloud-level.mjs';
import {CLOUD_BUILDINGS} from './cloud-data.mjs';
import {gateClosed} from './encounters.mjs';
const tick=(g,n,input={})=>{for(let i=0;i<n;i++)update(g,1/120,input);};
const cloud=()=>{const g=createGame('full');enterCloud(g);return g;};
test('full cloud course has its own enemies, four districts, roofs and allowed powers only',()=>{
 const g=cloud();assert.equal(g.width,3840);assert.equal(g.zones.length,4);assert.equal(g.checkpoints.length,4);assert.equal(g.treasures.length,3);
 assert.deepEqual([...new Set(g.pickups.map(p=>p.power))].sort(),['egghead','gear']);assert.ok(g.enemies.every(e=>e.skin==='cloud'));
 assert.equal(new Set(g.enemies.map(e=>e.type)).size,3);
 for(const b of CLOUD_BUILDINGS){assert.ok(g.platforms.some(s=>s.kind==='skyRoof'&&s.building===b.key&&s.y===b.bottom-b.h));
  assert.ok(g.platforms.some(s=>s.h>8&&s.x<=b.x&&s.x+s.w>=b.x+b.w&&s.y===b.bottom));
  for(const s of g.platforms.filter(s=>s.oneWay&&s.kind!=='skyRoof'))assert.ok(!(s.x<b.x+b.w&&s.x+s.w>b.x&&s.y>b.bottom-b.h&&s.y<b.bottom),'facade overlap '+b.key);
 }
});
test('cloud energy gate needs Gear casing break and Egghead console together',()=>{
 const g=cloud();g.enemies=[];g.hazards=[];const gate=g.gates[0];
 Object.assign(g.player,{x:2336,y:292,power:'gear',grounded:true});tick(g,90,{punchHeld:true});update(g,1/120);tick(g,35);assert.equal(g.latches.reactorSeal,true);assert.equal(gateClosed(g,gate),true);
 Object.assign(g.player,{x:2560,y:196,power:'gear',grounded:false});update(g,1/120,{interactPressed:true});assert.ok(!g.latches.skyConsole);
 g.player.power='egghead';update(g,1/120,{interactPressed:true});assert.equal(g.latches.skyConsole,true);assert.equal(gateClosed(g,gate),false);
});
test('unpowered and both cloud forms can cross every main-route gap at every age',()=>{
 for(const power of ['none','gear','egghead'])for(const hits of [1,2,3]){
  const g=cloud();g.enemies=[];g.hazards=[];g.pickups=[];g.crates=[];g.gates=[];g.food=[];
  const ground=g.platforms.filter(s=>s.kind==='cloud'&&(s.h>8||s.x===464)).sort((a,b)=>a.x-b.x);
  for(let i=0;i<ground.length-1;i++){
   const from=ground[i],to=ground[i+1],target=to.x+36;
   Object.assign(g.player,{x:from.x+from.w-30,y:from.y-28,power,hits,grounded:true,vy:0,ability:'ready',cooldownMs:0,activeMs:0,airJumpUsed:false});
   update(g,1/120,{jumpPressed:true,right:true,runHeld:true});tick(g,12,{right:true,runHeld:true});
   update(g,1/120,{jumpPressed:true,right:true,runHeld:true,jumpHeld:true});
   for(let n=0;n<150&&g.player.x<target;n++)update(g,1/120,{right:true,runHeld:true,jumpHeld:true});
   tick(g,160);assert.equal(g.scene,'cloud',power+' gap '+i);assert.equal(g.player.hits,hits);assert.equal(g.player.grounded,true);
  }
 }
});
test('fading clouds disappear after a warning and reform; updrafts lift without damage',()=>{
 const g=cloud();g.enemies=[];g.hazards=[];g.pickups=[];const s=g.platforms.find(s=>s.kind==='fading');
 Object.assign(g.player,{x:s.x+8,y:s.y-28,grounded:true});tick(g,82);assert.ok(s.fadeMs>0);
 Object.assign(g.player,{x:48,y:196,grounded:true});tick(g,210);assert.equal(s.fadeMs,0);
 const h=cloud();h.enemies=[];h.pickups=[];Object.assign(h.player,{x:1400,y:240,vy:100,grounded:false});update(h,1/120);assert.ok(h.player.vy<0);assert.equal(h.player.hits,3);
});
test('cloud checkpoint retry preserves its puzzle and treasures, without changing harbor state',()=>{
 const g=cloud();g.latches.reactorSeal=true;g.latches.skyConsole=true;g.treasures[0].collected=true;
 Object.assign(g.player,{x:2950,y:292});update(g,1/120);assert.equal(g.checkpointIndex,3);
 g.status='dead';respawn(g);assert.equal(g.scene,'cloud');assert.equal(g.player.x,2944);assert.equal(g.player.power,'gear');assert.equal(g.treasures[0].collected,true);assert.equal(g.latches.skyConsole,true);
 returnHarbor(g,{fall:true});assert.equal(g.scene,'harbor');assert.ok(!g.latches.skyConsole);
});
test('cloud flag cannot complete while the research gate is locked or while flying far above it',()=>{
 const g=cloud();g.enemies=[];g.hazards=[];Object.assign(g.player,{x:3750,y:292});update(g,1/120);assert.equal(g.status,'playing');
 g.latches.reactorSeal=true;g.latches.skyConsole=true;g.player.y=0;update(g,1/120);assert.equal(g.status,'playing');
 g.player.y=292;update(g,1/120);assert.equal(g.status,'won');assert.equal(g.nextLevelEntry.route,'cloud');assert.equal(g.nextLevelEntry.entry,'sky-observatory');
});


test('cloud pickups, snacks and grounded robots are supported and robot ranges stay on terrain',()=>{
 const g=cloud();
 for(const p of [...g.pickups,...g.food])assert.ok(g.platforms.some(s=>p.x>=s.x&&p.x+p.w<=s.x+s.w&&p.y+p.h<=s.y&&s.y-p.y-p.h<=(p.requiresJump?40:12)),'item support '+p.x);
 for(const e of g.enemies.filter(e=>e.type!=='lookout')){
  const s=g.platforms.find(s=>e.x>=s.x&&e.x+e.w<=s.x+s.w&&Math.abs(e.y+e.h-s.y)<.01);
  assert.ok(s,'robot support '+e.x);assert.ok(e.min>=s.x&&e.max+e.w<=s.x+s.w,'robot patrol bounds');
 }
});


test('harbor and cloud flags reserve different next-level starting areas',()=>{
 const g=cloud();g.enemies=[];g.hazards=[];g.latches.reactorSeal=true;g.latches.skyConsole=true;
 Object.assign(g.player,{x:3750,y:292});update(g,1/120);const skyEntry={...g.nextLevelEntry};
 returnHarbor(g,{completed:true});assert.equal(g.status,'playing');g.enemies=[];g.hazards=[];
 Object.assign(g.latches,{customsLock:true,customsLever:true,winch:true,rigging:true});Object.assign(g.player,{x:6336,y:372});update(g,1/120);
 assert.equal(g.status,'won');assert.equal(g.nextLevelEntry.entry,'harbor-quay');assert.notEqual(g.nextLevelEntry.entry,skyEntry.entry);assert.equal(skyEntry.entry,'sky-observatory');
});


test('cloud power supplies are sparse and mandatory puzzle outfits can restock',()=>{
 const g=cloud();assert.equal(g.pickups.length,6);
 for(const power of ['gear','egghead'])assert.ok(g.pickups.some(p=>p.power===power&&p.x>=2000&&p.x<=2420&&p.restockMs===4000));
 assert.ok(!g.enemies.some(e=>e.x>2370&&e.x<2480),'console supply breathing room');
 assert.ok(g.enemies.some(e=>e.type==='shield'&&e.y+e.h===320&&e.x>3600),'final encounter protects flag route');
});


test('arrival Gear pickup is a deliberate jump choice rather than a forced costume swap',()=>{
 const g=cloud();g.enemies=[];g.hazards=[];Object.assign(g.player,{x:176,y:196,grounded:true});update(g,1/120);
 assert.equal(g.player.power,'egghead');update(g,1/120,{jumpPressed:true});tick(g,10);assert.equal(g.player.power,'gear');
});
