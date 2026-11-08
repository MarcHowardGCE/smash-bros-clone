import {dodgeTiming} from '@smash/engine';
import {PracticeLaunchReadout} from './PracticeLaunchReadout.js';
import type{LocalMatch}from'../local/LocalMatch.js';
import{PracticeRoutine,decodeRoutine}from'./PracticeRoutine.js';
import type{PracticeOverlay}from'./PracticeOverlay.js';
export interface PracticeLabAction{id:string;label:string;run:()=>void;disabled?:boolean}
import{INPUT_BITS as B,MoveId,SMASH_CHARGE_MAX_FRAMES,type GameState,type InputEvent,type HitEventData,type KOEventData}from'@smash/shared';import{dojoSimulationProfile,LESSONS,LessonTracker,type PracticeConfig}from'./curriculum.js';import type{PracticeDummy}from'./PracticeDummy.js';import{escapeHtml}from'../ui/selectionContent.js';
type PracticeSide = 'you' | 'partner';
const PRACTICE_IDS = {you:'local-p1',partner:'local-p2'} as const;
const PERCENT_PRESETS = [0,50,100,150,200];
export class PracticePanel {
 private launchReadout = new PracticeLaunchReadout();
 private previewSide: PracticeSide = 'you';
 private trace: string[] = [];
 private lastTracePose?: {
  state:string;move:string|null;frame:number;
  faceHeld?:boolean;stickHeld?:boolean;charge:number;charging:boolean;
 };
 private root=document.createElement('aside');private tracker:LessonTracker|null=null;private previousMove='';private recent='';private lastTick=-1;private success='';private level=0;private routineSlot=0;
 constructor(private config:PracticeConfig,private dummy:PracticeDummy,private resetArena:()=>void,private back:()=>void,private active:()=>boolean,private lab?:{match:LocalMatch;routine:PracticeRoutine;overlay:PracticeOverlay;previewKO?:(kind:'screen'|'star',side:PracticeSide)=>boolean}){
  this.root.addEventListener('keydown',this.interactiveKey);this.root.addEventListener('keyup',this.interactiveKey);this.root.id='practice-panel';this.root.className='dojo-panel';document.body.appendChild(this.root);this.level=Math.max(0,LESSONS.findIndex(l=>l.id===config.lessonId));this.loadSlot();this.setLesson(config.lessonId);window.addEventListener('keydown',this.key);
 }
 private interactiveKey=(e:KeyboardEvent)=>{if((e.target as Element)?.closest?.('button,summary,input,select')&&['Space','Enter','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.stopPropagation();};
 private key=(e:KeyboardEvent)=>{if(!this.active()||e.repeat||e.altKey||e.ctrlKey||e.metaKey)return;
 const fn:Record<string,()=>void>={KeyR:()=>this.reset(),F2:this.back,F3:()=>this.toggleOverlay(),F6:()=>this.toggleFreeze(),F7:()=>this.step(),F8:()=>this.toggleRecord(),F9:()=>this.togglePlayback()};
 if(fn[e.code]){e.preventDefault();fn[e.code]!();this.refreshLab();}
 };
 public reset():void{this.launchReadout.clear();this.refreshLaunch();this.trace=[];this.lastTracePose=undefined;this.refreshTrace();if(this.lab?.routine.mode==='recording'){this.lab.routine.stop();this.saveTape();}else this.lab?.routine.rewind();this.resetArena();this.dummy.reset();this.success='Arena reset. Progress kept.';this.refreshLab();}
 public toggleFreeze():void{if(!this.lab)return;if(this.lab.match.paused)this.lab.match.runPractice();else this.lab.match.freezePractice();this.refreshLab();}
 public step(fromMenu=false):void{this.lab?.match.stepPractice(fromMenu);this.refreshLab();}
 private toggleOverlay():void{if(this.lab)this.lab.overlay.setEnabled(!this.lab.overlay.enabled);}
 private speed():void{if(!this.lab)return;const speeds=[1,.5,.25];this.lab.match.setPracticeSpeed(speeds[(speeds.indexOf(this.lab.match.practiceSpeed)+1)%3]!);}
 private saveTape():void{if(!this.lab)return;try{localStorage.setItem('eth:dojo:routine:v1:'+this.routineSlot,JSON.stringify(this.lab.routine.tape));}catch{this.success='Routine kept for this session; device storage is unavailable.';}}
 private loadSlot():void{if(!this.lab)return;let tape=null;try{tape=decodeRoutine(localStorage.getItem('eth:dojo:routine:v1:'+this.routineSlot));}catch{}this.lab.routine.load(tape);}
 private slot():void{if(this.lab?.routine.mode==='recording'){this.lab.routine.stop();this.saveTape();}this.routineSlot=(this.routineSlot+1)%3;this.loadSlot();this.dummy.reset();}
 private toggleRecord():void{if(!this.lab||this.tracker)return;const r=this.lab.routine;if(r.mode==='recording'){r.stop();this.saveTape();this.success='Routine saved in slot '+(this.routineSlot+1)+'.';}else{this.reset();r.startRecording(dojoSimulationProfile(this.config.fighter));this.success='Recording your inputs. The partner will replay them.';}}
 private togglePlayback():void{if(!this.lab||this.tracker)return;const r=this.lab.routine;if(r.mode==='playing'){r.stop();this.success='Playback stopped.';}else{if(r.mode==='recording'){r.stop();this.saveTape();}this.reset();this.success=r.play()?'Partner playback started.':'Record a routine first.';}}
 private launchActions(): PracticeLabAction[] {
  if(!this.lab||this.tracker)return [];
  const {match,previewKO}=this.lab;
  const presets = (['you','partner'] as const).map(side=>{
   const id=PRACTICE_IDS[side], percent=match.getPracticePercent(id);
   return {
    id:'dojo-launch-percent-'+side,
    label:(side==='you'?'Your':'Partner')+' percent · '+percent+'%',
    run:()=>match.setPracticePercent(id,PERCENT_PRESETS[(PERCENT_PRESETS.indexOf(percent)+1)%PERCENT_PRESETS.length]!),
   };
  });
  return [
   ...presets,
   {id:'dojo-launch-preview-side',label:'Preview fighter · '+(this.previewSide==='you'?'You':'Partner'),run:()=>{this.previewSide=this.previewSide==='you'?'partner':'you';}},
   ...(['screen','star'] as const).map(kind=>({
    id:'dojo-launch-preview-'+kind,label:'Preview '+kind+' KO',
    run:()=>{
     const side=this.previewSide;
     this.root.querySelector('#dojo-ko-preview-status')!.textContent=previewKO?.(kind,side)
      ? (side==='you'?'Your':'Partner')+' '+kind+' KO preview.'
      : 'KO artwork is unavailable for this fighter.';
    },
   })),
  ];
 }
 private refreshLaunch(): void {
  const output=this.root.querySelector('#dojo-launch-readout');
  if(!output)return;
  const value='You\n'+this.launchReadout.describe(PRACTICE_IDS.you)+'\n\nPartner\n'+this.launchReadout.describe(PRACTICE_IDS.partner);
  if(output.textContent!==value)output.textContent=value;
 }
 public labActions(includeLaunch=true):PracticeLabAction[]{if(!this.lab)return[];const {match,routine:r,overlay}=this.lab;
 const actions:PracticeLabAction[]=[{id:'dojo-lab-fatigue',label:'Next dodge fatigue: '+match.practiceFatigue+' / 5',run:()=>{const next=(match.practiceFatigue+1)%6;this.reset();match.setPracticeFatigue(next);}},{id:'dojo-lab-speed',label:'Speed: '+match.practiceSpeed+'x',run:()=>this.speed()},{id:'dojo-lab-overlay',label:'Collision overlay: '+(overlay.enabled?'On':'Off'),run:()=>this.toggleOverlay()},{id:'dojo-lab-step',label:'Step one tick · '+match.practiceTick,run:()=>this.step(true)}];
 if(!this.tracker)actions.push({id:'dojo-lab-slot',label:'Routine slot '+(this.routineSlot+1)+' / 3',run:()=>this.slot()},{id:'dojo-lab-record',label:r.mode==='recording'?'Stop and save recording':'Record your inputs',run:()=>this.toggleRecord()},{id:'dojo-lab-play',label:r.mode==='playing'?'Stop partner playback':'Play partner routine',run:()=>this.togglePlayback(),disabled:r.length===0},{id:'dojo-lab-mirror',label:'Mirror Left / Right: '+(r.mirror?'On':'Off'),run:()=>{r.mirror=!r.mirror;}},{id:'dojo-lab-loop',label:'Repeat: '+(r.loop?'On':'Off'),run:()=>{r.loop=!r.loop;}},{id:'dojo-lab-delay',label:'Repeat delay: '+r.delayTicks+' ticks',run:()=>{r.delayTicks=r.delayTicks===0?60:r.delayTicks===60?120:0;}});
 if(includeLaunch)actions.push(...this.launchActions());
 return actions;}
 private refreshLab():void{if(!this.lab)return;const {match,routine:r}=this.lab;const status=this.root.querySelector('#dojo-lab-status');if(status)status.textContent=(match.paused?'Frozen':'Running')+' · '+match.practiceSpeed+'x · tick '+match.practiceTick;
 for(const a of this.labActions()){const button=this.root.querySelector<HTMLButtonElement>('#'+a.id);if(button){button.textContent=a.label;button.disabled=Boolean(a.disabled);}}
 const freeze=this.root.querySelector('#dojo-lab-freeze');if(freeze)freeze.textContent=match.paused?'Run · F6':'Freeze · F6';const step=this.root.querySelector<HTMLButtonElement>('#dojo-lab-step');if(step)step.disabled=!match.paused;
 const routine=this.root.querySelector('#dojo-routine-status');if(routine)routine.textContent='Slot '+(this.routineSlot+1)+': '+r.status+(r.length?' · recorded as '+r.sourceFighter:'');
 }

 private setLesson(id:string|null):void{if(this.lab?.routine.mode==='recording'){this.lab.routine.stop();this.saveTape();}this.lab?.routine.stop();const l=LESSONS.find(l=>l.id===id);this.config.lessonId=l?.id??null;this.tracker=l?new LessonTracker(l):null;this.dummy.mode=l?.dummy??this.config.dummyMode;this.dummy.reset();this.success='';this.render();}
 private render():void{
  const l=this.tracker?.lesson;
  this.root.innerHTML=`<p class="dojo-eyebrow">${l?l.tier+' / GUIDED DOJO':'FREE PRACTICE'}</p><h2>${escapeHtml(l?.title??'The endless rehearsal')}</h2><p>${escapeHtml(l?.hint??'Explore every move against a safe partner. Hit reactions are real; damage never accumulates. Leaving the arena resets both fighters.')}</p><strong>${escapeHtml(l?.buttons??'B Attack · A Special · X/Y Jump · LT/RT Shield · LB/RB Grab')}</strong><p class="dojo-progress" id="dojo-progress" aria-live="polite">${l?'0 / 3 successful repetitions':'Fixed damage · Infinite lives · No win or loss'}</p><p id="dojo-feedback" role="status"></p><p id="dojo-cue"></p><div class="dojo-readout" id="dojo-readout"></div><div class="dojo-panel-actions"><button id="dojo-reset" class="ui-btn">Reset arena · R</button>${l?'<button id="dojo-restart" class="ui-btn">Restart lesson</button><button id="dojo-next" class="ui-btn" disabled>Next lesson</button>':'<button id="dojo-dummy" class="ui-btn">Change partner behavior</button>'}<button id="dojo-library" class="ui-btn">Dojo menu · F2</button></div>${this.lab?`<details class="dojo-lab" open><summary>Timing laboratory</summary><p id="dojo-lab-status"></p><details><summary>Input trace</summary><p class="dojo-footnote">Recent presses, separate Attack releases, move starts, and smash charge stops. Freeze and step to compare ticks.</p><pre id="dojo-input-trace" style="white-space:pre-wrap;overflow-wrap:anywhere">No samples yet.</pre></details>${!l?`<details class="dojo-launch"><summary>Launch and KO lab</summary><p class="dojo-footnote">Percent buttons cycle from 0% to 200%. Damage stays fixed and exits reset the arena. Previews play the KO art without moving either fighter.</p><div class="dojo-panel-actions">${this.launchActions().map(a=>`<button class="ui-btn" id="${a.id}">${escapeHtml(a.label)}</button>`).join('')}</div><p id="dojo-ko-preview-status" role="status"></p><div class="dojo-readout" id="dojo-launch-readout"></div></details>`:''}<div class="dojo-panel-actions"><button id="dojo-lab-freeze" class="ui-btn">Freeze · F6</button>${this.labActions(false).map(a=>`<button class="ui-btn" id="${a.id}">${escapeHtml(a.label)}</button>`).join('')}</div><p id="dojo-routine-status"></p><p class="dojo-footnote">F7 steps one tick while frozen. Xbox Back freezes, then steps; Start → Resume runs again. F3 toggles collision shapes.<br>Green: body · Purple: immune · Blue: shield · Red: live attack · Amber: frozen contact pose.<br>${l?'Recordable partners are available in Free Practice.':'F8 records you from a reset; F9 replays on the partner. Three saved slots; maximum 900 ticks (15 simulation seconds). Saving a new recording replaces the selected slot. Mirror swaps horizontal directions, not positions. Playback uses the chosen partner’s moves.'}</p></details>`:''}<p class="dojo-footnote">Escape / Start pauses. Controls reflect the default Xbox layout; custom bindings still apply.</p>`;
  const bind=(id:string,fn:()=>void)=>this.root.querySelector<HTMLButtonElement>('#'+id)?.addEventListener('click',e=>{(e.currentTarget as HTMLElement).blur();fn();if(this.root.isConnected)this.refreshLab();});
  bind('dojo-reset',()=>this.reset());bind('dojo-library',this.back);bind('dojo-restart',()=>{this.tracker?.reset();this.reset();this.success='Lesson restarted.';});bind('dojo-next',()=>{if(this.tracker?.count!==3)return;this.level=(this.level+1)%LESSONS.length;this.setLesson(LESSONS[this.level]!.id);this.reset();});bind('dojo-dummy',()=>{const modes=['still','shield','jab','mixed','up-smash']as const;this.dummy.mode=modes[(modes.indexOf(this.dummy.mode)+1)%modes.length]!;this.config.dummyMode=this.dummy.mode;if(this.lab?.routine.mode==='recording'){this.lab.routine.stop();this.saveTape();}else this.lab?.routine.stop();this.dummy.reset();});
  bind('dojo-lab-freeze',()=>this.toggleFreeze());for(const action of this.labActions())bind(action.id,()=>{const current=this.labActions().find(a=>a.id===action.id);if(current&&!current.disabled)current.run();this.refreshLab();});this.refreshLab();this.refreshLaunch();
 }
 private text(selector:string,value:string):void{const element=this.root.querySelector(selector)!;if(element.textContent!==value)element.textContent=value;}
 private refreshTrace():void {
  const output = this.root.querySelector('#dojo-input-trace');
  if (output) output.textContent = this.trace.join('\n') || 'No samples yet.';
 }
 private observeTrace(tick:number,p:GameState['players'][string],input:InputEvent|null|undefined):void {
  if (!this.lab) return;
  const move = p.currentMoveId ?? null;
  const previous = this.lastTracePose;
  const transition = !previous || p.state !== previous.state || move !== previous.move || p.stateFrame < previous.frame;
  const faceHeld = input ? input.faceAttackHeld : false;
  const stickHeld = input ? input.rightStickHeld : false;
  const faceReleased = previous?.faceHeld === true && faceHeld === false;
  const stickReleased = previous?.stickHeld === true && stickHeld === false;
  const charge = p.chargeFrames ?? 0;
  const sameSmash = !transition && (move === MoveId.UP_SMASH || move === MoveId.FORWARD_SMASH || move === MoveId.DOWN_SMASH);
  const chargeAdvanced = sameSmash && charge > (previous?.charge ?? 0);
  const chargeCapped = chargeAdvanced && charge === SMASH_CHARGE_MAX_FRAMES;
  const chargeEnded = sameSmash && previous?.charging && !chargeAdvanced && (p.activeHitbox || !((input?.held ?? 0) & B.ATTACK));
  const chargeInterrupted = transition && previous?.charging;
  this.lastTracePose = {state:p.state,move,frame:p.stateFrame,faceHeld,stickHeld,charge,
   charging:!chargeCapped && !chargeEnded && (chargeAdvanced || (sameSmash && previous?.charging === true))};
  if (!transition && !input?.pressed && !input?.released && !faceReleased && !stickReleased && !chargeEnded && !chargeCapped) return;
  const fields: string[] = [];
  if (input?.pressed || input?.released) {
   const attack = Boolean(input.pressed & B.ATTACK);
   const rightStick = attack && Math.hypot(input.cStickX ?? 0,input.cStickY ?? 0) >= .55;
   const press = this.buttons(input.pressed);
   const source = rightStick ? 'right stick ('+input.cStickX+', '+input.cStickY+')'+(input.cStickTilt?' · Tilt mode':'')+(input.faceAttackPressed?' + attack button / key':'') : attack ? 'attack button / key' : '';
   const jump = input.pressed & B.JUMP ? ['', 'Xbox X', 'Xbox Y', 'Xbox X+Y'][input.jumpButtons ?? 0] : '';
   if (input.pressed) fields.push('Press '+press+[source,jump].filter(Boolean).map(label=>' · '+label).join(''));
   const released = input.released & ~(faceReleased || stickReleased ? B.ATTACK : 0);
   if (released) fields.push('Release '+this.buttons(released));
   if (input.stickX !== undefined) fields.push('Left stick ('+input.stickX+', '+input.stickY+')');
   if (attack && input.smashSensitivity !== undefined) fields.push('Sensitivity '+(['Low','Normal','High'][input.smashSensitivity+1]));
  }
  if (faceReleased) fields.push('Release face Attack');
  if (stickReleased) fields.push('Release right stick');
  if (chargeEnded || chargeCapped) fields.push('Smash charge stopped · '+charge+' ticks'+(chargeCapped?' · cap':''));
  if (chargeInterrupted) fields.push('Smash charge interrupted · '+previous.charge+' ticks');
  if (transition) fields.push((p.state==='LANDING_LAG' ? p.state : move ?? p.state).replace(/_/g,' ').toLowerCase()+' · frame '+p.stateFrame);
  if (transition && p.state==='LANDING_LAG') fields.push(p.landingLagFrames+' locked ticks remaining');
  this.trace.push('Tick '+tick+' · '+fields.join(' → '));
  if (this.trace.length > 8) this.trace.shift();
  this.refreshTrace();
 }
 private buttons(bits:number):string{return Object.entries(B).filter(([,mask])=>(bits&mask)!==0).map(([name])=>name.toLowerCase().replace(/_/g,' ')).join(', ')||'-';}
 observe(state:GameState,inputs:Map<string,InputEvent|null>,hits:HitEventData[]=[],exits:KOEventData[]=[]):void {
  if(state.tick===this.lastTick)return;this.lastTick=state.tick;
  const p=state.players['local-p1'],i=inputs.get('local-p1');if(!p)return;
  this.observeTrace(state.tick,p,i);
  if(this.lab&&!this.tracker){this.launchReadout.observe(state,hits,exits);this.refreshLaunch();}
  if(this.lab?.routine.capture(i)){this.saveTape();this.success='Recording limit reached. Routine saved.';}this.refreshLab();
  if(i?.pressed||i?.released)this.recent='Pressed: '+this.buttons(i.pressed)+' · Released: '+this.buttons(i.released);
  if(p.currentMoveId)this.previousMove=p.currentMoveId.replace(/_/g,' ').toLowerCase();
  if(this.tracker?.observe(state,i,'local-p1')){this.success=this.tracker.count===3?'Lesson complete. Three successful repetitions.':'Correct · '+this.tracker.count+' of 3';if(this.tracker.count===3)try{localStorage.setItem('eth:dojo:v1:'+this.config.fighter+':'+this.tracker.lesson.id,'complete');}catch{}}
  this.text('#dojo-progress',this.tracker?this.tracker.count+' / 3 successful repetitions':'Fixed damage · Infinite lives · No win or loss');
  this.text('#dojo-feedback',this.success);this.text('#dojo-cue',this.dummy.cue);
  const dodging=['AIR_DODGE','SPOT_DODGE','ROLL'].includes(p.state);
  const timing=dodging?dodgeTiming(p):null;
  const dodgeReadout=timing?' · '+Math.max(0,timing.total-p.stateFrame)+' / '+timing.total+' ticks to full recovery':'';
  this.root.querySelector('#dojo-readout')!.textContent='State: '+p.state.replace(/_/g,' ').toLowerCase()+' · frame '+p.stateFrame+'\nLast move: '+(this.previousMove||'—')+'\nDodge fatigue: '+(p.dodgeFatigue??0)+' / 5'+(dodging?' · current dodge '+(p.dodgeLevel??0)+' / 5':'')+dodgeReadout+'\nAir dodge: '+(p.hasAirDodge===false?'spent':'ready')+'\n'+this.recent;
  const next=this.root.querySelector<HTMLButtonElement>('#dojo-next');if(next)next.disabled=this.tracker?.count!==3;
 }
 setVisible(visible:boolean):void{this.root.hidden=!visible;}
 destroy():void{if(this.lab?.routine.mode==='recording'){this.lab.routine.stop();this.saveTape();}this.lab?.routine.stop();window.removeEventListener('keydown',this.key);this.root.remove();}
}
