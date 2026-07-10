import type { Application } from 'pixi.js';

export type RenderFrameCallback = (deltaTime: number) => void;

export class RenderLoop {
  private callbacks: RenderFrameCallback[] = [];

  constructor(app: Application) {
    app.ticker.add((ticker) => {
      for (const cb of this.callbacks) {
        cb(ticker.deltaTime);
      }
    });
  }

  addCallback(cb: RenderFrameCallback): void {
    this.callbacks.push(cb);
  }

  removeCallback(cb: RenderFrameCallback): void {
    this.callbacks = this.callbacks.filter(c => c !== cb);
  }
}
