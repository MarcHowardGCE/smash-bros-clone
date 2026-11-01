import path from 'node:path';
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { compress } from '@assetpack/core/image';
import { pixiManifest } from '@assetpack/core/manifest';
import { texturePacker, texturePackerCompress } from '@assetpack/core/texture-packer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLIENT_ROOT = __dirname;
const REPO_ROOT = path.resolve(CLIENT_ROOT, '..', '..');
const ENTRY_ROOT = path.resolve(REPO_ROOT, 'raw-assets');
const PUBLIC_ASSETS_ROOT = path.resolve(CLIENT_ROOT, 'public', 'assets');

const CHARACTER_IDS = ['all-rounder', 'abe-lincoln', 'swift'];

function normalizeSrc(src) {
  if (src.startsWith('/')) {
    return src;
  }
  return `/assets/${src.replace(/\\/g, '/')}`;
}

function getCharacterIdFromSources(src) {
  const srcCandidates = src.map((entry) => (typeof entry === 'string' ? entry : entry.src));
  for (const candidate of srcCandidates) {
    const match = candidate.match(/^fighters\/([^@/.]+)(?:[^/]*)\.(?:json)$/);
    if (match?.[1]) {
      return match[1];
    }
  }

  throw new Error(`[assetpack] unable to derive character id from sources: ${srcCandidates.join(', ')}`);
}

function normalizeFightersManifest(manifestPath) {
  return {
    name: 'fighters-manifest-normalizer',
    defaultOptions: {},
    async finish() {
      const raw = await fs.readFile(manifestPath, 'utf8');
      const parsed = JSON.parse(raw);

      if (!Array.isArray(parsed.bundles)) {
        throw new Error('[assetpack] manifest bundles is not an array');
      }

      const fightersBundle = parsed.bundles.find((bundle) => bundle?.name === 'fighters');
      if (!fightersBundle || !Array.isArray(fightersBundle.assets)) {
        throw new Error('[assetpack] missing fighters bundle in manifest output');
      }

      const normalizedAssets = fightersBundle.assets.map((asset) => {
        if (!Array.isArray(asset?.src)) {
          throw new Error('[assetpack] fighters bundle asset has invalid src array');
        }

        const characterId = getCharacterIdFromSources(asset.src);
        return {
          ...asset,
          alias: `fighters/${characterId}`,
          src: asset.src.map((entry) => {
            if (typeof entry === 'string') {
              return normalizeSrc(entry);
            }

            return {
              ...entry,
              src: normalizeSrc(entry.src),
            };
          }),
        };
      });

      const normalizedByCharacter = CHARACTER_IDS.map((characterId) => {
        const asset = normalizedAssets.find((entry) => entry.alias === `fighters/${characterId}`);
        if (!asset) {
          throw new Error(`[assetpack] missing fighters/${characterId} alias in manifest`);
        }
        return asset;
      });

      const normalizedManifest = {
        bundles: [
          {
            name: 'fighters',
            assets: normalizedByCharacter,
          },
        ],
      };

      await fs.writeFile(manifestPath, `${JSON.stringify(normalizedManifest, null, 2)}\n`, 'utf8');

      const fightersDir = path.resolve(path.dirname(manifestPath), 'fighters');
      const fighterEntries = await fs.readdir(fightersDir, { withFileTypes: true });
      const atlasJsonFiles = fighterEntries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
        .map((entry) => entry.name);

      for (const jsonFile of atlasJsonFiles) {
        const atlasPath = path.join(fightersDir, jsonFile);
        const atlasRaw = await fs.readFile(atlasPath, 'utf8');
        const atlasJson = JSON.parse(atlasRaw);

        if (typeof atlasJson?.meta?.image === 'string') {
          const imageName = path.basename(atlasJson.meta.image);
          atlasJson.meta.image = normalizeSrc(`fighters/${imageName}`);
        }

        await fs.writeFile(atlasPath, `${JSON.stringify(atlasJson, null, 2)}\n`, 'utf8');
      }
    },
  };
}

export function createAssetPackConfig(outputDir = PUBLIC_ASSETS_ROOT) {
  const manifestPath = path.resolve(outputDir, 'manifest.json');

  return {
    entry: ENTRY_ROOT,
    output: outputDir,
    pipes: [
      texturePacker({
        texturePacker: {
          padding: 4,
          allowRotation: false,
          allowTrim: true,
          nameStyle: 'relative',
          removeFileExtension: false,
          autodetectAnimations: false,
        },
        resolutionOptions: {
          resolutions: {
            low: 1,
            high: 2,
          },
          fixedResolution: 'low',
          maximumTextureSize: 2048,
        },
      }),
      compress({
        png: true,
        jpg: false,
        webp: true,
        avif: false,
        astc: false,
        bc7: false,
        basis: false,
        etc: false,
      }),
      texturePackerCompress({
        png: true,
        webp: true,
        avif: false,
        astc: false,
        bc7: false,
        basis: false,
        etc: false,
      }),
      pixiManifest({
        output: manifestPath,
        createShortcuts: false,
        trimExtensions: false,
        includeMetaData: true,
        includeFileSizes: false,
        nameStyle: 'short',
      }),
      normalizeFightersManifest(manifestPath),
    ],
  };
}

export const assetPackConfig = createAssetPackConfig();
