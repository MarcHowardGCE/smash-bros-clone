import fs from 'node:fs';
let s=fs.readFileSync('src/game.mjs','utf8').replace('underwaterBackground,reefPlatform,reefDetails,reefEnemy','underwaterBackground,reefPlatform,reefDetails,reefEnemy,reefArchitecture,underwaterMission');
s=s.replace("for(const hero of ['bonney'", "for(const name of ['ruin','habitat','wreck','valve','gate','vent','pearl','console','bell','chest','kelp','reef-block','reef-ledge','metal-block','catwalk','jelly-0','jelly-1','jelly-2','jelly-3','sub-0','sub-1','sub-2','sub-3'])resources['reef_'+name]='assets/underwater-full-v1/'+name+'.png';\nfor(const hero of ['bonney'");
s=s.replace('underwaterBackground(ctx,images,camera)','underwaterBackground(ctx,images,camera,cameraY)').replace("if(game.scene==='underwater'){}else if(game.scene==='cloud')cloudArchitecture","if(game.scene==='underwater')reefArchitecture(ctx,images,camera);else if(game.scene==='cloud')cloudArchitecture").replace('reefPlatform(ctx,s,camera)','reefPlatform(ctx,images,s,camera)');
s=s.replace("if(game.scene==='underwater')return 'Walk the seabed. Jump to the high ruins for treasure. Reach the far return lift.';","if(game.scene==='underwater')return underwaterMission(game);");
s=s.replace("for(const c of game.crates)if(c.hp>0){","for(const c of game.crates)if(c.hp>0){\n  if(game.scene==='underwater')continue;");
s=s.replace("const label=p.chargingPunch?", "const label=game.scene==='underwater'?'E: VALVE / RELAY':p.chargingPunch?");
s=s.replace("const f=p.chargingPunch?", "const f=game.scene==='underwater'?game.switches.filter(s=>game.latches[s.id]).length/4:p.chargingPunch?");
fs.writeFileSync('src/game.mjs',s);
