/**
 * @fileoverview Procedural impact spark effect.
 *
 * A radial burst of small white circles that radiate outward from a hit
 * position and fade over {@link SPARK_DURATION} frames. The caller manages
 * the lifecycle: create once, call {@link ImpactSpark.start} on each hit,
 * call {@link ImpactSpark.tick} every render frame, and check
 * {@link ImpactSpark.done} to know when to remove the container from the scene.
 */
import { Container, Graphics } from 'pixi.js';

/** Number of particles in the radial burst. */
const PARTICLE_COUNT = 6;

/** Duration of the burst in render frames (10 frames = ~167ms at 60fps). */
const SPARK_DURATION = 10;

/** Maximum outward travel distance in pixels. */
const MAX_RADIUS = 40;

/** Radius of each particle circle. */
const PARTICLE_SIZE = 3;

/** Angle step between particles: 360deg / PARTICLE_COUNT. */
const ANGLE_STEP = (Math.PI * 2) / PARTICLE_COUNT;

/**
 * Procedural impact spark: a radial burst of small white circles
 * that radiate outward from the hit position and fade over SPARK_DURATION frames.
 *
 * Lifecycle:
 *   1. Caller creates an ImpactSpark and calls start(worldX, worldY)
 *   2. Caller adds spark.container to the scene (game layer)
 *   3. Each render frame, caller calls tick()
 *   4. When done === true, caller removes container from scene and calls destroy()
 */
export class ImpactSpark {
  readonly container: Container;
  private readonly particles: Graphics[] = [];
  private frame = 0;
  private _active = false;
  private _done = false;

  constructor() {
    this.container = new Container();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = new Graphics();
      p.circle(0, 0, PARTICLE_SIZE);
      p.fill({ color: 0xffffff });
      p.stroke({ color: 0x000000, width: 1 });
      p.visible = false;
      this.container.addChild(p);
      this.particles.push(p);
    }
  }

  get active(): boolean {
    return this._active;
  }

  get done(): boolean {
    return this._done;
  }

  /** Position the spark and begin the burst animation. */
  start(worldX: number, worldY: number): void {
    this.container.x = worldX;
    this.container.y = worldY;
    this.frame = 0;
    this._active = true;
    this._done = false;

    for (const p of this.particles) {
      p.visible = true;
      p.alpha = 1.0;
      p.x = 0;
      p.y = 0;
    }
  }

  /** Advance one render frame. Call once per requestAnimationFrame tick. */
  tick(): void {
    if (!this._active) return;

    this.frame++;
    const progress = this.frame / SPARK_DURATION; // 0 → 1

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i]!;
      const angle = i * ANGLE_STEP;
      const dist = progress * MAX_RADIUS;
      p.x = Math.cos(angle) * dist;
      p.y = Math.sin(angle) * dist;
      p.alpha = 1.0 - progress;
    }

    if (this.frame >= SPARK_DURATION) {
      this._active = false;
      this._done = true;
      for (const p of this.particles) {
        p.visible = false;
      }
    }
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
