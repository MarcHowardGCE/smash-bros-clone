import { describe, expect, it } from 'vitest';
import {
	INPUT_BITS,
	MoveId,
	PHYSICS,
	PlayerStateEnum,
	type GameState,
	type HitboxData,
	type InputEvent,
	type PlayerId,
	type PlayerState,
} from '@smash/shared';
import { GameEngine } from './GameEngine.js';

function makeInput(playerId: PlayerId, bits = 0): InputEvent {
	return {
		tick: 0,
		seq: 0,
		playerId,
		held: bits,
		pressed: bits,
		released: 0,
	};
}

function createEngine(playerIds: PlayerId[] = ['p1', 'p2']): GameEngine {
	return new GameEngine({ playerIds });
}

function getMutableState(engine: GameEngine): GameState {
	return (engine as unknown as { state: GameState }).state;
}

function primePlayer(
	engine: GameEngine,
	playerId: PlayerId,
	overrides: Partial<PlayerState>,
): void {
	const state = getMutableState(engine);
	const player = state.players[playerId];

	if (!player) {
		throw new Error(`Unknown player: ${playerId}`);
	}

	state.players[playerId] = {
		...player,
		chargeFrames: 0,
		...overrides,
	};
}

function applyShieldHitScenario(
	engine: GameEngine,
	{
		damage,
		attackerX,
		defenderX,
		attackerFacing,
		defenderStateFrame,
	}: {
		damage: number;
		attackerX: number;
		defenderX: number;
		attackerFacing: 1 | -1;
		defenderStateFrame: number;
	},
): { attacker: PlayerState; defender: PlayerState } {
	const state = getMutableState(engine);
	const attacker = state.players.p1;
	const defender = state.players.p2;

	if (!attacker || !defender) {
		throw new Error('Expected players p1 and p2');
	}

	const hitbox: HitboxData = {
		offsetX: 0,
		offsetY: 0,
		radius: PHYSICS.HURTBOX_RADIUS + 5,
		damage,
		baseKnockback: 12,
		knockbackGrowth: 100,
		knockbackAngle: 45,
		hitlagFrames: 0,
		hitstunFrames: 30,
		priority: 2,
	};

	state.players.p1 = {
		...attacker,
		x: attackerX,
		y: 300,
		facing: attackerFacing,
		state: PlayerStateEnum.ATTACK,
		stateFrame: 0,
		isGrounded: true,
		isInvincible: false,
		invincibilityFrames: 0,
		hitlagFramesRemaining: 0,
		currentMoveId: MoveId.JAB,
		staleMoveQueue: [MoveId.JAB],
		vx: 0,
		vy: 0,
		activeHitbox: hitbox,
	};

	state.players.p2 = {
		...defender,
		x: defenderX,
		y: 300,
		state: PlayerStateEnum.SHIELD,
		stateFrame: defenderStateFrame,
		isShielding: true,
		isGrounded: true,
		isInvincible: false,
		invincibilityFrames: 0,
		hitlagFramesRemaining: 0,
		hitstunFramesRemaining: 0,
		shieldHealth: 100,
		vx: 0,
		vy: 0,
	};

	(
		engine as unknown as {
			applyHitDetection: (players: Record<PlayerId, PlayerState>) => void;
		}
	).applyHitDetection(state.players);

	const updatedAttacker = state.players.p1;
	const updatedDefender = state.players.p2;
	if (!updatedAttacker || !updatedDefender) {
		throw new Error('Expected updated players p1 and p2');
	}

	return {
		attacker: updatedAttacker,
		defender: updatedDefender,
	};
}

describe('Perfect Shield (Powershield)', () => {
	it('PERFECT_SHIELD_WINDOW_FRAMES constant is defined and equals 4', () => {
		expect(PHYSICS.PERFECT_SHIELD_WINDOW_FRAMES).toBe(4);
	});

	it('hit landing at shield-frame 2 (within perfect-shield window) produces shieldStunFrames === 0 and unchanged shieldHealth', () => {
		const engine = createEngine();
		const damage = 10;

		const { defender } = applyShieldHitScenario(engine, {
			damage,
			attackerX: 640,
			defenderX: 640,
			attackerFacing: 1,
			defenderStateFrame: 2, // within PERFECT_SHIELD_WINDOW_FRAMES (0-3)
		});

		// Perfect shield: no stun, no health drain
		expect(defender.shieldStunFrames).toBe(0);
		expect(defender.shieldHealth).toBe(100); // unchanged
	});

	it('hit landing at shield-frame 0 (first frame of perfect-shield window) produces shieldStunFrames === 0 and unchanged shieldHealth', () => {
		const engine = createEngine();
		const damage = 15;

		const { defender } = applyShieldHitScenario(engine, {
			damage,
			attackerX: 640,
			defenderX: 640,
			attackerFacing: 1,
			defenderStateFrame: 0, // first frame of window
		});

		expect(defender.shieldStunFrames).toBe(0);
		expect(defender.shieldHealth).toBe(100);
	});

	it('hit landing at shield-frame 3 (last frame of perfect-shield window) produces shieldStunFrames === 0 and unchanged shieldHealth', () => {
		const engine = createEngine();
		const damage = 8;

		const { defender } = applyShieldHitScenario(engine, {
			damage,
			attackerX: 640,
			defenderX: 640,
			attackerFacing: 1,
			defenderStateFrame: 3, // last frame of window
		});

		expect(defender.shieldStunFrames).toBe(0);
		expect(defender.shieldHealth).toBe(100);
	});

	it('hit landing at shield-frame 4 (outside perfect-shield window) produces normal shield-stun formula and drained shieldHealth', () => {
		const engine = createEngine();
		const damage = 10;

		const { defender } = applyShieldHitScenario(engine, {
			damage,
			attackerX: 640,
			defenderX: 640,
			attackerFacing: 1,
			defenderStateFrame: 4, // outside window (>= PERFECT_SHIELD_WINDOW_FRAMES)
		});

		// Normal shield: stun and drain apply
		const expectedStun = Math.floor(damage * 0.8) + 2; // Math.floor(10 * 0.8) + 2 = 10
		const expectedHealth = 100 - damage; // 90

		expect(defender.shieldStunFrames).toBe(expectedStun);
		expect(defender.shieldHealth).toBe(expectedHealth);
	});

	it('hit landing at shield-frame 10 (well outside perfect-shield window) produces normal shield-stun formula and drained shieldHealth', () => {
		const engine = createEngine();
		const damage = 20;

		const { defender } = applyShieldHitScenario(engine, {
			damage,
			attackerX: 640,
			defenderX: 640,
			attackerFacing: 1,
			defenderStateFrame: 10, // well outside window
		});

		// Normal shield: stun and drain apply
		const expectedStun = Math.floor(damage * 0.8) + 2; // Math.floor(20 * 0.8) + 2 = 18
		const expectedHealth = 100 - damage; // 80

		expect(defender.shieldStunFrames).toBe(expectedStun);
		expect(defender.shieldHealth).toBe(expectedHealth);
	});

	it('perfect shield does not prevent shield break when shield health reaches 0', () => {
		const engine = createEngine();
		const damage = 150; // enough to break shield

		const { defender } = applyShieldHitScenario(engine, {
			damage,
			attackerX: 640,
			defenderX: 640,
			attackerFacing: 1,
			defenderStateFrame: 2, // within perfect-shield window
		});

		// Shield break overrides perfect shield protection
		expect(defender.state).toBe(PlayerStateEnum.HITSTUN);
		expect(defender.shieldHealth).toBe(0);
	});

	it('perfect shield with high damage (but not breaking shield) still prevents stun and drain', () => {
		const engine = createEngine();
		const damage = 50; // high but not breaking

		const { defender } = applyShieldHitScenario(engine, {
			damage,
			attackerX: 640,
			defenderX: 640,
			attackerFacing: 1,
			defenderStateFrame: 1, // within perfect-shield window
		});

		// Perfect shield: no stun, no health drain (even with high damage)
		expect(defender.shieldStunFrames).toBe(0);
		expect(defender.shieldHealth).toBe(100);
	});

	it('normal shield (outside window) with damage 5 produces correct stun and drain', () => {
		const engine = createEngine();
		const damage = 5;

		const { defender } = applyShieldHitScenario(engine, {
			damage,
			attackerX: 640,
			defenderX: 640,
			attackerFacing: 1,
			defenderStateFrame: 5, // outside window
		});

		const expectedStun = Math.floor(5 * 0.8) + 2; // 6
		expect(defender.shieldStunFrames).toBe(expectedStun);
		expect(defender.shieldHealth).toBe(95);
	});
});
