import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { Texture } from 'pixi.js';
import { getCharacterStats, MoveId } from '@smash/shared';
import { getMoveDataForCharacter } from '@smash/engine';
import { FullBodyPilot } from './FullBodyPilot.js';

it('finishes a grab escape once when the victim lands during the cue', () => {
  const frame = { root: [0, 0], texture: Texture.EMPTY, offsetY: 0 };
  const clip = { scale: 1, frames: [frame] };
  const pilot = new FullBodyPilot({ characters: {
    'all-rounder': { idle: clip, grabbed: clip, grab_release: clip },
  } });
  pilot.update('GRAB_HOLDING', 8, null, true, 0, true, false, 1, 0, true);
  pilot.update('AIRBORNE', 0, null, true, 0, true, false, 1, 0, false, 1, 1, undefined, null, {
    artCue: 'grab_escape', artCueFrame: 0,
  });
  expect(pilot.sprite.label).toBe('grab_release');
  pilot.update('IDLE', 0, null, true, 0, true, false, 1, 0, false, 1, 1, undefined, null, {
    artCue: 'grab_escape', artCueFrame: 11,
  });
  expect(pilot.sprite.label).toBe('grab_release');
  pilot.update('IDLE', 1, null, true);
  expect(pilot.sprite.label).toBe('idle');
});

describe('throw release contact', () => {
  it.each(['all-rounder', 'moonshine'] as const)('shows the %s release drawing when a confirmed throw skips to recovery', (id) => {
    const move = MoveId.UP_THROW;
    const { startupFrames, activeFrames } = getMoveDataForCharacter(id, move);
    const recovery = startupFrames + activeFrames;
    const pilot = new FullBodyPilot({
      characters: {
        [id]: {
          up_throw: {
            scale: 1, durations: [6, 5, 9], activeWindow: [6, 11],
            frames: [0, 1, 2].map(i => ({ root: [i, 0], texture: Texture.EMPTY, offsetY: 0 })),
          },
        },
      },
    }, id, id === 'moonshine' ? id : undefined);
    pilot.update('ATTACK', recovery, move, true);
    expect(pilot.sprite.pivot.x).toBe(2);
    pilot.startThrowRelease(move);
    pilot.update('ATTACK', recovery, move, true);
    expect(pilot.sprite.pivot.x).toBe(1);
    pilot.update('ATTACK', recovery, move, true);
    expect(pilot.sprite.pivot.x).toBe(1);
    pilot.update('ATTACK', recovery + 2, move, true);
    expect(pilot.sprite.pivot.x).toBe(2);
  });

  it.each([
    ['all-rounder', 'moonshine'],
    ['moonshine', 'hulk-hoagie'],
    ['hulk-hoagie', 'moonshine'],
  ] as const)('pairs %s and %s at their rendered release positions without a preceding hold', (ownerId, victimId) => {
    const ownerArt = ownerId === 'all-rounder' ? undefined : ownerId;
    const victimOffset = getCharacterStats(victimId).hurtboxRadius;
    const hand = { root: [2, 4], texture: Texture.EMPTY, offsetY: 12, sockets: { grabGrip: [22, -36] } };
    const torso = {
      root: [4, 6], texture: Texture.EMPTY, offsetY: victimOffset, mirrorSource: true,
      sockets: { gripTop: [10, -14], gripBottom: [14, 6] },
    };
    const receiver = { scale: 1, frames: [torso, torso, torso] };
    const pilot = new FullBodyPilot({ characters: {
      [ownerId]: { back_throw: { scale: 0.5, durations: [6, 5], activeWindow: [6, 11], frames: [hand, hand] } },
      [victimId]: { throw_victim: receiver, back_throw_victim_preview: receiver },
    } }, victimId, victimId);
    pilot.startGrabReaction(MoveId.BACK_THROW, -1, 'thrower');
    const owner = { artId: ownerArt, characterId: ownerId, state: 'ATTACK', frame: 16,
      move: MoveId.BACK_THROW, dx: 31, dy: 5, facing: -1 as const };
    pilot.update('HITSTUN', 2, null, true, 0, true, false, 1, 0, false, 1, 1, owner);
    expect(pilot.throwOwnerId).toBe('thrower');
    expect(pilot.sprite.label).toBe('throw_victim');
    expect([pilot.sprite.position.x, pilot.sprite.position.y]).toEqual([13, -3]);
    pilot.update('HITSTUN', 8, null, true);
    expect(pilot.sprite.position.x).toBe(6.5);
  });

  it.each([1, -1] as const)('uses the release hand after the windup in facing %s', (facing) => {
    const frame = (sockets: Record<string, number[]>) => ({
      root: [0, 0], texture: Texture.EMPTY, offsetY: 0, sockets,
    });
    const victim = frame({ gripTop: [0, -20], gripBottom: [0, 0] });
    const windup = frame({ grabGrip: [20, -10] });
    const release = frame({ grabGrip: [-8, -40] });
    const pilot = new FullBodyPilot({
      characters: {
        swift: {
          grabbed: { scale: 1, frames: [victim] },
          throw_victim: { scale: 1, frames: [victim, victim, victim] },
        },
        moonshine: {
          grab_hold: { scale: 1, frames: [windup] },
          up_throw: { scale: 1, durations: [6, 5], activeWindow: [6, 11], frames: [windup, release] },
        },
      },
    }, 'swift');
    pilot.update('GRAB_HOLDING', 0, null, true, 0, true, false, 1, 0, true, 1, facing, {
      artId: 'moonshine', characterId: 'moonshine', state: 'GRAB_HOLDING',
      frame: 0, move: null, dx: 40, dy: 0, facing,
    });
    pilot.startGrabReaction(MoveId.UP_THROW, facing);
    pilot.update('HITSTUN', 0, null, true, 0, true, false, 1, 0, false, 1, facing);
    expect(pilot.sprite.label).toBe('throw_victim');
    expect([pilot.sprite.position.x, pilot.sprite.position.y]).toEqual([-48, -30]);
  });
});

it('aligns Pack 03 packed throw releases across all ordered pairings and facings', () => {
  const directory = dirname(fileURLToPath(import.meta.url));
  const manifest = JSON.parse(readFileSync(resolve(directory, '../../../public/fighter-art-pack-03-v1/manifest.json'), 'utf8'));
  const fighters = ['mr-wrong', 'loopy', 'mrs-tasselbottom'] as const;
  const moves = [
    [MoveId.FORWARD_THROW, 'forward_throw', 'throw_victim'],
    [MoveId.BACK_THROW, 'back_throw', 'back_throw_victim_preview'],
    [MoveId.UP_THROW, 'up_throw', 'up_throw_victim_preview'],
    [MoveId.DOWN_THROW, 'down_throw', 'down_throw_victim_preview'],
  ] as const;
  const characters = Object.fromEntries(fighters.map(id => [id,
    Object.fromEntries(Object.entries(manifest.characters[id].clips).map(([name, value]) => {
      const clip = value as { frames: { root: number[]; sockets?: Record<string, number[]> }[] };
      return [name, { ...clip, frames: clip.frames.map(frame => ({
        ...frame, texture: Texture.EMPTY, offsetY: getCharacterStats(id).hurtboxRadius,
      })) }];
    })),
  ]));
  for (const ownerId of fighters) for (const victimId of fighters) {
    for (const [move, attackerClip, victimClip] of moves) for (const facing of [1, -1] as const) {
      const attacker = new FullBodyPilot({ characters }, ownerId, ownerId);
      const victim = new FullBodyPilot({ characters }, victimId, victimId);
      const age = getMoveDataForCharacter(ownerId, move).startupFrames + 1;
      const dx = 40;
      const dy = getCharacterStats(ownerId).hurtboxRadius - getCharacterStats(victimId).hurtboxRadius;
      attacker.startThrowRelease(move);
      victim.startGrabReaction(move, facing, 'thrower');
      attacker.update('ATTACK', age, move, true, 0, true, false, 1, 0, false, 1, facing);
      victim.update('HITSTUN', 0, null, true, 0, true, false, 1, 0, false, 1, facing, {
        artId: ownerId, characterId: ownerId, state: 'ATTACK', frame: age, move, dx, dy, facing,
      });
      expect(attacker.sprite.label).toBe(attackerClip);
      expect(victim.sprite.label).toBe('throw_victim');
      const hand = characters[ownerId]![attackerClip]!.frames[2]!.sockets!.grabGrip!;
      const torso = characters[victimId]![victimClip]!.frames[0]!.sockets!.gripTop!;
      expect(dx * facing + facing * (victim.sprite.x + (torso[0]! - victim.sprite.pivot.x) * victim.sprite.scale.x))
        .toBeCloseTo(facing * (attacker.sprite.x + (hand[0]! - attacker.sprite.pivot.x) * attacker.sprite.scale.x));
      expect(dy + victim.sprite.y + (torso[1]! - victim.sprite.pivot.y) * victim.sprite.scale.y)
        .toBeCloseTo(attacker.sprite.y + (hand[1]! - attacker.sprite.pivot.y) * attacker.sprite.scale.y);
    }
  }
});
it('reconstructs Pack 04 release contact independently of the last rendered held pose',()=>{
 const characters:Record<string,any>={};for(const file of ['fighter-art-pilot-v1/production/manifest.json','fighter-art-newcomers-v1/dojo/manifest.json','fighter-art-pack-03-v1/production/manifest.json','fighter-art-pack-04-v1/production/manifest.json']){const m=JSON.parse(readFileSync(new URL('../../../public/'+file,import.meta.url),'utf8'));for(const[id,c]of Object.entries(m.characters)as[string,any][]){characters[id]=Object.fromEntries(Object.entries(c.clips).map(([name,c]:[string,any])=>[name,{...c,frames:c.frames.map((f:any)=>({...f,texture:Texture.EMPTY,offsetY:getCharacterStats(id as any).hurtboxRadius}))}]));}}
 for(const ownerId of ['zane-corvo','velvet-reply']as const)for(const victimId of Object.keys(characters))for(const move of [MoveId.FORWARD_THROW,MoveId.BACK_THROW,MoveId.UP_THROW,MoveId.DOWN_THROW])for(const facing of [-1,1]as const){
  const positions=[];const startup=getMoveDataForCharacter(ownerId,move).startupFrames;
  for(const age of [11,12]){const p=new FullBodyPilot({characters},victimId as any,['all-rounder','abe-lincoln','swift'].includes(victimId)?undefined:victimId as any);const owner={artId:ownerId,characterId:ownerId,state:'ATTACK',frame:startup-1,move,dx:40,dy:0,facing};
   p.update('GRAB_HOLDING',age,null,true,0,true,false,1,0,true,1,facing,owner);
   p.startGrabReaction(move,facing,'owner');p.update('HITSTUN',0,null,true,0,true,false,1,0,false,1,facing,{...owner,frame:startup});expect(p.sprite.label).toBe('throw_victim');positions.push([p.sprite.x,p.sprite.y]);
  }
  expect(positions[0],ownerId+' '+victimId+' '+move+' '+facing).toEqual(positions[1]);
 }
});


describe('confirmed throw presentation across network handoffs', () => {
 const create = () => {
  const clip = { scale: 1, frames: Array.from({length: 6}, () => ({root:[0,0],texture:Texture.EMPTY,offsetY:0})) };
  return new FullBodyPilot({characters:{'all-rounder':{idle:clip,air_fall_loop:clip,grabbed:clip,throw_victim:clip,jab:clip,shield:clip}}});
 };
 it('shows a bounded confirmed reaction when the event reaches a recovered idle victim', () => {
  const p=create();p.update('IDLE',13,null,true);p.startGrabReaction(MoveId.FORWARD_THROW,1,'owner');
  p.update('IDLE',14,null,true);expect(p.sprite.label).toBe('throw_victim');
  p.update('IDLE',19,null,true);expect(p.sprite.label).toBe('throw_victim');
  p.update('IDLE',20,null,true);expect(p.sprite.label).toBe('idle');
 });
 it('keeps the minimum visual handoff through a hitstun-to-idle frame reset', () => {
  const p=create();p.startGrabReaction(MoveId.UP_THROW,1,'owner');p.update('HITSTUN',4,null,true);
  p.update('IDLE',0,null,true);expect(p.sprite.label).toBe('throw_victim');
  p.update('IDLE',5,null,true);expect(p.sprite.label).toBe('idle');
 });
 it.each(['ATTACK','SHIELD','DOUBLE_JUMP','AIRBORNE'])('never covers a newly actionable %s', state => {
  const p=create();p.startGrabReaction(MoveId.FORWARD_THROW,1,'owner');p.update('IDLE',0,null,true);
  p.update(state,0,state==='ATTACK'?MoveId.JAB:null,true);expect(p.sprite.label).not.toBe('throw_victim');expect(p.throwOwnerId).toBeUndefined();
 });
 it('waits briefly for a still-held rendered victim to reach throw hitstun', () => {
  const p=create();p.startGrabReaction(MoveId.FORWARD_THROW,1,'owner');p.update('GRAB_HOLDING',30,null,true,0,true,false,1,0,true);
  expect(p.sprite.label).toBe('grabbed');p.update('HITSTUN',0,null,true);expect(p.sprite.label).toBe('throw_victim');
 });
 it('does not replay a confirmed cue after the victim is hidden', () => {
  const p=create();p.startGrabReaction(MoveId.FORWARD_THROW,1,'owner');p.update('IDLE',0,null,false);
  p.update('IDLE',1,null,true);expect(p.sprite.label).toBe('idle');
 });
});

it('does not let a late throw event cover a takeoff already in flight', () => {
 const clip={scale:1,frames:Array.from({length:6},()=>({root:[0,0],texture:Texture.EMPTY,offsetY:0}))};
 const p=new FullBodyPilot({characters:{'all-rounder':{idle:clip,throw_victim:clip,takeoff_neutral:clip}}});
 p.update('AIRBORNE',3,null,true,-10,true,false,1,0,false,1,1,undefined,null,{artCue:'takeoff_neutral',artCueFrame:3});
 p.startGrabReaction(MoveId.FORWARD_THROW,1,'owner');
 p.update('AIRBORNE',4,null,true,-10,true,false,1,0,false,1,1,undefined,null,{artCue:'takeoff_neutral',artCueFrame:4});
 expect(p.sprite.label).toBe('takeoff_neutral');expect(p.throwOwnerId).toBeUndefined();
});
