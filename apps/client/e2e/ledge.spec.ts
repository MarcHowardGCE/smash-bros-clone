import { test, expect } from '@playwright/test';
import { dismissSplash, chooseFirstStage, startLocalMatch } from './helpers/flow';

test('online ledge catch reaches both clients', async ({ browser, page: host }, testInfo) => {
  test.setTimeout(60_000);
  const guestContext = await browser.newContext(testInfo.project.use);
  try {
    const guest = await guestContext.newPage();
    await host.goto('/');
    await dismissSplash(host);
    await host.locator('#online-play-btn').click();
    await host.locator('#create-btn').click();
    await host.waitForURL(/room=/);

    await guest.goto(host.url());
    await guest.locator('#splash-screen').click();
    await guest.locator('#ready-btn').waitFor();
    await expect(host.locator('#player-list > div')).toHaveCount(2);
    for (const player of [host, guest]) {
      await player.locator('#ready-btn').click();
    }
    for (const player of [host, guest]) {
      await player.locator('.network-fighter-option[data-id="all-rounder"]').click();
      await player.locator('#network-charselect-confirm-btn').click();
    }
    await chooseFirstStage(host);
    await Promise.all([host, guest].map(player => player.waitForFunction(
      () => window.__smashDebug.getSnapshot()?.matchPhase === 'match',
    )));

    await host.keyboard.down('ArrowLeft');
    try {
      await Promise.all([host, guest].map(player => player.waitForFunction(
        () => Object.values(window.__smashDebug.getSnapshot().players)
          .some(fighter => fighter.slotIndex === 0 && fighter.state === 'LEDGE_HANG' && fighter.ledgeId === 'left'),
        null, { timeout: 8000 },
      )));
    } finally {
      await host.keyboard.up('ArrowLeft');
    }
    await host.screenshot({ path: testInfo.outputPath('online-ledge-catch.png') });
  } finally {
    await guestContext.close();
  }
});

test('local ledge jump getup and two-fighter trump resolve through the engine', async ({ page }, testInfo) => {
  await startLocalMatch(page);
  const approachLeftLedge = (slotIndex: number) => page.evaluate(slot => {
    const debug = window.__smashDebug;
    const fighter = Object.values(debug.getSnapshot().players).find(player => player.slotIndex === slot);
    return fighter ? debug.forcePosition(fighter.id, 175, 505) : false;
  }, slotIndex);
  const waitForHang = (slotIndex: number) => page.waitForFunction(slot =>
    Object.values(window.__smashDebug.getSnapshot().players)
      .some(fighter => fighter.slotIndex === slot && fighter.state === 'LEDGE_HANG' && fighter.ledgeId === 'left'),
  slotIndex, { timeout: 3000 });

  expect(await approachLeftLedge(0)).toBe(true);
  await waitForHang(0);
  await page.keyboard.down('KeyX');
  try {
    await page.waitForFunction(() => Object.values(window.__smashDebug.getSnapshot().players)
      .some(fighter => fighter.slotIndex === 0 && fighter.state === 'LEDGE_JUMP'), null, { timeout: 3000 });
  } finally {
    await page.keyboard.up('KeyX');
  }
  await page.waitForFunction(() => Object.values(window.__smashDebug.getSnapshot().players)
    .some(fighter => fighter.slotIndex === 0 && fighter.isGrounded), null, { timeout: 4000 });

  expect(await approachLeftLedge(0)).toBe(true);
  await waitForHang(0);
  // Set up the challenger and sample the short-lived trump state in the same browser task.
  await page.evaluate(() => {
    const debug = window.__smashDebug;
    const challenger = Object.values(debug.getSnapshot().players).find(player => player.slotIndex === 1);
    if (!challenger || !debug.forcePosition(challenger.id, 175, 505)) {
      throw new Error('Could not position the ledge challenger');
    }
    return new Promise<void>((resolve, reject) => {
      const deadline = performance.now() + 3000;
      const sample = () => {
        const snapshot = debug.getSnapshot();
        const occupant = Object.values(snapshot.players).find(fighter => fighter.slotIndex === 0);
        if (occupant?.state === 'LEDGE_TRUMP' && snapshot.ledges.left === challenger.id) {
          resolve();
        } else if (performance.now() >= deadline) {
          reject(new Error(`Ledge did not transfer: ${occupant?.state}, owner ${snapshot.ledges.left}`));
        } else {
          requestAnimationFrame(sample);
        }
      };
      requestAnimationFrame(sample);
    });
  });
  await page.screenshot({ path: testInfo.outputPath('local-ledge-trump.png') });
});
