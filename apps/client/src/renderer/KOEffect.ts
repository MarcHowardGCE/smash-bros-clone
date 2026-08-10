/**
 * @fileoverview KO tumble and star-burst visual effect.
 *
 * Plays a 40-frame animation when a fighter is knocked out: the fighter
 * container spins two full rotations while 8 star particles radiate outward
 * and fade. The caller drives the effect by calling {@link KOEffect.tick}
 * each frame and applying the returned rotation value to the fighter container.
 */
import { Container, Graphics } from 'pixi.js';

/** Duration of the KO effect in frames. */
export const KO_EFFECT_DURATION = 40;

/** Rotation per frame in radians: 360° / 20 frames = 18°/frame. */
const ROTATION_PER_FRAME = (Math.PI * 2) / 20;

/** Number of star particles. */
const STAR_COUNT = 8;

/** Angle spacing between stars: 360° / 8 = 45°. */
const STAR_ANGLE_STEP = (Math.PI * 2) / STAR_COUNT;

/** How far stars travel outward over the full duration. */
const STAR_MAX_RADIUS = 60;

/** Size of each star particle. */
const STAR_SIZE = 5;

/**
 * KO tumble + star burst effect.
 *
 * On activation:
 * - Fighter rotates 360° every 20 frames (18°/frame) for 40 frames total (2 full spins)
 * - 8 star particles radiate outward at 45° spacing
 * - Stars fade linearly from alpha 1.0 → 0.0 over 40 frames
 * - Effect self-destructs after 40 frames
 *
 * 40 frames @ 60 Hz = 0.67s — well within the 2-second respawn delay.
 */
export class KOEffect {
  readonly container: Container;
  private readonly stars: Graphics[] = [];
  private frame = 0;
  private _active = false;

/**
 * Attach the KO effect container to a parent and control it via {@link start},
 * {@link tick}, and {@link stop}.
 *
 * @param parentContainer - Fighter's root Container; the effect container is added as a child
 */
  /**
   * Attach the KO effect container to a parent and control it via {@link start},
   * {@link tick}, and {@link stop}.
   *
   * @param parentContainer - Fighter's root Container; the effect container is added as a child
   */
  constructor(parentContainer: Container) {
    this.container = new Container();
    parentContainer.addChild(this.container);

    for (let i = 0; i < STAR_COUNT; i++) {
      const star = new Graphics();
      this.drawStar(star);
      star.visible = false;
      this.container.addChild(star);
      this.stars.push(star);
    }
  }

  get active(): boolean {
    return this._active;
  }

  get currentFrame(): number {
    return this.frame;
  }

  /** Start the KO effect. Resets state if already active. */
  start(): void {
    this.frame = 0;
    this._active = true;
    for (const star of this.stars) {
      star.visible = true;
      star.alpha = 1.0;
      star.x = 0;
      star.y = 0;
    }
  }

  /**
   * Advance one frame. Returns the cumulative rotation (radians) to apply
   * to the fighter container, or 0 if inactive.
   */
  tick(): number {
    if (!this._active) return 0;

    this.frame++;
    const progress = this.frame / KO_EFFECT_DURATION; // 0→1

    // Update star positions and alpha
    for (let i = 0; i < STAR_COUNT; i++) {
      const star = this.stars[i];
      if (!star) continue;
      const angle = i * STAR_ANGLE_STEP;
      const dist = progress * STAR_MAX_RADIUS;
      star.x = Math.cos(angle) * dist;
      star.y = Math.sin(angle) * dist;
      star.alpha = 1.0 - progress;
    }

    // End condition
    if (this.frame >= KO_EFFECT_DURATION) {
      this.stop();
    }

    // Cumulative rotation: 18°/frame
    return this.frame * ROTATION_PER_FRAME;
  }

  /** Stop and hide the effect. */
  stop(): void {
    this._active = false;
    for (const star of this.stars) {
      star.visible = false;
    }
  }

  destroy(): void {
    this.stop();
    this.container.destroy({ children: true });
  }

  private drawStar(g: Graphics): void {
    // 4-pointed star shape
    const s = STAR_SIZE;
    g.clear();
    g.moveTo(0, -s);
    g.lineTo(s * 0.3, -s * 0.3);
    g.lineTo(s, 0);
    g.lineTo(s * 0.3, s * 0.3);
    g.lineTo(0, s);
    g.lineTo(-s * 0.3, s * 0.3);
    g.lineTo(-s, 0);
    g.lineTo(-s * 0.3, -s * 0.3);
    g.closePath();
    g.fill({ color: 0xffff00 });
    g.stroke({ color: 0xffa500, width: 1 });
  }
}
