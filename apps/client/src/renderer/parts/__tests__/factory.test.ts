import { describe, it, expect } from 'vitest';
import { Rectangle, Texture } from 'pixi.js';
import { createPartRenderer } from '../index';
import { PolygonPartRenderer } from '../PolygonPartRenderer';
import { FIGHTER_VISUAL_CONTRACTS } from '../assetContract.js';
import { SpritePartRenderer, type TextureProvider } from '../SpritePartRenderer';
import type { MatchCharacterId } from '@smash/shared';
import type { FighterPart } from '../IPartRenderer.js';

const CHARACTER_IDS: readonly MatchCharacterId[] = ['all-rounder', 'abe-lincoln', 'swift'] as const;
const SLOT_INDICES: readonly number[] = [0, 1, 2, 3] as const;

function buildTexture(origWidth: number, origHeight: number): Texture {
  return new Texture({
    source: Texture.WHITE.source,
    frame: new Rectangle(0, 0, origWidth, origHeight),
    orig: new Rectangle(0, 0, origWidth, origHeight),
  });
}

function createContractTextureProvider(): TextureProvider {
  return {
    getTexture(characterId: MatchCharacterId, part: FighterPart): Texture {
      const logicalCanvas = FIGHTER_VISUAL_CONTRACTS[characterId].parts[part].logicalCanvas;
      return buildTexture(logicalCanvas.width, logicalCanvas.height);
    },
  };
}

describe('createPartRenderer factory', () => {
  it('forwards characterId and slotIndex for all mode × character × slot combinations', () => {
    const textureProvider = createContractTextureProvider();

    for (const characterId of CHARACTER_IDS) {
      for (const slotIndex of SLOT_INDICES) {
        const polygonRenderer = createPartRenderer('polygon', slotIndex, characterId);
        expect(polygonRenderer).toBeInstanceOf(PolygonPartRenderer);
        expect((polygonRenderer as PolygonPartRenderer).characterId).toBe(characterId);
        expect((polygonRenderer as PolygonPartRenderer).slotIndex).toBe(slotIndex);

        const spriteRenderer = createPartRenderer('sprite', slotIndex, characterId, textureProvider);
        expect(spriteRenderer).toBeInstanceOf(SpritePartRenderer);
        expect((spriteRenderer as SpritePartRenderer).characterId).toBe(characterId);
        expect((spriteRenderer as SpritePartRenderer).slotIndex).toBe(slotIndex);
      }
    }
  });

  it('defaults characterId to all-rounder when undefined', () => {
    const textureProvider = createContractTextureProvider();

    const polygonRenderer = createPartRenderer('polygon', 2, undefined);
    expect((polygonRenderer as PolygonPartRenderer).characterId).toBe('all-rounder');
    expect((polygonRenderer as PolygonPartRenderer).slotIndex).toBe(2);

    const spriteRenderer = createPartRenderer('sprite', 1, undefined, textureProvider);
    expect((spriteRenderer as SpritePartRenderer).characterId).toBe('all-rounder');
    expect((spriteRenderer as SpritePartRenderer).slotIndex).toBe(1);
  });

  it('throws a clear error when sprite mode is requested without a texture provider', () => {
    expect(() => {
      createPartRenderer('sprite', 0, 'all-rounder');
    }).toThrow('Sprite renderer mode requires a TextureProvider.');
  });

  it('throws for unknown renderer mode', () => {
    expect(() => {
      createPartRenderer('unknown' as unknown as 'polygon' | 'sprite', 0);
    }).toThrow('Unknown renderer mode');
  });

  it('defaults to polygon mode when no mode is specified', () => {
    const renderer = createPartRenderer(undefined, 0);
    expect(renderer).toBeInstanceOf(PolygonPartRenderer);
  });
});
