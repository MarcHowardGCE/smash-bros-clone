/**
 * @fileoverview Polygon-based fighter part renderer.
 *
 * Implements {@link IPartRenderer} using PixiJS {@link Graphics} primitives.
 * Each of the six body parts (head, torso, 4 limbs) gets its own Graphics
 * child inside a shared Container. Parts are drawn in back-to-front z-order
 * on every call to {@link PolygonPartRenderer.draw}.
 *
 * Character-specific geometry (Lincoln's hat, beard, coattails) is branched
 * on `characterId` inside the private draw helpers.
 */
import { Container, Graphics } from 'pixi.js';
import type { CharacterId } from '@smash/shared';
import type {
  FighterPart,
  IPartRenderer,
  PartTransform,
  PatternDescriptor,
} from './IPartRenderer.js';

// B&W colors (must match FighterRenderer.ts)
const COLOR_WHITE = 0xffffff;
const COLOR_BLACK = 0x000000;
const OUTLINE_WIDTH = 2;

// Fighter dimensions (must match FighterRenderer.ts and poseAdapter.ts)
const BODY_RADIUS = 22;
const HEAD_RADIUS = 14;
const ARM_LENGTH = 22;
const ARM_WIDTH = 7;
const LEG_LENGTH = 24;
const LEG_WIDTH = 8;

/**
 * Renders fighter parts as polygon geometry using separate PixiJS Graphics per part.
 * Reproduces the exact visual output of the original FighterRenderer.
 *
 * Child order in container (back-to-front):
 *   LEG_L, LEG_R, BODY, ARM_L, ARM_R, HEAD
 */
export class PolygonPartRenderer implements IPartRenderer {
  private readonly parts: Record<FighterPart, Graphics>;
  private readonly slotIndex: number;
  private readonly characterId?: CharacterId;

  /** Root container holding all 6 part Graphics in z-order. */
  readonly container: Container;

/**
 * Create a polygon renderer for a fighter slot.
 *
 * @param slotIndex - Player slot (0-3), determines fill pattern via {@link slotToPattern}
 * @param characterId - Optional character override for Lincoln-specific geometry
 */
  constructor(slotIndex: number, characterId?: CharacterId) {
    this.slotIndex = slotIndex;
    this.characterId = characterId;
    this.container = new Container();

    // Create 6 Graphics children — one per FighterPart.
    // Add in draw-order (back-to-front) matching FighterRenderer.redraw().
    this.parts = {
      LEG_L: new Graphics(),
      LEG_R: new Graphics(),
      BODY: new Graphics(),
      ARM_L: new Graphics(),
      ARM_R: new Graphics(),
      HEAD: new Graphics(),
    };

    // Add children in z-order
    this.container.addChild(this.parts.LEG_L);
    this.container.addChild(this.parts.LEG_R);
    this.container.addChild(this.parts.BODY);
    this.container.addChild(this.parts.ARM_L);
    this.container.addChild(this.parts.ARM_R);
    this.container.addChild(this.parts.HEAD);
  }

  draw(part: FighterPart, transform: PartTransform, pattern: PatternDescriptor): void {
    const g = this.parts[part];
    g.clear();

    // Apply transform to the Graphics container
    g.x = transform.x;
    g.y = transform.y;
    g.rotation = transform.rotation;

    switch (part) {
      case 'BODY':
        this.drawBody(g, transform.scaleX, transform.scaleY, pattern);
        break;
      case 'HEAD':
        this.drawHead(g);
        break;
      case 'ARM_L':
      case 'ARM_R':
        this.drawLimb(g, ARM_LENGTH, ARM_WIDTH);
        break;
      case 'LEG_L':
      case 'LEG_R':
        this.drawLimb(g, LEG_LENGTH, LEG_WIDTH);
        break;
    }
  }

  getDisplayObject(part: FighterPart): Container {
    return this.parts[part];
  }

  /**
   * Draw pentagon body with pattern fill.
   * Geometry drawn at local origin; scale applied via vertex positions
   * (matching FighterRenderer.drawBody which uses bw/bh directly).
   */
  private drawBody(
    g: Graphics,
    scaleX: number,
    scaleY: number,
    pattern: PatternDescriptor
  ): void {
    const bw = BODY_RADIUS * scaleX;
    const bh = BODY_RADIUS * scaleY;
    const sides = 5;
    const startAngle = -Math.PI / 2;

    // Reset container scale — vertex positions already account for body scale
    g.scale.x = 1;
    g.scale.y = 1;

    // Draw pentagon path
    g.moveTo(Math.cos(startAngle) * bw, Math.sin(startAngle) * bh);
    for (let i = 1; i <= sides; i++) {
      const angle = startAngle + (i * Math.PI * 2) / sides;
      g.lineTo(Math.cos(angle) * bw, Math.sin(angle) * bh);
    }
    g.closePath();

    // Fill with pattern
    this.applyBodyPattern(g, bw, bh, pattern);

    // Always draw outline (re-path for outline stroke)
    g.moveTo(Math.cos(startAngle) * bw, Math.sin(startAngle) * bh);
    for (let i = 1; i <= sides; i++) {
      const angle = startAngle + (i * Math.PI * 2) / sides;
      g.lineTo(Math.cos(angle) * bw, Math.sin(angle) * bh);
    }
    g.closePath();
    g.stroke({ color: COLOR_BLACK, width: OUTLINE_WIDTH });

    // Lincoln coattail flares at bottom vertices
    if (this.characterId === 'abe-lincoln') {
      this.drawLincolnCoattails(g, bw, bh, startAngle);
    }
  }

  /**
   * Apply the pattern fill to the body.
   * Reproduces FighterRenderer.drawBody switch exactly.
   */
  private applyBodyPattern(
    g: Graphics,
    bw: number,
    bh: number,
    pattern: PatternDescriptor
  ): void {
    switch (pattern.kind) {
      case 'solid':
        g.fill({ color: pattern.primaryColor });
        break;

      case 'stripes':
        // White fill + horizontal stripe overlay
        g.fill({ color: pattern.primaryColor });
        for (let y = -bh; y < bh; y += 8) {
          g.moveTo(-bw, y);
          g.lineTo(bw, y);
        }
        g.stroke({ color: pattern.secondaryColor, width: 1.5, alpha: 0.5 });
        break;

      case 'dots':
        // White fill + dot overlay
        g.fill({ color: pattern.primaryColor });
        for (let dy = -bh + 6; dy < bh; dy += 10) {
          for (let dx = -bw + 6; dx < bw; dx += 10) {
            g.circle(dx, dy, 2);
          }
        }
        g.fill({ color: pattern.secondaryColor, alpha: 0.6 });
        break;

      case 'crosshatch':
        // White fill + diagonal crosshatch
        g.fill({ color: pattern.primaryColor });
        for (let d = -bw * 2; d < bw * 2; d += 9) {
          g.moveTo(d, -bh);
          g.lineTo(d + bh * 2, bh);
          g.moveTo(d, -bh);
          g.lineTo(d - bh * 2, bh);
        }
        g.stroke({ color: pattern.secondaryColor, width: 1, alpha: 0.45 });
        break;
    }
  }

  /**
   * Draw head as a circle at local origin.
   * Reproduces FighterRenderer.drawHead exactly.
   */
  private drawHead(g: Graphics): void {
    // Circle at local (0,0) — container position provides offset
    g.circle(0, 0, HEAD_RADIUS);
    g.fill({ color: COLOR_WHITE });
    g.stroke({ color: COLOR_BLACK, width: OUTLINE_WIDTH });

    // Eyes (two small dots) — same offsets as original (+4, -3) relative to center
    g.circle(4, -3, 2.5);
    g.fill({ color: COLOR_BLACK });

    // Lincoln accessories: stovepipe hat + beard
    if (this.characterId === 'abe-lincoln') {
      this.drawLincolnHat(g);
      this.drawLincolnBeard(g);
    }
  }

  /** Stovepipe hat: tall rectangle crown + wider trapezoid brim. */
  private drawLincolnHat(g: Graphics): void {
    const hatBottom = -HEAD_RADIUS; // top of head circle
    const hatTop = hatBottom - 20; // tall stovepipe
    const crownHalfW = 8;
    const brimHalfW = 13;
    const brimHeight = 3;

    // Crown (rectangle)
    g.moveTo(-crownHalfW, hatBottom);
    g.lineTo(-crownHalfW, hatTop);
    g.lineTo(crownHalfW, hatTop);
    g.lineTo(crownHalfW, hatBottom);
    g.closePath();
    g.fill({ color: COLOR_BLACK });
    g.stroke({ color: COLOR_BLACK, width: OUTLINE_WIDTH });

    // Brim (wider trapezoid at crown base)
    g.moveTo(-brimHalfW, hatBottom);
    g.lineTo(-crownHalfW, hatBottom - brimHeight);
    g.lineTo(crownHalfW, hatBottom - brimHeight);
    g.lineTo(brimHalfW, hatBottom);
    g.closePath();
    g.fill({ color: COLOR_BLACK });
    g.stroke({ color: COLOR_BLACK, width: OUTLINE_WIDTH });
  }

  /** Beard: dark trapezoid beneath chin. */
  private drawLincolnBeard(g: Graphics): void {
    const chinY = HEAD_RADIUS; // bottom of head circle
    const beardBottom = chinY + 10;
    const topHalfW = 9;
    const bottomHalfW = 5;

    g.moveTo(-topHalfW, chinY);
    g.lineTo(topHalfW, chinY);
    g.lineTo(bottomHalfW, beardBottom);
    g.lineTo(-bottomHalfW, beardBottom);
    g.closePath();
    g.fill({ color: COLOR_BLACK });
    g.stroke({ color: COLOR_BLACK, width: OUTLINE_WIDTH });
  }

  /** Two triangular coattail flares extending from bottom pentagon vertices. */
  private drawLincolnCoattails(
    g: Graphics,
    bw: number,
    bh: number,
    startAngle: number
  ): void {
    const flareLength = 12;
    const flareWidth = 6;

    // Bottom-right vertex (pentagon index 2)
    const brAngle = startAngle + (2 * Math.PI * 2) / 5;
    const brX = Math.cos(brAngle) * bw;
    const brY = Math.sin(brAngle) * bh;

    g.moveTo(brX, brY);
    g.lineTo(brX + flareWidth, brY + flareLength);
    g.lineTo(brX - flareWidth * 0.3, brY + flareLength * 0.8);
    g.closePath();
    g.fill({ color: COLOR_BLACK });
    g.stroke({ color: COLOR_BLACK, width: OUTLINE_WIDTH });

    // Bottom-left vertex (pentagon index 3)
    const blAngle = startAngle + (3 * Math.PI * 2) / 5;
    const blX = Math.cos(blAngle) * bw;
    const blY = Math.sin(blAngle) * bh;

    g.moveTo(blX, blY);
    g.lineTo(blX - flareWidth, blY + flareLength);
    g.lineTo(blX + flareWidth * 0.3, blY + flareLength * 0.8);
    g.closePath();
    g.fill({ color: COLOR_BLACK });
    g.stroke({ color: COLOR_BLACK, width: OUTLINE_WIDTH });
  }

  /**
   * Draw a limb as a rectangle in local space (extending downward from origin).
   * The container's rotation handles the joint angle.
   * Reproduces FighterRenderer.drawLimb exactly.
   */
  private drawLimb(g: Graphics, length: number, width: number): void {
    const hw = width / 2;

    // Rectangle from top-center origin extending downward
    g.moveTo(-hw, 0);
    g.lineTo(hw, 0);
    g.lineTo(hw, length);
    g.lineTo(-hw, length);
    g.closePath();
    g.fill({ color: COLOR_WHITE });
    g.stroke({ color: COLOR_BLACK, width: 1.5 });
  }
}

/**
 * Map a slot index (0-3) to a PatternDescriptor.
 * Convenience helper for bridging old slotIndex-based code to the new pattern system.
 */
export function slotToPattern(slotIndex: number): PatternDescriptor {
  switch (slotIndex) {
    case 0:
      return { kind: 'solid', primaryColor: COLOR_WHITE, secondaryColor: COLOR_BLACK };
    case 1:
      return { kind: 'stripes', primaryColor: COLOR_WHITE, secondaryColor: COLOR_BLACK };
    case 2:
      return { kind: 'dots', primaryColor: COLOR_WHITE, secondaryColor: COLOR_BLACK };
    case 3:
      return { kind: 'crosshatch', primaryColor: COLOR_WHITE, secondaryColor: COLOR_BLACK };
    default:
      return { kind: 'solid', primaryColor: COLOR_WHITE, secondaryColor: COLOR_BLACK };
  }
}
