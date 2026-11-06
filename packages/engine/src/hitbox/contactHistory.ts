import {staleMultiplier} from './combatFormulas.js';
import type{PlayerState}from'@smash/shared';
function group(p:PlayerState):string{const n=p.activeHitbox?.hitGroup;return String(Number.isInteger(n)&&n!>=0?n:0);}
/** Hitlag freezes the action clock, so it cannot reopen an interval by itself. */
export function canHitContact(p:PlayerState,victim:string):boolean{
 if(!p.activeHitbox||!victim)return false;
 const records=p.hitContactFrames?.[victim],last=records?.[group(p)];
 if(last===undefined)return records!==undefined||!p.hitPlayerIds.has(victim);
 const gap=p.activeHitbox.rehitFrames;
 return Number.isInteger(gap)&&gap!>0&&p.stateFrame-last>=gap!;
}
export function recordHitContact(p:PlayerState,victim:string):NonNullable<PlayerState['hitContactFrames']>{return{...p.hitContactFrames,[victim]:{...p.hitContactFrames?.[victim],[group(p)]:p.stateFrame}};}

/** One instance keeps the multiplier from before its own first stale-queue insertion. */
export function contactStaleMultiplier(p:PlayerState):number{return p.moveStaleMultiplier??staleMultiplier(p.currentMoveId,p.staleMoveQueue??[],p.staleMoveShieldQueue);}
