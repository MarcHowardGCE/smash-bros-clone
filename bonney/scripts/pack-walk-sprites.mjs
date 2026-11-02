import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(new URL('../../package.json',import.meta.url));
const {PNG}=require('pngjs');
const out=path.join(root,'assets','walk-v3');
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
const manifest={cellWidth:96,cellHeight:64,columns:6,rows:['adult','teenage','baby'],anchor:{x:56,y:63},outfits:{}};
for(const outfit of ['captain','egghead']){
 const png=PNG.sync.read(readFileSync(path.join(out,outfit+'-source.png')));
 const {parts,labels}=components(png);
 for(const c of [...parts])if(c.maxY-c.minY>450){
  const cut=outfit==='captain'?671:711,newId=100000+c.id;
  const bottom={id:newId,minX:png.width,minY:png.height,maxX:0,maxY:0,count:0};
  const maxY=c.maxY;c.maxY=cut-1;
  for(let y=cut;y<=maxY;y++)for(let x=c.minX;x<=c.maxX;x++){const i=y*png.width+x;if(labels[i]===c.id){labels[i]=newId;bottom.count++;c.count--;bottom.minX=Math.min(bottom.minX,x);bottom.minY=Math.min(bottom.minY,y);bottom.maxX=Math.max(bottom.maxX,x);bottom.maxY=Math.max(bottom.maxY,y);}}
  if(bottom.count>2500)parts.push(bottom);
 }
 console.log(outfit,parts.map(c=>({x:c.minX,y:c.minY,w:c.maxX-c.minX+1,h:c.maxY-c.minY+1,count:c.count})));
 if(parts.length!==18)throw new Error('Expected 18 isolated sprites, got '+parts.length+' for '+outfit);
 const sorted=parts.sort((a,b)=>a.minY-b.minY),atlas=new PNG({width:576,height:192}),records=[];
 for(let row=0;row<3;row++){
  const group=sorted.slice(row*6,row*6+6).sort((a,b)=>a.minX-b.minX);
  for(const c of group){
   let sum=0,count=0;
   const h=c.maxY-c.minY+1;
   for(let y=c.minY+Math.floor(h*.12);y<c.minY+h*.38;y++)for(let x=c.minX;x<=c.maxX;x++){
    const i=y*png.width+x,j=i*4,[r,g,b]=png.data.subarray(j,j+3);
    if(labels[i]===c.id&&r>175&&g>95&&g<210&&r>g*1.15&&b<g*1.15){sum+=x;count++;}
   }
   c.faceX=count?sum/count:c.minX+(c.maxX-c.minX)*.65;
  }
  let scale=[60,50,36][row]/Math.max(...group.map(c=>c.maxY-c.minY+1));
  // Wide stride frames get horizontal padding instead of shrinking the character.
  for(let col=0;col<6;col++){
   const c=group[col],sw=c.maxX-c.minX+1,sh=c.maxY-c.minY+1;
   const dw=Math.round(sw*scale),dh=Math.round(sh*scale);
   const ox=Math.round(56-(c.faceX-c.minX)*scale),oy=63-dh;
   if(ox<1||ox+dw>95||oy<1)throw new Error('Frame clipping');
   const frame=new PNG({width:96,height:64});
   for(let y=0;y<dh;y++)for(let x=0;x<dw;x++){
    const sx=c.minX+Math.min(sw-1,Math.floor(x/scale)),sy=c.minY+Math.min(sh-1,Math.floor(y/scale)),source=sy*png.width+sx;
    if(labels[source]===c.id)png.data.copy(frame.data,((oy+y)*96+ox+x)*4,source*4,source*4+4);
   }
   const name=outfit+'-'+manifest.rows[row]+'-walk-'+col+'.png';
   write(name,frame);PNG.bitblt(frame,atlas,0,0,96,64,col*96,row*64);
   records.push({age:manifest.rows[row],column:col,file:name,scale,faceX:c.faceX,sourceBounds:{x:c.minX,y:c.minY,w:sw,h:sh}});
  }
 }
 write(outfit+'-walk-atlas.png',atlas);manifest.outfits[outfit]=records;
 console.log('Packed '+outfit+': 18 aligned stride frames.');
}
writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));
