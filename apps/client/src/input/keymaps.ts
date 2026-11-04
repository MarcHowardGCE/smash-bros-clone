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
  UP: INPUT_BITS.UP,
  JUMP: INPUT_BITS.JUMP,
  DOWN: INPUT_BITS.DOWN,
  ATTACK: INPUT_BITS.ATTACK,
  SPECIAL: INPUT_BITS.SPECIAL,
  SHIELD: INPUT_BITS.SHIELD,
  GRAB: INPUT_BITS.GRAB,
  TAUNT_UP:INPUT_BITS.TAUNT_UP,TAUNT_SIDE:INPUT_BITS.TAUNT_SIDE,TAUNT_DOWN:INPUT_BITS.TAUNT_DOWN,
};

export const DEFAULT_KEYMAP_P1: Record<string, InputBitmask> = {
  ArrowLeft: INPUT_BITS.LEFT,
  KeyA: INPUT_BITS.LEFT,
  ArrowRight: INPUT_BITS.RIGHT,
  KeyD: INPUT_BITS.RIGHT,
  ArrowUp: INPUT_BITS.UP,
  KeyW: INPUT_BITS.UP,
  KeyX: INPUT_BITS.JUMP,
  Space: INPUT_BITS.JUMP,
  ArrowDown: INPUT_BITS.DOWN,
  KeyZ: INPUT_BITS.ATTACK,
  KeyS: INPUT_BITS.SPECIAL,
  ShiftLeft: INPUT_BITS.SHIELD,
  ShiftRight: INPUT_BITS.SHIELD,
  KeyC: INPUT_BITS.GRAB,
  Digit1:INPUT_BITS.TAUNT_UP,Digit2:INPUT_BITS.TAUNT_SIDE,Digit3:INPUT_BITS.TAUNT_DOWN,
};

export const DEFAULT_KEYMAP_P2: Record<string, InputBitmask> = {
  KeyJ: INPUT_BITS.LEFT,
  KeyL: INPUT_BITS.RIGHT,
  KeyI: INPUT_BITS.UP,
  KeyM: INPUT_BITS.JUMP,
  KeyK: INPUT_BITS.DOWN,
  KeyU: INPUT_BITS.ATTACK,
  KeyO: INPUT_BITS.SPECIAL,
  KeyP: INPUT_BITS.SHIELD,
  Semicolon: INPUT_BITS.GRAB,
  Digit4:INPUT_BITS.TAUNT_UP,Digit5:INPUT_BITS.TAUNT_SIDE,Digit6:INPUT_BITS.TAUNT_DOWN,
};

export const DEFAULT_KEYMAP_P3: Record<string, InputBitmask> = {
  Numpad4: INPUT_BITS.LEFT,
  Numpad6: INPUT_BITS.RIGHT,
  Numpad8: INPUT_BITS.UP,
  NumpadEnter: INPUT_BITS.JUMP,
  Numpad5: INPUT_BITS.DOWN,
  Numpad1: INPUT_BITS.ATTACK,
  Numpad2: INPUT_BITS.SPECIAL,
  Numpad0: INPUT_BITS.SHIELD,
  Numpad3: INPUT_BITS.GRAB,
  Numpad7:INPUT_BITS.TAUNT_UP,Numpad9:INPUT_BITS.TAUNT_SIDE,NumpadDecimal:INPUT_BITS.TAUNT_DOWN,
};

export const DEFAULT_KEYMAP_P4: Record<string, InputBitmask> = {
  KeyF: INPUT_BITS.LEFT,
  KeyH: INPUT_BITS.RIGHT,
  KeyT: INPUT_BITS.UP,
  KeyN: INPUT_BITS.JUMP,
  KeyG: INPUT_BITS.DOWN,
  KeyR: INPUT_BITS.ATTACK,
  KeyY: INPUT_BITS.SPECIAL,
  KeyV: INPUT_BITS.SHIELD,
  KeyB: INPUT_BITS.GRAB,
  Digit7:INPUT_BITS.TAUNT_UP,Digit8:INPUT_BITS.TAUNT_SIDE,Digit9:INPUT_BITS.TAUNT_DOWN,
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

/** Migrate known legacy Up defaults and add missing jump/taunt bindings; preserve custom action keys. */
export function withTauntDefaults(map:Record<string,InputBitmask>,fallback:Record<string,InputBitmask>):Record<string,InputBitmask>{const result={...map};if(!Object.values(map).includes(INPUT_BITS.UP)){for(const[key,bit]of Object.entries(fallback))if(bit===INPUT_BITS.UP&&result[key]===INPUT_BITS.JUMP)result[key]=INPUT_BITS.UP;if(!Object.values(result).includes(INPUT_BITS.JUMP))for(const[key,bit]of Object.entries(fallback))if(bit===INPUT_BITS.JUMP&&result[key]===undefined){result[key]=bit;break;}}const taunts=[INPUT_BITS.TAUNT_UP,INPUT_BITS.TAUNT_SIDE,INPUT_BITS.TAUNT_DOWN];if(!Object.values(map).some(bit=>taunts.includes(bit as typeof taunts[number])))for(const[key,bit]of Object.entries(fallback))if(taunts.includes(bit as typeof taunts[number])&&result[key]===undefined)result[key]=bit;return result;}
/** Controls-screen per-seat bindings take precedence over legacy P1 settings. */
export function loadSlotKeymap(slotIndex: number, fallback: Record<string, InputBitmask>): Record<string, InputBitmask> {
  try {
    const raw = localStorage.getItem('smash:keymap:' + slotIndex);
    if (raw) {
      const parsed = JSON.parse(raw);
      const allowed = new Set<number>(Object.values(INPUT_BITS));
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        && Object.keys(parsed).length && Object.values(parsed).every(bit => typeof bit === 'number' && allowed.has(bit))) {
        return withTauntDefaults({...parsed},fallback);
      }
    }
    if (slotIndex === 0) {
      const rawSettings = localStorage.getItem('smash:settings:v1');
      if (rawSettings) {
        const legacy = JSON.parse(rawSettings)?.keymapP1;
        if (legacy && typeof legacy === 'object' && !Array.isArray(legacy)) {
          const converted = convertPersistedKeymap(legacy);
          if (Object.keys(converted).length) return withTauntDefaults(converted,fallback);
        }
      }
    }
  } catch { /* Invalid or unavailable storage falls back to the supplied seat map. */ }
  return { ...fallback };
}
