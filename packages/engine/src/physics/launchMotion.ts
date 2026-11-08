import {PHYSICS, getCharacterStats, type PlayerState} from '@smash/shared';

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
type LaunchTiming = NonNullable<PlayerState['launchTiming']>;

export function nextLaunchTime({strength,end,elapsed,lost=0}:LaunchTiming): number {
 const initial = Math.min(6, Math.max(1, 1 + (strength - 30) / 10));
 const rate = Math.max(1, initial * (1 - (elapsed+lost) / (strength * .7)));
 return Math.min(end, elapsed + rate);
}

/** Round the displayed virtual trajectory time up to the next tenth. */
export function sampleLaunchTime(time:number):number {
 return Math.ceil(time * 10 - 1e-9) / 10;
}

export function remainingLaunchTicks(clock:LaunchTiming):number {
 let ticks = 0;
 while(clock.elapsed < clock.end){
  clock={...clock,elapsed:nextLaunchTime(clock)};
  ticks++;
 }
 return ticks;
}

/** Convert the base hitstun budget into real ticks using the launch's virtual clock. */
export function strongLaunchTiming(rawKnockback:number, baseHitstun:number): {clock:LaunchTiming; ticks:number} | undefined {
 const strength = rawKnockback * .4;
 if (!Number.isFinite(strength) || strength <= 30 || !Number.isInteger(baseHitstun) || baseHitstun <= 0) return undefined;
 const clock = {strength, end:baseHitstun, elapsed:0};
 const ticks=remainingLaunchTicks(clock);
 return ticks < baseHitstun ? {clock,ticks} : undefined;
}

export function clearLaunch(player:PlayerState):PlayerState {
 return {...player,launchVx:undefined,launchVy:undefined,launchFallVy:undefined,launchTiming:undefined,launchTechRestriction:undefined,launchElectric:undefined,launchThawStep:undefined};
}
export function hasLaunch(player:PlayerState):boolean {
 return player.launchVx!==undefined&&player.launchVy!==undefined;
}
/** Falling speed is capped independently; launch momentum never hits the normal fall cap. */
export function applyLaunchGravity(player:PlayerState, fraction=1):PlayerState {
 const angle=player.lastHitKnockbackAngle??0;
 const steep=player.isTumbling&&(player.launchVy??0)<=0&&angle>=70*Math.PI/180&&angle<=110*Math.PI/180;
 // Convert Ultimate's DamageFlyTop values with the existing reference-unit scale.
 const scale=LAUNCH.WORLD_UNITS_PER_REFERENCE_UNIT;
 const gravity=steep?(.0756-.000336*(100-getCharacterStats(player.characterId).fighterWeight))*scale:PHYSICS.GRAVITY;
 const cap=steep?1.8*scale:PHYSICS.TERMINAL_VELOCITY;
 const fall=Math.min((player.launchFallVy??0)+gravity*fraction,cap);
 return {...player,launchFallVy:fall,vx:player.launchVx??0,vy:(player.launchVy??0)+fall};
}
/** Fixed vector-magnitude decay preserves launch direction and cannot reverse a component. */
export function decayLaunch(player:PlayerState, fraction=1):PlayerState {
 if(!hasLaunch(player))return player;
 if(player.isGrounded||(player.hitstunFramesRemaining<=0&&!player.launchTiming))return clearLaunch(player);
 const x=player.launchVx!,y=player.launchVy!,speed=Math.hypot(x,y);
 const next=Math.max(0,speed-LAUNCH.DECAY_PER_REFERENCE_TICK*LAUNCH.WORLD_UNITS_PER_REFERENCE_UNIT*fraction);
 if(next===0)return {...player,launchVx:0,launchVy:0,vx:0,vy:player.launchFallVy??0};
 const factor=next/speed;
 return {...player,launchVx:x*factor,launchVy:y*factor,vx:x*factor,vy:y*factor+(player.launchFallVy??0)};
}

