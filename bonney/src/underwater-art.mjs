import {REEF_BUILDINGS} from './underwater-data.mjs';
const visible=(x,w,camera)=>x+w>=camera-32&&x<=camera+416;
export function underwaterBackground(c,images,camera,cameraY=0){
 c.fillStyle='#063747';c.fillRect(0,0,384,216);const x=-((camera*.15)%648);for(let n=0;n<2;n++)c.drawImage(images.reefBackground,x+n*648,-cameraY*.025,648,250);
 c.fillStyle='rgba(2,14,38,.16)';c.fillRect(0,0,384,216);
}
export function reefArchitecture(c,images,camera){for(const b of REEF_BUILDINGS)if(visible(b.x,b.w,camera))c.drawImage(images['reef_'+b.key],Math.round(b.x-camera),b.bottom-b.h,b.w,b.h);}
export function reefPlatform(c,images,s,camera){
 if(s.kind==='buildingRoof'||!visible(s.x,s.w,camera))return;
 const x=Math.round(s.x-camera),metal=s.kind==='metal',block=images[metal?'reef_metal-block':'reef_reef-block'],cap=images[metal?'reef_catwalk':'reef_reef-ledge'];
 if(!s.oneWay){for(let y=s.y+12;y<s.y+s.h;y+=32)for(let a=0;a<s.w;a+=32)c.drawImage(block,x+a,y,Math.min(32,s.w-a),Math.min(32,s.y+s.h-y));}
 for(let a=0;a<s.w;a+=64)c.drawImage(cap,x+a,s.y,Math.min(64,s.w-a),s.oneWay?26:24);
}
export function reefEnemy(c,images,e,t,camera){
 if(!visible(e.x,32,camera))return;
 let im,sx=0,sw=64,sh=64;
 if(e.skin==='reefJelly'){im=images['reef_jelly-'+Math.floor(t*5)%4];sw=im.width;sh=im.height;}
 else if(e.skin==='reefSub'){const col=e.state==='aim'?1:e.state==='fire'?2:e.state==='recover'?3:0;im=images['reef_sub-'+col];sw=im.width;sh=im.height;}
 else{im=images.reefCrab;sx=Math.floor(t*7)%4*64;}
 const size=e.skin==='reef'?34:32,x=Math.round(e.x-camera)-(size-e.w)/2,y=Math.round(e.y)+e.h-size;
 c.save();c.translate(x+(e.dir<0?size:0),y);if(e.dir<0)c.scale(-1,1);c.drawImage(im,sx,0,sw,sh,0,0,size,size);c.restore();
 if(e.skin==='reefSub'&&e.state==='aim'){c.fillStyle='#ffe4a1';c.fillRect(e.x-camera+10,e.y-12,3,6);c.fillRect(e.x-camera+10,e.y-4,3,2);}
 if(e.type==='shield'&&e.state!=='recover'){c.strokeStyle=e.state==='windup'?'#fff2a6':'#72e4d0';c.lineWidth=2;c.beginPath();c.arc(e.x-camera+e.w/2,e.y+e.h/2,15,e.dir>0?-1.2:Math.PI-1.2,e.dir>0?1.2:Math.PI+1.2);c.stroke();}
}
export function reefProjectile(c,images,b,camera){
 c.drawImage(images.projectile,Math.round(b.x-camera-2),Math.round(b.y-2),10,8);
 c.fillStyle='#8ef7e7';c.fillRect(Math.round(b.x-camera-4*Math.sign(b.vx)),Math.round(b.y+1),4,2);
}
export function reefDetails(c,images,g,camera,text){
 const p=g.player;
 for(const b of g.projectiles)reefProjectile(c,images,b,camera);
 // Props are grounded to their authored collision surfaces, never the viewport.
 for(const [x,y,w,h]of [[128,1056,32,56],[576,1056,32,56],[912,1088,40,72],[1488,1088,36,64],[2048,1056,32,56],[2592,1056,36,64],[2880,1088,32,56],[3728,1088,36,64],[4320,1088,36,64]])if(visible(x,w,camera))c.drawImage(images.reef_kelp,x-camera,y-h,w,h);
 for(const m of g.movers){reefPlatform(c,images,m,camera);c.strokeStyle=m.powered?'#83dfd2':'#5b8e94';c.setLineDash([2,4]);c.beginPath();c.moveTo(m.x-camera+m.w/2,m.baseY-m.range);c.lineTo(m.x-camera+m.w/2,m.baseY+12);c.stroke();c.setLineDash([]);if(Math.abs(p.x-m.x)<144&&Math.abs(p.y-m.y)<180)text(m.powered?(m.id==='pressureLift'?'PRESSURE LIFT':'RESEARCH LIFT'):(m.id==='pressureLift'?'TURN LOWER VALVE':'POWER RELAY A'),m.x-camera-16,m.y-40,m.powered?'#a5f5d6':'#d7bf92',6);}
 for(const h of g.hazards){if(!visible(h.x,24,camera))continue;const vent=images.reef_vent,pipeTop=Math.floor(vent.height*.58);c.drawImage(vent,0,pipeTop,vent.width,vent.height-pipeTop,h.x-camera-4,h.y+h.h-20,28,20);c.fillStyle=h.disabled?'#8df0bd':'#e3b880';c.fillRect(h.x-camera+8,h.y+h.h-23,4,3);if(h.warning||h.live){c.fillStyle=h.live?'rgba(150,240,242,.7)':'rgba(255,218,134,.65)';for(let i=0;i<6;i++){const yy=h.y+(i*11-g.time*45%11);c.fillRect(h.x-camera+4+(i%2)*5,yy,3,h.live?8:2);}}}
 for(const s of g.switches){if(!visible(s.x,32,camera))continue;const done=g.latches[s.id],isRelay=s.id.startsWith('circuit');c.drawImage(images[isRelay?'reef_console':'reef_valve'],s.x-camera-4,s.y-12,32,36);c.fillStyle=done?'#70f2bf':'#ffce78';c.fillRect(s.x-camera+10,s.y-18,4,4);if(Math.abs(p.x-s.x)<96&&Math.abs(p.y-s.y)<80)text(done?'SECURED':s.requires&&!g.latches[s.requires]?'POWER RELAY A FIRST':'E: '+s.name,s.x-camera-20,s.y-25,done?'#8dffcd':'#ffdf9b',6);}
 for(const gate of g.gates){const closed=!gate.requires.every(id=>g.latches[id]);if(!visible(gate.x,48,camera))continue;
  c.drawImage(images.reef_gate,gate.x-camera-12,gate.y+(closed?0:-56),44,gate.h);if(closed){c.strokeStyle='rgba(78,211,206,.6)';c.lineWidth=1;for(let y=0;y<gate.y;y+=24){c.beginPath();c.moveTo(gate.x-camera,y);c.lineTo(gate.x-camera+20,y+12);c.stroke();}c.fillStyle='rgba(75,225,222,.26)';c.fillRect(gate.x-camera,0,2,gate.y);c.fillRect(gate.x-camera+18,0,2,gate.y);}
 }
 for(const t of g.treasures){if(t.collected||!visible(t.x,32,camera))continue;const unlocked=!t.requires||g.latches[t.requires],near=Math.abs(p.x-t.x)<112&&Math.abs(p.y-t.y)<100;
  if(unlocked&&(!t.hidden||near))c.drawImage(images[t.id==='coralPearl'?'reef_pearl':'reef_chest'],t.x-camera-5,t.y,26,26);
  if(t.hidden&&!near){c.fillStyle='#a6f4ed';c.fillRect(t.x-camera+5,t.y+5,1,2);}
  if(t.id==='sunkenChart'&&!unlocked)c.drawImage(images.reef_kelp,t.x-camera-12,t.y-30,40,56);
 }
 for(const cr of g.crates)if(cr.hp>0){c.drawImage(images.breakableSeal,cr.x-camera,cr.y,cr.w,cr.h);if(Math.abs(p.x-cr.x)<72&&Math.abs(p.y-cr.y)<60)text('Z / C: CRACK',cr.x-camera-18,cr.y-12,'#ffe1b2',6);}
 for(const f of g.food)if(!f.collected)c.drawImage(images.food,f.x-camera,f.y,14,14);
 for(const cp of g.checkpoints)if(visible(cp.x,30,camera)){c.drawImage(images.reef_bell,cp.x-camera,cp.y-34,28,34);}
 for(const [x,y,exit]of [[80,1056,false],[4496,1088,true]])if(visible(x,64,camera)){c.drawImage(images.reef_bell,x-camera-6,y-64,48,64);c.fillStyle=exit?'#8dffbe':'#9de4ff';c.fillRect(x-camera+14,y-70,6,4);text(exit?'DEEP DOCK':'E: SURFACE',x-camera-10,y-86,'#b0f6db',6);}
 for(let i=0;i<48;i++){const x=(i*137+Math.sin(g.time+i)*3)%g.width-camera,y=1120-((g.time*12+i*83)%1080);if(visible(x,3,camera)){c.strokeStyle='#80c8ce';c.strokeRect(x,y,2,3);}}
}
export function underwaterMission(g){const l=g.latches,x=g.player.x;if(x<768)return 'Follow the rising coral ledges. Higher jumps reveal higher routes.';if(x<1904&&!l.coralValve)return 'Climb the cathedral. Turn both pressure valves with E.';if(x<1904&&!l.ballastValve)return 'Pressure lift online. Ride up and turn the upper valve.';if(x<2816)return 'Pressure balanced. Explore above the wreck; cracked cargo hides a cache.';if(!l.circuitA)return 'Research lock: power relay A on the middle catwalk.';if(!l.circuitB)return 'Research lift online. Climb to relay B at the top of the lab.';return 'Research lock open. Reach the deep dock. High treasures are optional.';}



