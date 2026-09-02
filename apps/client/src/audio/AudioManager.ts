/**
 * @fileoverview HTML Audio-based music track manager.
 *
 * Plays looping background music tracks loaded from `/audio/<track>.mp3`.
 * Handles the browser autoplay policy by deferring playback to the first
 * user interaction when the initial `play()` call is blocked. Only one
 * track plays at a time; calling {@link AudioManager.playTrack} with the
 * currently-playing track name is a no-op.
 *
 * Supports mute state and volume control with persistence-friendly getter/setter
 * for preferences. When muted, effective playback volume is 0, but the stored
 * volume value is preserved (slider position maintained).
 */

/**
 * Audio preferences shape for initialization.
 */
export interface AudioPreferencesInit {
  /** Playback volume (0.0–1.0). */
  volume?: number;
  /** Whether audio is muted. */
  muted?: boolean;
}

export type MusicTrack = string;

/**
 * Manages a single looping HTML audio track with autoplay-policy retry.
 *
 * Call {@link playTrack} to start a track, {@link stopCurrentTrack} to stop it,
 * {@link setVolume} to adjust the level, and {@link setMuted} / {@link toggleMuted}
 * for mute control at any time.
 *
 * Effective playback volume = `muted ? 0 : volume`. The stored volume is never
 * affected by mute state, so unmuting restores the previous slider position.
 */
export class AudioManager {
  private currentTrack: HTMLAudioElement | null = null;
  private currentTrackName: string | null = null;
  private volume: number = 0.3;
  private muted: boolean = false;
  private pendingRetryCleanup: (() => void) | null = null;

  /**
   * @param initial - Optional initial preferences (volume, muted). Any missing
   *        or out-of-range fields use defaults (volume 0.3, muted false).
   */
  constructor(initial?: AudioPreferencesInit) {
    if (initial?.volume !== undefined) {
      this.volume = Math.max(0, Math.min(1, initial.volume));
    }
    if (initial?.muted !== undefined) {
      this.muted = Boolean(initial.muted);
    }
  }

  private clearPendingRetry(): void {
    this.pendingRetryCleanup?.();
    this.pendingRetryCleanup = null;
  }

  /**
   * Apply the effective volume to the currently playing track.
   * Effective volume = muted ? 0 : volume.
   * @internal
   */
  private applyEffectiveVolume(): void {
    if (this.currentTrack) {
      this.currentTrack.volume = this.muted ? 0 : this.volume;
    }
  }

  private setupUserInteractionRetry(track: string, audio: HTMLAudioElement): void {
    this.clearPendingRetry();

    const retryPlayback = (): void => {
      if (this.currentTrack !== audio || this.currentTrackName !== track) {
        this.clearPendingRetry();
        return;
      }

      console.log(`[AudioManager] Retrying after user interaction: ${track}`);
      void audio.play()
        .then(() => {
          console.log(`[AudioManager] Successfully playing after retry: ${track}`);
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : String(err);
          console.warn(`[AudioManager] Retry failed for ${track}:`, message);
        });

      this.clearPendingRetry();
    };

    const events: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "touchstart", "mousemove"];
    for (const eventName of events) {
      window.addEventListener(eventName, retryPlayback, { once: true, passive: true, capture: true });
    }

    this.pendingRetryCleanup = () => {
      for (const eventName of events) {
        window.removeEventListener(eventName, retryPlayback, true);
      }
    };

    console.log(`[AudioManager] Waiting for user interaction retry: ${track}`);
  }

  /**
   * Start playing a looping music track.
   *
   * If the track is already playing, this is a no-op. If browser autoplay
   * policy blocks the initial play, the manager waits for the next user
   * interaction and retries automatically.
   *
   * @param track - Track name without extension (e.g. `'stage1'` → `/audio/stage1.mp3`)
   */
  playTrack(track: string): void {
    if (this.currentTrackName === track && this.currentTrack && !this.currentTrack.paused) {
      return;
    }

    this.stopCurrentTrack();

    const audio = new Audio(`/audio/${track}.mp3`);
    audio.volume = this.muted ? 0 : this.volume;
    audio.loop = true;

    console.log(`[AudioManager] Attempting to play: ${track}`);
    const playPromise = audio.play();
    if (playPromise) {
      playPromise
        .then(() => {
          console.log(`[AudioManager] Successfully playing: ${track}`);
          this.clearPendingRetry();
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : String(err);
          console.warn(`[AudioManager] Failed to play ${track}:`, message);
          // Browser autoplay policy may block initial playback until user interaction.
          this.setupUserInteractionRetry(track, audio);
        });
    } else {
      console.log(`[AudioManager] play() returned undefined (jsdom environment), skipping promise chain`);
    }

    this.currentTrack = audio;
    this.currentTrackName = track;
  }

  /** Stop the current track and clear any pending autoplay-retry listener. */
  stopCurrentTrack(): void {
    this.clearPendingRetry();

    if (this.currentTrack) {
      this.currentTrack.pause();
      this.currentTrack.currentTime = 0;
      this.currentTrack = null;
      this.currentTrackName = null;
    }
  }

  /**
   * Set the playback volume, clamped to [0, 1].
   *
   * When muted, the stored volume is updated but effective playback stays at 0.
   * Unmuting restores the stored volume level.
   *
   * @param volume - Volume level between 0.0 (silent) and 1.0 (full)
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.applyEffectiveVolume();
  }

  /** Return the current stored volume level (0.0–1.0). */
  getVolume(): number {
    return this.volume;
  }

  /**
   * Set mute state.
   *
   * When muted, effective playback volume is 0 but the stored volume is preserved.
   * The next unmute restores the stored volume.
   *
   * @param muted - Whether to mute
   */
  setMuted(muted: boolean): void {
    this.muted = Boolean(muted);
    this.applyEffectiveVolume();
  }

  /** Return whether audio is currently muted. */
  isMuted(): boolean {
    return this.muted;
  }

  /** Toggle mute state on/off. */
  toggleMuted(): void {
    this.muted = !this.muted;
    this.applyEffectiveVolume();
  }

  /**
   * Get current preferences (for persistence).
   *
   * @returns Object with volume and muted state
   */
  getPreferences(): { volume: number; muted: boolean } {
    return { volume: this.volume, muted: this.muted };
  }
}
