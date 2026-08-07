import { test, expect } from '@playwright/test';

/**
 * T23: Local Play pause overlay — visual evidence test.
 *
 * Starts a local match, presses Escape to pause, verifies fighters
 * are frozen (same positions 1s apart), then resumes and confirms
 * movement continues.
 */
test('pause freezes fighters and resume restores movement', async ({ page }) => {
  test.setTimeout(60000);

  await page.goto('http://localhost:5173');
  await page.waitForSelector('#local-play-btn', { timeout: 5000 });

  // Start local play
  await page.click('#local-play-btn');

  // Confirm character select: P1 = Enter, P2 = U
  await page.waitForTimeout(500);
  await page.keyboard.press('Enter');
  await page.keyboard.press('KeyU');

  // Wait for countdown + match start
  await page.waitForFunction(() => {
    const state = (window as any).__DEBUG_GAME_STATE__?.();
    return state?.matchPhase === 'match';
  }, { timeout: 15000, polling: 100 });

  // Let fighters settle after spawn
  await page.waitForTimeout(500);

  // Move P1 right briefly so there's a non-default position
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(200);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(100);

  // --- PAUSE ---
  await page.keyboard.press('Escape');

  // Verify overlay appeared
  await page.waitForSelector('#resume-btn', { timeout: 2000 });
  const pauseText = await page.textContent('.overlay-center');
  expect(pauseText).toContain('PAUSED');

  // Capture positions at T+0
  const positionsBefore = await page.evaluate(() => {
    const s = (window as any).__DEBUG_GAME_STATE__?.();
    if (!s) return null;
    const players = Object.values(s.players) as any[];
    return players.map((p: any) => ({ id: p.id, x: p.x, y: p.y }));
  });
  expect(positionsBefore).not.toBeNull();

  await page.screenshot({ path: '.omo/evidence/t23-pause-frozen-t0.png' });

  // Wait 1 second while paused
  await page.waitForTimeout(1000);

  // Capture positions at T+1000ms — should be identical
  const positionsAfter = await page.evaluate(() => {
    const s = (window as any).__DEBUG_GAME_STATE__?.();
    if (!s) return null;
    const players = Object.values(s.players) as any[];
    return players.map((p: any) => ({ id: p.id, x: p.x, y: p.y }));
  });

  await page.screenshot({ path: '.omo/evidence/t23-pause-frozen-t1.png' });

  // Assert positions are identical (frozen)
  expect(positionsAfter).toEqual(positionsBefore);

  // --- RESUME ---
  await page.click('#resume-btn');

  // Overlay should be gone
  await page.waitForFunction(() => {
    const overlay = document.getElementById('ui-overlay');
    return overlay && overlay.innerHTML.trim() === '';
  }, { timeout: 2000 });

  // Move P1 to force position change
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(300);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(100);

  // Verify positions changed after resume
  const positionsResumed = await page.evaluate(() => {
    const s = (window as any).__DEBUG_GAME_STATE__?.();
    if (!s) return null;
    const players = Object.values(s.players) as any[];
    return players.map((p: any) => ({ id: p.id, x: p.x, y: p.y }));
  });
  expect(positionsResumed).not.toBeNull();

  // P1 should have moved from frozen position
  const p1Before = positionsBefore!.find((p: any) => p.id === 'local-p1');
  const p1Resumed = positionsResumed!.find((p: any) => p.id === 'local-p1');
  expect(p1Before).toBeDefined();
  expect(p1Resumed).toBeDefined();
  expect(p1Resumed!.x).not.toEqual(p1Before!.x);

  await page.screenshot({ path: '.omo/evidence/t23-resumed-movement.png' });
});

test('pause during countdown is a no-op', async ({ page }) => {
  test.setTimeout(60000);

  await page.goto('http://localhost:5173');
  await page.waitForSelector('#local-play-btn', { timeout: 5000 });

  // Start local play
  await page.click('#local-play-btn');

  // Confirm character select
  await page.waitForTimeout(500);
  await page.keyboard.press('Enter');
  await page.keyboard.press('KeyU');

  // Wait for countdown to appear (but not match start)
  await page.waitForFunction(() => {
    const overlay = document.getElementById('ui-overlay');
    return overlay && (overlay.textContent?.includes('3') || overlay.textContent?.includes('2'));
  }, { timeout: 10000, polling: 100 });

  // Try to pause during countdown
  await page.keyboard.press('Escape');

  // Pause overlay should NOT appear — no #resume-btn
  const resumeBtn = await page.$('#resume-btn');
  expect(resumeBtn).toBeNull();

  // Match should still start normally after countdown
  await page.waitForFunction(() => {
    const state = (window as any).__DEBUG_GAME_STATE__?.();
    return state?.matchPhase === 'match';
  }, { timeout: 15000, polling: 100 });
});
