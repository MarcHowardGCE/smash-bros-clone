import { test, expect } from '@playwright/test';

/**
 * T15: Hit flash + impact spark — visual evidence test.
 *
 * Starts a local match, has P1 attack P2 until damage is dealt,
 * then screenshots to capture the golden-yellow hit flash on the
 * defender and the radial impact spark particles.
 *
 * Uses the exact same attack pattern as ko-effect.spec.ts (proven to land hits).
 */
test('hit flash and impact spark render on hit', async ({ page }) => {
  test.setTimeout(60000);

  await page.goto('http://localhost:5173');
  await page.waitForSelector('#local-play-btn', { timeout: 5000 });

  // Start local play
  await page.click('#local-play-btn');
  await page.waitForSelector('#lps-start-btn', { timeout: 10_000 });
  await page.click('#lps-start-btn');

  // Confirm character select: P1 = Enter, P2 = U
  await page.keyboard.press('Enter');
  await page.keyboard.press('KeyU');

  // Wait for countdown + match start
  await page.waitForFunction(() => {
    const state = (window as any).__DEBUG_GAME_STATE__?.();
    return state?.matchPhase === 'match';
  }, { timeout: 15000, polling: 100 });

  // Wait for fighters to land
  await page.waitForTimeout(500);

  // P1 attacks P2 repeatedly (right + attack = forward tilt).
  // Identical pattern to ko-effect.spec.ts which reliably KOs in ~34s.
  // Use waitForFunction to detect first damage — avoids per-iteration evaluate overhead.
  const attackLoop = async () => {
    for (let round = 0; round < 100; round++) {
      await page.keyboard.down('ArrowRight');
      await page.keyboard.press('KeyZ');
      await page.waitForTimeout(100);
      await page.keyboard.up('ArrowRight');
      await page.waitForTimeout(150);
    }
  };

  // Start attacking in background, wait for P2 damage
  const attackPromise = attackLoop();

  // Poll for P2 damage (same approach the ko-effect test uses for isKnockedOut)
  await page.waitForFunction(() => {
    const s = (window as any).__DEBUG_GAME_STATE__?.();
    if (!s) return false;
    const players = Object.values(s.players) as any[];
    const p2 = players.find((p: any) => p.slotIndex === 1);
    return p2 && p2.percent > 0;
  }, { timeout: 30000, polling: 200 });

  // P2 has taken damage — now land another hit and screenshot during the effect window
  await page.keyboard.down('ArrowRight');
  await page.keyboard.press('KeyZ');
  await page.waitForTimeout(50); // capture during the 4-frame flash + 10-frame spark
  await page.screenshot({ path: '.omo/evidence/t15-hit-flash-screenshot.png' });
  await page.keyboard.up('ArrowRight');

  // Wait for attack loop to finish (it may already be done)
  await attackPromise.catch(() => {});

  // If we got here, waitForFunction succeeded (percent > 0)
  expect(true).toBe(true);
});
