import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(new URL('../../package.json',import.meta.url));
const {PNG}=require('pngjs');
const out=path.join(root,'assets','sprites-v2');
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
const manifest={cellWidth:64,cellHeight:64,worldWidth:32,worldHeight:32,anchor:{x:32,y:63},
 poses:['idle','run-a','run-b','jump'],rows:['adult','teenage','baby'],outfits:{},source:'built-in image generation + transparent component slicing / nearest-neighbor export'};
for(const outfit of ['captain','egghead']){
 const png=PNG.sync.read(readFileSync(path.join(out,outfit+'-source.png')));
 const {parts,labels}=components(png);
 console.log(outfit,parts.map(c=>({x:c.minX,y:c.minY,w:c.maxX-c.minX+1,h:c.maxY-c.minY+1,pixels:c.count})));
 if(parts.length!==12)throw new Error('Expected 12 isolated poses; got '+parts.length+' for '+outfit);
 const sheet=new PNG({width:256,height:192});
 const records=[];
 for(let row=0;row<3;row++){
  const rowParts=parts.filter(c=>(c.minY<400?0:c.minY<800?1:2)===row).sort((a,b)=>a.minX-b.minX);
  if(rowParts.length!==4)throw new Error('Unexpected row layout');
  const idle=rowParts[0],target=[60,50,36][row];
  const scale=target/(idle.maxY-idle.minY+1);
  for(let col=0;col<4;col++){
   const c=rowParts[col],sw=c.maxX-c.minX+1,sh=c.maxY-c.minY+1;
   const dw=Math.round(sw*scale),dh=Math.round(sh*scale);
   if(dw>62||dh>62)throw new Error('Pose does not fit a 64px cell');
   const frame=new PNG({width:64,height:64});
   // Use a common physical scale for every pose in an age row.
   const ox=Math.floor((64-dw)/2),oy=63-dh;
   for(let y=0;y<dh;y++)for(let x=0;x<dw;x++){
    const sx=c.minX+Math.min(sw-1,Math.floor(x/scale));
    const sy=c.minY+Math.min(sh-1,Math.floor(y/scale));
    const source=sy*png.width+sx;
    if(labels[source]!==c.id)continue;
    png.data.copy(frame.data,( (oy+y)*64+ox+x)*4,source*4,source*4+4);
   }
   const age=manifest.rows[row],pose=manifest.poses[col],name=outfit+'-'+age+'-'+pose+'.png';
   write(name,frame);
   PNG.bitblt(frame,sheet,0,0,64,64,col*64,row*64);
   records.push({age,pose,file:name,sourceBounds:{x:c.minX,y:c.minY,width:sw,height:sh},
    frame:{x:col*64,y:row*64,width:64,height:64},scale});
  }
 }
 write(outfit+'-atlas.png',sheet);manifest.outfits[outfit]={file:outfit+'-atlas.png',frames:records};
}
writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));
console.log('Exported 24 transparent 64x64 frames and two aligned atlases.');
