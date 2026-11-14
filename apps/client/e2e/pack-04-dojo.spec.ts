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

for (const fighter of ['zane-corvo', 'velvet-reply']) {
  for (const realtime of [false, true]) test(fighter + ' synchronizes paired throw release art ' + (realtime ? 'at 1x' : 'frame by frame'), async ({ page }) => {
    const partner = fighter === 'zane-corvo' ? 'velvet-reply' : 'zane-corvo';
    await page.addInitScript(([fighter, dummy]) => localStorage.setItem('eth:dojo:setup:v1',
      JSON.stringify({fighter, dummy, dummyMode: 'still'})), [fighter, partner]);
    await page.goto(process.env.PACK04_TEST_URL ?? '/');
    await page.locator('#splash-screen').click();
    await page.locator('#practice-btn').click();
    await page.locator('#practice-free').click();
    await expect.poll(() => page.evaluate(() => window.__smashDebug?.getArtState?.()?.players.length)).toBe(2);
    await page.getByText('Launch and KO lab', { exact: true }).click();
    for (let i = 0; i < 4; i++) await page.locator('#dojo-launch-percent-partner').click();
    const atlas = await (await page.request.get(new URL('/fighter-art-pack-04-v1/manifest.json', page.url()).href)).json();
    const tumble = atlas.characters[partner].clips.tumble.frames[0].rect.join(',');
    await page.keyboard.press('F6');
    for (const facing of [1, -1]) for (const [move, key] of [
      ['FORWARD_THROW', facing === 1 ? 'ArrowRight' : 'ArrowLeft'],
      ['BACK_THROW', facing === 1 ? 'ArrowLeft' : 'ArrowRight'],
      ['UP_THROW', 'ArrowUp'], ['DOWN_THROW', 'ArrowDown'],
    ] as const) {
      await page.keyboard.press('r');
      await page.keyboard.press('F7');
      await page.evaluate(facing => {
        const debug = window.__smashDebug!;
        const players = Object.values(debug.getSnapshot()!.players);
        for (const p of players) {
          const direction = p.slotIndex === 0 ? facing : -facing;
          p.x = p.slotIndex === 0 ? 600 : 600 + 31 * facing;
          p.facing = direction as 1 | -1;
          p.isInvincible = false;
          p.invincibilityFrames = 0;
        }
      }, facing);
      await page.keyboard.down('c');
      await page.keyboard.press('F7');
      await page.keyboard.up('c');
      const art = () => page.evaluate(() => window.__smashDebug!.getArtState!().players);
      for (let i = 0; i < 12 && (await art()).find(p => p.slot === 0)?.clip !== 'grab_hold'; i++) {
        await page.keyboard.press('F7');
      }
      expect((await art()).find(p => p.slot === 1)?.clip).toBe('grabbed');
      await page.keyboard.down(key);
      await page.keyboard.press('F7');
      await page.keyboard.up(key);
      if (realtime) {
        const playback = page.waitForFunction(clip => {
          const players = window.__smashDebug?.getArtState?.()?.players;
          return players?.some(p => p.slot === 0 && p.clip === clip && p.bodyVisible) &&
            players.some(p => p.slot === 1 && p.clip === 'throw_victim' && p.bodyVisible);
        }, move.toLowerCase(), { timeout: 3000 });
        await page.keyboard.press('F6');
        await playback;
        await page.keyboard.press('F6');
        continue;
      }
      let released = false;
      for (let i = 0; i < 24; i++) {
        await page.keyboard.press('F7');
        const frames = await art();
        if (frames.find(p => p.slot === 1)?.clip !== 'throw_victim') continue;
        expect(frames.find(p => p.slot === 0)?.clip).toBe(move.toLowerCase());
        expect(frames.every(p => p.bodyVisible)).toBe(true);
        released = true;
        break;
      }
      expect(released, move + ' facing ' + facing).toBe(true);
      let reachedTumblePose = false;
      for (let tick = 0; tick < 30; tick++) {
        await page.keyboard.press('F7');
        const victim = (await art()).find(p => p.slot === 1);
        expect(victim?.bodyVisible).toBe(true);
        if (move === "DOWN_THROW" && victim?.clip !== "throw_victim") {
          expect(victim?.clip).toMatch(/^(hit_.*|knockdown_.*|prone_.*|idle|air_fall_loop|tumble|reaction)$/);
          reachedTumblePose = true;
          break;
        }
        if (victim?.frameRect !== tumble) continue;
        expect(['throw_victim', 'tumble']).toContain(victim.clip);
        reachedTumblePose = true;
        break;
      }
      expect(reachedTumblePose, move + ' facing ' + facing).toBe(true);
    }
  });
}

test('Pack 04 ledge art meets both platform edges', async ({ page }) => {
  await page.goto(process.env.PACK04_TEST_URL ?? '/');
  await page.evaluate(async () => {
    const path = '/src/renderer/fullbody/FullBodyPilot.ts';
    const { FullBodyPilot, preloadFullBodyPilot } = await import(path);
    for (const id of ['zane-corvo', 'velvet-reply']) {
      const assets = await preloadFullBodyPilot(true, [id], false, true);
      for (const edge of ['left', 'right']) {
        const facing = edge === 'left' ? 1 : -1;
        const pilot = new FullBodyPilot(assets, id, id);
        const contact = { dx: 12 * facing, dy: -25 };
        const draw = (state: string, tick: number) => pilot.update(
          state, tick, null, true, 0, true, false, 1, 0, false, 1, facing,
          undefined, edge, { ledgeContact: contact },
        );
        for (const [tick, name] of [[0, 'ledge_catch'], [6, 'ledge_catch'], [20, 'ledge_hang']] as const) {
          draw('LEDGE_HANG', tick);
          if (pilot.sprite.label !== name || !pilot.sprite.visible) throw Error(id + ' ' + name);
          const [x, y] = assets.characters[id][name].frames[0].sockets.ledgeGrip;
          const point = pilot.sprite.toGlobal({ x, y });
          if (Math.abs(point.x * facing - contact.dx) > 0.001 || Math.abs(point.y - contact.dy) > 0.001) {
            throw Error(id + ' ' + edge + ' ' + name + ' grip offset');
          }
        }
        draw('LEDGE_CLIMB', 28);
        const sole = pilot.sprite.toGlobal({ x: pilot.sprite.pivot.x, y: pilot.sprite.pivot.y });
        if (pilot.sprite.label !== 'ledge_climb' || Math.abs(sole.y - contact.dy) > 0.001) {
          throw Error(id + ' ' + edge + ' climb sole offset');
        }
        for (const [state, clip] of [['AIRBORNE', 'ledge_drop'], ['LEDGE_TRUMP', 'ledge_trump']]) {
          draw('LEDGE_HANG', 20);
          const correction = { x: pilot.sprite.x, y: pilot.sprite.y };
          for (let tick = 0; tick <= 6; tick++) {
            pilot.update(state, tick, null, true, 0, true, false, 1, 0, false, 1, facing);
            const weight = 1 - tick / 6;
            if (!pilot.sprite.visible || pilot.sprite.label !== clip ||
                Math.abs(pilot.sprite.x - correction.x * weight) > 0.001 ||
                Math.abs(pilot.sprite.y - correction.y * weight) > 0.001) {
              throw Error(id + ' ' + edge + ' ' + clip + ' release tick ' + tick);
            }
          }
        }
        pilot.sprite.destroy();
        pilot.effectSprite.destroy();
      }
    }
  });
});

for (const fighter of ['zane-corvo', 'velvet-reply']) {
  test(fighter + ' uses live Dojo ledge options at both edges', async ({ page }) => {
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
    for (const edge of ['left', 'right']) {
      for (const [key, clip] of [
        [edge === 'left' ? 'ArrowRight' : 'ArrowLeft', 'ledge_climb'],
        ['KeyX', 'ledge_jump'], ['KeyZ', 'ledge_attack'], ['ShiftLeft', 'ledge_roll'],
        ['ArrowDown', 'ledge_drop'], ['trump', 'ledge_trump'],
      ]) {
        await page.keyboard.press('r');
        const position = await page.evaluate(async ({ id, edge }) => {
          const debug = window.__smashDebug!;
          const pkg = '@smash/shared';
          const { getStageLayout } = await import('/@id/' + pkg);
          const snapshot = debug.getSnapshot();
          const player = Object.values(snapshot.players).find(p => p.characterId === id)!;
          const lip = getStageLayout(snapshot.stageId).ledges.find((ledge: {id: string}) => ledge.id === edge);
          return debug.forcePosition(player.id, lip.x + (edge === 'left' ? -5 : 5), lip.y + 33);
        }, { id: fighter, edge });
        expect(position).toBe(true);
        await expect.poll(async () => (await sample()).art?.clip, { intervals: [16] }).toBe('ledge_hang');
        expect((await sample()).player?.ledgeId).toBe(edge);
        if (clip === 'ledge_drop' || clip === 'ledge_trump') {
          await page.keyboard.press('F6');
          const frames = [await sample()];
          if (key === 'trump') {
          await page.evaluate(() => {
            const debug = window.__smashDebug!;
            const players = Object.values(debug.getSnapshot().players);
            const holder = players.find(player => player.slotIndex === 0)!;
            const challenger = players.find(player => player.slotIndex === 1)!;
            debug.forcePosition(challenger.id, holder.x, holder.y);
          });

          } else {
            await page.keyboard.down(key);
          }
          await page.keyboard.press('F7');
          if (key !== 'trump') await page.keyboard.up(key);
          frames.push(await sample());
          for (let tick = 1; tick <= 50; tick++) {
            await page.keyboard.press('F7');
            frames.push(await sample());
            if (frames.at(-1)?.art?.clip.startsWith('air_fall') && frames.some(frame => frame.art?.clip === clip)) break;
          }
          const release = frames.findIndex(frame => frame.art?.clip === clip);
          expect(release).toBeGreaterThan(0);
          expect(frames[release].player?.stateFrame).toBeLessThanOrEqual(1);
          expect(frames.at(-1)?.art?.clip).toMatch(/^air_fall/);
          const anchors = frames.slice(release - 1).map(({ player, art }) => {
            expect(art?.bodyVisible).toBe(true);
            return { x: art!.bodyX - player!.x, y: art!.bodyY - player!.y };
          });
          for (let tick = 0; tick < anchors.length; tick++) {
            const weight = Math.max(0, 1 - Math.max(0, tick - 1) / 6);
            expect(anchors[tick].x).toBeCloseTo(anchors[0].x * weight, 3);
            expect(anchors[tick].y).toBeCloseTo(anchors[0].y * weight, 3);
          }
          await test.info().attach(fighter + '-' + edge + '-' + clip, {
            body: JSON.stringify(frames, null, 2),
            contentType: 'application/json',
          });
          await page.keyboard.press('F6');
          continue;
        }
        await page.keyboard.down(key);
        try {
          await expect.poll(async () => (await sample()).art, { intervals: [16] })
            .toMatchObject({ clip, bodyVisible: true });
        } finally {
          await page.keyboard.up(key);
        }
        if (clip !== 'ledge_drop') await expect.poll(async () => (await sample()).player?.isGrounded).toBe(true);
      }
    }
  });
}

test('Pack 04 up-special recovery clips in the Dojo', async ({ page }) => {
  test.setTimeout(60_000);
  for (const fighter of ['zane-corvo', 'velvet-reply']) {
    await page.addInitScript(id => localStorage.setItem('eth:dojo:setup:v1', JSON.stringify({
      fighter: id, dummy: 'all-rounder', dummyMode: 'still',
    })), fighter);
    await page.goto(process.env.PACK04_TEST_URL ?? '/');
    await page.locator('#splash-screen').click();
    await page.locator('#practice-btn').click();
    await page.locator('#practice-free').click();
    const read = () => page.evaluate(() => {
      const debug = window.__smashDebug;
      const player = Object.values(debug?.getSnapshot()?.players ?? {}).find(p => p.slotIndex === 0);
      const art = debug?.getArtState?.()?.players.find(p => p.slot === 0);
      return { hitlag: player?.hitlagFramesRemaining ?? 0, state: player?.state, frame: player?.stateFrame, facing: player?.facing, grounded: player?.isGrounded, clip: art?.clip, visible: art?.bodyVisible, fighter: art?.character };
    });
    await expect.poll(read).toMatchObject({ grounded: true, fighter });
    await page.keyboard.press('F6');
    for (const [facing, direction] of [[1, 'ArrowRight'], [-1, 'ArrowLeft']] as const) {
      for (const [airborne, hit] of [[false,false],[true,false],[false,true],[true,true]]) {
        await page.keyboard.press('r');
        await page.keyboard.press('F7');
        await page.keyboard.down(direction);
        await page.keyboard.press('F7');
        await page.keyboard.up(direction);
        if (airborne) {
          await page.keyboard.down('KeyX');
          for (let tick = 0; tick < 9; tick++) await page.keyboard.press('F7');
          await page.keyboard.up('KeyX');
        }
        expect(await read()).toMatchObject({ grounded: !airborne, facing });
        if (hit) await page.evaluate(() => {
          const debug = window.__smashDebug!;
          const players = Object.values(debug.getSnapshot().players);
          const player = players.find(p => p.slotIndex === 0)!;
          const dummy = players.find(p => p.slotIndex === 1)!;
          debug.forcePosition(dummy.id, player.x + 15 * player.facing, player.y - (player.isGrounded ? 20 : 45));
        });
        if (hit && !airborne) {
          await page.keyboard.down('ArrowUp');
          await page.keyboard.down('KeyS');
          await page.keyboard.press('F6');
          const playback = await page.evaluate(async () => {
            const debug = window.__smashDebug!;
            const frames = [];
            const end = performance.now() + 2000;
            while (performance.now() < end) {
              await new Promise(requestAnimationFrame);
              const player = Object.values(debug.getSnapshot().players).find(p => p.slotIndex === 0)!;
              const art = debug.getArtState!().players.find(p => p.slot === 0)!;
              frames.push({ state: player.state, hitlag: player.hitlagFramesRemaining ?? 0,
                facing: art.bodyFacing, clip: art.clip, visible: art.bodyVisible,
                anchorY: art.bodyY - player.y, frameRect: art.frameRect });
              if (frames.some(frame => frame.state === 'HELPLESS_LAND') && player.state === 'IDLE') break;
            }
            return frames;
          });
          await page.keyboard.up('KeyS');
          await page.keyboard.up('ArrowUp');
          await page.keyboard.press('F6');
          expect(playback.some(frame => frame.clip === 'up_special' && frame.hitlag > 0)).toBe(true);
          expect(playback.some(frame => frame.clip.startsWith('helpless_') && frame.state === 'HELPLESS')).toBe(true);
          expect(playback.some(frame => frame.clip === 'helpless_land')).toBe(true);
          expect(playback.at(-1)?.state).toBe('IDLE');
          expect(playback.every(frame => frame.visible && frame.facing === facing)).toBe(true);
          await test.info().attach(fighter + '-recovery-' + facing, {
            body: JSON.stringify(playback, null, 2), contentType: 'application/json',
          });
          continue;
        }
    await page.keyboard.down('ArrowUp');
    await page.keyboard.down('KeyS');
    await page.keyboard.press('F7');
    await page.keyboard.up('KeyS');
    await page.keyboard.up('ArrowUp');
    let contact = false;
    const seen = new Map<string, string>();
    for (let tick = 0; tick < 110; tick++) {
      const frame = await read();
      expect(frame.visible, JSON.stringify(frame)).toBe(true);
      contact ||= frame.hitlag > 0;
      seen.set(frame.state!, frame.clip!);
      if (frame.grounded && seen.has('HELPLESS')) break;
      await page.keyboard.press('F7');
    }
    expect(contact, JSON.stringify({fighter,facing,airborne,hit})).toBe(hit);
    expect(seen.has('HELPLESS')).toBe(true);
    expect((await read()).grounded).toBe(true);
    expect(seen.get('AIR_ATTACK')).toBe('up_special');
    expect(seen.get('HELPLESS')).toMatch(/^helpless_(enter|loop)$/);
    expect(await read()).toMatchObject({clip: 'helpless_land'});
    expect((await read()).frame).toBeLessThanOrEqual(1);
      }
    }
  }
});
