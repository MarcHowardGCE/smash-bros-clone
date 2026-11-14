import { expect, test } from '@playwright/test';

for (const fighter of ['zane-corvo', 'velvet-reply']) {
  test(fighter + ' loads and turns against All-Rounder in the Dojo', async ({ page }, testInfo) => {
    test.setTimeout(60_000);
    await page.addInitScript(id => {
      localStorage.setItem('eth:dojo:setup:v1', JSON.stringify({
        fighter: id, dummy: 'all-rounder', dummyMode: 'still',
      }));
    }, fighter);
    await page.goto(process.env.PACK04_TEST_URL ?? '/');
    await page.locator('#splash-screen').click();
    await page.locator('#practice-btn').click();
    await expect(page.locator('#dojo-fighter')).toContainText(fighter === 'zane-corvo' ? 'Zane Corvo' : 'The Velvet Reply');
    await page.locator('#practice-free').click();
    await page.waitForFunction(() => window.__smashDebug?.getSnapshot()?.matchPhase === 'match');
    const manifest = await (await page.request.get(new URL('/fighter-art-pack-04-v1/manifest.json', page.url()).href)).json();
    const clips = manifest.characters[fighter].clips;
    for (const [key, facing] of [['ArrowLeft', -1], ['ArrowRight', 1]] as const) {
      await page.keyboard.down(key);
      try {
        await expect.poll(() => page.evaluate(id => {
          const debug = window.__smashDebug;
          const art = debug?.getArtState?.()?.players;
          if (!art?.some(player => player.character === id && player.bodyVisible) ||
              !art.some(player => player.character === 'all-rounder')) return null;
          return Object.values(debug?.getSnapshot()?.players ?? {}).find(player => player.characterId === id)?.facing;
        }, fighter)).toBe(facing);
      } finally {
        await page.keyboard.up(key);
      }
      await page.screenshot({ path: testInfo.outputPath(facing < 0 ? 'left.png' : 'right.png') });
      await page.keyboard.press('F6');
      await page.keyboard.down('z');
      const contacts = new Map<string, Set<number>>();
      const queued = new Set<string>();
      for (let i = 0; i < 90; i++) {
        await page.keyboard.press('F7');
        if (i === 0) await page.keyboard.up('z');
        const sample = await page.evaluate(id => ({
          player: Object.values(window.__smashDebug?.getSnapshot()?.players ?? {})
            .find(player => player.characterId === id),
          art: window.__smashDebug?.getArtState?.()?.players.find(player => player.character === id),
        }), fighter);
        const move = sample.player?.currentMoveId;
        if (!move) break;
        expect(['JAB', 'JAB_2', 'JAB_3']).toContain(move);
        const clip = move.toLowerCase();
        const age = sample.player!.stateFrame;
        const startup = move === 'JAB_3' ? 4 : 3;
        const end = move === 'JAB_3' ? 7 : 5;
        expect(sample.player?.facing).toBe(facing);
        expect(sample.art?.clip).toBe(clip);
        const rear = move === 'DOWN_SMASH' && age >= startup + 3 && age < end;
          const index = age < startup ? 0 : age >= end ? clips[clip].frames.length - 1 : rear ? 2 : 1;
          expect(sample.art?.frameRect).toBe(clips[clip].frames[index].rect.join(','));
          expect(sample.art?.bodyFacing).toBe(rear ? -facing : facing);
        if (age >= startup && age < end) {
          const ages = contacts.get(move) ?? new Set<number>();
          ages.add(age);
          contacts.set(move, ages);
        }
        if (move !== 'JAB_3' && age >= 2 && !queued.has(move)) {
          queued.add(move);
          await page.keyboard.down('z');
        } else {
          await page.keyboard.up('z');
        }
        if (move === 'JAB_3' && age >= end) break;
      }
      expect([...contacts.entries()].map(([move, ages]) => [move, [...ages]])).toEqual([
        ['JAB', [3, 4]], ['JAB_2', [3, 4]], ['JAB_3', [4, 5, 6]],
      ]);
      await page.keyboard.press('F6');
      await page.waitForFunction(id => Object.values(window.__smashDebug?.getSnapshot()?.players ?? {}).some(player => player.characterId === id && player.state === 'IDLE'), fighter);
      for (const [direction, move, startup, active] of [
        [key, 'FORWARD_TILT', fighter === 'zane-corvo' ? 6 : 9, 3],
        ['ArrowUp', 'UP_TILT', 6, 4],
        ['ArrowDown', 'DOWN_TILT', 5, 2],
        [key, 'DASH_ATTACK', 8, 5],
        [key, 'FORWARD_SMASH', 15, 3],
        ['ArrowUp', 'UP_SMASH', 12, 5],
        ['ArrowDown', 'DOWN_SMASH', 10, 6],
      ] as const) {
        await page.keyboard.press('F6');
        await page.keyboard.down(direction);
        const smash = move.endsWith('_SMASH');
        if (smash) await page.keyboard.down('Shift');
        if (move === 'DASH_ATTACK') {
          for (let tick = 0; tick < 6; tick++) await page.keyboard.press('F7');
        }
        await page.keyboard.down('z');
        await page.keyboard.press('F7');
        await page.keyboard.up('z');
        await page.keyboard.up(direction);
        if (smash) await page.keyboard.up('Shift');
        const clip = move.toLowerCase();
        const contacts = new Set<number>();
        for (let i = 0; i < 45; i++) {
          const sample = await page.evaluate(id => ({
            player: Object.values(window.__smashDebug?.getSnapshot()?.players ?? {})
              .find(player => player.characterId === id),
            art: window.__smashDebug?.getArtState?.()?.players.find(player => player.character === id),
          }), fighter);
          expect(sample.player?.currentMoveId).toBe(move);
          expect(sample.player?.facing).toBe(facing);
          const age = sample.player!.stateFrame;
          const end = startup + active;
          expect(sample.art?.clip).toBe(clip);
          const rear = move === 'DOWN_SMASH' && age >= startup + 3 && age < end;
          const index = age < startup ? 0 : age >= end ? clips[clip].frames.length - 1 : rear ? 2 : 1;
          expect(sample.art?.frameRect).toBe(clips[clip].frames[index].rect.join(','));
          expect(sample.art?.bodyFacing).toBe(rear ? -facing : facing);
          if (age >= end) break;
          if (age >= startup) contacts.add(age);
          await page.keyboard.press('F7');
        }
        expect([...contacts]).toEqual(Array.from({ length: active }, (_, i) => startup + i));
        await page.keyboard.press('F6');
        await page.waitForFunction(id => Object.values(window.__smashDebug?.getSnapshot()?.players ?? {}).some(player => player.characterId === id && player.state === 'IDLE'), fighter);
      }
      for (const [move, direction, startup, active] of [
        ['NEUTRAL_AIR', null, 5, 6],
        ['FORWARD_AIR', key, fighter === 'velvet-reply' ? 10 : 8, 4],
        ['BACK_AIR', facing === 1 ? 'ArrowLeft' : 'ArrowRight', 7, 3],
        ['UP_AIR', 'ArrowUp', 7, 5],
        ['DOWN_AIR', 'ArrowDown', 10, 2],
      ] as const) {
        await page.keyboard.press('F6');
        await page.keyboard.down('x');
        for (let tick = 0; tick < 6; tick++) await page.keyboard.press('F7');
        await page.keyboard.up('x');
        if (direction) await page.keyboard.down(direction);
        await page.keyboard.down('z');
        await page.keyboard.press('F7');
        await page.keyboard.up('z');
        if (direction) await page.keyboard.up(direction);
        const clip = move.toLowerCase();
        const contacts = new Set<number>();
        let landed = false;
        for (let tick = 0; tick < 90; tick++) {
          const { player, art } = await page.evaluate(id => ({
            player: Object.values(window.__smashDebug?.getSnapshot()?.players ?? {})
              .find(player => player.characterId === id),
            art: window.__smashDebug?.getArtState?.()?.players.find(player => player.character === id),
          }), fighter);
          expect(art?.bodyVisible).toBe(true);
          if (player?.isGrounded) {
            expect(art?.clip).not.toBe(clip);
            if (player.state === "LANDING_LAG") expect(art?.clip).toBe("land_soft");
            landed = true;
            break;
          }
          if (player?.currentMoveId === move) {
            const age = player.stateFrame;
            expect(player.facing, move + " age " + age).toBe(facing);
            expect(art?.clip).toBe(clip);
            const index = age < startup ? 0 : age < startup + active ? 1 : 2;
            expect(art?.frameRect).toBe(clips[clip].frames[index].rect.join(','));
            if (index === 1) contacts.add(age);
          }
          await page.keyboard.press('F7');
        }
        expect([...contacts], move).toEqual(Array.from({ length: active }, (_, i) => startup + i));
        expect(landed).toBe(true);
        await page.keyboard.press('F6');
        await page.waitForFunction(id => Object.values(window.__smashDebug?.getSnapshot()?.players ?? {}).some(player => player.characterId === id && player.state === 'IDLE'), fighter);
      }
    }
  });
}

for (const fighter of ['zane-corvo', 'velvet-reply']) {
  test(fighter + ' uses its landing art during real-time aerial playback', async ({ page }) => {
    await page.addInitScript(id => localStorage.setItem('eth:dojo:setup:v1', JSON.stringify({
      fighter: id, dummy: 'all-rounder', dummyMode: 'still',
    })), fighter);
    await page.goto(process.env.PACK04_TEST_URL ?? '/');
    await page.locator('#splash-screen').click();
    await page.locator('#practice-btn').click();
    await page.locator('#practice-free').click();
    await page.waitForFunction(id => Object.values(window.__smashDebug?.getSnapshot()?.players ?? {})
      .some(p => p.characterId === id && p.isGrounded), fighter, { timeout: 5000 });
    await page.keyboard.press('F6');
    expect(await page.evaluate(id => {
      const debug = window.__smashDebug;
      const player = Object.values(debug?.getSnapshot()?.players ?? {}).find(p => p.characterId === id);
      return player && debug?.forcePosition?.(player.id, player.x - 65, player.y - 45);
    }, fighter)).toBe(true);
    await page.keyboard.press('F7');
    await page.keyboard.down('z');
    await page.keyboard.press('F7');
    await page.keyboard.up('z');
    await page.waitForFunction(id => Object.values(window.__smashDebug?.getSnapshot()?.players ?? {})
      .some(p => p.characterId === id && p.currentMoveId === 'NEUTRAL_AIR'), fighter, { timeout: 3000 });
    await page.keyboard.press('F6');
    await page.waitForFunction(id => {
      const debug = window.__smashDebug;
      const player = Object.values(debug?.getSnapshot()?.players ?? {}).find(p => p.characterId === id);
      const art = debug?.getArtState?.()?.players.find(p => p.character === id);
      return player?.state === 'LANDING_LAG' && art?.clip === 'land_soft' && art.bodyVisible;
    }, fighter, { timeout: 3000 });
    await page.waitForFunction(id => window.__smashDebug?.getArtState?.()?.players
      .some(p => p.character === id && p.clip === 'idle' && p.bodyVisible), fighter, { timeout: 3000 });
  });
}

for (const fighter of ['zane-corvo', 'velvet-reply']) {
  test(fighter + ' renders its air dodges and dodge landing', async ({ page }) => {
    test.setTimeout(90_000);
    await page.addInitScript(id => localStorage.setItem('eth:dojo:setup:v1', JSON.stringify({
      fighter: id, dummy: 'all-rounder', dummyMode: 'still',
    })), fighter);
    await page.goto(process.env.PACK04_TEST_URL ?? '/');
    await page.locator('#splash-screen').click();
    await page.locator('#practice-btn').click();
    await page.locator('#practice-free').click();
    const sample = () => page.evaluate(id => {
      const debug = window.__smashDebug;
      return {
        player: Object.values(debug?.getSnapshot()?.players ?? {}).find(p => p.characterId === id),
        art: debug?.getArtState?.()?.players.find(p => p.character === id),
      };
    }, fighter);
    await expect.poll(async () => (await sample()).player?.isGrounded).toBe(true);
    const grounded = (await sample()).player!;
    await page.keyboard.press('F6');
    for (const [toward, away, facing] of [
      ['ArrowLeft', 'ArrowRight', -1], ['ArrowRight', 'ArrowLeft', 1],
    ] as const) {
      for (const [suffix, keys] of [
        ['neutral', []], ['side', [toward]], ['back', [away]],
        ['up', ['ArrowUp']], ['down', ['ArrowDown']],
        ['up_diagonal', ['ArrowUp', toward]], ['up_back', ['ArrowUp', away]],
        ['down_diagonal', ['ArrowDown', toward]], ['down_back', ['ArrowDown', away]],
      ] as const) {
        await page.keyboard.press('r');
        await page.keyboard.press('F7');
        await page.keyboard.down(toward);
        await page.keyboard.press('F7');
        await page.keyboard.up(toward);
        expect((await sample()).player?.facing).toBe(facing);
        expect(await page.evaluate(({id, x, y}) => window.__smashDebug?.forcePosition?.(id, x, y),
          { id: grounded.id, x: grounded.x - 80, y: grounded.y - 75 })).toBe(true);
        await page.keyboard.press('F7');
        for (const key of keys) await page.keyboard.down(key);
        await page.keyboard.down('Shift');
        await page.keyboard.press('F7');
        await page.keyboard.up('Shift');
        for (const key of keys) await page.keyboard.up(key);
        const { player, art } = await sample();
        expect(player?.state, suffix).toBe('AIR_DODGE');
        expect(player?.facing, suffix).toBe(facing);
        expect(art?.clip).toBe('air_dodge_' + suffix);
        expect(art?.bodyVisible).toBe(true);
        if (suffix !== 'down') continue;
        await page.keyboard.press('F6');
        await expect.poll(async () => (await sample()).art?.clip, { intervals: [16] }).toBe('air_dodge_land');
        await page.keyboard.press('F6');
      }
    }
  });
}
