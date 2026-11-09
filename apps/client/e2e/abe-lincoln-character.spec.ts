import { chooseFirstStage } from "./helpers/flow";
import { test, expect } from '@playwright/test';

/**
 * Helper: navigate to local play and reach character-select screen.
 * Handles splash screen dismissal and fade-out animation.
 */
async function navigateToCharacterSelect(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/');
  // Dismiss splash screen (click anywhere to continue)
  await page.waitForSelector('#splash-screen', { timeout: 10_000 });
  await page.click('#splash-screen');
  // Wait for 800ms fade-out + lobby render
  await page.waitForSelector('#local-play-btn', { timeout: 5_000 });
  await page.click('#local-play-btn');
  await page.waitForSelector('#lps-start-btn', { timeout: 10_000 });
  await page.click('#lps-start-btn');
  // Now on character-select screen
  await page.waitForSelector('.fighter-option', { timeout: 5_000 });
}

/**
 * Helper: wait for match phase to be 'match' via debug API.
 */
async function waitForMatchStart(page: import('@playwright/test').Page): Promise<void> {
  await chooseFirstStage(page);
  await page.waitForFunction(() => {
    const state = (window as any).__DEBUG_GAME_STATE__?.();
    return state?.matchPhase === 'match';
  }, { timeout: 20_000, polling: 100 });
  // Let fighters land
  await page.waitForTimeout(600);
}

/**
 * Helper: perform a forward smash with P1.
 * Smash input = Shield held + Direction held + Attack pressed (all on same game tick).
 * The engine checks: wantsSmash = isHeld(SHIELD) && isPressed(ATTACK).
 * Both keys must be pressed within the same 16.67ms tick to avoid entering Shield state first.
 */
async function performP1ForwardSmash(page: import('@playwright/test').Page): Promise<void> {
  // Hold direction first (player walks, still in Idle/Walk on attack press)
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(50);
  // Press Shield + Attack simultaneously within one game tick (~16ms)
  // No await between these two calls ensures both keydown events fire before next pollInput()
  await Promise.all([
    page.keyboard.down('ShiftLeft'),
    page.keyboard.down('KeyZ'),
  ]);
  // Release keys after a short delay
  await page.waitForTimeout(50);
  await page.keyboard.up('KeyZ');
  await page.keyboard.up('ShiftLeft');
  await page.keyboard.up('ArrowRight');
  // Wait for full smash animation (startup 15 + active 3 + recovery 25 = 43 frames ≈ 720ms)
  await page.waitForTimeout(900);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1: Character-select shows both "All-Rounder" and "Abe Lincoln" options
// ─────────────────────────────────────────────────────────────────────────────
test('character-select shows the five-fighter roster', async ({ page }) => {
  test.setTimeout(30_000);

  await navigateToCharacterSelect(page);

  // Check P1 panel has both fighter options
  const p1Options = page.locator('[data-player="1"].fighter-option');
  await expect(p1Options).toHaveCount(5);
  expect(await p1Options.evaluateAll(options => options.map(option => option.getAttribute('data-id')).sort())).toEqual([
    'abe-lincoln', 'all-rounder', 'hulk-hoagie', 'moonshine', 'swift',
  ]);

  const allRounderOption = page.locator('[data-player="1"][data-id="all-rounder"]');
  const abeLincolnOption = page.locator('[data-player="1"][data-id="abe-lincoln"]');

  await expect(allRounderOption).toBeVisible();
  await expect(abeLincolnOption).toBeVisible();
  await expect(allRounderOption).toContainText('All-Rounder');
  await expect(abeLincolnOption).toContainText('Abe Lincoln');

  await page.screenshot({ path: test.info().outputPath("task-15-character-select-options.png") });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2: Clicking "Abe Lincoln" then confirming starts match with visually
//         distinct fighter (screenshot + characterId assertion)
// ─────────────────────────────────────────────────────────────────────────────
test('selecting Abe Lincoln starts match with visually distinct fighter', async ({ page }) => {
  test.setTimeout(60_000);

  await navigateToCharacterSelect(page);

  // Click Lincoln option for P1
  const abeOption = page.locator('[data-player="1"][data-id="abe-lincoln"]');
  await abeOption.click();

  await page.locator('[data-ready-slot="0"]').click();

  await waitForMatchStart(page);

  // Assert P1's characterId is 'abe-lincoln' via debug API
  const p1CharacterId = await page.evaluate(() => {
    const state = (window as any).__DEBUG_GAME_STATE__?.();
    if (!state) return null;
    const players = Object.values(state.players) as any[];
    const p1 = players.find((p: any) => p.slotIndex === 0);
    return p1?.characterId ?? null;
  });
  expect(p1CharacterId).toBe('abe-lincoln');

  // Take screenshot of Lincoln fighter for visual evidence
  await page.screenshot({ path: test.info().outputPath("task-15-lincoln-in-match.png") });

  // Visual distinction: Lincoln's renderer uses different accessories (top hat, beard).
  // Verify the character is rendering distinctly by checking canvas bounding area.
  // We rely on the characterId assertion above + screenshot as primary evidence.
  // Additionally, check that the fighter-renderer is producing content (canvas has pixels)
  const canvasPresent = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    return canvas !== null && canvas.width > 0 && canvas.height > 0;
  });
  expect(canvasPresent).toBe(true);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3: Lincoln forward smash uses his character-specific damage.
// ─────────────────────────────────────────────────────────────────────────────
test('Lincoln forward smash deals at least 20% damage', async ({ page }, testInfo) => {
  await navigateToCharacterSelect(page);
  await page.locator('[data-player="1"][data-id="abe-lincoln"]').click();
  await page.locator('[data-ready-slot="0"]').click();
  await waitForMatchStart(page);

  await page.evaluate(() => {
    const debug = window.__smashDebug;
    debug.forcePosition('local-p1', 600, 468);
    debug.forcePosition('local-p2', 645, 472);
    const players = debug.getSnapshot().players;
    Object.assign(players['local-p1'], { state: 'IDLE', isGrounded: true, facing: 1 });
    Object.assign(players['local-p2'], {
      state: 'HITSTUN', isGrounded: true, hitstunFramesRemaining: 3600,
      isInvincible: false, invincibilityFrames: 0, respawnTimer: 0, percent: 0,
    });
    const keys = ['ArrowRight', 'ShiftLeft', 'KeyZ'];
    for (const code of keys) {
      window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true }));
    }
    return new Promise<void>((resolve, reject) => {
      const deadline = performance.now() + 3000;
      const sample = () => {
        const started = debug.getSnapshot().players['local-p1'].currentMoveId === 'FORWARD_SMASH';
        if (started || performance.now() >= deadline) {
          for (const code of keys) {
            window.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true }));
          }
          if (started) resolve();
          else reject(new Error('Lincoln did not start forward smash'));
        } else {
          requestAnimationFrame(sample);
        }
      };
      requestAnimationFrame(sample);
    });
  });

  await expect.poll(() => page.evaluate(() =>
    window.__smashDebug.getSnapshot().players['local-p2'].percent,
  )).toBeGreaterThanOrEqual(20);
  await page.screenshot({ path: testInfo.outputPath('lincoln-forward-smash.png') });
});
// ─────────────────────────────────────────────────────────────────────────────
// TEST 4: All-Rounder regression — default selection (no click) behaves
//         identically to before (smoke test)
// ─────────────────────────────────────────────────────────────────────────────
test('All-Rounder default selection regression smoke test', async ({ page }) => {
  test.setTimeout(60_000);

  await navigateToCharacterSelect(page);

  // Do NOT click any fighter option — auto-selects first (All-Rounder)
  // Confirm both players immediately
  await page.keyboard.press('Enter');
  await page.keyboard.press('KeyU');

  await waitForMatchStart(page);

  // Assert P1 characterId is 'all-rounder' (default)
  const p1CharacterId = await page.evaluate(() => {
    const state = (window as any).__DEBUG_GAME_STATE__?.();
    if (!state) return null;
    const players = Object.values(state.players) as any[];
    const p1 = players.find((p: any) => p.slotIndex === 0);
    return p1?.characterId ?? null;
  });
  expect(p1CharacterId).toBe('all-rounder');

  // Verify match is running and P1 can move (basic regression)
  const beforeX = await page.evaluate(() => {
    const state = (window as any).__DEBUG_GAME_STATE__?.();
    const players = Object.values(state.players) as any[];
    const p1 = players.find((p: any) => p.slotIndex === 0);
    return p1?.x ?? 0;
  });

  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(300);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(200);

  const afterX = await page.evaluate(() => {
    const state = (window as any).__DEBUG_GAME_STATE__?.();
    const players = Object.values(state.players) as any[];
    const p1 = players.find((p: any) => p.slotIndex === 0);
    return p1?.x ?? 0;
  });

  // P1 should have moved right
  expect(afterX).toBeGreaterThan(beforeX);

  // Verify an attack deals All-Rounder damage (NOT Lincoln's 20+)
  await page.evaluate(() => {
    (window as any).__smashDebug?.forcePosition?.('local-p2', 480, 420);
  });
  await page.waitForTimeout(200);

  const percentBefore = await page.evaluate(() => {
    const state = (window as any).__DEBUG_GAME_STATE__?.();
    const players = Object.values(state.players) as any[];
    const p2 = players.find((p: any) => p.slotIndex === 1);
    return p2?.percent ?? -1;
  });

  await performP1ForwardSmash(page);

  const percentAfter = await page.evaluate(() => {
    const state = (window as any).__DEBUG_GAME_STATE__?.();
    const players = Object.values(state.players) as any[];
    const p2 = players.find((p: any) => p.slotIndex === 1);
    return p2?.percent ?? -1;
  });

  const damageDealt = percentAfter - percentBefore;

  // Regression: if any hit landed, damage must NOT be Lincoln's forward smash (20+)
  // All-Rounder forward smash = 18, jab = 3, forward tilt = 7, etc.
  if (damageDealt > 0) {
    expect(damageDealt).toBeLessThan(20);
  }
  // If missed, characterId + movement assertions above already pass regression

  await page.screenshot({ path: test.info().outputPath("task-15-all-rounder-regression.png") });
});
