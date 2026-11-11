import { getCharacterStats, getStageLayout, isPack03PilotId, PACK_03_PILOT_FIGHTERS } from '@smash/shared';
import{PracticeRoutine}from'./practice/PracticeRoutine.js';
import{PracticeOverlay}from'./practice/PracticeOverlay.js';
import './practice/practice.css';
import{PracticePanel}from'./practice/PracticePanel.js';
import{PracticeDummy}from'./practice/PracticeDummy.js';
import{dojoSimulationProfile,type PracticeConfig}from'./practice/curriculum.js';
import {StageBackdrop} from './renderer/StageBackdrop';
import { ULTIMATE_MENU } from './input/controllerProfiles';
import{KOPresentation}from'./renderer/fullbody/KOPresentation.js';
/** @fileoverview Main entry point for the Smash Bros clone client application. */

import type {
  CharacterId,
  HitEventData,
  KOEventData,
  PlayerId,
  StateSnapshot,
} from "@smash/shared";
import { MoveId, PHYSICS, STAGE } from "@smash/shared";
import { chooseStageVisual, withStageVisual, STAGES, type StageConfig } from "./stages/stageConfig.js";
import { GamepadPoller, GamepadPreferenceStore } from "@smash/gamepad-input";
import { Application, Container } from "pixi.js";
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
import { preloadFighterAssets } from "./renderer/fighterAssets.js";
import { preloadFullBodyPilot, type DojoArtId, type FullBodyPilotAssets } from "./renderer/fullbody/FullBodyPilot.js";
import { createLayers } from "./renderer/layers.js";
import { StageRenderer, waitForStageAsset } from "./renderer/StageRenderer.js";
import { ImpactSpark } from "./renderer/effects/ImpactSpark.js";
import { injectStyles, UIManager } from "./ui/index.js";
import { FIGHTER_PRESENTATION } from "./ui/selectionContent";
import type { ResultFighter } from "./ui/MatchMenus";
import type { SettingsTab } from "./ui/SettingsShell";
import { AudioManager } from "./audio/AudioManager.js";
import {
  loadAudioPreferences,
  saveAudioPreferences,
} from "./audio/audioPreferences.js";
import { GameplaySfxRouter } from "./audio/GameplaySfxRouter.js";
import { SfxManager } from "./audio/SfxManager.js";

const E2E_FIXTURE_QUERY_KEY = "e2e-fixture";
const E2E_FORCE_WEBGL_QUERY_KEY = "e2e-force-webgl";

type E2EFixtureName =
  | "neutral-idle"
  | "hit-flash-slot-0"
  | "hit-flash-slot-1"
  | "hit-flash-slot-2"
  | "hit-flash-slot-3"
  | "lincoln-idle"
  | "facing-flipped"
  | "squash-stretch"
  | "invincibility-alpha-0.4"
  | "camera-scale-0.4";

type E2EFixturePlayer = {
  readonly id: PlayerId;
  readonly slotIndex: number;
  readonly characterId: CharacterId;
  readonly x: number;
  readonly y: number;
  readonly facing: 1 | -1;
  readonly state: string;
  readonly stateFrame: number;
  readonly isInvincible: boolean;
  readonly moveId: MoveId | null;
};

declare global {
  interface Window {
    __smashE2E?: {
      readonly ready: boolean;
      renderFixture: (name: E2EFixtureName) => void;
      measureDrawCalls: (name: E2EFixtureName) => {
        readonly count: number;
        readonly wrappedMethods: readonly string[];
        readonly hasContext: boolean;
      };
      getRendererMode: () => "sprite" | "polygon";
      getGameScale: () => { readonly x: number; readonly y: number };
    };
  }
}

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
  { id: "swift", displayName: "Swift" },
];

const NEWCOMER_CHOICES = [
  { id: "moonshine", displayName: "Moonshine" },
  { id: "hulk-hoagie", displayName: "“Hulk” Hoagie" },
] as const;

let networkMatchPhase: "pre-match" | "countdown" | "match" | "result" =
  "pre-match";

let lastLocalSetup: {
  participantCount: 2 | 3 | 4;
  seats: SeatConfig[];
} | null = null;

async function main() {
  const urlParams = new URLSearchParams(window.location.search);
  const e2eFixtureEnabled = urlParams.get(E2E_FIXTURE_QUERY_KEY) === "1";
  const e2eForceWebgl = urlParams.get(E2E_FORCE_WEBGL_QUERY_KEY) === "1";
  const e2ePolygonForced = urlParams.get("renderer") === "polygon";

  injectStyles();
  const menuArtwork = new Image();
  menuArtwork.src = import.meta.env.BASE_URL + 'branding/everybody-throws-hands-arcade.png';
  const menuArtworkReady = typeof menuArtwork.decode === 'function'
    ? menuArtwork.decode().catch(error => console.warn('[menu] Main logo unavailable', error))
    : Promise.resolve();
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
    ...(e2eForceWebgl ? ({ preference: "webgl" } as const) : {}),
  });

  // Register the fallback manifest before loading any Pixi stage or full-body textures.
  let fighterAssets: Awaited<ReturnType<typeof preloadFighterAssets>> = { mode: "polygon" };
  let fallbackSettled = false;
  const fallbackReady = preloadFighterAssets().then(assets => { fighterAssets = assets; fallbackSettled = true; });
  const roster = urlParams.get("renderer") === "legacy"
    ? AVAILABLE_FIGHTERS : [...AVAILABLE_FIGHTERS, ...NEWCOMER_CHOICES,
      ...PACK_03_PILOT_FIGHTERS.map(({ id, name }) => ({ id, displayName: name }))];
  const artworkLoads = new Map<CharacterId, Promise<FullBodyPilotAssets | undefined>>();
  let fullBodyPilot: FullBodyPilotAssets | undefined;
  let effectsLoad: Promise<FullBodyPilotAssets | undefined> | undefined;
  const missingFighterIdle = Symbol("missing fighter idle artwork");
  const prepareFighters = async (ids: readonly CharacterId[], failFast = false): Promise<boolean> => {
    await fallbackReady;
    const effectsReady = effectsLoad ??= preloadFullBodyPilot(false, []);
    const fightersReady = Promise.all([...new Set(ids)].map(async id => {
      let pending = artworkLoads.get(id);
      if (!pending) {
        pending = preloadFullBodyPilot(id === "moonshine" || id === "hulk-hoagie" || isPack03PilotId(id), [id], false, true);
        artworkLoads.set(id, pending);
      }
      const assets = await pending;
      if (!assets?.characters[id]?.idle) {
        if (artworkLoads.get(id) === pending) artworkLoads.delete(id);
        if (failFast) throw missingFighterIdle;
        return;
      }
      fullBodyPilot = {
        packing: fullBodyPilot?.packing ?? assets.packing,
        characters: { ...fullBodyPilot?.characters, ...assets.characters },
        effects: fullBodyPilot?.effects,
      };
    }));
    const effectsSettled = effectsReady.then(effects => {
      if (!effects && effectsLoad === effectsReady) effectsLoad = undefined;
      return effects;
    });
    try {
      const [, effects] = await Promise.all([fightersReady, effectsSettled]);
      if (effects && fullBodyPilot) fullBodyPilot = { ...fullBodyPilot, effects: effects.effects };
      return true;
    } catch (error) {
      if (error === missingFighterIdle) return false;
      throw error;
    }
  };
  const allFighterIds = roster.map(fighter => fighter.id as CharacterId);
  if (e2eFixtureEnabled) await prepareFighters(allFighterIds);
  if (e2eFixtureEnabled && !e2ePolygonForced && fighterAssets.mode === "polygon") {
    fighterAssets = await preloadFighterAssets({ locationSearch: "", timeoutMs: 15_000 });
  }
  if (e2eFixtureEnabled) {
    app.ticker.stop();
  }

  app.canvas.id = "game-canvas";
  document.body.appendChild(app.canvas);
  // Hide canvas until splash screen is dismissed to prevent game graphics showing behind splash
  app.canvas.style.visibility = e2eFixtureEnabled ? "visible" : "hidden";

  const layers = createLayers();
  const arenaFrame = app.stage.addChild(new Container());
  arenaFrame.addChild(layers.background);
  layers.background.addChild(layers.game);
  app.stage.addChild(layers.ui);

  const viewport: { width: number; height: number } = { width: STAGE.WIDTH, height: STAGE.HEIGHT };
  function resize() {
    const width = Math.max(1, window.innerWidth);
    const height = Math.max(1, window.innerHeight);
    const scale = Math.min(width / STAGE.WIDTH, height / STAGE.HEIGHT);
    app.renderer.resize(width, height);
    app.stage.scale.set(scale);
    viewport.width = app.screen.width / scale;
    viewport.height = app.screen.height / scale;
    arenaFrame.position.set((viewport.width - STAGE.WIDTH) / 2, (viewport.height - STAGE.HEIGHT) / 2);
  }
  app.canvas.style.position = "absolute";
  app.canvas.style.zIndex = "1";
  app.canvas.style.inset = "0";
  window.addEventListener("resize", resize);
  resize();

  const stageBackdrop=new StageBackdrop(document.getElementById("background-layer"));
  const koPresenter = new KOPresentation(layers.game, layers.ui, fullBodyPilot, viewport,
    id => fighterRenderers.get(id)?.getOutgoingTumble());
  let stageRenderer: StageRenderer | null = null;
  let renderedStageId = "";
  let stageReady = Promise.resolve();
  const stageLoading = document.createElement("div");
  stageLoading.hidden = true;
  stageLoading.setAttribute("role", "status");
  stageLoading.textContent = "Loading arena…";
  stageLoading.style.cssText = "position:fixed;inset:0;z-index:2;background:#211828;color:#f3eee1;text-align:center;align-content:center;font:600 1rem system-ui;pointer-events:none";
  document.body.append(stageLoading);

  function setStageBackground({ id: stageId, backgroundImage }: StageConfig): void {
    const visualKey=stageId+':'+backgroundImage;
    if (visualKey === renderedStageId) return;
    renderedStageId = visualKey;
    stageLoading.hidden = false;
    stageRenderer?.destroy?.();
    stageRenderer = null;
    const base = import.meta.env.BASE_URL || "/";
    const backgroundPath = base + "backgrounds/" + backgroundImage.replace(/\.png$/, ".webp");
    const image = new Image();
    image.fetchPriority = 'high';
    image.src = backgroundPath;
    const background = typeof image.decode === "function" ? waitForStageAsset(image.decode()) : Promise.resolve(null);
    const pending = fallbackReady.then(async () => {
      if (stageReady !== pending) return;
      const renderer = new StageRenderer(layers.background, stageId);
      stageRenderer = renderer;
      const [decoded] = await Promise.all([background, renderer.ready]);
      if (stageReady !== pending) return;
      stageBackdrop.setStage(stageId, decoded === null ? "" : backgroundPath);
      stageLoading.hidden = true;
    });
    stageReady = pending;
  }

  if (e2eFixtureEnabled) setStageBackground(STAGES[0]!);

  const fighterRenderers = new Map<PlayerId, FighterRenderer>();
  const e2eRenderers = new Map<PlayerId, FighterRenderer>();
  const glWrappedMethods = new Set<string>();
  let drawCallCount = 0;

  const getE2EHitFlashSlot = (fixture: E2EFixtureName): number | null => {
    if (!fixture.startsWith("hit-flash-slot-")) {
      return null;
    }
    const slot = Number.parseInt(fixture.slice("hit-flash-slot-".length), 10);
    return Number.isNaN(slot) ? null : slot;
  };

  const buildE2EFixturePlayers = (fixture: E2EFixtureName): readonly E2EFixturePlayer[] => {
    const basePlayers: E2EFixturePlayer[] = [
      {
        id: "e2e-p1",
        slotIndex: 0,
        characterId: "all-rounder",
        x: 360,
        y: 500,
        facing: 1,
        state: "IDLE",
        stateFrame: 0,
        isInvincible: false,
        moveId: null,
      },
      {
        id: "e2e-p2",
        slotIndex: 1,
        characterId: "all-rounder",
        x: 520,
        y: 500,
        facing: 1,
        state: "IDLE",
        stateFrame: 0,
        isInvincible: false,
        moveId: null,
      },
      {
        id: "e2e-p3",
        slotIndex: 2,
        characterId: "swift",
        x: 680,
        y: 500,
        facing: 1,
        state: "IDLE",
        stateFrame: 0,
        isInvincible: false,
        moveId: null,
      },
      {
        id: "e2e-p4",
        slotIndex: 3,
        characterId: "all-rounder",
        x: 840,
        y: 500,
        facing: 1,
        state: "IDLE",
        stateFrame: 0,
        isInvincible: false,
        moveId: null,
      },
    ];

    switch (fixture) {
      case "lincoln-idle":
        basePlayers[0] = { ...basePlayers[0]!, characterId: "abe-lincoln" };
        return basePlayers;
      case "facing-flipped":
        return basePlayers.map((player) => ({ ...player, facing: -1 }));
      case "squash-stretch":
        return basePlayers.map((player) => ({
          ...player,
          state: "ATTACK",
          stateFrame: 0,
          moveId: MoveId.DOWN_SMASH,
        }));
      case "invincibility-alpha-0.4":
        return basePlayers.map((player) => ({ ...player, isInvincible: true }));
      case "camera-scale-0.4":
        return [
          { ...basePlayers[0]!, x: 200, y: 470 },
          { ...basePlayers[1]!, x: 560, y: 500 },
          { ...basePlayers[2]!, x: 920, y: 520 },
          { ...basePlayers[3]!, x: 1280, y: 490 },
        ];
      default:
        return basePlayers;
    }
  };

  const destroyE2ERenderers = (): void => {
    for (const [id, renderer] of e2eRenderers.entries()) {
      renderer.destroy();
      e2eRenderers.delete(id);
    }
  };

  const renderE2EFixture = (fixture: E2EFixtureName, includeAppRender: boolean): void => {
    destroyE2ERenderers();

    if (fixture === "camera-scale-0.4") {
      layers.game.scale.set(0.4);
      layers.game.position.set(0, 0);
    } else {
      layers.game.scale.set(1);
      layers.game.position.set(0, 0);
    }

    const fixturePlayers = buildE2EFixturePlayers(fixture);
    const hitFlashSlot = getE2EHitFlashSlot(fixture);

    for (const fixturePlayer of fixturePlayers) {
      const renderer = new FighterRenderer(
        layers.game,
        fixturePlayer.slotIndex,
        fixturePlayer.characterId,
        {
          mode: fighterAssets.mode,
          fullBodyPilot,
          textureProvider: fighterAssets.mode === "sprite" ? fighterAssets.provider : undefined,
        },
      );

      renderer.update({
        x: fixturePlayer.x,
        y: fixturePlayer.y - getCharacterStats(fixturePlayer.characterId).hurtboxRadius,
        facing: fixturePlayer.facing,
        isInvincible: fixturePlayer.isInvincible,
        isKnockedOut: false,
        isShielding: false,
        shieldHealth: PHYSICS.SHIELD_MAX_HEALTH,
        state: fixturePlayer.state,
        stateFrame: fixturePlayer.stateFrame,
        slotIndex: fixturePlayer.slotIndex,
        currentMoveId: fixturePlayer.moveId,
        });

      if (fixture === "invincibility-alpha-0.4") {
        renderer.container.alpha = 0.4;
      }

      if (hitFlashSlot !== null && fixturePlayer.slotIndex === hitFlashSlot) {
        renderer.startHitFlash();
      }

      e2eRenderers.set(fixturePlayer.id, renderer);
    }

    if (includeAppRender) {
      app.render();
    }
  };

  const ensureGLDrawInstrumentation = (): WebGLRenderingContext | WebGL2RenderingContext | null => {
    const rendererMaybeGl = app.renderer as unknown as { gl?: WebGLRenderingContext | WebGL2RenderingContext };
    const gl = rendererMaybeGl.gl ?? null;
    if (!gl) {
      return null;
    }

    const wrapDrawMethod = (methodName: "drawElements" | "drawElementsInstanced" | "drawArrays" | "drawArraysInstanced") => {
      const method = (gl as unknown as Record<string, unknown>)[methodName];
      if (typeof method !== "function") {
        return;
      }

      const wrappedMarker = `__smashWrapped_${methodName}`;
      if ((method as unknown as Record<string, unknown>)[wrappedMarker] === true) {
        glWrappedMethods.add(methodName);
        return;
      }

      const original = method as (...args: unknown[]) => unknown;
      const wrapped = function wrappedDraw(this: unknown, ...args: unknown[]): unknown {
        drawCallCount += 1;
        return original.apply(this, args);
      };

      (wrapped as unknown as Record<string, unknown>)[wrappedMarker] = true;
      (gl as unknown as Record<string, unknown>)[methodName] = wrapped;
      glWrappedMethods.add(methodName);
    };

    wrapDrawMethod("drawElements");
    wrapDrawMethod("drawElementsInstanced");
    wrapDrawMethod("drawArrays");
    wrapDrawMethod("drawArraysInstanced");

    return gl;
  };

  if (e2eFixtureEnabled) {
    await stageReady;
    document.getElementById("startup-loading")?.remove();
    const e2eApi = {
      ready: true,
      renderFixture: (name: E2EFixtureName) => {
        renderE2EFixture(name, true);
      },
      measureDrawCalls: (name: E2EFixtureName) => {
        const gl = ensureGLDrawInstrumentation();
        drawCallCount = 0;
        renderE2EFixture(name, true);
        return {
          count: drawCallCount,
          wrappedMethods: Array.from(glWrappedMethods).sort(),
          hasContext: gl !== null,
        } as const;
      },
      getRendererMode: () => fighterAssets.mode,
      getGameScale: () => ({
        x: layers.game.scale.x,
        y: layers.game.scale.y,
      }),
    };

    window.__smashE2E = e2eApi;
    renderE2EFixture("neutral-idle", true);
    return;
  }

  const activeSparks: ImpactSpark[] = [];

  /** Process hit events: play SFX, flash defender, and spawn an impact spark. */
  const processHitEvents = (events: HitEventData[], players?: RenderState['players']): void => {
    for (const event of events) {
      sfxManager.playHit(event.knockbackMagnitude);
      if(event.moveId===MoveId.DOWN_SPECIAL)fighterRenderers.get(event.attackerId)?.startCounterReaction(players?.get(event.attackerId)?.stateFrame);
      const defenderRenderer = fighterRenderers.get(event.defenderId);
      if (event.moveId === MoveId.PUMMEL || [MoveId.FORWARD_THROW, MoveId.BACK_THROW, MoveId.UP_THROW, MoveId.DOWN_THROW].includes(event.moveId)) {
        const attacker = fighterRenderers.get(event.attackerId);
        const facing = players?.get(event.attackerId)?.facing ?? (attacker?.container.scale.x === -1 ? -1 : 1);
        if (event.moveId !== MoveId.PUMMEL) attacker?.startThrowRelease(event.moveId);
        defenderRenderer?.startGrabReaction(event.moveId, facing, event.attackerId);
      }
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

  await menuArtworkReady;
  document.getElementById('startup-loading')?.remove();
  const uiManager = new UIManager(uiOverlay);
  let pendingKOResult: (() => void) | undefined;
  const showResultAfterKO = (showResult: () => void): void => {
    if (koPresenter.hasSpecialKO()) pendingKOResult = showResult;
    else showResult();
  };
  app.ticker.add(() => {
    koPresenter.tick();
    uiManager.setScreenKOOverHUD(koPresenter.hasScreenKOOverHUD());
    if (pendingKOResult && !koPresenter.hasSpecialKO()) {
      const showResult = pendingKOResult;
      pendingKOResult = undefined;
      showResult();
    }
  });
  app.ticker.add(()=>stageBackdrop.update(uiManager.getPhase()==='match'));
  uiManager._gamepadPoller = poller;
  uiManager.controllerIdForSlot = slot => assignmentManager.getAssignments().get(slot)?.gamepadId;
  assignmentManager.onAssignmentChanged = () => { uiManager.refreshControllerHints(); uiManager.refreshControlAssignments(); };
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

  let dojoMatch:PracticeConfig|undefined;
  let practicePanel:PracticePanel|null=null;
  let practiceOverlay:PracticeOverlay|null=null;
  let camera: Camera | null = null;
  let localCountdownInterval: number | null = null;
  let localCountdownTimeout: number | null = null;
  let selectedStage: StageConfig = STAGES[0]!;
  let lastLocalMatch: { setup: NonNullable<typeof lastLocalSetup>; choices: FighterChoice[]; stage: StageConfig } | null = null;
  let reopenLocalFighters: (() => void) | null = null;
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
    pendingKOResult = undefined;
    dojoMatch=undefined;
    practicePanel?.destroy();practicePanel=null;practiceOverlay?.destroy();practiceOverlay=null;uiManager.onPracticeReset=null;uiManager.onPracticeMenu=null;uiManager.onPracticeLabActions=null;
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
 dodgeLevel:playerState.dodgeLevel,dodgeKind:playerState.dodgeKind,koVisual:playerState.koVisual,tauntKind:playerState.tauntKind,hitReaction:playerState.hitReaction,impactVx:playerState.pendingKnockbackVx??playerState.vx,wallTechSide:playerState.wallTechRecovery?.side ?? playerState.launchImpact?.wall,artCue:playerState.artCue,artCueFrame:playerState.artCueFrame,respawnTimer:playerState.respawnTimer,footstoolRole:playerState.footstoolRole,footstoolPartnerId:playerState.footstoolPartnerId,footstoolFrame:playerState.footstoolFrame,shieldReaction:playerState.shieldReaction,shieldReactionFrame:playerState.shieldReactionFrame,hitstunFramesRemaining:playerState.hitstunFramesRemaining,floorOrientation:playerState.floorOrientation,floorRollDirection:playerState.floorRollDirection,isFastFalling:playerState.isFastFalling,airDodgeDirection:playerState.airDodgeDirection,hasDoubleJump:playerState.hasDoubleJump,isTumbling:playerState.isTumbling,chargeFrames:playerState.chargeFrames,isGrabbing:playerState.isGrabbing,grabbedPlayerId:playerState.grabbedPlayerId,ledgeId:playerState.ledgeId,
        },
      ]),
    );

    return {
      players,
      matchPhase: snapshot.matchPhase,
      winnerId: snapshot.winnerId,
    };
  };

  const newcomerArtId=(id?:CharacterId):DojoArtId|undefined=>id==='moonshine'||id==='hulk-hoagie'||isPack03PilotId(id)?id:undefined;
  const updateCamera = (state: RenderState): void => {
    if (state.matchPhase !== 'match') return;
    const positions = [...state.players.values()].filter(player => player.stocks > 0 && !player.isKnockedOut);
    (camera ??= new Camera(layers.background)).update(positions.map(player => ({
      x: player.x, y: player.y,
      launching: !player.isGrounded && (player.isTumbling || (player.hitstunFramesRemaining ?? 0) > 0),
    })), STAGE.WIDTH, STAGE.HEIGHT);
  };

  const updateRenderers = (state: RenderState): void => {
    stageBackdrop.setFocus([...state.players.values()].filter(player=>player.stocks>0&&!player.isKnockedOut));
    koPresenter.update(state.players.values());
    if(state.matchPhase==='result')camera?.reset();
    gameplaySfxRouter.processFrame(state);
    for (const [id, playerState] of state.players.entries()) {
      let fighterRenderer = fighterRenderers.get(id);
      if (!fighterRenderer) {
        const dojoArtId=newcomerArtId(playerState.characterId);
        fighterRenderer = new FighterRenderer(
          layers.game,
          playerState.slotIndex,
          playerState.characterId,
          {
            mode: fighterAssets.mode,
            dojoArtId,
            fullBodyPilot,
            textureProvider:
              fighterAssets.mode === "sprite" ? fighterAssets.provider : undefined,
          },
        );
        fighterRenderers.set(id, fighterRenderer);
      }
      const holder = [...state.players.values()].find(p => p.isGrabbing && p.grabbedPlayerId === id);
      const throwOwnerId = fighterRenderer.throwOwnerId;
      const throwOwner = throwOwnerId && playerState.state === 'HITSTUN' ? state.players.get(throwOwnerId) : undefined;
      const grabOwner = holder ?? throwOwner;
 const footstoolPartner=playerState.footstoolPartnerId?state.players.get(playerState.footstoolPartnerId):undefined;
 const footstoolContact=playerState.footstoolRole==='attacker'&&footstoolPartner&&(footstoolPartner.footstoolRole==='ground'||footstoolPartner.footstoolRole==='air')?{artId:newcomerArtId(footstoolPartner.characterId),characterId:footstoolPartner.characterId??'all-rounder',role:footstoolPartner.footstoolRole,frame:footstoolPartner.footstoolFrame??0,dx:footstoolPartner.x-playerState.x,dy:footstoolPartner.y-playerState.y,facing:footstoolPartner.facing}:undefined;
 const edge=playerState.ledgeId?getStageLayout(selectedStage.id).ledges.find(ledge=>ledge.id===playerState.ledgeId):undefined;
 const ledgeContact=edge?{dx:edge.x-playerState.x,dy:edge.y-playerState.y}:undefined;
 fighterRenderer.update({...playerState,ledgeContact,result:state.matchPhase==='result'?(id===state.winnerId?'win':'lose'):undefined,presentationVariant:playerState.slotIndex%3,footstoolContact,grabFacing:grabOwner?.facing,grabOwner:grabOwner?{artId:newcomerArtId(grabOwner.characterId),characterId:grabOwner.characterId??"all-rounder",state:grabOwner.state,frame:grabOwner.stateFrame,move:grabOwner.currentMoveId,dx:(playerState.x-grabOwner.x)*grabOwner.facing,dy:playerState.y-grabOwner.y,facing:grabOwner.facing}:undefined});
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


  app.ticker.add(() => {
    const snapshot = isLocalMode
      ? localMatch?.getLatestSnapshot()
      : networkMatchPhase === 'result' ? gameClient.getLatestSnapshot() : null;
    if (snapshot?.matchPhase === 'result') updateRenderers(snapshotToRenderState(snapshot));
  });
  let networkCountdownInterval: ReturnType<typeof setInterval> | null = null;
  const clearNetworkCountdown = (): void => {
    if (networkCountdownInterval !== null) {
      clearInterval(networkCountdownInterval);
      networkCountdownInterval = null;
    }
  };
  let onlineSelectionScreen:string|null=null;
  let onlinePreparationId: number | undefined;
  let onlineLineup: { key: string; ready: Promise<boolean> } | undefined;
  let networkIntroFighters: ResultFighter[] = [];
  const showOnlineFighters=(playerIds:PlayerId[]):void=>{
      onlineSelectionScreen="fighters";
      if (!myPlayerId) return;
      uiManager.showNetworkCharacterSelect(
        roster,
        myPlayerId,
        playerIds,
        (characterId) => gameClient.selectCharacter(characterId),
        () =>
          gameClient.confirmCharacter((result) => {
            if ("error" in result) {
              uiManager.showNetworkCharacterSelectConfirmError(result.error);
            }
          }),
        ()=>gameClient.unconfirmCharacter(result=>{if("error"in result)uiManager.showNetworkCharacterSelectConfirmError(result.error);}),
        ()=>gameClient.selectionBack(result=>{if("error"in result)uiManager.showNetworkCharacterSelectConfirmError(result.error);}),
      );
  };
  let rejoinedArtworkPending = false;
  const gameClient = new GameClient({
    serverUrl: SERVER_URL,
    gamepadSource:new GamepadInputSource(poller,-1,()=>assignmentManager.getAssignments().get(0)?.gamepadIndex??-1),
    onRejoined: () => {
      rejoinedArtworkPending = true;
      hasShownSplashOnThisPageLoad = true;
      app.canvas.style.visibility = "visible";
    },
    onConnected: () => {
      const enterLobby = (): void => {
        const roomCodeFromUrl = new URLSearchParams(window.location.search).get("room");
        if (roomCodeFromUrl) {
          uiManager.showOnlineEntry(roomCodeFromUrl.toUpperCase(), true);
          gameClient.joinRoom(roomCodeFromUrl);
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
      if (isLocalMode) return;
      if (rejoinedArtworkPending && state.players.size > 0) {
        rejoinedArtworkPending = false;
        const fighterIds = [...state.players.values()].map(player => player.characterId ?? "all-rounder");
        void prepareFighters(fighterIds).then(() => {
          if (isLocalMode || !fullBodyPilot) return;
          koPresenter.setAssets(fullBodyPilot);
          for (const renderer of fighterRenderers.values()) {
            renderer.setFullBodyAssets(fullBodyPilot);
          }
        });
      }
      if (!fallbackSettled) {
        void fallbackReady.then(() => {
          if (!isLocalMode) {
            updateRenderers(state);
            updateCamera(state);
            uiManager.updateHUD(state, localPlayerId);
          }
        });
        return;
      }
      updateRenderers(state);
      updateCamera(state);
      uiManager.updateHUD(state, localPlayerId);
    },
    onMatchPhaseChange: (phase: string, winnerId?: PlayerId | null) => {
      if (phase === "countdown") {
        gameplaySfxRouter.reset();
        networkMatchPhase = "countdown";
        clearNetworkCountdown();
        const intro = { stage: selectedStage, fighters: networkIntroFighters };
        let count = 3;
        uiManager.showCountdown(count, intro);
        audioManager.playTrack(selectedStage.musicTrack.replace(".mp3", ""));
        networkCountdownInterval = setInterval(() => {
          if (networkMatchPhase !== "countdown") { clearNetworkCountdown(); return; }
          count--;
          uiManager.showCountdown(Math.max(0, count), intro);
          if (count <= 0) clearNetworkCountdown();
        }, 1000);
      } else if (phase === "match") {
        clearNetworkCountdown();
        const enteredFromCountdown = networkMatchPhase === "countdown";
        networkMatchPhase = "match";
        uiManager.showMatch(enteredFromCountdown);
        audioManager.playTrack(selectedStage.musicTrack.replace(".mp3", ""));
      } else if (phase === "result") {
        clearNetworkCountdown();
        networkMatchPhase = "result";
        const finalSnapshot = gameClient.getLatestSnapshot();
        if (finalSnapshot?.matchPhase === 'result') koPresenter.update(Object.values(finalSnapshot.players));
        camera?.reset();
        gameplaySfxRouter.processMatchResult();
        showResultAfterKO(() => {
          uiManager.showResult(winnerId ?? null, myPlayerId, { stage: selectedStage, fighters: networkIntroFighters });
          audioManager.playTrack("game-over");
        });
      }
    },
    onRoomJoinError: message => uiManager.showRoomJoinError(message),
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
      uiManager.showPauseOverlay(true);
    },
    onResumed: () => {
      uiManager.hidePauseOverlay();
    },
    onCharacterSelectStart: showOnlineFighters,
    onCharacterUpdated: (data) => {
      uiManager.updateNetworkCharacterSelect(
        data.playerId,
        data.characterId,
        data.confirmed,
      );
    },
    onStageChanged:(id,variant)=>{const stage=STAGES.find(s=>s.id===id);if(stage){selectedStage=withStageVisual(stage,variant);setStageBackground(selectedStage);}},
    onSelectionState:(state)=>{
      if (!state.preparation) onlinePreparationId = undefined;
      if (state.phase !== 'STAGE_SELECT') onlineLineup = undefined;
      networkIntroFighters = state.players.map(player => ({
        playerId: player.playerId,
        id: player.characterId,
        displayName: FIGHTER_PRESENTATION[player.characterId]?.name ?? player.characterId,
        slotIndex: player.slotIndex,
      }));
      if(state.phase==='LOBBY'){onlineSelectionScreen='lobby';clearNetworkCountdown();networkMatchPhase='pre-match';uiManager.updateRoomLobby(state.players,state.hostPlayerId);return;}
      if(state.phase==='CHARACTER_SELECT'){
        if(onlineSelectionScreen!=='fighters')showOnlineFighters(state.players.map(p=>p.playerId));
        for(const p of state.players)uiManager.updateNetworkCharacterSelect(p.playerId,p.characterId,p.confirmed);
      }else if(state.phase==='STAGE_SELECT'){
        const stage=withStageVisual(STAGES.find(s=>s.id===state.stageId)??STAGES[0]!,state.stageBackgroundVariant);
        const error=(result:{ok:true}|{error:string})=>{if('error'in result){onlineSelectionScreen=null;gameClient.refreshSelectionState();uiManager.showNetworkCharacterSelectConfirmError(result.error);}};
        const lineup = [...new Set(state.players.map(player => player.characterId as CharacterId))].sort();
        const lineupKey = lineup.join(',');
        if (onlineLineup?.key !== lineupKey) onlineLineup = { key: lineupKey, ready: prepareFighters(lineup, urlParams.get('renderer') !== 'legacy') };
        const preparation = state.preparation;
        if (preparation) {
          onlineSelectionScreen = 'preparing';
          const { id, readyPlayerIds } = preparation;
          uiManager.showNetworkStageWaiting(stage, () => gameClient.unconfirmCharacter(error),
            `Preparing fighter and arena artwork · ${readyPlayerIds.length} / ${state.players.length} ready`);
          if (!myPlayerId || readyPlayerIds.includes(myPlayerId) || onlinePreparationId === id) return;
          onlinePreparationId = id;
          const arenaReady = stageReady;
          void onlineLineup.ready.then(async fightersReady => {
            if (onlinePreparationId !== id || isLocalMode) return;
            if (!fightersReady) {
              uiManager.showNetworkCharacterSelectConfirmError('Fighter artwork could not load. Change fighter to try again.');
              return;
            }
            await arenaReady;
            if (onlinePreparationId !== id || isLocalMode) return;
            koPresenter.setAssets(fullBodyPilot);
            gameClient.markStagePrepared(id, result => {
              if ('error' in result && onlinePreparationId === id) {
                uiManager.showNetworkCharacterSelectConfirmError(result.error + '. Change fighter to try again.');
              }
            });
          });
          return;
        }
        if(state.hostPlayerId===myPlayerId){
          if(onlineSelectionScreen!=='host-stage'){
            onlineSelectionScreen='host-stage';
            uiManager.showStageSelect(STAGES,chosen=>gameClient.selectStage(chosen.id,result=>{if('error'in result){error(result);return;}gameClient.confirmStage(error);},chosen.backgroundVariant),()=>gameClient.selectionBack(error),preview=>gameClient.selectStage(preview.id,error,preview.backgroundVariant),state.stageId);
          }
        }else{onlineSelectionScreen='guest-stage';uiManager.showNetworkStageWaiting(stage,()=>gameClient.unconfirmCharacter(error));}
      }
    },
    onPlayerLeft: (playerId) => {
      if (networkMatchPhase !== "match" && networkMatchPhase !== "result") {
        clearNetworkCountdown();
        networkMatchPhase = "pre-match";
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
    gameClient.joinRoom(code);
  };

  uiManager.onReady = () => {
    if (!isLocalMode) gameClient.markReady();
  };

  uiManager.onPlayAgain = () => {
    uiManager.onMainMenu?.();
    uiManager.showOnlineEntry();
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

  const startLocalMatchWithSeats = async (
    setup: {
      participantCount: 2 | 3 | 4;
      seats: SeatConfig[];
    },
    choices: FighterChoice[],
    practice?:PracticeConfig,
  ): Promise<void> => {
    cleanupLocalMode();
    gameplaySfxRouter.reset();
    dojoMatch=practice;
    if (!practice) lastLocalMatch = { setup, choices, stage: selectedStage };

    if (!camera) {
      camera = new Camera(layers.background);
    }

    const assignments = assignmentManager.getAssignments();
    const controllers: ITickController[] = [];
    const practiceDummy=practice?new PracticeDummy():null;

    // Compute full player ID list before controller loop
    const allPlayerIds: PlayerId[] = [
      "local-p1" as PlayerId,
      ...setup.seats.map((_, k) => `local-p${k + 2}` as PlayerId),
    ];

    const p1Assignment = assignments.get(0);
    const p1GamepadSource = p1Assignment
      ? new GamepadInputSource(poller, p1Assignment.gamepadIndex, () => assignmentManager.getAssignments().get(0)?.gamepadIndex ?? -1)
      : null;
    controllers.push(
      new LocalPlayerController({
        playerId: "local-p1",
        keymap: DEFAULT_KEYMAP_P1,
        slotIndex: 0,
        gamepadSource: p1GamepadSource ?? new GamepadInputSource(poller, -1, () => assignmentManager.getAssignments().get(0)?.gamepadIndex ?? -1),
      }),
    );

    for (let k = 0; k < setup.seats.length; k += 1) {
      const seat = setup.seats[k]!;
      const slotIndex = k + 1;
      const playerId = `local-p${slotIndex + 1}`;
      if (seat.kind === "cpu") {
        if(practiceDummy){controllers.push(practiceDummy);continue;}
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
        ? new GamepadInputSource(poller, assignment.gamepadIndex, () => assignmentManager.getAssignments().get(slotIndex)?.gamepadIndex ?? -1)
        : new GamepadInputSource(poller, -1, () => assignmentManager.getAssignments().get(slotIndex)?.gamepadIndex ?? -1);
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
          practice?dojoSimulationProfile(choice.id):choice.id as CharacterId;
      }
    }

    localMatch = new LocalMatch(controllers, characterIds,selectedStage.id,Boolean(practice));
    if(practice&&practiceDummy){
      const routine=new PracticeRoutine();practiceDummy.routine=routine;practiceOverlay=new PracticeOverlay(layers.game);
      practicePanel=new PracticePanel(practice,practiceDummy,()=>{koPresenter.clear();localMatch?.resetPractice();},()=>uiManager.onPractice?.(),()=>uiManager.getPhase()==='match',{
        match:localMatch,routine,overlay:practiceOverlay,
        previewKO:(kind,side,anchor)=>{
          const player=anchor??localMatch?.getLatestSnapshot()?.players[side==='you'?'local-p1':'local-p2'];
          return player ? koPresenter.preview(kind,dojoSimulationProfile(side==='you'?practice.fighter:practice.dummy),{
            x:player.x,y:player.y,facing:player.facing,exitVelocity:anchor?.exitVelocity,
          }, anchor ? (side==='you'?'local-p1':'local-p2') : undefined) : false;
        },
      },()=>uiManager.getControllerPromptProfile(0));
      uiManager.onPracticeLabActions=()=>practicePanel?.labActions()??[];
      localMatch.onStep=(state,inputs,hits,exits)=>practicePanel?.observe(state,inputs,hits,exits);
      uiManager.onPracticeMenu=()=>uiManager.onPractice?.();uiManager.onPracticeReset=()=>{practicePanel?.reset();uiManager.onResume?.();};
    }
    localMatch.onSnapshot = (snapshot) => {
      const renderState = snapshotToRenderState(snapshot);
      // Select paired hit reactions before drawing this snapshot.
      if (snapshot.hitEvents && snapshot.hitEvents.length > 0) {
        processHitEvents(snapshot.hitEvents, renderState.players);
        for (const hitEvent of snapshot.hitEvents) {
          camera?.shake(hitEvent.knockbackMagnitude);
        }
      }

      updateRenderers(renderState);practiceOverlay?.update(snapshot);
      if(practice)uiManager.hideCombatHUD();else uiManager.updateHUD(renderState, null);
      updateCamera(renderState);

      if (snapshot.matchPhase === "result") {
        gameplaySfxRouter.processMatchResult();
        clearLocalCountdown();
        const fighters = Object.values(snapshot.players).map(player => {
          const id = player.characterId ?? 'all-rounder';
          return {
            playerId: player.id, slotIndex: player.slotIndex, stocks: player.stocks, id,
            displayName: FIGHTER_PRESENTATION[id]?.name ?? id,
          };
        }).sort((a, b) => a.slotIndex - b.slotIndex);
        showResultAfterKO(() => {
          uiManager.showLocalResult(snapshot.winnerId, { stage: selectedStage, fighters });
          audioManager.playTrack("game-over");
        });
      }
    };

    uiManager.hideRoomCode();
    const pendingMatch = localMatch;
    const intro = { stage: selectedStage, fighters: choices.map((fighter, slotIndex) => ({ ...fighter, slotIndex })) };
    if (!practice) uiManager.showCountdown(null, intro);
    setStageBackground(selectedStage);
    await Promise.all([stageReady, prepareFighters(allPlayerIds.map(id => characterIds[id] ?? "all-rounder"))]);
    if (localMatch !== pendingMatch) return;
    koPresenter.setAssets(fullBodyPilot);
    if(practice){uiManager.showMatch();uiManager.hideCombatHUD();audioManager.playTrack(selectedStage.musicTrack.replace('.mp3',''));localMatch.start();return;}
    let count = 3;
    uiManager.showCountdown(count, intro);
    audioManager.playTrack(selectedStage.musicTrack.replace(".mp3", ""));
    localCountdownInterval = window.setInterval(() => {
      count -= 1;
      if (count > 0) {
        uiManager.showCountdown(count, intro);
        return;
      }

      uiManager.showCountdown(0, intro);
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
        const gamepadSlotByIndex = () => new Map(
          Array.from(assignmentManager.getAssignments(), ([slot, assignment]) => [assignment.gamepadIndex, slot]),
        );
        const showFighters = (previousChoices: readonly FighterChoice[] = []): void => {
        uiManager.showCharacterSelect(
          roster,
          result.participantCount,
          (choices) => {
            void prepareFighters(choices.map(choice => choice.id as CharacterId));
            // After character select, show stage select
            uiManager.showStageSelect(
              STAGES,
              (chosenStage) => {
                selectedStage = chosenStage;
                // Update CSS background with new stage
                setStageBackground(chosenStage);
                // Destroy old stage graphics and recreate
                // setStageBackground has already selected matching geometry and art.
                reopenLocalFighters = () => showFighters(choices);
                startLocalMatchWithSeats(result, choices);
              },
              () => {
                // Back restores the previous fighters without replaying setup.
                showFighters(choices);
                uiManager.focusMenuControl('[data-ready-slot="0"]');
              },
            );
          },
          cpuSlotIndices,
          () => {
            // Back from character select → return to setup
            enterLocalPlayFlow();
            uiManager.focusMenuControl('#lps-start-btn');
          },
          gamepadSlotByIndex,
          previousChoices,
        );
        };
        showFighters();
      },
      () => {
        // Back from setup → return to lobby
        if (isLocalMode) {
          isLocalMode = false;
          gameClient.connect();
        }
        uiManager.showLobby();
        uiManager.focusMenuControl('#local-play-btn');
        audioManager.playTrack("main-menu");
      },
    );
  };

  uiManager.onPractice=()=>{
    if(!isLocalMode){isLocalMode=true;gameClient.disconnect();}
    cleanupLocalMode();for(const renderer of fighterRenderers.values())renderer.destroy();fighterRenderers.clear();koPresenter.clear();
    audioManager.playTrack('main-menu');
    let starting=false;
    uiManager.showPracticeSetup(async config=>{
      if(starting)return;
      starting=true;
      const status=document.querySelector('#dojo-art-status');
      if(status)status.textContent='Loading fighter artwork…';
      const ids=[config.fighter,config.dummy].map(dojoSimulationProfile);
      await prepareFighters(ids);
      starting=false;
      if(!status?.isConnected)return;
      if(ids.some(id=>newcomerArtId(id)&&!fullBodyPilot?.characters[id]?.idle)){
        status.textContent='Fighter artwork could not load. Try again or choose a different fighter.';
        return;
      }
      selectedStage=chooseStageVisual(STAGES.find(s=>s.id===config.stageId)??STAGES[0]!);setStageBackground(selectedStage);
      startLocalMatchWithSeats({participantCount:2,seats:[{kind:'cpu',difficulty:'easy'}]},[{id:config.fighter,displayName:config.fighter},{id:config.dummy,displayName:config.dummy}],config);
    },()=>uiManager.onMainMenu?.());
  };
  uiManager.onLocalPlay = () => {
    audioManager.playTrack("main-menu");
    if (!isLocalMode) {
      isLocalMode = true;
      gameClient.disconnect();
    }
    enterLocalPlayFlow();
  };

  const clearLocalResult = () => {
    cleanupLocalMode();
    for (const renderer of fighterRenderers.values()) renderer.destroy();
    fighterRenderers.clear();
    koPresenter.clear();
  };

  uiManager.onLocalPlayAgain = () => {
    const match = lastLocalMatch;
    if (!match) return;
    clearLocalResult();
    selectedStage = match.stage;
    setStageBackground(selectedStage);
    void startLocalMatchWithSeats(match.setup, match.choices);
  };

  uiManager.onLocalChangeFighters = () => {
    if (!reopenLocalFighters) return;
    clearLocalResult();
    reopenLocalFighters();
  };
  const openSettings = (tab: SettingsTab, fromPause: boolean, opener: string): void => {
    const back = () => {
      if (fromPause) uiManager.showPauseOverlay(!isLocalMode);
      else uiManager.showLobby();
      uiManager.focusMenuControl(opener);
    };
    const route = { open: (next: SettingsTab) => openSettings(next, fromPause, opener),
      prompt: uiManager.getPromptRenderer() };
    if (tab === 'controls') uiManager.showControls({ assignmentManager, preferenceStore: store }, fromPause, back, route);
    else if (tab === 'visual') uiManager.showVisualSettings(stageBackdrop, fromPause, back, route);
    else uiManager.showSoundSettings(fromPause, back, route);
    uiManager.focusMenuControl('.settings-workspace h1');
  };
  uiManager.onOpenVisualSettings = () => openSettings('visual', uiManager.getPhase()==='paused', '#visual-settings-btn');
  uiManager.onOpenControls = () => openSettings('controls', false, '#controls-btn');
  uiManager.onOpenSound = () => openSettings('sound', false, '#home-audio-btn');
  uiManager.onResume = () => {
    if (isLocalMode) {
      if (!localMatch?.paused) return;
      localMatch.resume();practicePanel?.setVisible(true);
      uiManager.hidePauseOverlay();
      return;
    }
    // Multiplayer: emit resume to server; overlay hides on game:resumed event
    if (gameClient.isPaused) {
      gameClient.emitResume();
    }
  };

  uiManager.onMainMenu = () => {
    onlinePreparationId = undefined;
    onlineLineup = undefined;
    clearNetworkCountdown();
    const wasLocalMode = isLocalMode;

    // Clean up local match if active (safe no-op when not in local mode)
    cleanupLocalMode();

    // Explicit Main Menu forfeits immediately; retain the connection for another room.
    if (!isLocalMode) {
      try {
        gameClient.leaveRoom();
      } catch (err) {
        console.error(
          "Failed to leave room before returning to main menu:",
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
    fighterRenderers.clear();koPresenter.clear();

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
      e.preventDefault();
      e.stopImmediatePropagation();
      if (!uiManager.cancelPauseExit()) uiManager.onResume?.();
      return;
    }

    // Only allow pause during active match (not countdown, result, etc.)
    if (phase !== "match") return;

    if (isLocalMode && localMatch) {
      // Local mode: pause the local match directly
      localMatch.pause();practicePanel?.setVisible(false);
      uiManager.showPauseOverlay();
    } else if (!isLocalMode) {
      // Multiplayer: emit pause to server; overlay shows on game:paused event
      gameClient.emitPause();
    }
  });

  // Gamepad pause handler - START button only
  if (typeof requestAnimationFrame !== "undefined" && poller) {
    let lastBitsPerGamepad = new Map<number, number>();
    let activePadId: string | undefined;
    const checkPauseButton = (): void => {
      const states = poller.poll();
      for (const index of lastBitsPerGamepad.keys()) if (!states.has(index)) lastBitsPerGamepad.delete(index);
      if (activePadId && !Array.from(states.values()).some(state => state.gamepad?.id === activePadId)) {
        activePadId = undefined;
        uiManager.setActiveController();
      }
      for (const [gpIndex, state] of states) {
        const bits = state.bits;
        const prev = lastBitsPerGamepad.get(gpIndex) ?? 0;
        const pressed = bits & ~prev;

        if (pressed && state.gamepad?.id && activePadId !== state.gamepad.id) {
          activePadId = state.gamepad.id;
          uiManager.setActiveController(activePadId);
        }

        if((pressed&0x2000)&&practicePanel&&uiManager.getPhase()==='match'){
          if(localMatch?.paused)practicePanel.step();else practicePanel.toggleFreeze();
        }
        // START button (0x1000) - pause/unpause
        if (pressed & ULTIMATE_MENU.pause) {
          const phase = uiManager.getPhase();

          // If paused, resume
          if (phase === "paused") {
            if (!uiManager.cancelPauseExit()) uiManager.onResume?.();
          }
          // If in match, pause
          else if (phase === "match") {
            if (isLocalMode && localMatch) {
              localMatch.pause();practicePanel?.setVisible(false);
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
        getArtState?:()=>{packing:string|undefined;players:ReturnType<FighterRenderer["getArtDiagnostics"]>[]};
        getCameraState?: () => { scale: number; x: number; y: number };
      };
    }
  ).__smashDebug = {
    sendInput: (input) => gameClient.debugSendInput(input),
    getSnapshot: getDebugSnapshot,
    ...(import.meta.env.DEV
      ? {
          forcePosition: forceDebugPosition,
          getKOEvents: getDebugKOEvents,
          getCameraState: () => ({ scale: layers.background.scale.x, x: layers.background.x, y: layers.background.y }),
          getArtState:()=>({ko:koPresenter.getDiagnostics(),packing:fullBodyPilot?.packing,players:[...fighterRenderers.values()].map(f=>f.getArtDiagnostics())}),
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
    stageLoading.remove();
    stageBackdrop.destroy();
    cleanupLocalMode();
    sfxManager.stopAll();
    gameClient.disconnect();
  });
}

main().catch(error => {
  console.error(error);
  const loading = document.getElementById('startup-loading');
  if (!loading) return;
  loading.querySelector('p')!.textContent = 'The game could not finish loading. Please try again.';
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.textContent = 'Reload game';
  retry.addEventListener('click', () => window.location.reload());
  loading.appendChild(retry);
});

