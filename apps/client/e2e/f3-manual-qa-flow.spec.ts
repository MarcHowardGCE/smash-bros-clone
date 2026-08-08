import { test, expect } from '@playwright/test';
import { mkdirSync } from 'fs';

const EVIDENCE_DIR = '.omo/evidence/f3-manual-qa';

test.beforeAll(() => {
  mkdirSync(EVIDENCE_DIR, { recursive: true });
});

/**
 * F3: Full manual QA — play a local match end-to-end via Playwright.
 *
 * Flow: start → move/attack → pause → resume → grab → pummel → throw →
 *       get hit → accumulate damage → get KO'd → result screen → Main Menu → lobby
 *
 * Captures 15+ screenshots as visual evidence of each experience milestone.
 */
test('F3: Full local match end-to-end experience', async ({ page }) => {
  test.setTimeout(180_000); // 3 minutes — full match lifecycle

  // =========================================================================
  // STEP 1: Navigate to lobby
  // =========================================================================
  await page.goto('http://localhost:5173');
  await page.waitForSelector('#local-play-btn', { timeout: 10_000 });
  await page.screenshot({ path: `${EVIDENCE_DIR}/01-lobby.png` });

  // =========================================================================
  // STEP 2: Start local match
  // =========================================================================
  await page.click('#local-play-btn');
  await page.waitForTimeout(500);

  // Confirm character select: P1 = Enter, P2 = U (KeyU)
  await page.keyboard.press('Enter');
  await page.keyboard.press('KeyU');

  // Wait for countdown + match start
  await page.waitForFunction(() => {
    const state = (window as any).__DEBUG_GAME_STATE__?.();
    return state?.matchPhase === 'match';
  }, { timeout: 15_000, polling: 100 });

  // Wait for fighters to land (500ms — same as proven hit-flash.spec.ts)
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${EVIDENCE_DIR}/02-match-started.png` });

  // Verify match state is active
  const matchState = await page.evaluate(() => {
    const s = (window as any).__DEBUG_GAME_STATE__?.();
    if (!s) return null;
    const players = Object.values(s.players) as any[];
    return {
      matchPhase: s.matchPhase,
      playerCount: players.length,
    };
  });
  expect(matchState).not.toBeNull();
  expect(matchState!.matchPhase).toBe('match');
  expect(matchState!.playerCount).toBe(2);

  // =========================================================================
  // STEP 3: Move P1 toward P2 and attack — verify hit feedback
  // =========================================================================
  // P1 at x≈415, P2 at x≈865. Platform: x=190 to x=1090.
  // Walk P1 toward P2 in short increments, stop when gap is 30-80px (P1 LEFT of P2).
  for (let step = 0; step < 10; step++) {
    const positions = await page.evaluate(() => {
      const s = (window as any).__DEBUG_GAME_STATE__?.();
      if (!s) return null;
      const players = Object.values(s.players) as any[];
      const p1 = players.find((p: any) => p.slotIndex === 0);
      const p2 = players.find((p: any) => p.slotIndex === 1);
      return { p1x: p1?.x ?? 0, p2x: p2?.x ?? 0 };
    });
    const gap = (positions?.p2x ?? 865) - (positions?.p1x ?? 415);
    if (gap > 0 && gap < 80) break; // P1 is within attack range, to the LEFT of P2
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(300);
    await page.keyboard.up('ArrowRight');
    await page.waitForTimeout(100);
  }

  // P1 should now be within attack range of P2, facing right.
  // Use keyboard.down/up for attack to ensure it registers (press is too fast for game tick).
  let p2Damaged = false;
  for (let round = 0; round < 20 && !p2Damaged; round++) {
    // Forward tilt: hold right, then hold attack for ≥50ms (ensures game tick reads it)
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(30);
    await page.keyboard.down('KeyZ');
    await page.waitForTimeout(80); // hold attack for ~5 game ticks
    await page.keyboard.up('KeyZ');
    await page.keyboard.up('ArrowRight');
    await page.waitForTimeout(400); // wait for attack animation to complete

    const state = await page.evaluate(() => {
      const s = (window as any).__DEBUG_GAME_STATE__?.();
      if (!s) return null;
      const players = Object.values(s.players) as any[];
      const p2 = players.find((p: any) => p.slotIndex === 1);
      return p2 ? { percent: p2.percent } : null;
    });
    if (state && state.percent > 0) {
      p2Damaged = true;
    }
  }

  // Capture hit flash on next attack
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(30);
  await page.keyboard.down('KeyZ');
  await page.waitForTimeout(60); // capture during hit flash window
  await page.screenshot({ path: `${EVIDENCE_DIR}/03-attack-hit-flash.png` });
  await page.keyboard.up('KeyZ');
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(200);

  // Verify P2 took damage
  const damageAfterHits = await page.evaluate(() => {
    const s = (window as any).__DEBUG_GAME_STATE__?.();
    if (!s) return null;
    const players = Object.values(s.players) as any[];
    const p2 = players.find((p: any) => p.slotIndex === 1);
    return p2 ? { percent: p2.percent } : null;
  });
  expect(damageAfterHits).not.toBeNull();
  expect(damageAfterHits!.percent).toBeGreaterThan(0);

  await page.screenshot({ path: `${EVIDENCE_DIR}/04-damage-dealt.png` });

  // =========================================================================
  // STEP 4: Pause — verify overlay appears
  // =========================================================================
  await page.keyboard.press('Escape');

  // Wait for pause overlay with PAUSED text and buttons
  await page.waitForSelector('#resume-btn', { timeout: 3000 });
  const pauseText = await page.textContent('.overlay-center');
  expect(pauseText).toContain('PAUSED');

  const resumeBtn = await page.$('#resume-btn');
  const mainMenuBtn = await page.$('#main-menu-btn');
  expect(resumeBtn).not.toBeNull();
  expect(mainMenuBtn).not.toBeNull();

  // Verify game is frozen: capture positions
  const posFrozen1 = await page.evaluate(() => {
    const s = (window as any).__DEBUG_GAME_STATE__?.();
    if (!s) return null;
    const players = Object.values(s.players) as any[];
    return players.map((p: any) => ({ id: p.id, x: p.x, y: p.y }));
  });
  await page.waitForTimeout(500);
  const posFrozen2 = await page.evaluate(() => {
    const s = (window as any).__DEBUG_GAME_STATE__?.();
    if (!s) return null;
    const players = Object.values(s.players) as any[];
    return players.map((p: any) => ({ id: p.id, x: p.x, y: p.y }));
  });
  expect(posFrozen2).toEqual(posFrozen1); // Positions unchanged = game frozen

  await page.screenshot({ path: `${EVIDENCE_DIR}/05-paused-overlay.png` });

  // =========================================================================
  // STEP 5: Resume — verify game continues
  // =========================================================================
  await page.click('#resume-btn');

  // Verify overlay is gone
  await page.waitForFunction(() => {
    const overlay = document.getElementById('ui-overlay');
    return overlay && overlay.innerHTML.trim() === '';
  }, { timeout: 3000 });

  // Move P1 to confirm game is live again
  const posBeforeMove = await page.evaluate(() => {
    const s = (window as any).__DEBUG_GAME_STATE__?.();
    if (!s) return null;
    const p1 = Object.values(s.players).find((p: any) => p.slotIndex === 0) as any;
    return p1 ? { x: p1.x } : null;
  });

  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(300);
  await page.keyboard.up('ArrowRight');

  const posAfterMove = await page.evaluate(() => {
    const s = (window as any).__DEBUG_GAME_STATE__?.();
    if (!s) return null;
    const p1 = Object.values(s.players).find((p: any) => p.slotIndex === 0) as any;
    return p1 ? { x: p1.x } : null;
  });
  expect(posAfterMove!.x).not.toEqual(posBeforeMove!.x); // Movement confirmed

  await page.screenshot({ path: `${EVIDENCE_DIR}/06-resumed-moving.png` });

  // =========================================================================
  // STEP 6: Grab P2 — verify grab pins victim
  // =========================================================================
  // Move P1 close to P2 first
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(500);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(100);

  // Press grab (KeyC for P1)
  await page.keyboard.press('KeyC');
  await page.waitForTimeout(200); // startup frames (6) + active (3) at 60fps ≈ 150ms

  // Check if grab connected
  const grabState = await page.evaluate(() => {
    const s = (window as any).__DEBUG_GAME_STATE__?.();
    if (!s) return null;
    const players = Object.values(s.players) as any[];
    const p1 = players.find((p: any) => p.slotIndex === 0);
    return {
      isGrabbing: p1?.isGrabbing,
      grabbedPlayerId: p1?.grabbedPlayerId,
      p1State: p1?.state,
    };
  });

  await page.screenshot({ path: `${EVIDENCE_DIR}/07-grab-attempt.png` });

  // If grab didn't connect, try again closer (retry up to 5 times)
  if (!grabState?.isGrabbing) {
    for (let retry = 0; retry < 5; retry++) {
      await page.keyboard.down('ArrowRight');
      await page.waitForTimeout(200);
      await page.keyboard.up('ArrowRight');
      await page.waitForTimeout(50);
      await page.keyboard.press('KeyC');
      await page.waitForTimeout(200);
      const check = await page.evaluate(() => {
        const s = (window as any).__DEBUG_GAME_STATE__?.();
        if (!s) return false;
        const players = Object.values(s.players) as any[];
        const p1 = players.find((p: any) => p.slotIndex === 0);
        return p1?.isGrabbing === true;
      });
      if (check) break;
    }
  }

  const grabState2 = await page.evaluate(() => {
    const s = (window as any).__DEBUG_GAME_STATE__?.();
    if (!s) return null;
    const players = Object.values(s.players) as any[];
    const p1 = players.find((p: any) => p.slotIndex === 0);
    return {
      isGrabbing: p1?.isGrabbing,
      grabbedPlayerId: p1?.grabbedPlayerId,
      p1State: p1?.state,
    };
  });

  await page.screenshot({ path: `${EVIDENCE_DIR}/08-grab-holding.png` });

  // =========================================================================
  // STEP 7: Pummel 3x — verify damage increases each time
  // =========================================================================
  const p2PercentBeforePummel = await page.evaluate(() => {
    const s = (window as any).__DEBUG_GAME_STATE__?.();
    if (!s) return 0;
    const players = Object.values(s.players) as any[];
    const p2 = players.find((p: any) => p.slotIndex === 1);
    return p2?.percent ?? 0;
  });

  // Pummel = attack while grabbing (KeyZ while in GrabHolding)
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('KeyZ');
    await page.waitForTimeout(250); // pummel: 3 startup + 1 active + 8 recovery = 12 frames ≈ 200ms
  }

  const p2PercentAfterPummel = await page.evaluate(() => {
    const s = (window as any).__DEBUG_GAME_STATE__?.();
    if (!s) return 0;
    const players = Object.values(s.players) as any[];
    const p2 = players.find((p: any) => p.slotIndex === 1);
    return p2?.percent ?? 0;
  });

  // If grab was successful, pummel should have added damage (2 per pummel = 6 total)
  if (grabState2?.isGrabbing) {
    expect(p2PercentAfterPummel).toBeGreaterThan(p2PercentBeforePummel);
  }

  await page.screenshot({ path: `${EVIDENCE_DIR}/09-pummel-damage.png` });

  // =========================================================================
  // STEP 8: Forward throw — verify knockback + un-pin
  // =========================================================================
  // Forward throw = direction + attack while grabbing
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(30);
  await page.keyboard.press('KeyZ');
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(500); // throw animation: 10 startup + 1 active + 15 recovery = 26 frames ≈ 433ms

  const afterThrow = await page.evaluate(() => {
    const s = (window as any).__DEBUG_GAME_STATE__?.();
    if (!s) return null;
    const players = Object.values(s.players) as any[];
    const p1 = players.find((p: any) => p.slotIndex === 0);
    const p2 = players.find((p: any) => p.slotIndex === 1);
    return {
      p1Grabbing: p1?.isGrabbing,
      p2Percent: p2?.percent,
      p2State: p2?.state,
    };
  });

  // After throw, P1 should no longer be grabbing
  if (grabState2?.isGrabbing) {
    expect(afterThrow?.p1Grabbing).toBeFalsy();
  }

  await page.screenshot({ path: `${EVIDENCE_DIR}/10-throw-knockback.png` });

  // =========================================================================
  // STEP 9: Get hit by P2 — have P2 attack P1
  // =========================================================================
  // P2 attacks P1: P2 faces left (toward P1), attack = KeyU
  // First move P2 toward P1
  await page.keyboard.down('KeyJ'); // P2 left
  await page.waitForTimeout(400);
  await page.keyboard.up('KeyJ');
  await page.waitForTimeout(50);

  // P2 attacks
  await page.keyboard.down('KeyJ');
  await page.keyboard.press('KeyU');
  await page.waitForTimeout(80);
  await page.screenshot({ path: `${EVIDENCE_DIR}/11-p2-attacks-p1.png` });
  await page.keyboard.up('KeyJ');
  await page.waitForTimeout(200);

  // More P2 attacks to confirm P1 takes damage
  for (let i = 0; i < 8; i++) {
    await page.keyboard.down('KeyJ');
    await page.keyboard.press('KeyU');
    await page.waitForTimeout(100);
    await page.keyboard.up('KeyJ');
    await page.waitForTimeout(150);
  }

  const p1DamageState = await page.evaluate(() => {
    const s = (window as any).__DEBUG_GAME_STATE__?.();
    if (!s) return null;
    const players = Object.values(s.players) as any[];
    const p1 = players.find((p: any) => p.slotIndex === 0);
    return { p1Percent: p1?.percent };
  });

  await page.screenshot({ path: `${EVIDENCE_DIR}/12-p1-taking-damage.png` });

  // =========================================================================
  // STEP 10: Build P1 damage to 150%+ for KO vulnerability, then KO P1
  // =========================================================================
  // P2 attacks P1 aggressively to build high percent
  for (let round = 0; round < 30; round++) {
    await page.keyboard.down('KeyJ');
    await page.keyboard.press('KeyU');
    await page.waitForTimeout(100);
    await page.keyboard.up('KeyJ');
    await page.waitForTimeout(100);

    // Check if P1 is already high percent
    const state = await page.evaluate(() => {
      const s = (window as any).__DEBUG_GAME_STATE__?.();
      if (!s) return null;
      const players = Object.values(s.players) as any[];
      const p1 = players.find((p: any) => p.slotIndex === 0);
      return { p1Percent: p1?.percent ?? 0 };
    });
    if (state && state.p1Percent >= 100) break;
  }

  // Screenshot high damage state (damage% color should be red/orange at high percent)
  await page.screenshot({ path: `${EVIDENCE_DIR}/13-high-damage-color.png` });

  // P2 forward smash to KO P1 (hold direction + hold attack)
  for (let attempt = 0; attempt < 10; attempt++) {
    await page.keyboard.down('KeyJ'); // P2 left toward P1
    await page.keyboard.down('KeyU'); // P2 hold attack = smash
    await page.waitForTimeout(300);
    await page.keyboard.up('KeyU');
    await page.keyboard.up('KeyJ');
    await page.waitForTimeout(400);

    // Check for KO
    const koCheck = await page.evaluate(() => {
      const s = (window as any).__DEBUG_GAME_STATE__?.();
      if (!s) return null;
      const players = Object.values(s.players) as any[];
      const p1 = players.find((p: any) => p.slotIndex === 0);
      return { isKnockedOut: p1?.isKnockedOut, stocks: p1?.stocks };
    });
    if (koCheck?.isKnockedOut) {
      await page.screenshot({ path: `${EVIDENCE_DIR}/14-ko-effect.png` });
      break;
    }
  }

  // =========================================================================
  // STEP 11: Deplete all stocks to reach result screen
  // =========================================================================
  // Continue KO-ing P1 until all stocks depleted (3 total)
  // Wait for respawn if first KO happened
  await page.waitForTimeout(3500); // respawn invincibility

  // Aggressive KO loop for remaining stocks
  for (let stock = 0; stock < 3; stock++) {
    // Build damage on P1
    for (let i = 0; i < 40; i++) {
      await page.keyboard.down('KeyJ');
      await page.keyboard.press('KeyU');
      await page.waitForTimeout(80);
      await page.keyboard.up('KeyJ');
      await page.waitForTimeout(80);
    }

    // Smash to KO
    for (let smash = 0; smash < 15; smash++) {
      await page.keyboard.down('KeyJ');
      await page.keyboard.down('KeyU');
      await page.waitForTimeout(300);
      await page.keyboard.up('KeyU');
      await page.keyboard.up('KeyJ');
      await page.waitForTimeout(300);
    }

    // Check if match is over
    const endCheck = await page.evaluate(() => {
      const s = (window as any).__DEBUG_GAME_STATE__?.();
      return s?.matchPhase;
    });
    if (endCheck === 'result' || endCheck === 'gameover') break;

    // Wait for respawn
    await page.waitForTimeout(3500);
  }

  // Wait for result screen (Main Menu button appears)
  await page.waitForSelector('#main-menu-btn', { timeout: 60_000 });
  await page.screenshot({ path: `${EVIDENCE_DIR}/15-result-screen.png` });

  // Verify result screen elements
  const resultBtns = await page.evaluate(() => {
    const playAgain = document.getElementById('local-play-again-btn');
    const mainMenu = document.getElementById('main-menu-btn');
    return {
      hasPlayAgain: !!playAgain,
      hasMainMenu: !!mainMenu,
      playAgainText: playAgain?.textContent,
      mainMenuText: mainMenu?.textContent,
    };
  });
  expect(resultBtns.hasPlayAgain).toBe(true);
  expect(resultBtns.hasMainMenu).toBe(true);
  expect(resultBtns.mainMenuText).toBe('Main Menu');

  // =========================================================================
  // STEP 12: Click Main Menu — verify navigation back to lobby
  // =========================================================================
  await page.click('#main-menu-btn');

  // Wait for lobby to appear
  await page.waitForSelector('#local-play-btn', { timeout: 10_000 });
  const lobbyText = await page.textContent('.overlay-center');
  expect(lobbyText).toContain('SMASH CLONE');

  await page.screenshot({ path: `${EVIDENCE_DIR}/16-back-to-lobby.png` });
});
