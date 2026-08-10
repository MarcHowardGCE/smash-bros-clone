/**
 * @fileoverview Shared server-side types for room and player state.
 *
 * These types are used exclusively by the server (`RoomManager`, `createApp`).
 * Client-facing types live in `packages/shared`.
 */

import type { PlayerId, CharacterId } from '@smash/shared';

/**
 * The current lifecycle phase of a room.
 *
 * Rooms advance through phases in order:
 * `LOBBY → CHARACTER_SELECT → COUNTDOWN → MATCH → RESULT`
 *
 * `READY_CHECK` is reserved for a future feature where players must
 * explicitly confirm readiness after returning from a previous match.
 */
export type SessionPhase = 'LOBBY' | 'CHARACTER_SELECT' | 'READY_CHECK' | 'COUNTDOWN' | 'MATCH' | 'RESULT';

/**
 * Represents a single player's slot in a room.
 *
 * Created by {@link RoomManager.createRoom} or {@link RoomManager.joinRoom}
 * and mutated in-place as the player progresses through the lobby flow.
 */
export interface PlayerSlot {
  /** Unique player identifier generated on join. */
  playerId: PlayerId;
  /** socket.io socket ID — used to route messages and resolve identity on disconnect. */
  socketId: string;
  /** Zero-based display index (0–3) used to assign colour/pattern on the client. */
  slotIndex: number;
  /** Whether the player has clicked Ready in the lobby. */
  isReady: boolean;
  /** The character the player has selected (defaults to `'all-rounder'`). */
  characterId: CharacterId;
  /** Whether the player has locked in their character selection. */
  characterConfirmed: boolean;
}

/**
 * A single matchmaking room.
 *
 * Created by {@link RoomManager.createRoom} and deleted when the last player
 * disconnects. The `phase` field tracks the room's position in the lobby
 * state machine (see {@link SessionPhase}).
 */
export interface Room {
  /** The 6-character alphanumeric room code shown to players. */
  code: string;
  /** Current lifecycle phase of this room. */
  phase: SessionPhase;
  /** Map from player ID to slot data for all players currently in the room. */
  players: Map<PlayerId, PlayerSlot>;
  /** Unix timestamp (ms) when the room was created. */
  createdAt: number;
}
