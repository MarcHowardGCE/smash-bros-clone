import { expect, test, type Page } from '@playwright/test';

async function confirmFighter(page: Page, id: string) {
  await page.locator(`.network-fighter-option[data-id="${id}"]`).click();
  await page.locator('#network-charselect-confirm-btn').click();
}

async function openSelection(host: Page, guest: Page, origin: string) {
  await host.goto(origin);
  await host.locator('#splash-screen').click();
  await host.locator('#online-play-btn').click();
  await host.locator('#create-btn').click();
  await host.waitForURL(/room=/);
  await guest.goto(host.url());
  await guest.locator('#splash-screen').click();
  await expect(host.locator('#player-list > div')).toHaveCount(2);
  for (const page of [host, guest]) await page.locator('#ready-btn').click();
}

const abeIdleAtlas = /\/production\/atlas-abe-lincoln-live-0\.(png|webp)$/;
const selectStage = (host: Page) => host.locator('[data-stage-idx="0"]').click();
const waitForLive = (page: Page) => page.waitForFunction(
  () => window.__smashDebug?.getSnapshot()?.matchPhase === 'match',
);

test('live refresh restores the fighter before a pending atlas and then attaches its art', async ({ page: host, browser, baseURL }, info) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: info.project.use.deviceScaleFactor });
  test.setTimeout(90_000);
  const guest = await context.newPage();
  let releaseAtlas!: () => void;
  const atlasGate = new Promise<void>(resolve => { releaseAtlas = resolve; });
  try {
    await openSelection(host, guest, baseURL!);
    await confirmFighter(host, 'abe-lincoln');
    await confirmFighter(guest, 'swift');
    await selectStage(host);
    await Promise.all([waitForLive(host), waitForLive(guest)]);
    const slot = await guest.evaluate(() =>
      Object.values(window.__smashDebug.getSnapshot().players).find(player => player.characterId === 'swift')?.slotIndex,
    );
    expect(slot).toBe(1);

    let requested = false;
    await guest.route(abeIdleAtlas, async route => {
      requested = true;
      await atlasGate;
      await route.continue();
    });
    await guest.reload({ waitUntil: 'domcontentloaded' });
    await waitForLive(guest);
    await expect.poll(() => requested).toBe(true);
    await expect.poll(() => guest.evaluate(() =>
      Object.values(window.__smashDebug.getSnapshot().players).find(player => player.characterId === 'swift')?.slotIndex,
    )).toBe(slot);
    releaseAtlas();
    await expect.poll(() => guest.evaluate(() =>
      window.__smashDebug.getArtState().players.filter(player => player.bodyVisible).length,
    )).toBe(2);
  } finally {
    releaseAtlas();
    await context.close();
  }
});

test('an interrupted fighter atlas can be retried with the same lineup', async ({ page: host, browser, baseURL }, info) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: info.project.use.deviceScaleFactor });
  test.setTimeout(90_000);
  const guest = await context.newPage();
  let releaseOtherPage!: () => void;
  const otherPageGate = new Promise<void>(resolve => { releaseOtherPage = resolve; });
  try {
    await openSelection(host, guest, baseURL!);
    let interrupted = false;
    await guest.route(abeIdleAtlas, async route => {
      if (interrupted) {
        await route.continue();
        return;
      }
      interrupted = true;
      await route.abort('connectionreset');
    });
    let otherPageRequested = false;
    await guest.route(/\/production\/atlas-abe-lincoln-live-1\.(png|webp)$/, async route => {
      otherPageRequested = true;
      await otherPageGate;
      await route.continue();
    });
    await confirmFighter(host, 'abe-lincoln');
    await confirmFighter(guest, 'swift');
    await selectStage(host);
    await expect(guest.locator('#network-charselect-error')).toHaveText(/Fighter artwork could not load/, { timeout: 5000 });
    await expect.poll(() => otherPageRequested).toBe(true);
    await expect(host.locator('#guest-world-status')).toHaveText(/1 \/ 2 ready/);

    const retried = guest.waitForResponse(response => abeIdleAtlas.test(response.url()) && response.ok());
    await guest.locator('#online-change-fighter').click();
    await confirmFighter(guest, 'swift');
    await selectStage(host);
    await retried;
    releaseOtherPage();
    await Promise.all([waitForLive(host), waitForLive(guest)]);
  } finally {
    releaseOtherPage();
    await context.close();
  }
});
