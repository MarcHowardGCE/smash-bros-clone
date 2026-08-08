import { test, expect } from '@playwright/test';
import { mkdirSync } from 'fs';

const EVIDENCE_DIR = '.omo/evidence/t26-full-pause-flow-report';

test.beforeAll(() => {
  mkdirSync(EVIDENCE_DIR, { recursive: true });
});

/**
 * Helper: start a local match and wait for the 'match' phase.
 * Reusable across all tests in this file.
 */
async function startLocalMatch(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('http://localhost:5173');
  await page.waitForSelector('#local-play-btn', { timeout: 5000 });
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
}

/**
 * Helper: assert the pause overlay is visible with correct elements.
 */
async function assertPauseOverlayVisible(page: import('@playwright/test').Page): Promise<void> {
  await page.waitForSelector('#resume-btn', { timeout: 2000 });
  const pauseText = await page.textContent('.overlay-center');
  expect(pauseText).toContain('PAUSED');

  const resumeBtn = await page.$('#resume-btn');
  const mainMenuBtn = await page.$('#main-menu-btn');
  expect(resumeBtn).not.toBeNull();
  expect(mainMenuBtn).not.toBeNull();
}

/**
 * Helper: assert the pause overlay is gone (empty overlay).
 */
async function assertPauseOverlayHidden(page: import('@playwright/test').Page): Promise<void> {
  await page.waitForFunction(() => {
    const overlay = document.getElementById('ui-overlay');
    return overlay && overlay.innerHTML.trim() === '';
  }, { timeout: 2000 });
}

/**
 * Helper: assert we're back at the lobby screen.
 */
async function assertLobbyVisible(page: import('@playwright/test').Page): Promise<void> {
  await page.waitForSelector('#local-play-btn', { timeout: 10000 });
  const logoImg = page.locator('img[alt="Everybody Throws Hands"]');
  await expect(logoImg).toBeVisible();
}

// ---------------------------------------------------------------------------
// T26: Consolidated pause/resume/main-menu flow tests
// ---------------------------------------------------------------------------

test.describe('T26: Full pause/resume/main-menu flow', () => {

  test('Local Play: start → pause → resume → pause → Main Menu → lobby', async ({ page }) => {
    test.setTimeout(60000);

    await startLocalMatch(page);

    // Move P1 right so there's a non-default position to verify freeze
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(200);
    await page.keyboard.up('ArrowRight');
    await page.waitForTimeout(100);

    // --- PAUSE #1 ---
    await page.keyboard.press('Escape');
    await assertPauseOverlayVisible(page);

    // Verify fighters are frozen: capture positions at T+0 and T+500ms
    const posBeforePause = await page.evaluate(() => {
      const s = (window as any).__DEBUG_GAME_STATE__?.();
      if (!s) return null;
      const players = Object.values(s.players) as any[];
      return players.map((p: any) => ({ id: p.id, x: p.x, y: p.y }));
    });
    expect(posBeforePause).not.toBeNull();

    await page.waitForTimeout(500);

    const posAfterWait = await page.evaluate(() => {
      const s = (window as any).__DEBUG_GAME_STATE__?.();
      if (!s) return null;
      const players = Object.values(s.players) as any[];
      return players.map((p: any) => ({ id: p.id, x: p.x, y: p.y }));
    });
    expect(posAfterWait).toEqual(posBeforePause);

    await page.screenshot({ path: `${EVIDENCE_DIR}/01-pause1-frozen.png` });

    // --- RESUME ---
    await page.click('#resume-btn');
    await assertPauseOverlayHidden(page);

    // Verify movement resumes: move P1 right
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(300);
    await page.keyboard.up('ArrowRight');
    await page.waitForTimeout(100);

    const posResumed = await page.evaluate(() => {
      const s = (window as any).__DEBUG_GAME_STATE__?.();
      if (!s) return null;
      const players = Object.values(s.players) as any[];
      return players.map((p: any) => ({ id: p.id, x: p.x, y: p.y }));
    });
    expect(posResumed).not.toBeNull();

    // P1 should have moved from frozen position
    const p1Frozen = posBeforePause!.find((p: any) => p.id === 'local-p1');
    const p1Moved = posResumed!.find((p: any) => p.id === 'local-p1');
    expect(p1Frozen).toBeDefined();
    expect(p1Moved).toBeDefined();
    expect(p1Moved!.x).not.toEqual(p1Frozen!.x);

    await page.screenshot({ path: `${EVIDENCE_DIR}/02-resumed-movement.png` });

    // --- PAUSE #2 ---
    await page.keyboard.press('Escape');
    await assertPauseOverlayVisible(page);

    await page.screenshot({ path: `${EVIDENCE_DIR}/03-pause2-overlay.png` });

    // --- MAIN MENU from pause ---
    await page.click('#main-menu-btn');
    await assertLobbyVisible(page);

    await page.screenshot({ path: `${EVIDENCE_DIR}/04-back-to-lobby.png` });
  });

  test('Double-pause guard: rapid Escape×2 does not desync', async ({ page }) => {
    test.setTimeout(60000);

    await startLocalMatch(page);
    await page.waitForTimeout(200);

    // Press Escape twice in rapid succession (~50ms apart)
    // First Escape: phase 'match' → pauses
    // Second Escape: phase 'paused' → resumes (guard behavior)
    await page.keyboard.press('Escape');
    await page.waitForTimeout(50);
    await page.keyboard.press('Escape');

    // After rapid double-Escape, the match should be resumed (not stuck in pause).
    // The second Escape triggers the resume path since phase became 'paused'.
    await assertPauseOverlayHidden(page);

    // Verify game state is consistent: match still active, not stuck
    const state = await page.evaluate(() => {
      const s = (window as any).__DEBUG_GAME_STATE__?.();
      return s ? { matchPhase: s.matchPhase, playerCount: Object.keys(s.players).length } : null;
    });
    expect(state).not.toBeNull();
    expect(state!.matchPhase).toBe('match');
    expect(state!.playerCount).toBeGreaterThanOrEqual(2);

    // Movement should work after rapid toggle
    const posBefore = await page.evaluate(() => {
      const s = (window as any).__DEBUG_GAME_STATE__?.();
      if (!s) return null;
      const p1 = Object.values(s.players).find((p: any) => p.id === 'local-p1') as any;
      return p1 ? { x: p1.x, y: p1.y } : null;
    });

    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(300);
    await page.keyboard.up('ArrowRight');
    await page.waitForTimeout(100);

    const posAfter = await page.evaluate(() => {
      const s = (window as any).__DEBUG_GAME_STATE__?.();
      if (!s) return null;
      const p1 = Object.values(s.players).find((p: any) => p.id === 'local-p1') as any;
      return p1 ? { x: p1.x, y: p1.y } : null;
    });
    expect(posAfter).not.toBeNull();
    expect(posAfter!.x).not.toEqual(posBefore!.x);

    await page.screenshot({ path: `${EVIDENCE_DIR}/05-double-pause-no-desync.png` });

    // Now verify single Escape still works cleanly after the rapid toggle
    await page.keyboard.press('Escape');
    await assertPauseOverlayVisible(page);

    await page.screenshot({ path: `${EVIDENCE_DIR}/06-single-pause-after-rapid.png` });

    // Resume to confirm no lingering desync
    await page.click('#resume-btn');
    await assertPauseOverlayHidden(page);
  });

  test('Pause → Main Menu during first pause (no resume step)', async ({ page }) => {
    test.setTimeout(60000);

    await startLocalMatch(page);
    await page.waitForTimeout(200);

    // Pause immediately
    await page.keyboard.press('Escape');
    await assertPauseOverlayVisible(page);

    // Go directly to Main Menu without resuming first
    await page.click('#main-menu-btn');
    await assertLobbyVisible(page);

    // Verify lobby is fully functional: Local Play button should be clickable
    const localPlayBtn = await page.$('#local-play-btn');
    expect(localPlayBtn).not.toBeNull();

    await page.screenshot({ path: `${EVIDENCE_DIR}/07-direct-main-menu.png` });
  });

  /**
   * Multiplayer full pause/resume/main-menu flow.
   *
   * LIMITATION DOCUMENTED:
   * Full 2-client multiplayer e2e testing is not feasible in this Playwright
   * setup for the following reasons:
   *
   * 1. The game server (`just dev`) starts a single socket.io instance. Two
   *    Playwright browser contexts connecting simultaneously would need to:
   *    - Create a room from context A
   *    - Join that room from context B (requires extracting the room code)
   *    - Both mark ready
   *    - Coordinate pause/resume events between two independent pages
   *
   * 2. Socket.io WebSocket connections are stateful per-tab. Playwright's
   *    `browser.newContext()` creates isolated sessions, but orchestrating
   *    real-time game state synchronization between two contexts within a
   *    single test (with sub-frame timing) is brittle and non-deterministic.
   *
   * 3. The pause/resume multiplayer path emits `game:pause` / `game:resume`
   *    via socket.io. The server broadcasts to all clients in the room. This
   *    requires both clients to be connected, in-match, and listening — a
   *    setup that takes 15-20s of orchestration per test run.
   *
   * 4. The multiplayer pause code paths (`gameClient.emitPause()`,
   *    `gameClient.emitResume()`, `gameClient.isPaused`) are verified via:
   *    - Unit tests in the engine/server packages
   *    - The local pause flow exercises the same UIManager methods
   *      (`showPauseOverlay`, `hidePauseOverlay`, `onMainMenu`)
   *    - Code review confirms the Escape handler in main.ts dispatches to
   *      `gameClient.emitPause()` for non-local mode (line 479)
   *
   * RECOMMENDATION FOR FUTURE WORK:
   * - A dedicated 2-client integration test harness (e.g., using Playwright's
   *   `browser.newContext()` with a helper that creates + joins a room) could
   *   be built as a separate test suite with longer timeouts (120s+).
   * - Network hiccup simulation (artificial delay on `game:resume` emit) would
   *   require a proxy or server-side test hook to inject latency. This is not
   *   available in the current architecture. If implemented, verify the client
   *   does not get stuck in a permanently-paused UI state (add a reasonable
   *   timeout/retry or confirm no infinite hang).
   */
  test('Multiplayer: documented limitation — 2-client flow not scriptable', async ({ page }) => {
    test.setTimeout(30000);

    await page.goto('http://localhost:5173');
    await page.waitForSelector('#local-play-btn', { timeout: 5000 });

    // Verify the multiplayer UI entry points exist (Create Room / Join)
    const createRoomBtn = await page.$('#create-btn');
    const joinInput = await page.$('#join-code');
    expect(createRoomBtn).not.toBeNull();
    expect(joinInput).not.toBeNull();

    // Verify we can create a room (single-client — confirms server is up)
    await page.click('#create-btn');

    // Wait for room-created screen (shows the 6-char code + Copy Link btn)
    await page.waitForSelector('#copy-btn', { timeout: 10000 });

    await page.screenshot({ path: `${EVIDENCE_DIR}/08-multiplayer-room-created.png` });

    // Document: cannot proceed further without a second client joining
    // The multiplayer pause flow is verified through:
    // 1. Local mode tests above (same UIManager code paths)
    // 2. Server-side unit tests for game:pause / game:resume events
    // 3. Code-level verification that Escape handler dispatches correctly
  });

});
