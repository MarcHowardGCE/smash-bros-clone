import{it,expect}from'vitest';import{MatchSession}from'./MatchSession.js';const proto=MatchSession.prototype as any,base={tick:0,seq:1,playerId:'a',held:0,pressed:0,released:0};
it('wire guard rejects malformed analog packets and accepts legacy digital input',()=>{expect(proto.isInputEvent.call({},base)).toBe(true);expect(proto.isInputEvent.call({},{...base,stickX:.2,stickY:-.3})).toBe(true);for(const axes of[{stickX:0},{stickX:2,stickY:0},{stickX:NaN,stickY:0},{cStickX:0,cStickY:null}])expect(proto.isInputEvent.call({},{...base,...axes})).toBe(false);});
it('C-stick flick direction survives a neutral packet in the same server tick',()=>{const queue=[{...base,pressed:16,held:16,cStickX:0,cStickY:-1},{...base,seq:2,released:16,cStickX:0,cStickY:0}];const merged=proto.consumeLatestInput.call({},queue);expect(merged.pressed&16).toBe(16);expect(merged.held).toBe(0);expect(merged.cStickY).toBe(-1);expect(queue).toHaveLength(0);});

it('keeps the latest attack press and its aim separate from current movement',()=>{
 const queue=[
  {...base,pressed:16,held:16,cStickX:0,cStickY:-1},
  {...base,seq:2,pressed:16,held:24,stickX:0,stickY:1},
  {...base,seq:3,held:1,stickX:-1,stickY:0},
 ];
 const merged=proto.consumeLatestInput.call({},queue);
 expect(merged).toMatchObject({pressed:16,held:1,stickX:-1,stickY:0,attackAim:{held:24,stickX:0,stickY:1}});
 expect(merged.cStickY).toBeUndefined();
});

it('uses the attack sample sensitivity and rejects invalid sensitivity values',()=>{
 const queue=[{...base,pressed:16,smashSensitivity:1},{...base,seq:2,smashSensitivity:-1}];
 expect(proto.consumeLatestInput.call({},queue).smashSensitivity).toBe(1);
 expect(proto.isInputEvent.call({},{...base,smashSensitivity:2})).toBe(false);
});

it('retains tilt mode on the selected attack sample and rejects a nonboolean mode',()=>{
 const queue=[{...base,pressed:16,cStickX:1,cStickY:0,cStickTilt:true},{...base,seq:2}];
 expect(proto.consumeLatestInput.call({},queue)).toMatchObject({cStickX:1,cStickTilt:true});
 expect(proto.isInputEvent.call({},{...base,cStickTilt:'tilt'})).toBe(false);
});

it('keeps attack origin and press-time face hold after a later release sample',()=>{
 const queue=[
  {...base,pressed:16,held:16,cStickX:0,cStickY:-1,faceAttackPressed:false,faceAttackHeld:true,rightStickHeld:true},
  {...base,seq:2,released:16,faceAttackHeld:false,rightStickHeld:false},
 ];
 expect(proto.consumeLatestInput.call({},queue)).toMatchObject({
  pressed:16,faceAttackPressed:false,faceAttackHeld:false,rightStickHeld:false,cStickY:-1,
  attackAim:{faceAttackHeld:true},
 });
 for(const invalid of [{faceAttackPressed:1},{rightStickHeld:'yes'}]){
  expect(proto.isInputEvent.call({},{...base,...invalid})).toBe(false);
 }
});

it('keeps face aim when an ineligible tilt arrives later in the same batch',()=>{
 const face={...base,pressed:16,held:24,stickX:0,stickY:.6,faceAttackPressed:true,faceAttackHeld:true};
 const tilt={...base,seq:2,pressed:16,held:2064,stickX:0,stickY:-.6,cStickX:0,cStickY:-1,
  cStickTilt:true,faceAttackPressed:false,faceAttackHeld:true,rightStickHeld:true};
 const drain=(...inputs:unknown[])=>proto.consumeLatestInput.call({},inputs);
 for(const queue of [[face,tilt],[tilt,face]]){
  expect(drain(...queue)).toMatchObject({pressed:16,faceAttackPressed:true,attackAim:{held:24,stickY:.6}});
  expect(drain(...queue).cStickY).toBeUndefined();
 }
 expect(drain(face,tilt)).toMatchObject({stickY:-.6,rightStickHeld:true});
 expect(drain(face,{...tilt,cStickTilt:false})).toMatchObject({faceAttackPressed:false,cStickY:-1});
 expect(drain(face,{...tilt,faceAttackPressed:true})).toMatchObject({faceAttackPressed:true,cStickY:-1});
 expect(drain(tilt)).toMatchObject({faceAttackPressed:false,cStickY:-1});
 expect(drain(drain(face,tilt),tilt)).toMatchObject({faceAttackPressed:true,attackAim:{held:24,stickY:.6}});
});

it('reconstructs attack aim from the input sample instead of trusting client metadata',()=>{
 const queue:unknown[]=[];
 const session={inputQueue:new Map([['a',queue]]),decodeInput:(input:unknown)=>input,
  lastConfirmedSeq:{},inputReceivedAt:new Map(),inputNow:()=>0};
 proto.queueInput.call(session,'a',{...base,held:24,pressed:16,stickX:0,stickY:.6,
  attackAim:{held:2048,stickY:-1}});
 expect(proto.consumeLatestInput.call({},queue).attackAim).toMatchObject({held:24,stickY:.6});
});