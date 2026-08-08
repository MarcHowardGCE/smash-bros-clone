import { describe, expect, it } from 'vitest';
import {
	PHYSICS,
	PlayerStateEnum,
	INPUT_BITS,
	type GameState,
	type InputEvent,
	type PlayerId,
	type PlayerState,
	MoveId,
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

describe('GameEngine L-cancel window tracking', () => {
	it('shield press during AIR_ATTACK sets lCancelWindowFrames to 7', () => {
		const engine = new GameEngine({ playerIds: ['p1'] });
		primePlayer(engine, 'p1', {
			x: 640,
			y: 300,
			vx: 0,
			vy: 0,
			state: PlayerStateEnum.AIR_ATTACK,
			stateFrame: 5,
			isGrounded: false,
			lCancelWindowFrames: 0,
		});

		const shieldInput: InputEvent = {
			tick: 0,
			seq: 0,
			playerId: 'p1',
			held: INPUT_BITS.SHIELD,
			pressed: INPUT_BITS.SHIELD,
			released: 0,
		};

		const state = tick(engine, { p1: shieldInput });
		const player = state.players.p1;

		expect(player).toBeDefined();
		if (!player) {
			throw new Error('Expected player p1 after shield press during AIR_ATTACK');
		}

		expect(player.lCancelWindowFrames).toBe(PHYSICS.L_CANCEL_WINDOW_FRAMES);
	});

	it('lCancelWindowFrames counts down by 1 each tick when not reset', () => {
		const engine = new GameEngine({ playerIds: ['p1'] });
		primePlayer(engine, 'p1', {
			x: 640,
			y: 300,
			vx: 0,
			vy: 0,
			state: PlayerStateEnum.AIRBORNE,
			stateFrame: 5,
			isGrounded: false,
			lCancelWindowFrames: 7,
		});

		// Tick with no input (no shield press)
		const state = tick(engine, { p1: null });
		const player = state.players.p1;

		expect(player).toBeDefined();
		if (!player) {
			throw new Error('Expected player p1 after countdown tick');
		}

		expect(player.lCancelWindowFrames).toBe(6);
	});

	it('lCancelWindowFrames counts down from 7 to 0 over 7 ticks', () => {
		const engine = new GameEngine({ playerIds: ['p1'] });
		primePlayer(engine, 'p1', {
			x: 640,
			y: 300,
			vx: 0,
			vy: 0,
			state: PlayerStateEnum.AIRBORNE,
			stateFrame: 0,
			isGrounded: false,
			lCancelWindowFrames: 7,
		});

		// Tick 1: 7 -> 6
		let state = tick(engine, { p1: null });
		expect(state.players.p1?.lCancelWindowFrames).toBe(6);

		// Tick 2: 6 -> 5
		state = tick(engine, { p1: null });
		expect(state.players.p1?.lCancelWindowFrames).toBe(5);

		// Tick 3: 5 -> 4
		state = tick(engine, { p1: null });
		expect(state.players.p1?.lCancelWindowFrames).toBe(4);

		// Tick 4: 4 -> 3
		state = tick(engine, { p1: null });
		expect(state.players.p1?.lCancelWindowFrames).toBe(3);

		// Tick 5: 3 -> 2
		state = tick(engine, { p1: null });
		expect(state.players.p1?.lCancelWindowFrames).toBe(2);

		// Tick 6: 2 -> 1
		state = tick(engine, { p1: null });
		expect(state.players.p1?.lCancelWindowFrames).toBe(1);

		// Tick 7: 1 -> 0
		state = tick(engine, { p1: null });
		expect(state.players.p1?.lCancelWindowFrames).toBe(0);

		// Tick 8: 0 stays 0 (floored)
		state = tick(engine, { p1: null });
		expect(state.players.p1?.lCancelWindowFrames).toBe(0);
	});

	it('shield press outside AIR_ATTACK state does NOT set lCancelWindowFrames', () => {
		const engine = new GameEngine({ playerIds: ['p1'] });
		primePlayer(engine, 'p1', {
			x: 640,
			y: 300,
			vx: 0,
			vy: 0,
			state: PlayerStateEnum.AIRBORNE,
			stateFrame: 5,
			isGrounded: false,
			lCancelWindowFrames: 0,
		});

		const shieldInput: InputEvent = {
			tick: 0,
			seq: 0,
			playerId: 'p1',
			held: INPUT_BITS.SHIELD,
			pressed: INPUT_BITS.SHIELD,
			released: 0,
		};

		const state = tick(engine, { p1: shieldInput });
		const player = state.players.p1;

		expect(player).toBeDefined();
		if (!player) {
			throw new Error('Expected player p1 after shield press during AIRBORNE');
		}

		// Should remain 0 since we're not in AIR_ATTACK
		expect(player.lCancelWindowFrames).toBe(0);
	});

	it('lCancelWindowFrames never goes negative (floored at 0)', () => {
		const engine = new GameEngine({ playerIds: ['p1'] });
		primePlayer(engine, 'p1', {
			x: 640,
			y: 300,
			vx: 0,
			vy: 0,
			state: PlayerStateEnum.AIRBORNE,
			stateFrame: 0,
			isGrounded: false,
			lCancelWindowFrames: 0,
		});

		// Tick multiple times with lCancelWindowFrames already at 0
		for (let i = 0; i < 5; i++) {
			const state = tick(engine, { p1: null });
			expect(state.players.p1?.lCancelWindowFrames).toBe(0);
		}
	});

	it('L-cancel halving: NEUTRAL_AIR landing + lCancelWindowFrames > 0 → landingLagFrames halved', () => {
		const engine = new GameEngine({ playerIds: ['p1'] });
		const STAGE = { MAIN_PLATFORM: { y: 500 } };
		primePlayer(engine, 'p1', {
			x: 640,
			y: STAGE.MAIN_PLATFORM.y - PHYSICS.HURTBOX_RADIUS - 1,
			vx: 0,
			vy: 4,
			state: PlayerStateEnum.AIR_ATTACK,
			stateFrame: 5,
			isGrounded: false,
			lCancelWindowFrames: 3,
			currentMoveId: MoveId.NEUTRAL_AIR,
			currentMove: {
				landingLag: 6,
				isSpecial: false,
			},
		});

		const state = tick(engine, { p1: null });
		const player = state.players.p1;

		expect(player).toBeDefined();
		if (!player) {
			throw new Error('Expected player p1 after landing');
		}

		// NEUTRAL_AIR has landingLag: 6, halved = floor(6 / 2) = 3
		expect(player.landingLagFrames).toBe(3);
		expect(player.state).toBe(PlayerStateEnum.LANDING_LAG);
	});

	it('L-cancel halving: NEUTRAL_AIR landing + lCancelWindowFrames = 0 → landingLagFrames full (not halved)', () => {
		const engine = new GameEngine({ playerIds: ['p1'] });
		const STAGE = { MAIN_PLATFORM: { y: 500 } };
		primePlayer(engine, 'p1', {
			x: 640,
			y: STAGE.MAIN_PLATFORM.y - PHYSICS.HURTBOX_RADIUS - 1,
			vx: 0,
			vy: 4,
			state: PlayerStateEnum.AIR_ATTACK,
			stateFrame: 5,
			isGrounded: false,
			lCancelWindowFrames: 0,
			currentMoveId: MoveId.NEUTRAL_AIR,
			currentMove: {
				landingLag: 6,
				isSpecial: false,
			},
		});

		const state = tick(engine, { p1: null });
		const player = state.players.p1;

		expect(player).toBeDefined();
		if (!player) {
			throw new Error('Expected player p1 after landing');
		}

		// NEUTRAL_AIR has landingLag: 6, but lCancelWindowFrames = 0, so no halving → 6
		expect(player.landingLagFrames).toBe(6);
		expect(player.state).toBe(PlayerStateEnum.LANDING_LAG);
	});

	it('L-cancel halving: UP_SPECIAL landing + lCancelWindowFrames > 0 → landingLagFrames full (specials excluded)', () => {
		const engine = new GameEngine({ playerIds: ['p1'] });
		const STAGE = { MAIN_PLATFORM: { y: 500 } };
		primePlayer(engine, 'p1', {
			x: 640,
			y: STAGE.MAIN_PLATFORM.y - PHYSICS.HURTBOX_RADIUS - 1,
			vx: 0,
			vy: 4,
			state: PlayerStateEnum.AIR_ATTACK,
			stateFrame: 5,
			isGrounded: false,
			lCancelWindowFrames: 5,
			currentMoveId: MoveId.UP_SPECIAL,
			currentMove: {
				landingLag: 14,
				isSpecial: true,
			},
		});

		const state = tick(engine, { p1: null });
		const player = state.players.p1;

		expect(player).toBeDefined();
		if (!player) {
			throw new Error('Expected player p1 after landing');
		}

		// UP_SPECIAL has landingLag: 14 and isSpecial: true, so NO halving even with lCancelWindowFrames > 0 → 14
		expect(player.landingLagFrames).toBe(14);
		expect(player.state).toBe(PlayerStateEnum.LANDING_LAG);
	});
});
