/**
 * @fileoverview Move registry and character-aware move data lookup.
 *
 * MOVE_REGISTRY holds the canonical MoveData for every MoveId. Character-specific
 * overrides (currently only Abe Lincoln) are stored in separate maps and checked
 * first by getMoveDataForCharacter before falling back to the shared registry.
 */

import type { MoveData, CharacterId } from '@smash/shared';
import { MoveId } from '@smash/shared';

import {
  MOVE_FLOOR_ATTACK_TRIP,MOVE_FLOOR_ATTACK_UP,MOVE_FLOOR_ATTACK_DOWN,MOVE_JAB_2, MOVE_JAB_3, MOVE_DASH_ATTACK, MOVE_JAB, MOVE_FORWARD_TILT, MOVE_UP_TILT, MOVE_DOWN_TILT,
  MOVE_FORWARD_SMASH, MOVE_UP_SMASH, MOVE_DOWN_SMASH,
} from './ground.js';
import {
  MOVE_NEUTRAL_AIR, MOVE_FORWARD_AIR, MOVE_BACK_AIR, MOVE_UP_AIR, MOVE_DOWN_AIR,
} from './aerial.js';
import {
  MOVE_NEUTRAL_SPECIAL, MOVE_SIDE_SPECIAL, MOVE_UP_SPECIAL, MOVE_DOWN_SPECIAL,
} from './special.js';
import {
  MOVE_GRAB, MOVE_GRAB_DASH,MOVE_GRAB_PIVOT,MOVE_PUMMEL,
  MOVE_FORWARD_THROW, MOVE_BACK_THROW, MOVE_UP_THROW, MOVE_DOWN_THROW,
} from './grab.js';
import { MOVE_LEDGE_ATTACK } from './ledge.js';
import {
  LINCOLN_JAB, LINCOLN_FORWARD_SMASH, LINCOLN_DOWN_AIR,
  LINCOLN_NEUTRAL_SPECIAL, LINCOLN_SIDE_SPECIAL, LINCOLN_UP_SPECIAL, LINCOLN_DOWN_SPECIAL,
} from './lincoln.js';
import {
  SWIFT_JAB, SWIFT_FORWARD_TILT, SWIFT_NEUTRAL_AIR, SWIFT_FORWARD_AIR,
  SWIFT_UP_AIR, SWIFT_NEUTRAL_SPECIAL, SWIFT_UP_SPECIAL,
} from './swift.js';

const MOVE_REGISTRY: ReadonlyMap<MoveId, MoveData> = new Map([
  [MoveId.JAB, MOVE_JAB],
  [MoveId.FLOOR_ATTACK_TRIP,MOVE_FLOOR_ATTACK_TRIP],
  [MoveId.FLOOR_ATTACK_UP,MOVE_FLOOR_ATTACK_UP],
  [MoveId.FLOOR_ATTACK_DOWN,MOVE_FLOOR_ATTACK_DOWN],
  [MoveId.JAB_2,MOVE_JAB_2],
  [MoveId.JAB_3,MOVE_JAB_3],
  [MoveId.DASH_ATTACK,MOVE_DASH_ATTACK],
  [MoveId.FORWARD_TILT, MOVE_FORWARD_TILT],
  [MoveId.UP_TILT, MOVE_UP_TILT],
  [MoveId.DOWN_TILT, MOVE_DOWN_TILT],
  [MoveId.FORWARD_SMASH, MOVE_FORWARD_SMASH],
  [MoveId.UP_SMASH, MOVE_UP_SMASH],
  [MoveId.DOWN_SMASH, MOVE_DOWN_SMASH],
  [MoveId.NEUTRAL_AIR, MOVE_NEUTRAL_AIR],
  [MoveId.FORWARD_AIR, MOVE_FORWARD_AIR],
  [MoveId.BACK_AIR, MOVE_BACK_AIR],
  [MoveId.UP_AIR, MOVE_UP_AIR],
  [MoveId.DOWN_AIR, MOVE_DOWN_AIR],
  [MoveId.NEUTRAL_SPECIAL, MOVE_NEUTRAL_SPECIAL],
  [MoveId.SIDE_SPECIAL, MOVE_SIDE_SPECIAL],
  [MoveId.UP_SPECIAL, MOVE_UP_SPECIAL],
  [MoveId.DOWN_SPECIAL, MOVE_DOWN_SPECIAL],
  [MoveId.GRAB, MOVE_GRAB],
  [MoveId.GRAB_DASH,MOVE_GRAB_DASH],[MoveId.GRAB_PIVOT,MOVE_GRAB_PIVOT],
  [MoveId.PUMMEL, MOVE_PUMMEL],
  [MoveId.FORWARD_THROW, MOVE_FORWARD_THROW],
  [MoveId.BACK_THROW, MOVE_BACK_THROW],
  [MoveId.UP_THROW, MOVE_UP_THROW],
  [MoveId.DOWN_THROW, MOVE_DOWN_THROW],
  [MoveId.LEDGE_ATTACK, MOVE_LEDGE_ATTACK],
]);

const LINCOLN_MOVE_OVERRIDES: ReadonlyMap<MoveId, MoveData> = new Map([
  [MoveId.JAB, LINCOLN_JAB],
  [MoveId.FORWARD_SMASH, LINCOLN_FORWARD_SMASH],
  [MoveId.DOWN_AIR, LINCOLN_DOWN_AIR],
  [MoveId.NEUTRAL_SPECIAL, LINCOLN_NEUTRAL_SPECIAL],
  [MoveId.SIDE_SPECIAL, LINCOLN_SIDE_SPECIAL],
  [MoveId.UP_SPECIAL, LINCOLN_UP_SPECIAL],
  [MoveId.DOWN_SPECIAL, LINCOLN_DOWN_SPECIAL],
]);

const SWIFT_MOVE_OVERRIDES: ReadonlyMap<MoveId, MoveData> = new Map([
  [MoveId.JAB, SWIFT_JAB],
  [MoveId.FORWARD_TILT, SWIFT_FORWARD_TILT],
  [MoveId.NEUTRAL_AIR, SWIFT_NEUTRAL_AIR],
  [MoveId.FORWARD_AIR, SWIFT_FORWARD_AIR],
  [MoveId.UP_AIR, SWIFT_UP_AIR],
  [MoveId.NEUTRAL_SPECIAL, SWIFT_NEUTRAL_SPECIAL],
  [MoveId.UP_SPECIAL, SWIFT_UP_SPECIAL],
]);

/**
 * Look up canonical move data from the shared registry.
 *
 * @param id - The move to retrieve.
 * @returns The {@link MoveData} for that move.
 * @throws {Error} If `id` is not registered in MOVE_REGISTRY.
 */
export function getMoveData(id: MoveId): MoveData {
  const move = MOVE_REGISTRY.get(id);
  if (!move) throw new Error(`Unknown MoveId: ${id}`);
  return move;
}

const MOONSHINE_DASH_ATTACK: MoveData = {
  ...MOVE_DASH_ATTACK,
  startupFrames: 6,
  activeFrames: 4,
  recoveryFrames: 18,
  hitboxPerActiveFrame: MOVE_DASH_ATTACK.hitboxPerActiveFrame.slice(0, 4).map(hit => ({
    ...hit, damage: 7,
  })),
};

const MOONSHINE_FORWARD_AIR: MoveData = {
  ...MOVE_FORWARD_AIR,
  autoCancel: {earlyEnd:3,lateStart:20},
  startupFrames: 6,
  recoveryFrames: 16,
  landingLag: 5,
  hitboxPerActiveFrame: MOVE_FORWARD_AIR.hitboxPerActiveFrame.map(hit => ({
    ...hit, damage: 10,
  })),
};

const MOONSHINE_DOWN_TILT: MoveData = {
  ...MOVE_DOWN_TILT,
  startupFrames: 4,
  recoveryFrames: 10,
  tripBelowPercent: 20,
};

const MOONSHINE_UP_AIR: MoveData = {
  ...MOVE_UP_AIR,
  autoCancel: {earlyEnd:3,lateStart:17},
  startupFrames: 5,
  activeFrames: 4,
  hitboxPerActiveFrame: MOVE_UP_AIR.hitboxPerActiveFrame.slice(0, 4).map(hit => ({
    ...hit, damage: 8,
  })),
};

const HOAGIE_UP_SPECIAL: MoveData = { ...MOVE_UP_SPECIAL, recoveryLaunchVelocity: -20 };
const HOAGIE_GRAB: MoveData = {
  ...MOVE_GRAB,
  startupFrames: 7,
  recoveryFrames: 20,
  // Grounded grab scaling puts the center at (36, -30.5), beside the drawn grip.
  hitboxPerActiveFrame: MOVE_GRAB.hitboxPerActiveFrame.map(hit => ({
    ...hit, offsetX: 48, offsetY: -14, radius: 12,
  })),
};
const HOAGIE_FORWARD_THROW: MoveData = {
  ...MOVE_FORWARD_THROW,
  hitboxPerActiveFrame: MOVE_FORWARD_THROW.hitboxPerActiveFrame.map(hit => ({
    ...hit, damage: 10, baseKnockback: 10, knockbackGrowth: 69,
  })),
};
const HOAGIE_BACK_THROW: MoveData = {
  ...MOVE_BACK_THROW,
  hitboxPerActiveFrame: MOVE_BACK_THROW.hitboxPerActiveFrame.map(hit => ({
    ...hit, damage: 11, baseKnockback: 11, knockbackGrowth: 74,
  })),
};


/**
 * Get character-aware move data. Checks character-specific overrides first,
 * then falls back to shared MOVE_REGISTRY.
 * 
 * @param characterId - Character identifier ('abe-lincoln', 'swift', 'all-rounder', etc.)
 * @param id - Move identifier
 * @returns MoveData with character-specific hitbox stats and default frame timing
 */
export function getMoveDataForCharacter(characterId: CharacterId | undefined, id: MoveId): MoveData {
  if (characterId === 'moonshine') {
    if (id === MoveId.DASH_ATTACK) return MOONSHINE_DASH_ATTACK;
    if (id === MoveId.FORWARD_AIR) return MOONSHINE_FORWARD_AIR;
    if (id === MoveId.DOWN_TILT) return MOONSHINE_DOWN_TILT;
    if (id === MoveId.UP_AIR) return MOONSHINE_UP_AIR;
  }
  if (characterId === 'hulk-hoagie') {
    if (id === MoveId.UP_SPECIAL) return HOAGIE_UP_SPECIAL;
    if (id === MoveId.GRAB) return HOAGIE_GRAB;
    if (id === MoveId.FORWARD_THROW) return HOAGIE_FORWARD_THROW;
    if (id === MoveId.BACK_THROW) return HOAGIE_BACK_THROW;
  }
  if (characterId === 'abe-lincoln') {
    const override = LINCOLN_MOVE_OVERRIDES.get(id);
    if (override) return override;
  }
  if (characterId === 'swift') {
    const override = SWIFT_MOVE_OVERRIDES.get(id);
    if (override) return override;
  }
  
  if (characterId === 'swift') {
    const override = SWIFT_MOVE_OVERRIDES.get(id);
    if (override) return override;
  }
  
  return getMoveData(id);
}

export { MoveId };
