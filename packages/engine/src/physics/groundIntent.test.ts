import {describe,it,expect} from 'vitest';
import {createFSM} from '../fsm/index.js';
import {applyMovement} from './index.js';
import {GROUND_INPUT,updateGroundIntent,wantsGroundDash} from './groundIntent.js';
import {type PlayerState,type InputEvent,PlayerStateEnum,INPUT_BITS as B,getCharacterStats} from '@smash/shared';
const player=(characterId='all-rounder')=>({id:'a',characterId,x:0,y:472,vx:0,vy:0,state:PlayerStateEnum.IDLE,stateFrame:0,isGrounded:true,hitlagFramesRemaining:0,hitstunFramesRemaining:0} as PlayerState);
const input=(x:number):InputEvent=>({playerId:'a',tick:0,seq:0,held:x>=.5?B.RIGHT:x<=-.5?B.LEFT:0,pressed:0,released:0,stickX:x,stickY:0});
function sequence(xs:number[],id='all-rounder'){let p=player(id);const f=createFSM();const states:string[]=[];for(const x of xs){p=applyMovement(f.tick(p,input(x)),input(x));states.push(p.state);}return{p,states};}
describe('analog walking and dash separation',()=>{
 it('sustains gentle walking below digital direction threshold',()=>{const {p,states}=sequence(Array(40).fill(.3));expect(states.every(s=>s==='WALK')).toBe(true);expect(p.vx).toBeCloseTo(1.3125);});
 it('gradual full tilt stays walking instead of auto-dashing',()=>{const {p}=sequence([...Array(10).fill(.3),...Array(10).fill(.6),...Array(20).fill(1)]);expect(p.state).toBe('WALK');expect(p.vx).toBe(3.5);});
 it('fast full tilt enters dash then run',()=>{const {p,states}=sequence(Array(25).fill(1));expect(states.slice(0,10)).toEqual(Array(10).fill('DASH'));expect(states[10]).toBe('RUN');expect(p.state).toBe('RUN');expect(p.vx).toBe(6.5);});
 it('easing the stick out of run returns to proportional walking',()=>{const {p}=sequence([...Array(25).fill(1),...Array(15).fill(.4)]);expect(p.state).toBe('WALK');expect(p.vx).toBeCloseTo(1.75);});
 it('neutral rearms the flick window and release brakes',()=>{const {p}=sequence([...Array(15).fill(.4),0,1,1]);expect(p.state).toBe('DASH');const neutral=sequence([...Array(25).fill(1),...Array(20).fill(0)]).p;expect(neutral.state).toBe('IDLE');expect(Math.abs(neutral.vx)).toBeLessThan(.01);});
 it('mirrors walking and reversal to the left',()=>{const left=sequence(Array(30).fill(-.3)).p,right=sequence(Array(30).fill(.3)).p;expect(left.vx).toBeCloseTo(-right.vx);expect(left.x).toBeCloseTo(-right.x);});
 it.each(['all-rounder','abe-lincoln','swift'])('uses %s walk and run stats',(id)=>{const stats=getCharacterStats(id as any);expect(sequence(Array(25).fill(.4),id).p.vx).toBeCloseTo(stats.walkSpeed*.5);expect(sequence(Array(25).fill(1),id).p.vx).toBeCloseTo(stats.runSpeed);});
 it('keeps keyboard dash progression and full speed',()=>{let p=player();const f=createFSM(),i={playerId:'a',tick:0,seq:0,held:B.RIGHT,pressed:0,released:0};for(let t=0;t<25;t++)p=applyMovement(f.tick(p,i),i);expect(p.state).toBe('RUN');expect(p.vx).toBe(6.5);});
 it('ignores drift and cannot dash from a stale slow-tilt window',()=>{expect(sequence(Array(20).fill(.1)).p.x).toBe(0);let p=player();for(let t=0;t<10;t++)p=updateGroundIntent(p,input(.4));p=updateGroundIntent(p,input(1));expect(wantsGroundDash(p,input(1))).toBe(false);expect(GROUND_INPUT.FLICK_WINDOW).toBe(1);});
 it('walk still permits jump and attacks',()=>{for(const bit of[B.JUMP,B.ATTACK]){const f=createFSM();let p=f.tick(player(),input(.4));p=f.tick(p,{...input(.4),pressed:bit,held:bit});expect(p.state).toBe(bit===B.JUMP?'JUMPSQUAT':'ATTACK');}});
});

it('only the first two analog samples can start a dash from the same walking tilt',()=>{
 for(const direction of [1,-1]){
  expect(sequence([.5*direction,direction]).states).toEqual(['WALK','DASH']);
  expect(sequence([.5*direction,.5*direction,direction]).states).toEqual(['WALK','WALK','WALK']);
 }
});
