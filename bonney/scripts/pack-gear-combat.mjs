import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(new URL('../../package.json',import.meta.url));
const {PNG}=require('pngjs');
const out=path.join(root,'assets','gear-combat-v1');
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

const manifest={ages:['adult','teenage','baby'],gearFrames:[],meleeFrames:[]};
function pack(source,columns,consume){
 const png=PNG.sync.read(readFileSync(path.join(out,source))),{parts,labels}=components(png);
 if(source==='gear-source.png')for(const c of [...parts])if(c.maxX-c.minX>230){
  // Two adult stride boots touch in the generated sheet. Separate along their gutter.
  const split=[0,1].map((_,i)=>({id:9000+i,minX:png.width,minY:png.height,maxX:0,maxY:0,count:0}));
  for(let y=c.minY;y<=c.maxY;y++)for(let x=c.minX;x<=c.maxX;x++){
   const pixel=y*png.width+x;if(labels[pixel]!==c.id)continue;
   const side=x<(y>250?345:320)?0:1,n=split[side];labels[pixel]=n.id;n.count++;
   n.minX=Math.min(n.minX,x);n.minY=Math.min(n.minY,y);n.maxX=Math.max(n.maxX,x);n.maxY=Math.max(n.maxY,y);
  }
  parts.splice(parts.indexOf(c),1,...split);
 }
 console.log(source,parts.map(c=>({x:c.minX,y:c.minY,w:c.maxX-c.minX+1,h:c.maxY-c.minY+1})));
 if(parts.length!==columns*3)throw new Error('Expected '+columns*3+' poses, got '+parts.length);
 const sorted=parts.sort((a,b)=>a.minY-b.minY);
 for(let row=0;row<3;row++){
  const group=sorted.slice(row*columns,(row+1)*columns).sort((a,b)=>a.minX-b.minX);
  for(let col=0;col<columns;col++){
   const c=group[col],sw=c.maxX-c.minX+1,sh=c.maxY-c.minY+1,scale=[60,50,36][row]/(source==='gear-source.png'?group[0].maxY-group[0].minY+1:sh);
   const cw=source==='gear-source.png'&&(col===0||col===7)?64:96;
   const gearWalk=source==='gear-source.png'&&col>=1&&col<=6;
   const dw=Math.round(sw*scale),dh=gearWalk?[60,50,36][row]:Math.round(sh*scale);let sum=0,count=0;
   // Preserve head/torso pixel scale; correct compressed stride legs below the hips.
   const upperSource=Math.floor(sh*.60),upperTarget=Math.round(upperSource*scale);
   const sourceY=y=>gearWalk&&y>=upperTarget
    ?upperSource+Math.floor((y-upperTarget)*(sh-upperSource)/(dh-upperTarget))
    :Math.floor(y/scale);
   for(let y=c.minY+Math.floor(sh*.18);y<c.minY+sh*.45;y++)for(let x=c.minX;x<=c.maxX;x++){
    const i=y*png.width+x,j=i*4,[r,g,b]=png.data.subarray(j,j+3);
    if(labels[i]===c.id&&r>175&&g>90&&g<215&&r>g*1.1&&b<g*1.15){sum+=x;count++;}
   }
   const head=count?sum/count:c.minX+sw*.6;
   const ox=Math.max(1,Math.min(cw-dw-1,Math.round((cw===96?56:40)-(head-c.minX)*scale))),oy=63-dh;
   if(dw>cw-2)throw new Error('Pose exceeds cell');
   const frame=new PNG({width:cw,height:64});
   for(let y=0;y<dh;y++)for(let x=0;x<dw;x++){
    const i=(c.minY+Math.min(sh-1,sourceY(y)))*png.width+c.minX+Math.min(sw-1,Math.floor(x/scale));
    if(labels[i]===c.id)png.data.copy(frame.data,((oy+y)*cw+ox+x)*4,i*4,i*4+4);
   }
   consume(frame,row,col,{age:manifest.ages[row],column:col,height:dh,sourceBounds:{x:c.minX,y:c.minY,w:sw,h:sh}});
  }
 }
}
const poses=new PNG({width:256,height:192}),walk=new PNG({width:576,height:192}),gearAttack=new PNG({width:192,height:192});
pack('gear-source.png',10,(frame,row,col,record)=>{
 const name='gear-'+manifest.ages[row]+'-'+col+'.png';write(name,frame);manifest.gearFrames.push({...record,file:name});
 if(col===0)for(let c=0;c<3;c++)PNG.bitblt(frame,poses,0,0,64,64,c*64,row*64);
 else if(col===7)PNG.bitblt(frame,poses,0,0,64,64,192,row*64);
 else if(col<7)PNG.bitblt(frame,walk,0,0,96,64,(col-1)*96,row*64);
 else PNG.bitblt(frame,gearAttack,0,0,96,64,(col-8)*96,row*64);
});
write('gear-atlas.png',poses);write('gear-walk-atlas.png',walk);write('gear-attacks.png',gearAttack);
const attacks=Array.from({length:3},()=>new PNG({width:192,height:192}));
pack('melee-source.png',6,(frame,row,col,record)=>{
 const outfit=['default','captain','egghead'][Math.floor(col/2)],name=outfit+'-'+manifest.ages[row]+'-'+(col%2?'kick':'punch')+'.png';
 write(name,frame);manifest.meleeFrames.push({...record,outfit,file:name});PNG.bitblt(frame,attacks[Math.floor(col/2)],0,0,96,64,(col%2)*96,row*64);
});
for(let i=0;i<3;i++)write(['default','captain','egghead'][i]+'-attacks.png',attacks[i]);
writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));console.log('Packed 30 Gear and 18 melee poses.');
