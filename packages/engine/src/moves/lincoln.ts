/**
 * @fileoverview Abe Lincoln character-specific move overrides.
 *
 * Override pattern: frame timing (startupFrames, activeFrames, recoveryFrames)
 * is IDENTICAL to the default roster so FSM timing tables and hard-coded engine
 * thresholds (e.g. the counter invincibility window in GameEngine.ts) stay in
 * sync. Only hitbox geometry (offsetX, offsetY, radius) and damage/knockback
 * values differ, reflecting Lincoln's longer reach and harder hits.
 *
 * getMoveDataForCharacter in moves/index.ts checks these overrides first when
 * characterId === 'abe-lincoln' before falling back to MOVE_REGISTRY.
 */

import type { MoveData, HitboxData } from '@smash/shared';
import { MoveId } from '@smash/shared';

// Abe Lincoln move overrides - IDENTICAL frame timing to defaults, ONLY hitbox data differs.
// Frame counts MUST match defaults to stay in sync with FSM timing tables (fsm/states/utils.ts)
// and hard-coded game logic (e.g. counter-hit threshold in GameEngine.ts).

const lincolnJabHitbox: HitboxData = {
  offsetX: 58, offsetY: 0, radius: 20,
  damage: 3, baseKnockback: 2, knockbackGrowth: 28, knockbackAngle: 30,
  hitlagFrames: 3, hitstunFrames: 8, priority: 1,
};

/** Lincoln jab — same timing as default (3/2/10), but longer reach (offsetX 58 vs 45). */
export const LINCOLN_JAB: MoveData = {
  id: MoveId.JAB,
  startupFrames: 3, activeFrames: 2, recoveryFrames: 10,
  hitboxPerActiveFrame: [lincolnJabHitbox, lincolnJabHitbox],
  landingLag: 0, isAerial: false, isGrab: false, isSpecial: false,
};

const lincolnForwardSmashHitbox: HitboxData = {
  offsetX: 78, offsetY: 0, radius: 32,
  damage: 20, baseKnockback: 14, knockbackGrowth: 110, knockbackAngle: 40,
  hitlagFrames: 8, hitstunFrames: 30, priority: 2,
};

/** Lincoln forward smash — same timing as default (15/3/25), harder hit: 20 damage vs 18, extended reach (offsetX 78 vs 65). */
export const LINCOLN_FORWARD_SMASH: MoveData = {
  id: MoveId.FORWARD_SMASH,
  startupFrames: 15, activeFrames: 3, recoveryFrames: 25,
  hitboxPerActiveFrame: [lincolnForwardSmashHitbox, lincolnForwardSmashHitbox, lincolnForwardSmashHitbox],
  landingLag: 0, isAerial: false, isGrab: false, isSpecial: false,
  chargeMax: 60,
};

const lincolnDownAirHitbox: HitboxData = {
  offsetX: 0, offsetY: 30, radius: 24,
  damage: 13, baseKnockback: 6, knockbackGrowth: 60, knockbackAngle: 270,
  hitlagFrames: 7, hitstunFrames: 20, priority: 1,
};

/** Lincoln down air — same timing as default (10/2/20), slightly lower damage (13 vs 14). Same spike angle (270°). */
export const LINCOLN_DOWN_AIR: MoveData = {
  id: MoveId.DOWN_AIR,
  startupFrames: 10, activeFrames: 2, recoveryFrames: 20,
  hitboxPerActiveFrame: [lincolnDownAirHitbox, lincolnDownAirHitbox],
  landingLag: 10, isAerial: true, isGrab: false, isSpecial: false,
};

const lincolnNeutralSpecialHitbox: HitboxData = {
  offsetX: 90, offsetY: 5, radius: 24,
  damage: 9, baseKnockback: 5, knockbackGrowth: 55, knockbackAngle: 40,
  hitlagFrames: 6, hitstunFrames: 16, priority: 1,
};

/** Lincoln neutral special — same timing as default (8/0/20), but hitbox fires further out (offsetX 90 vs 0). */
export const LINCOLN_NEUTRAL_SPECIAL: MoveData = {
  id: MoveId.NEUTRAL_SPECIAL,
  startupFrames: 8, activeFrames: 0, recoveryFrames: 20,
  hitboxPerActiveFrame: [lincolnNeutralSpecialHitbox],
  landingLag: 0, isAerial: false, isGrab: false, isSpecial: true,
};

const lincolnSideSpecialHitbox: HitboxData = {
  offsetX: 70, offsetY: 0, radius: 28,
  damage: 15, baseKnockback: 5, knockbackGrowth: 60, knockbackAngle: 25,
  hitlagFrames: 5, hitstunFrames: 16, priority: 1,
};

/** Lincoln side special — same timing as default (10/3/18), higher damage (15 vs 9) and longer reach (offsetX 70 vs 50). */
export const LINCOLN_SIDE_SPECIAL: MoveData = {
  id: MoveId.SIDE_SPECIAL,
  startupFrames: 10, activeFrames: 3, recoveryFrames: 18,
  hitboxPerActiveFrame: [lincolnSideSpecialHitbox, lincolnSideSpecialHitbox, lincolnSideSpecialHitbox],
  landingLag: 0, isAerial: false, isGrab: false, isSpecial: true,
};

const lincolnUpSpecialHitbox: HitboxData = {
  offsetX: 20, offsetY: -40, radius: 26,
  damage: 12, baseKnockback: 4, knockbackGrowth: 45, knockbackAngle: 85,
  hitlagFrames: 4, hitstunFrames: 12, priority: 1,
};

/** Lincoln up special — same timing as default (4/3/30), higher damage (12 vs 6), forward-angled hitbox (offsetX 20). */
export const LINCOLN_UP_SPECIAL: MoveData = {
  id: MoveId.UP_SPECIAL,
  startupFrames: 4, activeFrames: 3, recoveryFrames: 30,
  hitboxPerActiveFrame: [lincolnUpSpecialHitbox, lincolnUpSpecialHitbox, lincolnUpSpecialHitbox],
  landingLag: 14, isAerial: true, isGrab: false, isSpecial: true,
};

// DOWN_SPECIAL is IDENTICAL to default - only animation/name differ, mechanics stay same.
// Counter invincibility window (stateFrame < 6) is hard-coded in GameEngine.ts and must
// match startupFrames: 6. Empty hitboxPerActiveFrame means counter logic handles damage.
/** Lincoln down special — counter move, identical mechanics to the default version. Invincibility window = `stateFrame < 6` (matches `startupFrames: 6`). */
export const LINCOLN_DOWN_SPECIAL: MoveData = {
  id: MoveId.DOWN_SPECIAL,
  startupFrames: 6, activeFrames: 0, recoveryFrames: 16,
  hitboxPerActiveFrame: [],
  landingLag: 0, isAerial: false, isGrab: false, isSpecial: true,
};
