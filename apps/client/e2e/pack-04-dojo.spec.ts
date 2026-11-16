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
    const manifest = await (await page.request.get(new URL('/fighter-art-pack-04-v1/production/manifest.json', page.url()).href)).json();
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
          const index = move === 'JAB' ? Math.min(8, age) : age < startup - 1 ? 0 : age < startup ? 1 : age < end ? 2 : Math.min(5, 3 + age - end);
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
          const index = clips[clip].frames.length === 3 ? (age < startup ? 0 : age < end ? 1 : 2) : age >= end ? 3 : move === "DOWN_SMASH" ? (age < startup ? 0 : rear ? 2 : 1) : age < startup / 2 ? 0 : age < startup ? 1 : 2;
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
    const atlas = await (await page.request.get(new URL('/fighter-art-pack-04-v1/production/manifest.json', page.url()).href)).json();
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
          const displayed = assets.characters[id][name].frames.find(frame => frame.texture === pilot.sprite.texture);
          if (!displayed?.sockets?.ledgeGrip) throw Error(id + ' ' + name + ' missing grip');
          const [x, y] = displayed.sockets.ledgeGrip;
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

for (const fighter of ['zane-corvo', 'velvet-reply']) {
  test(fighter + ' presentation cues play in the Dojo', async ({ page }) => {
    await page.addInitScript(id => localStorage.setItem('eth:dojo:setup:v1', JSON.stringify({
      fighter: id, dummy: 'all-rounder', dummyMode: 'still',
    })), fighter);
    await page.goto(process.env.PACK04_TEST_URL ?? '/');
    await page.locator('#splash-screen').click();
    await page.locator('#practice-btn').click();
    await page.locator('#practice-free').click();
    const clip = () => page.evaluate(() => window.__smashDebug?.getArtState?.().players.find(p => p.slot === 0)?.clip);
    await expect.poll(clip).toBe('idle');
    for (const [key, kind] of [['Digit1', 'up'], ['Digit2', 'side'], ['Digit3', 'down']]) {
      await page.keyboard.press(key);
      await expect.poll(clip).toBe('taunt_' + kind);
      await expect.poll(clip).toBe('idle');
    }
    await page.locator('.dojo-launch summary').click();
    for (const kind of ['screen', 'star']) {
      await page.locator('#dojo-launch-preview-' + kind).click();
      await expect.poll(() => page.evaluate(kind => window.__smashDebug?.getArtState?.().ko?.some(k => k.clip === 'ko_' + kind), kind)).toBe(true);
    }
  });
}

for (const first of ['zane-corvo', 'velvet-reply']) {
  test(first + ' full local match presentation', async ({ page }) => {
    const lineup = first === 'zane-corvo' ? [first, 'velvet-reply'] : [first, 'zane-corvo'];
    await page.route('**/src/main.ts', async route => {
      const response = await route.fetch();
      const source = await response.text();
      const injected = source.replace('void prepareFighters(choices.map', 'choices = choices.map((choice, slot) => ({ ...choice, id: ' + JSON.stringify(lineup) + '[slot] })); void prepareFighters(choices.map');
      expect(injected).not.toBe(source);
      await route.fulfill({ response, body: injected });
    });
    await page.goto('/');
    await page.locator('#splash-screen').click();
    await page.locator('#local-play-btn').click();
    await page.locator('#lps-start-btn').click();
    await page.keyboard.press('Enter');
    await page.locator('[data-stage-idx="0"]').click();
    const arts = () => page.evaluate(() => window.__smashDebug?.getArtState?.().players ?? []);
    await expect.poll(async () => (await arts()).find(p => p.slot === 0), { timeout: 15000, intervals: [16] }).toMatchObject({ character: first, clip: 'entry', bodyVisible: true });
    const loseStock = (stocks: number) => page.evaluate(stocks => {
      const debug = window.__smashDebug!;
      const player = Object.values(debug.getSnapshot().players).find(p => p.slotIndex === 1)!;
      player.stocks = stocks;
      player.isInvincible = false;
      return debug.forcePosition(player.id, 9999, 9999);
    }, stocks);
    await page.waitForFunction(() => window.__smashDebug?.getSnapshot().matchPhase === 'match');
    expect(await loseStock(2)).toBe(true);
    const loserClip = async () => (await arts()).find(p => p.slot === 1)?.clip;
    await expect.poll(loserClip).toBe('respawn_wait');
    await expect.poll(loserClip, { intervals: [16] }).toBe('respawn_drop');
    await expect.poll(async () => ['respawn_wait', 'respawn_drop', undefined].includes(await loserClip())).toBe(false);
    expect(await loseStock(1)).toBe(true);
    await expect.poll(async () => (await arts()).find(p => p.slot === 0)?.clip).toBe('victory_1');
    await expect.poll(loserClip).toBe('defeat');
  });
}

for (const fighter of ['zane-corvo', 'velvet-reply']) {
  for (const winnerSlot of [1, 2]) {
    test(fighter + ' local alternate victory ' + (winnerSlot + 1), async ({ page }) => {
      const lineup = Array.from({ length: 3 }, (_, slot) => slot === winnerSlot ? fighter : 'all-rounder');
      await page.route('**/src/main.ts', async route => {
        const response = await route.fetch();
        const source = await response.text();
        const injected = source.replace('void prepareFighters(choices.map', 'choices = choices.map((choice, slot) => ({ ...choice, id: ' + JSON.stringify(lineup) + '[slot] })); void prepareFighters(choices.map');
        expect(injected).not.toBe(source);
        await route.fulfill({ response, body: injected });
      });
      await page.goto('/');
      await page.locator('#splash-screen').click();
      await page.locator('#local-play-btn').click();
      await page.locator('button[data-count="3"]').click();
      await page.locator('#lps-start-btn').click();
      await page.keyboard.press('Enter');
      await page.locator('[data-stage-idx="0"]').click();
      await page.waitForFunction(() => window.__smashDebug?.getSnapshot()?.matchPhase === 'match');
      const positioned = await page.evaluate(winnerSlot => {
        const debug = window.__smashDebug!;
        const players = Object.values(debug.getSnapshot().players);
        return players.filter(p => p.slotIndex !== winnerSlot).map(player => {
          player.stocks = 1;
          player.isInvincible = false;
          return debug.forcePosition(player.id, 9999, 9999);
        });
      }, winnerSlot);
      expect(positioned).toEqual([true, true]);
      await expect.poll(() => page.evaluate(slot => {
        const debug = window.__smashDebug!;
        const snapshot = debug.getSnapshot();
        const winner = snapshot.players[snapshot.winnerId!];
        const art = debug.getArtState?.().players.find(p => p.slot === slot);
        return { phase: snapshot.matchPhase, winner: winner?.slotIndex, art };
      }, winnerSlot)).toMatchObject({
        phase: 'result', winner: winnerSlot,
        art: { character: fighter, clip: 'victory_' + (winnerSlot + 1), bodyVisible: true },
      });
      await page.screenshot({ path: test.info().outputPath('alternate-victory.png') });
    });
  }
}

for (const fighter of ['zane-corvo', 'velvet-reply']) {
  test(fighter + ' Pack 04 specials and counter in both facings', async ({ page }) => {
    await page.addInitScript(id => localStorage.setItem('eth:dojo:setup:v1', JSON.stringify({
      fighter: id, dummy: 'all-rounder', dummyMode: 'still',
    })), fighter);
    await page.goto('/');
    await page.locator('#splash-screen').click();
    await page.locator('#practice-btn').click();
    await page.locator('#practice-free').click();
    const art = () => page.evaluate(() => window.__smashDebug?.getArtState?.().players.find(p => p.slot === 0));
    await expect.poll(art).toMatchObject({ character: fighter, clip: 'idle' });
    await page.keyboard.press('F6');
    for (const [facing, turn] of [[1, 'ArrowRight'], [-1, 'ArrowLeft']] as const) {
      for (const [name, direction] of [
        ['neutral_special', null], ['side_special', turn], ['down_special', 'ArrowDown'],
      ] as const) {
        await page.keyboard.press('r');
        await page.keyboard.press('F7');
        await page.keyboard.down(turn);
        await page.keyboard.press('F7');
        await page.keyboard.up(turn);
        if (direction) await page.keyboard.down(direction);
        await page.keyboard.down('KeyS');
        await page.keyboard.press('F7');
        await page.keyboard.up('KeyS');
        if (direction) await page.keyboard.up(direction);
        expect(await art()).toMatchObject({ clip: name, bodyFacing: facing, bodyVisible: true });
        if (name !== 'down_special') continue;
        await page.evaluate(facing => {
          const debug = window.__smashDebug!;
          const players = Object.values(debug.getSnapshot().players);
          const player = players.find(p => p.slotIndex === 0)!;
          const dummy = players.find(p => p.slotIndex === 1)!;
          debug.forcePosition(dummy.id, player.x + 25 * facing, player.y);
          Object.assign(debug.getSnapshot().players[dummy.id], {
            state: 'ATTACK', stateFrame: 2, currentMoveId: 'JAB', facing: -facing,
            isGrounded: true, isInvincible: false, invincibilityFrames: 0, hitPlayerIds: new Set(),
          });
        }, facing);
        for (let tick = 0; tick < 5 && (await art())?.clip !== 'counter_success'; tick++) {
          await page.keyboard.press('F7');
        }
        expect(await art()).toMatchObject({ clip: 'counter_success', bodyFacing: facing, bodyVisible: true });
      }
    }
  });
}

for (const fighter of ['zane-corvo', 'velvet-reply']) {
  test(fighter + ' full shield break in both facings', async ({ page }) => {
    await page.addInitScript(id => localStorage.setItem('eth:dojo:setup:v1', JSON.stringify({
      fighter: id, dummy: 'all-rounder', dummyMode: 'still',
    })), fighter);
    await page.goto('/');
    await page.locator('#splash-screen').click();
    await page.locator('#practice-btn').click();
    await page.locator('#practice-free').click();
    const art = () => page.evaluate(() => window.__smashDebug?.getArtState?.().players.find(p => p.slot === 0));
    await expect.poll(art).toMatchObject({ character: fighter, clip: 'idle' });
    await page.locator('.dojo-launch summary').click();
    for (const [facing, key] of [[1, 'ArrowRight'], [-1, 'ArrowLeft']] as const) {
      await page.keyboard.down(key);
      await expect.poll(art).toMatchObject({ bodyFacing: facing });
      await page.keyboard.up(key);
      await expect.poll(art).toMatchObject({ clip: 'idle' });
      await page.getByRole('button', { name: /preview shield break/i }).click();
      for (const clip of ['shield_break_launch','shield_break_dizzy','shield_break_recover','idle']) {
        await expect.poll(art, { intervals: [16] }).toMatchObject({ clip, bodyFacing: facing, bodyVisible: true });
      }
    }
  });
}

for (const attacker of ['zane-corvo', 'velvet-reply']) {
  test(attacker + ' paired footstool roles in the Dojo', async ({ page }) => {
    const victim = attacker === 'zane-corvo' ? 'velvet-reply' : 'zane-corvo';
    await page.addInitScript(([fighter, dummy]) => localStorage.setItem('eth:dojo:setup:v1',
      JSON.stringify({ fighter, dummy, dummyMode: 'still' })), [attacker, victim]);
    await page.goto('/');
    await page.locator('#splash-screen').click();
    await page.locator('#practice-btn').click();
    await page.locator('#practice-free').click();
    const art = () => page.evaluate(() => window.__smashDebug?.getArtState?.().players);
    await expect.poll(async () => (await art())?.length).toBe(2);
    await page.keyboard.press('F6');
    for (const ground of [true, false]) {
      for (const facing of [1, -1]) {
        await page.keyboard.press('r');
        await page.keyboard.press('F7');
        await page.evaluate(({ ground, facing }) => {
          const debug = window.__smashDebug!;
          const players = Object.values(debug.getSnapshot().players);
          const a = players.find(p => p.slotIndex === 0)!;
          const v = players.find(p => p.slotIndex === 1)!;
          const y = ground ? v.y : v.y - 100;
          debug.forcePosition(a.id, v.x, y - 56);
          debug.forcePosition(v.id, v.x, y);
          Object.assign(debug.getSnapshot().players[a.id], { facing, state: 'AIRBORNE', isGrounded: false, isInvincible: false });
          Object.assign(debug.getSnapshot().players[v.id], { facing: -facing, state: ground ? 'IDLE' : 'AIRBORNE', isGrounded: ground, isInvincible: false });
        }, { ground, facing });
        await page.keyboard.down('KeyX');
        await page.keyboard.press('F7');
        await page.keyboard.up('KeyX');
        const sprites = await art();
        expect(sprites?.find(p => p.slot === 0)).toMatchObject({ clip: 'footstool_attacker', bodyFacing: facing, bodyVisible: true });
        expect(sprites?.find(p => p.slot === 1)).toMatchObject({
          clip: ground ? 'footstool_ground_victim' : 'footstool_air_victim', bodyFacing: -facing, bodyVisible: true,
        });
        const playback = page.evaluate(async () => {
          const frames = [];
          for (let frame = 0; frame < 32; frame++) {
            await new Promise(requestAnimationFrame);
            const debug = window.__smashDebug!;
            const player = Object.values(debug.getSnapshot().players).find(p => p.slotIndex === 0)!;
            const sprite = debug.getArtState!().players.find(p => p.slot === 0)!;
            frames.push({ age: player.footstoolFrame, clip: sprite.clip, visible: sprite.bodyVisible,
              dx: sprite.bodyX - player.x, dy: sprite.bodyY - player.y });
          }
          return frames;
        });
        await page.keyboard.press('F6');
        const frames = await playback;
        await page.keyboard.press('F6');
        const separated = frames.filter(frame => frame.clip === 'footstool_attacker' && (frame.age ?? 0) >= 8);
        expect(separated.length).toBeGreaterThan(0);
        for (const frame of separated) {
          expect(frame.dx).toBeCloseTo(0);
          expect(frame.dy).toBeCloseTo(28);
        }
        expect(frames.at(-1)?.clip).not.toBe('footstool_attacker');
        expect(frames.every(frame => frame.visible)).toBe(true);
        await test.info().attach(attacker + '-' + ground + '-' + facing, {
          body: JSON.stringify(frames), contentType: 'application/json',
        });
      }
    }
  });
}

test('Pack 04 backward roll selects its mirrored tuck in both facings', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    const path = '/src/renderer/fullbody/FullBodyPilot.ts';
    const { FullBodyPilot, preloadFullBodyPilot } = await import(path);
    for (const id of ['zane-corvo', 'velvet-reply']) {
      const assets = await preloadFullBodyPilot(true, [id], false, true);
      for (const facing of [-1, 1]) {
        const pilot = new FullBodyPilot(assets, id, id);
        for (const [kind, direction, expected] of [['forward', 1, 'roll'], ['backward', -1, 'roll_back']]) {
          let tuck = false;
          for (let tick = 0; tick < 16; tick++) {
            pilot.update('ROLL', tick, null, true, 0, true, false, direction, 0, false, 1, facing,
              undefined, undefined, { dodgeKind: kind });
            if (!pilot.sprite.visible || pilot.sprite.label !== expected) throw Error(id + ' ' + expected);
            if (Math.sign(pilot.sprite.scale.x) === direction) tuck = true;
          }
          if (!tuck) throw Error(id + ' missing tuck orientation');
        }
        pilot.sprite.destroy();
        pilot.effectSprite.destroy();
      }
    }
  });
});

test('Pack 04 locomotion loops keep their ground anchor in both facings', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    const path = '/src/renderer/fullbody/FullBodyPilot.ts';
    const { FullBodyPilot, preloadFullBodyPilot } = await import(path);
    for (const id of ['zane-corvo', 'velvet-reply']) {
      const assets = await preloadFullBodyPilot(true, [id], false, true);
      const pilot = new FullBodyPilot(assets, id, id);
      for (const facing of [-1, 1]) {
        for (const [state, clipName, period, distinct] of [
          ['DASH', 'dash_start', 14, 6], ['IDLE', 'idle', 48, 4], ['WALK', 'walk', 20, 6], ['RUN', 'run', 8, 6],
        ] as const) {
          const frames = new Set();
          for (let tick = 0; tick <= period; tick++) {
            pilot.update(state, tick, null, true, 0, true, false, 1, 0, false, 1, facing,
              undefined, undefined, { isGrounded: true });
            const sprite = pilot.sprite;
            if (!sprite.visible || sprite.label !== clipName || Math.abs(sprite.y - 28) > 0.001) {
              throw Error(id + ' ' + facing + ' ' + clipName + ' tick ' + tick);
            }
            const sole = sprite.toGlobal({ x: sprite.pivot.x, y: sprite.texture.frame.height });
            if (clipName === 'dash_start' && Math.abs(sole.y - 28) > 0.001) throw Error(id + ' dash sole at ' + tick);
            frames.add(sprite.texture);
            if (clipName !== 'dash_start' && tick === period && sprite.texture !== assets.characters[id][clipName].frames[0].texture) {
              throw Error(id + ' ' + clipName + ' loop seam');
            }
          }
          if (frames.size !== distinct) throw Error(id + ' ' + clipName + ' frame count ' + frames.size);
        }
      }
      pilot.sprite.destroy();
      pilot.effectSprite.destroy();
    }
  });
});

for (const fighter of ['zane-corvo', 'velvet-reply']) {
  test(fighter + ' live analog locomotion in both directions', async ({ page }) => {
    await page.addInitScript(id => {
      localStorage.setItem('eth:dojo:setup:v1', JSON.stringify({ fighter: id, dummy: 'all-rounder', dummyMode: 'still' }));
      const axes = [0, 0, 0, 0];
      window.addEventListener('test-stick', event => { axes[0] = (event as CustomEvent<number>).detail; });
      Object.defineProperty(navigator, 'getGamepads', { value: () => [{
        id: 'Xbox 360 Controller fixture', index: 0, mapping: 'standard', connected: true,
        timestamp: 0, axes, buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })),
      }] });
    }, fighter);
    await page.goto('/');
    await page.locator('#splash-screen').click();
    await page.locator('#practice-btn').click();
    await page.locator('#practice-free').click();
    const sample = () => page.evaluate(() => window.__smashDebug?.getArtState?.()?.players.find(p => p.slot === 0));
    await expect.poll(sample).toMatchObject({ character: fighter, clip: 'idle' });
    const stick = (value: number) => page.evaluate(value =>
      window.dispatchEvent(new CustomEvent('test-stick', { detail: value })), value);
    const see = (clip: string) => expect.poll(sample, { intervals: [16] })
      .toMatchObject({ clip, bodyVisible: true });
    for (const facing of [-1, 1]) {
      await stick(-0.42 * facing);
      await see('walk');
      await stick(0);
      await see('idle');
      await stick(0.42 * facing);
      await see('turn_stand');
      await see('walk');
      await stick(facing);
      await see('run');
      await stick(-facing);
      await see('turn_run');
      await see('run');
      await stick(0);
      await see('brake');
      await see('idle');
    }
  });
}
for (const fighter of ['zane-corvo', 'velvet-reply']) {
  test(fighter + ' crouch entry hold and rise in the Dojo', async ({ page }) => {
    await page.addInitScript(id => localStorage.setItem('eth:dojo:setup:v1',
      JSON.stringify({ fighter: id, dummy: 'all-rounder', dummyMode: 'still' })), fighter);
    await page.goto('/');
    await page.locator('#splash-screen').click();
    await page.locator('#practice-btn').click();
    await page.locator('#practice-free').click();
    const art = () => page.evaluate(() => window.__smashDebug?.getArtState?.().players.find(p => p.slot === 0));
    await expect.poll(art).toMatchObject({ clip: 'idle', bodyVisible: true });
    for (const [key, facing] of [['ArrowLeft', -1], ['ArrowRight', 1]] as const) {
      await page.keyboard.down(key);
      await expect.poll(art).toMatchObject({ bodyFacing: facing });
      await page.keyboard.up(key);
      await expect.poll(art).toMatchObject({ clip: 'idle' });
      await page.keyboard.down('ArrowDown');
      for (const clip of ['crouch_enter', 'crouch_hold']) {
        await expect.poll(art, { intervals: [16] }).toMatchObject({ clip, bodyFacing: facing, bodyVisible: true });
      }
      await page.keyboard.up('ArrowDown');
      await expect.poll(art, { intervals: [16] }).toMatchObject({ clip: 'crouch_exit', bodyFacing: facing, bodyVisible: true });
      await expect.poll(art).toMatchObject({ clip: 'idle' });
    }
  });
}

for (const fighter of ['zane-corvo', 'velvet-reply']) {
  test(fighter + ' jump through fast-fall landing in the Dojo', async ({ page }) => {
    await page.addInitScript(id => localStorage.setItem('eth:dojo:setup:v1',
      JSON.stringify({ fighter: id, dummy: 'all-rounder', dummyMode: 'still' })), fighter);
    await page.goto('/');
    await page.locator('#splash-screen').click();
    await page.locator('#practice-btn').click();
    await page.locator('#practice-free').click();
    const sample = () => page.evaluate(() => {
      const debug = window.__smashDebug!;
      const player = Object.values(debug?.getSnapshot()?.players ?? {}).find(p => p.slotIndex === 0);
      const sprite = debug?.getArtState?.().players.find(p => p.slot === 0);
      return { grounded: player?.isGrounded, clip: sprite?.clip, facing: sprite?.bodyFacing, visible: sprite?.bodyVisible, anchor: sprite && player ? sprite.bodyY - player.y : undefined };
    });
    await expect.poll(sample).toMatchObject({ grounded: true, clip: 'idle' });
    await page.keyboard.press('F6');
    const step = () => page.keyboard.press('F7');
    const input = async (key: string) => {
      await page.keyboard.down(key);
      await step();
      await page.keyboard.up(key);
    };
    for (const [key, facing] of [['ArrowLeft', -1], ['ArrowRight', 1]] as const) {
      await page.keyboard.press('r');
      await step();
      await input(key);
      await input('KeyX');
      expect(await sample()).toMatchObject({ clip: 'jump_squat', facing, visible: true });
      for (let tick = 0; tick < 9; tick++) await step();
      expect((await sample()).grounded).toBe(false);
      await input('KeyX');
      expect(await sample()).toMatchObject({ clip: 'double_jump_transition', facing, visible: true });
      const clips = new Set<string>();
      for (let tick = 0; tick < 70; tick++) {
        const frame = await sample();
        expect(frame).toMatchObject({ facing, visible: true });
        clips.add(frame.clip!);
        if (frame.clip === 'air_fall_loop' || frame.clip === 'air_fastfall_loop') expect(frame.anchor).toBeCloseTo(0);
        if (frame.grounded) break;
        if (frame.clip === 'air_fall_loop') await input('ArrowDown');
        else await step();
      }
      expect((await sample()).grounded).toBe(true);
      expect([...clips]).toEqual(expect.arrayContaining(['air_rise_loop', 'air_apex_loop', 'air_fall_loop', 'air_fastfall_loop']));
    }
  });
}

test('Pack 04 soft and heavy landing soles stay on the floor', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    const path = '/src/renderer/fullbody/FullBodyPilot.ts';
    const { FullBodyPilot, preloadFullBodyPilot } = await import(path);
    for (const id of ['zane-corvo', 'velvet-reply']) {
      const assets = await preloadFullBodyPilot(true, [id], false, true);
      const pilot = new FullBodyPilot(assets, id, id);
      for (const facing of [-1, 1]) {
        for (const clip of ['land_soft', 'land_heavy']) {
          const textures = new Set();
          for (let tick = 0; tick < 9; tick++) {
            pilot.update(clip === 'land_soft' ? 'LANDING_LAG' : 'IDLE', tick, null,
              true, 0, true, false, 1, 0, false, 1, facing, undefined, undefined,
              { isGrounded: true, artCue: clip, artCueFrame: tick });
            const sprite = pilot.sprite;
            const floor = sprite.toGlobal({ x: sprite.pivot.x, y: sprite.texture.frame.height });
            if (!sprite.visible || sprite.label !== clip || Math.abs(floor.y - 28) > 0.001) {
              throw Error(id + ' ' + clip + ' facing ' + facing + ' tick ' + tick);
            }
            textures.add(sprite.texture);
          }
          if (textures.size !== 3) throw Error(id + ' ' + clip + ' failed to advance');
        }
      }
      pilot.sprite.destroy();
      pilot.effectSprite.destroy();
    }
  });
});

for (const fighter of ['zane-corvo', 'velvet-reply']) {
  test(fighter + ' dash attack active pose in both facings', async ({ page }) => {
    await page.addInitScript(id => localStorage.setItem('eth:dojo:setup:v1',
      JSON.stringify({ fighter: id, dummy: 'all-rounder', dummyMode: 'still' })), fighter);
    await page.goto('/');
    await page.locator('#splash-screen').click();
    await page.locator('#practice-btn').click();
    await page.locator('#practice-free').click();
    const manifest = await (await page.request.get('/fighter-art-pack-04-v1/production/manifest.json')).json();
    const contact = manifest.characters[fighter].clips.dash_attack.frames[2].rect.join(',');
    const sample = () => page.evaluate(() => {
      const debug = window.__smashDebug;
      const player = Object.values(debug?.getSnapshot()?.players ?? {}).find(p => p.slotIndex === 0);
      return { state: player?.state, move: player?.currentMoveId, active: Boolean(player?.activeHitbox),
        art: debug?.getArtState?.().players.find(p => p.slot === 0) };
    });
    await expect.poll(sample).toMatchObject({state: 'IDLE'});
    await page.keyboard.press('F6');
    for (const [key, facing] of [['ArrowLeft', -1], ['ArrowRight', 1]] as const) {
      await page.keyboard.press('r');
      await page.keyboard.press('F7');
      await page.keyboard.down(key);
      for (let tick = 0; tick < 25 && (await sample()).state !== 'RUN'; tick++) await page.keyboard.press('F7');
      expect((await sample()).state).toBe('RUN');
      await page.keyboard.down('KeyZ');
      await page.keyboard.press('F7');
      await page.keyboard.up('KeyZ');
      await page.keyboard.up(key);
      expect((await sample()).move).toBe('DASH_ATTACK');
      let activeTicks = 0;
      for (let tick = 0; tick < 40; tick++) {
        const frame = await sample();
        if (frame.move !== 'DASH_ATTACK') break;
        expect(frame.art).toMatchObject({ clip: 'dash_attack', bodyFacing: facing, bodyVisible: true });
        if (frame.active) {
          activeTicks++;
          expect(frame.art?.frameRect).toBe(contact);
        }
        await page.keyboard.press('F7');
      }
      expect(activeTicks).toBeGreaterThan(0);
    }
  });
}

for (const fighter of ['zane-corvo', 'velvet-reply']) {
  test(fighter + ' expanded defense cues in the Dojo', async ({ page }) => {
    await page.addInitScript(id => localStorage.setItem('eth:dojo:setup:v1',
      JSON.stringify({ fighter: id, dummy: 'all-rounder', dummyMode: 'still' })), fighter);
    await page.goto('/');
    await page.locator('#splash-screen').click();
    await page.locator('#practice-btn').click();
    await page.locator('#practice-free').click();
    const art = () => page.evaluate(() => window.__smashDebug?.getArtState?.().players.find(p => p.slot === 0));
    await expect.poll(art).toMatchObject({clip: 'idle'});
    await page.keyboard.press('F6');
    const step = () => page.keyboard.press('F7');
    const jab = (facing: number) => page.evaluate(facing => {
      const debug = window.__smashDebug!;
      const players = Object.values(debug.getSnapshot().players);
      const player = players.find(p => p.slotIndex === 0)!;
      const dummy = players.find(p => p.slotIndex === 1)!;
      debug.forcePosition(dummy.id, player.x + 30 * facing, player.y);
      Object.assign(debug.getSnapshot().players[dummy.id], {
        state: 'ATTACK', stateFrame: 2, currentMoveId: 'JAB', facing: -facing,
        isGrounded: true, isInvincible: false, invincibilityFrames: 0, hitPlayerIds: new Set(),
      });
    }, facing);
    for (const [facing, direction] of [[-1, 'ArrowLeft'], [1, 'ArrowRight']] as const) {
      for (const action of ['drop', 'hit', 'parry', 'dodge']) {
        await page.keyboard.press('r');
        await step();
        await page.keyboard.down(direction);
        await step();
        await page.keyboard.up(direction);
        for (let tick = 0; tick < 22; tick++) await step();

        await page.keyboard.down('ShiftLeft');
        await step();
        const see = (clip: string) => expect.poll(art).toMatchObject({ clip, bodyFacing: facing, bodyVisible: true });
        if (action === 'dodge') {
          for (let tick = 0; tick < 7; tick++) await step();
          await page.keyboard.down('ArrowDown');
          await step();
          await page.keyboard.up('ArrowDown');
          await page.keyboard.up('ShiftLeft');
          await see('dodge');
          continue;
        }
        await see('shield_raise');
        for (let frame = 0; frame < 7; frame++) await step();
        await see('shield');
        if (action === 'hit' || action === 'parry') await jab(facing);
        if (action !== 'hit') await page.keyboard.up('ShiftLeft');
        await step();
        await see(action === 'parry' ? 'parry' : 'shield_' + action);
        await page.keyboard.up('ShiftLeft');
      }
    }
  });
}

test('Pack 04 hit reactions and tumble advance in both facings', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    const path = '/src/renderer/fullbody/FullBodyPilot.ts';
    const { FullBodyPilot, preloadFullBodyPilot } = await import(path);
    for (const id of ['zane-corvo', 'velvet-reply']) {
      const assets = await preloadFullBodyPilot(true, [id], false, true);
      for (const facing of [-1, 1]) {
        const pilot = new FullBodyPilot(assets, id, id);
        for (const [name, reaction, tumbling, recovery] of [
          ['hit_mid', undefined, false, false], ['hit_high', 'high', false, false],
          ['hit_low', 'low', false, false], ['hit_heavy', 'heavy', false, false],
          ['hit_air', 'air', false, false], ['tumble', undefined, true, false],
          ['tumble_recover', undefined, false, true],
        ] as const) {
          const seen = new Set();
          for (let tick = 0; tick < 24; tick++) {
            pilot.update(recovery ? 'AIRBORNE' : 'HITSTUN', tick, null, true, 4, true,
              tumbling, 1, 0, false, 1, facing, undefined, undefined, {
                isTumbling: tumbling, hitReaction: reaction, isGrounded: !recovery && !tumbling && reaction !== 'air',
                artCue: recovery ? 'tumble_recover' : undefined, artCueFrame: tick,
              });
            const sprite = pilot.sprite;
            if (sprite.label !== name && !(tumbling && sprite.label === 'hit_launch')) {
              throw Error(id + ' expected ' + name + ' got ' + sprite.label);
            }
            if (!sprite.visible) throw Error(id + ' hidden during ' + name);
            if (sprite.label === name) seen.add(sprite.texture);
            if ((recovery || tumbling || reaction === 'air') && Math.abs(sprite.y) > 0.001) {
              throw Error(id + ' airborne anchor shifted during ' + sprite.label);
            }
          }
          if (seen.size < 2) throw Error(id + ' did not advance ' + name);
        }
        pilot.sprite.destroy();
        pilot.effectSprite.destroy();
      }
    }
  });
});

test('Pack 04 knockdowns settle into the matching prone pose', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    const path = '/src/renderer/fullbody/FullBodyPilot.ts';
    const { FullBodyPilot, preloadFullBodyPilot } = await import(path);
    for (const id of ['zane-corvo', 'velvet-reply']) {
      const assets = await preloadFullBodyPilot(true, [id], false, true);
      const pilot = new FullBodyPilot(assets, id, id);
      for (const facing of [-1, 1]) {
        for (const orientation of ['up', 'down']) {
          for (let tick = 0; tick < 42; tick++) {
            pilot.update('HARD_LANDING', tick, null, true, 0, true, false, 1, 0, false, 1,
              facing, undefined, undefined, { isGrounded: true, floorOrientation: orientation });
            const sprite = pilot.sprite;
            const clip = (tick < 18 ? 'knockdown_' : 'prone_') + orientation;
            const bottom = sprite.toGlobal({ x: sprite.pivot.x, y: sprite.texture.frame.height });
            if (sprite.label !== clip || !sprite.visible || Math.abs(bottom.y - 28) > 0.001) {
              throw Error(id + ' ' + facing + ' ' + clip + ' tick ' + tick);
            }
          }
        }
      }
      pilot.sprite.destroy();
      pilot.effectSprite.destroy();
    }
  });
});

for (const fighter of ['zane-corvo', 'velvet-reply']) {
  test(fighter + ' live Dojo floor recovery matrix', async ({ page }) => {
    await page.addInitScript(id => localStorage.setItem('eth:dojo:setup:v1',
      JSON.stringify({ fighter: id, dummy: 'all-rounder', dummyMode: 'still' })), fighter);
    await page.goto('/');
    await page.locator('#splash-screen').click();
    await page.locator('#practice-btn').click();
    await page.locator('#practice-free').click();
    const art = () => page.evaluate(() => window.__smashDebug?.getArtState?.().players.find(p => p.slot === 0));
    await expect.poll(art).toMatchObject({ character: fighter, clip: 'idle' });
    await page.keyboard.press('F6');
    for (const facing of [-1, 1]) {
      for (const orientation of ['up', 'down']) {
        for (const [key, prefix] of [
          ['KeyX', 'getup'], [facing === 1 ? 'ArrowRight' : 'ArrowLeft', 'getup_roll'], ['KeyZ', 'floor_attack'],
        ]) {
          await page.keyboard.press('r');
          await page.keyboard.press('F7');
          await page.evaluate(({ facing, orientation }) => {
            const player = Object.values(window.__smashDebug!.getSnapshot().players).find(p => p.slotIndex === 0)!;
            Object.assign(player, { facing, state: 'HARD_LANDING', stateFrame: 18,
              floorOrientation: orientation, isGrounded: true, vx: 0, vy: 0 });
          }, { facing, orientation });
          await page.keyboard.down(key);
          await page.keyboard.press('F7');
          await page.keyboard.up(key);
          expect(await art()).toMatchObject({ clip: prefix + '_' + orientation, bodyVisible: true, bodyFacing: facing });
        }
      }
    }
  });
}

test('Pack 04 tech clips reach their final poses', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    const path = '/src/renderer/fullbody/FullBodyPilot.ts';
    const { FullBodyPilot, preloadFullBodyPilot } = await import(path);
    for (const id of ['zane-corvo', 'velvet-reply']) {
      const assets = await preloadFullBodyPilot(true, [id], false, true);
      if (!assets) throw Error(id + ' atlas did not load');
      const pilot = new FullBodyPilot(assets, id, id);
      for (const facing of [-1, 1]) {
        for (const [clip, state, last, grounded] of [
          ['tech_neutral', 'TECH_NEUTRAL', 25, true], ['tech_roll', 'TECH_ROLL', 39, true],
          ['wall_tech', 'AIRBORNE', 23, false], ['wall_tech_jump', 'AIRBORNE', 23, false],
          ['ceiling_tech', 'AIRBORNE', 25, false],
        ] as const) {
          for (let tick = 0; tick <= last; tick++) {
            pilot.update(state, tick, null, true, 0, true, false, 1, 0, false, 1, facing,
              undefined, undefined, { isGrounded: grounded, artCue: grounded ? undefined : clip,
                artCueFrame: tick, wallTechSide: facing === 1 ? 'left' : 'right' });
            const sprite = pilot.sprite;
            if (sprite.label !== clip || !sprite.visible || Math.abs(sprite.y - (grounded ? 28 : 0)) > 0.001) {
              throw Error(id + ' ' + clip + ' tick ' + tick);
            }
            if (tick === last && sprite.texture !== assets.characters[id][clip].frames[5].texture) {
              throw Error(id + ' ' + clip + ' did not reach frame six');
            }
          }
        }
      }
      pilot.sprite.destroy();
      pilot.effectSprite.destroy();
    }
  });
});


for (const fighter of ['zane-corvo', 'velvet-reply']) {
  test(fighter + ' launch impact selects collision tech in the Dojo', async ({ page }) => {
    await page.route('**/src/main.ts', async route => {
      const response = await route.fetch();
      const source = await response.text();
      const fixture = `testTechLaunch: (facing, clip) => {
        const engine = localMatch.engine;
        const victim = engine.state.players['local-p1'];
        const stage = getStageLayout(selectedStage.id); const floor = stage.mainPlatform;
        const radius = getCharacterStats(victim.characterId).hurtboxRadius;
        const ceiling = clip === 'ceiling_tech';
        const wall = clip.startsWith('wall');
        Object.assign(victim, { x: wall ? (facing === 1 ? floor.x : floor.x + floor.width) - facing * 4 : floor.x + floor.width / 2,
          y: wall ? floor.y + floor.height / 2 : ceiling ? floor.y + floor.height + radius + 5 : floor.y - radius - 5,
          facing, isGrounded: false });
        engine.state.players[victim.id] = engine.applyHit(victim, {
          damage: 10, knockbackVx: wall ? facing * 85 : 0, knockbackVy: wall ? 0 : ceiling ? -150 : 85, hitstunFrames: 33, hitlagFrames: 0,
        }, 1);
      }, `;
      const injected = source.replace('getArtState:','' + fixture + 'getArtState:');
      expect(injected).not.toBe(source);
      await route.fulfill({ response, body: injected });
    });
    await page.addInitScript(id => localStorage.setItem('eth:dojo:setup:v1',
      JSON.stringify({ fighter: id, dummy: 'all-rounder', dummyMode: 'still', stageId: 'stage2' })), fighter);
    await page.goto('/');
    await page.locator('#splash-screen').click();
    await page.locator('#practice-btn').click();
    await page.locator('#practice-free').click();
    const art = () => page.evaluate(() => window.__smashDebug?.getArtState?.().players.find(p => p.slot === 0));
    await expect.poll(art).toMatchObject({ character: fighter, clip: 'idle' });
    await page.keyboard.press('F3');
    await page.keyboard.press('F6');
    for (const clip of ['tech_neutral', 'tech_roll', 'wall_tech', 'wall_tech_jump', 'ceiling_tech']) for (const facing of [-1, 1]) {
      await page.keyboard.press('r');
      await page.keyboard.press('F7');
      await page.evaluate(({facing,clip}) => {
        const debug = window.__smashDebug as typeof window.__smashDebug & { testTechLaunch(facing: number, clip: string): void };
        debug.testTechLaunch(facing,clip);
      }, {facing,clip});
      const direction = clip === 'wall_tech_jump' ? 'KeyX' : clip === 'tech_roll' ? (facing < 0 ? 'ArrowLeft' : 'ArrowRight') : null;
      if (direction) await page.keyboard.down(direction);
      await page.keyboard.down('ShiftLeft');
      await page.keyboard.press('F7');
      await page.keyboard.up('ShiftLeft');
      for (let tick = 0; tick < 25 && (await art())?.clip !== clip; tick++) await page.keyboard.press('F7');
      if (direction) await page.keyboard.up(direction);
      expect(await art(), clip + ' ' + facing).toMatchObject({ clip, bodyVisible: true });
      await page.screenshot({ path: test.info().outputPath(clip + '-' + facing + '.png') });
    }
  });
}

for (const fighter of ['zane-corvo', 'velvet-reply']) {
  test(fighter + ' trip and jab lock recovery playback', async ({ page }) => {
    await page.addInitScript(id => localStorage.setItem('eth:dojo:setup:v1',
      JSON.stringify({ fighter: id, dummy: 'all-rounder', dummyMode: 'still' })), fighter);
    await page.goto('/');
    await page.locator('#splash-screen').click();
    await page.locator('#practice-btn').click();
    await page.locator('#practice-free').click();
    const art = () => page.evaluate(() => window.__smashDebug?.getArtState?.().players.find(p => p.slot === 0));
    await expect.poll(art).toMatchObject({ character: fighter, clip: 'idle' });
    await page.keyboard.press('F6');
    const step = () => page.keyboard.press('F7');
    for (const facing of [-1, 1]) {
      for (const orientation of ['trip', 'up', 'down']) {
        await page.keyboard.press('r');
        await step();
        await page.evaluate(({ facing, orientation }) => {
          const player = Object.values(window.__smashDebug!.getSnapshot().players).find(p => p.slotIndex === 0)!;
          Object.assign(player, { facing, state: orientation === 'trip' ? 'TRIP_FALL' : 'JAB_LOCK',
            floorOrientation: orientation === 'down' ? 'down' : 'up',
            stateFrame: 0, isGrounded: true, vx: 0, vy: 0 });
        }, { facing, orientation });
        const clips = new Set<string>();
        for (let tick = 0; tick < 160; tick++) {
          await step();
          const sprite = await art();
          expect(sprite).toMatchObject({ bodyFacing: facing, bodyVisible: true });
          clips.add(sprite!.clip);
          if (sprite!.clip === 'idle') break;
        }
        expect([...clips]).toEqual(expect.arrayContaining(orientation === 'trip'
          ? ['trip_fall', 'trip_prone', 'trip_getup', 'idle'] : ['jab_lock_' + orientation, 'idle']));
      }
    }
  });
}

for (const fighter of ['zane-corvo', 'velvet-reply']) {
  test(fighter + ' seated recovery options in both facings', async ({ page }) => {
    await page.addInitScript(id => localStorage.setItem('eth:dojo:setup:v1',
      JSON.stringify({ fighter: id, dummy: 'all-rounder', dummyMode: 'still' })), fighter);
    await page.goto('/');
    await page.locator('#splash-screen').click();
    await page.locator('#practice-btn').click();
    await page.locator('#practice-free').click();
    const art = () => page.evaluate(() => window.__smashDebug?.getArtState?.().players.find(p => p.slot === 0));
    await expect.poll(art).toMatchObject({ character: fighter, clip: 'idle' });
    await page.keyboard.press('F6');
    const step = () => page.keyboard.press('F7');
    for (const [facing, direction] of [[-1, 'ArrowLeft'], [1, 'ArrowRight']] as const) {
      for (const [key, clip] of [[direction, 'trip_roll'], ['KeyZ', 'floor_attack_trip']]) {
        await page.keyboard.press('r');
        await step();
        await page.evaluate(facing => {
          const player = Object.values(window.__smashDebug!.getSnapshot().players).find(p => p.slotIndex === 0)!;
          Object.assign(player, { facing, state: 'TRIP_PRONE', stateFrame: 0, isGrounded: true, vx: 0, vy: 0 });
        }, facing);
        await page.keyboard.down(key);
        await step();
        await page.keyboard.up(key);
        expect(await art()).toMatchObject({ clip, bodyFacing: facing, bodyVisible: true });
        for (let tick = 0; tick < 45 && (await art())?.clip !== 'idle'; tick++) await step();
        expect(await art()).toMatchObject({ clip: 'idle', bodyVisible: true });
      }
    }
  });
}

for (const fighter of ['zane-corvo', 'velvet-reply']) {
  test(fighter + ' paired pummel returns to hold', async ({ page }) => {
    const dummy = fighter === 'zane-corvo' ? 'velvet-reply' : 'zane-corvo';
    await page.addInitScript(([fighter, dummy]) => localStorage.setItem('eth:dojo:setup:v1',
      JSON.stringify({ fighter, dummy, dummyMode: 'still' })), [fighter, dummy]);
    await page.goto('/');
    await page.locator('#splash-screen').click();
    await page.locator('#practice-btn').click();
    await page.locator('#practice-free').click();
    const art = () => page.evaluate(() => window.__smashDebug?.getArtState?.().players ?? []);
    await expect.poll(async () => (await art()).length).toBe(2);
    await page.keyboard.press('F6');
    const step = () => page.keyboard.press('F7');
    const tap = async (key: string) => {
      await page.keyboard.down(key);
      await step();
      await page.keyboard.up(key);
    };
    for (const facing of [-1, 1]) {
      await page.keyboard.press('r');
      await step();
      await page.evaluate(facing => {
        for (const p of Object.values(window.__smashDebug!.getSnapshot().players)) {
          Object.assign(p, { x: p.slotIndex === 0 ? 600 : 600 + 31 * facing,
            facing: p.slotIndex === 0 ? facing : -facing, isInvincible: false, invincibilityFrames: 0 });
        }
      }, facing);
      await tap('KeyC');
      const pair = async () => {
        const sprites = await art();
        return [sprites.find(p => p.slot === 0), sprites.find(p => p.slot === 1)];
      };
      for (let tick = 0; tick < 12 && (await pair())[0]?.clip !== 'grab_hold'; tick++) await step();
      expect((await pair()).map(p => p?.clip)).toEqual(['grab_hold', 'grabbed']);
      await tap('KeyZ');
      let contact = false;
      const offsets = [];
      for (let tick = 0; tick < 25; tick++) {
        const [holder, victim] = await pair();
        const offset = await page.evaluate(() => {
          const debug = window.__smashDebug!;
          const victim = Object.values(debug.getSnapshot().players).find(player => player.slotIndex === 1)!;
          const art = debug.getArtState!().players.find(player => player.slot === 1)!;
          return { clip: art.clip, pose: art.frameRect, grounded: victim.isGrounded, y: art.bodyY - victim.y };
        });
        offsets.push({ tick, ...offset });
        expect(holder?.bodyVisible && victim?.bodyVisible).toBe(true);
        if (victim?.clip === 'pummel_victim') {
          expect(holder?.clip).toBe('pummel');
          expect(offset.grounded).toBe(true);
          expect(offset.y).toBeCloseTo(28);
          contact = true;
        }
        if (contact && holder?.clip === 'grab_hold' && victim?.clip === 'grabbed') break;
        await step();
      }
      await test.info().attach('pummel-offset-' + facing, { body: JSON.stringify(offsets), contentType: 'application/json' });
      expect(contact).toBe(true);
      expect((await pair()).map(p => p?.clip)).toEqual(['grab_hold', 'grabbed']);
    }
  });
}

test('Pack 04 dash and pivot grab live cues', async ({ page }) => {
  test.setTimeout(60000);
  for (const fighter of ['zane-corvo', 'velvet-reply']) {
    await page.addInitScript(id => localStorage.setItem('eth:dojo:setup:v1',
      JSON.stringify({ fighter: id, dummy: 'all-rounder', dummyMode: 'still' })), fighter);
    await page.goto('/');
    await page.locator('#splash-screen').click();
    await page.locator('#practice-btn').click();
    await page.locator('#practice-free').click();
    const read = () => page.evaluate(() => ({
      state: Object.values(window.__smashDebug?.getSnapshot()?.players ?? {}).find(p => p.slotIndex === 0)?.state,
      art: window.__smashDebug?.getArtState?.().players.find(p => p.slot === 0),
    }));
    await expect.poll(read).toMatchObject({state: 'IDLE', art: {character: fighter}});
    await page.keyboard.press('F6');
    const step = () => page.keyboard.press('F7');
    for (const facing of [-1, 1]) for (const pivot of [false, true]) {
      await page.keyboard.press('r');
      await step();
      const run = facing < 0 ? 'ArrowLeft' : 'ArrowRight';
      const reverse = facing < 0 ? 'ArrowRight' : 'ArrowLeft';
      await page.keyboard.down(run);
      for (let i = 0; i < 25 && (await read()).state !== 'RUN'; i++) await step();
      expect((await read()).state).toBe('RUN');
      await page.evaluate(direction => {
        const players = Object.values(window.__smashDebug!.getSnapshot().players);
        const holder = players.find(p => p.slotIndex === 0)!;
        const target = players.find(p => p.slotIndex === 1)!;
        Object.assign(target, { x: holder.x + direction * 38, y: holder.y,
          facing: -direction, isInvincible: false, invincibilityFrames: 0 });
      }, pivot ? -facing : facing);
      if (pivot) {
        await page.keyboard.up(run);
        await page.keyboard.down(reverse);
      }
      await page.keyboard.down('KeyC');
      await step();
      await page.keyboard.up('KeyC');
      await page.keyboard.up(pivot ? reverse : run);
      expect((await read()).art).toMatchObject({clip: pivot ? 'grab_pivot' : 'grab_dash', bodyVisible: true});
      for (let tick = 0; tick < 16 && (await read()).art?.clip !== 'grab_hold'; tick++) await step();
      expect((await read()).art?.clip).toBe('grab_hold');
      expect(await page.evaluate(() => window.__smashDebug!.getArtState!().players.find(p => p.slot === 1)?.clip)).toBe('grabbed');
    }
  }
});

test('Pack 04 airborne hit and tumble recovery play in the live Dojo', async ({ page }) => {
  for (const fighter of ['zane-corvo', 'velvet-reply']) {
    await page.addInitScript(id => localStorage.setItem('eth:dojo:setup:v1',
      JSON.stringify({ fighter: id, dummy: 'all-rounder', dummyMode: 'still', stageId: 'stage2' })), fighter);
    await page.goto('/');
    await page.locator('#splash-screen').click();
    await page.locator('#practice-btn').click();
    await page.locator('#practice-free').click();
    await expect.poll(() => page.evaluate(() => window.__smashDebug?.getArtState?.().players.find(p => p.slot === 0)?.character)).toBe(fighter);
    for (const facing of [-1, 1]) {
      const direction = facing < 0 ? "ArrowLeft" : "ArrowRight";
      await page.keyboard.down(direction);
      const samples = await page.evaluate(async facing => {
        const debug = window.__smashDebug!;
        const fighter = Object.values(debug.getSnapshot().players).find(p => p.slotIndex === 0)!;
        const start = { x: fighter.x, y: fighter.y };
        const trace: { clip: string; bodyVisible: boolean }[] = [];
        const phases = [
          { stateFrame: 0, isTumbling: false, hitReaction: 'air', hitstunFramesRemaining: 30 },
          { stateFrame: 0, isTumbling: true, hitReaction: undefined, hitstunFramesRemaining: 23 },
        ];
        for (const phase of phases) {
          const current = debug.getSnapshot().players[fighter.id];
          Object.assign(current, { ...phase, state: 'HITSTUN', facing,
            isGrounded: false, x: start.x, y: start.y - 270, vx: 0, vy: -4 });
          for (let frame = 0; frame < phase.hitstunFramesRemaining + 20; frame++) {
            await new Promise(requestAnimationFrame);
            const art = debug.getArtState().players.find(p => p.slot === 0);
            if (art) trace.push({clip: art.clip, bodyVisible: art.bodyVisible});
          }
        }
        return trace;
      }, facing);
      await page.keyboard.up(direction);
      expect(samples.every(sample => sample.bodyVisible)).toBe(true);
      expect([...new Set(samples.map(sample => sample.clip))], fighter + " facing " + facing).toEqual(expect.arrayContaining(['hit_air', 'tumble', 'tumble_recover']));
      await page.keyboard.press('r');
      await expect.poll(() => page.evaluate(() => window.__smashDebug?.getArtState?.().players.find(p => p.slot === 0)?.clip)).toBe('idle');
    }
  }
});


for (const fighter of ['zane-corvo', 'velvet-reply']) {
  test(fighter + ' zero-percent back throw settles in Guided Dojo', async ({ page }) => {
    const dummy = fighter === 'zane-corvo' ? 'velvet-reply' : 'zane-corvo';
    await page.addInitScript(config => localStorage.setItem('eth:dojo:setup:v1', JSON.stringify(config)),
      { fighter, dummy, lessonId: 'back-throw', stageId: 'stage1', dummyMode: 'still' });
    await page.goto('/');
    for (const id of ['splash-screen', 'practice-btn', 'dojo-start-lesson']) {
      await page.locator('#' + id).click();
    }
    const pair = () => page.evaluate(() => {
      const debug = window.__smashDebug!;
      const state = debug.getSnapshot();
      const holder = state?.players['local-p1'];
      const victim = state?.players['local-p2'];
      const victimArt = debug.getArtState?.().players.find(player => player.slot === 1);
      return { holder, victim, victimArt };
    });
    await expect.poll(async () => (await pair()).victim?.percent).toBe(0);
    await page.keyboard.press('c', { delay: 45 });
    await expect.poll(async () => (await pair()).holder?.grabbedPlayerId).toBe('local-p2');
    const facing = (await pair()).holder!.facing;
    await page.keyboard.press('F6');
    const direction = facing === 1 ? 'ArrowLeft' : 'ArrowRight';
    await page.keyboard.down(direction);
    await page.keyboard.press('F7');
    await page.keyboard.up(direction);
    let checkedLastHitstun = false;
    for (let tick = 0; tick < 35; tick++) {
      await page.keyboard.press('F7');
      const { victim, victimArt } = await pair();
      if (victim?.hitstunFramesRemaining === 1 && victimArt?.clip === 'throw_victim') {
        expect(victimArt.bodyX).toBeCloseTo(victim.x);
        checkedLastHitstun = true;
      }
    }
    expect(checkedLastHitstun).toBe(true);
    await expect(page.getByText('1 / 3 successful repetitions', { exact: true })).toBeVisible();
    await expect.poll(async () => {
      const { holder, victim, victimArt } = await pair();
      if (!holder || !victim || victimArt?.clip !== 'idle' || !victimArt.bodyVisible) return null;
      return (victimArt.bodyX - holder.x) * facing;
    }).toBeGreaterThan(0);
    const { holder, victim, victimArt } = await pair();
    expect(victimArt!.bodyX).toBeCloseTo(victim!.x);
    console.log(fighter + ' front gap after return to idle:', Math.abs(victim!.x - holder!.x).toFixed(2));
  });
}
