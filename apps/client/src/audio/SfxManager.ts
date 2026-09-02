/**
 * @fileoverview SfxManager — minimal sound-effects playback via HTML Audio API.
 *
 * Provides fire-and-forget SFX playback with dynamic pitch/volume control.
 * Gracefully swallows missing assets (404 → silence, never throws). Intentionally
 * separate from AudioManager (music) so both can coexist without interference.
 */

/**
 * SFX clip name union — the canonical list of available sound effects.
 */
export type SfxName = 'hit' | 'jump' | 'land' | 'shield' | 'ko';

/**
 * Options for playSfx().
 */
export interface SfxPlayOptions {
  /**
   * Playback rate (speed/pitch): 0.5–2.0. Default: 1.0.
   * Values < 1.0 lower the pitch, > 1.0 raise it.
   */
  playbackRate?: number;

  /**
   * Volume multiplier: 0.0–1.0. Applied on top of global SFX volume.
   * Final volume = volume * globalSfxVolume. Default: 0.7.
   */
  volume?: number;
}

/**
 * Manages sound-effects playback for game events (hits, jumps, KOs, etc).
 *
 * Design:
 * - One HTML Audio element per clip (cached to avoid repeated DOM churn).
 * - Fire-and-forget: playSfx() returns immediately; missing assets fail silently.
 * - Separate from AudioManager (music): SFX volume is independent of music volume.
 * - No external library dependencies: raw HTML Audio API.
 *
 * Limitations:
 * - No parallel playback of same clip (new play resets old one).
 * - No pitch-shift beyond playbackRate (browser implementation dependent).
 * - Load errors are swallowed; missing files produce silence.
 */
export class SfxManager {
  /** Global SFX volume multiplier (0.0–1.0). Applied to all playSfx() calls. */
  private globalSfxVolume: number = 0.8;

  /** Cache of HTML Audio elements, keyed by SFX name. */
  private audioCache: Map<SfxName, HTMLAudioElement> = new Map();

  /**
   * Play a named SFX clip with optional pitch/volume adjustments.
   *
   * @param sfxName - Clip name ('hit', 'jump', 'land', 'shield', 'ko')
   * @param options - Playback options (volume, playbackRate)
   *
   * If the clip file is missing (404) or fails to load, play() rejection is swallowed
   * and the call returns silently (no thrown error). Volume and playbackRate are always
   * applied before attempting play.
   */
  playSfx(sfxName: SfxName, options: SfxPlayOptions = {}): void {
    const { volume = 0.7, playbackRate = 1.0 } = options;

    // Get or create audio element for this clip
    if (!this.audioCache.has(sfxName)) {
      const audio = new Audio(`/audio/sfx/${sfxName}.mp3`);

      // Reset to start when clip ends naturally
      audio.addEventListener('ended', () => {
        audio.currentTime = 0;
      });

      this.audioCache.set(sfxName, audio);
    }

    const audio = this.audioCache.get(sfxName)!;

    // Apply independent SFX volume (does not affect music)
    audio.volume = Math.max(0, Math.min(1, volume * this.globalSfxVolume));

    // Clamp playback rate to safe range
    audio.playbackRate = Math.max(0.5, Math.min(2.0, playbackRate));

    // Reset to start and play. Swallow any rejection (file missing, play blocked, etc)
    audio.currentTime = 0;
    void audio
      .play()
      .catch((err: unknown) => {
        // Silently fail if:
        // - File not found (404)
        // - Browser autoplay policy blocks it
        // - Any other playback error
        // Console is intentionally empty — missing SFX is not an error condition.
      });
  }

  /**
   * Set the global SFX volume multiplier (0.0–1.0).
   *
   * This is applied to all SFX clips via their `volume` parameter.
   * Does not affect music playback (AudioManager).
   *
   * @param volume - Global SFX volume (0.0 = silent, 1.0 = full)
   */
  setVolume(volume: number): void {
    this.globalSfxVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Get the current global SFX volume multiplier.
   *
   * @returns Global SFX volume (0.0–1.0)
   */
  getVolume(): number {
    return this.globalSfxVolume;
  }
}

/**
 * Singleton instance of SfxManager for global access.
 */
export const sfxManager = new SfxManager();
