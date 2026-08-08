import { GameEngine, type GameEngineOptions } from "@smash/server/engine";
import type { KOEventData, PlayerId, StateSnapshot } from "@smash/shared";
import type { LocalPlayerController } from "./LocalPlayerController.js";
import type { ITickController } from "./types.js";

export type { GameEngineOptions };

export class LocalMatch {
  private readonly engine: GameEngine;
  private readonly controllers: ITickController[];
  private animationFrameId: number | null = null;
  private lastTime = 0;
  private accumulator = 0;
  private readonly TICK_MS = 1000 / 60;
  private latestSnapshot: StateSnapshot | null = null;
  private _paused = false;

  onSnapshot: ((snapshot: StateSnapshot) => void) | null = null;

  constructor(controllers: ITickController[]) {
    this.controllers = controllers;
    const playerIds = controllers.map((c) => c.playerId as PlayerId);
    this.engine = new GameEngine({ playerIds });
  }

  start(): void {
    this.lastTime = performance.now();
    this.latestSnapshot = this.engine.getSnapshot(this.lastTime, {});
    this.onSnapshot?.(this.latestSnapshot);
    this.loop(this.lastTime);
  }

  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  cleanup(): void {
    this.stop();
    for (const controller of this.controllers) {
      controller.destroy();
    }
  }

  get paused(): boolean {
    return this._paused;
  }

  pause(): void {
    if (this._paused) return;
    this._paused = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  resume(): void {
    if (!this._paused) return;
    this._paused = false;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.loop(this.lastTime);
  }

  getLatestSnapshot(): StateSnapshot | null {
    return this.latestSnapshot;
  }

  forcePosition(playerId: PlayerId, x: number, y: number): boolean {
    return this.engine.forcePosition(playerId, x, y);
  }

  getKOEvents(): KOEventData[] {
    return this.engine.getKOEvents();
  }

  private loop = (now: number): void => {
    this.animationFrameId = requestAnimationFrame(this.loop);
    this.accumulator += now - this.lastTime;
    this.lastTime = now;

    while (this.accumulator >= this.TICK_MS) {
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
    const state = this.engine.tickGame(inputs);

    for (const controller of this.controllers) {
      controller.observe?.(state);
    }

    const snapshot: StateSnapshot = this.engine.getSnapshot(performance.now(), {});
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
