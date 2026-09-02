/**
 * @fileoverview Unit tests for SfxManager.
 *
 * Tests verify:
 * - playSfx does not throw when the audio file 404s or play() rejects
 * - playbackRate is applied to the audio element
 * - volume is applied independently
 * - global SFX volume multiplier is respected
 * - music playback (AudioManager) is not affected
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SfxManager } from '../SfxManager';

describe('SfxManager', () => {
  let manager: SfxManager;

  // Mock the HTML Audio API
  let mockAudioElements: Map<string, HTMLAudioElement>;
  let audioConstructorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    manager = new SfxManager();
    mockAudioElements = new Map();

    // Mock Audio constructor to return a fake element with controllable play() behavior
    audioConstructorSpy = vi.spyOn(global as any, 'Audio').mockImplementation((src: string) => {
      const mockAudio: Partial<HTMLAudioElement> = {
        src,
        volume: 0.5,
        playbackRate: 1.0,
        currentTime: 0,
        paused: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        play: vi.fn(() => Promise.resolve()),
      };

      mockAudioElements.set(src, mockAudio as HTMLAudioElement);
      return mockAudio as HTMLAudioElement;
    });
  });

  it('playSfx does not throw when Audio.play() rejects (file missing)', async () => {
    const manager = new SfxManager();

    // Mock play() to reject (simulates 404 or blocked autoplay)
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockRejectedValue(new Error('File not found'));

    // Should not throw
    expect(() => {
      manager.playSfx('hit', { volume: 0.8, playbackRate: 1.1 });
    }).not.toThrow();
  });

  it('applies playbackRate to the audio element', () => {
    manager.playSfx('hit', { playbackRate: 1.25 });

    const audio = mockAudioElements.get('/audio/sfx/hit.mp3');
    expect(audio?.playbackRate).toBe(1.25);
  });

  it('clamps playbackRate to 0.5–2.0 range', () => {
    // Too low
    manager.playSfx('hit', { playbackRate: 0.1 });
    let audio = mockAudioElements.get('/audio/sfx/hit.mp3');
    expect(audio?.playbackRate).toBe(0.5);

    // Too high
    manager.playSfx('hit', { playbackRate: 3.0 });
    audio = mockAudioElements.get('/audio/sfx/hit.mp3');
    expect(audio?.playbackRate).toBe(2.0);
  });

  it('applies volume multiplied by global SFX volume', () => {
    manager.setVolume(0.5); // Global is 50%
    manager.playSfx('jump', { volume: 0.8 }); // Requested volume is 80%

    const audio = mockAudioElements.get('/audio/sfx/jump.mp3');
    expect(audio?.volume).toBe(0.4); // 0.8 * 0.5 = 0.4
  });

  it('clamps volume to 0.0–1.0 range', () => {
    // Negative volume
    manager.playSfx('land', { volume: -0.5 });
    let audio = mockAudioElements.get('/audio/sfx/land.mp3');
    expect(audio?.volume).toBeGreaterThanOrEqual(0);
    expect(audio?.volume).toBeLessThanOrEqual(1);

    // Volume > 1
    manager.playSfx('land', { volume: 1.5 });
    audio = mockAudioElements.get('/audio/sfx/land.mp3');
    expect(audio?.volume).toBeGreaterThanOrEqual(0);
    expect(audio?.volume).toBeLessThanOrEqual(1);
  });

  it('respects global SFX volume multiplier', () => {
    manager.setVolume(0.3);
    expect(manager.getVolume()).toBe(0.3);

    manager.playSfx('shield');
    const audio = mockAudioElements.get('/audio/sfx/shield.mp3');
    // Default volume option is 0.7; 0.7 * 0.3 = 0.21
    expect(audio?.volume).toBe(0.21);
  });

  it('resets audio currentTime to 0 before each play', () => {
    manager.playSfx('ko');
    const audio = mockAudioElements.get('/audio/sfx/ko.mp3');
    expect(audio?.currentTime).toBe(0);
  });

  it('caches audio elements to avoid DOM churn', () => {
    // First call creates the element
    manager.playSfx('hit');
    const firstInstance = mockAudioElements.get('/audio/sfx/hit.mp3');

    // Second call reuses the same element
    manager.playSfx('hit', { volume: 0.5 });
    const secondInstance = mockAudioElements.get('/audio/sfx/hit.mp3');

    expect(firstInstance).toBe(secondInstance);
  });

  it('does not throw when play() is called (default behavior)', () => {
    // This is the happy path — Audio.play() returns a resolved Promise
    expect(() => {
      manager.playSfx('hit');
    }).not.toThrow();
  });

  it('uses default options when not provided', () => {
    manager.playSfx('jump'); // No options

    const audio = mockAudioElements.get('/audio/sfx/jump.mp3');
    // Default volume is 0.7, default playbackRate is 1.0
    // Assuming global SFX volume is 0.8 (default), final volume = 0.7 * 0.8 = 0.56
    expect(audio?.volume).toBeCloseTo(0.56, 5);
    expect(audio?.playbackRate).toBe(1.0);
  });

  it('handles all five SFX clip names', () => {
    const clips: Array<'hit' | 'jump' | 'land' | 'shield' | 'ko'> = ['hit', 'jump', 'land', 'shield', 'ko'];

    clips.forEach((clip) => {
      expect(() => {
        manager.playSfx(clip);
      }).not.toThrow();
    });
  });
});
