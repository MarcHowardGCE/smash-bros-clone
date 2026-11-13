import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const sharp = createRequire(new URL('../../apps/client/package.json', import.meta.url))('sharp');
const publicDir = path.resolve('apps/client/public');
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };

for (const [pack, manifestPath] of [
  ['pilot-v1', 'manifest.json'],
  ['newcomers-v1', 'dojo/manifest.json'],
  ['pack-03-v1', 'manifest.json'],
]) {
  const directory = path.join(publicDir, 'fighter-art-' + pack);
  const { characters } = JSON.parse(await fs.readFile(path.join(directory, manifestPath), 'utf8'));
  for (const [id, character] of Object.entries(characters)) {
    const idle = character.clips.idle;
    const scale = Math.min(1, 360 / Math.max(...idle.frames.map(frame => frame.rect[3])));
    const frames = await Promise.all(idle.frames.map(async frame => {
      const [left, top, width, height] = frame.rect;
      const w = Math.round(width * scale);
      const h = Math.round(height * scale);
      const image = await sharp(path.join(directory, frame.image ?? idle.image))
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
    const metadata = await sharp(file, { animated: true }).metadata();
    if ((metadata.pages ?? 1) !== pages.length) throw Error(id + ' idle frame count mismatch');
    console.log(id, pages.length, (await fs.stat(file)).size);
  }
}
