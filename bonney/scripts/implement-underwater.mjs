import fs from 'node:fs';
const put=(p,s)=>fs.writeFileSync(p,s);const edit=(p,a,b)=>{let s=fs.readFileSync(p,'utf8');if(!s.includes(a))throw Error('Missing '+p+' '+a);put(p,s.replaceAll(a,b));};
put('src/underwater-level.mjs',`import {resetCombat} from './combat.mjs';
export const WATER_PHYSICS={speed:.62,gravity:280,jump:285,terminal:170};
const KEYS=['width','height','title','start','platforms','pickups','enemies','coinsList','crates','switches','gates','treasures','food','checkpoints','movers','hazards','zones','goalX','checkpoint','checkpointIndex','checkpointState','projectiles','latches','exitDestination'];
const snapshot=g=>Object.fromEntries(KEYS.map(k=>[k,g[k]]));
export function underwaterData(){
 const floor=(x,w,y)=>({x,w,y,h:480-y,kind:'reef'}),ledge=(x,y,w)=>({x,y,w,h:12,oneWay:true,kind:'reef'});
 const platforms=[floor(0,640,368),floor(704,512,400),floor(1280,512,368),floor(1856,704,400),ledge(240,288,112),ledge(432,224,128),ledge(816,304,144),ledge(1040,224,112),ledge(1360,272,144),ledge(1568,192,128),ledge(1936,304,144),ledge(2160,240,128),ledge(2368,304,128)];
 const enemy=(x,y,min,max)=>({x,y,min,max,homeX:x,homeY:y,w:20,h:20,hp:2,maxHp:2,dir:-1,type:'patrol',skin:'reef',state:'idle',timer:0});
 return {width:2560,height:480,title:'Coral Current',start:{x:48,y:340},platforms,pickups:[],enemies:[enemy(520,348,480,600),enemy(980,380,968,1100),enemy(1650,348,1600,1720),enemy(2240,380,2200,2320)],coinsList:[[176,342],[272,262],[464,198],[736,374],[848,278],[1072,198],[1328,342],[1392,246],[1600,166],[1888,374],[1968,278],[2192,214],[2400,278]].map(([x,y])=>({x,y,w:10,h:12,collected:false})),crates:[],switches:[],gates:[],treasures:[{id:'coralPearl',name:'Coral Pearl',x:512,y:198,w:14,h:16,collected:false},{id:'sunkenChart',name:'Sunken Chart',x:1648,y:166,w:14,h:16,collected:false},{id:'deepPrism',name:'Deep Prism',x:2224,y:214,w:14,h:16,collected:false}],food:[{x:1440,y:354,w:14,h:14}],checkpoints:[{x:32,y:368,power:'none'},{x:1328,y:368,power:'none'}],movers:[],hazards:[],zones:[{x:0,name:'CORAL LANDING'},{x:704,name:'SUNKEN ARCHES'},{x:1280,name:'PEARL GARDENS'},{x:1856,name:'RESEARCH APPROACH'}],goalX:2480,checkpoint:32,checkpointIndex:0,checkpointState:{x:32,y:340,power:'none'},projectiles:[],latches:{},exitDestination:{level:'next-level',entry:'deep-research-dock',route:'underwater'}};
}
export function enterUnderwater(g){
 if(g.mode!=='full'||g.scene==='cloud'||g.scene==='underwater')return false;
 g.surfaceSnapshot=snapshot(g);g.waterEntryX=g.player.x;g.waterEntryPower=g.player.power;
 Object.assign(g,g.underwaterSnapshot||underwaterData());g.scene='underwater';
 Object.assign(g.player,{x:48,y:340,vx:0,vy:0,grounded:true,power:'none',ability:'ready',activeMs:0,cooldownMs:0,invulnerableMs:1500,pickupLockMs:0,coyoteMs:0,jumpBufferMs:0});resetCombat(g.player);g.secretLaunchEligible=false;g.particles=[];
 g.notice='Sealed suit engaged. Heavy steps, buoyant jumps. No swimming. E at the return lift.';g.noticeMs=6500;g.events.push('pickup');return true;
}
export function leaveUnderwater(g){
 if(g.scene!=='underwater'||!g.surfaceSnapshot)return false;
 g.underwaterSnapshot=snapshot(g);Object.assign(g,g.surfaceSnapshot);g.surfaceSnapshot=null;g.scene='harbor';g.status='playing';
 const locked=g.gates.filter(s=>!s.requires.every(id=>g.latches[id])).sort((a,b)=>a.x-b.x)[0],limit=locked?locked.x-g.player.w:Infinity;
 const spans=g.platforms.filter(s=>!s.oneWay&&s.h>20&&s.x<limit);
 const desired=Math.min(g.waterEntryX,limit),spots=spans.map(s=>({s,x:Math.max(s.x,Math.min(desired,s.x+s.w-g.player.w,limit))})).filter(a=>a.x>=a.s.x);
 const best=spots.sort((a,b)=>Math.abs(a.x-desired)-Math.abs(b.x-desired))[0];
 Object.assign(g.player,{x:best?.x??32,y:(best?.s.y??400)-g.player.h,vx:0,vy:0,grounded:true,power:g.waterEntryPower||'none',ability:'ready',activeMs:0,cooldownMs:0,invulnerableMs:1500,coyoteMs:0,jumpBufferMs:0});resetCombat(g.player);g.notice='Returned safely to the harbor.';g.noticeMs=3500;return true;
}
`);
put('src/underwater-art.mjs',`export function underwaterBackground(c,images,camera){
 c.fillStyle='#063747';c.fillRect(0,0,384,216);const x=-((camera*.15)%648);for(let n=0;n<2;n++)c.drawImage(images.reefBackground,x+n*648,0,648,216);
}
export function reefPlatform(c,s,camera){
 const x=Math.round(s.x-camera);c.fillStyle='#143b46';c.fillRect(x,s.y,s.w,s.h);c.fillStyle='#79b7a6';c.fillRect(x,s.y,s.w,3);c.fillStyle='#38736e';c.fillRect(x,s.y+3,s.w,5);
 for(let a=0;a<s.w;a+=16){c.fillStyle='#28535b';c.fillRect(x+a+1,s.y+10,13,10);c.fillStyle='#4c7977';c.fillRect(x+a+2,s.y+10,10,1);}
}
export function reefEnemy(c,e,t,camera){
 const x=Math.round(e.x-camera),y=Math.round(e.y),step=Math.floor(t*7)%2;
 c.fillStyle='#271d3e';for(let i=0;i<3;i++){c.fillRect(x-3+i*7,y+15+((i+step)%2)*2,5,3);}c.fillStyle='#b35080';c.fillRect(x,y+6,20,11);c.fillStyle='#ef8a9b';c.fillRect(x+2,y+4,16,9);c.fillStyle='#ffc8a9';c.fillRect(x+4,y+3,4,3);c.fillRect(x+13,y+3,4,3);c.fillStyle='#18263a';c.fillRect(x+6,y+3,2,3);c.fillRect(x+14,y+3,2,3);c.fillStyle='#dc769a';c.fillRect(x-4,y+5,5,7);c.fillRect(x+19,y+5,5,7);
}
export function reefDetails(c,images,g,camera,text){
 for(const t of g.treasures)if(!t.collected){c.drawImage(images.machine_chest,t.x-camera-3,t.y-4,20,20);}
 for(const f of g.food)if(!f.collected)c.drawImage(images.food,f.x-camera,f.y,14,14);
 for(const x of [80,2480]){c.fillStyle='#152c44';c.fillRect(x-camera,328,24,72);c.fillStyle='#6ae5d2';c.fillRect(x-camera+3,331,18,3);c.fillRect(x-camera+3,392,18,3);text(x===80?'E: SURFACE':'EXIT',x-camera-8,320,'#aaf4df',6);}
 for(let i=0;i<20;i++){const x=(i*137+Math.sin(g.time+i)*3)%g.width-camera,y=430-((g.time*12+i*53)%390);c.strokeStyle='#80c8ce';c.strokeRect(x,y,2,3);}
}
`);
edit('src/engine.mjs',"import {CLOUD_BUILDINGS}","import {WATER_PHYSICS,enterUnderwater,leaveUnderwater} from './underwater-level.mjs';\nimport {CLOUD_BUILDINGS}");
edit('src/engine.mjs',"const p=game.player,ms=dt*1000;","const p=game.player,ms=dt*1000,wet=game.scene==='underwater';\n  if(wet&&input.interactPressed&&p.x>=56&&p.x<=120&&p.grounded){leaveUnderwater(game);return;}");
edit('src/engine.mjs',"p.vy=-CONFIG.jump;p.grounded=false;p.coyoteMs", "p.vy=-(wet?WATER_PHYSICS.jump:CONFIG.jump);p.grounded=false;p.coyoteMs");
edit('src/engine.mjs',"input.jumpPressed&&p.power==='gear'", "input.jumpPressed&&!wet&&p.power==='gear'");
edit('src/engine.mjs',"input.jumpPressed&&p.power==='egghead'", "input.jumpPressed&&!wet&&p.power==='egghead'");
edit('src/engine.mjs',"*(p.power==='gear'?1.5:1);", "*(p.power==='gear'?1.5:1)*(wet?WATER_PHYSICS.speed:1);");
edit('src/engine.mjs',"Math.min(300,p.vy+CONFIG.gravity*dt)","Math.min(wet?WATER_PHYSICS.terminal:300,p.vy+(wet?WATER_PHYSICS.gravity:CONFIG.gravity)*dt)");
edit('src/engine.mjs',"const roofAt=x=>game.mode==='full'?", "const roofAt=x=>game.mode==='full'&&!wet?");
edit('src/engine.mjs',"if(p.y>game.height+16&&game.scene==='cloud')", "if(game.mode==='full'&&!wet&&game.scene!=='cloud'&&p.y+p.h>=432){enterUnderwater(game);return;}\n  if(p.y>game.height+16&&game.scene==='cloud')");
edit('src/engine.mjs',"afterLevel(game,dt,input,damagePlayer);secretCourseUpdate(game,input);", "afterLevel(game,dt,input,damagePlayer);if(wet&&game.status==='won')game.nextLevelEntry={...game.exitDestination};if(!wet)secretCourseUpdate(game,input);");
edit('src/game.mjs',"import {drawFlightJets", "import {underwaterBackground,reefPlatform,reefDetails,reefEnemy} from './underwater-art.mjs';\nimport {leaveUnderwater} from './underwater-level.mjs';\nimport {drawFlightJets");
edit('src/game.mjs',"const resources={", "const resources={\n reefBackground:'assets/underwater-v1/background.png',");
edit('src/game.mjs',"for(const outfit of ['default'", "for(const hero of ['bonney','luffy'])for(const [suffix,file]of [['Atlas','atlas'],['Walk','walk-atlas'],['Attack','attacks']])resources[hero+'_diving'+suffix]='assets/underwater-v1/'+hero+'/diving-'+file+'.png';\nfor(const outfit of ['default'");
edit('src/game.mjs',"const atlas=images[characterSpriteKey(selectedCharacter,p,walkDistance)];", "const atlas=images[game.scene==='underwater'?selectedCharacter+'_diving'+(attacking?'Attack':pose.source==='walk'?'Walk':'Atlas'):characterSpriteKey(selectedCharacter,p,walkDistance)];");
edit('src/game.mjs',"function background(){", "function background(){if(game.scene==='underwater'){underwaterBackground(ctx,images,camera);return;}");
edit('src/game.mjs',"function mission(){", "function mission(){\n if(game.scene==='underwater')return 'Walk the seabed. Jump to the high ruins for treasure. Reach the far return lift.';");
edit('src/game.mjs',"if(game.scene==='cloud')cloudArchitecture", "if(game.scene==='underwater'){}else if(game.scene==='cloud')cloudArchitecture");
edit('src/game.mjs',"for(const s of game.platforms){", "for(const s of game.platforms){\n  if(game.scene==='underwater'){reefPlatform(ctx,s,camera);continue;}");
edit('src/game.mjs',"if(game.scene==='cloud'){}else if(game.mode", "if(game.scene==='cloud'||game.scene==='underwater'){}else if(game.mode");
edit('src/game.mjs',"if(game.scene==='cloud')cloudDetails", "if(game.scene==='underwater')reefDetails(ctx,images,game,camera,text);else if(game.scene==='cloud')cloudDetails");
edit('src/game.mjs',"if(game.scene==='cloud')cloudEnemy", "if(game.scene==='underwater')reefEnemy(ctx,e,game.time,camera);else if(game.scene==='cloud')cloudEnemy");
edit('src/game.mjs',"if(game.scene!=='cloud')harborWater", "if(game.scene!=='cloud'&&game.scene!=='underwater')harborWater");
edit('src/game.mjs',"game.scene==='cloud'?'Skyward Egghead'", "game.scene==='underwater'?'Coral Current':game.scene==='cloud'?'Skyward Egghead'");
edit('src/game.mjs',"game.scene==='cloud'?'Cloud course cleared!'", "game.scene==='underwater'?'Underwater route cleared!':game.scene==='cloud'?'Cloud course cleared!'");
edit('src/game.mjs',"game.scene==='cloud'&&game.status==='won'?'Return to harbor'", "(game.scene==='cloud'||game.scene==='underwater')&&game.status==='won'?'Return to harbor'");
edit('src/game.mjs',"if(game.scene==='cloud'&&game.status==='won'){", "if(game.scene==='underwater'&&game.status==='won'){leaveUnderwater(game);held.clear();edges.clear();canvas.focus();syncOverlay();return;}\n if(game.scene==='cloud'&&game.status==='won'){");
edit('server.mjs',"(flight-art|", "(underwater-level|underwater-art|flight-art|");
let pkg=JSON.parse(fs.readFileSync('package.json'));pkg.scripts.test+=' src/underwater-level.test.mjs';pkg.scripts.check+=' && node --check src/underwater-level.mjs && node --check src/underwater-art.mjs';put('package.json',JSON.stringify(pkg,null,2)+'\n');

