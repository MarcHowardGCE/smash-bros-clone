export type MusicTrack = 'main-menu' | 'gameplay' | 'game-over';

export class AudioManager {
  private currentTrack: HTMLAudioElement | null = null;
  private currentTrackName: MusicTrack | null = null;
  private volume: number = 0.3;
  private pendingRetryCleanup: (() => void) | null = null;

  private clearPendingRetry(): void {
    this.pendingRetryCleanup?.();
    this.pendingRetryCleanup = null;
  }

  private setupUserInteractionRetry(track: MusicTrack, audio: HTMLAudioElement): void {
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

  playTrack(track: MusicTrack): void {
    if (this.currentTrackName === track && this.currentTrack && !this.currentTrack.paused) {
      return;
    }

    this.stopCurrentTrack();

    const audio = new Audio(`/audio/${track}.mp3`);
    audio.volume = this.volume;
    audio.loop = true;

    console.log(`[AudioManager] Attempting to play: ${track}`);
    void audio.play()
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

    this.currentTrack = audio;
    this.currentTrackName = track;
  }

  stopCurrentTrack(): void {
    this.clearPendingRetry();

    if (this.currentTrack) {
      this.currentTrack.pause();
      this.currentTrack.currentTime = 0;
      this.currentTrack = null;
      this.currentTrackName = null;
    }
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.currentTrack) {
      this.currentTrack.volume = this.volume;
    }
  }

  getVolume(): number {
    return this.volume;
  }
}
