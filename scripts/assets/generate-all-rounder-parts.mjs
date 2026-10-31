#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');

const outputDir = path.join(
  repoRoot,
  'raw-assets',
  'fighters{m}',
  'all-rounder{tps}',
);

const PARTS = {
  head: {
    width: 160,
    height: 160,
    draw: (png) => {
      // Head canvas contract: 160x160, joint at (80,80)
      fillCircle(png, 80, 80, 26, 242, 211, 179, 255);
      // Simple hair cap for a cartoon silhouette
      fillEllipse(png, 80, 65, 28, 11, 56, 34, 20, 255);
      fillRect(png, 52, 65, 56, 8, 56, 34, 20, 255);
    },
  },
  body: {
    width: 160,
    height: 160,
    draw: (png) => {
      // Body contract reference area in raw px: x=36, y=36, w=88, h=88
      fillRoundedRect(png, 36, 36, 88, 88, 18, 245, 245, 245, 255);
    },
  },
  arm_l: {
    width: 64,
    height: 128,
    draw: (png) => {
      // Arm contract reference area in raw px: x=25, y=8, w=14, h=44
      fillRoundedRect(png, 25, 8, 14, 44, 6, 245, 245, 245, 255);
      // Explicit opaque 12px underlap below joint y=8 => [8, 20)
      fillRect(png, 25, 8, 14, 12, 245, 245, 245, 255);
    },
  },
  arm_r: {
    width: 64,
    height: 128,
    draw: (png) => {
      fillRoundedRect(png, 25, 8, 14, 44, 6, 245, 245, 245, 255);
      fillRect(png, 25, 8, 14, 12, 245, 245, 245, 255);
    },
  },
  leg_l: {
    width: 64,
    height: 128,
    draw: (png) => {
      // Leg contract reference area in raw px: x=24, y=8, w=16, h=48
      fillRoundedRect(png, 24, 8, 16, 48, 7, 245, 245, 245, 255);
      fillRect(png, 24, 8, 16, 12, 245, 245, 245, 255);
    },
  },
  leg_r: {
    width: 64,
    height: 128,
    draw: (png) => {
      fillRoundedRect(png, 24, 8, 16, 48, 7, 245, 245, 245, 255);
      fillRect(png, 24, 8, 16, 12, 245, 245, 245, 255);
    },
  },
};

function createPng(width, height) {
  return new PNG({ width, height });
}

function setPixel(png, x, y, r, g, b, a) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return;
  const idx = (png.width * y + x) << 2;
  png.data[idx] = r;
  png.data[idx + 1] = g;
  png.data[idx + 2] = b;
  png.data[idx + 3] = a;
}

function fillRect(png, x, y, w, h, r, g, b, a) {
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) {
      setPixel(png, xx, yy, r, g, b, a);
    }
  }
}

function fillCircle(png, cx, cy, radius, r, g, b, a) {
  const rr = radius * radius;
  for (let y = cy - radius; y <= cy + radius; y += 1) {
    for (let x = cx - radius; x <= cx + radius; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= rr) {
        setPixel(png, x, y, r, g, b, a);
      }
    }
  }
}

function fillEllipse(png, cx, cy, rx, ry, r, g, b, a) {
  const rx2 = rx * rx;
  const ry2 = ry * ry;
  for (let y = cy - ry; y <= cy + ry; y += 1) {
    for (let x = cx - rx; x <= cx + rx; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx * ry2 + dy * dy * rx2 <= rx2 * ry2) {
        setPixel(png, x, y, r, g, b, a);
      }
    }
  }
}

function fillRoundedRect(png, x, y, w, h, radius, r, g, b, a) {
  const x2 = x + w - 1;
  const y2 = y + h - 1;

  for (let yy = y; yy <= y2; yy += 1) {
    for (let xx = x; xx <= x2; xx += 1) {
      const inCenter = xx >= x + radius && xx <= x2 - radius;
      const inMiddle = yy >= y + radius && yy <= y2 - radius;
      if (inCenter || inMiddle) {
        setPixel(png, xx, yy, r, g, b, a);
        continue;
      }

      const cornerCx = xx < x + radius ? x + radius : x2 - radius;
      const cornerCy = yy < y + radius ? y + radius : y2 - radius;
      const dx = xx - cornerCx;
      const dy = yy - cornerCy;
      if (dx * dx + dy * dy <= radius * radius) {
        setPixel(png, xx, yy, r, g, b, a);
      }
    }
  }
}

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

  if (maxX < 0 || maxY < 0) {
    return null;
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

fs.mkdirSync(outputDir, { recursive: true });

const inventory = [];

for (const [part, config] of Object.entries(PARTS)) {
  const png = createPng(config.width, config.height);
  config.draw(png);

  const outPath = path.join(outputDir, `${part}.png`);
  fs.writeFileSync(outPath, PNG.sync.write(png));

  inventory.push({
    part,
    width: config.width,
    height: config.height,
    alphaBounds: alphaBounds(png),
    file: path.relative(repoRoot, outPath).replaceAll('\\', '/'),
  });
}

console.log('Generated all-rounder Route B placeholder parts:');
for (const item of inventory) {
  console.log(
    `${item.part}.png ${item.width}x${item.height} alpha=${JSON.stringify(item.alphaBounds)}`,
  );
}
