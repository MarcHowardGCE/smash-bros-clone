import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from './engine.mjs';
import {cameraTarget} from './market-scene.mjs';
test('market rewards leave enemy cue and patrol lanes clear',()=>{
 const g=createGame('full'),coins=g.coinsList.filter(c=>c.x<960);
 assert.equal(coins.length,11);
 for(const e of g.enemies.filter(e=>e.x<960))for(const c of coins)
  assert.ok(c.x+c.w<e.min-20||c.x>e.max+20,'coin overlaps encounter lane at '+e.x);
 assert.equal(g.pickups.filter(p=>p.x<960).length,2,'required outfits remain available');
});
test('market framing gives grounded play room and blends into the rest of the route',()=>{
 const g=createGame('full');g.player.x=80;g.player.y=372;
 assert.equal(cameraTarget(g),148);
 g.player.y=100;assert.equal(cameraTarget(g),116);
 g.player.y=372;g.player.x=2256;assert.equal(cameraTarget(g),148);
 g.player.x=959;const a=cameraTarget(g);g.player.x=961;assert.ok(Math.abs(cameraTarget(g)-a)<1);
 assert.equal(cameraTarget(createGame()),116);
});

test('market and warehouse facades share the actual quay baseline',async()=>{
 const {marketBackdrop}=await import('./market-scene.mjs'),calls=[];
 const images={marketFish:{},marketSupply:{},warehouseWide:{},warehouseAnnex:{}};
 marketBackdrop({drawImage:(...args)=>calls.push(args)},images,0);
 assert.equal(calls.length,5);
 for(const [,x,y,w,h]of calls)assert.equal(y+h,400,'building foundation meets ground');
});
test('warehouse coin trails avoid ground and rooftop enemy cue lanes',()=>{
 const g=createGame('full'),coins=g.coinsList.filter(c=>c.x>=960&&c.x<2176);
 assert.equal(coins.length,14);
 for(const e of g.enemies.filter(e=>e.x>=960&&e.x<2176))for(const c of coins)
  assert.ok(c.x+c.w<e.min-20||c.x>e.max+20,'warehouse coin overlaps enemy cue at '+e.x);
});

test('curated decorative props sit on the quay without floating',async()=>{
 const {marketProps}=await import('./market-scene.mjs'),calls=[];
 marketProps({drawImage:(...a)=>calls.push(a)},{prop_lantern:{},prop_barrel:{},prop_rope:{}},0);
 assert.equal(calls.length,8);
 for(const [,x,y,w,h]of calls)assert.equal(y+h,400,'prop grounded at '+x);
});
