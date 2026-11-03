import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(new URL('../../package.json',import.meta.url));
const {PNG}=require('pngjs');
const out=path.join(root,'assets','flight-v1');
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

const anchors={};
const bonneyIdle=PNG.sync.read(readFileSync(path.join(root,'assets/sprites-v2/egghead-atlas.png')));
function visibleStats(png,x0,y0,width){let left=width,right=-1,area=0;for(let y=0;y<64;y++)for(let x=0;x<width;x++)if(png.data[((y0+y)*png.width+x0+x)*4+3]>128){left=Math.min(left,x);right=Math.max(right,x);area++;}return {width:right-left+1,area};}

function feet(frame,paired=false){
 const runs=[];let start=-1;
 for(let x=0;x<=frame.width;x++){
  let occupied=false;
  if(x<frame.width)for(let y=60;y<64;y++)if(frame.data[(y*frame.width+x)*4+3]>=200)occupied=true;
  if(occupied&&start<0)start=x;
  if(!occupied&&start>=0){if(x-start>=2)runs.push({left:start,right:x-1});start=-1;}
 }
 if(paired&&runs.length===1&&runs[0].right-runs[0].left>=4){const r=runs.pop(),middle=Math.floor((r.left+r.right)/2);runs.push({left:r.left,right:middle},{left:middle+1,right:r.right});}
 return runs.sort((a,b)=>(b.right-b.left)-(a.right-a.left)).slice(0,2).sort((a,b)=>a.left-b.left).map(r=>{
  let bottom=0;for(let y=60;y<64;y++)for(let x=r.left;x<=r.right;x++)if(frame.data[(y*frame.width+x)*4+3]>=200)bottom=Math.max(bottom,y);
  return {x:(r.left+r.right)/2,y:bottom+1};
 });
}
for(const name of ['bonney','luffy']){
 const png=PNG.sync.read(readFileSync(path.join(out,name+'-source.png'))),{parts,labels}=components(png);
 console.log(name,parts.map(c=>({x:c.minX,y:c.minY,w:c.maxX-c.minX+1,h:c.maxY-c.minY+1,count:c.count})));
 if(parts.length!==12)throw new Error('Expected12 '+name+' flight frames, got '+parts.length);
 const sorted=parts.sort((a,b)=>a.minY-b.minY),atlas=new PNG({width:384,height:192});anchors[name]={flight:[],attack:[]};
 for(let row=0;row<3;row++){
  const group=sorted.slice(row*4,row*4+4).sort((a,b)=>a.minX-b.minX),target=[60,50,36][row],scale=target/(group[0].maxY-group[0].minY+1);anchors[name].flight[row]=[];
  const reference=visibleStats(bonneyIdle,0,row*64,64);
  const density=Math.min(...group.map(c=>c.count/((c.maxX-c.minX+1)*(c.maxY-c.minY+1))));
  const bonneyWidth=Math.max(reference.width,Math.ceil(reference.area*.90/(target*density)));
  for(let col=0;col<4;col++){
   const c=group[col],sw=c.maxX-c.minX+1,sh=c.maxY-c.minY+1,w=name==='bonney'?bonneyWidth:Math.round(sw*scale),h=target,frame=new PNG({width:96,height:64});
   let sum=0,count=0;
   for(let y=c.minY+Math.floor(sh*.08);y<c.minY+sh*.33;y++)for(let x=c.minX;x<=c.maxX;x++){
    const i=y*png.width+x,j=i*4,[r,g,b]=png.data.subarray(j,j+3);if(labels[i]===c.id&&r>175&&g>95&&g<215&&r>g*1.08&&b>g*.55&&b<g*1.12){sum+=x;count++;}
   }
   const face=count?sum/count:c.minX+sw*.65,ox=Math.max(1,Math.min(95-w,Math.round(56-(face-c.minX)*w/sw))),oy=63-h;
   if(w>94)throw new Error('Flight frame clipping');
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=(c.minY+Math.min(sh-1,Math.floor(y*sh/h)))*png.width+c.minX+Math.min(sw-1,Math.floor(x*sw/w));
    if(labels[i]===c.id)png.data.copy(frame.data,((oy+y)*96+ox+x)*4,i*4,i*4+4);
   }
   const nozzles=feet(frame,true);if(nozzles.length!==2)throw new Error('Flight needs two separated boot soles: '+name+' '+row+' '+col+' '+JSON.stringify(nozzles));
   anchors[name].flight[row][col]=nozzles;write(name+'-'+['adult','teenage','baby'][row]+'-'+col+'.png',frame);PNG.bitblt(frame,atlas,0,0,96,64,col*96,row*64);
  }
  const attackPath=name==='luffy'?'assets/luffy-v1/egghead-attacks.png':'assets/gear-combat-v1/egghead-attacks.png';
  const attack=PNG.sync.read(readFileSync(path.join(root,attackPath)));anchors[name].attack[row]=[];
  for(let col=0;col<2;col++){const frame=new PNG({width:96,height:64});PNG.bitblt(attack,frame,col*96,row*64,96,64,0,0);anchors[name].attack[row][col]=feet(frame,col===0);}
 }
 write(name+'-flight-atlas.png',atlas);
}
{
 const png=PNG.sync.read(readFileSync(path.join(out,'thrusters-source.png')));
 for(let i=0;i<png.data.length;i+=4)if(png.data[i+3]<180||png.data[i]+png.data[i+1]+png.data[i+2]<320)png.data[i+3]=0;
 const {parts:allParts,labels}=components(png),parts=allParts.sort((a,b)=>b.count-a.count).slice(0,12);
 console.log('thrusters',parts.map(c=>({x:c.minX,y:c.minY,w:c.maxX-c.minX+1,h:c.maxY-c.minY+1,count:c.count})));
 if(parts.length!==12)throw new Error('Expected12 thrusters, got '+parts.length);
 const sorted=parts.sort((a,b)=>a.minY-b.minY),atlas=new PNG({width:192,height:128});
 for(let row=0;row<2;row++){
  const group=sorted.slice(row*6,row*6+6).sort((a,b)=>a.minX-b.minX);
  for(let col=0;col<6;col++){
   const c=group[col],sw=c.maxX-c.minX+1,sh=c.maxY-c.minY+1,w=28,h=60;
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=(c.minY+Math.min(sh-1,Math.floor(y*sh/h)))*png.width+c.minX+Math.min(sw-1,Math.floor(x*sw/w));
    if(labels[i]===c.id)png.data.copy(atlas.data,(((row*64+y)*192)+col*32+2+x)*4,i*4,i*4+4);
   }
  }
 }write('thrusters-atlas.png',atlas);
}
writeFileSync(path.join(out,'manifest.json'),JSON.stringify({cell:{width:96,height:64},frames:4,ages:['adult','teenage','baby'],anchors},null,2));
writeFileSync(path.join(root,'src','flight-anchors.mjs'),'// Generated by scripts/pack-flight.mjs from exported boot sole pixels.\nexport const FLIGHT_ANCHORS='+JSON.stringify(anchors)+';\n');
console.log('Packed24 hover poses,12 thruster frames and measured boot anchors.');

const comparison=new PNG({width:768,height:384});
for(let row=0;row<3;row++)for(let col=0;col<4;col++){
 const hero=col<2?'bonney':'luffy',flying=col%2===1;
 const file=flying?path.join(out,hero+'-flight-atlas.png'):path.join(root,hero==='bonney'?'assets/sprites-v2/egghead-atlas.png':'assets/luffy-v1/egghead-atlas.png');
 const src=PNG.sync.read(readFileSync(file)),cw=flying?96:64,pad=flying?0:32;
 for(let y=0;y<128;y++)for(let x=0;x<cw*2;x++){
  const si=((row*64+Math.floor(y/2))*src.width+Math.floor(x/2))*4,di=((row*128+y)*768+col*192+pad+x)*4;src.data.copy(comparison.data,di,si,si+4);
 }
}write('age-comparison.png',comparison);
