import{it,expect}from'vitest';import{GamepadInputSource}from'../GamepadInputSource';import{GenericInputBits as G,saveStickCalibration,resetStickCalibration}from'@smash/gamepad-input';import{INPUT_BITS as B}from'@smash/shared';import{XBOX360_PROFILE as P,xboxBindingLabel}from'../xbox360Profile';
const sample=(bits=0,axes=[0,0,0,0],pressed:number[]=[])=>new GamepadInputSource({poll:()=>new Map([[0,{bits,gamepad:{id:'xbox360-test',axes,buttons:Array.from({length:17},(_,i)=>({pressed:pressed.includes(i)}))}}]])}as any,0).sampleInput();
for(const binding of P.bindings)it(binding.label+' maps to '+binding.action,()=>expect(sample(binding.mask).held).toBe(binding.bit));
it('D-pad is direct taunts and never movement',()=>{for(const [index,bit]of[[12,B.TAUNT_UP],[13,B.TAUNT_DOWN],[14,B.TAUNT_SIDE],[15,B.TAUNT_SIDE]]){const p=sample(G.UP|G.DOWN|G.LEFT|G.RIGHT,[0,0,0,0],[index!]);expect(p.held).toBe(bit);expect(p.stickX).toBe(0);expect(p.stickY).toBe(0);}});
it('Back, Start and stick clicks have no combat binding',()=>expect(sample(G.BACK|G.START).held).toBe(0));
it('left stick movement is independent of D-pad and right-stick aerial aiming',()=>{const p=sample(0,[-.8,0,0,-1]);expect(p.held&B.LEFT).toBe(B.LEFT);expect(p.held&B.ATTACK).toBe(B.ATTACK);expect(p.held&B.UP).toBe(0);expect(p.cStickY).toBe(-1);});
it('stick up enables the default stick jump',()=>expect(sample(0,[0,-1,0,0]).held).toBe(B.UP|B.JUMP));
it('both jump buttons remain identifiable for the short-hop shortcut',()=>expect(sample(G.X|G.Y)).toMatchObject({held:B.JUMP,jumpButtons:3}));
it('A+B carries a smash shortcut instead of a special-only input',()=>expect(sample(G.A|G.B)).toMatchObject({held:B.SPECIAL|B.ATTACK,smashAttack:true}));
it('disconnection returns neutral and reassignment selects the current slot',()=>{let index=0;const source=new GamepadInputSource({poll:()=>new Map([[0,{bits:G.B,gamepad:{id:'xbox',axes:[],buttons:[]}}]])}as any,0,()=>index);expect(source.getHeldBits()).toBe(B.ATTACK);index=-1;expect(source.getHeldBits()).toBe(0);});
it('prompts and menu semantics share the profile',()=>{expect(xboxBindingLabel('ATTACK')).toBe('B');expect(xboxBindingLabel('JUMP')).toBe('X / Y');expect(P.confirm).toBe(G.B);expect(P.cancel).toBe(G.A);});

it('all four slots read only their assigned controller',()=>{const masks=[G.B,G.A,G.X,G.RT],expected=[B.ATTACK,B.SPECIAL,B.JUMP,B.SHIELD];const poller={poll:()=>new Map(masks.map((bits,index)=>[index,{bits,gamepad:{id:'xbox-'+index,axes:[0,0,0,0],buttons:[]}}]))}as any;for(let index=0;index<4;index++)expect(new GamepadInputSource(poller,index).getHeldBits()).toBe(expected[index]);});

it('distinguishes neutral right stick from a partial release below the attack threshold',()=>{
 expect(sample(0,[0,0,.19,0])).toMatchObject({rightStickNeutral:true,cStickX:0});
 expect(sample(0,[0,0,.63,0])).toMatchObject({rightStickNeutral:false,cStickX:0});
 expect(sample(0,[0,0,.65,0])).toMatchObject({rightStickNeutral:false,held:B.ATTACK});
});

it('can disable stick jump without removing up direction or physical jump',()=>{
 saveStickCalibration('xbox360-test',{stickJump:false,smashSensitivity:1});
 try{
  expect(sample(0,[0,-1,0,0])).toMatchObject({held:B.UP,smashSensitivity:1});
  expect(sample(G.X,[0,-1,0,0]).held).toBe(B.UP|B.JUMP);
 }finally{resetStickCalibration('xbox360-test');}
});

it('honors Tilt mode and disabling the A+B shortcut independently',()=>{
 saveStickCalibration('xbox360-test',{rightStick:'tilt',abSmash:false});
 try{
  expect(sample(G.A|G.B)).toMatchObject({held:B.ATTACK|B.SPECIAL,smashAttack:false});
  expect(sample(0,[0,0,1,0])).toMatchObject({held:B.ATTACK,cStickX:1,cStickTilt:true});
 }finally{resetStickCalibration('xbox360-test');}
});
