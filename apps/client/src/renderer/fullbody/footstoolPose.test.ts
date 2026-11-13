import { footstoolFrameIndex } from './footstoolPose.js';
import {describe,it,expect}from 'vitest';import{footstoolPoint,solveFootstoolContact,type FootstoolClip}from './footstoolPose.js';
describe('footstool artwork contact',()=>{
 it('aligns every size pairing in both facings without changing the input geometry',()=>{
  const clips=[.16,.20,.14].map(scale=>({scale,frames:[{root:[120,220],offsetY:0,sockets:{footstoolSole:[150,400],footstoolHead:[110,5]}}]}));
  const before=JSON.stringify(clips);
  for(const a of clips)for(const v of clips)for(const facing of[1,-1]as const){const offset=solveFootstoolContact(a,0,v,0,facing)!,sole=footstoolPoint(a,0,'footstoolSole',facing)!,head=footstoolPoint(v,0,'footstoolHead',facing)!;expect(offset[0]+sole[0]).toBeCloseTo(head[0]);expect(offset[1]+sole[1]).toBeCloseTo(head[1]);}
  expect(JSON.stringify(clips)).toBe(before);
 });
 it('handles source mirroring and rejects missing or nonfinite contact data',()=>{
  const a:FootstoolClip={scale:.2,mirrorSource:true,frames:[{root:[10,20],mirrorSource:true,sockets:{footstoolSole:[20,40]}}]},v:FootstoolClip={scale:.3,frames:[{root:[10,20],offsetY:28,sockets:{footstoolHead:[20,5]}}]};
  expect(footstoolPoint(a,0,'footstoolSole')).toEqual([2,4]);expect(solveFootstoolContact(a,0,v,0)).toEqual([1,19.5]);
  expect(solveFootstoolContact(a,99,v,0)).toBeNull();expect(footstoolPoint({...a,scale:NaN},0,'footstoolSole')).toBeNull();expect(footstoolPoint(a,0,'missing')).toBeNull();
 });
});

it('uses the same clamped pose for short clips and the full six-pose cadence', () => {
 expect([0, 3, 4, 17].map(age => footstoolFrameIndex(age, 3, true))).toEqual([1, 1, 2, 2]);
 expect([0, 4, 17].map(age => footstoolFrameIndex(age, 2, true))).toEqual([1, 1, 1]);
 expect([0, 3, 6, 9, 12, 15].map(age => footstoolFrameIndex(age, 6, true))).toEqual([0, 1, 2, 3, 4, 5]);
});