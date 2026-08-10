/**
 * @fileoverview PixiJS render loop wrapper.
 *
 * Wraps the PixiJS {@link Application} ticker so that multiple subsystems can
 * register frame callbacks without coupling directly to the PixiJS API.
 * Each registered {@link RenderFrameCallback} receives the PixiJS `deltaTime`
 * multiplier (1.0 at 60 fps) on every ticker tick.
 */
import type { Application } from 'pixi.js';

/** Callback invoked every render frame. `deltaTime` is the PixiJS ticker multiplier (1.0 = 60 fps). */
export type RenderFrameCallback = (deltaTime: number) => void;

/**
 * Multiplexes the PixiJS ticker into an ordered list of per-frame callbacks.
 *
 * Add render subsystems with {@link addCallback}; remove them cleanly with
 * {@link removeCallback}. The execution order matches insertion order.
 */
export class RenderLoop {
  private callbacks: RenderFrameCallback[] = [];

  /**
   * Attach the render loop to a PixiJS Application's ticker.
   *
   * @param app - PixiJS Application whose ticker drives all registered callbacks
   */
  constructor(app: Application) {
    app.ticker.add((ticker) => {
      for (const cb of this.callbacks) {
        cb(ticker.deltaTime);
      }
    });
  }

  /** Register a callback to be called every frame. */
  addCallback(cb: RenderFrameCallback): void {
    this.callbacks.push(cb);
  }

  /** Unregister a previously added callback. No-op if not found. */
  removeCallback(cb: RenderFrameCallback): void {
    this.callbacks = this.callbacks.filter(c => c !== cb);
  }
}
