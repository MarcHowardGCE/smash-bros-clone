import{it,expect}from'vitest';import{GameEngine}from'./GameEngine.js';import{INPUT_BITS as B,MoveId as M}from'@smash/shared';
const make=()=>{const e=new GameEngine({playerIds:['a','b']}),s=(e as any).state;for(const p of Object.values(s.players)as any[])Object.assign(p,{x:p.id==='a'?600:1000,y:472,state:'IDLE',stateFrame:0,isGrounded:true,isInvincible:false,invincibilityFrames:0,respawnTimer:0,hitlagFramesRemaining:0,hitstunFramesRemaining:0,currentMoveId:null,isShielding:false,shieldHealth:100,vx:0,vy:0});return e;};
const tick=(e:GameEngine,held=0,pressed=held,extra:any={})=>e.tickGame(new Map([['a',{playerId:'a',tick:0,seq:0,held,pressed,released:0,stickX:0,stickY:0,jumpButtons:0,smashAttack:false,...extra}]]));
it('controller normal and special select distinct neutral moves',()=>{expect(tick(make(),B.ATTACK).players.a!.currentMoveId).toBe(M.JAB);expect(tick(make(),B.SPECIAL).players.a!.currentMoveId).toBe(M.NEUTRAL_SPECIAL);});
it('shield plus attack selects grab rather than the old smash shortcut',()=>{const e=make();Object.assign((e as any).state.players.a,{state:'SHIELD',isShielding:true,stateFrame:10});expect(tick(e,B.SHIELD|B.ATTACK,B.ATTACK).players.a!.currentMoveId).toBe(M.GRAB);});
it('a fresh horizontal flick plus attack selects a smash',()=>{const e=make();tick(e);expect(tick(e,B.RIGHT|B.ATTACK,B.RIGHT|B.ATTACK,{stickX:1}).players.a!.currentMoveId).toBe(M.FORWARD_SMASH);});
it('holding down past the flick window selects a tilt rather than a smash',()=>{const e=make();for(let n=0;n<8;n++)tick(e,B.DOWN,n===0?B.DOWN:0,{stickY:1});expect(tick(e,B.DOWN|B.ATTACK,B.ATTACK,{stickY:1}).players.a!.currentMoveId).toBe(M.DOWN_TILT);});
it('A+B shortcut selects a forward smash with no direction held',()=>expect(tick(make(),B.ATTACK|B.SPECIAL,B.ATTACK|B.SPECIAL,{smashAttack:true}).players.a!.currentMoveId).toBe(M.FORWARD_SMASH));
it('both jump buttons force a short hop even while held through jumpsquat',()=>{const e=make();let s=tick(e,B.JUMP,B.JUMP,{jumpButtons:3});for(let n=0;n<5;n++)s=tick(e,B.JUMP,0,{jumpButtons:3});expect(s.players.a!.isGrounded).toBe(false);expect(s.players.a!.shortHop).toBe(true);});
it('physical jump plus flick attack keeps the short-hop aerial shortcut',()=>{const e=make();let s=tick(e,B.JUMP|B.ATTACK|B.RIGHT,B.JUMP|B.ATTACK|B.RIGHT,{jumpButtons:1,stickX:1});for(let n=0;n<4;n++)s=tick(e,B.JUMP,0,{jumpButtons:1});expect(s.players.a!.state).toBe('AIR_ATTACK');expect(s.players.a!.shortHop).toBe(true);});

it('uses the press-time direction even when the latest movement sample is neutral',()=>{
 const p=tick(make(),0,B.ATTACK,{attackAim:{held:B.ATTACK|B.DOWN,stickX:0,stickY:1}}).players.a!;
 expect(p.currentMoveId).toBe(M.DOWN_SMASH);
});

for(const delay of [0,1,2,3])it('up flick and face attack at tick '+delay,()=>{
 const e=make();
 const direction=B.UP|B.JUMP, axes={stickY:-.738};
 if(delay)tick(e,direction,direction,axes);
 for(let age=1;age<delay;age++)tick(e,direction,0,axes);
 const p=tick(e,direction|B.ATTACK,delay?B.ATTACK:direction|B.ATTACK,axes).players.a!;
 expect(p.currentMoveId).toBe(delay<=2?M.UP_SMASH:M.UP_AIR);
 expect(p.state).toBe(delay<=2?'ATTACK':'AIR_ATTACK');
 if(delay===3)expect(p.shortHop).toBe(false);
});
it('a button jump cannot be canceled into the stick-jump up smash',()=>{
 const e=make();
 tick(e,B.JUMP,B.JUMP,{jumpButtons:1});
 expect(tick(e,B.UP|B.JUMP|B.ATTACK,B.UP|B.ATTACK,{stickY:-.8}).players.a!.state).toBe('JUMPSQUAT');
});
it('right-stick input cannot use the face-button up-smash cancel',()=>{
 const e=make();
 tick(e,B.UP|B.JUMP,B.UP|B.JUMP,{stickY:-.8});
 expect(tick(e,B.UP|B.JUMP|B.ATTACK,B.ATTACK,{stickY:-.8,cStickX:0,cStickY:-1}).players.a!.state).toBe('JUMPSQUAT');
});

for(const [smashSensitivity,horizontal,vertical] of [[-1,5,3],[0,6,4],[1,7,5]] as const){
 for(const [direction,axes,boundary,smash,tilt] of [
  [B.RIGHT,{stickX:.738},horizontal,M.FORWARD_SMASH,M.FORWARD_TILT],
  [B.DOWN,{stickY:.738},vertical,M.DOWN_SMASH,M.DOWN_TILT],
 ] as const){
  it('sensitivity '+smashSensitivity+' sets '+smash+' boundary to '+boundary,()=>{
   for(const [delay,expected] of [[boundary,smash],[boundary+1,tilt]] as const){
    const e=make();
    for(let age=0;age<delay;age++)tick(e,direction,age?0:direction,axes);
    const p=tick(e,direction|B.ATTACK,B.ATTACK,{...axes,smashSensitivity}).players.a!;
    expect(p.currentMoveId).toBe(expected);
   }
  });
 }
}
it('right-stick aim wins over a simultaneous left-stick flick',()=>{
 const p=tick(make(),B.DOWN|B.ATTACK,B.DOWN|B.ATTACK,{stickY:1,cStickX:1,cStickY:0,smashSensitivity:1}).players.a!;
 expect(p.currentMoveId).toBe(M.FORWARD_SMASH);
});

for(const [cStickX,cStickY,ground,air] of [[1,0,M.FORWARD_TILT,M.FORWARD_AIR],[0,-1,M.UP_TILT,M.UP_AIR],[0,1,M.DOWN_TILT,M.DOWN_AIR]] as const){
 it('tilt mode selects '+ground+' on the ground and '+air+' in the air',()=>{
  const aim={cStickX,cStickY,cStickTilt:true};
  expect(tick(make(),B.ATTACK,B.ATTACK,aim).players.a!.currentMoveId).toBe(ground);
  const e=make();
  Object.assign((e as any).state.players.a,{state:'AIRBORNE',isGrounded:false,y:200});
  expect(tick(e,B.ATTACK,B.ATTACK,aim).players.a!.currentMoveId).toBe(air);
 });
}
it('right-stick up tilt cannot bypass shield drop as an up smash or grab',()=>{
 const e=make();
 Object.assign((e as any).state.players.a,{state:'SHIELD',isShielding:true,stateFrame:10});
 expect(tick(e,B.SHIELD|B.ATTACK,B.ATTACK,{cStickX:0,cStickY:-1,cStickTilt:true}).players.a!.state).toBe('SHIELD');
});

function fullRun(){
 const e=make();
 for(let n=0;n<16;n++)tick(e,B.RIGHT,n?0:B.RIGHT,{stickX:1});
 return e;
}
it('analog release skids until stopped and a reversal keeps its old momentum initially',()=>{
 const brake=fullRun(),turn=fullRun();
 let p=tick(brake,0,0).players.a!;
 expect(p.state).toBe('RUN_BRAKE');expect(p.vx).toBeGreaterThan(0);
 for(let n=0;n<24&&p.state!=='IDLE';n++)p=tick(brake,0,0).players.a!;
 expect(p.state).toBe('IDLE');expect(p.vx).toBe(0);
 p=tick(turn,B.LEFT,B.LEFT,{stickX:-1}).players.a!;
 expect(p).toMatchObject({state:'RUN_TURN',facing:-1});
 expect(p.vx).toBeGreaterThan(0);
 for(let n=0;n<24&&p.state!=='RUN';n++)p=tick(turn,B.LEFT,0,{stickX:-1}).players.a!;
 expect(p.state).toBe('RUN');expect(p.vx).toBeLessThan(0);
});
for(const [delay,expected] of [[1,M.DASH_ATTACK],[2,null],[3,null],[4,M.JAB]] as const){
 it('brake attack on tick '+(delay+1),()=>{
  const e=fullRun();
  for(let n=0;n<delay;n++)tick(e,0,0);
  expect(tick(e,B.ATTACK).players.a!.currentMoveId).toBe(expected);
 });
}
it('carries brake ticks into turnaround and keeps jump available immediately',()=>{
 const e=fullRun();
 for(let n=0;n<3;n++)tick(e,0,0);
 expect(tick(e,B.LEFT,B.LEFT,{stickX:-1}).players.a!.state).toBe('RUN_TURN');
 expect(tick(e,B.ATTACK).players.a!.currentMoveId).toBe(M.JAB);
 const jump=fullRun();
 tick(jump,B.LEFT,B.LEFT,{stickX:-1});
 expect(tick(jump,B.LEFT|B.JUMP,B.JUMP,{stickX:-1}).players.a!.state).toBe('JUMPSQUAT');
});

it('brake allows early backward roll and forward roll at the late boundary',()=>{
 const back=fullRun();tick(back,0,0);
 expect(tick(back,B.LEFT|B.SHIELD,B.LEFT|B.SHIELD,{stickX:-1}).players.a!).toMatchObject({state:'ROLL',dodgeKind:'backward'});
 const early=fullRun();tick(early,0,0);
 expect(tick(early,B.RIGHT|B.SHIELD,B.RIGHT|B.SHIELD,{stickX:1}).players.a!.state).not.toBe('ROLL');
 const late=fullRun();for(let n=0;n<4;n++)tick(late,0,0);
 expect(tick(late,B.RIGHT|B.SHIELD,B.RIGHT|B.SHIELD,{stickX:1}).players.a!).toMatchObject({state:'ROLL',dodgeKind:'forward'});
});
it('brake selects dash grab early and defers a middle grab or special to the fifth tick',()=>{
 const early=fullRun();tick(early,0,0);
 expect(tick(early,B.GRAB).players.a!.currentMoveId).toBe(M.GRAB_DASH);
 for(const [button,direction,move] of [[B.GRAB,0,M.GRAB],[B.SPECIAL,B.DOWN,M.DOWN_SPECIAL]] as const){
  for(const delay of [2,3]){
   const e=fullRun();for(let n=0;n<delay;n++)tick(e,0,0);
   expect(tick(e,button|direction,button,{stickY:direction?1:0}).players.a!.currentMoveId).toBeNull();
   for(let n=delay+1;n<4;n++)expect(tick(e,0,0).players.a!.currentMoveId).toBeNull();
   expect(tick(e,0,0).players.a!.currentMoveId).toBe(move);
  }
 }
});
it('turnaround allows an early pivot grab and jump-cancel up special',()=>{
 const grab=fullRun();tick(grab,B.LEFT,B.LEFT,{stickX:-1});
 expect(tick(grab,B.LEFT|B.GRAB,B.GRAB,{stickX:-1}).players.a!).toMatchObject({currentMoveId:M.GRAB_PIVOT,facing:-1});
 const plain=fullRun();tick(plain,B.LEFT,B.LEFT,{stickX:-1});
 expect(tick(plain,B.UP|B.SPECIAL,B.SPECIAL,{stickY:-1}).players.a!.currentMoveId).toBeNull();
 const jump=fullRun();tick(jump,B.LEFT,B.LEFT,{stickX:-1});
 expect(tick(jump,B.UP|B.JUMP|B.SPECIAL,B.JUMP|B.SPECIAL,{stickY:-1,jumpButtons:1}).players.a!.currentMoveId).toBe(M.UP_SPECIAL);
});

for(const delay of [1,2,3])it('button jump buffers down-air on squat tick '+delay,()=>{
 const e=make();
 tick(e,B.JUMP,B.JUMP,{jumpButtons:1});
 for(let t=1;t<delay;t++)tick(e,B.JUMP,0,{jumpButtons:1});
 let p=tick(e,B.JUMP|B.DOWN|B.ATTACK,B.ATTACK,{jumpButtons:1,stickY:1}).players.a!;
 for(let t=delay;t<3;t++)p=tick(e,B.JUMP,0,{jumpButtons:1}).players.a!;
 expect(p).toMatchObject({state:'AIR_ATTACK',currentMoveId:M.DOWN_AIR,shortHop:true,stateFrame:0});
});
it('the second jump button can force a short hop during squat',()=>{
 const e=make();
 tick(e,B.JUMP,B.JUMP,{jumpButtons:1});
 tick(e,B.JUMP,B.JUMP,{jumpButtons:3});
 tick(e,B.JUMP,0,{jumpButtons:1});
 expect(tick(e,B.JUMP,0,{jumpButtons:1}).players.a!).toMatchObject({state:'AIRBORNE',shortHop:true});
});
it('waiting until the tick after takeoff gives a full-hop aerial',()=>{
 const e=make();tick(e,B.JUMP,B.JUMP,{jumpButtons:1});
 for(let t=1;t<=3;t++)tick(e,B.JUMP,0,{jumpButtons:1});
 expect(tick(e,B.JUMP|B.ATTACK,B.ATTACK,{jumpButtons:1}).players.a!).toMatchObject({currentMoveId:M.NEUTRAL_AIR,shortHop:false});
});
it('right-stick attack during stick jump can still start a short-hop aerial',()=>{
 const e=make(),held=B.JUMP|B.UP;
 tick(e,held,held,{stickY:-1});
 tick(e,held|B.ATTACK,B.ATTACK,{stickY:-1,cStickX:0,cStickY:1});
 tick(e,held,0,{stickY:-1});
 expect(tick(e,held,0,{stickY:-1}).players.a!).toMatchObject({currentMoveId:M.DOWN_AIR,shortHop:true,stateFrame:0});
});

it.each([
  ['face', { attackAim: { held: B.LEFT } }, M.BACK_AIR],
  ['C-stick', { cStickX: 0, cStickY: -1, faceAttackHeld: false }, M.UP_AIR],
] as const)('accepts a fresh %s aerial on double-jump takeoff and the following tick', (_source, aim, move) => {
  const airborne = () => {
    const engine = make();
    Object.assign((engine as any).state.players.a, {
      state: 'AIRBORNE', y: 230, facing: 1, isGrounded: false, hasDoubleJump: true, shortHop: true,
    });
    return engine;
  };
  const combined = tick(airborne(), B.JUMP | B.ATTACK, B.JUMP | B.ATTACK, aim).players.a!;
  const separate = airborne();
  const jump = tick(separate, B.JUMP).players.a!;
  const aerial = tick(separate, B.ATTACK, B.ATTACK, aim).players.a!;
  expect(combined).toMatchObject({
    state: 'AIR_ATTACK', stateFrame: 0, currentMoveId: move,
    hasDoubleJump: false, shortHop: false, y: jump.y, vy: jump.vy,
  });
  expect(aerial).toMatchObject({ state: 'AIR_ATTACK', stateFrame: 0, currentMoveId: move, hasDoubleJump: false });
  expect(aerial.vy).toBeGreaterThan(jump.vy);
}); 
it.each([true,false])('locks grounded right-stick side attack facing against left-stick input (tilt %s)',tilt=>{
 const e=make();
 const p=tick(e,B.LEFT|B.ATTACK,B.ATTACK,{stickX:-1,cStickX:1,cStickY:0,cStickTilt:tilt}).players.a!;
 expect(p).toMatchObject({currentMoveId:tilt?M.FORWARD_TILT:M.FORWARD_SMASH,facing:1});
 expect(tick(e,B.LEFT,0,{stickX:-1}).players.a!.facing).toBe(1);
});