import { expect, test, type Page } from '@playwright/test';

async function openHome(page: Page): Promise<void> {
  await page.goto('/');
  await page.locator('#splash-screen').click();
  await expect(page.locator('.home-menu')).toBeVisible();
}

test('keyboard arrows and Settings Back preserve Home focus', async ({ page }) => {
  await openHome(page);
  const online = page.locator('#online-play-btn');
  await online.focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#practice-btn')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#controls-btn')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeFocused();
  await page.locator('[data-settings-tab="sound"]').click();
  await expect(page.locator('.sound-settings h1')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#controls-btn')).toBeFocused();

  await online.press('Enter');
  await expect(page.locator('#create-btn')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(online).toBeFocused();
});

test('World Select focuses keyboard previews and announces unfocused previews', async ({ page }) => {
  await openHome(page);
  await page.locator('#local-play-btn').click();
  await page.locator('#lps-start-btn').click();
  await page.locator('[data-ready-slot="0"]').click();

  const neighborhood = page.locator('[data-stage-idx="0"]');
  const cathedral = page.locator('[data-stage-idx="1"]');
  const status = page.locator('#stage-preview-status');
  await expect(neighborhood).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(cathedral).toBeFocused();
  await expect(cathedral).toHaveAttribute('data-previewed', '');
  await expect(status).toBeEmpty();

  await page.locator('.world-random-choice').hover();
  await expect(cathedral).toBeFocused();
  await expect(status).toHaveText('Preview: Random world');
  await neighborhood.hover();
  await expect(status).toHaveText('Preview: The Neighborhood That Ate Itself');
  await expect(status).toHaveAttribute('role', 'status');

  await page.keyboard.press('Escape');
  await expect(page.locator('[data-ready-slot="0"]')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#lps-start-btn')).toBeFocused();
  await page.locator('#lps-back-btn').click();
  await expect(page.locator('#local-play-btn')).toBeFocused();
});

test('Dojo pause focuses Resume and restores the Visual Accessibility opener', async ({ page }) => {
  await openHome(page);
  await page.locator('#practice-btn').click();
  await page.locator('#practice-free').click();
  await page.waitForFunction(() => window.__smashDebug?.getSnapshot()?.matchPhase === 'match');
  await page.keyboard.press('Escape');
  await expect(page.locator('#resume-btn')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('tab', { name: 'Session' })).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('tab', { name: 'Settings', selected: false })).toBeFocused();
  await expect(page.getByRole('tabpanel', { name: 'Session' })).toBeVisible();
  await expect(page.locator('#dojo-pane-3')).toBeHidden();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('tab', { name: 'Settings', selected: true })).toBeFocused();
  await expect(page.getByRole('tabpanel', { name: 'Settings' })).toBeVisible();

  const opener = page.locator('#visual-settings-btn');
  await opener.press('Enter');
  await expect(page.locator('.visual-settings h1')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(opener).toBeFocused();
  await expect(page.getByRole('tab', { name: 'Settings', selected: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.dojo-console')).toHaveCount(0);
});

test('Dojo pause browses with the D-pad and opens a tab only on Confirm', async ({ page }) => {
  await page.addInitScript(() => {
    const pad = window as Window & { dojoPad?: number[] };
    pad.dojoPad = [];
    Object.defineProperty(navigator, 'getGamepads', {
      value: () => [{
        id: 'Xbox 360 Controller fixture', index: 0, mapping: 'standard', connected: true,
        timestamp: 0, axes: [0, 0, 0, 0],
        buttons: Array.from({ length: 17 }, (_, i) => {
          const pressed = pad.dojoPad!.includes(i);
          return { pressed, touched: pressed, value: pressed ? 1 : 0 };
        }),
      }],
    });
  });
  const press = (buttons: number[]) => page.evaluate(buttons => {
    (window as Window & { dojoPad?: number[] }).dojoPad = buttons;
  }, buttons);
  await openHome(page);
  await page.locator('#practice-btn').click();
  await page.locator('#practice-free').click();
  await page.waitForFunction(() => window.__smashDebug?.getSnapshot()?.matchPhase === 'match');
  await page.keyboard.press('Escape');

  const session = page.getByRole('tab', { name: 'Session', selected: true });
  await press([13]);
  await expect(session).toHaveClass(/menu-selected/);
  await press([15]);
  const timing = page.getByRole('tab', { name: 'Timing & Display' });
  await expect(timing).toBeFocused();
  await expect(timing).toHaveAttribute('aria-selected', 'false');
  await expect(page.getByRole('tabpanel', { name: 'Session' })).toBeVisible();
  await press([1]);
  await expect(timing).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel', { name: 'Timing & Display' })).toBeVisible();
  await press([]);

  await page.getByRole('tab', { name: 'Recordings' }).click();
  await expect(page.getByRole('tab', { name: 'Recordings', selected: true })).toBeVisible();
  const recordings = page.getByRole('tabpanel', { name: 'Recordings' });
  await expect(recordings).toBeVisible();
  await expect(recordings.getByRole('heading', { name: 'Recordings' })).toBeFocused();
});

test('online lobby focus returns to Online Play after leaving', async ({ page }) => {
  await openHome(page);
  await page.locator('#online-play-btn').click();
  await page.locator('#create-btn').press('Enter');
  await expect(page.locator('#copy-btn')).toBeFocused();
  const ready = page.locator('#ready-btn');
  await ready.press('Enter');
  await expect(page.locator('#room-ready-status')).toHaveText('Waiting for other players.');
  await expect(ready).toBeFocused();
  await expect(ready).toHaveAttribute('aria-disabled', 'true');
  await page.locator('#leave-room-btn').press('Enter');
  await expect(page.locator('#online-play-btn')).toBeFocused();
});

test('compact layout keeps Home and Random World focus outlines clear', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 360 });
  await openHome(page);

  const accessibility = page.locator('#visual-settings-btn');
  await accessibility.focus();
  const hint = page.locator('.home-menu .menu-hint');
  await expect(hint).toHaveCSS('position', 'static');
  const accessibilityBox = (await accessibility.boundingBox())!;
  const hintBox = (await hint.boundingBox())!;
  expect(hintBox.y).toBeGreaterThanOrEqual(accessibilityBox.y + accessibilityBox.height + 4);

  await page.locator('#local-play-btn').click();
  await page.locator('#lps-start-btn').click();
  await page.locator('[data-ready-slot="0"]').press('Enter');
  await expect(page.locator('[data-stage-idx="0"]')).toBeFocused();
  await page.mouse.move(1, 1);
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[data-stage-idx="3"]')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  const random = page.locator('.world-random-choice');
  await expect(random).toBeFocused();
  const clearance = await random.evaluate(button => {
    const panel = button.closest('.world-selection')!;
    const bottom = panel.getBoundingClientRect().top + panel.clientTop + panel.clientHeight;
    return bottom - button.getBoundingClientRect().bottom;
  });
  expect(clearance).toBeGreaterThanOrEqual(4);
});

test('short Dojo library keeps its footer below Free Practice and lessons', async ({ page }) => {
  await page.setViewportSize({ width: 740, height: 560 });
  await openHome(page);
  await page.locator('#practice-btn').click();
  const library = page.locator('.dojo-library');
  await expect(library).toBeVisible();
  for (const viewport of [{ width: 740, height: 560 }, { width: 640, height: 360 }, { width: 1024, height: 400 }]) {
    await page.setViewportSize(viewport);
    for (const forcedColors of ['none', 'active'] as const) {
      await page.emulateMedia({ forcedColors });
      for (const mode of ['free', 'lessons'] as const) {
        await page.locator('#dojo-mode-' + mode).click();
        const pane = page.locator('#dojo-' + mode + '-pane');
        await expect(pane).toBeVisible();
        const gap = await library.evaluate(root => {
          const panes = Array.from(root.querySelectorAll('.dojo-library-body > section:not([hidden])'));
          const paneBottom = Math.max(...panes.map(pane => pane.getBoundingClientRect().bottom));
          return root.querySelector('footer')!.getBoundingClientRect().top - paneBottom;
        });
        expect(gap, `${viewport.width}×${viewport.height} ${forcedColors} ${mode}`).toBeGreaterThanOrEqual(0);
        const action = page.locator(mode === 'free' ? '#practice-free' : '#dojo-start-lesson');
        await action.scrollIntoViewIfNeeded();
        await action.click({ trial: true });
        expect(await library.evaluate(root => root.scrollWidth - root.clientWidth)).toBeLessThanOrEqual(1);
      }
    }
  }
});
