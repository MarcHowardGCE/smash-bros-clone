import type { InputBitmask, PlayerId } from '@smash/shared';
import type { GamepadInputSource } from '../input/GamepadInputSource.js';

export interface LocalPlayerConfig {
  playerId: PlayerId;
  keymap: Record<string, InputBitmask>;
  slotIndex: number;
  gamepadSource?: GamepadInputSource | null;
}

export interface FighterChoice {
  id: string;
  displayName: string;
}
