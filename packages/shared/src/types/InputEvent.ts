import type { PlayerId } from './GameState.js';

// InputBitmask bit layout (uint16):
// bit 0: left (0x0001)
// bit 1: right (0x0002)
// bit 2: jump (0x0004)
// bit 3: down (0x0008)
// bit 4: attack (0x0010)
// bit 5: special (0x0020)
// bit 6: shield (0x0040)
// bit 7: grab (0x0080)
export type InputBitmask = number;

export const INPUT_BITS = {
  LEFT:    0x0001,
  RIGHT:   0x0002,
  JUMP:    0x0004,
  DOWN:    0x0008,
  ATTACK:  0x0010,
  SPECIAL: 0x0020,
  SHIELD:  0x0040,
  GRAB:    0x0080,
} as const;

export interface InputEvent {
  tick: number;
  seq: number;
  playerId: PlayerId;
  held: InputBitmask;
  pressed: InputBitmask;
  released: InputBitmask;
}
