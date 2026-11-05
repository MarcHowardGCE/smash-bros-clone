import {INPUT_BITS,PlayerStateEnum,inputVector,type InputEvent,type PlayerState} from '@smash/shared';
/** Initial project settings; calibrated analog input is already drift-filtered. */
export const GROUND_INPUT={WALK_DEADZONE:.2,DASH_THRESHOLD:.8,FLICK_WINDOW:6} as const;
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
export function predictedGroundState(player:PlayerState,input:InputEvent|null):PlayerState['state'] {
 const x=horizontalMovementInput(input);
 if(x===0)return PlayerStateEnum.IDLE;
 if(input?.stickX===undefined)return PlayerStateEnum.WALK; // retain the established digital visual approximation
 if(player.state===PlayerStateEnum.IDLE)return PlayerStateEnum.WALK;
 if(player.state===PlayerStateEnum.WALK)return wantsGroundDash(player,input)?PlayerStateEnum.DASH:PlayerStateEnum.WALK;
 if(Math.abs(x)<GROUND_INPUT.DASH_THRESHOLD)return PlayerStateEnum.WALK;
 if(player.state===PlayerStateEnum.DASH)return player.stateFrame>=14?PlayerStateEnum.RUN:PlayerStateEnum.DASH;
 return player.state===PlayerStateEnum.RUN?PlayerStateEnum.RUN:PlayerStateEnum.WALK;
}
