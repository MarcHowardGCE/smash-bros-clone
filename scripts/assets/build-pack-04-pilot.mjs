import fs from 'node:fs';
import { PNG } from 'pngjs';

const output = 'apps/client/public/fighter-art-pack-04-v1';
fs.mkdirSync(output, { recursive: true });
const characters = {};
function readSource(image) {
  return PNG.sync.read(fs.readFileSync('concept-art/sprite/pack-04/' + image));
}

function registerFrame(image, png = readSource(image), pivotX) {
  let left = png.width, top = png.height, right = 0, bottom = 0;
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      if (png.data[(y * png.width + x) * 4 + 3] < 128) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x + 1);
      bottom = Math.max(bottom, y + 1);
    }
  }
  if (right <= left || bottom <= top || left === 0 || right === png.width) {
    throw new Error('Invalid sprite bounds for ' + image);
  }
  const width = right - left, height = bottom - top;
  const cropped = new PNG({ width, height });
  PNG.bitblt(png, cropped, left, top, width, height, 0, 0);
  fs.writeFileSync(output + '/' + image, PNG.sync.write(cropped));
  return { image, rect: [0, 0, width, height], root: [pivotX === undefined ? width / 2 : pivotX - left, height] };
}

const walkPivots = {
  'zane-corvo': [246, 825, 252, 830],
  'velvet-reply': [287, 839, 280, 839],
};

const runPivots = {
  'zane-corvo': [270, 869, 267, 889],
  'velvet-reply': [322, 928, 324, 929],
};

function registerSheet(id, action, pivots, rowCut, columns = 2, columnCuts) {
  const sheet = readSource(id + '-' + action + '.png');
  return pivots.map((pivot, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = columnCuts?.[column] ?? Math.floor(column * sheet.width / columns);
    const split = (Array.isArray(rowCut) ? rowCut[column] : rowCut) ?? Math.floor(sheet.height / 2);
    const y = row === 0 ? 0 : split;
    const width = (columnCuts?.[column + 1] ?? Math.floor((column + 1) * sheet.width / columns)) - x;
    const height = row === 0 ? split : sheet.height - split;
    const cell = new PNG({ width, height });
    PNG.bitblt(sheet, cell, x, y, width, height, 0, 0);
    return registerFrame(id + '-' + action + '-' + index + '.png', cell, pivot - x);
  });
}

for (const [id, pivots] of Object.entries(walkPivots)) {
  const zane = id === 'zane-corvo';
  const [standingTurn, crouch, , takeoff] = registerSheet(id, 'stance',
    zane ? [290, 814, 282, 849] : [282, 793, 286, 855], zane ? 635 : undefined);
  const stanceScale = 82 / standingTurn.rect[3];
  const pose = frame => ({ image: frame.image, scale: stanceScale, frames: [frame] });
  const air = registerSheet(id, 'air', zane
    ? [234, 752, 1240, 238, 755, 1260]
    : [281, 760, 1248, 280, 748, 1249], undefined, 3);
  const airScale = 82 / Math.max(air[0].rect[3], air[2].rect[3]);
  const airPose = index => ({ image: air[index].image, scale: airScale, frames: [air[index]] });
  const strikes = registerSheet(id, 'strikes', zane
    ? [233, 742, 1260, 272, 746, 1159]
    : [248, 756, 1230, 192, 748, 1180], undefined, 3);
  const transitions = registerSheet(id, 'strike-transition', zane
    ? [271, 818, 277, 823] : [320, 941, 303, 925]);
  const transitionScale = 82 / Math.max(transitions[0].rect[3], transitions[1].rect[3]);
  const strikeScale = 82 / Math.max(...strikes.slice(0, 2).map(frame => frame.rect[3]));
  const walk = registerSheet(id, 'walk', pivots);
  const [stride, passing, brake, turn] = registerSheet(id, 'run', runPivots[id]);
  const runScale = 82 / Math.max(stride.rect[3], passing.rect[3]);
  const walkHeight = Math.max(...walk.map(frame => frame.rect[3]));
  const resting = registerFrame(id + '-idle.png');
  const exhale = registerFrame(id + '-idle-exhale.png');
  characters[id] = { clips: { idle: {
    image: resting.image,
    scale: 82 / resting.rect[3],
    durations: [24, 24],
    frames: [resting, exhale],
  }, walk: { image: walk[0].image, scale: 82 / walkHeight, durations: [5, 5, 5, 5], frames: walk },
    run: { image: stride.image, scale: runScale, durations: [4, 4], frames: [stride, passing] },
    brake: { image: brake.image, scale: runScale, frames: [brake] },
    turn_stand: pose(standingTurn),
    crouch_enter: pose(crouch),
    crouch_hold: pose(crouch),
    crouch_exit: pose(crouch),
    jump_squat: pose(crouch),
    air_rise_loop: airPose(0),
    air_apex_loop: airPose(1),
    air_fall_loop: airPose(2),
    double_jump_transition: airPose(3),
    air_fastfall_loop: airPose(4),
    land_soft: airPose(5),
    land_heavy: airPose(5),
    takeoff_neutral: pose(takeoff),
    turn_run: { image: turn.image, scale: runScale, frames: [turn] },
  } };
  const lowStrikeImage = id + '-down-tilt.png';
  const lowStrike = {
    ...registerFrame(lowStrikeImage, readSource(lowStrikeImage), zane ? 580 : 730),
    scale: zane ? 0.077 : 0.081,
  };
  const clipNames = ['jab', 'jab_2', 'jab_3', 'forward_tilt', 'up_tilt', 'down_tilt'];
  for (const [index, name] of clipNames.entries()) {
    const contact = name === 'down_tilt' ? lowStrike : strikes[index];
    characters[id].clips[name] = {
      image: contact.image,
      scale: strikeScale,
      durations: [3, 3, 6],
      activeWindow: [3, 6],
      frames: [
        { ...transitions[index === 3 ? 2 : 0], scale: transitionScale },
        contact,
        { ...transitions[index === 3 ? 3 : 1], scale: transitionScale },
      ],
    };
  }
  const power = registerSheet(id, 'power', zane
    ? [318, 969, 360, 879] : [265, 770, 246, 727], zane ? 550 : undefined);
  const powerScale = 82 / power[1].rect[3];
  const sweepImage = id + '-down-smash.png';
  const sweep = {
    ...registerFrame(sweepImage, readSource(sweepImage), zane ? 556 : 524),
    scale: 0.07,
  };
  const powerTransitions = registerSheet(id, 'power-transition', zane
    ? [235, 646, 1060, 1482, 222, 638, 1085, 1480]
    : [260, 634, 1085, 1487, 205, 638, 1059, 1484], undefined, 4);
  const powerTransitionScale = 82 / powerTransitions[1].rect[3];
  const powerClips = ['dash_attack', 'forward_smash', 'up_smash', 'down_smash'];
  for (const [index, name] of powerClips.entries()) {
    const contact = name === 'down_smash' ? sweep : power[index];
    const windup = { ...powerTransitions[index], scale: powerTransitionScale };
    const recovery = { ...powerTransitions[index + 4], scale: powerTransitionScale };
    characters[id].clips[name] = {
      image: contact.image,
      scale: powerScale,
      durations: [4, index === 3 ? 6 : 3, 8],
      activeWindow: [4, index === 3 ? 10 : 7],
      frames: index === 3 ? [windup, contact, { ...contact, mirrorSource: true }, recovery]
        : [windup, contact, recovery],
    };
    if (index === 3) characters[id].clips[name].durations = [4, 3, 3, 8];
  }

  const aerial = registerSheet(id, 'aerial', zane
    ? [205, 640, 1265, 207, 734, 1270]
    : [246, 710, 1285, 243, 750, 1260], zane ? [472, 470, 475] : [450, 431, 452], 3, [0, 480, 1005, 1536]);
  const aerialScale = 82 / (zane ? 470 : 490);
  const belowPelvis = zane ? [197, 170, 187, 211, 269, 141] : [177, 141, 185, 242, 257, 110];
  const anchored = aerial.map((frame, index) => ({
    ...frame,
    airRoot: [frame.root[0], frame.root[1] - belowPelvis[index]],
  }));
  const airTransitions = registerSheet(id, 'aerial-transition', zane ? [173, 555, 959, 1324, 1762, 168, 525, 1015, 1330, 1746] :
    [235, 617, 999, 1352, 1754, 232, 608, 998, 1348, 1753], undefined, 5);
  const pelvisAboveSole = zane ? [160, 159, 155, 160, 105, 170, 160, 135, 145, 145] : [174, 165, 173, 165, 90, 178, 180, 181, 177, 155];
  if (airTransitions) {
    const scale = 82 / airTransitions[0].rect[3];
    for (const [index, frame] of airTransitions.entries()) {
      frame.scale = scale;
      frame.airRoot = [frame.root[0], frame.root[1] - pelvisAboveSole[index]];
    }
  }
  const compactSheet = readSource(id + '-aerial-compact.png');
  const compact = registerSheet(id, 'aerial-compact',
    zane ? [326, 1020, 1715] : [635, 1495], compactSheet.height, zane ? 3 : 2);
  const pelvisHeights = zane ? [269, 260, 223] : [220, 297];
  const contactIndexes = zane ? [1, 3, 4] : [3, 4];
  for (const [index, frame] of compact.entries()) {
    anchored[contactIndexes[index]] = {
      ...frame,
      scale: zane ? 0.115 : 0.104,
      airRoot: [frame.root[0], frame.root[1] - pelvisHeights[index]],
    };
  }
  const names = ['neutral_air', 'forward_air', 'back_air', 'up_air', 'down_air'];
  for (const [index, name] of names.entries()) {
    const contact = anchored[index];
    const tuck = anchored[5];
    characters[id].clips[name] = {
      image: contact.image,
      scale: aerialScale,
      durations: [3, 3, 6],
      activeWindow: [3, 6],
      frames: [airTransitions?.[index] ?? tuck, contact, airTransitions?.[index + 5] ?? tuck],
    };
  }

  const [guard, parry, dodge, roll] = registerSheet(id, 'defense',
    zane ? [273, 833, 288, 884] : [313, 855, 327, 913]);
  const defenseScale = 82 / guard.rect[3];
  const defensePose = frame => ({ image: frame.image, scale: defenseScale, frames: [frame] });
  const shieldHeight = readSource(id + '-shield.png').height;
  const [raise, impact, release] = registerSheet(id, 'shield',
    zane ? [320, 970, 1610] : [380, 1100, 1815], shieldHeight, 3);
  const shieldScale = 82 / raise.rect[3];
  const shieldPose = frame => ({ image: frame.image, scale: shieldScale, frames: [frame] });
  Object.assign(characters[id].clips, {
    shield: defensePose(guard),
    shield_raise: shieldPose(raise),
    shield_hit: shieldPose(impact),
    shield_drop: shieldPose(release),
    parry: defensePose(parry),
    dodge: defensePose(dodge),
    roll: { ...defensePose(roll), frames: [
      { ...crouch, scale: stanceScale }, roll, { ...resting, scale: 82 / resting.rect[3] },
    ] },
  });

  const dodges = registerSheet(id, 'air-dodge',
    zane ? [248, 822, 288, 802] : [266, 888, 333, 865],
    undefined, 2, zane ? [0, 530] : undefined);
  const dodgePose = (index, pelvisAboveSole) => {
    const frame = dodges[index];
    return {
      image: frame.image,
      scale: zane ? 0.137 : 0.130,
      frames: [pelvisAboveSole === undefined ? frame : {
        ...frame,
        airRoot: [frame.root[0], frame.root[1] - pelvisAboveSole],
      }],
    };
  };
  Object.assign(characters[id].clips, {
    air_dodge_neutral: dodgePose(0, zane ? 150 : 166),
    air_dodge_side: dodgePose(1, zane ? 207 : 237),
    air_dodge_up: dodgePose(2, zane ? 220 : 184),
    air_dodge_land: dodgePose(3),
  });

  const directions = registerSheet(id, 'air-dodge-directions',
    zane ? [255, 720, 1290, 223, 735, 1280] : [266, 722, 1262, 259, 725, 1258],
    undefined, 3);
  const heights = zane ? [244, 220, 245, 253, 230, 209] : [252, 234, 245, 245, 234, 232];
  const directionalClips = ['air_dodge_down', 'air_dodge_back', 'air_dodge_up_diagonal',
    'air_dodge_up_back', 'air_dodge_down_diagonal', 'air_dodge_down_back'];
  for (const [index, name] of directionalClips.entries()) {
    const frame = directions[index];
    characters[id].clips[name] = {
      image: frame.image,
      scale: 82 / directions[0].rect[3],
      frames: [{
        ...frame,
        mirrorSource: index === 3,
        airRoot: [frame.root[0], frame.root[1] - heights[index]],
      }],
    };
  }

  // Use the existing protective tuck and aerial recovery for the shared bookends.
  const clips = characters[id].clips;
  const neutral = clips.air_dodge_neutral;
  const entry = { ...neutral.frames[0], scale: neutral.scale };
  const recovery = { ...anchored[5], scale: aerialScale };
  for (const name of ['air_dodge_neutral', 'air_dodge_side', 'air_dodge_up', ...directionalClips]) {
    const clip = clips[name];
    const [travel] = clip.frames;
    clip.frames = [entry, travel, travel, travel, recovery, recovery];
  }
  const landing = clips.air_dodge_land;
  const [plant] = landing.frames;
  const settle = { ...air[5], scale: airScale };
  const stand = { ...resting, scale: clips.idle.scale };
  landing.frames = [plant, plant, settle, settle, stand, stand];

  const reactions = registerSheet(id, 'reaction',
    zane ? [327, 899, 345, 830] : [335, 889, 348, 837], undefined, 2, [0, 610]);
  const reactionScale = 82 / reactions[0].rect[3];
  const reactionPose = (index, belowPelvis) => {
    const frame = reactions[index];
    return {
      image: frame.image,
      scale: reactionScale,
      frames: [belowPelvis === undefined ? frame : {
        ...frame,
        airRoot: [frame.root[0], frame.root[1] - belowPelvis],
      }],
    };
  };
  Object.assign(clips, {
    reaction: reactionPose(0),
    hit_mid: reactionPose(0),
    hit_air: reactionPose(1, zane ? 290 : 292),
    hit_launch: { ...reactionPose(2, zane ? 320 : 350), durations: [6] },
    tumble: reactionPose(3, zane ? 131 : 129),
  });
  const hitSheet = readSource(id + '-hit-variants.png');
  const variants = registerSheet(id, 'hit-variants',
    zane ? [420, 998, 1730] : [422, 1055, 1829], hitSheet.height, 3);
  for (const [index, name] of ['hit_high', 'hit_low', 'hit_heavy'].entries()) {
    const frame = variants[index];
    clips[name] = { image: frame.image, scale: 82 / variants[0].rect[3], frames: [frame] };
  }
}
fs.writeFileSync(output + '/manifest.json', JSON.stringify({ version: 1, revision: 25, characters }, null, 2) + '\n');


