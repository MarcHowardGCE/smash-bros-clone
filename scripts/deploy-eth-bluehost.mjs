import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { Readable, Writable } from 'node:stream';
import { Client } from 'basic-ftp';

const root = process.argv[2];
if (!root) throw new Error('Pass the extracted game artifact directory');
await stat(path.join(root, 'index.html'));
const stateFile = '.eth-deploy-state.json';
const files = (await readdir(root, { withFileTypes: true, recursive: true }))
  .filter(entry => entry.isFile())
  .map(entry => path.relative(root, path.join(entry.parentPath, entry.name)).split(path.sep).join('/'))
  .filter(file => !file.split('/').some(part => part.startsWith('.')))
  .sort((a, b) => Number(a === 'index.html') - Number(b === 'index.html'));

const next = {};
for (const file of files) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path.join(root, file))) hash.update(chunk);
  next[file] = hash.digest('hex');
}

const { ETH_FTP_HOST, ETH_FTP_USER, ETH_FTP_PASSWORD } = process.env;
if (!ETH_FTP_HOST || !ETH_FTP_USER || !ETH_FTP_PASSWORD) {
  throw new Error('Configure the game-specific Bluehost FTPS credentials');
}

// This account must be jailed to the game document root in Bluehost.
const client = new Client(120_000);
try {
  await client.access({ host: ETH_FTP_HOST, user: ETH_FTP_USER, password: ETH_FTP_PASSWORD, secure: true });
  await client.cd('/');
  const previousEntry = (await client.list()).find(file => file.name === stateFile);
  let previous = {};
  if (previousEntry) {
    const data = [];
    await client.downloadTo(new Writable({
      write(chunk, _encoding, callback) { data.push(chunk); callback(); },
    }), stateFile);
    previous = JSON.parse(Buffer.concat(data).toString('utf8'));
  }

  const changed = files.filter(file => next[file] !== previous[file]);
  console.log(`Uploading ${changed.length} of ${files.length} files`);
  if (changed.length) {
    // With no trusted record after an interrupted upload, the next run sends the full artifact.
    if (previousEntry) await client.remove(stateFile);
    for (const file of changed) {
      await client.cd('/');
      await client.ensureDir(path.posix.dirname(file));
      const name = path.posix.basename(file);
      await client.uploadFrom(path.join(root, file), name + '.eth-upload');
      await client.rename(name + '.eth-upload', name);
    }
    await client.cd('/');
    await client.uploadFrom(Readable.from([JSON.stringify(next)]), stateFile + '.eth-upload');
    await client.rename(stateFile + '.eth-upload', stateFile);
  }
} finally {
  client.close();
}
