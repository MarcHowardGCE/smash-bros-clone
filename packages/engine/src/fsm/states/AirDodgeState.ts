import {beginDodge,dodgeTiming} from '../../physics/dodgeFatigue.js';
/** Profile-driven aerial recovery. Direction capture and landing recovery remain separate. */
import { BaseState, PlayerStateEnum, transition, INPUT_BITS, isHeld } from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';



export class AirDodgeState extends BaseState {
  override enter(ctx: FSMContext): void {
    beginDodge(ctx.player,"air");
    // Capture directional aim independently of the jump action.
    const hasLeft = isHeld(ctx.input, INPUT_BITS.LEFT);
    const hasRight = isHeld(ctx.input, INPUT_BITS.RIGHT);
    const hasDown = isHeld(ctx.input, INPUT_BITS.DOWN);

    // Snapshot an eight-direction vector; landing recovery is resolved by the game loop.
    // DOWN+RIGHT → { x: 1, y: 1 }, no direction → { x: 0, y: 0 }
    const x = Number(hasRight)-Number(hasLeft);
    const y = Number(hasDown)-Number(isHeld(ctx.input,INPUT_BITS.UP));

    ctx.player.airDodgeDirection = { x, y };
  }

  update(ctx: FSMContext, frame: number): FSMTransition | null {
    return frame >= dodgeTiming(ctx.player).total-1 || ctx.isGrounded
      ? transition(PlayerStateEnum.AIRBORNE)
      : null;
  }

  override exit(ctx: FSMContext): void {
    // Clear direction when exiting air dodge
    ctx.player.airDodgeDirection = null;
  }
}
