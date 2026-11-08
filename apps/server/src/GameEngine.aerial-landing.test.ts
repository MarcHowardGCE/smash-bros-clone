import { describe, expect, it } from 'vitest';
import { GameEngine } from './GameEngine.js';
import { getMoveDataForCharacter } from '@smash/engine';
import { INPUT_BITS as B, MoveId as M, PHYSICS, getCharacterStats, type CharacterId, type GameState, type InputEvent } from '@smash/shared';

const fighters = ['all-rounder','abe-lincoln','swift','moonshine','hulk-hoagie'] as const;
const aerials = [M.NEUTRAL_AIR,M.FORWARD_AIR,M.BACK_AIR,M.UP_AIR,M.DOWN_AIR] as const;

function make(characterId:CharacterId,moveId:M,contactFrame:number){
 const engine=new GameEngine({playerIds:['a','b'],characterIds:{a:characterId}});
 const {players}=(engine as unknown as {state:GameState}).state;
 const move=getMoveDataForCharacter(characterId,moveId);
 Object.assign(players.a!,{x:640,y:499-getCharacterStats(characterId).hurtboxRadius,vx:0,vy:3,
  state:'AIR_ATTACK',stateFrame:contactFrame-1,currentMoveId:moveId,currentMove:move,
  isGrounded:false,isInvincible:false,invincibilityFrames:0,respawnTimer:0});
 players.b!.x=1050;
 return engine;
}

function step(engine:GameEngine,pressed=0,held=pressed){
 const input:InputEvent={playerId:'a',tick:0,seq:0,held,pressed,released:0};
 return engine.tickGame(new Map([['a',input]])).players.a!;
}

describe('aerial landing recovery',()=>{
 for(const fighter of fighters)for(const moveId of aerials)it(fighter+' '+moveId+' has valid early and late boundaries',()=>{
  const move=getMoveDataForCharacter(fighter,moveId),window=move.autoCancel!;
  expect(window.earlyEnd).toBeLessThanOrEqual(move.startupFrames);
  expect(window.lateStart).toBeGreaterThanOrEqual(move.startupFrames+move.activeFrames);
  for(const [age,lag] of [
   [window.earlyEnd-1,PHYSICS.AUTO_CANCEL_LANDING_FRAMES],
   [window.earlyEnd,move.landingLag],
   [window.lateStart-1,move.landingLag],
   [window.lateStart,PHYSICS.AUTO_CANCEL_LANDING_FRAMES],
  ]){
   expect(step(make(fighter,moveId,age!))).toMatchObject({isGrounded:true,state:'LANDING_LAG',landingLagFrames:lag!-1});
  }
 });
 it('shield cannot shorten regular aerial landing recovery',()=>{
  expect(step(make('all-rounder',M.DOWN_AIR,10),B.SHIELD)).toMatchObject({state:'LANDING_LAG',landingLagFrames:9});
 });
 it('keeps up-special landing recovery separate',()=>{
  expect(step(make('hulk-hoagie',M.UP_SPECIAL,8),B.SHIELD)).toMatchObject({state:'LANDING_LAG',landingLagFrames:14});
 });
 for(const [age,duration,pressAfterContact] of [[2,4,0],[10,10,6]] as const)it('fires a buffered jump on the first legal tick after '+duration+' ticks of landing recovery',()=>{
  const engine=make('all-rounder',M.DOWN_AIR,age);
  expect(step(engine,pressAfterContact===0?B.JUMP:0).landingLagFrames).toBe(duration-1);
  for(let offset=1;offset<duration;offset++){
   const p=step(engine,offset===pressAfterContact?B.JUMP:0);
   expect(p).toMatchObject({state:'LANDING_LAG',landingLagFrames:duration-1-offset});
  }
  expect(step(engine)).toMatchObject({state:'JUMPSQUAT',stateFrame:0});
 });
});


describe('aerial landing input windows', () => {
 for (const [button, action] of [[B.JUMP,'JUMPSQUAT'],[B.ATTACK,'ATTACK']] as const) {
  for (const [press, lastHeld, succeeds] of [
   [0,0,false], [1,1,true], [0,6,false], [0,7,true], [0,10,true],
  ] as const) it(action+' pressed at '+press+' and held through '+lastHeld, () => {
   const engine=make('all-rounder',M.DOWN_AIR,10);
   for (let offset=0;offset<10;offset++) {
    const player=step(engine,offset===press?button:0,offset>=press&&offset<=lastHeld?button:0);
    expect(player).toMatchObject({state:'LANDING_LAG',landingLagFrames:9-offset});
   }
   const player=step(engine,0,lastHeld===10?button:0);
   expect(player.state).toBe(succeeds?action:'IDLE');
   expect(player.actionBuffer).toBeUndefined();
   if (succeeds&&button===B.ATTACK) expect(player.currentMoveId).toBe(M.JAB);
  });
 }
});
