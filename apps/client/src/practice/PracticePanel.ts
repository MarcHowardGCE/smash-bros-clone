import{INPUT_BITS as B,type GameState,type InputEvent}from'@smash/shared';import{LESSONS,LessonTracker,type PracticeConfig}from'./curriculum.js';import type{PracticeDummy}from'./PracticeDummy.js';import{escapeHtml}from'../ui/selectionContent.js';
export class PracticePanel {
 private root=document.createElement('aside');private tracker:LessonTracker|null=null;private previousMove='';private recent='';private lastTick=-1;private success='';private level=0;
 constructor(private config:PracticeConfig,private dummy:PracticeDummy,private resetArena:()=>void,private back:()=>void,private active:()=>boolean){
  this.root.id='practice-panel';this.root.className='dojo-panel';document.body.appendChild(this.root);this.level=Math.max(0,LESSONS.findIndex(l=>l.id===config.lessonId));this.setLesson(config.lessonId);window.addEventListener('keydown',this.key);
 }
 private key=(e:KeyboardEvent)=>{if(!this.active()||e.repeat)return;if(e.code==='KeyR'){e.preventDefault();this.resetArena();this.dummy.reset();this.success='Arena reset. Progress kept.';}if(e.code==='F2'){e.preventDefault();this.back();}};
 private setLesson(id:string|null):void{const l=LESSONS.find(l=>l.id===id);this.config.lessonId=l?.id??null;this.tracker=l?new LessonTracker(l):null;this.dummy.mode=l?.dummy??this.config.dummyMode;this.dummy.reset();this.success='';this.render();}
 private render():void{
  const l=this.tracker?.lesson;
  this.root.innerHTML=`<p class="dojo-eyebrow">${l?l.tier+' / GUIDED DOJO':'FREE PRACTICE'}</p><h2>${escapeHtml(l?.title??'The endless rehearsal')}</h2><p>${escapeHtml(l?.hint??'Explore every move against a safe partner. Hit reactions are real; damage never accumulates. Leaving the arena resets both fighters.')}</p><strong>${escapeHtml(l?.buttons??'B Attack · A Special · X/Y Jump · LT/RT Shield · LB/RB Grab')}</strong><p class="dojo-progress" id="dojo-progress" aria-live="polite">${l?'0 / 3 successful repetitions':'0% damage · Infinite lives · No win or loss'}</p><p id="dojo-feedback" role="status"></p><p id="dojo-cue"></p><div class="dojo-readout" id="dojo-readout"></div><div class="dojo-panel-actions"><button id="dojo-reset" class="ui-btn">Reset arena · R</button>${l?'<button id="dojo-restart" class="ui-btn">Restart lesson</button><button id="dojo-next" class="ui-btn" disabled>Next lesson</button>':'<button id="dojo-dummy" class="ui-btn">Change partner behavior</button>'}<button id="dojo-library" class="ui-btn">Dojo menu · F2</button></div><p class="dojo-footnote">Escape / Start pauses. Controls reflect the default Xbox layout; custom bindings still apply.</p>`;
  const bind=(id:string,fn:()=>void)=>this.root.querySelector<HTMLButtonElement>('#'+id)?.addEventListener('click',e=>{(e.currentTarget as HTMLElement).blur();fn();});
  bind('dojo-reset',()=>{this.resetArena();this.dummy.reset();this.success='Arena reset. Progress kept.';});bind('dojo-library',this.back);bind('dojo-restart',()=>{this.tracker?.reset();this.resetArena();this.dummy.reset();this.success='Lesson restarted.';});bind('dojo-next',()=>{if(this.tracker?.count!==3)return;this.level=(this.level+1)%LESSONS.length;this.setLesson(LESSONS[this.level]!.id);this.resetArena();});bind('dojo-dummy',()=>{const modes=['still','shield','jab','mixed']as const;this.dummy.mode=modes[(modes.indexOf(this.dummy.mode)+1)%4]!;this.config.dummyMode=this.dummy.mode;this.dummy.reset();});
 }
 private text(selector:string,value:string):void{const element=this.root.querySelector(selector)!;if(element.textContent!==value)element.textContent=value;}
 private buttons(bits:number):string{return Object.entries(B).filter(([,mask])=>(bits&mask)!==0).map(([name])=>name.toLowerCase().replace(/_/g,' ')).join(', ')||'-';}
 observe(state:GameState,inputs:Map<string,InputEvent|null>):void {
  if(state.tick===this.lastTick)return;this.lastTick=state.tick;
  const p=state.players['local-p1'],i=inputs.get('local-p1');if(!p)return;
  if(i?.pressed||i?.released)this.recent='Pressed: '+this.buttons(i.pressed)+' · Released: '+this.buttons(i.released);
  if(p.currentMoveId)this.previousMove=p.currentMoveId.replace(/_/g,' ').toLowerCase();
  if(this.tracker?.observe(state,i,'local-p1')){this.success=this.tracker.count===3?'Lesson complete. Three successful repetitions.':'Correct · '+this.tracker.count+' of 3';if(this.tracker.count===3)try{localStorage.setItem('eth:dojo:v1:'+this.config.fighter+':'+this.tracker.lesson.id,'complete');}catch{}}
  this.text('#dojo-progress',this.tracker?this.tracker.count+' / 3 successful repetitions':'0% damage · Infinite lives · No win or loss');
  this.text('#dojo-feedback',this.success);this.text('#dojo-cue',this.dummy.cue);
  this.root.querySelector('#dojo-readout')!.textContent='State: '+p.state.replace(/_/g,' ').toLowerCase()+' · frame '+p.stateFrame+'\nLast move: '+(this.previousMove||'—')+'\nDodge fatigue: '+(p.dodgeFatigue??0)+' / 5\n'+this.recent;
  const next=this.root.querySelector<HTMLButtonElement>('#dojo-next');if(next)next.disabled=this.tracker?.count!==3;
 }
 setVisible(visible:boolean):void{this.root.hidden=!visible;}
 destroy():void{window.removeEventListener('keydown',this.key);this.root.remove();}
}
