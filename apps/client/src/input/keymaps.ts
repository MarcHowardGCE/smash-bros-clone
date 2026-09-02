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

/** Map from action name (string) to bitmask value for conversion from persisted keymaps. */
const ACTION_NAME_TO_BITMASK: Record<string, InputBitmask> = {
  LEFT: INPUT_BITS.LEFT,
  RIGHT: INPUT_BITS.RIGHT,
  JUMP: INPUT_BITS.JUMP,
  DOWN: INPUT_BITS.DOWN,
  ATTACK: INPUT_BITS.ATTACK,
  SPECIAL: INPUT_BITS.SPECIAL,
  SHIELD: INPUT_BITS.SHIELD,
  GRAB: INPUT_BITS.GRAB,
};

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

/**
 * Convert a persisted keymap (with string action names) to InputManager format (bitmasks).
 * Used to load keymaps from SettingsStore, which stores action names as strings.
 *
 * @param persistedKeymap - Keymap with string values like { ArrowLeft: 'LEFT', KeyZ: 'ATTACK' }
 * @returns Keymap with numeric bitmask values like { ArrowLeft: 0x0001, KeyZ: 0x0010 }
 */
export function convertPersistedKeymap(
  persistedKeymap: Record<string, string>
): Record<string, InputBitmask> {
  const result: Record<string, InputBitmask> = {};

  for (const [keyCode, actionName] of Object.entries(persistedKeymap)) {
    const bitmask = ACTION_NAME_TO_BITMASK[actionName];
    if (bitmask !== undefined) {
      result[keyCode] = bitmask;
    }
    // Silently skip unknown action names (graceful degradation)
  }

  return result;
}
