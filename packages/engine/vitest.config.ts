import { defineConfig } from 'vitest/config';

export default defineConfig({
  envDir: process.env.SMASH_ENV_DIR,
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
