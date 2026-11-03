import fs from 'node:fs';
let s=fs.readFileSync('scripts/pack-luffy.mjs','utf8').split('const manifest=')[0].replace("const out=path.join(root,'assets','luffy-v1');","const out=path.join(root,'assets','underwater-full-v1');");
s+=`const manifest={};
for(const [source,names,rows,columns]of [
 ['buildings',['ruin','habitat','wreck'],1,3],
 ['props',['valve','gate','vent','pearl','console','bell','chest','kelp','reef-block','reef-ledge','metal-block','catwalk'],3,4],
 ['enemies',['jelly-0','jelly-1','jelly-2','jelly-3','sub-0','sub-1','sub-2','sub-3'],2,4]
]){
 const png=PNG.sync.read(readFileSync(path.join(out,source+'-source.png'))),{parts,labels}=components(png);
 if(parts.length!==names.length)throw Error(source+' expected '+names.length+' isolated components, got '+parts.length);
 const byY=parts.sort((a,b)=>(a.minY+a.maxY)/2-(b.minY+b.maxY)/2),ordered=[];
 for(let row=0;row<rows;row++)ordered.push(...byY.slice(row*columns,(row+1)*columns).sort((a,b)=>a.minX-b.minX));
 ordered.forEach((c,i)=>{const sw=c.maxX-c.minX+1,sh=c.maxY-c.minY+1,scale=Math.min(1,(source==='buildings'?512:source==='props'?192:96)/Math.max(sw,sh)),w=Math.round(sw*scale),h=Math.round(sh*scale),dst=new PNG({width:w,height:h});
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const pos=(c.minY+Math.min(sh-1,Math.floor(y/scale)))*png.width+c.minX+Math.min(sw-1,Math.floor(x/scale));if(labels[pos]===c.id)png.data.copy(dst.data,(y*w+x)*4,pos*4,pos*4+4);}
 write(names[i]+'.png',dst);manifest[names[i]]={w,h,source,bounds:c};});
}writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));console.log('Packed23 underwater assets.');`;
fs.writeFileSync('scripts/pack-underwater-full.mjs',s);
