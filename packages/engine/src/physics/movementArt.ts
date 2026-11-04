import{getCharacterStats,INPUT_BITS,type PlayerState,type InputEvent}from'@smash/shared';import type{StageData}from'./types.js';
/** Visual transition cues do not add turn/brake/edge gameplay lockout. */
export function withMovementArt(before:PlayerState,after:PlayerState,input:InputEvent|null,stage:StageData):PlayerState{
 const neutral=['IDLE','WALK','DASH','RUN','AIRBORNE','CROUCH','LANDING_LAG'].includes(after.state)&&!after.isKnockedOut&&after.stocks>0;
 let cue=neutral?(after.artCue!==before.artCue&&after.artCueFrame===0?after.artCue:before.artCue):undefined,age=cue?(after.artCue!==before.artCue&&after.artCueFrame===0?0:(before.artCueFrame??0)+1):0;
 if(cue==='entry'&&((input?.held??0)&(INPUT_BITS.LEFT|INPUT_BITS.RIGHT|INPUT_BITS.DOWN)))cue=undefined;
 if(cue&&((['platform_drop','respawn_drop','takeoff_neutral','takeoff_forward','takeoff_backward'].includes(cue)&&after.isGrounded)||(cue==='land_heavy'&&!after.isGrounded)||(['crouch_exit','brake','teeter_front','teeter_back'].includes(cue)&&after.state!=='IDLE')))cue=undefined;
 const set=(name:string)=>{cue=name;age=0;};
 if(!neutral||after.respawnTimer>0)return{...after,artCue:after.artCue==='respawn_drop'?after.artCue:undefined,artCueFrame:after.artCue==='respawn_drop'?after.artCueFrame:undefined};
 if(before.respawnTimer>0&&after.respawnTimer===0)set('respawn_drop');
 else if(before.isGrounded&&!after.isGrounded&&((input?.held??0)&INPUT_BITS.DOWN))set('platform_drop');
 else if(before.state==='JUMPSQUAT'&&after.state==='AIRBORNE')set(Math.abs(after.vx)<.5?'takeoff_neutral':after.vx*after.facing>0?'takeoff_forward':'takeoff_backward');
 else if(before.state==='AIR_DODGE'&&after.isGrounded)set('air_dodge_land');
 else if(before.state==='HITSTUN'&&before.isTumbling&&after.state==='AIRBORNE'&&!after.isTumbling&&!['wall_tech','wall_tech_jump','ceiling_tech'].includes(cue??''))set('tumble_recover');
 else if(before.state==='CROUCH'&&after.state==='IDLE')set('crouch_exit');
 else if(!before.isGrounded&&after.isGrounded&&before.vy>10&&['IDLE','AIRBORNE'].includes(after.state))set('land_heavy');
 else if(before.facing!==after.facing&&['IDLE','WALK','DASH','RUN'].includes(after.state))set(before.state==='RUN'?'turn_run':'turn_stand');
 else if(before.state==='RUN'&&after.state==='IDLE'&&Math.abs(before.vx)>.3)set('brake');
 if(cue&&age>=(cue==='entry'?54:cue==='respawn_drop'?36:['wall_tech','wall_tech_jump','ceiling_tech','air_dodge_land','tumble_recover'].includes(cue)?24:18)){cue=undefined;age=0;}
 if(!cue&&after.state==='IDLE'&&Math.abs(after.vx)<.3){const bottom=after.y+getCharacterStats(after.characterId).hurtboxRadius;for(const p of[stage.mainPlatform,...stage.platforms]){if(Math.abs(bottom-p.y)>2)continue;const edge=after.x-p.x<12?-1:p.x+p.width-after.x<12?1:0;if(edge&&after.x>=p.x&&after.x<=p.x+p.width){cue=edge===after.facing?'teeter_front':'teeter_back';age=before.artCue===cue?(before.artCueFrame??0)+1:0;break;}}}
 return{...after,artCue:cue,artCueFrame:cue?age:undefined};
}
