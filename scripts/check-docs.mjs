import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = realpathSync(fileURLToPath(new URL('../', import.meta.url)));
const ignoredDirectories = new Set([
  'bonney', 'node_modules', 'dist', 'test-results', 'playwright-report',
]);
const sensitiveNames = new Set(['bonney', '.env', '.env.global']);
const documents = new Map();
const inlineLink = /(?<!\\)\[[^\]\n]*\]\(\s*(?:<([^>]+)>|((?:\\.|[^\s()]|\([^()\s]*\))+))(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\s*\)/g;
const referenceDefinition = /^ {0,3}\[[^\]]+\]:\s*(?:<([^>]+)>|(\S+))/;
const inlineCode = /(`+)([^`].*?)\1(?!`)/g;

function listMarkdown(directory, recursive) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = resolve(directory, entry.name);
    if (entry.isFile() && /\.md$/i.test(entry.name)) return [path];
    if (recursive && entry.isDirectory() && !entry.name.startsWith('.')
        && !ignoredDirectories.has(entry.name.toLowerCase())) {
      return listMarkdown(path, true);
    }
    return [];
  });
}

function markdown(path) {
  if (documents.has(path)) return documents.get(path);

  const content = [];
  const headings = new Set();
  const headingIds = new Set();
  let fence;
  let previous = '';
  for (const [index, line] of readFileSync(path, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).entries()) {
    const marker = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    if (fence) {
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) {
        fence = undefined;
      }
      continue;
    }
    if (marker) {
      fence = marker[1];
      previous = '';
      continue;
    }

    const atx = /^ {0,3}#{1,6}\s+(.+?)\s*#*\s*$/.exec(line);
    const setext = previous && /^ {0,3}(?:=+|-+)\s*$/.test(line);
    const title = atx?.[1] ?? (setext ? previous : '');
    if (title) {
      const base = title.trim().toLowerCase()
        .replace(/<[^>]*>/g, '')
        .replace(/!?\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[^\p{L}\p{N}\p{M}_ -]/gu, '')
        .replace(/ /g, '-');
      let slug = base;
      for (let suffix = 1; headings.has(slug); suffix++) slug = `${base}-${suffix}`;
      headings.add(slug);
    }
    for (const anchor of line.matchAll(/<a\b[^>]*\b(?:id|name)=["']([^"']+)["']/gi)) {
      headingIds.add(anchor[1]);
    }
    previous = title || /^\s*[-*|#>]/.test(line) ? '' : line.trim();
    content.push({ line: index + 1, text: line.replace(inlineCode, '') });
  }

  const result = { content, anchors: new Set([...headings, ...headingIds]) };
  documents.set(path, result);
  return result;
}

function pathParts(path) {
  return path.split(/[\\/]/).map(part => part.toLowerCase());
}

function outsideRepository(path) {
  const fromRoot = relative(root, path);
  return fromRoot === '..' || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot);
}

function validateLink(file, href) {
  const [encodedPath, encodedAnchor] = href.split('#', 2);
  let path;
  let anchor;
  try {
    path = decodeURIComponent(encodedPath).replace(/\\([()])/g, '$1');
    anchor = decodeURIComponent(encodedAnchor ?? '');
  } catch {
    return 'invalid percent escape';
  }

  if (pathParts(path).some(part => sensitiveNames.has(part))) return null;
  const target = path
    ? path.startsWith('/') ? resolve(root, `.${path}`) : resolve(dirname(file), path)
    : file;
  if (outsideRepository(target)) return 'target is outside the repository';
  if (!existsSync(target)) return 'missing target';
  const resolved = realpathSync(target);
  if (outsideRepository(resolved)) return 'target resolves outside the repository';
  if (pathParts(relative(root, resolved)).some(part => sensitiveNames.has(part))) return null;
  if (anchor && extname(resolved).toLowerCase() === '.md' && statSync(resolved).isFile()
      && !markdown(resolved).anchors.has(anchor)) return 'missing Markdown heading or anchor';
  return '';
}

const files = [
  ...listMarkdown(root, false),
  ...['docs', 'apps', 'packages', '.github'].flatMap(directory => listMarkdown(resolve(root, directory), true)),
].sort();
let checked = 0;
let failures = 0;
for (const file of files) {
  for (const { line, text } of markdown(file).content) {
    const links = [...text.matchAll(inlineLink), referenceDefinition.exec(text)].filter(Boolean);
    for (const [, angled, bare] of links) {
      const href = angled ?? bare;
      if (/^(?:[a-z][\w+.-]*:|\/\/)/i.test(href)) continue;
      const error = validateLink(file, href);
      if (error === null) continue;
      checked++;
      if (error) {
        failures++;
        console.error(`${relative(root, file)}:${line}: ${error}: ${href}`);
      }
    }
  }
}
console.log(`Checked ${checked} relative links in ${files.length} Markdown files. ${failures} broken.`);
if (failures) process.exitCode = 1;
