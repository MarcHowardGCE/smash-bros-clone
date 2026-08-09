import type { MoveData, CharacterId } from '@smash/shared';
import { MoveId } from '@smash/shared';

import {
  MOVE_JAB, MOVE_FORWARD_TILT, MOVE_UP_TILT, MOVE_DOWN_TILT,
  MOVE_FORWARD_SMASH, MOVE_UP_SMASH, MOVE_DOWN_SMASH,
} from './ground.js';
import {
  MOVE_NEUTRAL_AIR, MOVE_FORWARD_AIR, MOVE_BACK_AIR, MOVE_UP_AIR, MOVE_DOWN_AIR,
} from './aerial.js';
import {
  MOVE_NEUTRAL_SPECIAL, MOVE_SIDE_SPECIAL, MOVE_UP_SPECIAL, MOVE_DOWN_SPECIAL,
} from './special.js';
import {
  MOVE_GRAB, MOVE_PUMMEL,
  MOVE_FORWARD_THROW, MOVE_BACK_THROW, MOVE_UP_THROW, MOVE_DOWN_THROW,
} from './grab.js';
import { MOVE_LEDGE_ATTACK } from './ledge.js';
import {
  LINCOLN_JAB, LINCOLN_FORWARD_SMASH, LINCOLN_DOWN_AIR,
  LINCOLN_NEUTRAL_SPECIAL, LINCOLN_SIDE_SPECIAL, LINCOLN_UP_SPECIAL, LINCOLN_DOWN_SPECIAL,
} from './lincoln.js';

const MOVE_REGISTRY: ReadonlyMap<MoveId, MoveData> = new Map([
  [MoveId.JAB, MOVE_JAB],
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

export function getMoveData(id: MoveId): MoveData {
  const move = MOVE_REGISTRY.get(id);
  if (!move) throw new Error(`Unknown MoveId: ${id}`);
  return move;
}

/**
 * Get character-aware move data. Checks character-specific overrides first,
 * then falls back to shared MOVE_REGISTRY.
 * 
 * @param characterId - Character identifier ('abe-lincoln', 'all-rounder', etc.)
 * @param id - Move identifier
 * @returns MoveData with character-specific hitbox stats and default frame timing
 */
export function getMoveDataForCharacter(characterId: CharacterId | undefined, id: MoveId): MoveData {
  if (characterId === 'abe-lincoln') {
    const override = LINCOLN_MOVE_OVERRIDES.get(id);
    if (override) return override;
  }
  
  return getMoveData(id);
}

export { MoveId };
