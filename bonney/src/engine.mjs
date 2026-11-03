import {selectedSupply} from './puzzle-effects.mjs';
import {playerHurtbox} from './player-body.mjs';
import {WATER_PHYSICS,enterUnderwater,leaveUnderwater} from './underwater-level.mjs';
import {CLOUD_BUILDINGS} from './cloud-data.mjs';
import {prepareCombat,resolveCombat,resetCombat} from './combat.mjs';
import {recordSecretLaunch,secretCourseUpdate,returnHarbor} from './cloud-level.mjs';
import {BUILDINGS,roofHeight} from './remaining-scene.mjs';
import {fullLevelData} from './level-data.mjs';
import {beforeLevel,afterLevel,gateClosed,respawn} from './encounters.mjs';
export const CONFIG = Object.freeze({
  width: 1920, height: 216, playerW: 16, playerH: 28,
  speed: 105, runSpeed: 168, gravity: 760, jump: 255, flightMs: 5000,
  cooldownMs: 5000, chargeMs: 550, chargeSpeed: 360, invulnerableMs: 1200,
});
export const AGE_NAMES = ['dead', 'baby', 'teenage', 'adult'];
export const overlaps = (a,b) => a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
const ground = (x,w,y=176,h=40) => ({x,y,w,h});
function createTutorial() {
  return {
    player: {x:24,y:148,w:16,h:28,vx:0,vy:0,facing:1,hits:3,power:'none',ability:'ready',
      activeMs:0,cooldownMs:0,invulnerableMs:0,grounded:true},
    status:'playing',time:0,coins:0,defeated:0,checkpoint:24,checkpointReached:false,
    platforms:[ground(0,304),ground(336,304),ground(688,256),ground(976,304),
      ground(1328,592),ground(240,48,140,8),ground(432,64,128,8),
      ground(624,80,136,8),ground(784,64,120,8),ground(1168,64,136,8),
      ground(1456,64,128,8)],
    pickups:[
      {x:120,y:152,w:16,h:16,power:'egghead',respawnMs:0},
      {x:752,y:152,w:16,h:16,power:'pirateCaptain',respawnMs:0},
      {x:1104,y:152,w:16,h:16,power:'egghead',respawnMs:0},
      {x:1424,y:152,w:16,h:16,power:'pirateCaptain',respawnMs:0},
    ],
    coinsList:[160,224,256,352,448,480,560,704,816,864,1008,1072,1184,1232,1344,1472,1536,1696,1760]
      .map((x,i)=>({x,y:[154,145,118][i%3],w:10,h:12,collected:false})),
    enemies:[{x:528,min:512,max:592},{x:864,min:848,max:912},
      {x:1040,min:1000,max:1072},{x:1536,min:1500,max:1580},
      {x:1664,min:1632,max:1728},{x:1760,min:1736,max:1800}]
      .map(e=>({...e,y:148,w:16,h:28,hp:3,dir:1})),
    crates:[896,1088,1584].map(x=>({x,y:160,w:16,h:16,hp:1})),
    events:[],particles:[],notice:'Find the purple Egghead pickup. Jump, then jump again to fly.',
    noticeMs:6000,
  };
}
export function createGame(mode='tutorial'){
 const g=createTutorial();
 if(mode!=='full'){g.mode='tutorial';g.width=CONFIG.width;g.height=CONFIG.height;return g;}
 Object.assign(g,fullLevelData(),{projectiles:[],latches:{},deaths:0,checkpointIndex:-1,checkpoint:32,
 checkpointState:{x:32,y:372,power:'none'},notice:'Harbor Breakout: reach the flagship. E operates marked switches.',noticeMs:6000});
 Object.assign(g.player,g.start,{grounded:true});
 for(const e of g.enemies)e.maxHp=e.hp;
 return g;
}
export {respawn};export function endAbility(p) {
  if (p.ability !== 'active') return;
  p.ability='cooldown';p.activeMs=0;p.cooldownMs=CONFIG.cooldownMs;p.vx=0;
}
export function equipPower(game,power) {
  const p=game.player;
  if(p.power===power)return;
  endAbility(p);
  p.ability='ready';p.activeMs=0;p.cooldownMs=0;
  p.power=power;resetCombat(p);
  if(game.scene==='cloud')game.checkpointState.power=power;
  if(power==='gear')game.gearUnlocked=true;
  game.events.push('pickup');
  game.notice=power==='gear'?'Gear equipped: spin double jump. Hold Z, release to punch.':power==='egghead'?'Egghead equipped: double jump to fly.':'Captain equipped: press X to charge.';
  game.noticeMs=4000;
}
export function activateAbility(game) {
  const p=game.player;
  if(game.status!=='playing'||p.ability==='active'||(p.power==='none'||p.power==='gear'))return false;
  const charge=p.ability==='ready'?1:Math.max(0,Math.min(1,1-p.cooldownMs/CONFIG.cooldownMs));
  if(charge<=0)return false;
  p.ability='active';p.activeMs=(p.power==='egghead'?CONFIG.flightMs:CONFIG.chargeMs)*charge;
  p.cooldownMs=0;
  if(p.power==='egghead'){recordSecretLaunch(game,charge);p.vy=0;}
  else {p.vx=p.facing*CONFIG.chargeSpeed;p.vy=0;}
  game.events.push(p.power==='egghead'?'flight':'charge');return true;
}
export function damagePlayer(game,{fall=false}={}) {
  const p=game.player;
  if(game.status!=='playing'||(!fall&&p.invulnerableMs>0))return false;
  if(!fall&&p.power!=='none'){
    resetCombat(p,{keepAir:true});endAbility(p);p.power='none';p.ability='ready';p.activeMs=0;p.cooldownMs=0;
    p.invulnerableMs=CONFIG.invulnerableMs;p.pickupLockMs=900;p.grounded=false;p.vy=-130;p.vx=-p.facing*60;
    game.secretLaunchEligible=false;game.events.push('hurt','powerLost');game.notice='Power lost! Find another pickup.';game.noticeMs=2800;return true;
  }
  resetCombat(p,{keepAir:true});p.hits=Math.max(0,p.hits-1);game.events.push('hurt');
  if(!p.hits){game.status='dead';endAbility(p);return true;}
  p.invulnerableMs=CONFIG.invulnerableMs;
  if(fall){endAbility(p);p.x=game.checkpoint;p.y=game.mode==='full'?game.checkpointState.y:148;p.vx=0;p.vy=0;p.grounded=true;}
  else {p.vy=-130;p.vx=-p.facing*60;p.grounded=false;}
  return true;
}
function timer(p,dtMs,input) {
  p.invulnerableMs=Math.max(0,p.invulnerableMs-dtMs);p.pickupLockMs=Math.max(0,(p.pickupLockMs||0)-dtMs);
  if(p.ability==='active'){
    if(p.power!=='egghead'||(input.jumpHeld&&!p.grounded))p.activeMs=Math.max(0,p.activeMs-dtMs);
    if(p.activeMs===0&&p.power!=='egghead')endAbility(p);
  } else if(p.ability==='cooldown'){
    p.cooldownMs=Math.max(0,p.cooldownMs-dtMs);
    if(p.cooldownMs===0){p.ability='ready';}
  }
}
export function update(game,dt,input={}) {
  if(game.status!=='playing')return;
  const p=game.player,ms=dt*1000,wet=game.scene==='underwater';
  if(wet&&input.interactPressed&&p.x>=56&&p.x<=120&&p.grounded&&Math.abs(p.y+p.h-1056)<8){leaveUnderwater(game);return;}
  game.events=[];game.time+=dt;timer(p,ms,input);prepareCombat(game,dt,input);
  for(const e of game.enemies)e.stunMs=Math.max(0,(e.stunMs||0)-ms);
  if(game.mode==='full')beforeLevel(game,dt,input);
  game.noticeMs=Math.max(0,game.noticeMs-ms);
  for(const item of game.pickups)item.respawnMs=Math.max(0,item.respawnMs-ms);
  if(input.abilityPressed&&p.power==='pirateCaptain')activateAbility(game);
  if(game.mode==='full'){
    p.coyoteMs=p.grounded?90:Math.max(0,(p.coyoteMs||0)-ms);
    p.jumpBufferMs=input.jumpPressed?100:Math.max(0,(p.jumpBufferMs||0)-ms);
    if(p.jumpBufferMs>0&&(p.grounded||p.coyoteMs>0)){
      p.vy=-(wet?WATER_PHYSICS.jump:CONFIG.jump);p.grounded=false;p.jumpCutAvailable=true;p.coyoteMs=0;p.jumpBufferMs=0;game.events.push('jump');
    }else if(input.jumpPressed&&!wet&&p.power==='gear'&&!p.airJumpUsed){p.vy=-CONFIG.jump;p.grounded=false;p.airJumpUsed=true;p.jumpCutAvailable=true;p.spinMs=500;p.jumpBufferMs=0;game.events.push('jump');}
    else if(input.jumpPressed&&!wet&&p.power==='egghead'){p.jumpBufferMs=0;activateAbility(game);}
  }else if(input.jumpPressed) {
    if(p.grounded){p.vy=-CONFIG.jump;p.grounded=false;p.jumpCutAvailable=true;game.events.push('jump');}
    else if(p.power==='gear'&&!p.airJumpUsed){p.vy=-CONFIG.jump;p.airJumpUsed=true;p.jumpCutAvailable=true;p.spinMs=500;game.events.push('jump');}
    else if(p.power==='egghead')activateAbility(game);
  }
  const gearLunge=p.attackMs>0&&p.attackKind==='charged';
  const charging=(p.ability==='active'&&p.power==='pirateCaptain')||gearLunge;
  const flying=p.ability==='active'&&p.power==='egghead'&&p.activeMs>0;
  if(p.jumpCutAvailable&&input.jumpHeld===false&&!input.jumpPressed&&!flying&&!charging){p.vy=Math.max(p.vy,-(wet?150:135));p.jumpCutAvailable=false;}
  const move=(input.right?1:0)-(input.left?1:0);
  if(move&&!charging)p.facing=move;
  if(charging)p.vx=p.facing*(gearLunge?300:CONFIG.chargeSpeed);
  else p.vx=move*(input.runHeld?CONFIG.runSpeed:CONFIG.speed)*(p.power==='gear'?1.5:1)*(wet?WATER_PHYSICS.speed:1);
  if(flying&&input.jumpHeld)p.vy=-90;
  else if(!charging)p.vy=Math.min(wet?WATER_PHYSICS.terminal:300,p.vy+(wet?WATER_PHYSICS.gravity:CONFIG.gravity)*dt);
  else p.vy=0;
  const solids=[...game.platforms.filter(s=>s.kind!=='roof'&&s.kind!=='skyRoof'&&!(s.fadeMs>0)),...(game.movers||[]),...(game.gates||[]).filter(s=>gateClosed(game,s)).map(s=>({...s,y:-448,h:game.height+896})),...game.crates.filter(c=>c.hp>0)];
  const roofAt=x=>game.mode==='full'&&!wet?(game.scene==='cloud'?CLOUD_BUILDINGS:BUILDINGS).find(b=>x>=b.x+b.roof[0][0]*b.w&&x<=b.x+b.roof.at(-1)[0]*b.w):undefined;
  const previousRoof=roofAt(p.x+p.w/2);
  const onRoof=p.grounded&&p.vy>=0&&previousRoof&&Math.abs(p.y+p.h-roofHeight(previousRoof,p.x+p.w/2))<1;
  const oldX=p.x;
  p.x=Math.max(0,Math.min(game.width-p.w,p.x+p.vx*dt));
  for(const s of solids)if(!s.oneWay&&overlaps(p,s)){
    if(charging&&'hp' in s&&(!s.requires||game.latches?.[s.requires])){s.hp=0;game.events.push('break');continue;}
    if(oldX+p.w<=s.x+0.01){p.x=s.x-p.w;p.vx=0;if(charging){endAbility(p);if(gearLunge)p.attackMs=0;}}
    else if(oldX>=s.x+s.w-0.01){p.x=s.x+s.w;p.vx=0;if(charging){endAbility(p);if(gearLunge)p.attackMs=0;}}
  }
  const oldBottom=p.y+p.h,oldTop=p.y;
  p.y+=p.vy*dt;p.grounded=false;
  for(const s of solids)if((!('hp' in s)||s.hp>0)&&overlaps(p,s)){
    if(oldBottom<=s.y+0.1&&p.vy>=0){p.y=s.y-p.h;p.vy=0;p.grounded=true;}
    else if(!s.oneWay&&oldTop>=s.y+s.h-0.1&&p.vy<0){p.y=s.y+s.h;p.vy=0;}
  }
  // Continuous foot contact replaces the old 16px roof collision steps.
  const currentRoof=roofAt(p.x+p.w/2);
  if(currentRoof&&p.vy>=0){
   const surface=roofHeight(currentRoof,p.x+p.w/2);
   const previousSurface=roofHeight(currentRoof,oldX+p.w/2);
   if((onRoof&&currentRoof===previousRoof)||(oldBottom<=previousSurface+.1&&p.y+p.h>=surface)){
    p.y=surface-p.h;p.vy=0;p.grounded=true;
   }
  }
  p.y=Math.max(game.mode==='full'?(game.scene==='cloud'?0:-420):40,p.y);
  if(p.grounded){p.airJumpUsed=false;p.spinMs=0;p.jumpCutAvailable=false;}
  // Landing ends the flight session, whether or not fuel remains.
  if(p.grounded&&p.ability==='active'&&p.power==='egghead')endAbility(p);
  const choice=selectedSupply(game,input);
  for(const item of game.pickups)if(item.respawnMs===0&&!(p.pickupLockMs>0)&&(item.requiresInteract?item===choice:overlaps(p,item))&&p.power!==item.power){
    equipPower(game,item.power);item.respawnMs=item.restockMs||8000;
  }
  for(const c of game.coinsList)if(!c.collected&&overlaps(p,c)){c.collected=true;game.coins++;game.events.push('coin');}
  resolveCombat(game);
  for(const e of game.enemies) {
    if(e.hp<=0)continue;
    if((!e.type||e.type==='patrol')&&!(e.stunMs>0))e.x+=e.dir*23*dt;
    if((!e.type||e.type==='patrol')&&e.x<e.min){e.x=e.min;e.dir=1;}else if((!e.type||e.type==='patrol')&&e.x>e.max){e.x=e.max;e.dir=-1;}
    if(overlaps(p,e)){
      if(p.ability==='active'&&p.power==='pirateCaptain'){
        const front=e.dir>0?p.x+p.w/2>e.x+e.w/2:p.x+p.w/2<e.x+e.w/2;
        if(e.type==='shield'&&e.state!=='recover'&&front){endAbility(p);damagePlayer(game);game.events.push('block');}
        else {e.hp=0;game.defeated++;game.events.push('impact');}
      }else if(p.vy>0&&oldBottom<=e.y+5){
        e.hp--;p.y=e.y-p.h;p.vy=-180;game.events.push('stomp');
        if(e.hp===0)game.defeated++;
      }else if(!(e.stunMs>0)&&overlaps(playerHurtbox(p),e))damagePlayer(game);
    }
  }
  if(game.mode==='full'&&!wet&&game.scene!=='cloud'&&p.y+p.h>=432){enterUnderwater(game);return;}
  if(p.y>game.height+16&&game.scene==='cloud'){returnHarbor(game,{fall:true});return;}
  if(p.y>game.height+16){damagePlayer(game,{fall:true});game.events.push('fall');}
  if(game.mode==='full'){afterLevel(game,dt,input,damagePlayer);if(wet&&game.status==='won')game.nextLevelEntry={...game.exitDestination};if(!wet)secretCourseUpdate(game,input);return;}
  if(!game.checkpointReached&&p.x>=976){
    game.checkpoint=984;game.checkpointReached=true;
    game.notice='Checkpoint reached. Try the other power-up ahead.';game.noticeMs=4000;game.events.push('checkpoint');
  }
  if(p.x>=1848&&game.status==='playing'){game.status='won';game.events.push('win');}
}
