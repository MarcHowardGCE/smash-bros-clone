import {getCharacterStats,INPUT_BITS,PlayerStateEnum,type InputEvent,type PlayerState} from '@smash/shared';
/** Initial custom footstool tuning; all decisions use the same pre-tick positions. */
export function resolveFootstools(players:Readonly<Record<string,PlayerState>>,inputs:ReadonlyMap<string,InputEvent|null>):{players:Record<string,PlayerState>;consumed:Set<string>}{
 const next={...players},consumed=new Set<string>(),paired=new Set<string>();
 const eligible=(p:PlayerState)=>p.stocks>0&&!p.isKnockedOut&&p.respawnTimer<=0&&!p.isInvincible&&p.hitlagFramesRemaining<=0&&(p.footstoolCooldownFrames??0)<=0&&!p.isGrabbing;
 for(const id of Object.keys(players).sort()){
  const a=players[id]!,input=inputs.get(id);if(paired.has(id)||!input||!(input.pressed&INPUT_BITS.JUMP)||(input.pressed&(INPUT_BITS.ATTACK|INPUT_BITS.SPECIAL|INPUT_BITS.GRAB|INPUT_BITS.SHIELD))||!eligible(a)||a.isGrounded||a.state!==PlayerStateEnum.AIRBORNE)continue;
  const ar=getCharacterStats(a.characterId).hurtboxRadius;
  const candidates=Object.keys(players).filter(v=>v!==id&&!paired.has(v)).filter(v=>{const p=players[v]!;if(!eligible(p)||!['IDLE','WALK','DASH','RUN','SHIELD','AIRBORNE'].includes(p.state))return false;const r=getCharacterStats(p.characterId).hurtboxRadius,gap=a.y+ar-(p.y-r);return Math.abs(a.x-p.x)<=r*.65&&a.y<p.y&&gap>=-10&&gap<=10;}).sort((x,y)=>Math.abs(a.x-players[x]!.x)-Math.abs(a.x-players[y]!.x)||(x<y?-1:x>y?1:0));
  const vid=candidates[0];if(!vid)continue;const v=players[vid]!,ground=v.isGrounded;
  const clean={currentMoveId:null,activeHitbox:null,currentMove:undefined,jabQueued:false,isShielding:false,shieldReaction:undefined,shieldReactionFrame:undefined,footstoolFrame:0,footstoolCooldownFrames:30};
  next[id]={...a,...clean,state:PlayerStateEnum.AIRBORNE,stateFrame:0,vy:-14,isFastFalling:false,footstoolRole:'attacker',footstoolPartnerId:vid};
  next[vid]={...v,...clean,state:PlayerStateEnum.HITSTUN,stateFrame:0,hitstunFramesRemaining:ground?24:30,vx:ground?0:v.vx,vy:ground?0:Math.max(v.vy,5),isTumbling:!ground,footstoolRole:ground?'ground':'air',footstoolPartnerId:id};
  consumed.add(id);paired.add(id);paired.add(vid);
 }
 return{players:next,consumed};
}
