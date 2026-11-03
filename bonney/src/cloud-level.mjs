import {fullCloudData,CLOUD_EXIT} from './cloud-data.mjs';
import {resetCombat} from './combat.mjs';
// Secret course state is swapped independently; the harbor remains frozen while away.
export const SKY_PORTAL={x:2920,w:152,y:-300,maxFuelRemaining:700};
const KEYS=['width','height','title','start','platforms','pickups','enemies','coinsList','crates','switches','gates','treasures','food','checkpoints','movers','hazards','zones','goalX','checkpoint','checkpointIndex','checkpointState','projectiles','latches','exitDestination'];
const snapshot=g=>Object.fromEntries(KEYS.map(k=>[k,g[k]]));
export const cloudLevelData=fullCloudData;
export function recordSecretLaunch(g,charge){
 if(g.mode!=='full'||g.scene==='cloud')return;
 const p=g.player;
 g.secretLaunchEligible=charge>=.999999&&p.x>=2688&&p.x<=3060&&p.y+p.h<=164;
}
export function enterCloud(g){
 if(g.scene==='cloud')return;
 g.harborSnapshot=snapshot(g);g.skyUnlocked=true;
 Object.assign(g,g.cloudSnapshot||cloudLevelData(g.skyChartCollected));g.scene='cloud';
 const spawn=g.cloudSnapshot?g.checkpointState:{x:48,y:196};
 Object.assign(g.player,{x:spawn.x,y:spawn.y,vx:0,vy:0,grounded:true,power:'egghead',ability:'ready',activeMs:0,cooldownMs:0,coyoteMs:0,jumpBufferMs:0,invulnerableMs:1500,pickupLockMs:0});
 resetCombat(g.player);g.particles=[];g.secretLaunchEligible=false;g.notice='Skyward Egghead! Try the shimmering cloud over safe ground.';g.noticeMs=5000;g.events.push('pickup');
}
export function returnHarbor(g,{fall=false,completed=false}={}){
 if(g.scene!=='cloud'||!g.harborSnapshot)return;
 g.skyChartCollected=g.skyChartCollected||g.treasures.some(t=>t.id==='skyChart'&&t.collected);
 const cloudX=g.player.x,currentPower=g.player.power;
 g.cloudSnapshot=snapshot(g);const harbor=g.harborSnapshot;g.harborSnapshot=null;
 Object.assign(g,harbor);g.scene='harbor';g.status='playing';
 if(completed)g.skyRouteComplete=true;
 let destination=completed?4496:fall?Math.min(4496,2992+cloudX*1.55):2992;
 const firstLocked=g.gates.filter(s=>!s.requires.every(id=>g.latches[id])).sort((a,b)=>a.x-b.x)[0];
 const limit=firstLocked?firstLocked.x-g.player.w:Infinity;
 destination=Math.min(destination,limit);
 if(fall||completed){
  const candidates=g.platforms.filter(s=>s.h>8).map(s=>Math.max(s.x,Math.min(s.x+s.w-g.player.w,destination)))
   .filter(x=>x<=limit&&!g.gates.some(s=>!s.requires.every(id=>g.latches[id])&&x<s.x+s.w&&x+g.player.w>s.x));
  destination=candidates.sort((a,b)=>Math.abs(a-destination)-Math.abs(b-destination))[0]??2992;
 }
 Object.assign(g.player,{x:destination,y:fall||completed?120:116,vx:0,vy:fall||completed?150:0,grounded:!(fall||completed),power:currentPower,ability:'ready',activeMs:0,cooldownMs:0,coyoteMs:0,jumpBufferMs:0,invulnerableMs:1500,pickupLockMs:0});
 resetCombat(g.player);g.particles=[];g.notice=completed?firstLocked&&firstLocked.x===4112?'Sky route cleared. Secure Customs to continue.':'Sky route cleared. Back in the harbor.':fall?'Dropped back into the harbor. Keep moving!':g.skyChartCollected?'Sky Chart secured. Back in the harbor.':'Returned from the hidden clouds.';g.noticeMs=4000;g.events.push('checkpoint');
}
export function secretCourseUpdate(g,input){
 if(g.mode!=='full')return;
 if(g.scene==='cloud'&&g.status==='won'){g.cloudCompleted=true;g.nextLevelEntry={...CLOUD_EXIT};return;}
 if(g.status!=='playing')return;
 const p=g.player;
 if(g.scene==='cloud'){

  if(input.interactPressed&&p.x>=72&&p.x<=136&&Math.abs(p.y+p.h-224)<12)returnHarbor(g);
  return;
 }
 if(g.skyUnlocked&&input.interactPressed&&p.grounded&&p.x>=2944&&p.x<=3040&&Math.abs(p.y+p.h-144)<8){enterCloud(g);return;}
 if(g.secretLaunchEligible&&p.power==='egghead'&&p.ability==='active'&&p.activeMs<=SKY_PORTAL.maxFuelRemaining&&p.y<=SKY_PORTAL.y&&p.x>=SKY_PORTAL.x&&p.x<=SKY_PORTAL.x+SKY_PORTAL.w)enterCloud(g);
 if(p.grounded)g.secretLaunchEligible=false;
}
