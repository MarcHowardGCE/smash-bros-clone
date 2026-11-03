import {addGrabContact} from "./grab-contact-metadata.mjs";
import {extendRosterPilot} from './build-roster-pilot-pack.mjs';
import fs from 'node:fs';import path from 'node:path';import { PNG } from 'pngjs';import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const target=path.join(root,'apps/client/public/fighter-art-pilot-v1');
const specs=[
 ['idle','all-rounder-idle-v1.png',2,2,4,[12,12,12,12],'feet'],
 ['walk','all-rounder-walk-v2.png',3,2,6,[4,4,4,4,4,4],'head'],
 ['jab','all-rounder-jab-v2.png',3,3,9,[1,1,1,2,2,2,2,2,2],'feet'],
 ['run','all-rounder-run-v1.png',3,2,6,[3,3,3,3,3,3],'head'],
 ['jump','all-rounder-jump-v1.png',3,2,6,[3,12,8,12,6,6],'movement'],
 ['shield','all-rounder-shield-v1.png',2,2,4,[12,12,12,12],'feet'],
 ['dodge','all-rounder-dodge-v1.png',3,2,6,[3,3,4,4,3,3],'feet'],
 ['roll','all-rounder-roll-v1.png',3,2,6,[3,3,4,4,3,3],'feet'],
 ['reaction','all-rounder-reaction-v1.png',2,2,4,[6,10,12,18],'feet'],
];
const manifest={version:1,revision:4,character:'all-rounder',worldHeight:80,clips:{}};
for(const [name,image,columns,rows,count,durations,registration] of specs){
 const png=PNG.sync.read(fs.readFileSync(path.join(target,image)));let transparent=0;
 for(let i=3;i<png.data.length;i+=4)if(png.data[i]===0)transparent++;
 if(transparent/(png.width*png.height)<.5)throw Error(image+': transparency failed');
 const frames=[];
 for(let i=0;i<count;i++){
  // Reaction output has staggered pose rows: explicit non-overlapping regions prevent cross-pose leakage.
  const region=name==='reaction'?[[0,0,.5,.55],[.5,0,1,.55],[0,.55,.45,1],[.45,.55,1,1]][i]:[i%columns/columns,Math.floor(i/columns)/rows,(i%columns+1)/columns,(Math.floor(i/columns)+1)/rows];
  const [left,top,right,bottom]=[Math.round(region[0]*png.width),Math.round(region[1]*png.height),Math.round(region[2]*png.width),Math.round(region[3]*png.height)];
  let minX=right,minY=bottom,maxX=left-1,maxY=top-1;
  for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)if(png.data[(y*png.width+x)*4+3]>32){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
  if(maxX<minX||minX<=left||maxX>=right-1||minY<=top||maxY>=bottom-1)throw Error(image+': blank/clipped/noisy cell '+i);
  const visibleHeight=maxY-minY+1;
  let soleMin=right,soleMax=left-1,headSum=0,headWeight=0;
  for(let y=maxY-Math.round(visibleHeight*.055);y<=maxY;y++)for(let x=minX;x<=maxX;x++)if(png.data[(y*png.width+x)*4+3]>64){soleMin=Math.min(soleMin,x);soleMax=Math.max(soleMax,x);}
  for(let y=minY;y<minY+visibleHeight*.22;y++)for(let x=minX;x<=maxX;x++){const a=png.data[(y*png.width+x)*4+3];if(a>64){headSum+=x*a;headWeight+=a;}}
  const rootX=(registration==='feet'||(name==='jump'&&(i===0||i===5)))?(soleMin+soleMax)/2:headSum/headWeight-visibleHeight*.035;
  const trimX=Math.max(left,minX-3),trimY=Math.max(top,minY-3);
  frames.push({rect:[trimX,trimY,Math.min(right,maxX+4)-trimX,Math.min(bottom,maxY+4)-trimY],root:[rootX-trimX,maxY+1-trimY],sourceSize:[right-left,bottom-top],trim:[trimX-left,trimY-top],visibleHeight,registration,offsetY:28,soleSpan:soleMax-soleMin+1});
 }
 const heights=frames.map(f=>f.visibleHeight).sort((a,b)=>a-b);
 const referenceHeight=name==='dodge'||name==='roll'?frames[5].visibleHeight:name==='reaction'?frames[0].visibleHeight:name==='jump'?frames[3].visibleHeight:name==='run'?Math.max(...heights):heights[Math.floor(heights.length/2)];
 if(name==='run')for(const frame of frames)frame.root[1]=3+referenceHeight;
 if(name==='jump')for(const [i,frame]of frames.entries())if(i>0&&i<5){frame.root[1]=3+referenceHeight*.65;frame.offsetY=0;}
 if(name==='roll')for(const i of [2,3]){frames[i].root=[frames[i].rect[2]/2,frames[i].rect[3]/2];frames[i].offsetY=0;}
 if(name==='reaction'){frames[2].root=[frames[2].rect[2]/2,frames[2].rect[3]/2];frames[2].offsetY=0;frames[3].root[0]=frames[3].rect[2]/2;}
 manifest.clips[name]={image,scale:80/referenceHeight,durations,frames};
 console.log(name+': '+count+' alpha/cell checks passed; registration '+registration);
 if(registration==='feet'){const spans=frames.map(f=>f.soleSpan);console.log(name+' sole width range: '+Math.min(...spans)+'..'+Math.max(...spans));}
}
extendRosterPilot(manifest,target);
addGrabContact(manifest);
fs.writeFileSync(path.join(target,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
