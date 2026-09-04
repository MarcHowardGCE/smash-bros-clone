import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type SetupResult = {
  participantCount: 2 | 3 | 4;
  seats: Array<
    | { kind: "cpu"; difficulty: "easy" | "medium" | "hard" }
    | { kind: "human-gamepad" }
  >;
};

interface BootResult {
  uiInstance: {
    onLocalPlay: (() => void) | null;
    onLocalPlayAgain: (() => void) | null;
    onMainMenu: (() => void) | null;
  };
  triggerLocalPlaySetupBack: () => void;
  showLocalPlaySetupCalls: Array<{ initial: SetupResult | null }>;
  getShowLobbyCalls: () => number;
  showCharacterSelectCalls: Array<{
    playerCount: number;
    onSelected: (choices: unknown[]) => void;
    autoConfirmSlots: number[];
    gamepadSlotByIndex?: ReadonlyMap<number, number>;
  }>;
  localMatchCtorCalls: Array<{
    controllers: unknown[];
    characterIds?: unknown;
  }>;
  gamepadInputSourceCtorCalls: Array<{ poller: unknown; gamepadIndex: number }>;
  getGameClientConnectCalls: () => number;
  getGameClientDisconnectCalls: () => number;
  getShowSplashCalls: () => number;
  AIPlayerController: new (config: { playerId: string }) => unknown;
}

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

const bootMainWithMocks = async (
  setupResults: SetupResult[],
): Promise<BootResult> => {
  vi.resetModules();

  const showLocalPlaySetupCalls: Array<{ initial: SetupResult | null }> = [];
  let showLobbyCalls = 0;
  const showCharacterSelectCalls: Array<{
    playerCount: number;
    onSelected: (choices: unknown[]) => void;
    autoConfirmSlots: number[];
    gamepadSlotByIndex?: ReadonlyMap<number, number>;
  }> = [];
  const localMatchCtorCalls: Array<{
    controllers: unknown[];
    characterIds?: unknown;
  }> = [];
  const gamepadInputSourceCtorCalls: Array<{
    poller: unknown;
    gamepadIndex: number;
  }> = [];
  let gameClientConnectCalls = 0;
  let gameClientDisconnectCalls = 0;
  let showSplashCalls = 0;
  let gameClientOnConnected: (() => void) | undefined;
  let localPlaySetupBack: (() => void) | null = null;

  let uiInstance: BootResult["uiInstance"] | null = null;

  class MockAIPlayerController {
    readonly config: unknown;
    readonly playerId: string;
    constructor(config: { playerId: string }) {
      this.config = config;
      this.playerId = config.playerId;
    }
    setTick(): void {}
    pollInput(): null {
      return null;
    }
    destroy(): void {}
  }

  class MockLocalPlayerController {
    readonly config: unknown;
    readonly playerId: string;
    constructor(config: { playerId: string }) {
      this.config = config;
      this.playerId = config.playerId;
    }
    setTick(): void {}
    pollInput(): null {
      return null;
    }
    destroy(): void {}
  }

  vi.doMock("pixi.js", () => {
    class Application {
      stage = { addChild: () => {} };
      canvas = document.createElement("canvas");
      async init(): Promise<void> {}
    }
    return { Application };
  });

  vi.doMock("../renderer/layers.js", () => ({
    createLayers: () => ({
      background: { addChild: () => {}, removeChildren: () => {} },
      game: { addChild: () => {}, removeChild: () => {} },
      ui: { addChild: () => {} },
    }),
  }));

  vi.doMock("../renderer/StageRenderer.js", () => ({
    StageRenderer: class StageRenderer {},
  }));
  vi.doMock("../renderer/FighterRenderer.js", () => ({
    FighterRenderer: class FighterRenderer {
      update(): void {}
      destroy(): void {}
      startHitFlash(): void {}
    },
  }));
  vi.doMock("../renderer/Camera.js", () => ({
    Camera: class Camera {
      update(): void {}
      shake(): void {}
      reset(): void {}
    },
  }));
  vi.doMock("../renderer/effects/ImpactSpark.js", () => ({
    ImpactSpark: class ImpactSpark {
      container = {};
      done = false;
      start(): void {}
      tick(): void {}
      destroy(): void {}
    },
  }));

  vi.doMock("../network/GameClient.js", () => ({
    GameClient: class GameClient {
      isPaused = false;
      constructor(opts: { onConnected?: () => void }) {
        gameClientOnConnected = opts.onConnected;
        opts.onConnected?.();
      }
      createRoom(): void {}
      joinRoom(): void {}
      markReady(): void {}
      disconnect(): void {
        gameClientDisconnectCalls += 1;
      }
      connect(): void {
        gameClientConnectCalls += 1;
        gameClientOnConnected?.();
      }
      emitResume(): void {}
      emitPause(): void {}
      getLatestSnapshot(): null {
        return null;
      }
      debugSendInput(): void {}
    },
  }));

  vi.doMock("@smash/gamepad-input", () => ({
    GamepadPoller: class GamepadPoller {
      onConnect: ((gamepad: Gamepad) => void) | null = null;
      onDisconnect: ((index: number) => void) | null = null;
      start(): void {}
      poll(): Map<number, { bits: number }> {
        return new Map();
      }
    },
    GamepadPreferenceStore: class GamepadPreferenceStore {
      constructor(_storage: Storage) {}
      load(): never[] {
        return [];
      }
      findSlotForGamepadId(): null {
        return null;
      }
      save(): void {}
    },
  }));

  vi.doMock("../input/ControllerAssignmentManager.js", () => ({
    ControllerAssignmentManager: class ControllerAssignmentManager {
      constructor() {}
      getAssignments(): ReadonlyMap<
        number,
        { gamepadIndex: number; gamepadId: string }
      > {
        return new Map([[1, { gamepadIndex: 0, gamepadId: "Pad-1" }]]);
      }
    },
  }));

  vi.doMock("../input/GamepadInputSource.js", () => ({
    GamepadInputSource: class GamepadInputSource {
      constructor(poller: unknown, gamepadIndex: number) {
        gamepadInputSourceCtorCalls.push({ poller, gamepadIndex });
      }
    },
  }));

  vi.doMock("../local/AIPlayerController.js", () => ({
    AIPlayerController: MockAIPlayerController,
  }));
  vi.doMock("../local/LocalPlayerController.js", () => ({
    LocalPlayerController: MockLocalPlayerController,
  }));

  vi.doMock("../local/LocalMatch.js", () => ({
    LocalMatch: class LocalMatch {
      onSnapshot: ((snapshot: unknown) => void) | null = null;
      paused = false;
      constructor(controllers: unknown[], characterIds?: unknown) {
        localMatchCtorCalls.push({ controllers, characterIds });
      }
      cleanup(): void {}
      start(): void {}
      getLatestSnapshot(): null {
        return null;
      }
      forcePosition(): boolean {
        return false;
      }
      getKOEvents(): never[] {
        return [];
      }
      pause(): void {
        this.paused = true;
      }
      resume(): void {
        this.paused = false;
      }
    },
  }));

  vi.doMock("../audio/AudioManager.js", () => ({
    AudioManager: class AudioManager {
      constructor(_init?: { volume?: number; muted?: boolean }) {}
      playTrack(): void {}
      getPreferences(): { volume: number; muted: boolean } {
        return { volume: 0.3, muted: false };
      }
    },
  }));

  vi.doMock("../audio/SfxManager.js", () => ({
    SfxManager: class SfxManager {
      play(): void {}
      playHit(): void {}
      syncVolume(): void {}
      stopAll(): void {}
    },
  }));

  vi.doMock("../audio/audioPreferences.js", () => ({
    loadAudioPreferences: () => ({ volume: 0.3, muted: false }),
    saveAudioPreferences: () => {},
  }));

  vi.doMock("../ui/index.js", () => ({
    injectStyles: () => {},
    UIManager: class UIManager {
      onCreateRoom: (() => void) | null = null;
      onJoinRoom: ((code: string) => void) | null = null;
      onReady: (() => void) | null = null;
      onPlayAgain: (() => void) | null = null;
      onLocalPlay: (() => void) | null = null;
      onLocalPlayAgain: (() => void) | null = null;
      onOpenControls: (() => void) | null = null;
      onResume: (() => void) | null = null;
      onMainMenu: (() => void) | null = null;

      constructor(_overlay: HTMLElement) {
        uiInstance = this;
      }

      setRoomCode(): void {}
      setPlayerId(): void {}
      setAudioManager(): void {}
      showLobby(): void {
        showLobbyCalls += 1;
      }
      showRoomCreated(): void {}
      showPlayerJoined(): void {}
      showResult(): void {}
      showPauseOverlay(): void {}
      hidePauseOverlay(): void {}
      hideRoomCode(): void {}
      showCountdown(): void {}
      showMatch(): void {}
      showLocalResult(): void {}
      updateHUD(): void {}
      showSplash(onContinue?: () => void): void {
        showSplashCalls += 1;
        onContinue?.();
      }
      getPhase(): "lobby" {
        return "lobby";
      }
      showControls(): void {}

      showLocalPlaySetup(
        _deps: unknown,
        initial: SetupResult | null,
        onConfirm: (result: SetupResult) => void,
        onBack?: () => void,
      ): void {
        showLocalPlaySetupCalls.push({ initial });
        localPlaySetupBack = onBack ?? null;
        const next = setupResults.shift();
        if (next) {
          onConfirm(next);
        }
      }

      showCharacterSelect(
        _fighters: unknown[],
        playerCount: number,
        onSelected: (choices: unknown[]) => void,
        autoConfirmSlots: number[] = [],
        _onBack?: () => void,
        gamepadSlotByIndex?: ReadonlyMap<number, number>,
      ): void {
        showCharacterSelectCalls.push({
          playerCount,
          onSelected,
          autoConfirmSlots,
          gamepadSlotByIndex,
        });
      }

      showStageSelect(
        stages: Array<{ id?: string }>,
        onSelected: (stage: { id?: string }) => void,
      ): void {
        onSelected(stages[0] ?? { id: "default" });
      }
    },
  }));

  document.body.innerHTML = '<div id="ui-overlay"></div>';

  await import("../main");
  await flush();

  if (uiInstance === null) {
    throw new Error("UIManager was not instantiated");
  }

  return {
    uiInstance,
    triggerLocalPlaySetupBack: () => {
      if (!localPlaySetupBack) {
        throw new Error("Local play setup back callback was not captured");
      }
      localPlaySetupBack();
    },
    showLocalPlaySetupCalls,
    getShowLobbyCalls: () => showLobbyCalls,
    showCharacterSelectCalls,
    localMatchCtorCalls,
    gamepadInputSourceCtorCalls,
    getGameClientConnectCalls: () => gameClientConnectCalls,
    getGameClientDisconnectCalls: () => gameClientDisconnectCalls,
    getShowSplashCalls: () => showSplashCalls,
    AIPlayerController: MockAIPlayerController,
  };
};

describe("main local play flow wiring", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("routes local play setup to character select with cpu autoConfirmSlots and creates AI controller", async () => {
    const setup: SetupResult = {
      participantCount: 2,
      seats: [{ kind: "cpu", difficulty: "medium" }],
    };

    const runtime = await bootMainWithMocks([setup]);

    runtime.uiInstance.onLocalPlay?.();

    expect(runtime.showCharacterSelectCalls).toHaveLength(1);
    expect(runtime.showCharacterSelectCalls[0]?.playerCount).toBe(2);
    expect(runtime.showCharacterSelectCalls[0]?.autoConfirmSlots).toEqual([1]);
    expect(runtime.showCharacterSelectCalls[0]?.autoConfirmSlots).not.toContain(
      0,
    );
    expect(
      runtime.showCharacterSelectCalls[0]?.gamepadSlotByIndex?.get(0),
    ).toBe(1);

    runtime.showCharacterSelectCalls[0]?.onSelected([]);

    expect(runtime.localMatchCtorCalls).toHaveLength(1);
    const controllers = runtime.localMatchCtorCalls[0]?.controllers ?? [];
    expect(controllers).toHaveLength(2);

    const aiController = controllers[1] as {
      config: { difficulty: string; seed: number };
    };
    expect(aiController).toBeInstanceOf(runtime.AIPlayerController);
    expect(aiController.config.difficulty).toBe("medium");
    expect(aiController.config.seed).toBe(1001);
    expect(aiController.config).toMatchObject({
      playerId: "local-p2",
      slotIndex: 1,
    });
  });

  it("creates P2 human controller from slot 1 assignment and wires gamepad source", async () => {
    const setup: SetupResult = {
      participantCount: 2,
      seats: [{ kind: "human-gamepad" }],
    };

    const runtime = await bootMainWithMocks([setup]);

    runtime.uiInstance.onLocalPlay?.();
    runtime.showCharacterSelectCalls[0]?.onSelected([]);

    const controllers = runtime.localMatchCtorCalls[0]?.controllers ?? [];
    expect(controllers).toHaveLength(2);
    const p2Controller = controllers[1] as {
      config: { playerId: string; slotIndex: number; gamepadSource?: unknown };
    };
    expect(p2Controller.config).toMatchObject({
      playerId: "local-p2",
      slotIndex: 1,
    });
    expect(p2Controller.config.gamepadSource).toBeDefined();
    expect(runtime.gamepadInputSourceCtorCalls).toHaveLength(1);
    expect(runtime.gamepadInputSourceCtorCalls[0]?.gamepadIndex).toBe(0);
  });

  it("passes remembered lastLocalSetup as initial on local play again", async () => {
    const setup: SetupResult = {
      participantCount: 2,
      seats: [{ kind: "cpu", difficulty: "medium" }],
    };

    const runtime = await bootMainWithMocks([setup, setup]);

    runtime.uiInstance.onLocalPlay?.();
    runtime.uiInstance.onLocalPlayAgain?.();

    expect(runtime.showLocalPlaySetupCalls).toHaveLength(2);
    expect(runtime.showLocalPlaySetupCalls[0]?.initial).toBeNull();
    expect(runtime.showLocalPlaySetupCalls[1]?.initial).toEqual(setup);
  });

  it("reconnects network client when backing out of local play setup to lobby", async () => {
    const setup: SetupResult = {
      participantCount: 2,
      seats: [{ kind: "cpu", difficulty: "medium" }],
    };

    const runtime = await bootMainWithMocks([setup]);

    runtime.uiInstance.onLocalPlay?.();
    expect(runtime.getGameClientDisconnectCalls()).toBe(1);
    expect(runtime.getGameClientConnectCalls()).toBe(0);

    runtime.triggerLocalPlaySetupBack();

    expect(runtime.getGameClientConnectCalls()).toBe(1);
    expect(runtime.getShowLobbyCalls()).toBeGreaterThan(0);
  });

  it("reconnects network client when returning to main menu from local mode", async () => {
    const setup: SetupResult = {
      participantCount: 2,
      seats: [{ kind: "cpu", difficulty: "medium" }],
    };

    const runtime = await bootMainWithMocks([setup]);

    runtime.uiInstance.onLocalPlay?.();
    expect(runtime.getGameClientDisconnectCalls()).toBe(1);
    expect(runtime.getGameClientConnectCalls()).toBe(0);

    runtime.uiInstance.onMainMenu?.();

    expect(runtime.getGameClientDisconnectCalls()).toBe(1);
    expect(runtime.getGameClientConnectCalls()).toBe(1);
    expect(runtime.getShowLobbyCalls()).toBeGreaterThan(0);
  });

  it("does not re-show splash when returning to main menu after a local match reconnect", async () => {
    const setup: SetupResult = {
      participantCount: 2,
      seats: [{ kind: "cpu", difficulty: "medium" }],
    };

    const runtime = await bootMainWithMocks([setup]);

    // Initial connect shows splash once.
    expect(runtime.getShowSplashCalls()).toBe(1);

    // Enter local mode (disconnect), then return to main menu (reconnect).
    runtime.uiInstance.onLocalPlay?.();
    runtime.uiInstance.onMainMenu?.();

    // Reconnect should go straight to lobby without splash replay.
    expect(runtime.getGameClientConnectCalls()).toBe(1);
    expect(runtime.getShowSplashCalls()).toBe(1);
    expect(runtime.getShowLobbyCalls()).toBeGreaterThan(0);
  });

  it("passes characterIds to LocalMatch when character is selected", async () => {
    const setup: SetupResult = {
      participantCount: 2,
      seats: [{ kind: "cpu", difficulty: "medium" }],
    };

    const runtime = await bootMainWithMocks([setup]);

    runtime.uiInstance.onLocalPlay?.();
    runtime.showCharacterSelectCalls[0]?.onSelected([
      { id: "abe-lincoln", displayName: "Abe Lincoln" },
      { id: "all-rounder", displayName: "All-Rounder" },
    ]);

    expect(runtime.localMatchCtorCalls).toHaveLength(1);
    const call = runtime.localMatchCtorCalls[0];
    expect(call?.characterIds).toBeDefined();
    expect(call?.characterIds).toEqual({
      "local-p1": "abe-lincoln",
      "local-p2": "all-rounder",
    });
  });

  it("passes characterIds with only defined choices", async () => {
    const setup: SetupResult = {
      participantCount: 2,
      seats: [{ kind: "cpu", difficulty: "easy" }],
    };

    const runtime = await bootMainWithMocks([setup]);

    runtime.uiInstance.onLocalPlay?.();
    runtime.showCharacterSelectCalls[0]?.onSelected([
      { id: "abe-lincoln", displayName: "Abe Lincoln" },
    ]);

    expect(runtime.localMatchCtorCalls).toHaveLength(1);
    const call = runtime.localMatchCtorCalls[0];
    expect(call?.characterIds).toEqual({
      "local-p1": "abe-lincoln",
    });
  });

  it("in 4-player setup, each CPU has opponentPlayerIds containing all 3 OTHER player IDs", async () => {
    const setup: SetupResult = {
      participantCount: 4,
      seats: [
        { kind: "cpu", difficulty: "medium" },
        { kind: "cpu", difficulty: "hard" },
        { kind: "cpu", difficulty: "easy" },
      ],
    };

    const runtime = await bootMainWithMocks([setup]);

    runtime.uiInstance.onLocalPlay?.();
    runtime.showCharacterSelectCalls[0]?.onSelected([]);

    expect(runtime.localMatchCtorCalls).toHaveLength(1);
    const controllers = runtime.localMatchCtorCalls[0]?.controllers ?? [];
    expect(controllers).toHaveLength(4);

    // CPU at slot 1 (local-p2) should have opponentPlayerIds: ['local-p1', 'local-p3', 'local-p4']
    const cpu1 = controllers[1] as {
      config: { playerId: string; opponentPlayerIds: string[] };
    };
    expect(cpu1).toBeInstanceOf(runtime.AIPlayerController);
    expect(cpu1.config.playerId).toBe("local-p2");
    expect(cpu1.config.opponentPlayerIds).toEqual([
      "local-p1",
      "local-p3",
      "local-p4",
    ]);

    // CPU at slot 2 (local-p3) should have opponentPlayerIds: ['local-p1', 'local-p2', 'local-p4']
    const cpu2 = controllers[2] as {
      config: { playerId: string; opponentPlayerIds: string[] };
    };
    expect(cpu2).toBeInstanceOf(runtime.AIPlayerController);
    expect(cpu2.config.playerId).toBe("local-p3");
    expect(cpu2.config.opponentPlayerIds).toEqual([
      "local-p1",
      "local-p2",
      "local-p4",
    ]);

    // CPU at slot 3 (local-p4) should have opponentPlayerIds: ['local-p1', 'local-p2', 'local-p3']
    const cpu3 = controllers[3] as {
      config: { playerId: string; opponentPlayerIds: string[] };
    };
    expect(cpu3).toBeInstanceOf(runtime.AIPlayerController);
    expect(cpu3.config.playerId).toBe("local-p4");
    expect(cpu3.config.opponentPlayerIds).toEqual([
      "local-p1",
      "local-p2",
      "local-p3",
    ]);
  });

  it('in 2-player setup, single CPU still has opponentPlayerIds: ["local-p1"]', async () => {
    const setup: SetupResult = {
      participantCount: 2,
      seats: [{ kind: "cpu", difficulty: "medium" }],
    };

    const runtime = await bootMainWithMocks([setup]);

    runtime.uiInstance.onLocalPlay?.();
    runtime.showCharacterSelectCalls[0]?.onSelected([]);

    expect(runtime.localMatchCtorCalls).toHaveLength(1);
    const controllers = runtime.localMatchCtorCalls[0]?.controllers ?? [];
    expect(controllers).toHaveLength(2);

    const cpu = controllers[1] as {
      config: { playerId: string; opponentPlayerIds: string[] };
    };
    expect(cpu).toBeInstanceOf(runtime.AIPlayerController);
    expect(cpu.config.playerId).toBe("local-p2");
    expect(cpu.config.opponentPlayerIds).toEqual(["local-p1"]);
  });
});
