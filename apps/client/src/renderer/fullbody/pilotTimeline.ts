import { getMoveDataForCharacter } from '@smash/engine';
import { MoveId, PlayerStateEnum, type CharacterId } from '@smash/shared';
export type PilotClip = 'idle' | 'walk' | 'jab' | 'run' | 'jump' | 'shield' | 'dodge' | 'roll' | 'reaction' | 'forward_tilt' | 'up_tilt' | 'down_tilt' | 'forward_smash' | 'up_smash' | 'down_smash' | 'neutral_air' | 'forward_air' | 'back_air' | 'up_air' | 'down_air' | 'neutral_special' | 'side_special' | 'up_special' | 'down_special' | 'counter_success' | 'grab' | 'grab_hold' | 'pummel' | 'forward_throw' | 'back_throw' | 'up_throw' | 'down_throw' | 'grabbed' | 'pummel_victim' | 'grab_release' | 'throw_victim' | 'ledge_catch' | 'ledge_hang' | 'ledge_climb' | 'ledge_roll' | 'ledge_attack' | 'ledge_jump' | 'ledge_drop' | 'ledge_trump' | 'knockdown_up' | 'knockdown_down' | 'prone_up' | 'prone_down' | 'getup_up' | 'getup_down' | 'getup_roll_up' | 'getup_roll_down' | 'floor_attack_up' | 'floor_attack_down' | 'trip_fall' | 'trip_prone' | 'trip_getup' | 'floor_attack_trip' | 'tech_neutral' | 'tech_roll' | 'wall_tech' | 'wall_tech_jump' | 'ceiling_tech' | 'trip_roll' | 'dash_start' | 'turn_stand' | 'turn_run' | 'brake' | 'crouch_enter' | 'crouch_hold' | 'crouch_exit' | 'jump_squat' | 'land_soft' | 'land_heavy' | 'platform_drop' | 'teeter_front' | 'teeter_back' | 'shield_raise' | 'shield_hit' | 'shield_drop' | 'parry' | 'air_dodge_neutral' | 'air_dodge_directional' | 'air_dodge_land' | 'shield_break_launch' | 'shield_break_dizzy' | 'shield_break_recover' | 'grab_dash' | 'grab_pivot' | 'dash_attack' | 'hit_high' | 'hit_mid' | 'hit_low' | 'hit_heavy' | 'hit_air' | 'tumble' | 'tumble_recover' | 'jab_lock_up' | 'jab_lock_down' | 'footstool_attacker' | 'footstool_ground_victim' | 'footstool_air_victim' | 'entry' | 'respawn_wait' | 'respawn_drop' | 'taunt_up' | 'taunt_side' | 'taunt_down' | 'victory_1' | 'victory_2' | 'victory_3' | 'defeat' | 'ko_launch' | 'ko_screen' | 'ko_star' | 'takeoff_neutral' | 'takeoff_forward' | 'takeoff_backward' | 'air_rise_loop' | 'air_apex_loop' | 'air_fall_loop' | 'air_fastfall_loop' | 'double_jump_transition' | 'air_dodge_up' | 'air_dodge_down' | 'air_dodge_side' | 'air_dodge_up_diagonal' | 'air_dodge_down_diagonal' | 'helpless_enter' | 'helpless_loop' | 'helpless_land' | 'jab_2' | 'jab_3' | 'air_dodge_back' | 'air_dodge_up_back' | 'air_dodge_down_back';
export interface PilotFrame { clip: PilotClip; index: number }
/** Simulation ticks only; combat never advances on an independent wall clock. */
export function selectPilotFrame(state: string, frame: number, move: MoveId | null, vy?: number, hasDoubleJump: boolean = true, isTumbling: boolean = false, characterId: CharacterId = 'all-rounder', chargeFrames: number = 0, grabVictim: boolean = false): PilotFrame | null {
 if(state===PlayerStateEnum.ATTACK&&(move===MoveId.FLOOR_ATTACK_UP||move===MoveId.FLOOR_ATTACK_DOWN||move===MoveId.FLOOR_ATTACK_TRIP)){const t=Math.max(0,Math.floor(frame)),d=getMoveDataForCharacter(characterId,move),clip:PilotClip=move===MoveId.FLOOR_ATTACK_TRIP?'floor_attack_trip':move===MoveId.FLOOR_ATTACK_DOWN?'floor_attack_down':'floor_attack_up';return{clip,index:t<d.startupFrames?Math.floor(t*2/d.startupFrames):t<d.startupFrames+d.activeFrames?2:Math.min(5,3+Math.floor((t-d.startupFrames-d.activeFrames)*3/d.recoveryFrames))};}
 if(state===PlayerStateEnum.ATTACK&&(move===MoveId.GRAB_DASH||move===MoveId.GRAB_PIVOT)){const d=getMoveDataForCharacter(characterId,move),t=Math.max(0,frame),clip:PilotClip=move===MoveId.GRAB_DASH?'grab_dash':'grab_pivot';return{clip,index:t<d.startupFrames?Math.min(2,Math.floor(t*3/d.startupFrames)):t<d.startupFrames+d.activeFrames?3:Math.min(5,4+Math.floor((t-d.startupFrames-d.activeFrames)*2/d.recoveryFrames))};}
 const tick=Math.max(0,Math.floor(Number.isFinite(frame)?frame:0));
 if(state===PlayerStateEnum.ATTACK&&(move===MoveId.JAB_2||move===MoveId.JAB_3||move===MoveId.DASH_ATTACK)){
  const clip:PilotClip=move===MoveId.JAB_2?'jab_2':move===MoveId.JAB_3?'jab_3':'dash_attack',d=getMoveDataForCharacter(characterId,move);
  if(tick<d.startupFrames)return {clip,index:Math.min(2,Math.floor(tick*3/Math.max(1,d.startupFrames)))};
  if(tick<d.startupFrames+d.activeFrames)return {clip,index:3};
  return {clip,index:tick<d.startupFrames+d.activeFrames+Math.ceil(d.recoveryFrames/2)?4:5};
 }
 if(state===PlayerStateEnum.LEDGE_APPROACH)return {clip:'ledge_catch',index:0};
 if(state===PlayerStateEnum.LEDGE_TRUMP)return {clip:'ledge_trump',index:Math.min(3,Math.floor(tick/3))};
 if(state===PlayerStateEnum.LEDGE_HANG)return tick<8?{clip:'ledge_catch',index:Math.floor(tick/2)}:{clip:'ledge_hang',index:Math.floor((tick-8)/12)%4};
 const ledgeStates:Record<string,[PilotClip,number[]]>={
 LEDGE_CLIMB:['ledge_climb',[6,6,8,8,6,6]],LEDGE_ROLL:['ledge_roll',[6,6,8,8,8,9]],
 LEDGE_ATTACK:['ledge_attack',[6,6,8,8,16,16]],LEDGE_JUMP:['ledge_jump',[2,2,2,2,2,2]]};
 const ledge=ledgeStates[state];if(ledge){let end=0;for(const[index,duration]of ledge[1].entries()){end+=duration;if(tick<end)return {clip:ledge[0],index};}return {clip:ledge[0],index:5};}
 if(state===PlayerStateEnum.GRAB_HOLDING)return {clip:grabVictim?'grabbed':'grab_hold',index:Math.floor(tick/12)%4};
 if(state===PlayerStateEnum.GRAB)return {clip:'grab',index:Math.min(5,tick)};
 if(state===PlayerStateEnum.IDLE)return {clip:'idle',index:Math.floor(tick/12)%4};
 // 24 ticks per cycle: 25% slower than revision 2, per animation review.
 if(state===PlayerStateEnum.WALK)return {clip:'walk',index:Math.floor(tick/4)%6};
 if(state===PlayerStateEnum.DASH)return {clip:'dash_start',index:tick<2?0:tick<4?1:tick<6?2:tick<9?3:tick<12?4:5};
 if(state===PlayerStateEnum.RUN)return {clip:'run',index:Math.floor(tick/3)%6};
 if(state===PlayerStateEnum.JUMPSQUAT)return {clip:'jump_squat',index:Math.min(5,tick*2+1)};
 if(state===PlayerStateEnum.DOUBLE_JUMP)return {clip:'jump',index:4};
 if(state===PlayerStateEnum.LANDING_LAG)return {clip:'jump',index:5};
 if(state===PlayerStateEnum.AIRBORNE&&typeof vy==='number'&&Number.isFinite(vy))return {clip:'jump',index:vy < -2?(hasDoubleJump?1:4):vy > 2?3:2};
 if(state===PlayerStateEnum.AIR_DODGE)return {clip:'air_dodge_neutral',index:tick<3?0:tick<6?1:tick<10?2:tick<14?3:tick<18?4:5};
 if(state===PlayerStateEnum.SHIELD&&tick<6)return {clip:'shield_raise',index:tick};
 if(state===PlayerStateEnum.SHIELD)return {clip:'shield',index:Math.floor(tick/12)%4};
 // ROLL and SPOT_DODGE each last 20 engine ticks; hold the recovery drawing rather than loop.
 if(state===PlayerStateEnum.ROLL||state===PlayerStateEnum.SPOT_DODGE)return {clip:state===PlayerStateEnum.ROLL?'roll':'dodge',index:tick<3?0:tick<6?1:tick<10?2:tick<14?3:tick<17?4:5};
 if(state===PlayerStateEnum.HITSTUN)return isTumbling?{clip:'tumble',index:Math.floor(tick/3)%6}:{clip:'hit_mid',index:Math.min(3,Math.floor(tick/4))};
 if(state===PlayerStateEnum.HARD_LANDING){if(tick>=18)return {clip:'prone_up',index:Math.floor((tick-18)/6)%4};const ends=[2,4,6,9,12,18];return {clip:'knockdown_up',index:ends.findIndex(end=>tick<end)};}
 if(state===PlayerStateEnum.TECH_NEUTRAL){const ends=[3,7,11,15,20,26];return {clip:'tech_neutral',index:tick>=26?5:ends.findIndex(end=>tick<end)};}
 if(state===PlayerStateEnum.TECH_ROLL){const ends=[5,10,17,24,32,40];return {clip:'tech_roll',index:tick>=40?5:ends.findIndex(end=>tick<end)};}
 if(state===PlayerStateEnum.ATTACK&&move){const grabs:Partial<Record<MoveId,PilotClip>>={[MoveId.GRAB]:'grab',[MoveId.PUMMEL]:'pummel',[MoveId.FORWARD_THROW]:'forward_throw',[MoveId.BACK_THROW]:'back_throw',[MoveId.UP_THROW]:'up_throw',[MoveId.DOWN_THROW]:'down_throw'};const clip=grabs[move];if(clip){const d=getMoveDataForCharacter(characterId,move);if(tick<d.startupFrames)return {clip,index:Math.min(2,Math.floor(tick*3/Math.max(1,d.startupFrames)))};if(tick<d.startupFrames+d.activeFrames)return {clip,index:3};return {clip,index:tick<d.startupFrames+d.activeFrames+Math.ceil(d.recoveryFrames/2)?4:5};}}
 if((state===PlayerStateEnum.ATTACK||state===PlayerStateEnum.AIR_ATTACK)&&move){
 const specials:Partial<Record<MoveId,PilotClip>>={[MoveId.NEUTRAL_SPECIAL]:'neutral_special',[MoveId.SIDE_SPECIAL]:'side_special',[MoveId.UP_SPECIAL]:'up_special',[MoveId.DOWN_SPECIAL]:'down_special'};
 const clip=specials[move];if(clip){const data=getMoveDataForCharacter(characterId,move);if(tick<data.startupFrames)return {clip,index:Math.min(2,Math.floor(tick*3/Math.max(1,data.startupFrames)))};const contact=Math.max(1,data.activeFrames);if(tick<data.startupFrames+contact)return {clip,index:3};const rec=data.activeFrames===0?data.recoveryFrames-1:data.recoveryFrames;return {clip,index:tick<data.startupFrames+contact+Math.ceil(rec/2)?4:5};}
 }
 if(state===PlayerStateEnum.AIR_ATTACK&&move){
  const aerials:Partial<Record<MoveId,PilotClip>>={[MoveId.NEUTRAL_AIR]:'neutral_air',[MoveId.FORWARD_AIR]:'forward_air',[MoveId.BACK_AIR]:'back_air',[MoveId.UP_AIR]:'up_air',[MoveId.DOWN_AIR]:'down_air'};
  const clip=aerials[move];if(!clip)return null;const data=getMoveDataForCharacter(characterId,move);
  if(tick<data.startupFrames)return {clip,index:Math.min(2,Math.floor(tick*3/Math.max(1,data.startupFrames)))};
  if(tick<data.startupFrames+data.activeFrames)return {clip,index:3};
  return {clip,index:tick<data.startupFrames+data.activeFrames+Math.ceil(data.recoveryFrames/2)?4:5};
 }
 if(state!==PlayerStateEnum.ATTACK||!move)return null;
 if(move===MoveId.FORWARD_SMASH||move===MoveId.UP_SMASH||move===MoveId.DOWN_SMASH){
  const clip:PilotClip=move===MoveId.FORWARD_SMASH?'forward_smash':move===MoveId.UP_SMASH?'up_smash':'down_smash';
  const data=getMoveDataForCharacter(characterId,move);
  const charge=Math.min(data.chargeMax??60,Math.max(0,Math.floor(Number.isFinite(chargeFrames)?chargeFrames:0)));
  const effective=Math.max(0,tick-charge);
  if(effective<data.startupFrames){
   if(move===MoveId.DOWN_SMASH)return {clip,index:charge>0||effective>=Math.ceil(data.startupFrames/2)?1:0};
   return {clip,index:Math.max(charge>0?1:0,Math.min(2,Math.floor(effective*3/Math.max(1,data.startupFrames))))};
  }
  const active=effective-data.startupFrames;
  if(active<data.activeFrames)return {clip,index:move===MoveId.DOWN_SMASH&&active<Math.ceil(data.activeFrames/2)?2:3};
  return {clip,index:active<data.activeFrames+Math.ceil(data.recoveryFrames/2)?4:5};
 }
 if(move!==MoveId.JAB){
  const clips:Partial<Record<MoveId,PilotClip>>={[MoveId.FORWARD_TILT]:'forward_tilt',[MoveId.UP_TILT]:'up_tilt',[MoveId.DOWN_TILT]:'down_tilt'};
  const clip=clips[move];if(!clip)return null;
  const data=getMoveDataForCharacter(characterId,move);
  if(tick<data.startupFrames)return {clip,index:Math.min(2,Math.floor(tick*3/Math.max(1,data.startupFrames)))};
  if(tick<data.startupFrames+data.activeFrames)return {clip,index:3};
  return {clip,index:tick<data.startupFrames+data.activeFrames+Math.ceil(data.recoveryFrames/2)?4:5};
 }
 const {startupFrames,activeFrames,recoveryFrames}=getMoveDataForCharacter(characterId,MoveId.JAB);
 if(tick<startupFrames)return {clip:'jab',index:Math.min(2,Math.floor(tick*3/startupFrames))};
 if(tick<startupFrames+activeFrames)return {clip:'jab',index:3};
 const recoveryTick=tick-startupFrames-activeFrames;
 return {clip:'jab',index:4+Math.min(4,Math.floor(recoveryTick*5/recoveryFrames))};
}
