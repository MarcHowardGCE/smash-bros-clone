import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('pixi.js', () => import('./fixtures/mainPixi.js'));

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('main renderer bootstrap', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('passes sprite mode and provider from preload into FighterRenderer constructor', async () => {
    vi.resetModules();

    const textureProvider = {
      getTexture: vi.fn(),
    };
    const fighterRendererCtorCalls: unknown[][] = [];

    vi.doMock('../renderer/fullbody/FullBodyPilot.js',()=>({preloadFullBodyPilot:async()=>null}));
    vi.doMock('../renderer/fullbody/KOPresentation.js',()=>({KOPresentation:class{tick(){}destroy(){}clear(){}spawn(){}update(){}hasSpecialKO(){return false;}getDiagnostics(){return [];}}}));

    vi.doMock('../renderer/layers.js', () => ({
      createLayers: () => ({
        background: { addChild: () => {}, removeChildren: () => {} },
        game: { addChild: () => {}, removeChild: () => {} },
        ui: { addChild: () => {} },
      }),
    }));

    vi.doMock('../renderer/StageRenderer.js', () => ({
      StageRenderer: class StageRenderer {
        ready = Promise.resolve();
      },
      waitForStageAsset: (pending: Promise<unknown>) => pending,
    }));

    vi.doMock('../renderer/fighterAssets.js', () => ({
      preloadFighterAssets: async () => ({
        mode: 'sprite' as const,
        provider: textureProvider,
      }),
    }));

    vi.doMock('../renderer/FighterRenderer.js', () => ({
      FighterRenderer: class FighterRenderer {
        constructor(...args: unknown[]) {
          fighterRendererCtorCalls.push(args);
        }
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
        constructor(opts: {
          onConnected?: () => void;
          onRenderState?: (
            state: {
              players: Map<
                string,
                {
                  slotIndex: number;
                  characterId: 'all-rounder';
                  x: number;
                  y: number;
                  facing: 1;
                  isInvincible: false;
                  isKnockedOut: false;
                  isShielding: false;
                  shieldHealth: number;
                  state: 'IDLE';
                  stateFrame: 0;
                  currentMoveId: null;
                }
              >;
              matchPhase: 'match';
              winnerId: null;
            },
            localPlayerId: string,
          ) => void;
        }) {
          opts.onConnected?.();
          opts.onRenderState?.(
            {
              players: new Map([
                [
                  'p1',
                  {
                    slotIndex: 0,
                    characterId: 'all-rounder',
                    x: 10,
                    y: 20,
                    facing: 1,
                    isInvincible: false,
                    isKnockedOut: false,
                    isShielding: false,
                    shieldHealth: 100,
                    state: 'IDLE',
                    stateFrame: 0,
                    currentMoveId: null,
                  },
                ],
              ]),
              matchPhase: 'match',
              winnerId: null,
            },
            'p1',
          );
        }
        createRoom(): void {}
        joinRoom(): void {}
        markReady(): void {}
        leaveRoom(): void {}
      disconnect(): void {}
        connect(): void {}
        emitResume(): void {}
        emitPause(): void {}
        getLatestSnapshot(): null {
          return null;
        }
        debugSendInput(): void {}
      },
    }));

    vi.doMock('@smash/gamepad-input', async () => ({
      ...await vi.importActual<typeof import('@smash/gamepad-input')>('@smash/gamepad-input'),
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
          return new Map();
        }
      },
    }));

    vi.doMock('../input/GamepadInputSource.js', () => ({
      GamepadInputSource: class GamepadInputSource {
        constructor(_poller: unknown, _gamepadIndex: number) {}
      },
    }));

    vi.doMock('../local/AIPlayerController.js', () => ({
      AIPlayerController: class AIPlayerController {
        constructor(_config: unknown) {}
        setTick(): void {}
        pollInput(): null {
          return null;
        }
        destroy(): void {}
      },
    }));

    vi.doMock('../local/LocalPlayerController.js', () => ({
      LocalPlayerController: class LocalPlayerController {
        constructor(_config: unknown) {}
        setTick(): void {}
        pollInput(): null {
          return null;
        }
        destroy(): void {}
      },
    }));

    vi.doMock('../local/LocalMatch.js', () => ({
      LocalMatch: class LocalMatch {
        onSnapshot: ((snapshot: unknown) => void) | null = null;
        paused = false;
        constructor(_controllers: unknown[], _characterIds?: unknown) {}
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

        constructor(_overlay: HTMLElement) {}

        setRoomCode(): void {}
        setPlayerId(): void {}
        setAudioManager(): void {}
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
        showSplash(onContinue?: () => void): void {
          onContinue?.();
        }
        getPhase(): 'lobby' {
          return 'lobby';
        }
        showControls(): void {}
        showLocalPlaySetup(): void {}
        showCharacterSelect(): void {}
        showStageSelect(): void {}
        showNetworkCharacterSelect(): void {}
        updateNetworkCharacterSelect(): void {}
        showNetworkCharacterSelectConfirmError(): void {}
      },
    }));

    vi.doMock('../audio/AudioManager.js', () => ({
      AudioManager: class AudioManager {
        constructor(_init?: { volume?: number; muted?: boolean }) {}
        playTrack(): void {}
        getPreferences(): { volume: number; muted: boolean } {
          return { volume: 0.3, muted: false };
        }
      },
    }));

    vi.doMock('../audio/SfxManager.js', () => ({
      SfxManager: class SfxManager {
        play(): void {}
        playHit(): void {}
        syncVolume(): void {}
        stopAll(): void {}
      },
    }));

    vi.doMock('../audio/audioPreferences.js', () => ({
      loadAudioPreferences: () => ({ volume: 0.3, muted: false }),
      saveAudioPreferences: () => {},
    }));

    document.body.innerHTML = '<div id="ui-overlay"></div>';

    await import('../main');
    await flush();

    await vi.waitFor(()=>expect(fighterRendererCtorCalls).toHaveLength(1));
    const constructorArgs = fighterRendererCtorCalls[0];
    expect(constructorArgs).toBeDefined();
    expect(constructorArgs).toHaveLength(4);
    const options = constructorArgs?.[3] as { mode: 'sprite'; textureProvider: typeof textureProvider };
    expect(options).toMatchObject({ mode: 'sprite', textureProvider });
  });
});
