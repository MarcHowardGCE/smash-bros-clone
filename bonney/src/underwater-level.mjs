import {fullUnderwaterData} from './underwater-data.mjs';
import {resetCombat} from './combat.mjs';
export const WATER_PHYSICS={speed:.62,gravity:280,jump:285,terminal:170};
const KEYS=['goalY','width','height','title','start','platforms','pickups','enemies','coinsList','crates','switches','gates','treasures','food','checkpoints','movers','hazards','zones','goalX','checkpoint','checkpointIndex','checkpointState','projectiles','latches','exitDestination'];
const snapshot=g=>Object.fromEntries(KEYS.map(k=>[k,g[k]]));
export const underwaterData=fullUnderwaterData;
export function enterUnderwater(g){
 if(g.mode!=='full'||g.scene==='cloud'||g.scene==='underwater')return false;
 g.surfaceSnapshot=snapshot(g);g.waterEntryX=g.player.x;g.waterEntryPower=g.player.power;
 Object.assign(g,g.underwaterSnapshot||underwaterData());g.scene='underwater';
 Object.assign(g.player,{x:g.checkpointState.x,y:g.checkpointState.y,vx:0,vy:0,grounded:true,power:'none',ability:'ready',activeMs:0,cooldownMs:0,invulnerableMs:1500,pickupLockMs:0,coyoteMs:0,jumpBufferMs:0});resetCombat(g.player);g.secretLaunchEligible=false;g.particles=[];
 g.notice='Sealed suit engaged. Heavy steps, buoyant jumps. No swimming. E at the return lift.';g.noticeMs=6500;g.events.push('pickup');return true;
}
export function leaveUnderwater(g){
 if(g.scene!=='underwater'||!g.surfaceSnapshot)return false;
 g.underwaterSnapshot=snapshot(g);Object.assign(g,g.surfaceSnapshot);g.surfaceSnapshot=null;g.scene='harbor';g.status='playing';
 const locked=g.gates.filter(s=>!s.requires.every(id=>g.latches[id])).sort((a,b)=>a.x-b.x)[0],limit=locked?locked.x-g.player.w:Infinity;
 const spans=g.platforms.filter(s=>!s.oneWay&&s.h>20&&s.x<limit);
 const desired=Math.min(g.waterEntryX,limit),spots=spans.map(s=>({s,x:Math.max(s.x,Math.min(desired,s.x+s.w-g.player.w,limit))})).filter(a=>a.x>=a.s.x);
 const best=spots.sort((a,b)=>Math.abs(a.x-desired)-Math.abs(b.x-desired))[0];
 Object.assign(g.player,{x:best?.x??32,y:(best?.s.y??400)-g.player.h,vx:0,vy:0,grounded:true,power:g.waterEntryPower||'none',ability:'ready',activeMs:0,cooldownMs:0,invulnerableMs:1500,coyoteMs:0,jumpBufferMs:0});resetCombat(g.player);g.notice='Returned safely to the harbor.';g.noticeMs=3500;return true;
}
