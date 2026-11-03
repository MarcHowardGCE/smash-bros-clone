import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(new URL('../../package.json',import.meta.url));
const {PNG}=require('pngjs');
const out=path.join(root,'assets','pirate-captain-v1');
mkdirSync(out,{recursive:true});
function write(name,png){writeFileSync(path.join(out,name),PNG.sync.write(png));}
function components(png){
 const {width:w,height:h,data}=png,n=w*h,seen=new Uint8Array(n),labels=new Int32Array(n);
 const result=[];const queue=new Int32Array(n);
 for(let i=0;i<n;i++){
  if(seen[i]||data[i*4+3]<20)continue;
  let head=0,tail=1;queue[0]=i;seen[i]=1;
  const c={id:result.length+1,minX:w,minY:h,maxX:0,maxY:0,count:0};
  while(head<tail){
   const p=queue[head++],x=p%w,y=(p/w)|0;
   labels[p]=c.id;c.count++;c.minX=Math.min(c.minX,x);c.minY=Math.min(c.minY,y);
   c.maxX=Math.max(c.maxX,x);c.maxY=Math.max(c.maxY,y);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const nx=x+dx,ny=y+dy;
    if(nx<0||nx>=w||ny<0||ny>=h)continue;
    const j=ny*w+nx;
    if(!seen[j]&&data[j*4+3]>=20){seen[j]=1;queue[tail++]=j;}
   }
  }
  result.push(c);
 }
 return {labels,parts:result.filter(c=>c.count>2500)};
}

const png=PNG.sync.read(readFileSync(path.join(out,'source.png')));
const {parts,labels}=components(png);
console.log(parts.map(c=>({x:c.minX,y:c.minY,w:c.maxX-c.minX+1,h:c.maxY-c.minY+1,count:c.count})));
if(parts.length!==24)throw new Error('Expected 24 isolated captain poses, got '+parts.length);
const sorted=parts.sort((a,b)=>a.minY-b.minY),poses=new PNG({width:256,height:192}),walk=new PNG({width:576,height:192});
const manifest={ages:['adult','teenage','baby'],poses:['idle','stride-0','stride-1','stride-2','stride-3','stride-4','stride-5','jump'],frames:[]};
for(let row=0;row<3;row++){
 const group=sorted.slice(row*8,row*8+8).sort((a,b)=>a.minX-b.minX);
 for(let col=0;col<8;col++){
  const c=group[col],sw=c.maxX-c.minX+1,sh=c.maxY-c.minY+1;
  const target=[60,50,36][row],scale=(col===7?target*.92:target)/sh;
  const walking=col>0&&col<7,cw=walking?96:64,dw=Math.round(sw*scale),dh=Math.round(sh*scale);
  // Center on the head rather than flowing coat tails so torso stays anchored.
  let sum=0,count=0;
  for(let y=c.minY+Math.floor(sh*.18);y<c.minY+sh*.42;y++)for(let x=c.minX;x<=c.maxX;x++){
   const i=y*png.width+x,j=i*4,[r,g,b]=png.data.subarray(j,j+3);
   if(labels[i]===c.id&&r>170&&g>90&&g<215&&r>g*1.12&&b<g*1.1){sum+=x;count++;}
  }
  const head=count?sum/count:c.minX+sw*.62;
  let ox=Math.round((walking?56:40)-(head-c.minX)*scale),oy=63-dh;
  ox=Math.max(1,Math.min(cw-dw-1,ox));
  if(dw>cw-2||oy<1)throw new Error('Captain frame exceeds cell at '+row+':'+col);
  const frame=new PNG({width:cw,height:64});
  for(let y=0;y<dh;y++)for(let x=0;x<dw;x++){
   const sx=c.minX+Math.min(sw-1,Math.floor(x/scale)),sy=c.minY+Math.min(sh-1,Math.floor(y/scale)),i=sy*png.width+sx;
   if(labels[i]===c.id)png.data.copy(frame.data,((oy+y)*cw+ox+x)*4,i*4,i*4+4);
  }
  const name=manifest.ages[row]+'-'+manifest.poses[col]+'.png';write(name,frame);
  if(walking)PNG.bitblt(frame,walk,0,0,96,64,(col-1)*96,row*64);
  else for(const pc of col===0?[0,1,2]:[3])PNG.bitblt(frame,poses,0,0,64,64,pc*64,row*64);
  manifest.frames.push({age:manifest.ages[row],pose:manifest.poses[col],file:name,sourceBounds:{x:c.minX,y:c.minY,w:sw,h:sh},height:dh,scale});
 }
}
write('captain-atlas.png',poses);write('captain-walk-atlas.png',walk);
writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));
console.log('Packed 24 captain frames and two runtime atlases.');
