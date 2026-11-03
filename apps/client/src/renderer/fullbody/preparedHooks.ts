import type {PilotFrame,PilotClip} from './pilotTimeline.js';
export const PREPARED_LIVE_CLIPS:readonly PilotClip[]=['air_rise_loop','air_apex_loop','air_fall_loop','air_fastfall_loop','double_jump_transition','land_soft','air_dodge_down','air_dodge_down_diagonal','air_dodge_down_back','jab_2','jab_3','dash_attack','knockdown_down','prone_down','getup_up','getup_down','getup_roll_up','getup_roll_down','floor_attack_up','floor_attack_down'];
export interface PreparedContext{floorOrientation?:"up"|"down";floorRollDirection?:1|-1;isFastFalling?:boolean;airDodgeDirection?:{x:number;y:number}|null;facing?:1|-1}
export function selectPreparedFrame(state:string,frame:number,vy:number|undefined,c:PreparedContext):PilotFrame|null{
 const down=c.floorOrientation==='down';
 if(state==='HARD_LANDING'&&down){const t=Math.max(0,Math.floor(frame));if(t>=18)return{clip:'prone_down',index:Math.floor((t-18)/6)%4};const ends=[2,4,6,9,12,18];return{clip:'knockdown_down',index:ends.findIndex(n=>t<n)};}
 if(state==='GETUP'||state==='GETUP_ROLL')return{clip:state==='GETUP'?(down?'getup_down':'getup_up'):(down?'getup_roll_down':'getup_roll_up'),index:Math.min(5,Math.floor(Math.max(0,frame)/4))};
 const t=Math.max(0,Math.floor(Number.isFinite(frame)?frame:0));
 if(state==='AIRBORNE'&&Number.isFinite(vy)){const clip:PilotClip=c.isFastFalling?'air_fastfall_loop':vy! < -2?'air_rise_loop':vy! > 2?'air_fall_loop':'air_apex_loop';return {clip,index:Math.floor(t/4)%6};}
 if(state==='DOUBLE_JUMP')return {clip:'double_jump_transition',index:Math.min(5,t)};
 if(state==='LANDING_LAG')return {clip:'land_soft',index:Math.min(5,t)};
 if(state==='AIR_DODGE'&&c.airDodgeDirection&&c.airDodgeDirection.y>0){const local=c.airDodgeDirection.x*(c.facing??1);return {clip:local===0?'air_dodge_down':local>0?'air_dodge_down_diagonal':'air_dodge_down_back',index:t<3?0:t<6?1:t<10?2:t<14?3:t<18?4:5};}
 return null;
}
