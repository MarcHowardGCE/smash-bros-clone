export type MusicTrack = 'main-menu' | 'gameplay' | 'game-over';

export class AudioManager {
  private currentTrack: HTMLAudioElement | null = null;
  private currentTrackName: MusicTrack | null = null;
  private volume: number = 0.3;

  playTrack(track: MusicTrack): void {
    if (this.currentTrackName === track && this.currentTrack && !this.currentTrack.paused) {
      return;
    }

    this.stopCurrentTrack();

    const audio = new Audio(`/audio/${track}.mp3`);
    audio.volume = this.volume;
    audio.loop = true;
    audio.play().catch(() => {
      // Browser autoplay policy may block initial playback until user interaction
    });

    this.currentTrack = audio;
    this.currentTrackName = track;
  }

  stopCurrentTrack(): void {
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
