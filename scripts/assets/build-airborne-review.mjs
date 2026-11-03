import fs from "node:fs";import path from "node:path";import{AIR_DODGE_DIRECTIONS}from"./airborne-metadata.mjs";
const source="apps/client/public/fighter-art-pilot-v1",pack=JSON.parse(fs.readFileSync(source+"/manifest.json")),template=fs.readFileSync("scripts/assets/airborne-review.template.html","utf8"),p=structuredClone(pack);delete p.clips;delete p.effects;
for(const c of Object.values(p.characters))for(const n of Object.keys(c.clips))if(!c.clips[n].airborneFamily&&!["idle","jab","land_soft","up_special"].includes(n))delete c.clips[n];
const html=template.replace("__MOTION__",fs.readFileSync("scripts/assets/polish-motion.mjs","utf8").replaceAll("export function","function")).replace("__PACK__",JSON.stringify(p)).replace("__DIRECTIONS__",JSON.stringify(AIR_DODGE_DIRECTIONS));fs.writeFileSync(source+"/airborne-review.html",html);
for(const out of process.argv.slice(2)){fs.mkdirSync(out,{recursive:true});for(const c of Object.values(p.characters))for(const clip of Object.values(c.clips))fs.copyFileSync(path.join(source,clip.image),path.join(out,clip.image));fs.writeFileSync(path.join(out,"airborne-review.html"),html);for(const file of["moveset-decisions.html","moveset-decisions.json"])if(fs.existsSync(source+"/"+file))fs.copyFileSync(source+"/"+file,out+"/"+file);}
console.log("Built airborne and moveset review.");

