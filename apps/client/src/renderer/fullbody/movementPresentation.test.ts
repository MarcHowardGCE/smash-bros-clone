import { dodgeTiming } from '@smash/engine';
import { Texture } from 'pixi.js';
import { MoveId } from '@smash/shared';
import { FullBodyPilot } from './FullBodyPilot.js';
import{it,expect}from'vitest';import{selectPreparedFrame as select}from'./preparedHooks.js';import{selectResultFrame}from'./presentationTimeline.js';
it('plays crouch phases, authoritative motion and respawn wait from simulation age',()=>{expect(select('CROUCH',17,0,{})).toEqual({clip:'crouch_enter',index:5});expect(select('CROUCH',18,0,{})).toEqual({clip:'crouch_hold',index:0});expect(select('IDLE',0,0,{artCue:'brake',artCueFrame:9})).toEqual({clip:'brake',index:3});expect(select('ATTACK',0,0,{artCue:'brake',artCueFrame:9})).toBeNull();expect(select('AIRBORNE',0,0,{respawnTimer:24})).toEqual({clip:'respawn_wait',index:2});expect(select('AIRBORNE',0,0,{artCue:'entry',artCueFrame:53})).toEqual({clip:'entry',index:5});});
it('uses all three victory variants, holds final victory drawing and loops defeat',()=>{for(let v=0;v<3;v++){expect(selectResultFrame('win',v,0)).toEqual({clip:'victory_'+(v+1),index:0});expect(selectResultFrame('win',v,1000)).toEqual({clip:'victory_'+(v+1),index:5});}expect(selectResultFrame('lose',0,31)).toEqual({clip:'defeat',index:3});expect(selectResultFrame('lose',0,32)).toEqual({clip:'defeat',index:0});});

it('keeps the Pack 03 landing cadence with or without a reference fighter loaded', () => {
  const landing = {
    scale: 1, durations: [5, 4, 9],
    frames: [0, 1, 2].map(index => ({ texture: Texture.EMPTY, root: [index, 0], offsetY: 28 })),
  };
  const reference = {
    ...landing,
    frames: Array.from({ length: 6 }, () => landing.frames[0]!),
  };
  for (const includeReference of [false, true]) {
    const pilot = new FullBodyPilot({
      characters: {
        loopy: { land_heavy: landing },
        ...(includeReference && { 'abe-lincoln': { land_heavy: reference } }),
      },
    }, 'loopy', 'loopy');
    for (const [age, drawing] of [[0, 0], [4, 0], [5, 1], [8, 1], [9, 2], [17, 2]] as const) {
      pilot.update('IDLE', 0, null, true, 0, true, false, 1, 0, false, 1, 1, undefined, null, {
        artCue: 'land_heavy', artCueFrame: age,
      });
      expect(pilot.sprite.label).toBe('land_heavy');
      expect(pilot.sprite.pivot.x).toBe(drawing);
    }
  }
});

it('uses the Pack 03 takeoff and air-jump drawings at their authored ages and keeps the air registration', () => {
  const frame = (index: number) => ({
    texture: Texture.EMPTY, root: [99, 99], airRoot: [index, 20], offsetY: 28,
  });
  const clips = {
    takeoff_backward: { scale: 0.5, durations: [4, 2], frames: [frame(1), frame(2)] },
    air_rise_loop: { scale: 0.5, durations: [6], frames: [frame(2)] },
    double_jump_transition: { scale: 0.5, durations: [5, 7], frames: [frame(3), frame(2)] },
  };
  const pilot = new FullBodyPilot({ characters: { loopy: clips } }, 'loopy', 'loopy');
  const draw = (state: string, age: number, available: boolean, takeoff = false) => {
    pilot.update(state, age, null, true, -8, available, false, 1, 0, false, 1, 1, undefined, null,
      takeoff ? { artCue: 'takeoff_backward', artCueFrame: age } : {});
    expect(pilot.sprite.pivot.y).toBe(20);
    expect(pilot.sprite.position.y).toBe(0);
  };
  draw('AIRBORNE', 0, true, true);
  expect(pilot.sprite.pivot.x).toBe(1);
  draw('AIRBORNE', 4, true, true);
  expect(pilot.sprite.pivot.x).toBe(2);
  draw('AIRBORNE', 6, true, true);
  expect(pilot.sprite.label).toBe('air_rise_loop');
  draw('DOUBLE_JUMP', 0, false);
  expect(pilot.sprite.pivot.x).toBe(3);
  draw('AIRBORNE', 1, false);
  draw('AIRBORNE', 5, false);
  expect(pilot.sprite.pivot.x).toBe(2);
  expect(pilot.sprite.label).toBe('double_jump_transition');
  draw('AIRBORNE', 12, false);
  expect(pilot.sprite.label).toBe('air_rise_loop');
});

it('plays the Pack 03 fast-fall impulse on entry, then holds until the next fall', () => {
  const frame = (index: number) => ({ texture: Texture.EMPTY, root: [0, 0], airRoot: [index, 20], offsetY: 28 });
  const pilot = new FullBodyPilot({ characters: { loopy: {
    air_fall_loop: { scale: 0.5, durations: [6], frames: [frame(0)] },
    air_fastfall_loop: { scale: 0.5, durations: [3, 8], frames: [frame(1), frame(2)] },
  } } }, 'loopy', 'loopy');
  for (const [age, fast, drawing] of [[13, false, 0], [23, true, 1], [25, true, 1], [26, true, 2],
    [100, true, 2], [101, false, 0], [110, true, 1]] as const) {
    pilot.update('AIRBORNE', age, null, true, 5, true, false, 1, 0, false, 1, 1, undefined, null, { isFastFalling: fast });
    expect(pilot.sprite.label).toBe(fast ? 'air_fastfall_loop' : 'air_fall_loop');
    expect(pilot.sprite.pivot.x).toBe(drawing);
    expect(pilot.sprite.pivot.y).toBe(20);
  }
});

it('hands Pack 03 platform drop off to fall or fast fall after its authored duration', () => {
  const frame = (index: number) => ({ texture: Texture.EMPTY, root: [0, 0], airRoot: [index, 20], offsetY: 28 });
  const pilot = new FullBodyPilot({ characters: { loopy: {
    platform_drop: { scale: 0.5, durations: [3, 5], frames: [frame(1), frame(2)] },
    air_fall_loop: { scale: 0.5, durations: [6], frames: [frame(3)] },
    air_fastfall_loop: { scale: 0.5, durations: [3, 8], frames: [frame(4), frame(5)] },
  } } }, 'loopy', 'loopy');
  for (const [age, fast, clip, drawing] of [[0, false, 'platform_drop', 1], [3, false, 'platform_drop', 2],
    [7, false, 'platform_drop', 2], [8, false, 'air_fall_loop', 3], [9, true, 'air_fastfall_loop', 4]] as const) {
    pilot.update('AIRBORNE', age, null, true, 5, true, false, 1, 0, false, 1, 1, undefined, null,
      { artCue: 'platform_drop', artCueFrame: age, isFastFalling: fast });
    expect(pilot.sprite.label).toBe(clip);
    expect(pilot.sprite.pivot.x).toBe(drawing);
    expect(pilot.sprite.pivot.y).toBe(20);
  }
});

it('loops both Pack 03 teeter directions from cue age without drifting off the sole line', () => {
  const teeter = {
    scale: 0.5, durations: [9, 9],
    frames: [0, 1].map(index => ({ texture: Texture.EMPTY, root: [index, 30], offsetY: 28 })),
  };
  const pilot = new FullBodyPilot({ characters: { loopy: {
    teeter_front: teeter, teeter_back: teeter,
  } } }, 'loopy', 'loopy');
  for (const clip of ['teeter_front', 'teeter_back'] as const) {
    for (const [age, drawing] of [[0, 0], [8, 0], [9, 1], [17, 1], [18, 0]] as const) {
      pilot.update('IDLE', 0, null, true, 0, true, false, 1, 0, false, 1, 1, undefined, null,
        { artCue: clip, artCueFrame: age });
      expect(pilot.sprite.label).toBe(clip);
      expect(pilot.sprite.pivot.x).toBe(drawing);
      expect(pilot.sprite.pivot.y).toBe(30);
    }
  }
});

it('keeps Pack 03 smash charge in windup and splits contact drawings on the live hit boundaries', () => {
  const frames = [0, 1, 2, 3].map(index => ({ texture: Texture.EMPTY, root: [index, 0], offsetY: 28 }));
  const pilot = new FullBodyPilot({ characters: { loopy: {
    forward_smash: { scale: 1, durations: [4, 4, 4, 8], activeWindow: [8, 12], frames },
    up_smash: { scale: 1, durations: [6, 2, 3, 8], activeWindow: [6, 11], frames },
    down_smash: { scale: 1, durations: [6, 3, 3, 8], activeWindow: [6, 12], frames },
  } } }, 'loopy', 'loopy');
  const draw = (move: MoveId, age: number, charge: number, expected: number) => {
    expect(pilot.update('ATTACK', age + charge, move, true, 0, true, false, 1, charge)).toBe(true);
    expect(pilot.sprite.pivot.x).toBe(expected);
  };
  for (const charge of [0, 11, 60]) {
    draw(MoveId.FORWARD_SMASH, 1, charge, charge ? 1 : 0);
    draw(MoveId.FORWARD_SMASH, 14, charge, 1);
    draw(MoveId.FORWARD_SMASH, 15, charge, 2);
    draw(MoveId.FORWARD_SMASH, 17, charge, 2);
    draw(MoveId.FORWARD_SMASH, 18, charge, 3);
    for (const [move, startup, firstHitLength, secondHitLength] of [
      [MoveId.UP_SMASH, 12, 2, 3], [MoveId.DOWN_SMASH, 10, 3, 3],
    ] as const) {
      draw(move, startup - 1, charge, 0);
      draw(move, startup, charge, 1);
      draw(move, startup + firstHitLength - 1, charge, 1);
      draw(move, startup + firstHitLength, charge, 2);
      draw(move, startup + firstHitLength + secondHitLength - 1, charge, 2);
      draw(move, startup + firstHitLength + secondHitLength, charge, 3);
    }
  }
});

it('keeps Pack 03 counter success through the end of the move and resets it on exit', () => {
  const pose = (x: number) => ({ texture: Texture.EMPTY, root: [x, 0], offsetY: 28 });
  const pilot = new FullBodyPilot({ characters: { loopy: {
    down_special: { scale: 1, durations: [2, 4, 16], frames: [pose(0), pose(1), pose(2)] },
    counter_success: { scale: 1, durations: [3, 4, 5], frames: [pose(3), pose(4), pose(5)] },
  } } }, 'loopy', 'loopy');
  const draw = (age: number, x: number) => {
    expect(pilot.update('ATTACK', age, MoveId.DOWN_SPECIAL, true)).toBe(true);
    expect(pilot.sprite.pivot.x).toBe(x);
  };
  draw(0, 0);
  draw(2, 1);
  draw(6, 2);
  pilot.update('IDLE', 100, null, true);
  pilot.startCounterReaction(0);
  draw(0, 3);
  draw(2, 3);
  draw(3, 4);
  draw(7, 5);
  draw(20, 5);
  pilot.update('IDLE', 0, null, true);
  draw(0, 0);
});

it('uses the airborne registration through Pack 03 helpless fall, then plants the landing pose', () => {
  const pose = (x: number) => ({ texture: Texture.EMPTY, root: [x, 100], airRoot: [x, 40], offsetY: 28 });
  const pilot = new FullBodyPilot({ characters: { loopy: {
    helpless_enter: { scale: 0.5, frames: [pose(1)] },
    helpless_loop: { scale: 0.5, frames: [pose(2)] },
    helpless_land: { scale: 0.5, durations: [10, 4], frames: [pose(3), pose(4)] },
  } } }, 'loopy', 'loopy');
  for (const [state, age, clip, x, y, offset] of [
    ['HELPLESS', 0, 'helpless_enter', 1, 40, 0],
    ['HELPLESS', 5, 'helpless_enter', 1, 40, 0],
    ['HELPLESS', 6, 'helpless_loop', 2, 40, 0],
    ['HELPLESS_LAND', 0, 'helpless_land', 3, 100, 28],
    ['HELPLESS_LAND', 10, 'helpless_land', 4, 100, 28],
  ] as const) {
    expect(pilot.update(state, age, null, true)).toBe(true);
    expect(pilot.sprite.label).toBe(clip);
    expect(pilot.sprite.pivot.x).toBe(x);
    expect(pilot.sprite.pivot.y).toBe(y);
    expect(pilot.sprite.position.y).toBe(offset);
  }
});

it('shows Pack 03 parry poses from reaction age even after shield ends', () => {
  const frames = [0, 1, 2].map(index => ({ texture: Texture.EMPTY, root: [index, 30], offsetY: 28 }));
  const pilot = new FullBodyPilot({ characters: { loopy: {
    parry: { scale: 0.5, durations: [3, 5, 10], frames },
  } } }, 'loopy', 'loopy');
  for (const [state, age, drawing] of [['SHIELD', 0, 0], ['SHIELD', 2, 0],
    ['SHIELD', 3, 1], ['IDLE', 7, 1], ['IDLE', 8, 2]] as const) {
    expect(pilot.update(state, 30, null, true, 0, true, false, -1, 0, false, 1, 1, undefined, null,
      { shieldReaction: 'parry', shieldReactionFrame: age })).toBe(true);
    expect(pilot.sprite.label).toBe('parry');
    expect(pilot.sprite.pivot.x).toBe(drawing);
  }
});

it('uses the Pack 03 dodge window to switch poses and keeps backward roll art facing the fighter direction', () => {
  const frames = [0, 1, 2].map(index => ({
    texture: Texture.EMPTY, root: [index, 30], airRoot: [index, 20], offsetY: 28,
  }));
  const clip = { scale: 0.5, frames };
  const pilot = new FullBodyPilot({ characters: { loopy: {
    roll_back: clip, roll: clip, air_dodge_neutral: clip,
  } } }, 'loopy', 'loopy');
  for (const dodgeLevel of [0, 5]) {
    for (const [state, dodgeKind, name, facing, rollDirection] of [
      ['ROLL', 'backward', 'roll_back', -1, -1],
      ['ROLL', 'forward', 'roll', 1, 1],
      ['AIR_DODGE', 'air', 'air_dodge_neutral', 1, 1],
    ] as const) {
      const context = { dodgeLevel, dodgeKind, airDodgeDirection: state === 'AIR_DODGE' ? { x: 1, y: 0 } : undefined };
      const { intangibleStart, intangibleEnd } = dodgeTiming({ ...context, characterId: 'loopy', state });
      for (const [age, index] of [[intangibleStart - 1, 0], [intangibleStart, 1],
        [intangibleEnd - 1, 1], [intangibleEnd, 2]] as const) {
        expect(pilot.update(state, age, null, true, 0, true, false, facing, 0, false, rollDirection, 1,
          undefined, null, context)).toBe(true);
        expect(pilot.sprite.label).toBe(name);
        expect(pilot.sprite.pivot.x).toBe(index);
        expect(pilot.sprite.pivot.y).toBe(state === 'AIR_DODGE' ? 20 : 30);
        expect(pilot.sprite.scale.x).toBeGreaterThan(0);
      }
    }
  }
});

it('plays all eight Pack 03 directional air-dodge contacts in both facings and grounds their landing', () => {
  const pose = (index: number) => ({ texture: Texture.EMPTY, root: [index, 30], airRoot: [index, 20], offsetY: 28 });
  const directions = [
    ['air_dodge_side', 1, 0], ['air_dodge_back', -1, 0], ['air_dodge_up', 0, -1], ['air_dodge_down', 0, 1],
    ['air_dodge_up_diagonal', 1, -1], ['air_dodge_up_back', -1, -1],
    ['air_dodge_down_diagonal', 1, 1], ['air_dodge_down_back', -1, 1],
  ] as const;
  const landing = { scale: 0.5, durations: [2, 3, 3, 2], frames: [0, 1, 2, 3].map(pose) };
  const pilot = new FullBodyPilot({ characters: { loopy: {
    air_dodge_land: landing,
    ...Object.fromEntries(directions.map(([key], i) => [key, { scale: 0.5, frames: [pose(0), pose(i + 1), pose(9)] }])),
  } } }, 'loopy', 'loopy');
  for (const facing of [-1, 1] as const) {
    for (const [i, [key, x, y]] of directions.entries()) {
      const ctx = { dodgeKind: 'air' as const, airDodgeDirection: { x: facing * x, y } };
      const { intangibleStart, intangibleEnd } = dodgeTiming({ ...ctx, characterId: 'loopy', state: 'AIR_DODGE' });
      for (const [age, index] of [[intangibleStart - 1, 0], [intangibleStart, i + 1], [intangibleEnd, 9]] as const) {
        expect(pilot.update('AIR_DODGE', age, null, true, 0, true, false, 1, 0, false, 1, facing,
          undefined, null, ctx)).toBe(true);
        expect(pilot.sprite.label).toBe(key);
        expect(pilot.sprite.pivot.x).toBe(index);
        expect(pilot.sprite.pivot.y).toBe(20);
      }
    }
    for (const [age, index] of [[0, 0], [2, 1], [5, 2], [8, 3], [15, 3]] as const) {
      expect(pilot.update('LANDING_LAG', 0, null, true, 0, true, false, 1, 0, false, 1, facing,
        undefined, null, { artCue: 'air_dodge_land', artCueFrame: age })).toBe(true);
      expect(pilot.sprite.label).toBe('air_dodge_land');
      expect(pilot.sprite.pivot.x).toBe(index);
      expect(pilot.sprite.pivot.y).toBe(30);
      expect(pilot.sprite.y).toBe(28);
    }
  }
});

it('keeps the Pack 03 shield-break sequence airborne through contact and loops the grounded stagger', () => {
  const pose = (index: number) => ({ texture: Texture.EMPTY, root: [index, 30], airRoot: [index, 20], offsetY: 28 });
  const clip = (start: number, durations: number[]) => ({
    scale: 0.5, durations, frames: durations.map((_, index) => pose(start + index)),
  });
  const pilot = new FullBodyPilot({ characters: { loopy: {
    idle: clip(12, [1]),
    shield_break_launch: clip(0, [3, 6, 6, 8]),
    shield_break_dizzy: clip(4, [6, 6, 6, 6]),
    shield_break_recover: clip(8, [4, 5, 5, 4]),
  } } }, 'loopy', 'loopy');
  const draw = (shieldReactionFrame: number, isGrounded: boolean, hitstunFramesRemaining: number, index: number) => {
    expect(pilot.update('HITSTUN', 100, null, true, 0, true, false, 1, 0, false, 1, -1, undefined, null, {
      isGrounded, shieldReaction: 'break', shieldReactionFrame, hitstunFramesRemaining,
    })).toBe(true);
    expect(pilot.sprite.pivot.x).toBe(index);
    expect(pilot.sprite.pivot.y).toBe(isGrounded ? 30 : 20);
    expect(pilot.sprite.y).toBe(isGrounded ? 28 : 0);
  };
  draw(0, false, 150, 0);
  draw(3, false, 147, 1);
  draw(9, false, 141, 2);
  draw(25, false, 125, 3);
  draw(26, true, 124, 4);
  draw(32, true, 118, 5);
  draw(38, true, 112, 6);
  draw(44, true, 106, 7);
  draw(50, true, 100, 4);
  draw(132, true, 18, 8);
  draw(136, true, 14, 9);
  draw(141, true, 9, 10);
  draw(146, true, 4, 11);
  draw(149, true, 1, 11);
  expect(pilot.update('AIRBORNE', 0, null, true, 0, true, false, 1, 0, false, 1, -1, undefined, null, {
    isGrounded: true, shieldReaction: 'break', shieldReactionFrame: 151, hitstunFramesRemaining: 0,
  })).toBe(true);
  expect(pilot.sprite.label).toBe('idle');
  draw(0, false, 150, 0);
  draw(20, true, 130, 4);
});

it('holds the Pack 03 launch contact through hit freeze, then plays tumble from its own first frame', () => {
  const pose = (index: number) => ({ texture: Texture.EMPTY, root: [index, 50], airRoot: [index, 25], offsetY: 28 });
  const pilot = new FullBodyPilot({ characters: { loopy: {
    hit_launch: { scale: 0.5, durations: [4, 6], frames: [pose(0), pose(1)] },
    tumble: { scale: 0.5, durations: [4, 4, 4, 4], frames: [2, 3, 4, 5].map(pose) },
    hit_low: { scale: 0.5, durations: [7, 3], frames: [pose(6), pose(7)] },
  } } }, 'loopy', 'loopy');
  for (const facing of [-1, 1] as const) {
    for (const impactVx of [-6, 6]) {
      for (const [age, index] of [[0, 0], [0, 0], [3, 0], [4, 1], [9, 1],
        [10, 2], [14, 3], [18, 4], [22, 5], [26, 2]] as const) {
        expect(pilot.update('HITSTUN', age, null, true, 0, true, true, 1, 0, false, 1, facing,
          undefined, null, { impactVx, isTumbling: true })).toBe(true);
        expect(pilot.sprite.label).toBe(age < 10 ? 'hit_launch' : 'tumble');
        expect(pilot.sprite.pivot.x).toBe(index);
        expect(pilot.sprite.pivot.y).toBe(25);
        expect(pilot.sprite.y).toBe(0);
        expect(Math.sign(pilot.sprite.scale.x) * facing).toBe(-Math.sign(impactVx));
      }
    }
    expect(pilot.update('HITSTUN', 0, null, true, 0, true, false, 1, 0, false, 1, facing,
      undefined, null, { hitReaction: 'low' })).toBe(true);
    expect(pilot.sprite.label).toBe('hit_low');
    expect(pilot.sprite.pivot.y).toBe(50);
    expect(pilot.sprite.y).toBe(28);
  }
});

it('uses the Pack 03 recovery cue in the air and keeps each knockdown on its final pose through prone', () => {
  const pose = (index: number) => ({ texture: Texture.EMPTY, root: [index, 40], airRoot: [index, 25], offsetY: 28 });
  const clip = (indices: number[], durations: number[]) => ({ scale: 0.5, durations, frames: indices.map(pose) });
  const pilot = new FullBodyPilot({ characters: { loopy: {
    tumble_recover: clip([0, 1, 2, 3], [3, 3, 3, 3]),
    air_fall_loop: clip([4], [8]),
    idle: clip([5], [8]),
    knockdown_up: clip([6, 7, 8, 9], [2, 4, 6, 6]),
    prone_up: clip([9], [12]),
    knockdown_down: clip([10, 11, 12, 13], [2, 4, 6, 6]),
    prone_down: clip([13], [12]),
  } } }, 'loopy', 'loopy');
  for (const [age, index, isGrounded, label] of [
    [0, 0, false, 'tumble_recover'], [3, 1, false, 'tumble_recover'], [6, 2, false, 'tumble_recover'],
    [9, 3, false, 'tumble_recover'], [12, 4, false, 'air_fall_loop'], [5, 5, true, 'idle'],
  ] as const) {
    expect(pilot.update('AIRBORNE', 50, null, true, 4, true, false, 1, 0, false, 1, 1, undefined, null, {
      artCue: 'tumble_recover', artCueFrame: age, isGrounded,
    })).toBe(true);
    expect(pilot.sprite.label).toBe(label);
    expect(pilot.sprite.pivot.x).toBe(index);
  }
  for (const orientation of ['up', 'down'] as const) {
    const first = orientation === 'up' ? 6 : 10;
    for (const [age, index] of [[0, 0], [2, 1], [6, 2], [12, 3], [17, 3], [18, 3], [29, 3]] as const) {
      expect(pilot.update('HARD_LANDING', age, null, true, 0, true, false, 1, 0, false, 1, -1, undefined, null, {
        floorOrientation: orientation, isGrounded: true,
      })).toBe(true);
      expect(pilot.sprite.label).toBe((age < 18 ? 'knockdown_' : 'prone_') + orientation);
      expect(pilot.sprite.pivot.x).toBe(first + index);
      expect(pilot.sprite.pivot.y).toBe(40);
      expect(pilot.sprite.y).toBe(28);
    }
  }
});

it('carries the displayed prone frame into all Pack 03 get-up options', () => {
  const clip = (indices: number[], durations: number[]) => ({
    scale: 0.5, durations, frames: indices.map(index => ({ texture: Texture.EMPTY, root: [index, 30], offsetY: 28 })),
  });
  const attack = { ...clip([0, 1, 2, 3, 4, 5, 6], [1, 1, 4, 2, 2, 7, 7]), activeWindow: [6, 10] as [number, number] };
  const pilot = new FullBodyPilot({ characters: { loopy: {
    prone_down: clip([0, 1], [6, 6]),
    getup_down: clip([0, 1, 2, 3, 4, 5], [2, 2, 5, 6, 6, 5]),
    getup_roll_down: clip([0, 1, 2, 3, 4, 5], [2, 2, 2, 12, 5, 3]),
    floor_attack_down: attack,
  } } }, 'loopy', 'loopy');
  const draw = (state: string, age: number, index: number, move: MoveId | null = null) => {
    expect(pilot.update(state, age, move, true, 0, true, false, 1, 0, false, 1, 1, undefined, null,
      { floorOrientation: 'down', floorRollDirection: -1, isGrounded: true })).toBe(true);
    expect(pilot.sprite.pivot.x).toBe(index);
  };
  for (const [state, move] of [['GETUP', null], ['GETUP_ROLL', null], ['ATTACK', MoveId.FLOOR_ATTACK_DOWN]] as const) {
    draw('HARD_LANDING', 24, 1);
    draw(state, 0, 1, move);
    draw(state, 1, 1, move);
    draw(state, 2, 2, move);
  }
  draw('GETUP_ROLL', 4, 3);
  expect(pilot.sprite.scale.x).toBeLessThan(0);
  draw('GETUP_ROLL', 16, 4);
  expect(pilot.sprite.scale.x).toBeGreaterThan(0);
  draw('ATTACK', 6, 3, MoveId.FLOOR_ATTACK_DOWN);
  draw('ATTACK', 8, 4, MoveId.FLOOR_ATTACK_DOWN);
});
