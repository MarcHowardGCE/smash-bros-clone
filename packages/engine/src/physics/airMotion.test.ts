import {it,expect} from 'vitest';
import {INPUT_BITS as B,getCharacterStats,getStageLayout,type PlayerState} from '@smash/shared';
import {airStats} from './airMotion.js';
import {applyFastFall,applyGravity,applyMovement,applyMovementInput,startJump} from './index.js';
const player=(id='all-rounder')=>({id:'a',characterId:id,x:600,y:0,vx:0,vy:1,isGrounded:false,isFastFalling:false,hitstunFramesRemaining:0,hasDoubleJump:true,state:'AIRBORNE'} as PlayerState);
const input=(x=0,pressed=0,held=pressed)=>({playerId:'a',tick:0,seq:0,pressed,held,released:0,stickX:x,stickY:0});
for(const id of ['all-rounder','abe-lincoln','swift']){
 it(id+' fast fall starts at its distinct speed, requires a fresh press and clears on double jump',()=>{
 const p=player(id),stats=airStats(p);
 expect(applyFastFall(p,input(0,0,B.DOWN))).toBe(p);
 expect(applyFastFall({...p,vy:-1},input(0,B.DOWN)).isFastFalling).toBe(false);
 const fall=applyFastFall(p,input(0,B.DOWN));expect(fall.vy).toBe(stats.fastFallSpeed);
 expect(applyGravity(fall).vy).toBe(stats.fastFallSpeed);expect(stats.fastFallSpeed/stats.fallSpeed).toBeCloseTo(1.6);
 const jump=startJump(fall,false);expect(jump.isFastFalling).toBe(false);expect(jump.vy).toBe(stats.doubleJumpVelocity);
 });
 it(id+' has proportional air control and bounded reversal without a velocity snap',()=>{
 let p=player(id);for(let t=0;t<100;t++)p=applyMovement(p,input(.5));
 expect(p.vx).toBeCloseTo(airStats(p).speed*.5);
 const inherited={...p,vx:10};expect(applyMovement(inherited,input(1)).vx).toBeCloseTo(10-airStats(p).acceleration);
 const reversed=applyMovement({...p,vx:5},input(-1));expect(reversed.vx).toBeCloseTo(5-airStats(p).acceleration);
 const neutral=applyMovement({...p,vx:.01},input());expect(neutral.vx).toBe(0);
 });
}
for(const stageId of ['stage1','stage2','stage3','stage4','stage5','stage6']){
 it(stageId+' catches a fast-falling fighter at the landing plane and resets fast fall',()=>{
 const stage=getStageLayout(stageId),p={...player(),x:stage.mainPlatform.x+stage.mainPlatform.width*.5,y:stage.mainPlatform.y-28-10,vy:28.8,isFastFalling:true};
 const landed=applyMovementInput(p,input(),stage);expect(landed.isGrounded).toBe(true);expect(landed.isFastFalling).toBe(false);expect(landed.vy).toBe(0);expect(landed.y).toBe(stage.mainPlatform.y-28);
 });
}
it('new air tuning does not authorize fast falling during hitstun',()=>{const p={...player(),hitstunFramesRemaining:20};expect(applyFastFall(p,input(0,B.DOWN))).toBe(p);});

