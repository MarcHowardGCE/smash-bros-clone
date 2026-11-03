export const mechanismMessages={
 winch:'Winch freed: boarding rigging is moving.',
 reactorSeal:'Reactor restored: cargo lift is powered.',
 coralValve:'Lower valve open: pressure platform is moving.',
 ballastValve:'Pressure balanced: cathedral vents are safe.',
 circuitA:'Relay A powered: research lift is online.',
 circuitB:'Relay B powered: lab vent safe, exit unlocked.',
};
export function mechanismNotice(g,id){
 if(id==='coralValve'||id==='ballastValve'){if(g.latches.coralValve&&g.latches.ballastValve)return 'Pressure balanced: cathedral vents safe, pressure lift online.';if(id==='ballastValve')return 'Upper valve open. Turn the lower valve to balance pressure.';}
 return mechanismMessages[id];
}
export const mechanismsReady=(g,requires)=>!requires||[].concat(requires).every(id=>g.latches[id]);
export function selectedSupply(g,input){
 if(!input.interactPressed||g.player.pickupLockMs>0)return null;
 const p=g.player;
 // A usable puzzle control takes priority over a nearby supply tray.
 if((g.switches||[]).some(s=>!g.latches[s.id]&&s.power===p.power&&mechanismsReady(g,s.requires)&&p.x<s.x+s.w&&p.x+p.w>s.x&&p.y<s.y+s.h&&p.y+p.h>s.y))return null;
 return g.pickups.filter(s=>s.requiresInteract&&s.respawnMs===0&&s.power!==p.power&&Math.abs(s.x+s.w/2-p.x-p.w/2)<=28&&Math.abs(s.y+s.h/2-p.y-p.h/2)<=28)
 .sort((a,b)=>Math.hypot(a.x+a.w/2-p.x-p.w/2,a.y+a.h/2-p.y-p.h/2)-Math.hypot(b.x+b.w/2-p.x-p.w/2,b.y+b.h/2-p.y-p.h/2))[0]||null;
}
