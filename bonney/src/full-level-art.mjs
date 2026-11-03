import {remainingBackdrop,remainingProps,platformFootings} from './remaining-scene.mjs';
import {marketBackdrop,marketProps} from './market-scene.mjs';
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
 marketBackdrop(c,images,camera);
 remainingBackdrop(c,images,camera);
 // Riveted steel supports are narrow/open, with feet on real quay spans.
 const support=(left,right,top,feet)=>{
  const dock=left<2176,ship=left>=5280;
  const dark=dock?'#674837':ship?'#64503d':'#3d565c',light=dock?'#bd9460':ship?'#cfb480':'#9baf9c';
  box(c,left-camera,top,right-left,4,dark);box(c,left-camera,top,right-left,1,light);
  for(const x of feet){
   box(c,x-camera,top+4,ship?5:4,396-top,dark);box(c,x-camera+1,top+4,1,396-top,light);
   for(let y=top+10;y<396;y+=24){box(c,x-camera-1,y,6,3,ship?'#bda276':dock?'#95704c':'#6e8480');box(c,x-camera+1,y,1,1,'#e0c794');}
   box(c,x-camera-3,396,10,4,'#8a8a72');
   const end=Math.min(right,Math.max(left,x+(x<(left+right)/2?16:-16)));
   chain(c,x-camera,top+22,end-camera,top+4);
  }
 };
 // Second crane and lift share a grounded service gantry instead of separate sky props.
 support(2688,2856,134,[2700,2832]);
 for(const h of g.hazards.filter(h=>h.type==='hook')){
  const image=images.machine_crane,height=96,width=height*image.width/image.height;
  const x=h.baseX+7-width*.94-camera,y=h.baseY-150;
  machinery(c,images,'crane',x,y,width,height);
 }
 for(const s of g.platforms.filter(s=>s.oneWay&&s.kind!=='roof'&&s.kind!=='gateRoof')){
  if(s.x+s.w<camera||s.x>camera+384)continue;
  const feet=platformFootings(g,s);
  support(Math.min(s.x,...feet),Math.max(s.x+s.w,...feet.map(x=>x+4)),s.y+8,feet);
 }
 // Cargo comes from a visible yard hoist, not an unseen point in the sky.
 for(const h of g.hazards.filter(h=>h.type==='cargo')){
  support(h.x-12,h.x+52,84,[h.x+40]);
 }

}
export function groundDecor(c,images,g,camera){
 marketProps(c,images,camera);
 remainingProps(c,images,camera);
}
export function fullEnemy(c,images,e,time,camera){
 if(e.type==='patrol')return false;
 const row=e.type==='lookout'?0:e.type==='shield'?1:2;
 const states=e.type==='lookout'?['idle','aim','fire','recover']:e.type==='shield'?['guard','windup','lunge','recover']:['idle','warn','dive','return'];
 const size=e.type==='gull'?32:44,width=size*1.5;
 const col=Math.max(0,states.indexOf(e.state)),x=e.x+e.w/2-camera-width/2,y=e.y+e.h-size+1;
 c.save();c.translate(Math.round(x)+(e.dir<0?width:0),Math.round(y));if(e.dir<0)c.scale(-1,1);
 c.drawImage(images.fullEnemies,col*96,row*64,96,64,0,0,width,size);c.restore();
 const center=x+width/2;
 for(let i=0;i<e.hp;i++)box(c,center-5+i*4,y+5,3,1,'#ed79a7');
 if(['aim','windup','warn'].includes(e.state)){box(c,center-1,y-2,2,5,'#ffde76');box(c,center-1,y+5,2,1,'#fff1b7');}
 return true;
}
export function fullDetails(c,images,g,camera,text){
 for(const m of g.movers){
  const px=m.x+m.w/2-camera,anchor=m.anchorY||132;
  if(m.requires==='winch'){timber(c,px-5,anchor+2,10,400-anchor-2,17);timber(c,px-22,anchor+2,44,6,19);}
  for(let x=m.x;x<m.x+m.w;x+=16)c.drawImage(images.tiles,64,0,32,32,x-camera,m.y,16,16);
  chain(c,px,anchor,px,m.y);machinery(c,images,'winch',px-16,anchor-20,32,22);
  if(m.requires){box(c,px-2,anchor-26,4,3,m.powered?'#9bf0d1':'#e5b67a');if(Math.abs(g.player.x-m.x)<128)text(m.powered?'BOARDING RIGGING':'FREE THE WINCH',px-32,m.y-40,'#fff0ce');}
 }
 for(const h of g.hazards){
  if(h.type==='hook'){
   chain(c,h.baseX+7-camera,h.baseY-140,h.x+7-camera,h.y);
   machinery(c,images,'hook',h.x-camera,h.y,14,22);
  }else{
   if(h.warning){box(c,h.x-camera,397,24,2,'#f2b66e');c.drawImage(images.cargoWarning,h.x-camera+6,380,12,12);}
   chain(c,h.x+12-camera,82,h.x+12-camera,h.y);
   machinery(c,images,'winch',h.x-camera-4,62,32,22);
   c.drawImage(images.prop_crate,h.x-camera,h.y,24,24);
  }
 }
 for(const b of g.projectiles){c.drawImage(images.projectile,b.x-camera-1,b.y-1,8,6);box(c,b.x-camera-3*Math.sign(b.vx),b.y+1,3,1,'#e09366');}
 for(const s of g.gates){
  const left=s.x===4112?4068:s.x-32,right=s.x+28,top=268;
  // Human-scale dock portals. Art and collision share the same 112px door bounds.
  for(const x of [left+4,right-6]){
   box(c,x-camera,top,6,400-top,'#43575b');box(c,x-camera+1,top,2,400-top,'#b4ac83');
   for(let y=top+12;y<400;y+=24){box(c,x-camera-1,y,8,3,'#7f8b7e');box(c,x-camera+2,y,1,1,'#e3c793');}
   box(c,x-camera-3,396,12,4,'#9b9277');
  }
  timber(c,left-camera,top,right-left,8,2);
  machinery(c,images,'winch',s.x-camera-6,top-16,28,18);
  if(gateClosed(g,s)){
   // A visible sea-prism field seals the air route as well as the physical door.
   const fieldTop=-448,fieldBottom=s.y;
   box(c,s.x-camera,fieldTop,s.w,fieldBottom-fieldTop,'rgba(139,221,239,0.20)');
   box(c,s.x-camera,fieldTop,1,fieldBottom-fieldTop,'#a4f2fa');
   box(c,s.x+s.w-camera-1,fieldTop,1,fieldBottom-fieldTop,'#a4f2fa');
   for(let y=fieldTop;y<fieldBottom;y+=16)for(let i=0;i<s.w;i+=2)
    box(c,s.x+i-camera,y+i,2,1,'#bce8eb');
   text('LOCK FIELD',s.x-camera-12,246,'#c9f4f5');
   chain(c,s.x+s.w/2-camera,top+8,s.x+s.w/2-camera,s.y);
   machinery(c,images,'gate',s.x-camera,s.y,s.w,s.h);
   text('LOCKED',s.x-camera-7,350,'#ffdb8a');
  }else text('OPEN',s.x-camera-3,top+12,'#b9eac0');
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
  const floor=g.platforms.filter(s=>t.x>=s.x&&t.x+t.w<=s.x+s.w&&s.y>=t.y+t.h).sort((a,b)=>a.y-b.y)[0];
  const x=t.x-camera,y=floor?floor.y-16:t.y;
  machinery(c,images,'chest',x,y,14,16);c.globalAlpha=1;
  if(!locked)text('*',x+5,y-8,'#ffeec4');
 }
 for(const f of g.food)if(!f.collected){
  const floor=g.platforms.filter(s=>s.h>8&&f.x>=s.x&&f.x+f.w<=s.x+s.w&&s.y>=f.y+f.h).sort((a,b)=>a.y-b.y)[0];
  const bottom=floor?floor.y:f.y+f.h;
  c.drawImage(images.food,f.x-camera-1,bottom-12,16,12);
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
