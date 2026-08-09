import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Socket } from 'socket.io-client';
import { GameClient, type GameClientOptions } from '../GameClient.js';

// Create a mock socket that we can control
function createMockSocket() {
  const handlers: Record<string, Function[]> = {};
  const emitCalls: Array<{ event: string; args: any[] }> = [];

  return {
    on: vi.fn((event: string, handler: Function) => {
      if (!handlers[event]) {
        handlers[event] = [];
      }
      handlers[event].push(handler);
    }),
    emit: vi.fn((event: string, ...args: any[]) => {
      emitCalls.push({ event, args });
    }),
    disconnect: vi.fn(),
    // Helper methods for testing
    _getHandlers: (event: string) => handlers[event] || [],
    _getEmitCalls: () => emitCalls,
    _clearEmitCalls: () => emitCalls.splice(0),
    _triggerHandler: (event: string, data: any) => {
      const eventHandlers = handlers[event];
      if (eventHandlers) {
        eventHandlers.forEach((handler) => handler(data));
      }
    },
  };
}

// Mock socket.io-client module
let mockSocket: any;
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

describe('GameClient - character select', () => {
  let gameClient: GameClient;
  let options: GameClientOptions;

  beforeEach(() => {
    // Create fresh mock socket for each test
    mockSocket = createMockSocket();

    // Create options with all callbacks
    options = {
      serverUrl: 'http://localhost:3001',
      onRenderState: vi.fn(),
      onMatchPhaseChange: vi.fn(),
      onRoomCreated: vi.fn(),
      onPlayerJoined: vi.fn(),
      onCharacterSelectStart: vi.fn(),
      onCharacterUpdated: vi.fn(),
      onPlayerLeft: vi.fn(),
    };

    gameClient = new GameClient(options);
  });

  afterEach(() => {
    gameClient.disconnect();
  });

  describe('selectCharacter()', () => {
    it('should emit character:select with room code and characterId', () => {
      // Set up room code
      (gameClient as any).myRoomCode = 'ABC123';

      const callback = vi.fn();
      gameClient.selectCharacter('abe-lincoln', callback);

      const emitCalls = mockSocket._getEmitCalls();
      expect(emitCalls).toHaveLength(1);
      expect(emitCalls[0].event).toBe('character:select');
      expect(emitCalls[0].args[0]).toBe('ABC123');
      expect(emitCalls[0].args[1]).toBe('abe-lincoln');
      expect(emitCalls[0].args[2]).toBe(callback);
    });

    it('should not emit when myRoomCode is null', () => {
      (gameClient as any).myRoomCode = null;

      const callback = vi.fn();
      gameClient.selectCharacter('abe-lincoln', callback);

      const emitCalls = mockSocket._getEmitCalls();
      expect(emitCalls).toHaveLength(0);
    });

    it('should work without callback', () => {
      (gameClient as any).myRoomCode = 'ABC123';

      gameClient.selectCharacter('all-rounder');

      const emitCalls = mockSocket._getEmitCalls();
      expect(emitCalls).toHaveLength(1);
      expect(emitCalls[0].event).toBe('character:select');
      expect(emitCalls[0].args[0]).toBe('ABC123');
      expect(emitCalls[0].args[1]).toBe('all-rounder');
      expect(emitCalls[0].args[2]).toBeUndefined();
    });

    it('should forward callback with ok result', () => {
      (gameClient as any).myRoomCode = 'ABC123';

      const callback = vi.fn();
      gameClient.selectCharacter('abe-lincoln', callback);

      // Simulate server callback
      const emitCalls = mockSocket._getEmitCalls();
      const serverCallback = emitCalls[0].args[2];
      serverCallback({ ok: true });

      expect(callback).toHaveBeenCalledWith({ ok: true });
    });

    it('should forward callback with error result', () => {
      (gameClient as any).myRoomCode = 'ABC123';

      const callback = vi.fn();
      gameClient.selectCharacter('invalid-char', callback);

      // Simulate server error callback
      const emitCalls = mockSocket._getEmitCalls();
      const serverCallback = emitCalls[0].args[2];
      serverCallback({ error: 'invalid characterId' });

      expect(callback).toHaveBeenCalledWith({ error: 'invalid characterId' });
    });
  });

  describe('confirmCharacter()', () => {
    it('should emit character:confirm with room code', () => {
      (gameClient as any).myRoomCode = 'ABC123';

      const callback = vi.fn();
      gameClient.confirmCharacter(callback);

      const emitCalls = mockSocket._getEmitCalls();
      expect(emitCalls).toHaveLength(1);
      expect(emitCalls[0].event).toBe('character:confirm');
      expect(emitCalls[0].args[0]).toBe('ABC123');
      expect(emitCalls[0].args[1]).toBe(callback);
    });

    it('should not emit when myRoomCode is null', () => {
      (gameClient as any).myRoomCode = null;

      const callback = vi.fn();
      gameClient.confirmCharacter(callback);

      const emitCalls = mockSocket._getEmitCalls();
      expect(emitCalls).toHaveLength(0);
    });

    it('should work without callback', () => {
      (gameClient as any).myRoomCode = 'ABC123';

      gameClient.confirmCharacter();

      const emitCalls = mockSocket._getEmitCalls();
      expect(emitCalls).toHaveLength(1);
      expect(emitCalls[0].event).toBe('character:confirm');
      expect(emitCalls[0].args[0]).toBe('ABC123');
      expect(emitCalls[0].args[1]).toBeUndefined();
    });

    it('should forward callback with ok and allConfirmed result', () => {
      (gameClient as any).myRoomCode = 'ABC123';

      const callback = vi.fn();
      gameClient.confirmCharacter(callback);

      // Simulate server callback
      const emitCalls = mockSocket._getEmitCalls();
      const serverCallback = emitCalls[0].args[1];
      serverCallback({ ok: true, allConfirmed: true });

      expect(callback).toHaveBeenCalledWith({ ok: true, allConfirmed: true });
    });

    it('should forward callback with error result', () => {
      (gameClient as any).myRoomCode = 'ABC123';

      const callback = vi.fn();
      gameClient.confirmCharacter(callback);

      // Simulate server error callback
      const emitCalls = mockSocket._getEmitCalls();
      const serverCallback = emitCalls[0].args[1];
      serverCallback({ error: 'not in CHARACTER_SELECT phase' });

      expect(callback).toHaveBeenCalledWith({ error: 'not in CHARACTER_SELECT phase' });
    });
  });

  describe('socket handlers', () => {
    it('should invoke onCharacterSelectStart when room:characterSelectStart is received', () => {
      const playerIds = ['p1', 'p2', 'p3'] as any;

      mockSocket._triggerHandler('room:characterSelectStart', { playerIds });

      expect(options.onCharacterSelectStart).toHaveBeenCalledWith(playerIds);
    });

    it('should invoke onCharacterUpdated when character:updated is received', () => {
      const data = { playerId: 'p1', characterId: 'abe-lincoln', confirmed: false };

      mockSocket._triggerHandler('character:updated', data);

      expect(options.onCharacterUpdated).toHaveBeenCalledWith(data);
    });

    it('should invoke onPlayerLeft when room:playerLeft is received', () => {
      mockSocket._triggerHandler('room:playerLeft', { playerId: 'p2' });

      expect(options.onPlayerLeft).toHaveBeenCalledWith('p2');
    });

    it('should not throw when onCharacterSelectStart callback is not provided', () => {
      const optionsWithoutCallback: GameClientOptions = {
        serverUrl: 'http://localhost:3001',
        onRenderState: vi.fn(),
        onMatchPhaseChange: vi.fn(),
        onRoomCreated: vi.fn(),
        onPlayerJoined: vi.fn(),
      };

      mockSocket = createMockSocket();
      const client = new GameClient(optionsWithoutCallback);

      expect(() => {
        mockSocket._triggerHandler('room:characterSelectStart', { playerIds: ['p1', 'p2'] });
      }).not.toThrow();

      client.disconnect();
    });

    it('should not throw when onCharacterUpdated callback is not provided', () => {
      const optionsWithoutCallback: GameClientOptions = {
        serverUrl: 'http://localhost:3001',
        onRenderState: vi.fn(),
        onMatchPhaseChange: vi.fn(),
        onRoomCreated: vi.fn(),
        onPlayerJoined: vi.fn(),
      };

      mockSocket = createMockSocket();
      const client = new GameClient(optionsWithoutCallback);

      expect(() => {
        mockSocket._triggerHandler('character:updated', {
          playerId: 'p1',
          characterId: 'abe-lincoln',
          confirmed: false,
        });
      }).not.toThrow();

      client.disconnect();
    });

    it('should not throw when onPlayerLeft callback is not provided', () => {
      const optionsWithoutCallback: GameClientOptions = {
        serverUrl: 'http://localhost:3001',
        onRenderState: vi.fn(),
        onMatchPhaseChange: vi.fn(),
        onRoomCreated: vi.fn(),
        onPlayerJoined: vi.fn(),
      };

      mockSocket = createMockSocket();
      const client = new GameClient(optionsWithoutCallback);

      expect(() => {
        mockSocket._triggerHandler('room:playerLeft', { playerId: 'p2' });
      }).not.toThrow();

      client.disconnect();
    });
  });

  describe('integration scenarios', () => {
    it('should handle full character select flow: select -> update -> confirm', () => {
      (gameClient as any).myRoomCode = 'ABC123';

      // Step 1: Select character
      const selectCallback = vi.fn();
      gameClient.selectCharacter('abe-lincoln', selectCallback);

      // Simulate server ack
      let emitCalls = mockSocket._getEmitCalls();
      emitCalls[0].args[2]({ ok: true });

      expect(selectCallback).toHaveBeenCalledWith({ ok: true });

      // Step 2: Simulate character:updated broadcast
      mockSocket._triggerHandler('character:updated', {
        playerId: 'p1',
        characterId: 'abe-lincoln',
        confirmed: false,
      });

      expect(options.onCharacterUpdated).toHaveBeenCalledWith({
        playerId: 'p1',
        characterId: 'abe-lincoln',
        confirmed: false,
      });

      // Step 3: Confirm character
      mockSocket._clearEmitCalls();
      const confirmCallback = vi.fn();
      gameClient.confirmCharacter(confirmCallback);

      // Simulate server ack
      emitCalls = mockSocket._getEmitCalls();
      emitCalls[0].args[1]({ ok: true, allConfirmed: true });

      expect(confirmCallback).toHaveBeenCalledWith({ ok: true, allConfirmed: true });

      // Step 4: Simulate confirmation broadcast
      mockSocket._triggerHandler('character:updated', {
        playerId: 'p1',
        characterId: 'abe-lincoln',
        confirmed: true,
      });

      expect(options.onCharacterUpdated).toHaveBeenLastCalledWith({
        playerId: 'p1',
        characterId: 'abe-lincoln',
        confirmed: true,
      });
    });

    it('should handle player disconnect during character select', () => {
      mockSocket._triggerHandler('room:playerLeft', { playerId: 'p2' });

      expect(options.onPlayerLeft).toHaveBeenCalledWith('p2');
    });
  });
});
