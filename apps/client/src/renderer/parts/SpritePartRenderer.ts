import type { Container } from 'pixi.js';
import { Sprite } from 'pixi.js';
import type { FighterPart, IPartRenderer, PartTransform, PatternDescriptor } from './IPartRenderer';

/**
 * Sprite-based fighter part renderer.
 * 
 * Currently a stub implementation — no art assets exist yet.
 * When sprite art is available, this will:
 * - Load a texture atlas
 * - Create Sprite instances per part
 * - Apply frame selection based on animation state
 * 
 * See ROADMAP.md Visuals section for sprite art requirements.
 */
export class SpritePartRenderer implements IPartRenderer {
  private atlasPath: string;
  private displayObjects: Map<FighterPart, Sprite>;

  /**
   * Create a sprite renderer for a fighter part.
   * 
   * @param atlasPath - Path to the texture atlas (e.g., 'assets/fighter-atlas.png')
   *                    Not loaded until textures are available.
   */
  constructor(atlasPath: string) {
    this.atlasPath = atlasPath;
    this.displayObjects = new Map();
  }

  /**
   * Get or create a Sprite display object for a fighter part.
   * 
   * @param part - The body part (HEAD, BODY, ARM_L, etc.)
   * @returns A PixiJS Sprite instance for this part
   */
  getDisplayObject(part: FighterPart): Sprite {
    if (!this.displayObjects.has(part)) {
      // Create a placeholder sprite (no texture yet)
      const sprite = new Sprite();
      sprite.name = `sprite-${part}`;
      this.displayObjects.set(part, sprite);
    }
    return this.displayObjects.get(part)!;
  }

  /**
   * Draw a fighter part with sprite rendering.
   * 
   * Currently throws an error because no art assets exist.
   * Once sprite art is available, this will:
   * - Select the appropriate frame from the texture atlas
   * - Apply the transform (position, rotation, scale)
   * - Apply the pattern (color tint or overlay)
   * 
   * @param part - The body part to render
   * @param transform - Position, rotation, and scale
   * @param pattern - Color and pattern descriptor
   * @throws Error indicating sprite art is not yet available
   */
  draw(part: FighterPart, transform: PartTransform, pattern: PatternDescriptor): void {
    throw new Error(
      'SpritePartRenderer not yet implemented — no art assets exist. ' +
      'See ROADMAP.md Visuals section for sprite art requirements.'
    );
  }
}
