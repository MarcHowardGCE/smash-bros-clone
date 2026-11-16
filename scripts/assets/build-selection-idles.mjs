import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const sharp = createRequire(new URL('../../apps/client/package.json', import.meta.url))('sharp');
const publicDir = path.resolve('apps/client/public');
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };

for (const [pack, manifestPath] of [
  ['pilot-v1', 'manifest.json'],
  ['newcomers-v1', 'manifest.json'],
  ['pack-03-v1', 'manifest.json'],
  ['pack-04-v1', 'manifest.json'],
]) {
  if (process.argv[2] && process.argv[2] !== pack) continue;
  const directory = path.join(publicDir, 'fighter-art-' + pack);
  const { characters } = JSON.parse(await fs.readFile(path.join(directory, manifestPath), 'utf8'));
  for (const [id, character] of Object.entries(characters)) {
    const idle = character.clips.idle;
    const sourceFrames = pack === "pack-03-v1" ? await readIdleSheet(id) : idle.frames;
    // Pack 04 source frames use different drawing resolutions for the same world height.
    const relativeScale = frame => pack === 'pack-04-v1' ? (frame.scale ?? idle.scale) / idle.scale : 1;
    const fitScale = Math.min(1, 360 / Math.max(...sourceFrames.map(frame => frame.rect[3] * relativeScale(frame))));
    const frames = await Promise.all(sourceFrames.map(async frame => {
      const [left, top, width, height] = frame.rect;
      const scale = fitScale * relativeScale(frame);
      const w = Math.round(width * scale);
      const h = Math.round(height * scale);
      const image = await sharp(path.resolve(directory, frame.image ?? idle.image))
        .extract({ left, top, width, height }).resize(w, h).png().toBuffer();
      return { image, w, h, x: Math.round(frame.root[0] * scale), y: Math.round(frame.root[1] * scale) };
    }));
    const originX = Math.max(...frames.map(f => f.x));
    const originY = Math.max(...frames.map(f => f.y));
    const width = originX + Math.max(...frames.map(f => f.w - f.x));
    const height = originY + Math.max(...frames.map(f => f.h - f.y));
    const pages = await Promise.all(frames.map(f =>
      sharp({ create: { width, height, channels: 4, background: transparent } })
        .composite([{ input: f.image, left: originX - f.x, top: originY - f.y }])
        .raw().toBuffer()
    ));
    const file = path.join(publicDir, 'menu-art', id + '-select-idle.webp');
    await sharp(Buffer.concat(pages), { raw: { width, height: height * pages.length, pageHeight: height, channels: 4 } })
      .webp({ quality: 92, alphaQuality: 100, loop: 0, delay: idle.frames.map((_, i) => Math.round((idle.durations?.[i] ?? 12) * 1000 / 60)) })
      .toFile(file);
    if (pack === 'pack-04-v1') {
      for (const [size, maxHeight] of [['hero', 360], ['tile', 128]]) {
        await sharp(pages[0], { raw: { width, height, channels: 4 } })
          .resize({ height: maxHeight, withoutEnlargement: true })
          .webp({ quality: 92, alphaQuality: 100 })
          .toFile(path.join(publicDir, 'menu-art', id + '-select-' + size + '.webp'));
      }
    }
    const metadata = await sharp(file, { animated: true }).metadata();
    if ((metadata.pages ?? 1) !== pages.length) throw Error(id + ' idle frame count mismatch');
    console.log(id, pages.length, (await fs.stat(file)).size);
  }
}

async function readIdleSheet(id) {
  const image = path.resolve('concept-art/sprite/pack-03-pilot', id + '-idle-loop.png');
  const { data, info } = await sharp(image).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return Array.from({ length: 4 }, (_, index) => {
    const start = Math.floor(index * info.width / 4);
    const end = Math.floor((index + 1) * info.width / 4);
    let left = end, top = info.height, right = start, bottom = 0;
    for (let y = 0; y < info.height; y++) for (let x = start; x < end; x++) {
      if (data[(y * info.width + x) * 4 + 3] < 200) continue;
      left = Math.min(left, x);
      right = Math.max(right, x + 1);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y + 1);
    }
    if (left >= right || top >= bottom) throw Error(id + ' has an empty idle cel ' + index);
    return { image, rect: [left, top, right - left, bottom - top], root: [(right - left) / 2, bottom - top] };
  });
}
