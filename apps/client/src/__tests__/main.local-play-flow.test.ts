import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type SetupResult = {
  participantCount: 2 | 3 | 4;
  seats: Array<{ kind: 'cpu'; difficulty: 'easy' | 'medium' | 'hard' } | { kind: 'human-gamepad' }>;
};

interface BootResult {
  uiInstance: {
    onLocalPlay: (() => void) | null;
    onLocalPlayAgain: (() => void) | null;
  };
  showLocalPlaySetupCalls: Array<{ initial: SetupResult | null }>;
  showCharacterSelectCalls: Array<{
    playerCount: number;
    onSelected: (choices: unknown[]) => void;
    autoConfirmSlots: number[];
  }>;
  localMatchCtorCalls: unknown[][];
  gamepadInputSourceCtorCalls: Array<{ poller: unknown; gamepadIndex: number }>;
  AIPlayerController: new (config: unknown) => unknown;
}

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

const bootMainWithMocks = async (setupResults: SetupResult[]): Promise<BootResult> => {
  vi.resetModules();

  const showLocalPlaySetupCalls: Array<{ initial: SetupResult | null }> = [];
  const showCharacterSelectCalls: Array<{
    playerCount: number;
    onSelected: (choices: unknown[]) => void;
    autoConfirmSlots: number[];
  }> = [];
  const localMatchCtorCalls: unknown[][] = [];
  const gamepadInputSourceCtorCalls: Array<{ poller: unknown; gamepadIndex: number }> = [];

  let uiInstance: BootResult['uiInstance'] | null = null;

  class MockAIPlayerController {
    readonly config: unknown;
    constructor(config: unknown) {
      this.config = config;
    }
    setTick(): void {}
    pollInput(): null {
      return null;
    }
    destroy(): void {}
  }

  class MockLocalPlayerController {
    readonly config: unknown;
    constructor(config: unknown) {
      this.config = config;
    }
    setTick(): void {}
    pollInput(): null {
      return null;
    }
    destroy(): void {}
  }

  vi.doMock('pixi.js', () => {
    class Application {
      stage = { addChild: () => {} };
      canvas = document.createElement('canvas');
      async init(): Promise<void> {}
    }
    return { Application };
  });

  vi.doMock('../renderer/layers.js', () => ({
    createLayers: () => ({
      background: { addChild: () => {} },
      game: { addChild: () => {}, removeChild: () => {} },
      ui: { addChild: () => {} },
    }),
  }));

  vi.doMock('../renderer/StageRenderer.js', () => ({ StageRenderer: class StageRenderer {} }));
  vi.doMock('../renderer/FighterRenderer.js', () => ({
    FighterRenderer: class FighterRenderer {
      update(): void {}
      destroy(): void {}
      startHitFlash(): void {}
    },
  }));
  vi.doMock('../renderer/Camera.js', () => ({
    Camera: class Camera {
      update(): void {}
      shake(): void {}
      reset(): void {}
    },
  }));
  vi.doMock('../renderer/effects/ImpactSpark.js', () => ({
    ImpactSpark: class ImpactSpark {
      container = {};
      done = false;
      start(): void {}
      tick(): void {}
      destroy(): void {}
    },
  }));

  vi.doMock('../network/GameClient.js', () => ({
    GameClient: class GameClient {
      isPaused = false;
      constructor(opts: { onConnected?: () => void }) {
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
    },
  }));

  vi.doMock('@smash/gamepad-input', () => ({
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

  vi.doMock('../input/ControllerAssignmentManager.js', () => ({
    ControllerAssignmentManager: class ControllerAssignmentManager {
      constructor() {}
      getAssignments(): ReadonlyMap<number, { gamepadIndex: number; gamepadId: string }> {
        return new Map([[1, { gamepadIndex: 0, gamepadId: 'Pad-1' }]]);
      }
    },
  }));

  vi.doMock('../input/GamepadInputSource.js', () => ({
    GamepadInputSource: class GamepadInputSource {
      constructor(poller: unknown, gamepadIndex: number) {
        gamepadInputSourceCtorCalls.push({ poller, gamepadIndex });
      }
    },
  }));

  vi.doMock('../local/AIPlayerController.js', () => ({ AIPlayerController: MockAIPlayerController }));
  vi.doMock('../local/LocalPlayerController.js', () => ({ LocalPlayerController: MockLocalPlayerController }));

  vi.doMock('../local/LocalMatch.js', () => ({
    LocalMatch: class LocalMatch {
      onSnapshot: ((snapshot: unknown) => void) | null = null;
      paused = false;
      constructor(controllers: unknown[]) {
        localMatchCtorCalls.push(controllers);
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

  vi.doMock('../ui/index.js', () => ({
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
      showLobby(): void {}
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
      getPhase(): 'lobby' {
        return 'lobby';
      }
      showControls(): void {}

      showLocalPlaySetup(
        _deps: unknown,
        initial: SetupResult | null,
        onConfirm: (result: SetupResult) => void,
      ): void {
        showLocalPlaySetupCalls.push({ initial });
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
      ): void {
        showCharacterSelectCalls.push({ playerCount, onSelected, autoConfirmSlots });
      }
    },
  }));

  document.body.innerHTML = '<div id="ui-overlay"></div>';

  await import('../main');
  await flush();

  if (uiInstance === null) {
    throw new Error('UIManager was not instantiated');
  }

  return {
    uiInstance,
    showLocalPlaySetupCalls,
    showCharacterSelectCalls,
    localMatchCtorCalls,
    gamepadInputSourceCtorCalls,
    AIPlayerController: MockAIPlayerController,
  };
};

describe('main local play flow wiring', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('routes local play setup to character select with cpu autoConfirmSlots and creates AI controller', async () => {
    const setup: SetupResult = {
      participantCount: 2,
      seats: [{ kind: 'cpu', difficulty: 'medium' }],
    };

    const runtime = await bootMainWithMocks([setup]);

    runtime.uiInstance.onLocalPlay?.();

    expect(runtime.showCharacterSelectCalls).toHaveLength(1);
    expect(runtime.showCharacterSelectCalls[0]?.playerCount).toBe(2);
    expect(runtime.showCharacterSelectCalls[0]?.autoConfirmSlots).toEqual([1]);
    expect(runtime.showCharacterSelectCalls[0]?.autoConfirmSlots).not.toContain(0);

    runtime.showCharacterSelectCalls[0]?.onSelected([]);

    expect(runtime.localMatchCtorCalls).toHaveLength(1);
    const controllers = runtime.localMatchCtorCalls[0] ?? [];
    expect(controllers).toHaveLength(2);

    const aiController = controllers[1] as { config: { difficulty: string; seed: number } };
    expect(aiController).toBeInstanceOf(runtime.AIPlayerController);
    expect(aiController.config.difficulty).toBe('medium');
    expect(aiController.config.seed).toBe(1001);
    expect(aiController.config).toMatchObject({ playerId: 'local-p2', slotIndex: 1 });
  });

  it('creates P2 human controller from slot 1 assignment and wires gamepad source', async () => {
    const setup: SetupResult = {
      participantCount: 2,
      seats: [{ kind: 'human-gamepad' }],
    };

    const runtime = await bootMainWithMocks([setup]);

    runtime.uiInstance.onLocalPlay?.();
    runtime.showCharacterSelectCalls[0]?.onSelected([]);

    const controllers = runtime.localMatchCtorCalls[0] ?? [];
    expect(controllers).toHaveLength(2);
    const p2Controller = controllers[1] as { config: { playerId: string; slotIndex: number; gamepadSource?: unknown } };
    expect(p2Controller.config).toMatchObject({ playerId: 'local-p2', slotIndex: 1 });
    expect(p2Controller.config.gamepadSource).toBeDefined();
    expect(runtime.gamepadInputSourceCtorCalls).toHaveLength(1);
    expect(runtime.gamepadInputSourceCtorCalls[0]?.gamepadIndex).toBe(0);
  });

  it('passes remembered lastLocalSetup as initial on local play again', async () => {
    const setup: SetupResult = {
      participantCount: 2,
      seats: [{ kind: 'cpu', difficulty: 'medium' }],
    };

    const runtime = await bootMainWithMocks([setup, setup]);

    runtime.uiInstance.onLocalPlay?.();
    runtime.uiInstance.onLocalPlayAgain?.();

    expect(runtime.showLocalPlaySetupCalls).toHaveLength(2);
    expect(runtime.showLocalPlaySetupCalls[0]?.initial).toBeNull();
    expect(runtime.showLocalPlaySetupCalls[1]?.initial).toEqual(setup);
  });
});
