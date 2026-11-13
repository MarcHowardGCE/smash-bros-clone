import { grabHoldFrameIndex } from './contactPose.js';
import {describe,it,expect}from 'vitest';import{solveGrabContact,socketPoint}from './contactPose.js';
describe('visual grab contact',()=>{
 const holder={scale:1,frames:[{root:[0,0],offsetY:0,sockets:{grabGrip:[30,-50]}}]};
 const victim={scale:1,frames:[{root:[0,0],offsetY:0,sockets:{gripTop:[-5,-70],gripBottom:[-5,-30]}}]};
 it('keeps a taller held fighter grounded when the hand meets its chest',()=>{expect(solveGrabContact(holder,0,victim,0,40,0)).toEqual([-5,0]);});
 it('lifts a small victim rather than sinking the holder or moving simulation bodies',()=>{const small={scale:1,frames:[{root:[0,0],sockets:{gripTop:[-5,-40],gripBottom:[-5,-20]}}]};expect(solveGrabContact(holder,0,small,0,40,0)).toEqual([-5,-10]);});
 it('follows the hand vertically during throw windup',()=>{expect(solveGrabContact(holder,0,victim,0,40,0,true)).toEqual([-5,0]);const lifted={...holder,frames:[{...holder.frames[0]!,sockets:{grabGrip:[15,-90]}}]};expect(solveGrabContact(lifted,0,victim,0,40,0,true)).toEqual([-20,-40]);});
 it('respects source mirrors and fails safely on missing metadata',()=>{expect(socketPoint({...holder,mirrorSource:true},holder.frames[0],'grabGrip')).toEqual([-30,-50]);expect(solveGrabContact(holder,3,victim,0,40,0)).toEqual([0,0]);});
});
it('advances four hold poses and clamps to the available grip frame', () => {
 const ages = [0, 11, 12, 24, 36, 47, 48];
 expect(ages.map(age => grabHoldFrameIndex(age, 4))).toEqual([0, 0, 1, 2, 3, 3, 0]);
 expect(ages.map(age => grabHoldFrameIndex(age, 1))).toEqual([0, 0, 0, 0, 0, 0, 0]);
});