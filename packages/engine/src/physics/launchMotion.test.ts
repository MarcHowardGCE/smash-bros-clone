import {describe,it,expect} from 'vitest';
import {launchContactFreezeFrames} from './launchContact.js';
import {type PlayerState,PHYSICS} from '@smash/shared';
import {initializeLaunch,applyLaunchGravity,decayLaunch,launchWorldSpeed,strongLaunchTiming} from './launchMotion.js';
import {applyMovementInput,advanceTrackedLaunch,DEFAULT_STAGE} from './index.js';
const player=()=>({id:'a',x:600,y:-1000,vx:0,vy:0,isGrounded:false,hitstunFramesRemaining:100,isFastFalling:false,characterId:'all-rounder',state:'HITSTUN'} as PlayerState);
describe('separate launch momentum and falling speed',()=>{
 it.each([[0,0],[50,6],[100,12],[200,24],[-100,-12]])('converts raw %s to world speed %s',(raw,world)=>expect(launchWorldSpeed(raw)).toBe(world));
 it('decays horizontal launch linearly with gravity stored separately',()=>{
  const initial=initializeLaunch(player(),100,0),fall=applyLaunchGravity(initial),next=decayLaunch(fall);
  expect(initial.vx).toBe(12);expect(fall.vy).toBe(PHYSICS.GRAVITY);
  expect(next.vx).toBeCloseTo(11.796);expect(next.launchFallVy).toBe(PHYSICS.GRAVITY);
  expect(initial.launchVx).toBe(12);
 });
 it('preserves the launch angle while decaying both components',()=>{
  const next=decayLaunch(initializeLaunch(player(),60,-80));
  expect(Math.hypot(next.launchVx!,next.launchVy!)).toBeCloseTo(11.796);
  expect(next.launchVy!/next.launchVx!).toBeCloseTo(-4/3);
 });
 it('never reverses or recreates exhausted launch momentum',()=>{
  let p=initializeLaunch(player(),.1,-.1);for(let i=0;i<5;i++)p=decayLaunch(p);
  expect(p.launchVx).toBe(0);expect(p.launchVy).toBe(0);
 });
 it('caps gravity alone without clipping high upward or downward launch',()=>{
  const down=applyLaunchGravity({...initializeLaunch(player(),0,300),launchFallVy:18});
  expect(down.launchFallVy).toBe(18);expect(down.vy).toBe(54);
  expect(applyLaunchGravity(initializeLaunch(player(),0,-300)).vy).toBeCloseTo(-35.35);
 });
 it('clears launch storage on landing or hitstun expiry',()=>{
  const launch=initializeLaunch(player(),100,-100);
  expect(decayLaunch({...launch,isGrounded:true}).launchVx).toBeUndefined();
  expect(decayLaunch({...launch,hitstunFramesRemaining:0}).launchVy).toBeUndefined();
 });
 it('shared movement pipeline uses the same launch/gravity step',()=>{
  const initial=initializeLaunch(player(),100,0),input={playerId:'a',tick:0,seq:0,held:0,pressed:0,released:0};
  const next=applyMovementInput(initial,input);
  expect(next.x-initial.x).toBe(12);expect(next.y-initial.y).toBeCloseTo(.65);
  expect(next.vx).toBeCloseTo(11.796);
 });
});


describe('steep upward tumble gravity',()=>{
 it.each([
  ['swift',.2688], ['moonshine',.284928], ['all-rounder',.3024],
  ['hulk-hoagie',.314496], ['abe-lincoln',.326592],
 ] as const)('uses the weight-scaled profile for %s',(characterId,gravity)=>{
  const launch=initializeLaunch({...player(),characterId,isTumbling:true,lastHitKnockbackAngle:Math.PI/2},0,-200);
  const after=applyLaunchGravity(launch);
  expect(after.launchFallVy).toBeCloseTo(gravity);
  expect(after.vy).toBeCloseTo(-24+gravity);
  expect(applyLaunchGravity({...launch,launchFallVy:7.19}).launchFallVy).toBeCloseTo(7.2);
 });
 it.each([[69,false],[70,true],[110,true],[111,false],[270,false]] as const)('checks the post-DI angle %s',(degrees,steep)=>{
  const angle=degrees*Math.PI/180;
  const launch=initializeLaunch({...player(),isTumbling:true,lastHitKnockbackAngle:angle},100*Math.cos(angle),-100*Math.sin(angle));
  expect(applyLaunchGravity(launch).launchFallVy).toBeCloseTo(steep ? .3024 : .65);
 });
 it('uses ordinary gravity for non-tumble and downward ceiling rebound',()=>{
  const launch=initializeLaunch({...player(),isTumbling:true,lastHitKnockbackAngle:Math.PI/2},0,-200);
  expect(applyLaunchGravity({...launch,isTumbling:false}).launchFallVy).toBe(PHYSICS.GRAVITY);
  expect(applyLaunchGravity({...launch,launchVy:24}).launchFallVy).toBe(PHYSICS.GRAVITY);
 });
});



describe('strong launch clock',()=>{
 it('leaves weak hits on the ordinary tick schedule',()=>{
  expect(strongLaunchTiming(30,11)).toBeUndefined();
  expect(strongLaunchTiming(80,31)).toBeUndefined();
 });
 it.each([[100,39,35],[150,59,42],[190,75,47],[200,79,49]])('compresses %s knockback from %s to %s ticks',(kb,base,real)=>{
  expect(strongLaunchTiming(kb,base)?.ticks).toBe(real);
 });
 it('advances along the ordinary trajectory, including decay and gravity',()=>{
  const playerAtContact=initializeLaunch({...player(),y:150},200,0);
  const timing=strongLaunchTiming(200,79)!;
  const accelerated=advanceTrackedLaunch({...playerAtContact,launchTiming:timing.clock},DEFAULT_STAGE);
  let ordinary=playerAtContact;
  for(let i=0;i<6;i++)ordinary=advanceTrackedLaunch(ordinary,DEFAULT_STAGE);
  expect(accelerated.x).toBeCloseTo(ordinary.x-6*.204);
  expect(accelerated.y).toBeCloseTo(ordinary.y);
  expect(accelerated.launchVx).toBeCloseTo(ordinary.launchVx!);
  expect(accelerated.launchTiming?.elapsed).toBe(6);
 });
 it('stops at the first blast-zone crossing within an accelerated tick',()=>{
  const playerAtContact=initializeLaunch({...player(),y:DEFAULT_STAGE.blastTop+5},100,-200);
  const timing=strongLaunchTiming(200,79)!;
  const accelerated=advanceTrackedLaunch({...playerAtContact,launchTiming:timing.clock},DEFAULT_STAGE);
  expect(accelerated.isKnockedOut).toBe(true);
  expect(accelerated.x-playerAtContact.x).toBeCloseTo(12-.204/Math.sqrt(5));
 });
});



it('matches the published 3.22 to 3.3 frame horizontal trajectory sample',()=>{
 const p=initializeLaunch({...player(),y:150},20/.12,0);
 const accelerated=advanceTrackedLaunch({...p,launchTiming:{strength:52.2,end:51,elapsed:0}},DEFAULT_STAGE);
 expect(accelerated.launchTiming?.elapsed).toBeCloseTo(3.22);
 expect(accelerated.launchTiming?.sampled).toBeCloseTo(3.3);
 expect(accelerated.x-p.x).toBeCloseTo(16.1328*4,8);
 expect(accelerated.launchVx).toBeCloseTo(4.8317*4,8);
});



it.each([
 ['floor',100,0],['wall',0,2],['ceiling',19.99,2],['wall',20,3],
 ['wall',59.99,8],['ceiling',60,9],['wall',199.99,29],['ceiling',200,30],['wall',300,30],
] as const)('uses the project whole-tick contact freeze for %s with %s virtual ticks',(surface,remaining,expected)=>{
 expect(launchContactFreezeFrames(surface,remaining)).toBe(expected);
});

