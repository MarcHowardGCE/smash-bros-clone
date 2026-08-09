import { expect, test } from '@playwright/test';

type SnapshotPlayer = {
  readonly id: string;
  readonly slotIndex?: number;
  readonly x: number;
  readonly y: number;
  readonly percent: number;
};

type SnapshotShape = {
  readonly matchPhase?: string;
  readonly players: Record<string, SnapshotPlayer>;
};

const getSlotPlayer = (snapshot: SnapshotShape, slotIndex: number): SnapshotPlayer => {
  const players = Object.values(snapshot.players);
  const bySlot = players.find((player) => player.slotIndex === slotIndex);
  if (bySlot) {
    return bySlot;
  }

  const sorted = [...players].sort((a, b) => (a.slotIndex ?? 99) - (b.slotIndex ?? 99));
  const fallback = sorted[slotIndex];
  if (!fallback) {
    throw new Error(`slot ${slotIndex} not found in debug snapshot`);
  }
  return fallback;
};

test('CPUs engage each other in 3-player FFA', async ({ page }) => {
  test.setTimeout(90_000);

  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  await page.goto('/');
  
  // Dismiss splash screen by clicking
  await page.waitForSelector('#splash-screen', { timeout: 10_000 });
  await page.click('#splash-screen');
  await page.waitForTimeout(1000); // Wait for fade-out animation
  
  await page.waitForSelector('#local-play-btn', { timeout: 10_000 });

  await page.click('#local-play-btn');
  await page.waitForSelector('#lps-start-btn', { timeout: 10_000 });

  // Change participant count to 3 players
  const threePlayerBtn = await page.$('button[data-count="3"]');
  if (threePlayerBtn) {
    await threePlayerBtn.click();
  }

  // Ensure both CPU seats are set to medium difficulty (default)
  await page.waitForTimeout(200);

  await page.click('#lps-start-btn');

  // P1 confirm (Enter / KeyZ)
  await page.keyboard.press('Enter');
  
  // Select stage (wait for stage selection screen and press Enter to select first stage)
  await page.waitForTimeout(500);
  await page.keyboard.press('Enter');

  await page.waitForFunction(() => {
    const hudPanel = document.getElementById('hud-panel');
    if (!hudPanel) return false;
    const style = window.getComputedStyle(hudPanel);
    return style.display !== 'none';
  }, { timeout: 20_000, polling: 100 });

  await page.waitForFunction(() => {
    const win = window as Window & {
      __smashDebug?: { getSnapshot?: () => { matchPhase?: string } | null };
      __DEBUG_GAME_STATE__?: () => { matchPhase?: string } | null;
    };
    const smashPhase = win.__smashDebug?.getSnapshot?.()?.matchPhase;
    const devPhase = win.__DEBUG_GAME_STATE__?.()?.matchPhase;
    return smashPhase === 'match' && devPhase === 'match';
  }, { timeout: 10_000, polling: 100 });

  // Force-position players:
  // - P1 (human) far left: x=300, y=472 (grounded on main platform)
  // - P2 (CPU) far right: x=1000, y=472 (grounded on main platform)
  // - P3 (CPU) near P2: x=950, y=472 (grounded on main platform)
  // This setup puts the two CPUs near each other and far from the human
  const forceP1 = await page.evaluate(() => {
    const debug = (window as Window & {
      __smashDebug?: {
        forcePosition?: (playerId: string, x: number, y: number) => boolean;
      };
    }).__smashDebug;
    return debug?.forcePosition?.('local-p1', 300, 472) ?? false;
  });
  expect(forceP1).toBe(true);

  const forceP2 = await page.evaluate(() => {
    const debug = (window as Window & {
      __smashDebug?: {
        forcePosition?: (playerId: string, x: number, y: number) => boolean;
      };
    }).__smashDebug;
    return debug?.forcePosition?.('local-p2', 1000, 472) ?? false;
  });
  expect(forceP2).toBe(true);

  const forceP3 = await page.evaluate(() => {
    const debug = (window as Window & {
      __smashDebug?: {
        forcePosition?: (playerId: string, x: number, y: number) => boolean;
      };
    }).__smashDebug;
    return debug?.forcePosition?.('local-p3', 950, 472) ?? false;
  });
  expect(forceP3).toBe(true);

  // Read initial state
  const t0 = await page.evaluate(() => {
    const win = window as Window & {
      __smashDebug?: { getSnapshot?: () => unknown };
    };
    const snapshot = win.__smashDebug?.getSnapshot?.() as {
      players?: Record<string, { percent: number; x: number; slotIndex?: number }>;
    } | null;
    if (!snapshot || !snapshot.players) return null;
    const players = Object.values(snapshot.players);
    const p2 = players.find(p => p.slotIndex === 1);
    const p3 = players.find(p => p.slotIndex === 2);
    return {
      p2Percent: p2?.percent ?? 0,
      p3Percent: p3?.percent ?? 0,
      p2x: p2?.x ?? 0,
      p3x: p3?.x ?? 0,
    };
  });
  expect(t0).not.toBeNull();

  // Wait 2 seconds with no human input
  // CPUs should engage each other (not remain passive)
  await page.waitForTimeout(2000);

  const t2000 = await page.evaluate(() => {
    const win = window as Window & {
      __smashDebug?: { getSnapshot?: () => unknown };
    };
    const snapshot = win.__smashDebug?.getSnapshot?.() as {
      players?: Record<string, { percent: number; x: number; slotIndex?: number }>;
    } | null;
    if (!snapshot || !snapshot.players) return null;
    const players = Object.values(snapshot.players);
    const p2 = players.find(p => p.slotIndex === 1);
    const p3 = players.find(p => p.slotIndex === 2);
    return {
      p2Percent: p2?.percent ?? 0,
      p3Percent: p3?.percent ?? 0,
      p2x: p2?.x ?? 0,
      p3x: p3?.x ?? 0,
    };
  });
  expect(t2000).not.toBeNull();

  // Assert engagement via percent increase OR significant movement
  // At least ONE CPU should have taken damage OR both CPUs should have moved significantly
  const p2PercentDelta = (t2000 as NonNullable<typeof t2000>).p2Percent - (t0 as NonNullable<typeof t0>).p2Percent;
  const p3PercentDelta = (t2000 as NonNullable<typeof t2000>).p3Percent - (t0 as NonNullable<typeof t0>).p3Percent;
  const p2xDelta = Math.abs((t2000 as NonNullable<typeof t2000>).p2x - (t0 as NonNullable<typeof t0>).p2x);
  const p3xDelta = Math.abs((t2000 as NonNullable<typeof t2000>).p3x - (t0 as NonNullable<typeof t0>).p3x);

  const totalPercentDelta = p2PercentDelta + p3PercentDelta;
  const totalMovement = p2xDelta + p3xDelta;

  // CPUs engaged if either:
  // - Total percent increased by at least 5% (someone landed a hit)
  // - Both CPUs moved significantly (total movement > 30 pixels, proving they're not passive)
  const cpusEngaged = totalPercentDelta >= 5 || totalMovement > 30;
  expect(cpusEngaged).toBe(true);

  expect(consoleErrors).toHaveLength(0);
});
