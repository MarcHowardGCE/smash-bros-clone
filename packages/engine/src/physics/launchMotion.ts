import {PHYSICS, type PlayerState} from '@smash/shared';

/** Reference launch factors; WORLD_UNITS_PER_REFERENCE_UNIT is project calibration. */
export const LAUNCH = {
 WORLD_UNITS_PER_REFERENCE_UNIT:4,
 SPEED_PER_KNOCKBACK:.03,
 DECAY_PER_REFERENCE_TICK:.051,
} as const;
export const launchWorldSpeed = (raw:number):number =>
 raw * LAUNCH.SPEED_PER_KNOCKBACK * LAUNCH.WORLD_UNITS_PER_REFERENCE_UNIT;
export function initializeLaunch(player:PlayerState,rawX:number,rawY:number):PlayerState {
 const x=launchWorldSpeed(rawX),y=launchWorldSpeed(rawY);
 return {...player,vx:x,vy:y,launchVx:x,launchVy:y,launchFallVy:0};
}
export function clearLaunch(player:PlayerState):PlayerState {
 return {...player,launchVx:undefined,launchVy:undefined,launchFallVy:undefined};
}
export function hasLaunch(player:PlayerState):boolean {
 return player.launchVx!==undefined&&player.launchVy!==undefined;
}
/** Falling speed is capped independently; launch momentum never hits the normal fall cap. */
export function applyLaunchGravity(player:PlayerState):PlayerState {
 const fall=Math.min((player.launchFallVy??0)+PHYSICS.GRAVITY,PHYSICS.TERMINAL_VELOCITY);
 return {...player,launchFallVy:fall,vx:player.launchVx??0,vy:(player.launchVy??0)+fall};
}
/** Fixed vector-magnitude decay preserves launch direction and cannot reverse a component. */
export function decayLaunch(player:PlayerState):PlayerState {
 if(!hasLaunch(player))return player;
 if(player.isGrounded||player.hitstunFramesRemaining<=0)return clearLaunch(player);
 const x=player.launchVx!,y=player.launchVy!,speed=Math.hypot(x,y);
 const next=Math.max(0,speed-LAUNCH.DECAY_PER_REFERENCE_TICK*LAUNCH.WORLD_UNITS_PER_REFERENCE_UNIT);
 if(next===0)return {...player,launchVx:0,launchVy:0,vx:0,vy:player.launchFallVy??0};
 const factor=next/speed;
 return {...player,launchVx:x*factor,launchVy:y*factor,vx:x*factor,vy:y*factor+(player.launchFallVy??0)};
}

