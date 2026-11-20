import fs from 'node:fs';
import crypto from 'node:crypto';
const base='apps/client/public/fighter-art-newcomers-v1/';
const source=JSON.parse(fs.readFileSync(base+'manifest.json','utf8'));
const packed=JSON.parse(fs.readFileSync(base+'dojo/manifest.json','utf8'));
const pixels=packed.production.pages.map(p=>base+'dojo/'+p);
const hashes=()=>pixels.map(p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'));
const before=hashes();let changed=false;
for(const m of [source,packed])for(const id of ['moonshine','hulk-hoagie']){
 for(const name of ['takeoff_neutral','takeoff_forward','takeoff_backward','land_soft']){
  const clip=m.characters[id].clips[name];const durations=name==='land_soft'?(clip.frames.length===6?[2,2,2,2,2,2]:[3,3,6]):clip.frames.length===3?[2,2,2]:[3,3];
  if(JSON.stringify(clip.durations)!==JSON.stringify(durations)){clip.durations=durations;changed=true;}
 }
}
if(changed){const revision=Math.max(source.revision,packed.revision)+1;source.revision=packed.revision=revision;packed.production.sourceRevision=revision;
 fs.writeFileSync(base+'manifest.json',JSON.stringify(source,null,2)+'\n');fs.writeFileSync(base+'dojo/manifest.json',JSON.stringify(packed,null,2)+'\n');}
if(JSON.stringify(before)!==JSON.stringify(hashes()))throw Error('Unexpected atlas pixel mutation');
console.log(JSON.stringify({changed,revision:source.revision,atlasPixelsUnchanged:true,clipCounts:Object.fromEntries(Object.entries(packed.characters).map(([id,c])=>[id,Object.keys(c.clips).length]))}));
