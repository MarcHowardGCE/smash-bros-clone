import type { MoveId } from './MoveData.js';

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
  // Optional legacy/special override hook. Core hitstun now scales dynamically from knockback.
  hitstunFrames?: number;
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
	sdiInputCooldown?: number;
	hitstunFramesRemaining: number;
	isTumbling: boolean;
	techWindowFrames: number;
	techLockoutFrames: number;
	lCancelWindowFrames: number;
	landingLagFrames: number;
  percent: number;
  stocks: number;
  isGrounded: boolean;
  isKnockedOut: boolean;
  hasDoubleJump: boolean;
  hasAirDodge: boolean;
  wallJumpStreak: number;
  isFastFalling: boolean;
  isInvincible: boolean;
  invincibilityFrames: number;
  isShielding: boolean;
  shieldHealth: number;
  shieldStunFrames: number;
  isGrabbing: boolean;
  grabbedPlayerId: PlayerId | null;
  ledgeId: string | null;
	activeHitbox: HitboxData | null;
	currentMoveId: MoveId | null;
	staleMoveQueue: MoveId[];
	currentMove?: {
		landingLag: number;
		isSpecial: boolean;
	};
	hitPlayerIds: Set<string>;
	chargeFrames: number;
	asdiDriftAccumulated?: number;
	lastHitByFacing?: 1 | -1 | null;
	lastHitKnockbackAngle?: number | null;
  pendingKnockbackVx?: number | null;
  pendingKnockbackVy?: number | null;
  respawnTimer: number;
  airDodgeDirection: { x: number; y: number } | null;
}

export interface GameState {
  tick: number;
  players: Record<PlayerId, PlayerState>;
  matchPhase: 'lobby' | 'countdown' | 'match' | 'result';
  winnerId: PlayerId | null;
  ledges: Record<string, string | null>;
}

export interface HitEventData {
	attackerId: PlayerId;
	defenderId: PlayerId;
	moveId: MoveId;
	damage: number;
	knockbackMagnitude: number;
	worldX: number;
	worldY: number;
}

export interface KOEventData {
	playerId: PlayerId;
	boundary: "left" | "right" | "top" | "bottom";
	tick: number;
}

export interface StateSnapshot {
  tick: number;
  timestamp: number;
  lastConfirmedSeq: Record<PlayerId, number>;
  players: Record<PlayerId, PlayerState>;
  matchPhase: 'lobby' | 'countdown' | 'match' | 'result';
  winnerId: PlayerId | null;
  ledges: Record<string, string | null>;
	hitEvents: HitEventData[];
}
