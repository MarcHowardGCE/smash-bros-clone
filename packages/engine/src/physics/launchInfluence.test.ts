import {describe,it,expect} from 'vitest';
import {launchSpeedInfluence as lsi} from './launchInfluence.js';
const rad=(degrees:number)=>degrees*Math.PI/180;
describe('launch-speed influence',()=>{
 it.each([[1,1.095],[-1,.92],[.5,1.0475],[-.5,.96],[0,1]])('normalized Y %s gives %s on a horizontal tumble',(y,expected)=>expect(lsi(y,0,true)).toBeCloseTo(expected,12));
 it.each([90,270,65.01,114.99,245.01,294.99])('excludes vertical band %s',(angle)=>expect(lsi(1,rad(angle),true)).toBe(1));
 it.each([64.99,115.01,244.99,295.01,180,360,-180])('allows nonvertical angle %s',(angle)=>expect(lsi(-1,rad(angle),true)).toBeCloseTo(.92));
 it('does not alter non-tumble launches',()=>expect(lsi(1,0,false)).toBe(1));
 it('clamps over-range stick values and rejects nonfinite input',()=>{expect(lsi(2,0,true)).toBe(1.095);expect(lsi(-2,0,true)).toBe(.92);expect(lsi(NaN,0,true)).toBe(1);expect(lsi(1,Infinity,true)).toBe(1);});
});
