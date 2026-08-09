import type { PlayerId, CharacterId } from '@smash/shared';

export type SessionPhase = 'LOBBY' | 'CHARACTER_SELECT' | 'READY_CHECK' | 'COUNTDOWN' | 'MATCH' | 'RESULT';

export interface PlayerSlot {
  playerId: PlayerId;
  socketId: string;
  slotIndex: number;
  isReady: boolean;
  characterId: CharacterId;
  characterConfirmed: boolean;
}

export interface Room {
  code: string;
  phase: SessionPhase;
  players: Map<PlayerId, PlayerSlot>;
  createdAt: number;
}
