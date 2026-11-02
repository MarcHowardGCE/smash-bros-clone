// Artwork-only rendering. Positions and collision boundaries remain owned by engine.mjs.
function box(ctx,x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h);}
function line(ctx,x0,y0,x1,y1,color,width=1){
 x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);
 const dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1;
 let err=dx+dy;
 for(;;){box(ctx,x0,y0,width,width,color);if(x0===x1&&y0===y1)break;const e=2*err;if(e>=dy){err+=dy;x0+=sx;}if(e<=dx){err+=dx;y0+=sy;}}
}
export function prop(ctx,images,name,x,y,w,h=w){
 const im=images['prop_'+name];if(im)ctx.drawImage(im,Math.round(x),Math.round(y),w,h);
}
export function harborBackground(ctx,images,camera,time){
 box(ctx,0,0,384,216,'#63b2d0');
 const offset=((camera*.13)%648+648)%648;
 ctx.drawImage(images.harbor,Math.round(-offset),0,648,216);
 ctx.drawImage(images.harbor,Math.round(648-offset),0,648,216);
 // Atmospheric separation keeps distant scenery behind the playable silhouettes.
 box(ctx,0,38,384,160,'rgba(204,230,231,0.10)');
 // Separate moving water glints add depth independently of the painted skyline.
 for(let i=0;i<14;i++){
  const x=((i*37-camera*.26+time*2)%420+420)%420-20,y=164+(i%5)*9;
  box(ctx,x,y,9+i%4,0.5,i%3?'rgba(191,241,231,0.45)':'rgba(246,228,179,0.55)');
 }
}
export function dockSupports(ctx,s,camera){
 const x=s.x-camera,w=s.w;
 for(const p of [x+4,x+w-8]){
  box(ctx,p,s.y+7,7,216-s.y,'#3d3033');box(ctx,p+1,s.y+7,3,216-s.y,'#966641');
  box(ctx,p+2,s.y+8,1,216-s.y,'#ba8952');
  for(let y=s.y+12;y<210;y+=18){box(ctx,p,y,7,3,'#423d43');box(ctx,p+1,y,5,1,'#8f9492');}
 }
 if(w>=48){
  line(ctx,x+8,s.y+16,x+w/2,s.y+29,'#493e37',2);
  line(ctx,x+w/2,s.y+29,x+w-5,s.y+16,'#493e37',2);
  line(ctx,x+8,s.y+16,x+w/2,s.y+28,'#d0ab71');
  line(ctx,x+w/2,s.y+28,x+w-5,s.y+16,'#d0ab71');
 }
}
export function harborDecor(ctx,images,camera,time){
 // Small props sit on the rear edge of the quay; solid breakable crates are drawn separately.
 ctx.globalAlpha=.86;
 for(const x of [58,190,382,570,720,1018,1368,1650,1814]){
  prop(ctx,images,'barrel',x-camera,155,17,20);
  if(x%3===1)prop(ctx,images,'rope',x-camera+14,166,18,9);
 }
 ctx.globalAlpha=1;
 for(const x of [20,214,368,744,1056,1392,1736]){
  const px=x-camera;
  if(px<-30||px>410)continue;
  prop(ctx,images,'lantern',px,137,13,38);
  // Restrained warm flicker, visible without covering gameplay.
  const a=.06+.025*Math.sin(time*5+x);
  box(ctx,px+2,145,9,12,'rgba(255,218,139,'+a+')');
 }
 // Mooring posts and taut ropes below the walkable edge.
 for(let x=80;x<1920;x+=160){
  const px=x-camera;
  box(ctx,px,185,5,22,'#594739');box(ctx,px+1,185,2,22,'#b38a5c');
  box(ctx,px-1,184,7,3,'#c8af7d');
 }
}
export function guard(ctx,images,e,time,camera){
 const x=Math.round(e.x-camera-8),y=Math.round(e.y+e.h-31);
 const col=Math.floor(time*6+e.min)%4;
 ctx.save();ctx.translate(x+(e.dir<0?32:0),y);if(e.dir<0)ctx.scale(-1,1);
 ctx.drawImage(images.guard,col*64,0,64,64,0,0,32,32);ctx.restore();
 // Three tiny pips remain above the head for combat readability.
 for(let i=0;i<3;i++)box(ctx,x+10+i*4,y+7,3,1.5,i<e.hp?'#ed79a7':'#435264');
}
export function pickup(ctx,images,power,x,y,time){
 const py=y+Math.sin(time*4)*1.5;
 ctx.globalAlpha=.18;box(ctx,x-2,py-2,20,20,power==='egghead'?'#d7a3ff':'#9fe6bc');ctx.globalAlpha=1;
 prop(ctx,images,power==='egghead'?'boots':'hat',x-2,py-2,20,20);
 for(let i=0;i<3;i++){
  const angle=time*2+i*2.1,px=x+8+Math.cos(angle)*13,sy=py+7+Math.sin(angle)*11;
  box(ctx,px,sy,1,2,'#fff2bc');box(ctx,px-.5,sy+.5,2,1,'#fff2bc');
 }
}
export function flag(ctx,images,name,x,baseY,reached=false,time=0){
 if(reached){ctx.globalAlpha=.17+.04*Math.sin(time*3);box(ctx,x-3,baseY-35,26,30,'#ffd363');ctx.globalAlpha=1;}
 // A small horizontal flutter without moving the pole anchor.
 prop(ctx,images,name,x-3,baseY-42,37,42);
 if(reached){box(ctx,x+3,baseY-36,3,3,'#ffe5a0');}
}
export function sign(ctx,images,x,y,width){
 prop(ctx,images,'sign',x,y,width,23);
}
export function harborWater(ctx,images,time){
 const shift=Math.floor(time*8)%16;
 for(let x=-16;x<400;x+=16)ctx.drawImage(images.tiles,96,0,32,32,x-shift,208,16,16);
 for(let i=0;i<9;i++){
  const x=(i*47+Math.floor(time*11))%400-8;
  box(ctx,x,210+i%3,7,0.5,'#b6efe4');
 }
}
