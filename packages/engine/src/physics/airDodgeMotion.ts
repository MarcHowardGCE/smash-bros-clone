import {PHYSICS,type PlayerState} from '@smash/shared';
/** Original research's standard-fighter speed endpoints (4.2, 2.8) and distance
 * endpoints (20, 13.3333) share a 2/3 ratio. Keep accepted project pixel units.
 * Levels 1-4 use PROJECT linear interpolation; native curve is not certified.
 * Source: https://w.atwiki.jp/smashsp_kensyou/pages/32.html (2021 observations).
 */
export function airDodgeTravelScale(p:Pick<PlayerState,'dodgeLevel'>):number{
 const n=Number.isFinite(p.dodgeLevel)?Math.max(0,Math.min(5,Math.floor(p.dodgeLevel!))):0;
 return (15-n)/15;
}
export function airDodgeTravelSpeed(p:Pick<PlayerState,'dodgeLevel'>):number{return PHYSICS.AIR_DODGE_SPEED*airDodgeTravelScale(p);}
/** Human frame 25 is zero-based action frame 24. Neutral dodge cannot grab a ledge. */
export function airDodgeAllowsLedge(p:Pick<PlayerState,'state'|'stateFrame'|'airDodgeDirection'>):boolean{
 if(p.state!=='AIR_DODGE')return true;
 const d=p.airDodgeDirection;return Boolean(d&&(d.x||d.y)&&p.stateFrame>=24);
}
