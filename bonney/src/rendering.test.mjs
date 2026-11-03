import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,update} from './engine.mjs';
import {districtBackground,fullDetails,fullEnemy} from './full-level-art.mjs';
import {harborBackground,guard,harborWater} from './world-art.mjs';
function recorder(){
 const log=[],c={fillStyle:'',globalAlpha:1};
 for(const key of ['save','restore','beginPath','rect','clip','moveTo','lineTo','fill','drawImage','translate','scale'])
  c[key]=(...args)=>log.push([key,...args]);
 c.fillRect=(...args)=>log.push(['fillRect',c.fillStyle,...args]);
 return {c,log};
}
test('district scenery does not pop when the player crosses a boundary',()=>{
 const g=createGame('full'),images={machine_crane:{width:256,height:240}};
 for(const boundary of [960,2176,3280,4768,5280]){
  const a=recorder(),b=recorder();g.player.x=boundary-1;districtBackground(a.c,g,boundary-100,images);
  g.player.x=boundary+1;districtBackground(b.c,g,boundary-100,images);
  assert.deepEqual(a.log,b.log,'scenery must depend on world/camera, not entered district '+boundary);
 }
});
test('panorama covers the viewport continuously at wrap and district positions',()=>{
 for(const x of [0,959,960,1919,1920,2176,3279,4768,4984,5280,6016]){
  const {c,log}=recorder(),harbor={};
  harborBackground(c,{harbor},x,0);
  const spans=log.filter(a=>a[0]==='drawImage'&&a[1]===harbor).map(a=>[a[2],a[2]+a[4]]).sort((a,b)=>a[0]-b[0]);
  let covered=0;for(const [a,b]of spans){if(a<=covered)covered=Math.max(covered,b);}
  assert.ok(spans[0][0]<=0&&covered>=384,'panorama coverage at '+x);
 }
});
test('all ground enemies stand on terrain and patrol ranges remain supported',()=>{
 const g=createGame('full');
 for(const e of g.enemies.filter(e=>e.type!=='gull')){
  const s=g.platforms.find(s=>Math.abs(e.y+e.h-s.y)<.01&&e.x>=s.x&&e.x+e.w<=s.x+s.w);
  assert.ok(s,'support under '+e.type+' at '+e.x);
  assert.ok(e.min>=s.x&&e.max+e.w<=s.x+s.w,'safe patrol range at '+e.x);
 }
 for(const e of g.enemies.filter(e=>e.type==='gull'))
  assert.ok(g.platforms.some(s=>s.kind==='perch'&&s.x<=e.x&&s.x+s.w>=e.x+e.w&&s.y===e.y+e.h));
});
test('swing hook remains attached to its pivot at a constant chain length',()=>{
 const g=createGame('full');g.enemies=[];
 for(let n=0;n<480;n++){
  update(g,1/120);
  for(const h of g.hazards.filter(h=>h.type==='hook'))
   assert.ok(Math.abs(Math.hypot(h.x-h.baseX,h.y-(h.baseY-140))-140)<.001);
 }
});
test('ship deck artwork never paints a false floor across actual gaps',()=>{
 const g=createGame('full'),{c,log}=recorder();
 const images={};for(const name of ['hook','gate','lever','bell','chest','perch','winch'])images['machine_'+name]={};
 images.tiles={};g.player.x=5800;
 fullDetails(c,images,g,5600,()=>{});
 const deck=log.filter(a=>a[0]==='fillRect'&&a[1]==='#805a3b'&&a[3]>=402);
 assert.ok(deck.length>0);
 for(const [,color,x,y,w,h]of deck)
  assert.ok(g.platforms.some(s=>s.h>8&&x+5600>=s.x&&x+5600+w<=s.x+s.w),'visible deck must match solid floor at '+x);
});

test('district artwork has no broad tint rectangles or oversized timber props',()=>{
 const g=createGame('full'),{c,log}=recorder(),crane={width:256,height:240};
 districtBackground(c,g,2300,{machine_crane:crane});
 assert.ok(!log.some(a=>a[0]==='fillRect'&&a[1].startsWith('rgba(')),'no district-wide tinted box');
 const cranes=log.filter(a=>a[0]==='drawImage'&&a[1]===crane);
 assert.equal(cranes.length,2);assert.ok(cranes.every(a=>a[5]<=100),'cranes remain prop-sized');
 const walls=log.filter(a=>a[0]==='fillRect'&&a[4]>16&&a[5]>40);
 assert.equal(walls.length,0,'no large decorative timber walls');
});


test('gantry crane and lift crank sit on its top beam',()=>{
 const g=createGame('full'),crane={width:256,height:240},winch={};
 const bg=recorder();districtBackground(bg.c,g,0,{machine_crane:crane});
 const mounted=bg.log.find(a=>a[0]==='drawImage'&&a[1]===crane);
 assert.equal(mounted[3]+mounted[5],216,'crane base meets gantry beam');
 const detail=recorder();fullDetails(detail.c,{machine_winch:winch,tiles:{}},g,0,()=>{});
 const crank=detail.log.find(a=>a[0]==='drawImage'&&a[1]===winch);
 assert.equal(crank[3]+crank[5],200,'crank base meets gantry beam');
 assert.equal(g.hazards[0].baseY-140,130,'hook pivot follows the mounted crane');
});


test('climbing moves the distant sea below the elevated route without exposing background gaps',()=>{
 const {c,log}=recorder(),harbor={width:1296};harborBackground(c,{harbor},2800,0,1,90);
 const panorama=log.filter(a=>a[0]==='drawImage'&&a.length===6);
 assert.equal(panorama.length,2);assert.ok(panorama.every(a=>a[3]===90));
 const sky=log.filter(a=>a[0]==='drawImage'&&a.length===10);
 assert.equal(sky.length,2);assert.ok(sky.every(a=>a[7]===0&&a[9]===90));
});


test('human enemy artwork is adult-sized, feet anchored and facing symmetric',()=>{
 for(const dir of [-1,1]){
  const g=createGame('full');
  for(const e of g.enemies.filter(e=>['lookout','shield'].includes(e.type))){
   e.dir=dir;const {c,log}=recorder();fullEnemy(c,{fullEnemies:{}},e,0,0);
   const draw=log.find(a=>a[0]==='drawImage'),pos=log.find(a=>a[0]==='translate');
   assert.equal(draw.at(-1),44);assert.equal(draw.at(-2),66);
   assert.equal(pos[2]+44-1,e.y+e.h);assert.equal(e.h,28);
  }
  const e=g.enemies.find(e=>e.type==='patrol');e.dir=dir;
  const {c,log}=recorder();guard(c,{guard:{}},e,0,0);
  assert.equal(log.find(a=>a[0]==='drawImage').at(-1),44);
  assert.equal(log.find(a=>a[0]==='translate')[2]+43,e.y+e.h);
 }
});


test('foreground water stays at harbor world height while the camera climbs',()=>{
 const tiles={};
 for(const cameraY of [264,224,180,80,0,-300]){
  const {c,log}=recorder(),surface=432-cameraY;harborWater(c,{tiles},0,surface);
  const draws=log.filter(a=>a[0]==='drawImage');
  if(surface>=216)assert.equal(draws.length,0,'no water overlay on elevated routes');
  else {assert.ok(draws.length>0);assert.ok(draws.every(a=>a[7]+cameraY===432),'water remains world-anchored');}
 }
 const tutorial=recorder();harborWater(tutorial.c,{tiles},0);assert.equal(tutorial.log.find(a=>a[0]==='drawImage')[7],208);
});
