import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './apps/client/e2e',
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    browserName: 'chromium',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  reporter: [['list']],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
