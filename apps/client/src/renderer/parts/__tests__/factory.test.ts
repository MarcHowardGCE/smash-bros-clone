import { describe, it, expect } from 'vitest';
import { createPartRenderer } from '../index';
import { PolygonPartRenderer } from '../PolygonPartRenderer';
import { SpritePartRenderer } from '../SpritePartRenderer';
import type { CharacterId } from '@smash/shared';

describe('createPartRenderer factory', () => {
  it('should return SpritePartRenderer when mode is "sprite"', () => {
    const renderer = createPartRenderer('sprite', 0);
    expect(renderer).toBeInstanceOf(SpritePartRenderer);
  });

  it('should throw error when draw() is called on SpritePartRenderer', () => {
    const renderer = createPartRenderer('sprite', 0);
    expect(() => {
      renderer.draw('HEAD', { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 }, {
        kind: 'solid',
        primaryColor: 0xFFFFFF,
        secondaryColor: 0x000000,
      });
    }).toThrow('SpritePartRenderer not yet implemented');
  });

  it('should return a display object from SpritePartRenderer.getDisplayObject()', () => {
    const renderer = createPartRenderer('sprite', 0);
    const displayObject = renderer.getDisplayObject('HEAD');
    expect(displayObject).toBeDefined();
    expect(displayObject.name).toBe('sprite-HEAD');
  });

  it('should throw error for unknown renderer mode', () => {
    expect(() => {
      createPartRenderer('unknown' as any, 0);
    }).toThrow('Unknown renderer mode');
  });

  it('should default to polygon mode when no mode is specified', () => {
    const renderer = createPartRenderer(undefined as any, 0);
    expect(renderer).toBeInstanceOf(PolygonPartRenderer);
  });

  describe('characterId parameter', () => {
    it('should accept characterId and pass it to PolygonPartRenderer', () => {
      const characterId: CharacterId = 'abe-lincoln';
      const renderer = createPartRenderer('polygon', 0, characterId);
      expect(renderer).toBeInstanceOf(PolygonPartRenderer);
      // PolygonPartRenderer stores characterId internally - verify construction succeeded
    });

    it('should work with undefined characterId', () => {
      const renderer = createPartRenderer('polygon', 0, undefined);
      expect(renderer).toBeInstanceOf(PolygonPartRenderer);
    });

    it('should work without characterId parameter (backward compatibility)', () => {
      const renderer = createPartRenderer('polygon', 0);
      expect(renderer).toBeInstanceOf(PolygonPartRenderer);
    });

    it('should accept all valid characterId values', () => {
      const validIds: CharacterId[] = ['all-rounder', 'abe-lincoln'];
      for (const id of validIds) {
        const renderer = createPartRenderer('polygon', 0, id);
        expect(renderer).toBeInstanceOf(PolygonPartRenderer);
      }
    });
  });
});
