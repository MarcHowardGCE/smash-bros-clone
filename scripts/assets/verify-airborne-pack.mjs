import fs from "node:fs";import assert from "node:assert/strict";import{AIRBORNE_CLIPS,AIR_DODGE_DIRECTIONS}from"./airborne-metadata.mjs";
const m=JSON.parse(fs.readFileSync("apps/client/public/fighter-art-pilot-v1/manifest.json"));let clips=0;
assert.equal(Object.keys(AIR_DODGE_DIRECTIONS).length,8);assert.equal(new Set(Object.values(AIR_DODGE_DIRECTIONS).map(d=>d.vector.join(","))).size,8);
for(const[id,c]of Object.entries(m.characters)){assert.equal(Object.keys(c.clips).length,136);assert.equal(Object.values(c.clips).reduce((n,k)=>n+k.frames.length,0),763);assert.equal(Object.values(c.clips).filter(k=>!k.previewOnly).length,54);
 for(const n of AIRBORNE_CLIPS){const k=c.clips[n];assert.equal(k.frames.length,6);assert.equal(k.previewOnly,true);assert.equal(k.airborneFamily,true);assert.equal(k.durations.length,6);assert.ok(k.durations.every(x=>x>0));for(const f of k.frames){assert.ok([...f.root,f.offsetY,k.scale].every(Number.isFinite));}
 if(n.startsWith("jab_")){const positions=k.frames.map(f=>(f.sockets.supportFoot[0]-f.root[0])*k.scale);assert.ok(positions.every(x=>Math.abs(x-positions[0])<1e-8),id+"/"+n+" support-foot drift");}
 clips++;
 }}
if(process.argv[2]){const old=JSON.parse(fs.readFileSync(process.argv[2]));let prior=0;for(const[id,c]of Object.entries(old.characters))for(const[n,k]of Object.entries(c.clips)){assert.deepEqual(m.characters[id].clips[n],k,id+"/"+n+" changed");prior++;}assert.deepEqual(m.effects,old.effects);console.log(prior+" prior clips and shared effects preserved.");}
console.log(clips+" airborne/jab clips verified; 136 clips / 763 drawings / 54 live clips per fighter.");

