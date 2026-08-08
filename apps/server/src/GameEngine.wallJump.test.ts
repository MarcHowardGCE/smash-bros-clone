import { describe, expect, it } from 'vitest';
import {
	INPUT_BITS,
	PHYSICS,
	PlayerStateEnum,
	type GameState,
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
		...overrides,
	};
}

function tick(
	engine: GameEngine,
	inputs: Partial<Record<PlayerId, InputEvent | null>> = {},
): GameState {
	const playerIds = Object.keys(getMutableState(engine).players) as PlayerId[];
	const inputMap = new Map<PlayerId, InputEvent | null>();

	for (const playerId of playerIds) {
		inputMap.set(playerId, inputs[playerId] ?? null);
	}

	return engine.tickGame(inputMap);
}

describe('GameEngine wall jump integration', () => {
	it('airborne touching left wall + RIGHT+JUMP injects wall-jump velocity and preserves double-jump resource', () => {
		const engine = new GameEngine({ playerIds: ['p1'] });
		primePlayer(engine, 'p1', {
			x: -260,
			y: 450,
			vx: 0,
			vy: 0,
			state: PlayerStateEnum.AIRBORNE,
			stateFrame: 0,
			isGrounded: false,
			hasDoubleJump: true,
		});

		const state = tick(engine, {
			p1: makeInput('p1', INPUT_BITS.RIGHT | INPUT_BITS.JUMP),
		});
		const player = state.players.p1;

		expect(player).toBeDefined();
		if (!player) {
			throw new Error('Expected player p1 after wall-jump tick');
		}

		expect(player.vx).toBe(PHYSICS.WALL_JUMP_HORIZONTAL_VELOCITY);
		expect(player.vy).toBe(PHYSICS.WALL_JUMP_VERTICAL_VELOCITY);
		expect(player.hasDoubleJump).toBe(true);
	});

	it('airborne touching left wall + JUMP only falls through to normal double-jump consumption', () => {
		const engine = new GameEngine({ playerIds: ['p1'] });
		primePlayer(engine, 'p1', {
			x: -260,
			y: 450,
			vx: 0,
			vy: 0,
			state: PlayerStateEnum.AIRBORNE,
			stateFrame: 0,
			isGrounded: false,
			hasDoubleJump: true,
		});

		const state = tick(engine, {
			p1: makeInput('p1', INPUT_BITS.JUMP),
		});
		const player = state.players.p1;

		expect(player).toBeDefined();
		if (!player) {
			throw new Error('Expected player p1 after jump-only tick');
		}

		expect(player.hasDoubleJump).toBe(false);
		expect(player.vx).toBe(0);
		expect(player.vy).toBe(PHYSICS.DOUBLE_JUMP_VELOCITY + PHYSICS.GRAVITY);
		expect(player.vy).not.toBe(PHYSICS.WALL_JUMP_VERTICAL_VELOCITY);
	});

	it('wall jump grants invincibility for WALL_JUMP_INTANGIBILITY_FRAMES', () => {
		const engine = new GameEngine({ playerIds: ['p1'] });
		primePlayer(engine, 'p1', {
			x: -260,
			y: 450,
			vx: 0,
			vy: 0,
			state: PlayerStateEnum.AIRBORNE,
			stateFrame: 0,
			isGrounded: false,
			hasDoubleJump: true,
		});

		const state = tick(engine, {
			p1: makeInput('p1', INPUT_BITS.RIGHT | INPUT_BITS.JUMP),
		});
		const player = state.players.p1;

		expect(player).toBeDefined();
		if (!player) {
			throw new Error('Expected player p1 after wall-jump tick');
		}

		expect(player.isInvincible).toBe(true);
		// Wall jump sets invincibilityFrames to WALL_JUMP_INTANGIBILITY_FRAMES (10)
		expect(player.invincibilityFrames).toBe(PHYSICS.WALL_JUMP_INTANGIBILITY_FRAMES);
	});

	it('wall jump invincibility decays to zero over WALL_JUMP_INTANGIBILITY_FRAMES ticks', () => {
		const engine = new GameEngine({ playerIds: ['p1', 'p2'] });
		primePlayer(engine, 'p1', {
			x: -260,
			y: 450,
			vx: 0,
			vy: 0,
			state: PlayerStateEnum.AIRBORNE,
			stateFrame: 0,
			isGrounded: false,
			hasDoubleJump: true,
		});
		primePlayer(engine, 'p2', {
			x: 100,
			y: 450,
			vx: 0,
			vy: 0,
			state: PlayerStateEnum.IDLE,
			stateFrame: 0,
			isGrounded: true,
			hasDoubleJump: true,
		});

		// Perform wall jump
		tick(engine, {
			p1: makeInput('p1', INPUT_BITS.RIGHT | INPUT_BITS.JUMP),
			p2: null,
		});

		let state = getMutableState(engine);
		let player = state.players.p1;

		// Advance WALL_JUMP_INTANGIBILITY_FRAMES + 1 more ticks to reach zero
		// updateInvincibility decrements by 1 each tick, so after 10 ticks it reaches 0
		for (let i = 0; i < PHYSICS.WALL_JUMP_INTANGIBILITY_FRAMES + 1; i++) {
			tick(engine, { p1: makeInput('p1', 0), p2: null });
			state = getMutableState(engine);
			player = state.players.p1;
		}

		expect(player).toBeDefined();
		if (!player) {
			throw new Error('Expected player p1 after invincibility decay');
		}

		expect(player.isInvincible).toBe(false);
		expect(player.invincibilityFrames).toBe(0);
	});
});
