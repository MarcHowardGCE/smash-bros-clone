/** Build Stage 10 derivatives from the supplied Zanda masters; no generated replacements. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../../apps/client/package.json',import.meta.url));
const sharp=require('sharp');
const root=fileURLToPath(new URL('../../',import.meta.url));
const source=path.join(root,'art-source/zanda-infinity');
const output=path.join(root,'apps/client/public');
for(const variant of ['studio','archive','broadcast']){
 const image=path.join(source,variant+'.webp');
 await sharp(image).resize(1920,1080,{fit:'cover',withoutEnlargement:true}).webp({quality:82,effort:6}).toFile(path.join(output,'backgrounds/stage10-'+variant+'.webp'));
 await sharp(image).resize(800,450,{fit:'cover'}).webp({quality:80,effort:6}).toFile(path.join(output,'menu-art/stage10-'+variant+'.webp'));
}
// Supplied layout is 1774x887. Collision meets the front gold rim, not the rear perspective edge.
const sprites=[{file:'stage10-main.webp',left:0,top:519,width:1774,height:344,landingLine:85},
 {file:'stage10-soft.webp',left:530,top:29,width:704,height:199,landingLine:63}];
for(const {file,landingLine,...rect}of sprites){
 await sharp(path.join(source,'platform-layout.png')).extract(rect).webp({quality:88,alphaQuality:100,effort:6}).toFile(path.join(output,'platform-art',file));
}
fs.writeFileSync(path.join(source,'registration.json'),JSON.stringify({source:'platform-layout.png',sprites},null,2)+'\n');
console.log('Packed Zanda backgrounds, menu previews and supplied platform art.');
