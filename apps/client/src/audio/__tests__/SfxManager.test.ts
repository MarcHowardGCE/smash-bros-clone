import { describe, expect, it, vi } from "vitest";
import { getHitPlaybackRate, SfxManager } from "../SfxManager.js";

class FakeAudio {
  readonly src: string;
  volume = 1;
  playbackRate = 1;
  currentTime = 2;
  paused = true;
  ended = false;
  preload = "";
  readonly play = vi.fn((): Promise<void> => {
    this.paused = false;
    return Promise.resolve();
  });
  readonly pause = vi.fn(() => {
    this.paused = true;
  });
  private errorListener: (() => void) | null = null;

  constructor(src: string) {
    this.src = src;
  }

  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
  ): void {
    if (type === "error" && typeof listener === "function") {
      this.errorListener = listener as () => void;
    }
  }

  emitError(): void {
    this.errorListener?.();
  }
}

function setup(
  options: { volume?: number; muted?: boolean; poolSize?: number } = {},
) {
  const state = {
    volume: options.volume ?? 0.5,
    muted: options.muted ?? false,
  };
  const audioBySrc = new Map<string, FakeAudio[]>();
  const manager = new SfxManager(
    {
      getVolume: () => state.volume,
      isMuted: () => state.muted,
    },
    {
      poolSize: options.poolSize ?? 2,
      createAudio: (src) => {
        const audio = new FakeAudio(src);
        const existing = audioBySrc.get(src) ?? [];
        existing.push(audio);
        audioBySrc.set(src, existing);
        return audio as unknown as HTMLAudioElement;
      },
    },
  );

  return { manager, state, audioBySrc };
}

describe("SfxManager", () => {
  it("creates a reusable voice pool for every effect", () => {
    const { audioBySrc } = setup({ poolSize: 3 });

    expect(audioBySrc.get("/audio/sfx/hit-1.wav")).toHaveLength(2);
    expect(audioBySrc.get("/audio/sfx/hit-2.wav")).toHaveLength(1);
    expect(audioBySrc.get("/audio/sfx/ko.wav")).toHaveLength(3);
  });

  it("plays an effect with master volume and bounded options", () => {
    const { manager, audioBySrc } = setup({ volume: 0.4 });
    const audio = audioBySrc.get("/audio/sfx/jump.wav")![0]!;

    manager.play("jump", { gain: 0.5, playbackRate: 4 });

    expect(audio.currentTime).toBe(0);
    expect(audio.volume).toBe(0.2);
    expect(audio.playbackRate).toBe(2);
    expect(audio.play).toHaveBeenCalledOnce();
  });

  it("alternates hit variants while preserving overlapping playback", () => {
    const { manager, audioBySrc } = setup({ poolSize: 2 });
    const hit1 = audioBySrc.get("/audio/sfx/hit-1.wav")![0]!;
    const hit2 = audioBySrc.get("/audio/sfx/hit-2.wav")![0]!;

    manager.playHit(10);
    manager.playHit(20);

    expect(hit1.play).toHaveBeenCalledOnce();
    expect(hit2.play).toHaveBeenCalledOnce();
  });

  it("does not start effects while muted", () => {
    const { manager, audioBySrc } = setup({ muted: true });

    manager.play("shield");

    expect(
      audioBySrc.get("/audio/sfx/shield.wav")![0]!.play,
    ).not.toHaveBeenCalled();
  });

  it("updates active voice volume after preferences change", () => {
    const { manager, state, audioBySrc } = setup({ volume: 0.8 });
    const audio = audioBySrc.get("/audio/sfx/land.wav")![0]!;
    manager.play("land", { gain: 0.5 });

    state.volume = 0.2;
    manager.syncVolume();
    expect(audio.volume).toBeCloseTo(0.1);

    state.muted = true;
    manager.syncVolume();
    expect(audio.volume).toBe(0);
  });

  it("silently disables an asset after its load error", () => {
    const { manager, audioBySrc } = setup();
    const audio = audioBySrc.get("/audio/sfx/ko.wav")![0]!;
    audio.emitError();

    expect(() => manager.play("ko")).not.toThrow();
    expect(audio.play).not.toHaveBeenCalled();
  });

  it("swallows synchronous and asynchronous playback failures", async () => {
    const { manager, audioBySrc } = setup({ poolSize: 2 });
    const hit1 = audioBySrc.get("/audio/sfx/hit-1.wav")![0]!;
    const hit2 = audioBySrc.get("/audio/sfx/hit-2.wav")![0]!;
    hit1.play.mockImplementationOnce(() =>
      Promise.reject(new Error("blocked")),
    );
    hit2.play.mockImplementationOnce(() => {
      throw new Error("unsupported");
    });

    expect(() => manager.play("hit")).not.toThrow();
    await Promise.resolve();
    expect(() => manager.play("hit")).not.toThrow();
  });

  it("stops and rewinds every voice", () => {
    const { manager, audioBySrc } = setup();
    manager.play("jump");

    manager.stopAll();

    for (const voices of audioBySrc.values()) {
      for (const audio of voices) {
        expect(audio.pause).toHaveBeenCalledOnce();
        expect(audio.currentTime).toBe(0);
      }
    }
  });
});

describe("getHitPlaybackRate", () => {
  it("scales finite knockback into the configured pitch range", () => {
    expect(getHitPlaybackRate(-10)).toBe(0.9);
    expect(getHitPlaybackRate(20)).toBeCloseTo(1.05);
    expect(getHitPlaybackRate(100)).toBeCloseTo(1.2);
    expect(getHitPlaybackRate(Number.NaN)).toBe(0.9);
  });
});
