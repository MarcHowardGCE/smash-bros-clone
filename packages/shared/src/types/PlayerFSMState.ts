export enum PlayerStateEnum {
  IDLE = 'IDLE',
  WALK = 'WALK',
  DASH = 'DASH',
  RUN = 'RUN',
  JUMPSQUAT = 'JUMPSQUAT',
  AIRBORNE = 'AIRBORNE',
  DOUBLE_JUMP = 'DOUBLE_JUMP',
  ATTACK = 'ATTACK',
  AIR_ATTACK = 'AIR_ATTACK',
  SHIELD = 'SHIELD',
  ROLL = 'ROLL',
  SPOT_DODGE = 'SPOT_DODGE',
  AIR_DODGE = 'AIR_DODGE',
  HITSTUN = 'HITSTUN',
  TECH_NEUTRAL = 'TECH_NEUTRAL',
  TECH_ROLL = 'TECH_ROLL',
  HARD_LANDING = 'HARD_LANDING',
  LANDING_LAG = 'LANDING_LAG',
  GRAB = 'GRAB',
  GRAB_HOLDING = 'GRAB_HOLDING',
  LEDGE_HANG = 'LEDGE_HANG',
  LEDGE_CLIMB = 'LEDGE_CLIMB',
  LEDGE_ATTACK = 'LEDGE_ATTACK',
  LEDGE_ROLL = 'LEDGE_ROLL',
  LEDGE_JUMP = 'LEDGE_JUMP',
}

export interface PlayerState {
  isTumbling: boolean;
  techWindowFrames: number;
  techLockoutFrames: number;
  landingLagFrames: number;
}
