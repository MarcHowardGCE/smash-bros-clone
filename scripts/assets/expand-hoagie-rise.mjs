import fs from 'node:fs';
import {createRequire} from 'node:module';
const sharp=createRequire(new URL('../../apps/client/package.json',import.meta.url))('sharp');
const base='apps/client/public/fighter-art-newcomers-v1/',file=base+'manifest.json';
const manifest=JSON.parse(fs.readFileSync(file,'utf8')),clip=manifest.characters["hulk-hoagie"].clips.air_rise_loop;
const endpoints=[clip.frames[0],clip.frames.at(-1)].map(f=>({...f,root:[f.root[0],83/(f.scale??clip.scale)],registration:"rise common vertical anchor: 83 world units from crop top"})),middle=[],report=[];
for(const[name,height,anchorX]of[['early',74,.5],['mid',72,.5],['late',70,.5],['settle',68,.5]]){
 const stem=`hoagie-rise-${name}-between-v1`;const {data,info}=await sharp('concept-art/sprite/pack-02/'+stem+'.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});let cleared=0,specks=0;
 for(let i=3;i<data.length;i+=4)if(data[i]<=5){if(data[i])cleared++;data.fill(0,i-3,i+1);}
 const prepared=await sharp(data,{raw:info}).trim().png().toBuffer(),meta=await sharp(prepared).metadata(),image=stem+'-prepared.png';fs.writeFileSync(base+image,prepared);
 const scale=height/meta.height;
 middle.push({image,rect:[0,0,meta.width,meta.height],root:[meta.width*anchorX,83/scale],sourceSize:[meta.width,meta.height],trim:[0,0],visibleHeight:meta.height,registration:'rise common vertical anchor: 83 world units from crop top',scale});
 report.push({name,worldHeight:height,width:meta.width,height:meta.height,cleared,specks});
}
const frames=[endpoints[0],...middle,endpoints[1]],durations=[2,2,2,2,2,2];
const changed=JSON.stringify(clip.frames)!==JSON.stringify(frames)||JSON.stringify(clip.durations)!==JSON.stringify(durations)||clip.loop!==false;
clip.frames=frames;clip.durations=durations;clip.loop=false;if(changed){manifest.revision++;fs.writeFileSync(file,JSON.stringify(manifest,null,2)+'\n');}
console.log(JSON.stringify({changed,revision:manifest.revision,report,clips:Object.keys(manifest.characters.moonshine.clips).length}));
