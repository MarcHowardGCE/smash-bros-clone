import { describe, it, expect, vi } from 'vitest';
import type { PartTransform, PatternDescriptor } from '../IPartRenderer';

/**
 * Mock PixiJS so Graphics is a counting stub.
 * jsdom lacks WebGL — real PixiJS Graphics methods don't fully execute.
 */
class MockGraphics {
  x = 0;
  y = 0;
  rotation = 0;
  scale = { x: 1, y: 1 };
  fillCalls = 0;
  strokeCalls = 0;

  clear(): this { this.fillCalls = 0; this.strokeCalls = 0; return this; }
  moveTo(): this { return this; }
  lineTo(): this { return this; }
  circle(): this { return this; }
  closePath(): this { return this; }
  fill(): this { this.fillCalls++; return this; }
  stroke(): this { this.strokeCalls++; return this; }
}

class MockContainer {
  children: unknown[] = [];
  addChild(child: unknown): void { this.children.push(child); }
}

vi.mock('pixi.js', () => ({
  Graphics: MockGraphics,
  Container: MockContainer,
}));

// Dynamic import AFTER mock is established
const { PolygonPartRenderer } = await import('../PolygonPartRenderer');

const IDLE_TRANSFORM: PartTransform = {
  x: 0,
  y: 0,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
};

const SOLID_PATTERN: PatternDescriptor = {
  kind: 'solid',
  primaryColor: 0xffffff,
  secondaryColor: 0x000000,
};

function getDrawCounts(
  characterId: 'all-rounder' | 'abe-lincoln' | undefined,
  part: 'HEAD' | 'BODY'
): { fillCount: number; strokeCount: number } {
  const renderer = new PolygonPartRenderer(0, characterId);
  renderer.draw(part, IDLE_TRANSFORM, SOLID_PATTERN);
  const g = renderer.getDisplayObject(part) as unknown as MockGraphics;
  return { fillCount: g.fillCalls, strokeCount: g.strokeCalls };
}

describe('PolygonPartRenderer Lincoln accessories', () => {
  describe('drawHead', () => {
    it('Lincoln HEAD has more draw calls than All-Rounder HEAD', () => {
      const allRounder = getDrawCounts('all-rounder', 'HEAD');
      const lincoln = getDrawCounts('abe-lincoln', 'HEAD');

      expect(lincoln.fillCount).toBeGreaterThan(allRounder.fillCount);
      expect(lincoln.strokeCount).toBeGreaterThan(allRounder.strokeCount);
    });

    it('All-Rounder HEAD draw calls unchanged from baseline (2 fill, 1 stroke)', () => {
      const allRounder = getDrawCounts('all-rounder', 'HEAD');

      // circle fill (white) + eye fill (black) = 2 fills
      // circle stroke (outline) = 1 stroke
      expect(allRounder.fillCount).toBe(2);
      expect(allRounder.strokeCount).toBe(1);
    });

    it('undefined characterId HEAD matches All-Rounder baseline exactly', () => {
      const allRounder = getDrawCounts('all-rounder', 'HEAD');
      const noChar = getDrawCounts(undefined, 'HEAD');

      expect(noChar.fillCount).toBe(allRounder.fillCount);
      expect(noChar.strokeCount).toBe(allRounder.strokeCount);
    });

    it('Lincoln HEAD draws exactly 5 fills and 4 strokes', () => {
      const lincoln = getDrawCounts('abe-lincoln', 'HEAD');

      // head fill + eye fill + hat crown fill + brim fill + beard fill = 5
      expect(lincoln.fillCount).toBe(5);
      // head stroke + hat crown stroke + brim stroke + beard stroke = 4
      expect(lincoln.strokeCount).toBe(4);
    });
  });

  describe('drawBody', () => {
    it('Lincoln BODY has more draw calls than All-Rounder BODY', () => {
      const allRounder = getDrawCounts('all-rounder', 'BODY');
      const lincoln = getDrawCounts('abe-lincoln', 'BODY');

      expect(lincoln.fillCount).toBeGreaterThan(allRounder.fillCount);
      expect(lincoln.strokeCount).toBeGreaterThan(allRounder.strokeCount);
    });

    it('All-Rounder BODY draw calls unchanged from baseline (1 fill, 1 stroke)', () => {
      const allRounder = getDrawCounts('all-rounder', 'BODY');

      // solid pattern fill + outline stroke
      expect(allRounder.fillCount).toBe(1);
      expect(allRounder.strokeCount).toBe(1);
    });

    it('undefined characterId BODY matches All-Rounder baseline exactly', () => {
      const allRounder = getDrawCounts('all-rounder', 'BODY');
      const noChar = getDrawCounts(undefined, 'BODY');

      expect(noChar.fillCount).toBe(allRounder.fillCount);
      expect(noChar.strokeCount).toBe(allRounder.strokeCount);
    });

    it('Lincoln BODY draws exactly 3 fills and 3 strokes', () => {
      const lincoln = getDrawCounts('abe-lincoln', 'BODY');

      // body fill + right coattail fill + left coattail fill = 3
      expect(lincoln.fillCount).toBe(3);
      // body stroke + right coattail stroke + left coattail stroke = 3
      expect(lincoln.strokeCount).toBe(3);
    });
  });

  describe('total draw calls comparison', () => {
    it('Lincoln total draw-call count exceeds All-Rounder', () => {
      const arHead = getDrawCounts('all-rounder', 'HEAD');
      const arBody = getDrawCounts('all-rounder', 'BODY');
      const lnHead = getDrawCounts('abe-lincoln', 'HEAD');
      const lnBody = getDrawCounts('abe-lincoln', 'BODY');

      const arTotal = arHead.fillCount + arHead.strokeCount + arBody.fillCount + arBody.strokeCount;
      const lnTotal = lnHead.fillCount + lnHead.strokeCount + lnBody.fillCount + lnBody.strokeCount;

      // All-Rounder: 2+1+1+1 = 5
      // Lincoln: 5+4+3+3 = 15
      expect(lnTotal).toBeGreaterThan(arTotal);
      expect(arTotal).toBe(5);
      expect(lnTotal).toBe(15);
    });
  });
});
