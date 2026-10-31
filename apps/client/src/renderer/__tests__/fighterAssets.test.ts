import type { CharacterId } from '@smash/shared';
import { Rectangle, Texture } from 'pixi.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createPixiAssetLoaderFacade,
  preloadFighterAssets,
  type FighterAssetLoaderFacade,
} from '../fighterAssets.js';
import type { FighterPart } from '../parts/IPartRenderer.js';
import { SpritePartRenderer } from '../parts/SpritePartRenderer.js';

const CHARACTER_IDS: readonly CharacterId[] = ['all-rounder', 'abe-lincoln', 'swift'] as const;
const PARTS: readonly FighterPart[] = ['HEAD', 'BODY', 'ARM_L', 'ARM_R', 'LEG_L', 'LEG_R'] as const;

const FRAME_NAME_BY_PART: Record<FighterPart, string> = {
  HEAD: 'head.png',
  BODY: 'body.png',
  ARM_L: 'arm_l.png',
  ARM_R: 'arm_r.png',
  LEG_L: 'leg_l.png',
  LEG_R: 'leg_r.png',
};

function buildTexture(id: number): Texture {
  return new Texture({
    source: Texture.WHITE.source,
    frame: new Rectangle(0, 0, 80 + id, 80 + id),
    orig: new Rectangle(0, 0, 80 + id, 80 + id),
  });
}

interface FakeSheet {
  readonly textures: Record<string, Texture>;
  readonly textureSource: {
    scaleMode: string;
    autoGenerateMipmaps: boolean;
  };
}

function createFakeSheet(seed: number): FakeSheet {
  return {
    textures: {
      'head.png': buildTexture(seed + 1),
      'body.png': buildTexture(seed + 2),
      'arm_l.png': buildTexture(seed + 3),
      'arm_r.png': buildTexture(seed + 4),
      'leg_l.png': buildTexture(seed + 5),
      'leg_r.png': buildTexture(seed + 6),
    },
    textureSource: {
      scaleMode: 'nearest',
      autoGenerateMipmaps: false,
    },
  };
}

function createBundleWithSheets(): {
  readonly bundle: Record<string, unknown>;
  readonly sheets: Record<CharacterId, FakeSheet>;
} {
  const allRounder = createFakeSheet(0);
  const lincoln = createFakeSheet(100);
  const swift = createFakeSheet(200);

  return {
    sheets: {
      'all-rounder': allRounder,
      'abe-lincoln': lincoln,
      swift,
    },
    bundle: {
      'fighters/all-rounder': allRounder,
      'fighters/abe-lincoln': lincoln,
      'fighters/swift': swift,
    },
  };
}

class FakeLoader implements FighterAssetLoaderFacade {
  initCalls: unknown[] = [];
  loadBundleCalls: string[] = [];

  initImpl: (options: unknown) => Promise<void> = async () => {
    void 0;
  };

  loadBundleImpl: (bundleName: string) => Promise<Record<string, unknown>> = async () => {
    return {};
  };

  init(options: unknown): Promise<void> {
    this.initCalls.push(options);
    return this.initImpl(options);
  }

  loadBundle(bundleName: string): Promise<Record<string, unknown>> {
    this.loadBundleCalls.push(bundleName);
    return this.loadBundleImpl(bundleName);
  }
}

describe('fighterAssets preload', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('Given successful bundle load, When preloading, Then mode is sprite and all 18 lookups resolve to the expected character sheet textures', async () => {
    const loader = new FakeLoader();
    const { bundle, sheets } = createBundleWithSheets();
    loader.loadBundleImpl = async () => bundle;

    const result = await preloadFighterAssets({ loader, locationSearch: '' });

    expect(result.mode).toBe('sprite');
    if (result.mode !== 'sprite') {
      return;
    }

    const expected = new Map<string, Texture>();
    for (const characterId of CHARACTER_IDS) {
      for (const part of PARTS) {
        const expectedTexture = sheets[characterId].textures[FRAME_NAME_BY_PART[part]];
        if (!expectedTexture) {
          throw new Error(`missing fixture texture for ${characterId}:${part}`);
        }
        expected.set(
          `${characterId}:${part}`,
          expectedTexture,
        );
      }
    }

    for (const [key, texture] of expected.entries()) {
      const [characterId, part] = key.split(':') as [CharacterId, FighterPart];
      expect(result.provider.getTexture(characterId, part)).toBe(texture);
    }

    expect(result.provider.getTexture('all-rounder', 'HEAD')).not.toBe(
      result.provider.getTexture('swift', 'HEAD'),
    );
    expect(result.provider.getTexture('abe-lincoln', 'BODY')).not.toBe(
      result.provider.getTexture('all-rounder', 'BODY'),
    );
  });

  it('Given successful preload, When inspecting init args and texture sources, Then texturePreference and atlas source preferences are applied', async () => {
    const loader = new FakeLoader();
    const { bundle, sheets } = createBundleWithSheets();
    loader.loadBundleImpl = async () => bundle;

    Object.defineProperty(window, 'devicePixelRatio', {
      configurable: true,
      value: 3,
    });

    const result = await preloadFighterAssets({ loader, locationSearch: '' });

    expect(result.mode).toBe('sprite');
    expect(loader.initCalls).toHaveLength(1);
    expect(loader.loadBundleCalls).toEqual(['fighters']);

    const initCall = loader.initCalls[0] as {
      texturePreference?: {
        resolution?: number;
        format?: string[];
      };
      manifest?: string;
    };

    expect(initCall.manifest).toBe('/assets/manifest.json');
    expect(initCall.texturePreference).toEqual({
      resolution: 3,
      format: ['webp', 'png'],
    });

    for (const characterId of CHARACTER_IDS) {
      expect(sheets[characterId].textureSource.scaleMode).toBe('linear');
      expect(sheets[characterId].textureSource.autoGenerateMipmaps).toBe(true);
    }
  });

  it('Given bundle rejection, When preloading, Then it degrades to polygon without throwing', async () => {
    const loader = new FakeLoader();
    loader.loadBundleImpl = async () => {
      throw new Error('bundle rejected');
    };

    const warn = vi.fn();

    await expect(
      preloadFighterAssets({ loader, logger: { warn }, locationSearch: '' }),
    ).resolves.toEqual({ mode: 'polygon' });
    expect(warn).toHaveBeenCalled();
  });

  it('Given one missing frame in any character sheet, When preloading, Then it degrades to polygon', async () => {
    const loader = new FakeLoader();
    const { bundle } = createBundleWithSheets();
    const swiftSheet = bundle['fighters/swift'] as FakeSheet;
    delete swiftSheet.textures['head.png'];
    loader.loadBundleImpl = async () => bundle;

    const warn = vi.fn();
    const result = await preloadFighterAssets({ loader, logger: { warn }, locationSearch: '' });

    expect(result).toEqual({ mode: 'polygon' });
    expect(warn).toHaveBeenCalled();
  });

  it('Given never-resolving loadBundle, When timeout reaches 5000ms, Then it degrades to polygon', async () => {
    vi.useFakeTimers();

    const loader = new FakeLoader();
    loader.loadBundleImpl = () => new Promise(() => {
      void 0;
    });

    const preloadPromise = preloadFighterAssets({ loader, locationSearch: '' });

    await vi.advanceTimersByTimeAsync(5000);

    await expect(preloadPromise).resolves.toEqual({ mode: 'polygon' });
  });

  it('Given ?renderer=polygon, When preloading, Then polygon mode is forced and loader is not called', async () => {
    const loader = new FakeLoader();

    const result = await preloadFighterAssets({
      loader,
      locationSearch: '?renderer=polygon',
    });

    expect(result).toEqual({ mode: 'polygon' });
    expect(loader.initCalls).toHaveLength(0);
    expect(loader.loadBundleCalls).toHaveLength(0);
  });

  it('Given boot flow, When preloading then constructing renderer, Then preload completes before first SpritePartRenderer construction', async () => {
    const events: string[] = [];
    const loader = new FakeLoader();
    const { bundle } = createBundleWithSheets();
    loader.loadBundleImpl = async () => {
      events.push('bundle-loaded');
      return bundle;
    };

    events.push('preload-start');
    const preloadResult = await preloadFighterAssets({ loader, locationSearch: '' });
    events.push('preload-complete');

    expect(preloadResult.mode).toBe('sprite');
    if (preloadResult.mode !== 'sprite') {
      return;
    }

    new SpritePartRenderer('all-rounder', 0, preloadResult.provider);
    events.push('renderer-constructed');

    expect(events).toEqual([
      'preload-start',
      'bundle-loaded',
      'preload-complete',
      'renderer-constructed',
    ]);
  });

  it('Given manifest init failure, When preloading, Then polygon mode is returned, warning is logged, and no exception escapes', async () => {
    const loader = new FakeLoader();
    loader.initImpl = async () => {
      throw new Error('manifest not found');
    };
    const warn = vi.fn();

    await expect(
      preloadFighterAssets({ loader, logger: { warn }, locationSearch: '' }),
    ).resolves.toEqual({ mode: 'polygon' });
    expect(warn).toHaveBeenCalled();
  });
});

describe('createPixiAssetLoaderFacade', () => {
  it('returns a facade with init/loadBundle functions', () => {
    const facade = createPixiAssetLoaderFacade();
    expect(typeof facade.init).toBe('function');
    expect(typeof facade.loadBundle).toBe('function');
  });
});
