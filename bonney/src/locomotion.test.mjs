import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceWalkDistance,characterFrame,STRIDE_PIXELS} from './locomotion.mjs';
const player={hits:3,grounded:true,vx:105,x:10,facing:1,ability:'ready',power:'egghead'};
test('six distinct frames occur per complete stride in either direction',()=>{
 for(const facing of [1,-1]){
  const p={...player,facing,vx:105*facing};
  const frames=Array.from({length:6},(_,i)=>characterFrame(p,i*7));
  assert.deepEqual(frames.map(f=>f.column),[0,1,2,3,4,5]);
  assert.ok(frames.every(f=>f.source==='walk'&&f.flip===(facing===-1)));
 }
});
test('cadence follows distance and ignores elapsed idle time',()=>{
 let distance=0;
 const p={...player};
 for(let n=0;n<8;n++){const previousX=p.x;p.x+=.875;distance=advanceWalkDistance(distance,previousX,p);}
 assert.equal(distance,7);assert.equal(characterFrame(p,distance).column,1);
 assert.equal(advanceWalkDistance(distance,p.x,{...p,vx:0}),0);
 assert.equal(characterFrame({...p,vx:0},distance).source,'poses');
});
test('airborne pose, age rows, and teleport resets',()=>{
 assert.equal(characterFrame({...player,grounded:false},21).column,3);
 assert.equal(characterFrame({...player,grounded:false},21).source,'poses');
 assert.deepEqual([3,2,1].map(hits=>characterFrame({...player,hits},0).row),[0,1,2]);
 assert.equal(advanceWalkDistance(20,10,{...player,x:984}),0);
 assert.equal(advanceWalkDistance(20,10,{...player,x:11,ability:'active',power:'pirateCaptain'}),0);
 assert.equal(advanceWalkDistance(STRIDE_PIXELS-1,10,{...player,x:11}),0);
});
