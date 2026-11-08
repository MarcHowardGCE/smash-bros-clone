import { BaseState, INPUT_BITS as B, PlayerStateEnum as S, isHeld, isPressed, transition } from './utils.js';
import { runMovementState, runTransitionAge, RUN_BRAKE_EARLY_AGE, RUN_TRANSITION_ACTION_AGE } from '../../physics/groundIntent.js';
import type { FSMContext, FSMTransition } from '../index.js';

export class RunTransitionState extends BaseState {
  update(ctx: FSMContext): FSMTransition | null {
    if (!ctx.isGrounded) return transition(S.AIRBORNE);
    const { input, player } = ctx;

    const jump = isPressed(input, B.JUMP);
    if (jump && isPressed(input, B.SPECIAL) && isHeld(input, B.UP)) return transition(S.ATTACK);
    if (jump) return transition(S.JUMPSQUAT);

    const age = runTransitionAge(player);
    const brake = player.state === S.RUN_BRAKE;
    const earlyBrake = brake && age < RUN_BRAKE_EARLY_AGE;
    const ordinaryActions = age >= RUN_TRANSITION_ACTION_AGE;
    const left = isHeld(input, B.LEFT), right = isHeld(input, B.RIGHT);
    const hasDirection = left !== right;
    const away = hasDirection && (left ? -1 : 1) !== player.facing;

    if (isPressed(input, B.GRAB) && (earlyBrake || ordinaryActions || !brake || away)) {
      return transition(S.ATTACK);
    }
    if (brake && hasDirection && isHeld(input, B.SHIELD) &&
      isPressed(input, B.SHIELD | B.LEFT | B.RIGHT) && (away || ordinaryActions)) {
      return transition(S.ROLL);
    }

    const attack = isPressed(input, B.ATTACK);
    const upSmash = attack && (
      (input?.smashAttack && Boolean(((input.attackAim ?? input).held & B.UP))) ||
      (!input?.cStickTilt && (input?.cStickY ?? 0) <= -.55 &&
        Math.abs(input?.cStickY ?? 0) > Math.abs(input?.cStickX ?? 0))
    );
    if (upSmash || (earlyBrake && isPressed(input, B.ATTACK | B.SPECIAL)) ||
      (ordinaryActions && isPressed(input, B.ATTACK | B.SPECIAL))) return transition(S.ATTACK);

    const next = runMovementState(player, input);
    return next === player.state ? null : transition(next as S);
  }
}
