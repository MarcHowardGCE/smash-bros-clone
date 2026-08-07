import { describe, expect, it } from 'vitest';
import {
	MoveId,
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
	const playerIds = Object.keys(getMutableState(engine).players) as PlayerId[];
	const inputMap = new Map<PlayerId, InputEvent | null>();

	for (const playerId of playerIds) {
		inputMap.set(playerId, inputs[playerId] ?? null);
	}

	return engine.tickGame(inputMap);
}

describe('GameEngine hit event accumulation', () => {
	it('jab hit emits exactly one HitEventData entry in snapshot', () => {
		const engine = new GameEngine({ playerIds: ['p1', 'p2'] });

		primePlayer(engine, 'p1', {
			x: 640,
			y: 300,
			facing: 1,
			state: PlayerStateEnum.ATTACK,
			stateFrame: 2,
			isGrounded: true,
			isInvincible: false,
			invincibilityFrames: 0,
			hitlagFramesRemaining: 0,
			hitstunFramesRemaining: 0,
			currentMoveId: MoveId.JAB,
			staleMoveQueue: [],
			hitPlayerIds: new Set<string>(),
			activeHitbox: {
				offsetX: 0,
				offsetY: 0,
				radius: 20,
				damage: 4,
				baseKnockback: 12,
				knockbackGrowth: 100,
				knockbackAngle: 45,
				hitlagFrames: 3,
				hitstunFrames: 8,
				priority: 2,
			},
		});

		primePlayer(engine, 'p2', {
			x: 650,
			y: 300,
			state: PlayerStateEnum.IDLE,
			stateFrame: 0,
			isGrounded: true,
			isInvincible: false,
			invincibilityFrames: 0,
			hitlagFramesRemaining: 0,
			hitstunFramesRemaining: 0,
			activeHitbox: null,
			currentMoveId: null,
		});

		tick(engine, { p1: null, p2: null });
		const snapshot = engine.getSnapshot(0, { p1: -1, p2: -1 });

		expect(snapshot.hitEvents).toHaveLength(1);
		expect(snapshot.hitEvents[0]).toMatchObject({
			attackerId: 'p1',
			defenderId: 'p2',
			moveId: MoveId.JAB,
			worldX: 650,
			worldY: 300,
		});
		expect(snapshot.hitEvents[0]?.damage ?? 0).toBeGreaterThan(0);
		expect(snapshot.hitEvents[0]?.knockbackMagnitude ?? 0).toBeGreaterThan(0);
	});

	it('no hits produce an empty hitEvents array', () => {
		const engine = new GameEngine({ playerIds: ['p1', 'p2'] });
		tick(engine, { p1: null, p2: null });

		const snapshot = engine.getSnapshot(0, { p1: -1, p2: -1 });
		expect(snapshot.hitEvents).toEqual([]);
	});
});
