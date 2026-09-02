import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type PlayerId = string;

interface BootResult {
  gameClientInstance: {
    selectCharacter: (
      characterId: string,
      callback?: (result: { ok: true } | { error: string }) => void,
    ) => void;
    confirmCharacter: (
      callback?: (
        result: { ok: true; allConfirmed: boolean } | { error: string },
      ) => void,
    ) => void;
  };
  uiManagerInstance: {
    showNetworkCharacterSelect: (
      fighters: unknown[],
      myPlayerId: PlayerId,
      playerIds: PlayerId[],
      onSelect: (characterId: string) => void,
      onConfirm: () => void,
    ) => void;
    updateNetworkCharacterSelect: (
      playerId: PlayerId,
      characterId: string,
      confirmed: boolean,
    ) => void;
    showNetworkCharacterSelectConfirmError: (message: string) => void;
    showLobby: () => void;
  };
  gameClientOptions: {
    onConnected?: () => void;
    onPlayerAssigned?: (playerId: PlayerId, roomCode: string) => void;
    onRenderState?: (state: unknown, localPlayerId: PlayerId) => void;
    onMatchPhaseChange?: (phase: string, winnerId?: PlayerId | null) => void;
    onRoomCreated?: (roomCode: string, playerId: PlayerId) => void;
    onPlayerJoined?: (slotIndex: number) => void;
    onHitEvents?: (hitEvents: unknown[]) => void;
    onPaused?: () => void;
    onResumed?: () => void;
    onCharacterSelectStart?: (playerIds: PlayerId[]) => void;
    onCharacterUpdated?: (data: {
      playerId: PlayerId;
      characterId: string;
      confirmed: boolean;
    }) => void;
    onPlayerLeft?: (playerId: PlayerId) => void;
  };
  uiManagerCalls: {
    showNetworkCharacterSelect: Array<{
      fighters: unknown[];
      myPlayerId: PlayerId;
      playerIds: PlayerId[];
      onSelect: (characterId: string) => void;
      onConfirm: () => void;
    }>;
    updateNetworkCharacterSelect: Array<{
      playerId: PlayerId;
      characterId: string;
      confirmed: boolean;
    }>;
    showNetworkCharacterSelectConfirmError: Array<{ message: string }>;
    showLobby: number;
  };
  gameClientCalls: {
    selectCharacter: Array<{ characterId: string }>;
    confirmCharacter: number;
  };
}

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

const bootMainWithMocks = async (): Promise<BootResult> => {
  vi.resetModules();

  const uiManagerCalls = {
    showNetworkCharacterSelect: [] as Array<{
      fighters: unknown[];
      myPlayerId: PlayerId;
      playerIds: PlayerId[];
      onSelect: (characterId: string) => void;
      onConfirm: () => void;
    }>,
    updateNetworkCharacterSelect: [] as Array<{
      playerId: PlayerId;
      characterId: string;
      confirmed: boolean;
    }>,
    showNetworkCharacterSelectConfirmError: [] as Array<{ message: string }>,
    showLobby: 0,
  };

  const gameClientCalls = {
    selectCharacter: [] as Array<{ characterId: string }>,
    confirmCharacter: 0,
  };

  let gameClientOptions: BootResult["gameClientOptions"] = {};
  let gameClientInstance: BootResult["gameClientInstance"] | null = null;
  let uiManagerInstance: BootResult["uiManagerInstance"] | null = null;

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
      constructor(opts: BootResult["gameClientOptions"]) {
        gameClientOptions = opts;
        gameClientInstance = this;
        opts.onConnected?.();
      }
      createRoom(): void {}
      joinRoom(): void {}
      markReady(): void {}
      disconnect(): void {}
      emitResume(): void {}
      emitPause(): void {}
      getLatestSnapshot(): null {
        return null;
      }
      debugSendInput(): void {}
      selectCharacter(
        characterId: string,
        callback?: (result: { ok: true } | { error: string }) => void,
      ): void {
        gameClientCalls.selectCharacter.push({ characterId });
      }
      confirmCharacter(
        callback?: (
          result: { ok: true; allConfirmed: boolean } | { error: string },
        ) => void,
      ): void {
        gameClientCalls.confirmCharacter++;
      }
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
        return new Map();
      }
    },
  }));

  vi.doMock("../input/GamepadInputSource.js", () => ({
    GamepadInputSource: class GamepadInputSource {
      constructor(poller: unknown, gamepadIndex: number) {}
    },
  }));

  vi.doMock("../local/AIPlayerController.js", () => ({
    AIPlayerController: class AIPlayerController {
      constructor(config: unknown) {}
      setTick(): void {}
      pollInput(): null {
        return null;
      }
      destroy(): void {}
    },
  }));
  vi.doMock("../local/LocalPlayerController.js", () => ({
    LocalPlayerController: class LocalPlayerController {
      constructor(config: unknown) {}
      setTick(): void {}
      pollInput(): null {
        return null;
      }
      destroy(): void {}
    },
  }));

  vi.doMock("../local/LocalMatch.js", () => ({
    LocalMatch: class LocalMatch {
      onSnapshot: ((snapshot: unknown) => void) | null = null;
      paused = false;
      constructor(controllers: unknown[], characterIds?: unknown) {}
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
        uiManagerInstance = this;
      }

      setRoomCode(): void {}
      setPlayerId(): void {}
      setAudioManager(): void {}
      showLobby(): void {
        uiManagerCalls.showLobby++;
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
      showSplash(): void {}
      getPhase(): "lobby" {
        return "lobby";
      }
      showControls(): void {}
      showLocalPlaySetup(): void {}
      showCharacterSelect(): void {}
      showStageSelect(): void {}

      showNetworkCharacterSelect(
        fighters: unknown[],
        myPlayerId: PlayerId,
        playerIds: PlayerId[],
        onSelect: (characterId: string) => void,
        onConfirm: () => void,
      ): void {
        uiManagerCalls.showNetworkCharacterSelect.push({
          fighters,
          myPlayerId,
          playerIds,
          onSelect,
          onConfirm,
        });
      }

      updateNetworkCharacterSelect(
        playerId: PlayerId,
        characterId: string,
        confirmed: boolean,
      ): void {
        uiManagerCalls.updateNetworkCharacterSelect.push({
          playerId,
          characterId,
          confirmed,
        });
      }

      showNetworkCharacterSelectConfirmError(message: string): void {
        uiManagerCalls.showNetworkCharacterSelectConfirmError.push({ message });
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

  document.body.innerHTML = '<div id="ui-overlay"></div>';

  await import("../main");
  await flush();

  if (gameClientInstance === null) {
    throw new Error("GameClient was not instantiated");
  }
  if (uiManagerInstance === null) {
    throw new Error("UIManager was not instantiated");
  }

  return {
    gameClientInstance,
    uiManagerInstance,
    gameClientOptions,
    uiManagerCalls,
    gameClientCalls,
  };
};

describe("main network character-select flow wiring", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("onCharacterSelectStart triggers uiManager.showNetworkCharacterSelect with correct wiring", async () => {
    const runtime = await bootMainWithMocks();

    // First, simulate player assignment to set myPlayerId
    runtime.gameClientOptions.onPlayerAssigned?.(
      "player-1" as PlayerId,
      "ROOM01",
    );

    const playerIds: PlayerId[] = ["player-1", "player-2"];
    runtime.gameClientOptions.onCharacterSelectStart?.(playerIds);

    expect(runtime.uiManagerCalls.showNetworkCharacterSelect).toHaveLength(1);
    const call = runtime.uiManagerCalls.showNetworkCharacterSelect[0];
    expect(call?.myPlayerId).toBe("player-1");
    expect(call?.playerIds).toEqual(playerIds);
    expect(call?.fighters).toHaveLength(2);
    expect(typeof call?.onSelect).toBe("function");
    expect(typeof call?.onConfirm).toBe("function");
  });

  it("onCharacterUpdated triggers uiManager.updateNetworkCharacterSelect", async () => {
    const runtime = await bootMainWithMocks();

    const data = {
      playerId: "player-2" as PlayerId,
      characterId: "abe-lincoln",
      confirmed: false,
    };
    runtime.gameClientOptions.onCharacterUpdated?.(data);

    expect(runtime.uiManagerCalls.updateNetworkCharacterSelect).toHaveLength(1);
    expect(runtime.uiManagerCalls.updateNetworkCharacterSelect[0]).toEqual(
      data,
    );
  });

  it("fighter selection callback calls gameClient.selectCharacter", async () => {
    const runtime = await bootMainWithMocks();

    // First, simulate player assignment to set myPlayerId
    runtime.gameClientOptions.onPlayerAssigned?.(
      "player-1" as PlayerId,
      "ROOM01",
    );

    const playerIds: PlayerId[] = ["player-1", "player-2"];
    runtime.gameClientOptions.onCharacterSelectStart?.(playerIds);

    const call = runtime.uiManagerCalls.showNetworkCharacterSelect[0];
    call?.onSelect("abe-lincoln");

    expect(runtime.gameClientCalls.selectCharacter).toHaveLength(1);
    expect(runtime.gameClientCalls.selectCharacter[0]?.characterId).toBe(
      "abe-lincoln",
    );
  });

  it("confirmCharacter error result triggers uiManager.showNetworkCharacterSelectConfirmError", async () => {
    const runtime = await bootMainWithMocks();

    // First, simulate player assignment to set myPlayerId
    runtime.gameClientOptions.onPlayerAssigned?.(
      "player-1" as PlayerId,
      "ROOM01",
    );

    const playerIds: PlayerId[] = ["player-1", "player-2"];
    runtime.gameClientOptions.onCharacterSelectStart?.(playerIds);

    const call = runtime.uiManagerCalls.showNetworkCharacterSelect[0];

    // Mock confirmCharacter to immediately invoke callback with error
    vi.spyOn(runtime.gameClientInstance, "confirmCharacter").mockImplementation(
      (callback) => {
        callback?.({ error: "You must select a character first" });
      },
    );

    call?.onConfirm();

    expect(
      runtime.uiManagerCalls.showNetworkCharacterSelectConfirmError,
    ).toHaveLength(1);
    expect(
      runtime.uiManagerCalls.showNetworkCharacterSelectConfirmError[0]?.message,
    ).toBe("You must select a character first");
  });

  it("onPlayerLeft during pre-match phase calls uiManager.showLobby", async () => {
    const runtime = await bootMainWithMocks();

    // networkMatchPhase defaults to 'pre-match'
    runtime.gameClientOptions.onPlayerLeft?.("player-2" as PlayerId);

    expect(runtime.uiManagerCalls.showLobby).toBe(1);
  });

  it("onPlayerLeft during match phase does NOT call uiManager.showLobby (regression guard)", async () => {
    const runtime = await bootMainWithMocks();

    // Transition to 'match' phase
    runtime.gameClientOptions.onMatchPhaseChange?.("match");

    // Now disconnect during match
    runtime.gameClientOptions.onPlayerLeft?.("player-2" as PlayerId);

    expect(runtime.uiManagerCalls.showLobby).toBe(0);
  });

  it("onPlayerLeft during countdown phase calls uiManager.showLobby", async () => {
    const runtime = await bootMainWithMocks();

    // Transition to 'countdown' phase
    runtime.gameClientOptions.onMatchPhaseChange?.("countdown");

    // Disconnect during countdown
    runtime.gameClientOptions.onPlayerLeft?.("player-2" as PlayerId);

    expect(runtime.uiManagerCalls.showLobby).toBe(1);
  });

  it("onPlayerLeft during result phase does NOT call uiManager.showLobby", async () => {
    const runtime = await bootMainWithMocks();

    // Transition to 'result' phase
    runtime.gameClientOptions.onMatchPhaseChange?.(
      "result",
      "player-1" as PlayerId,
    );

    // Disconnect during result
    runtime.gameClientOptions.onPlayerLeft?.("player-2" as PlayerId);

    expect(runtime.uiManagerCalls.showLobby).toBe(0);
  });
});
