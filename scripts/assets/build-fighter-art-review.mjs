import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const source=path.join(root,'apps/client/public/fighter-art-pilot-v1');
const template=fs.readFileSync(path.join(root,'scripts/assets/fighter-art-review.template.html'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(source,'manifest.json'),'utf8'));
fs.writeFileSync(path.join(source,'index.html'),template.replace('__MANIFEST__',JSON.stringify(manifest)));
if(process.argv[2]){
 const out=path.resolve(process.argv[2]);fs.mkdirSync(out,{recursive:true});
 const portable=structuredClone(manifest);
 const clipGroups=portable.characters?Object.values(portable.characters).map(c=>c.clips):[portable.clips];
 if(portable.characters)delete portable.clips;
 if(portable.effects)clipGroups.push(portable.effects);
 const encoded=new Map();
 for(const group of clipGroups)for(const clip of Object.values(group)){
  const file=clip.image;
  if(!encoded.has(file)){fs.copyFileSync(path.join(source,file),path.join(out,file));encoded.set(file,file);}
 }
 let html=template.replace('__MANIFEST__',JSON.stringify(portable));
 html=html.replace(/src="([^"]+-master-v1.png)"/g,(_,file)=>{fs.copyFileSync(path.join(source,file),path.join(out,file));return 'src="'+file+'"';});
 fs.writeFileSync(path.join(out,'index.html'),html);
 fs.copyFileSync(path.join(source,'manifest.json'),path.join(out,'manifest.json'));
 for(const file of ['prompts.json','ultimate-checklist.html'])if(fs.existsSync(path.join(source,file)))fs.copyFileSync(path.join(source,file),path.join(out,file));
}
console.log('Built roster web review and optional portable art pack.');

await import('./build-roster-consistency-review.mjs');

await import("./build-grab-pair-review.mjs");

await import("./build-ledge-review.mjs");

await import("./build-recovery-review.mjs");

await import("./build-transition-review.mjs");

await import("./build-action-review.mjs");
await import("./build-footstool-review.mjs");
await import("./build-airborne-review.mjs");

await import("./build-polish-audit.mjs");
await import("./build-loop-polish-review.mjs");

await import("./build-contact-signoff.mjs");

await import("./build-palette-audit.mjs");

await import("./build-every-frame-review.cjs");

if(process.argv[2])for(const file of ["runtime-integration.html","player-identification-runtime.png","BATCH-20.md","engine-art-handoff.json","integration-validation.json","package-validation.json"]){const src=path.join(source,file);if(fs.existsSync(src)&&path.resolve(source)!==path.resolve(process.argv[2]))fs.copyFileSync(src,path.join(process.argv[2],file));}

if(fs.existsSync(path.join(source,"production/verification.json")))await import("./build-integration-signoff.mjs");

if(process.argv[2]&&path.resolve(source)!==path.resolve(process.argv[2]))for(const file of ["BATCH-21.md","integration-validation-results.json"]){const src=path.join(source,file);if(fs.existsSync(src))fs.copyFileSync(src,path.join(process.argv[2],file));}
