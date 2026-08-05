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

export interface PlayerPosition {
  x: number;
  y: number;
}

export class Camera {
  private currentScale = 1.0;
  private currentX = 0;
  private currentY = 0;
  private readonly container: Container;

  constructor(container: Container) {
    this.container = container;
  }

  update(positions: PlayerPosition[], viewportWidth: number, viewportHeight: number): void {
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
    this.container.position.set(this.currentX, this.currentY);
  }

  reset(): void {
    this.currentScale = 1.0;
    this.currentX = 0;
    this.currentY = 0;
    this.container.scale.set(1.0);
    this.container.position.set(0, 0);
  }
}
