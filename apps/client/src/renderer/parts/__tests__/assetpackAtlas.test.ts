import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ASSETS_ROOT = path.resolve(__dirname, '..', '..', '..', '..', 'public', 'assets', 'fighters');

const CHARACTER_IDS = ['all-rounder', 'abe-lincoln', 'swift'] as const;
const EXPECTED_SOURCE_SIZE = {
  head: { w: 160, h: 160 },
  body: { w: 160, h: 160 },
  arm_l: { w: 64, h: 128 },
  arm_r: { w: 64, h: 128 },
  leg_l: { w: 64, h: 128 },
  leg_r: { w: 64, h: 128 },
} as const;

interface AtlasJson {
  readonly frames: Record<
    string,
    {
      readonly sourceSize: {
        readonly w: number;
        readonly h: number;
      };
    }
  >;
  readonly meta: {
    readonly scale: number;
    readonly size: {
      readonly w: number;
      readonly h: number;
    };
  };
}

async function loadAtlas(characterId: string, extension: 'png' | 'webp'): Promise<AtlasJson> {
  const atlasPath = path.join(ASSETS_ROOT, `${characterId}@2x.${extension}.json`);
  return JSON.parse(await fs.readFile(atlasPath, 'utf8')) as AtlasJson;
}

describe('assetpack generated atlas contract', () => {
  it('Given generated @2x atlases, When validating metadata, Then meta.scale is 2 and frame sourceSize matches raw contract dimensions', async () => {
    for (const characterId of CHARACTER_IDS) {
      for (const extension of ['png', 'webp'] as const) {
        const atlas = await loadAtlas(characterId, extension);

        expect(atlas.meta.scale, `${characterId}:${extension}:meta.scale`).toBe(2);

        const width = Number(atlas.meta.size.w);
        const height = Number(atlas.meta.size.h);
        expect(width, `${characterId}:${extension}:page-width`).toBeLessThanOrEqual(2048);
        expect(height, `${characterId}:${extension}:page-height`).toBeLessThanOrEqual(2048);

        for (const [frameName, expected] of Object.entries(EXPECTED_SOURCE_SIZE)) {
          const frame = atlas.frames[`${frameName}.png`];
          expect(frame, `${characterId}:${extension}:${frameName}`).toBeDefined();
          if (!frame) {
            continue;
          }
          expect(frame.sourceSize.w, `${characterId}:${extension}:${frameName}:w`).toBe(expected.w);
          expect(frame.sourceSize.h, `${characterId}:${extension}:${frameName}:h`).toBe(expected.h);
        }
      }
    }
  });
});
