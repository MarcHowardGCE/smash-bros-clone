import fs from 'node:fs';
const p='src/cloud-level.mjs';let s=fs.readFileSync(p,'utf8');s=s.replace("Object.assign(g,g.cloudSnapshot||cloudLevelData(g.skyChartCollected));g.scene='cloud';","Object.assign(g,g.cloudSnapshot||cloudLevelData(g.skyChartCollected));g.scene='cloud';\n const spawn=g.cloudSnapshot?g.checkpointState:{x:48,y:196};");s=s.replace('x:48,y:196,vx:0,vy:0','x:spawn.x,y:spawn.y,vx:0,vy:0');fs.writeFileSync(p,s);
let art=fs.readFileSync('src/underwater-art.mjs','utf8');art=art.replace(" if(e.type==='shield'", " if(e.skin==='reefSub'&&e.state==='aim'){c.fillStyle='#ffe4a1';c.fillRect(e.x-camera+10,e.y-12,3,6);c.fillRect(e.x-camera+10,e.y-4,3,2);}\n if(e.type==='shield'");art=art.replace('export function reefDetails',`export function reefProjectile(c,images,b,camera){
 c.drawImage(images.projectile,Math.round(b.x-camera-2),Math.round(b.y-2),10,8);
 c.fillStyle='#8ef7e7';c.fillRect(Math.round(b.x-camera-4*Math.sign(b.vx)),Math.round(b.y+1),4,2);
}
export function reefDetails`);art=art.replace(' const p=g.player;',' const p=g.player;\n for(const b of g.projectiles)reefProjectile(c,images,b,camera);');fs.writeFileSync('src/underwater-art.mjs',art);
s=fs.readFileSync('src/encounters.mjs','utf8').replace("if(g.platforms.some(s=>!s.oneWay&&hit(b,s)))b.life=0;","if(g.platforms.some(s=>!s.oneWay&&hit(b,s))||g.gates.some(s=>gateClosed(g,s)&&hit(b,{...s,y:-448,h:g.height+896}))||g.crates.some(c=>c.hp>0&&hit(b,c)))b.life=0;");fs.writeFileSync('src/encounters.mjs',s);
