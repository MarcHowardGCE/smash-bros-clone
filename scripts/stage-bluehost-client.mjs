import { cp, mkdir, readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const source = 'apps/client/dist';
const output = process.argv[2];
if (!output || path.relative(source, output).startsWith('..') === false) {
  throw new Error('Choose a new staging directory outside apps/client/dist');
}
await mkdir(output);

for (const entry of await readdir(source, { withFileTypes: true })) {
  const root = path.join(source, entry.name);
  const dest = path.join(output, entry.name);
  if (!entry.isDirectory() || !entry.name.startsWith('fighter-art-')) {
    await cp(root, dest, { recursive: true });
    continue;
  }

  const files = new Set((await readdir(root, { recursive: true, withFileTypes: true }))
    .filter(file => file.isFile())
    .map(file => path.relative(root, path.join(file.parentPath, file.name)).split(path.sep).join('/')));
  const kept = new Set([...files].filter(file =>
    /^(?:(?:production|dojo)\/)?manifest\.json(?:\.br)?$|^source-revision\.json$|^[^/]+-idle\.png$/.test(file)));
  function collect(value) {
    if (typeof value === 'string' && /\.(png|webp|json)$/i.test(value) && files.has(value)) {
      kept.add(value);
    } else if (value && typeof value === 'object') {
      Object.values(value).forEach(collect);
    }
  }

  for (const manifest of [...kept].filter(file => file.endsWith('manifest.json'))) {
    collect(JSON.parse(await readFile(path.join(root, manifest), 'utf8')));
  }

  let bytes = 0;
  for (const file of kept) {
    const target = path.join(dest, file);
    await mkdir(path.dirname(target), { recursive: true });
    await cp(path.join(root, file), target);
    bytes += (await stat(target)).size;
  }
  console.log(entry.name, kept.size, bytes);
}
