import{PlayerStateEnum,type PlayerState}from'@smash/shared';
import{dodgeTiming}from '../physics/dodgeFatigue.js';
import type{DodgeContext}from '../physics/dodgeProfiles.js';
/** Verified fresh reference bounds; fatigued bounds remain explicitly provisional. */
export function isDamageImmune(p:Pick<PlayerState,'state'|'stateFrame'|'isInvincible'>&DodgeContext):boolean {
 if(p.isInvincible)return true;
 if(![PlayerStateEnum.ROLL,PlayerStateEnum.SPOT_DODGE,PlayerStateEnum.AIR_DODGE].includes(p.state as PlayerStateEnum))return false;
 const window=dodgeTiming(p);return p.stateFrame>=window.intangibleStart&&p.stateFrame<window.intangibleEnd;
}
