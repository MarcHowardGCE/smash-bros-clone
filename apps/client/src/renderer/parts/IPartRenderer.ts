/**
 * @fileoverview Fighter part renderer interface and shared types.
 *
 * Defines the {@link IPartRenderer} contract that all part-rendering strategies
 * must satisfy, plus the {@link FighterPart}, {@link PatternDescriptor}, and
 * {@link PartTransform} types shared across the rendering pipeline.
 */
import type { Container } from 'pixi.js';

/**
 * Fighter body parts that can be rendered.
 * Maps to the 6-part skeleton: head, torso, and 4 limbs.
 */
export type FighterPart = 'HEAD' | 'BODY' | 'ARM_L' | 'ARM_R' | 'LEG_L' | 'LEG_R';

/**
 * Describes the visual pattern and colors for a fighter part.
 * Generalizes the 4-slot pattern system (solid, stripes, dots, crosshatch).
 */
export interface PatternDescriptor {
  /** Pattern type: solid fill, horizontal stripes, dot overlay, or diagonal crosshatch */
  kind: 'solid' | 'stripes' | 'dots' | 'crosshatch';
  /** Primary color (RGB hex, e.g., 0xFFFFFF for white) */
  primaryColor: number;
  /** Secondary color for pattern overlay (e.g., 0x000000 for black stripes/dots) */
  secondaryColor: number;
}

/**
 * Transformation applied to a part during rendering.
 * Includes position, rotation, and scale for joint-based animation.
 */
export interface PartTransform {
  /** Horizontal offset from part anchor (pixels) */
  x: number;
  /** Vertical offset from part anchor (pixels) */
  y: number;
  /** Rotation angle (radians) */
  rotation: number;
  /** Horizontal scale factor (1.0 = normal, 0.5 = half width) */
  scaleX: number;
  /** Vertical scale factor (1.0 = normal, 0.5 = half height) */
  scaleY: number;
}

/**
 * Contract for rendering individual fighter parts.
 * Implementations handle polygon geometry, sprite rendering, or other visual representations.
 */
export interface IPartRenderer {
  /** Root container holding all part display objects. Add to scene graph. */
  readonly container: Container;

  /**
   * Draw a fighter part with the given transform and pattern.
   * Called once per frame for each visible part.
   *
   * @param part - The body part to render (HEAD, BODY, ARM_L, etc.)
   * @param transform - Position, rotation, and scale to apply
   * @param pattern - Color and pattern descriptor for the part
   */
  draw(part: FighterPart, transform: PartTransform, pattern: PatternDescriptor): void;

  /**
   * Get the PixiJS Container for a part.
   * Used for hierarchical scene graph management and animation.
   *
   * @param part - The body part to retrieve
   * @returns A PixiJS Container that can be positioned, rotated, and scaled
   */
  getDisplayObject(part: FighterPart): Container;
}
