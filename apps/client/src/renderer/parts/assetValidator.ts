import type { MatchCharacterId } from '@smash/shared';
import type {
  FighterPartFilename,
  FighterPartVisualContract,
  FighterVisualContract,
} from './assetContract.js';
import { FIGHTER_VISUAL_CONTRACTS } from './assetContract.js';

const TINT_TARGET = { r: 0xf5, g: 0xf5, b: 0xf5 } as const;
const OUTLINE_NEAR_BLACK_MAX = 24;

export interface DecodedPngImage {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8Array;
}

export interface FighterAssetProvider {
  listFilenames(characterId: MatchCharacterId): Promise<readonly string[] | null>;
  readPng(characterId: MatchCharacterId, filename: FighterPartFilename): Promise<DecodedPngImage | null>;
}

export interface AssetValidationViolation {
  readonly characterId: MatchCharacterId;
  readonly part: string;
  readonly filename: string;
  readonly rule:
    | 'missing-part'
    | 'filename-casing'
    | 'dimensions'
    | 'empty-alpha'
    | 'reference-alpha'
    | 'joint-underlap'
    | 'tint-purity'
    | 'decode';
  readonly message: string;
}

export interface AssetValidationSkip {
  readonly characterId: MatchCharacterId;
  readonly message: string;
}

export interface AssetValidationResult {
  readonly assetsChecked: number;
  readonly violations: readonly AssetValidationViolation[];
  readonly skippedCharacters: readonly AssetValidationSkip[];
}

export interface ValidateFighterAssetsOptions {
  readonly provider: FighterAssetProvider;
  readonly contracts?: Record<MatchCharacterId, FighterVisualContract>;
  readonly tintTolerance?: number;
  readonly jointBandHeightPx?: number;
}

interface RawBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export async function validateFighterAssets(
  options: ValidateFighterAssetsOptions,
): Promise<AssetValidationResult> {
  const contracts = options.contracts ?? FIGHTER_VISUAL_CONTRACTS;
  const tintTolerance = options.tintTolerance ?? 10;
  const jointBandHeightPx = options.jointBandHeightPx ?? 12;
  let assetsChecked = 0;
  const violations: AssetValidationViolation[] = [];
  const skippedCharacters: AssetValidationSkip[] = [];

  for (const [characterId, visualContract] of Object.entries(contracts) as readonly [
    MatchCharacterId,
    FighterVisualContract,
  ][]) {
    const filenames = await options.provider.listFilenames(characterId);
    if (filenames === null) {
      skippedCharacters.push({
        characterId,
        message: `SKIP character=${characterId} reason=missing-art-dir path=raw-assets/fighters{m}/${characterId}{tps}`,
      });
      continue;
    }

    for (const [part, partContract] of Object.entries(visualContract.parts) as readonly [
      string,
      FighterPartVisualContract,
    ][]) {
      const expectedFilename = partContract.filename;
      const exactMatch = filenames.includes(expectedFilename);
      if (!exactMatch) {
        const caseOnlyMismatch = filenames.find(
          (existingFilename) => existingFilename.toLowerCase() === expectedFilename.toLowerCase(),
        );
        const rule = caseOnlyMismatch ? 'filename-casing' : 'missing-part';
        const actual = caseOnlyMismatch ?? 'absent';
        violations.push({
          characterId,
          part,
          filename: expectedFilename,
          rule,
          message:
            `character=${characterId} part=${part} rule=${rule} expected-filename=${expectedFilename}` +
            ` actual-filename=${actual}`,
        });
        continue;
      }

      const decoded = await options.provider.readPng(characterId, expectedFilename);
      if (decoded === null) {
        violations.push({
          characterId,
          part,
          filename: expectedFilename,
          rule: 'decode',
          message: `character=${characterId} part=${part} rule=decode expected=decodable-png actual=decode-failed`,
        });
        continue;
      }

      assetsChecked += 1;
      validateDecodedPng(
        decoded,
        characterId,
        part,
        expectedFilename,
        partContract,
        tintTolerance,
        jointBandHeightPx,
        violations,
      );
    }
  }

  return { assetsChecked, violations, skippedCharacters };
}

function validateDecodedPng(
  decoded: DecodedPngImage,
  characterId: MatchCharacterId,
  part: string,
  filename: FighterPartFilename,
  partContract: FighterPartVisualContract,
  tintTolerance: number,
  jointBandHeightPx: number,
  violations: AssetValidationViolation[],
): void {
  if (
    decoded.width !== partContract.rawCanvasPx.width ||
    decoded.height !== partContract.rawCanvasPx.height
  ) {
    violations.push({
      characterId,
      part,
      filename,
      rule: 'dimensions',
      message:
        `character=${characterId} part=${part} rule=dimensions expected=${partContract.rawCanvasPx.width}x${partContract.rawCanvasPx.height}` +
        ` actual=${decoded.width}x${decoded.height}`,
    });
    return;
  }

  if (!hasOpaquePixel(decoded, 0, 0, decoded.width, decoded.height)) {
    violations.push({
      characterId,
      part,
      filename,
      rule: 'empty-alpha',
      message: `character=${characterId} part=${part} rule=empty-alpha expected=alpha>0 actual=all-alpha-zero`,
    });
    return;
  }

  const bounds = toRawBounds(partContract);
  if (!hasOpaquePixel(decoded, bounds.x, bounds.y, bounds.width, bounds.height)) {
    violations.push({
      characterId,
      part,
      filename,
      rule: 'reference-alpha',
      message:
        `character=${characterId} part=${part} rule=reference-alpha expected=painted-alpha-in-reference-bounds` +
        ` actual=none bounds=${bounds.x},${bounds.y},${bounds.width},${bounds.height}`,
    });
    return;
  }

  const bandY = partContract.jointPx.y;
  const fullyOpaqueBand = isBandFullyOpaque(decoded, bounds.x, bounds.width, bandY, jointBandHeightPx);
  if (!fullyOpaqueBand) {
    violations.push({
      characterId,
      part,
      filename,
      rule: 'joint-underlap',
      message:
        `character=${characterId} part=${part} rule=joint-underlap expected=opaque-band-height=${jointBandHeightPx}` +
        ` actual=transparent-pixel-found band=x:${bounds.x}..${bounds.x + bounds.width - 1},y:${bandY}..${bandY + jointBandHeightPx - 1}`,
    });
    return;
  }

  if (partContract.tintable) {
    const impure = findFirstTintPurityViolation(decoded, bounds, tintTolerance);
    if (impure !== null) {
      violations.push({
        characterId,
        part,
        filename,
        rule: 'tint-purity',
        message:
          `character=${characterId} part=${part} rule=tint-purity expected=#F5F5F5±${tintTolerance}` +
          ` actual=rgb(${impure.r},${impure.g},${impure.b}) at=${impure.x},${impure.y}`,
      });
    }
  }
}

function toRawBounds(partContract: FighterPartVisualContract): RawBounds {
  const density = 2;
  return {
    x: Math.round(partContract.referenceBoundsLogical.x * density),
    y: Math.round(partContract.referenceBoundsLogical.y * density),
    width: Math.round(partContract.referenceBoundsLogical.width * density),
    height: Math.round(partContract.referenceBoundsLogical.height * density),
  };
}

function hasOpaquePixel(image: DecodedPngImage, x: number, y: number, width: number, height: number): boolean {
  for (let py = y; py < y + height; py += 1) {
    for (let px = x; px < x + width; px += 1) {
      if (alphaAt(image, px, py) > 0) {
        return true;
      }
    }
  }
  return false;
}

function isBandFullyOpaque(
  image: DecodedPngImage,
  startX: number,
  width: number,
  startY: number,
  bandHeight: number,
): boolean {
  for (let py = startY; py < startY + bandHeight; py += 1) {
    for (let px = startX; px < startX + width; px += 1) {
      if (alphaAt(image, px, py) !== 255) {
        return false;
      }
    }
  }
  return true;
}

function findFirstTintPurityViolation(
  image: DecodedPngImage,
  bounds: RawBounds,
  tolerance: number,
): { x: number; y: number; r: number; g: number; b: number } | null {
  for (let py = bounds.y; py < bounds.y + bounds.height; py += 1) {
    for (let px = bounds.x; px < bounds.x + bounds.width; px += 1) {
      const pixel = pixelAt(image, px, py);
      if (pixel.a === 0 || isOutlinePixel(pixel.r, pixel.g, pixel.b)) {
        continue;
      }
      const inRange =
        Math.abs(pixel.r - TINT_TARGET.r) <= tolerance &&
        Math.abs(pixel.g - TINT_TARGET.g) <= tolerance &&
        Math.abs(pixel.b - TINT_TARGET.b) <= tolerance;
      if (!inRange) {
        return { x: px, y: py, r: pixel.r, g: pixel.g, b: pixel.b };
      }
    }
  }
  return null;
}

function isOutlinePixel(r: number, g: number, b: number): boolean {
  return r <= OUTLINE_NEAR_BLACK_MAX && g <= OUTLINE_NEAR_BLACK_MAX && b <= OUTLINE_NEAR_BLACK_MAX;
}

function pixelAt(image: DecodedPngImage, x: number, y: number): { r: number; g: number; b: number; a: number } {
  const idx = ((y * image.width) + x) * 4;
  return {
    r: image.data[idx] ?? 0,
    g: image.data[idx + 1] ?? 0,
    b: image.data[idx + 2] ?? 0,
    a: image.data[idx + 3] ?? 0,
  };
}

function alphaAt(image: DecodedPngImage, x: number, y: number): number {
  if (x < 0 || y < 0 || x >= image.width || y >= image.height) {
    return 0;
  }
  const idx = ((y * image.width) + x) * 4;
  return image.data[idx + 3] ?? 0;
}
