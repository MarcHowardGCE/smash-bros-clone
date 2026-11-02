import {gateClosed} from './encounters.mjs';
import {prop,flag} from './world-art.mjs';
function box(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);}
function timber(c,x,y,w,h,seed=0){
 // Short horizontal planks with grain, bevels, seams and fasteners.
 for(let row=0;row<h;row+=8){
  const bh=Math.min(8,h-row);
  box(c,x,y+row,w,bh,'#805a3b');
  box(c,x,y+row,w,1,'#bc9360');
  if(bh>2)box(c,x,y+row+bh-1,w,1,'#49382e');
  for(let px=0;px<w;px+=3){
   const n=((px*31+(row+seed)*17)^((px+seed)*13))>>>0;
   if(n%3===0)box(c,x+px,y+row+2+(n%3),Math.min(3,w-px),1,n%2?'#a47b4e':'#68472f');
  }
  const seam=24+((row/8+seed)%3)*19;
  for(let px=seam;px<w;px+=64){
   box(c,x+px,y+row,1,bh,'#49382e');
   if(px+3<w){box(c,x+px+2,y+row+2,1,1,'#dec08a');box(c,x+px+2,y+row+3,1,1,'#443b36');}
  }
 }
}

function machinery(c,images,name,x,y,w,h){
 const image=images['machine_'+name];
 if(image)c.drawImage(image,Math.round(x),Math.round(y),w,h);
}
function chain(c,x0,y0,x1,y1){
 const length=Math.hypot(x1-x0,y1-y0),steps=Math.max(1,Math.ceil(length/3));
 for(let i=0;i<=steps;i++){
  const a=i/steps,x=x0+(x1-x0)*a,y=y0+(y1-y0)*a;
  box(c,x,y,2,2,i%2?'#677987':'#d2c4a2');
 }
}
export function districtBackground(c,g,camera,images){
 // Draw scenery by world bounds, not by the player's current district.
 c.save();c.beginPath();c.rect(960-camera,0,1216,400);c.clip();
 // Open warehouse framing leaves the painted harbor visible through the bays.
 box(c,960-camera,80,1216,320,'rgba(38,31,43,.16)');
 for(let x=960;x<2176;x+=112){
  if(x-camera>420||x+112-camera<-20)continue;
  timber(c,x-camera,104,8,296,x);
  box(c,x-camera,104,1,296,'#d5ae73');
  timber(c,x-camera,104,112,8,x+3);
  timber(c,x-camera,272,112,6,x+7);
  chain(c,x+30-camera,112,x+54-camera,142);
  chain(c,x+54-camera,142,x+80-camera,112);
 }
 c.restore();
 for(const h of g.hazards.filter(h=>h.type==='hook')){
  const image=images.machine_crane,height=580-h.baseY,width=height*image.width/image.height;
  machinery(c,images,'crane',h.baseX+7-width*.94-camera,400-height,width,height);
 }
 for(let x=5350;x<6400;x+=260){
  box(c,x-camera,80,9,320,'#5b3b32');box(c,x-camera+2,80,2,320,'#cfaa71');
  c.fillStyle='rgba(239,226,187,.40)';c.beginPath();c.moveTo(x-camera+14,100);c.lineTo(x-camera+130,245);c.lineTo(x-camera+14,245);c.fill();
 }
 // Upper platforms visibly connect to dock pilings rather than hanging unsupported.
 for(const s of g.platforms.filter(s=>s.oneWay&&s.kind!=='perch')){
  for(const x of [s.x+3,s.x+s.w-6]){
   box(c,x-camera,s.y+8,4,400-s.y-8,'#493b33');
   box(c,x-camera+1,s.y+8,1,400-s.y-8,'#ad8454');
  }
 }
 for(const s of g.platforms.filter(s=>s.kind==='perch')){
  box(c,s.x+s.w/2-camera-2,s.y+24,4,400-s.y-24,'#624839');
  box(c,s.x+s.w/2-camera-1,s.y+24,1,400-s.y-24,'#bb965e');
 }
}
export function groundDecor(c,images,g,camera){
 for(const s of g.platforms.filter(s=>s.h>8)){
  for(let x=s.x+56;x+40<s.x+s.w;x+=176){
   prop(c,images,'barrel',x-camera,s.y-20,17,20);
   prop(c,images,'rope',x+18-camera,s.y-9,18,9);
   prop(c,images,'lantern',x-25-camera,s.y-38,13,38);
  }
 }
}
export function fullEnemy(c,images,e,time,camera){
 if(e.type==='patrol')return false;
 const row=e.type==='lookout'?0:e.type==='shield'?1:2;
 const states=e.type==='lookout'?['idle','aim','fire','recover']:e.type==='shield'?['guard','windup','lunge','recover']:['idle','warn','dive','return'];
 const col=Math.max(0,states.indexOf(e.state)),x=e.x-camera-16,y=e.y+e.h-31;
 c.save();c.translate(Math.round(x)+(e.dir<0?48:0),Math.round(y));if(e.dir<0)c.scale(-1,1);
 c.drawImage(images.fullEnemies,col*96,row*64,96,64,0,0,48,32);c.restore();
 for(let i=0;i<e.hp;i++)box(c,x+19+i*4,y+5,3,1,'#ed79a7');
 if(['aim','windup','warn'].includes(e.state)){box(c,x+23,y-2,2,5,'#ffde76');box(c,x+23,y+5,2,1,'#fff1b7');}
 return true;
}
export function fullDetails(c,images,g,camera,text){
 for(const m of g.movers){
  for(let x=m.x;x<m.x+m.w;x+=16)c.drawImage(images.tiles,64,0,32,32,x-camera,m.y,16,16);
  const px=m.x+m.w/2-camera;chain(c,px,104,px,m.y);machinery(c,images,'winch',px-16,84,32,22);
 }
 for(const h of g.hazards){
  if(h.type==='hook'){
   chain(c,h.baseX+7-camera,h.baseY-140,h.x+7-camera,h.y);
   machinery(c,images,'hook',h.x-camera,h.y,14,22);
  }else{
   if(h.warning){box(c,h.x-camera,397,24,2,'#f2b66e');text('!',h.x-camera+10,380,'#ffcf70');}
   if(h.live||h.warning)c.drawImage(images.prop_crate,h.x-camera,h.y,24,24);
  }
 }
 for(const b of g.projectiles){box(c,b.x-camera,b.y,b.w,b.h,'#ffe4ad');box(c,b.x-camera-3*Math.sign(b.vx),b.y+1,4,1,'#e09366');}
 for(const s of g.gates){
  if(gateClosed(g,s)){
   for(let y=s.y;y<s.y+s.h;y+=64)machinery(c,images,'gate',s.x-camera,y,s.w,Math.min(64,s.y+s.h-y));
   box(c,s.x-camera-3,s.y,3,s.h,'#6c736e');box(c,s.x+s.w-camera,s.y,3,s.h,'#a69b7d');
   text('LOCKED',s.x-camera-5,350,'#ffdb8a');
  }
 }
 for(const s of g.platforms.filter(s=>s.kind==='perch'))machinery(c,images,'perch',s.x-camera,s.y,s.w,30);
 for(const cp of g.checkpoints)flag(c,images,'checkpoint',cp.x-camera,cp.y,g.checkpoint>=cp.x,g.time);
 for(const s of g.switches){
  const on=g.latches[s.id],x=s.x-camera;
  machinery(c,images,s.id==='bell'?'bell':'lever',x,s.y,16,24);
  box(c,x+5,s.y+18,5,2,on?'#98e6b6':'#cba0e5');
  text(on?'SET':'E',x+5,s.y-9,on?'#c4efd3':'#fff0c0');
  if(Math.abs(g.player.x-s.x)<85&&!on)text('EGGHEAD + E',x-14,s.y-20,'#fff0c0');
 }
 for(const t of g.treasures){
  if(t.collected)continue;
  const locked=t.requires&&!g.latches[t.requires];
  c.globalAlpha=locked?.25:1;
  const x=t.x-camera,y=t.y+Math.sin(g.time*3)*2;
  machinery(c,images,'chest',x,y,14,16);c.globalAlpha=1;
  if(!locked)text('*',x+5,y-8,'#ffeec4');
 }
 for(const f of g.food)if(!f.collected){
  box(c,f.x-camera+2,f.y+2,10,10,'#e99265');box(c,f.x-camera+4,f.y,6,2,'#ffe4af');box(c,f.x-camera+1,f.y+12,13,2,'#f4d7b0');
 }
 for(const cr of g.crates)if(cr.hp>0&&(cr.latch||cr.secret)){
  if(cr.latch&&cr.latch!=='cabinSeal')machinery(c,images,'winch',cr.x-camera-4,cr.y-3,24,cr.h+3);
  text(cr.requires&&!g.latches[cr.requires]?'RING BELL':'X BREAK',cr.x-camera-8,cr.y-11,'#ffdda0');
 }
 for(const s of g.platforms.filter(s=>s.h>8&&s.x>=5280)){
  const left=Math.max(s.x,Math.floor(camera/32)*32-32),right=Math.min(s.x+s.w,camera+416);
  if(right<=left)continue;
  timber(c,left-camera,402,right-left,76,Math.floor(left/32));
  for(let x=s.x+16;x<s.x+s.w;x+=64){
   if(x-camera<-8||x-camera>392)continue;
   box(c,x-camera,402,3,76,'#49382e');box(c,x-camera+1,402,1,76,'#b48e60');
   for(let y=406;y<478;y+=16){box(c,x-camera,y,3,2,'#343b40');box(c,x-camera+1,y,1,1,'#c4b384');}
  }
 }
 flag(c,images,'goal',6336-camera,400,false,g.time);
}
