/**
 * @fileoverview Dynamic camera that follows all fighters and applies screen shake.
 *
 * Each frame, {@link Camera.update} computes a target scale and position that
 * keeps every player in view with padding, lerps toward that target for smooth
 * easing, and overlays a decaying random shake offset for hit feedback.
 * Call {@link Camera.shake} from a HitEvent handler to trigger the effect.
 */
import type { Container } from 'pixi.js';
import { STAGE } from '@smash/shared';

// Camera follows all players and zooms to keep everyone in frame.
// PADDING: extra space beyond the outermost players so fighters near the edge
//          aren't right at the viewport border.
// MIN_SCALE / MAX_SCALE: prevent the camera from zooming so far out the stage is
//                        tiny, or so far in that distant players go off-screen.
// LERP_SPEED: smoothing factor (0–1) applied each frame; 0.1 gives gentle easing
//             without feeling sluggish during fast chases.
const PADDING = 200;
const MIN_SCALE = 0.4;
const MAX_SCALE = 1.0;
const LERP_SPEED = 0.1;

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
  private currentX = 0;
  private currentY = 0;
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

    const minX = Math.min(...positions.map(p => p.x)) - PADDING;
    const maxX = Math.max(...positions.map(p => p.x)) + PADDING;
    const minY = Math.min(...positions.map(p => p.y)) - PADDING;
    const maxY = Math.max(...positions.map(p => p.y)) + PADDING;

    const boxWidth = Math.max(maxX - minX, 1);
    const boxHeight = Math.max(maxY - minY, 1);

    // Compute two candidate scales: one that fits all players (scaleForBox) and one
    // that fits the full stage (scaleForStage). Using the minimum of both prevents the
    // camera from zooming in past the point where the blast zones would be off-screen,
    // even if all players are clustered in one corner.
    const scaleForBox = Math.min(viewportWidth / boxWidth, viewportHeight / boxHeight);
    const scaleForStage = Math.min(viewportWidth / STAGE.WIDTH, viewportHeight / STAGE.HEIGHT);
    const targetScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.min(scaleForBox, scaleForStage)));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const halfVW = viewportWidth / (2 * targetScale);
    const halfVH = viewportHeight / (2 * targetScale);

    const clampedCenterX = Math.max(halfVW, Math.min(STAGE.WIDTH - halfVW, centerX));
    const clampedCenterY = Math.max(halfVH, Math.min(STAGE.HEIGHT - halfVH, centerY));

    const targetX = viewportWidth / 2 - clampedCenterX * targetScale;
    const targetY = viewportHeight / 2 - clampedCenterY * targetScale;

    this.currentScale += (targetScale - this.currentScale) * LERP_SPEED;
    this.currentX += (targetX - this.currentX) * LERP_SPEED;
    this.currentY += (targetY - this.currentY) * LERP_SPEED;

    this.container.scale.set(this.currentScale);
    this.container.position.set(
      this.currentX + this.shakeOffsetX,
      this.currentY + this.shakeOffsetY,
    );
  }

  /** Reset camera to default scale and position, clearing any active shake. */
  reset(): void {
    this.currentScale = 1.0;
    this.currentX = 0;
    this.currentY = 0;
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
