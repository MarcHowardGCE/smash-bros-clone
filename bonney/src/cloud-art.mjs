import {CLOUD_BUILDINGS} from './cloud-data.mjs';
import {gateClosed} from './encounters.mjs';
export function cloudBackground(c,images,camera,time){
 c.fillStyle='#82cfee';c.fillRect(0,0,384,216);
 const offset=((camera*.08)%648+648)%648;
 for(const x of [-offset,648-offset])c.drawImage(images.sky,Math.round(x),-90,648,432);
 // Distant architecture is deliberately quieter than the cloud platforms.
 c.save();c.globalAlpha=.58;
 for(const [x,y,w,h]of [[260,75,230,115],[690,45,280,140]])c.drawImage(images.cloudLab,Math.round(x-camera*.28),y,w,h);
 c.restore();
}
export function cloudPlatform(c,images,s,camera){
 if(s.kind==='skyRoof')return;
 c.save();if(s.fadeMs>0)c.globalAlpha=.12;else if(s.warningMs>0)c.globalAlpha=.55+.3*Math.sin(s.warningMs*.04);
 if(s.kind==='hover'){c.drawImage(images['reef_catwalk'],s.x-camera,s.y,s.w,14);c.fillStyle=s.powered?'#b4ffdf':'#d7b0e7';c.fillRect(s.x-camera+4,s.y+2,s.w-8,1);c.restore();return;}
 c.drawImage(images.cloudIsland,Math.round(s.x-camera),s.y,s.w,Math.min(64,Math.max(14,s.w/7)));
 c.fillStyle='#effaff';c.fillRect(Math.round(s.x-camera+8),s.y+2,s.w-16,6);
 c.fillStyle='#f5fcff';c.fillRect(Math.round(s.x-camera+8),s.y,s.w-16,2);c.restore();
}
function art(c,images,key,x,y,w,h){const im=images[key];if(im)c.drawImage(im,Math.round(x),Math.round(y),w,h);}
export function cloudArchitecture(c,images,camera){
 for(const b of CLOUD_BUILDINGS)if(b.x+b.w>=camera&&b.x<=camera+384)art(c,images,b.key,b.x-camera,b.bottom-b.h,b.w,b.h);
}
export function cloudEnemy(c,images,e,time,camera){
 const row=e.type==='patrol'?0:e.type==='lookout'?1:2;
 const states=row===0?null:row===1?['idle','aim','fire','recover']:['guard','windup','lunge','recover'];
 const col=row===0?(e.stunMs>0?3:Math.floor(time*6)%3):Math.max(0,states.indexOf(e.state));
 const x=e.x+e.w/2-camera-24,y=e.y+e.h-31;
 c.save();c.translate(Math.round(x)+(e.dir<0?48:0),Math.round(y));if(e.dir<0)c.scale(-1,1);
 c.drawImage(images.skyEnemies,col*96,row*64,96,64,0,0,48,32);c.restore();
 c.fillStyle='#a881d1';for(let i=0;i<e.hp;i++)c.fillRect(x+18+i*4,y-3,3,1);
 if(['aim','windup'].includes(e.state)){c.fillStyle='#f6a1d9';c.fillRect(x+22,y-10,2,5);c.fillRect(x+22,y-4,2,1);}
}
export function cloudDetails(c,images,g,camera,text){
 const x=104-camera;
 c.fillStyle='#9e98c9';c.fillRect(x-15,219,30,5);c.fillStyle='#d9f8ff';c.fillRect(x-12,216,24,3);
 c.fillStyle='#63dfed';c.fillRect(x-8,214,16,2);
 if(Math.abs(g.player.x-104)<65)text('E: HARBOR',x-20,202,'#52497a');
 for(const m of g.movers){c.strokeStyle=m.powered?'#91dfed':'#928aad';c.setLineDash([2,4]);c.beginPath();c.moveTo(m.x-camera+m.w/2,m.baseY-m.range);c.lineTo(m.x-camera+m.w/2,m.baseY+8);c.stroke();c.setLineDash([]);cloudPlatform(c,images,m,camera);if(Math.abs(g.player.x-m.x)<130)text(m.powered?'REACTOR LIFT ONLINE':'GEAR: RESTORE REACTOR',m.x-camera-8,m.y-40,'#654974');}
 for(const h of g.hazards){
  if(h.type==='updraft'){
   art(c,images,'skyFan',h.x-20-camera,h.y+h.h-14,20,14);
   c.fillStyle='rgba(182,245,255,.65)';
   for(let i=0;i<12;i++){const py=h.y+h.h-((g.time*60+i*17)%h.h);c.fillRect(h.x-camera+(i*13)%h.w,py,1,6);}
  }else if(h.type==='beam'){
   art(c,images,'skyPylon',h.x-6-camera,h.y+h.h-30,12,30);
   if(h.live||h.warning){c.fillStyle=h.live?'#f2a4ec':'#dfc2f4';
    for(let y=h.y;y<h.y+h.h-18;y+=h.live?2:8)c.fillRect(h.x-camera+(h.live?2:5),y,h.live?8:2,2);}
  }
 }
 for(const b of g.projectiles){c.fillStyle='#79efff';c.fillRect(b.x-camera,b.y,7,3);c.fillStyle='#fbf8ff';c.fillRect(b.x-camera+2,b.y,3,2);}
 for(const s of g.switches){art(c,images,'skyConsole',s.x-camera-2,s.y,20,24);text(g.latches[s.id]?'SET':'E',s.x-camera+4,s.y-8,'#a57bd1');}
 for(const cr of g.crates)if(cr.hp>0&&Math.abs(g.player.x-cr.x)<90)text('GEAR: HOLD Z',cr.x-camera-16,cr.y-10,'#b482cc');
 for(const s of g.gates){
  art(c,images,'skyPylon',s.x-camera-10,272,16,48);art(c,images,'skyPylon',s.x-camera+s.w-6,272,16,48);
  if(gateClosed(g,s)){
   c.fillStyle='rgba(155,220,250,.24)';c.fillRect(s.x-camera,-448,s.w,928);
   c.fillStyle='#c3efff';for(let y=-448;y<480;y+=12)c.fillRect(s.x-camera,y,s.w,1);
   text('REACTOR LOCK',s.x-camera-20,264,'#a279ca');
  }
 }
 for(const cp of g.checkpoints)art(c,images,'skyFlag',cp.x-camera,cp.y-36,20,36);
 for(const f of g.food)if(!f.collected)art(c,images,'skySnack',f.x-camera,f.y+f.h-12,16,12);
 for(const t of g.treasures)if(!t.collected){
  const tx=t.x-camera,ty=t.y+Math.sin(g.time*3)*2,locked=t.requires&&!g.latches[t.requires];c.save();c.globalAlpha=locked?.25:1;
  c.fillStyle='#9868bd';c.fillRect(tx,ty,14,16);c.fillStyle='#c7f6ff';c.fillRect(tx+2,ty+2,10,12);
  c.fillStyle='#58bccd';c.fillRect(tx+4,ty+5,6,1);c.fillRect(tx+6,ty+3,1,9);text('*',tx+5,ty-9,'#c787c9');c.restore();
 }
 art(c,images,'skyFlag',3732-camera,240,44,80);
 if(g.player.x>3650)text('SKY ROUTE',3716-camera,228,'#805ab3');
}
export function hiddenCloudBank(c,images,g,camera,text){
 if(g.scene==='cloud')return;
 if(g.skyUnlocked){c.drawImage(images.skyFan,3008-camera,128,20,16);c.fillStyle='#91e6ef';c.fillRect(2944-camera,142,96,2);if(text&&Math.abs(g.player.x-2992)<96&&g.player.y<180)text('E: RETURN TO SKY',2948-camera,94,'#a7eaff',6);}
 c.drawImage(images.cloudIsland,2800-camera,-360,440,100);
 if(Math.sin(g.time*.9)>.96)c.drawImage(images.tiles,192,0,32,32,2996-camera,42,4,4);
}

