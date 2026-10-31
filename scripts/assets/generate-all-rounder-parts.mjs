#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const outputRoot = path.join(repoRoot, 'raw-assets', 'fighters{m}');

const COLORS = {
  clothing: [245, 245, 245, 255],
  skin: [242, 211, 179, 255],
  hairDark: [56, 34, 20, 255],
  hat: [26, 26, 30, 255],
  glove: [248, 248, 250, 255],
  shoeDark: [40, 44, 54, 255],
  shoeLight: [92, 99, 114, 255],
};

const CHARACTERS = {
  'all-rounder': {
    head: {
      width: 160,
      height: 160,
      draw: (png) => {
        fillEllipse(png, 80, 80, 26, 28, ...COLORS.skin);
        fillEllipse(png, 80, 63, 30, 11, ...COLORS.hairDark);
        fillRect(png, 50, 63, 60, 8, ...COLORS.hairDark);
        fillCircle(png, 71, 81, 2, 50, 35, 25, 255);
        fillCircle(png, 89, 81, 2, 50, 35, 25, 255);
        fillRect(png, 52, 80, 56, 12, ...COLORS.skin);
      },
    },
    body: {
      width: 160,
      height: 160,
      draw: (png) => {
        fillRoundedRect(png, 40, 34, 80, 98, 20, ...COLORS.clothing);
        fillRect(png, 36, 80, 88, 12, ...COLORS.clothing);
      },
    },
    arm_l: {
      width: 64,
      height: 128,
      draw: (png) => {
        fillRoundedRect(png, 25, 8, 14, 56, 6, ...COLORS.clothing);
        fillRect(png, 25, 8, 14, 12, ...COLORS.clothing);
        fillRoundedRect(png, 24, 52, 16, 12, 5, ...COLORS.glove);
      },
    },
    arm_r: {
      width: 64,
      height: 128,
      draw: (png) => {
        fillRoundedRect(png, 25, 8, 14, 56, 6, ...COLORS.clothing);
        fillRect(png, 25, 8, 14, 12, ...COLORS.clothing);
        fillRoundedRect(png, 24, 52, 16, 12, 5, ...COLORS.glove);
      },
    },
    leg_l: {
      width: 64,
      height: 128,
      draw: (png) => {
        fillRoundedRect(png, 24, 8, 16, 64, 7, ...COLORS.clothing);
        fillRect(png, 24, 8, 16, 12, ...COLORS.clothing);
        fillRoundedRect(png, 20, 56, 24, 16, 7, ...COLORS.shoeDark);
      },
    },
    leg_r: {
      width: 64,
      height: 128,
      draw: (png) => {
        fillRoundedRect(png, 24, 8, 16, 64, 7, ...COLORS.clothing);
        fillRect(png, 24, 8, 16, 12, ...COLORS.clothing);
        fillRoundedRect(png, 20, 56, 24, 16, 7, ...COLORS.shoeDark);
      },
    },
  },
  'abe-lincoln': {
    head: {
      width: 160,
      height: 160,
      draw: (png) => {
        fillEllipse(png, 80, 80, 24, 30, ...COLORS.skin);
        fillRoundedRect(png, 66, 12, 28, 52, 6, ...COLORS.hat);
        fillRoundedRect(png, 48, 56, 64, 8, 3, ...COLORS.hat);
        fillRoundedRect(png, 62, 96, 36, 26, 8, ...COLORS.hairDark);
        fillRect(png, 52, 80, 56, 12, ...COLORS.skin);
      },
    },
    body: {
      width: 160,
      height: 160,
      draw: (png) => {
        fillRoundedRect(png, 38, 30, 84, 98, 16, ...COLORS.clothing);
        fillRect(png, 36, 80, 88, 12, ...COLORS.clothing);
        fillRoundedRect(png, 38, 122, 32, 30, 8, ...COLORS.clothing);
        fillRoundedRect(png, 90, 122, 32, 30, 8, ...COLORS.clothing);
      },
    },
    arm_l: {
      width: 64,
      height: 128,
      draw: (png) => {
        fillRoundedRect(png, 25, 8, 14, 60, 6, ...COLORS.clothing);
        fillRect(png, 25, 8, 14, 12, ...COLORS.clothing);
        fillRoundedRect(png, 23, 52, 18, 16, 6, ...COLORS.glove);
      },
    },
    arm_r: {
      width: 64,
      height: 128,
      draw: (png) => {
        fillRoundedRect(png, 25, 8, 14, 60, 6, ...COLORS.clothing);
        fillRect(png, 25, 8, 14, 12, ...COLORS.clothing);
        fillRoundedRect(png, 23, 52, 18, 16, 6, ...COLORS.glove);
      },
    },
    leg_l: {
      width: 64,
      height: 128,
      draw: (png) => {
        fillRoundedRect(png, 24, 8, 16, 68, 7, ...COLORS.clothing);
        fillRect(png, 24, 8, 16, 12, ...COLORS.clothing);
        fillRoundedRect(png, 19, 56, 26, 20, 8, ...COLORS.shoeDark);
      },
    },
    leg_r: {
      width: 64,
      height: 128,
      draw: (png) => {
        fillRoundedRect(png, 24, 8, 16, 68, 7, ...COLORS.clothing);
        fillRect(png, 24, 8, 16, 12, ...COLORS.clothing);
        fillRoundedRect(png, 19, 56, 26, 20, 8, ...COLORS.shoeDark);
      },
    },
  },
  swift: {
    head: {
      width: 160,
      height: 160,
      draw: (png) => {
        fillEllipse(png, 80, 80, 22, 27, ...COLORS.skin);
        fillEllipse(png, 79, 64, 23, 9, ...COLORS.hairDark);
        fillRoundedRect(png, 98, 70, 18, 30, 8, ...COLORS.hairDark);
        fillRect(png, 52, 80, 56, 12, ...COLORS.skin);
      },
    },
    body: {
      width: 160,
      height: 160,
      draw: (png) => {
        fillRoundedRect(png, 48, 32, 64, 96, 18, ...COLORS.clothing);
        fillRect(png, 36, 80, 88, 12, ...COLORS.clothing);
      },
    },
    arm_l: {
      width: 64,
      height: 128,
      draw: (png) => {
        fillRoundedRect(png, 27, 8, 10, 54, 5, ...COLORS.clothing);
        fillRect(png, 25, 8, 14, 12, ...COLORS.clothing);
        fillRoundedRect(png, 24, 52, 16, 10, 5, ...COLORS.glove);
      },
    },
    arm_r: {
      width: 64,
      height: 128,
      draw: (png) => {
        fillRoundedRect(png, 27, 8, 10, 54, 5, ...COLORS.clothing);
        fillRect(png, 25, 8, 14, 12, ...COLORS.clothing);
        fillRoundedRect(png, 24, 52, 16, 10, 5, ...COLORS.glove);
      },
    },
    leg_l: {
      width: 64,
      height: 128,
      draw: (png) => {
        fillRoundedRect(png, 26, 8, 12, 62, 6, ...COLORS.clothing);
        fillRect(png, 24, 8, 16, 12, ...COLORS.clothing);
        fillRoundedRect(png, 20, 56, 24, 14, 7, ...COLORS.shoeLight);
      },
    },
    leg_r: {
      width: 64,
      height: 128,
      draw: (png) => {
        fillRoundedRect(png, 26, 8, 12, 62, 6, ...COLORS.clothing);
        fillRect(png, 24, 8, 16, 12, ...COLORS.clothing);
        fillRoundedRect(png, 20, 56, 24, 14, 7, ...COLORS.shoeLight);
      },
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

const inventory = [];

for (const [characterId, parts] of Object.entries(CHARACTERS)) {
  const outputDir = path.join(outputRoot, `${characterId}{tps}`);
  fs.mkdirSync(outputDir, { recursive: true });

  for (const [part, config] of Object.entries(parts)) {
    const png = createPng(config.width, config.height);
    config.draw(png);

    const outPath = path.join(outputDir, `${part}.png`);
    fs.writeFileSync(outPath, PNG.sync.write(png));

    inventory.push({
      characterId,
      part,
      width: config.width,
      height: config.height,
      alphaBounds: alphaBounds(png),
      file: path.relative(repoRoot, outPath).replaceAll('\\', '/'),
    });
  }
}

console.log('Generated deterministic fighter placeholder parts:');
for (const item of inventory) {
  console.log(
    `${item.characterId}/${item.part}.png ${item.width}x${item.height} alpha=${JSON.stringify(item.alphaBounds)}`,
  );
}
