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

function advance(
	engine: GameEngine,
	frames: number,
	inputs: Partial<Record<PlayerId, InputEvent | null>> = {},
): GameState {
	let state = getMutableState(engine);

	for (let index = 0; index < frames; index += 1) {
		state = tick(engine, inputs);
	}

	return state;
}

function expectHangingOnLeftLedge(player: PlayerState): void {
	expect(player.state).toBe(PlayerStateEnum.LEDGE_HANG);
	expect(player.ledgeId).toBe('left');
	expect(player.x).toBe(15);
	expect(player.y).toBe(510);
	expect(player.vx).toBe(0);
	expect(player.vy).toBe(0);
	expect(player.isGrounded).toBe(false);
}

describe('GameEngine ledge integration', () => {
	it('grabs the left ledge end-to-end via tickGame/updatePlayer and populates the ledges snapshot', () => {
		const engine = createEngine();
		primePlayer(engine, 'p1', {
			x: 10,
			y: 505,
			vx: -1,
			vy: 4,
			state: PlayerStateEnum.AIRBORNE,
			stateFrame: 0,
			isGrounded: false,
			isInvincible: false,
			invincibilityFrames: 0,
			ledgeId: null,
		});

		const state = tick(engine);
		const player = state.players.p1;

		expect(player).toBeDefined();
		if (!player) {
			throw new Error('Expected player p1');
		}

		expectHangingOnLeftLedge(player);
		expect(player.invincibilityFrames).toBe(PHYSICS.LEDGE_HANG_INVINCIBILITY_FRAMES);
		expect(player.isInvincible).toBe(true);
		expect(state.ledges.left).toBe('p1');
	});

	it('supports all 5 ledge getup options from LEDGE_HANG', () => {
		const runOption = (
			bits: number,
			expectedTransition: PlayerStateEnum,
			framesToResolve: number,
		) => {
			const engine = createEngine();
			primePlayer(engine, 'p1', {
				state: PlayerStateEnum.LEDGE_HANG,
				stateFrame: 0,
				x: 15,
				y: 510,
				vx: 0,
				vy: 0,
				isGrounded: false,
				ledgeId: 'left',
				isInvincible: true,
				invincibilityFrames: PHYSICS.LEDGE_HANG_INVINCIBILITY_FRAMES,
			});

			const transitionState = tick(engine, { p1: makeInput('p1', bits) });
			expect(transitionState.players.p1?.state).toBe(expectedTransition);

			const resolvedState = advance(engine, framesToResolve);
			const player = resolvedState.players.p1;

			expect(player).toBeDefined();
			if (!player) {
				throw new Error('Expected player p1');
			}

			return player;
		};

		const jumpPlayer = runOption(
			INPUT_BITS.JUMP,
			PlayerStateEnum.LEDGE_JUMP,
			PHYSICS.LEDGE_JUMP_FRAMES,
		);
		expect(jumpPlayer.state).toBe(PlayerStateEnum.AIRBORNE);
		expect(jumpPlayer.ledgeId).toBeNull();
		expect(jumpPlayer.vy).toBeLessThan(0);

		const climbPlayer = runOption(
			INPUT_BITS.LEFT,
			PlayerStateEnum.LEDGE_CLIMB,
			PHYSICS.LEDGE_CLIMB_FRAMES,
		);
		expect(climbPlayer.state).toBe(PlayerStateEnum.IDLE);
		expect(climbPlayer.isGrounded).toBe(true);
		expect(climbPlayer.ledgeId).toBeNull();

		const attackPlayer = runOption(
			INPUT_BITS.ATTACK,
			PlayerStateEnum.LEDGE_ATTACK,
			PHYSICS.LEDGE_ATTACK_FRAMES,
		);
		expect(attackPlayer.state).toBe(PlayerStateEnum.IDLE);
		expect(attackPlayer.isGrounded).toBe(true);
		expect(attackPlayer.ledgeId).toBeNull();

		const rollPlayer = runOption(
			INPUT_BITS.SHIELD,
			PlayerStateEnum.LEDGE_ROLL,
			PHYSICS.LEDGE_ROLL_FRAMES,
		);
		expect(rollPlayer.state).toBe(PlayerStateEnum.IDLE);
		expect(rollPlayer.isGrounded).toBe(true);
		expect(rollPlayer.ledgeId).toBeNull();

		const dropPlayer = runOption(INPUT_BITS.DOWN, PlayerStateEnum.AIRBORNE, 0);
		expect(dropPlayer.state).toBe(PlayerStateEnum.AIRBORNE);
		expect(dropPlayer.ledgeId).toBeNull();
		expect(dropPlayer.vy).toBe(PHYSICS.GRAVITY);
	});

	it('trumps the current occupant and transfers ledge ownership', () => {
		const engine = createEngine(['p1', 'p2']);
		primePlayer(engine, 'p1', {
			x: 10,
			y: 505,
			state: PlayerStateEnum.AIRBORNE,
			isGrounded: false,
			ledgeId: null,
		});

		tick(engine);

		primePlayer(engine, 'p2', {
			x: 10,
			y: 505,
			state: PlayerStateEnum.AIRBORNE,
			isGrounded: false,
			ledgeId: null,
		});

		const state = tick(engine);
		const player1 = state.players.p1;
		const player2 = state.players.p2;

		expect(player1?.state).toBe(PlayerStateEnum.AIRBORNE);
		expect(player1?.ledgeId).toBeNull();
		expect(player1?.vx).toBe(PHYSICS.LEDGE_TRUMP_POP_VX);
		expect(player1?.vy).toBe(PHYSICS.LEDGE_TRUMP_POP_VY);
		expect(player1?.isInvincible).toBe(true);
		expect(player1?.invincibilityFrames).toBe(PHYSICS.LEDGE_TRUMP_INVINCIBILITY_FRAMES);

		expect(player2).toBeDefined();
		if (!player2) {
			throw new Error('Expected player p2');
		}

		expectHangingOnLeftLedge(player2);
		expect(state.ledges.left).toBe('p2');
	});

	it('enforces same-ledge regrab cooldown after a ledge drop', () => {
		const engine = createEngine();
		primePlayer(engine, 'p1', {
			x: 10,
			y: 505,
			state: PlayerStateEnum.AIRBORNE,
			isGrounded: false,
			ledgeId: null,
		});

		tick(engine);
		const dropState = tick(engine, { p1: makeInput('p1', INPUT_BITS.DOWN) });
		expect(dropState.ledges.left).toBeNull();
		expect(dropState.players.p1?.state).toBe(PlayerStateEnum.AIRBORNE);

		primePlayer(engine, 'p1', {
			x: 10,
			y: 505,
			vx: 0,
			vy: 0,
			state: PlayerStateEnum.AIRBORNE,
			stateFrame: 0,
			isGrounded: false,
			ledgeId: null,
		});

		const blockedState = tick(engine);
		expect(blockedState.players.p1?.state).toBe(PlayerStateEnum.AIRBORNE);
		expect(blockedState.ledges.left).toBeNull();

		primePlayer(engine, 'p1', {
			x: 640,
			y: 300,
			vx: 0,
			vy: 0,
			state: PlayerStateEnum.AIRBORNE,
			stateFrame: 0,
			isGrounded: false,
			isKnockedOut: false,
			ledgeId: null,
		});
		advance(engine, PHYSICS.LEDGE_REGRAB_COOLDOWN_FRAMES);
		primePlayer(engine, 'p1', {
			x: 10,
			y: 505,
			vx: 0,
			vy: 0,
			state: PlayerStateEnum.AIRBORNE,
			stateFrame: 0,
			isGrounded: false,
			ledgeId: null,
		});

		const regrabState = tick(engine);
		expect(regrabState.players.p1?.state).toBe(PlayerStateEnum.LEDGE_HANG);
		expect(regrabState.players.p1?.ledgeId).toBe('left');
		expect(regrabState.ledges.left).toBe('p1');
	});

	it('supports 4-player chain trumping on one ledge', () => {
		const engine = createEngine(['p1', 'p2', 'p3', 'p4']);

		primePlayer(engine, 'p1', {
			x: 10,
			y: 505,
			state: PlayerStateEnum.AIRBORNE,
			isGrounded: false,
			ledgeId: null,
		});
		tick(engine);

		primePlayer(engine, 'p2', {
			x: 10,
			y: 505,
			state: PlayerStateEnum.AIRBORNE,
			isGrounded: false,
			ledgeId: null,
		});
		const secondState = tick(engine);
		expect(secondState.ledges.left).toBe('p2');
		expect(secondState.players.p1?.state).toBe(PlayerStateEnum.AIRBORNE);

		primePlayer(engine, 'p3', {
			x: 10,
			y: 505,
			state: PlayerStateEnum.AIRBORNE,
			isGrounded: false,
			ledgeId: null,
		});
		const thirdState = tick(engine);

		expect(thirdState.ledges.left).toBe('p3');
		expect(thirdState.players.p2?.state).toBe(PlayerStateEnum.AIRBORNE);
		expect(thirdState.players.p2?.ledgeId).toBeNull();
		expect(thirdState.players.p3?.state).toBe(PlayerStateEnum.LEDGE_HANG);
		expect(thirdState.players.p4?.state).not.toBe(PlayerStateEnum.LEDGE_HANG);
	});
});
