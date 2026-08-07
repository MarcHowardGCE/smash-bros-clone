import { describe, expect, it } from 'vitest';
import {
	MoveId,
	PHYSICS,
	PlayerStateEnum,
	knockbackAngleToVelocity,
	type GameState,
	type HitboxData,
	type InputEvent,
	type PlayerId,
	type PlayerState,
} from '@smash/shared';
import { checkHitboxCollision } from '@smash/engine';
import { calculateKnockback } from '../../../packages/engine/src/hitbox/index.js';
import { GameEngine } from './GameEngine.js';

function createEngine(): GameEngine {
	return new GameEngine({ playerIds: ['p1', 'p2'] });
}

function getMutableState(engine: GameEngine): GameState {
	return (engine as unknown as { state: GameState }).state;
}

function applyHitDetection(engine: GameEngine): void {
	const state = getMutableState(engine);
	(
		engine as unknown as {
			applyHitDetection: (
				players: Record<PlayerId, PlayerState>,
				inputs?: Map<PlayerId, InputEvent | null>,
			) => void;
		}
	).applyHitDetection(state.players, new Map<PlayerId, InputEvent | null>());
}

function setupCounterScenario(counterStateFrame: number): {
	engine: GameEngine;
	attackerBefore: PlayerState;
	defenderBefore: PlayerState;
	hitbox: HitboxData;
} {
	const engine = createEngine();
	const state = getMutableState(engine);
	const attacker = state.players.p1;
	const defender = state.players.p2;

	if (!attacker || !defender) {
		throw new Error('Expected p1 and p2');
	}

	const hitbox: HitboxData = {
		offsetX: 0,
		offsetY: 0,
		radius: PHYSICS.HURTBOX_RADIUS + 6,
		damage: 10,
		baseKnockback: 22,
		knockbackGrowth: 110,
		knockbackAngle: 25,
		hitlagFrames: 5,
		hitstunFrames: 18,
		priority: 2,
	};

	const attackerBefore: PlayerState = {
		...attacker,
		x: 640,
		y: 300,
		facing: 1,
		percent: 40,
		state: PlayerStateEnum.ATTACK,
		stateFrame: 3,
		isGrounded: true,
		isInvincible: false,
		invincibilityFrames: 0,
		hitlagFramesRemaining: 0,
		hitstunFramesRemaining: 0,
		currentMoveId: MoveId.JAB,
		staleMoveQueue: [],
		vx: 0,
		vy: 0,
		activeHitbox: hitbox,
	};

	const defenderBefore: PlayerState = {
		...defender,
		x: 660,
		y: 300,
		facing: -1,
		percent: 0,
		state: PlayerStateEnum.ATTACK,
		stateFrame: counterStateFrame,
		isGrounded: true,
		isInvincible: false,
		invincibilityFrames: 0,
		hitlagFramesRemaining: 0,
		hitstunFramesRemaining: 0,
		currentMoveId: MoveId.DOWN_SPECIAL,
		currentMove: undefined,
		vx: 0,
		vy: 0,
		activeHitbox: null,
	};

	state.players.p1 = attackerBefore;
	state.players.p2 = defenderBefore;

	return { engine, attackerBefore, defenderBefore, hitbox };
}

describe('GameEngine Down Special counter', () => {
	it('in-window counter reflects hit and skips defender normal damage/hitstun', () => {
		const { engine, attackerBefore, defenderBefore, hitbox } = setupCounterScenario(3);
		const connectingHit = checkHitboxCollision(attackerBefore, defenderBefore, null);

		expect(connectingHit.hit).toBe(true);
		const expectedCounterDamage = Math.floor(
			connectingHit.damage * PHYSICS.COUNTER_DAMAGE_MULTIPLIER,
		);
		const expectedCounterKnockbackMagnitude =
			calculateKnockback(
				attackerBefore.percent,
				expectedCounterDamage,
				hitbox.baseKnockback,
				hitbox.knockbackGrowth,
				PHYSICS.FIGHTER_WEIGHT,
			) * PHYSICS.COUNTER_KNOCKBACK_MULTIPLIER;
		const expectedCounterVelocity = knockbackAngleToVelocity(
			expectedCounterKnockbackMagnitude,
			PHYSICS.COUNTER_ANGLE_DEGREES,
			defenderBefore.facing,
		);

		applyHitDetection(engine);
		const state = getMutableState(engine);
		const attackerAfter = state.players.p1;
		const defenderAfter = state.players.p2;

		expect(attackerAfter?.percent).toBe(attackerBefore.percent + expectedCounterDamage);
		expect(attackerAfter?.state).toBe(PlayerStateEnum.HITSTUN);
		expect(attackerAfter?.vx).toBeCloseTo(expectedCounterVelocity.x, 6);
		expect(attackerAfter?.vy).toBeCloseTo(expectedCounterVelocity.y, 6);

		expect(defenderAfter?.percent).toBe(defenderBefore.percent);
		expect(defenderAfter?.hitstunFramesRemaining).toBe(0);
		expect(defenderAfter?.currentMoveId).toBe(MoveId.DOWN_SPECIAL);
	});

	it('out-of-window counter does not trigger and defender takes normal hit', () => {
		const { engine, attackerBefore, defenderBefore } = setupCounterScenario(6);
		const expectedNormalHit = checkHitboxCollision(attackerBefore, defenderBefore, null);

		expect(expectedNormalHit.hit).toBe(true);

		applyHitDetection(engine);
		const state = getMutableState(engine);
		const attackerAfter = state.players.p1;
		const defenderAfter = state.players.p2;

		expect(defenderAfter?.percent).toBe(defenderBefore.percent + expectedNormalHit.damage);
		expect(defenderAfter?.state).toBe(PlayerStateEnum.HITSTUN);
		expect(defenderAfter?.vx).toBeCloseTo(expectedNormalHit.knockbackVx, 6);
		expect(defenderAfter?.vy).toBeCloseTo(expectedNormalHit.knockbackVy, 6);
		expect(attackerAfter?.percent).toBe(attackerBefore.percent);
	});
});
