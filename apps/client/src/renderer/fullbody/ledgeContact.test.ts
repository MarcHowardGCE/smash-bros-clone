import { describe, expect, it } from 'vitest';
import { Texture } from 'pixi.js';
import { getCharacterStats } from '@smash/shared';
import { FullBodyPilot, type DojoArtId, type FullBodyPilotAssets } from './FullBodyPilot.js';

describe('newcomer ledge contact', () => {
  it.each([
    ['moonshine', 'swift'],
    ['hulk-hoagie', 'abe-lincoln'],
  ] as const)('keeps %s catch and climb timing independent of the loaded opponent', (id, reference) => {
    const offsetY = getCharacterStats(id).hurtboxRadius;
    const frame = (index: number, grip = true) => ({
      texture: Texture.EMPTY,
      root: [index, 0],
      offsetY,
      sockets: grip ? { ledgeGrip: [index + 8, -10] } : undefined,
    });
    const assets: FullBodyPilotAssets = {
      characters: {
        [id]: {
          ledge_catch: { scale: 1, frames: [frame(0), frame(1)] },
          ledge_climb: { scale: 1, frames: [frame(0), frame(1), frame(2, false)] },
        },
      },
    };
    const withReference: FullBodyPilotAssets = {
      characters: {
        ...assets.characters,
        [reference]: {
          ledge_catch: { scale: 1, frames: Array.from({ length: 4 }, (_, i) => frame(i)) },
          ledge_climb: { scale: 1, frames: Array.from({ length: 6 }, (_, i) => frame(i)) },
        },
      },
    };

    const replay = (art: FullBodyPilotAssets, fighter: DojoArtId) => {
      const pilot = new FullBodyPilot(art, fighter, fighter);
      const contact = { ledgeContact: { dx: 10, dy: -15 } };
      const poses = [];
      for (const [state, age] of [['LEDGE_HANG', 0], ['LEDGE_HANG', 6], ['LEDGE_CLIMB', 0], ['LEDGE_CLIMB', 6], ['LEDGE_CLIMB', 14], ['LEDGE_CLIMB', 28]] as const) {
        pilot.update(state, age, null, true, 0, true, false, 1, 0, false, 1, 1, undefined, 'left', contact);
        poses.push([pilot.sprite.pivot.x, pilot.sprite.position.x, pilot.sprite.position.y]);
      }
      return poses;
    };

    const solo = replay(assets, id);
    expect(solo).toEqual(replay(withReference, id));
    expect(solo[1]).toEqual([1, 2, -5]);
  });
});
