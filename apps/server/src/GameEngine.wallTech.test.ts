import { describe, expect, it } from 'vitest';
import {
	PHYSICS,
	PlayerStateEnum,
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
	});
});
