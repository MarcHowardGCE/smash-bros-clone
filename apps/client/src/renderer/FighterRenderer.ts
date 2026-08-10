/**
 * @fileoverview Part-based fighter renderer.
 *
 * Composes the six fighter body parts (head, torso, 4 limbs) into a single
 * PixiJS Container. Each frame, {@link FighterRenderer.update} drives position,
 * direction, invincibility flicker, hit-flash tint, shield bubble, and the
 * KO tumble + star-burst effect. Geometry is delegated to an {@link IPartRenderer}
 * implementation (currently {@link PolygonPartRenderer}).
 */
import { Container, Graphics } from 'pixi.js';
import type { PlayerState, CharacterId } from '@smash/shared';
import { PHYSICS, lerp } from '@smash/shared';
import { getAnimationPose } from './animations.js';
import { KOEffect } from './KOEffect.js';
import { createPartRenderer, slotToPattern } from './parts/index.js';
import { getPartTransforms } from './parts/poseAdapter.js';
import type { FighterPart, IPartRenderer, PatternDescriptor } from './parts/IPartRenderer.js';

type RenderableFighterState = Pick<
  PlayerState,
  'x' | 'y' | 'facing' | 'isInvincible' | 'isKnockedOut' | 'isShielding' | 'shieldHealth' | 'state' | 'stateFrame' | 'slotIndex' | 'currentMoveId'
>;

/** Hit flash: golden-yellow tint on white parts for 4 frames (67ms at 60fps). */
const HIT_FLASH_FRAMES = 4;
const HIT_FLASH_TINT = 0xffdd44;
const DEFAULT_TINT = 0xffffff;

/** Shield bubble visual constants. */
const SHIELD_BUBBLE_RADIUS = 36;
const SHIELD_BUBBLE_OFFSET_Y = -8;
const SHIELD_BUBBLE_ALPHA = 0.4;
const SHIELD_COLOR_HEALTHY = 0x4488ff;
const SHIELD_COLOR_CRITICAL = 0xff2222;

/** Draw order for iterating parts (back-to-front). */
const PART_DRAW_ORDER: readonly FighterPart[] = [
  'LEG_L', 'LEG_R', 'BODY', 'ARM_L', 'ARM_R', 'HEAD',
] as const;

/** Linearly interpolate between two RGB hex colors. */
function lerpColor(a: number, b: number, t: number): number {
  const rA = (a >> 16) & 0xff;
  const gA = (a >> 8) & 0xff;
  const bA = a & 0xff;
  const rB = (b >> 16) & 0xff;
  const gB = (b >> 8) & 0xff;
  const bB = b & 0xff;
  const r = Math.round(lerp(rA, rB, t));
  const g = Math.round(lerp(gA, gB, t));
  const blue = Math.round(lerp(bA, bB, t));
  return (r << 16) | (g << 8) | blue;
}

/**
 * Renders a single fighter as a part-based polygon figure.
 *
 * Owns the fighter's PixiJS Container hierarchy: part geometry, shield bubble,
 * and KO effect. Call {@link update} once per render frame with the latest
 * {@link PlayerState} slice to keep visuals in sync.
 */
export class FighterRenderer {
  readonly container: Container;
  private readonly partRenderer: IPartRenderer;
  private readonly pattern: PatternDescriptor;
  private readonly shieldBubble: Graphics;
  private readonly koEffect: KOEffect;
  private slotIndex: number;
  private characterId?: CharacterId;
  private lastState: string = '';
  private lastFrame: number = -1;
  private wasKnockedOut = false;
  private hitFlashFrames = 0;

  /**
   * Create a fighter renderer and attach it to the parent container.
   *
   * @param parentContainer - PixiJS Container to add this fighter's root to
   * @param slotIndex - Player slot (0-3), determines fill pattern
   * @param characterId - Optional character override for custom geometry/animations
   */
  constructor(parentContainer: Container, slotIndex: number, characterId?: CharacterId) {
    this.slotIndex = slotIndex;
    this.characterId = characterId;
    this.container = new Container();
    this.partRenderer = createPartRenderer('polygon', slotIndex, characterId);
    this.pattern = slotToPattern(slotIndex);
    this.container.addChild(this.partRenderer.container);

    // Shield bubble overlay — rendered on top of fighter parts
    this.shieldBubble = new Graphics();
    this.shieldBubble.visible = false;
    this.container.addChild(this.shieldBubble);

    // KO tumble + star burst effect
    this.koEffect = new KOEffect(this.container);

    parentContainer.addChild(this.container);
  }

  /**
   * Sync all visuals to the latest player state.
   * Call once per render frame.
   *
   * @param player - Minimal player state slice needed for rendering
   */
  update(player: RenderableFighterState): void {
    this.container.x = player.x;
    this.container.y = player.y;
    this.container.scale.x = player.facing; // flip for direction

    // Invincibility flicker
    this.container.alpha = (player.isInvincible && Math.floor(Date.now() / 100) % 2 === 0) ? 0.4 : 1.0;

    // KO tumble/star effect
    this.updateKOEffect(player);

    // Hit flash tint (must tick every frame, independent of state change)
    this.updateHitFlash();

    // Shield bubble: show/hide immediately based on isShielding
    this.updateShieldBubble(player);

    // Only redraw if state or frame changed
    if (player.state === this.lastState && player.stateFrame === this.lastFrame) return;
    this.lastState = player.state;
    this.lastFrame = player.stateFrame;

    this.redraw(player);
  }

  /** Get the display object for a specific part (for Wave 3 flash effects). */
  getPart(part: FighterPart): Container {
    return this.partRenderer.getDisplayObject(part);
  }

  /**
   * Start the hit flash effect. Tints the fighter golden-yellow for HIT_FLASH_FRAMES.
   * Rapid successive hits restart the timer (no stacking).
   */
  startHitFlash(): void {
    this.hitFlashFrames = HIT_FLASH_FRAMES;
    this.partRenderer.container.tint = HIT_FLASH_TINT;
  }

  /** Tick the hit flash countdown. Resets tint when timer expires. */
  private updateHitFlash(): void {
    if (this.hitFlashFrames <= 0) return;
    this.hitFlashFrames--;
    if (this.hitFlashFrames === 0) {
      this.partRenderer.container.tint = DEFAULT_TINT;
    }
  }

  private updateKOEffect(player: RenderableFighterState): void {
    if (player.isKnockedOut && !this.wasKnockedOut) {
      // Rising edge: KO just happened — start the effect
      this.koEffect.start();
    } else if (!player.isKnockedOut && this.wasKnockedOut) {
      // Falling edge: respawned — stop effect and reset rotation
      this.koEffect.stop();
      this.partRenderer.container.rotation = 0;
    }
    this.wasKnockedOut = player.isKnockedOut;

    // Tick the effect each frame while active
    if (this.koEffect.active) {
      const rotation = this.koEffect.tick();
      this.partRenderer.container.rotation = rotation;
    }
  }

  private updateShieldBubble(player: RenderableFighterState): void {
    if (!player.isShielding) {
      this.shieldBubble.visible = false;
      return;
    }

    // Interpolate color: healthy (blue) → critical (red) as health drops
    const t = 1 - player.shieldHealth / PHYSICS.SHIELD_MAX_HEALTH;
    const color = lerpColor(SHIELD_COLOR_HEALTHY, SHIELD_COLOR_CRITICAL, t);

    this.shieldBubble.clear();
    this.shieldBubble.circle(0, SHIELD_BUBBLE_OFFSET_Y, SHIELD_BUBBLE_RADIUS);
    this.shieldBubble.fill({ color, alpha: SHIELD_BUBBLE_ALPHA });
    this.shieldBubble.visible = true;
  }

  private redraw(player: RenderableFighterState): void {
    const pose = getAnimationPose(player.state, player.stateFrame, player.currentMoveId, this.characterId);
    const transforms = getPartTransforms(pose, this.slotIndex);

    for (const part of PART_DRAW_ORDER) {
      this.partRenderer.draw(part, transforms[part], this.pattern);
    }
  }

  /** Release PixiJS resources. Call when the fighter leaves the scene. */
  destroy(): void {
    this.container.destroy({ children: true });
  }
}
