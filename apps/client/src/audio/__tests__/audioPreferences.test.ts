import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadAudioPreferences,
  saveAudioPreferences,
  AUDIO_PREFERENCES_KEY,
  DEFAULT_AUDIO_PREFERENCES,
  type AudioPreferences,
  type StorageAdapter,
} from '../audioPreferences';

describe('audioPreferences', () => {
  // Test double: a fake storage adapter
  let storage: StorageAdapter;

  beforeEach(() => {
    const map = new Map<string, string>();
    storage = {
      getItem: (key: string) => map.get(key) ?? null,
      setItem: (key: string, value: string) => map.set(key, value),
    };
  });

  describe('loadAudioPreferences', () => {
    it('should return defaults when key is missing', () => {
      const prefs = loadAudioPreferences(storage);
      expect(prefs).toEqual(DEFAULT_AUDIO_PREFERENCES);
    });

    it('should return defaults when JSON is malformed', () => {
      storage.setItem(AUDIO_PREFERENCES_KEY, '{broken json');
      const prefs = loadAudioPreferences(storage);
      expect(prefs).toEqual(DEFAULT_AUDIO_PREFERENCES);
    });

    it('should return defaults when stored value is not an object', () => {
      storage.setItem(AUDIO_PREFERENCES_KEY, '"not an object"');
      const prefs = loadAudioPreferences(storage);
      expect(prefs).toEqual(DEFAULT_AUDIO_PREFERENCES);
    });

    it('should return defaults when stored value is an array', () => {
      storage.setItem(AUDIO_PREFERENCES_KEY, '[1, 2, 3]');
      const prefs = loadAudioPreferences(storage);
      expect(prefs).toEqual(DEFAULT_AUDIO_PREFERENCES);
    });

    it('should clamp volume out of range [0,1] to valid range', () => {
      storage.setItem(AUDIO_PREFERENCES_KEY, JSON.stringify({ volume: 1.5, muted: false }));
      const prefs = loadAudioPreferences(storage);
      expect(prefs.volume).toBe(1.0);
    });

    it('should clamp negative volume to 0', () => {
      storage.setItem(AUDIO_PREFERENCES_KEY, JSON.stringify({ volume: -0.5, muted: false }));
      const prefs = loadAudioPreferences(storage);
      expect(prefs.volume).toBe(0);
    });

    it('should use default volume when stored volume is not a number', () => {
      storage.setItem(AUDIO_PREFERENCES_KEY, JSON.stringify({ volume: 'not a number', muted: false }));
      const prefs = loadAudioPreferences(storage);
      expect(prefs.volume).toBe(DEFAULT_AUDIO_PREFERENCES.volume);
    });

    it('should use default muted when stored muted is not a boolean', () => {
      storage.setItem(AUDIO_PREFERENCES_KEY, JSON.stringify({ volume: 0.5, muted: 'yes' }));
      const prefs = loadAudioPreferences(storage);
      expect(prefs.muted).toBe(DEFAULT_AUDIO_PREFERENCES.muted);
    });

    it('should load valid preferences correctly', () => {
      const expected: AudioPreferences = { volume: 0.7, muted: true };
      storage.setItem(AUDIO_PREFERENCES_KEY, JSON.stringify(expected));
      const prefs = loadAudioPreferences(storage);
      expect(prefs).toEqual(expected);
    });

    it('should load zero volume correctly', () => {
      storage.setItem(AUDIO_PREFERENCES_KEY, JSON.stringify({ volume: 0, muted: false }));
      const prefs = loadAudioPreferences(storage);
      expect(prefs.volume).toBe(0);
      expect(prefs.muted).toBe(false);
    });

    it('should load 1.0 volume correctly', () => {
      storage.setItem(AUDIO_PREFERENCES_KEY, JSON.stringify({ volume: 1, muted: false }));
      const prefs = loadAudioPreferences(storage);
      expect(prefs.volume).toBe(1);
      expect(prefs.muted).toBe(false);
    });

    it('should ignore extra fields in stored object', () => {
      storage.setItem(
        AUDIO_PREFERENCES_KEY,
        JSON.stringify({ volume: 0.5, muted: false, extra: 'ignored' })
      );
      const prefs = loadAudioPreferences(storage);
      expect(prefs).toEqual({ volume: 0.5, muted: false });
    });
  });

  describe('saveAudioPreferences', () => {
    it('should persist preferences as JSON', () => {
      const prefs: AudioPreferences = { volume: 0.6, muted: true };
      saveAudioPreferences(storage, prefs);
      const loaded = loadAudioPreferences(storage);
      expect(loaded).toEqual(prefs);
    });

    it('should clamp volume to [0,1] before writing', () => {
      saveAudioPreferences(storage, { volume: 1.5, muted: false });
      const loaded = loadAudioPreferences(storage);
      expect(loaded.volume).toBe(1.0);
    });

    it('should clamp negative volume to 0 before writing', () => {
      saveAudioPreferences(storage, { volume: -0.5, muted: false });
      const loaded = loadAudioPreferences(storage);
      expect(loaded.volume).toBe(0);
    });

    it('should coerce muted to boolean before writing', () => {
      saveAudioPreferences(storage, { volume: 0.5, muted: true as any });
      const loaded = loadAudioPreferences(storage);
      expect(loaded.muted).toBe(true);
    });

    it('should round-trip valid preferences', () => {
      const original: AudioPreferences = { volume: 0.42, muted: true };
      saveAudioPreferences(storage, original);
      const loaded = loadAudioPreferences(storage);
      expect(loaded).toEqual(original);
    });

    it('should round-trip with zero volume', () => {
      const original: AudioPreferences = { volume: 0, muted: false };
      saveAudioPreferences(storage, original);
      const loaded = loadAudioPreferences(storage);
      expect(loaded).toEqual(original);
    });

    it('should round-trip with full volume', () => {
      const original: AudioPreferences = { volume: 1, muted: false };
      saveAudioPreferences(storage, original);
      const loaded = loadAudioPreferences(storage);
      expect(loaded).toEqual(original);
    });

    it('should write to the correct storage key', () => {
      const prefs: AudioPreferences = { volume: 0.5, muted: false };
      saveAudioPreferences(storage, prefs);
      const stored = storage.getItem(AUDIO_PREFERENCES_KEY);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed).toEqual(prefs);
    });
  });

  describe('round-trip with data corruption scenarios', () => {
    it('should save and load through a corrupt intermediate state', () => {
      const original: AudioPreferences = { volume: 0.75, muted: true };
      saveAudioPreferences(storage, original);

      // Corrupt the storage
      storage.setItem(AUDIO_PREFERENCES_KEY, 'corrupted!!!');

      // Load should return defaults, not throw
      const loaded = loadAudioPreferences(storage);
      expect(loaded).toEqual(DEFAULT_AUDIO_PREFERENCES);
    });

    it('should save new preferences after loading from corrupted state', () => {
      storage.setItem(AUDIO_PREFERENCES_KEY, 'bad data');
      const firstLoad = loadAudioPreferences(storage);
      expect(firstLoad).toEqual(DEFAULT_AUDIO_PREFERENCES);

      const newPrefs: AudioPreferences = { volume: 0.55, muted: true };
      saveAudioPreferences(storage, newPrefs);
      const secondLoad = loadAudioPreferences(storage);
      expect(secondLoad).toEqual(newPrefs);
    });
  });
});
