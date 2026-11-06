import {freshDodgeProfile,maximumDodgeProfile,observedIntermediateDodge,resolveDodgeKind,type DodgeContext} from './dodgeProfiles.js';
import type {PlayerState} from '@smash/shared';
/** Published common.prc values. Fresh fighter profiles and rounding remain project data. */
export const DODGE_FATIGUE={max:5,recovery:120,refresh:60,spot:.06,forward:.06,backward:.1}as const;
const level=(n:number|undefined)=>Number.isFinite(n)?Math.max(0,Math.min(DODGE_FATIGUE.max,Math.floor(n!))):0;
const ratePercent=(p:DodgeContext)=>100+level(p.dodgeLevel)*(resolveDodgeKind(p)==='air'?0:resolveDodgeKind(p)==='backward'?10:6);
/** Exact integer evaluation of the PROJECT duration model; not proof of native motion conversion. */
const scaledFrames=(frames:number,p:DodgeContext)=>Math.ceil(frames*ratePercent(p)/100);
export function dodgeDurationScale(p:DodgeContext):number {return ratePercent(p)/100;}
/** Normalizes project animation durations; not a certified vanilla frame-rounding implementation. */
export function dodgeExtra(p:DodgeContext):number {
 const base=freshDodgeProfile(p).total,observed=observedIntermediateDodge({...p,dodgeLevel:level(p.dodgeLevel)});
 if(observed)return observed.total-base;
 return (!p.characterId||p.characterId==='all-rounder'?scaledFrames(base+1,p)-1:scaledFrames(base,p))-base;
}
export function beginDodge(p:PlayerState,kind:NonNullable<PlayerState['dodgeKind']>='spot'):void {
 p.dodgeKind=kind;p.dodgeLevel=level(p.dodgeFatigue);
 p.dodgeFatigue=Math.min(DODGE_FATIGUE.max,p.dodgeLevel+1);p.dodgeRecoveryTicks=DODGE_FATIGUE.recovery;
 // The independent refresh timer is armed on motion exit, landing, ledge, or post-hitlag interruption.
 p.dodgeRefreshTicks=undefined;p.dodgeRefreshPending=false;
}
export function finishDodge(p:PlayerState):void {p.dodgeRefreshTicks=DODGE_FATIGUE.refresh;p.dodgeRefreshPending=false;}
export function recoverDodge(p:PlayerState):PlayerState {
 if(p.stocks<=0||p.respawnTimer>0)return {...p,dodgeFatigue:0,dodgeLevel:0,dodgeRecoveryTicks:0,dodgeRefreshTicks:undefined,dodgeRefreshPending:false};
 if(!(p.dodgeFatigue??0))return p;
 const ticks=(p.dodgeRecoveryTicks??DODGE_FATIGUE.recovery)-1;
 const refresh=p.dodgeRefreshTicks===undefined?undefined:p.dodgeRefreshTicks-1;
 const decrement=(ticks<=0?1:0)+(refresh!==undefined&&refresh<=0?1:0);
 return {...p,dodgeRecoveryTicks:ticks<=0?DODGE_FATIGUE.recovery:ticks,dodgeRefreshTicks:refresh!==undefined&&refresh<=0?undefined:refresh,dodgeFatigue:Math.max(0,level(p.dodgeFatigue)-decrement)};
}

/** Profile-aware timeline; stale duration rounding remains an explicit project approximation. */
export function dodgeTiming(p:DodgeContext):DodgeProfileTiming {
 p={...p,dodgeLevel:level(p.dodgeLevel)};
 const fresh=freshDodgeProfile(p),penalty=level(p.dodgeLevel),max=maximumDodgeProfile(p),observed=observedIntermediateDodge(p);
 if(max&&penalty===5)return{total:max.total,attackCancel:max.attackCancel,intangibleStart:max.intangibleStart-1,intangibleEnd:max.intangibleEnd};
 // Intermediate bounds interpolate measured endpoints; they are not native-frame certified.
 const start=max?fresh.intangibleStart+Math.ceil((max.intangibleStart-fresh.intangibleStart)*penalty/5):fresh.intangibleStart+Math.floor(penalty/2);
 const end=max?fresh.intangibleEnd-Math.ceil((fresh.intangibleEnd-max.intangibleEnd)*penalty/5):Math.max(fresh.intangibleStart,fresh.intangibleEnd-penalty);
 const attackCancel=fresh.attackCancel===undefined?undefined:max?scaledFrames(fresh.attackCancel+1,p)-1:scaledFrames(fresh.attackCancel,p);
 return {total:observed?.total??fresh.total+dodgeExtra(p),attackCancel,intangibleStart:(observed?.intangibleStart??start)-1,intangibleEnd:observed?.intangibleEnd??end};
}
interface DodgeProfileTiming {total:number;attackCancel?:number;intangibleStart:number;intangibleEnd:number}
/** Six existing drawings span the reference ground timeline without changing source art. */
export function dodgeAnimationFrame(p:DodgeContext,frame:number):number {
 const kind=resolveDodgeKind(p);
 const base=freshDodgeProfile({...p,dodgeKind:kind}).total;
 return frame/dodgeDurationScale({...p,dodgeKind:kind})*(kind==='forward'||kind==='backward'?20/base:1);
}
