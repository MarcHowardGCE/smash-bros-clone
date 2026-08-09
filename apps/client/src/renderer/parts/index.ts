import type { CharacterId } from '@smash/shared';
import type { IPartRenderer } from './IPartRenderer';
import { PolygonPartRenderer } from './PolygonPartRenderer';
import { SpritePartRenderer } from './SpritePartRenderer';

/**
 * Factory for creating part renderers.
 * 
 * Routes to the appropriate renderer implementation based on mode:
 * - 'polygon': Uses PolygonPartRenderer (current production mode)
 * - 'sprite': Uses SpritePartRenderer (future sprite-based rendering)
 * 
 * Default mode is 'polygon' to maintain backward compatibility.
 * Swapping to sprites later requires:
 * 1. Supplying sprite art assets
 * 2. Changing this factory call to mode: 'sprite'
 * 3. No other code changes needed
 * 
 * @param mode - Renderer mode: 'polygon' (default) or 'sprite'
 * @param slotIndex - Fighter slot index (0-3) for pattern/color selection
 * @param characterId - Optional character ID for character-specific rendering
 * @returns An IPartRenderer implementation
 * @throws Error if mode is unknown
 */
export function createPartRenderer(
  mode: 'polygon' | 'sprite' = 'polygon',
  slotIndex: number,
  characterId?: CharacterId
): IPartRenderer {
  switch (mode) {
    case 'polygon':
      return new PolygonPartRenderer(slotIndex, characterId);

    case 'sprite':
      // Sprite renderer is available but not yet functional (no art assets)
      return new SpritePartRenderer('assets/fighter-atlas.png');

    default:
      const _exhaustive: never = mode;
      throw new Error(`Unknown renderer mode: ${_exhaustive}`);
  }
}

export { PolygonPartRenderer, slotToPattern } from './PolygonPartRenderer';
export { SpritePartRenderer } from './SpritePartRenderer';
export type { IPartRenderer, FighterPart, PatternDescriptor, PartTransform } from './IPartRenderer';
