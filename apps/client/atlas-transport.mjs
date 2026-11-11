import { readFile, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { brotliCompressSync } from 'node:zlib';
import sharp from 'sharp';

const packs = [
  ['fighter-art-pilot-v1', 'production'],
  ['fighter-art-newcomers-v1', 'dojo'],
];

function verifyPixels(source, decoded, width, height, file) {
  if (decoded.info.width !== width || decoded.info.height !== height || decoded.info.channels !== 4) {
    throw new Error(`Unexpected decoded atlas dimensions for ${file}`);
  }
  for (let i = 0; i < source.length; i += 4) {
    const alpha = source[i + 3];
    if (alpha !== decoded.data[i + 3] || (alpha !== 0 && (
      source[i] !== decoded.data[i] || source[i + 1] !== decoded.data[i + 1] ||
      source[i + 2] !== decoded.data[i + 2]
    ))) throw new Error(`Lossless atlas validation failed for ${file} at pixel ${i / 4}`);
  }
}

async function compressPack(directory, folder) {
  const manifestPath = path.join(directory, 'manifest.json');
  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }

  const clips = [
    ...Object.values(manifest.characters).flatMap(character => Object.values(character.clips)),
    ...Object.values(manifest.effects ?? {}),
  ];
  const bounds = new Map();
  for (const clip of clips) {
    for (const frame of clip.frames) {
      const image = frame.image ?? clip.image;
      const [x, y, width, height] = frame.rect;
      const page = bounds.get(image) ?? { right: 0, bottom: 0 };
      page.right = Math.max(page.right, x + width);
      page.bottom = Math.max(page.bottom, y + height);
      bounds.set(image, page);
    }
  }

  const replacements = new Map();
  let pngBytes = 0;
  let outputBytes = 0;
  let pngPixels = 0;
  let outputPixels = 0;
  for (const file of manifest.production.pages) {
    if (!/^atlas-[a-z0-9-]+\.png$/.test(file)) throw new Error(`Invalid atlas page name: ${file}`);
    const key = `${folder}/${file}`;
    const page = bounds.get(key);
    if (!page) throw new Error(`Atlas page has no frame references: ${key}`);
    const inputPath = path.join(directory, file);
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    if (page.right > metadata.width || page.bottom > metadata.height) throw new Error(`Atlas frame exceeds ${key}`);

    const width = Math.min(metadata.width, page.right + manifest.production.padding);
    const height = Math.min(metadata.height, page.bottom + manifest.production.padding);
    const { size } = await stat(inputPath);
    pngBytes += size;
    pngPixels += metadata.width * metadata.height;

    // Keep frame coordinates and their extrusion gutters at the original positions.
    const pixels = await image.extract({ left: 0, top: 0, width, height }).ensureAlpha().raw().toBuffer();
    const encoded = await sharp(pixels, { raw: { width, height, channels: 4 } })
      .webp({ lossless: true, effort: file.startsWith('atlas-all-rounder-live-') ? 6 : 3 }).toBuffer();
    if (encoded.length >= size) {
      outputBytes += size;
      outputPixels += metadata.width * metadata.height;
      continue;
    }

    const decoded = await sharp(encoded).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    verifyPixels(pixels, decoded, width, height, key);
    const replacement = file.replace(/\.png$/, '.webp');
    await writeFile(path.join(directory, replacement), encoded);
    replacements.set(key, `${folder}/${replacement}`);
    outputBytes += encoded.length;
    outputPixels += width * height;
  }

  for (const clip of clips) {
    if (replacements.has(clip.image)) clip.image = replacements.get(clip.image);
    for (const frame of clip.frames) {
      if (replacements.has(frame.image)) frame.image = replacements.get(frame.image);
    }
  }
  manifest.production.pages = manifest.production.pages.map(file =>
    path.posix.basename(replacements.get(`${folder}/${file}`) ?? file));
  await writeFile(manifestPath, JSON.stringify(manifest));
  for (const key of replacements.keys()) await unlink(path.join(directory, path.posix.basename(key)));
  console.info(`[fighter-atlas] ${folder}: ${pngBytes} → ${outputBytes} bytes, ${pngPixels} → ${outputPixels} decoded pixels`);
  return true;
}

export function compactAtlasPlugin() {
  return {
    name: 'smash-compact-fighter-atlases',
    apply: 'build',
    async writeBundle({ dir }) {
      for (const [pack, folder] of packs) {
        await compressPack(path.resolve(dir, pack, folder), folder);
      }
      for (const [pack, folder] of [...packs, ['fighter-art-pack-03-v1', 'production']]) {
        const base = path.resolve(dir, pack);
        const manifestPath = path.join(base, folder, 'manifest.json');
        let manifest;
        try {
          manifest = await readFile(manifestPath);
        } catch (error) {
          if (error.code === 'ENOENT') continue;
          throw error;
        }
        await writeFile(manifestPath + '.br', brotliCompressSync(manifest));
        if (folder === 'production') {
          const { revision } = JSON.parse(await readFile(path.join(base, 'manifest.json'), 'utf8'));
          if (Number.isInteger(revision)) {
            await writeFile(path.join(base, 'source-revision.json'), JSON.stringify({ revision }));
          }
        }
      }
    },
  };
}
