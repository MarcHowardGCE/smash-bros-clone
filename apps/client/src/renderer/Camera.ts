/**
 * @fileoverview Dynamic camera that follows all fighters and applies screen shake.
 *
 * Each frame, {@link Camera.update} computes a target scale and position that
 * keeps every player in view with padding, lerps toward that target for smooth
 * easing, and overlays a decaying random shake offset for hit feedback.
 * Call {@link Camera.shake} from a HitEvent handler to trigger the effect.
 */
import type { Container } from 'pixi.js';
const MIN_SCALE = 0.5;
const MAX_SCALE = 1.65;
const SIDE_MARGIN = 40;
const TOP_MARGIN = 110;
const BOTTOM_MARGIN = 72;
const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

// Shake tuning — triggered by HitEvents with knockback above SHAKE_KNOCKBACK_THRESHOLD.
// Skips 0-knockback pummels and weak jabs (~3-5 magnitude). Strong hits (15-40) and
// kill hits (50+) produce proportionally larger shakes clamped to SHAKE_MAX_OFFSET so
// the camera never flings off-screen.
const SHAKE_KNOCKBACK_THRESHOLD = 5;
const SHAKE_MAX_OFFSET = 20;
const SHAKE_MIN_DURATION = 8;
const SHAKE_MAX_DURATION = 15;
const SHAKE_INTENSITY_SCALE = 0.5;
const SHAKE_DURATION_SCALE = 0.25;

/** A world-space position used to compute camera framing. */
export interface PlayerPosition {
  x: number;
  y: number;
  launching?: boolean;
}

/**
 * Smooth-follow camera with proportional screen shake.
 *
 * Wraps a PixiJS Container and adjusts its `scale` and `position` each frame
 * to keep all fighters in view. Shake is triggered by {@link shake} and decays
 * linearly over several frames.
 */
export class Camera {
  private currentScale = 1.0;
  private focusX?: number;
  private focusY?: number;
  private readonly container: Container;

  // Shake state — decaying random offset applied on top of the smooth camera position.
  private shakeIntensity = 0;
  private shakeFramesRemaining = 0;
  private shakeTotalFrames = 0;
  private shakeOffsetX = 0;
  private shakeOffsetY = 0;

  /**
   * Create a camera wrapping the given PixiJS container.
   *
   * @param container - The PixiJS Container whose scale and position this camera controls
   */
  constructor(container: Container) {
    this.container = container;
  }

  /**
   * Trigger camera shake proportional to knockback magnitude.
   * Ignores knockback ≤ SHAKE_KNOCKBACK_THRESHOLD (skips pummels/weak jabs).
   * Later/stronger shakes replace weaker ongoing shakes — no unbounded stacking.
   */
  shake(knockbackMagnitude: number): void {
    if (knockbackMagnitude <= SHAKE_KNOCKBACK_THRESHOLD) return;

    const intensity = Math.min(
      knockbackMagnitude * SHAKE_INTENSITY_SCALE,
      SHAKE_MAX_OFFSET,
    );
    const duration = Math.min(
      SHAKE_MAX_DURATION,
      Math.max(SHAKE_MIN_DURATION, Math.floor(knockbackMagnitude * SHAKE_DURATION_SCALE)),
    );

    // Stronger or equal intensity replaces current; weaker shake during active shake is ignored.
    if (intensity >= this.shakeIntensity || this.shakeFramesRemaining === 0) {
      this.shakeIntensity = intensity;
      this.shakeTotalFrames = duration;
      this.shakeFramesRemaining = duration;
    }
  }

  /** Expose current shake offset for testing / external consumers. */
  getShakeOffset(): { x: number; y: number } {
    return { x: this.shakeOffsetX, y: this.shakeOffsetY };
  }

  /**
   * Update camera position and scale to frame all players.
   * Call once per render frame.
   *
   * @param positions - Current world positions of all active fighters
   * @param viewportWidth - Canvas width in pixels
   * @param viewportHeight - Canvas height in pixels
   */
  update(positions: PlayerPosition[], viewportWidth: number, viewportHeight: number): void {
    // Advance shake decay every frame regardless of player count so the effect
    // doesn't freeze when the position list is momentarily empty.
    this.advanceShake();

    if (positions.length === 0) return;

    const minX = Math.min(...positions.map(p => p.x));
    const maxX = Math.max(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    const maxY = Math.max(...positions.map(p => p.y));
    const spanX = maxX - minX;
    const spanY = maxY - minY;

    // Close fighters get a tighter shot. Wide and offstage positions can use the whole viewport.
    const targetScale = clamp(Math.min(
      viewportWidth / (spanX + 320),
      viewportHeight / (spanY + 300),
    ), MIN_SCALE, MAX_SCALE);
    // Launches influence the framing target without imposing a one-frame fit.
    const stable = positions.filter(position => !position.launching);
    const stableMinX = Math.min(...stable.map(p => p.x));
    const stableMaxX = Math.max(...stable.map(p => p.x));
    const stableMinY = Math.min(...stable.map(p => p.y));
    const stableMaxY = Math.max(...stable.map(p => p.y));
    const visibleScale = stable.length ? Math.min(
      (viewportWidth - 2 * SIDE_MARGIN) / Math.max(stableMaxX - stableMinX, 1),
      (viewportHeight - TOP_MARGIN - BOTTOM_MARGIN) / Math.max(stableMaxY - stableMinY, 1),
    ) : Infinity;
    const zoomEase = targetScale < this.currentScale ? 0.18 : 0.10;
    this.currentScale = Math.min(visibleScale, this.currentScale + (targetScale - this.currentScale) * zoomEase);
    const scale = this.currentScale;
    const anchorX = viewportWidth / 2;
    const anchorY = viewportHeight * 0.57;

    // Ease the focus in world space so zooming cannot shove it sideways.
    const focusX = this.focusX ?? anchorX;
    const focusY = this.focusY ?? anchorY;
    const nextX = focusX + ((minX + maxX) / 2 - focusX) * 0.16;
    const nextY = focusY + ((minY + maxY) / 2 - focusY) * 0.16;
    const x = anchorX - nextX * scale;
    const y = anchorY - nextY * scale;
    const framedX = stable.length ? clamp(x,
      SIDE_MARGIN - stableMinX * scale, viewportWidth - SIDE_MARGIN - stableMaxX * scale) : x;
    const framedY = stable.length ? clamp(y,
      TOP_MARGIN - stableMinY * scale, viewportHeight - BOTTOM_MARGIN - stableMaxY * scale) : y;
    this.focusX = (anchorX - framedX) / scale;
    this.focusY = (anchorY - framedY) / scale;

    this.container.scale.set(scale);
    this.container.position.set(framedX + this.shakeOffsetX, framedY + this.shakeOffsetY);
  }

  /** Reset camera to default scale and position, clearing any active shake. */
  reset(): void {
    this.currentScale = 1.0;
    this.focusX = undefined;
    this.focusY = undefined;
    this.shakeIntensity = 0;
    this.shakeFramesRemaining = 0;
    this.shakeTotalFrames = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
    this.container.scale.set(1.0);
    this.container.position.set(0, 0);
  }

  /** Compute next shake offset with linear decay, or zero out when finished. */
  private advanceShake(): void {
    if (this.shakeFramesRemaining > 0) {
      const decay = this.shakeFramesRemaining / this.shakeTotalFrames;
      const amplitude = this.shakeIntensity * decay;
      this.shakeOffsetX = (Math.random() * 2 - 1) * amplitude;
      this.shakeOffsetY = (Math.random() * 2 - 1) * amplitude;
      this.shakeFramesRemaining--;
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
      this.shakeIntensity = 0;
    }
  }
}
