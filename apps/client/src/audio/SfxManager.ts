import type { AudioManager } from "./AudioManager.js";

export const SFX_IDS = ["hit", "jump", "land", "shield", "ko"] as const;

export type SfxId = (typeof SFX_IDS)[number];

const SFX_VARIANTS: Record<SfxId, readonly string[]> = {
  hit: ["hit-1", "hit-2"],
  jump: ["jump"],
  land: ["land"],
  shield: ["shield"],
  ko: ["ko"],
};

export interface SfxPlaybackOptions {
  gain?: number;
  playbackRate?: number;
}

interface SfxManagerOptions {
  basePath?: string;
  poolSize?: number;
  createAudio?: (src: string) => HTMLAudioElement;
}

interface SfxVoice {
  audio: HTMLAudioElement;
  gain: number;
}

const DEFAULT_POOL_SIZE = 4;
const MIN_PLAYBACK_RATE = 0.5;
const MAX_PLAYBACK_RATE = 2;
const MAX_HIT_KNOCKBACK = 40;

function clampFinite(
  value: number,
  min: number,
  max: number,
  fallback: number,
): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, value));
}

export function getHitPlaybackRate(knockbackMagnitude: number): number {
  const magnitude = clampFinite(knockbackMagnitude, 0, MAX_HIT_KNOCKBACK, 0);
  return 0.9 + (magnitude / MAX_HIT_KNOCKBACK) * 0.3;
}

/** Plays short, overlapping sound effects while sharing music mute and volume settings. */
export class SfxManager {
  private readonly pools = new Map<SfxId, SfxVoice[]>();
  private readonly nextVoiceIndex = new Map<SfxId, number>();
  private readonly disabled = new Set<SfxId>();
  private readonly audioManager: Pick<AudioManager, "getVolume" | "isMuted">;

  constructor(
    audioManager: Pick<AudioManager, "getVolume" | "isMuted">,
    options: SfxManagerOptions = {},
  ) {
    this.audioManager = audioManager;
    const basePath = (options.basePath ?? "/audio/sfx").replace(/\/+$/, "");
    const poolSize = Math.max(
      1,
      Math.floor(options.poolSize ?? DEFAULT_POOL_SIZE),
    );
    const createAudio =
      options.createAudio ?? ((src: string) => new Audio(src));

    for (const id of SFX_IDS) {
      const voices: SfxVoice[] = [];
      const variants = SFX_VARIANTS[id];
      for (let index = 0; index < poolSize; index += 1) {
        try {
          const variant = variants[index % variants.length]!;
          const audio = createAudio(`${basePath}/${variant}.wav`);
          audio.preload = "auto";
          audio.addEventListener("error", () => this.disabled.add(id), {
            once: true,
          });
          voices.push({ audio, gain: 1 });
        } catch {
          this.disabled.add(id);
          break;
        }
      }
      this.pools.set(id, voices);
      this.nextVoiceIndex.set(id, 0);
    }
  }

  play(id: SfxId, options: SfxPlaybackOptions = {}): void {
    if (this.audioManager.isMuted() || this.disabled.has(id)) {
      return;
    }

    const voices = this.pools.get(id);
    if (!voices || voices.length === 0) {
      return;
    }

    const startIndex = (this.nextVoiceIndex.get(id) ?? 0) % voices.length;
    let voiceIndex = startIndex;
    for (let offset = 0; offset < voices.length; offset += 1) {
      const candidateIndex = (startIndex + offset) % voices.length;
      const candidate = voices[candidateIndex]!;
      if (candidate.audio.paused || candidate.audio.ended) {
        voiceIndex = candidateIndex;
        break;
      }
    }
    const voice = voices[voiceIndex]!;
    this.nextVoiceIndex.set(id, (voiceIndex + 1) % voices.length);

    voice.gain = clampFinite(options.gain ?? 1, 0, 1, 1);

    try {
      voice.audio.currentTime = 0;
      voice.audio.playbackRate = clampFinite(
        options.playbackRate ?? 1,
        MIN_PLAYBACK_RATE,
        MAX_PLAYBACK_RATE,
        1,
      );
      voice.audio.volume = this.getEffectiveVolume(voice.gain);
      const playback = voice.audio.play();
      if (playback) {
        void playback.catch(() => {});
      }
    } catch {
      // Missing or unsupported assets must never interrupt gameplay.
    }
  }

  playHit(knockbackMagnitude: number): void {
    this.play("hit", { playbackRate: getHitPlaybackRate(knockbackMagnitude) });
  }

  /** Apply current master settings to effects that are already playing. */
  syncVolume(): void {
    for (const voices of this.pools.values()) {
      for (const voice of voices) {
        try {
          voice.audio.volume = this.getEffectiveVolume(voice.gain);
        } catch {
          // Ignore detached or unsupported audio elements.
        }
      }
    }
  }

  stopAll(): void {
    for (const voices of this.pools.values()) {
      for (const { audio } of voices) {
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch {
          // Ignore detached or unsupported audio elements.
        }
      }
    }
  }

  private getEffectiveVolume(gain: number): number {
    if (this.audioManager.isMuted()) {
      return 0;
    }
    const masterVolume = clampFinite(this.audioManager.getVolume(), 0, 1, 0.3);
    return masterVolume * gain;
  }
}
