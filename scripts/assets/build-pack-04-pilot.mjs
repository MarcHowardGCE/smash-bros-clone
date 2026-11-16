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
  const destination = output + '/' + image;
  const bytes = PNG.sync.write(cropped);
  if (!fs.existsSync(destination) || !fs.readFileSync(destination).equals(bytes)) {
    fs.writeFileSync(destination, bytes);
  }
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
  const runSheet = readSource(id + '-run-cycle.png');
  const runMid = Math.floor(runSheet.width / 2);
  const [plantNear, flyNear, plantFar, flyFar] = registerSheet(id, 'run-cycle',
    zane ? [287, runMid + 292, 241, runMid + 288] : [313, runMid + 296, 280, runMid + 295]);
  const runPose = (frame, lift = 0) => ({
    ...frame, scale: 76 / frame.rect[3], root: [frame.root[0], frame.root[1] + lift],
  });
  const runCycle = [runPose(plantNear), stride, runPose(flyNear, 18),
    runPose(plantFar), passing, runPose(flyFar, 18)];
  const walkSheet = readSource(id + '-walk-transfer.png');
  const transfers = registerSheet(id, 'walk-transfer',
    zane ? [530, 1375] : [526, 1300], walkSheet.height, 2);
  const walkCycle = [walk[0], transfers[1], walk[1], walk[2], transfers[0], walk[3]];
  const walkHeight = Math.max(...walk.map(frame => frame.rect[3]));
  const resting = registerFrame(id + '-idle.png');
  const exhale = registerFrame(id + '-idle-exhale.png');
  const idleSheet = readSource(id + '-idle-between.png');
  const idleMid = Math.floor(idleSheet.width / 2);
  const idleBetween = registerSheet(id, 'idle-between',
    [idleMid / 2, idleMid * 1.5], idleSheet.height).map(frame => ({
      ...frame, root: [frame.rect[2] / 2, frame.rect[3]], scale: 82 / frame.rect[3],
    }));
  characters[id] = { clips: { idle: {
    image: resting.image,
    scale: 82 / resting.rect[3],
    durations: [12, 12, 12, 12],
    frames: [resting, idleBetween[0], exhale, idleBetween[1]],
  }, walk: { image: walk[0].image, scale: 82 / walkHeight, durations: [3, 3, 4, 3, 3, 4], frames: walkCycle.map(frame => ({ ...frame, scale: 82 / frame.rect[3] })) },
    dash_start: { image: resting.image, scale: runScale, frames: [
      { ...resting, scale: 82 / resting.rect[3] }, passing, stride, passing, stride, passing,
    ] },
    jump: { image: takeoff.image, scale: airScale, frames: [
      { ...takeoff, scale: stanceScale }, air[0], air[1], air[2], air[3], air[5],
    ] },
    run: { image: stride.image, scale: runScale, durations: [2, 1, 1, 2, 1, 1], frames: runCycle },
    brake: { image: brake.image, scale: runScale, frames: [brake, { ...standingTurn, scale: stanceScale }, { ...resting, scale: 82 / resting.rect[3] }] },
    turn_stand: { ...pose(standingTurn), frames: [standingTurn, { ...resting, scale: 82 / resting.rect[3] }] },
    crouch_enter: pose(crouch),
    crouch_hold: pose(crouch),
    crouch_exit: pose(crouch),
    jump_squat: { ...pose(crouch), durations: [1, 2], frames: [takeoff, crouch] },
    air_rise_loop: { ...airPose(0), durations: [5, 5], frames: [air[0], air[1]] },
    air_apex_loop: { ...airPose(1), durations: [5, 5], frames: [air[1], air[2]] },
    air_fall_loop: { ...airPose(2), durations: [6, 6], frames: [air[2], air[2]] },
    double_jump_transition: { ...airPose(3), frames: [air[3], air[3], air[0], air[0], air[1], air[1]] },
    air_fastfall_loop: { ...airPose(4), durations: [4, 4, 4], frames: [air[4], air[4], air[4]] },


    takeoff_neutral: { ...pose(takeoff), frames: [takeoff, { ...air[0], scale: airScale }] },
    takeoff_forward: { ...airPose(0), frames: [
      { ...takeoff, scale: stanceScale }, air[0],
    ] },
    takeoff_backward: { ...airPose(3), frames: [
      { ...takeoff, scale: stanceScale }, air[3],
    ] },
    turn_run: { image: turn.image, scale: runScale, frames: [turn, stride] },
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
  const jab = characters[id].clips.jab;
  const [jabWindup, jabContact, jabRecoil] = jab.frames;
  jab.frames = [
    { ...resting, scale: characters[id].clips.idle.scale },
    jabWindup, { ...transitions[2], scale: transitionScale },
    jabContact, jabContact,
    jabRecoil, { ...transitions[3], scale: transitionScale },
    { ...exhale, scale: characters[id].clips.idle.scale },
    { ...resting, scale: characters[id].clips.idle.scale },
  ];
  {
    const sheet = readSource(id + '-jab-detail.png');
    const [extension, retract] = registerSheet(id, 'jab-detail', zane ? [550, 1545] : [422, 1321], sheet.height);
    const alignJab = (frame, scale, shift) => ({
      ...frame, scale, root: [frame.root[0] - shift / scale, frame.root[1]],
    });
    jab.frames[3] = alignJab(jabContact, jab.scale, zane ? 3 : 6);
    jab.frames[4] = alignJab(extension, 82 / extension.rect[3], 8);
    jab.frames[0] = { ...retract, scale: 82 / retract.rect[3] };
  }
  jab.durations = [1, 1, 1, 1, 1, 1, 1, 1, 6];
  jab.activeWindow = [3, 5];
  for (const [name, startup, active] of [['jab_2', 3, 2], ['jab_3', 4, 3]]) {
    const clip = characters[id].clips[name];
    const [windup, contact, recoil] = clip.frames;
    clip.frames = [
      windup, { ...transitions[2], scale: transitionScale }, contact,
      recoil, { ...transitions[3], scale: transitionScale },
      { ...resting, scale: characters[id].clips.idle.scale },
    ];
    clip.durations = [startup - 1, 1, active, 1, 1, 6];
    clip.activeWindow = [startup, startup + active];
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
  const rearImage = id + '-down-smash-rear.png';
  const rearSweep = { ...registerFrame(rearImage, readSource(rearImage), zane ? 520 : 490), scale: zane ? .074 : .078, mirrorSource: true };
  const powerClips = ['dash_attack', 'forward_smash', 'up_smash', 'down_smash'];
  for (const [index, name] of powerClips.entries()) {
    const contact = name === 'down_smash' ? sweep : power[index];
    const windup = { ...powerTransitions[index], scale: powerTransitionScale };
    const recovery = { ...powerTransitions[index + 4], scale: powerTransitionScale };
    characters[id].clips[name] = {
      image: contact.image,
      scale: powerScale,
      durations: index === 3 ? [4, 3, 3, 8] : [2, 2, 3, 8],
      activeWindow: [4, index === 3 ? 10 : 7],
      frames: index === 3 ? [windup, contact, rearSweep, recovery]
        : [{ ...resting, scale: characters[id].clips.idle.scale }, windup, contact, recovery],
    };

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
  const guardIdle = { ...resting, scale: characters[id].clips.idle.scale };
  const guardLow = { ...crouch, scale: stanceScale };
  const guardUp = { ...raise, scale: shieldScale };
  const guardDown = { ...release, scale: shieldScale };
  const [guardStart, guardLift, guardBrace, guardTuck] = registerSheet(
    id, 'guard-cycle', zane ? [278, 850, 279, 850] : [278, 818, 278, 818], 660,
  ).map(frame => ({ ...frame, scale: 82 / frame.rect[3] }));
  const guardHold = { ...guard, scale: defensePose(guard).scale };
  Object.assign(characters[id].clips, {
    shield: { ...defensePose(guard), frames: [guardHold, guardTuck] },
    shield_raise: { ...shieldPose(raise), frames: [guardIdle, guardStart, guardLift, guardBrace, guardTuck, guardHold] },
    shield_hit: { ...shieldPose(impact), frames: [impact, guardUp, guardHold] },
    shield_drop: { ...shieldPose(release), frames: [guardHold, guardDown, guardBrace, guardLift, guardStart, guardIdle] },
    parry: { ...defensePose(parry), frames: [parry, guardDown, guardIdle] },
    dodge: { ...defensePose(dodge), frames: [guardLow, dodge, guardIdle] },
    roll: { ...defensePose(roll), frames: [
      { ...crouch, scale: stanceScale }, roll, { ...resting, scale: 82 / resting.rect[3] },
    ] },
  });

  characters[id].clips.roll_back = {
    ...characters[id].clips.roll,
    frames: characters[id].clips.roll.frames.map((frame, index) =>
      index === 1 ? { ...frame, mirrorSource: true } : frame),
  };
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
  const dodgeDetail = readSource(id + '-dodge-detail.png');
  const [tuck, recoverDodge] = registerSheet(id, 'dodge-detail',
    zane ? [468, 1208] : [456, 1280], dodgeDetail.height);
  const tuckFrame = { ...tuck, scale: 72 / tuck.rect[3],
    airRoot: [tuck.root[0], Math.round(tuck.rect[3] * 0.56)] };
  neutral.frames = [entry, tuckFrame, tuckFrame, tuckFrame, recovery, recovery];
  landing.frames = [plant, plant, settle, { ...recoverDodge, scale: 76 / recoverDodge.rect[3] }, stand, stand];

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

  const reactionFrame = name => ({ ...clips[name].frames[0], scale: clips[name].scale });
  const midRecoil = reactionFrame('hit_mid');
  const airRecoil = reactionFrame('hit_air');
  const launchRecoil = reactionFrame('hit_launch');
  const tumbleTuck = reactionFrame('tumble');
  const uncurlPose = reactionFrame('tumble_recover');
  for (const name of ['hit_mid', 'hit_high', 'hit_low', 'hit_heavy']) {
    const impact = reactionFrame(name);
    clips[name].frames = [impact, impact, midRecoil, { ...crouch, scale: stanceScale }];
  }
  clips.hit_heavy.frames.splice(2, 0, reactionFrame('hit_high'), reactionFrame('hit_low'));
  clips.hit_air.frames = [airRecoil, airRecoil, launchRecoil, launchRecoil, tumbleTuck, tumbleTuck];
  clips.hit_launch.frames = [launchRecoil, airRecoil];
  clips.hit_launch.durations = [4, 2];
  clips.tumble.frames = [tumbleTuck, airRecoil, tumbleTuck, uncurlPose];
  clips.tumble.durations = [3, 3, 3, 3];
  clips.tumble_recover.frames = [tumbleTuck, uncurlPose, uncurlPose, airRecoil, uncurlPose, uncurlPose];
  {
    const [compress, straighten, high, low, heavy, tuck] = registerSheet(
      id, 'recoil-detail', zane ? [271, 763, 1251, 267, 768, 1265] : [255, 749, 1280, 253, 790, 1268], 500, 3,
    ).map((frame, index) => ({ ...frame, scale: (index === 5 ? 58 : 79) / frame.rect[3] }));
    {
      const [arch, curl, stagger, open, balance, descent] = registerSheet(
        id, 'air-recoil-detail', zane ? [308, 730, 1230, 225, 711, 1223] : [297, 734, 1283, 244, 769, 1255], 475, 3,
        zane ? [[0, 512, 1024], [0, 480, 1024]] : undefined,
      ).map((frame, index) => ({
        ...frame, scale: (index === 3 ? 59 : 76) / frame.rect[3],
        airRoot: [frame.root[0], Math.round(frame.rect[3] * .55)],
      }));
      clips.hit_air.frames = [airRecoil, arch, launchRecoil, curl, tumbleTuck, stagger];
      clips.tumble_recover.frames = [tumbleTuck, open, uncurlPose, airRecoil, balance, descent];
    }
    clips.hit_mid.frames[1] = compress;
    clips.hit_mid.frames[2] = straighten;
    clips.hit_high.frames[1] = high;
    clips.hit_low.frames[1] = low;
    clips.hit_heavy.frames[1] = heavy;
    clips.tumble.frames[2] = { ...tuck, airRoot: [tuck.root[0], Math.round(tuck.rect[3] * .55)] };
  }
  const floor = registerSheet(id, 'prone',
    zane ? [319, 871, 378, 943] : [279, 910, 382, 950]);
  const proneDetail = registerSheet(id, 'prone-detail',
    zane ? [299, 887, 1473, 327, 925, 1494] : [257, 851, 1441, 355, 950, 1535], undefined, 3);
  const settleSheet = readSource(id + '-knockdown-settle.png');
  const rebounds = registerSheet(id, 'knockdown-settle',
    zane ? [502, 1730] : [454, 1705], settleSheet.height);
  const floorScale = zane ? 0.143 : 0.146;
  for (const [index, orientation] of ['up', 'down'].entries()) {
    const hold = floor[index * 2];
    const rise = floor[index * 2 + 1];
    const knockdown = clips['knockdown_' + orientation];
    const impact = knockdown.frames[0];
    const settled = { ...hold, scale: floorScale };
    const settling = proneDetail.slice(index * 3, index * 3 + 3).map(frame => ({
      ...frame, scale: floorScale * hold.rect[2] / frame.rect[2],
    }));
    const rebound = rebounds[index];
    knockdown.frames = [impact, { ...rebound, scale: floorScale * hold.rect[2] / rebound.rect[2] }, ...settling, settled];
    clips['prone_' + orientation] = { image: hold.image, scale: floorScale, frames: [hold, ...settling] };
    clips['getup_' + orientation] = {
      image: rise.image, scale: floorScale,
      frames: [hold, rise, { ...crouch, scale: stanceScale }, idleBetween[0], { ...exhale, scale: clips.idle.scale }, { ...resting, scale: clips.idle.scale }],
      durations: [2, 6, 6, 2, 1, 2],
    };
  }

  const options = registerSheet(id, 'floor-options',
    zane ? [278, 787, 263, 721] : [313, 810, 245, 748],
    undefined, 2, [[0, 550], [0, 480]]);
  const optionScale = zane ? 0.13 : 0.128;
  for (const [index, orientation] of ['up', 'down'].entries()) {
    const [hold, rise, settle, , recover, stand] = clips['getup_' + orientation].frames;
    const roll = options[index * 2];
    const attack = options[index * 2 + 1];
    const rearSweep = options[(1 - index) * 2 + 1];
    clips['getup_roll_' + orientation] = {
      image: roll.image, scale: floorScale,
      frames: [hold, rise, { ...roll, scale: optionScale }, settle, recover, stand],
      durations: [2, 4, 9, 6, 2, 3],
    };
    clips['floor_attack_' + orientation] = {
      image: attack.image, scale: floorScale,
      frames: [hold, rise, { ...attack, scale: optionScale },
        { ...rearSweep, scale: optionScale, mirrorSource: true }, settle, recover, stand],
      durations: [2, 4, 2, 2, 6, 2, 3],
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
  const brace = techPose(2, zane ? 194 : 220);
  const wallBrace = { ...brace, airRoot: [brace.rect[2] - 2, brace.airRoot[1]] };
  const wallPush = techPose(3, zane ? 255 : 280);
  const braceShift = wallBrace.airRoot[0] - wallBrace.root[0];
  const pushFromWall = weight => ({
    ...wallPush,
    airRoot: [wallPush.airRoot[0] + braceShift * weight, wallPush.airRoot[1]],
  });
  const wallTransition = (frame, weight) => ({
    ...frame,
    airRoot: [
      frame.root[0] + braceShift * weight * techScale / frame.scale,
      frame.airRoot?.[1] ?? Math.round(frame.rect[3] * 0.55),
    ],
  });
  const techStand = { ...resting, scale: clips.idle.scale };
  const techCrouch = { ...crouch, scale: stanceScale };
  for (const [name, frames] of Object.entries({
    tech_neutral: [plantTech, plantTech, techCrouch, techCrouch, idleBetween[0], techStand],
    tech_roll: [plantTech, rollTech, rollTech, techCrouch, idleBetween[0], techStand],
    wall_tech: [wallBrace, wallBrace, wallBrace, wallTransition(tumbleTuck, 2 / 3), wallTransition(uncurlPose, 1 / 3), wallPush],
    wall_tech_jump: [wallBrace, wallBrace, pushFromWall(2 / 3), pushFromWall(1 / 3), airRecoil, uncurlPose],
  })) {
    clips[name] = { image: frames[0].image, scale: techScale, frames };
  }

  const [ceiling, slip, seated, rise, lockUp, lockDown] = registerSheet(id, 'trip-tech',
    zane ? [234, 708, 1198, 206, 675, 1287] : [234, 689, 1164, 217, 680, 1249],
    513, 3, [[0, 478, 987], [0, 398, zane ? 975 : 930]]);
  const tripScale = zane ? 0.16 : 0.155;
  const tripPose = frames => ({ image: frames[0].image, scale: tripScale, frames });
  const tripDetail = registerSheet(id, 'trip-detail',
    zane ? [220, 648, 1055, 1506, 190, 633, 1065, 1522] : [270, 822, 1328, 1850, 222, 771, 1314, 1880],
    zane ? 480 : 390, 4,
  ).map((frame, index) => ({
    ...frame, scale: [82, 72, 65, 58, 56, 56, 56, 63][index] / frame.rect[3],
  }));
  const [flail, lean, fold, catchFloor, seatA, seatB, seatC, braceRise] = tripDetail;
  const jabLock = (orientation, impact) => {
    const [hold, settle] = clips['prone_' + orientation].frames;
    const rebound = clips['knockdown_' + orientation].frames[1];
    return tripPose([impact, rebound, settle, { ...hold, scale: floorScale }]);
  };
  Object.assign(clips, {
    ceiling_tech: tripPose([
      ...Array.from({ length: 3 }, () => ({ ...ceiling, airRoot: [ceiling.root[0], 28 / tripScale] })),
      airRecoil, airRecoil, uncurlPose,
    ]),
    trip_fall: tripPose([slip, flail, lean, fold, catchFloor, seated]),
    trip_prone: tripPose([seated, seatA, seatB, seatC]),
    trip_getup: tripPose([seated, rise, braceRise, { ...crouch, scale: stanceScale }, idleBetween[0], { ...resting, scale: clips.idle.scale }]),
    jab_lock_up: jabLock('up', lockUp),
    jab_lock_down: jabLock('down', lockDown),
  });

  const tripStand = { ...resting, scale: clips.idle.scale };
  const tripRecover = { ...exhale, scale: clips.idle.scale };
  const tripRoll = { ...options[2], scale: optionScale };
  const tripAttack = { ...options[1], scale: optionScale };
  clips.trip_roll = {
    ...tripPose([seated, rise, tripRoll, { ...crouch, scale: stanceScale }, tripRecover, tripStand]),
    durations: [2, 4, 9, 6, 2, 3],
  };
  clips.floor_attack_trip = {
    ...tripPose([seated, rise, tripAttack, { ...options[3], scale: optionScale, mirrorSource: true }, { ...crouch, scale: stanceScale }, tripRecover, tripStand]),
    durations: [2, 4, 2, 2, 6, 2, 3],
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
  const extension = registerFrame(id + '-grab-extension.png', undefined, zane ? 520 : 540);
  const grabExtension = { ...extension, scale: grabScale * reach.rect[3] / extension.rect[3] };
  const grabPose = frames => ({ image: frames[0].image, scale: grabScale, frames });
  Object.assign(clips, {
    grab: { ...grabPose([techStand, idleBetween[0], reach, grabExtension, grabRelease, idleBetween[1]]),
      durations: [1, 2, 1, 2, 2, 4], activeWindow: [3, 6] },
    grab_hold: grabPose([hold, hold, hold, hold]),
    grabbed: grabPose([held, held, held, held]),
    grab_release: grabPose([reactionFrame('hit_high'), { ...standingTurn, scale: stanceScale }, idleBetween[0], techStand]),
  });
  clips.grab_dash = {
    ...grabPose([{ ...stride, scale: runScale }, { ...passing, scale: runScale }, reach, grabExtension, { ...brake, scale: runScale }, techStand]),
    durations: [2, 2, 1, 2, 4, 4], activeWindow: [4, 7],
  };
  clips.grab_pivot = {
    ...grabPose([{ ...standingTurn, scale: stanceScale }, idleBetween[0], reach, grabExtension, grabRelease, techStand]),
    durations: [2, 2, 1, 2, 4, 4], activeWindow: [4, 7],
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
  const pair = registerSheet(id, 'grab-pair-detail',
    zane ? [220, 660, 1098, 1544, 249, 685, 1126, 1575] : [221, 650, 1093, 1533, 241, 673, 1121, 1572], 443, 4)
    .map((frame, index) => ({ ...frame, scale: [82, 79, 79, 79, 82, 79, 75, 78][index] / frame.rect[3] }));
  const holderGrips = zane ? [[124, 292], [126, 281], [130, 280], [130, 282]]
    : [[125, 332], [141, 322], [140, 323], [143, 325]];
  const victimGrips = zane ? [[-30, 322], [0, 304], [-29, 286], [-22, 303]]
    : [[-24, 328], [-3, 318], [-27, 310], [-20, 311]];
  const holderPoses = pair.slice(0, 4).map((frame, index) => ({
    ...frame, sockets: { grabGrip: socket(frame, ...holderGrips[index]) },
  }));
  const victimPoses = pair.slice(4).map((frame, index) => {
    const [x, height] = victimGrips[index];
    return { ...frame, sockets: {
      gripTop: socket(frame, x, height),
      gripBottom: socket(frame, x + 10, height - 29),
    } };
  });
  clips.grab_hold.frames = [hold, holderPoses[0], holderPoses[1], holderPoses[3]];
  clips.grabbed.frames = [held, victimPoses[0], victimPoses[1], victimPoses[3]];
  clips.pummel = {
    ...grabPose([hold, holderPoses[2], strikeFrame, holderPoses[3], holderPoses[1], holderPoses[0]]), durations: [1, 2, 1, 2, 2, 2], activeWindow: [3, 4],
  };
  clips.pummel_victim = grabPose([flinchFrame, victimPoses[2], victimPoses[3], held]);

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
      } }, releaseFrame, ...(direction === 'forward' ? [{ ...grabRelease, scale: grabScale }] : []), { ...resting, scale: clips.idle.scale }]),
      durations: intermediate ? [2, 2, 2, 1, 12] : [3, 3, 1, 4, 8], activeWindow: [6, 7],
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
    const tumble = { ...clips.tumble.frames[0], scale: clips.tumble.scale };
    for (const [index, direction] of ['back', 'up', 'down'].entries()) {
      const release = frames[index + 1];
      clips[direction + '_throw_victim_preview'] = {
        image: release.image, scale, durations: [6, 6, 6, 6],
        frames: direction === 'down'
          ? [release, airRecoil, tumble, uncurlPose]
          : [release, tumble, clips.tumble.frames[2], uncurlPose],
      };
    }
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
  const catchFrame = clips.ledge_catch.frames[0];
  clips.ledge_catch.frames = [catchFrame, catchFrame, hang, hang];
  const ledgeCrouch = { ...crouch, scale: stanceScale };
  const ledgeRise = {
    ...air[0], scale: airScale,
    airRoot: [air[0].root[0], Math.round(air[0].rect[3] * 0.54)],
  };
  const ledgeOptions = {
    ledge_climb: [hang, pullFrame, ledgeCrouch, ledgeCrouch, idleBetween[0], standLedge],
    ledge_jump: [leapFrame, leapFrame, leapFrame, ledgeRise, ledgeRise, { ...air[1], scale: airScale,
      airRoot: [air[1].root[0], Math.round(air[1].rect[3] * 0.54)] }],
    ledge_roll: [hang, pullFrame, tuckRoll, tuckRoll, ledgeCrouch, standLedge],
    ledge_attack: [hang, pullFrame, ledgeStrike, ledgeStrike, ledgeCrouch, standLedge],
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
  clips.land_soft = {
    ...airPose(5), frames: [air[5], { ...takeoff, scale: stanceScale }, standLedge],
  };
  clips.land_heavy = {
    ...airPose(5), frames: [
      { ...special_landing, scale: recoveryScale }, { ...crouch, scale: stanceScale }, standLedge,
    ],
  };
  const crouchLow = { ...crouch, scale: stanceScale };
  const crouchBrace = { ...special_windup, scale: recoveryScale };
  const crouchSettle = { ...special_landing, scale: recoveryScale };
  Object.assign(clips, {
    crouch_enter: { ...pose(crouch), frames: [standLedge, crouchBrace, crouchSettle, crouchLow, crouchLow, crouchLow] },
    crouch_hold: { ...pose(crouch), frames: [crouchLow, crouchLow, crouchSettle, crouchLow] },
    crouch_exit: { ...pose(crouch), frames: [crouchLow, crouchSettle, crouchBrace, standLedge, standLedge, standLedge] },
  });
  const trumpRecoil = { ...clips.hit_air.frames[0], scale: clips.hit_air.scale };
  for (const [name, frames] of Object.entries({
    ledge_drop: [releaseTuck, fallFromLedge, fallFromLedge, fallFromLedge],
    ledge_trump: [trumpRecoil, trumpRecoil, releaseTuck, fallFromLedge],
  })) clips[name] = { image: frames[0].image, scale: airScale, frames };
  const stanceFrame = frame => ({ ...frame, scale: stanceScale });
  Object.assign(clips, {
    platform_drop: { image: crouch.image, scale: airScale,
      frames: [stanceFrame(crouch), air[2], air[2]] },
    teeter_front: { image: standingTurn.image, scale: stanceScale,
      frames: [stanceFrame(standingTurn), stanceFrame(crouch), stanceFrame(standingTurn), standLedge] },
    teeter_back: { image: brake.image, scale: runScale,
      frames: [brake, stanceFrame(standingTurn), brake, standLedge] },
  });
  const footstoolSheet = readSource(id + '-footstool.png');
  const footstoolCuts = [0, 750, 1450, footstoolSheet.width];
  const footstoolSockets = zane ? [[310, 551], [251, 5], [426, 17]]
    : [[398, 579], [250, 5], [480, 110]];
  const footstoolRoles = ['footstool_attacker', 'footstool_ground_victim', 'footstool_air_victim'];
  for (const [index, name] of footstoolRoles.entries()) {
    const x = footstoolCuts[index];
    const cell = new PNG({ width: footstoolCuts[index + 1] - x, height: footstoolSheet.height });
    PNG.bitblt(footstoolSheet, cell, x, 0, cell.width, cell.height, 0, 0);
    const pose = registerFrame(id + '-' + name + '.png', cell);
    const socket = index === 0 ? 'footstoolSole' : 'footstoolHead';
    const [sx, sy] = footstoolSockets[index];
    clips[name] = { image: pose.image, scale: 0.14, frames: [{
      ...pose, sockets: { [socket]: [Math.min(sx, pose.rect[2] - 1), Math.min(sy, pose.rect[3] - 1)] },
    }] };
  }
  // Retain the authored contact drawing and its measured socket. Follow through
  // with costume-matched drawings from the existing movement and reaction sets.
  const withFootstoolSocket = (frame, socket, x, y) => ({
    ...frame, sockets: { ...frame.sockets, [socket]: [Math.round(x), y] },
  });
  const attackFollowThrough = [air[3], air[0], air[1], air[2], air[4]]
    .map(frame => withFootstoolSocket({ ...frame, scale: airScale },
      'footstoolSole', frame.root[0], frame.rect[3] - 1));
  const airborneRecoil = [
    clips.hit_air.frames[3], clips.tumble.frames[2], clips.tumble_recover.frames[2],
    clips.tumble_recover.frames[4], clips.tumble_recover.frames[5],
  ].map(frame => withFootstoolSocket(frame, 'footstoolHead', frame.root[0], 0));
  const groundedRecoil = [
    guardLow, crouchBrace, crouchSettle, { ...resting, scale: clips.idle.scale },
    { ...exhale, scale: clips.idle.scale },
  ].map(frame => withFootstoolSocket(frame, 'footstoolHead', frame.root[0], 0));
  clips.footstool_attacker.frames.push(...attackFollowThrough);
  clips.footstool_air_victim.frames.push(...airborneRecoil);
  clips.footstool_ground_victim.frames.push(...groundedRecoil);
  const breakSheet = readSource(id + '-shield-break.png');
  const breakCuts = [0, 800, 1448, breakSheet.width];
  const breakFrames = ['shield_break_launch', 'shield_break_dizzy', 'shield_break_recover'];
  for (const [index, name] of breakFrames.entries()) {
    const x = breakCuts[index];
    const cell = new PNG({ width: breakCuts[index + 1] - x, height: breakSheet.height });
    PNG.bitblt(breakSheet, cell, x, 0, cell.width, cell.height, 0, 0);
    const pose = registerFrame(id + '-' + name + '.png', cell);
    clips[name] = { image: pose.image, scale: 82 / pose.rect[3],
      frames: [
        [airborneFrame(pose), launchRecoil, airRecoil, uncurlPose],
        [pose, techCrouch, idleBetween[1], idleBetween[0]],
        [pose, techCrouch, idleBetween[0], standLedge],
      ][index] };
  }
  const specialSheet = readSource(id + '-specials.png');
  const half = Math.floor(specialSheet.width / 2);
  const specials = registerSheet(id, 'specials', [half * .45, half * 1.57, half * .47, half * 1.55],
    zane ? 600 : 575);
  for (const [index, name] of ['neutral_special', 'side_special', 'down_special', 'counter_success'].entries()) {
    const pose = specials[index];
    const scale = 82 / specials[0].rect[3];
    const action = { ...pose, scale };
    clips[name] = { image: pose.image, scale,
      frames: index === 3 ? [action, idleBetween[0], standLedge] :
        [standLedge, [idleBetween[0], stanceFrame(standingTurn), stanceFrame(crouch)][index], action, action, action, standLedge] };
  }
  const sheet = readSource(id + '-presentation.png');
  const presentationFrames = Array.from({ length: 12 }, (_, index) => {
    const width = sheet.width / 4;
    const height = sheet.height / 3;
    const cell = new PNG({ width, height });
    PNG.bitblt(sheet, cell, (index % 4) * width, Math.floor(index / 4) * height, width, height, 0, 0);
    for (let alpha = 3; alpha < cell.data.length; alpha += 4) {
      if (cell.data[alpha] < 128) cell.data.fill(0, alpha - 3, alpha + 1);
    }
    const frame = registerFrame(id + '-presentation-' + index + '.png', cell);
    return { ...frame, scale: 82 / (index === 1 ? 342 : frame.rect[3]) };
  });
  const [entrance, respawn, tauntUp, tauntSide, tauntDown, winOne, winTwo, winThree,
    defeat, launch, screen, star] = presentationFrames;
  const taunt = gesture => [standLedge, idleBetween[0], gesture, gesture, idleBetween[1], standLedge];
  const victory = gesture => [standLedge, idleBetween[0], gesture, gesture, gesture, gesture];
  const presentation = {
    entry: [entrance, entrance, entrance, idleBetween[0], standLedge, standLedge],
    respawn_wait: [respawn], respawn_drop: [respawn, respawn, airborneFrame(air[2]), { ...air[5], scale: airScale }, standLedge, standLedge],
    taunt_up: taunt(tauntUp), taunt_side: taunt(tauntSide), taunt_down: taunt(tauntDown),
    victory_1: victory(winOne), victory_2: victory(winTwo), victory_3: victory(winThree),
    defeat: [defeat], ko_launch: [launch], ko_screen: [screen], ko_star: [star],
  };
  for (const [name, frames] of Object.entries(presentation)) {
    clips[name] = { image: frames[0].image, scale: clips.idle.scale, frames };
  }
  // Explicit holds preserve the current pose and let the shared timelines index every entry.
  const presentationHolds = {
    respawn_wait: 4, defeat: 4,
  };
  for (const [name, count] of Object.entries(presentationHolds)) {
    clips[name].frames = Array(count).fill(clips[name].frames[0]);
  }
  {
    const [lean, drive, sprint, fall, dive, descend] = registerSheet(
      id, 'dash-fall', zane ? [246, 736, 1270, 243, 735, 1242] : [246, 735, 1276, 253, 711, 1242], zane ? 465 : 440, 3,
    );
    const sized = (frame, height) => ({ ...frame, scale: height / frame.rect[3] });
    clips.dash_start.frames = [
      clips.dash_start.frames[0], sized(lean, 81), sized(drive, 76),
      sized(sprint, 74), stride, passing,
    ];
    clips.air_fall_loop.frames = [air[2], sized(fall, 82)];
    clips.air_fastfall_loop.frames = [sized(dive, 69), air[4], sized(descend, 82)];
  }
}
fs.writeFileSync(output + '/manifest.json', JSON.stringify({ version: 1, revision: 104, characters }, null, 2) + '\n');


