import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(new URL('../../package.json',import.meta.url));
const {PNG}=require('pngjs');
const out=path.join(root,'assets','cloud-full-v1');
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

function extract(source,count){const png=PNG.sync.read(readFileSync(path.join(out,source)));const {parts,labels}=components(png);return {png,labels,parts:parts.sort((a,b)=>b.count-a.count).slice(0,count).sort((a,b)=>a.minY-b.minY)};}
function frame(png,labels,c,w,h){
 const dst=new PNG({width:w,height:h}),sw=c.maxX-c.minX+1,sh=c.maxY-c.minY+1;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(c.minY+Math.min(sh-1,Math.floor(y*sh/h)))*png.width+c.minX+Math.min(sw-1,Math.floor(x*sw/w));
  if(labels[i]===c.id)png.data.copy(dst.data,(y*w+x)*4,i*4,i*4+4);
 }return dst;
}
{
 const {png,labels,parts}=extract('buildings-source.png',3);if(parts.length!==3)throw new Error('Expected three buildings');
 for(let i=0;i<3;i++){const c=parts[i];write(['habitat','reactor','observatory'][i]+'.png',frame(png,labels,c,512,Math.round(512*(c.maxY-c.minY+1)/(c.maxX-c.minX+1))));}
}
{
 const {png,labels,parts}=extract('props-source.png',6);if(parts.length!==6)throw new Error('Expected six props');
 for(let row=0;row<2;row++){
  const group=parts.slice(row*3,row*3+3).sort((a,b)=>a.minX-b.minX);
  for(let col=0;col<3;col++){const c=group[col],sw=c.maxX-c.minX+1,sh=c.maxY-c.minY+1,scale=256/Math.max(sw,sh);write(['console','casing','fan','flag','pylon','snack'][row*3+col]+'.png',frame(png,labels,c,Math.round(sw*scale),Math.round(sh*scale)));}
 }
}
{
 const {png,labels,parts}=extract('enemies-source.png',12);if(parts.length!==12)throw new Error('Expected twelve enemy frames');
 const atlas=new PNG({width:384,height:192});
 for(let row=0;row<3;row++){
  const group=parts.slice(row*4,row*4+4).sort((a,b)=>a.minX-b.minX),scale=Math.min((row===1?40:62)/Math.max(...group.map(c=>c.maxY-c.minY+1)),94/Math.max(...group.map(c=>c.maxX-c.minX+1)));
  for(let col=0;col<4;col++){
   const c=group[col],w=Math.round((c.maxX-c.minX+1)*scale),h=Math.round((c.maxY-c.minY+1)*scale);
   if(w>94||h>63)throw new Error('Enemy clipping');
   const sprite=frame(png,labels,c,w,h);PNG.bitblt(sprite,atlas,0,0,w,h,col*96+Math.floor((96-w)/2),row*64+63-h);
  }
 }write('enemies-atlas.png',atlas);
}
console.log('Packed 3 buildings, 6 props and 12 alternate enemy poses.');
