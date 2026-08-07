import { test, expect } from '@playwright/test';
import { mkdirSync } from 'fs';

const EVIDENCE_DIR = '.omo/evidence/t17-shield-bubble';

test.beforeAll(() => {
  mkdirSync(EVIDENCE_DIR, { recursive: true });
});

/**
 * T17: Shield bubble rendering — visual evidence test.
 *
 * Uses local play (single page, no multiplayer room) to avoid server-hang
 * issues from the first T17 attempt. Holds shield, captures full-health
 * bubble, drains shield via hold time, captures low-health color shift,
 * then releases and confirms bubble disappears.
 */
test('shield bubble renders with color interpolation', async ({ page }) => {
  test.setTimeout(90_000);

  await page.goto('http://localhost:5173');
  await page.waitForSelector('#local-play-btn', { timeout: 10_000 });

  // Start local play (2-player local, no server room needed)
  await page.click('#local-play-btn');

  // Confirm character select: P1 = Enter, P2 = U
  await page.waitForTimeout(500);
  await page.keyboard.press('Enter');
  await page.keyboard.press('KeyU');

  // Wait for match to start
  await page.waitForFunction(() => {
    const state = (window as any).__DEBUG_GAME_STATE__?.();
    return state?.matchPhase === 'match';
  }, { timeout: 15_000, polling: 100 });

  // Wait for fighters to land from spawn and for spawn invincibility to clear
  // (spawn invincibility is ~180 frames = ~3s; wait for shieldHealth to be full before starting)
  await page.waitForTimeout(3500);

  // Wait until shield is fully regenerated (100 HP) before starting drain test
  await page.waitForFunction(() => {
    const state = (window as any).__DEBUG_GAME_STATE__?.();
    if (!state) return false;
    const p1 = Object.values(state.players)[0] as any;
    return p1?.shieldHealth >= 95;
  }, { timeout: 10_000, polling: 200 });

  // --- Screenshot 1: Full shield health (blue bubble) ---
  await page.keyboard.down('ShiftLeft');
  await page.waitForTimeout(300); // let shield state propagate

  const shieldState1 = await page.evaluate(() => {
    const state = (window as any).__DEBUG_GAME_STATE__?.();
    if (!state) return null;
    const p1 = Object.values(state.players)[0] as any;
    return { isShielding: p1?.isShielding, shieldHealth: p1?.shieldHealth };
  });
  console.log('Shield state (full health):', shieldState1);

  await page.screenshot({ path: `${EVIDENCE_DIR}/shield-full-health.png` });

  // --- Screenshot 2: Low shield health (red-shifted bubble) ---
  // SHIELD_DRAIN_PER_FRAME: 0.4 at 60fps → ~24 HP/sec
  // Starting at ≥95 HP, drain 2.8s ≈ 67 HP drained → ~28 HP remaining (safely under 30)
  await page.waitForTimeout(2800);

  const shieldState2 = await page.evaluate(() => {
    const state = (window as any).__DEBUG_GAME_STATE__?.();
    if (!state) return null;
    const p1 = Object.values(state.players)[0] as any;
    return { isShielding: p1?.isShielding, shieldHealth: p1?.shieldHealth };
  });
  console.log('Shield state (low health):', shieldState2);

  await page.screenshot({ path: `${EVIDENCE_DIR}/shield-low-health.png` });

  // --- Screenshot 3: Shield released — bubble must disappear ---
  await page.keyboard.up('ShiftLeft');
  await page.waitForTimeout(200);

  const shieldState3 = await page.evaluate(() => {
    const state = (window as any).__DEBUG_GAME_STATE__?.();
    if (!state) return null;
    const p1 = Object.values(state.players)[0] as any;
    return { isShielding: p1?.isShielding, shieldHealth: p1?.shieldHealth };
  });
  console.log('Shield state (released):', shieldState3);

  await page.screenshot({ path: `${EVIDENCE_DIR}/shield-released.png` });

  // Assertions
  expect(shieldState1?.isShielding).toBe(true);
  expect(shieldState1?.shieldHealth).toBeGreaterThan(80);

  expect(shieldState2?.isShielding).toBe(true);
  expect(shieldState2?.shieldHealth).toBeLessThan(30);

  expect(shieldState3?.isShielding).toBe(false);
});
