import type { HitboxData } from './GameState.js';

export enum MoveId {
  JAB = 'JAB',
  FORWARD_TILT = 'FORWARD_TILT',
  UP_TILT = 'UP_TILT',
  DOWN_TILT = 'DOWN_TILT',
  FORWARD_SMASH = 'FORWARD_SMASH',
  UP_SMASH = 'UP_SMASH',
  DOWN_SMASH = 'DOWN_SMASH',
  NEUTRAL_AIR = 'NEUTRAL_AIR',
  FORWARD_AIR = 'FORWARD_AIR',
  BACK_AIR = 'BACK_AIR',
  UP_AIR = 'UP_AIR',
  DOWN_AIR = 'DOWN_AIR',
  NEUTRAL_SPECIAL = 'NEUTRAL_SPECIAL',
  SIDE_SPECIAL = 'SIDE_SPECIAL',
  UP_SPECIAL = 'UP_SPECIAL',
  DOWN_SPECIAL = 'DOWN_SPECIAL',
  GRAB = 'GRAB',
  PUMMEL = 'PUMMEL',
  FORWARD_THROW = 'FORWARD_THROW',
  BACK_THROW = 'BACK_THROW',
  UP_THROW = 'UP_THROW',
  DOWN_THROW = 'DOWN_THROW',
  LEDGE_ATTACK = 'LEDGE_ATTACK',
}

export interface MoveData {
  id: MoveId;
  startupFrames: number;
  activeFrames: number;
  recoveryFrames: number;
  hitboxPerActiveFrame: HitboxData[];
  landingLag: number;
  isAerial: boolean;
  isGrab: boolean;
  isSpecial: boolean;
  chargeMax?: number;
}
