/**
 * @fileoverview LEDGE_HANG state — fighter hanging on a stage ledge.
 *
 * The fighter grabs the ledge and hangs indefinitely until an input fires.
 * Position snapping to the ledge and invincibility frames are managed by
 * `GameEngine.applyStateTransitions`, not here.
 *
 * Ledge occupancy: only one fighter may hang from a given ledge at a time.
 * If a second fighter grabs the same ledge, the first is "trumped" — forced
 * off by `GameEngine` into AIRBORNE. This state never sees the trump; it just
 * stops running once the server overrides `player.state`.
 *
 * Available getup options:
 * - JUMP pressed → LEDGE_JUMP (aerial getup with jump velocity)
 * - ATTACK pressed → LEDGE_ATTACK (hitbox-active getup attack, 60 frames)
 * - SHIELD pressed → LEDGE_ROLL (invincible roll onto stage, 45 frames)
 * - DOWN pressed → AIRBORNE (voluntary ledge drop)
 * - LEFT or RIGHT held → LEDGE_CLIMB (slow climb onto stage)
 *
 * No input → returns null every frame; fighter hangs indefinitely.
 *
 * Entered from: externally by `GameEngine` when ledge grab is detected
 * (state forced to LEDGE_HANG via player.state override).
 *
 * Transitions out to: LEDGE_JUMP, LEDGE_ATTACK, LEDGE_ROLL, AIRBORNE,
 * LEDGE_CLIMB (depending on input).
 */
import { INPUT_BITS, PlayerStateEnum } from '@smash/shared';
import type { FSMContext, FSMTransition } from '../index.js';
import { BaseState, isHeld, isPressed, transition } from './utils.js';

/**
 * Ledge-hang state. Fighter holds the ledge indefinitely until an input fires
 * one of the five getup options. Position snap and invincibility are managed
 * by `GameEngine`. Ledge trump (second fighter grabbing same ledge) is handled
 * externally via player.state override — this state never sees the eviction.
 */
// LedgeHangState: player is hanging on a ledge.
// Inputs map to getup options; position snap and invincibility are managed by GameEngine.
// No input → null (keep hanging indefinitely until player acts).
export class LedgeHangState extends BaseState {
  update(ctx: FSMContext, _frame: number): FSMTransition | null {
    if (isPressed(ctx.input, INPUT_BITS.JUMP)) {
      return transition(PlayerStateEnum.LEDGE_JUMP);
    }
    if (isPressed(ctx.input, INPUT_BITS.ATTACK)) {
      return transition(PlayerStateEnum.LEDGE_ATTACK);
    }
    if (isPressed(ctx.input, INPUT_BITS.SHIELD)) {
      return transition(PlayerStateEnum.LEDGE_ROLL);
    }
    if (isPressed(ctx.input, INPUT_BITS.DOWN)) {
      // Drop: no dedicated LEDGE_DROP state — transitions directly to AIRBORNE
      return transition(PlayerStateEnum.AIRBORNE);
    }
    if (isHeld(ctx.input, INPUT_BITS.LEFT) || isHeld(ctx.input, INPUT_BITS.RIGHT)) {
      // Climb: any directional hold toward/away from stage triggers climb getup
      return transition(PlayerStateEnum.LEDGE_CLIMB);
    }
    return null; // Keep hanging
  }
}
