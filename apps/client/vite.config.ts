import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AssetPack } from '@assetpack/core';
import { defineConfig, type Plugin, type ResolvedConfig } from 'vite';
import { createAssetPackConfig } from './assetpack.config.mjs';

const SKIP_ASSETPACK_ENV = 'SKIP_ASSETPACK';
const CONFIG_DIR = path.dirname(fileURLToPath(import.meta.url));

function shouldSkipAssetPack(): boolean {
  return process.env[SKIP_ASSETPACK_ENV] === '1';
}

function assetPackVitePlugin(): Plugin {
  let mode: ResolvedConfig['command'] = 'serve';
  let watcher: AssetPack | null = null;

  return {
    name: 'smash-assetpack-pipeline',
    configResolved(config) {
      mode = config.command;
    },
    async buildStart() {
      if (shouldSkipAssetPack()) {
        console.info(`[assetpack] skipped via ${SKIP_ASSETPACK_ENV}=1`);
        return;
      }

      const outputDir = path.resolve(CONFIG_DIR, 'public', 'assets');
      const config = createAssetPackConfig(outputDir);

      if (mode === 'serve') {
        if (watcher !== null) {
          return;
        }
        watcher = new AssetPack(config);
        await watcher.watch();
        return;
      }

      await new AssetPack(config).run();
    },
    async buildEnd() {
      if (watcher !== null) {
        await watcher.stop();
        watcher = null;
      }
    },
  };
}

export default defineConfig({
  plugins: [assetPackVitePlugin()],
  server: {
    port: 5173,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
      },
    },
  },
  build: {
    target: 'esnext',
  },
});
