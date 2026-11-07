import{getMoveDataForCharacter}from '../../packages/engine/dist/moves/index.js';

import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import{PNG}from'pngjs';
const dojo=process.argv.includes('--dojo');const folder=dojo?'dojo':'production';
const source=path.resolve(dojo?'apps/client/public/fighter-art-newcomers-v1':'apps/client/public/fighter-art-pilot-v1'),out=path.join(source,folder);fs.mkdirSync(out,{recursive:true});const m=JSON.parse(fs.readFileSync(source+'/manifest.json')),pack=structuredClone(m);delete pack.clips;
if(dojo){delete pack.baselineCharacters;delete pack.coverage;}
const promoted=["trip_fall","trip_prone","trip_getup","floor_attack_trip","trip_roll","jab_lock_up","jab_lock_down","ceiling_tech","air_dodge_land","air_dodge_up","air_dodge_side","air_dodge_up_diagonal","air_dodge_back","air_dodge_up_back","taunt_up","taunt_side","taunt_down","ko_launch","ko_screen","ko_star","grab_dash","grab_pivot","hit_high","hit_low","hit_heavy","hit_air","wall_tech","wall_tech_jump","tumble_recover","turn_stand","turn_run","brake","crouch_enter","crouch_hold","crouch_exit","land_heavy","platform_drop","teeter_front","teeter_back","takeoff_neutral","takeoff_forward","takeoff_backward","entry","respawn_wait","respawn_drop","victory_1","victory_2","victory_3","defeat",'helpless_enter','helpless_loop','helpless_land','footstool_attacker','footstool_ground_victim','footstool_air_victim','shield_raise','shield_hit','shield_drop','parry','shield_break_launch','shield_break_dizzy','shield_break_recover','air_rise_loop','air_apex_loop','air_fall_loop','air_fastfall_loop','double_jump_transition','land_soft','air_dodge_down','air_dodge_down_diagonal','air_dodge_down_back','jab_2','jab_3','dash_attack','knockdown_down','prone_down','getup_up','getup_down','getup_roll_up','getup_roll_down','floor_attack_up','floor_attack_down'],size=2048,pad=2,pages=[];let current,x=pad,y=pad,row=0,index=0,groupName='';
function start(){current=new PNG({width:size,height:size});x=pad;y=pad;row=0;}
function flush(){if(!current)return;const file='atlas-'+groupName+'-'+index+++'.png',buffer=PNG.sync.write(current);fs.writeFileSync(out+'/'+file,buffer);pages.push({file,width:size,height:size,bytes:buffer.length,sha256:crypto.createHash('sha256').update(buffer).digest('hex'),live:!groupName.endsWith('-prepared')});current=null;}
function crop(png,f,factor){const w=Math.ceil(f.rect[2]*factor),h=Math.ceil(f.rect[3]*factor),a=new Uint8Array(w*h*4);for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){const sx=(xx+.5)/factor-.5,sy=(yy+.5)/factor-.5,ix=Math.floor(sx),iy=Math.floor(sy);let alpha=0,r=0,g=0,b=0;for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){const cx=ix+dx,cy=iy+dy;if(cx<0||cy<0||cx>=f.rect[2]||cy>=f.rect[3])continue;const weight=(dx?sx-ix:1-sx+ix)*(dy?sy-iy:1-sy+iy),o=((f.rect[1]+cy)*png.width+f.rect[0]+cx)*4,v=png.data[o+3]*weight;alpha+=v;r+=png.data[o]*v;g+=png.data[o+1]*v;b+=png.data[o+2]*v;}const o=(yy*w+xx)*4;a[o+3]=Math.round(alpha);if(alpha){a[o]=Math.round(r/alpha);a[o+1]=Math.round(g/alpha);a[o+2]=Math.round(b/alpha);}}return{w,h,a};}
function place(a){if(a.w+pad*2>size||a.h+pad*2>size)throw Error('Oversize frame');if(!current)start();if(x+a.w+pad>size){x=pad;y+=row+pad*2;row=0;}if(y+a.h+pad>size){flush();start();}const rect=[x,y,a.w,a.h],file=folder+'/atlas-'+groupName+'-'+index+'.png';for(let dy=-pad;dy<a.h+pad;dy++)for(let dx=-pad;dx<a.w+pad;dx++){const src=(Math.max(0,Math.min(a.h-1,dy))*a.w+Math.max(0,Math.min(a.w-1,dx)))*4,dst=((y+dy)*size+x+dx)*4;current.data.set(a.a.subarray(src,src+4),dst);}x+=a.w+pad*2;row=Math.max(row,a.h);return{rect,file};}
const groups=[];if(dojo){for(const [id,c] of Object.entries(pack.characters))groups.push({name:id+'-live',clips:Object.values(c.clips)});}else{for(const[id,c]of Object.entries(pack.characters)){for(const[name,k]of Object.entries(c.clips))if(promoted.includes(name))k.previewOnly=false;
for(const[name,k]of Object.entries(c.clips))if(['jab_2','jab_3','dash_attack','grab_dash','grab_pivot'].includes(name)){const d=getMoveDataForCharacter(id,name.toUpperCase());const a=Math.floor(d.startupFrames/3),b=Math.floor(d.startupFrames*2/3);k.durations=[a,b-a,d.startupFrames-b,d.activeFrames,Math.ceil(d.recoveryFrames/2),Math.floor(d.recoveryFrames/2)];k.activeWindow=[d.startupFrames,d.startupFrames+d.activeFrames];k.engineMove=name.toUpperCase();}for(const name of['floor_attack_up','floor_attack_down','floor_attack_trip']){const k=c.clips[name],d=getMoveDataForCharacter(id,name.toUpperCase());k.durations=[3,3,d.activeFrames,5,5,d.recoveryFrames-10];k.activeWindow=[d.startupFrames,d.startupFrames+d.activeFrames];k.engineMove=name.toUpperCase();}if(c.clips.helpless_land)c.clips.helpless_land.durations=[3,2,2,3,2,2];for(const live of[true,false])groups.push({name:id+(live?'-live':'-prepared'),clips:Object.values(c.clips).filter(k=>!k.previewOnly===live)});}groups.push({name:'effects-live',clips:Object.values(pack.effects)});}
let frames=0;
for(const group of groups){
  groupName=group.name;index=0;
  const cache=new Map(),sources=new Map();
  for(const clip of group.clips){
    for(const frame of clip.frames){
      const image=frame.image??clip.image,factor=(frame.scale??clip.scale)*2;
      const key=image+':'+frame.rect.join(',')+':'+factor;
      let placed=cache.get(key);
      if(!placed){
        let png=sources.get(image);
        if(!png){png=PNG.sync.read(fs.readFileSync(path.join(source,image)));sources.set(image,png);}
        placed=place(crop(png,frame,factor));cache.set(key,placed);
      }
      frame.rect=placed.rect;frame.image=placed.file;delete frame.scale;
      frame.root=frame.root.map(v=>v*factor);
      if(frame.airRoot)frame.airRoot=frame.airRoot.map(v=>v*factor);
      if(frame.sockets)for(const n of Object.keys(frame.sockets))frame.sockets[n]=frame.sockets[n].map(v=>v*factor);
      frames++;
    }
    if(dojo)clip.image=clip.frames[0].image;
    clip.scale=.5;
  }
  flush();
}
for(const c of Object.values(pack.characters)){c.clips.air_dodge_directional.legacy=true;c.clips.air_dodge_directional.legacyReplacedBy=['air_dodge_up','air_dodge_down','air_dodge_side','air_dodge_back','air_dodge_up_diagonal','air_dodge_up_back','air_dodge_down_diagonal','air_dodge_down_back'];}
pack.production={legacyClips:['air_dodge_directional'],version:1,density:2,sourceRevision:m.revision,padding:pad,pages:pages.map(p=>p.file),promoted};fs.writeFileSync(out+'/manifest.json',JSON.stringify(pack));const report={sourceRevision:m.revision,frames,pages:pages.length,livePages:pages.filter(p=>p.live).length,liveTextureBytes:pages.filter(p=>p.live).length*size*size*4,downloadBytes:pages.reduce((n,p)=>n+p.bytes,0),sampling:'premultiplied-alpha bilinear at two pixels per world unit; original artwork preserved',files:pages};fs.writeFileSync(out+'/atlas-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({...report,files:undefined}));

