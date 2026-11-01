import { test, expect } from '@playwright/test';
import { AssetPack } from '@assetpack/core';
import { PNG } from 'pngjs';
import { promises as fs } from 'node:fs';
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAssetPackConfig } from '../assetpack.config.mjs';
import { runFighterAssetValidation } from '../src/renderer/parts/validateFighterAssets.js';

const CURRENT_FILE = fileURLToPath(import.meta.url);
const CURRENT_DIR = path.dirname(CURRENT_FILE);

const REPO_ROOT = path.resolve(CURRENT_DIR, '..', '..', '..');
const CLIENT_ASSETS_ROOT = path.resolve(REPO_ROOT, 'apps', 'client', 'public', 'assets');
const EVIDENCE_DIR = path.resolve(REPO_ROOT, 'docs', 'assets', 'evidence');
const SWAP_SCREENSHOT = path.resolve(EVIDENCE_DIR, 'todo-12-swap-proof.png');

const CHARACTER_IDS = ['all-rounder', 'abe-lincoln', 'swift'] as const;
const PART_SPECS = {
  head: { width: 160, height: 160 },
  body: { width: 160, height: 160 },
  arm_l: { width: 64, height: 128 },
  arm_r: { width: 64, height: 128 },
  leg_l: { width: 64, height: 128 },
  leg_r: { width: 64, height: 128 },
} as const;

const UNIQUE_HEAD_RGB = { r: 255, g: 0, b: 255 } as const;
const TINT_NEUTRAL_RGB = { r: 245, g: 245, b: 245 } as const;
const OUTLINE_RGB = { r: 16, g: 16, b: 16 } as const;

type Rgb = {
  readonly r: number;
  readonly g: number;
  readonly b: number;
};

async function writePng(filePath: string, width: number, height: number, draw: (x: number, y: number) => Rgb | null): Promise<void> {
  const image = new PNG({ width, height });

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (width * y + x) * 4;
      const rgb = draw(x, y);
      if (rgb === null) {
        image.data[idx] = 0;
        image.data[idx + 1] = 0;
        image.data[idx + 2] = 0;
        image.data[idx + 3] = 0;
        continue;
      }

      image.data[idx] = rgb.r;
      image.data[idx + 1] = rgb.g;
      image.data[idx + 2] = rgb.b;
      image.data[idx + 3] = 255;
    }
  }

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, PNG.sync.write(image));
}

async function createReplacementRawPack(tempRoot: string): Promise<string> {
  const rawRoot = path.join(tempRoot, 'raw-assets');

  for (const characterId of CHARACTER_IDS) {
    const characterDir = path.join(rawRoot, 'fighters{m}', `${characterId}{tps}`);

    await writePng(path.join(characterDir, 'head.png'), PART_SPECS.head.width, PART_SPECS.head.height, (x, y) => {
      const withinHeadCircle = (x - 80) * (x - 80) + (y - 80) * (y - 80) <= 54 * 54;
      if (!withinHeadCircle) {
        return null;
      }
      if (x >= 70 && x <= 89 && y >= 70 && y <= 89) {
        return UNIQUE_HEAD_RGB;
      }
      return OUTLINE_RGB;
    });

    await writePng(path.join(characterDir, 'body.png'), PART_SPECS.body.width, PART_SPECS.body.height, (x, y) => {
      const inside = x >= 36 && x <= 123 && y >= 34 && y <= 131;
      if (!inside) {
        return null;
      }
      const isOutline = x <= 39 || x >= 120 || y <= 37 || y >= 128;
      return isOutline ? OUTLINE_RGB : TINT_NEUTRAL_RGB;
    });

    const limbDraw = (x: number, y: number): Rgb | null => {
      const inside = x >= 24 && x <= 39 && y >= 8 && y <= 63;
      if (!inside) {
        return null;
      }
      const isOutline = x <= 25 || x >= 38 || y <= 9 || y >= 62;
      return isOutline ? OUTLINE_RGB : TINT_NEUTRAL_RGB;
    };

    await writePng(path.join(characterDir, 'arm_l.png'), PART_SPECS.arm_l.width, PART_SPECS.arm_l.height, limbDraw);
    await writePng(path.join(characterDir, 'arm_r.png'), PART_SPECS.arm_r.width, PART_SPECS.arm_r.height, limbDraw);
    await writePng(path.join(characterDir, 'leg_l.png'), PART_SPECS.leg_l.width, PART_SPECS.leg_l.height, limbDraw);
    await writePng(path.join(characterDir, 'leg_r.png'), PART_SPECS.leg_r.width, PART_SPECS.leg_r.height, limbDraw);
  }

  return rawRoot;
}

async function assertReplacementPackValid(rawEntry: string): Promise<void> {
  const validation = await runFighterAssetValidation({
    rootDir: path.join(rawEntry, 'fighters{m}'),
  });

  if (!validation.ok) {
    throw new Error(`replacement raw pack violates fighter asset contract:\n${validation.report}`);
  }
}

async function runRepoCommand(command: string, args: readonly string[]): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const child = spawn(command, [...args], {
      cwd: REPO_ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk: unknown) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk: unknown) => {
      stderr += chunk.toString();
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve(stdout);
        return;
      }
      reject(new Error(`${command} ${args.join(' ')} failed (${String(code)}): ${stderr || stdout}`));
    });
  });
}

async function generateReplacementAssets(tempRoot: string, rawEntry: string): Promise<string> {
  const outputDir = path.join(tempRoot, 'generated-assets');
  const config = createAssetPackConfig(outputDir) as { entry: string };
  config.entry = rawEntry;
  const assetPack = new AssetPack(config);
  await assetPack.run();
  await normalizeAtlasImagePaths(outputDir);
  return outputDir;
}

async function normalizeAtlasImagePaths(outputDir: string): Promise<void> {
  const fightersDir = path.join(outputDir, 'fighters');
  const entries = await fs.readdir(fightersDir, { withFileTypes: true });
  const atlasFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name);

  for (const atlasFile of atlasFiles) {
    const atlasPath = path.join(fightersDir, atlasFile);
    const raw = await fs.readFile(atlasPath, 'utf8');
    const parsed = JSON.parse(raw) as { meta?: { image?: string } };
    const currentImage = parsed.meta?.image;
    if (!currentImage) {
      continue;
    }

    const normalizedImage = path.basename(currentImage);
    if (!parsed.meta) {
      parsed.meta = { image: normalizedImage };
    } else {
      parsed.meta.image = normalizedImage;
    }

    await fs.writeFile(atlasPath, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8');
  }
}

async function swapPublicAssets(generatedAssetsDir: string): Promise<() => Promise<void>> {
  const backupDir = await fs.mkdtemp(path.join(os.tmpdir(), 'todo-12-assets-backup-'));
  const backupManifest = path.join(backupDir, 'manifest.json');
  const backupFighters = path.join(backupDir, 'fighters');

  await fs.cp(path.join(CLIENT_ASSETS_ROOT, 'manifest.json'), backupManifest);
  await fs.cp(path.join(CLIENT_ASSETS_ROOT, 'fighters'), backupFighters, { recursive: true });

  await fs.cp(path.join(generatedAssetsDir, 'manifest.json'), path.join(CLIENT_ASSETS_ROOT, 'manifest.json'));
  await fs.rm(path.join(CLIENT_ASSETS_ROOT, 'fighters'), { recursive: true, force: true });
  await fs.cp(path.join(generatedAssetsDir, 'fighters'), path.join(CLIENT_ASSETS_ROOT, 'fighters'), { recursive: true });

  return async () => {
    await fs.cp(backupManifest, path.join(CLIENT_ASSETS_ROOT, 'manifest.json'));
    await fs.rm(path.join(CLIENT_ASSETS_ROOT, 'fighters'), { recursive: true, force: true });
    await fs.cp(backupFighters, path.join(CLIENT_ASSETS_ROOT, 'fighters'), { recursive: true });
    await fs.rm(backupDir, { recursive: true, force: true });
  };
}

function countNearColorPixels(image: PNG, target: Rgb, tolerance: number): number {
  let count = 0;
  for (let idx = 0; idx < image.data.length; idx += 4) {
    const alpha = image.data[idx + 3] ?? 0;
    if (alpha < 180) {
      continue;
    }

    const red = image.data[idx] ?? 0;
    const green = image.data[idx + 1] ?? 0;
    const blue = image.data[idx + 2] ?? 0;

    if (
      Math.abs(red - target.r) <= tolerance
      && Math.abs(green - target.g) <= tolerance
      && Math.abs(blue - target.b) <= tolerance
    ) {
      count += 1;
    }
  }

  return count;
}

test('replacement asset pack renders in Chromium via real AssetPack->Assets->renderer pipeline', async ({ page }, testInfo) => {
  if (!testInfo.project.name.includes('dpr-1')) {
    test.skip();
  }
  test.setTimeout(120_000);
  const preloadWarnings: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'warning' && message.text().includes('[fighterAssets]')) {
      preloadWarnings.push(message.text());
    }
  });

  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'todo-12-replacement-pack-'));
  const rawEntry = await createReplacementRawPack(tempRoot);
  await assertReplacementPackValid(rawEntry);
  const generatedAssetsDir = await generateReplacementAssets(tempRoot, rawEntry);
  const restorePublicAssets = await swapPublicAssets(generatedAssetsDir);

  try {
    await page.goto('/');
    await page.waitForSelector('#splash-screen', { timeout: 10_000 });
    await page.click('#splash-screen');
    await page.waitForSelector('#local-play-btn', { timeout: 10_000 });
    await page.waitForTimeout(2_000);

    await page.click('#local-play-btn');
    await page.waitForSelector('#lps-start-btn', { timeout: 10_000 });
    await page.click('#lps-start-btn');
    await page.waitForSelector('[data-player="1"][data-id="all-rounder"]', { timeout: 10_000 });
    await page.click('[data-player="1"][data-id="all-rounder"]');
    await page.keyboard.press('Enter');
    await page.waitForSelector('[data-stage-idx="0"]', { timeout: 10_000 });
    await page.click('[data-stage-idx="0"]');

    await page.waitForFunction(() => {
      const hudPanel = document.getElementById('hud-panel');
      if (!hudPanel) {
        return false;
      }
      const style = window.getComputedStyle(hudPanel);
      return style.display !== 'none';
    }, { timeout: 30_000, polling: 100 });

    await page.waitForTimeout(500);
    await page.screenshot({ path: SWAP_SCREENSHOT });

    const screenshotBuffer = await fs.readFile(SWAP_SCREENSHOT);
    const screenshotImage = PNG.sync.read(screenshotBuffer);
    const magentaPixels = countNearColorPixels(screenshotImage, UNIQUE_HEAD_RGB, 28);

    expect(preloadWarnings).toEqual([]);
    // Marker survives sprite scaling/AA in the in-match camera; keep a conservative floor.
    expect(magentaPixels).toBeGreaterThan(80);
  } finally {
    await restorePublicAssets();
    await runRepoCommand('node', ['scripts/assets/verify-assets-determinism.mjs']);
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});
