import { test, expect } from '@playwright/test';
import { stageDuel, startLocalMatch } from './helpers/flow';

test('shield bubble renders at high and low health and disappears on release', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  await startLocalMatch(page);
  await stageDuel(page);

  await page.keyboard.down('ShiftLeft');
  try {
    await page.waitForFunction(() => {
      const fighter = window.__smashDebug.getSnapshot().players['local-p1'];
      return fighter.isShielding && fighter.shieldHealth > 80;
    });
    await page.screenshot({ path: testInfo.outputPath('shield-full-health.png') });

    // Stage the low-health sample without relying on wall-clock time to drain it.
    const lowShield = await page.evaluate(() => {
      const fighter = window.__smashDebug.getSnapshot().players['local-p1'];
      fighter.shieldHealth = 27;
      return fighter.isShielding;
    });
    expect(lowShield).toBe(true);
    await page.waitForFunction(() => {
      const fighter = window.__smashDebug.getSnapshot().players['local-p1'];
      return fighter.isShielding && fighter.shieldHealth > 0 && fighter.shieldHealth < 27;
    });
    await page.screenshot({ path: testInfo.outputPath('shield-low-health.png') });
  } finally {
    await page.keyboard.up('ShiftLeft');
  }

  await page.waitForFunction(() => !window.__smashDebug.getSnapshot().players['local-p1'].isShielding);
  await page.screenshot({ path: testInfo.outputPath('shield-released.png') });
});
