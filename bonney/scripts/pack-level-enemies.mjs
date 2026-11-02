import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(new URL('../../package.json',import.meta.url));
const {PNG}=require('pngjs');
const out=path.join(root,'assets','level-v1');
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
const png=PNG.sync.read(readFileSync(path.join(out,'enemies-source.png')));
const {parts,labels}=components(png);
if(parts.length!==12){console.log(parts);throw new Error('Expected twelve enemy poses');}
const sorted=parts.sort((a,b)=>a.minY-b.minY),sheet=new PNG({width:384,height:192});
for(let row=0;row<3;row++){
 const group=sorted.slice(row*4,row*4+4).sort((a,b)=>a.minX-b.minX);
 const scale=(row===2?32:44)/Math.max(...group.map(c=>c.maxY-c.minY+1));
 for(let col=0;col<4;col++){
  const c=group[col],sw=c.maxX-c.minX+1,sh=c.maxY-c.minY+1,w=Math.round(sw*scale),h=Math.round(sh*scale);
  const f=new PNG({width:96,height:64}),ox=Math.floor((96-w)/2),oy=62-h;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=(c.minY+Math.min(sh-1,Math.floor(y/scale)))*png.width+c.minX+Math.min(sw-1,Math.floor(x/scale));
   if(labels[i]===c.id)png.data.copy(f.data,((oy+y)*96+ox+x)*4,i*4,i*4+4);
  }
  PNG.bitblt(f,sheet,0,0,96,64,col*96,row*64);
 }
}
write('enemies-atlas.png',sheet);console.log('Packed lookout, shield and gull poses.');
