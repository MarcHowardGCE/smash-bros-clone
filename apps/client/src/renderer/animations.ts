import { MoveId } from '@smash/shared';
import type { CharacterId } from '@smash/shared';
import { LINCOLN_ANIMATIONS, LINCOLN_ATTACK_ANIMATIONS } from './lincolnAnimations.js';

export interface JointPose {
  leftArmAngle: number;    // radians
  rightArmAngle: number;
  leftLegAngle: number;
  rightLegAngle: number;
  bodyScaleX: number;      // 1.0 = normal
  bodyScaleY: number;
  headOffsetX: number;
  headOffsetY: number;
}

export const DEFAULT_POSE: JointPose = {
  leftArmAngle: -0.3, rightArmAngle: 0.3,
  leftLegAngle: -0.1, rightLegAngle: 0.1,
  bodyScaleX: 1.0, bodyScaleY: 1.0,
  headOffsetX: 0, headOffsetY: 0,
};

// Each animation is an array of up to 6 keyframes
// Lerp between them based on stateFrame progress
export type Animation = JointPose[];

type AttackMoveId =
  | MoveId.JAB
  | MoveId.FORWARD_TILT
  | MoveId.UP_TILT
  | MoveId.DOWN_TILT
  | MoveId.FORWARD_SMASH
  | MoveId.UP_SMASH
  | MoveId.DOWN_SMASH
  | MoveId.NEUTRAL_SPECIAL
  | MoveId.SIDE_SPECIAL
  | MoveId.UP_SPECIAL
  | MoveId.DOWN_SPECIAL
  | MoveId.GRAB
  | MoveId.PUMMEL
  | MoveId.FORWARD_THROW
  | MoveId.BACK_THROW
  | MoveId.UP_THROW
  | MoveId.DOWN_THROW
  | MoveId.NEUTRAL_AIR
  | MoveId.FORWARD_AIR
  | MoveId.BACK_AIR
  | MoveId.UP_AIR
  | MoveId.DOWN_AIR;

const GENERIC_ATTACK_ANIMATION: Animation = [
  DEFAULT_POSE,
  { leftArmAngle: -1.5, rightArmAngle: 1.5, leftLegAngle: -0.2, rightLegAngle: 0.2, bodyScaleX: 1, bodyScaleY: 1, headOffsetX: 5, headOffsetY: 0 },
  DEFAULT_POSE,
];

function moveAttackPose(activePose: JointPose): Animation {
  return [DEFAULT_POSE, activePose, DEFAULT_POSE];
}

export const ATTACK_MOVE_ANIMATIONS: Readonly<Record<AttackMoveId, Animation>> = {
  [MoveId.JAB]: moveAttackPose({ leftArmAngle: -2.4, rightArmAngle: 0.9, leftLegAngle: -0.6, rightLegAngle: 0.4, bodyScaleX: 1.02, bodyScaleY: 0.98, headOffsetX: 6, headOffsetY: 0 }),
  [MoveId.FORWARD_TILT]: moveAttackPose({ leftArmAngle: -2.18, rightArmAngle: 1.05, leftLegAngle: -0.8, rightLegAngle: 0.2, bodyScaleX: 1.04, bodyScaleY: 0.96, headOffsetX: 8, headOffsetY: 0 }),
  [MoveId.UP_TILT]: moveAttackPose({ leftArmAngle: -1.96, rightArmAngle: 1.4, leftLegAngle: -0.55, rightLegAngle: 0.55, bodyScaleX: 1.0, bodyScaleY: 1.02, headOffsetX: 1, headOffsetY: -5 }),
  [MoveId.DOWN_TILT]: moveAttackPose({ leftArmAngle: -1.74, rightArmAngle: 0.75, leftLegAngle: -1.1, rightLegAngle: 0.15, bodyScaleX: 1.08, bodyScaleY: 0.84, headOffsetX: 5, headOffsetY: 7 }),
  [MoveId.FORWARD_SMASH]: moveAttackPose({ leftArmAngle: -1.52, rightArmAngle: 1.9, leftLegAngle: -0.85, rightLegAngle: 0.35, bodyScaleX: 1.12, bodyScaleY: 0.92, headOffsetX: 11, headOffsetY: -1 }),
  [MoveId.UP_SMASH]: moveAttackPose({ leftArmAngle: -1.3, rightArmAngle: 2.2, leftLegAngle: -0.45, rightLegAngle: 0.75, bodyScaleX: 0.98, bodyScaleY: 1.08, headOffsetX: 0, headOffsetY: -8 }),
  [MoveId.DOWN_SMASH]: moveAttackPose({ leftArmAngle: -1.08, rightArmAngle: 1.6, leftLegAngle: -1.2, rightLegAngle: 1.0, bodyScaleX: 1.14, bodyScaleY: 0.82, headOffsetX: 0, headOffsetY: 6 }),
  [MoveId.NEUTRAL_SPECIAL]: moveAttackPose({ leftArmAngle: -0.86, rightArmAngle: 0.35, leftLegAngle: -0.5, rightLegAngle: 0.5, bodyScaleX: 0.97, bodyScaleY: 1.03, headOffsetX: 0, headOffsetY: -2 }),
  [MoveId.SIDE_SPECIAL]: moveAttackPose({ leftArmAngle: -0.64, rightArmAngle: 1.35, leftLegAngle: -0.95, rightLegAngle: 0.25, bodyScaleX: 1.1, bodyScaleY: 0.9, headOffsetX: 10, headOffsetY: 0 }),
  [MoveId.UP_SPECIAL]: moveAttackPose({ leftArmAngle: -0.42, rightArmAngle: 1.8, leftLegAngle: -0.35, rightLegAngle: 0.95, bodyScaleX: 0.95, bodyScaleY: 1.12, headOffsetX: 0, headOffsetY: -10 }),
  [MoveId.DOWN_SPECIAL]: moveAttackPose({ leftArmAngle: -0.2, rightArmAngle: 0.2, leftLegAngle: -1.15, rightLegAngle: 1.15, bodyScaleX: 1.06, bodyScaleY: 0.86, headOffsetX: 0, headOffsetY: 8 }),
  [MoveId.GRAB]: moveAttackPose({ leftArmAngle: 0.02, rightArmAngle: 1.7, leftLegAngle: -0.45, rightLegAngle: 0.45, bodyScaleX: 1.03, bodyScaleY: 0.97, headOffsetX: 9, headOffsetY: 0 }),
  [MoveId.PUMMEL]: moveAttackPose({ leftArmAngle: 0.24, rightArmAngle: 0.95, leftLegAngle: -0.7, rightLegAngle: 0.3, bodyScaleX: 1.01, bodyScaleY: 0.94, headOffsetX: 4, headOffsetY: 3 }),
  [MoveId.FORWARD_THROW]: moveAttackPose({ leftArmAngle: 0.46, rightArmAngle: 2.1, leftLegAngle: -0.8, rightLegAngle: 0.6, bodyScaleX: 1.15, bodyScaleY: 0.9, headOffsetX: 13, headOffsetY: -1 }),
  [MoveId.BACK_THROW]: moveAttackPose({ leftArmAngle: 0.68, rightArmAngle: -1.25, leftLegAngle: -0.65, rightLegAngle: 0.85, bodyScaleX: 1.08, bodyScaleY: 0.93, headOffsetX: -10, headOffsetY: 0 }),
  [MoveId.UP_THROW]: moveAttackPose({ leftArmAngle: 0.9, rightArmAngle: 2.35, leftLegAngle: -0.25, rightLegAngle: 0.85, bodyScaleX: 1.0, bodyScaleY: 1.14, headOffsetX: 0, headOffsetY: -12 }),
  [MoveId.DOWN_THROW]: moveAttackPose({ leftArmAngle: 1.12, rightArmAngle: 0.1, leftLegAngle: -1.3, rightLegAngle: 0.7, bodyScaleX: 1.09, bodyScaleY: 0.8, headOffsetX: 2, headOffsetY: 10 }),
  [MoveId.NEUTRAL_AIR]: moveAttackPose({ leftArmAngle: 1.34, rightArmAngle: -1.34, leftLegAngle: 0.95, rightLegAngle: -0.95, bodyScaleX: 1.0, bodyScaleY: 1.0, headOffsetX: 0, headOffsetY: -1 }),
  [MoveId.FORWARD_AIR]: moveAttackPose({ leftArmAngle: 1.56, rightArmAngle: 1.25, leftLegAngle: 0.7, rightLegAngle: -1.05, bodyScaleX: 1.06, bodyScaleY: 0.95, headOffsetX: 7, headOffsetY: -2 }),
  [MoveId.BACK_AIR]: moveAttackPose({ leftArmAngle: 1.78, rightArmAngle: -1.7, leftLegAngle: 0.85, rightLegAngle: -0.85, bodyScaleX: 1.02, bodyScaleY: 0.98, headOffsetX: -7, headOffsetY: -1 }),
  [MoveId.UP_AIR]: moveAttackPose({ leftArmAngle: 2.0, rightArmAngle: 1.9, leftLegAngle: 0.45, rightLegAngle: -0.55, bodyScaleX: 0.98, bodyScaleY: 1.1, headOffsetX: 0, headOffsetY: -9 }),
  [MoveId.DOWN_AIR]: moveAttackPose({ leftArmAngle: 2.22, rightArmAngle: 0.5, leftLegAngle: 1.4, rightLegAngle: -1.4, bodyScaleX: 1.05, bodyScaleY: 0.88, headOffsetX: 1, headOffsetY: 8 }),
};

export const ANIMATIONS: Record<string, Animation> = {
  IDLE: [
    DEFAULT_POSE,
    { ...DEFAULT_POSE, bodyScaleY: 0.98, headOffsetY: 1 },
  ],
  WALK: [
    { leftArmAngle: 0.5, rightArmAngle: -0.5, leftLegAngle: 0.5, rightLegAngle: -0.3, bodyScaleX: 1, bodyScaleY: 1, headOffsetX: 0, headOffsetY: 0 },
    { leftArmAngle: 0.0, rightArmAngle: 0.0, leftLegAngle: 0.0, rightLegAngle: 0.0, bodyScaleX: 1, bodyScaleY: 1, headOffsetX: 0, headOffsetY: 0 },
    { leftArmAngle: -0.5, rightArmAngle: 0.5, leftLegAngle: -0.3, rightLegAngle: 0.5, bodyScaleX: 1, bodyScaleY: 1, headOffsetX: 0, headOffsetY: 0 },
    { leftArmAngle: 0.0, rightArmAngle: 0.0, leftLegAngle: 0.0, rightLegAngle: 0.0, bodyScaleX: 1, bodyScaleY: 1, headOffsetX: 0, headOffsetY: 0 },
  ],
  RUN: [
    { leftArmAngle: 0.8, rightArmAngle: -0.8, leftLegAngle: 0.8, rightLegAngle: -0.5, bodyScaleX: 1, bodyScaleY: 0.95, headOffsetX: 3, headOffsetY: 0 },
    { leftArmAngle: 0.0, rightArmAngle: 0.0, leftLegAngle: 0.0, rightLegAngle: 0.0, bodyScaleX: 1, bodyScaleY: 1, headOffsetX: 0, headOffsetY: 0 },
    { leftArmAngle: -0.8, rightArmAngle: 0.8, leftLegAngle: -0.5, rightLegAngle: 0.8, bodyScaleX: 1, bodyScaleY: 0.95, headOffsetX: 3, headOffsetY: 0 },
    { leftArmAngle: 0.0, rightArmAngle: 0.0, leftLegAngle: 0.0, rightLegAngle: 0.0, bodyScaleX: 1, bodyScaleY: 1, headOffsetX: 0, headOffsetY: 0 },
  ],
  JUMPSQUAT: [
    { leftArmAngle: -0.5, rightArmAngle: 0.5, leftLegAngle: 0.6, rightLegAngle: -0.6, bodyScaleX: 1.1, bodyScaleY: 0.8, headOffsetX: 0, headOffsetY: 5 },
  ],
  AIRBORNE: [
    { leftArmAngle: -0.8, rightArmAngle: 0.8, leftLegAngle: -0.3, rightLegAngle: 0.3, bodyScaleX: 1, bodyScaleY: 1, headOffsetX: 0, headOffsetY: -3 },
  ],
  DOUBLE_JUMP: [
    { leftArmAngle: -1.2, rightArmAngle: 1.2, leftLegAngle: -0.5, rightLegAngle: 0.5, bodyScaleX: 1.2, bodyScaleY: 0.7, headOffsetX: 0, headOffsetY: 5 },
  ],
  ATTACK: [
    ...GENERIC_ATTACK_ANIMATION,
  ],
  AIR_ATTACK: [
    DEFAULT_POSE,
    { leftArmAngle: -1.2, rightArmAngle: 1.2, leftLegAngle: 0.5, rightLegAngle: -0.5, bodyScaleX: 1, bodyScaleY: 1, headOffsetX: 0, headOffsetY: 0 },
  ],
  SHIELD: [
    { leftArmAngle: -0.3, rightArmAngle: 0.3, leftLegAngle: 0.3, rightLegAngle: -0.3, bodyScaleX: 0.9, bodyScaleY: 0.85, headOffsetX: 0, headOffsetY: 5 },
  ],
  HITSTUN: [
    { leftArmAngle: 1.0, rightArmAngle: -1.0, leftLegAngle: 0.5, rightLegAngle: -0.5, bodyScaleX: 1, bodyScaleY: 1, headOffsetX: -3, headOffsetY: 0 },
  ],
  ROLL: [
    DEFAULT_POSE,
    { leftArmAngle: 0.8, rightArmAngle: 0.8, leftLegAngle: 0.8, rightLegAngle: 0.8, bodyScaleX: 0.8, bodyScaleY: 0.8, headOffsetX: 0, headOffsetY: 0 },
    DEFAULT_POSE,
  ],
  SPOT_DODGE: [
    { leftArmAngle: 0, rightArmAngle: 0, leftLegAngle: 0.4, rightLegAngle: -0.4, bodyScaleX: 0.9, bodyScaleY: 0.8, headOffsetX: 0, headOffsetY: 5 },
  ],
  AIR_DODGE: [
    { leftArmAngle: -0.6, rightArmAngle: 0.6, leftLegAngle: -0.4, rightLegAngle: 0.4, bodyScaleX: 0.85, bodyScaleY: 0.85, headOffsetX: 0, headOffsetY: 0 },
  ],
  GRAB: [
    { leftArmAngle: -0.2, rightArmAngle: 1.2, leftLegAngle: -0.1, rightLegAngle: 0.1, bodyScaleX: 1, bodyScaleY: 1, headOffsetX: 5, headOffsetY: 0 },
  ],
  GRAB_HOLDING: [
    { leftArmAngle: 0.8, rightArmAngle: -0.8, leftLegAngle: 0.2, rightLegAngle: -0.2, bodyScaleX: 1, bodyScaleY: 1, headOffsetX: 0, headOffsetY: 0 },
  ],
  // Ledge states
  LEDGE_HANG: [
    // Arms raised in gripping pose, body slightly lowered
    { leftArmAngle: -2.0, rightArmAngle: 2.0, leftLegAngle: 0.3, rightLegAngle: -0.3, bodyScaleX: 0.95, bodyScaleY: 0.9, headOffsetX: 0, headOffsetY: 5 },
  ],
  LEDGE_CLIMB: [
    // Start: arms raised, body low (like hang)
    { leftArmAngle: -2.0, rightArmAngle: 2.0, leftLegAngle: 0.3, rightLegAngle: -0.3, bodyScaleX: 0.95, bodyScaleY: 0.9, headOffsetX: 0, headOffsetY: 5 },
    // Mid: pulling up, arms lowering
    { leftArmAngle: -1.0, rightArmAngle: 1.0, leftLegAngle: 0.5, rightLegAngle: -0.5, bodyScaleX: 1.0, bodyScaleY: 0.95, headOffsetX: 0, headOffsetY: 2 },
    // End: upright, transitioning to IDLE
    DEFAULT_POSE,
  ],
  LEDGE_JUMP: [
    // Crouched launch: arms pushing down, legs extending
    { leftArmAngle: 0.5, rightArmAngle: -0.5, leftLegAngle: 0.6, rightLegAngle: -0.6, bodyScaleX: 1.05, bodyScaleY: 0.85, headOffsetX: 0, headOffsetY: 4 },
    // Extending upward
    { leftArmAngle: -0.8, rightArmAngle: 0.8, leftLegAngle: -0.3, rightLegAngle: 0.3, bodyScaleX: 1, bodyScaleY: 1.05, headOffsetX: 0, headOffsetY: -3 },
  ],
  LEDGE_ATTACK: [
    // Wind-up: crouched
    { leftArmAngle: -0.3, rightArmAngle: 0.3, leftLegAngle: 0.4, rightLegAngle: -0.4, bodyScaleX: 0.95, bodyScaleY: 0.9, headOffsetX: 0, headOffsetY: 3 },
    // Active: arm extended forward aggressively
    { leftArmAngle: -0.3, rightArmAngle: 1.6, leftLegAngle: -0.1, rightLegAngle: 0.1, bodyScaleX: 1.05, bodyScaleY: 1, headOffsetX: 6, headOffsetY: 0 },
    // Recovery: back to neutral
    DEFAULT_POSE,
  ],
  LEDGE_ROLL: [
    // Start: body extended from ledge, arms tucked
    DEFAULT_POSE,
    // Mid: rolling/tucked position
    { leftArmAngle: 0.8, rightArmAngle: 0.8, leftLegAngle: 0.8, rightLegAngle: 0.8, bodyScaleX: 0.8, bodyScaleY: 0.8, headOffsetX: 0, headOffsetY: 0 },
    // End: upright
    DEFAULT_POSE,
  ],
};

export function getAnimationPose(stateName: string, stateFrame: number, currentMoveId?: MoveId | null, characterId?: CharacterId): JointPose {
  const moveId = currentMoveId as AttackMoveId | null | undefined;

  // Character-specific tables checked FIRST, then fall back to shared
  const isLincoln = characterId === 'abe-lincoln';

  const moveSpecificAnim =
    (stateName === 'ATTACK' || stateName === 'AIR_ATTACK') && moveId
      ? (isLincoln ? LINCOLN_ATTACK_ANIMATIONS[moveId] : undefined) ?? ATTACK_MOVE_ANIMATIONS[moveId]
      : undefined;

  const characterAnim = isLincoln ? LINCOLN_ANIMATIONS[stateName] : undefined;
  const anim = moveSpecificAnim ?? characterAnim ?? (stateName === 'AIR_ATTACK' ? ANIMATIONS['ATTACK'] : ANIMATIONS[stateName]) ?? ANIMATIONS['IDLE']!;
  if (anim.length === 0) return DEFAULT_POSE;
  if (anim.length === 1) return anim[0]!;
  
  const totalFrames = 30; // default animation cycle
  const t = (stateFrame % totalFrames) / totalFrames;
  const scaledT = t * (anim.length - 1);
  const idx = Math.floor(scaledT);
  const alpha = scaledT - idx;
  
  const from = anim[Math.min(idx, anim.length - 1)]!;
  const to = anim[Math.min(idx + 1, anim.length - 1)]!;
  
  return {
    leftArmAngle: lerp(from.leftArmAngle, to.leftArmAngle, alpha),
    rightArmAngle: lerp(from.rightArmAngle, to.rightArmAngle, alpha),
    leftLegAngle: lerp(from.leftLegAngle, to.leftLegAngle, alpha),
    rightLegAngle: lerp(from.rightLegAngle, to.rightLegAngle, alpha),
    bodyScaleX: lerp(from.bodyScaleX, to.bodyScaleX, alpha),
    bodyScaleY: lerp(from.bodyScaleY, to.bodyScaleY, alpha),
    headOffsetX: lerp(from.headOffsetX, to.headOffsetX, alpha),
    headOffsetY: lerp(from.headOffsetY, to.headOffsetY, alpha),
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
