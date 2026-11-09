import { test, expect } from '@playwright/test';
import { startLocalMatch } from './helpers/flow';

test('local results offer a rematch and Main Menu returns to Home', async ({ page }, testInfo) => {
  await startLocalMatch(page);

  // Let the engine process the final stock loss at the blast boundary.
  const positioned = await page.evaluate(() => {
    const debug = window.__smashDebug;
    const opponent = Object.values(debug.getSnapshot().players).find(player => player.slotIndex === 1);
    if (!opponent) return false;
    opponent.stocks = 1;
    return debug.forcePosition(opponent.id, 9999, 9999);
  });
  expect(positioned).toBe(true);
  await page.waitForFunction(() => window.__smashDebug.getSnapshot().matchPhase === 'result');

  const mainMenu = page.getByRole('button', { name: 'Main Menu', exact: true });
  await expect(page.getByRole('button', { name: 'Rematch', exact: true })).toBeVisible();
  await expect(mainMenu).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('local-results.png') });

  await mainMenu.click();
  await expect(page.locator('#local-play-btn')).toBeVisible();
  await expect(page.getByRole('img', { name: 'Everybody Throws Hands', exact: true })).toBeVisible();
  await expect(mainMenu).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('returned-home.png') });
});
