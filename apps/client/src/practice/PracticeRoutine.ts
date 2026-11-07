import{INPUT_BITS as B,type InputEvent,type CharacterId,isCharacterId}from'@smash/shared';
export type RoutineFrame=Pick<InputEvent,'held'|'pressed'|'released'|'stickX'|'stickY'|'cStickX'|'cStickY'|'jumpButtons'|'smashAttack'>;
export interface RoutineTape {version:1;fighter:CharacterId;frames:RoutineFrame[]}
const fields=['held','pressed','released','stickX','stickY','cStickX','cStickY','jumpButtons','smashAttack']as const;
export const MAX_ROUTINE_TICKS=900;
function copy(input:InputEvent|null|undefined):RoutineFrame{const frame:RoutineFrame={held:0,pressed:0,released:0};if(input)for(const key of fields)if(input[key]!==undefined)(frame as any)[key]=input[key];return frame;}
function mirrorBits(n:number):number{return(n&~(B.LEFT|B.RIGHT))|((n&B.LEFT)?B.RIGHT:0)|((n&B.RIGHT)?B.LEFT:0);}
/** Validates device storage and copies only supported input fields. Never restores player state. */
export function decodeRoutine(raw:string|null):RoutineTape|null{
 if(!raw||raw.length>500000)return null;
 try{const data=JSON.parse(raw);if(data.version!==1||!(isCharacterId(data.fighter)||data.fighter==='moonshine'||data.fighter==='hulk-hoagie')||!Array.isArray(data.frames)||data.frames.length>MAX_ROUTINE_TICKS)return null;
 const frames:RoutineFrame[]=[];for(const f of data.frames){if(!f||typeof f!=='object')return null;for(const key of['held','pressed','released'])if(!Number.isInteger(f[key])||f[key]<0||f[key]>4095)return null;for(const key of['stickX','stickY','cStickX','cStickY'])if(f[key]!==undefined&&(typeof f[key]!=='number'||!Number.isFinite(f[key])||Math.abs(f[key])>1))return null;if(f.jumpButtons!==undefined&&(!Number.isInteger(f.jumpButtons)||f.jumpButtons<0||f.jumpButtons>3))return null;if(f.smashAttack!==undefined&&typeof f.smashAttack!=='boolean')return null;frames.push(copy(f));}return{version:1,fighter:data.fighter,frames};}catch{return null;}
}
/** Tick-indexed input recorder/player. Playback owns no clocks, collisions or fighter state. */
export class PracticeRoutine {
 private frames:RoutineFrame[]=[];private fighter:CharacterId='all-rounder';private cursor=0;private delay=0;private lastHeld=0;private _mode:'idle'|'recording'|'playing'='idle';
 mirror=true;loop=true;delayTicks=60;
 get sourceFighter(){return this.fighter;}
 get mode(){return this._mode;}get length(){return this.frames.length;}get position(){return this.cursor;}
 get tape():RoutineTape{return{version:1,fighter:this.fighter,frames:this.frames.map(f=>({...f}))};}
 get status():string{return this._mode==='recording'?'Recording '+this.length+' / 900 ticks':this._mode==='playing'?(this.delay?'Repeat in '+this.delay+' ticks':'Playing '+this.cursor+' / '+this.length+' ticks'):(this.length?'Saved '+this.length+' ticks ('+(this.length/60).toFixed(1)+' simulation seconds)':'Empty routine');}
 load(tape:RoutineTape|null):void{this.stop();this.frames=tape?.frames.map(f=>({...f}))??[];this.fighter=tape?.fighter??'all-rounder';}
 startRecording(fighter:CharacterId):void{this.stop();this.frames=[];this.fighter=fighter;this._mode='recording';}
 capture(input:InputEvent|null|undefined):boolean{if(this._mode!=='recording')return false;this.frames.push(copy(input));if(this.frames.length>=MAX_ROUTINE_TICKS){this.stop();return true;}return false;}
 play():boolean{if(!this.frames.length)return false;this.rewind();this._mode='playing';return true;}
 rewind():void{this.cursor=0;this.delay=0;this.lastHeld=0;}
 stop():void{this._mode='idle';this.rewind();}
 next(playerId:string,tick:number):InputEvent{
  const neutral=()=>{const released=this.lastHeld;this.lastHeld=0;return{playerId,tick,seq:tick,held:0,pressed:0,released};};
  if(this._mode!=='playing')return neutral();
  if(this.cursor>=this.frames.length){if(!this.loop){const released=this.lastHeld;this.stop();return{...neutral(),released};}this.cursor=0;this.delay=Math.max(0,Math.min(600,Math.floor(this.delayTicks)));}
  if(this.delay>0){this.delay--;return neutral();}
  const source=this.frames[this.cursor++]!,frame={...source};
  if(this.mirror){frame.held=mirrorBits(frame.held);frame.pressed=mirrorBits(frame.pressed);frame.released=mirrorBits(frame.released);if(frame.stickX!==undefined)frame.stickX=-frame.stickX;if(frame.cStickX!==undefined)frame.cStickX=-frame.cStickX;}
  const result={...frame,playerId,tick,seq:tick,pressed:frame.pressed|(frame.held&~this.lastHeld),released:frame.released|(this.lastHeld&~frame.held)};this.lastHeld=frame.held;return result;
 }
}
