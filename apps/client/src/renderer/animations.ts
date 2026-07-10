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
    DEFAULT_POSE,
    { leftArmAngle: -1.5, rightArmAngle: 1.5, leftLegAngle: -0.2, rightLegAngle: 0.2, bodyScaleX: 1, bodyScaleY: 1, headOffsetX: 5, headOffsetY: 0 },
    DEFAULT_POSE,
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
};

export function getAnimationPose(stateName: string, stateFrame: number): JointPose {
  const anim = ANIMATIONS[stateName] ?? ANIMATIONS['IDLE']!;
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
