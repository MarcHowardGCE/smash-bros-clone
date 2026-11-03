import { describe, expect, it } from 'vitest';
import { MoveId, PlayerStateEnum as S } from '@smash/shared';
import { getMoveDataForCharacter } from '@smash/engine';
import { selectPilotFrame } from './pilotTimeline.js';
describe('full-body pilot timing', () => {
  it('loops idle and walk from simulation frames, including repeated snapshots', () => {
    expect(selectPilotFrame(S.IDLE, 47, null)).toEqual({ clip: 'idle', index: 3 });
    expect(selectPilotFrame(S.IDLE, 48, null)).toEqual({ clip: 'idle', index: 0 });
    expect(selectPilotFrame(S.WALK, 23, null)).toEqual({ clip: 'walk', index: 5 });
    expect(selectPilotFrame(S.WALK, 24, null)).toEqual({ clip: 'walk', index: 0 });
    expect(selectPilotFrame(S.WALK, 23, null)).toEqual(selectPilotFrame(S.WALK, 23, null));
  });
  it('shows the extended punch throughout the authoritative active window only', () => {
    const move = getMoveDataForCharacter('all-rounder', MoveId.JAB);
    expect(selectPilotFrame(S.ATTACK, move.startupFrames - 1, MoveId.JAB)?.index).toBe(2);
    for (let frame = move.startupFrames; frame < move.startupFrames + move.activeFrames; frame++) {
      expect(selectPilotFrame(S.ATTACK, frame, MoveId.JAB)?.index).toBe(3);
    }
    expect(selectPilotFrame(S.ATTACK, move.startupFrames + move.activeFrames, MoveId.JAB)?.index).toBe(4);
    expect(selectPilotFrame(S.ATTACK, 999, MoveId.JAB)?.index).toBe(8);
  });
  it('uses every recovery drawing in sequence without restarting the punch', () => {
    const move=getMoveDataForCharacter('all-rounder',MoveId.JAB);
    const indices=Array.from({length:move.recoveryFrames},(_,i)=>selectPilotFrame(S.ATTACK,move.startupFrames+move.activeFrames+i,MoveId.JAB)?.index);
    expect(indices).toEqual([4,4,5,5,6,6,7,7,8,8]);
  });
  it('renders running separately and chooses jump poses from physical state', () => {
    expect(selectPilotFrame(S.RUN, 17, null)).toEqual({clip:'run',index:5});
    expect(selectPilotFrame(S.DASH, 18, null)).toEqual({clip:'dash_start',index:5});
    expect(selectPilotFrame(S.JUMPSQUAT, 0, null)).toEqual({clip:'jump_squat',index:1});
    expect(selectPilotFrame(S.AIRBORNE, 0, null, -10)).toEqual({clip:'jump',index:1});
    expect(selectPilotFrame(S.AIRBORNE, 999, null, 0)).toEqual({clip:'jump',index:2});
    expect(selectPilotFrame(S.AIRBORNE, 0, null, 8)).toEqual({clip:'jump',index:3});
    expect(selectPilotFrame(S.AIRBORNE, 0, null, -10, false)).toEqual({clip:'jump',index:4});
    expect(selectPilotFrame(S.DOUBLE_JUMP, 0, null)).toEqual({clip:'jump',index:4});
    expect(selectPilotFrame(S.LANDING_LAG, 0, null)).toEqual({clip:'jump',index:5});
    expect(selectPilotFrame(S.AIRBORNE, 0, null, NaN)).toBeNull();
  });
  it('holds guard and plays non-looping 20-tick defense phases', () => {
    expect(selectPilotFrame(S.SHIELD, 47, null)).toEqual({clip:'shield',index:3});
    expect(selectPilotFrame(S.SHIELD, 48, null)).toEqual({clip:'shield',index:0});
    for(const state of [S.ROLL,S.SPOT_DODGE]){
      const clip=state===S.ROLL?'roll':'dodge';
      expect(selectPilotFrame(state,0,null)).toEqual({clip,index:0});
      expect(selectPilotFrame(state,6,null)).toEqual({clip,index:2});
      expect(selectPilotFrame(state,19,null)).toEqual({clip,index:5});
      expect(selectPilotFrame(state,999,null)).toEqual({clip,index:5});
    }
  });
  it('distinguishes flinch, recoil, tumble and prone without looping them',()=>{
    expect(selectPilotFrame(S.HITSTUN,0,null)).toEqual({clip:'hit_mid',index:0});
    expect(selectPilotFrame(S.HITSTUN,99,null)).toEqual({clip:'hit_mid',index:3});
    expect(selectPilotFrame(S.HITSTUN,99,null,0,true,true)).toEqual({clip:'tumble',index:3});
    expect(selectPilotFrame(S.HARD_LANDING,29,null)).toEqual({clip:'prone_up',index:1});
  });
  it('aligns all three fighters kick contact drawings to their existing active windows',()=>{
    for(const character of ['all-rounder','abe-lincoln','swift'] as const)for(const moveId of [MoveId.FORWARD_TILT,MoveId.UP_TILT,MoveId.DOWN_TILT]){
      const move=getMoveDataForCharacter(character,moveId);
      const select=(frame:number)=>selectPilotFrame(S.ATTACK,frame,moveId,undefined,true,false,character);
      expect(select(0)?.index).toBe(0);expect(select(move.startupFrames-1)?.index).toBe(2);
      for(let frame=move.startupFrames;frame<move.startupFrames+move.activeFrames;frame++)expect(select(frame)?.index).toBe(3);
      expect(select(move.startupFrames+move.activeFrames)?.index).toBe(4);expect(select(999)?.index).toBe(5);
    }
  });
  it('falls back for unsupported moves, missing airborne velocity and unfinished states', () => {
    for (const state of [S.AIRBORNE]) {
      expect(selectPilotFrame(state, 0, MoveId.JAB)).toBeNull();
    }
    expect(selectPilotFrame(S.ATTACK, 0, MoveId.LEDGE_ATTACK)).toBeNull();
    expect(selectPilotFrame(S.ATTACK, 0, null)).toBeNull();
  });

  it('holds smash anticipation through charge and separates both down-smash contacts',()=>{
   for(const character of ['all-rounder','abe-lincoln','swift'] as const)for(const moveId of [MoveId.FORWARD_SMASH,MoveId.UP_SMASH,MoveId.DOWN_SMASH]){
    const data=getMoveDataForCharacter(character,moveId);
    const select=(frame:number,charge=0)=>selectPilotFrame(S.ATTACK,frame,moveId,undefined,true,false,character,charge);
    expect(select(0)?.index).toBe(0);
    for(const charge of [1,15,30,60])expect(select(charge,charge)?.index).toBe(1);
    const first=moveId===MoveId.DOWN_SMASH?2:3;
    expect(select(data.startupFrames+30,30)?.index).toBe(first);
    expect(select(data.startupFrames+30+data.activeFrames-1,30)?.index).toBe(3);
    expect(select(data.startupFrames+30+data.activeFrames,30)?.index).toBe(4);
    expect(select(999,30)?.index).toBe(5);
    expect(select(data.startupFrames,NaN)?.index).toBe(first);
   }
  });

 it('plays aerial startup, contact and recovery for all fighters and returns to landing artwork',()=>{
  for(const id of ['all-rounder','abe-lincoln','swift'] as const)for(const move of [MoveId.NEUTRAL_AIR,MoveId.FORWARD_AIR,MoveId.BACK_AIR,MoveId.UP_AIR,MoveId.DOWN_AIR]){
   const data=getMoveDataForCharacter(id,move),select=(tick:number)=>selectPilotFrame(S.AIR_ATTACK,tick,move,0,true,false,id);
   expect(select(0)?.index).toBe(0);expect(select(data.startupFrames-1)?.index).toBe(2);
   for(let t=data.startupFrames;t<data.startupFrames+data.activeFrames;t++)expect(select(t)?.index).toBe(3);
   expect(select(data.startupFrames+data.activeFrames)?.index).toBe(4);expect(select(999)?.index).toBe(5);
   expect(selectPilotFrame(S.LANDING_LAG,0,move,0,true,false,id)).toEqual({clip:'jump',index:5});
   expect(selectPilotFrame(S.ATTACK,0,move,0,true,false,id)).toBeNull();
  }
 });

 it('maps ground and air specials, including zero-active release and counter recovery',()=>{
  for(const id of ['all-rounder','abe-lincoln','swift'] as const)for(const move of [MoveId.NEUTRAL_SPECIAL,MoveId.SIDE_SPECIAL,MoveId.UP_SPECIAL,MoveId.DOWN_SPECIAL])for(const state of [S.ATTACK,S.AIR_ATTACK]){
   const data=getMoveDataForCharacter(id,move),select=(frame:number)=>selectPilotFrame(state,frame,move,0,true,false,id);
   expect(select(0)?.index).toBe(0);expect(select(data.startupFrames-1)?.index).toBe(2);
   expect(select(data.startupFrames)?.index).toBe(3);expect(select(999)?.index).toBe(5);
   expect(select(0)?.clip).not.toBe('counter_success');
  }
 });

 it('distinguishes grabber and victim and follows every grab move contact window',()=>{
  expect(selectPilotFrame(S.GRAB_HOLDING,24,null,0,true,false,'all-rounder',0,false)).toEqual({clip:'grab_hold',index:2});
  expect(selectPilotFrame(S.GRAB_HOLDING,24,null,0,true,false,'swift',0,true)).toEqual({clip:'grabbed',index:2});
  for(const id of ['all-rounder','abe-lincoln','swift']as const)for(const move of [MoveId.GRAB,MoveId.PUMMEL,MoveId.FORWARD_THROW,MoveId.BACK_THROW,MoveId.UP_THROW,MoveId.DOWN_THROW]){
   const d=getMoveDataForCharacter(id,move),select=(t:number)=>selectPilotFrame(S.ATTACK,t,move,0,true,false,id);
   expect(select(0)?.index).toBe(0);expect(select(d.startupFrames)?.index).toBe(3);expect(select(999)?.index).toBe(5);
  }
 });
});

it('matches ledge catch, hang and getup timing without looping recovery',()=>{
 expect(selectPilotFrame(S.LEDGE_HANG,0,null)).toEqual({clip:'ledge_catch',index:0});
 expect(selectPilotFrame(S.LEDGE_HANG,7,null)).toEqual({clip:'ledge_catch',index:3});
 expect(selectPilotFrame(S.LEDGE_HANG,8,null)).toEqual({clip:'ledge_hang',index:0});
 for(const[state,clip,last]of [[S.LEDGE_CLIMB,'ledge_climb',39],[S.LEDGE_ROLL,'ledge_roll',44],[S.LEDGE_JUMP,'ledge_jump',11],[S.LEDGE_ATTACK,'ledge_attack',59]]as const){expect(selectPilotFrame(state,last,null)).toEqual({clip,index:5});expect(selectPilotFrame(state,999,null)).toEqual({clip,index:5});}
 expect(selectPilotFrame(S.LEDGE_ATTACK,19,null)?.index).toBe(2);expect(selectPilotFrame(S.LEDGE_ATTACK,20,null)?.index).toBe(3);expect(selectPilotFrame(S.LEDGE_ATTACK,28,null)?.index).toBe(4);
});

it('separates missed-tech impact from prone and holds completed techs for every fighter',()=>{
 for(const id of ['all-rounder','abe-lincoln','swift'] as const){
  for(const [tick,index] of [[0,0],[1,0],[2,1],[4,2],[6,3],[9,4],[12,5],[17,5]] as const)expect(selectPilotFrame(S.HARD_LANDING,tick,null,0,true,false,id)).toEqual({clip:'knockdown_up',index});
  expect(selectPilotFrame(S.HARD_LANDING,18,null,0,true,false,id)).toEqual({clip:'prone_up',index:0});
  expect(selectPilotFrame(S.HARD_LANDING,29,null,0,true,false,id)).toEqual({clip:'prone_up',index:1});
  for(const [state,clip,last] of [[S.TECH_NEUTRAL,'tech_neutral',25],[S.TECH_ROLL,'tech_roll',39]] as const){
   expect(selectPilotFrame(state,0,null,0,true,false,id)).toEqual({clip,index:0});
   expect(selectPilotFrame(state,last,null,0,true,false,id)).toEqual({clip,index:5});
   expect(selectPilotFrame(state,999,null,0,true,false,id)).toEqual({clip,index:5});
  }
  expect(selectPilotFrame(S.HITSTUN,0,null,0,true,false,id)?.clip).toBe('hit_mid');
  expect(selectPilotFrame(S.IDLE,0,null,0,true,false,id)?.clip).toBe('idle');
 }
});

it('maps dash, takeoff, shield entry and air dodge without adding input locks',()=>{
 for(const id of ['all-rounder','abe-lincoln','swift']as const){
  const select=(s:string,t:number)=>selectPilotFrame(s,t,null,0,true,false,id);
  expect(select(S.DASH,0)).toEqual({clip:'dash_start',index:0});
  expect(select(S.DASH,14)).toEqual({clip:'dash_start',index:5});
  expect(select(S.RUN,0)).toEqual({clip:'run',index:0});
  expect([0,1,2].map(t=>select(S.JUMPSQUAT,t)?.index)).toEqual([1,3,5]);
  expect(select(S.SHIELD,5)).toEqual({clip:'shield_raise',index:5});
  expect(select(S.SHIELD,6)).toEqual({clip:'shield',index:0});
  for(const[t,index]of [[0,0],[3,1],[6,2],[10,3],[14,4],[18,5],[22,5],[999,5]]as const)expect(select(S.AIR_DODGE,t)).toEqual({clip:'air_dodge_neutral',index});
  expect(select(S.HITSTUN,0)?.clip).toBe('hit_mid');
  expect(select(S.IDLE,0)?.clip).toBe('idle');
  expect(select('CROUCH',0)).toBeNull();
 }
});

it('uses the new generic flinch and rotating tumble while leaving new mechanics unmapped',()=>{
 for(const id of ['all-rounder','abe-lincoln','swift']as const){
 for(const[t,index]of [[0,0],[3,0],[4,1],[11,2],[12,3],[999,3]]as const)expect(selectPilotFrame(S.HITSTUN,t,null,0,true,false,id)).toEqual({clip:'hit_mid',index});
 for(const[t,index]of [[0,0],[2,0],[3,1],[15,5],[18,0]]as const)expect(selectPilotFrame(S.HITSTUN,t,null,0,true,true,id)).toEqual({clip:'tumble',index});
 expect(selectPilotFrame(S.IDLE,0,null,0,true,false,id)?.clip).toBe('idle');
 expect(selectPilotFrame('DASH_ATTACK',0,null,0,true,false,id)).toBeNull();
 expect(selectPilotFrame('FOOTSTOOL',0,null,0,true,false,id)).toBeNull();
 }
});
