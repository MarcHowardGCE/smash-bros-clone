import { BaseState, PlayerStateEnum, transition, INPUT_BITS, isHeld } from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

export class AirDodgeState extends BaseState {
  override enter(ctx: FSMContext): void {
    // Capture held LEFT/RIGHT/DOWN bits at entry
    const hasLeft = isHeld(ctx.input, INPUT_BITS.LEFT);
    const hasRight = isHeld(ctx.input, INPUT_BITS.RIGHT);
    const hasDown = isHeld(ctx.input, INPUT_BITS.DOWN);

    // Direction vector: DOWN must be held for wavedash-capable dodge (y > 0)
    // DOWN+RIGHT → { x: 1, y: 1 }, no direction → { x: 0, y: 0 }
    const x = hasDown ? (hasRight ? 1 : hasLeft ? -1 : 0) : 0;
    const y = hasDown ? 1 : 0;

    ctx.player.airDodgeDirection = { x, y };
  }

  update(ctx: FSMContext, frame: number): FSMTransition | null {
    return frame >= 23 || ctx.isGrounded ? transition(PlayerStateEnum.AIRBORNE) : null;
  }

  override exit(ctx: FSMContext): void {
    // Clear direction when exiting air dodge
    ctx.player.airDodgeDirection = null;
  }
}
