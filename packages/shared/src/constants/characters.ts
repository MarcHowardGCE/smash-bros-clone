/**
 * @fileoverview Character stat definitions and registry.
 * Exports concrete `CharacterStats` objects for every playable fighter,
 * the `CHARACTER_REGISTRY` map for engine lookups, the `CHARACTER_IDS`
 * list for runtime validation, and two helper functions (`isCharacterId`,
 * `getCharacterStats`) used by both the server and the client.
 */

import { PHYSICS } from './physics.js';
import type { CharacterId, CharacterStats, MatchCharacterId, Pack03PilotId } from '../types/Character.js';

/**
 * All-Rounder character stats — sourced directly from PHYSICS constants.
 * This is the baseline fighter with no modifications.
 */
export const ALL_ROUNDER_STATS: CharacterStats = {
  airSpeed:5,airAcceleration:.135,airBrake:.05,gravity:.65,fallSpeed:18,fastFallSpeed:28.8,doubleJumpVelocity:-14,
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
  airSpeed:4.2,airAcceleration:.11,airBrake:.06,gravity:.68,fallSpeed:19,fastFallSpeed:30.4,doubleJumpVelocity:-13.3,
  fighterWeight: 118,
  hurtboxRadius: 32,
  runSpeed: 5.8,
  walkSpeed: 3.1,
  jumpVelocity: -15.2,
  shortHopVelocity: -9.5,
};

/**
 * Swift character stats — fast/floaty archetype copied from All-Rounder and mobility-tuned.
 * Exact values: weight 75 (-25%), hurtbox 26 (-7%), run 6.8 (+5%), walk 3.5 (parity), jump -16.5 (+3%), shortHop -10.3 (+3%)
 * Lightweight profile means weaker survival and lower raw KO pressure than heavyweight archetypes.
 */
export const SWIFT_STATS: CharacterStats = {
  ...ALL_ROUNDER_STATS,
  airSpeed:5.8,airAcceleration:.16,airBrake:.04,gravity:.62,fallSpeed:17,fastFallSpeed:27.2,doubleJumpVelocity:-14.5,
  fighterWeight: 75,
  hurtboxRadius: 26,
  runSpeed: 6.8,
  walkSpeed: 3.5,
  jumpVelocity: -16.5,
  shortHopVelocity: -10.3,
};

/**
 * Character registry mapping CharacterId to CharacterStats.
 */
const MOONSHINE_STATS: CharacterStats = {
  fighterWeight: 87, hurtboxRadius: 27,
  runSpeed: 6.65, walkSpeed: 3.6,
  jumpVelocity: -16.25, shortHopVelocity: -10.15, doubleJumpVelocity: -14.25,
  airSpeed: 5.4, airAcceleration: .148, airBrake: .045,
  gravity: .635, fallSpeed: 17.5, fastFallSpeed: 28,
};

const HOAGIE_STATS: CharacterStats = {
  fighterWeight: 109, hurtboxRadius: 30,
  runSpeed: 6.1, walkSpeed: 3.3,
  jumpVelocity: -15.6, shortHopVelocity: -9.75, doubleJumpVelocity: -13.65,
  airSpeed: 4.6, airAcceleration: .122, airBrake: .055,
  gravity: .665, fallSpeed: 18.5, fastFallSpeed: 29.6,
};

export const PACK_03_PILOT_FIGHTERS = [
  { id: 'mr-wrong', name: 'Mr. Wrong' },
  { id: 'loopy', name: 'Loopy' },
  { id: 'mrs-tasselbottom', name: 'Mrs. Tasselbottom' },
] as const satisfies readonly { id: Pack03PilotId; name: string }[];

export function isPack03PilotId(value: unknown): value is Pack03PilotId {
  return PACK_03_PILOT_FIGHTERS.some(fighter => fighter.id === value);
}

export const CHARACTER_REGISTRY: Record<CharacterId, CharacterStats> = {
  'all-rounder': ALL_ROUNDER_STATS,
  'abe-lincoln': ABE_LINCOLN_STATS,
  'swift': SWIFT_STATS,
  'moonshine': MOONSHINE_STATS,
  'hulk-hoagie': HOAGIE_STATS,
  'zane-corvo': { ...ALL_ROUNDER_STATS },
  'velvet-reply': { ...ALL_ROUNDER_STATS },
  'mr-wrong': {
    ...ALL_ROUNDER_STATS,
    fighterWeight: 93, walkSpeed: 3.6, runSpeed: 6.75, airSpeed: 5.1, airAcceleration: 0.14,
  },
  loopy: {
    ...ALL_ROUNDER_STATS,
    fighterWeight: 82, walkSpeed: 3.75, runSpeed: 7.15,
    jumpVelocity: -17, shortHopVelocity: -10.5, doubleJumpVelocity: -14.6,
    airSpeed: 5.25, airAcceleration: 0.15, airBrake: 0.055, gravity: 0.7, fallSpeed: 19, fastFallSpeed: 30.4,
  },
  'mrs-tasselbottom': {
    ...ALL_ROUNDER_STATS,
    fighterWeight: 128, hurtboxRadius: 34, walkSpeed: 2.9, runSpeed: 5.25,
    jumpVelocity: -12.6, shortHopVelocity: -8.2, doubleJumpVelocity: -11.5,
    airSpeed: 3.9, airAcceleration: 0.095, airBrake: 0.065, gravity: 0.74, fallSpeed: 19.5, fastFallSpeed: 31.2,
  },
};

/**
 * Runtime-checkable list of fighters enabled for regular matches.
 */
export const CHARACTER_IDS: readonly MatchCharacterId[] = ['all-rounder', 'abe-lincoln', 'swift'] as const;

/**
 * Type guard to check if a value is a valid CharacterId.
 *
 * @param value - The value to check
 * @returns true if value is a valid CharacterId, false otherwise
 */
export function isCharacterId(value: unknown): value is MatchCharacterId {
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
