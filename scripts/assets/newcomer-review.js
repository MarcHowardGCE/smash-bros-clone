const manifest=window.NEWCOMER_MANIFEST,canvas=document.querySelector('#preview'),ctx=canvas.getContext('2d'),info=document.querySelector('#frame-info'),slider=document.querySelector('#timeline'),images={};
let clip='idle',tick=0,playing=true,mirror=false,original=false,sequence=false,accum=0,last=performance.now();
const characters=()=>Object.entries(original?manifest.baselineCharacters:manifest.characters);
const total=c=>c.durations.reduce((a,b)=>a+b,0);
const crouchPhases=[['idle',8],['crouch_enter',4],['crouch_hold',36],['crouch_exit',4],['idle',8]];
const helplessPhases=[['helpless_enter',9],['helpless_loop',12],['helpless_land',20]];
const reactionPhases=[['idle',8],['hit_mid',5],['hit_air',5],['ko_launch',9],['tumble',24],['tumble_recover',14]];
const jumpPhases=[['idle',8],['jump_squat',3],['jump',10],['double_jump_transition',6],['air_apex_loop',8],['air_fastfall_loop',10],['land_heavy',15],['idle',8]];
const pairedClips={
  footstool_attacker:'footstool_air_victim',footstool_ground_preview:'footstool_ground_victim',grab:'grabbed',grab_dash:'grab_dash_victim_preview',grab_pivot:'grab_pivot_victim_preview',grab_hold:'grabbed_hold_preview',pummel:'pummel_victim',
  grab_release:'grab_release_victim_preview',forward_throw:'throw_victim',
  back_throw:'back_throw_victim_preview',up_throw:'up_throw_victim_preview',down_throw:'down_throw_victim_preview',
};
const throwTravel={forward_throw:[205,-55],back_throw:[-205,-55],up_throw:[0,-105],down_throw:[70,0]};
let swapPair=false;
function pairPlacement(i,age){
  const actors=characters().map(([,char])=>char);
  const actor=actors[swapPair?1:0];
  const victim=actors[swapPair?0:1];
  const direction=mirror?-1:1;
  if(clip.startsWith('footstool_')){
    const frame=frameAt(actor.clips[clip],age);
    const name=pairedClips[clip];
    const receiver=victim.clips[name].frames[frame];
    const [x,y]=receiver.footstoolContact??[0,-175];
    const floor=clip==='footstool_ground_preview'?365:384;
    const separation=frame===0?-12:frame===2?-20-(age-8)*2:0;
    return i===0?{char:actor,name:clip,origin:600+x*direction,base:floor+y+separation,facing:direction}:
      {char:victim,name,origin:600,base:floor,facing:direction};
  }
  const attack=actor.clips[clip];
  const frame=frameAt(attack,age);
  const pivot=clip==='grab_pivot';
  const moving=pivot||clip==='grab_dash';
  const actorFacing=pivot&&frame===2?-direction:direction;
  const approach=moving&&frame===0?(1-age/Math.max(1,attack.durations[0]-1))*42:0;
  const anchor=600-62*direction-approach*direction;
  if(i===0)return {char:actor,name:clip,origin:anchor,base:365,facing:actorFacing};
  const name=pairedClips[clip];
  const reaction=victim.clips[name];
  const travel=throwTravel[clip];
  const release=frame===2&&(travel||clip==='grab_release');
  const contactIndex=release?1:frame;
  const hand=attack.frames[contactIndex].grabContact;
  const chest=reaction.frames[contactIndex].grabContact;
  const victimFacing=pivot?1:travel&&contactIndex===1&&clip!=='back_throw'&&clip!=='down_throw'?1:-1;
  const attached=hand&&chest;
  const distance=attached?hand[0]*(actorFacing/direction)-chest[0]*victimFacing:(pivot?-150:150)+(moving?approach:0);
  const height=attached?hand[1]-chest[1]:0;
  const progress=release?(age-attack.durations[0]-attack.durations[1]+1)/attack.durations[2]:0;
  const [dx,dy]=travel??[152,0];
  return {char:victim,name,origin:anchor+(distance+(dx-distance)*progress)*direction,
    base:365+height+(dy-height)*progress,facing:victimFacing*direction};
}
const dodgeVectors={
  air_dodge_neutral:[0,0],air_dodge_up:[0,-22],air_dodge_side:[75,0],
  air_dodge_down:[0,22],air_dodge_back:[-75,0],air_dodge_up_diagonal:[54,-17],
  air_dodge_down_diagonal:[54,17],air_dodge_up_back:[-54,-17],air_dodge_down_back:[-54,17],
};
function dodgePlacement(char,current,base){
  const name=sequence==='dodge'?clip:current.clip;
  const vector=dodgeVectors[name];
  if(!vector)return {base,offset:0};
  const dodge=char.clips[name];
  const [startup,travel,recovery]=dodge.durations;
  const landing=current.clip==='air_dodge_land';
  const amount=landing?1:Math.max(0,Math.min(1,(current.tick-startup+1)/travel));
  const offset=vector[0]*amount*(mirror?-1:1);
  if(landing)return {base,offset};
  base+=vector[1]*amount;
  if(sequence==='dodge'){
    const progress=Math.max(0,(current.tick-startup-travel+1)/recovery);
    const landingClip=char.clips.air_dodge_land;
    const clearance=bottomClearance(dodge,dodge.frames.at(-1))-bottomClearance(landingClip,landingClip.frames[0]);
    base+=(365+clearance-(315+vector[1]))*progress;
  }
  return {base,offset};
}
const squatPreview=()=>!sequence&&clip==='jump_squat';
function duration(){
  if(squatPreview())return 36;
  if(sequence==='dodge')return total(characters()[0][1].clips[clip])+total(characters()[0][1].clips.air_dodge_land);
  if(sequence==='aerial')return total(characters()[0][1].clips[clip])+total(characters()[0][1].clips.land_soft);
  if(sequence==='crouch')return crouchPhases.reduce((sum,[,ticks])=>sum+ticks,0);
  if(sequence==='helpless')return helplessPhases.reduce((sum,[,ticks])=>sum+ticks,0);
  if(sequence==='reaction')return reactionPhases.reduce((sum,[,ticks])=>sum+ticks,0);
  if(sequence==='jump')return jumpPhases.reduce((sum,[,ticks])=>sum+ticks,0);
  return sequence?24+total(characters()[0][1].clips.jab):Math.max(...characters().map(([,c])=>total(c.clips[clip])));
}
function phase(){
  if(squatPreview())return tick<12?{clip,tick:Math.floor(tick/4)}:{clip:'idle',tick:0};
  if(!sequence)return {clip,tick};
  if(sequence==='dodge'){
    const end=total(characters()[0][1].clips[clip]);
    return tick<end?{clip,tick}:{clip:'air_dodge_land',tick:tick-end};
  }
  if(sequence==='aerial'){
    const end=total(characters()[0][1].clips[clip]);
    return tick<end?{clip,tick}:{clip:'land_soft',tick:tick-end};
  }
  if(sequence==='jump'||sequence==='reaction'||sequence==='helpless'||sequence==='crouch'){
    let age=tick;
    for(const [name,ticks] of (sequence==='jump'?jumpPhases:sequence==='helpless'?helplessPhases:sequence==='crouch'?crouchPhases:reactionPhases)){
      if(age<ticks)return {clip:name==='air_fastfall_loop'&&!document.querySelector('#fast-descent').checked?'air_fall_loop':name,tick:age};
      age-=ticks;
    }
  }
  const jab=total(characters()[0][1].clips.jab);
  return tick<12?{clip:'idle',tick:0}:tick<12+jab?{clip:'jab',tick:tick-12}:{clip:'idle',tick:0};
}
function jumpHeight(current){
  if(current.clip==='jump')return current.tick*2.5;
  if(current.clip==='double_jump_transition')return 25+(current.tick+1)*25/6;
  if(current.clip==='air_apex_loop')return 50;
  if(current.clip==='air_fall_loop')return 50*(1-(current.tick+1)/10);
  if(current.clip==='air_fastfall_loop')return 50*(1-((current.tick+1)/10)**2);
  return 0;
}
function frameAt(c,t){let age=t%total(c);for(let i=0;i<c.durations.length;i++){if(age<c.durations[i])return i;age-=c.durations[i];}return c.frames.length-1;}
function bottomClearance(clip,frame){
  return (frame.root[1]-frame.rect[3]+2)*(frame.scale??clip.scale)*3.2;
}
function contactGuide(clip,age){
  if(!document.querySelector('#contact-guide').checked||!clip.contact)return;
  const [start,end]=clip.activeWindow;
  if(age<start||age>=end)return;
  const [x,y]=clip.contact.map(value=>value*3.2);
  ctx.strokeStyle='#a51948';
  ctx.lineWidth=2;
  ctx.beginPath();
  ctx.arc(x,y,10,0,Math.PI*2);
  ctx.moveTo(x-14,y);ctx.lineTo(x+14,y);
  ctx.moveTo(x,y-14);ctx.lineTo(x,y+14);
  ctx.stroke();
}
function draw(){const current=phase();ctx.clearRect(0,0,1200,430);const dark=document.querySelector('#background').value==='dark';ctx.strokeStyle=dark?'#978a9c':'#9f947e';ctx.beginPath();if(current.clip.startsWith('teeter_')){const direction=(current.clip==='teeter_front'?1:-1)*(mirror?-1:1);for(const edge of [325,875]){ctx.moveTo(edge-195*direction,365);ctx.lineTo(edge,365);ctx.lineTo(edge,393);}}else if(!current.clip.startsWith('ledge_')){const platformY=current.clip==='platform_drop'?255:365;ctx.moveTo(50,platformY);ctx.lineTo(1150,platformY);}ctx.stroke();const rows=[];characters().forEach(([id,char],i)=>{const pair=!original&&pairedClips[current.clip]?pairPlacement(i,current.tick):null;if(pair)char=pair.char;const c=char.clips[pair?.name??current.clip],index=frameAt(c,current.tick),f=c.frames[index],img=images[f.image??c.image],scale=(f.scale??c.scale)*3.2*(current.clip==='ko_star'&&index===1?1-(current.tick-5)*.043:1);let base=current.clip==='platform_drop'?255+current.tick*11:365;if((current.clip.startsWith('air_dodge_')&&current.clip!=='air_dodge_land')||current.clip.endsWith('_air')||['double_jump_transition','air_apex_loop','air_fall_loop','air_fastfall_loop','air_rise_loop'].includes(current.clip))base-=50;if(['hit_air','ko_launch','tumble','tumble_recover'].includes(current.clip))base-=48;if(current.clip==='jump')base-=Math.sin(tick/Math.max(1,duration()-1)*Math.PI)*95;if(sequence==='jump')base=365-jumpHeight(current);if(sequence==='aerial'&&current.clip===clip){const end=total(c),recovery=c.activeWindow[1];const land=char.clips.land_soft;const handoff=bottomClearance(c,c.frames.at(-1))-bottomClearance(land,land.frames[0]);const progress=Math.max(0,(tick-recovery)/(end-recovery-1));base=315+(50+handoff)*progress;}if(current.clip==='helpless_enter'||current.clip==='helpless_loop')base-=62-current.tick*2;if(sequence==='helpless')base=365-70*Math.max(0,1-tick/21);if(current.clip==='respawn_wait')base-=65;if(current.clip==='respawn_drop')base-=65*Math.max(0,1-current.tick/14);if(current.clip==='ko_screen')base-=index===0?40:18;if(current.clip==='ko_star')base-=index===0?40:85+(current.tick-5)*7;if(current.clip==='shield_break_launch'&&index===1)base-=Math.sin((current.tick-3)/9*Math.PI)*40;if(current.clip==='up_special'&&index>0)base-=42*Math.min(1,(current.tick-4)/8);const takeoff=current.clip.startsWith('takeoff_')&&index>0;const takeoffAge=takeoff?current.tick-c.durations[0]+1:0;if(takeoff)base-=takeoffAge*5;const rollDirection=current.clip==='roll'?1:current.clip==='roll_back_preview'?-1:0;const offset=rollDirection*(mirror?-1:1)*80*Math.max(0,Math.min(1,(current.tick-4)/10));const dodge=dodgePlacement(char,current,base);base=dodge.base;let reactionOffset=0;if(sequence==='reaction'){const age=Math.max(0,tick-13);const height=current.clip==='tumble'?52-current.tick*1.3:current.clip==='tumble_recover'?20.8-current.tick*.6:Math.min(52,age*4);base=365-height;reactionOffset=(mirror?1:-1)*age*2;}const ceilingTech=current.clip==='ceiling_tech';if(ceilingTech){const brace=c.frames[0];base=42+(brace.root[1]-2)*(brace.scale??c.scale)*3.2+Math.max(0,current.tick-4)*3;}const wallTech=current.clip.startsWith('wall_tech');if(wallTech)base-=50;const wallTravel=current.clip==='wall_tech_jump'?Math.max(0,current.tick-3):0;const getupRoll=current.clip.startsWith('getup_roll_')?(mirror?-1:1)*66*Math.max(0,Math.min(1,(current.tick-12)/8)):0;const takeoffTravel=(mirror?-1:1)*takeoffAge*(current.clip==='takeoff_forward'?5:current.clip==='takeoff_backward'?-5:0);const specialTravel=current.clip==='side_special'?(mirror?-1:1)*72*Math.min(1,current.tick/14):0;let origin=pair?.origin??((i?875:325)+offset+dodge.offset+reactionOffset+getupRoll+specialTravel+takeoffTravel-(mirror?-1:1)*wallTravel*3);if(pair)base=pair.base;if(current.clip.startsWith('teeter_'))origin-=(current.clip==='teeter_front'?1:-1)*(mirror?-1:1)*38;
if(current.clip.startsWith('ledge_')){
  const direction=mirror?-1:1,edge=i?875:325,surface=155;
  const climbing=current.clip==='ledge_climb'||current.clip==='ledge_roll'||current.clip==='ledge_attack';
  const hand=f;
  if(hand.ledgeContact){
    const [x,y]=hand.ledgeContact;
    origin=edge-x*direction;
    base=surface-y;
  }else if(climbing){
    origin=edge+direction*(current.clip==='ledge_roll'?100:55);
    base=surface;
  }else{
    const age=current.tick-c.durations[0];
    origin=edge+direction*(current.clip==='ledge_jump'?15+age*3:-20-age);
    base=current.clip==='ledge_jump'?surface-35-age*2:surface+190+age*2;
  }
  ctx.beginPath();ctx.moveTo(edge,surface+115);ctx.lineTo(edge,surface);ctx.lineTo(edge+direction*195,surface);ctx.stroke();
}if(wallTravel)base-=Math.min(32,wallTravel*2);if(wallTech||ceilingTech){
  const brace=c.frames[0],anchor=i?875:325;
  const wallX=anchor+(mirror?-1:1)*(brace.rect[2]-brace.root[0]-2)*(brace.scale??c.scale)*3.2;
  ctx.beginPath();
  ctx.moveTo(wallTech?wallX:anchor-130,42);
  ctx.lineTo(wallTech?wallX:anchor+130,wallTech?365:42);
  ctx.stroke();
}ctx.save();ctx.translate(origin,base);ctx.scale(pair?.facing??(mirror?-1:1),1);if(img)ctx.drawImage(img,...f.rect,-f.root[0]*scale,-f.root[1]*scale,f.rect[2]*scale,f.rect[3]*scale);contactGuide(c,current.tick);ctx.restore();if(document.querySelector('#roots').checked){ctx.strokeStyle='#d92b52';ctx.beginPath();ctx.moveTo(origin-9,base);ctx.lineTo(origin+9,base);ctx.moveTo(origin,base-9);ctx.lineTo(origin,base+9);ctx.stroke();}ctx.fillStyle=dark?'#f8e9c6':'#352a38';ctx.font='bold 21px Georgia';ctx.textAlign='center';ctx.fillText(char.name,i?875:325,405);rows.push(char.name+': frame '+(index+1)+' / '+c.frames.length);});info.textContent=(original?'ORIGINAL':'REFINED')+' · '+(sequence==='crouch'?'IDLE → CROUCH → IDLE / ':sequence==='helpless'?'HELPLESS FALL → LANDING / ':sequence==='reaction'?'HIT → LAUNCH → TUMBLE → RECOVERY / ':sequence==='dodge'?'DODGE → LANDING / ':sequence==='aerial'?'AERIAL → LANDING / ':sequence==='jump'?'JUMP → DOUBLE JUMP → LANDING / ':sequence?'IDLE → JAB → IDLE / ':'')+current.clip.toUpperCase()+' · tick '+tick+' / '+(duration()-1)+' · '+(playing?'Playing':'Paused')+'\n'+rows.join(' · ');slider.max=duration()-1;slider.value=tick;}
function setPlaying(next){
  playing=next;
  document.querySelector('#play').textContent=playing?'Pause':'Play';
  last=performance.now();
  accum=0;
}
function toggle(){
  setPlaying(!playing);
  draw();
}
function step(){
  setPlaying(false);
  tick=(tick+1)%duration();
  draw();
}
function reset(){
  tick=0;
  accum=0;
  draw();
}
document.querySelector('#play').onclick=toggle;document.querySelector('#step').onclick=step;document.querySelector('#restart').onclick=reset;
document.querySelector('#version').onclick=e=>{original=!original;if(original&&(['jump','reaction','helpless','crouch'].includes(sequence)||!manifest.baselineCharacters.moonshine.clips[clip]))document.querySelector('[data-clip=idle]').click();document.querySelectorAll('[data-movement]').forEach(button=>button.hidden=original);e.currentTarget.textContent='Version: '+(original?'original':'refined');reset();};
function setSequence(next){
  sequence=next;
  document.querySelector('#crouch-chain').setAttribute('aria-pressed',String(sequence==='crouch'));
  document.querySelector('#helpless-chain').setAttribute('aria-pressed',String(sequence==='helpless'));
  const pairRoles=document.querySelector('#pair-roles');
  pairRoles.disabled=!pairedClips[clip];
  pairRoles.textContent=(clip.startsWith('footstool_')?'Footstool: ':'Grabber: ')+(swapPair?'Hoagie':'Moonshine');
  document.querySelector('#reaction-chain').setAttribute('aria-pressed',String(sequence==='reaction'));
  const dodgeLanding=document.querySelector('#dodge-landing');
  dodgeLanding.disabled=!dodgeVectors[clip];
  dodgeLanding.setAttribute('aria-pressed',String(sequence==='dodge'));
  const aerialLanding=document.querySelector('#aerial-landing');
  aerialLanding.disabled=!clip.endsWith('_air');
  aerialLanding.setAttribute('aria-pressed',String(sequence==='aerial'));
  document.querySelector('#transition').setAttribute('aria-pressed',String(sequence==='jab'));
  document.querySelector('#jump-transition').setAttribute('aria-pressed',String(sequence==='jump'));
  document.querySelectorAll('[data-clip]').forEach(button=>button.setAttribute('aria-pressed',String(!sequence&&button.dataset.clip===clip)));
  reset();
}
document.querySelector('#transition').onclick=()=>setSequence(sequence==='jab'?false:'jab');
document.querySelector('#crouch-chain').onclick=()=>setSequence(sequence==='crouch'?false:'crouch');
document.querySelector('#helpless-chain').onclick=()=>setSequence(sequence==='helpless'?false:'helpless');
document.querySelector('#reaction-chain').onclick=()=>setSequence(sequence==='reaction'?false:'reaction');
document.querySelector('#dodge-landing').onclick=()=>setSequence(sequence==='dodge'?false:'dodge');
document.querySelector('#aerial-landing').onclick=()=>setSequence(sequence==='aerial'?false:'aerial');
document.querySelector('#jump-transition').onclick=()=>setSequence(sequence==='jump'?false:'jump');
document.querySelector('#pair-roles').onclick=e=>{swapPair=!swapPair;e.currentTarget.textContent=(clip.startsWith('footstool_')?'Footstool: ':'Grabber: ')+(swapPair?'Hoagie':'Moonshine');reset();};
document.querySelector('#facing').onclick=e=>{mirror=!mirror;e.currentTarget.textContent='Facing: '+(mirror?'left':'right');draw();};
document.querySelectorAll('[data-clip]').forEach(button=>button.onclick=()=>{clip=button.dataset.clip;setSequence(false);});
slider.oninput=()=>{setPlaying(false);tick=Number(slider.value);draw();};document.querySelector('#background').onchange=e=>{document.querySelector('#stage').className='stage '+e.target.value;draw();};document.querySelector('#roots').onchange=draw;document.querySelector('#fast-descent').onchange=draw;document.querySelector('#contact-guide').onchange=draw;
addEventListener('keydown',e=>{if(e.target.matches?.('input,select,button'))return;if(e.code==='Space'){e.preventDefault();toggle();}if(e.code==='ArrowRight'){e.preventDefault();step();}});
window.__newcomerReview={manifest,get state(){const p=phase();return{clip:sequence?'transition':clip,displayClip:p.clip,tick,playing,mirror,version:original?'original':'refined',frames:characters().map(([,c],i)=>{const pair=!original&&pairedClips[p.clip]?pairPlacement(i,p.tick):null;return frameAt(pair?pair.char.clips[pair.name]:c.clips[p.clip],p.tick);})};}};
const all=[...Object.values(manifest.characters),...Object.values(manifest.baselineCharacters)];
Promise.all([...new Set(all.flatMap(c=>Object.values(c.clips).flatMap(x=>[x.image,...x.frames.flatMap(f=>f.image?[f.image]:[])])))].map(src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{images[src]=img;resolve();};img.onerror=()=>reject(Error('Missing sheet '+src));img.src=src;}))).then(()=>{window.__newcomerReview.ready=true;draw();function loop(now){if(playing){accum+=Math.min(200,now-last)/1000*60*Number(document.querySelector('#speed').value);while(accum>=1){tick=(tick+1)%duration();accum--;}draw();}last=now;requestAnimationFrame(loop);}requestAnimationFrame(loop);}).catch(e=>{info.className='error';info.textContent=e.message;throw e;});
