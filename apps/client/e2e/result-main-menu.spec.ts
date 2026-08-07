import { test, expect } from '@playwright/test';

/**
 * T25: Main Menu button on result screens — visual evidence + navigation test.
 *
 * Starts a local match, KOs one player to trigger result screen,
 * verifies both Play Again and Main Menu buttons are present,
 * then clicks Main Menu and asserts navigation back to lobby.
 */
test('result screen shows Main Menu button and navigates to lobby on click', async ({ page }) => {
  test.setTimeout(90000);

  await page.goto('http://localhost:5173');
  await page.waitForSelector('#local-play-btn', { timeout: 5000 });

  // Start local play
  await page.click('#local-play-btn');

  // Confirm character select: P1 = Enter, P2 = U
  await page.waitForTimeout(500);
  await page.keyboard.press('Enter');
  await page.keyboard.press('KeyU');

  // Wait for match start
  await page.waitForFunction(() => {
    const state = (window as any).__DEBUG_GAME_STATE__?.();
    return state?.matchPhase === 'match';
  }, { timeout: 15000, polling: 100 });

  // KO P2 repeatedly by walking them off the right blast zone.
  // P1 attacks P2 to build damage, then smash attacks to KO.
  // Strategy: hold P2 still (no input), P1 moves right to P2, then forward-smash repeatedly.
  // Simpler: use debug KO if available, or just wait for stocks to deplete via repeated attacks.

  // Alternative approach: use the game's own mechanics.
  // P2 starts at right spawn. P1 attacks P2 with forward smash (right + hold attack).
  // At high percent, P2 gets knocked past blast zone.

  // Build damage on P2: P1 moves right then attacks
  for (let stock = 0; stock < 3; stock++) {
    // Wait for respawn invincibility to wear off (3 seconds)
    if (stock > 0) {
      await page.waitForTimeout(3500);
    }

    // Move P1 toward P2 (P2 is to the right of P1)
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(600);
    await page.keyboard.up('ArrowRight');
    await page.waitForTimeout(100);

    // Pummel P2 with attacks to build percent
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('KeyZ'); // P1 attack
      await page.waitForTimeout(200);
    }

    // Forward smash to KO (hold right + attack)
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(50);
    // Smash attack = direction + hold attack key
    await page.keyboard.down('KeyZ');
    await page.waitForTimeout(300);
    await page.keyboard.up('KeyZ');
    await page.keyboard.up('ArrowRight');
    await page.waitForTimeout(500);

    // Additional smash attempts
    for (let j = 0; j < 5; j++) {
      await page.keyboard.down('ArrowRight');
      await page.waitForTimeout(50);
      await page.keyboard.down('KeyZ');
      await page.waitForTimeout(300);
      await page.keyboard.up('KeyZ');
      await page.keyboard.up('ArrowRight');
      await page.waitForTimeout(400);
    }
  }

  // Wait for result screen to appear (game:over triggers showLocalResult)
  await page.waitForSelector('#main-menu-btn', { timeout: 30000 });

  // Verify both buttons are present
  const playAgainBtn = await page.$('#local-play-again-btn');
  const mainMenuBtn = await page.$('#main-menu-btn');
  expect(playAgainBtn).not.toBeNull();
  expect(mainMenuBtn).not.toBeNull();

  // Verify button text
  const playAgainText = await playAgainBtn!.textContent();
  const mainMenuText = await mainMenuBtn!.textContent();
  expect(playAgainText).toBe('Play Again');
  expect(mainMenuText).toBe('Main Menu');

  // Screenshot result screen with both buttons
  await page.screenshot({ path: '.omo/evidence/t25-result-both-buttons.png' });

  // Click Main Menu
  await page.click('#main-menu-btn');

  // Assert navigation to lobby — lobby has the Local Play button
  await page.waitForSelector('#local-play-btn', { timeout: 10000 });
  const lobbyTitle = await page.textContent('.overlay-center');
  expect(lobbyTitle).toContain('SMASH CLONE');

  await page.screenshot({ path: '.omo/evidence/t25-main-menu-navigated-to-lobby.png' });
});
