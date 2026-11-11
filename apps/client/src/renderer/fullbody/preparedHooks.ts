import type {PilotFrame,PilotClip} from './pilotTimeline.js';
export const PREPARED_LIVE_CLIPS:readonly PilotClip[]=["trip_fall","trip_prone","trip_getup","floor_attack_trip","trip_roll","jab_lock_up","jab_lock_down","ceiling_tech","air_dodge_land","air_dodge_up","air_dodge_side","air_dodge_up_diagonal","air_dodge_back","air_dodge_up_back","taunt_up","taunt_side","taunt_down","ko_launch","ko_screen","ko_star","grab_dash","grab_pivot","hit_high","hit_low","hit_heavy","hit_air","wall_tech","wall_tech_jump","tumble_recover","turn_stand","turn_run","brake","crouch_enter","crouch_hold","crouch_exit","land_heavy","platform_drop","teeter_front","teeter_back","takeoff_neutral","takeoff_forward","takeoff_backward","entry","respawn_wait","respawn_drop","victory_1","victory_2","victory_3","defeat",'helpless_enter','helpless_loop','helpless_land','footstool_attacker','footstool_ground_victim','footstool_air_victim','shield_raise','shield_hit','shield_drop','parry','shield_break_launch','shield_break_dizzy','shield_break_recover','air_rise_loop','air_apex_loop','air_fall_loop','air_fastfall_loop','double_jump_transition','land_soft','air_dodge_down','air_dodge_down_diagonal','air_dodge_down_back','jab_2','jab_3','dash_attack','knockdown_down','prone_down','getup_up','getup_down','getup_roll_up','getup_roll_down','floor_attack_up','floor_attack_down'];
export interface PreparedContext{isGrounded?:boolean;dodgeLevel?:number;dodgeKind?:'spot'|'forward'|'backward'|'air';tauntKind?:'up'|'side'|'down';impactVx?:number;wallTechSide?:'left'|'right';hitReaction?:'high'|'low'|'heavy'|'air';isTumbling?:boolean;artCue?:string;artCueFrame?:number;respawnTimer?:number;result?:'win'|'lose';presentationVariant?:number;ledgeContact?:{dx:number;dy:number};footstoolContact?:{artId?:import('./FullBodyPilot.js').DojoArtId;characterId:import('@smash/shared').CharacterId;role:'ground'|'air';frame:number;dx:number;dy:number;facing:1|-1};footstoolRole?:'attacker'|'ground'|'air';footstoolFrame?:number;footstoolPartnerId?:string;shieldReaction?:"hit"|"parry"|"break"|"drop";shieldReactionFrame?:number;hitstunFramesRemaining?:number;floorOrientation?:"up"|"down";floorRollDirection?:1|-1;isFastFalling?:boolean;airDodgeDirection?:{x:number;y:number}|null;facing?:1|-1}
export function selectPreparedFrame(state:string,frame:number,vy:number|undefined,c:PreparedContext):PilotFrame|null{
 const floorTick=Math.max(0,Math.floor(Number.isFinite(frame)?frame:0));
 if(state==='TRIP_FALL')return{clip:'trip_fall',index:Math.min(5,Math.floor(floorTick/4))};
 if(state==='TRIP_PRONE')return{clip:'trip_prone',index:Math.floor(floorTick/6)%4};
 if(state==='TRIP_GETUP'||state==='TRIP_ROLL')return{clip:state==='TRIP_GETUP'?'trip_getup':'trip_roll',index:Math.min(5,Math.floor(floorTick/4))};
 if(state==='JAB_LOCK')return{clip:c.floorOrientation==='down'?'jab_lock_down':'jab_lock_up',index:Math.min(3,Math.floor(floorTick/4))};
 if(state==='TAUNT'){const t=Math.max(0,Math.floor(frame)),ends=[8,16,28,46,54,64];return{clip:c.tauntKind==='side'?'taunt_side':c.tauntKind==='down'?'taunt_down':'taunt_up',index:t>=64?5:Math.max(0,ends.findIndex(n=>t<n))};}
 if((c.respawnTimer??0)>0)return{clip:'respawn_wait',index:Math.floor((c.respawnTimer??0)/12)%4};
 if(state==='RUN_BRAKE'||state==='RUN_TURN')return{clip:state==='RUN_BRAKE'?'brake':'turn_run',index:Math.min(5,Math.floor(floorTick/3))};
 if(state==='CROUCH'){const t=Math.max(0,Math.floor(frame));return t<18?{clip:'crouch_enter',index:Math.floor(t/3)}:{clip:'crouch_hold',index:Math.floor((t-18)/6)%4};}
 const age=Math.max(0,Math.floor(c.artCueFrame??0));
 if(c.artCue&&['IDLE','WALK','DASH','RUN','AIRBORNE','CROUCH'].includes(state)){
  if(c.artCue==='entry'&&age<54){const ends=[6,12,22,32,38,54];return{clip:'entry',index:ends.findIndex(n=>age<n)};}
  if(c.artCue==='respawn_drop'&&age<36)return{clip:'respawn_drop',index:Math.min(5,Math.floor(age/6))};
  if(c.artCue==='teeter_front'||c.artCue==='teeter_back')return{clip:c.artCue,index:Math.floor(age/6)%4};
  if(c.artCue==='land_soft'&&(state==='IDLE'||state==='AIRBORNE')&&age<12)return{clip:'land_soft',index:Math.floor(age/3)};
  const motion=['turn_stand','turn_run','brake','crouch_exit','land_heavy','platform_drop','takeoff_neutral','takeoff_forward','takeoff_backward'];
  if(motion.includes(c.artCue)&&age<18)return{clip:c.artCue as PilotClip,index:Math.floor(age/3)};
 }
 if(state==='HELPLESS'){const t=Math.max(0,Math.floor(frame));return t<24?{clip:'helpless_enter',index:Math.floor(t/4)}:{clip:'helpless_loop',index:Math.floor((t-24)/6)%6};}
 if(state==='HELPLESS_LAND')return{clip:'helpless_land',index:Math.min(5,Math.floor(Math.max(0,frame)*6/14))};
 const f=Math.max(0,Math.floor(c.footstoolFrame??0));
 if(c.footstoolRole&&f<18&&(c.footstoolRole==='attacker'?state==='AIRBORNE':state==='HITSTUN'))return{clip:c.footstoolRole==='attacker'?'footstool_attacker':c.footstoolRole==='ground'?'footstool_ground_victim':'footstool_air_victim',index:Math.min(5,Math.floor(f/3))};
 const cue=Math.max(0,Math.floor(c.shieldReactionFrame??0));
 if(c.shieldReaction==='parry'&&cue<18&&(state==='SHIELD'||state==='IDLE'))return{clip:'parry',index:Math.floor(cue/3)};
 if(state==='SHIELD'){
  if(c.shieldReaction==='drop')return{clip:'shield_drop',index:Math.min(5,Math.floor(cue*6/11))};
  if((c.shieldReaction==='hit'||c.shieldReaction==='parry')&&cue<18)return{clip:c.shieldReaction==='parry'?'parry':'shield_hit',index:Math.floor(cue/3)};
  if(frame<6)return{clip:'shield_raise',index:Math.max(0,Math.floor(frame))};
 }
 if(state==='IDLE'&&c.shieldReaction==='drop'&&cue<11)return{clip:'shield_drop',index:Math.min(5,Math.floor(cue*6/11))};
 if(state==='HITSTUN'&&c.shieldReaction==='break'){
  if(cue<18)return{clip:'shield_break_launch',index:Math.floor(cue/3)};
  const remaining=c.hitstunFramesRemaining??19;
  if(remaining<=18)return{clip:'shield_break_recover',index:Math.min(5,Math.floor((18-Math.max(0,remaining))/3))};
  return{clip:'shield_break_dizzy',index:Math.floor((cue-18)/6)%4};
 }
 if(state==='HITSTUN'&&!c.isTumbling&&c.hitReaction)return{clip:c.hitReaction==='heavy'?'hit_heavy':c.hitReaction==='air'?'hit_air':c.hitReaction==='high'?'hit_high':'hit_low',index:Math.min(c.hitReaction==='heavy'||c.hitReaction==='air'?5:3,Math.floor(Math.max(0,frame)/4))};
 if(state==='AIRBORNE'&&['wall_tech','wall_tech_jump','ceiling_tech','tumble_recover'].includes(c.artCue??'')&&(c.artCueFrame??0)<(c.artCue==='ceiling_tech'?26:24))return{clip:c.artCue as PilotClip,index:Math.min(5,Math.floor(Math.max(0,c.artCueFrame??0)/4))};
 if(c.artCue==='air_dodge_land'&&['IDLE','LANDING_LAG'].includes(state)&&(c.artCueFrame??0)<24)return{clip:'air_dodge_land',index:Math.min(5,Math.floor(Math.max(0,c.artCueFrame??0)/4))};
 const down=c.floorOrientation==='down';
 if(state==='HARD_LANDING'&&down){const t=Math.max(0,Math.floor(frame));if(t>=18)return{clip:'prone_down',index:Math.floor((t-18)/6)%4};const ends=[2,4,6,9,12,18];return{clip:'knockdown_down',index:ends.findIndex(n=>t<n)};}
 if(state==='GETUP'||state==='GETUP_ROLL')return{clip:state==='GETUP'?(down?'getup_down':'getup_up'):(down?'getup_roll_down':'getup_roll_up'),index:Math.min(5,Math.floor(Math.max(0,frame)/4))};
 const t=Math.max(0,Math.floor(Number.isFinite(frame)?frame:0));
 if(state==='AIRBORNE'&&Number.isFinite(vy)){const clip:PilotClip=c.isFastFalling?'air_fastfall_loop':vy! < -2?'air_rise_loop':vy! > 2?'air_fall_loop':'air_apex_loop';return {clip,index:Math.floor(t/4)%6};}
 if(state==='DOUBLE_JUMP')return {clip:'double_jump_transition',index:Math.min(5,t)};
 if(state==='LANDING_LAG')return {clip:'land_soft',index:Math.min(5,t)};
 if(state==='AIR_DODGE'&&c.airDodgeDirection&&(c.airDodgeDirection.x!==0||c.airDodgeDirection.y!==0)){const local=c.airDodgeDirection.x*(c.facing??1);return {clip:c.airDodgeDirection.y<0?(local===0?'air_dodge_up':local>0?'air_dodge_up_diagonal':'air_dodge_up_back'):c.airDodgeDirection.y===0?(local>0?'air_dodge_side':'air_dodge_back'):local===0?'air_dodge_down':local>0?'air_dodge_down_diagonal':'air_dodge_down_back',index:t<3?0:t<6?1:t<10?2:t<14?3:t<18?4:5};}
 return null;
}
