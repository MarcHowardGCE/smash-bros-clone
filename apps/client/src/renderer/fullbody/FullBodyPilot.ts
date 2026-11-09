import {dodgeAnimationFrame} from '@smash/engine';
import{selectResultFrame}from'./presentationTimeline.js';
import {footstoolPoint} from './footstoolPose.js';
import {PREPARED_LIVE_CLIPS,selectPreparedFrame,type PreparedContext} from './preparedHooks.js';
import {getMoveDataForCharacter} from '@smash/engine';
import {solveGrabContact} from "./contactPose.js";
import { Assets, ImageSource, Rectangle, Sprite, Texture } from 'pixi.js';
import { getCharacterStats, type CharacterId, type MoveId } from '@smash/shared';
import { selectPilotFrame, type PilotClip } from './pilotTimeline.js';
export interface GrabContactContext {artId?:DojoArtId;characterId:CharacterId;state:string;frame:number;move:MoveId|null;dx:number;dy:number;facing:1|-1}
interface Frame { mirrorSource?:boolean;image?:string; sockets?:Record<string,number[]>; rect: number[]; root: number[]; offsetY?: number; airRoot?: number[] }
interface Clip { durations?:number[]; activeWindow?:[number,number]; rotationPeriod?:number; previewOnly?:boolean; mirrorSource?: boolean; image: string; scale: number; frames: Frame[] }
interface CharacterManifest { clips: Partial<Record<PilotClip, Clip>> }
export type DojoArtId = 'moonshine' | 'hulk-hoagie';
type FighterArtId = CharacterId | DojoArtId;
interface Manifest extends CharacterManifest { revision?:number;production?:{sourceRevision:number}; effects?:Record<string,Clip & {rotation?:number;durations:number[]}>; version: number; characters?: Partial<Record<FighterArtId, CharacterManifest>> }
type LoadedClip = { durations?:number[]; activeWindow?:[number,number]; rotationPeriod?:number; mirrorSource?: boolean; scale: number; frames: { texture: Texture;mirrorSource?:boolean; root: number[]; offsetY: number; sockets?:Record<string,number[]>; airRoot?: number[] }[] };
export interface FullBodyPilotAssets {
 readonly packing?:"atlas"|"source";
 readonly effects?:Record<string,{scale:number;rotation:number;durations:number[];frames:{texture:Texture;root:number[]}[]}>;
 readonly characters: Partial<Record<FighterArtId, Partial<Record<PilotClip, LoadedClip>>>>;
}

const manifestLoads = new Map<string, Promise<Manifest>>();
const atlasPages = new Map<string, Promise<Texture>>();

async function fetchAtlasPage(url: string, timeoutMs: number): Promise<Texture> {
  const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) throw new Error(`Atlas page unavailable (${response.status}): ${url}`);
  const blob = await response.blob();
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(blob);
    return new Texture({ source: new ImageSource({ resource: bitmap, scaleMode: 'linear' }) });
  }

  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    return new Texture({ source: new ImageSource({ resource: image, scaleMode: 'linear' }) });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadAtlasPage(url: string, timeoutMs: number): Promise<Texture> {
  let pending = atlasPages.get(url);
  if (!pending) {
    // Own the fetch lifetime so a failed image cannot leave a pending Pixi worker load behind.
    pending = fetchAtlasPage(url, timeoutMs).catch(error => {
      atlasPages.delete(url);
      throw error;
    });
    atlasPages.set(url, pending);
  }
  return pending;
}
function loadManifest(url: string): Promise<Manifest> {
  let pending = manifestLoads.get(url);
  if (!pending) {
    pending = fetch(url, { signal: AbortSignal.timeout(20_000) }).then(response => {
      if (!response.ok) throw new Error('Pilot manifest unavailable');
      return response.json() as Promise<Manifest>;
    }).catch(error => {
      manifestLoads.delete(url);
      throw error;
    });
    manifestLoads.set(url, pending);
  }
  return pending;
}

/** Omit the selection for the full review pack, or pass an empty selection for shared effects. */
export async function preloadFullBodyPilot(dojo=false, selected?: readonly CharacterId[], includeEffects = true, requireIdle = false): Promise<FullBodyPilotAssets | undefined> {
 if(new URLSearchParams(window.location.search).get('renderer')==='legacy')return undefined;
 try {
  const base=dojo?'/fighter-art-newcomers-v1/':'/fighter-art-pilot-v1/';
  let manifest=await loadManifest(base+(dojo?'dojo/manifest.json':'manifest.json'));
  if(!dojo&&new URLSearchParams(window.location.search).get('atlas')!=='source'){
   try {
    const candidate=await loadManifest(base+'production/manifest.json');
    if(candidate.version===1&&candidate.production?.sourceRevision===manifest.revision)manifest=candidate;
   }catch(error){console.warn('[fighter-art-pilot] Atlas unavailable; using source sheets',error);}
  }
  const textureTimeoutMs=manifest.production?60_000:15_000;
  const pageCache=new Map<string,Promise<Texture>>();
  function loadPage(file: string): Promise<Texture> {
    let promise = pageCache.get(file);
    if (!promise) {
      promise = manifest.production || dojo
        ? loadAtlasPage(base + file, textureTimeoutMs)
        : Assets.load<Texture>(base + file).then(texture => {
          texture.source.scaleMode = 'linear';
          return texture;
        });
      pageCache.set(file, promise);
    }
    return promise;
  }

  if(manifest.version!==1)throw new Error('Unsupported pilot version');
  const characters=manifest.characters??{'all-rounder':{clips:manifest.clips}};
  const entries=await Promise.all((Object.entries(characters) as [FighterArtId,CharacterManifest][]).filter(([id])=>!selected||selected.includes(id)).map(async([characterId,character])=>{
   const clips=await Promise.all((Object.entries(character.clips) as [PilotClip,Clip][]).filter(([name,clip])=>!clip.previewOnly||PREPARED_LIVE_CLIPS.includes(name)).map(async([name,clip])=>{
    let timer:ReturnType<typeof setTimeout>|undefined;
    try {
     const bases=await Promise.race([Promise.all(clip.frames.map(f=>loadPage(f.image??clip.image))),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('Pilot texture timeout')),textureTimeoutMs);})]);
     return [name,{durations:clip.durations,activeWindow:clip.activeWindow,rotationPeriod:clip.rotationPeriod,mirrorSource:clip.mirrorSource,scale:clip.scale,frames:clip.frames.map((frame,i)=>({texture:new Texture({source:bases[i]!.source,frame:new Rectangle(frame.rect[0],frame.rect[1],frame.rect[2],frame.rect[3])}),root:frame.root,mirrorSource:frame.mirrorSource,sockets:frame.sockets,offsetY:dojo?getCharacterStats(characterId).hurtboxRadius:frame.offsetY??28,airRoot:frame.airRoot}))}] as const;
    } catch (error) {
     console.warn('[fighter-art-pilot] Missing clip; using existing artwork', characterId, name, error);
     if (requireIdle && name === 'idle') throw error;
     return null;
    }
    finally{if(timer!==undefined)clearTimeout(timer);}
   }));
   return [characterId,Object.fromEntries(clips.filter((entry):entry is NonNullable<typeof entry>=>entry!==null))] as const;
  }));
  if(selected?.length!==0&&!entries.some(([,clips])=>Object.keys(clips).length>0))return undefined;
  const effects:NonNullable<FullBodyPilotAssets['effects']>={};
  for(const[name,e]of Object.entries(includeEffects?manifest.effects??{}:{})){let timer:ReturnType<typeof setTimeout>|undefined;try{const bases=await Promise.race([Promise.all(e.frames.map(f=>loadPage(f.image??e.image))),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('Effect timeout')),textureTimeoutMs);})]);effects[name]={scale:e.scale,rotation:e.rotation??0,durations:e.durations,frames:e.frames.map((f,i)=>({texture:new Texture({source:bases[i]!.source,frame:new Rectangle(...f.rect as [number,number,number,number])}),root:f.root}))};}catch(error){console.warn('[fighter-art-pilot] Effect unavailable',name,error);}finally{if(timer!==undefined)clearTimeout(timer);}}
  if (selected?.length===0 && !Object.keys(effects).length) return undefined;
  return {characters:Object.fromEntries(entries),effects,packing:manifest.production?"atlas":"source"};
 }catch(error){console.warn('[fighter-art-pilot] Using existing fighter artwork',error);return undefined;}
}
function dojoFrame(clip:LoadedClip,age:number):number{
  for(const [index,ticks] of (clip.durations??[]).entries()){
    if(age<ticks)return index;
    age-=ticks;
  }
  return clip.frames.length-1;
}
export class FullBodyPilot {
 readonly sprite=new Sprite();
 readonly effectSprite=new Sprite();
 private reaction:{move:MoveId;facing:1|-1;start:number|null}|null=null;private wasVictim=false;private lastVictimFlip=1;private releaseStart:number|null=null;
 startGrabReaction(move:MoveId,facing:1|-1):void{this.reaction={move,facing,start:null};this.contactRebase=true;}
 private lastContact:[number,number]=[0,0];private lastContactFacing:1|-1=1;private contactRebase=false;private lastHolder:{clip:LoadedClip;index:number;dx:number;dy:number}|null=null;
 private ledgeFacing:1|-1=1;private previousState="";private ledgeRelease:{clip:PilotClip;start:number}|null=null;
 private contactExit?:{kind:"ledge"|"footstool";x:number;y:number;state?:string;start?:number};
 private previousDoubleJump:boolean|undefined;
 private resultStart:number|null=null;private resultKind:string|undefined;
 private doubleJumpCue:{state:string;frame:number;elapsed:number}|null=null;
 private dojoProneFrame=0;
 private lastFrame=0;private counterStart:number|null=null;
 startCounterReaction():void{this.counterStart=this.lastFrame;}
 constructor(private assets:FullBodyPilotAssets,private readonly characterId:CharacterId='all-rounder',readonly artId?:DojoArtId){this.sprite.visible=false;this.effectSprite.visible=false;}
 setAssets(assets: FullBodyPilotAssets): void { this.assets = assets; }
 update(state:string,frame:number,move:MoveId|null,enabled:boolean,vy?:number,hasDoubleJump=true,isTumbling=false,rollDirection:1|-1=1,chargeFrames=0,grabVictim=false,victimFlip=1,facing:1|-1=1,grabOwner?:GrabContactContext,ledgeId?:string|null,prepared:PreparedContext={}):boolean {
  enabled=enabled||Boolean(prepared.result);
  if(this.previousState==="LEDGE_HANG"&&state==="AIRBORNE")this.ledgeRelease={clip:(vy??0)<-1?"ledge_trump":"ledge_drop",start:frame};this.previousState=state;
  let selected=enabled?selectPilotFrame(state,(state==='ROLL'||state==='SPOT_DODGE')?dodgeAnimationFrame({...prepared,characterId:this.characterId,state},frame):frame,move,vy,hasDoubleJump,isTumbling,this.characterId,chargeFrames,grabVictim):null;
  if(enabled)selected=selectPreparedFrame(state,frame,vy,{...prepared,facing})??selected;
  const airborne=state==='AIRBORNE'||state==='DOUBLE_JUMP';
  if(enabled&&airborne&&this.previousDoubleJump===true&&!hasDoubleJump)this.doubleJumpCue={state,frame,elapsed:0};
  else if(this.doubleJumpCue){const cue=this.doubleJumpCue;if(!enabled||!airborne)this.doubleJumpCue=null;else{cue.elapsed+=cue.state===state?Math.max(0,frame-cue.frame):Math.max(1,frame);cue.state=state;cue.frame=frame;if(cue.elapsed>=12)this.doubleJumpCue=null;}}
  this.previousDoubleJump=hasDoubleJump;
  if(prepared.footstoolRole)this.doubleJumpCue=null;
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
  if(prepared.result){if(this.resultStart===null||this.resultKind!==prepared.result){this.resultStart=performance.now();this.resultKind=prepared.result;}selected=selectResultFrame(prepared.result,prepared.presentationVariant??0,(performance.now()-this.resultStart)*.06);this.effectSprite.visible=false;}
  else{this.resultStart=null;this.resultKind=undefined;}
  const art = this.assets.characters[this.artId??this.characterId];
  if(this.artId&&selected?.clip.startsWith('takeoff_')&&state==='AIRBORNE'&&(prepared.artCueFrame??0)>=6){
   selected=selectPreparedFrame(state,frame,vy,{...prepared,artCue:undefined,facing})??selected;
  }
  let clip=selected?art?.[selected.clip]:undefined;
  if(this.artId&&selected&&clip){
   if(selected.clip==='grabbed'){
    const name=frame<5?'grabbed':'grabbed_hold_preview';
    clip=(art as Record<string,LoadedClip>)[name]??clip;
    selected={...selected,index:frame<5?1:0};
   }else if(selected.clip==='grab_release'&&this.releaseStart!==null){
    clip=(art as Record<string,LoadedClip>).grab_release_victim_preview??clip;
    selected={...selected,index:frame-this.releaseStart<5?1:2};
   }else if(selected.clip==='pummel_victim'&&this.reaction){
    selected={...selected,index:frame-(this.reaction.start??frame)<4?1:2};
   }else if(selected.clip==='throw_victim'&&this.reaction){
    const name={BACK_THROW:'back_throw_victim_preview',UP_THROW:'up_throw_victim_preview',DOWN_THROW:'down_throw_victim_preview'}[this.reaction.move as 'BACK_THROW'|'UP_THROW'|'DOWN_THROW'];
    if(name)clip=(art as Record<string,LoadedClip>)[name]??clip;
    selected={...selected,index:Math.min(2,1+Math.floor((frame-(this.reaction.start??frame))/6))};
   }else if(move&&clip.activeWindow&&(state==='ATTACK'||state==='AIR_ATTACK')){
    const data=getMoveDataForCharacter(this.characterId,move);
    const age=Math.max(0,frame-(data.chargeMax?Math.min(chargeFrames,data.chargeMax):0));
    const [start,end]=clip.activeWindow;
    const active=Math.max(1,data.activeFrames);
    const floorAttack=selected.clip.startsWith('floor_attack_');
    const previewAge=age<data.startupFrames?age*start/Math.max(1,data.startupFrames):
      age<data.startupFrames+active?start+(age-data.startupFrames)*(end-start)/active:
      end+(age-data.startupFrames-active);
    let index=dojoFrame(clip,previewAge);
    if(floorAttack&&age<data.startupFrames){
     const hold=clip.durations![0]!+clip.durations![1]!;
     index=age<2?this.dojoProneFrame:dojoFrame(clip,hold+(age-2)*(start-hold)/Math.max(1,data.startupFrames-2));
    }
    selected={...selected,index};
   }else if(clip.durations&&['idle','walk','run','jump_squat','tumble','air_rise_loop','air_apex_loop','air_fall_loop','air_fastfall_loop'].includes(selected.clip)){
    const period=clip.durations.reduce((sum,ticks)=>sum+ticks,0);
    const age=selected.clip==='air_rise_loop'&&prepared.artCue?.startsWith('takeoff_')?Math.max(0,frame-6):frame;
    selected={...selected,index:dojoFrame(clip,selected.clip==='jump_squat'?age:age%period)};
   }else if(selected.clip.startsWith('footstool_')){
    selected={...selected,index:(prepared.footstoolFrame??0)<4?1:2};
   }else if(clip.durations&&selected.clip.startsWith('takeoff_')&&state==='AIRBORNE'){
    selected={...selected,index:clip.frames.length-1};
   }else if(clip.durations&&(selected.clip==='prone_up'||selected.clip==='prone_down'||selected.clip==='trip_prone')){
    const period=clip.durations.reduce((sum,ticks)=>sum+ticks,0);
    const age=selected.clip==='trip_prone'?frame:Math.max(0,frame-18);
    this.dojoProneFrame=dojoFrame(clip,age%period);
    selected={...selected,index:this.dojoProneFrame};
   }else if(clip.durations&&(state==='GETUP'||state==='GETUP_ROLL'||state==='TRIP_GETUP'||state==='TRIP_ROLL')){
    const hold=clip.durations[0]!+clip.durations[1]!;
    selected={...selected,index:frame<2?this.dojoProneFrame:dojoFrame(clip,hold+frame-2)};
   }else if(clip.durations&&selected.clip==='teeter_front'){
    const period=clip.durations.reduce((sum,ticks)=>sum+ticks,0);
    selected={...selected,index:dojoFrame(clip,(prepared.artCueFrame??frame)%period)};
   }else if(selected.clip==='double_jump_transition'){
    selected={...selected,index:Math.min(clip.frames.length-1,selected.index)};
   }else{
    const reference=this.assets.characters[this.artId==='moonshine'?'swift':'abe-lincoln']?.[selected.clip]?.frames.length??clip.frames.length;
    selected={...selected,index:Math.round(selected.index*(clip.frames.length-1)/Math.max(1,reference-1))};
   }
  }
  let drawing=selected&&clip?clip.frames[Math.max(0,Math.min(clip.frames.length-1,selected.index))]:undefined;
  if(enabled&&!drawing){
   // Keep the equipped art during incomplete transition snapshots.
   const fallback=state==='AIR_ATTACK'||airborne?'air_fall_loop':'idle';
   const fallbackClip=art?.[fallback]?.frames.length?fallback:'idle';
   selected={clip:fallbackClip,index:0};
   clip=art?.[fallbackClip];
   drawing=clip?.frames[0];
  }
  this.sprite.visible=Boolean(drawing);
  if(!selected||!clip||!drawing){this.contactExit=undefined;return false;}
  this.sprite.label=selected.clip;
  this.sprite.texture=drawing.texture;
  this.sprite.rotation=clip.rotationPeriod?(Math.max(0,Math.floor(Number.isFinite(frame)?frame:0))%clip.rotationPeriod)/clip.rotationPeriod*Math.PI*2:0;
  this.sprite.scale.set(clip.scale*(clip.mirrorSource?-1:1)*(drawing.mirrorSource?-1:1)*(this.reaction?reactionFlip:selected.clip==='grab_release'?this.lastVictimFlip:['grabbed','pummel_victim'].includes(selected.clip)?victimFlip:(selected.clip==='roll'||selected.clip==='tech_roll')?rollDirection:1),clip.scale);
  const newcomerHeld=this.artId&&['grabbed','pummel_victim','grab_release'].includes(selected.clip);
  if(newcomerHeld)this.sprite.scale.x*=-1;
  const airborneSpecial=state==='AIR_ATTACK'&&drawing.airRoot;const root=airborneSpecial?drawing.airRoot!:drawing.root;
  this.sprite.pivot.set(root[0],root[1]);
  const floorOffset=this.artId?getCharacterStats(this.characterId).hurtboxRadius:drawing.offsetY;
  this.sprite.position.set(0,airborneSpecial?0:floorOffset);
  if(grabVictim&&grabOwner){
   const owner=selectPilotFrame(grabOwner.state,grabOwner.frame,grabOwner.move,0,true,false,grabOwner.characterId);
   const holder=owner?this.assets.characters[grabOwner.artId??grabOwner.characterId]?.[owner.clip]:undefined;
   if(owner&&holder){
    const hi=grabOwner.artId?(owner.clip==='grab_hold'?0:owner.index>=3?1:0):owner.index;
    const receiver=newcomerHeld?{...clip,mirrorSource:!clip.mirrorSource}:clip;
    this.lastHolder={clip:holder,index:hi,dx:grabOwner.dx,dy:grabOwner.dy};
    this.lastContactFacing=grabOwner.facing;
    this.contactRebase=false;
    this.lastContact=solveGrabContact(holder,hi,receiver,selected.index,grabOwner.dx,grabOwner.dy,owner.clip.endsWith('_throw'));
    this.sprite.position.x=this.lastContact[0]*grabOwner.facing*facing;
    this.sprite.position.y+=this.lastContact[1];
   }
  }else if(this.reaction||this.releaseStart!==null){if(this.contactRebase&&this.lastHolder&&this.reaction&&!this.artId){const h=this.lastHolder;this.lastContact=solveGrabContact(h.clip,h.index,clip,selected.index,h.dx,h.dy,true);this.contactRebase=false;}const t=this.reaction?.start!==null&&this.reaction?.start!==undefined?frame-this.reaction.start:this.releaseStart!==null?frame-this.releaseStart:12;const weight=Math.max(0,1-t/12);this.sprite.position.x=this.lastContact[0]*this.lastContactFacing*facing*weight;this.sprite.position.y+=this.lastContact[1]*weight;}else {this.lastContact=[0,0];this.lastHolder=null;this.contactRebase=false;}
  let contactCorrection:{kind:'ledge'|'footstool';x:number;y:number}|undefined;
  if(selected.clip==='footstool_attacker'&&prepared.footstoolContact){
   const contact=prepared.footstoolContact,victim=this.assets.characters[contact.artId??contact.characterId]?.[contact.role==='ground'?'footstool_ground_victim':'footstool_air_victim'];
   const vi=contact.artId?(contact.frame<4?1:2):Math.min(5,Math.floor(Math.max(0,contact.frame)/3)),sole=footstoolPoint(clip,selected.index,'footstoolSole',facing),head=victim?footstoolPoint(victim,vi,'footstoolHead',contact.facing):null;
   if(sole&&head&&this.artId){contactCorrection={kind:"footstool",x:contact.dx+head[0]-sole[0],y:contact.dy+head[1]-sole[1]};}
   else if(sole&&head){const weight=this.artId?1:Math.max(0,1-(prepared.footstoolFrame??0)/6);this.sprite.position.x+=(contact.dx+head[0]-sole[0])*facing*weight;this.sprite.position.y+=(contact.dy+head[1]-sole[1])*weight;}
  }
  const floorRoll=selected.clip.startsWith('getup_roll')||selected.clip==='trip_roll';
  if(floorRoll&&(!this.artId||selected.index===(selected.clip==='trip_roll'?2:3)))this.sprite.scale.x=Math.abs(this.sprite.scale.x)*(prepared.floorRollDirection??facing)*facing*(drawing.mirrorSource?-1:1);
  if(ledgeId)this.ledgeFacing=ledgeId==='left'?1:-1;
  if(selected.clip.startsWith('ledge_')){
   const inward=this.ledgeFacing;
   this.sprite.scale.x=Math.abs(this.sprite.scale.x)*inward*facing;
   const contact=prepared.ledgeContact;
   const grip=this.artId&&contact?footstoolPoint(clip,selected.index,'ledgeGrip',inward):null;
   if(contact&&grip){
    contactCorrection={kind:"ledge",x:contact.dx-grip[0],y:contact.dy-grip[1]};

   }
  }
  if(contactCorrection)this.contactExit=contactCorrection;
  const exit=this.contactExit;
  if(exit){
   const followsContact=exit.kind==='ledge'?selected.clip.startsWith('ledge_'):selected.clip==='footstool_attacker'||state==='AIRBORNE'||state==='DOUBLE_JUMP';
   if(!contactCorrection&&followsContact&&exit.state!==state){exit.state=state;exit.start=frame;}
   const weight=contactCorrection?1:followsContact?Math.max(0,1-(frame-(exit.start??frame)+1)/6):0;
   if(weight>0){this.sprite.position.x+=exit.x*facing*weight;this.sprite.position.y+=exit.y*weight;}
   else this.contactExit=undefined;
  }
  return true;
 }
}



