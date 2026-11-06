import {INPUT_BITS,MoveId,type InputEvent,type PlayerState}from'@smash/shared';
import{getMoveDataForCharacter}from'./index.js';
/** Server/local simulation only; one fresh attack press queues one next link. */
export function advanceJabChain(p:PlayerState,input:InputEvent|null,frozen=false):PlayerState{
 const next=p.currentMoveId===MoveId.JAB?MoveId.JAB_2:p.currentMoveId===MoveId.JAB_2?MoveId.JAB_3:null;
 if(p.state!=='ATTACK'||!p.isGrounded||!next)return p.jabQueued?{...p,jabQueued:false}:p;
 const fresh=Boolean((input?.pressed??0)&INPUT_BITS.ATTACK);
 const queued=p.jabQueued||fresh;
 const data=getMoveDataForCharacter(p.characterId,p.currentMoveId!);
 if(queued&&!frozen&&p.hitlagFramesRemaining<=0&&p.stateFrame>=data.startupFrames+data.activeFrames+2){
  const move=getMoveDataForCharacter(p.characterId,next);
  return {...p,currentMoveId:next,stateFrame:0,jabQueued:false,activeHitbox:null,hitPlayerIds:new Set<string>(),hitContactFrames:undefined,moveStaleMultiplier:undefined,chargeFrames:0,currentMove:{landingLag:move.landingLag,isSpecial:move.isSpecial}};
 }
 return {...p,jabQueued:queued};
}
