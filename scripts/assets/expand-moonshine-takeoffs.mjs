import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const sharp=createRequire(new URL('../../apps/client/package.json',import.meta.url))('sharp');
const base='apps/client/public/fighter-art-newcomers-v1/';
const file=base+'manifest.json',manifest=JSON.parse(fs.readFileSync(file,'utf8'));
let changed=false;const report=[];
for(const[direction,height,anchorX]of[['neutral',76,.5],['forward',74,.52],['backward',74,.45]]){
 const stem=`moonshine-takeoff-${direction}-mid-between-v1`;
 const {data,info}=await sharp('concept-art/sprite/pack-02/'+stem+'.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let cleared=0,specks=0;
 for(let a=3;a<data.length;a+=4)if(data[a]<=5){if(data[a])cleared++;data.fill(0,a-3,a+1);}
 if(direction==='forward')for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
  const i=(y*info.width+x)*4;if(!data[i+3]||data[i+3]>6)continue;let near=false;
  for(let dy=-4;dy<=4&&!near;dy++)for(let dx=-4;dx<=4;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<info.width&&yy<info.height&&data[(yy*info.width+xx)*4+3]>=128){near=true;break;}}
  if(!near){data.fill(0,i,i+4);specks++;}
 }
 const image=stem+'-prepared.png',prepared=await sharp(data,{raw:info}).trim().png().toBuffer();const meta=await sharp(prepared).metadata();
 fs.writeFileSync(base+image,prepared);
 const frame={image,scale:height/meta.height,rect:[0,0,meta.width,meta.height],root:[meta.width*anchorX,meta.height-2],sourceSize:[meta.width,meta.height],trim:[0,0],visibleHeight:meta.height,registration:'takeoff intermediate support anchor'};
 const clip=manifest.characters.moonshine.clips['takeoff_'+direction];
 const frames=[clip.frames[0],frame,clip.frames.at(-1)];
 if(JSON.stringify(clip.frames)!==JSON.stringify(frames)||JSON.stringify(clip.durations)!==JSON.stringify([2,2,2]))changed=true;
 clip.frames=frames;clip.durations=[2,2,2];report.push({direction,height,width:meta.width,pixelHeight:meta.height,cleared,specks,root:frame.root});
}
if(changed){manifest.revision++;fs.writeFileSync(file,JSON.stringify(manifest,null,2)+'\n');}
console.log(JSON.stringify({changed,revision:manifest.revision,report,clipCounts:Object.fromEntries(Object.entries(manifest.characters).map(([id,c])=>[id,Object.keys(c.clips).length]))}));
