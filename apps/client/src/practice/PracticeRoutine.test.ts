import{it,expect}from'vitest';import{PracticeRoutine,decodeRoutine,MAX_ROUTINE_TICKS}from'./PracticeRoutine.js';import{INPUT_BITS as B}from'@smash/shared';
const frame=(held=0,pressed=held,released=0)=>({playerId:'a',tick:0,seq:0,held,pressed,released});
it('records all controller fields by value and validates a saved tape',()=>{const r=new PracticeRoutine();r.startRecording('swift');const i={...frame(B.RIGHT|B.ATTACK),stickX:.8,stickY:-.4,cStickX:-1,cStickY:0,jumpButtons:3,smashAttack:true};r.capture(i);i.stickX=-1;r.stop();expect(r.tape.frames[0]!.stickX).toBe(.8);expect(decodeRoutine(JSON.stringify(r.tape))).toEqual(r.tape);});
it('mirrors horizontal digital and analog inputs without flipping vertical intent',()=>{const r=new PracticeRoutine();r.startRecording('all-rounder');r.capture({...frame(B.RIGHT|B.UP,B.RIGHT,B.LEFT),stickX:.8,stickY:-1,cStickX:-.6,cStickY:.3});r.stop();r.play();expect(r.next('partner',25)).toMatchObject({playerId:'partner',tick:25,seq:25,held:B.LEFT|B.UP,pressed:B.LEFT|B.UP,released:B.RIGHT,stickX:-.8,stickY:-1,cStickX:.6,cStickY:.3});});
it('loop delay contains the exact requested number of neutral ticks',()=>{const r=new PracticeRoutine();r.startRecording('all-rounder');r.capture(frame(B.ATTACK));r.capture(frame(0,0,B.ATTACK));r.stop();r.delayTicks=2;r.play();expect(Array.from({length:5},(_,i)=>r.next('b',i).held)).toEqual([B.ATTACK,0,0,0,B.ATTACK]);});
it('one-shot playback releases the last held input when it ends',()=>{const r=new PracticeRoutine();r.startRecording('all-rounder');r.capture(frame(B.SHIELD));r.stop();r.loop=false;r.play();expect(r.next('b',0).held).toBe(B.SHIELD);expect(r.next('b',1)).toMatchObject({held:0,released:B.SHIELD});expect(r.mode).toBe('idle');});
it('stops recording at the bounded tick limit',()=>{const r=new PracticeRoutine();r.startRecording('abe-lincoln');for(let i=0;i<MAX_ROUTINE_TICKS-1;i++)expect(r.capture(frame())).toBe(false);expect(r.capture(frame())).toBe(true);expect(r.mode).toBe('idle');r.capture(frame());expect(r.length).toBe(MAX_ROUTINE_TICKS);});
it('rejects corrupt storage, wrong versions and invalid input ranges',()=>{expect(decodeRoutine('{')).toBeNull();for(const data of[{version:2,fighter:'swift',frames:[]},{version:1,fighter:'unknown',frames:[]},{version:1,fighter:'swift',frames:[{held:-1,pressed:0,released:0}]},{version:1,fighter:'swift',frames:[{held:0,pressed:0,released:0,stickX:2}]},{version:1,fighter:'swift',frames:new Array(901).fill({held:0,pressed:0,released:0})}])expect(decodeRoutine(JSON.stringify(data))).toBeNull();});
it('replays deterministic inputs independently of supplied wall-clock tick labels',()=>{const r=new PracticeRoutine();r.startRecording('swift');for(let i=0;i<20;i++)r.capture(frame(i%3?B.LEFT:0,i%3?B.LEFT:0));r.stop();r.mirror=false;r.loop=false;const play=(offset:number)=>{r.play();return Array.from({length:20},(_,i)=>{const p=r.next('b',i+offset);return[p.held,p.pressed,p.released];});};expect(play(0)).toEqual(play(200));});

it('plays recorded Attack edges without inventing one after a partial stick release',()=>{
 const r=new PracticeRoutine();
 r.startRecording('swift');
 r.capture({...frame(B.ATTACK),cStickX:0,cStickY:-1,faceAttackPressed:false,rightStickHeld:true});
 r.capture({...frame(0,0,B.ATTACK),rightStickHeld:false});
 r.capture({...frame(B.ATTACK,0),rightStickHeld:true});
 r.capture({...frame(B.ATTACK),faceAttackPressed:true,rightStickHeld:true});
 r.stop();r.play();
 const replay=Array.from({length:4},(_,i)=>r.next('b',i));
 expect(replay.map(v=>v.pressed)).toEqual([B.ATTACK,0,0,B.ATTACK]);
 expect(replay[2]).toMatchObject({held:B.ATTACK,rightStickHeld:true});
 expect(replay[3]?.faceAttackPressed).toBe(true);
});
