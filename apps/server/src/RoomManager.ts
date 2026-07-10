import type { Room, PlayerSlot } from './types.js';
import type { PlayerId } from '@smash/shared';

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
        [playerId, { playerId, socketId, slotIndex: 0, isReady: false }]
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
    room.players.set(playerId, { playerId, socketId, slotIndex, isReady: false });
    return { playerId, slotIndex };
  }

  setReady(roomCode: string, playerId: PlayerId): { allReady: boolean } | { error: string } {
    const room = this.rooms.get(roomCode);
    if (!room) return { error: 'Room not found' };
    const slot = room.players.get(playerId);
    if (!slot) return { error: 'Player not in room' };

    slot.isReady = true;
    const allReady = room.players.size >= 2 && [...room.players.values()].every(p => p.isReady);
    if (allReady) room.phase = 'COUNTDOWN';
    return { allReady };
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
    }
  }

  removePlayer(socketId: string): { roomCode: string; playerId: PlayerId } | null {
    for (const [roomCode, room] of this.rooms.entries()) {
      for (const [playerId, slot] of room.players.entries()) {
        if (slot.socketId === socketId) {
          room.players.delete(playerId);
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
