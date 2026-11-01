import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './apps/client/e2e',
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    browserName: 'chromium',
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    { name: 'chromium-dpr-1', use: { browserName: 'chromium', deviceScaleFactor: 1 } },
    { name: 'chromium-dpr-2', use: { browserName: 'chromium', deviceScaleFactor: 2 } },
    { name: 'chromium-dpr-3', use: { browserName: 'chromium', deviceScaleFactor: 3 } },
  ],
  reporter: [['list']],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
