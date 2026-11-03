import test from 'node:test';
import assert from 'node:assert/strict';
import {characterFrame,characterSpriteKey} from './locomotion.mjs';
import {flightJetLayout} from './flight-art.mjs';
import {FLIGHT_ANCHORS} from './flight-anchors.mjs';
const p={x:0,y:0,w:16,h:28,power:'egghead',ability:'active',activeMs:4000,grounded:false,hits:3,facing:1,vx:0};
test('both heroes use dedicated four-frame flight atlases at every age',()=>{
 for(const character of ['bonney','luffy'])for(const hits of [1,2,3]){
  assert.deepEqual(Array.from({length:4},(_,i)=>characterFrame({...p,hits},0,i/8).column),[0,1,2,3]);
  assert.equal(characterSpriteKey(character,{...p,hits}),character==='luffy'?'luffy_eggheadFlight':'eggheadFlight');
  assert.equal(characterSpriteKey(character,{...p,hits,attackMs:100,attackKind:'kick'}),character==='luffy'?'luffy_eggheadAttack':'eggheadAttack');
 }
});
test('jets attach to measured soles, mirror with the character, and scale by age',()=>{
 for(const hero of ['bonney','luffy'])for(const hits of [3,2,1])for(let f=0;f<4;f++){
  const right=flightJetLayout(hero,{...p,hits},f/8,true),left=flightJetLayout(hero,{...p,hits,facing:-1},f/8,true);
  assert.equal(right.length,2);const row=3-hits;
  for(let i=0;i<2;i++){
   assert.equal(right[i].x,-8+FLIGHT_ANCHORS[hero].flight[row][f][i].x/2);assert.equal(right[i].x+left[i].x,32);
   assert.equal(right[i].y,31.5);assert.equal(right[i].row,hero==='luffy'?1:0);
  }
 }
 assert.ok(flightJetLayout('bonney',{...p,hits:1},0,true)[0].height<flightJetLayout('bonney',p,0,true)[0].height);
});
test('flames stop on release, landing, empty fuel, wrong power and inactive ability',()=>{
 for(const patch of [{grounded:true},{activeMs:0},{power:'gear'},{ability:'cooldown'}])assert.deepEqual(flightJetLayout('bonney',{...p,...patch},0,true),[]);
 assert.deepEqual(flightJetLayout('luffy',p,0,false),[]);
});
test('airborne melee uses actual attack boot anchors and every plume frame animates',()=>{
 for(const hero of ['bonney','luffy'])for(const attackKind of ['punch','kick']){
  const jets=flightJetLayout(hero,{...p,attackMs:100,attackKind},0,true);assert.ok(jets.length>=1&&jets.length<=2);
  const expected=FLIGHT_ANCHORS[hero].attack[0][attackKind==='kick'?1:0];assert.equal(jets[0].x,-8+expected[0].x/2);
 }
 assert.equal(new Set(Array.from({length:6},(_,i)=>flightJetLayout('bonney',p,i/15,true)[0].frame)).size,6);
});


test('normal melee remains available during Egghead flight without interrupting lift',async()=>{
 const {createGame,update}=await import('./engine.mjs');
 for(const kind of ['punch','kick']){
  const g=createGame('full');g.enemies=[];g.hazards=[];g.pickups=[];
  Object.assign(g.player,{x:220,y:180,grounded:false,power:'egghead',ability:'active',activeMs:3000});
  update(g,1/120,{[kind+'Pressed']:true,jumpHeld:true});
  assert.equal(g.player.attackKind,kind);assert.equal(g.player.ability,'active');assert.equal(g.player.vy,-90);assert.ok(g.player.activeMs<3000);
 }
});


test('each health stage selects its distinct flight atlas row',()=>{
 for(const [hits,row]of [[3,0],[2,1],[1,2]])for(const facing of [-1,1])for(let f=0;f<4;f++){
  const frame=characterFrame({...p,hits,facing},0,f/8);assert.equal(frame.row,row);assert.equal(frame.flip,facing<0);
 }
});
