import type{PlayerState}from'@smash/shared';import{freshDodgeProfile}from'./dodgeProfiles.js';
/** Neutral 10 and directional 11-19 bounds are measured. Directional interpolation remains provisional. */
export function airDodgeLandingLag(p:Pick<PlayerState,'stateFrame'|'characterId'|'airDodgeDirection'>):number{
 const d=p.airDodgeDirection;if(!d||(!d.x&&!d.y))return 10;
 const total=freshDodgeProfile({...p,dodgeKind:'air'}).total;
 const progress=Math.max(0,Math.min(1,p.stateFrame/Math.max(1,total-1)));
 return Math.max(11,Math.min(19,Math.ceil(19-8*progress)));
}
