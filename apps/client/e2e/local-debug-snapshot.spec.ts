import { expect, test } from '@playwright/test';

type SnapshotPlayer = {
  readonly id: string;
  readonly slotIndex?: number;
  readonly state: string;
  readonly vx: number;
  readonly vy: number;
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

const selectP1 = (snapshot: SnapshotShape): SnapshotPlayer => {
  const players = Object.values(snapshot.players);
  const localP1 = players.find((player) => player.id === 'local-p1');
  if (localP1) return localP1;

  return [...players].sort((a, b) => (a.slotIndex ?? 99) - (b.slotIndex ?? 99))[0];
};

const assertSnapshotShape = (snapshot: SnapshotShape | null, label: string): void => {
  expect(snapshot, `${label} should not be null`).not.toBeNull();

  if (!snapshot) return;

  expect(typeof snapshot.players, `${label}.players should exist`).toBe('object');
  const players = Object.values(snapshot.players);
  expect(players.length, `${label}.players should be non-empty`).toBeGreaterThan(0);

  const p1 = selectP1(snapshot);
  expect(typeof p1.state, `${label}.players[*].state should be a string`).toBe('string');
  expect(typeof p1.vx, `${label}.players[*].vx should be a number`).toBe('number');
  expect(typeof p1.vy, `${label}.players[*].vy should be a number`).toBe('number');
};

test('local mode exposes non-null debug snapshots via both debug APIs', async ({ page }) => {
  test.setTimeout(60_000);

  await page.goto('/');
  await page.waitForSelector('#local-play-btn', { timeout: 10_000 });
  // Let Vite dev client settle to avoid mid-test hot-reload during first launch.
  await page.waitForTimeout(2_000);
  await page.waitForSelector('#local-play-btn', { timeout: 10_000 });

  await page.click('#local-play-btn');
  await page.waitForTimeout(500);
  await page.keyboard.press('Enter');
  await page.keyboard.press('KeyU');

  await page.waitForFunction(() => {
    const hudPanel = document.getElementById('hud-panel');
    if (!hudPanel) return false;
    const style = window.getComputedStyle(hudPanel);
    return style.display !== 'none';
  }, { timeout: 15_000, polling: 100 });

  const beforeMove = await page.evaluate<[], SnapshotEvalResult>(() => {
    const win = window as Window & {
      __smashDebug?: { getSnapshot?: () => unknown };
      __DEBUG_GAME_STATE__?: () => unknown;
    };

    return {
      smashSnapshot: (win.__smashDebug?.getSnapshot?.() as SnapshotShape | null | undefined) ?? null,
      devSnapshot: (win.__DEBUG_GAME_STATE__?.() as SnapshotShape | null | undefined) ?? null,
    };
  });

  assertSnapshotShape(beforeMove.smashSnapshot, '__smashDebug.getSnapshot()');
  assertSnapshotShape(beforeMove.devSnapshot, '__DEBUG_GAME_STATE__()');

  expect(beforeMove.smashSnapshot?.matchPhase).toBe('match');
  expect(beforeMove.devSnapshot?.matchPhase).toBe('match');

  const beforeMoveP1XFromSmash = beforeMove.smashSnapshot ? selectP1(beforeMove.smashSnapshot).x : null;
  const beforeMoveP1XFromDev = beforeMove.devSnapshot ? selectP1(beforeMove.devSnapshot).x : null;

  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(300);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(200);

  await page.waitForFunction(() => {
    const win = window as Window & {
      __smashDebug?: { getSnapshot?: () => unknown };
      __DEBUG_GAME_STATE__?: () => unknown;
    };

    const smashSnapshot = (win.__smashDebug?.getSnapshot?.() as SnapshotShape | null | undefined) ?? null;
    const devSnapshot = (win.__DEBUG_GAME_STATE__?.() as SnapshotShape | null | undefined) ?? null;
    return smashSnapshot !== null && devSnapshot !== null;
  }, { timeout: 5_000, polling: 100 });

  const afterMove = await page.evaluate<[], SnapshotEvalResult>(() => {
    const win = window as Window & {
      __smashDebug?: { getSnapshot?: () => unknown };
      __DEBUG_GAME_STATE__?: () => unknown;
    };

    return {
      smashSnapshot: (win.__smashDebug?.getSnapshot?.() as SnapshotShape | null | undefined) ?? null,
      devSnapshot: (win.__DEBUG_GAME_STATE__?.() as SnapshotShape | null | undefined) ?? null,
    };
  });

  assertSnapshotShape(afterMove.smashSnapshot, '__smashDebug.getSnapshot() after movement');
  assertSnapshotShape(afterMove.devSnapshot, '__DEBUG_GAME_STATE__() after movement');

  const afterMoveP1XFromSmash = afterMove.smashSnapshot ? selectP1(afterMove.smashSnapshot).x : null;
  const afterMoveP1XFromDev = afterMove.devSnapshot ? selectP1(afterMove.devSnapshot).x : null;

  expect(afterMoveP1XFromSmash).not.toBe(beforeMoveP1XFromSmash);
  expect(afterMoveP1XFromDev).not.toBe(beforeMoveP1XFromDev);
});
