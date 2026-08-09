import { describe, expect, it } from 'vitest';
import { RoomManager } from './RoomManager.js';

function createTwoPlayerRoom(manager: RoomManager): {
  roomCode: string;
  hostPlayerId: string;
  guestPlayerId: string;
} {
  const created = manager.createRoom('socket-host');
  const joined = manager.joinRoom(created.roomCode, 'socket-guest');

  if ('error' in joined) {
    throw new Error(`Failed to join room in test setup: ${joined.error}`);
  }

  return {
    roomCode: created.roomCode,
    hostPlayerId: created.playerId,
    guestPlayerId: joined.playerId,
  };
}

describe('RoomManager character select flow', () => {
  it('createRoom and joinRoom initialize character defaults', () => {
    const manager = new RoomManager();
    const created = manager.createRoom('socket-host');
    const joined = manager.joinRoom(created.roomCode, 'socket-guest');

    if ('error' in joined) {
      throw new Error(`Expected join to succeed: ${joined.error}`);
    }

    const room = manager.getRoom(created.roomCode);
    expect(room).toBeDefined();

    const hostSlot = room?.players.get(created.playerId);
    const guestSlot = room?.players.get(joined.playerId);

    expect(hostSlot?.characterId).toBe('all-rounder');
    expect(hostSlot?.characterConfirmed).toBe(false);
    expect(guestSlot?.characterId).toBe('all-rounder');
    expect(guestSlot?.characterConfirmed).toBe(false);
  });

  it('setReady transitions to CHARACTER_SELECT (not COUNTDOWN) when all players are ready', () => {
    const manager = new RoomManager();
    const setup = createTwoPlayerRoom(manager);

    const firstReady = manager.setReady(setup.roomCode, setup.hostPlayerId);
    const secondReady = manager.setReady(setup.roomCode, setup.guestPlayerId);

    expect('error' in firstReady).toBe(false);
    expect('error' in secondReady).toBe(false);

    const room = manager.getRoom(setup.roomCode);
    expect(room?.phase).toBe('CHARACTER_SELECT');
  });

  it('selectCharacter returns error outside CHARACTER_SELECT phase', () => {
    const manager = new RoomManager();
    const created = manager.createRoom('socket-host');

    const result = manager.selectCharacter(created.roomCode, created.playerId, 'abe-lincoln');
    expect(result).toEqual({ error: 'Not in character select phase' });
  });

  it('selectCharacter updates character and resets confirmation during CHARACTER_SELECT', () => {
    const manager = new RoomManager();
    const setup = createTwoPlayerRoom(manager);

    manager.setReady(setup.roomCode, setup.hostPlayerId);
    manager.setReady(setup.roomCode, setup.guestPlayerId);

    const firstConfirm = manager.confirmCharacter(setup.roomCode, setup.hostPlayerId);
    expect('error' in firstConfirm).toBe(false);

    const selectResult = manager.selectCharacter(setup.roomCode, setup.hostPlayerId, 'abe-lincoln');
    expect(selectResult).toEqual({ ok: true });

    const room = manager.getRoom(setup.roomCode);
    const slot = room?.players.get(setup.hostPlayerId);
    expect(slot?.characterId).toBe('abe-lincoln');
    expect(slot?.characterConfirmed).toBe(false);
  });

  it('confirmCharacter keeps CHARACTER_SELECT when only 1 of 2 players is confirmed', () => {
    const manager = new RoomManager();
    const setup = createTwoPlayerRoom(manager);

    manager.setReady(setup.roomCode, setup.hostPlayerId);
    manager.setReady(setup.roomCode, setup.guestPlayerId);

    const result = manager.confirmCharacter(setup.roomCode, setup.hostPlayerId);
    expect(result).toEqual({ allConfirmed: false });

    const room = manager.getRoom(setup.roomCode);
    expect(room?.phase).toBe('CHARACTER_SELECT');
  });

  it('confirmCharacter transitions to COUNTDOWN when all players are confirmed', () => {
    const manager = new RoomManager();
    const setup = createTwoPlayerRoom(manager);

    manager.setReady(setup.roomCode, setup.hostPlayerId);
    manager.setReady(setup.roomCode, setup.guestPlayerId);

    const first = manager.confirmCharacter(setup.roomCode, setup.hostPlayerId);
    const second = manager.confirmCharacter(setup.roomCode, setup.guestPlayerId);

    expect(first).toEqual({ allConfirmed: false });
    expect(second).toEqual({ allConfirmed: true });

    const room = manager.getRoom(setup.roomCode);
    expect(room?.phase).toBe('COUNTDOWN');
  });

  it('getCharacterSelections returns exact player-to-character map', () => {
    const manager = new RoomManager();
    const setup = createTwoPlayerRoom(manager);

    manager.setReady(setup.roomCode, setup.hostPlayerId);
    manager.setReady(setup.roomCode, setup.guestPlayerId);

    manager.selectCharacter(setup.roomCode, setup.hostPlayerId, 'abe-lincoln');
    manager.selectCharacter(setup.roomCode, setup.guestPlayerId, 'all-rounder');

    const selections = manager.getCharacterSelections(setup.roomCode);
    expect(selections).toEqual({
      [setup.hostPlayerId]: 'abe-lincoln',
      [setup.guestPlayerId]: 'all-rounder',
    });
  });

  it('resetToLobby clears characterConfirmed and preserves characterId', () => {
    const manager = new RoomManager();
    const setup = createTwoPlayerRoom(manager);

    manager.setReady(setup.roomCode, setup.hostPlayerId);
    manager.setReady(setup.roomCode, setup.guestPlayerId);
    manager.selectCharacter(setup.roomCode, setup.hostPlayerId, 'abe-lincoln');
    manager.confirmCharacter(setup.roomCode, setup.hostPlayerId);

    manager.resetToLobby(setup.roomCode);

    const room = manager.getRoom(setup.roomCode);
    const hostSlot = room?.players.get(setup.hostPlayerId);

    expect(room?.phase).toBe('LOBBY');
    expect(hostSlot?.characterId).toBe('abe-lincoln');
    expect(hostSlot?.characterConfirmed).toBe(false);
    expect(hostSlot?.isReady).toBe(false);
  });

  it('removePlayer during CHARACTER_SELECT resets phase to LOBBY and clears ready/confirmed for remaining players', () => {
    const manager = new RoomManager();
    const setup = createTwoPlayerRoom(manager);

    manager.setReady(setup.roomCode, setup.hostPlayerId);
    manager.setReady(setup.roomCode, setup.guestPlayerId);
    manager.selectCharacter(setup.roomCode, setup.hostPlayerId, 'abe-lincoln');
    manager.confirmCharacter(setup.roomCode, setup.hostPlayerId);

    const removed = manager.removePlayer('socket-host');
    expect(removed).not.toBeNull();

    const room = manager.getRoom(setup.roomCode);
    const guestSlot = room?.players.get(setup.guestPlayerId);
    expect(room?.phase).toBe('LOBBY');
    expect(guestSlot?.isReady).toBe(false);
    expect(guestSlot?.characterConfirmed).toBe(false);
    expect(guestSlot?.characterId).toBe('all-rounder');
  });

  it('removePlayer during COUNTDOWN resets phase to LOBBY and clears ready/confirmed for remaining players', () => {
    const manager = new RoomManager();
    const setup = createTwoPlayerRoom(manager);

    manager.setReady(setup.roomCode, setup.hostPlayerId);
    manager.setReady(setup.roomCode, setup.guestPlayerId);
    manager.confirmCharacter(setup.roomCode, setup.hostPlayerId);
    manager.confirmCharacter(setup.roomCode, setup.guestPlayerId);

    const before = manager.getRoom(setup.roomCode);
    expect(before?.phase).toBe('COUNTDOWN');

    const removed = manager.removePlayer('socket-host');
    expect(removed).not.toBeNull();

    const room = manager.getRoom(setup.roomCode);
    const guestSlot = room?.players.get(setup.guestPlayerId);
    expect(room?.phase).toBe('LOBBY');
    expect(guestSlot?.isReady).toBe(false);
    expect(guestSlot?.characterConfirmed).toBe(false);
    expect(guestSlot?.characterId).toBe('all-rounder');
  });
});
