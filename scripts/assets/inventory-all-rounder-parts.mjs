#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');

const baseDir = path.join(
  repoRoot,
  'raw-assets',
  'fighters{m}',
  'all-rounder{tps}',
);

const parts = ['head', 'body', 'arm_l', 'arm_r', 'leg_l', 'leg_r'];

function alphaBounds(png) {
  let minX = png.width;
  let minY = png.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const idx = (png.width * y + x) << 2;
      if (png.data[idx + 3] > 0) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < 0) return null;
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

for (const part of parts) {
  const file = path.join(baseDir, `${part}.png`);
  const png = PNG.sync.read(fs.readFileSync(file));
  const bounds = alphaBounds(png);
  console.log(
    `${part}.png|${png.width}x${png.height}|${bounds ? `${bounds.minX},${bounds.minY},${bounds.maxX},${bounds.maxY}` : 'none'}`,
  );
}
