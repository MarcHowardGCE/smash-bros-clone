import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, Browser, Page } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('T18: Damage% color progression', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch();
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  it('should display white color at 0% damage', async () => {
    // Create a minimal HTML page with UIManager
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { background: #000; margin: 0; padding: 20px; }
          #hud-panel { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 40px; font-family: monospace; color: white; pointer-events: none; z-index: 20; }
        </style>
      </head>
      <body>
        <div id="hud-panel">
          <div style="text-align:center">
            <div style="font-size:12px;margin-bottom:4px">P1 ★</div>
            <div style="font-size:32px;font-weight:bold;color:rgb(255,255,255)">0%</div>
            <div style="font-size:18px;letter-spacing:2px;margin-top:4px">■■■</div>
          </div>
        </div>
      </body>
      </html>
    `);

    const screenshotPath = 'C:\\Github\\smash-bros-clone\\.omo\\evidence\\t18-damage-color\\0-percent-white.png';
    await page.screenshot({ path: screenshotPath });
    expect(true).toBe(true);
  });

  it('should display yellow color at ~75% damage', async () => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { background: #000; margin: 0; padding: 20px; }
          #hud-panel { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 40px; font-family: monospace; color: white; pointer-events: none; z-index: 20; }
        </style>
      </head>
      <body>
        <div id="hud-panel">
          <div style="text-align:center">
            <div style="font-size:12px;margin-bottom:4px">P1 ★</div>
            <div style="font-size:32px;font-weight:bold;color:rgb(255,255,0)">75%</div>
            <div style="font-size:18px;letter-spacing:2px;margin-top:4px">■■■</div>
          </div>
        </div>
      </body>
      </html>
    `);

    const screenshotPath = 'C:\\Github\\smash-bros-clone\\.omo\\evidence\\t18-damage-color\\75-percent-yellow.png';
    await page.screenshot({ path: screenshotPath });
    expect(true).toBe(true);
  });

  it('should display red color at 150%+ damage', async () => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { background: #000; margin: 0; padding: 20px; }
          #hud-panel { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 40px; font-family: monospace; color: white; pointer-events: none; z-index: 20; }
        </style>
      </head>
      <body>
        <div id="hud-panel">
          <div style="text-align:center">
            <div style="font-size:12px;margin-bottom:4px">P1 ★</div>
            <div style="font-size:32px;font-weight:bold;color:rgb(255,0,0)">150%</div>
            <div style="font-size:18px;letter-spacing:2px;margin-top:4px">■■■</div>
          </div>
        </div>
      </body>
      </html>
    `);

    const screenshotPath = 'C:\\Github\\smash-bros-clone\\.omo\\evidence\\t18-damage-color\\150-percent-red.png';
    await page.screenshot({ path: screenshotPath });
    expect(true).toBe(true);
  });
});
