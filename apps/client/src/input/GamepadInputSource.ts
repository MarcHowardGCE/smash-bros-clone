import type { GamepadPoller, GenericInputBitmask } from '@smash/gamepad-input';
import { GenericInputBits } from '@smash/gamepad-input';
import { INPUT_BITS, type InputBitmask } from '@smash/shared';

/**
 * GamepadInputSource - Adapts gamepad-input package's GenericInputBits
 * into @smash/shared's INPUT_BITS format, matching keyboard semantics.
 *
 * Mapping follows DEFAULT_KEYMAP_P1:
 * - Generic A / DPAD_UP / Stick_UP → INPUT_BITS.JUMP
 * - Generic X → INPUT_BITS.ATTACK
 * - Generic B → INPUT_BITS.SPECIAL
 * - Generic LB / RB → INPUT_BITS.SHIELD
 * - Generic LT / RT → INPUT_BITS.GRAB
 * - Generic LEFT / RIGHT / DOWN → INPUT_BITS.LEFT / RIGHT / DOWN
 */
export class GamepadInputSource {
  private gamepadPoller: GamepadPoller;
  private gamepadIndex: number;

  constructor(poller: GamepadPoller, gamepadIndex: number) {
    this.gamepadPoller = poller;
    this.gamepadIndex = gamepadIndex;
  }

  /**
   * Get currently held input bits by polling gamepad state.
   * Disconnected gamepads return 0 gracefully (no throw).
   *
   * @returns InputBitmask with translated bits from GenericInputBits
   */
  getHeldBits(): InputBitmask {
    const pollResult = this.gamepadPoller.poll();
    const gamepadState = pollResult.get(this.gamepadIndex);

    // Disconnected gamepad: return 0 gracefully
    if (!gamepadState) {
      return 0;
    }

    const genericBits = gamepadState.bits;
    return this.translateBits(genericBits);
  }

  /**
   * Allow reassignment to a different gamepad index
   * (e.g., if player switches controllers during match)
   */
  updateGamepadIndex(newIndex: number): void {
    this.gamepadIndex = newIndex;
  }

  /**
   * Translate GenericInputBits to INPUT_BITS using DEFAULT_KEYMAP_P1 semantics
   */
  private translateBits(genericBits: GenericInputBitmask): InputBitmask {
    let inputBits: InputBitmask = 0;

    // Directional mapping
    if (genericBits & GenericInputBits.LEFT) {
      inputBits |= INPUT_BITS.LEFT;
    }
    if (genericBits & GenericInputBits.RIGHT) {
      inputBits |= INPUT_BITS.RIGHT;
    }
    if (genericBits & GenericInputBits.DOWN) {
      inputBits |= INPUT_BITS.DOWN;
    }

    // Action mapping: A/DPAD_UP/Stick_UP → JUMP
    if (genericBits & GenericInputBits.A) {
      inputBits |= INPUT_BITS.JUMP;
    }
    if (genericBits & GenericInputBits.UP) {
      inputBits |= INPUT_BITS.JUMP;
    }

    // X → ATTACK
    if (genericBits & GenericInputBits.X) {
      inputBits |= INPUT_BITS.ATTACK;
    }

    // B → SPECIAL
    if (genericBits & GenericInputBits.B) {
      inputBits |= INPUT_BITS.SPECIAL;
    }

    // LB/RB → SHIELD
    if ((genericBits & GenericInputBits.LB) || (genericBits & GenericInputBits.RB)) {
      inputBits |= INPUT_BITS.SHIELD;
    }

    // LT/RT → GRAB
    if ((genericBits & GenericInputBits.LT) || (genericBits & GenericInputBits.RT)) {
      inputBits |= INPUT_BITS.GRAB;
    }

    return inputBits;
  }
}
