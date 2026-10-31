/** @fileoverview Factory for creating part renderers with support for polygon and sprite rendering modes. */

import type { CharacterId } from '@smash/shared';
import { Rectangle, Texture } from 'pixi.js';
import type { IPartRenderer } from './IPartRenderer';
import type { FighterPart } from './IPartRenderer';
import { PolygonPartRenderer } from './PolygonPartRenderer';
import { FIGHTER_VISUAL_CONTRACTS } from './assetContract.js';
import { SpritePartRenderer, type TextureProvider } from './SpritePartRenderer';

const DEFAULT_CHARACTER_ID: CharacterId = 'all-rounder';

function createFallbackTextureProvider(): TextureProvider {
  const cache = new Map<string, Texture>();

  return {
    getTexture(characterId: CharacterId, part: FighterPart): Texture {
      const key = `${characterId}:${part}`;
      const cachedTexture = cache.get(key);
      if (cachedTexture) {
        return cachedTexture;
      }

      const logicalCanvas = FIGHTER_VISUAL_CONTRACTS[characterId].parts[part].logicalCanvas;
      const texture = new Texture({
        source: Texture.WHITE.source,
        frame: new Rectangle(0, 0, logicalCanvas.width, logicalCanvas.height),
        orig: new Rectangle(0, 0, logicalCanvas.width, logicalCanvas.height),
      });

      cache.set(key, texture);
      return texture;
    },
  };
}

const FALLBACK_TEXTURE_PROVIDER = createFallbackTextureProvider();

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
  const resolvedCharacterId = characterId ?? DEFAULT_CHARACTER_ID;

  switch (mode) {
    case 'polygon':
      return new PolygonPartRenderer(slotIndex, resolvedCharacterId);

    case 'sprite':
      return new SpritePartRenderer(resolvedCharacterId, slotIndex, FALLBACK_TEXTURE_PROVIDER);

    default:
      const _exhaustive: never = mode;
      throw new Error(`Unknown renderer mode: ${_exhaustive}`);
  }
}

export { PolygonPartRenderer, slotToPattern } from './PolygonPartRenderer';
export { SpritePartRenderer } from './SpritePartRenderer';
export type { IPartRenderer, FighterPart, PatternDescriptor, PartTransform } from './IPartRenderer';
