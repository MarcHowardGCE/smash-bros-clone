import type { PlayerId } from '@smash/shared';

export type SessionPhase = 'LOBBY' | 'READY_CHECK' | 'COUNTDOWN' | 'MATCH' | 'RESULT';

export interface PlayerSlot {
  playerId: PlayerId;
  socketId: string;
  slotIndex: number;
  isReady: boolean;
}

export interface Room {
  code: string;
  phase: SessionPhase;
  players: Map<PlayerId, PlayerSlot>;
  createdAt: number;
}
