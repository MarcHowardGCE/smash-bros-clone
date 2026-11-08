import{it,expect}from'vitest';import{InputManager}from'../InputManager.js';
it('a subthreshold stick value sends its neutral release even when no direction bit was held',()=>{let x=.2;const source={getHeldBits:()=>0,sampleInput:()=>({held:0,stickX:x,stickY:0,cStickX:0,cStickY:0})}as any;const manager=new InputManager({},'a',source);expect(manager.pollInput()?.stickX).toBe(.2);x=0;expect(manager.pollInput()?.stickX).toBe(0);expect(manager.pollInput()).toBeNull();manager.destroy();});

it('a second jump button creates an edge while the first remains held',()=>{let buttons=1;const source={getHeldBits:()=>4,sampleInput:()=>({held:4,stickX:0,stickY:0,cStickX:0,cStickY:0,jumpButtons:buttons})}as any;const manager=new InputManager({},'a',source);expect((manager.pollInput()?.pressed??0)&4).toBe(4);expect(manager.pollInput()?.pressed).toBe(0);buttons=3;expect((manager.pollInput()?.pressed??0)&4).toBe(4);manager.destroy();});

it('detects independent face and right-stick edges and keeps aim on the stick edge only',()=>{
 const ATTACK=16;
 let face=false,y=0;
 const manager=new InputManager({},'a',{getHeldBits:()=>face||y?ATTACK:0,sampleInput:()=>({
  held:face||y?ATTACK:0,faceAttackHeld:face,cStickX:0,cStickY:y,
 })} as any);
 try{
  face=true;expect(manager.pollInput()).toMatchObject({pressed:ATTACK,faceAttackPressed:true,rightStickHeld:false});
  y=-1;expect(manager.pollInput()).toMatchObject({pressed:ATTACK,cStickY:-1,faceAttackPressed:false,rightStickHeld:true});
  expect(manager.pollInput()?.pressed).toBe(0);
  face=false;expect(manager.pollInput()?.released).toBe(0);
  face=true;const attack=manager.pollInput();
  expect(attack).toMatchObject({pressed:ATTACK,faceAttackPressed:true,rightStickHeld:true});expect(attack?.cStickY).toBeUndefined();
  y=0;expect(manager.pollInput()?.released).toBe(0);
  face=false;expect(manager.pollInput()?.released).toBe(ATTACK);
 }finally{manager.destroy();}
});

it('requires a neutral right-stick sample to rearm while keeping face attack independent',()=>{
 let y=-1,neutral=false,face=false;
 const manager=new InputManager({},'a',{
  getHeldBits:()=>0,
  sampleInput:()=>({held:face||y?16:0,faceAttackHeld:face,rightStickNeutral:neutral,cStickX:0,cStickY:y}),
 } as any);
 try{
  expect(manager.pollInput()).toMatchObject({pressed:16,cStickY:-1});
  y=0;expect(manager.pollInput()).toMatchObject({released:16});
  y=1;expect(manager.pollInput()?.pressed).toBe(0);
  face=true;expect(manager.pollInput()).toMatchObject({pressed:16});
  y=0;neutral=true;manager.pollInput();
  y=1;neutral=false;expect(manager.pollInput()).toMatchObject({pressed:16,cStickY:1});
 }finally{manager.destroy();}
});
