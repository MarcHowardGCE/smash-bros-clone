import {isActiveShield} from '@smash/shared';
import{MoveId,PlayerStateEnum,type MoveData,type PlayerState}from'@smash/shared';
export interface FloorHit{damage:number;hitlagFrames:number}
/** Explicit roster tuning; no random rolls or client-side combat decisions. */
export function resolveFloorHit(player:PlayerState,hit:FloorHit,move:Pick<MoveData,'id'|'tripBelowPercent'>|undefined):PlayerState|null{
 if(!move||!player.isGrounded||player.isInvincible||player.isKnockedOut||player.stocks<=0||player.respawnTimer>0||isActiveShield(player))return null;
 const lock=[PlayerStateEnum.HARD_LANDING,PlayerStateEnum.JAB_LOCK].includes(player.state as PlayerStateEnum)&&[MoveId.JAB,MoveId.JAB_2].includes(move.id)&&hit.damage>0&&hit.damage<=5&&(player.jabLockCount??0)<2;
 const trip=move.tripBelowPercent!==undefined&&player.percent<move.tripBelowPercent&&['IDLE','WALK','DASH','RUN','CROUCH','TAUNT','ATTACK'].includes(player.state);
 if(!lock&&!trip)return null;
 return{...player,state:lock?PlayerStateEnum.JAB_LOCK:PlayerStateEnum.TRIP_FALL,stateFrame:0,percent:player.percent+hit.damage,vx:0,vy:0,isGrounded:true,isTumbling:false,isFastFalling:false,hitlagFramesRemaining:hit.hitlagFrames,hitstunFramesRemaining:0,techWindowFrames:0,landingLagFrames:0,currentMoveId:null,currentMove:undefined,activeHitbox:null,jabQueued:false,hitReaction:undefined,artCue:undefined,artCueFrame:undefined,footstoolRole:undefined,footstoolPartnerId:undefined,footstoolFrame:undefined,shieldReaction:undefined,shieldReactionFrame:undefined,isShielding:false,shieldStunFrames:0,pendingKnockbackVx:null,pendingKnockbackVy:null,lastHitKnockbackAngle:null,jabLockCount:lock?(player.jabLockCount??0)+1:0,floorOrientation:lock?player.floorOrientation:'up'};
}
