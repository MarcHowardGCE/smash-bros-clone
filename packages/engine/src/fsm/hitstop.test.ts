import{it,expect}from'vitest';import{INPUT_BITS as B,MoveId,type PlayerState}from'@smash/shared';import{advanceHitstop as step}from'./hitstop.js';const make=(extra:Partial<PlayerState>={})=>({state:'HITSTUN',stateFrame:4,hitstunFramesRemaining:20,hitlagFramesRemaining:10,x:0,y:0,vx:4,vy:3,sdiEligible:true,...extra}as PlayerState);
it('holding a direction gives one pulse rather than automatic repeated movement',()=>{let p=make();for(let i=0;i<8;i++)p=step(p,B.RIGHT);expect(p.x).toBe(3);expect(p.stateFrame).toBe(4);expect(p.hitstunFramesRemaining).toBe(20);});
it('direction held before impact does not create a new pulse',()=>{expect(step(make({sdiLastDirection:B.RIGHT}),B.RIGHT).x).toBe(0);});
it('new directions buffer during cooldown and the latest pulse wins',()=>{let p=step(make(),B.RIGHT);p=step(p,0);p=step(p,B.LEFT);expect(p.x).toBe(3);p=step(p,B.UP);p=step(p,B.UP);expect(p.y).toBe(-3);expect(p.x).toBe(3);});
it('attackers and shield holders do not receive body SDI',()=>{for(const state of['IDLE','SHIELD']){const p=step(make({state,sdiEligible:false}),B.RIGHT);expect(p.x).toBe(0);expect(p.hitlagFramesRemaining).toBe(9);}});
it('diagonal pulses preserve magnitude',()=>{const p=step(make(),B.RIGHT|B.UP);expect(Math.hypot(p.x,p.y)).toBeCloseTo(3);});
it('grounded freeze does not move vertically through the floor',()=>{const p=step(make({sdiGrounded:true}),B.DOWN);expect(p.y).toBe(0);});
it('zero SDI multiplier disables pulses',()=>{expect(step(make({sdiMultiplier:0}),B.RIGHT).x).toBe(0);});

it('preserves only vertical lift for an uninterrupted airborne up special', () => {
 const p=make({state:'AIR_ATTACK',currentMoveId:MoveId.UP_SPECIAL,isGrounded:false,vy:-12,sdiEligible:false});
 expect(step(p,0)).toMatchObject({x:p.x,y:p.y,vx:0,vy:-12});
 expect(step({...p,state:'HITSTUN'},0).vy).toBe(0);
 expect(step({...p,isGrounded:true},0).vy).toBe(0);
 expect(step({...p,currentMoveId:MoveId.NEUTRAL_AIR},0).vy).toBe(0);
});
it('one-tick hitstop cannot produce SDI',()=>{expect(step(make({hitlagFramesRemaining:1}),B.RIGHT).x).toBe(0);});

it('explicit exit ASDI remains independent of a zero SDI multiplier',()=>{const p=step(make({hitlagFramesRemaining:1,sdiMultiplier:0,asdiMultiplier:1}),B.RIGHT);expect(p.x).toBe(2);});

it('shield SDI is horizontal and can rearm without the body four-frame cooldown',()=>{let p=make({state:'SHIELD',sdiMode:'shield',sdiGrounded:true});p=step(p,B.RIGHT|B.UP);expect(p.x).toBeCloseTo(1.98);p=step(p,B.RIGHT|B.DOWN);expect(p.x).toBeCloseTo(1.98);p=step(p,0);p=step(p,B.RIGHT);expect(p.x).toBeCloseTo(3.96);p=step(p,B.LEFT);expect(p.x).toBeCloseTo(1.98);expect(p.y).toBe(0);});
it('shield never receives automatic exit movement',()=>expect(step(make({state:'SHIELD',sdiMode:'shield',hitlagFramesRemaining:1,asdiMultiplier:2}),B.RIGHT).x).toBe(0));
it('removing a diagonal component does not create a new pulse',()=>expect(step(make({sdiLastDirection:B.RIGHT|B.UP}),B.RIGHT).x).toBe(0));
it('body pulse cap does not apply to shield pulses',()=>{expect(step(make({sdiPulseCount:16}),B.RIGHT).x).toBe(0);expect(step(make({sdiMode:'shield',sdiPulseCount:16}),B.RIGHT).x).toBeCloseTo(1.98);});

it('analog SDI preserves pulse magnitude and the buffered vector after neutral release',()=>{const i=(x:number,y:number)=>({stickX:x,stickY:y,held:0}as any);let p=step(make(),0,i(.6,0));expect(p.x).toBeCloseTo(1.8);p=step(p,0,i(0,0));p=step(p,0,i(-.7,0));p=step(p,0,i(0,0));p=step(p,0,i(0,0));expect(p.x).toBeCloseTo(-.3);});
it('analog shield input never shifts vertically',()=>{const p=step(make({sdiMode:'shield'}),0,{stickX:.6,stickY:.6,held:0}as any);expect(p.x).toBeCloseTo(1.188);expect(p.y).toBe(0);});
