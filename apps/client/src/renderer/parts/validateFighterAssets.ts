import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import type { CharacterId } from '@smash/shared';
import {
  FIGHTER_VISUAL_CONTRACTS,
  type FighterPartFilename,
  type FighterVisualContract,
} from './assetContract.js';
import {
  type AssetValidationResult,
  type DecodedPngImage,
  type FighterAssetProvider,
  validateFighterAssets,
} from './assetValidator.js';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const RAW_ASSET_ROOT = path.resolve(MODULE_DIR, '..', '..', '..', '..', '..', 'raw-assets', 'fighters{m}');

export interface RunAssetValidationOptions {
  readonly rootDir?: string;
  readonly contracts?: Record<CharacterId, FighterVisualContract>;
}

export interface RunAssetValidationResult {
  readonly ok: boolean;
  readonly report: string;
  readonly result: AssetValidationResult;
}

export class FsPngAssetProvider implements FighterAssetProvider {
  private readonly rootDir: string;

  constructor(rootDir: string) {
    this.rootDir = rootDir;
  }

  async listFilenames(characterId: CharacterId): Promise<readonly string[] | null> {
    const directoryPath = this.characterDir(characterId);
    try {
      const dirEntries = await fs.readdir(directoryPath, { withFileTypes: true });
      return dirEntries.filter((entry) => entry.isFile()).map((entry) => entry.name);
    } catch (error: unknown) {
      if (isErrorWithCode(error) && error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async readPng(characterId: CharacterId, filename: FighterPartFilename): Promise<DecodedPngImage | null> {
    const assetPath = path.join(this.characterDir(characterId), filename);
    try {
      const data = await fs.readFile(assetPath);
      const parsed = PNG.sync.read(data);
      return {
        width: parsed.width,
        height: parsed.height,
        data: new Uint8Array(parsed.data),
      };
    } catch (error: unknown) {
      if (isErrorWithCode(error) && error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  private characterDir(characterId: CharacterId): string {
    return path.join(this.rootDir, `${characterId}{tps}`);
  }
}

export async function runFighterAssetValidation(
  options: RunAssetValidationOptions = {},
): Promise<RunAssetValidationResult> {
  const rootDir = options.rootDir ?? RAW_ASSET_ROOT;
  const provider = new FsPngAssetProvider(rootDir);
  const result = await validateFighterAssets({
    provider,
    contracts: options.contracts ?? FIGHTER_VISUAL_CONTRACTS,
  });

  const report = formatAssetValidationReport(result);
  const ok = result.violations.length === 0;
  return { ok, report, result };
}

export function formatAssetValidationReport(result: AssetValidationResult): string {
  const lines: string[] = [];
  lines.push(`assets-checked=${result.assetsChecked}`);

  if (result.skippedCharacters.length > 0) {
    lines.push('skips:');
    for (const skipped of result.skippedCharacters) {
      lines.push(`  - ${skipped.message}`);
    }
  }

  if (result.violations.length > 0) {
    lines.push(`violations=${result.violations.length}`);
    for (const violation of result.violations) {
      lines.push(`  - ${violation.message}`);
    }
  } else {
    lines.push('violations=0');
  }

  return lines.join('\n');
}

interface ErrorWithCode {
  readonly code?: string;
}

function isErrorWithCode(error: unknown): error is ErrorWithCode {
  return typeof error === 'object' && error !== null && 'code' in error;
}
