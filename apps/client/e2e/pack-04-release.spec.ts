import { expect, test } from '@playwright/test';

for (const interrupt of [false, true]) {
  test('Pack 04 online match at 8 Mbps ' + (interrupt ? 'with artwork retry' : 'from a cold cache'), async ({ browser, baseURL }) => {
    test.setTimeout(120_000);
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();
    try {
      const host = await hostContext.newPage();
      const guest = await guestContext.newPage();
      const errors: string[] = [];
      for (const [context, page] of [[hostContext, host], [guestContext, guest]] as const) {
        const session = await context.newCDPSession(page);
        await session.send('Network.enable');
        await session.send('Network.emulateNetworkConditions', {
          offline: false, latency: 80, downloadThroughput: 1_000_000, uploadThroughput: 1_000_000,
        });
      }
      const started = Date.now();
      const atlases = [new Set<number>(), new Set<number>()];
      for (const [index, page] of [host, guest].entries()) {
        page.on('pageerror', error => errors.push(error.message));
        page.on('response', response => {
          if (new URL(response.url()).pathname === '/fighter-art-pack-04-v1/production/manifest.json') {
            atlases[index].add(response.status());
          }
        });
      }
      await host.goto(baseURL!);
      await host.locator('#splash-screen').click();
      await host.locator('#online-play-btn').click();
      await host.locator('#create-btn').click();
      await host.waitForURL(/room=/);
      await guest.goto(host.url());
      await guest.locator('#splash-screen').click();
      await expect(host.locator('#player-list > div')).toHaveCount(2);
      const fighters = ['zane-corvo', 'velvet-reply'];
      let interruptedAt = 0;
      if (interrupt) {
        await guest.route(/\/fighter-art-pack-04-v1\/production\/atlas-zane-corvo-live-0\.webp(?:\?|$)/, async route => {
          if (interruptedAt) return route.continue();
          interruptedAt = Date.now();
          await route.abort('connectionreset');
        });
      }
      for (const page of [host, guest]) await page.locator('#ready-btn').click();
      for (const [index, page] of [host, guest].entries()) {
        await page.locator('.network-fighter-option[data-id="' + fighters[index] + '"]').click();
        await page.locator('#network-charselect-confirm-btn').click();
      }
      let stageStarted = Date.now();
      await host.locator('[data-stage-idx="0"]').click();
      if (interrupt) {
        await expect(guest.locator('#network-charselect-error')).toHaveText(/Fighter artwork could not load/, { timeout: 30000 });
        expect(interruptedAt).toBeGreaterThan(0);
        console.log('Artwork alert after abort (ms):', Date.now() - interruptedAt);
        for (const page of [host, guest]) {
          expect(await page.evaluate(() => window.__smashDebug?.getSnapshot()?.matchPhase)).not.toBe('match');
        }
        await guest.locator('#online-change-fighter').click();
        await guest.locator('.network-fighter-option[data-id="velvet-reply"]').click();
        await guest.locator('#network-charselect-confirm-btn').click();
        stageStarted = Date.now();
        await host.locator('[data-stage-idx="0"]').click();
      }
      for (const [index, page] of [host, guest].entries()) {
        await expect.poll(() => page.evaluate(() => {
          const state = window.__smashDebug?.getSnapshot();
          return state?.matchPhase === 'match'
            ? Object.values(state.players).map(player => player.characterId).sort()
            : [];
        }), { timeout: 75000 }).toEqual([...fighters].sort());
        expect(atlases[index].has(200)).toBe(true);
      }
      console.log('Cold navigation to live (ms):', Date.now() - started, 'stage selection to live (ms):', Date.now() - stageStarted);
      expect(errors).toEqual([]);
    } finally {
      await Promise.all([hostContext.close(), guestContext.close()]);
    }
  });

}

for (const fighter of ['zane-corvo', 'velvet-reply']) {
  test('Pack 04 selects ' + fighter + ' in a local match', async ({ page }) => {
    const atlas = page.waitForResponse(response =>
      new URL(response.url()).pathname === '/fighter-art-pack-04-v1/production/manifest.json' && response.ok());
    await page.goto('/');
    await page.locator('#splash-screen').click();
    await page.locator('#local-play-btn').click();
    await page.locator('#lps-start-btn').click();
    await page.locator('.fighter-option[data-id="' + fighter + '"]').click();
    await page.locator('[data-ready-slot="0"]').click();
    await page.locator('[data-stage-idx="0"]').click();
    await atlas;
    await expect.poll(() => page.evaluate(() => {
      const state = window.__smashDebug?.getSnapshot();
      return state?.matchPhase === 'match'
        ? Object.values(state.players).find(player => player.slotIndex === 0)?.characterId
        : undefined;
    })).toBe(fighter);
  });
}
