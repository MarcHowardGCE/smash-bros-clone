import { describe, expect, it } from 'vitest';
import { Texture } from 'pixi.js';
import { MoveId } from '@smash/shared';
import { getMoveDataForCharacter } from '@smash/engine';
import { FullBodyPilot } from './FullBodyPilot.js';

it('finishes a grab escape once when the victim lands during the cue', () => {
  const frame = { root: [0, 0], texture: Texture.EMPTY, offsetY: 0 };
  const clip = { scale: 1, frames: [frame] };
  const pilot = new FullBodyPilot({ characters: {
    'all-rounder': { idle: clip, grabbed: clip, grab_release: clip },
  } });
  pilot.update('GRAB_HOLDING', 8, null, true, 0, true, false, 1, 0, true);
  pilot.update('AIRBORNE', 0, null, true, 0, true, false, 1, 0, false, 1, 1, undefined, null, {
    artCue: 'grab_escape', artCueFrame: 0,
  });
  expect(pilot.sprite.label).toBe('grab_release');
  pilot.update('IDLE', 0, null, true, 0, true, false, 1, 0, false, 1, 1, undefined, null, {
    artCue: 'grab_escape', artCueFrame: 11,
  });
  expect(pilot.sprite.label).toBe('grab_release');
  pilot.update('IDLE', 1, null, true);
  expect(pilot.sprite.label).toBe('idle');
});

describe('newcomer throw release contact', () => {
  it('shows the release drawing when a confirmed throw skips to recovery', () => {
    const move = MoveId.UP_THROW;
    const { startupFrames, activeFrames } = getMoveDataForCharacter('moonshine', move);
    const recovery = startupFrames + activeFrames;
    const pilot = new FullBodyPilot({
      characters: {
        moonshine: {
          up_throw: {
            scale: 1, durations: [6, 5, 9], activeWindow: [6, 11],
            frames: [0, 1, 2].map(i => ({ root: [i, 0], texture: Texture.EMPTY, offsetY: 0 })),
          },
        },
      },
    }, 'moonshine', 'moonshine');
    pilot.update('ATTACK', recovery, move, true);
    expect(pilot.sprite.pivot.x).toBe(2);
    pilot.startThrowRelease(move);
    pilot.update('ATTACK', recovery, move, true);
    expect(pilot.sprite.pivot.x).toBe(1);
    pilot.update('ATTACK', recovery, move, true);
    expect(pilot.sprite.pivot.x).toBe(1);
    pilot.update('ATTACK', recovery + 2, move, true);
    expect(pilot.sprite.pivot.x).toBe(2);
  });

  it.each([1, -1] as const)('uses the release hand after the windup in facing %s', (facing) => {
    const frame = (sockets: Record<string, number[]>) => ({
      root: [0, 0], texture: Texture.EMPTY, offsetY: 0, sockets,
    });
    const victim = frame({ gripTop: [0, -20], gripBottom: [0, 0] });
    const windup = frame({ grabGrip: [20, -10] });
    const release = frame({ grabGrip: [-8, -40] });
    const pilot = new FullBodyPilot({
      characters: {
        swift: {
          grabbed: { scale: 1, frames: [victim] },
          throw_victim: { scale: 1, frames: [victim, victim, victim] },
        },
        moonshine: {
          grab_hold: { scale: 1, frames: [windup] },
          up_throw: { scale: 1, durations: [6, 5], activeWindow: [6, 11], frames: [windup, release] },
        },
      },
    }, 'swift');
    pilot.update('GRAB_HOLDING', 0, null, true, 0, true, false, 1, 0, true, 1, facing, {
      artId: 'moonshine', characterId: 'moonshine', state: 'GRAB_HOLDING',
      frame: 0, move: null, dx: 40, dy: 0, facing,
    });
    pilot.startGrabReaction(MoveId.UP_THROW, facing);
    pilot.update('HITSTUN', 0, null, true, 0, true, false, 1, 0, false, 1, facing);
    expect(pilot.sprite.label).toBe('throw_victim');
    expect([pilot.sprite.position.x, pilot.sprite.position.y]).toEqual([-48, -30]);
  });
});
