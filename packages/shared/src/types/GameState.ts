export type PlayerId = string;

export interface Vec2 {
  x: number;
  y: number;
}

export interface Circle {
  x: number;
  y: number;
  radius: number;
}

export interface HitboxData {
  offsetX: number;
  offsetY: number;
  radius: number;
  damage: number;
  baseKnockback: number;
  knockbackGrowth: number;
  knockbackAngle: number;
  hitlagFrames: number;
  hitstunFrames: number;
  priority: number;
}

export interface PlayerState {
  id: PlayerId;
  slotIndex: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  state: string; // PlayerStateEnum value
  stateFrame: number;
  hitlagFramesRemaining: number;
  hitstunFramesRemaining: number;
  percent: number;
  stocks: number;
  isGrounded: boolean;
  isKnockedOut: boolean;
  hasDoubleJump: boolean;
  isFastFalling: boolean;
  isInvincible: boolean;
  invincibilityFrames: number;
  isShielding: boolean;
  shieldHealth: number;
  isGrabbing: boolean;
  grabbedPlayerId: PlayerId | null;
  activeHitbox: HitboxData | null;
  currentMoveId: string | null; // MoveId value
  respawnTimer: number;
}

export interface GameState {
  tick: number;
  players: Record<PlayerId, PlayerState>;
  matchPhase: 'lobby' | 'countdown' | 'match' | 'result';
  winnerId: PlayerId | null;
}

export interface StateSnapshot {
  tick: number;
  timestamp: number;
  lastConfirmedSeq: Record<PlayerId, number>;
  players: Record<PlayerId, PlayerState>;
  matchPhase: 'lobby' | 'countdown' | 'match' | 'result';
  winnerId: PlayerId | null;
}
