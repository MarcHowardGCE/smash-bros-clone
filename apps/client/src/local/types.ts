import type { InputBitmask, PlayerId } from '@smash/shared';

export interface LocalPlayerConfig {
  playerId: PlayerId;
  keymap: Record<string, InputBitmask>;
  slotIndex: number;
}

export interface FighterChoice {
  id: string;
  displayName: string;
}
