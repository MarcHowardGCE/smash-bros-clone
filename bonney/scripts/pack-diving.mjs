import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(new URL('../../package.json',import.meta.url));
const {PNG}=require('pngjs');
const hero=process.argv[2];
if(!['bonney','luffy'].includes(hero))throw new Error('Pass bonney or luffy');
const out=path.join(root,'assets','underwater-v1',hero);
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

const manifest={character:hero,ages:['adult','teenage','baby'],columns:['idle','walk-0','walk-1','walk-2','walk-3','walk-4','walk-5','jump','punch','kick'],outfits:{}};
for(const outfit of ['diving']){
 const png=PNG.sync.read(readFileSync(path.join(out,outfit+'-source.png'))),{parts,labels}=components(png);
 console.log(outfit,parts.map(c=>({x:c.minX,y:c.minY,w:c.maxX-c.minX+1,h:c.maxY-c.minY+1,count:c.count})));
 if(parts.length!==30)throw new Error('Expected30 '+outfit+' poses, got '+parts.length);
 const sorted=parts.sort((a,b)=>a.minY-b.minY),poses=new PNG({width:256,height:192}),walk=new PNG({width:576,height:192}),attack=new PNG({width:192,height:192}),records=[];
 for(let row=0;row<3;row++){
  const group=sorted.slice(row*10,(row+1)*10).sort((a,b)=>a.minX-b.minX),target=[60,50,36][row],scale=target/(group[0].maxY-group[0].minY+1);
  for(let col=0;col<10;col++){
   const c=group[col],sw=c.maxX-c.minX+1,sh=c.maxY-c.minY+1,isWalk=col>=1&&col<=6,cw=col===0||col===7?64:96;
   const dw=Math.round(sw*scale),dh=isWalk?target:Math.min(62,Math.round(sh*scale));
   const upperSource=Math.floor(sh*.60),upperTarget=Math.round(upperSource*scale);
   const sourceY=y=>isWalk&&y>=upperTarget?upperSource+Math.floor((y-upperTarget)*(sh-upperSource)/(dh-upperTarget)):Math.floor(y*sh/dh);
   let sum=0,count=0;
   for(let y=c.minY+Math.floor(sh*.12);y<c.minY+sh*.38;y++)for(let x=c.minX;x<=c.maxX;x++){
    const i=y*png.width+x,j=i*4,[r,g,b]=png.data.subarray(j,j+3);
    if(labels[i]===c.id&&r>175&&g>95&&g<215&&r>g*1.08&&b>g*.55&&b<g*1.12){sum+=x;count++;}
   }
   const head=count?sum/count:c.minX+sw*.62;
   const ox=Math.max(1,Math.min(cw-dw-1,Math.round((cw===96?56:40)-(head-c.minX)*scale))),oy=63-dh;
   if(dw>cw-2||oy<1)throw new Error('Frame clipping '+outfit+' '+row+' '+col);
   const frame=new PNG({width:cw,height:64});
   for(let y=0;y<dh;y++)for(let x=0;x<dw;x++){
    const i=(c.minY+Math.min(sh-1,sourceY(y)))*png.width+c.minX+Math.min(sw-1,Math.floor(x/scale));
    if(labels[i]===c.id)png.data.copy(frame.data,((oy+y)*cw+ox+x)*4,i*4,i*4+4);
   }
   const file=outfit+'-'+manifest.ages[row]+'-'+manifest.columns[col]+'.png';write(file,frame);
   if(col===0)for(let i=0;i<3;i++)PNG.bitblt(frame,poses,0,0,64,64,i*64,row*64);
   else if(col===7)PNG.bitblt(frame,poses,0,0,64,64,192,row*64);
   else if(isWalk)PNG.bitblt(frame,walk,0,0,96,64,(col-1)*96,row*64);
   else PNG.bitblt(frame,attack,0,0,96,64,(col-8)*96,row*64);
   records.push({age:manifest.ages[row],pose:manifest.columns[col],file,height:dh,sourceBounds:{x:c.minX,y:c.minY,w:sw,h:sh}});
  }
 }
 write(outfit+'-atlas.png',poses);write(outfit+'-walk-atlas.png',walk);write(outfit+'-attacks.png',attack);manifest.outfits[outfit]=records;
}
writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));console.log('Packed30 diving poses into3 runtime atlases.');


