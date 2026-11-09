import { CONTROLLER_PROFILES, type ControllerProfile } from '../input/controllerProfiles';
import{it,expect,vi,afterEach}from'vitest';import{PracticePanel}from'./PracticePanel.js';import{PracticeRoutine,decodeRoutine}from'./PracticeRoutine.js';import{PracticeDummy}from'./PracticeDummy.js';import type{LocalMatch}from'../local/LocalMatch.js';import type{PracticeOverlay}from'./PracticeOverlay.js';import{INPUT_BITS as B,MoveId as M,SMASH_CHARGE_MAX_FRAMES,type GameState,type InputEvent,type HitEventData,type KOEventData}from'@smash/shared';
let panel:PracticePanel|null=null;afterEach(()=>{panel?.destroy();panel=null;document.body.innerHTML='';localStorage.clear();});
function make(lessonId:string|null=null,profile?:()=>ControllerProfile){localStorage.clear();const routine=new PracticeRoutine(),dummy=new PracticeDummy();dummy.routine=routine;const presets=new Map<string,number>(),previewKO=vi.fn(()=>true);const match={paused:false,practiceSpeed:1,practiceFatigue:0,getPracticePercent:(id:string)=>presets.get(id)??0,setPracticePercent:(id:string,value:number)=>presets.set(id,value),setPracticeFatigue:vi.fn(),setPracticeSpawn:vi.fn(),practiceTick:0,setPracticeSpeed:vi.fn(),freezePractice:vi.fn(),runPractice:vi.fn(),stepPractice:vi.fn()},overlay={enabled:false,setEnabled:vi.fn()};panel=new PracticePanel({fighter:'all-rounder',dummy:'all-rounder',stageId:'stage1',lessonId,dummyMode:'still'},dummy,vi.fn(),vi.fn(),()=>true,{match:match as unknown as LocalMatch,routine,overlay:overlay as unknown as PracticeOverlay,previewKO},profile);return{routine,previewKO};}
it('recording enables playback immediately and all three slots persist independently',()=>{const{routine}=make();const click=(id:string)=>(document.getElementById(id)as HTMLButtonElement).click();expect((document.getElementById('dojo-lab-play')as HTMLButtonElement).disabled).toBe(true);click('dojo-lab-record');const input:InputEvent={playerId:'local-p1',tick:1,seq:1,held:B.ATTACK,pressed:B.ATTACK,released:0};panel!.observe({tick:1,players:{'local-p1':{state:'IDLE',stateFrame:0,dodgeFatigue:0}}}as unknown as GameState,new Map([['local-p1',input]]));click('dojo-lab-record');expect(decodeRoutine(localStorage.getItem('eth:dojo:routine:v1:0'))!.frames).toHaveLength(1);expect((document.getElementById('dojo-lab-play')as HTMLButtonElement).disabled).toBe(false);click('dojo-lab-play');expect(routine.mode).toBe('playing');click('dojo-lab-slot');expect(routine.length).toBe(0);click('dojo-lab-slot');click('dojo-lab-slot');expect(routine.length).toBe(1);});
it('guided lessons cannot start a recording and toolbar navigation does not leak gameplay key events',()=>{const{routine}=make('jab');expect(document.getElementById('dojo-lab-record')).toBeNull();window.dispatchEvent(new KeyboardEvent('keydown',{code:'F8'}));expect(routine.mode).toBe('idle');const bubbled=vi.fn();window.addEventListener('keydown',bubbled);document.getElementById('dojo-lab-freeze')!.dispatchEvent(new KeyboardEvent('keydown',{code:'Space',bubbles:true}));expect(bubbled).not.toHaveBeenCalled();window.removeEventListener('keydown',bubbled);});

it('traces the right-stick press, resolved move, and later release at their simulation ticks',()=>{
 make();
 const observe=(tick:number,state:string,stateFrame:number,move:string|null,input:Partial<InputEvent>)=>{
  panel!.observe({tick,players:{'local-p1':{state,stateFrame,currentMoveId:move}}} as unknown as GameState,
   new Map([['local-p1',{playerId:'local-p1',tick,seq:tick,held:0,pressed:0,released:0,...input}]]));
 };
 observe(7,'ATTACK',0,'UP_SMASH',{held:B.ATTACK,pressed:B.ATTACK,cStickX:0,cStickY:-1,stickX:0,stickY:0});
 observe(8,'ATTACK',1,'UP_SMASH',{released:B.ATTACK});
 const trace=document.getElementById('dojo-input-trace')!;
 expect(trace.textContent).toContain('Tick 7 · Press attack · right stick (0, -1)');
 expect(trace.textContent).toContain('up smash · frame 0');
 expect(trace.textContent).toContain('Tick 8 · Release attack');
 panel!.reset();
 expect(trace.textContent).toBe('No samples yet.');
});


it('cycles independent presets, selects a preview fighter and displays tracked launches and exits',()=>{
 const {previewKO}=make();
 const click=(id:string)=>document.getElementById(id)!.click();
 click('dojo-launch-percent-you');
 click('dojo-launch-percent-partner');
 click('dojo-launch-percent-partner');
 expect(document.getElementById('dojo-launch-percent-you')!.textContent).toContain('50%');
 expect(document.getElementById('dojo-launch-percent-partner')!.textContent).toContain('100%');
 click('dojo-launch-preview-screen');
 click('dojo-launch-preview-side');
 click('dojo-launch-preview-star');
 expect(previewKO.mock.calls).toEqual([['screen','you'],['star','partner']]);

 const observe=(tick:number, x:number, hits:HitEventData[]=[], exits:KOEventData[]=[])=>{
  panel!.observe({tick,players:{
   'local-p1':{state:'IDLE',stateFrame:0},
   'local-p2':{state:'HITSTUN',stateFrame:0,percent:100,isTumbling:true,isGrounded:false,
    x,y:300,launchVx:12,launchVy:-5,hitstunFramesRemaining:28,hitlagFramesRemaining:0},
  }} as unknown as GameState,new Map(),hits,exits);
 };
 observe(1,700,[{attackerId:'local-p1',defenderId:'local-p2',moveId:M.FORWARD_SMASH,damage:0,knockbackMagnitude:120,worldX:700,worldY:300}]);
 observe(2,710,[],[{playerId:'local-p2',boundary:'right',tick:2,exitPosition:{x:1600,y:300}}]);
 const readout=document.getElementById('dojo-launch-readout')!;
 expect(readout.textContent).toContain('forward smash at 100%');
 expect(readout.textContent).toContain('Base launch speed 14.4 units/tick');
 expect(readout.textContent).toContain('max displacement 900.0 units');
 expect(readout.textContent).toContain('right blast zone');
 panel!.reset();
 expect(readout.textContent).not.toContain('right blast zone');
 expect(document.getElementById('dojo-launch-percent-partner')!.textContent).toContain('100%');
});


it.each([true,false])('logs distinct Attack releases and the actual charge stop (stick first %s)',stickFirst=>{
 make();
 const observe=(tick:number,chargeFrames:number,faceAttackHeld:boolean,rightStickHeld:boolean,pressed=0,released=0)=>{
  const p={state:'ATTACK',stateFrame:tick-1,currentMoveId:M.UP_SMASH,chargeFrames};
  const input={playerId:'local-p1',tick,seq:tick,held:faceAttackHeld||rightStickHeld?B.ATTACK:0,
   pressed,released,faceAttackHeld,rightStickHeld};
  panel!.observe({tick,players:{'local-p1':p}} as unknown as GameState,new Map([['local-p1',input]]));
 };
 observe(1,0,true,true,B.ATTACK);
 observe(2,1,true,true);
 // The first release has no shared release bit, and charge advances on that tick.
 observe(3,2,stickFirst,!stickFirst);
 // A new press can skip a charge tick without ending the hold.
 observe(4,2,true,true,B.ATTACK);
 observe(5,3,stickFirst,!stickFirst);
 observe(6,3,false,false,0,B.ATTACK);
 observe(7,3,false,false);
 const trace=document.getElementById('dojo-input-trace')!.textContent!;
 const first=stickFirst?'right stick':'face Attack';
 const last=stickFirst?'face Attack':'right stick';
 expect(trace).toContain('Tick 3 · Release '+first);
 expect(trace).toContain('Tick 6 · Release '+last+' → Smash charge stopped · 3 ticks');
 expect(trace.match(/Smash charge stopped/g)).toHaveLength(1);
 expect(trace).not.toContain('Release attack');
});

it('marks the charge cap once even if the player releases afterward',()=>{
 make();
 for(let tick=1;tick<=SMASH_CHARGE_MAX_FRAMES+2;tick++){
  const held=tick<=SMASH_CHARGE_MAX_FRAMES+1;
  const p={state:'ATTACK',stateFrame:tick-1,currentMoveId:M.UP_SMASH,
   chargeFrames:Math.min(tick-1,SMASH_CHARGE_MAX_FRAMES)};
  const input={playerId:'local-p1',tick,seq:tick,held:held?B.ATTACK:0,
   pressed:tick===1?B.ATTACK:0,released:held?0:B.ATTACK,rightStickHeld:held};
  panel!.observe({tick,players:{'local-p1':p}} as unknown as GameState,new Map([['local-p1',input]]));
 }
 const trace=document.getElementById('dojo-input-trace')!.textContent!;
 expect(trace).toContain('Tick '+(SMASH_CHARGE_MAX_FRAMES+1)+' · Smash charge stopped · '+SMASH_CHARGE_MAX_FRAMES+' ticks · cap');
 expect(trace).toContain('Tick '+(SMASH_CHARGE_MAX_FRAMES+2)+' · Release right stick');
 expect(trace.match(/Smash charge stopped/g)).toHaveLength(1);
});

it('updates the Dojo lesson and timing shortcuts for the assigned controller',()=>{
 let profile:ControllerProfile=CONTROLLER_PROFILES.xbox360;
 make('short-hop',()=>profile);
 const guide=()=>document.getElementById('dojo-controller-guide')!.textContent;
 expect(guide()).toContain('Tap X / Y, or X + Y');
 const observe=(tick:number)=>{
  const input={playerId:'local-p1',tick,seq:tick,held:B.JUMP,pressed:B.JUMP,released:0,jumpButtons:3};
  panel!.observe({tick,players:{'local-p1':{state:'IDLE',stateFrame:tick}}}as unknown as GameState,new Map([['local-p1',input]]));
 };
 profile=CONTROLLER_PROFILES.switchPro;observe(1);
 expect(guide()).toContain('Tap Y / X, or Y + X');
 expect(document.getElementById('practice-panel')!.textContent).toContain('− freezes, then steps');
 expect(document.getElementById('dojo-input-trace')!.textContent).toContain('Y + X');
 profile=CONTROLLER_PROFILES.dualSense;observe(2);
 expect(guide()).toContain('Tap Square / Triangle, or Square + Triangle');
 expect(document.getElementById('practice-panel')!.textContent).toContain('Create freezes, then steps');
 expect(document.getElementById('practice-panel')!.textContent).toContain('Escape / Options pauses');
 expect(document.getElementById('dojo-input-trace')!.textContent).toContain('Square + Triangle');
});