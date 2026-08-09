import type { Room, PlayerSlot } from './types.js';
import type { PlayerId, CharacterId } from '@smash/shared';

const ROOM_CODE_CHARS = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
const MAX_PLAYERS = 4;

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

export class RoomManager {
  private rooms = new Map<string, Room>();

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

  getCharacterSelections(roomCode: string): Partial<Record<PlayerId, CharacterId>> {
    const room = this.rooms.get(roomCode);
    if (!room) return {};

    const selections: Partial<Record<PlayerId, CharacterId>> = {};
    for (const [playerId, slot] of room.players.entries()) {
      selections[playerId] = slot.characterId;
    }

    return selections;
  }

  startMatch(roomCode: string): void {
    const room = this.rooms.get(roomCode);
    if (room) room.phase = 'MATCH';
  }

  endMatch(roomCode: string): void {
    const room = this.rooms.get(roomCode);
    if (room) room.phase = 'RESULT';
  }

  resetToLobby(roomCode: string): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;
    room.phase = 'LOBBY';
    for (const player of room.players.values()) {
      player.isReady = false;
      player.characterConfirmed = false;
    }
  }

  removePlayer(socketId: string): { roomCode: string; playerId: PlayerId } | null {
    for (const [roomCode, room] of this.rooms.entries()) {
      for (const [playerId, slot] of room.players.entries()) {
        if (slot.socketId === socketId) {
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

  getRoom(roomCode: string): Room | undefined {
    return this.rooms.get(roomCode);
  }

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

  getPlayerIds(roomCode: string): PlayerId[] {
    return [...(this.rooms.get(roomCode)?.players.keys() ?? [])];
  }
}
