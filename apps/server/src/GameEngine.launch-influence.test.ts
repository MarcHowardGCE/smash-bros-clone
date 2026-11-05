import {describe,it,expect} from 'vitest';
import {GameEngine} from './GameEngine.js';
import {PlayerStateEnum,INPUT_BITS as B} from '@smash/shared';
function fixture() {
 const engine=new GameEngine({playerIds:['a','b']});
 const p=engine.getSnapshot(0,{}).players.a!;
 const before={...p,state:PlayerStateEnum.HITSTUN,hitlagFramesRemaining:1,hitstunFramesRemaining:30,isTumbling:true,pendingKnockbackVx:10,pendingKnockbackVy:0};
 const after={...before,hitlagFramesRemaining:0,vx:0,vy:0};
 const launch=(input:any,beforeOverride:any={})=>(engine as any).applyDirectionalInfluenceOnHitlagEnd({...before,...beforeOverride},after,input);
 return {launch,after};
}
const input=(held:number,extra={})=>({playerId:'a',held,pressed:0,released:0,tick:0,seq:0,...extra});
describe('authoritative launch-speed influence boundary',()=>{
 it('uses the final held direction and consumes pending launch once',()=>{
  const {launch}=fixture(),up=launch(input(B.UP)),down=launch(input(B.DOWN));
  expect(Math.hypot(up.vx,up.vy)).toBeCloseTo(1.314);
  expect(Math.hypot(down.vx,down.vy)).toBeCloseTo(1.104);
  expect(up.pendingKnockbackVx).toBeNull();
  expect(up.pendingKnockbackVy).toBeNull();
 });
 it('uses analog magnitude instead of full digital strength',()=>{const {launch}=fixture();expect(launch(input(B.UP,{stickX:0,stickY:-.5})).vx).toBeCloseTo(1.257);});
 it('leaves non-tumble, neutral and vertical launches unscaled',()=>{
  const {launch}=fixture();expect(launch(input(B.UP),{isTumbling:false}).vx).toBeCloseTo(1.2);
  expect(launch(null).vx).toBeCloseTo(1.2);
  const p=launch(input(B.UP),{pendingKnockbackVx:0,pendingKnockbackVy:-10});
  expect(Math.hypot(p.vx,p.vy)).toBeCloseTo(1.2);
 });
 it('does not apply early or repeat after pending launch is consumed',()=>{
  const {launch,after}=fixture();expect(launch(input(B.UP),{hitlagFramesRemaining:2})).toBe(after);
  expect(launch(input(B.UP),{pendingKnockbackVx:null,pendingKnockbackVy:null})).toBe(after);
 });
});

it('actual simulation samples LSI once when victim hitlag ends',()=>{
 const run=(held:number)=>{
  const engine=new GameEngine({playerIds:['a','b']});
  const state=(engine as any).state;
  Object.assign(state.players.a,{x:600,y:180,state:PlayerStateEnum.HITSTUN,isGrounded:false,hitlagFramesRemaining:1,hitstunFramesRemaining:30,isTumbling:true,pendingKnockbackVx:10,pendingKnockbackVy:0,vx:0,vy:0,respawnTimer:0,isInvincible:false,invincibilityFrames:0,sdiEligible:true});
  Object.assign(state.players.b,{x:1000,y:300,respawnTimer:0,state:PlayerStateEnum.AIRBORNE,isGrounded:false});
  const first=engine.tickGame(new Map([['a',input(held)]] )).players.a!;
  const firstVx=first.vx;
  expect(first.pendingKnockbackVx).toBeNull();
  const second=engine.tickGame(new Map([['a',input(held)]])).players.a!;
  // The next tick only applies fixed launch decay; LSI must not compound.
  expect(second.vx).toBeCloseTo(firstVx-.204);
  return firstVx;
 };
 expect(run(B.UP)-run(B.DOWN)).toBeCloseTo(.21);
});


