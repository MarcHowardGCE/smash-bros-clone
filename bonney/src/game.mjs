import {GameAudio} from './audio.mjs';
import {LEVEL_MUSIC} from './audio-config.mjs';
import {ControllerInput,controlHint} from './controller.mjs';
import {followCamera,recordCameraView} from './camera.mjs';
import {underwaterBackground,reefPlatform,reefDetails,reefEnemy,reefArchitecture,underwaterMission} from './underwater-art.mjs';
import {leaveUnderwater} from './underwater-level.mjs';
import {drawFlightJets,flightJetLayout} from './flight-art.mjs';
import {returnHarbor} from './cloud-level.mjs';
import {attackBounds} from './combat.mjs';
import {cloudBackground,cloudPlatform,cloudDetails,hiddenCloudBank,cloudArchitecture,cloudEnemy} from './cloud-art.mjs';
import {inPolishedDistrict,cameraTarget} from './market-scene.mjs';
import {districtBackground,fullEnemy,fullDetails,groundDecor} from './full-level-art.mjs';
import {harborBackground,dockSupports,harborDecor,guard,pickup,flag,sign,harborWater} from './world-art.mjs';
import {advanceWalkDistance,characterFrame,characterOutfit,characterSpriteKey} from './locomotion.mjs';
import {createGame,update,CONFIG,AGE_NAMES,respawn} from './engine.mjs';
const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d');
ctx.imageSmoothingEnabled=false;
const overlay=document.querySelector('#overlay'),overlayTitle=document.querySelector('#overlay-title');
const overlayText=document.querySelector('#overlay-text'),playButton=document.querySelector('#play');
const live=document.querySelector('#live');
const keyboardGuideText=new Map(['#sky-guide','#water-guide'].map(id=>{const el=document.querySelector(id);return [el,el.textContent];}));
let selectedCharacter='bonney';
try{if(localStorage.getItem('bonney.character')==='luffy')selectedCharacter='luffy';}catch{}
const characterLabel=()=>selectedCharacter==='luffy'?'Luffy':'Bonney';
let selectedMode=new URLSearchParams(location.search).get('mode')||(new URLSearchParams(location.search).has('test')?'tutorial':'full');
let game=createGame(selectedMode),started=false,paused=false,loaded=false;
const mixer=new GameAudio(LEVEL_MUSIC);
let cameraState;
let accumulator=0,last=0,camera=0,frame=0,announced='',walkDistance=0,cameraY=0;
const held=new Set(),edges=new Set(),images={};
const controller=new ControllerInput();let inputSource='keyboard',controllerStatus='';
const jumpIsHeld=()=>held.has('Space')||controller.held.jumpHeld;
const resources={
 reefCrab:'assets/underwater-v1/crab-atlas.png',
 reefBackground:'assets/underwater-v1/background.png',
 gearPickup:'assets/powerups-v1/gear-fruit.png',
 eggheadFlight:'assets/flight-v1/bonney-flight-atlas.png',
 luffy_eggheadFlight:'assets/flight-v1/luffy-flight-atlas.png',
 flightThrusters:'assets/flight-v1/thrusters-atlas.png',
 skyHabitat:'assets/cloud-full-v1/habitat.png',
 skyReactor:'assets/cloud-full-v1/reactor.png',
 skyObservatory:'assets/cloud-full-v1/observatory.png',
 skyEnemies:'assets/cloud-full-v1/enemies-atlas.png',
 skyConsole:'assets/cloud-full-v1/console.png',
 skyCasing:'assets/cloud-full-v1/casing.png',
 skyFan:'assets/cloud-full-v1/fan.png',
 skyFlag:'assets/cloud-full-v1/flag.png',
 skyPylon:'assets/cloud-full-v1/pylon.png',
 skySnack:'assets/cloud-full-v1/snack.png',
 gearAtlas:'assets/gear-combat-v1/gear-atlas.png',
 gearWalk:'assets/gear-combat-v1/gear-walk-atlas.png',
 gearAttack:'assets/gear-combat-v1/gear-attacks.png',
 defaultAttack:'assets/gear-combat-v1/default-attacks.png',
 captainAttack:'assets/gear-combat-v1/captain-attacks.png',
 eggheadAttack:'assets/gear-combat-v1/egghead-attacks.png',
 tiles:'assets/world-v7/terrain-atlas.png',
 harbor:'assets/world-v7/harbor-background.png',
 sky:'assets/scene-followup-v1/tall-sky.png',
 cloudLab:'assets/cloud-discovery-v1/laboratory.png',
 cloudIsland:'assets/cloud-discovery-v1/cloud-island.png',
 marketFish:'assets/market-polish-v1/fish-market.png',
 warehouseWide:'assets/warehouse-polish-v1/warehouse-wide.png',
 warehouseAnnex:'assets/warehouse-polish-v1/warehouse-annex.png',
 marketSupply:'assets/market-polish-v1/supply-shop.png',
 food:'assets/gameplay-props-v2/food.png',
 projectile:'assets/gameplay-props-v2/projectile.png',
 cargoWarning:'assets/gameplay-props-v2/cargo-warning.png',
 breakableSeal:'assets/gameplay-props-v2/breakable-seal.png',
 districtGantry:'assets/scene-followup-v1/gantry-clean.png',
 districtCustoms:'assets/district-polish-v1/customs-house.png',
 districtHull:'assets/district-polish-v1/shipyard-hull.png',
 districtCabin:'assets/district-polish-v1/ship-cabin.png',
 guard:'assets/world-v7/guard-atlas.png',
 fullEnemies:'assets/level-v1/enemies-atlas.png',
 cannon:'assets/world-v7/cannon.png',
 trail:'assets/world-v7/charge-trail.png',
 impact:'assets/world-v7/impact.png',
 defaultAtlas:'assets/sprites-v2/captain-atlas.png',
 captainAtlas:'assets/pirate-captain-v1/captain-atlas.png',
 eggheadAtlas:'assets/sprites-v2/egghead-atlas.png',
 defaultWalk:'assets/walk-v3/captain-walk-atlas.png',
 captainWalk:'assets/pirate-captain-v1/captain-walk-atlas.png',
 eggheadWalk:'assets/walk-v3/egghead-walk-atlas.png',
};

for(const name of ['ruin','habitat','wreck','valve','gate','vent','pearl','console','bell','chest','kelp','reef-block','reef-ledge','metal-block','catwalk','jelly-0','jelly-1','jelly-2','jelly-3','sub-0','sub-1','sub-2','sub-3'])resources['reef_'+name]='assets/underwater-full-v1/'+name+'.png';
for(const hero of ['bonney','luffy'])for(const [suffix,file]of [['Atlas','atlas'],['Walk','walk-atlas'],['Attack','attacks']])resources[hero+'_diving'+suffix]='assets/underwater-v1/'+hero+'/diving-'+file+'.png';
for(const outfit of ['default','captain','egghead','gear'])for(const [suffix,file]of [['Atlas','atlas'],['Walk','walk-atlas'],['Attack','attacks']])resources['luffy_'+outfit+suffix]='assets/luffy-v1/'+outfit+'-'+file+'.png';

for(const name of ['crate','barrel','rope','lantern','boots','hat','coin','sign','goal','checkpoint'])resources['prop_'+name]='assets/world-v7/'+name+'.png';
for(const name of ['crane','hook','gate','winch','lever','bell','chest','perch'])resources['machine_'+name]='assets/machinery-v2/'+name+'.png';
const sounds={jump:440,coin:880,pickup:660,flight:740,charge:150,hurt:110,stomp:260,
 impact:80,break:190,checkpoint:980,win:1040,fall:100};
function sound(event){mixer.effect(sounds[event]||300);}
function restart(){mixer.unlock();mixer.restart();controller.clearActions();cameraState=undefined;game=createGame(selectedMode);camera=0;accumulator=0;walkDistance=0;started=true;paused=false;held.clear();edges.clear();canvas.focus();syncOverlay();}
function syncOverlay(){
 mixer.setPlaying(started&&!paused&&game.status==='playing'&&!document.hidden);
 document.querySelector('h1 span').textContent=game.mode==='full'?'Harbor Breakout':'Harbor Run';
 document.title='Bonney · '+(game.mode==='full'?'Harbor Breakout':'Tutorial');
 const terminal=game.status!=='playing';
 overlay.hidden=started&&!paused&&!terminal;
 if(terminal){
  overlayTitle.textContent=game.status==='won'?(game.scene==='underwater'?'Underwater route cleared!':game.scene==='cloud'?'Cloud course cleared!':'Harbor cleared!'):'Try another voyage';
  overlayText.textContent=game.status==='won'
   ?game.coins+' coins · '+game.defeated+' enemies · '+(game.treasures||[]).filter(t=>t.collected).length+'/3 treasures · '+Math.floor(game.time)+'s'
   :game.mode==='full'?'Retry from your checkpoint as adult. Treasures and secured mechanisms are kept.':'Adult → teenage → baby → out. Pick up an ability and give it another try.';
  playButton.textContent=(game.scene==='cloud'||game.scene==='underwater')&&game.status==='won'?'Return to harbor':game.mode==='full'&&game.status==='dead'?'Continue from checkpoint':'Play again';
 } else if(paused){
  overlayTitle.textContent='Paused';overlayText.textContent='Your ability timers are paused too.';
  playButton.textContent='Resume';
 } else {
  overlayTitle.textContent=game.mode==='full'?'Harbor Breakout':'Harbor Run · Tutorial';
  overlayText.textContent=game.mode==='full'?'Six districts. Four enemy types. Three secret treasures. Secure the gate and ship mechanisms to escape.':'Collect a power-up, cross the harbor, and reach the pink flag.';
  playButton.textContent=loaded?'Start playing':'Loading sprites…';playButton.disabled=!loaded;
 }
 document.querySelector('#pause').textContent=paused?'Resume':'Pause';
 document.querySelector('#controller-menu-hint').textContent=!started?'Controller: A / Start to play. LB / RB: character. D-pad left / right: course.':'Controller: A / Start to continue. LB / RB: character.';
}
playButton.addEventListener('click',()=>{
 mixer.unlock();
 controller.clearActions();
 if(game.scene==='underwater'&&game.status==='won'){leaveUnderwater(game);held.clear();edges.clear();canvas.focus();syncOverlay();return;}
 if(game.scene==='cloud'&&game.status==='won'){returnHarbor(game,{completed:true});game.status='playing';held.clear();edges.clear();canvas.focus();syncOverlay();}
 else if(paused){paused=false;canvas.focus();syncOverlay();}
 else if(game.mode==='full'&&game.status==='dead'){respawn(game);held.clear();edges.clear();accumulator=0;canvas.focus();syncOverlay();}
 else restart();
});
document.querySelector('#restart').addEventListener('click',restart);
const modeSelect=document.querySelector('#level-select');modeSelect.value=selectedMode;
modeSelect.addEventListener('change',()=>{selectedMode=modeSelect.value;restart();});
const characterSelect=document.querySelector('#character-select');characterSelect.value=selectedCharacter;
const syncCharacterName=()=>{document.querySelector('#character-name').textContent=characterLabel();document.title=characterLabel()+' · '+(game.scene==='underwater'?'Coral Current':game.scene==='cloud'?'Skyward Egghead':game.mode==='full'?'Harbor Breakout':'Tutorial');};
syncCharacterName();
characterSelect.addEventListener('change',()=>{
 selectedCharacter=characterSelect.value==='luffy'?'luffy':'bonney';
 try{localStorage.setItem('bonney.character',selectedCharacter);}catch{}
 syncCharacterName();canvas.focus();
});

function togglePause(){
 if(!started||game.status!=='playing')return;
 paused=!paused;controller.clearActions();held.clear();edges.clear();accumulator=0;syncOverlay();if(!paused)canvas.focus();
}
document.querySelector('#pause').addEventListener('click',togglePause);
document.querySelector('#sound').addEventListener('click',()=>{
 if(mixer.blocked)mixer.unlock();else {mixer.setMuted(!mixer.settings.muted);mixer.unlock();}
 syncAudioControls();
});
for(const channel of ['master','music','effects']){
 const slider=document.querySelector('#volume-'+channel);slider.value=Math.round(mixer.settings[channel]*100);
 slider.addEventListener('input',()=>{mixer.setLevel(channel,Number(slider.value)/100);mixer.unlock();syncAudioControls();});
}
function syncAudioControls(){
 const button=document.querySelector('#sound');button.textContent=mixer.blocked?'Enable audio':mixer.settings.muted?'Unmute':'Mute';button.setAttribute('aria-pressed',String(mixer.settings.muted));button.setAttribute('aria-label',mixer.blocked?'Enable audio':mixer.settings.muted?'Unmute all audio':'Mute all audio');
 for(const channel of ['master','music','effects']){const value=Math.round(mixer.settings[channel]*100);document.querySelector('#volume-'+channel+'-value').textContent=value+'%';}
 const status=document.querySelector('#music-status');if(status.textContent!==mixer.status)status.textContent=mixer.status;
}
syncAudioControls();
canvas.addEventListener('keydown',e=>{
 inputSource='keyboard';mixer.unlock();
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
  up:keys('ArrowUp','KeyW'),down:keys('ArrowDown','KeyS'),jumpHeld:keys('Space'),runHeld:keys('ShiftLeft','ShiftRight'),
  punchHeld:keys('KeyZ'),punchPressed:edges.has('KeyZ'),kickPressed:edges.has('KeyC'),jumpPressed:edges.has('Space'),abilityPressed:edges.has('KeyX'),interactPressed:edges.has('KeyE')};
 edges.clear();return controller.consume(i);
}
function pollController(){
 let pads=[];let unavailable=false;try{pads=navigator.getGamepads?.()||[];}catch{unavailable=true;}
 const state=controller.poll(pads),focused=document.hasFocus()&&!document.hidden;
 const controllerName=/360/i.test(state.id||'')?'Xbox 360 controller':/xbox|xinput/i.test(state.id||'')?'Xbox controller':'Controller';
 const message=unavailable?'Controller access unavailable. Keyboard controls remain available.':state.connected?(state.armed?controllerName+' connected':'Controller connected. Release buttons and center the stick.'):(state.unsupported?'Controller detected without a standard mapping. Try a current browser.':'Xbox / Xbox 360: connect your controller, then press and release a button.');
 if(message!==controllerStatus){controllerStatus=message;document.querySelector('#controller-status').textContent=message;}
 if(state.disconnected&&started&&!paused&&game.status==='playing'){togglePause();overlayText.textContent='Controller disconnected. Reconnect or use the keyboard to resume.';}
 if(!focused){controller.clearActions();return;}
 if(state.active)inputSource='controller';
 const m=state.menu,menuOpen=!started||paused||game.status!=='playing';
 if(menuOpen){
  if((m.confirmPressed||m.pausePressed)&&loaded){playButton.click();return;}
  if(m.previousCharacter||m.nextCharacter){characterSelect.value=selectedCharacter==='bonney'?'luffy':'bonney';characterSelect.dispatchEvent(new Event('change'));}
  if(!started&&(m.leftPressed||m.rightPressed)){selectedMode=selectedMode==='full'?'tutorial':'full';modeSelect.value=selectedMode;game=createGame(selectedMode);cameraState=undefined;syncOverlay();}
  controller.clearActions();
 }else if(m.pausePressed)togglePause();
}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h);}
const FONT = {
 '*':'010111010101000','+':'000010111010000','%':'101001010100101',
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
 s=controlHint(s,inputSource);
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
 const outfit=characterOutfit(p);
 const pose=characterFrame(p,walkDistance,game.time);
 const attacking=p.attackMs>0;
 const atlas=images[game.scene==='underwater'?selectedCharacter+'_diving'+(attacking?'Attack':pose.source==='walk'?'Walk':'Atlas'):characterSpriteKey(selectedCharacter,p,walkDistance)];
 ctx.save();
 if(pose.flip){ctx.translate(Math.round(x)+32,Math.round(y));ctx.scale(-1,1);}
 else ctx.translate(Math.round(x),Math.round(y));
 if(p.spinMs>0&&!attacking){ctx.translate(16,16);ctx.rotate((500-p.spinMs)/500*Math.PI*4);ctx.translate(-16,-16);}
 const walking=pose.source==='walk'||pose.source==='flight'||attacking;
 const cellWidth=walking?96:64,column=attacking?(p.attackKind==='kick'?1:0):pose.column;
 ctx.drawImage(atlas,column*cellWidth,pose.row*64,cellWidth,64,walking?-8:0,0,cellWidth/2,32);
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
function pickupIcon(power,x,y){
 if(power==='gear'){ctx.drawImage(images.gearPickup,x-2,y-2+Math.sin(game.time*4)*1.5,20,20);return;}
 if(game.mode==='full'){ctx.save();ctx.translate(x+8,y+8);ctx.scale(.8,.8);pickup(ctx,images,power,-8,-8,game.time);ctx.restore();}
 else pickup(ctx,images,power,x,y,game.time);
}
function background(){if(game.scene==='underwater'){underwaterBackground(ctx,images,camera,cameraY);return;}if(game.scene==='cloud'){cloudBackground(ctx,images,camera,game.time);return;}const quiet=game.mode==='full'?1:0;harborBackground(ctx,images,camera,game.time,quiet,game.mode==='full'?Math.max(0,(224-cameraY)*.45):0);}
function mission(){
 if(game.scene==='underwater')return underwaterMission(game);
 if(game.scene==='cloud'){if(!game.latches.reactorSeal&&game.player.x>=1920)return 'Gear: charge a punch through the cracked reactor casing.';if(!game.latches.skyConsole&&game.player.x>=1920)return 'Lift online. Choose Egghead, ride up and press E at the console.';return 'Reach the cyan sky flag. Falling drops you back into the harbor.';}
 if(game.mode!=='full')return 'Tutorial: collect a power-up and reach the pink flag.';
 const l=game.latches;
 if(game.player.x<3200)return 'Explore the harbor. Watch for cracked cargo, high glints, and safe power-up swaps.';
 if(!l.customsLock)return 'Customs Gate: break the marked lock with Captain.';
 if(!l.customsLever)return 'Customs Gate: reach the upper lever with Egghead and press E.';
 if(game.player.x<5280)return 'Gate opened. Cross the shipyard and watch the cargo-drop warnings.';
 if(game.player.x>=6256&&!game.gates.every(s=>s.requires.every(id=>l[id])))return 'Exit sealed: secure both gate mechanisms.';
 if(!l.winch)return 'Flagship: break the winch lock with Captain.';
 if(!l.rigging)return 'Rigging is moving. Ride or fly up with Egghead and press E at the switch.';
 return 'Boarding route secured. Reach the pink flag. Optional treasures remain yours to discover.';
}

function render(dt=1/60){
 if(!loaded)return;
 ctx.setTransform(2,0,0,2,0,0);
 const p=game.player;
 for(const [el,label]of keyboardGuideText){const next=controlHint(label,inputSource);if(el.textContent!==next)el.textContent=next;}
 document.querySelector('#sky-guide').hidden=game.scene!=='cloud';
 document.querySelector('#water-guide').hidden=game.scene!=='underwater';
 const courseTitle=game.scene==='underwater'?'Coral Current':game.scene==='cloud'?'Skyward Egghead':game.mode==='full'?'Harbor Breakout':'Harbor Run';
 if(document.querySelector('h1 span').textContent!==courseTitle){document.querySelector('h1 span').textContent=courseTitle;document.title=characterLabel()+' · '+courseTitle;}
 const objective=document.querySelector('#objective');const instruction=inPolishedDistrict(game)&&game.noticeMs>0?game.notice:mission();const objectiveText=game.mode==='full'?game.zones.filter(z=>p.x>=z.x).at(-1).name+' · '+instruction:instruction;if(objective.textContent!==controlHint(objectiveText,inputSource))objective.textContent=controlHint(objectiveText,inputSource);
 cameraState=followCamera(game,cameraState,paused?0:dt);camera=cameraState.x;cameraY=cameraState.y;
 recordCameraView(game,{x:camera,y:cameraY,scene:game.scene||'harbor'});
 background();
 ctx.save();ctx.translate(0,-Math.round(cameraY));
 if(game.scene==='underwater')reefArchitecture(ctx,images,camera);else if(game.scene==='cloud')cloudArchitecture(ctx,images,camera);else if(game.mode==='full'){districtBackground(ctx,game,camera,images);hiddenCloudBank(ctx,images,game,camera,text);}
 for(const s of game.platforms){
  if(game.scene==='underwater'){reefPlatform(ctx,images,s,camera);continue;}
  if(game.scene==='cloud'){cloudPlatform(ctx,images,s,camera);continue;}
  if(s.x+s.w<camera-16||s.x>camera+400||s.kind==='perch'||s.kind==='roof'||s.kind==='gateRoof')continue;
  for(let x=s.x;x<s.x+s.w;x+=16){
   tile(s.h===8?2:0,x-camera,s.y);
   if(s.h>8)for(let y=s.y+16;y<s.y+s.h;y+=16)tile(1,x-camera,y);
  }
  if(s.h===8&&game.mode!=='full')dockSupports(ctx,s,camera);
 }
 if(game.scene==='cloud'||game.scene==='underwater'){}else if(game.mode==='full')groundDecor(ctx,images,game,camera);else harborDecor(ctx,images,camera,game.time);
 for(const c of game.crates)if(c.hp>0){
  if(game.scene==='underwater')continue;
  if(game.scene==='cloud'){ctx.drawImage(images.skyCasing,c.x-camera,c.y,c.w,c.h);continue;}
  if(game.mode==='full'&&c.latch&&c.latch!=='cabinSeal')continue;
  for(let y=c.y;y<c.y+c.h;y+=16){
   if(game.mode==='full'&&(c.secret||c.latch==='cabinSeal'))ctx.drawImage(images.breakableSeal,c.x-camera,y,16,Math.min(16,c.y+c.h-y));
   else tile(4,c.x-camera,y);
  }
 }
 for(const c of game.coinsList)if(!c.collected){
  if(game.mode==='full')ctx.drawImage(images.tiles,192,0,32,32,Math.round(c.x-camera+1),c.y+2,8,8);
  else tile(6,c.x-camera-3,c.y);
 }
 for(const item of game.pickups){
  const near=Math.abs(p.x-item.x)<72&&Math.abs(p.y-item.y)<64;
  if(item.requiresInteract){rect(item.x-camera-3,item.y+20,22,4,'#526876');rect(item.x-camera-1,item.y+20,18,1,item.respawnMs>0?'#9c8ba6':'#9bf0d1');}
  if(item.respawnMs===0){
   pickupIcon(item.power,item.x-camera,item.y);
   const label=item.power==='gear'?'GEAR':item.power==='egghead'?'FLY':'DASH';
   if(!inPolishedDistrict(game)||near)text(item.requiresInteract?(p.power===item.power?'EQUIPPED':'E: '+label):label,item.x-camera-10,item.y-12,'#fff0ce',6);
  }else if(item.requiresInteract&&near)text('REFILL '+Math.ceil(item.respawnMs/1000)+'S',item.x-camera-10,item.y-12,'#b9d4e1',6);
 }

 if(game.scene==='underwater')reefDetails(ctx,images,game,camera,text);else if(game.scene==='cloud')cloudDetails(ctx,images,game,camera,text);
 else if(game.mode==='full')fullDetails(ctx,images,game,camera,text);
 else {
  for(const [x,label]of [[32,'HARBOR RUN'],[360,'DOUBLE JUMP'],[736,'X: CANNONBALL'],[1000,'CHECKPOINT'],[1430,'FINAL STRETCH']]){
   sign(ctx,images,x-camera,56,label.length*4+12);text(label,x-camera+6,67,'#fff0ce');
  }
  flag(ctx,images,'checkpoint',984-camera,176,game.checkpointReached,game.time);
  flag(ctx,images,'goal',1860-camera,176,false,game.time);
 }
 for(const e of game.enemies)if(e.hp>0){
  if(game.scene==='underwater')reefEnemy(ctx,images,e,game.time,camera);else if(game.scene==='cloud')cloudEnemy(ctx,images,e,game.time,camera);
  else if(game.mode!=='full'||!fullEnemy(ctx,images,e,game.time,camera))guard(ctx,images,e,game.time,camera);
 }
 const charge=p.ability==='active'&&p.power==='pirateCaptain'; const fly=p.ability==='active'&&p.power==='egghead';
 if(p.invulnerableMs<=0||Math.floor(p.invulnerableMs/80)%2===0){
  const x=p.x-camera-8,y=p.y-3;
  if(charge){
   image('trail',x-p.facing*25,y+10,p.facing<0);image('cannon',x,y,p.facing<0);
  } else {
   drawFlightJets(ctx,images,p,selectedCharacter,x,y,game.time,jumpIsHeld());
   drawCharacter(p,x,y);
  }
 }
 if(p.chargingPunch){const r=3+Math.min(1,p.chargePunchMs/700)*5,fx=p.x-camera+(p.facing>0?20:-4),fy=p.y+12;ctx.strokeStyle=p.chargePunchMs>=700?'#fff7c4':'#ca8ee6';ctx.lineWidth=1;ctx.beginPath();ctx.arc(fx,fy,r,0,Math.PI*2);ctx.stroke();}
 if(p.attackKind==='charged'&&p.attackMs>0){const b=attackBounds(p);if(b){const fx=(p.facing>0?b.x+b.w-5:b.x+5)-camera,fy=b.y+10;
  ctx.save();ctx.translate(Math.round(fx),Math.round(fy));ctx.scale(p.facing,1);
  rect(-15,-3,10,6,'#cfb3d9');rect(-13,-2,9,4,'#fff7e9');
  rect(-5,-6,10,12,'#735d91');rect(-7,-3,14,6,'#735d91');
  rect(-4,-5,8,10,'#f5cfb6');rect(-6,-2,12,4,'#f5cfb6');
  for(let n=-3;n<=3;n+=3)rect(0,n,4,1,'#d39f9f');rect(-5,2,4,2,'#ffead2');
  ctx.restore();}}
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
 if(game.scene!=='cloud'&&game.scene!=='underwater')harborWater(ctx,images,game.time,game.mode==='full'?432-Math.round(cameraY):208);
 // HUD remains fixed while the world scrolls.
 if(inPolishedDistrict(game)){
  rect(0,0,384,28,'#172538');rect(0,27,384,1,'#b69b69');
  for(let i=0;i<3;i++)heart(7+i*13,5,i<p.hits);
  text(AGE_NAMES[p.hits].toUpperCase(),51,7,'#e9e8ec');
  if(p.power!=='none')text('+',91,7,'#cba4e8');
  text('COINS '+game.coins,7,20,'#ffd363');
  text('T '+game.treasures.filter(t=>t.collected).length+'/'+game.treasures.length,63,20,'#e9e8ec');
  if(game.skyChartCollected)text('*',98,20,'#ef99d5');
  text(game.scene==='underwater'?'SEALED SUIT':p.power==='none'?'FIND A POWER':p.power==='gear'?'GEAR':p.power==='egghead'?'EGGHEAD':'CAPTAIN',112,6,'#cba4e8');
  text(game.scene==='underwater'?'WALK / JUMP':p.power==='gear'?'HOLD Z: CHARGE':p.power==='egghead'?'DOUBLE JUMP':p.power==='pirateCaptain'?'X: CHARGE':'EXPLORE',112,20,'#c2cdd6');
  const label=game.scene==='underwater'?'E: VALVE / RELAY':p.chargingPunch?'PUNCH '+Math.min(100,Math.floor(p.chargePunchMs/7))+'%':p.power==='none'?'NO POWER':p.ability==='ready'?'READY':p.ability==='active'?
   (p.power==='egghead'?'FUEL ':'DASH ')+(p.activeMs/1000).toFixed(1)+'s':'CHARGE '+Math.floor(100*(1-p.cooldownMs/CONFIG.cooldownMs))+'%';
  text(label,230,6);
  const f=game.scene==='underwater'?game.switches.filter(s=>game.latches[s.id]).length/4:p.chargingPunch?Math.min(1,p.chargePunchMs/700):p.power==='none'?0:p.ability==='ready'?1:p.ability==='active'?p.activeMs/(p.power==='egghead'?CONFIG.flightMs:CONFIG.chargeMs):1-p.cooldownMs/CONFIG.cooldownMs;
  rect(229,17,147,7,'#0c1624');rect(230,18,145,5,'#435764');
  rect(230,18,Math.round(145*f),5,p.ability==='cooldown'?'#ffd363':'#b17ad1');
 }else{

 rect(0,0,384,38,'#172538');rect(0,0,384,1,'#506877');rect(0,37,384,1,'#b69b69');
 rect(104,6,1,26,'#33495c');rect(222,6,1,26,'#33495c');
 for(let i=0;i<3;i++)heart(7+i*13,5,i<p.hits);
 text(AGE_NAMES[p.hits].toUpperCase()+' / '+p.hits+' HITS',7,23,'#e9e8ec',7);
 text(p.power==='none'?'NO POWER-UP':p.power==='gear'?'GEAR':p.power==='egghead'?'EGGHEAD':'CAPTAIN',112,5,'#cba4e8',8);
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
 }
 const announcement=AGE_NAMES[p.hits]+', '+p.hits+' hits. '+p.ability;
 if(announcement!==announced&&p.ability==='ready'){live.textContent=announcement;announced=announcement;}
 frame++;
}
function loop(now){
 pollController();
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
 mixer.setPlaying(started&&!paused&&game.status==='playing'&&!document.hidden);syncAudioControls();
 render(dt);requestAnimationFrame(loop);
}
Promise.all(Object.entries(resources).map(([key,url])=>new Promise((resolve,reject)=>{
 const im=new Image();im.onload=()=>{images[key]=im;resolve();};im.onerror=()=>reject(new Error('Could not load '+url));im.src=url;
}))).then(()=>{loaded=true;syncOverlay();requestAnimationFrame(loop);}).catch(error=>{
 overlayTitle.textContent='Could not load game art';overlayText.textContent=error.message;playButton.disabled=true;console.error(error);
});
if(new URLSearchParams(location.search).has('test'))
 window.__bonney={get game(){return game;},get loaded(){return loaded;},get paused(){return paused;},restart,
  get audio(){return mixer;},get controller(){return {connected:controller.key!==null,armed:controller.armed,source:inputSource};},get camera(){return {x:camera,y:cameraY};},get renderedFrames(){return frame;},get animationFrame(){return characterFrame(game.player,walkDistance,game.time);},get flightJets(){return flightJetLayout(selectedCharacter,game.player,game.time,jumpIsHeld());},get selectedCharacter(){return selectedCharacter;},get spriteKey(){return characterSpriteKey(selectedCharacter,game.player,walkDistance);}};

