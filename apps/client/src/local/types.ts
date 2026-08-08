import type { InputBitmask, PlayerId, BotDifficulty, InputEvent, GameState } from '@smash/shared';
import type { GamepadInputSource } from '../input/GamepadInputSource.js';

export interface ITickController {
  readonly playerId: PlayerId;
  readonly slotIndex: number;
  setTick(tick: number): void;
  pollInput(): InputEvent | null;
  destroy(): void;
  observe?(state: GameState): void;
}

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

export type SeatConfig = { kind: 'cpu'; difficulty: BotDifficulty } | { kind: 'human-gamepad' };
