
import { getCharacterStats, type PlayerState } from '@smash/shared';
import { LAUNCH, remainingLaunchTicks, sampleLaunchTime } from './launchMotion.js';
import type { StageData } from './types.js';

type Surface = 'floor' | 'wall' | 'ceiling';
export type LaunchSurface = {
 surface: Surface;
 wall?: 'left' | 'right';
 fraction: number;
 x: number;
 y: number;
};

const scale=LAUNCH.WORLD_UNITS_PER_REFERENCE_UNIT;

export function findLaunchSurface(before:PlayerState, after:PlayerState, stage:StageData):LaunchSurface|undefined {
 const dx=after.x-before.x,dy=after.y-before.y;
 const radius=getCharacterStats(before.characterId).hurtboxRadius;
 const contacts:LaunchSurface[]=[];
 const solids=[stage.mainPlatform,...stage.platforms].filter(platform=>platform.solid);
 for(const platform of solids){
  if(dy===0)continue;
  const floor=dy>0;
  const y=floor?platform.y-radius:platform.y+platform.height+radius;
  const fraction=(y-before.y)/dy;
  if(fraction<0||fraction>1||(floor&&fraction===0&&before.launchImpact?.surface==='floor'))continue;
  const x=before.x+dx*fraction;
  const margin=floor?0:radius;
  if(x>=platform.x-margin&&x<=platform.x+platform.width+margin)
   contacts.push({surface:floor?'floor':'ceiling',fraction,x,y});
 }
 if(dx!==0){
  for(const platform of solids){
   // Only the incoming face of the solid platform is a wall.
   const x=dx>0?platform.x:platform.x+platform.width;
   const fraction=(x-before.x)/dx;
   if(fraction<0||fraction>1)continue;
   const y=before.y+dy*fraction;
   if(y>=platform.y&&y<=platform.y+platform.height)
    contacts.push({surface:'wall',wall:dx>0?'left':'right',fraction,x,y});
  }
 }
 return contacts.sort((a,b)=>a.fraction-b.fraction)[0];
}

/** Provisional whole-tick conversion of the published 15% collision stop. */
export function launchContactFreezeFrames(surface:Surface,remaining:number):number {
 return surface==='floor'?0:Math.min(30,Math.max(2,Math.floor(remaining*.15)));
}

/** Missed collision: reduce virtual stun, stage the rebound, and record contact freeze. */
export function bounceFromLaunchSurface(before:PlayerState, after:PlayerState, contact:LaunchSurface):PlayerState|undefined {
 const interpolate=(start:number|undefined,end:number|undefined)=>(start??0)+((end??0)-(start??0))*contact.fraction;
 const x=interpolate(before.launchVx,after.launchVx),y=interpolate(before.launchVy,after.launchVy);
 const speed=Math.hypot(x,y)/scale;
 const floor=contact.surface==='floor';
 if(speed<(floor ? .8 : 1))return undefined;

 const previous=before.launchTiming, current=after.launchTiming;
 const elapsed=previous&&current?interpolate(previous.elapsed,current.elapsed):0;
 const sampled=previous&&current?interpolate(previous.sampled??sampleLaunchTime(previous.elapsed),current.sampled??sampleLaunchTime(current.elapsed)):undefined;
 const remaining=current?Math.max(0,current.end-elapsed):before.hitstunFramesRemaining;
 const lost=remaining*.2;
 const clock=current?{...current,elapsed,sampled,end:current.end-lost,lost:(current.lost??0)+lost}:undefined;
 const frames=clock?remainingLaunchTicks(clock):Math.ceil(remaining-lost);
 const freeze=launchContactFreezeFrames(contact.surface,remaining);
 const blockedByHitbox=before.launchTechRestriction==='all'||(floor&&before.launchTechRestriction==='floor');
 const groundedSpike=floor&&before.sdiGrounded===true&&!before.launchImpact&&before.stateFrame<=1&&y>0;
 const factor=floor ? .9 : .95;
 const incidentY=floor&&y<=0?(after.vy||y):y;
 const normalized=factor*(speed*scale)/Math.hypot(x,incidentY);
 const vx=x*normalized*(contact.surface==='wall'?-1:1);
 const vy=contact.surface==='wall'?incidentY*normalized:(floor?-1:1)*Math.abs(incidentY)*normalized;

 return {
  ...after,x:contact.x,y:contact.y,vx,vy,launchVx:vx,launchVy:vy,launchFallVy:0,
  hitstunFramesRemaining:frames,launchTiming:clock,launchTechRestriction:undefined,isGrounded:false,
  lastHitKnockbackAngle:(Math.atan2(-vy,vx)+2*Math.PI)%(2*Math.PI),
  launchImpact:{surface:contact.surface,wall:contact.wall,freeze,remaining:freeze,before:before.hitstunFramesRemaining,
   after:frames,techable:!blockedByHitbox&&!groundedSpike&&speed<(floor?3:6),teched:false,
   blockedByHitbox:blockedByHitbox||undefined},
 };
}

