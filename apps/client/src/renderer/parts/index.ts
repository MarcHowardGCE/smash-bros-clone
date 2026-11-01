/** @fileoverview Factory for creating part renderers with support for polygon and sprite rendering modes. */

import type { CharacterId } from '@smash/shared';
import type { IPartRenderer } from './IPartRenderer';
import { PolygonPartRenderer } from './PolygonPartRenderer';
import { SpritePartRenderer, type TextureProvider } from './SpritePartRenderer';

const DEFAULT_CHARACTER_ID: CharacterId = 'all-rounder';

/**
 * Factory for creating part renderers.
 * 
 * Routes to the appropriate renderer implementation based on mode:
 * - 'polygon': Uses PolygonPartRenderer (polygon fallback mode)
 * - 'sprite': Uses SpritePartRenderer (sprite-based rendering with atlas textures)
 * 
 * Default mode is 'polygon' when called without an explicit mode argument,
 * though runtime fighter rendering defaults to 'sprite' via bootstrapFighterAssets.
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
  characterId?: CharacterId,
  textureProvider?: TextureProvider,
): IPartRenderer {
  const resolvedCharacterId = characterId ?? DEFAULT_CHARACTER_ID;

  switch (mode) {
    case 'polygon':
      return new PolygonPartRenderer(slotIndex, resolvedCharacterId);

    case 'sprite':
      if (!textureProvider) {
        throw new Error('Sprite renderer mode requires a TextureProvider.');
      }

      return new SpritePartRenderer(resolvedCharacterId, slotIndex, textureProvider);

    default:
      const _exhaustive: never = mode;
      throw new Error(`Unknown renderer mode: ${_exhaustive}`);
  }
}

export { PolygonPartRenderer, slotToPattern } from './PolygonPartRenderer';
export { SpritePartRenderer } from './SpritePartRenderer';
export type { IPartRenderer, FighterPart, PatternDescriptor, PartTransform } from './IPartRenderer';
