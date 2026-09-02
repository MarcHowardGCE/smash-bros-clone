/**
 * @fileoverview Swift character-specific move overrides.
 *
 * Swift is a fast/floaty fighter with emphasis on air control and combo routing.
 * Override pattern matches Lincoln: frame timing is IDENTICAL to the default roster
 * so FSM timing tables and engine thresholds stay in sync. Only hitbox geometry
 * and damage/knockback values differ, reflecting Swift's lighter weight and
 * air-mobility archetype.
 *
 * getMoveDataForCharacter in moves/index.ts checks these overrides first when
 * characterId === 'swift' before falling back to MOVE_REGISTRY.
 */

import type { MoveData, HitboxData } from '@smash/shared';
import { MoveId } from '@smash/shared';

// Swift move overrides - IDENTICAL frame timing to defaults, ONLY hitbox data differs.
// Frame counts MUST match defaults to stay in sync with FSM timing tables (fsm/states/utils.ts)
// and hard-coded game logic (e.g. counter-hit threshold in GameEngine.ts).

const swiftJabHitbox: HitboxData = {
  offsetX: 40, offsetY: 0, radius: 20,
  damage: 2, baseKnockback: 1, knockbackGrowth: 25, knockbackAngle: 30,
  hitlagFrames: 2, hitstunFrames: 7, priority: 1,
};

/** Swift jab — same timing as default (3/2/10), but lower damage (2 vs 3) and weaker knockback. Floaty combo starter. */
export const SWIFT_JAB: MoveData = {
  id: MoveId.JAB,
  startupFrames: 3, activeFrames: 2, recoveryFrames: 10,
  hitboxPerActiveFrame: [swiftJabHitbox, swiftJabHitbox],
  landingLag: 0, isAerial: false, isGrab: false, isSpecial: false,
};

const swiftNeutralAirHitbox: HitboxData = {
  offsetX: 0, offsetY: 0, radius: 32,
  damage: 7, baseKnockback: 3, knockbackGrowth: 45, knockbackAngle: 45,
  hitlagFrames: 4, hitstunFrames: 12, priority: 1,
};

/** Swift neutral air — same timing as default (5/6/16, 4 landing lag), slightly lower damage (7 vs 8). Full-body air control tool. */
export const SWIFT_NEUTRAL_AIR: MoveData = {
  id: MoveId.NEUTRAL_AIR,
  startupFrames: 5, activeFrames: 6, recoveryFrames: 16,
  hitboxPerActiveFrame: Array(6).fill(swiftNeutralAirHitbox),
  landingLag: 4, isAerial: true, isGrab: false, isSpecial: false,
};

const swiftForwardAirHitbox: HitboxData = {
  offsetX: 52, offsetY: -10, radius: 25,
  damage: 13, baseKnockback: 7, knockbackGrowth: 72, knockbackAngle: 30,
  hitlagFrames: 6, hitstunFrames: 20, priority: 1,
};

/** Swift forward air — same timing as default (8/4/18, 6 landing lag), slightly higher damage (13 vs 12) for floaty offstage control. Primary edge-guard. */
export const SWIFT_FORWARD_AIR: MoveData = {
  id: MoveId.FORWARD_AIR,
  startupFrames: 8, activeFrames: 4, recoveryFrames: 18,
  hitboxPerActiveFrame: Array(4).fill(swiftForwardAirHitbox),
  landingLag: 6, isAerial: true, isGrab: false, isSpecial: false,
};

const swiftDownAirHitbox: HitboxData = {
  offsetX: 0, offsetY: 28, radius: 22,
  damage: 12, baseKnockback: 5, knockbackGrowth: 55, knockbackAngle: 270,
  hitlagFrames: 6, hitstunFrames: 18, priority: 1,
};

/** Swift down air — same timing as default (10/2/20, 10 landing lag), slightly lower damage (12 vs 14), tighter hitbox for combo spike identity. */
export const SWIFT_DOWN_AIR: MoveData = {
  id: MoveId.DOWN_AIR,
  startupFrames: 10, activeFrames: 2, recoveryFrames: 20,
  hitboxPerActiveFrame: [swiftDownAirHitbox, swiftDownAirHitbox],
  landingLag: 10, isAerial: true, isGrab: false, isSpecial: false,
};

const swiftForwardSmashHitbox: HitboxData = {
  offsetX: 62, offsetY: 0, radius: 28,
  damage: 16, baseKnockback: 10, knockbackGrowth: 95, knockbackAngle: 35,
  hitlagFrames: 7, hitstunFrames: 28, priority: 2,
};

/** Swift forward smash — same timing as default (15/3/25), lower damage (16 vs 18), shorter reach (offsetX 62 vs 65). Keeps KO tool role but less punishing on whiff. */
export const SWIFT_FORWARD_SMASH: MoveData = {
  id: MoveId.FORWARD_SMASH,
  startupFrames: 15, activeFrames: 3, recoveryFrames: 25,
  hitboxPerActiveFrame: [swiftForwardSmashHitbox, swiftForwardSmashHitbox, swiftForwardSmashHitbox],
  landingLag: 0, isAerial: false, isGrab: false, isSpecial: false,
  chargeMax: 60,
};

const swiftNeutralSpecialHitbox: HitboxData = {
  offsetX: 0, offsetY: 0, radius: 34,
  damage: 9, baseKnockback: 4, knockbackGrowth: 50, knockbackAngle: 40,
  hitlagFrames: 5, hitstunFrames: 14, priority: 1,
};

/** Swift neutral special — same timing as default (8/0/20), same damage (9), tighter radius (34 vs 36) for rushdown neutral game. */
export const SWIFT_NEUTRAL_SPECIAL: MoveData = {
  id: MoveId.NEUTRAL_SPECIAL,
  startupFrames: 8, activeFrames: 0, recoveryFrames: 20,
  hitboxPerActiveFrame: [swiftNeutralSpecialHitbox],
  landingLag: 0, isAerial: false, isGrab: false, isSpecial: true,
};

const swiftUpSpecialHitbox: HitboxData = {
  offsetX: 0, offsetY: -35, radius: 25,
  damage: 6, baseKnockback: 3, knockbackGrowth: 40, knockbackAngle: 75,
  hitlagFrames: 4, hitstunFrames: 12, priority: 1,
};

/** Swift up special — same timing as default (4/3/30, 14 landing lag), identical damage (6), lower knockback growth (40 vs 45) to support floaty recovery game. */
export const SWIFT_UP_SPECIAL: MoveData = {
  id: MoveId.UP_SPECIAL,
  startupFrames: 4, activeFrames: 3, recoveryFrames: 30,
  hitboxPerActiveFrame: Array(3).fill(swiftUpSpecialHitbox),
  landingLag: 14, isAerial: true, isGrab: false, isSpecial: true,
};

// DOWN_SPECIAL is IDENTICAL to default - only animation/name differ, mechanics stay same.
// Counter invincibility window (stateFrame < 6) is hard-coded in GameEngine.ts and must
// match startupFrames: 6. Empty hitboxPerActiveFrame means counter logic handles damage.
/** Swift down special — counter move, identical mechanics to the default version. Invincibility window = `stateFrame < 6` (matches `startupFrames: 6`). */
export const SWIFT_DOWN_SPECIAL: MoveData = {
  id: MoveId.DOWN_SPECIAL,
  startupFrames: 6, activeFrames: 0, recoveryFrames: 16,
  hitboxPerActiveFrame: [],
  landingLag: 0, isAerial: false, isGrab: false, isSpecial: true,
};
