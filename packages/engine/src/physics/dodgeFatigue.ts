import {freshDodgeProfile,type DodgeContext} from './dodgeProfiles.js';
import type {PlayerState} from '@smash/shared';
/** Published common.prc values. Fresh fighter profiles and rounding remain project data. */
export const DODGE_FATIGUE={max:5,recovery:120,refresh:60,spot:.06,forward:.06,backward:.1}as const;
const level=(n:number|undefined)=>Math.max(0,Math.min(DODGE_FATIGUE.max,n??0));
export function dodgeDurationScale(p:Pick<PlayerState,'dodgeLevel'|'dodgeKind'>):number {
 return 1+level(p.dodgeLevel)*(p.dodgeKind==='air'?0:p.dodgeKind==='backward'?DODGE_FATIGUE.backward:DODGE_FATIGUE.spot);
}
/** Normalizes project animation durations; not a certified vanilla frame-rounding implementation. */
export function dodgeExtra(p:DodgeContext):number {
 const base=freshDodgeProfile(p).total;
 return Math.ceil(base*dodgeDurationScale(p)-1e-9)-base;
}
export function beginDodge(p:PlayerState,kind:NonNullable<PlayerState['dodgeKind']>='spot'):void {
 p.dodgeKind=kind;p.dodgeLevel=level(p.dodgeFatigue);
 p.dodgeFatigue=Math.min(DODGE_FATIGUE.max,p.dodgeLevel+1);p.dodgeRecoveryTicks=DODGE_FATIGUE.recovery;
 // Arm the independent refresh timer only when this dodge becomes actionable.
 p.dodgeRefreshTicks=undefined;
}
export function finishDodge(p:PlayerState):void {p.dodgeRefreshTicks=DODGE_FATIGUE.refresh;}
export function recoverDodge(p:PlayerState):PlayerState {
 if(p.stocks<=0||p.respawnTimer>0)return {...p,dodgeFatigue:0,dodgeLevel:0,dodgeRecoveryTicks:0,dodgeRefreshTicks:undefined};
 if(!(p.dodgeFatigue??0))return p;
 const ticks=(p.dodgeRecoveryTicks??DODGE_FATIGUE.recovery)-1;
 const refresh=p.dodgeRefreshTicks===undefined?undefined:p.dodgeRefreshTicks-1;
 const decrement=(ticks<=0?1:0)+(refresh!==undefined&&refresh<=0?1:0);
 return {...p,dodgeRecoveryTicks:ticks<=0?DODGE_FATIGUE.recovery:ticks,dodgeRefreshTicks:refresh!==undefined&&refresh<=0?undefined:refresh,dodgeFatigue:Math.max(0,level(p.dodgeFatigue)-decrement)};
}

/** Profile-aware timeline; stale duration rounding remains an explicit project approximation. */
export function dodgeTiming(p:DodgeContext):DodgeProfileTiming {
 const fresh=freshDodgeProfile(p),scale=dodgeDurationScale(p),penalty=level(p.dodgeLevel);
 return {total:fresh.total+dodgeExtra(p),attackCancel:fresh.attackCancel===undefined?undefined:Math.ceil(fresh.attackCancel*scale-1e-9),
  intangibleStart:fresh.intangibleStart-1+Math.floor(penalty/2),intangibleEnd:Math.max(fresh.intangibleStart,fresh.intangibleEnd-penalty)};
}
interface DodgeProfileTiming {total:number;attackCancel?:number;intangibleStart:number;intangibleEnd:number}
/** Six existing drawings span the reference ground timeline without changing source art. */
export function dodgeAnimationFrame(p:DodgeContext,frame:number):number {
 const kind=p.dodgeKind??(p.state==='ROLL'?'forward':'spot');
 const base=freshDodgeProfile({...p,dodgeKind:kind}).total;
 return frame/dodgeDurationScale({...p,dodgeKind:kind})*(kind==='forward'||kind==='backward'?20/base:1);
}
