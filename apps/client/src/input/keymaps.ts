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
  KeyU: INPUT_BITS.ATTACK,
  KeyS: INPUT_BITS.SPECIAL,
  KeyI: INPUT_BITS.SPECIAL,
  ShiftLeft: INPUT_BITS.SHIELD,
  ShiftRight: INPUT_BITS.SHIELD,
  KeyO: INPUT_BITS.SHIELD,
  KeyC: INPUT_BITS.GRAB,
  KeyP: INPUT_BITS.GRAB,
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
