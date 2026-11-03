import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const require=createRequire(new URL('../../package.json',import.meta.url)),{PNG}=require('pngjs');
const out=new URL('../assets/scene-followup-v1/',import.meta.url);mkdirSync(out,{recursive:true});
for(const [name,w,h]of [['gantry-clean',384,204],['tall-sky',1296,864]]){
 const src=PNG.sync.read(readFileSync(new URL(name+'-source.png',out))),dst=new PNG({width:w,height:h});
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const si=(Math.floor(y*src.height/h)*src.width+Math.floor(x*src.width/w))*4;
  src.data.copy(dst.data,(y*w+x)*4,si,si+4);
 }writeFileSync(new URL(name+'.png',out),PNG.sync.write(dst));
}
console.log('Packed clean gantry and tall sky.');
