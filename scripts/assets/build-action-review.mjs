import fs from 'node:fs';import path from 'node:path';
const source='apps/client/public/fighter-art-pilot-v1',pack=JSON.parse(fs.readFileSync(source+'/manifest.json')),template=fs.readFileSync('scripts/assets/action-review.template.html','utf8');
const p=structuredClone(pack);delete p.clips;delete p.effects;for(const c of Object.values(p.characters))for(const n of Object.keys(c.clips))if(!c.clips[n].actionFamily&&!['idle','run','jump','prone_up','prone_down'].includes(n))delete c.clips[n];
const html=template.replace('__PACK__',JSON.stringify(p));fs.writeFileSync(source+'/action-review.html',html);
for(const out of process.argv.slice(2)){fs.mkdirSync(out,{recursive:true});for(const c of Object.values(p.characters))for(const clip of Object.values(c.clips))fs.copyFileSync(path.join(source,clip.image),path.join(out,clip.image));fs.writeFileSync(path.join(out,'action-review.html'),html);}
console.log('Built combat and presentation review.');
