import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {PNG} from 'pngjs';
const root=process.cwd(),dir=path.join(root,'apps/client/public/fighter-art-newcomers-v1');
const spec={idle:{cols:2,rows:2,durations:[12,12,12,12]},walk:{cols:3,rows:2,durations:[4,4,4,4,4,4]},run:{cols:3,rows:2,durations:[3,3,3,3,3,3]},jab:{cols:3,rows:3,durations:[1,1,1,2,2,2,2,2,2]},jump:{cols:3,rows:2,durations:[3,12,8,12,6,6]}};
const gaitSpecs={walk:{cols:4,rows:2,durations:[3,3,3,3,3,3,3,3]},run:{cols:4,rows:2,durations:[2,2,2,3,2,2,2,3]}};
const gaitRoots={moonshine:{walk:[215,218,218,220,216,216,217,218],run:[220,218,220,219,220,218,219,220]},'hulk-hoagie':{walk:[213,209,222,219,215,210,224,218],run:[218,220,221,220,218,220,220,218]}};
const roster=[{id:'moonshine',name:'Moonshine',worldHeight:78,weight:87,role:'Mobile country brawler',overrides:['forward_tilt','dash_attack','side_special','up_special'],root:{walk:[270,260,260,280,275,260],run:[265,260,270,270,270,265],jump:[260,260,270,270,270,260]}},{id:'hulk-hoagie',name:'“Hulk” Hoagie',worldHeight:88,weight:109,role:'Wrestling throw specialist',overrides:['forward_throw','back_throw','up_throw','down_throw'],root:{walk:[272,257,250,270,255,252],run:[275,280,278,270,278,280],jump:[270,260,270,270,270,260]}}];
const portraitChecks=[];
const baseline=JSON.parse(fs.readFileSync(path.join(dir,'manifest-v1.json'),'utf8'));
const manifest={version:1,revision:51,compatibilityAliases:{reaction:'hit_mid',air_dodge_directional:'air_dodge_side'},baselineCharacters:baseline.characters,status:'review candidates; not playable roster',characters:{},notes:['Weights, scale and four overrides are working proposals, not engine stats.','Jump arc is review-only; durations are pilot timing, not native mechanics.','Legacy dodge requires compatibility mapping, not another illustration.']},checks=[];
function frameBounds(p,c,r,i,rowSplit,colSplit,edges){const l=edges?edges[i%c]:colSplit?(i%c?colSplit:0):Math.round(i%c*p.width/c),t=rowSplit?(i<c?0:rowSplit):Math.round(Math.floor(i/c)*p.height/r),right=edges?edges[i%c+1]:colSplit?(i%c?p.width:colSplit):Math.round((i%c+1)*p.width/c),bottom=rowSplit?(i<c?rowSplit:p.height):Math.round((Math.floor(i/c)+1)*p.height/r);let x0=right,y0=bottom,x1=-1,y1=-1;for(let y=t;y<bottom;y++)for(let x=l;x<right;x++)if(p.data[(y*p.width+x)*4+3]>32){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}if(x1<0||Math.min(x0-l,y0-t,right-1-x1,bottom-1-y1)<3)throw Error('Clipped/blank cell '+i);return{l,t,right,bottom,x0,y0,x1,y1,height:y1-y0+1};}
function support(p,b){const xs=[];for(let x=b.x0;x<=b.x1;x++){let found=false;for(let y=b.y1-Math.round(b.height*.025);y<=b.y1;y++)if(p.data[(y*p.width+x)*4+3]>64){found=true;break;}if(found)xs.push(x);}const groups=[];for(const x of xs){const last=groups.at(-1);if(last&&x-last[1]<5)last[1]=x;else groups.push([x,x]);}const first=groups.find(g=>g[1]-g[0]>5);if(!first)throw Error('Missing planted support');const last=groups.filter(g=>g[1]-g[0]>5).at(-1);return(first[0]+first[1]+last[0]+last[1])/4;}
for(const char of roster){const portrait=char.id+'-portrait-v1.png',pp=PNG.sync.read(fs.readFileSync(path.join(dir,portrait)));let alphaZero=0;for(let i=3;i<pp.data.length;i+=4)if(pp.data[i]===0)alphaZero++;const transparentFraction=alphaZero/(pp.width*pp.height);if(transparentFraction<.1)throw Error('Portrait alpha failed '+portrait);portraitChecks.push({fighter:char.id,image:portrait,width:pp.width,height:pp.height,transparentFraction});const clips={};for(const[name,baseSpec]of Object.entries(spec)){const gait=gaitSpecs[name],s=gait??baseSpec;const image=gait?(char.id+'-'+name+'-v3'+(char.id==='hulk-hoagie'&&name==='run'?'-alpha':'')+'.png'):char.id+'-'+name+'-v1.png',buffer=fs.readFileSync(path.join(dir,image)),p=PNG.sync.read(buffer);let empty=0;for(let j=3;j<p.data.length;j+=4)if(p.data[j]===0)empty++;const alpha=empty/(p.width*p.height);if(alpha<.5)throw Error(image+' lacks transparency');const bounds=s.durations.map((_,i)=>frameBounds(p,s.cols,s.rows,i)),ref=name==='jab'?bounds[0].height:Math.max(...bounds.map(b=>b.height)),floor=Math.max(...bounds.map(b=>b.y1-b.t+1));
 const frames=bounds.map((b,i)=>{const tx=Math.max(b.l,b.x0-2),ty=Math.max(b.t,b.y0-2),ground=name==='idle'||name==='jab',rx=ground?support(p,b):b.l+(gait?gaitRoots[char.id][name][i]:char.root[name][i]),ry=ground?b.y1+1:b.t+floor;return{rect:[tx,ty,Math.min(b.right,b.x1+3)-tx,Math.min(b.bottom,b.y1+3)-ty],root:[rx-tx,ry-ty],sourceSize:[b.right-b.l,b.bottom-b.t],trim:[tx-b.l,ty-b.t],visibleHeight:b.height,registration:ground?'paired planted soles':'manually guided torso with shared baseline'};});
 clips[name]={image,scale:char.worldHeight/ref,durations:s.durations,loop:['idle','walk','run'].includes(name),frames,...(name==='jab'?{activeWindow:[3,5]}:{})};checks.push({fighter:char.id,clip:name,frames:frames.length,transparentFraction:alpha,cellMarginsPassed:true,sha256:crypto.createHash('sha256').update(buffer).digest('hex')});}
 const movementImage=char.id+'-crouch-land-v1-candidate.png';
 const movementBuffer=fs.readFileSync(path.join(dir,movementImage));
 const movement=PNG.sync.read(movementBuffer);
 const movementAlpha=movement.data.filter((value,index)=>index%4===3&&value===0).length/(movement.width*movement.height);
 if(movementAlpha<.5)throw Error(movementImage+' lacks transparency');
 const movementBounds=Array.from({length:6},(_,i)=>frameBounds(movement,3,2,i,char.id==='hulk-hoagie'?480:undefined));
 const scale=char.worldHeight/movementBounds[5].height;
 function registerMovement(name,indices,durations,loop=false){
   const frames=indices.map(i=>{
     const b=movementBounds[i];
     const x=b.x0-2,y=b.y0-2;
     const airborne=i===3;
     const rootY=airborne?b.t+movementBounds[4].y1-movementBounds[4].t+1:b.y1+1;
     const rootX=airborne?(b.x0+b.x1)/2:support(movement,b);
     return {rect:[x,y,b.x1-x+3,b.y1-y+3],root:[rootX-x,rootY-y],sourceSize:[b.right-b.l,b.bottom-b.t],trim:[x-b.l,y-b.t],visibleHeight:b.height,registration:airborne?'shared landing baseline':'planted support'};
   });
   clips[name]={image:movementImage,scale,durations,loop,frames};
   checks.push({fighter:char.id,clip:name,frames:frames.length,transparentFraction:movementAlpha,cellMarginsPassed:true,sha256:crypto.createHash('sha256').update(movementBuffer).digest('hex')});
 }
 registerMovement('crouch_enter',[0],[3]);
 registerMovement('crouch_hold',[1],[18],true);
 registerMovement('crouch_exit',[2],[3]);
 registerMovement('land_soft',[3,4,5],[3,4,6]);
 const airImage=char.id+'-turn-air-v1.png';
 const airBuffer=fs.readFileSync(path.join(dir,airImage));
 const airSheet=PNG.sync.read(airBuffer);
 const airAlpha=airSheet.data.filter((value,index)=>index%4===3&&value===0).length/(airSheet.width*airSheet.height);
 if(airAlpha<.5)throw Error(airImage+' lacks transparency');
 const poses=Array.from({length:6},(_,i)=>frameBounds(airSheet,3,2,i));
 const airScale=char.worldHeight/poses[2].height;
 const airRootX=char.id==='moonshine'?[271,257,243]:[254,257,224];
 const airRootY=char.id==='moonshine'?[230,220,255]:[215,254,235];
 const entries=[
   ['turn_stand',[0,2],[4,4],false],
   ['brake',[1,2],[5,4],false],
   ['double_jump_transition',[3],[6],false],
   ['air_apex_loop',[4],[8],true],
   ['air_fall_loop',[5],[8],true],
 ];
 for(const [name,indices,durations,loop] of entries){
   if(name==='air_apex_loop'&&char.id==='moonshine'){
     const image='moonshine-air-apex-v2.png';
     const buffer=fs.readFileSync(path.join(dir,image));
     const sheet=PNG.sync.read(buffer);
     const transparentFraction=sheet.data.filter((value,index)=>index%4===3&&value===0).length/(sheet.width*sheet.height);
     if(transparentFraction<.5)throw Error(image+' lacks transparency');
     const bounds=frameBounds(sheet,1,1,0);
     const x=bounds.x0-2,y=bounds.y0-2;
     const scale=char.worldHeight*.87/bounds.height;
     const frame={rect:[x,y,bounds.x1-x+3,bounds.y1-y+3],root:[570-x,655-y+char.worldHeight*.48/scale],sourceSize:[sheet.width,sheet.height],trim:[x,y],visibleHeight:bounds.height,registration:'guided pelvis'};
     clips[name]={image,scale,durations,loop,frames:[frame]};
     checks.push({fighter:char.id,clip:name,frames:1,transparentFraction,cellMarginsPassed:true,sha256:crypto.createHash('sha256').update(buffer).digest('hex')});
     continue;
   }
   const frames=indices.map(i=>{
     const b=poses[i],x=b.x0-2,y=b.y0-2;
     const airborne=i>=3;
     const rx=airborne?b.l+airRootX[i-3]:support(airSheet,b);
     const ry=airborne?b.t+airRootY[i-3]+poses[2].height*.48:b.y1+1;
     return {rect:[x,y,b.x1-x+3,b.y1-y+3],root:[rx-x,ry-y],sourceSize:[b.right-b.l,b.bottom-b.t],trim:[x-b.l,y-b.t],visibleHeight:b.height,registration:airborne?'guided pelvis':'planted support'};
   });
   clips[name]={image:airImage,scale:airScale,durations,loop,frames};
   checks.push({fighter:char.id,clip:name,frames:frames.length,transparentFraction:airAlpha,cellMarginsPassed:true,sha256:crypto.createHash('sha256').update(airBuffer).digest('hex')});
 }
 if(char.id==='hulk-hoagie'){
   const walk=clips.walk;
   const walkCheck=checks.find(check=>check.fighter===char.id&&check.clip==='walk');
   const replacements=[
     {index:4,image:'hulk-hoagie-walk-far-contact-v1.png',rootX:530},
     {index:5,image:'hulk-hoagie-walk-far-down-v1.png',rootX:530},
     {index:6,image:'hulk-hoagie-walk-far-passing-v1.png',rootX:550},
     {index:7,image:'hulk-hoagie-walk-far-up-v1.png',rootX:554},
   ];
   walkCheck.replacementFrames=replacements.map(({index,image,rootX})=>{
     const buffer=fs.readFileSync(path.join(dir,image));
     const sheet=PNG.sync.read(buffer);
     const transparentFraction=sheet.data.filter((value,index)=>index%4===3&&value===0).length/(sheet.width*sheet.height);
     if(transparentFraction<.35)throw Error(image+' lacks transparency');
     const b=frameBounds(sheet,1,1,0);
     const x=b.x0-2,y=b.y0-2;
     const scale=walk.scale*walk.frames[index].visibleHeight/b.height;
     walk.frames[index]={image,scale,rect:[x,y,b.x1-x+3,b.y1-y+3],root:[rootX-x,b.y1+1-y],sourceSize:[sheet.width,sheet.height],trim:[x,y],visibleHeight:b.height,registration:'guided pelvis with planted baseline'};
     return {index,image,transparentFraction,cellMarginsPassed:true,sha256:crypto.createHash('sha256').update(buffer).digest('hex')};
   });
 }
 const takeoffImage=char.id+'-jump-squat-fastfall-v1.png';
 const takeoffBuffer=fs.readFileSync(path.join(dir,takeoffImage));
 const takeoffSheet=PNG.sync.read(takeoffBuffer);
 const takeoffAlpha=takeoffSheet.data.filter((value,index)=>index%4===3&&value===0).length/(takeoffSheet.width*takeoffSheet.height);
 if(takeoffAlpha<.5)throw Error(takeoffImage+' lacks transparency');
 const takeoffHash=crypto.createHash('sha256').update(takeoffBuffer).digest('hex');
 const takeoffEntries=[
   {name:'jump_squat',duration:3,loop:false,heightRatio:.66},
   {name:'air_fastfall_loop',duration:8,loop:true,heightRatio:.83},
 ];
 for(const [index,{name,duration,loop,heightRatio}] of takeoffEntries.entries()){
   const b=frameBounds(takeoffSheet,2,1,index);
   const x=b.x0-2,y=b.y0-2,scale=char.worldHeight*heightRatio/b.height;
   const grounded=index===0;
   const pelvis=char.id==='moonshine'?[1295,445]:[1280,410];
   const rootX=grounded?support(takeoffSheet,b):pelvis[0];
   const rootY=grounded?b.y1+1:pelvis[1]+char.worldHeight*.48/scale;
   const frame={rect:[x,y,b.x1-x+3,b.y1-y+3],root:[rootX-x,rootY-y],sourceSize:[b.right-b.l,b.bottom-b.t],trim:[x-b.l,y-b.t],visibleHeight:b.height,registration:grounded?'planted support':'guided pelvis'};
   clips[name]={image:takeoffImage,scale,durations:[duration],loop,frames:[frame]};
   checks.push({fighter:char.id,clip:name,frames:1,transparentFraction:takeoffAlpha,cellMarginsPassed:true,sha256:takeoffHash});
 }
 const impactImage=char.id+'-turn-heavy-land-v1.png';
 const impactBuffer=fs.readFileSync(path.join(dir,impactImage));
 const impactSheet=PNG.sync.read(impactBuffer);
 const impactAlpha=impactSheet.data.filter((value,index)=>index%4===3&&value===0).length/(impactSheet.width*impactSheet.height);
 if(impactAlpha<.5)throw Error(impactImage+' lacks transparency');
 const impactHash=crypto.createHash('sha256').update(impactBuffer).digest('hex');
 const impactBounds=Array.from({length:4},(_,i)=>frameBounds(impactSheet,2,2,i));
 const impactScale=char.worldHeight*.92/impactBounds[3].height;
 for(const [name,indices,durations] of [['turn_run',[0,1],[4,5]],['land_heavy',[2,3],[6,9]]]){
   const frames=indices.map(i=>{
     const b=impactBounds[i],x=b.x0-2,y=b.y0-2;
     const rx=b.l+(char.id==='moonshine'?[335,275,310,310]:[310,312,320,295])[i];
     return {rect:[x,y,b.x1-x+3,b.y1-y+3],root:[rx-x,b.y1+1-y],sourceSize:[b.right-b.l,b.bottom-b.t],trim:[x-b.l,y-b.t],visibleHeight:b.height,registration:i<2?'guided pelvis and planted baseline':'guided midpoint between boots'};
   });
   clips[name]={image:impactImage,scale:impactScale,durations,loop:false,frames};
   checks.push({fighter:char.id,clip:name,frames:frames.length,transparentFraction:impactAlpha,cellMarginsPassed:true,sha256:impactHash});
 }
 const tiltImage=char.id+'-drop-teeter-tilts-v1.png';
 const tiltBuffer=fs.readFileSync(path.join(dir,tiltImage));
 const tiltSheet=PNG.sync.read(tiltBuffer);
 const tiltAlpha=tiltSheet.data.filter((value,index)=>index%4===3&&value===0).length/(tiltSheet.width*tiltSheet.height);
 if(tiltAlpha<.5)throw Error(tiltImage+' lacks transparency');
 const tiltHash=crypto.createHash('sha256').update(tiltBuffer).digest('hex');
 const isMoonshine=char.id==='moonshine';
 const tiltBounds=Array.from({length:6},(_,i)=>frameBounds(tiltSheet,3,2,i,isMoonshine?490:undefined));
 const tiltScale=char.worldHeight/tiltBounds[3].height;
 const tiltRoots=isMoonshine?[263,172,230,213,215,144]:[239,227,222,211,207,151];
 const stance={...clips.idle.frames[0],image:clips.idle.image,scale:clips.idle.scale};
 const clipNames=['platform_drop','teeter_front','teeter_back','forward_tilt','up_tilt','down_tilt'];
 for(const [i,name] of clipNames.entries()){
   const b=tiltBounds[i],x=b.x0-2,y=b.y0-2;
   const rootY=i===0?b.t+(isMoonshine?240:237)+char.worldHeight*.48/tiltScale:b.y1+1;
   const pose={rect:[x,y,b.x1-x+3,b.y1-y+3],root:[b.l+tiltRoots[i]-x,rootY-y],sourceSize:[b.right-b.l,b.bottom-b.t],trim:[x-b.l,y-b.t],visibleHeight:b.height,registration:i===0?'guided pelvis':'guided stance and planted baseline'};
   const attack=i>=3;
   const frames=attack?[stance,pose,stance]:[pose];
   const durations=attack?[4,4,7]:[i===0?8:12];
   clips[name]={image:tiltImage,scale:tiltScale,durations,loop:false,frames,...(attack?{activeWindow:[4,8]}:{})};
   checks.push({fighter:char.id,clip:name,frames:frames.length,transparentFraction:tiltAlpha,cellMarginsPassed:true,sha256:tiltHash});
 }
 function loadCombatSheet(suffix,cols,rows,colSplit,rowSplit,edges){
   const image=char.id+suffix;
   const buffer=fs.readFileSync(path.join(dir,image));
   const sheet=PNG.sync.read(buffer);
   const transparentFraction=sheet.data.filter((value,index)=>index%4===3&&value===0).length/(sheet.width*sheet.height);
   if(transparentFraction<.5)throw Error(image+' lacks transparency');
   return {image,transparentFraction,sha256:crypto.createHash('sha256').update(buffer).digest('hex'),
     bounds:Array.from({length:cols*rows},(_,i)=>frameBounds(sheet,cols,rows,i,rowSplit,colSplit,Array.isArray(edges?.[0])?edges[Math.floor(i/cols)]:edges))};
 }
 function combatPose(art,i,scale,rootX){
   const b=art.bounds[i],x=b.x0-2,y=b.y0-2;
   return {image:art.image,scale,rect:[x,y,b.x1-x+3,b.y1-y+3],root:[rootX-x,b.y1+1-y],sourceSize:[b.right-b.l,b.bottom-b.t],trim:[x-b.l,y-b.t],visibleHeight:b.height,registration:'guided stance and planted baseline'};
 }
 const transitions=loadCombatSheet('-tilt-transitions-v1.png',3,2);
 const transitionScale=char.worldHeight/transitions.bounds[3].height;
 const transitionRoots=isMoonshine?[234,736,1210,215,728,1205]:[218,744,1210,210,725,1190];
 for(const [i,name] of ['forward_tilt','up_tilt','down_tilt'].entries()){
   const clip=clips[name];
   clip.frames[0]=combatPose(transitions,i,transitionScale,transitionRoots[i]);
   clip.frames[2]=combatPose(transitions,i+3,transitionScale,transitionRoots[i+3]);
   checks.find(check=>check.fighter===char.id&&check.clip===name).transitionSheet={
     image:transitions.image,transparentFraction:transitions.transparentFraction,sha256:transitions.sha256,cellMarginsPassed:true
   };
 }
 const strikes=loadCombatSheet('-dash-smashes-v1.png',2,2,isMoonshine?undefined:565,isMoonshine?undefined:610);
 const strikeScale=char.worldHeight*.93/strikes.bounds[1].height;
 const strikeRoots=isMoonshine?[360,954,330,750]:[285,855,288,685];
 const strikeTransitions=loadCombatSheet('-dash-smash-transitions-v1.png',4,2);
 const strikeTransitionScale=char.worldHeight*.93/strikeTransitions.bounds[5].height;
 const strikeTransitionRoots=isMoonshine?[219,665,1100,1520,228,647,1107,1544]:[197,660,1095,1525,208,650,1102,1544];
 const strikeSpecs=[
   ['dash_attack',[5,4,10]],
   ['forward_smash',[10,5,15]],
   ['up_smash',[9,5,15]],
   ['down_smash',[9,5,16]],
 ];
 for(const [i,[name,durations]] of strikeSpecs.entries()){
   const frames=[
     combatPose(strikeTransitions,i,strikeTransitionScale,strikeTransitionRoots[i]),
     combatPose(strikes,i,strikeScale,strikeRoots[i]),
     combatPose(strikeTransitions,i+4,strikeTransitionScale,strikeTransitionRoots[i+4]),
   ];
   clips[name]={image:strikes.image,scale:strikeScale,durations,loop:false,frames,activeWindow:[durations[0],durations[0]+durations[1]]};
   checks.push({fighter:char.id,clip:name,frames:frames.length,transparentFraction:strikes.transparentFraction,cellMarginsPassed:true,sha256:strikes.sha256,transitionSheet:{
     image:strikeTransitions.image,transparentFraction:strikeTransitions.transparentFraction,sha256:strikeTransitions.sha256,cellMarginsPassed:true
   }});
 }
 const aerials=loadCombatSheet('-aerials-v1.png',3,2,undefined,480);
 const aerialScale=char.worldHeight*.85/aerials.bounds[5].height;
 const aerialPelvis=isMoonshine?[[249,273],[729,283],[1298,279],[272,806],[721,750],[1280,762]]:
   [[239,248],[687,268],[1300,290],[262,790],[711,734],[1241,755]];
 function aerialPose(i){
   const [x,y]=aerialPelvis[i];
   const frame=combatPose(aerials,i,aerialScale,x);
   frame.root[1]=y-frame.rect[1]+char.worldHeight*.48/aerialScale;
   frame.registration='guided pelvis';
   return frame;
 }
 const aerialTransitions=loadCombatSheet('-aerial-transitions-v1.png',5,2);
 const transitionAirScale=char.worldHeight*.75/aerialTransitions.bounds[8].height;
 const transitionPelvis=isMoonshine?[[242,215],[601,220],[1005,218],[1380,236],[1725,209],[216,596],[598,600],[975,595],[1372,609],[1761,609]]:
   [[218,215],[570,210],[987,203],[1399,219],[1740,209],[217,600],[593,598],[989,597],[1376,600],[1754,603]];
 function aerialTransition(i){
   const [x,y]=transitionPelvis[i];
   const frame=combatPose(aerialTransitions,i,transitionAirScale,x);
   frame.root[1]=y-frame.rect[1]+char.worldHeight*.48/transitionAirScale;
   frame.registration='guided pelvis';
   return frame;
 }
 const aerialSpecs=[
   ['neutral_air',[4,5,8]],['forward_air',[6,4,10]],['back_air',[5,4,10]],
   ['up_air',[5,4,9]],['down_air',[7,5,12]],
 ];
 const contactPixels=isMoonshine?[[326,285],[946,248],[1082,247],[331,536],[768,950]]:
   [[310,274],[937,254],[1085,282],[296,534],[724,957]];
 for(const [i,[name,durations]] of aerialSpecs.entries()){
   const frames=[aerialTransition(i),aerialPose(i),aerialTransition(i+5)];
   const strike=frames[1];
   const contact=contactPixels[i].map((value,axis)=>(value-strike.rect[axis]-strike.root[axis])*aerialScale);
   clips[name]={contact,image:aerials.image,scale:aerialScale,durations,loop:false,frames,activeWindow:[durations[0],durations[0]+durations[1]]};
   checks.push({fighter:char.id,clip:name,frames:frames.length,transparentFraction:aerials.transparentFraction,cellMarginsPassed:true,sha256:aerials.sha256,transitionSheet:{image:aerialTransitions.image,transparentFraction:aerialTransitions.transparentFraction,sha256:aerialTransitions.sha256,cellMarginsPassed:true}});
 }
 const defense=loadCombatSheet('-defense-v1.png',3,2);
 const defenseScale=char.worldHeight*.93/defense.bounds[1].height;
 const defenseRoots=isMoonshine?[270,733,1249,280,750,1235]:[275,745,1290,281,768,1245];
 const defensePoses=defense.bounds.map((_,i)=>combatPose(defense,i,defenseScale,defenseRoots[i]));
 const airDodge=defensePoses[5];
 airDodge.root[1]=(isMoonshine?741:753)-airDodge.rect[1]+char.worldHeight*.48/defenseScale;
 airDodge.registration='guided pelvis';
 const defenseIdle={...clips.idle.frames[0],image:clips.idle.image,scale:clips.idle.scale};
 const defenseSpecs=[
   ['shield',[defensePoses[0]],[12],true],
   ['parry',[defensePoses[0],defensePoses[1],defenseIdle],[3,5,8],false],
   ['dodge',[defenseIdle,defensePoses[2],defenseIdle],[3,8,8],false],
   ['roll',[defensePoses[0],defensePoses[3],defenseIdle],[4,10,9],false],
   ['roll_back_preview',[defensePoses[0],defensePoses[4],defenseIdle],[4,10,9],false],
   ['air_dodge_neutral',[aerialPose(5),airDodge,aerialPose(5)],[3,8,10],false],
 ];
 for(const [name,frames,durations,loop] of defenseSpecs){
   clips[name]={image:defense.image,scale:defenseScale,durations,loop,frames};
   checks.push({fighter:char.id,clip:name,frames:frames.length,transparentFraction:defense.transparentFraction,cellMarginsPassed:true,sha256:defense.sha256});
 }
 const shieldArt=loadCombatSheet('-shield-air-dodge-v1.png',3,2,undefined,505,[0,470,1024,1536]);
 const shieldScale=char.worldHeight*.94/shieldArt.bounds[0].height;
 const shieldRoots=isMoonshine?[270,772,1259,267,721,1258]:[244,773,1254,265,718,1270];
 const shieldPoses=shieldArt.bounds.map((_,i)=>combatPose(shieldArt,i,shieldScale,shieldRoots[i]));
 for(const i of [3,4]){
   const pose=shieldPoses[i];
   const pelvisY=(isMoonshine?[753,751]:[779,765])[i-3];
   pose.root[1]=pelvisY-pose.rect[1]+char.worldHeight*.48/shieldScale;
   pose.registration='guided pelvis';
 }
 const shieldHold=defensePoses[0];
 const groundedRecovery={...clips.land_soft.frames[2],image:clips.land_soft.image,scale:clips.land_soft.scale};
 const followupSpecs=[
   ['shield_raise',[defenseIdle,shieldPoses[0],shieldHold],[2,3,4]],
   ['shield_hit',[shieldHold,shieldPoses[1],shieldHold],[2,5,5]],
   ['shield_drop',[shieldHold,shieldPoses[2],defenseIdle],[2,5,4]],
   ['air_dodge_up',[airDodge,shieldPoses[3],aerialPose(5)],[3,8,12]],
   ['air_dodge_side',[airDodge,shieldPoses[4],aerialPose(5)],[3,8,12]],
   ['air_dodge_land',[shieldPoses[5],groundedRecovery],[6,9]],
 ];
 for(const [name,frames,durations] of followupSpecs){
   clips[name]={image:shieldArt.image,scale:shieldScale,durations,loop:false,frames};
   checks.push({fighter:char.id,clip:name,frames:frames.length,transparentFraction:shieldArt.transparentFraction,cellMarginsPassed:true,sha256:shieldArt.sha256});
 }
 const dodgeDirections=loadCombatSheet('-dodge-directions-v1.png',3,2);
 const directionScale=char.worldHeight*.94/dodgeDirections.bounds[0].height;
 const dodgePelvis=isMoonshine?[[287,257],[756,262],[1254,252],[261,804],[747,749],[1238,833]]:
   [[230,260],[690,263],[1243,241],[186,752],[696,751],[1225,803]];
 const directionNames=['air_dodge_down','air_dodge_back','air_dodge_up_diagonal','air_dodge_down_diagonal','air_dodge_up_back','air_dodge_down_back'];
 for(const [i,name] of directionNames.entries()){
   const [x,y]=dodgePelvis[i];
   const pose=combatPose(dodgeDirections,i,directionScale,x);
   pose.root[1]=y-pose.rect[1]+char.worldHeight*.48/directionScale;
   pose.registration='guided pelvis';
   const frames=[airDodge,pose,aerialPose(5)];
   clips[name]={image:dodgeDirections.image,scale:directionScale,durations:[3,8,12],loop:false,frames};
   checks.push({fighter:char.id,clip:name,frames:frames.length,transparentFraction:dodgeDirections.transparentFraction,cellMarginsPassed:true,sha256:dodgeDirections.sha256});
 }
 const reactions=loadCombatSheet('-reactions-v1.png',3,2,undefined,540,[0,512,980,1536]);
 const reactionScale=char.worldHeight*.90/reactions.bounds[0].height;
 const reactionAnchors=isMoonshine?[[319,0],[796,254],[1263,241],[263,771],[766,776],[1248,805]]:
   [[250,0],[755,246],[1291,240],[263,770],[758,770],[1281,791]];
 const reactionPoses=reactions.bounds.map((_,i)=>{
   const [x,y]=reactionAnchors[i],pose=combatPose(reactions,i,reactionScale,x);
   if(i>0){
     pose.root[1]=y-pose.rect[1]+char.worldHeight*.48/reactionScale;
     pose.registration=i>=3?'guided rotation center':'guided pelvis';
   }
   return pose;
 });
 const reactionSpecs=[
   ['hit_mid',[reactionPoses[0],defenseIdle],[5,7],false],
   ['hit_air',[reactionPoses[1],aerialPose(5)],[5,7],false],
   ['ko_launch',[reactionPoses[2]],[9],false],
   ['tumble',reactionPoses.slice(3),[4,4,4],true],
 ];
 for(const [name,frames,durations,loop] of reactionSpecs){
   clips[name]={image:reactions.image,scale:reactionScale,durations,loop,frames};
   checks.push({fighter:char.id,clip:name,frames:frames.length,transparentFraction:reactions.transparentFraction,cellMarginsPassed:true,sha256:reactions.sha256});
 }
 const knockdowns=loadCombatSheet('-knockdowns-v1.png',3,2,undefined,512,[[0,512,960,1536],[0,410,960,1536]]);
 const knockdownScale=char.worldHeight*.96/knockdowns.bounds[0].height;
 const knockdownRoots=isMoonshine?[272,739,1261,222,684,1240]:[249,744,1260,234,669,1240];
 const knockdownPoses=knockdowns.bounds.map((_,i)=>combatPose(knockdowns,i,knockdownScale,knockdownRoots[i]));
 const recover=knockdownPoses[3];
 recover.root[1]=(isMoonshine?751:755)-recover.rect[1]+char.worldHeight*.48/knockdownScale;
 recover.registration='guided pelvis';
 const knockdownSpecs=[
   ['hit_high',[knockdownPoses[0],defenseIdle],[5,7]],
   ['hit_low',[knockdownPoses[1],defenseIdle],[5,8]],
   ['hit_heavy',[knockdownPoses[2],reactionPoses[0]],[7,9]],
   ['tumble_recover',[recover,aerialPose(5)],[6,8]],
   ['knockdown_up',[knockdownPoses[4]],[12]],
   ['knockdown_down',[knockdownPoses[5]],[12]],
 ];
 for(const [name,frames,durations] of knockdownSpecs){
   clips[name]={image:knockdowns.image,scale:knockdownScale,durations,loop:false,frames};
   checks.push({fighter:char.id,clip:name,frames:frames.length,transparentFraction:knockdowns.transparentFraction,cellMarginsPassed:true,sha256:knockdowns.sha256});
 }
 const getups=loadCombatSheet('-getups-v1.png',3,2,undefined,512,[0,518,956,1536]);
 const getupScale=knockdownScale;
 const getupRoots=isMoonshine?[255,747,1236,242,725,1196]:[249,745,1235,229,727,1193];
 const getupPoses=getups.bounds.map((_,i)=>combatPose(getups,i,getupScale,getupRoots[i]));
 for(const [row,orientation] of ['up','down'].entries()){
   const prone=knockdownPoses[4+row];
   const rise=getupPoses[row*3];
   const settle={...clips.crouch_exit.frames[0],image:clips.crouch_exit.image,scale:clips.crouch_exit.scale};
   const options=[
     ['prone',[prone],[18],true],
     ['getup',[prone,rise,settle,defenseIdle],[8,7,6,6],false],
     ['getup_roll',[prone,rise,getupPoses[row*3+1],settle,defenseIdle],[8,4,8,5,6],false],
     ['floor_attack',[prone,rise,getupPoses[row*3+2],settle,defenseIdle],[8,6,5,8,6],false],
   ];
   for(const [prefix,frames,durations,loop] of options){
     const name=prefix+'_'+orientation;
     const image=prefix==='prone'?knockdowns:getups;
     clips[name]={image:image.image,scale:getupScale,durations,loop,frames,...(prefix==='floor_attack'?{activeWindow:[14,19]}:{})};
     checks.push({fighter:char.id,clip:name,frames:frames.length,transparentFraction:image.transparentFraction,cellMarginsPassed:true,sha256:image.sha256});
   }
 }
 const techArt=loadCombatSheet('-tech-trip-v1.png',4,2);
 const techScale=char.worldHeight*.68/techArt.bounds[0].height;
 const techRoots=isMoonshine?[214,665,1091,1548,211,650,1105,1543]:[245,680,1094,1524,214,651,1103,1540];
 const techPoses=techArt.bounds.map((_,i)=>combatPose(techArt,i,techScale,techRoots[i]));
 for(const [i,pelvisY] of (isMoonshine?[[2,270],[3,236]]:[[2,247],[3,226]])){
   techPoses[i].root[1]=pelvisY-techPoses[i].rect[1]+char.worldHeight*.48/techScale;
   techPoses[i].registration='guided pelvis';
 }
 const tripSettle={...clips.crouch_exit.frames[0],image:clips.crouch_exit.image,scale:clips.crouch_exit.scale};
 const techSpecs=[
   ['tech_neutral',[techPoses[0],tripSettle,defenseIdle],[5,6,7],false],
   ['tech_roll',[techPoses[0],techPoses[1],tripSettle,defenseIdle],[3,8,5,6],false],
   ['wall_tech',[techPoses[2],aerialPose(5)],[6,9],false],
   ['wall_tech_jump',[techPoses[2],techPoses[3],aerialPose(5)],[4,7,9],false],
   ['trip_fall',[techPoses[4],techPoses[5]],[6,7],false],
   ['trip_prone',[techPoses[5]],[18],true],
   ['trip_getup',[techPoses[5],tripSettle,defenseIdle],[6,7,6],false],
   ['trip_roll',[techPoses[5],techPoses[1],tripSettle,defenseIdle],[6,8,6,6],false],
   ['floor_attack_trip',[techPoses[5],getupPoses[2],tripSettle,defenseIdle],[6,5,8,6],false],
   ['jab_lock_up',[knockdownPoses[4],techPoses[6],knockdownPoses[4]],[3,5,6],false],
   ['jab_lock_down',[knockdownPoses[5],techPoses[7],knockdownPoses[5]],[3,5,6],false],
 ];
 for(const [name,frames,durations,loop] of techSpecs){
   clips[name]={image:techArt.image,scale:techScale,durations,loop,frames,...(name==='floor_attack_trip'?{activeWindow:[6,11]}:{})};
   checks.push({fighter:char.id,clip:name,frames:frames.length,transparentFraction:techArt.transparentFraction,cellMarginsPassed:true,sha256:techArt.sha256});
 }
 const ceiling=loadCombatSheet('-ceiling-tech-v1.png',isMoonshine?1:2,1);
 const ceilingScale=char.worldHeight*.94/ceiling.bounds[0].height;
 const brace=combatPose(ceiling,0,ceilingScale,isMoonshine?554:453);
 brace.root[1]=(isMoonshine?810:411)-brace.rect[1]+char.worldHeight*.48/ceilingScale;
 brace.registration='guided pelvis';
 const rebound=isMoonshine?aerialPose(5):combatPose(ceiling,1,ceilingScale,1305);
 if(!isMoonshine){
   rebound.root[1]=455-rebound.rect[1]+char.worldHeight*.48/ceilingScale;
   rebound.registration='guided pelvis';
 }
 clips.ceiling_tech={image:ceiling.image,scale:ceilingScale,durations:[5,10],loop:false,frames:[brace,rebound]};
 checks.push({fighter:char.id,clip:'ceiling_tech',frames:2,transparentFraction:ceiling.transparentFraction,cellMarginsPassed:true,sha256:ceiling.sha256});
 const grabArt=loadCombatSheet('-grabs-v1.png',4,2,undefined,440);
 const grabbedArt=loadCombatSheet('-grab-reactions-v1.png',4,2,undefined,440);
 const grabScale=char.worldHeight*.95/grabArt.bounds[1].height;
 const grabbedScale=char.worldHeight*.95/grabbedArt.bounds[1].height;
 const grabRoots=isMoonshine?[195,650,1060,1515,187,668,1133,1502]:[182,643,1060,1519,183,661,1102,1511];
 const grabbedRoots=isMoonshine?[224,663,1097,1550,202,627,1136,1560]:[223,660,1090,1555,181,665,1128,1546];
 const grabPoses=grabRoots.map((x,i)=>combatPose(grabArt,i,grabScale,x));
 const grabbedPoses=grabbedRoots.map((x,i)=>combatPose(grabbedArt,i,grabbedScale,x));
 const handPixels=isMoonshine?[[345,158],[776,152],[1191,156],[1638,291],[379,599],[512,569],[1123,478],[1660,742]]:
   [[354,138],[765,154],[1196,133],[1650,238],[376,583],[533,558],[1123,465],[1684,754]];
 const receiverPixels=isMoonshine?[[244,164],[679,166],[1116,205],[1560,174],[189,634],[639,585],[1129,558],[1542,652]]:
   [[235,153],[677,155],[1122,172],[1562,154],[157,592],[623,561],[1116,555],[1531,612]];
 for(const [poses,points] of [[grabPoses,handPixels],[grabbedPoses,receiverPixels]]){
   for(const [i,pose] of poses.entries()){
     const [x,y]=points[i].map((value,axis)=>value-pose.rect[axis]);
     pose.sockets=poses===grabPoses?{grabGrip:[x,y]}:{gripTop:[x,y-8],gripBottom:[x,y+8]};
     pose.grabContact=points[i].map((value,axis)=>(value-pose.rect[axis]-pose.root[axis])*pose.scale*3.2);
   }
 }
 const actorKeys=['grab','grab_hold','pummel','grab_release','forward_throw','back_throw','up_throw','down_throw'];
 const victimKeys=['grabbed','grabbed_hold_preview','pummel_victim','grab_release_victim_preview','throw_victim','back_throw_victim_preview','up_throw_victim_preview','down_throw_victim_preview'];
 for(const [i,name] of actorKeys.entries()){
   const durations=i===1?[16]:i===0?[5,5,8]:i===2?[4,4,8]:[6,5,9];
   const actor=i===1?[grabPoses[1]]:[i===0?defenseIdle:grabPoses[1],grabPoses[i],i===2||i===0?grabPoses[1]:defenseIdle];
   const receiver=i===1?[grabbedPoses[1]]:[i===0?defenseIdle:grabbedPoses[1],grabbedPoses[i],i<3?grabbedPoses[1]:i===3?defenseIdle:aerialPose(5)];
   for(const [key,frames,art,scale] of [[name,actor,grabArt,grabScale],[victimKeys[i],receiver,grabbedArt,grabbedScale]]){
     clips[key]={image:art.image,scale,durations,loop:i===1,frames,...(key===name&&(i===2||i>=4)?{activeWindow:[durations[0],durations[0]+durations[1]]}:{})};
     checks.push({fighter:char.id,clip:key,frames:frames.length,transparentFraction:art.transparentFraction,cellMarginsPassed:true,sha256:art.sha256});
   }
 }
 const movingGrabs=loadCombatSheet('-moving-grabs-v1.png',2,2,isMoonshine?620:undefined);
 const movingScale=char.worldHeight*.90/movingGrabs.bounds[2].height;
 const movingRoots=isMoonshine?[334,924,289,1003]:[364,1070,383,1180];
 const movingPoses=movingRoots.map((x,i)=>combatPose(movingGrabs,i,movingScale,x));
 for(const [i,name] of ['grab_dash','grab_pivot'].entries()){
   const reach=movingPoses[i*2+1];
   const hand=isMoonshine?[[1213,247],[750,823]][i]:[[1384,162],[943,683]][i];
   reach.grabContact=hand.map((value,axis)=>(value-reach.rect[axis]-reach.root[axis])*reach.scale*3.2);
   const durations=i===0?[7,5,8]:[6,5,8];
   const frames=[movingPoses[i*2],reach,grabPoses[1]];
   clips[name]={image:movingGrabs.image,scale:movingScale,durations,loop:false,frames};
   const victimName=name+'_victim_preview';
   clips[victimName]={...clips.grabbed,durations};
   for(const [key,art] of [[name,movingGrabs],[victimName,grabbedArt]]){
     checks.push({fighter:char.id,clip:key,frames:3,transparentFraction:art.transparentFraction,cellMarginsPassed:true,sha256:art.sha256});
   }
 }
 const ledgeArt=loadCombatSheet('-footstool-ledge-v1.png',4,2);
 const ledgeScale=char.worldHeight*.91/ledgeArt.bounds[2].height;
 const ledgeRoots=isMoonshine?[242,638,1114,1528,218,660,1050,1552]:[240,648,1110,1530,244,668,1050,1547];
 const ledgePoses=ledgeRoots.map((x,i)=>combatPose(ledgeArt,i,ledgeScale*(i===2||i===3?1.15:1),x));
 const airReady=aerialPose(5);
 const [stomp,stooled,hang,climb,ledgeRoll,ledgeJump,ledgeAttack,ledgeDrop]=ledgePoses;
 const head=isMoonshine?[697,113]:[714,119];
 stooled.footstoolContact=head.map((value,axis)=>(value-stooled.rect[axis]-stooled.root[axis])*ledgeScale*3.2);
 stomp.footstoolContact=[0,0];
 const ledgeSpecs=[
   ['footstool_attacker',[airReady,stomp,ledgeJump],[4,4,9],false],
   ['footstool_air_victim',[airReady,stooled,reactionPoses[1]],[4,4,9],false],
   ['ledge_hang',[hang],[18],true],
   ['ledge_climb',[hang,climb,defenseIdle],[4,8,8],false],
   ['ledge_roll',[hang,climb,ledgeRoll,defenseIdle],[4,5,7,7],false],
   ['ledge_jump',[hang,ledgeJump,airReady],[4,7,9],false],
   ['ledge_attack',[hang,climb,ledgeAttack,defenseIdle],[4,5,6,9],false],
   ['ledge_drop',[hang,ledgeDrop,airReady],[4,5,9],false],
 ];
 for(const [name,frames,durations,loop] of ledgeSpecs){
   clips[name]={image:ledgeArt.image,scale:ledgeScale,durations,loop,frames,...(name==='ledge_attack'?{activeWindow:[9,15]}:{})};
   checks.push({fighter:char.id,clip:name,frames:frames.length,transparentFraction:ledgeArt.transparentFraction,cellMarginsPassed:true,sha256:ledgeArt.sha256});
 }
 const ledgeContactArt=loadCombatSheet('-ledge-contact-v1.png',3,1);
 const contactScale=char.worldHeight*.74/ledgeContactArt.bounds[0].height;
 const [groundedStool,catchPose,trump]=[0,1,2].map((i)=>combatPose(ledgeContactArt,i,contactScale*(i===1?1.1:1),
   (isMoonshine?[380,1075,1735]:[362,1050,1740])[i]));
 function ledgeAnchor(pose,x,y){
   return [(x-pose.rect[0]-pose.root[0])*pose.scale*3.2,(y-pose.rect[1]-pose.root[1])*pose.scale*3.2];
 }
 hang.ledgeContact=ledgeAnchor(hang,...(isMoonshine?[1155,54]:[1156,48]));
 climb.ledgeContact=ledgeAnchor(climb,...(isMoonshine?[1597,265]:[1590,263]));
 catchPose.ledgeContact=ledgeAnchor(catchPose,...(isMoonshine?[1258,56]:[1273,74]));
 groundedStool.footstoolContact=ledgeAnchor(groundedStool,...(isMoonshine?[412,183]:[449,222]));
 function addContactSocket(pose,key,point){
   pose.sockets={...pose.sockets,[key]:point.map((value,axis)=>pose.root[axis]+value/(pose.scale*3.2))};
 }
 addContactSocket(stomp,'footstoolSole',stomp.footstoolContact);
 for(const pose of [stooled,groundedStool])addContactSocket(pose,'footstoolHead',pose.footstoolContact);
 for(const pose of [hang,climb,catchPose])addContactSocket(pose,'ledgeGrip',pose.ledgeContact);
 const contactSpecs=[
   ['footstool_ground_victim',[defenseIdle,groundedStool,defenseIdle],[4,4,9]],
   ['footstool_ground_preview',clips.footstool_attacker.frames,[4,4,9]],
   ['ledge_catch',[catchPose,hang],[5,10]],
   ['ledge_trump',[hang,trump,airReady],[4,6,10]],
 ];
 for(const [name,frames,durations] of contactSpecs){
   clips[name]={image:ledgeContactArt.image,scale:contactScale,durations,loop:false,frames};
   checks.push({fighter:char.id,clip:name,frames:frames.length,transparentFraction:ledgeContactArt.transparentFraction,cellMarginsPassed:true,sha256:ledgeContactArt.sha256});
 }
 const presentation=loadCombatSheet('-presentation-v1.png',4,2,undefined,437);
 const presentationScale=char.worldHeight*.96/presentation.bounds[2].height;
 const presentationRoots=isMoonshine?[208,675,1121,1552,231,668,1123,1552]:[229,662,1117,1547,233,656,1113,1542];
 const [helpless,kneel,entry,respawn,tauntUp,tauntSide,victory,defeat]=presentationRoots.map((x,i)=>combatPose(presentation,i,presentationScale,x));
 const showSpecs=[
   ['helpless_enter',[airReady,helpless],[3,6],false],
   ['helpless_loop',[helpless],[12],true],
   ['helpless_land',[kneel,tripSettle,defenseIdle],[7,7,6],false],
   ['entry',[entry,defenseIdle],[12,12],false],
   ['respawn_wait',[respawn],[16],true],
   ['respawn_drop',[respawn,softLandingPose(),defenseIdle],[14,5,7],false],
   ['taunt_up',[defenseIdle,tauntUp,defenseIdle],[4,19,6],false],
   ['taunt_side',[defenseIdle,tauntSide,defenseIdle],[4,19,6],false],
   ['victory_1',[tauntUp,victory],[8,24],false],
   ['defeat',[defenseIdle,defeat],[7,25],false],
 ];
 function softLandingPose(){
   const clip=clips.land_soft;
   return {...clip.frames[1],image:clip.image,scale:clip.scale};
 }
 for(const [name,frames,durations,loop] of showSpecs){
   clips[name]={image:presentation.image,scale:presentationScale,durations,loop,frames};
   checks.push({fighter:char.id,clip:name,frames:frames.length,transparentFraction:presentation.transparentFraction,cellMarginsPassed:true,sha256:presentation.sha256});
 }
 const presentationAlts=loadCombatSheet('-presentation-alts-v1.png',3,1);
 const altScale=char.worldHeight*.97/presentationAlts.bounds[1].height;
 const altRoots=isMoonshine?[330,1072,1802]:[432,1085,1755];
 const [tauntDown,victoryTwo,victoryThree]=altRoots.map((x,i)=>combatPose(presentationAlts,i,altScale,x));
 const crouch=clips.crouch_enter;
 const crouchStart={...crouch.frames[0],image:crouch.image,scale:crouch.scale};
 const alternateSpecs=[
   ['taunt_down',[crouchStart,tauntDown,tripSettle,defenseIdle],[5,18,6,6]],
   ['victory_2',[defenseIdle,victoryTwo],[7,25]],
   ['victory_3',[defenseIdle,victoryThree],[8,24]],
 ];
 for(const [name,frames,durations] of alternateSpecs){
   clips[name]={image:presentationAlts.image,scale:altScale,durations,loop:false,frames};
   checks.push({fighter:char.id,clip:name,frames:frames.length,transparentFraction:presentationAlts.transparentFraction,cellMarginsPassed:true,sha256:presentationAlts.sha256});
 }
 const koArt=loadCombatSheet('-ko-shield-break-v1.png',3,2);
 const koScale=char.worldHeight*.95/koArt.bounds[5].height;
 const koRoots=isMoonshine?[258,777,1300,245,756,1276]:[272,763,1287,271,774,1259];
 const [screen,star,burst,dizzyA,dizzyB,guard]=koRoots.map((x,i)=>combatPose(koArt,i,koScale,x));
 const koSpecs=[
   ['ko_screen',[reactionPoses[2],screen],[5,14],false],
   ['ko_star',[reactionPoses[2],star],[5,18],false],
   ['shield_break_launch',[shieldHold,isMoonshine?reactionPoses[2]:burst],[3,9],false],
   ['shield_break_dizzy',[dizzyA,dizzyB],[8,8],true],
   ['shield_break_recover',[dizzyA,guard,defenseIdle],[4,7,6],false],
 ];
 for(const [name,frames,durations,loop] of koSpecs){
   clips[name]={image:koArt.image,scale:koScale,durations,loop,frames};
   checks.push({fighter:char.id,clip:name,frames:frames.length,transparentFraction:koArt.transparentFraction,cellMarginsPassed:true,sha256:koArt.sha256});
 }
 const jabArt=loadCombatSheet('-jab-followups-v1.png',2,2);
 const jabScale=char.worldHeight/jabArt.bounds[1].height;
 const jabRoots=isMoonshine?[309,920,326,922]:[375,1132,376,1137];
 const jabPoses=jabRoots.map((x,i)=>combatPose(jabArt,i,jabScale,x));
 for(const [i,name] of ['jab_2','jab_3'].entries()){
   const durations=i===0?[3,3,7]:[4,4,9];
   const frames=[i===0?defenseIdle:jabPoses[1],jabPoses[i*2],jabPoses[i*2+1]];
   clips[name]={image:jabArt.image,scale:jabScale,durations,loop:false,frames,activeWindow:[durations[0],durations[0]+durations[1]]};
   checks.push({fighter:char.id,clip:name,frames:frames.length,transparentFraction:jabArt.transparentFraction,cellMarginsPassed:true,sha256:jabArt.sha256});
 }
 const specials=loadCombatSheet('-specials-v1.png',3,2);
 const specialScale=char.worldHeight*.95/specials.bounds[5].height;
 const specialRoots=isMoonshine?[224,730,1267,251,737,1275]:[220,740,1310,247,751,1282];
 const [neutral,side,up,down,counter,settle]=specialRoots.map((x,i)=>combatPose(specials,i,specialScale,x));
 up.root[1]=(isMoonshine?254:270)-up.rect[1]+char.worldHeight*.48/specialScale;
 up.registration='guided pelvis';
 const specialSpecs=[
   ['neutral_special',[defenseIdle,neutral,settle],[7,6,12],[7,13]],
   ['side_special',[movingPoses[0],side,settle],[7,7,12],[7,14]],
   ['up_special',[crouchStart,up,airReady],[5,8,12],[5,13]],
   ['down_special',[defenseIdle,down,settle],[5,14,9],null],
   ['counter_success',[down,counter,settle],[2,6,12],[2,8]],
 ];
 for(const [name,frames,durations,activeWindow] of specialSpecs){
   clips[name]={image:specials.image,scale:specialScale,durations,loop:false,frames,...(activeWindow?{activeWindow}:{})};
   checks.push({fighter:char.id,clip:name,frames:frames.length,transparentFraction:specials.transparentFraction,cellMarginsPassed:true,sha256:specials.sha256});
 }
 const takeoffs=loadCombatSheet('-takeoff-rise-v1.png',3,2,undefined,isMoonshine?485:undefined);
 const riseScale=char.worldHeight*.96/takeoffs.bounds[1].height;
 const riseAnchors=isMoonshine?[[294,0],[775,226],[1268,229],[238,758],[758,729],[1242,714]]:
   [[291,0],[768,253],[1278,241],[244,771],[746,745],[1252,700]];
 const risePoses=riseAnchors.map(([x,y],i)=>{
   const pose=combatPose(takeoffs,i,riseScale,x);
   if(i>0){
     pose.root[1]=y-pose.rect[1]+char.worldHeight*.48/riseScale;
     pose.registration='guided pelvis';
   }
   return pose;
 });
 const run=clips.run;
 const firstRun={...run.frames[0],image:run.image,scale:run.scale};
 const riseSpecs=[
   ['dash_start',[defenseIdle,risePoses[0],firstRun],[2,4,3],false],
   ['takeoff_neutral',[crouchStart,risePoses[1]],[3,6],false],
   ['takeoff_forward',[crouchStart,risePoses[2]],[3,6],false],
   ['takeoff_backward',[crouchStart,risePoses[3]],[3,6],false],
   ['air_rise_loop',risePoses.slice(4),[6,6],true],
 ];
 for(const [name,frames,durations,loop] of riseSpecs){
   clips[name]={image:takeoffs.image,scale:riseScale,durations,loop,frames};
   checks.push({fighter:char.id,clip:name,frames:frames.length,transparentFraction:takeoffs.transparentFraction,cellMarginsPassed:true,sha256:takeoffs.sha256});
 }
 for(const [name,target] of Object.entries(manifest.compatibilityAliases)){
   clips[name]={...clips[target],aliasOf:target};
 }
 const crouchArt=loadCombatSheet('-crouch-polish-v1.png',3,2);
 const crouchScale=char.worldHeight*.96/crouchArt.bounds[5].height;
 const crouchRoots=isMoonshine?[255,738,1270,263,755,1260]:[248,744,1253,265,746,1253];
 const crouchPoses=crouchRoots.map((x,i)=>combatPose(crouchArt,i,crouchScale,x));
 const crouchSpecs=[
   ['crouch_enter',0,[2,2],false],
   ['crouch_hold',2,[9,9],true],
   ['crouch_exit',4,[2,2],false],
 ];
 for(const [name,start,durations,loop] of crouchSpecs){
   const frames=crouchPoses.slice(start,start+2);
   clips[name]={image:crouchArt.image,scale:crouchScale,durations,loop,frames};
   const check=checks.find(entry=>entry.fighter===char.id&&entry.clip===name);
   Object.assign(check,{frames:frames.length,transparentFraction:crouchArt.transparentFraction,sha256:crouchArt.sha256});
 }
 const jumpArt=loadCombatSheet('-jump-polish-v1.png',3,2,undefined,490);
 const jumpPolishScale=char.worldHeight*.98/jumpArt.bounds[2].height;
 const jumpRoots=isMoonshine?[[285,0],[740,0],[1222,0],[283,772],[752,741],[1220,779]]:
   [[275,0],[768,0],[1260,0],[264,775],[764,754],[1233,757]];
 const jumpPoses=jumpRoots.map(([x,y],i)=>{
   const pose=combatPose(jumpArt,i,jumpPolishScale,x);
   if(i>=3){
     pose.root[1]=y-pose.rect[1]+char.worldHeight*.48/jumpPolishScale;
     pose.registration='guided pelvis';
   }
   return pose;
 });
 for(const [name,start,durations] of [['jump_squat',0,[1,1,1]],['double_jump_transition',3,[2,2,2]]]){
   const frames=jumpPoses.slice(start,start+3);
   clips[name]={image:jumpArt.image,scale:jumpPolishScale,durations,loop:false,frames};
   const check=checks.find(entry=>entry.fighter===char.id&&entry.clip===name);
   Object.assign(check,{frames:frames.length,transparentFraction:jumpArt.transparentFraction,sha256:jumpArt.sha256});
 }
 const airLoops=loadCombatSheet('-air-loops-v1.png',3,2);
 const loopScale=char.worldHeight*.93/airLoops.bounds[1].height;
 const loopPelvis=isMoonshine?[[188,346],[567,355],[940,372],[193,1029],[565,1029],[940,1041]]:
   [[280,255],[774,263],[1231,245],[280,765],[772,774],[1233,765]];
 for(const [i,[name,durations]] of [['air_apex_loop',[6,6]],['air_fall_loop',[6,6]],['air_fastfall_loop',[5,5]]].entries()){
   const frames=[i,i+3].map(index=>{
     const [x,y]=loopPelvis[index],pose=combatPose(airLoops,index,loopScale,x);
     pose.root[1]=y-pose.rect[1]+char.worldHeight*.48/loopScale;
     pose.registration='guided pelvis';
     return pose;
   });
   clips[name]={image:airLoops.image,scale:loopScale,durations,loop:true,frames};
   const check=checks.find(entry=>entry.fighter===char.id&&entry.clip===name);
   Object.assign(check,{frames:frames.length,transparentFraction:airLoops.transparentFraction,sha256:airLoops.sha256});
 }
 const teeterArt=loadCombatSheet('-teeter-polish-v1.png',2,2);
 const teeterScale=char.worldHeight*.98/teeterArt.bounds[0].height;
 const teeterBoots=isMoonshine?[170,729,371,977]:[167,798,437,1142];
 for(const [row,name] of ['teeter_front','teeter_back'].entries()){
   const frames=[row*2,row*2+1].map(i=>({
     ...combatPose(teeterArt,i,teeterScale,teeterBoots[i]),registration:'supporting boot center and sole baseline',
   }));
   clips[name]={image:teeterArt.image,scale:teeterScale,durations:[7,7],loop:true,frames};
   const check=checks.find(entry=>entry.fighter===char.id&&entry.clip===name);
   Object.assign(check,{frames:frames.length,transparentFraction:teeterArt.transparentFraction,sha256:teeterArt.sha256});
 }
 const holdArt=loadCombatSheet('-hold-polish-v1.png',3,1,undefined,undefined,[0,737,1450,2172]);
 const holdSpecs=[
   ['prone_up',['getup_up','getup_roll_up','floor_attack_up']],
   ['prone_down',['getup_down','getup_roll_down','floor_attack_down']],
   ['trip_prone',['trip_getup','trip_roll','floor_attack_trip']],
 ];
 const holdRoots=isMoonshine?[390,1092,1800]:[348,1080,1745];
 for(const [i,[name,recoveries]] of holdSpecs.entries()){
   const clip=clips[name];
   const initial=clip.frames[0],bounds=holdArt.bounds[i];
   const scale=(initial.scale??clip.scale)*(initial.rect[2]-4)/(bounds.x1-bounds.x0+1);
   const pose=combatPose(holdArt,i,scale,holdRoots[i]);
   clip.frames=[initial,pose];
   clip.durations=[9,9];
   for(const recovery of recoveries){
     const action=clips[recovery],holdTicks=action.durations[0];
     action.frames=[initial,pose,...action.frames.slice(1)];
     action.durations=[Math.ceil(holdTicks/2),Math.floor(holdTicks/2),...action.durations.slice(1)];
   }
   for(const key of [name,...recoveries]){
     const check=checks.find(entry=>entry.fighter===char.id&&entry.clip===key);
     check.frames=clips[key].frames.length;
     check.holdSheet={image:holdArt.image,sha256:holdArt.sha256,transparentFraction:holdArt.transparentFraction,cellMarginsPassed:true};
   }
 }
 const tumbleSide=loadCombatSheet('-tumble-side-v1.png',1,1);
 const tumbleClip=clips.tumble;
 const tumbleStart=tumbleClip.frames[0];
 const sideBounds=tumbleSide.bounds[0];
 const sideScale=(tumbleStart.rect[2]-4)*tumbleStart.scale/(sideBounds.x1-sideBounds.x0+1);
 const sidePose=combatPose(tumbleSide,0,sideScale,(sideBounds.x0+sideBounds.x1)/2);
 sidePose.root[1]=sidePose.rect[3]/2+char.worldHeight*.48/sideScale;
 sidePose.registration='guided rotation center';
 tumbleClip.frames.splice(2,0,sidePose);
 tumbleClip.durations=[3,3,3,3];
 const tumbleCheck=checks.find(entry=>entry.fighter===char.id&&entry.clip==='tumble');
 tumbleCheck.frames=tumbleClip.frames.length;
 tumbleCheck.sidePose={image:tumbleSide.image,sha256:tumbleSide.sha256,transparentFraction:tumbleSide.transparentFraction,cellMarginsPassed:true};
 const runClearance=char.id==='moonshine'?[0,0,.5,9]:[0,0,1,6];
 for(const [i,frame] of clips.run.frames.entries()){
   frame.root[1]=frame.rect[3]-2+runClearance[i%4]/clips.run.scale;
   frame.registration='paired stride clearance and guided torso';
 }
 const teeterMid=loadCombatSheet('-teeter-mid-v1.png',1,1);
 const frontTeeter=clips.teeter_front;
 const [upright,lean]=frontTeeter.frames;
 const targetHeight=(upright.visibleHeight+lean.visibleHeight)*frontTeeter.scale/2;
 const midpoint=combatPose(teeterMid,0,targetHeight/teeterMid.bounds[0].height,isMoonshine?550:453);
 midpoint.registration='supporting boot center and sole baseline';
 frontTeeter.frames=[upright,midpoint,lean,midpoint];
 frontTeeter.durations=[4,3,4,3];
 const teeterCheck=checks.find(entry=>entry.fighter===char.id&&entry.clip==='teeter_front');
 teeterCheck.frames=4;
 teeterCheck.midpointSheet={image:teeterMid.image,sha256:teeterMid.sha256,transparentFraction:teeterMid.transparentFraction,cellMarginsPassed:true};
 manifest.characters[char.id]={name:char.name,portrait:char.id+'-portrait-v1.png',worldHeight:char.worldHeight,weightProposal:char.weight,role:char.role,overrideProposals:char.overrides,clips};}
const existing=JSON.parse(fs.readFileSync(path.join(root,'apps/client/public/fighter-art-pilot-v1/manifest.json'),'utf8'));const required=Object.keys(existing.characters['all-rounder'].clips);manifest.coverage=Object.fromEntries(roster.map(c=>[c.id,{registered:Object.keys(manifest.characters[c.id].clips),remainingKeys:required.filter(k=>!manifest.characters[c.id].clips[k]),requiredKeyCount:required.length}]));
fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(dir,'validation.json'),JSON.stringify({passed:true,characters:2,clips:checks.length,registeredFrames:checks.reduce((n,c)=>n+c.frames,0),checks,portraits:portraitChecks,knownVisualWork:['Hoagie walk needs motion review across the new contact and passing poses','gait seams and idle/jab posture need motion review'],visualSignoff:'pending animation review; registration is candidate metadata'},null,2)+'\n');
const html=fs.readFileSync(path.join(root,'scripts/assets/newcomer-pilot-review.template.html'),'utf8').replace('__MANIFEST__',JSON.stringify(manifest)).replace('__REVIEW_REVISION__',String(manifest.revision));fs.writeFileSync(path.join(dir,'index.html'),html);fs.copyFileSync(path.join(root,'scripts/assets/newcomer-review.js'),path.join(dir,'review.js'));console.log('Newcomer movement: 830 registered frames across two fighters.');
