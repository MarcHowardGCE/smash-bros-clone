import { defineConfig } from 'vitest/config';

export default defineConfig({
  envDir: process.env.SMASH_ENV_DIR,
	test: {
		environment: 'node',
		include: ['src/**/*.test.ts'],
	},
});
