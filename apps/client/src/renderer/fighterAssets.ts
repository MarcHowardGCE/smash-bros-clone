import type { CharacterId } from '@smash/shared';
import { Assets, Texture } from 'pixi.js';
import type { AssetInitOptions, Spritesheet } from 'pixi.js';
import type { FighterPart } from './parts/IPartRenderer.js';
import type { TextureProvider } from './parts/SpritePartRenderer.js';

const FIGHTERS_MANIFEST_URL = '/assets/manifest.json';
const FIGHTERS_BUNDLE_NAME = 'fighters';
const PRELOAD_TIMEOUT_MS = 5000;

const CHARACTER_IDS: readonly CharacterId[] = ['all-rounder', 'abe-lincoln', 'swift'] as const;

const FRAME_NAME_BY_PART: Record<FighterPart, string> = {
  HEAD: 'head.png',
  BODY: 'body.png',
  ARM_L: 'arm_l.png',
  ARM_R: 'arm_r.png',
  LEG_L: 'leg_l.png',
  LEG_R: 'leg_r.png',
};

const REQUIRED_FRAME_NAMES = Object.values(FRAME_NAME_BY_PART);

type BundleLoadResult = Record<string, unknown>;

export interface FighterAssetLoaderFacade {
  init(options: AssetInitOptions): Promise<void>;
  loadBundle(bundleName: string): Promise<BundleLoadResult>;
}

export type FighterAssetsBootstrapResult =
  | { mode: 'sprite'; provider: TextureProvider }
  | { mode: 'polygon' };

interface FighterAssetsBootstrapOptions {
  readonly loader?: FighterAssetLoaderFacade;
  readonly timeoutMs?: number;
  readonly locationSearch?: string;
  readonly logger?: Pick<Console, 'warn'>;
}

export function createPixiAssetLoaderFacade(): FighterAssetLoaderFacade {
  return {
    init(options: AssetInitOptions): Promise<void> {
      return Assets.init(options);
    },
    loadBundle(bundleName: string): Promise<BundleLoadResult> {
      return Assets.loadBundle(bundleName);
    },
  };
}

export async function preloadFighterAssets(
  options: FighterAssetsBootstrapOptions = {},
): Promise<FighterAssetsBootstrapResult> {
  const loader = options.loader ?? createPixiAssetLoaderFacade();
  const logger = options.logger ?? console;
  const timeoutMs = options.timeoutMs ?? PRELOAD_TIMEOUT_MS;
  const locationSearch = options.locationSearch ?? getWindowSearch();

  if (isPolygonRendererForced(locationSearch)) {
    return { mode: 'polygon' };
  }

  try {
    const loadResult = await withTimeout(loadFighterBundle(loader), timeoutMs);
    const sheets = getCharacterSheets(loadResult);

    if (!sheets.ok) {
      logger.warn(`[fighterAssets] ${sheets.reason}; falling back to polygon renderer.`);
      return { mode: 'polygon' };
    }

    const missingFrameReason = findMissingFrameReason(sheets.sheets);
    if (missingFrameReason !== null) {
      logger.warn(`[fighterAssets] ${missingFrameReason}; falling back to polygon renderer.`);
      return { mode: 'polygon' };
    }

    applyAtlasTextureSourcePreferences(sheets.sheets);

    return {
      mode: 'sprite',
      provider: createSheetScopedTextureProvider(sheets.sheets),
    };
  } catch (error: unknown) {
    logger.warn('[fighterAssets] preload failed; falling back to polygon renderer.', error);
    return { mode: 'polygon' };
  }
}

async function loadFighterBundle(loader: FighterAssetLoaderFacade): Promise<BundleLoadResult> {
  await loader.init({
    manifest: FIGHTERS_MANIFEST_URL,
    texturePreference: {
      resolution: getResolutionPreference(),
      format: ['webp', 'png'],
    },
  });

  return loader.loadBundle(FIGHTERS_BUNDLE_NAME);
}

function getWindowSearch(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  return window.location.search;
}

function isPolygonRendererForced(locationSearch: string): boolean {
  return new URLSearchParams(locationSearch).get('renderer') === 'polygon';
}

function getResolutionPreference(): number {
  if (typeof window === 'undefined') {
    return 1;
  }

  return window.devicePixelRatio || 1;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSpritesheetLike(value: unknown): value is Spritesheet {
  if (!isRecord(value)) {
    return false;
  }

  return isRecord(value['textures']) && isRecord(value['textureSource']);
}

function getCharacterSheets(
  loadedBundleAssets: BundleLoadResult,
): { ok: true; sheets: Record<CharacterId, Spritesheet> } | { ok: false; reason: string } {
  const sheets: Partial<Record<CharacterId, Spritesheet>> = {};

  for (const characterId of CHARACTER_IDS) {
    const alias = `fighters/${characterId}`;
    const loadedAsset = loadedBundleAssets[alias];

    if (!isSpritesheetLike(loadedAsset)) {
      return {
        ok: false,
        reason: `missing or invalid atlas for alias "${alias}"`,
      };
    }

    sheets[characterId] = loadedAsset;
  }

  if (
    !sheets['all-rounder']
    || !sheets['abe-lincoln']
    || !sheets['swift']
  ) {
    return {
      ok: false,
      reason: 'one or more character sheets were not loaded',
    };
  }

  return {
    ok: true,
    sheets: {
      'all-rounder': sheets['all-rounder'],
      'abe-lincoln': sheets['abe-lincoln'],
      'swift': sheets['swift'],
    },
  };
}

function findMissingFrameReason(sheets: Record<CharacterId, Spritesheet>): string | null {
  for (const characterId of CHARACTER_IDS) {
    const sheet = sheets[characterId];
    for (const frameName of REQUIRED_FRAME_NAMES) {
      if (!sheet.textures[frameName]) {
        return `missing frame "${frameName}" in atlas fighters/${characterId}`;
      }
    }
  }

  return null;
}

function applyAtlasTextureSourcePreferences(sheets: Record<CharacterId, Spritesheet>): void {
  for (const characterId of CHARACTER_IDS) {
    const textureSource = sheets[characterId].textureSource;
    textureSource.scaleMode = 'linear';
    textureSource.autoGenerateMipmaps = true;
  }
}

function createSheetScopedTextureProvider(sheets: Record<CharacterId, Spritesheet>): TextureProvider {
  return {
    getTexture(characterId: CharacterId, part: FighterPart) {
      const frameName = FRAME_NAME_BY_PART[part];
      const texture = sheets[characterId].textures[frameName];
      return texture ?? Texture.EMPTY;
    },
  };
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutHandle = setTimeout(() => {
      reject(new Error(`fighter assets preload timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timeoutHandle);
        resolve(result);
      })
      .catch((error: unknown) => {
        clearTimeout(timeoutHandle);
        reject(error);
      });
  });
}
