/** Read-only movement parity ledger; --all-roster includes all four shipped packs. No atlas rebuild. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const root=fileURLToPath(new URL('../../',import.meta.url));
const sharp=createRequire(new URL('../../apps/client/package.json',import.meta.url))('sharp');
const targets={jump_squat:3,takeoff_neutral:3,takeoff_forward:3,takeoff_backward:3,air_rise_loop:6,air_apex_loop:6,air_fall_loop:6,air_fastfall_loop:6,double_jump_transition:6,land_soft:6,land_heavy:6};
const rows=[];
const packs=[['02','fighter-art-newcomers-v1/dojo/manifest.json'],['03','fighter-art-pack-03-v1/production/manifest.json']];
if(process.argv.includes('--all-roster'))packs.push(['01','fighter-art-pilot-v1/production/manifest.json'],['04','fighter-art-pack-04-v1/production/manifest.json']);
for(const[pack,relative]of packs){
 const base=path.join(root,'apps/client/public',relative,'../..');
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'apps/client/public',relative),'utf8'));
 for(const[fighter,character]of Object.entries(manifest.characters))for(const[clipName,target]of Object.entries(targets)){
  const clip=character.clips[clipName],hashes=[],rectangles=[];
  if(!clip?.frames?.length)throw Error(fighter+': missing '+clipName);
  if(clip.durations&&(!clip.durations.every(n=>Number.isFinite(n)&&n>=0)||clip.durations.reduce((a,b)=>a+b,0)<=0))throw Error(fighter+': invalid durations '+clipName);
  for(const frame of clip.frames){
   if(!frame.root?.every(Number.isFinite)||(frame.airRoot&&!frame.airRoot.every(Number.isFinite))||!Number.isFinite(frame.scale??clip.scale)||(frame.scale??clip.scale)<=0)throw Error(fighter+': invalid registration '+clipName);
   const image=frame.image??clip.image;
   const rgba=await sharp(path.join(base,image)).extract({left:frame.rect[0],top:frame.rect[1],width:frame.rect[2],height:frame.rect[3]}).ensureAlpha().raw().toBuffer();
   if(!rgba.some((n,i)=>i%4===3&&n>0))throw Error(fighter+': empty crop '+clipName);
   hashes.push(crypto.createHash('sha256').update(rgba).digest('hex'));rectangles.push(image+':'+frame.rect.join(','));
  }
  rows.push({pack,fighter,clip:clipName,revision:manifest.revision,slots:clip.frames.length,distinctRects:new Set(rectangles).size,distinctPixelHashes:new Set(hashes).size,durations:clip.durations??null,loop:clip.loop??false,target,minimumAdditionalDrawings:Math.max(0,target-new Set(hashes).size)});
 }
}
const result={basis:'Shipped movement manifests (Dojo Packs 02/03, optional --all-roster); decoded RGBA crop hashes are not semantic pose approval. Zero-duration original squat slots are allowed if total duration is positive.',rows};
const outputIndex=process.argv.indexOf('--output');
if(outputIndex>=0){if(!process.argv[outputIndex+1])throw Error('--output requires a path');fs.writeFileSync(path.resolve(process.argv[outputIndex+1]),JSON.stringify(result,null,2)+'\n');}
console.log(JSON.stringify(rows.reduce((counts,row)=>(counts[row.fighter]=(counts[row.fighter]??0)+row.minimumAdditionalDrawings,counts),{})));
