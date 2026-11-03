import fs from 'node:fs';let p=JSON.parse(fs.readFileSync('package.json'));p.scripts.test+=' src/refinement.test.mjs';fs.writeFileSync('package.json',JSON.stringify(p,null,2)+'\n');
