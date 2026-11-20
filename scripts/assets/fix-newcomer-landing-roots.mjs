import fs from 'node:fs';
const file = 'apps/client/public/fighter-art-newcomers-v1/manifest.json';
const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
let changed = false;
for (const id of ['moonshine', 'hulk-hoagie']) {
  const frame = manifest.characters[id].clips.land_soft.frames[0];
  const sole = frame.rect[3] - 2;
  if (Math.abs(frame.root[1] - sole) > 1e-8) {
    frame.root[1] = sole;
    frame.registration = 'planted landing sole';
    changed = true;
  }
}
if (changed) {
  manifest.revision++;
  fs.writeFileSync(file, JSON.stringify(manifest, null, 2) + '\n');
}
console.log(JSON.stringify({ changed, revision: manifest.revision }));
