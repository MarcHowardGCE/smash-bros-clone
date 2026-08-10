/**
 * @fileoverview Character stat definitions and registry.
 * Exports concrete `CharacterStats` objects for every playable fighter,
 * the `CHARACTER_REGISTRY` map for engine lookups, the `CHARACTER_IDS`
 * list for runtime validation, and two helper functions (`isCharacterId`,
 * `getCharacterStats`) used by both the server and the client.
 */

import { PHYSICS } from './physics.js';
import type { CharacterId, CharacterStats } from '../types/Character.js';

/**
 * All-Rounder character stats — sourced directly from PHYSICS constants.
 * This is the baseline fighter with no modifications.
 */
export const ALL_ROUNDER_STATS: CharacterStats = {
  fighterWeight: PHYSICS.FIGHTER_WEIGHT,
  hurtboxRadius: PHYSICS.HURTBOX_RADIUS,
  runSpeed: PHYSICS.RUN_SPEED,
  walkSpeed: PHYSICS.WALK_SPEED,
  jumpVelocity: PHYSICS.JUMP_VELOCITY,
  shortHopVelocity: PHYSICS.SHORT_HOP_VELOCITY,
};

/**
 * Abe Lincoln character stats — heavier, larger hurtbox, slower movement, slightly lower jump.
 * Exact values: weight 118 (+18%), hurtbox 32 (+14%), run 5.8 (-11%), walk 3.1 (-11%), jump -15.2 (-5%), shortHop -9.5 (-5%)
 */
export const ABE_LINCOLN_STATS: CharacterStats = {
  fighterWeight: 118,
  hurtboxRadius: 32,
  runSpeed: 5.8,
  walkSpeed: 3.1,
  jumpVelocity: -15.2,
  shortHopVelocity: -9.5,
};

/**
 * Character registry mapping CharacterId to CharacterStats.
 */
export const CHARACTER_REGISTRY: Record<CharacterId, CharacterStats> = {
  'all-rounder': ALL_ROUNDER_STATS,
  'abe-lincoln': ABE_LINCOLN_STATS,
};

/**
 * Runtime-checkable list of all valid CharacterIds.
 */
export const CHARACTER_IDS: readonly CharacterId[] = ['all-rounder', 'abe-lincoln'] as const;

/**
 * Type guard to check if a value is a valid CharacterId.
 *
 * @param value - The value to check
 * @returns true if value is a valid CharacterId, false otherwise
 */
export function isCharacterId(value: unknown): value is CharacterId {
  return typeof value === 'string' && (CHARACTER_IDS as readonly string[]).includes(value);
}

/**
 * Resolve character stats by CharacterId.
 * Falls back to All-Rounder if CharacterId is undefined or unknown.
 *
 * @param characterId - The character to look up, or undefined for default
 * @returns CharacterStats for the requested character, or All-Rounder as fallback
 */
export function getCharacterStats(characterId?: CharacterId): CharacterStats {
  if (!characterId || !CHARACTER_REGISTRY[characterId]) {
    return ALL_ROUNDER_STATS;
  }
  return CHARACTER_REGISTRY[characterId];
}
