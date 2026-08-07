import { test, expect } from '@playwright/test';

const EVIDENCE_DIR = '.omo/evidence/t17-shield-bubble';

test('shield bubble renders with color interpolation', async ({ browser }) => {
  test.setTimeout(90000);

  const ctx1 = await browser.newContext();
  const ctx2 = await browser.newContext();
  const page1 = await ctx1.newPage();
  const page2 = await ctx2.newPage();

  await page1.goto('http://localhost:5173');

  // Create room
  await page1.click('#create-btn');
  await page1.waitForURL(/room=/);
  const roomUrl = page1.url();

  // Join on page2
  await page2.goto(roomUrl);

  // Both ready up
  await page1.click('#ready-btn');
  await page2.click('#ready-btn');

  // Wait for match to start
  await page1.waitForFunction(() => {
    const state = (window as any).__DEBUG_GAME_STATE__?.();
    return state?.matchPhase === 'match';
  }, { timeout: 15000, polling: 100 });

  // Wait for fighters to land from spawn
  for (let i = 0; i < 40; i++) {
    await page1.waitForTimeout(50);
    const state = await page1.evaluate(() => (window as any).__DEBUG_GAME_STATE__?.());
    if (state) {
      const p1 = Object.values(state.players)[0] as any;
      if (p1?.state === 'IDLE') break;
    }
  }

  // Press shield (Shift key) — capture at full health
  await page1.keyboard.down('ShiftLeft');
  await page1.waitForTimeout(200); // let shield state propagate

  // Verify shielding state
  const shieldState1 = await page1.evaluate(() => {
    const state = (window as any).__DEBUG_GAME_STATE__?.();
    if (!state) return null;
    const p1 = Object.values(state.players)[0] as any;
    return { isShielding: p1?.isShielding, shieldHealth: p1?.shieldHealth };
  });
  console.log('Shield state (full health):', shieldState1);

  // Screenshot 1: Full shield health (blue bubble)
  await page1.screenshot({ path: `${EVIDENCE_DIR}/shield-full-health.png` });

  // Hold shield for ~3.5 seconds to drain health significantly
  // SHIELD_DRAIN_PER_FRAME: 0.4 at 60fps → ~24 HP/sec → after 3.5s ≈ 84 HP drained → ~16 HP remaining
  await page1.waitForTimeout(3500);

  // Verify low health state
  const shieldState2 = await page1.evaluate(() => {
    const state = (window as any).__DEBUG_GAME_STATE__?.();
    if (!state) return null;
    const p1 = Object.values(state.players)[0] as any;
    return { isShielding: p1?.isShielding, shieldHealth: p1?.shieldHealth };
  });
  console.log('Shield state (low health):', shieldState2);

  // Screenshot 2: Low shield health (red-shifted bubble)
  await page1.screenshot({ path: `${EVIDENCE_DIR}/shield-low-health.png` });

  // Release shield
  await page1.keyboard.up('ShiftLeft');

  // Verify bubble disappears
  await page1.waitForTimeout(100);
  const shieldState3 = await page1.evaluate(() => {
    const state = (window as any).__DEBUG_GAME_STATE__?.();
    if (!state) return null;
    const p1 = Object.values(state.players)[0] as any;
    return { isShielding: p1?.isShielding, shieldHealth: p1?.shieldHealth };
  });
  console.log('Shield state (released):', shieldState3);

  // Assertions
  expect(shieldState1?.isShielding).toBe(true);
  expect(shieldState1?.shieldHealth).toBeGreaterThan(90);
  expect(shieldState2?.isShielding).toBe(true);
  expect(shieldState2?.shieldHealth).toBeLessThan(30);
  expect(shieldState3?.isShielding).toBe(false);

  await ctx1.close();
  await ctx2.close();
});
