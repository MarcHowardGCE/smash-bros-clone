export const COMBAT={punchMs:220,kickMs:340,chargeMs:700,lungeMs:260,lungeSpeed:300};
export function resetCombat(p,{keepAir=false}={}){const used=p.airJumpUsed;Object.assign(p,{attackMs:0,attackElapsed:0,attackKind:'',attackCooldownMs:0,chargePunchMs:0,chargingPunch:false,jumpCutAvailable:false,spinMs:0,airJumpUsed:false});p.attackHits=new Set();if(keepAir)p.airJumpUsed=used;}
function start(g,kind,energy=1){
 const p=g.player;p.attackKind=kind;p.attackElapsed=0;p.attackHits=new Set();
 p.attackMs=kind==='charged'?Math.max(9,COMBAT.lungeMs*energy):kind==='kick'?COMBAT.kickMs:COMBAT.punchMs;
 p.attackCooldownMs=p.attackMs+70;g.events.push(kind==='charged'?'charge':'punch');
}
export function prepareCombat(g,dt,input){
 const p=g.player,ms=dt*1000;p.spinMs=Math.max(0,(p.spinMs||0)-ms);
 p.attackMs=Math.max(0,(p.attackMs||0)-ms);p.attackCooldownMs=Math.max(0,(p.attackCooldownMs||0)-ms);
 if(p.attackMs>0)p.attackElapsed=(p.attackElapsed||0)+ms;else p.attackKind='';
 if(p.power==='gear'&&p.chargingPunch&&!input.punchHeld){
  const energy=p.ability==='ready'?1:Math.max(0,1-p.cooldownMs/5000);
  if(p.chargePunchMs>=COMBAT.chargeMs&&energy>0){start(g,'charged',energy);p.ability='cooldown';p.cooldownMs=5000;}
  else if(!p.attackCooldownMs)start(g,'punch');
  p.chargingPunch=false;p.chargePunchMs=0;
 }
 if(p.attackMs>0||p.attackCooldownMs>0||(p.ability==='active'&&p.power!=='egghead'))return;
 if(input.kickPressed){p.chargingPunch=false;p.chargePunchMs=0;start(g,'kick');}
 else if(p.power==='gear'&&input.punchHeld){p.chargingPunch=true;p.chargePunchMs=Math.min(1000,(p.chargePunchMs||0)+ms);}
 else if(input.punchPressed&&(p.power!=='gear'||!input.punchHeld))start(g,'punch');
}
export function attackBounds(p){
 if(!p.attackMs)return null;
 const charged=p.attackKind==='charged',kick=p.attackKind==='kick';
 if(!charged&&(p.attackElapsed<(kick?55:30)||p.attackElapsed>(kick?200:145)))return null;
 const reach=charged?28:kick?26:18;
 return {x:p.facing>0?p.x+p.w-3:p.x-reach+3,y:p.y+5,w:reach,h:p.h-7};
}
const hit=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
export function resolveCombat(g){
 const p=g.player,box=attackBounds(p);if(!box)return;
 for(const e of g.enemies){
  if(e.hp<=0||p.attackHits.has(e)||!hit(box,e))continue;p.attackHits.add(e);
  const front=e.dir>0?p.x+p.w/2>e.x+e.w/2:p.x+p.w/2<e.x+e.w/2;
  if(e.type==='shield'&&e.state!=='recover'&&front&&p.attackKind!=='charged'){g.events.push('block');continue;}
  e.hp=p.attackKind==='charged'?0:Math.max(0,e.hp-1);e.stunMs=p.attackKind==='kick'?220:150;
  if(e.hp===0)g.defeated++;g.events.push('impact');
 }
 for(const cr of g.crates)if(cr.hp>0&&(p.attackKind==='charged'||cr.meleeBreakable)&&!p.attackHits.has(cr)&&hit(box,cr)&&(!cr.requires||g.latches?.[cr.requires])){p.attackHits.add(cr);cr.hp=p.attackKind==='charged'?0:Math.max(0,cr.hp-1);g.events.push(cr.hp?'impact':'break');}
}
