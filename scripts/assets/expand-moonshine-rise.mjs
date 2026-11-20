import fs from 'node:fs';
import {createRequire} from 'node:module';
const sharp=createRequire(new URL('../../apps/client/package.json',import.meta.url))('sharp');
const base='apps/client/public/fighter-art-newcomers-v1/',file=base+'manifest.json';
const manifest=JSON.parse(fs.readFileSync(file,'utf8')),clip=manifest.characters.moonshine.clips.air_rise_loop;
const endpoints=[clip.frames[0],clip.frames.at(-1)],middle=[],report=[];
for(const[name,height,anchorX]of[['early',66,.5],['mid',65,.5],['late',66,.48],['settle',65,.46]]){
 const stem=`moonshine-rise-${name}-between-v1`;const {data,info}=await sharp('concept-art/sprite/pack-02/'+stem+'.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});let cleared=0,specks=0;
 for(let i=3;i<data.length;i+=4)if(data[i]<=5){if(data[i])cleared++;data.fill(0,i-3,i+1);}
 if(name==='settle')for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){const i=(y*info.width+x)*4;if(!data[i+3]||data[i+3]>7)continue;let near=false;for(let dy=-4;dy<=4&&!near;dy++)for(let dx=-4;dx<=4;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<info.width&&yy<info.height&&data[(yy*info.width+xx)*4+3]>=128){near=true;break;}}if(!near){data.fill(0,i,i+4);specks++;}}
 const prepared=await sharp(data,{raw:info}).trim().png().toBuffer(),meta=await sharp(prepared).metadata(),image=stem+'-prepared.png';fs.writeFileSync(base+image,prepared);
 const scale=height/meta.height;
 middle.push({image,rect:[0,0,meta.width,meta.height],root:[meta.width*anchorX,meta.height+7/scale],sourceSize:[meta.width,meta.height],trim:[0,0],visibleHeight:meta.height,registration:'guided airborne support; seven world units below boot extent',scale});
 report.push({name,worldHeight:height,width:meta.width,height:meta.height,cleared,specks});
}
const frames=[endpoints[0],...middle,endpoints[1]],durations=[2,2,2,2,2,2];
const changed=JSON.stringify(clip.frames)!==JSON.stringify(frames)||JSON.stringify(clip.durations)!==JSON.stringify(durations)||clip.loop!==false;
clip.frames=frames;clip.durations=durations;clip.loop=false;if(changed){manifest.revision++;fs.writeFileSync(file,JSON.stringify(manifest,null,2)+'\n');}
console.log(JSON.stringify({changed,revision:manifest.revision,report,clips:Object.keys(manifest.characters.moonshine.clips).length}));
