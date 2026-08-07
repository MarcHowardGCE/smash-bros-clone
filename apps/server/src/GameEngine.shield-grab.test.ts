import { describe, expect, it } from 'vitest';
import {
	INPUT_BITS,
	MoveId,
	PHYSICS,
	type GameState,
	type InputEvent,
	type PlayerId,
	type PlayerState,
	PlayerStateEnum,
} from '@smash/shared';
import { GameEngine } from './GameEngine.js';

function makeInput(playerId: PlayerId, pressed = 0, held = 0): InputEvent {
	return {
		tick: 0,
		seq: 0,
		playerId,
		held: held || pressed,
		pressed,
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

describe('GameEngine shield-grab integration', () => {
	it('shield-grab victim is pinned to attacker position while holding', () => {
		const engine = createEngine(['p1', 'p2']);

		primePlayer(engine, 'p1', {
			x: 700,
			y: 320,
			facing: -1,
			state: PlayerStateEnum.GRAB_HOLDING,
			stateFrame: 10,
			isGrounded: true,
			isGrabbing: true,
			grabbedPlayerId: 'p2',
			vx: 0,
			vy: 0,
		});

		primePlayer(engine, 'p2', {
			x: 900,
			y: 120,
			state: PlayerStateEnum.GRAB_HOLDING,
			stateFrame: 10,
			isGrounded: true,
			isGrabbing: true,
			vx: 3,
			vy: -2,
		});

		const state = tick(engine, { p1: null, p2: null });
		const attacker = state.players.p1;
		const victim = state.players.p2;

		expect(attacker).toBeDefined();
		expect(victim).toBeDefined();
		if (!attacker || !victim) {
			throw new Error('Expected attacker and victim');
		}

		expect(victim.x).toBe(attacker.x + PHYSICS.GRAB_OFFSET_X * attacker.facing);
		expect(victim.y).toBe(attacker.y);
		expect(victim.vx).toBe(0);
		expect(victim.vy).toBe(0);
	});
});


