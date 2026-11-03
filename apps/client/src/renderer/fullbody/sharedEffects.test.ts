import {describe,it,expect} from 'vitest';
import {Texture} from 'pixi.js';
import {getMoveDataForCharacter} from '@smash/engine';
import {MoveId} from '@smash/shared';
import {FullBodyPilot} from './FullBodyPilot.js';
describe('shared full-body effects',()=>{
 it('uses active simulation ticks, freezes repeated snapshots and cancels on interruption',()=>{
  const frame={texture:Texture.EMPTY,root:[0,0],offsetY:0},clip={scale:1,frames:Array(6).fill(frame)};
  const p=new FullBodyPilot({characters:{'all-rounder':{neutral_special:clip,idle:clip}},effects:{neutral_burst:{scale:1,rotation:0,durations:[2,2,2,2],frames:Array(4).fill(frame)}}});
  const start=getMoveDataForCharacter('all-rounder',MoveId.NEUTRAL_SPECIAL).startupFrames;
  p.update('ATTACK',start-1,MoveId.NEUTRAL_SPECIAL,true);expect(p.effectSprite.visible).toBe(false);
  p.update('ATTACK',start,MoveId.NEUTRAL_SPECIAL,true);expect(p.effectSprite.visible).toBe(true);
  p.update('ATTACK',start,MoveId.NEUTRAL_SPECIAL,true);expect(p.effectSprite.visible).toBe(true);
  p.update('ATTACK',start+8,MoveId.NEUTRAL_SPECIAL,true);expect(p.effectSprite.visible).toBe(false);
  p.update('ATTACK',start,MoveId.NEUTRAL_SPECIAL,false);expect(p.effectSprite.visible).toBe(false);
  p.update('IDLE',0,null,true);expect(p.effectSprite.visible).toBe(false);
 });
});
