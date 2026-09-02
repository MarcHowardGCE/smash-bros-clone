/** @fileoverview Main entry point for the Smash Bros clone client application. */

import type {
  CharacterId,
  HitEventData,
  KOEventData,
  PlayerId,
  StateSnapshot,
} from "@smash/shared";
import { STAGE } from "@smash/shared";
import { STAGES, type StageConfig } from "./stages/stageConfig.js";
import { GamepadPoller, GamepadPreferenceStore } from "@smash/gamepad-input";
import { Application } from "pixi.js";
import {
  DEFAULT_KEYMAP_P1,
  DEFAULT_KEYMAP_P2,
  DEFAULT_KEYMAP_P3,
  DEFAULT_KEYMAP_P4,
} from "./input/keymaps.js";
import { ControllerAssignmentManager } from "./input/ControllerAssignmentManager.js";
import { GamepadInputSource } from "./input/GamepadInputSource.js";
import { AIPlayerController } from "./local/AIPlayerController.js";
import { LocalMatch } from "./local/LocalMatch.js";
import { LocalPlayerController } from "./local/LocalPlayerController.js";
import type {
  FighterChoice,
  ITickController,
  SeatConfig,
} from "./local/types.js";
import { GameClient } from "./network/GameClient.js";
import type {
  RenderPlayerState,
  RenderState,
} from "./network/InterpolationBuffer.js";
import { Camera } from "./renderer/Camera.js";
import { FighterRenderer } from "./renderer/FighterRenderer.js";
import { createLayers } from "./renderer/layers.js";
import { StageRenderer } from "./renderer/StageRenderer.js";
import { ImpactSpark } from "./renderer/effects/ImpactSpark.js";
import { injectStyles, UIManager } from "./ui/index.js";
import { AudioManager } from "./audio/AudioManager.js";
import {
  loadAudioPreferences,
  saveAudioPreferences,
} from "./audio/audioPreferences.js";
import { GameplaySfxRouter } from "./audio/GameplaySfxRouter.js";
import { SfxManager } from "./audio/SfxManager.js";

// In production on Render, use the same domain. In dev, use localhost.
const getDefaultServerUrl = () => {
  if (import.meta.env.DEV) {
    return "http://localhost:3001";
  }
  // Production: use same domain with secure protocol
  const protocol = window.location.protocol === "https:" ? "https:" : "http:";
  return `${protocol}//${window.location.host}`;
};

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? getDefaultServerUrl();
export const AVAILABLE_FIGHTERS: FighterChoice[] = [
  { id: "all-rounder", displayName: "All-Rounder" },
  { id: "abe-lincoln", displayName: "Abe Lincoln" },
];

let networkMatchPhase: "pre-match" | "countdown" | "match" | "result" =
  "pre-match";

let lastLocalSetup: {
  participantCount: 2 | 3 | 4;
  seats: SeatConfig[];
} | null = null;

async function main() {
  injectStyles();
  const poller = new GamepadPoller();
  const store = new GamepadPreferenceStore(localStorage);
  const assignmentManager = new ControllerAssignmentManager(poller, store, 4);

  const app = new Application();
  await app.init({
    background: 0x000000,
    backgroundAlpha: 0,
    width: STAGE.WIDTH,
    height: STAGE.HEIGHT,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });

  app.canvas.id = "game-canvas";
  document.body.appendChild(app.canvas);
  // Hide canvas until splash screen is dismissed to prevent game graphics showing behind splash
  app.canvas.style.visibility = "hidden";

  function resize() {
    const scaleX = window.innerWidth / STAGE.WIDTH;
    const scaleY = window.innerHeight / STAGE.HEIGHT;
    const scale = Math.min(scaleX, scaleY);
    app.canvas.style.width = `${STAGE.WIDTH * scale}px`;
    app.canvas.style.height = `${STAGE.HEIGHT * scale}px`;
    app.canvas.style.position = "absolute";
    app.canvas.style.zIndex = "1";
    app.canvas.style.left = `${(window.innerWidth - STAGE.WIDTH * scale) / 2}px`;
    app.canvas.style.top = `${(window.innerHeight - STAGE.HEIGHT * scale) / 2}px`;
  }
  window.addEventListener("resize", resize);
  resize();

  const layers = createLayers();
  app.stage.addChild(layers.background);
  app.stage.addChild(layers.game);
  app.stage.addChild(layers.ui);

  let stageRenderer: StageRenderer | null = new StageRenderer(
    layers.background,
  );

  function setStageBackground(backgroundImage: string): void {
    const baseUrl = import.meta.env.BASE_URL || "/";
    const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    const backgroundPath = `${normalizedBaseUrl}backgrounds/${backgroundImage}`;
    const bgLayer = document.getElementById("background-layer");
    if (bgLayer) {
      bgLayer.style.backgroundImage = `url('${backgroundPath}')`;
    }
  }

  // Set initial background
  setStageBackground(STAGES[0]!.backgroundImage);

  const fighterRenderers = new Map<PlayerId, FighterRenderer>();
  const activeSparks: ImpactSpark[] = [];

  /** Process hit events: play SFX, flash defender, and spawn an impact spark. */
  const processHitEvents = (events: HitEventData[]): void => {
    for (const event of events) {
      sfxManager.playHit(event.knockbackMagnitude);
      const defenderRenderer = fighterRenderers.get(event.defenderId);
      if (defenderRenderer) {
        defenderRenderer.startHitFlash();
      }

      const spark = new ImpactSpark();
      spark.start(event.worldX, event.worldY);
      layers.game.addChild(spark.container);
      activeSparks.push(spark);
    }
  };

  /** Tick all active sparks; remove and destroy finished ones. */
  const tickSparks = (): void => {
    for (let i = activeSparks.length - 1; i >= 0; i--) {
      const spark = activeSparks[i]!;
      spark.tick();
      if (spark.done) {
        layers.game.removeChild(spark.container);
        spark.destroy();
        activeSparks.splice(i, 1);
      }
    }
  };

  const uiOverlay = document.getElementById("ui-overlay");
  if (!uiOverlay) {
    throw new Error("#ui-overlay not found");
  }

  const uiManager = new UIManager(uiOverlay);
  uiManager._gamepadPoller = poller;
  const audioPrefs = loadAudioPreferences(localStorage);
  const audioManager = new AudioManager(audioPrefs);
  const sfxManager = new SfxManager(audioManager);
  const gameplaySfxRouter = new GameplaySfxRouter(sfxManager);
  uiManager.setAudioManager(audioManager, () => {
    sfxManager.syncVolume();
    saveAudioPreferences(localStorage, audioManager.getPreferences());
  });
  let myPlayerId: PlayerId | null = null;
  let isLocalMode = false;
  let localMatch: LocalMatch | null = null;
  let camera: Camera | null = null;
  let localCountdownInterval: number | null = null;
  let localCountdownTimeout: number | null = null;
  let selectedStage: StageConfig = STAGES[0]!;
  let hasShownSplashOnThisPageLoad = false;

  const clearLocalCountdown = (): void => {
    if (localCountdownInterval !== null) {
      window.clearInterval(localCountdownInterval);
      localCountdownInterval = null;
    }
    if (localCountdownTimeout !== null) {
      window.clearTimeout(localCountdownTimeout);
      localCountdownTimeout = null;
    }
  };

  const cleanupLocalMode = (): void => {
    clearLocalCountdown();
    localMatch?.cleanup();
    localMatch = null;
    camera?.reset();
  };

  const snapshotToRenderState = (snapshot: StateSnapshot): RenderState => {
    const players = new Map<PlayerId, RenderPlayerState>(
      Object.entries(snapshot.players).map(([id, playerState]) => [
        id,
        {
          id: playerState.id,
          slotIndex: playerState.slotIndex,
          x: playerState.x,
          y: playerState.y,
          vx: playerState.vx,
          vy: playerState.vy,
          isGrounded: playerState.isGrounded,
          facing: playerState.facing,
          state: playerState.state,
          stateFrame: playerState.stateFrame,
          percent: playerState.percent,
          stocks: playerState.stocks,
          isInvincible: playerState.isInvincible,
          isKnockedOut: playerState.isKnockedOut,
          isShielding: playerState.isShielding,
          shieldHealth: playerState.shieldHealth,
          currentMoveId: playerState.currentMoveId,
          characterId: playerState.characterId,
        },
      ]),
    );

    return {
      players,
      matchPhase: snapshot.matchPhase,
      winnerId: snapshot.winnerId,
    };
  };

  const updateRenderers = (state: RenderState): void => {
    gameplaySfxRouter.processFrame(state);
    for (const [id, playerState] of state.players.entries()) {
      let fighterRenderer = fighterRenderers.get(id);
      if (!fighterRenderer) {
        fighterRenderer = new FighterRenderer(
          layers.game,
          playerState.slotIndex,
          playerState.characterId,
        );
        fighterRenderers.set(id, fighterRenderer);
      }
      fighterRenderer.update(playerState);
    }

    for (const [id, fighterRenderer] of fighterRenderers.entries()) {
      if (!state.players.has(id)) {
        fighterRenderer.destroy();
        fighterRenderers.delete(id);
      }
    }

    // Tick impact spark particles each render frame
    tickSparks();
  };

  const urlParams = new URLSearchParams(window.location.search);
  const roomCodeFromUrl = urlParams.get("room");

  const gameClient = new GameClient({
    serverUrl: SERVER_URL,
    onConnected: () => {
      const enterLobby = (): void => {
        if (roomCodeFromUrl) {
          uiManager.setRoomCode(roomCodeFromUrl.toUpperCase());
          gameClient.joinRoom(roomCodeFromUrl);
          uiManager.showLobby();
          audioManager.playTrack("main-menu");
          return;
        }
        uiManager.showLobby();
        audioManager.playTrack("main-menu");
      };

      if (hasShownSplashOnThisPageLoad) {
        app.canvas.style.visibility = "visible";
        enterLobby();
        return;
      }

      uiManager.showSplash(() => {
        hasShownSplashOnThisPageLoad = true;
        // Reveal game canvas now that splash is dismissed
        app.canvas.style.visibility = "visible";
        enterLobby();
      });
    },
    onPlayerAssigned: (playerId, roomCode) => {
      myPlayerId = playerId;
      uiManager.setPlayerId(playerId);
      uiManager.setRoomCode(roomCode);
    },
    onRenderState: (state: RenderState, localPlayerId: PlayerId) => {
      updateRenderers(state);
      uiManager.updateHUD(state, localPlayerId);
    },
    onMatchPhaseChange: (phase: string, winnerId?: PlayerId | null) => {
      if (phase === "countdown") {
        gameplaySfxRouter.reset();
        networkMatchPhase = "countdown";
        let count = 3;
        uiManager.showCountdown(count);
        audioManager.playTrack(selectedStage.musicTrack.replace(".mp3", ""));
        const interval = setInterval(() => {
          count--;
          if (count > 0) {
            uiManager.showCountdown(count);
          } else {
            uiManager.showCountdown(0);
            clearInterval(interval);
            setTimeout(() => uiManager.showMatch(), 1000);
          }
        }, 1000);
      } else if (phase === "match") {
        networkMatchPhase = "match";
        uiManager.showMatch();
        audioManager.playTrack(selectedStage.musicTrack.replace(".mp3", ""));
      } else if (phase === "result") {
        networkMatchPhase = "result";
        gameplaySfxRouter.processMatchResult();
        uiManager.showResult(winnerId ?? null, myPlayerId);
        audioManager.playTrack("game-over");
      }
    },
    onRoomCreated: (roomCode: string) => {
      uiManager.showRoomCreated(roomCode);
    },
    onPlayerJoined: (slotIndex: number) => {
      uiManager.showPlayerJoined(slotIndex);
    },
    onHitEvents: (hitEvents) => {
      processHitEvents(hitEvents);
      for (const hitEvent of hitEvents) {
        camera?.shake(hitEvent.knockbackMagnitude);
      }
    },
    onPaused: () => {
      uiManager.showPauseOverlay();
    },
    onResumed: () => {
      uiManager.hidePauseOverlay();
    },
    onCharacterSelectStart: (playerIds) => {
      if (!myPlayerId) return;
      uiManager.showNetworkCharacterSelect(
        AVAILABLE_FIGHTERS,
        myPlayerId,
        playerIds,
        (characterId) => gameClient.selectCharacter(characterId),
        () =>
          gameClient.confirmCharacter((result) => {
            if ("error" in result) {
              uiManager.showNetworkCharacterSelectConfirmError(result.error);
            }
          }),
      );
    },
    onCharacterUpdated: (data) => {
      uiManager.updateNetworkCharacterSelect(
        data.playerId,
        data.characterId,
        data.confirmed,
      );
    },
    onPlayerLeft: (playerId) => {
      if (networkMatchPhase !== "match" && networkMatchPhase !== "result") {
        uiManager.showLobby();
      }
    },
  });

  uiManager.onCreateRoom = () => {
    networkMatchPhase = "pre-match";
    if (isLocalMode) {
      return;
    }
    audioManager.playTrack("main-menu");
    gameClient.createRoom();
  };

  uiManager.onJoinRoom = (code: string) => {
    networkMatchPhase = "pre-match";
    if (isLocalMode) {
      return;
    }
    audioManager.playTrack("main-menu");
    uiManager.setRoomCode(code);
    gameClient.joinRoom(code);
  };

  uiManager.onReady = () => {
    if (isLocalMode) {
      return;
    }
    gameClient.markReady();
  };

  uiManager.onPlayAgain = () => {
    window.location.href = window.location.pathname;
  };

  const keymapForSlotIndex = (slotIndex: number) => {
    return slotIndex === 0
      ? DEFAULT_KEYMAP_P1
      : slotIndex === 1
        ? DEFAULT_KEYMAP_P2
        : slotIndex === 2
          ? DEFAULT_KEYMAP_P3
          : DEFAULT_KEYMAP_P4;
  };

  const startLocalMatchWithSeats = (
    setup: {
      participantCount: 2 | 3 | 4;
      seats: SeatConfig[];
    },
    choices: FighterChoice[],
  ): void => {
    cleanupLocalMode();
    gameplaySfxRouter.reset();

    if (!camera) {
      camera = new Camera(layers.game);
    }

    const assignments = assignmentManager.getAssignments();
    const controllers: ITickController[] = [];

    // Compute full player ID list before controller loop
    const allPlayerIds: PlayerId[] = [
      "local-p1" as PlayerId,
      ...setup.seats.map((_, k) => `local-p${k + 2}` as PlayerId),
    ];

    const p1Assignment = assignments.get(0);
    const p1GamepadSource = p1Assignment
      ? new GamepadInputSource(poller, p1Assignment.gamepadIndex)
      : null;
    controllers.push(
      new LocalPlayerController({
        playerId: "local-p1",
        keymap: DEFAULT_KEYMAP_P1,
        slotIndex: 0,
        gamepadSource: p1GamepadSource,
      }),
    );

    for (let k = 0; k < setup.seats.length; k += 1) {
      const seat = setup.seats[k]!;
      const slotIndex = k + 1;
      const playerId = `local-p${slotIndex + 1}`;
      if (seat.kind === "cpu") {
        controllers.push(
          new AIPlayerController({
            playerId,
            slotIndex,
            opponentPlayerIds: allPlayerIds.filter((id) => id !== playerId),
            difficulty: seat.difficulty,
            seed: slotIndex * 1000 + 1,
          }),
        );
        continue;
      }

      const assignment = assignments.get(slotIndex);
      const gamepadSource = assignment
        ? new GamepadInputSource(poller, assignment.gamepadIndex)
        : null;
      controllers.push(
        new LocalPlayerController({
          playerId,
          keymap: keymapForSlotIndex(slotIndex),
          slotIndex,
          gamepadSource,
        }),
      );
    }

    const characterIds: Partial<Record<PlayerId, CharacterId>> = {};
    for (let i = 0; i < controllers.length; i += 1) {
      const controller = controllers[i]!;
      const choice = choices[i];
      if (choice?.id) {
        characterIds[controller.playerId as PlayerId] =
          choice.id as CharacterId;
      }
    }

    localMatch = new LocalMatch(controllers, characterIds);
    localMatch.onSnapshot = (snapshot) => {
      const renderState = snapshotToRenderState(snapshot);
      updateRenderers(renderState);
      uiManager.updateHUD(renderState, null);

      const positions = Object.values(snapshot.players).map((player) => ({
        x: player.x,
        y: player.y,
      }));

      // Trigger camera shake and hit effects from hit events
      if (snapshot.hitEvents && snapshot.hitEvents.length > 0) {
        processHitEvents(snapshot.hitEvents);
        for (const hitEvent of snapshot.hitEvents) {
          camera?.shake(hitEvent.knockbackMagnitude);
        }
      }

      camera?.update(positions, window.innerWidth, window.innerHeight);

      if (snapshot.matchPhase === "result") {
        gameplaySfxRouter.processMatchResult();
        clearLocalCountdown();
        uiManager.showLocalResult(snapshot.winnerId);
        audioManager.playTrack("game-over");
      }
    };

    uiManager.hideRoomCode();
    let count = 3;
    uiManager.showCountdown(count);
    audioManager.playTrack(selectedStage.musicTrack.replace(".mp3", ""));
    localCountdownInterval = window.setInterval(() => {
      count -= 1;
      if (count > 0) {
        uiManager.showCountdown(count);
        return;
      }

      uiManager.showCountdown(0);
      clearLocalCountdown();
      localCountdownTimeout = window.setTimeout(() => {
        localCountdownTimeout = null;
        uiManager.showMatch();
        localMatch?.start();
      }, 1000);
    }, 1000);
  };

  const enterLocalPlayFlow = (): void => {
    uiManager.showLocalPlaySetup(
      { assignmentManager },
      lastLocalSetup,
      (result) => {
        lastLocalSetup = result;
        const cpuSlotIndices = result.seats
          .map((seat, index) => (seat.kind === "cpu" ? index + 1 : null))
          .filter((slotIndex): slotIndex is number => slotIndex !== null);
        const gamepadSlotByIndex = new Map<number, number>();
        for (const [
          slotIndex,
          assignment,
        ] of assignmentManager.getAssignments()) {
          gamepadSlotByIndex.set(assignment.gamepadIndex, slotIndex);
        }
        uiManager.showCharacterSelect(
          AVAILABLE_FIGHTERS,
          result.participantCount,
          (choices) => {
            // After character select, show stage select
            uiManager.showStageSelect(
              STAGES,
              (chosenStage) => {
                selectedStage = chosenStage;
                // Update CSS background with new stage
                setStageBackground(chosenStage.backgroundImage);
                // Destroy old stage graphics and recreate
                layers.background.removeChildren();
                stageRenderer = new StageRenderer(layers.background);
                startLocalMatchWithSeats(result, choices);
              },
              () => {
                // Back from stage select → return to character select
                enterLocalPlayFlow();
              },
            );
          },
          cpuSlotIndices,
          () => {
            // Back from character select → return to setup
            enterLocalPlayFlow();
          },
          gamepadSlotByIndex,
        );
      },
      () => {
        // Back from setup → return to lobby
        if (isLocalMode) {
          isLocalMode = false;
          gameClient.connect();
        }
        uiManager.showLobby();
        audioManager.playTrack("main-menu");
      },
    );
  };

  uiManager.onLocalPlay = () => {
    audioManager.playTrack("main-menu");
    if (!isLocalMode) {
      isLocalMode = true;
      gameClient.disconnect();
    }
    enterLocalPlayFlow();
  };

  uiManager.onLocalPlayAgain = () => {
    cleanupLocalMode();
    for (const [, renderer] of fighterRenderers) {
      renderer.destroy();
    }
    fighterRenderers.clear();
    enterLocalPlayFlow();
  };

  uiManager.onOpenControls = () => {
    uiManager.showControls({ assignmentManager, preferenceStore: store });
  };

  uiManager.onResume = () => {
    if (isLocalMode) {
      if (!localMatch?.paused) return;
      localMatch.resume();
      uiManager.hidePauseOverlay();
      return;
    }
    // Multiplayer: emit resume to server; overlay hides on game:resumed event
    if (gameClient.isPaused) {
      gameClient.emitResume();
    }
  };

  uiManager.onMainMenu = () => {
    const wasLocalMode = isLocalMode;

    // Clean up local match if active (safe no-op when not in local mode)
    cleanupLocalMode();

    // Multiplayer: disconnect triggers server forfeit via handleDisconnect
    if (!isLocalMode) {
      try {
        gameClient.disconnect();
      } catch (err) {
        console.error(
          "Failed to disconnect game client before returning to main menu:",
          err,
        );
      }
    }

    if (wasLocalMode) {
      gameClient.connect();
    }

    // Destroy all fighter renderers
    for (const [, renderer] of fighterRenderers) {
      renderer.destroy();
    }
    fighterRenderers.clear();

    // Clean up active impact sparks
    for (let i = activeSparks.length - 1; i >= 0; i--) {
      const spark = activeSparks[i]!;
      layers.game.removeChild(spark.container);
      spark.destroy();
    }
    activeSparks.length = 0;

    isLocalMode = false;
    myPlayerId = null;
    gameplaySfxRouter.reset();
    sfxManager.stopAll();

    // Clean room code from URL so lobby shows create/join UI (not stale room)
    window.history.replaceState({}, "", window.location.pathname);

    uiManager.showLobby();
    audioManager.playTrack("main-menu");
  };

  window.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;

    const phase = uiManager.getPhase();

    // If already paused (either mode), resume via the shared callback
    if (phase === "paused") {
      uiManager.onResume?.();
      return;
    }

    // Only allow pause during active match (not countdown, result, etc.)
    if (phase !== "match") return;

    if (isLocalMode && localMatch) {
      // Local mode: pause the local match directly
      localMatch.pause();
      uiManager.showPauseOverlay();
    } else if (!isLocalMode) {
      // Multiplayer: emit pause to server; overlay shows on game:paused event
      gameClient.emitPause();
    }
  });

  // Gamepad pause handler - START button only
  if (typeof requestAnimationFrame !== "undefined" && poller) {
    let lastBitsPerGamepad = new Map<number, number>();
    const checkPauseButton = (): void => {
      const states = poller.poll();
      for (const [gpIndex, state] of states) {
        const bits = state.bits;
        const prev = lastBitsPerGamepad.get(gpIndex) ?? 0;
        const pressed = bits & ~prev;

        // START button (0x1000) - pause/unpause
        if (pressed & 0x1000) {
          const phase = uiManager.getPhase();

          // If paused, resume
          if (phase === "paused") {
            uiManager.onResume?.();
          }
          // If in match, pause
          else if (phase === "match") {
            if (isLocalMode && localMatch) {
              localMatch.pause();
              uiManager.showPauseOverlay();
            } else if (!isLocalMode) {
              gameClient.emitPause();
            }
          }
        }

        if (pressed & 0x0020) {
          const phase = uiManager.getPhase();
        }

        lastBitsPerGamepad.set(gpIndex, bits);
      }
      requestAnimationFrame(checkPauseButton);
    };
    requestAnimationFrame(checkPauseButton);
  }

  const getDebugSnapshot = (): StateSnapshot | null => {
    if (isLocalMode) {
      return localMatch?.getLatestSnapshot() ?? null;
    }

    return gameClient.getLatestSnapshot();
  };

  const forceDebugPosition = (
    playerId: PlayerId,
    x: number,
    y: number,
  ): boolean => {
    if (isLocalMode) {
      return localMatch?.forcePosition(playerId, x, y) ?? false;
    }

    return false;
  };

  const getDebugKOEvents = (): KOEventData[] => {
    if (isLocalMode) {
      return localMatch?.getKOEvents() ?? [];
    }

    return [];
  };

  (
    window as Window & {
      __smashDebug?: {
        sendInput: (input: {
          held: number;
          pressed: number;
          released: number;
        }) => void;
        getSnapshot: () => ReturnType<GameClient["getLatestSnapshot"]>;
        forcePosition?: (playerId: PlayerId, x: number, y: number) => boolean;
        getKOEvents?: () => KOEventData[];
      };
    }
  ).__smashDebug = {
    sendInput: (input) => gameClient.debugSendInput(input),
    getSnapshot: getDebugSnapshot,
    ...(import.meta.env.DEV
      ? {
          forcePosition: forceDebugPosition,
          getKOEvents: getDebugKOEvents,
        }
      : {}),
  };

  if (import.meta.env.DEV) {
    (
      window as Window & {
        __DEBUG_GAME_STATE__?: () => ReturnType<
          GameClient["getLatestSnapshot"]
        >;
      }
    ).__DEBUG_GAME_STATE__ = getDebugSnapshot;
  }

  window.addEventListener("beforeunload", () => {
    cleanupLocalMode();
    sfxManager.stopAll();
    gameClient.disconnect();
  });
}

main().catch(console.error);
