import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(new URL('../../package.json',import.meta.url));
const {PNG}=require('pngjs');
const out=path.join(root,'assets','cloud-discovery-v1');
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

const png=PNG.sync.read(readFileSync(path.join(out,'source.png'))),{parts,labels}=components(png);
console.log(parts.map(c=>({x:c.minX,y:c.minY,w:c.maxX-c.minX+1,h:c.maxY-c.minY+1,count:c.count})));
const lab=parts.filter(c=>c.minY<png.height*.58);
const cloud=parts.filter(c=>c.minY>png.height*.58).sort((a,b)=>b.count-a.count).slice(0,1);
if(!lab.length||!cloud.length)throw new Error('Expected laboratory and cloud components');
for(const [name,group]of [['laboratory',lab],['cloud-island',cloud]]){
 const ids=new Set(group.map(c=>c.id)),x0=Math.min(...group.map(c=>c.minX)),y0=Math.min(...group.map(c=>c.minY)),x1=Math.max(...group.map(c=>c.maxX)),y1=Math.max(...group.map(c=>c.maxY));
 const sw=x1-x0+1,sh=y1-y0+1,w=768,h=Math.round(sh*w/sw),dst=new PNG({width:w,height:h});
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y0+Math.min(sh-1,Math.floor(y*sh/h)))*png.width+x0+Math.min(sw-1,Math.floor(x*sw/w));
  if(ids.has(labels[i]))png.data.copy(dst.data,(y*w+x)*4,i*4,i*4+4);
 }write(name+'.png',dst);
}
console.log('Packed cloud island and futuristic laboratory.');
