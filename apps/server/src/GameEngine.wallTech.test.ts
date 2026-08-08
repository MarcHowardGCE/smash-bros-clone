import { describe, expect, it } from 'vitest';
import {
	PHYSICS,
	PlayerStateEnum,
	INPUT_BITS,
	type GameState,
	type InputEvent,
	type PlayerId,
	type PlayerState,
} from '@smash/shared';
import { GameEngine } from './GameEngine.js';

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
	const inputMap = new Map<PlayerId, InputEvent | null>();
	const playerIds = Object.keys(getMutableState(engine).players) as PlayerId[];

	for (const playerId of playerIds) {
		inputMap.set(playerId, inputs[playerId] ?? null);
	}

	return engine.tickGame(inputMap);
}

describe('GameEngine wall tech integration', () => {
	it('wall contact during tumble/hitstun with buffered tech cancels horizontal momentum and returns AIRBORNE control', () => {
		const engine = new GameEngine({ playerIds: ['p1'] });
		primePlayer(engine, 'p1', {
			x: -260,
			y: 450,
			vx: 3,
			vy: 0,
			state: PlayerStateEnum.HITSTUN,
			stateFrame: 0,
			isGrounded: false,
			isTumbling: true,
			hitstunFramesRemaining: 5,
			techWindowFrames: 2,
			isInvincible: false,
			invincibilityFrames: 0,
		});

		const state = tick(engine, { p1: null });
		const player = state.players.p1;

		expect(player).toBeDefined();
		if (!player) {
			throw new Error('Expected player p1 after wall-tech tick');
		}

		expect(player.vx).toBe(0);
		expect(player.isInvincible).toBe(true);
		expect(player.invincibilityFrames).toBe(PHYSICS.WALL_TECH_INTANGIBILITY_FRAMES);
		expect(player.state).toBe(PlayerStateEnum.AIRBORNE);
		expect(player.isTumbling).toBe(false);
		expect(player.hitstunFramesRemaining).toBe(0);
	});

	it('wall contact during tumble/hitstun without tech window continues normal tumble/hitstun behavior', () => {
		const engine = new GameEngine({ playerIds: ['p1'] });
		primePlayer(engine, 'p1', {
			x: -260,
			y: 450,
			vx: 3,
			vy: 0,
			state: PlayerStateEnum.HITSTUN,
			stateFrame: 0,
			isGrounded: false,
			isTumbling: true,
			hitstunFramesRemaining: 5,
			techWindowFrames: 0,
			isInvincible: false,
			invincibilityFrames: 0,
		});

		const state = tick(engine, { p1: null });
		const player = state.players.p1;

		expect(player).toBeDefined();
		if (!player) {
			throw new Error('Expected player p1 after missed wall-tech tick');
		}

		expect(player.vx).toBe(3);
		expect(player.isInvincible).toBe(false);
		expect(player.invincibilityFrames).toBe(0);
		expect(player.state).toBe(PlayerStateEnum.HITSTUN);
		expect(player.isTumbling).toBe(true);
		expect(player.hitstunFramesRemaining).toBe(4);
		expect(player.techLockoutFrames).toBe(PHYSICS.TECH_LOCKOUT_FRAMES);
	});

	it('missed wall-tech applies tech lockout penalty', () => {
		const engine = new GameEngine({ playerIds: ['p1'] });
		primePlayer(engine, 'p1', {
			x: -260,
			y: 450,
			vx: 3,
			vy: 0,
			state: PlayerStateEnum.HITSTUN,
			stateFrame: 0,
			isGrounded: false,
			isTumbling: true,
			hitstunFramesRemaining: 5,
			techWindowFrames: 0,
			isInvincible: false,
			invincibilityFrames: 0,
			techLockoutFrames: 0,
		});

		const state = tick(engine, { p1: null });
		const player = state.players.p1;

		expect(player).toBeDefined();
		if (!player) {
			throw new Error('Expected player p1 after missed wall-tech tick');
		}

		// Verify tech lockout is applied
		expect(player.techLockoutFrames).toBe(PHYSICS.TECH_LOCKOUT_FRAMES);
	});

	it('during tech lockout, buffered shield press does NOT trigger tech', () => {
		const engine = new GameEngine({ playerIds: ['p1'] });
		primePlayer(engine, 'p1', {
			x: 0, // Not at wall
			y: 450,
			vx: 0,
			vy: 0,
			state: PlayerStateEnum.HITSTUN,
			stateFrame: 0,
			isGrounded: false,
			isTumbling: true,
			hitstunFramesRemaining: 5,
			techWindowFrames: 0,
			isInvincible: false,
			invincibilityFrames: 0,
			techLockoutFrames: 10,
		});

		// Attempt to buffer a tech with shield press
		const state = tick(engine, { p1: { tick: 0, seq: 0, playerId: 'p1', held: INPUT_BITS.SHIELD, pressed: 0, released: 0 } });
		const player = state.players.p1;

		expect(player).toBeDefined();
		if (!player) {
			throw new Error('Expected player p1 after lockout enforcement tick');
		}

		// Verify tech lockout is decremented but tech is NOT triggered
		expect(player.techLockoutFrames).toBe(9);
		expect(player.state).toBe(PlayerStateEnum.HITSTUN);
		expect(player.isTumbling).toBe(true);
	});

	it('wall contact during tumble with buffered tech and JUMP held applies wall-jump velocity and keeps wall-tech invincibility', () => {
		const engine = new GameEngine({ playerIds: ['p1'] });
		primePlayer(engine, 'p1', {
			x: -260,
			y: 450,
			vx: 3,
			vy: 0,
			state: PlayerStateEnum.HITSTUN,
			stateFrame: 0,
			isGrounded: false,
			isTumbling: true,
			hitstunFramesRemaining: 5,
			techWindowFrames: 2,
			isInvincible: false,
			invincibilityFrames: 0,
			wallJumpStreak: 0,
			hasDoubleJump: true,
		});

		const jumpInput: InputEvent = {
			tick: 0,
			seq: 0,
			playerId: 'p1',
			held: INPUT_BITS.JUMP,
			pressed: 0,
			released: 0,
		};

		const state = tick(engine, { p1: jumpInput });
		const player = state.players.p1;

		expect(player).toBeDefined();
		if (!player) {
			throw new Error('Expected player p1 after wall-tech-jump tick');
		}

		// Wall-jump velocity should be applied (left wall, so positive vx)
		const expectedVx =
			PHYSICS.WALL_JUMP_HORIZONTAL_VELOCITY *
			1 * // left wall = positive direction
			Math.max(
				PHYSICS.WALL_JUMP_MIN_VELOCITY_MULTIPLIER,
				Math.pow(PHYSICS.WALL_JUMP_HEIGHT_DECAY, 0), // wallJumpStreak was 0
			);
		const expectedVy =
			PHYSICS.WALL_JUMP_VERTICAL_VELOCITY *
			Math.max(
				PHYSICS.WALL_JUMP_MIN_VELOCITY_MULTIPLIER,
				Math.pow(PHYSICS.WALL_JUMP_HEIGHT_DECAY, 0),
			);

		expect(player.vx).toBe(expectedVx);
		expect(player.vy).toBe(expectedVy);
		expect(player.isInvincible).toBe(true);
		// Wall-tech invincibility (12 frames) should be used, NOT wall-jump invincibility (8 frames)
		expect(player.invincibilityFrames).toBe(PHYSICS.WALL_TECH_INTANGIBILITY_FRAMES);
		expect(player.state).toBe(PlayerStateEnum.AIRBORNE);
		expect(player.isTumbling).toBe(false);
		expect(player.hitstunFramesRemaining).toBe(0);
		expect(player.wallJumpStreak).toBe(1); // Incremented from 0
		expect(player.hasDoubleJump).toBe(true); // Restored by wall-jump logic
	});

	it('wall contact during tumble with buffered tech but no JUMP input cancels momentum without wall-jump velocity', () => {
		const engine = new GameEngine({ playerIds: ['p1'] });
		primePlayer(engine, 'p1', {
			x: -260,
			y: 450,
			vx: 3,
			vy: 0,
			state: PlayerStateEnum.HITSTUN,
			stateFrame: 0,
			isGrounded: false,
			isTumbling: true,
			hitstunFramesRemaining: 5,
			techWindowFrames: 2,
			isInvincible: false,
			invincibilityFrames: 0,
			wallJumpStreak: 0,
		});

		const noJumpInput: InputEvent = {
			tick: 0,
			seq: 0,
			playerId: 'p1',
			held: 0, // No JUMP held
			pressed: 0,
			released: 0,
		};

		const state = tick(engine, { p1: noJumpInput });
		const player = state.players.p1;

		expect(player).toBeDefined();
		if (!player) {
			throw new Error('Expected player p1 after wall-tech-no-jump tick');
		}

		// Plain wall-tech: momentum cancelled, no wall-jump velocity
		expect(player.vx).toBe(0);
		expect(player.isInvincible).toBe(true);
		expect(player.invincibilityFrames).toBe(PHYSICS.WALL_TECH_INTANGIBILITY_FRAMES);
		expect(player.state).toBe(PlayerStateEnum.AIRBORNE);
		expect(player.isTumbling).toBe(false);
		expect(player.hitstunFramesRemaining).toBe(0);
		expect(player.wallJumpStreak).toBe(0); // NOT incremented (no wall-jump)
	});
});
