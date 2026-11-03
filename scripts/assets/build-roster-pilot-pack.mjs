import {AIRBORNE_CLIPS,airborneReference,registerAirborneClip} from "./airborne-metadata.mjs";
import {ACTION_CLIPS,ACTION_FOUR,actionReference,registerActionClip} from "./action-metadata.mjs";
import {TRANSITION_CLIPS,TRANSITION_LOOPS,transitionReference,registerTransitionClip} from "./transition-metadata.mjs";
import {FLOOR_CLIPS,FLOOR_LOOPS,floorReference,registerFloorClip} from "./floor-metadata.mjs";
import {LEDGE_CLIPS,registerLedgeClip} from "./ledge-metadata.mjs";
import fs from 'node:fs';
import path from 'node:path';
import {PNG} from 'pngjs';
import {getMoveDataForCharacter} from '../../packages/engine/dist/moves/index.js';
const roster=[
 {id:'all-rounder',worldHeight:80,groundOffset:28},
 {id:'abe-lincoln',worldHeight:96,groundOffset:32},
 {id:'swift',worldHeight:76,groundOffset:26},
];
const attackMoves={grab:'GRAB',pummel:'PUMMEL',forward_throw:'FORWARD_THROW',back_throw:'BACK_THROW',up_throw:'UP_THROW',down_throw:'DOWN_THROW',neutral_special:'NEUTRAL_SPECIAL',side_special:'SIDE_SPECIAL',up_special:'UP_SPECIAL',down_special:'DOWN_SPECIAL',neutral_air:'NEUTRAL_AIR',forward_air:'FORWARD_AIR',back_air:'BACK_AIR',up_air:'UP_AIR',down_air:'DOWN_AIR',jab:'JAB',forward_tilt:'FORWARD_TILT',up_tilt:'UP_TILT',down_tilt:'DOWN_TILT',forward_smash:'FORWARD_SMASH',up_smash:'UP_SMASH',down_smash:'DOWN_SMASH'};
function frameRegion(png,index,columns,rows){
 return [Math.round(index%columns*png.width/columns),Math.round(Math.floor(index/columns)*png.height/rows),Math.round((index%columns+1)*png.width/columns),Math.round((Math.floor(index/columns)+1)*png.height/rows)];
}
function register(png,index,columns,rows,image){
 const [left,gridTop,right,gridBottom]=frameRegion(png,index,columns,rows);
 const boundary=(image.includes('up-special')||['all-rounder-up-throw-v1.png','swift-up-throw-v1.png'].includes(image))?490:image.includes('shared-effects-counter-flash')&&index%columns===0?Math.round(png.height*.46):image==='all-rounder-up-tilt-v1.png'?495:Math.round(png.height/2);
 const top=rows===2?(index<columns?gridTop:boundary):gridTop,bottom=rows===2?(index<columns?boundary:gridBottom):gridBottom;
 let minX=right,maxX=-1,minY=bottom,maxY=-1;
 for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)if(png.data[(y*png.width+x)*4+3]>32){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
 if(maxX<minX||minX<=left||maxX>=right-1||minY<=top||maxY>=bottom-1)throw Error('Blank, clipped or overlapping frame '+index);
 const height=maxY-minY+1,occupied=[];
 for(let x=minX;x<=maxX;x++){let found=false;for(let y=Math.max(top,maxY-Math.round(height*.05));y<=maxY;y++)if(png.data[(y*png.width+x)*4+3]>64){found=true;break;}if(found)occupied.push(x);}
 if(!occupied.length)throw Error('No support sole found');
 const clusters=[];for(const x of occupied){const last=clusters.at(-1);if(last&&x-last[1]<=3)last[1]=x;else clusters.push([x,x]);}
 const support=image.includes('down-smash')&&index===3?clusters.at(-1):clusters[0],supportX=(support[0]+support[1])/2,feetX=(occupied[0]+occupied.at(-1))/2;
 let headSum=0,headWeight=0;for(let y=minY;y<minY+height*.22;y++)for(let x=minX;x<=maxX;x++){const alpha=png.data[(y*png.width+x)*4+3];if(alpha>64){headSum+=x*alpha;headWeight+=alpha;}}
 const trimX=Math.max(left,minX-3),trimY=Math.max(top,minY-3);
 return {rect:[trimX,trimY,Math.min(right,maxX+4)-trimX,Math.min(bottom,maxY+4)-trimY],sourceSize:[right-left,bottom-top],trim:[trimX-left,trimY-top],visibleHeight:height,supportX,feetX,headX:headSum/headWeight-height*.035,floorY:maxY+1,supportWidth:support[1]-support[0]+1};
}
function buildClip(target,character,name){
 const image=character.id+'-'+name.replaceAll('_','-')+(['run'].includes(name)?'-v2.png':'-v1.png');
 const png=PNG.sync.read(fs.readFileSync(path.join(target,image)));
 if(Math.max(png.width,png.height)>2048)throw Error(image+': source page exceeds 2048');
 let empty=0;for(let i=3;i<png.data.length;i+=4)if(png.data[i]===0)empty++;
 if(empty/(png.width*png.height)<.5)throw Error(image+': alpha check failed');
 const four=ACTION_FOUR.includes(name)||TRANSITION_LOOPS.includes(name)||FLOOR_LOOPS.includes(name)||['idle','shield','reaction','counter_success','grab_hold','grabbed','pummel_victim','grab_release','ledge_catch','ledge_hang','ledge_drop','ledge_trump'].includes(name);
 const columns=four?2:3,rows=name==='jab'?3:2,count=name==='jab'?9:four?4:6;
 const measured=Array.from({length:count},(_,i)=>register(png,i,columns,rows,image));
 const isAttack=name in attackMoves,isAerial=name.endsWith('_air')||name==='up_special'||name==='throw_victim';
 const referenceHeight=AIRBORNE_CLIPS.includes(name)?airborneReference(name,measured):ACTION_CLIPS.includes(name)?actionReference(name,measured):TRANSITION_CLIPS.includes(name)?transitionReference(name,measured):FLOOR_CLIPS.includes(name)?floorReference(name,measured):name.startsWith("ledge_")?(["ledge_climb","ledge_roll","ledge_attack"].includes(name)?measured[5].visibleHeight:measured[0].visibleHeight/1.15):name==="throw_victim"?measured[2].visibleHeight/1.15:isAerial?measured[0].visibleHeight/.9:['dodge','roll'].includes(name)?measured[5].visibleHeight:['reaction','counter_success'].includes(name)?measured[0].visibleHeight:name==='jump'?measured[3].visibleHeight:name==='run'?Math.max(...measured.map(f=>f.visibleHeight)):isAttack?measured[0].visibleHeight:[...measured.map(f=>f.visibleHeight)].sort((a,b)=>a-b)[Math.floor(count/2)];
 const offset=measured[0].feetX-measured[0].supportX;
 const frames=measured.map(f=>{
  const rootX=isAttack?f.supportX+offset:['walk','run'].includes(name)?f.headX:f.feetX;
  return {rect:f.rect,root:[rootX-f.rect[0],f.floorY-f.rect[1]],sourceSize:f.sourceSize,trim:f.trim,visibleHeight:f.visibleHeight,registration:isAttack?'support-foot':name==='walk'?'head':'feet',offsetY:character.groundOffset,sockets:{supportFoot:[f.supportX-f.rect[0],f.floorY-f.rect[1]]}};
 });
 // Preserve the reviewed planted-foot correction on the All-Rounder charge pose.
 if(character.id==="all-rounder"&&name==="down_smash"){frames[1].root[0]=130.5;frames[1].sockets.supportFoot[0]=47.5;}
 if(isAerial)for(const[i,frame]of frames.entries()){const region=frameRegion(png,i,columns,rows);frame.root=[(region[0]+region[2])/2-frame.rect[0],region[1]+(region[3]-region[1])*.55-frame.rect[1]];frame.offsetY=0;frame.registration='cell-torso';frame.sockets={torso:[...frame.root]};}
 if(name.endsWith('_special')||name==='counter_success')for(const[i,frame]of frames.entries()){const region=frameRegion(png,i,columns,rows);frame.airRoot=[(region[0]+region[2])/2-frame.rect[0],region[1]+(region[3]-region[1])*.55-frame.rect[1]];}
 const durations={grab_hold:[12,12,12,12],grabbed:[12,12,12,12],pummel_victim:[2,2,2,2],grab_release:[3,3,3,3],throw_victim:[6,6,6,6,6,6],counter_success:[3,3,3,3],idle:[12,12,12,12],walk:[4,4,4,4,4,4],run:[3,3,3,3,3,3],jump:[3,12,8,12,6,6],shield:[12,12,12,12],dodge:[3,3,4,4,3,3],roll:[3,3,4,4,3,3],reaction:[6,10,12,18]};
 if(name==='run')for(const frame of frames)frame.root[1]=3+referenceHeight;
 if(name==='jump')for(const[i,frame]of frames.entries())if(i>0&&i<5){frame.root[1]=3+referenceHeight*.65;frame.offsetY=0;}
 if(name==='roll')for(const i of[2,3]){frames[i].root=[frames[i].rect[2]/2,frames[i].rect[3]/2];frames[i].offsetY=0;}
 if(name==='reaction'){frames[2].root=[frames[2].rect[2]/2,frames[2].rect[3]/2];frames[2].offsetY=0;frames[3].root[0]=frames[3].rect[2]/2;}
 const clip={image,scale:character.worldHeight/referenceHeight,durations:durations[name]??Array(count).fill(4),frames};
 if(name==="pummel_victim"&&character.id!=="swift")clip.mirrorSource=true;
 if(name==="throw_victim")clip.phases=["forward launch","back launch","up launch","down impact","bounce","tumble"];
 if(isAttack){
  const move=getMoveDataForCharacter(character.id,attackMoves[name]);
  const s=move.startupFrames,r=move.recoveryFrames;
  clip.durations=[Math.floor(s/3),Math.floor(s*2/3)-Math.floor(s/3),s-Math.floor(s*2/3),move.activeFrames,Math.ceil(r/2),Math.floor(r/2)];
  if(name==='jab')clip.durations=[Math.floor(s/3),Math.floor(s*2/3)-Math.floor(s/3),s-Math.floor(s*2/3),move.activeFrames,...Array.from({length:5},(_,i)=>Math.floor((i+1)*r/5)-Math.floor(i*r/5))];
  clip.activeWindow=[s,s+move.activeFrames];clip.moveId=move.id;
  if(name==='neutral_special'||name==='down_special'){clip.durations=[Math.floor(s/3),Math.floor(s*2/3)-Math.floor(s/3),s-Math.floor(s*2/3),1,Math.ceil((r-1)/2),Math.floor((r-1)/2)];clip.eventWindow=name==='neutral_special'?[s,s+1]:[0,s];clip.phases=name==='neutral_special'?['ready','gather','prepare','release','retract','recover']:['guard','brace','counter ready','relax','recover','guard'];}

  if(isAerial){clip.airborne=true;clip.landingLag=move.landingLag;clip.phases=['ready','anticipation','extension','contact','retract','airborne recovery'];clip.hitboxes=move.hitboxPerActiveFrame.map(b=>b?{offsetX:b.offsetX,offsetY:b.offsetY,radius:b.radius}:null);}

  if(name.endsWith('_smash')){clip.chargeHoldIndex=1;clip.chargeMax=move.chargeMax??60;clip.phases=name==='down_smash'?['anticipation','charge hold','front contact','rear contact','retract','recover']:['anticipation','charge hold','release','impact','retract','recover'];if(name==='down_smash')clip.durations=[Math.ceil(s/2),Math.floor(s/2),Math.ceil(move.activeFrames/2),Math.floor(move.activeFrames/2),Math.ceil(r/2),Math.floor(r/2)];clip.hitboxes=move.hitboxPerActiveFrame.map(b=>b?{offsetX:b.offsetX,offsetY:b.offsetY,radius:b.radius}:null);}

  const box=move.hitboxPerActiveFrame[0];if(box)clip.previewHitbox={offsetX:box.offsetX,offsetY:box.offsetY,radius:box.radius};
 }
 if(AIRBORNE_CLIPS.includes(name))registerAirborneClip(clip,name,character);
 if(ACTION_CLIPS.includes(name))registerActionClip(clip,name,character,png);
 if(TRANSITION_CLIPS.includes(name))registerTransitionClip(clip,name,character);
 if(FLOOR_CLIPS.includes(name))registerFloorClip(clip,name,character);
 if(name.startsWith("ledge_"))registerLedgeClip(clip,name,character);
 console.log(character.id+'/'+name+': '+count+' registered frames');
 return clip;
}
export function extendRosterPilot(manifest,target){
 manifest.characters={};
 for(const character of roster){
  const clips=character.id==='all-rounder'?manifest.clips:{};
  if(character.id==='all-rounder')for(const n of ['counter_success','grab_hold','grabbed','pummel_victim','grab_release','throw_victim'])clips[n]=buildClip(target,character,n);
  for(const name of [...(character.id==='all-rounder'?[]:['idle','walk','run','jump','shield','dodge','roll','reaction','counter_success','grab_hold','grabbed','pummel_victim','grab_release','throw_victim']),...Object.keys(attackMoves).filter(n=>n!=='jab'||character.id!=='all-rounder')])clips[name]=buildClip(target,character,name);
  for(const name of [...LEDGE_CLIPS,...FLOOR_CLIPS,...TRANSITION_CLIPS,...ACTION_CLIPS,...AIRBORNE_CLIPS])clips[name]=buildClip(target,character,name);
  if(character.id==='all-rounder')clips.run=buildClip(target,character,'run');
  manifest.characters[character.id]={worldHeight:character.worldHeight,groundOffset:character.groundOffset,clips};
 }
 manifest.effects={};
 for(const name of ['neutral_burst','side_trail','recovery_trail','counter_flash']){const image='shared-effects-'+name.replaceAll('_','-')+'-v1.png',png=PNG.sync.read(fs.readFileSync(path.join(target,image)));let empty=0;for(let i=3;i<png.data.length;i+=4)if(png.data[i]===0)empty++;if(empty/(png.width*png.height)<.5)throw Error('Effect alpha failed '+image);const measured=Array.from({length:4},(_,i)=>register(png,i,2,2,image));const frames=measured.map((f,i)=>{const region=frameRegion(png,i,2,2);return {rect:f.rect,root:[(region[0]+region[2])/2-f.rect[0],(region[1]+region[3])/2-f.rect[1]]};});manifest.effects[name]={image,scale:64/Math.max(...measured.map(f=>f.rect[2])),durations:[2,2,2,2],rotation:name==='recovery_trail'?Math.PI:0,frames};console.log('effect/'+name+':4 alpha/cell checks passed');}
 manifest.revision=18;
}
