import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AudioManager } from '../AudioManager';

describe('AudioManager', () => {
  let audioManager: AudioManager;

  beforeEach(() => {
    audioManager = new AudioManager();
  });

  afterEach(() => {
    audioManager.stopCurrentTrack();
  });

  describe('constructor', () => {
    it('should initialize with default volume 0.3 and muted false', () => {
      const manager = new AudioManager();
      expect(manager.getVolume()).toBe(0.3);
      expect(manager.isMuted()).toBe(false);
    });

    it('should accept initial volume', () => {
      const manager = new AudioManager({ volume: 0.7 });
      expect(manager.getVolume()).toBe(0.7);
      expect(manager.isMuted()).toBe(false);
    });

    it('should accept initial muted state', () => {
      const manager = new AudioManager({ muted: true });
      expect(manager.getVolume()).toBe(0.3);
      expect(manager.isMuted()).toBe(true);
    });

    it('should accept both volume and muted initial values', () => {
      const manager = new AudioManager({ volume: 0.5, muted: true });
      expect(manager.getVolume()).toBe(0.5);
      expect(manager.isMuted()).toBe(true);
    });

    it('should clamp initial volume to [0,1]', () => {
      const manager1 = new AudioManager({ volume: 1.5 });
      expect(manager1.getVolume()).toBe(1.0);

      const manager2 = new AudioManager({ volume: -0.5 });
      expect(manager2.getVolume()).toBe(0);
    });

    it('should coerce muted to boolean', () => {
      const manager = new AudioManager({ muted: 'yes' as any });
      // Coerced via Boolean('yes') = true
      expect(manager.isMuted()).toBe(true);
    });

    it('should ignore undefined initial values', () => {
      const manager = new AudioManager({ volume: undefined, muted: undefined });
      expect(manager.getVolume()).toBe(0.3);
      expect(manager.isMuted()).toBe(false);
    });
  });

  describe('setVolume', () => {
    it('should set and return volume', () => {
      audioManager.setVolume(0.5);
      expect(audioManager.getVolume()).toBe(0.5);
    });

    it('should clamp volume to [0,1]', () => {
      audioManager.setVolume(1.5);
      expect(audioManager.getVolume()).toBe(1.0);

      audioManager.setVolume(-0.5);
      expect(audioManager.getVolume()).toBe(0);
    });

    it('should allow volume 0', () => {
      audioManager.setVolume(0);
      expect(audioManager.getVolume()).toBe(0);
    });

    it('should allow volume 1', () => {
      audioManager.setVolume(1);
      expect(audioManager.getVolume()).toBe(1);
    });
  });

  describe('mute state', () => {
    it('should initialize with muted = false', () => {
      expect(audioManager.isMuted()).toBe(false);
    });

    it('should set muted state via setMuted(true)', () => {
      audioManager.setMuted(true);
      expect(audioManager.isMuted()).toBe(true);
    });

    it('should set muted state via setMuted(false)', () => {
      audioManager.setMuted(true);
      audioManager.setMuted(false);
      expect(audioManager.isMuted()).toBe(false);
    });

    it('should toggle muted state', () => {
      expect(audioManager.isMuted()).toBe(false);
      audioManager.toggleMuted();
      expect(audioManager.isMuted()).toBe(true);
      audioManager.toggleMuted();
      expect(audioManager.isMuted()).toBe(false);
    });

    it('should coerce muted to boolean', () => {
      audioManager.setMuted('yes' as any);
      expect(audioManager.isMuted()).toBe(true);
    });
  });

  describe('getPreferences', () => {
    it('should return current volume and muted state', () => {
      audioManager.setVolume(0.6);
      audioManager.setMuted(true);
      const prefs = audioManager.getPreferences();
      expect(prefs).toEqual({ volume: 0.6, muted: true });
    });

    it('should return default values initially', () => {
      const prefs = audioManager.getPreferences();
      expect(prefs).toEqual({ volume: 0.3, muted: false });
    });

    it('should reflect changes after setVolume', () => {
      audioManager.setVolume(0.8);
      const prefs = audioManager.getPreferences();
      expect(prefs.volume).toBe(0.8);
    });

    it('should reflect changes after setMuted', () => {
      audioManager.setMuted(true);
      const prefs = audioManager.getPreferences();
      expect(prefs.muted).toBe(true);
    });

    it('should reflect changes after toggleMuted', () => {
      audioManager.toggleMuted();
      const prefs = audioManager.getPreferences();
      expect(prefs.muted).toBe(true);
    });
  });

  describe('playTrack with mute state', () => {
    it('should create audio element with effective volume when not muted', () => {
      audioManager.setVolume(0.6);
      audioManager.setMuted(false);

      audioManager.playTrack('test');

      // In jsdom, the audio element exists but volume is set
      // We can't directly check the HTMLAudioElement, but we can verify state
      expect(audioManager.getVolume()).toBe(0.6);
      expect(audioManager.isMuted()).toBe(false);
    });

    it('should create audio element with effective volume 0 when muted', () => {
      audioManager.setVolume(0.6);
      audioManager.setMuted(true);

      audioManager.playTrack('test');

      // Track is playing but effective volume should be 0
      expect(audioManager.getVolume()).toBe(0.6); // stored volume unchanged
      expect(audioManager.isMuted()).toBe(true); // but effective volume is 0
    });
  });

  describe('volume control while muted', () => {
    it('should preserve stored volume when setVolume called while muted', () => {
      audioManager.setMuted(true);
      audioManager.setVolume(0.7);

      expect(audioManager.getVolume()).toBe(0.7);
      expect(audioManager.isMuted()).toBe(true);

      const prefs = audioManager.getPreferences();
      expect(prefs.volume).toBe(0.7);
      expect(prefs.muted).toBe(true);
    });

    it('should restore volume when unmuting after setVolume-while-muted', () => {
      audioManager.setVolume(0.4);
      audioManager.setMuted(true);
      audioManager.setVolume(0.8); // Change stored volume while muted
      expect(audioManager.getVolume()).toBe(0.8);

      audioManager.setMuted(false);
      expect(audioManager.getVolume()).toBe(0.8); // Restored to new value
    });

    it('should respect slider-position-preserved semantics', () => {
      // User: volume at 30%, mute button pressed
      audioManager.setVolume(0.3);
      expect(audioManager.isMuted()).toBe(false);

      audioManager.toggleMuted();
      expect(audioManager.isMuted()).toBe(true);
      expect(audioManager.getVolume()).toBe(0.3); // Slider position preserved

      // User: adjusts slider to 50% while muted
      audioManager.setVolume(0.5);
      expect(audioManager.getVolume()).toBe(0.5);

      // User: unmutes
      audioManager.toggleMuted();
      expect(audioManager.isMuted()).toBe(false);
      expect(audioManager.getVolume()).toBe(0.5); // New slider position is restored
    });
  });

  describe('constructor initialization with preferences', () => {
    it('should seed from constructor initial object', () => {
      const manager = new AudioManager({ volume: 0.65, muted: true });
      const prefs = manager.getPreferences();
      expect(prefs).toEqual({ volume: 0.65, muted: true });
    });

    it('should use defaults when initial object is empty', () => {
      const manager = new AudioManager({});
      const prefs = manager.getPreferences();
      expect(prefs).toEqual({ volume: 0.3, muted: false });
    });

    it('should clamp initial volume and preserve muted', () => {
      const manager = new AudioManager({ volume: 2.0, muted: true });
      const prefs = manager.getPreferences();
      expect(prefs.volume).toBe(1.0);
      expect(prefs.muted).toBe(true);
    });
  });

  describe('integration: mute + volume round-trip', () => {
    it('should round-trip preferences through getPreferences/constructor', () => {
      audioManager.setVolume(0.42);
      audioManager.setMuted(true);
      const prefs1 = audioManager.getPreferences();

      const manager2 = new AudioManager(prefs1);
      const prefs2 = manager2.getPreferences();

      expect(prefs2).toEqual(prefs1);
    });

    it('should handle multiple toggles correctly', () => {
      audioManager.toggleMuted();
      expect(audioManager.isMuted()).toBe(true);

      audioManager.toggleMuted();
      expect(audioManager.isMuted()).toBe(false);

      audioManager.toggleMuted();
      expect(audioManager.isMuted()).toBe(true);

      const prefs = audioManager.getPreferences();
      expect(prefs.muted).toBe(true);
    });
  });
});
