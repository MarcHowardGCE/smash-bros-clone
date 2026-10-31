import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import type { CharacterId } from '@smash/shared';
import {
  FIGHTER_VISUAL_CONTRACTS,
  type FighterPartFilename,
  type FighterPartVisualContract,
} from '../assetContract.js';
import { runFighterAssetValidation } from '../validateFighterAssets.js';

const ASSET_ROOT = 'fighters{m}';
const CLOTHING_COLOR = { r: 0xf5, g: 0xf5, b: 0xf5, a: 255 } as const;

type PartName = keyof (typeof FIGHTER_VISUAL_CONTRACTS)['all-rounder']['parts'];

interface FixtureMutation {
  readonly kind:
    | 'none'
    | 'missing-part'
    | 'filename-casing'
    | 'wrong-dimensions'
    | 'empty-alpha'
    | 'joint-underlap'
    | 'tint-purity';
  readonly part?: PartName;
}

describe('assetValidator synthetic fixtures', () => {
  it('Given 6 valid fixtures, When validating, Then checks 6 assets and 0 violations', async () => {
    const rootDir = await createFixtureRoot({ kind: 'none' });
    const run = await runFighterAssetValidation({ rootDir });

    expect(run.result.assetsChecked).toBe(6);
    expect(run.result.violations).toHaveLength(0);
    expect(run.ok).toBe(true);
    expect(run.report).toContain('assets-checked=6');
    expect(run.report).toContain('violations=0');
  });

  it('Given missing part, When validating, Then emits missing-part with expected-vs-actual', async () => {
    const rootDir = await createFixtureRoot({ kind: 'missing-part', part: 'LEG_R' });
    const run = await runFighterAssetValidation({ rootDir });

    expect(run.result.assetsChecked).toBe(5);
    expect(run.result.violations).toHaveLength(1);
    expect(run.result.violations[0]?.message).toContain('character=all-rounder');
    expect(run.result.violations[0]?.message).toContain('part=LEG_R');
    expect(run.result.violations[0]?.message).toContain('rule=missing-part');
    expect(run.result.violations[0]?.message).toContain('expected-filename=leg_r.png');
    expect(run.result.violations[0]?.message).toContain('actual-filename=absent');
  });

  it('Given wrong filename casing, When validating, Then emits filename-casing with expected-vs-actual', async () => {
    const rootDir = await createFixtureRoot({ kind: 'filename-casing', part: 'HEAD' });
    const run = await runFighterAssetValidation({ rootDir });

    expect(run.result.assetsChecked).toBe(5);
    expect(run.result.violations).toHaveLength(1);
    expect(run.result.violations[0]?.message).toContain('character=all-rounder');
    expect(run.result.violations[0]?.message).toContain('part=HEAD');
    expect(run.result.violations[0]?.message).toContain('rule=filename-casing');
    expect(run.result.violations[0]?.message).toContain('expected-filename=head.png');
    expect(run.result.violations[0]?.message).toContain('actual-filename=Head.png');
  });

  it('Given wrong dimensions, When validating, Then emits dimensions with expected-vs-actual', async () => {
    const rootDir = await createFixtureRoot({ kind: 'wrong-dimensions', part: 'ARM_L' });
    const run = await runFighterAssetValidation({ rootDir });

    expect(run.result.assetsChecked).toBe(6);
    expect(run.result.violations).toHaveLength(1);
    expect(run.result.violations[0]?.message).toContain('character=all-rounder');
    expect(run.result.violations[0]?.message).toContain('part=ARM_L');
    expect(run.result.violations[0]?.message).toContain('rule=dimensions');
    expect(run.result.violations[0]?.message).toContain('expected=64x128');
    expect(run.result.violations[0]?.message).toContain('actual=63x128');
  });

  it('Given empty alpha, When validating, Then emits empty-alpha with expected-vs-actual', async () => {
    const rootDir = await createFixtureRoot({ kind: 'empty-alpha', part: 'BODY' });
    const run = await runFighterAssetValidation({ rootDir });

    expect(run.result.assetsChecked).toBe(6);
    expect(run.result.violations).toHaveLength(1);
    expect(run.result.violations[0]?.message).toContain('character=all-rounder');
    expect(run.result.violations[0]?.message).toContain('part=BODY');
    expect(run.result.violations[0]?.message).toContain('rule=empty-alpha');
    expect(run.result.violations[0]?.message).toContain('expected=alpha>0');
    expect(run.result.violations[0]?.message).toContain('actual=all-alpha-zero');
  });

  it('Given transparent joint underlap, When validating, Then emits joint-underlap with expected-vs-actual', async () => {
    const rootDir = await createFixtureRoot({ kind: 'joint-underlap', part: 'LEG_L' });
    const run = await runFighterAssetValidation({ rootDir });

    expect(run.result.assetsChecked).toBe(6);
    expect(run.result.violations).toHaveLength(1);
    expect(run.result.violations[0]?.message).toContain('character=all-rounder');
    expect(run.result.violations[0]?.message).toContain('part=LEG_L');
    expect(run.result.violations[0]?.message).toContain('rule=joint-underlap');
    expect(run.result.violations[0]?.message).toContain('expected=opaque-band-height=12');
    expect(run.result.violations[0]?.message).toContain('actual=transparent-pixel-found');
  });

  it('Given non-white tintable pixel, When validating, Then emits tint-purity with expected-vs-actual', async () => {
    const rootDir = await createFixtureRoot({ kind: 'tint-purity', part: 'ARM_R' });
    const run = await runFighterAssetValidation({ rootDir });

    expect(run.result.assetsChecked).toBe(6);
    expect(run.result.violations).toHaveLength(1);
    expect(run.result.violations[0]?.message).toContain('character=all-rounder');
    expect(run.result.violations[0]?.message).toContain('part=ARM_R');
    expect(run.result.violations[0]?.message).toContain('rule=tint-purity');
    expect(run.result.violations[0]?.message).toContain('expected=#F5F5F5');
    expect(run.result.violations[0]?.message).toContain('actual=rgb(255,0,0)');
  });
});

describe('assetValidator real-art gate behavior', () => {
  it('Given real raw-assets, When validating, Then is a hard gate for 3 characters with 18 assets and 0 violations', async () => {
    const rootDir = resolveRealRawAssetsRoot();
    const run = await runFighterAssetValidation({ rootDir });
    expect(run.result.skippedCharacters).toHaveLength(0);
    expect(run.result.assetsChecked).toBe(18);
    expect(run.result.violations).toHaveLength(0);
    expect(run.ok).toBe(true);
  });

  it('Given Lincoln real art, When reading alpha bounds, Then head paints above and below reference bounds and body paints below', async () => {
    const rootDir = resolveRealRawAssetsRoot();
    const lincoln = FIGHTER_VISUAL_CONTRACTS['abe-lincoln'];
    const headPath = path.join(rootDir, 'abe-lincoln{tps}', lincoln.parts.HEAD.filename);
    const bodyPath = path.join(rootDir, 'abe-lincoln{tps}', lincoln.parts.BODY.filename);

    const headBounds = alphaBounds(PNG.sync.read(await fs.readFile(headPath)));
    const bodyBounds = alphaBounds(PNG.sync.read(await fs.readFile(bodyPath)));
    const headRef = toRawBounds(lincoln.parts.HEAD);
    const bodyRef = toRawBounds(lincoln.parts.BODY);

    expect(headBounds).not.toBeNull();
    expect(bodyBounds).not.toBeNull();
    expect(headBounds!.minY).toBeLessThan(headRef.y);
    expect(headBounds!.maxY).toBeGreaterThan(headRef.y + headRef.height - 1);
    expect(bodyBounds!.maxY).toBeGreaterThan(bodyRef.y + bodyRef.height - 1);
  });
});

async function createFixtureRoot(mutation: FixtureMutation): Promise<string> {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'asset-validator-'));
  const rootDir = path.join(tempRoot, ASSET_ROOT);
  const characterId: CharacterId = 'all-rounder';
  const characterDir = path.join(rootDir, `${characterId}{tps}`);
  await fs.mkdir(characterDir, { recursive: true });

  const contracts = FIGHTER_VISUAL_CONTRACTS[characterId].parts;
  for (const [part, partContract] of Object.entries(contracts) as readonly [PartName, FighterPartVisualContract][]) {
    const png = makeValidPartPng(partContract);
    applyMutation(png, partContract, mutation, part);
    const filename = selectOutputFilename(partContract.filename, mutation, part);
    await fs.writeFile(path.join(characterDir, filename), PNG.sync.write(png));
  }

  if (mutation.kind === 'missing-part' && mutation.part !== undefined) {
    const missingFilename = contracts[mutation.part].filename;
    const targetPath = path.join(characterDir, missingFilename);
    await fs.rm(targetPath);
  }

  return rootDir;
}

function resolveRealRawAssetsRoot(): string {
  const testFileDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(testFileDir, '..', '..', '..', '..', '..', '..', 'raw-assets', ASSET_ROOT);
}

function selectOutputFilename(
  expectedFilename: FighterPartFilename,
  mutation: FixtureMutation,
  part: PartName,
): FighterPartFilename | string {
  if (mutation.kind === 'filename-casing' && mutation.part === part) {
    return `Head.png`;
  }
  return expectedFilename;
}

function applyMutation(
  png: PNG,
  partContract: FighterPartVisualContract,
  mutation: FixtureMutation,
  part: PartName,
): void {
  if (mutation.part !== part) {
    return;
  }

  switch (mutation.kind) {
    case 'wrong-dimensions': {
      png.width = Math.max(1, png.width - 1);
      png.data = png.data.subarray(0, png.width * png.height * 4);
      return;
    }
    case 'empty-alpha': {
      png.data.fill(0);
      return;
    }
    case 'joint-underlap': {
      const bounds = toRawBounds(partContract);
      setPixel(png, bounds.x, partContract.jointPx.y, 245, 245, 245, 0);
      return;
    }
    case 'tint-purity': {
      const bounds = toRawBounds(partContract);
      setPixel(png, bounds.x + 1, bounds.y + 1, 255, 0, 0, 255);
      return;
    }
    case 'none':
    case 'missing-part':
    case 'filename-casing':
      return;
  }
}

function makeValidPartPng(partContract: FighterPartVisualContract): PNG {
  const png = new PNG({ width: partContract.rawCanvasPx.width, height: partContract.rawCanvasPx.height });
  const bounds = toRawBounds(partContract);

  for (let y = bounds.y; y < bounds.y + bounds.height; y += 1) {
    for (let x = bounds.x; x < bounds.x + bounds.width; x += 1) {
      setPixel(png, x, y, CLOTHING_COLOR.r, CLOTHING_COLOR.g, CLOTHING_COLOR.b, CLOTHING_COLOR.a);
    }
  }

  for (let y = partContract.jointPx.y; y < partContract.jointPx.y + 12; y += 1) {
    for (let x = bounds.x; x < bounds.x + bounds.width; x += 1) {
      setPixel(png, x, y, CLOTHING_COLOR.r, CLOTHING_COLOR.g, CLOTHING_COLOR.b, CLOTHING_COLOR.a);
    }
  }

  return png;
}

function toRawBounds(partContract: FighterPartVisualContract): {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
} {
  return {
    x: Math.round(partContract.referenceBoundsLogical.x * 2),
    y: Math.round(partContract.referenceBoundsLogical.y * 2),
    width: Math.round(partContract.referenceBoundsLogical.width * 2),
    height: Math.round(partContract.referenceBoundsLogical.height * 2),
  };
}

function setPixel(png: PNG, x: number, y: number, r: number, g: number, b: number, a: number): void {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) {
    return;
  }
  const index = ((y * png.width) + x) * 4;
  png.data[index] = r;
  png.data[index + 1] = g;
  png.data[index + 2] = b;
  png.data[index + 3] = a;
}

function alphaBounds(png: PNG):
  | {
      readonly minX: number;
      readonly minY: number;
      readonly maxX: number;
      readonly maxY: number;
    }
  | null {
  let minX = png.width;
  let minY = png.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const index = ((y * png.width) + x) * 4;
      const alpha = png.data[index + 3] ?? 0;
      if (alpha > 0) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < 0 || maxY < 0) {
    return null;
  }

  return { minX, minY, maxX, maxY };
}
