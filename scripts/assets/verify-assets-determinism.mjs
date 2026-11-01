#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createAssetPackConfig } from '../../apps/client/assetpack.config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const COMMITTED_ASSETS_DIR = path.resolve(REPO_ROOT, 'apps', 'client', 'public', 'assets');
const CLIENT_PACKAGE_JSON = path.resolve(REPO_ROOT, 'apps', 'client', 'package.json');

const requireFromClient = createRequire(CLIENT_PACKAGE_JSON);
const assetPackModulePath = requireFromClient.resolve('@assetpack/core');
const { AssetPack } = await import(pathToFileURL(assetPackModulePath).href);

const CHARACTER_IDS = ['all-rounder', 'abe-lincoln', 'swift'];
const LINE_ENDING_INSENSITIVE_EXTENSIONS = new Set(['.json', '.md', '.txt', '.js', '.mjs', '.cjs', '.ts', '.tsx', '.yml', '.yaml']);
const FRAME_EXPECTATIONS = {
  head: { w: 160, h: 160 },
  body: { w: 160, h: 160 },
  arm_l: { w: 64, h: 128 },
  arm_r: { w: 64, h: 128 },
  leg_l: { w: 64, h: 128 },
  leg_r: { w: 64, h: 128 },
};

async function main() {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'assetpack-determinism-'));
  const outputA = path.join(tempRoot, 'run-a');
  const outputB = path.join(tempRoot, 'run-b');

  await runAssetPack(outputA);
  await runAssetPack(outputB);

  await assertDirectoryMatch(outputA, outputB, 'run-a', 'run-b');
  await assertDirectoryMatch(outputA, COMMITTED_ASSETS_DIR, 'run-a', 'committed-assets');
  await assertAtlasContract(outputA);
  await assertNoUntrackedInCommittedAssets();

  console.log('ok: deterministic generation and committed output checks passed');
}

async function runAssetPack(outputDir) {
  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });
  const assetPack = new AssetPack(createAssetPackConfig(outputDir));
  await assetPack.run();
}

async function assertDirectoryMatch(leftDir, rightDir, leftLabel, rightLabel) {
  const leftEntries = await listFilesWithHashes(leftDir);
  const rightEntries = await listFilesWithHashes(rightDir);

  const leftMap = new Map(leftEntries.map((entry) => [entry.relativePath, entry.hash]));
  const rightMap = new Map(rightEntries.map((entry) => [entry.relativePath, entry.hash]));

  const leftKeys = [...leftMap.keys()].sort();
  const rightKeys = [...rightMap.keys()].sort();

  const missingInRight = leftKeys.filter((key) => !rightMap.has(key));
  const missingInLeft = rightKeys.filter((key) => !leftMap.has(key));
  const mismatched = leftKeys.filter((key) => rightMap.has(key) && leftMap.get(key) !== rightMap.get(key));

  if (missingInRight.length > 0 || missingInLeft.length > 0 || mismatched.length > 0) {
    const details = [
      missingInRight.length > 0
        ? `missing in ${rightLabel}: ${missingInRight.join(', ')}`
        : null,
      missingInLeft.length > 0 ? `missing in ${leftLabel}: ${missingInLeft.join(', ')}` : null,
      mismatched.length > 0 ? `byte mismatches: ${mismatched.join(', ')}` : null,
    ]
      .filter(Boolean)
      .join(' | ');

    throw new Error(`determinism mismatch ${leftLabel} vs ${rightLabel} :: ${details}`);
  }
}

async function listFilesWithHashes(rootDir) {
  const output = [];

  async function walk(currentDir) {
    const dirEntries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const dirEntry of dirEntries) {
      const absolutePath = path.join(currentDir, dirEntry.name);
      if (dirEntry.isDirectory()) {
        await walk(absolutePath);
        continue;
      }

      const data = await fs.readFile(absolutePath);
      const relativePath = path.relative(rootDir, absolutePath).replace(/\\/g, '/');
      output.push({
        relativePath,
        hash: hashForDeterminism(relativePath, data),
      });
    }
  }

  await walk(rootDir);
  output.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  return output;
}

function hashForDeterminism(relativePath, data) {
  const extension = path.extname(relativePath).toLowerCase();

  if (LINE_ENDING_INSENSITIVE_EXTENSIONS.has(extension)) {
    const normalized = data
      .toString('utf8')
      .replace(/\r\n/g, '\n');
    return createHash('sha256').update(normalized, 'utf8').digest('hex');
  }

  return createHash('sha256').update(data).digest('hex');
}

async function assertAtlasContract(outputDir) {
  for (const characterId of CHARACTER_IDS) {
    for (const extension of ['png', 'webp']) {
      const jsonPath = path.join(outputDir, 'fighters', `${characterId}@2x.${extension}.json`);
      const jsonRaw = await fs.readFile(jsonPath, 'utf8');
      const json = JSON.parse(jsonRaw);

      if (json?.meta?.scale !== 2) {
        throw new Error(`${jsonPath}: expected meta.scale=2, got ${String(json?.meta?.scale)}`);
      }

      const width = Number(json?.meta?.size?.w ?? 0);
      const height = Number(json?.meta?.size?.h ?? 0);
      if (width > 2048 || height > 2048) {
        throw new Error(`${jsonPath}: page exceeds 2048x2048 (${width}x${height})`);
      }

      const frames = json?.frames ?? {};
      for (const [frameName, expectedSourceSize] of Object.entries(FRAME_EXPECTATIONS)) {
        const frameKey = `${frameName}.png`;
        const sourceSize = frames?.[frameKey]?.sourceSize;
        const actualW = Number(sourceSize?.w ?? 0);
        const actualH = Number(sourceSize?.h ?? 0);
        if (actualW !== expectedSourceSize.w || actualH !== expectedSourceSize.h) {
          throw new Error(
            `${jsonPath}: frame ${frameKey} sourceSize expected ${expectedSourceSize.w}x${expectedSourceSize.h}, got ${actualW}x${actualH}`,
          );
        }
      }
    }
  }
}

async function assertNoUntrackedInCommittedAssets() {
  const status = await runCommand('git', ['status', '--porcelain', '--', 'apps/client/public/assets']);

  const lines = status
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const untracked = lines.filter((line) => line.startsWith('??'));
  if (untracked.length > 0) {
    throw new Error(`untracked generated assets detected: ${untracked.join(', ')}`);
  }

}

async function runCommand(command, args) {
  return await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: REPO_ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf8');
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8');
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

main().catch((error) => {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error('unknown failure');
  }
  process.exitCode = 1;
});
