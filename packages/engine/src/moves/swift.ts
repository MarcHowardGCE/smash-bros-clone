/**
 * @fileoverview Swift character-specific move overrides.
 *
 * Override pattern: frame timing (startupFrames, activeFrames, recoveryFrames,
 * landingLag) is IDENTICAL to the default roster. FSM timing tables in
 * fsm/states/utils.ts and hard-coded thresholds (counter invincibility window
 * in GameEngine.ts, chargeMax on smash moves) depend on those exact counts.
 *
 * Swift is a light/floaty "safe poker" archetype: each hit does less damage
 * and delivers weaker knockback than the default roster, but reach is EXTENDED
 * above defaults to compensate — Swift wins neutral by pecking from just
 * outside the opponent's range, then combos off floaty follow-ups.
 *
 * getMoveDataForCharacter in moves/index.ts checks these overrides first when
 * characterId === 'swift' before falling back to MOVE_REGISTRY.
 */

import type { MoveData, HitboxData } from '@smash/shared';
import { MoveId } from '@smash/shared';

const swiftJabHitbox: HitboxData = {
  offsetX: 50, offsetY: 0, radius: 18,
  damage: 2, baseKnockback: 1, knockbackGrowth: 22, knockbackAngle: 40,
  hitlagFrames: 3, hitstunFrames: 8, priority: 1,
};

/** Swift jab — same timing as default (3/2/10), EXTENDED reach (offsetX 50 vs 45), lower damage (2 vs 3), weaker knockback growth (22 vs 28). */
export const SWIFT_JAB: MoveData = {
  id: MoveId.JAB,
  startupFrames: 3, activeFrames: 2, recoveryFrames: 10,
  hitboxPerActiveFrame: [swiftJabHitbox, swiftJabHitbox],
  landingLag: 0, isAerial: false, isGrab: false, isSpecial: false,
};

const swiftForwardTiltHitbox: HitboxData = {
  offsetX: 60, offsetY: 0, radius: 22,
  damage: 5, baseKnockback: 3, knockbackGrowth: 38, knockbackAngle: 30,
  hitlagFrames: 4, hitstunFrames: 10, priority: 1,
};

/** Swift forward tilt — same timing as default (7/3/12), EXTENDED reach (offsetX 60 vs 55), lower damage (5 vs 7), weaker knockback growth. */
export const SWIFT_FORWARD_TILT: MoveData = {
  id: MoveId.FORWARD_TILT,
  startupFrames: 7, activeFrames: 3, recoveryFrames: 12,
  hitboxPerActiveFrame: [swiftForwardTiltHitbox, swiftForwardTiltHitbox, swiftForwardTiltHitbox],
  landingLag: 0, isAerial: false, isGrab: false, isSpecial: false,
};

const swiftNeutralAirHitbox: HitboxData = {
  offsetX: 0, offsetY: 0, radius: 36,
  damage: 6, baseKnockback: 3, knockbackGrowth: 40, knockbackAngle: 45,
  hitlagFrames: 4, hitstunFrames: 12, priority: 1,
};

/** Swift neutral air — same timing as default (5/6/16), LARGER hitbox (radius 36 vs 34), lower damage (6 vs 8), weaker knockback. */
export const SWIFT_NEUTRAL_AIR: MoveData = {
  id: MoveId.NEUTRAL_AIR,
  startupFrames: 5, activeFrames: 6, recoveryFrames: 16,
  hitboxPerActiveFrame: Array(6).fill(swiftNeutralAirHitbox),
  landingLag: 4, isAerial: true, isGrab: false, isSpecial: false,
};

const swiftForwardAirHitbox: HitboxData = {
  offsetX: 60, offsetY: -10, radius: 22,
  damage: 9, baseKnockback: 4, knockbackGrowth: 55, knockbackAngle: 30,
  hitlagFrames: 5, hitstunFrames: 16, priority: 1,
};

/** Swift forward air — same timing as default (8/4/18), EXTENDED reach (offsetX 60 vs 55), lower damage (9 vs 12), weaker knockback. */
export const SWIFT_FORWARD_AIR: MoveData = {
  id: MoveId.FORWARD_AIR,
  startupFrames: 8, activeFrames: 4, recoveryFrames: 18,
  hitboxPerActiveFrame: Array(4).fill(swiftForwardAirHitbox),
  landingLag: 6, isAerial: true, isGrab: false, isSpecial: false,
};

const swiftUpAirHitbox: HitboxData = {
  offsetX: 0, offsetY: -50, radius: 30,
  damage: 7, baseKnockback: 3, knockbackGrowth: 48, knockbackAngle: 80,
  hitlagFrames: 4, hitstunFrames: 14, priority: 1,
};

/** Swift up air — same timing as default (7/5/16), EXTENDED reach (offsetY -50 vs -40, radius 30 vs 28), lower damage (7 vs 9). Juggle-friendly: reaches higher for anti-air. */
export const SWIFT_UP_AIR: MoveData = {
  id: MoveId.UP_AIR,
  startupFrames: 7, activeFrames: 5, recoveryFrames: 16,
  hitboxPerActiveFrame: Array(5).fill(swiftUpAirHitbox),
  landingLag: 6, isAerial: true, isGrab: false, isSpecial: false,
};

const swiftNeutralSpecialHitbox: HitboxData = {
  offsetX: 0, offsetY: 0, radius: 38,
  damage: 6, baseKnockback: 3, knockbackGrowth: 42, knockbackAngle: 40,
  hitlagFrames: 5, hitstunFrames: 12, priority: 1,
};

/** Swift neutral special — same timing as default (8/0/20), LARGER burst radius (38 vs 36), lower damage (6 vs 10). Poke tool, not a KO threat. */
export const SWIFT_NEUTRAL_SPECIAL: MoveData = {
  id: MoveId.NEUTRAL_SPECIAL,
  startupFrames: 8, activeFrames: 0, recoveryFrames: 20,
  hitboxPerActiveFrame: [swiftNeutralSpecialHitbox],
  landingLag: 0, isAerial: false, isGrab: false, isSpecial: true,
};

const swiftUpSpecialHitbox: HitboxData = {
  offsetX: 0, offsetY: -35, radius: 28,
  damage: 4, baseKnockback: 3, knockbackGrowth: 35, knockbackAngle: 90,
  hitlagFrames: 3, hitstunFrames: 10, priority: 1,
};

/** Swift up special — same timing as default (4/3/30), EXTENDED hitbox (radius 28 vs 26), lower damage (4 vs 6). Straight-up launch angle (90° vs 75°) prioritizes vertical recovery over offense. landingLag stays 14. */
export const SWIFT_UP_SPECIAL: MoveData = {
  id: MoveId.UP_SPECIAL,
  startupFrames: 4, activeFrames: 3, recoveryFrames: 30,
  hitboxPerActiveFrame: Array(3).fill(swiftUpSpecialHitbox),
  landingLag: 14, isAerial: true, isGrab: false, isSpecial: true,
};
