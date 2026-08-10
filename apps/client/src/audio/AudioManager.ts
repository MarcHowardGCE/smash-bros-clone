/**
 * @fileoverview HTML Audio-based music track manager.
 *
 * Plays looping background music tracks loaded from `/audio/<track>.mp3`.
 * Handles the browser autoplay policy by deferring playback to the first
 * user interaction when the initial `play()` call is blocked. Only one
 * track plays at a time; calling {@link AudioManager.playTrack} with the
 * currently-playing track name is a no-op.
 */
export type MusicTrack = string;

/**
 * Manages a single looping HTML audio track with autoplay-policy retry.
 *
 * Call {@link playTrack} to start a track, {@link stopCurrentTrack} to stop it,
 * and {@link setVolume} to adjust the level at any time.
 */
export class AudioManager {
  private currentTrack: HTMLAudioElement | null = null;
  private currentTrackName: string | null = null;
  private volume: number = 0.3;
  private pendingRetryCleanup: (() => void) | null = null;

  private clearPendingRetry(): void {
    this.pendingRetryCleanup?.();
    this.pendingRetryCleanup = null;
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
    audio.volume = this.volume;
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
   * @param volume - Volume level between 0.0 (silent) and 1.0 (full)
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.currentTrack) {
      this.currentTrack.volume = this.volume;
    }
  }

  /** Return the current volume level (0.0–1.0). */
  getVolume(): number {
    return this.volume;
  }
}
