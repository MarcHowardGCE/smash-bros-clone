import{PlayerStateEnum,type PlayerState}from'@smash/shared';
import{dodgeTiming}from '../physics/dodgeFatigue.js';
import type{DodgeContext}from '../physics/dodgeProfiles.js';
/** Verified fresh reference bounds; fatigued bounds remain explicitly provisional. */
export function isDamageImmune(p:Pick<PlayerState,'state'|'stateFrame'|'isInvincible'>&Pick<Partial<PlayerState>,'shieldParryConsumed'>&DodgeContext):boolean {
 // The consumed marker persists through the last locked guardstun tick.
 if(p.isInvincible||(p.state===PlayerStateEnum.SHIELD&&p.shieldParryConsumed))return true;
 if(![PlayerStateEnum.ROLL,PlayerStateEnum.SPOT_DODGE,PlayerStateEnum.AIR_DODGE].includes(p.state as PlayerStateEnum))return false;
 const window=dodgeTiming(p);return p.stateFrame>=window.intangibleStart&&p.stateFrame<window.intangibleEnd;
}
