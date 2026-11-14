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
    const cuts = Array.isArray(columnCuts?.[0]) ? columnCuts[row] : columnCuts;
    const x = cuts?.[column] ?? Math.floor(column * sheet.width / columns);
    const split = (Array.isArray(rowCut) ? rowCut[column] : rowCut) ?? Math.floor(sheet.height / 2);
    const y = row === 0 ? 0 : split;
    const width = (cuts?.[column + 1] ?? Math.floor((column + 1) * sheet.width / columns)) - x;
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

  const knockdownSheet = readSource(id + '-knockdown.png');
  const [uncurl, faceUp, faceDown] = registerSheet(id, 'knockdown',
    zane ? [270, 967, 1730] : [285, 991, 1780],
    knockdownSheet.height, 3, [0, 580, 1370]);
  const knockdownScale = zane ? 0.127 : 0.123;
  const knockdownPose = frame => ({ image: frame.image, scale: knockdownScale, frames: [frame] });
  Object.assign(clips, {
    tumble_recover: knockdownPose({
      ...uncurl,
      airRoot: [uncurl.root[0], uncurl.root[1] - (zane ? 270 : 233)],
    }),
    knockdown_up: knockdownPose(faceUp),
    knockdown_down: knockdownPose(faceDown),
  });

  const floor = registerSheet(id, 'prone',
    zane ? [319, 871, 378, 943] : [279, 910, 382, 950]);
  const floorScale = zane ? 0.143 : 0.146;
  for (const [index, orientation] of ['up', 'down'].entries()) {
    const hold = floor[index * 2];
    const rise = floor[index * 2 + 1];
    clips['prone_' + orientation] = { image: hold.image, scale: floorScale, frames: [hold] };
    clips['getup_' + orientation] = {
      image: rise.image, scale: floorScale,
      frames: [hold, rise, { ...crouch, scale: stanceScale }, { ...resting, scale: clips.idle.scale }],
      durations: [2, 6, 6, 5],
    };
  }

  const options = registerSheet(id, 'floor-options',
    zane ? [278, 787, 263, 721] : [313, 810, 245, 748],
    undefined, 2, [[0, 550], [0, 480]]);
  const optionScale = zane ? 0.13 : 0.128;
  for (const [index, orientation] of ['up', 'down'].entries()) {
    const [hold, rise, settle, stand] = clips['getup_' + orientation].frames;
    const roll = options[index * 2];
    const attack = options[index * 2 + 1];
    clips['getup_roll_' + orientation] = {
      image: roll.image, scale: floorScale,
      frames: [hold, rise, { ...roll, scale: optionScale }, settle, stand],
      durations: [2, 4, 9, 6, 5],
    };
    clips['floor_attack_' + orientation] = {
      image: attack.image, scale: floorScale,
      frames: [hold, rise, { ...attack, scale: optionScale },
        { ...attack, scale: optionScale, mirrorSource: true }, settle, stand],
      durations: [2, 4, 2, 2, 6, 5],
      activeWindow: [6, 10],
    };
  }

  const tech = registerSheet(id, 'tech',
    zane ? [333, 1000, 304, 965] : [302, 931, 280, 889]);
  const techScale = zane ? 0.147 : 0.140;
  const techPose = (index, belowPelvis) => {
    const frame = tech[index];
    return belowPelvis === undefined ? frame : {
      ...frame,
      airRoot: [frame.root[0], frame.root[1] - belowPelvis],
    };
  };
  const plantTech = techPose(0);
  const rollTech = techPose(1);
  const wallBrace = techPose(2, zane ? 194 : 220);
  const wallPush = techPose(3, zane ? 255 : 280);
  const techStand = { ...resting, scale: clips.idle.scale };
  const techCrouch = { ...crouch, scale: stanceScale };
  for (const [name, frames] of Object.entries({
    tech_neutral: [plantTech, plantTech, techCrouch, techStand],
    tech_roll: [plantTech, rollTech, rollTech, techCrouch, techStand],
    wall_tech: [wallBrace],
    wall_tech_jump: [wallBrace, wallBrace, wallPush, wallPush],
  })) {
    clips[name] = { image: frames[0].image, scale: techScale, frames };
  }

  const [ceiling, slip, seated, rise, lockUp, lockDown] = registerSheet(id, 'trip-tech',
    zane ? [234, 708, 1198, 206, 675, 1287] : [234, 689, 1164, 217, 680, 1249],
    513, 3, [[0, 478, 987], [0, 398, zane ? 975 : 930]]);
  const tripScale = zane ? 0.16 : 0.155;
  const tripPose = frames => ({ image: frames[0].image, scale: tripScale, frames });
  Object.assign(clips, {
    ceiling_tech: tripPose([{ ...ceiling, airRoot: [ceiling.root[0], ceiling.root[1] - (zane ? 203 : 204)] }]),
    trip_fall: tripPose([slip, slip, seated]),
    trip_prone: tripPose([seated]),
    trip_getup: tripPose([seated, rise, { ...resting, scale: clips.idle.scale }]),
    jab_lock_up: tripPose([lockUp, { ...clips.prone_up.frames[0], scale: floorScale }]),
    jab_lock_down: tripPose([lockDown, { ...clips.prone_down.frames[0], scale: floorScale }]),
  });

  const tripStand = { ...resting, scale: clips.idle.scale };
  const tripRoll = { ...options[2], scale: optionScale };
  const tripAttack = { ...options[1], scale: optionScale };
  clips.trip_roll = {
    ...tripPose([seated, rise, tripRoll, { ...crouch, scale: stanceScale }, tripStand]),
    durations: [2, 4, 9, 6, 5],
  };
  clips.floor_attack_trip = {
    ...tripPose([seated, rise, tripAttack, { ...crouch, scale: stanceScale }, tripStand]),
    durations: [2, 4, 4, 6, 5],
    activeWindow: [6, 10],
  };

  const [reach, hold, held, grabRelease] = registerSheet(id, 'grab',
    zane ? [250, 854, 319, 886] : [282, 869, 326, 865], zane ? 645 : 590);
  const grabScale = 82 / hold.rect[3];
  const socket = (frame, x, aboveFloor) => [frame.root[0] + x, frame.root[1] - aboveFloor];
  hold.sockets = { grabGrip: socket(hold, zane ? 217 : 207, zane ? 425 : 414) };
  held.sockets = {
    gripTop: socket(held, zane ? -53 : -42, zane ? 483 : 530),
    gripBottom: socket(held, zane ? -34 : -23, zane ? 431 : 477),
  };
  const grabPose = frames => ({ image: frames[0].image, scale: grabScale, frames });
  Object.assign(clips, {
    grab: { ...grabPose([{ ...resting, scale: clips.idle.scale }, reach, grabRelease]),
      durations: [3, 3, 6], activeWindow: [3, 6] },
    grab_hold: grabPose([hold]),
    grabbed: grabPose([held]),
    grab_release: grabPose([grabRelease, { ...resting, scale: clips.idle.scale }]),
  });
  clips.grab_dash = {
    ...grabPose([{ ...stride, scale: runScale }, reach, { ...brake, scale: runScale }]),
    durations: [4, 3, 8], activeWindow: [4, 7],
  };
  clips.grab_pivot = {
    ...grabPose([{ ...standingTurn, scale: stanceScale }, reach, grabRelease]),
    durations: [4, 3, 8], activeWindow: [4, 7],
  };

  const pummelSheet = readSource(id + '-pummel.png');
  const [strike, flinch] = registerSheet(id, 'pummel',
    zane ? [408, 1304] : [440, 1305], pummelSheet.height);
  const pummelScale = 82 / strike.rect[3];
  const strikeFrame = { ...strike, scale: pummelScale, sockets: {
    grabGrip: socket(strike, zane ? 308 : 258, zane ? 645 : 676),
  }};
  const flinchFrame = { ...flinch, scale: pummelScale, sockets: {
    gripTop: socket(flinch, zane ? 102 : 184, zane ? 538 : 594),
    gripBottom: socket(flinch, zane ? 118 : 194, zane ? 495 : 548),
  }};
  clips.pummel = {
    ...grabPose([hold, strikeFrame, hold]), durations: [3, 1, 6], activeWindow: [3, 4],
  };
  clips.pummel_victim = grabPose([flinchFrame, flinchFrame, held, held]);

  const throws = registerSheet(id, 'throws',
    zane ? [251, 932, 287, 883] : [278, 904, 318, 867], zane ? 640 : 590);
  const windups = registerSheet(id, 'throw-windup',
    zane ? [259, 875, 268, 882] : [286, 907, 287, 869]);
  const grips = zane ? [[90, 406], [-4, 413], [54, 529], [-25, 300]]
    : [[136, 411], [17, 405], [62, 573], [11, 332]];
  const windupScale = 82 / windups[0].rect[3];
  const between = registerSheet(id, 'throw-inbetween',
    zane ? [350, 1080, 1771] : [365, 1090, 1798],
    readSource(id + '-throw-inbetween.png').height, 3);
  const betweenGrips = zane ? [[138, 476], [145, 558], [140, 413]]
    : [[159, 475], [142, 563], [163, 429]];
  const betweenScale = 82 / between[0].rect[3];
  const throwScale = 82 / throws[0].rect[3];
  for (const [index, direction] of ['forward', 'back', 'up', 'down'].entries()) {
    const releaseFrame = { ...throws[index], scale: throwScale };
    const intermediate = between[index - 1];
    const transition = intermediate ? [{
      ...intermediate, scale: betweenScale,
      sockets: { grabGrip: socket(intermediate, ...betweenGrips[index - 1]) },
    }] : [];
    clips[direction + '_throw'] = {
      ...grabPose([hold, ...transition, { ...windups[index], scale: windupScale, sockets: {
        grabGrip: socket(windups[index], ...grips[index]),
      } }, releaseFrame, { ...resting, scale: clips.idle.scale }]),
      durations: intermediate ? [2, 2, 2, 1, 12] : [3, 3, 1, 12], activeWindow: [6, 7],
    };
  }
  {
    const thrown = registerSheet(id, 'throw-victim', zane ? [270, 956, 340, 894] : [263, 1123, 432, 1118], zane ? 550 : 440, 2, zane ? [[0, 635], [0, 520]] : undefined);
    const belowPelvis = zane ? [167, 177, 345, 127] : [160, 80, 310, 44];
    const scale = 0.13;
    const frames = thrown.map((frame, index) => ({
      ...frame,
      airRoot: [frame.root[0], frame.root[1] - belowPelvis[index]],
    }));
    clips.throw_victim = {
      image: frames[0].image, scale,
      frames: [...frames, frames[3], { ...clips.tumble.frames[0], scale: clips.tumble.scale }],
    };
  }

  const ledgeSheet = readSource(id + '-ledge.png');
  const ledge = registerSheet(id, 'ledge',
    zane ? [485, 1378] : [551, 1352], ledgeSheet.height);
  const ledgeScale = 0.102;
  const ledgeHands = zane ? [[103, 35], [62, 34]] : [[88, 26], [70, 24]];
  for (const [index, name] of ['ledge_catch', 'ledge_hang'].entries()) {
    const frame = ledge[index];
    const [handX, handY] = ledgeHands[index];
    frame.sockets = { ledgeGrip: [frame.root[0] + handX, handY] };
    clips[name] = { image: frame.image, scale: ledgeScale, frames: [frame] };
  }

  const [pull, leap, tuckRoll, ledgeStrike] = registerSheet(id, 'ledge-options',
    zane ? [257, 828, 242, 767] : [248, 805, 248, 739], 735, 2, [[0, 540], [0, 480]]);
  const climbScale = 0.129;
  const hang = { ...clips.ledge_hang.frames[0], scale: ledgeScale };
  const standLedge = { ...resting, scale: clips.idle.scale };
  const pullFrame = { ...pull, sockets: { ledgeGrip: [pull.root[0] + (zane ? 178 : 188), 28] } };
  const leapFrame = { ...leap, airRoot: [leap.root[0], leap.root[1] - (zane ? 195 : 191)] };
  const ledgeOptions = {
    ledge_climb: [hang, pullFrame, { ...crouch, scale: stanceScale }, standLedge],
    ledge_jump: [leapFrame],
    ledge_roll: [hang, pullFrame, tuckRoll, standLedge],
    ledge_attack: [hang, pullFrame, ledgeStrike, standLedge],
  };
  for (const [name, frames] of Object.entries(ledgeOptions)) {
    clips[name] = { image: frames[0].image, scale: climbScale, frames };
  }

  const fallFromLedge = {
    ...air[2], scale: airScale,
    airRoot: [air[2].root[0], Math.round(air[2].rect[3] * 0.54)],
  };
  const releaseTuck = { ...anchored[5], scale: aerialScale };
  const recoverySheet = registerSheet(id, 'recovery-special',
    zane ? [270, 742, 1240, 265, 770, 1244] : [257, 763, 1260, 260, 775, 1255], 503, 3);
  const [special_windup, special_strike, special_apex, special_helpless, special_fall, special_landing] = recoverySheet;
  const recoveryScale = 82 / special_strike.rect[3];
  const airborneFrame = frame => ({
    ...frame, airRoot: [frame.root[0], Math.round(frame.rect[3] * 0.54)],
  });
  for (const [name, frames] of Object.entries({
    up_special: [special_windup, special_windup, airborneFrame(special_strike), airborneFrame(special_strike), airborneFrame(special_apex), airborneFrame(special_apex)],
    helpless_enter: [airborneFrame(special_helpless), airborneFrame(special_fall)],
    helpless_loop: [airborneFrame(special_fall)],
    helpless_land: [special_landing, special_landing, standLedge],
  })) clips[name] = { image: frames[0].image, scale: recoveryScale, frames };
  const trumpRecoil = { ...clips.hit_air.frames[0], scale: clips.hit_air.scale };
  for (const [name, frames] of Object.entries({
    ledge_drop: [releaseTuck, fallFromLedge, fallFromLedge, fallFromLedge],
    ledge_trump: [trumpRecoil, trumpRecoil, releaseTuck, fallFromLedge],
  })) clips[name] = { image: frames[0].image, scale: airScale, frames };
  // Register the presentation cues with approved drawings pending dedicated art.
  const presentation = {
    entry: [standingTurn, standingTurn, resting, resting, resting, resting],
    respawn_wait: [air[3]], respawn_drop: [air[3], air[2], air[5]],
    taunt_up: [resting, special_strike, special_strike, special_strike, special_apex, resting],
    taunt_side: [resting, standingTurn, standingTurn, standingTurn, exhale, resting],
    taunt_down: [resting, crouch, crouch, crouch, exhale, resting],
    victory_1: [resting, special_strike, special_apex],
    victory_2: [resting, standingTurn, exhale],
    victory_3: [crouch, standingTurn, resting],
    defeat: [crouch],
    ko_launch: [trumpRecoil], ko_star: [special_helpless],
    ko_screen: [special_helpless],
  };
  for (const [name, frames] of Object.entries(presentation)) {
    clips[name] = { image: frames[0].image, scale: clips.idle.scale,
      frames: frames.map(frame => ({
        ...frame,
        scale: frame.scale ?? (recoverySheet.includes(frame) ? recoveryScale :
          air.includes(frame) ? airScale : frame === standingTurn || frame === crouch ? stanceScale : clips.idle.scale),
      })),
    };
  }
}
fs.writeFileSync(output + '/manifest.json', JSON.stringify({ version: 1, revision: 45, characters }, null, 2) + '\n');


