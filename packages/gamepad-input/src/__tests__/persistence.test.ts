import { describe, it, expect } from 'vitest';
import {
  GamepadPreferenceStore,
  StorageAdapter,
  SavedAssignment,
} from '../persistence';

/**
 * In-memory fake StorageAdapter for testing.
 * Backed by a Map to simulate localStorage behavior.
 */
function createFakeStorage(): StorageAdapter {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => map.set(key, value),
  };
}

describe('GamepadPreferenceStore', () => {
  describe('save/load round-trip', () => {
    it('should save and load assignments', () => {
      const storage = createFakeStorage();
      const store = new GamepadPreferenceStore(storage);

      const assignments: SavedAssignment[] = [
        { gamepadId: 'Xbox 360 Controller (XInput STANDARD GAMEPAD)', lastSlotIndex: 0 },
        { gamepadId: 'PS4 Controller', lastSlotIndex: 1 },
      ];

      store.save(assignments);
      const loaded = store.load();

      expect(loaded).toEqual(assignments);
    });

    it('should handle empty assignments array', () => {
      const storage = createFakeStorage();
      const store = new GamepadPreferenceStore(storage);

      store.save([]);
      const loaded = store.load();

      expect(loaded).toEqual([]);
    });

    it('should use custom storage key', () => {
      const storage = createFakeStorage();
      const customKey = 'custom:key';
      const store = new GamepadPreferenceStore(storage, customKey);

      const assignments: SavedAssignment[] = [
        { gamepadId: 'Test Controller', lastSlotIndex: 2 },
      ];

      store.save(assignments);
      const loaded = store.load();

      expect(loaded).toEqual(assignments);
    });
  });

  describe('corrupt JSON handling', () => {
    it('should return empty array on corrupt JSON', () => {
      const storage: StorageAdapter = {
        getItem: () => '{not valid json',
        setItem: () => {},
      };
      const store = new GamepadPreferenceStore(storage);

      const result = store.load();

      expect(result).toEqual([]);
    });

    it('should return empty array on missing key', () => {
      const storage = createFakeStorage();
      const store = new GamepadPreferenceStore(storage);

      const result = store.load();

      expect(result).toEqual([]);
    });

    it('should return empty array if stored value is not an array', () => {
      const storage: StorageAdapter = {
        getItem: () => '{"not": "an array"}',
        setItem: () => {},
      };
      const store = new GamepadPreferenceStore(storage);

      const result = store.load();

      expect(result).toEqual([]);
    });

    it('should not throw on various malformed JSON inputs', () => {
      const malformedInputs = [
        '{',
        '[{',
        'null',
        'undefined',
        '{"gamepadId": "test"', // missing bracket
        'NaN',
      ];

      malformedInputs.forEach((input) => {
        const storage: StorageAdapter = {
          getItem: () => input,
          setItem: () => {},
        };
        const store = new GamepadPreferenceStore(storage);

        expect(() => {
          store.load();
        }).not.toThrow();

        const result = store.load();
        expect(result).toEqual([]);
      });
    });
  });

  describe('findSlotForGamepadId', () => {
    it('should find slot by gamepad ID', () => {
      const storage = createFakeStorage();
      const store = new GamepadPreferenceStore(storage);

      const assignments: SavedAssignment[] = [
        { gamepadId: 'Xbox 360 Controller (XInput STANDARD GAMEPAD)', lastSlotIndex: 1 },
        { gamepadId: 'PS4 Controller', lastSlotIndex: 2 },
      ];

      store.save(assignments);
      const slot = store.findSlotForGamepadId('Xbox 360 Controller (XInput STANDARD GAMEPAD)');

      expect(slot).toBe(1);
    });

    it('should return null if gamepad ID not found', () => {
      const storage = createFakeStorage();
      const store = new GamepadPreferenceStore(storage);

      const assignments: SavedAssignment[] = [
        { gamepadId: 'Xbox 360 Controller (XInput STANDARD GAMEPAD)', lastSlotIndex: 1 },
      ];

      store.save(assignments);
      const slot = store.findSlotForGamepadId('Unknown Controller');

      expect(slot).toBeNull();
    });

    it('should return null if store is empty', () => {
      const storage = createFakeStorage();
      const store = new GamepadPreferenceStore(storage);

      const slot = store.findSlotForGamepadId('Any Controller');

      expect(slot).toBeNull();
    });

    it('should gracefully handle corrupt JSON when finding slot', () => {
      const storage: StorageAdapter = {
        getItem: () => '{malformed',
        setItem: () => {},
      };
      const store = new GamepadPreferenceStore(storage);

      const slot = store.findSlotForGamepadId('Any Controller');

      expect(slot).toBeNull();
    });

    it('should find first matching assignment if duplicates exist', () => {
      const storage: StorageAdapter = {
        getItem: () =>
          JSON.stringify([
            { gamepadId: 'Xbox', lastSlotIndex: 0 },
            { gamepadId: 'Xbox', lastSlotIndex: 1 }, // duplicate with different slot
          ]),
        setItem: () => {},
      };
      const store = new GamepadPreferenceStore(storage);

      const slot = store.findSlotForGamepadId('Xbox');

      expect(slot).toBe(0); // first match
    });
  });

  describe('storage isolation', () => {
    it('should not affect other storage keys', () => {
      const storage = createFakeStorage();
      const store1 = new GamepadPreferenceStore(storage, 'key1');
      const store2 = new GamepadPreferenceStore(storage, 'key2');

      const assignments1: SavedAssignment[] = [
        { gamepadId: 'Controller A', lastSlotIndex: 0 },
      ];
      const assignments2: SavedAssignment[] = [
        { gamepadId: 'Controller B', lastSlotIndex: 1 },
      ];

      store1.save(assignments1);
      store2.save(assignments2);

      expect(store1.load()).toEqual(assignments1);
      expect(store2.load()).toEqual(assignments2);
    });
  });
});
