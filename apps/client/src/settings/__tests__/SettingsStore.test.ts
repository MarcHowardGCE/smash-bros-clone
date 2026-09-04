/**
 * @fileoverview Unit tests for SettingsStore: round-trip persistence, corrupt-JSON fallback, and quota handling.
 */

import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { SettingsStore } from '../SettingsStore.js';

describe('SettingsStore', () => {
  let store: SettingsStore;

  beforeEach(() => {
    store = new SettingsStore();
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('load and save round-trip', () => {
    it('should persist volume to localStorage and restore on load', () => {
      store.set('volume', 0.5);
      expect(localStorage.getItem('smash:settings:v1')).toBeTruthy();

      const store2 = new SettingsStore();
      store2.load();
      expect(store2.get('volume')).toBe(0.5);
    });

    it('should persist keymap to localStorage and restore on load', () => {
      const newKeymap = { ArrowLeft: 'LEFT', KeyA: 'ATTACK' };
      store.set('keymapP1', newKeymap);

      const store2 = new SettingsStore();
      store2.load();
      expect(store2.get('keymapP1')).toEqual(newKeymap);
    });

    it('should load defaults when localStorage is empty', () => {
      store.load();
      expect(store.get('volume')).toBe(0.7);
      expect(store.get('keymapP1')).toHaveProperty('ArrowLeft');
    });
  });

  describe('corrupt JSON fallback', () => {
    it('should fall back to defaults when stored JSON is malformed', () => {
      localStorage.setItem('smash:settings:v1', '{not json');
      store.load();

      expect(store.get('volume')).toBe(0.7);
      expect(store.get('keymapP1')).toHaveProperty('ArrowLeft');
    });

    it('should fall back to defaults when stored JSON is missing expected fields', () => {
      localStorage.setItem('smash:settings:v1', JSON.stringify({ volume: 0.5 }));
      store.load();

      expect(store.get('volume')).toBe(0.7);
      expect(store.get('keymapP1')).toHaveProperty('ArrowLeft');
    });

    it('should fall back to defaults when volume is not a number', () => {
      localStorage.setItem(
        'smash:settings:v1',
        JSON.stringify({ volume: 'not-a-number', keymapP1: {} })
      );
      store.load();

      expect(store.get('volume')).toBe(0.7);
    });

    it('should fall back to defaults when keymapP1 is null', () => {
      localStorage.setItem(
        'smash:settings:v1',
        JSON.stringify({ volume: 0.5, keymapP1: null })
      );
      store.load();

      expect(store.get('keymapP1')).toHaveProperty('ArrowLeft');
    });
  });

  describe('localStorage unavailability (private mode, quota exceeded)', () => {
    it('should gracefully fall back to in-memory storage when localStorage.getItem throws', () => {
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Private mode');
      });

      store.load();
      expect(store.get('volume')).toBe(0.7);

      getItemSpy.mockRestore();
    });

    it('should gracefully fall back to in-memory storage when localStorage.setItem throws', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Quota exceeded');
      });

      // First load succeeds (no localStorage throw yet)
      store.load();

      // Now try to set a value; setItem will throw
      store.set('volume', 0.3);

      // Value is still in memory
      expect(store.get('volume')).toBe(0.3);

      // Reset the spy and verify in-memory value persists even if storage recovers
      setItemSpy.mockRestore();
      expect(store.get('volume')).toBe(0.3);
    });

    it('should remain playable with in-memory fallback after localStorage quota exceeded', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      // Initialize store and attempt to set volume
      store.load();
      store.set('volume', 0.2);
      store.set('volume', 0.6);

      // In-memory value reflects the latest set
      expect(store.get('volume')).toBe(0.6);

      setItemSpy.mockRestore();
    });
  });

  describe('get and set', () => {
    it('should get the current in-memory value', () => {
      store.load();
      expect(store.get('volume')).toBe(0.7);
    });

    it('should set a value and persist it', () => {
      store.load();
      store.set('volume', 0.9);

      expect(store.get('volume')).toBe(0.9);
      expect(JSON.parse(localStorage.getItem('smash:settings:v1') || '{}')).toHaveProperty(
        'volume',
        0.9
      );
    });

    it('should allow multiple sequential sets without throwing', () => {
      store.load();
      store.set('volume', 0.1);
      store.set('volume', 0.2);
      store.set('volume', 0.3);

      expect(store.get('volume')).toBe(0.3);
    });
  });

  describe('default values', () => {
    it('should provide defaults for volume and keymapP1', () => {
      store.load();

      expect(store.get('volume')).toBeCloseTo(0.7);
      const keymap = store.get('keymapP1');
      expect(keymap['ArrowLeft']).toBe('LEFT');
      expect(keymap['KeyA']).toBe('LEFT');
      expect(keymap['KeyZ']).toBe('ATTACK');
      expect(keymap['KeyS']).toBe('SPECIAL');
      expect(keymap['ShiftLeft']).toBe('SHIELD');
      expect(keymap['KeyC']).toBe('GRAB');
    });
  });
});
