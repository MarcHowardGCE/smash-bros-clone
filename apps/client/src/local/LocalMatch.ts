import{INPUT_BITS as B}from'@smash/shared';
/**
 * @fileoverview Local (offline) match runner.
 *
 * Drives a deterministic {@link GameEngine} at 60 Hz using
 * `requestAnimationFrame` + a fixed-timestep accumulator. Each tick, all
 * registered {@link ITickController} instances are polled for input, the
 * engine steps forward, and the resulting {@link StateSnapshot} is broadcast
 * to the `onSnapshot` callback so the renderer can update.
 *
 * Supports pause/resume and exposes `getLatestSnapshot` for immediate reads
 * (e.g. on first render before the first tick fires).
 */
import { GameEngine, type GameEngineOptions } from "@smash/server/engine";
import type { CharacterId, HitEventData, KOEventData, PlayerId, StateSnapshot, GameState, InputEvent } from "@smash/shared";
import type { LocalPlayerController } from "./LocalPlayerController.js";
import type { ITickController } from "./types.js";

export type { GameEngineOptions };

/**
 * Runs a local offline match at 60 Hz using a fixed-timestep rAF loop.
 *
 * Register frame callbacks via `onSnapshot`. Call {@link start} to begin,
 * {@link stop} to cancel the loop, and {@link cleanup} to also destroy all controllers.
 */
export class LocalMatch {
  private readonly engine: GameEngine;
  private readonly controllers: ITickController[];
  private animationFrameId: number | null = null;
  private lastTime = 0;
  private accumulator = 0;
  private readonly TICK_MS = 1000 / 60;
  private latestSnapshot: StateSnapshot | null = null;
  private _paused = false;
  private practiceInputGate=false;
  private playbackSpeed=1;
  get practiceFatigue():number{return this.engine.getPracticeDodgeFatigue()??0;}
  setPracticeFatigue(level:number):boolean{return this.engine.setPracticeDodgeFatigue(level);}
  get practiceSpeed():number{return this.playbackSpeed;}
  get practiceTick():number{return this.engine.getCurrentTick();}

  setPracticeSpawn(spawn: Parameters<GameEngine['setPracticeSpawn']>[0]): void { this.engine.setPracticeSpawn(spawn); }
  getPracticePercent(id: PlayerId): number { return this.engine.getPracticePercent(id); }
  setPracticePercent(id: PlayerId, percent: number): boolean { return this.engine.setPracticePercent(id, percent); }

  onStep: ((state: GameState, inputs: Map<PlayerId, InputEvent | null>, hits: HitEventData[], exits: KOEventData[]) => void) | null = null;
  onSnapshot: ((snapshot: StateSnapshot) => void) | null = null;

  /**
   * Create a local match with the given controllers and optional character overrides.
   *
   * @param controllers - One controller per player (human or AI)
   * @param characterIds - Optional map of playerId to characterId for custom fighters
   */
  constructor(controllers: ITickController[], characterIds?: Partial<Record<PlayerId, CharacterId>>, stageId:string='stage1',private readonly practice=false) {
    this.controllers = controllers;
    const playerIds = controllers.map((c) => c.playerId as PlayerId);
    this.engine = new GameEngine({ playerIds, characterIds,stageId,practice });
    if(practice){this.engine.resetPractice();this.practiceInputGate=true;}
  }

  /** Begin the rAF loop and emit the first snapshot. */
  start(): void {
    this.lastTime = performance.now();
    this.latestSnapshot = this.engine.getSnapshot(this.lastTime, {});
    this.onSnapshot?.(this.latestSnapshot);
    this.loop(this.lastTime);
  }

  /** Cancel the rAF loop without destroying controllers. */
  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /** Stop the loop and call `destroy()` on all controllers. */
  cleanup(): void {
    this.stop();
    for (const controller of this.controllers) {
      controller.destroy();
    }
  }

  get paused(): boolean {
    return this._paused;
  }

  /** Pause the match loop. No-op if already paused. */
  pause(): void {
    if (this._paused) return;
    this._paused = true;
    this.engine.clearActionBuffers();
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /** Resume a paused match. No-op if not paused. Resets the accumulator to avoid a frame spike. */
  resume(): void {
    if (!this._paused) return;
    this._paused = false;
    if(this.practice)this.practiceInputGate=true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.loop(this.lastTime);
  }

  /** Return the most recent snapshot, or null before the first tick. */
  getLatestSnapshot(): StateSnapshot | null {
    return this.latestSnapshot;
  }

  /** Playback scheduling only; physics always advances in unchanged 60 Hz ticks. */
  setPracticeSpeed(speed:number):boolean {
    if(!this.practice||![.25,.5,1].includes(speed))return false;
    this.playbackSpeed=speed;this.accumulator=0;this.lastTime=performance.now();return true;
  }
  freezePractice():boolean {
    if(!this.practice)return false;
    this._paused=true;this.accumulator=0;this.stop();return true;
  }
  runPractice():boolean {
    if(!this.practice||!this._paused)return false;
    this._paused=false;this.accumulator=0;this.lastTime=performance.now();this.loop(this.lastTime);return true;
  }
  stepPractice(fromMenu=false):boolean {
    if(!this.practice||!this._paused)return false;
    if(fromMenu)this.practiceInputGate=true;
    this.tick();return true;
  }
  resetPractice():boolean {const reset=this.engine.resetPractice();if(reset)this.practiceInputGate=true;return reset;}

  forcePosition(playerId: PlayerId, x: number, y: number): boolean {
    return this.engine.forcePosition(playerId, x, y);
  }

  /** Return all KO events since the last {@link GameEngine.clearHitEvents} call. */
  getKOEvents(): KOEventData[] {
    return this.engine.getKOEvents();
  }

  private loop = (now: number): void => {
    this.animationFrameId = requestAnimationFrame(this.loop);
    this.accumulator += (now - this.lastTime)*this.playbackSpeed;
    this.lastTime = now;

    while (!this._paused&&this.accumulator >= this.TICK_MS) {
      this.tick();
      this.accumulator -= this.TICK_MS;
    }
  };

  private tick(): void {
    const currentTick = this.engine.getCurrentTick();
    for (const controller of this.controllers) {
      controller.setTick(currentTick);
    }

    const inputs = new Map(
      this.controllers.map((c) => [c.playerId as PlayerId, c.pollInput()]),
    );
    if(this.practiceInputGate){const human=inputs.get('local-p1');if(!human?.held&&!human?.pressed)this.practiceInputGate=false;const keep=B.LEFT|B.RIGHT|B.UP|B.DOWN|B.SHIELD;inputs.set('local-p1',human?{...human,held:human.held&keep,pressed:0,released:human.released&keep}:null);}
    const state = this.engine.tickGame(inputs);
    const snapshot: StateSnapshot = this.engine.getSnapshot(performance.now(), {});
    if (this.onStep) this.onStep(state, inputs, snapshot.hitEvents, this.practice ? this.engine.getKOEvents() : []);

    for (const controller of this.controllers) {
      controller.observe?.(state);
    }

    this.engine.clearHitEvents();
    this.latestSnapshot = snapshot;
    this.onSnapshot?.(snapshot);

    if (state.matchPhase === 'result') {
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    }
  }
}
