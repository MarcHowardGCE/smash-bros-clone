import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(new URL('../../package.json',import.meta.url));
const {PNG}=require('pngjs');
const out=path.join(root,'assets','world-v7');
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
function resize(png,w,h){
 const result=new PNG({width:w,height:h});
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(Math.min(png.height-1,Math.floor(y*png.height/h))*png.width+Math.min(png.width-1,Math.floor(x*png.width/w)))*4;
  png.data.copy(result.data,(y*w+x)*4,i,i+4);
 }return result;
}
function isolate(png,labels,c,size,target){
 const result=new PNG({width:size,height:size}),sw=c.maxX-c.minX+1,sh=c.maxY-c.minY+1;
 const scale=target/Math.max(sw,sh),w=Math.round(sw*scale),h=Math.round(sh*scale),ox=Math.floor((size-w)/2),oy=size-2-h;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const sx=c.minX+Math.min(sw-1,Math.floor(x/scale)),sy=c.minY+Math.min(sh-1,Math.floor(y/scale)),i=sy*png.width+sx;
  if(labels[i]===c.id)png.data.copy(result.data,((oy+y)*size+ox+x)*4,i*4,i*4+4);
 }return result;
}
const bg=PNG.sync.read(readFileSync(path.join(out,'harbor-source.png')));
write('harbor-background.png',resize(bg,1296,432));
const props=PNG.sync.read(readFileSync(path.join(out,'props-source.png')));
const propParts=components(props);
if(propParts.parts.length!==12){console.log(propParts.parts);throw new Error('Expected 12 props, got '+propParts.parts.length);}
const names=['crate','barrel','rope','lantern','boots','hat','coin','sign','goal','checkpoint','cannon','impact'];
const byY=propParts.parts.sort((a,b)=>a.minY-b.minY),items={};
for(let row=0;row<3;row++){
 const group=byY.slice(row*4,row*4+4).sort((a,b)=>a.minX-b.minX);
 for(let col=0;col<4;col++){
  const name=names[row*4+col],frame=isolate(props,propParts.labels,group[col],64,60);
  items[name]=frame;write(name+'.png',frame);
 }
}
const enemy=PNG.sync.read(readFileSync(path.join(out,'guard-source.png')));
const enemyParts=components(enemy);
if(enemyParts.parts.length!==4)throw new Error('Expected four guard poses');
const guards=new PNG({width:256,height:64});
const group=enemyParts.parts.sort((a,b)=>a.minX-b.minX);
const common=44/Math.max(...group.map(c=>c.maxY-c.minY+1));
for(let col=0;col<4;col++){
 const c=group[col],h=c.maxY-c.minY+1,w=c.maxX-c.minX+1,frame=new PNG({width:64,height:64});
 const dw=Math.round(w*common),dh=Math.round(h*common),ox=Math.floor((64-dw)/2),oy=62-dh;
 for(let y=0;y<dh;y++)for(let x=0;x<dw;x++){
  const source=(c.minY+Math.min(h-1,Math.floor(y/common)))*enemy.width+c.minX+Math.min(w-1,Math.floor(x/common));
  if(enemyParts.labels[source]===c.id)enemy.data.copy(frame.data,((oy+y)*64+ox+x)*4,source*4,source*4+4);
 }
 PNG.bitblt(frame,guards,0,0,64,64,col*64,0);
}
write('guard-atlas.png',guards);
// Native terrain assets are generated on the 32px backing grid, twice world tile resolution.
const tiles=new PNG({width:256,height:32});
function pixel(p,x,y,color){
 if(x<0||y<0||x>=p.width||y>=p.height)return;
 const v=parseInt(color.slice(1),16),i=(y*p.width+x)*4;
 p.data[i]=v>>16;p.data[i+1]=(v>>8)&255;p.data[i+2]=v&255;p.data[i+3]=255;
}
function box(p,x,y,w,h,c){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)pixel(p,i,j,c);}
function noise(p,x,y,w,h,colors,seed){
 for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++){
  const n=((i*73856093)^(j*19349663)^seed)>>>0;
  if(n%9<2)pixel(p,i,j,colors[n%colors.length]);
 }
}
for(let t=0;t<4;t++){
 const p=new PNG({width:32,height:32});
 if(t===0||t===1){
  box(p,0,0,32,32,'#293b4a');
  for(let r=0;r<2;r++)for(let b=-1;b<3;b++){
   const x=b*18+(r%2)*9,y=r*16;
   box(p,x+1,y+1,16,14,'#6d7b80');box(p,x+2,y+2,14,2,'#a6afb0');
   box(p,x+2,y+4,14,9,'#819095');box(p,x+2,y+13,14,1,'#435b67');
   noise(p,x+2,y+5,14,7,['#72848c','#96a1a0','#627782'],t+8);
  }
  if(t===0){
   box(p,0,0,32,6,'#c8b58d');box(p,0,0,32,1,'#fff1c7');
   box(p,0,1,32,2,'#e7d5aa');box(p,0,6,32,2,'#43535a');
   box(p,15,1,1,4,'#9c8e78');noise(p,0,3,32,2,['#e5cda1','#b4a185'],14);
   box(p,3,8,5,1,'#456754');box(p,5,9,2,2,'#647852');
  }
 }else if(t===2){
  box(p,0,0,32,16,'#30283a');
  box(p,0,1,32,2,'#e4bd7a');box(p,0,3,32,6,'#ad7745');
  box(p,0,9,32,3,'#6f4734');box(p,0,12,32,2,'#3e3540');
  for(const x of [0,15,30]){
   box(p,x,3,1,7,'#5f4032');box(p,x+2,4,1,1,'#fff0bf');box(p,x+2,8,1,1,'#362d34');
  }
  noise(p,0,5,32,3,['#c39054','#8d5d3c'],92);
 }else{
  box(p,0,5,32,27,'#167e9e');box(p,0,8,32,24,'#2295ae');
  box(p,0,6,8,2,'#d0f7e7');box(p,8,8,9,2,'#8ee5dc');box(p,17,6,9,2,'#d0f7e7');
  for(let y=12;y<32;y+=5)for(let x=(y%3)*4;x<32;x+=14)box(p,x,y,8,1,y%2?'#4bc6ca':'#207f9f');
 }
 PNG.bitblt(p,tiles,0,0,32,32,t*32,0);
}
for(const [n,name]of [[4,'crate'],[5,'barrel'],[6,'coin'],[7,'boots']])
 PNG.bitblt(resize(items[name],32,32),tiles,0,0,32,32,n*32,0);
write('terrain-atlas.png',tiles);
// Richer native effect sprites, kept separate from art sources.
const jet=new PNG({width:32,height:32});
for(let y=0;y<29;y++){
 const half=Math.max(1,Math.round((29-y)/4));
 box(jet,16-half,y,half*2,1,y<8?'#f8ffff':y<17?'#ffdf83':'#f8a84f');
 if(y<23)box(jet,15-Math.floor(half/2),y,Math.max(1,half),1,'#fff8d8');
 if(y<10){pixel(jet,11-half,y,'#bf8ee5');pixel(jet,20+half,y,'#bf8ee5');}
}
write('flight-exhaust.png',jet);
const trail=new PNG({width:64,height:32});
for(let i=0;i<5;i++){const x=i*8;box(trail,x,14-(i%2)*5,58-x,2,i%2?'#f6c2ea':'#fff0c9');}
write('charge-trail.png',trail);
writeFileSync(path.join(out,'manifest.json'),JSON.stringify({background:[1296,432],terrain:{tileSize:32,worldSize:16,columns:8},
 guard:{cellSize:64,frames:4,visibleHeight:44},props:names,effects:['flight-exhaust','charge-trail']},null,2));
console.log('Exported scenery, four guard frames, 12 props, terrain and effects.');
