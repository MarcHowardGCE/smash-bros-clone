import { expect, test } from '@playwright/test';

type SnapshotPlayer = {
  readonly id: string;
  readonly slotIndex?: number;
  readonly x: number;
};

type SnapshotShape = {
  readonly matchPhase?: string;
  readonly players: Record<string, SnapshotPlayer>;
};

type SnapshotEvalResult = {
  readonly smashSnapshot: SnapshotShape | null;
  readonly devSnapshot: SnapshotShape | null;
};

type SlotX = {
  readonly p1x: number;
  readonly p2x: number;
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

const readSnapshots = async (
  page: import('@playwright/test').Page,
): Promise<SnapshotEvalResult> => {
  return page.evaluate<[], SnapshotEvalResult>(() => {
    const win = window as Window & {
      __smashDebug?: { getSnapshot?: () => unknown };
      __DEBUG_GAME_STATE__?: () => unknown;
    };

    return {
      smashSnapshot: (win.__smashDebug?.getSnapshot?.() as SnapshotShape | null | undefined) ?? null,
      devSnapshot: (win.__DEBUG_GAME_STATE__?.() as SnapshotShape | null | undefined) ?? null,
    };
  });
};

const requireSlotPositions = (result: SnapshotEvalResult, label: string): SlotX => {
  expect(result.smashSnapshot, `${label}: __smashDebug snapshot should exist`).not.toBeNull();
  expect(result.devSnapshot, `${label}: __DEBUG_GAME_STATE__ snapshot should exist`).not.toBeNull();

  const smashSnapshot = result.smashSnapshot;
  const devSnapshot = result.devSnapshot;
  if (!smashSnapshot || !devSnapshot) {
    throw new Error(`${label}: missing debug snapshots`);
  }

  expect(smashSnapshot.matchPhase, `${label}: smash debug should be in match phase`).toBe('match');
  expect(devSnapshot.matchPhase, `${label}: dev debug should be in match phase`).toBe('match');

  const p1FromSmash = getSlotPlayer(smashSnapshot, 0);
  const p2FromSmash = getSlotPlayer(smashSnapshot, 1);
  const p1FromDev = getSlotPlayer(devSnapshot, 0);
  const p2FromDev = getSlotPlayer(devSnapshot, 1);

  // Guard both debug APIs agree on slot->position mapping semantics.
  expect(Math.abs(p1FromSmash.x - p1FromDev.x), `${label}: P1 x should align across debug APIs`).toBeLessThan(0.5);
  expect(Math.abs(p2FromSmash.x - p2FromDev.x), `${label}: P2 x should align across debug APIs`).toBeLessThan(0.5);

  return {
    p1x: p1FromSmash.x,
    p2x: p2FromSmash.x,
  };
};

test('CPU opponent acts in a real local match', async ({ page }) => {
  test.setTimeout(90_000);

  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  await page.goto('/');
  await page.waitForSelector('#local-play-btn', { timeout: 10_000 });

  await page.click('#local-play-btn');
  await page.waitForSelector('#lps-start-btn', { timeout: 10_000 });

  // Defaults are required by this test contract:
  // - 2 Players
  // - Seat 1 = CPU: Medium
  await page.click('#lps-start-btn');

  // P1 confirm via UIManager CONFIRM_KEYS[0] (Enter / KeyZ).
  // P2 is auto-confirmed by autoConfirmSlots and requires no key input.
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

  const forceOk = await page.evaluate(() => {
    const debug = (window as Window & {
      __smashDebug?: {
        forcePosition?: (playerId: string, x: number, y: number) => boolean;
      };
    }).__smashDebug;
    return debug?.forcePosition?.('local-p2', 1220, 420) ?? false;
  });
  expect(forceOk).toBe(true);

  const t0 = requireSlotPositions(await readSnapshots(page), 't=0');

  // No human input for the full measurement window:
  // - P1 should remain essentially stationary (regression anchor)
  // - CPU should recover/move meaningfully on its own
  await page.waitForTimeout(2000);
  const t2000 = requireSlotPositions(await readSnapshots(page), 't=2000ms');
  const p1Delta = Math.abs(t2000.p1x - t0.p1x);
  const cpuDelta = Math.abs(t2000.p2x - t0.p2x);

  expect(p1Delta).toBeLessThan(2);
  expect(cpuDelta).toBeGreaterThan(5);

  expect(consoleErrors).toHaveLength(0);
});
