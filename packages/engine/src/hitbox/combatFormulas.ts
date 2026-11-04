import type{MoveId}from'@smash/shared';
/** Queue is oldest first; weights are indexed newest first. Research reference: Rubendal SSBU calculator formulas.js. */
export const STALE_WEIGHTS=[.09,.08545,.07635,.0679,.05945,.05035,.04255,.03345,.025]as const;
export function staleMultiplier(move:MoveId|null,queue:readonly MoveId[],shieldQueue:readonly boolean[]=[]):number{if(!move)return 1.05;let reduction=0;const recent=queue.slice(-9),flags=shieldQueue.slice(-9);for(let i=0;i<recent.length;i++)if(recent[recent.length-1-i]===move)reduction+=STALE_WEIGHTS[i]!*(flags[recent.length-1-i]===true?.85:1);return reduction===0?1.05:1-reduction;}
export function rageMultiplier(percent:number):number{return 1+Math.max(0,Math.min(115,percent-35))*.1/115;}
export function hitstunFromKnockback(kb:number):number{return Math.max(4,Math.floor(kb*.4)-1);}
