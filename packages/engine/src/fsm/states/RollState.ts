import {beginDodge,dodgeTiming} from '../../physics/dodgeFatigue.js';
/** Fighter-specific forward/backward roll recovery. */
import { BaseState, PlayerStateEnum, transition,INPUT_BITS,isHeld } from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

export class RollState extends BaseState {
  override enter(ctx:FSMContext):void{ctx.player.floorRollDirection=isHeld(ctx.input,INPUT_BITS.LEFT)?-1:1;beginDodge(ctx.player,ctx.player.floorRollDirection===ctx.player.facing?"forward":"backward");}
  update(ctx: FSMContext, frame: number): FSMTransition | null {
    if(!ctx.isGrounded)return transition(PlayerStateEnum.AIRBORNE);
    return frame >= dodgeTiming(ctx.player).total-1 ? transition(PlayerStateEnum.IDLE) : null;
  }
}
