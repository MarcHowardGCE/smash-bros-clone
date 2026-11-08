import {horizontalMovementInput,runMovementState} from '../../physics/groundIntent.js';
/** Sustained run. Analog release and reversal enter dedicated transition states. */
import {
	BaseState,
	INPUT_BITS,
	PlayerStateEnum,
	isDirectionHeld,
	isHeld,
	isPressed,
	transition,
} from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';


export class RunState extends BaseState {
	update(ctx: FSMContext): FSMTransition | null {
    if (isPressed(ctx.input, INPUT_BITS.JUMP)) {
      return transition(PlayerStateEnum.JUMPSQUAT);
    }

    if (isPressed(ctx.input, INPUT_BITS.ATTACK)||isPressed(ctx.input,INPUT_BITS.GRAB)||isPressed(ctx.input,INPUT_BITS.SPECIAL)) {
      return transition(PlayerStateEnum.ATTACK);
    }

    if(isHeld(ctx.input,INPUT_BITS.SHIELD))return transition(PlayerStateEnum.SHIELD);
    if(ctx.input?.stickX!==undefined){const next=runMovementState(ctx.player,ctx.input);return next===ctx.player.state?null:transition(next as PlayerStateEnum);}
    if(isHeld(ctx.input,INPUT_BITS.DOWN)&&!isHeld(ctx.input,INPUT_BITS.LEFT)&&!isHeld(ctx.input,INPUT_BITS.RIGHT))return transition(PlayerStateEnum.CROUCH);

		const holdingLeft = isHeld(ctx.input, INPUT_BITS.LEFT);
		const holdingRight = isHeld(ctx.input, INPUT_BITS.RIGHT);
		const isSingleDirection = holdingLeft !== holdingRight;
		const isReversingDirection =
			isSingleDirection &&
			((ctx.player.facing === 1 && holdingLeft) ||
				(ctx.player.facing === -1 && holdingRight));

		if (isReversingDirection) {
			return transition(PlayerStateEnum.IDLE);
		}

		if (horizontalMovementInput(ctx.input)===0) {
			return transition(PlayerStateEnum.IDLE);
		}

    return null;
  }
}
