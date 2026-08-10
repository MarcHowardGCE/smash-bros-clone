/**
 * @fileoverview AIR_DODGE state — aerial invincible dodge with wavedash support.
 *
 * Lasts `AIR_DODGE_DURATION_FRAMES` (23) frames. On `enter()`, the held
 * directional input is captured into `airDodgeDirection`. The physics layer
 * reads this vector each tick to apply the dodge's directional velocity.
 *
 * Wavedash: if the player holds DOWN (optionally with LEFT/RIGHT), the
 * dodge angle points into the ground. When the fighter lands during the
 * dodge window the physics layer converts the diagonal momentum into a
 * grounded slide — the wavedash.
 *
 * `airDodgeDirection` is cleared in `exit()` so it doesn't bleed into
 * subsequent states. `FSMController.applyTransition()` propagates the
 * cleared value into the outgoing player snapshot.
 *
 * Entered from: AIRBORNE (shield pressed + hasAirDodge true).
 *
 * Transitions out to: AIRBORNE (frame >= 23 OR isGrounded becomes true).
 */
import { BaseState, PlayerStateEnum, transition, INPUT_BITS, isHeld } from './utils.js';
import type { FSMContext, FSMTransition } from '../index.js';

const AIR_DODGE_DURATION_FRAMES = 23;

/**
 * Aerial invincible dodge. Captures directional input on entry for the physics
 * layer to apply dodge velocity. DOWN-angled dodges that land produce a wavedash.
 * Clears `airDodgeDirection` on exit to prevent state bleed.
 */
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
    return frame >= AIR_DODGE_DURATION_FRAMES || ctx.isGrounded
      ? transition(PlayerStateEnum.AIRBORNE)
      : null;
  }

  override exit(ctx: FSMContext): void {
    // Clear direction when exiting air dodge
    ctx.player.airDodgeDirection = null;
  }
}
