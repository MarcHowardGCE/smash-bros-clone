import{INPUT_BITS as B,type GameState,type InputEvent}from'@smash/shared';
import type{ITickController}from'../local/types.js';import type{DummyMode}from'./curriculum.js';
/** Predictable input partner using the same combat engine as a real fighter. */
export class PracticeDummy implements ITickController {
 readonly playerId='local-p2';readonly slotIndex=1;mode:DummyMode='still';private tick=0;private start=0;private held=0;private state:GameState|null=null;
 setTick(tick:number):void{this.tick=tick;}
 observe(state:GameState):void{this.state=state;}
 reset():void{this.start=this.tick;this.held=0;}
 get cue():string{if(this.mode==='still')return 'Partner: passive';if(this.mode==='shield')return 'Partner: holding shield';const t=(this.tick-this.start)%150;return t<90?'Strike in '+((90-t)/60).toFixed(1)+'s':'Strike / recover';}
 pollInput():InputEvent {
  let held=0;const p=this.state?.players[this.playerId],target=this.state?.players['local-p1'];
  if(this.mode==='shield')held=B.SHIELD;
  else if((this.mode==='jab'||this.mode==='mixed')&&p&&target){
   const dx=target.x-p.x,dir=dx<0?B.LEFT:B.RIGHT;
   if(p.isGrounded&&target.isGrounded&&(Math.abs(dx)>45||p.facing!==(dx<0?-1:1)))held=dir;
   else if((this.tick-this.start)%150===90)held=this.mode==='mixed'&&Math.floor((this.tick-this.start)/150)%2?B.SPECIAL:B.ATTACK;
  }
  const input={playerId:this.playerId,tick:this.tick,seq:this.tick,held,pressed:held&~this.held,released:this.held&~held};this.held=held;return input;
 }
 destroy():void{this.state=null;}
}
