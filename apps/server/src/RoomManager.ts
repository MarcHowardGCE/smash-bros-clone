/**
 * @fileoverview Manages room lifecycle for the matchmaking layer.
 *
 * Rooms progress through a linear state machine:
 * `LOBBY → CHARACTER_SELECT → COUNTDOWN → MATCH → RESULT`
 *
 * Each room holds up to 4 player slots identified by a 6-character
 * alphanumeric code (ambiguous characters `O`, `0`, and `I` excluded).
 * `RoomManager` is pure in-memory state — no I/O, no timers. All socket
 * routing and countdown scheduling live in `createApp.ts`.
 */

import type { Room, PlayerSlot } from './types.js';
import type { PlayerId, CharacterId } from '@smash/shared';

const ROOM_CODE_CHARS = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
const MAX_PLAYERS = 4;
const REJOIN_GRACE_MS = 30_000;

type DisconnectedPlayerRecord = {
  readonly roomCode: string;
  readonly disconnectedAt: number;
};

function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

function generatePlayerId(): PlayerId {
  return `player_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Manages room lifecycle and player slot bookkeeping for all active sessions.
 *
 * @remarks
 * **Room state machine**
 *
 * ```
 * LOBBY
 *   └─ all players ready → CHARACTER_SELECT
 *        └─ all characters confirmed → COUNTDOWN
 *             └─ countdown elapses → MATCH
 *                  └─ match ends / last player disconnects → RESULT
 * ```
 *
 * Any disconnect during `CHARACTER_SELECT` or `COUNTDOWN` resets the room to
 * `LOBBY` and clears all ready/confirmed flags. An empty room is deleted
 * immediately.
 *
 * `RoomManager` is **pure state** — no timers, no socket references on the
 * manager itself. `createApp.ts` owns all I/O and calls these methods to
 * mutate state and read results.
 */
export class RoomManager {
  private rooms = new Map<string, Room>();
  private disconnectedPlayers = new Map<PlayerId, DisconnectedPlayerRecord>();

  /**
   * Creates a new room with a unique 6-character code and places the calling
   * socket into slot 0 as the host.
   *
   * @param socketId - socket.io socket ID of the creating player.
   * @returns The new room code, generated player ID, and slot index (always 0).
   */
  createRoom(socketId: string): { roomCode: string; playerId: PlayerId; slotIndex: number } {
    let roomCode: string;
    do {
      roomCode = generateRoomCode();
    } while (this.rooms.has(roomCode));

    const playerId = generatePlayerId();
    const room: Room = {
      code: roomCode,
      phase: 'LOBBY',
      players: new Map([
        [playerId, { playerId, socketId, slotIndex: 0, isReady: false, characterId: 'all-rounder', characterConfirmed: false }]
      ]),
      createdAt: Date.now(),
    };
    this.rooms.set(roomCode, room);
    return { roomCode, playerId, slotIndex: 0 };
  }

  /**
   * Adds a player to an existing room.
   *
   * Fails if the room doesn't exist, is not in `LOBBY` phase, or is already
   * at the 4-player maximum.
   *
   * @param roomCode - 6-character room code (case-insensitive).
   * @param socketId - socket.io socket ID of the joining player.
   * @returns The generated player ID and slot index, or an `{ error }` object.
   */
  joinRoom(roomCode: string, socketId: string): { playerId: PlayerId; slotIndex: number } | { error: string } {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return { error: 'Room not found' };
    if (room.phase !== 'LOBBY') return { error: 'Game already in progress' };
    if (room.players.size >= MAX_PLAYERS) return { error: 'Room is full' };

    const slotIndex = room.players.size;
    const playerId = generatePlayerId();
    room.players.set(playerId, { playerId, socketId, slotIndex, isReady: false, characterId: 'all-rounder', characterConfirmed: false });
    return { playerId, slotIndex };
  }

  /**
   * Marks a player as ready. When all players (minimum 2) are ready, advances
   * the room phase to `CHARACTER_SELECT`.
   *
   * @param roomCode - 6-character room code.
   * @param playerId - Player marking themselves ready.
   * @returns `{ allReady }` flag, or an `{ error }` object.
   */
  setReady(roomCode: string, playerId: PlayerId): { allReady: boolean } | { error: string } {
    const room = this.rooms.get(roomCode);
    if (!room) return { error: 'Room not found' };
    const slot = room.players.get(playerId);
    if (!slot) return { error: 'Player not in room' };

    slot.isReady = true;
    const allReady = room.players.size >= 2 && [...room.players.values()].every(p => p.isReady);
    if (allReady) room.phase = 'CHARACTER_SELECT';
    return { allReady };
  }

  /**
   * Updates a player's character selection. Resets their `characterConfirmed`
   * flag so they must re-confirm after changing their pick.
   *
   * Only valid during `CHARACTER_SELECT` phase.
   *
   * @param roomCode - 6-character room code.
   * @param playerId - Player making the selection.
   * @param characterId - The chosen character.
   * @returns `{ ok: true }` or an `{ error }` object.
   */
  selectCharacter(roomCode: string, playerId: PlayerId, characterId: CharacterId): { ok: true } | { error: string } {
    const room = this.rooms.get(roomCode);
    if (!room) return { error: 'Room not found' };
    if (room.phase !== 'CHARACTER_SELECT') return { error: 'Not in character select phase' };

    const slot = room.players.get(playerId);
    if (!slot) return { error: 'Player not in room' };

    slot.characterId = characterId;
    slot.characterConfirmed = false;
    return { ok: true };
  }

  /**
   * Locks in a player's character selection. When all players (minimum 2)
   * have confirmed, advances the room phase to `COUNTDOWN`.
   *
   * Only valid during `CHARACTER_SELECT` phase.
   *
   * @param roomCode - 6-character room code.
   * @param playerId - Player confirming their selection.
   * @returns `{ allConfirmed }` flag, or an `{ error }` object.
   */
  confirmCharacter(roomCode: string, playerId: PlayerId): { allConfirmed: boolean } | { error: string } {
    const room = this.rooms.get(roomCode);
    if (!room) return { error: 'Room not found' };
    if (room.phase !== 'CHARACTER_SELECT') return { error: 'Not in character select phase' };

    const slot = room.players.get(playerId);
    if (!slot) return { error: 'Player not in room' };

    slot.characterConfirmed = true;

    const allConfirmed =
      room.players.size >= 2 && [...room.players.values()].every((player) => player.characterConfirmed);

    if (allConfirmed) {
      room.phase = 'COUNTDOWN';
    }

    return { allConfirmed };
  }

  /**
   * Returns a map of player ID to character ID for all players in the room.
   * Used to seed a new {@link MatchSession} with character selections just
   * before the match starts.
   *
   * @param roomCode - 6-character room code.
   * @returns Partial record of player ID to character ID; empty object if room not found.
   */
  getCharacterSelections(roomCode: string): Partial<Record<PlayerId, CharacterId>> {
    const room = this.rooms.get(roomCode);
    if (!room) return {};

    const selections: Partial<Record<PlayerId, CharacterId>> = {};
    for (const [playerId, slot] of room.players.entries()) {
      selections[playerId] = slot.characterId;
    }

    return selections;
  }

  /**
   * Marks a player as temporarily disconnected without removing their room slot.
   *
   * @param playerId - Player that disconnected mid-session.
   * @returns `{ ok: true }` when tracked, or `{ error }` if the player isn't present.
   */
  markDisconnected(playerId: PlayerId): { ok: true } | { error: string } {
    for (const [roomCode, room] of this.rooms.entries()) {
      const slot = room.players.get(playerId);
      if (slot) {
        this.disconnectedPlayers.set(playerId, {
          roomCode,
          disconnectedAt: Date.now(),
        });
        return { ok: true };
      }
    }
    return { error: 'Player not in room' };
  }

  /**
   * Rebinds a disconnected player to a new socket ID when they reconnect.
   *
   * @param roomCode - 6-character room code.
   * @param playerId - Rejoining player ID.
   * @param newSocketId - New socket.io socket ID after reconnect.
   * @returns `{ ok: true, slotIndex }` on success, or `{ error }` when rejoin fails.
   */
  rejoinRoom(roomCode: string, playerId: PlayerId, newSocketId: string): { ok: true; slotIndex: number } | { error: string } {
    const normalizedRoomCode = roomCode.toUpperCase();
    const room = this.rooms.get(normalizedRoomCode);
    if (!room) return { error: 'Room not found' };

    const slot = room.players.get(playerId);
    if (!slot) return { error: 'Player not in room' };

    const disconnected = this.disconnectedPlayers.get(playerId);
    if (!disconnected || disconnected.roomCode !== normalizedRoomCode) {
      return { error: 'Player is not disconnected' };
    }

    const elapsedMs = Date.now() - disconnected.disconnectedAt;
    if (elapsedMs > REJOIN_GRACE_MS) {
      this.disconnectedPlayers.delete(playerId);
      return { error: 'Rejoin grace window expired' };
    }

    slot.socketId = newSocketId;
    this.disconnectedPlayers.delete(playerId);
    return { ok: true, slotIndex: slot.slotIndex };
  }

  /**
   * Advances the room phase to `MATCH`. Called by `createApp.ts` when the
   * countdown timer elapses and the {@link MatchSession} is about to start.
   *
   * @param roomCode - 6-character room code.
   */
  startMatch(roomCode: string): void {
    const room = this.rooms.get(roomCode);
    if (room) room.phase = 'MATCH';
  }

  /**
   * Advances the room phase to `RESULT`. Called by `createApp.ts` when the
   * {@link MatchSession} fires `onMatchOver` or a player disconnects mid-match.
   *
   * @param roomCode - 6-character room code.
   */
  endMatch(roomCode: string): void {
    const room = this.rooms.get(roomCode);
    if (room) room.phase = 'RESULT';
  }

  /**
   * Resets a room back to `LOBBY` phase and clears all ready/confirmed flags.
   * Used after a match ends to allow a rematch without re-creating the room.
   *
   * @param roomCode - 6-character room code.
   */
  resetToLobby(roomCode: string): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;
    room.phase = 'LOBBY';
    for (const player of room.players.values()) {
      player.isReady = false;
      player.characterConfirmed = false;
    }
  }

  /**
   * Removes a player by socket ID. If the room becomes empty it is deleted. If
   * the room was in `CHARACTER_SELECT` or `COUNTDOWN` phase it is reset to
   * `LOBBY` and all remaining players' ready/confirmed flags are cleared.
   *
   * @param socketId - socket.io socket ID of the disconnecting player.
   * @returns The room code and player ID that were removed, or `null` if the
   *   socket was not found in any room.
   */
  removePlayer(socketId: string): { roomCode: string; playerId: PlayerId } | null {
    for (const [roomCode, room] of this.rooms.entries()) {
      for (const [playerId, slot] of room.players.entries()) {
        if (slot.socketId === socketId) {
          this.disconnectedPlayers.delete(playerId);
          room.players.delete(playerId);
          if (room.phase === 'CHARACTER_SELECT' || room.phase === 'COUNTDOWN') {
            room.phase = 'LOBBY';
            for (const remainingSlot of room.players.values()) {
              remainingSlot.isReady = false;
              remainingSlot.characterConfirmed = false;
            }
          }
          if (room.players.size === 0) {
            this.rooms.delete(roomCode);
          }
          return { roomCode, playerId };
        }
      }
    }
    return null;
  }

  /**
   * Looks up a room by its code.
   *
   * @param roomCode - 6-character room code.
   * @returns The {@link Room} object, or `undefined` if not found.
   */
  getRoom(roomCode: string): Room | undefined {
    return this.rooms.get(roomCode);
  }

  /**
   * Finds the room and player ID associated with a socket ID. Used on every
   * incoming socket event to resolve the caller's identity without requiring
   * the client to send their player ID in every message.
   *
   * @param socketId - socket.io socket ID to search for.
   * @returns The matching `{ room, playerId }` pair, or `null` if not found.
   */
  getRoomBySocketId(socketId: string): { room: Room; playerId: PlayerId } | null {
    for (const room of this.rooms.values()) {
      for (const [playerId, slot] of room.players.entries()) {
        if (slot.socketId === socketId) {
          return { room, playerId };
        }
      }
    }
    return null;
  }

  /**
   * Returns an ordered list of all player IDs in a room.
   * Used to seed a new {@link MatchSession} just before `game:start` is emitted.
   *
   * @param roomCode - 6-character room code.
   * @returns Array of player IDs in insertion order; empty array if room not found.
   */
  getPlayerIds(roomCode: string): PlayerId[] {
    return [...(this.rooms.get(roomCode)?.players.keys() ?? [])];
  }
}
