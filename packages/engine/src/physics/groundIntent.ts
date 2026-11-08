import {INPUT_BITS,PlayerStateEnum,getCharacterStats,inputVector,type InputEvent,type PlayerState} from '@smash/shared';
/** Initial project settings; calibrated analog input is already drift-filtered. */
export const GROUND_INPUT={WALK_DEADZONE:.2,DASH_THRESHOLD:.8,FLICK_WINDOW:1} as const;
export function horizontalMovementInput(input:InputEvent|null):number {
 if(input?.stickX!==undefined){const x=inputVector(input).x;return Math.abs(x)>=GROUND_INPUT.WALK_DEADZONE?x:0;}
 return Number(!!((input?.held??0)&INPUT_BITS.RIGHT))-Number(!!((input?.held??0)&INPUT_BITS.LEFT));
}
export function updateGroundIntent(player:PlayerState,input:InputEvent|null):PlayerState {
 if(input?.stickX===undefined||!player.isGrounded)return {...player,movementStickX:undefined,movementFlickAge:undefined};
 const x=horizontalMovementInput(input),old=player.movementStickX??0;
 const reset=x===0||old===0||Math.sign(x)!==Math.sign(old);
 return {...player,movementStickX:x,movementFlickAge:reset?0:Math.min(99,(player.movementFlickAge??99)+1)};
}
export function wantsGroundDash(player:PlayerState,input:InputEvent|null):boolean {
 return input?.stickX===undefined||Math.abs(horizontalMovementInput(input))>=GROUND_INPUT.DASH_THRESHOLD&&(player.movementFlickAge??99)<=GROUND_INPUT.FLICK_WINDOW;
}
export function initialDashFrames(player:PlayerState,input:InputEvent|null):number {
 return input?.stickX===undefined?15:(getCharacterStats(player.characterId).dashFrames??10);
}
export function isRunTransition(state:string):boolean {
 return state===PlayerStateEnum.RUN_BRAKE||state===PlayerStateEnum.RUN_TURN;
}
export const RUN_BRAKE_EARLY_AGE=2;
export const RUN_TRANSITION_ACTION_AGE=4;
export function runTransitionAge(player:PlayerState):number {
 return player.stateFrame+(player.runTransitionOffset??0)+1;
}
/** Movement-only branches shared by the authoritative FSM and client prediction. */
export function runMovementState(player:PlayerState,input:InputEvent|null):PlayerState['state'] {
 const axis=horizontalMovementInput(input);
 const movingState=Math.abs(axis)>=GROUND_INPUT.DASH_THRESHOLD?PlayerStateEnum.RUN:PlayerStateEnum.WALK;
 if(player.state===PlayerStateEnum.RUN){
  if(axis===0)return PlayerStateEnum.RUN_BRAKE;
  return axis*player.facing<0?PlayerStateEnum.RUN_TURN:movingState;
 }
 if(player.state===PlayerStateEnum.RUN_BRAKE){
  if(axis===0)return Math.abs(player.vx)<=.1?PlayerStateEnum.IDLE:PlayerStateEnum.RUN_BRAKE;
  return axis*player.facing<0?PlayerStateEnum.RUN_TURN:movingState;
 }
 if(axis===0)return PlayerStateEnum.RUN_BRAKE;
 return player.stateFrame>=3&&player.vx*axis>=0?movingState:PlayerStateEnum.RUN_TURN;
}
export function predictedGroundState(player:PlayerState,input:InputEvent|null):PlayerState['state'] {
 if(isRunTransition(player.state)||(input?.stickX!==undefined&&player.state===PlayerStateEnum.RUN))return runMovementState(player,input);
 const x=horizontalMovementInput(input);
 if(x===0)return PlayerStateEnum.IDLE;
 if(input?.stickX===undefined)return PlayerStateEnum.WALK; // retain the established digital visual approximation
 if(player.state===PlayerStateEnum.IDLE||player.state===PlayerStateEnum.WALK)return wantsGroundDash(player,input)?PlayerStateEnum.DASH:PlayerStateEnum.WALK;
 if(Math.abs(x)<GROUND_INPUT.DASH_THRESHOLD)return PlayerStateEnum.WALK;
 if(player.state===PlayerStateEnum.DASH)return player.stateFrame>=initialDashFrames(player,input)-1?PlayerStateEnum.RUN:PlayerStateEnum.DASH;
 return player.state===PlayerStateEnum.RUN?PlayerStateEnum.RUN:PlayerStateEnum.WALK;
}
