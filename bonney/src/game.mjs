import {districtBackground,fullEnemy,fullDetails,groundDecor} from './full-level-art.mjs';
import {harborBackground,dockSupports,harborDecor,guard,pickup,flag,sign,harborWater} from './world-art.mjs';
import {advanceWalkDistance,characterFrame} from './locomotion.mjs';
import {createGame,update,CONFIG,AGE_NAMES,respawn} from './engine.mjs';
const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d');
ctx.imageSmoothingEnabled=false;
const overlay=document.querySelector('#overlay'),overlayTitle=document.querySelector('#overlay-title');
const overlayText=document.querySelector('#overlay-text'),playButton=document.querySelector('#play');
const live=document.querySelector('#live');
let selectedMode=new URLSearchParams(location.search).get('mode')||(new URLSearchParams(location.search).has('test')?'tutorial':'full');
let game=createGame(selectedMode),started=false,paused=false,loaded=false,muted=true,audio;
let accumulator=0,last=0,camera=0,frame=0,announced='',walkDistance=0,cameraY=0;
const held=new Set(),edges=new Set(),images={};
const resources={
 tiles:'assets/world-v7/terrain-atlas.png',
 harbor:'assets/world-v7/harbor-background.png',
 guard:'assets/world-v7/guard-atlas.png',
 fullEnemies:'assets/level-v1/enemies-atlas.png',
 cannon:'assets/world-v7/cannon.png',
 trail:'assets/world-v7/charge-trail.png',
 exhaust:'assets/world-v7/flight-exhaust.png',
 impact:'assets/world-v7/impact.png',
 captainAtlas:'assets/sprites-v2/captain-atlas.png',
 eggheadAtlas:'assets/sprites-v2/egghead-atlas.png',
 captainWalk:'assets/walk-v3/captain-walk-atlas.png',
 eggheadWalk:'assets/walk-v3/egghead-walk-atlas.png',
};

for(const name of ['crate','barrel','rope','lantern','boots','hat','coin','sign','goal','checkpoint'])resources['prop_'+name]='assets/world-v7/'+name+'.png';
for(const name of ['crane','hook','gate','winch','lever','bell','chest','perch'])resources['machine_'+name]='assets/machinery-v2/'+name+'.png';
const sounds={jump:440,coin:880,pickup:660,flight:740,charge:150,hurt:110,stomp:260,
 impact:80,break:190,checkpoint:980,win:1040,fall:100};
function sound(event){
 if(muted)return;
 try {
  audio??=new AudioContext();audio.resume();
  const o=audio.createOscillator(),g=audio.createGain();
  o.type='square';o.frequency.setValueAtTime(sounds[event]||300,audio.currentTime);
  g.gain.setValueAtTime(.025,audio.currentTime);
  g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.12);
  o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.12);
 } catch { /* Sound is optional; gameplay continues if audio is unavailable. */ }
}
function restart(){game=createGame(selectedMode);camera=0;accumulator=0;walkDistance=0;started=true;paused=false;held.clear();edges.clear();canvas.focus();syncOverlay();}
function syncOverlay(){
 document.querySelector('h1 span').textContent=game.mode==='full'?'Harbor Breakout':'Harbor Run';
 document.title='Bonney · '+(game.mode==='full'?'Harbor Breakout':'Tutorial');
 const terminal=game.status!=='playing';
 overlay.hidden=started&&!paused&&!terminal;
 if(terminal){
  overlayTitle.textContent=game.status==='won'?'Harbor cleared!':'Try another voyage';
  overlayText.textContent=game.status==='won'
   ?game.coins+' coins · '+game.defeated+' enemies · '+(game.treasures||[]).filter(t=>t.collected).length+'/3 treasures · '+Math.floor(game.time)+'s'
   :game.mode==='full'?'Retry from your checkpoint as adult. Treasures and secured mechanisms are kept.':'Adult → teenage → baby → out. Pick up an ability and give it another try.';
  playButton.textContent=game.mode==='full'&&game.status==='dead'?'Continue from checkpoint':'Play again';
 } else if(paused){
  overlayTitle.textContent='Paused';overlayText.textContent='Your ability timers are paused too.';
  playButton.textContent='Resume';
 } else {
  overlayTitle.textContent=game.mode==='full'?'Harbor Breakout':'Harbor Run · Tutorial';
  overlayText.textContent=game.mode==='full'?'Six districts. Four enemy types. Three secret treasures. Secure the gate and ship mechanisms to escape.':'Collect a power-up, cross the harbor, and reach the pink flag.';
  playButton.textContent=loaded?'Start playing':'Loading sprites…';playButton.disabled=!loaded;
 }
 document.querySelector('#pause').textContent=paused?'Resume':'Pause';
}
playButton.addEventListener('click',()=>{
 if(paused){paused=false;canvas.focus();syncOverlay();}
 else if(game.mode==='full'&&game.status==='dead'){respawn(game);held.clear();edges.clear();accumulator=0;canvas.focus();syncOverlay();}
 else restart();
});
document.querySelector('#restart').addEventListener('click',restart);
const modeSelect=document.querySelector('#level-select');modeSelect.value=selectedMode;
modeSelect.addEventListener('change',()=>{selectedMode=modeSelect.value;restart();});
function togglePause(){
 if(!started||game.status!=='playing')return;
 paused=!paused;held.clear();edges.clear();accumulator=0;syncOverlay();if(!paused)canvas.focus();
}
document.querySelector('#pause').addEventListener('click',togglePause);
document.querySelector('#sound').addEventListener('click',e=>{
 muted=!muted;e.currentTarget.textContent=muted?'Sound off':'Sound on';
 e.currentTarget.setAttribute('aria-pressed',String(!muted));if(!muted)sound('coin');
});
canvas.addEventListener('keydown',e=>{
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code))e.preventDefault();
 if(e.repeat)return;
 if(e.code==='KeyP'||e.code==='Escape'){togglePause();return;}
 if(e.code==='KeyR'){restart();return;}
 if(e.code==='Enter'&&(!started||game.status!=='playing')){playButton.click();return;}
 if(!held.has(e.code))edges.add(e.code);held.add(e.code);
});
window.addEventListener('keyup',e=>held.delete(e.code));
window.addEventListener('blur',()=>{if(started&&!paused&&game.status==='playing')togglePause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&started&&!paused&&game.status==='playing')togglePause();});
function input(){
 const keys=(...k)=>k.some(x=>held.has(x));
 const i={left:keys('ArrowLeft','KeyA'),right:keys('ArrowRight','KeyD'),
  up:keys('ArrowUp','KeyW'),down:keys('ArrowDown','KeyS'),jumpHeld:keys('Space'),
  jumpPressed:edges.has('Space'),abilityPressed:edges.has('KeyX'),interactPressed:edges.has('KeyE')};
 edges.clear();return i;
}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h);}
const FONT = {
 A:'010101111101101',B:'110101110101110',C:'011100100100011',D:'110101101101110',
 E:'111100110100111',F:'111100110100100',G:'011100101101011',H:'101101111101101',
 I:'111010010010111',J:'001001001101010',K:'101101110101101',L:'100100100100111',
 M:'101111111101101',N:'101111111111101',O:'010101101101010',P:'110101110100100',
 Q:'010101101111011',R:'110101110101101',S:'011100010001110',T:'111010010010010',
 U:'101101101101111',V:'101101101101010',W:'101101111111101',X:'101101010101101',
 Y:'101101010010010',Z:'111001010100111',
 '0':'111101101101111','1':'010110010010111','2':'110001010100111',
 '3':'110001010001110','4':'101101111001001','5':'111100110001110',
 '6':'011100111101111','7':'111001010010010','8':'111101111101111','9':'111101111001110',
 '.':'000000000000010',':':'000010000010000','/':'001001010100100',
 '-':'000000111000000','>':'100010001010100',',':'000000000010100',
 '!':'010010010000010',"'":'010010000000000',' ':'000000000000000'
};
function text(s,x,y,color='#fff0ce'){
 ctx.fillStyle=color;
 let cursor=Math.round(x);
 for(const char of String(s).toUpperCase()){
  const glyph=FONT[char]||FONT[' '];
  for(let row=0;row<5;row++)for(let col=0;col<3;col++)
   if(glyph[row*3+col]==='1')ctx.fillRect(cursor+col,Math.round(y)+row,1,1);
  cursor+=4;
 }
}
function image(name,x,y,flip=false){
 const im=images[name];if(!im)return;
 const w=name==='exhaust'?16:32,h=name==='exhaust'||name==='trail'?16:32;
 ctx.save();if(flip){ctx.translate(Math.round(x)+w,Math.round(y));ctx.scale(-1,1);ctx.drawImage(im,0,0,w,h);}
 else ctx.drawImage(im,Math.round(x),Math.round(y),w,h);ctx.restore();
}function drawCharacter(p,x,y){
 const outfit=p.power==='egghead'?'egghead':'captain';
 const pose=characterFrame(p,walkDistance);
 const atlas=images[outfit+(pose.source==='walk'?'Walk':'Atlas')];
 ctx.save();
 if(pose.flip){ctx.translate(Math.round(x)+32,Math.round(y));ctx.scale(-1,1);}
 else ctx.translate(Math.round(x),Math.round(y));
 const walking=pose.source==='walk';
 const cellWidth=walking?96:64;
 ctx.drawImage(atlas,pose.column*cellWidth,pose.row*64,cellWidth,64,walking?-8:0,0,cellWidth/2,32);
 ctx.restore();
}
function tile(n,x,y){ctx.drawImage(images.tiles,n*32,0,32,32,Math.round(x),Math.round(y),16,16);}
function heart(x,y,filled){
 rect(x-1,y+1,12,5,'#0b1526');rect(x+2,y+6,7,3,'#0b1526');
 const c=filled?'#ed579d':'#405067';
 rect(x+1,y,3,2,c);rect(x+6,y,3,2,c);rect(x,y+2,10,3,c);
 rect(x+1,y+5,8,1,c);rect(x+2,y+6,6,1,c);rect(x+3,y+7,4,1,c);rect(x+4,y+8,2,1,c);
 if(filled){rect(x+1,y+2,2,1,'#ffc4dc');rect(x+2,y+1,1,1,'#fff0e8');}
}
function pickupIcon(power,x,y){pickup(ctx,images,power,x,y,game.time);}
function background(){harborBackground(ctx,images,camera,game.time);}
function mission(){
 if(game.mode!=='full')return 'Tutorial: collect a power-up and reach the pink flag.';
 const l=game.latches;
 if(game.player.x<3200)return 'Explore the harbor. Watch for cracked cargo, high glints, and safe power-up swaps.';
 if(!l.customsLock)return 'Customs Gate: break the marked lock with Captain.';
 if(!l.customsLever)return 'Customs Gate: reach the upper lever with Egghead and press E.';
 if(game.player.x<5280)return 'Gate opened. Cross the shipyard and watch the cargo-drop warnings.';
 if(!l.winch)return 'Flagship: break the winch lock with Captain.';
 if(!l.rigging)return 'Flagship: reach the high rigging switch with Egghead and press E.';
 return 'Boarding route secured. Reach the pink flag. Optional treasures remain yours to discover.';
}

function render(){
 if(!loaded)return;
 ctx.setTransform(2,0,0,2,0,0);
 const p=game.player;
 const objective=document.querySelector('#objective');const instruction=mission();if(objective.textContent!==instruction)objective.textContent=instruction;
 camera=Math.max(0,Math.min(game.width-384,p.x-104));
 cameraY=game.mode==='full'?Math.max(-38,Math.min(game.height-216,p.y-116)):0;
 background();
 ctx.save();ctx.translate(0,-Math.round(cameraY));
 if(game.mode==='full')districtBackground(ctx,game,camera,images);
 for(const s of game.platforms){
  if(s.x+s.w<camera-16||s.x>camera+400||s.kind==='perch')continue;
  for(let x=s.x;x<s.x+s.w;x+=16){
   tile(s.h===8?2:0,x-camera,s.y);
   if(s.h>8)for(let y=s.y+16;y<s.y+s.h;y+=16)tile(1,x-camera,y);
  }
  if(s.h===8&&game.mode!=='full')dockSupports(ctx,s,camera);
 }
 if(game.mode==='full')groundDecor(ctx,images,game,camera);else harborDecor(ctx,images,camera,game.time);
 for(const c of game.crates)if(c.hp>0)for(let y=c.y;y<c.y+c.h;y+=16)tile(4,c.x-camera,y);
 for(const c of game.coinsList)if(!c.collected)tile(6,c.x-camera-3,c.y);
 for(const item of game.pickups)if(item.respawnMs===0){
  pickupIcon(item.power,item.x-camera,item.y);
  text(item.power==='egghead'?'FLY':'DASH',item.x-camera-2,item.y-12,'#fff0ce',6);
 }
 if(game.mode==='full')fullDetails(ctx,images,game,camera,text);
 else {
  for(const [x,label]of [[32,'HARBOR RUN'],[360,'DOUBLE JUMP'],[736,'X: CANNONBALL'],[1000,'CHECKPOINT'],[1430,'FINAL STRETCH']]){
   sign(ctx,images,x-camera,56,label.length*4+12);text(label,x-camera+6,67,'#fff0ce');
  }
  flag(ctx,images,'checkpoint',984-camera,176,game.checkpointReached,game.time);
  flag(ctx,images,'goal',1860-camera,176,false,game.time);
 }
 for(const e of game.enemies)if(e.hp>0){
  if(game.mode!=='full'||!fullEnemy(ctx,images,e,game.time,camera))guard(ctx,images,e,game.time,camera);
 }
 const charge=p.ability==='active'&&p.power==='pirateCaptain'; const fly=p.ability==='active'&&p.power==='egghead';
 if(p.invulnerableMs<=0||Math.floor(p.invulnerableMs/80)%2===0){
  const x=p.x-camera-8,y=p.y-3;
  if(charge){
   image('trail',x-p.facing*25,y+10,p.facing<0);image('cannon',x,y,p.facing<0);
  } else {
   drawCharacter(p,x,y);
   if(fly&&p.activeMs>0&&held.has('Space')){image('exhaust',x+1,y+28);image('exhaust',x+14,y+28);}
  }
 }
 for(const particle of game.particles){
  const t=particle.life/.25;ctx.globalAlpha=Math.max(0,t);
  const px=particle.x-camera,py=particle.y;
  if(particle.kind==='dust'){
   for(let i=0;i<4;i++)rect(px+(i-1.5)*(1-t)*12,py-1-(1-t)*(i%2+1)*3,2,1,'#e9d0a2');
  }else if(particle.kind==='coin'||particle.kind==='pickup'){
   for(let i=0;i<4;i++){const a=i*Math.PI/2+(1-t);rect(px+Math.cos(a)*(1-t)*14,py+Math.sin(a)*(1-t)*14,1,3,'#ffe7a0');}
  }else image('impact',px-16,py-16);
  ctx.globalAlpha=1;
 }
 ctx.restore();
 harborWater(ctx,images,game.time);
 // HUD remains fixed while the world scrolls.
 rect(0,0,384,38,'#172538');rect(0,0,384,1,'#506877');rect(0,37,384,1,'#b69b69');
 rect(104,6,1,26,'#33495c');rect(222,6,1,26,'#33495c');
 for(let i=0;i<3;i++)heart(7+i*13,5,i<p.hits);
 text(AGE_NAMES[p.hits].toUpperCase()+' / '+p.hits+' HITS',7,23,'#e9e8ec',7);
 text(p.power==='none'?'NO POWER-UP':p.power==='egghead'?'EGGHEAD':'CAPTAIN',112,5,'#cba4e8',8);
 text('COINS '+String(game.coins).padStart(2,'0')+(game.mode==='full'?' T'+game.treasures.filter(t=>t.collected).length+'/3':''),112,23,'#ffd363',7);
 const abilityLabel=p.power==='none'?'FIND A PICKUP':p.ability==='ready'?'READY':
   p.ability==='active'?(fly&&p.activeMs===0?'LAND TO RECHARGE':(fly?'FLYING ':'CHARGING ')+(p.activeMs/1000).toFixed(1)+'s'):
   'CHARGE '+Math.floor(100*(1-p.cooldownMs/CONFIG.cooldownMs))+'%';
 text(abilityLabel,230,5,'#fff0ce',7);
 const progress=p.power==='none'?0:p.ability==='ready'?1:p.ability==='active'?
   p.activeMs/(fly?CONFIG.flightMs:CONFIG.chargeMs):1-p.cooldownMs/CONFIG.cooldownMs;
 rect(229,17,147,8,'#0c1624');rect(230,18,145,6,'#435764');rect(230,18,Math.round(145*progress),6,p.ability==='cooldown'?'#ffd363':'#b17ad1');
 text(p.power==='none'?'PURPLE: FLY / GREEN: DASH':p.ability==='cooldown'?(p.cooldownMs<CONFIG.cooldownMs?'PARTIAL POWER READY':'RECHARGING'):
   p.power==='egghead'?'DOUBLE JUMP TO FLY':'X TO CHARGE',230,27,'#e9e8ec',6);
 if(game.mode==='full'&&game.noticeMs===0){const zone=game.zones.filter(z=>p.x>=z.x).at(-1);rect(0,198,384,10,'#172538');text(zone.name+' / E: SWITCH / R: RESTART',4,200);}
 if(game.noticeMs>0){
  rect(0,198,384,10,'#172538');text(game.notice,4,200,'#fff0ce',6);
 }
 const announcement=AGE_NAMES[p.hits]+', '+p.hits+' hits. '+abilityLabel;
 if(announcement!==announced&&p.ability==='ready'){live.textContent=announcement;announced=announcement;}
 frame++;
}
function loop(now){
 const dt=Math.min(.05,(now-(last||now))/1000);last=now;
 if(started&&!paused&&game.status==='playing'){
  accumulator+=dt;
  while(accumulator>=1/120){
   const previousX=game.player.x,wasGrounded=game.player.grounded;
   update(game,1/120,input());
   walkDistance=advanceWalkDistance(walkDistance,previousX,game.player);
   if(!wasGrounded&&game.player.grounded)game.particles.push({kind:'dust',x:game.player.x+8,y:game.player.y+28,life:.25});
   for(const e of game.events){
    sound(e);
    if(['impact','break','stomp','hurt','jump','coin','pickup'].includes(e))
     game.particles.push({kind:e==='jump'?'dust':e,x:game.player.x+8,y:game.player.y+(e==='jump'?28:10),life:.25});
   }
   game.particles=game.particles.filter(p=>(p.life-=1/120)>0);
   accumulator-=1/120;
   if(game.status!=='playing'){held.clear();edges.clear();syncOverlay();break;}
  }
 }
 render();requestAnimationFrame(loop);
}
Promise.all(Object.entries(resources).map(([key,url])=>new Promise((resolve,reject)=>{
 const im=new Image();im.onload=()=>{images[key]=im;resolve();};im.onerror=()=>reject(new Error('Could not load '+url));im.src=url;
}))).then(()=>{loaded=true;syncOverlay();requestAnimationFrame(loop);}).catch(error=>{
 overlayTitle.textContent='Could not load game art';overlayText.textContent=error.message;playButton.disabled=true;console.error(error);
});
if(new URLSearchParams(location.search).has('test'))
 window.__bonney={get game(){return game;},get loaded(){return loaded;},get paused(){return paused;},restart,
  get renderedFrames(){return frame;},get animationFrame(){return characterFrame(game.player,walkDistance);}};
