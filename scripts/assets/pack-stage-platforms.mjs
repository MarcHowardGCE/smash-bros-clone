/** Repack registered transparent platform sprites without altering artwork or alpha. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {PNG} from 'pngjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const source=path.join(root,'art-source/platforms-v1');
const output=path.join(root,'apps/client/public/platform-art');
const registrations=JSON.parse(fs.readFileSync(path.join(source,'sprite-registration.json'),'utf8'));
fs.mkdirSync(output,{recursive:true});
for(const entry of registrations){
  const sheet=PNG.sync.read(fs.readFileSync(path.join(source,entry.stage+'-sheet.png')));
  const {left,top,width,height}=entry.rect;
  if(left<0||top<0||width<=0||height<=0||left+width>sheet.width||top+height>sheet.height)throw Error('Invalid crop: '+entry.file);
  const sprite=new PNG({width,height});
  for(let y=0;y<height;y++)sheet.data.copy(sprite.data,y*width*4,((top+y)*sheet.width+left)*4,((top+y)*sheet.width+left+width)*4);
  fs.writeFileSync(path.join(output,entry.file),PNG.sync.write(sprite));
}
console.log('Packed '+registrations.length+' registered platform sprites with source alpha.');
