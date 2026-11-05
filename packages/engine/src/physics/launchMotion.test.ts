import {describe,it,expect} from 'vitest';
import {type PlayerState,PHYSICS} from '@smash/shared';
import {initializeLaunch,applyLaunchGravity,decayLaunch,launchWorldSpeed} from './launchMotion.js';
import {applyMovementInput} from './index.js';
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
