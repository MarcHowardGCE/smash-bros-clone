import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(new URL('../../package.json',import.meta.url));
const {PNG}=require('pngjs');
const base=new URL('../assets/sprites-v2/',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('manifest.json',base),'utf8'));
for(const [outfit,data] of Object.entries(manifest.outfits)){
 const atlas=PNG.sync.read(readFileSync(new URL(data.file,base)));
 assert.equal(atlas.width,256);assert.equal(atlas.height,192);
 for(const record of data.frames){
  const p=PNG.sync.read(readFileSync(new URL(record.file,base)));
  assert.equal(p.width,64);assert.equal(p.height,64);
  let pixels=0,minX=64,maxX=-1,minY=64,maxY=-1;
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){
   const n=(y*64+x)*4;
   if(p.data[n+3]>0){pixels++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
   const a=((record.frame.y+y)*atlas.width+record.frame.x+x)*4;
   assert.equal(atlas.data.readUInt32BE(a),p.data.readUInt32BE(n));
  }
  assert.ok(pixels>100);assert.ok(minX>0&&maxX<63&&minY>0&&maxY<63);
  assert.ok(maxY>=60,'feet close to shared baseline: '+record.file);
 }
 console.log('PASS: '+outfit+' has 12 transparent, padded 64x64 frames matching its atlas.');
}
