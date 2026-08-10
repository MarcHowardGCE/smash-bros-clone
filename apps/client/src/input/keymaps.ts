/**
 * @fileoverview Default keyboard layouts for all four player slots.
 *
 * Each keymap maps a `KeyboardEvent.code` string to an {@link InputBitmask}
 * bit. P1 uses arrow keys + WASD; P2 uses IJKL; P3 uses the numpad;
 * P4 uses FGHTYV. All four are loaded by {@link ControlsScreen} for display
 * and rebinding, and P1 is the default for {@link InputManager}.
 */
import { INPUT_BITS } from '@smash/shared';
import type { InputBitmask } from '@smash/shared';

export const DEFAULT_KEYMAP_P1: Record<string, InputBitmask> = {
  ArrowLeft: INPUT_BITS.LEFT,
  KeyA: INPUT_BITS.LEFT,
  ArrowRight: INPUT_BITS.RIGHT,
  KeyD: INPUT_BITS.RIGHT,
  ArrowUp: INPUT_BITS.JUMP,
  KeyW: INPUT_BITS.JUMP,
  KeyX: INPUT_BITS.JUMP,
  ArrowDown: INPUT_BITS.DOWN,
  KeyZ: INPUT_BITS.ATTACK,
  KeyS: INPUT_BITS.SPECIAL,
  ShiftLeft: INPUT_BITS.SHIELD,
  ShiftRight: INPUT_BITS.SHIELD,
  KeyC: INPUT_BITS.GRAB,
};

export const DEFAULT_KEYMAP_P2: Record<string, InputBitmask> = {
  KeyJ: INPUT_BITS.LEFT,
  KeyL: INPUT_BITS.RIGHT,
  KeyI: INPUT_BITS.JUMP,
  KeyK: INPUT_BITS.DOWN,
  KeyU: INPUT_BITS.ATTACK,
  KeyO: INPUT_BITS.SPECIAL,
  KeyP: INPUT_BITS.SHIELD,
  Semicolon: INPUT_BITS.GRAB,
};

export const DEFAULT_KEYMAP_P3: Record<string, InputBitmask> = {
  Numpad4: INPUT_BITS.LEFT,
  Numpad6: INPUT_BITS.RIGHT,
  Numpad8: INPUT_BITS.JUMP,
  Numpad5: INPUT_BITS.DOWN,
  Numpad1: INPUT_BITS.ATTACK,
  Numpad2: INPUT_BITS.SPECIAL,
  Numpad0: INPUT_BITS.SHIELD,
  Numpad3: INPUT_BITS.GRAB,
};

export const DEFAULT_KEYMAP_P4: Record<string, InputBitmask> = {
  KeyF: INPUT_BITS.LEFT,
  KeyH: INPUT_BITS.RIGHT,
  KeyT: INPUT_BITS.JUMP,
  KeyG: INPUT_BITS.DOWN,
  KeyR: INPUT_BITS.ATTACK,
  KeyY: INPUT_BITS.SPECIAL,
  KeyV: INPUT_BITS.SHIELD,
  KeyB: INPUT_BITS.GRAB,
};
