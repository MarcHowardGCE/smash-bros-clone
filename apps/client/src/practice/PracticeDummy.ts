import type{PracticeRoutine}from'./PracticeRoutine.js';
import{INPUT_BITS as B,type GameState,type InputEvent}from'@smash/shared';
import type{ITickController}from'../local/types.js';import type{DummyMode}from'./curriculum.js';
/** Predictable input partner using the same combat engine as a real fighter. */
export class PracticeDummy implements ITickController {
 routine:PracticeRoutine|null=null;
 readonly playerId='local-p2';readonly slotIndex=1;mode:DummyMode='still';private tick=0;private start=0;private held=0;private state:GameState|null=null;
 setTick(tick:number):void{this.tick=tick;}
 observe(state:GameState):void{this.state=state;}
 reset():void{this.start=this.tick;this.held=0;}
 get cue():string {
  if(this.routine?.mode==='recording')return 'Partner rests while you record';
  if(this.routine?.mode==='playing')return this.routine.status;
  if(this.mode==='still')return 'Partner: passive';
  if(this.mode==='shield')return 'Partner: holding shield';
  if(this.mode==='grab'&&this.state?.players[this.playerId]?.grabbedPlayerId){
   return 'Grabbed · Mash buttons or rotate the left stick';
  }
  const age=(this.tick-this.start)%150;
  const action=this.mode==='grab'?'Grab':this.mode==='up-smash'?'Two-hit up smash':'Strike';
  return age<90?action+' in '+((90-age)/60).toFixed(1)+'s':action+' / recover';
 }
 pollInput():InputEvent {
  if(this.routine?.mode==='playing'){const input=this.routine.next(this.playerId,this.tick);this.held=input.held;return input;}
  if(this.routine?.mode==='recording'){const released=this.held;this.held=0;return{playerId:this.playerId,tick:this.tick,seq:this.tick,held:0,pressed:0,released};}
  let held=0,smashAttack=false;const p=this.state?.players[this.playerId],target=this.state?.players['local-p1'];
  if(this.mode==='shield')held=B.SHIELD;
  else if((this.mode==='jab'||this.mode==='mixed'||this.mode==='up-smash'||this.mode==='grab')&&p&&target&&!p.isGrabbing){
   const dx=target.x-p.x,dir=dx<0?B.LEFT:B.RIGHT;
   if(p.isGrounded&&target.isGrounded&&(Math.abs(dx)>(this.mode==='up-smash'?20:45)||p.facing!==(dx<0?-1:1)))held=dir;
   else if((this.tick-this.start)%150===90){
    smashAttack=this.mode==='up-smash';
    if(this.mode==='grab')held=B.GRAB;
    else if(smashAttack)held=B.UP|B.ATTACK;
    else held=this.mode==='mixed'&&Math.floor((this.tick-this.start)/150)%2?B.SPECIAL:B.ATTACK;
   }
  }
  const input:InputEvent={playerId:this.playerId,tick:this.tick,seq:this.tick,held,pressed:held&~this.held,released:this.held&~held,...(smashAttack?{smashAttack:true}:{})};this.held=held;return input;
 }
 destroy():void{this.state=null;}
}
