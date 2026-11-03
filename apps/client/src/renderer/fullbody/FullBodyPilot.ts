import {PREPARED_LIVE_CLIPS,selectPreparedFrame,type PreparedContext} from './preparedHooks.js';
import {getMoveDataForCharacter} from '@smash/engine';
import {solveGrabContact} from "./contactPose.js";
import { Assets, Rectangle, Sprite, Texture } from 'pixi.js';
import type { CharacterId, MoveId } from '@smash/shared';
import { selectPilotFrame, type PilotClip } from './pilotTimeline.js';
export interface GrabContactContext {characterId:CharacterId;state:string;frame:number;move:MoveId|null;dx:number;dy:number;facing:1|-1}
interface Frame { mirrorSource?:boolean;image?:string; sockets?:Record<string,number[]>; rect: number[]; root: number[]; offsetY?: number; airRoot?: number[] }
interface Clip { rotationPeriod?:number; previewOnly?:boolean; mirrorSource?: boolean; image: string; scale: number; frames: Frame[] }
interface CharacterManifest { clips: Partial<Record<PilotClip, Clip>> }
interface Manifest extends CharacterManifest { revision?:number;production?:{sourceRevision:number}; effects?:Record<string,Clip & {rotation?:number;durations:number[]}>; version: number; characters?: Partial<Record<CharacterId, CharacterManifest>> }
type LoadedClip = { rotationPeriod?:number; mirrorSource?: boolean; scale: number; frames: { texture: Texture;mirrorSource?:boolean; root: number[]; offsetY: number; sockets?:Record<string,number[]>; airRoot?: number[] }[] };
export interface FullBodyPilotAssets {
 readonly packing?:"atlas"|"source";
 readonly effects?:Record<string,{scale:number;rotation:number;durations:number[];frames:{texture:Texture;root:number[]}[]}>;
 readonly characters: Partial<Record<CharacterId, Partial<Record<PilotClip, LoadedClip>>>>;
}

/** Default sprite renderer: a missing clip uses the existing articulated renderer. */
export async function preloadFullBodyPilot(): Promise<FullBodyPilotAssets | undefined> {
 if(new URLSearchParams(window.location.search).get('renderer')==='legacy')return undefined;
 try {
  const response=await fetch('/fighter-art-pilot-v1/manifest.json',{signal:AbortSignal.timeout(5000)});
  if(!response.ok)throw new Error('Pilot manifest unavailable');
  let manifest=await response.json() as Manifest;
  if(new URLSearchParams(window.location.search).get('atlas')!=='source'){try{const r=await fetch('/fighter-art-pilot-v1/production/manifest.json',{signal:AbortSignal.timeout(5000)});if(r.ok){const candidate=await r.json() as Manifest;if(candidate.version===1&&candidate.production?.sourceRevision===manifest.revision)manifest=candidate;}}catch(error){console.warn('[fighter-art-pilot] Atlas unavailable; using source sheets',error);}}
  const pageCache=new Map<string,Promise<Texture>>();
  function loadPage(file:string):Promise<Texture>{let promise=pageCache.get(file);if(!promise){promise=Assets.load<Texture>('/fighter-art-pilot-v1/'+file).then(t=>{t.source.scaleMode='linear';return t;});pageCache.set(file,promise);}return promise;}

  if(manifest.version!==1)throw new Error('Unsupported pilot version');
  const characters=manifest.characters??{'all-rounder':{clips:manifest.clips}};
  const entries=await Promise.all((Object.entries(characters) as [CharacterId,CharacterManifest][]).map(async([characterId,character])=>{
   const clips=await Promise.all((Object.entries(character.clips) as [PilotClip,Clip][]).filter(([name,clip])=>!clip.previewOnly||PREPARED_LIVE_CLIPS.includes(name)).map(async([name,clip])=>{
    let timer:ReturnType<typeof setTimeout>|undefined;
    try {
     const bases=await Promise.race([Promise.all(clip.frames.map(f=>loadPage(f.image??clip.image))),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('Pilot texture timeout')),5000);})]);
     return [name,{rotationPeriod:clip.rotationPeriod,mirrorSource:clip.mirrorSource,scale:clip.scale,frames:clip.frames.map((frame,i)=>({texture:new Texture({source:bases[i]!.source,frame:new Rectangle(frame.rect[0],frame.rect[1],frame.rect[2],frame.rect[3])}),root:frame.root,mirrorSource:frame.mirrorSource,sockets:frame.sockets,offsetY:frame.offsetY??28,airRoot:frame.airRoot}))}] as const;
    }catch(error){console.warn('[fighter-art-pilot] Missing clip; using existing artwork',characterId,name,error);return null;}
    finally{if(timer!==undefined)clearTimeout(timer);}
   }));
   return [characterId,Object.fromEntries(clips.filter((entry):entry is NonNullable<typeof entry>=>entry!==null))] as const;
  }));
  if(!entries.some(([,clips])=>Object.keys(clips).length>0))return undefined;
  const effects:NonNullable<FullBodyPilotAssets['effects']>={};
  for(const[name,e]of Object.entries(manifest.effects??{})){let timer:ReturnType<typeof setTimeout>|undefined;try{const bases=await Promise.race([Promise.all(e.frames.map(f=>loadPage(f.image??e.image))),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('Effect timeout')),5000);})]);effects[name]={scale:e.scale,rotation:e.rotation??0,durations:e.durations,frames:e.frames.map((f,i)=>({texture:new Texture({source:bases[i]!.source,frame:new Rectangle(...f.rect as [number,number,number,number])}),root:f.root}))};}catch(error){console.warn('[fighter-art-pilot] Effect unavailable',name,error);}finally{if(timer!==undefined)clearTimeout(timer);}}
  return {characters:Object.fromEntries(entries),effects,packing:manifest.production?"atlas":"source"};
 }catch(error){console.warn('[fighter-art-pilot] Using existing fighter artwork',error);return undefined;}
}
export class FullBodyPilot {
 readonly sprite=new Sprite();
 readonly effectSprite=new Sprite();
 private reaction:{move:MoveId;facing:1|-1;start:number|null}|null=null;private wasVictim=false;private lastVictimFlip=1;private releaseStart:number|null=null;
 startGrabReaction(move:MoveId,facing:1|-1):void{this.reaction={move,facing,start:null};this.contactRebase=true;}
 private lastContact:[number,number]=[0,0];private lastContactFacing:1|-1=1;private contactRebase=false;private lastHolder:{clip:LoadedClip;index:number;dx:number;dy:number}|null=null;
 private ledgeFacing:1|-1=1;private previousState="";private ledgeRelease:{clip:PilotClip;start:number}|null=null;
 private previousDoubleJump:boolean|undefined;
 private doubleJumpCue:{state:string;frame:number;elapsed:number}|null=null;
 private lastFrame=0;private counterStart:number|null=null;
 startCounterReaction():void{this.counterStart=this.lastFrame;}
 constructor(private readonly assets:FullBodyPilotAssets,private readonly characterId:CharacterId='all-rounder'){this.sprite.visible=false;this.effectSprite.visible=false;}
 update(state:string,frame:number,move:MoveId|null,enabled:boolean,vy?:number,hasDoubleJump=true,isTumbling=false,rollDirection:1|-1=1,chargeFrames=0,grabVictim=false,victimFlip=1,facing:1|-1=1,grabOwner?:GrabContactContext,ledgeId?:string|null,prepared:PreparedContext={}):boolean {
  if(this.previousState==="LEDGE_HANG"&&state==="AIRBORNE")this.ledgeRelease={clip:(vy??0)<-1?"ledge_trump":"ledge_drop",start:frame};this.previousState=state;
  let selected=enabled?selectPilotFrame(state,frame,move,vy,hasDoubleJump,isTumbling,this.characterId,chargeFrames,grabVictim):null;
  if(enabled)selected=selectPreparedFrame(state,frame,vy,{...prepared,facing})??selected;
  const airborne=state==='AIRBORNE'||state==='DOUBLE_JUMP';
  if(enabled&&airborne&&this.previousDoubleJump===true&&!hasDoubleJump)this.doubleJumpCue={state,frame,elapsed:0};
  else if(this.doubleJumpCue){const cue=this.doubleJumpCue;if(!enabled||!airborne)this.doubleJumpCue=null;else{cue.elapsed+=cue.state===state?Math.max(0,frame-cue.frame):Math.max(1,frame);cue.state=state;cue.frame=frame;if(cue.elapsed>=12)this.doubleJumpCue=null;}}
  this.previousDoubleJump=hasDoubleJump;
  if(this.doubleJumpCue)selected={clip:'double_jump_transition',index:Math.min(5,Math.floor(this.doubleJumpCue.elapsed/2))};
  if(this.ledgeRelease){const t=frame-this.ledgeRelease.start;if(enabled&&state==="AIRBORNE"&&t>=0&&t<12)selected={clip:this.ledgeRelease.clip,index:Math.min(3,Math.floor(t/3))};else this.ledgeRelease=null;}
  if(this.counterStart!==null){const elapsed=frame-this.counterStart;if(enabled&&move==='DOWN_SPECIAL'&&(state==='ATTACK'||state==='AIR_ATTACK')&&elapsed>=0&&elapsed<12)selected={clip:'counter_success',index:Math.floor(elapsed/3)};else this.counterStart=null;}this.lastFrame=frame;
  let reactionFlip=1;
  if(grabVictim&&state==='GRAB_HOLDING')this.lastVictimFlip=victimFlip;
  if(this.wasVictim&&!grabVictim&&state==='IDLE')this.releaseStart=frame;this.wasVictim=grabVictim&&state==='GRAB_HOLDING';
  if(this.releaseStart!==null){const t=frame-this.releaseStart;if(enabled&&state==='IDLE'&&t>=0&&t<12)selected={clip:'grab_release',index:Math.floor(t/3)};else this.releaseStart=null;}
  if(this.reaction){const r=this.reaction,pummel=r.move==='PUMMEL';if(r.start===null)r.start=frame;const t=frame-r.start;const valid=pummel?state==='GRAB_HOLDING':state==='HITSTUN';if(enabled&&valid&&t>=0&&t<(pummel?8:18)){const direction=r.move==='FORWARD_THROW'?0:r.move==='BACK_THROW'?1:r.move==='UP_THROW'?2:3;selected=pummel?{clip:'pummel_victim',index:Math.min(3,Math.floor(t/2))}:{clip:'throw_victim',index:t<6?direction:r.move==='DOWN_THROW'&&t<12?4:5};reactionFlip=r.facing*facing;}else this.reaction=null;}
  this.effectSprite.visible=false;
  if(enabled&&selected&&(state==='ATTACK'||state==='AIR_ATTACK')&&move){
   const key=selected.clip==='neutral_special'?'neutral_burst':selected.clip==='side_special'?'side_trail':selected.clip==='up_special'?'recovery_trail':selected.clip==='counter_success'?'counter_flash':null;
   const effect=key?this.assets.effects?.[key]:undefined;
   const start=selected.clip==='counter_success'?this.counterStart??frame:getMoveDataForCharacter(this.characterId,move).startupFrames;
   let t=frame-start;
   if(effect&&t>=0){let index=0;while(index<effect.durations.length&&t>=effect.durations[index]!)t-=effect.durations[index++]!;const f=effect.frames[index];if(f){this.effectSprite.texture=f.texture;this.effectSprite.pivot.set(f.root[0],f.root[1]);this.effectSprite.scale.set(effect.scale);this.effectSprite.rotation=effect.rotation;this.effectSprite.position.set(key==='recovery_trail'?0:key==='side_trail'?18:22,key==='recovery_trail'?-25:key==='side_trail'?-10:this.characterId==='abe-lincoln'?-30:-22);this.effectSprite.visible=true;}}
  }
  const clip=selected?this.assets.characters[this.characterId]?.[selected.clip]:undefined;
  const drawing=selected&&clip?clip.frames[selected.index]:undefined;
  this.sprite.visible=Boolean(drawing);
  if(!selected||!clip||!drawing)return false;
  this.sprite.label=selected.clip;
  this.sprite.texture=drawing.texture;
  this.sprite.rotation=clip.rotationPeriod?(Math.max(0,Math.floor(Number.isFinite(frame)?frame:0))%clip.rotationPeriod)/clip.rotationPeriod*Math.PI*2:0;
  this.sprite.scale.set(clip.scale*(clip.mirrorSource?-1:1)*(drawing.mirrorSource?-1:1)*(this.reaction?reactionFlip:selected.clip==='grab_release'?this.lastVictimFlip:['grabbed','pummel_victim'].includes(selected.clip)?victimFlip:(selected.clip==='roll'||selected.clip==='tech_roll')?rollDirection:1),clip.scale);
  const airborneSpecial=state==='AIR_ATTACK'&&drawing.airRoot;const root=airborneSpecial?drawing.airRoot!:drawing.root;
  this.sprite.pivot.set(root[0],root[1]);
  this.sprite.position.set(0,airborneSpecial?0:drawing.offsetY);
  if(grabVictim&&grabOwner){
   const owner=selectPilotFrame(grabOwner.state,grabOwner.frame,grabOwner.move,0,true,false,grabOwner.characterId);
   const holder=owner?this.assets.characters[grabOwner.characterId]?.[owner.clip]:undefined;
   if(owner&&holder){this.lastHolder={clip:holder,index:owner.index,dx:grabOwner.dx,dy:grabOwner.dy};this.lastContactFacing=grabOwner.facing;this.contactRebase=false;this.lastContact=solveGrabContact(holder,owner.index,clip,selected.index,grabOwner.dx,grabOwner.dy,owner.clip.endsWith('_throw'));this.sprite.position.x=this.lastContact[0]*grabOwner.facing*facing;this.sprite.position.y+=this.lastContact[1];}
  }else if(this.reaction||this.releaseStart!==null){if(this.contactRebase&&this.lastHolder&&this.reaction){const h=this.lastHolder;this.lastContact=solveGrabContact(h.clip,h.index,clip,selected.index,h.dx,h.dy,true);this.contactRebase=false;}const t=this.reaction?.start!==null&&this.reaction?.start!==undefined?frame-this.reaction.start:this.releaseStart!==null?frame-this.releaseStart:12;const weight=Math.max(0,1-t/12);this.sprite.position.x=this.lastContact[0]*this.lastContactFacing*facing*weight;this.sprite.position.y+=this.lastContact[1]*weight;}else {this.lastContact=[0,0];this.lastHolder=null;this.contactRebase=false;}
  if(selected.clip.startsWith('getup_roll'))this.sprite.scale.x=Math.abs(this.sprite.scale.x)*(prepared.floorRollDirection??facing)*facing*(drawing.mirrorSource?-1:1);
  if(ledgeId)this.ledgeFacing=ledgeId==='left'?1:-1;
  if(selected.clip.startsWith('ledge_')){const inward=this.ledgeFacing;this.sprite.scale.x=Math.abs(this.sprite.scale.x)*inward*facing;}
  return true;
 }
}



