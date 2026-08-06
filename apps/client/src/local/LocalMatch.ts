import { GameEngine, type GameEngineOptions } from "@smash/server/engine";
import type { PlayerId, StateSnapshot } from "@smash/shared";
import type { LocalPlayerController } from "./LocalPlayerController.js";

export type { GameEngineOptions };

export class LocalMatch {
  private readonly engine: GameEngine;
  private readonly controllers: LocalPlayerController[];
  private animationFrameId: number | null = null;
  private lastTime = 0;
  private accumulator = 0;
  private readonly TICK_MS = 1000 / 60;
  private latestSnapshot: StateSnapshot | null = null;

  onSnapshot: ((snapshot: StateSnapshot) => void) | null = null;

  constructor(controllers: LocalPlayerController[]) {
    this.controllers = controllers;
    const playerIds = controllers.map((c) => c.playerId as PlayerId);
    this.engine = new GameEngine({ playerIds });
  }

  start(): void {
    this.lastTime = performance.now();
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

  getLatestSnapshot(): StateSnapshot | null {
    return this.latestSnapshot;
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

    const snapshot: StateSnapshot = this.engine.getSnapshot(performance.now(), {});
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
