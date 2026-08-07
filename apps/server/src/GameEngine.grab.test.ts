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

function primeGrabHoldingPair(engine: GameEngine, attackerFacing: 1 | -1 = 1): void {
	primePlayer(engine, 'p1', {
		x: 640,
		y: 472,
		facing: attackerFacing,
		state: PlayerStateEnum.GRAB_HOLDING,
		stateFrame: 10,
		isGrounded: true,
		isGrabbing: true,
		grabbedPlayerId: 'p2',
		vx: 0,
		vy: 0,
		hitlagFramesRemaining: 0,
		hitstunFramesRemaining: 0,
		activeHitbox: null,
		currentMoveId: null,
		hitPlayerIds: new Set<string>(),
	});

	primePlayer(engine, 'p2', {
		x: 640 + PHYSICS.GRAB_OFFSET_X * attackerFacing,
		y: 472,
		state: PlayerStateEnum.GRAB_HOLDING,
		stateFrame: 10,
		isGrounded: true,
		isGrabbing: true,
		vx: 0,
		vy: 0,
		hitlagFramesRemaining: 0,
		hitstunFramesRemaining: 0,
		activeHitbox: null,
		currentMoveId: null,
		hitPlayerIds: new Set<string>(),
	});
}

function tickUntil(
	engine: GameEngine,
	predicate: (state: GameState) => boolean,
	maxTicks = 40,
): GameState {
	let state = tick(engine, { p1: null, p2: null });
	for (let i = 0; i < maxTicks; i += 1) {
		if (predicate(state)) {
			return state;
		}
		state = tick(engine, { p1: null, p2: null });
	}
	return state;
}

describe('GameEngine grab integration', () => {
	it('generates ATTACK-routed grab hitbox on active frames', () => {
		const engine = createEngine(['p1', 'p2']);

		primePlayer(engine, 'p1', {
			x: 640,
			y: 472,
			state: PlayerStateEnum.IDLE,
			stateFrame: 0,
			isGrounded: true,
			hitlagFramesRemaining: 0,
			hitstunFramesRemaining: 0,
			isInvincible: false,
			invincibilityFrames: 0,
			activeHitbox: null,
			currentMoveId: null,
		});

		let state = tick(engine, { p1: makeInput('p1', INPUT_BITS.GRAB) });
		let player = state.players.p1;
		expect(player?.state).toBe(PlayerStateEnum.ATTACK);
		expect(player?.currentMoveId).toBe(MoveId.GRAB);

		for (let frame = 0; frame < 8; frame += 1) {
			state = tick(engine, { p1: null, p2: null });
			player = state.players.p1;
			if (player?.activeHitbox) {
				break;
			}
		}

		expect(player?.currentMoveId).toBe(MoveId.GRAB);
		expect(player?.activeHitbox).not.toBeNull();
		expect(player?.activeHitbox?.offsetX).toBe(26);
	});

	it('connecting ATTACK-routed grab forces both players into GRAB_HOLDING', () => {
		const engine = createEngine(['p1', 'p2']);

		primePlayer(engine, 'p1', {
			x: 640,
			y: 300,
			facing: 1,
			state: PlayerStateEnum.ATTACK,
			stateFrame: 5,
			isGrounded: true,
			hitlagFramesRemaining: 0,
			hitstunFramesRemaining: 0,
			isInvincible: false,
			invincibilityFrames: 0,
			currentMoveId: MoveId.GRAB,
			activeHitbox: null,
			hitPlayerIds: new Set<string>(),
		});

		primePlayer(engine, 'p2', {
			x: 670,
			y: 300,
			state: PlayerStateEnum.IDLE,
			stateFrame: 0,
			isGrounded: true,
			hitlagFramesRemaining: 0,
			hitstunFramesRemaining: 0,
			isInvincible: false,
			invincibilityFrames: 0,
			isGrabbing: false,
		});

		const state = tick(engine, { p1: null, p2: null });
		const attacker = state.players.p1;
		const victim = state.players.p2;

		expect(attacker?.state).toBe(PlayerStateEnum.GRAB_HOLDING);
		expect(victim?.state).toBe(PlayerStateEnum.GRAB_HOLDING);
		expect(attacker?.stateFrame).toBe(0);
		expect(victim?.stateFrame).toBe(0);
		expect(attacker?.isGrabbing).toBe(true);
		expect(attacker?.grabbedPlayerId).toBe('p2');
		expect(victim?.isGrabbing).toBe(true);
	});

	it('pins victim position to attacker.x + GRAB_OFFSET_X * facing while holding', () => {
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

	it('does not connect grab against ineligible victim', () => {
		const engine = createEngine(['p1', 'p2']);

		primePlayer(engine, 'p1', {
			x: 640,
			y: 300,
			facing: 1,
			state: PlayerStateEnum.ATTACK,
			stateFrame: 5,
			isGrounded: true,
			hitlagFramesRemaining: 0,
			hitstunFramesRemaining: 0,
			isInvincible: false,
			invincibilityFrames: 0,
			currentMoveId: MoveId.GRAB,
			activeHitbox: null,
			hitPlayerIds: new Set<string>(),
			isGrabbing: false,
			grabbedPlayerId: null,
		});

		primePlayer(engine, 'p2', {
			x: 670,
			y: 300,
			state: PlayerStateEnum.IDLE,
			stateFrame: 0,
			isGrounded: true,
			hitlagFramesRemaining: 0,
			hitstunFramesRemaining: 0,
			isInvincible: true,
			invincibilityFrames: 10,
			isGrabbing: false,
		});

		const state = tick(engine, { p1: null, p2: null });
		const attacker = state.players.p1;
		const victim = state.players.p2;

		expect(attacker?.state).toBe(PlayerStateEnum.ATTACK);
		expect(attacker?.isGrabbing).toBe(false);
		expect(attacker?.grabbedPlayerId).toBeNull();
		expect(victim?.state).not.toBe(PlayerStateEnum.GRAB_HOLDING);
		expect(victim?.isGrabbing).toBe(false);
	});

	it('clears grab flags when both exit GRAB_HOLDING to IDLE after frame 89', () => {
		const engine = createEngine(['p1', 'p2']);

		primePlayer(engine, 'p1', {
			state: PlayerStateEnum.GRAB_HOLDING,
			stateFrame: 89,
			isGrounded: true,
			isGrabbing: true,
			grabbedPlayerId: 'p2',
			x: 640,
			y: 472,
			vx: 0,
			vy: 0,
		});

		primePlayer(engine, 'p2', {
			state: PlayerStateEnum.GRAB_HOLDING,
			stateFrame: 89,
			isGrounded: true,
			isGrabbing: true,
			x: 680,
			y: 472,
			vx: 0,
			vy: 0,
		});

		const state = tick(engine, { p1: null, p2: null });
		const attacker = state.players.p1;
		const victim = state.players.p2;

		expect(attacker?.state).toBe(PlayerStateEnum.IDLE);
		expect(victim?.state).toBe(PlayerStateEnum.IDLE);
		expect(attacker?.isGrabbing).toBe(false);
		expect(attacker?.grabbedPlayerId).toBeNull();
		expect(victim?.isGrabbing).toBe(false);
	});

	it('forward throw from GRAB_HOLDING launches victim into HITSTUN and clears grab flags', () => {
		const engine = createEngine(['p1', 'p2']);
		primeGrabHoldingPair(engine, 1);

		let state = tick(engine, { p1: makeInput('p1', INPUT_BITS.RIGHT), p2: null });
		expect(state.players.p1?.state).toBe(PlayerStateEnum.ATTACK);
		expect(state.players.p1?.currentMoveId).toBe(MoveId.FORWARD_THROW);

		state = tickUntil(
			engine,
			(next) =>
				next.players.p2?.state === PlayerStateEnum.HITSTUN &&
				next.players.p1?.isGrabbing === false,
		);
		const attacker = state.players.p1;
		const victim = state.players.p2;

		expect(attacker?.isGrabbing).toBe(false);
		expect(attacker?.grabbedPlayerId).toBeNull();
		expect(victim?.isGrabbing).toBe(false);
		expect(victim?.state).toBe(PlayerStateEnum.HITSTUN);
		expect(victim?.vx ?? 0).toBeGreaterThan(0);
		expect(victim?.vy ?? 0).toBeLessThan(0);
		expect(victim?.hitstunFramesRemaining ?? 0).toBeGreaterThan(0);

		const recoveryState = tickUntil(engine, (next) => next.players.p1?.state === PlayerStateEnum.IDLE, 50);
		expect(recoveryState.players.p1?.state).toBe(PlayerStateEnum.IDLE);
	});

	it('back throw from GRAB_HOLDING launches victim backward and clears grab flags', () => {
		const engine = createEngine(['p1', 'p2']);
		primeGrabHoldingPair(engine, 1);

		let state = tick(engine, { p1: makeInput('p1', INPUT_BITS.LEFT), p2: null });
		expect(state.players.p1?.state).toBe(PlayerStateEnum.ATTACK);
		expect(state.players.p1?.currentMoveId).toBe(MoveId.BACK_THROW);

		state = tickUntil(
			engine,
			(next) =>
				next.players.p2?.state === PlayerStateEnum.HITSTUN &&
				next.players.p1?.isGrabbing === false,
		);
		const attacker = state.players.p1;
		const victim = state.players.p2;

		expect(attacker?.isGrabbing).toBe(false);
		expect(attacker?.grabbedPlayerId).toBeNull();
		expect(victim?.isGrabbing).toBe(false);
		expect(victim?.state).toBe(PlayerStateEnum.HITSTUN);
		expect((victim?.vx ?? 0) * (attacker?.facing ?? 1)).toBeLessThan(0);
		expect(victim?.vy ?? 0).toBeLessThan(0);
		expect(victim?.hitstunFramesRemaining ?? 0).toBeGreaterThan(0);
	});

	it('up throw from GRAB_HOLDING launches victim upward into HITSTUN and clears grab flags', () => {
		const engine = createEngine(['p1', 'p2']);
		primeGrabHoldingPair(engine, 1);

		let state = tick(engine, { p1: makeInput('p1', INPUT_BITS.JUMP), p2: null });
		expect(state.players.p1?.state).toBe(PlayerStateEnum.ATTACK);
		expect(state.players.p1?.currentMoveId).toBe(MoveId.UP_THROW);

		state = tickUntil(
			engine,
			(next) =>
				next.players.p2?.state === PlayerStateEnum.HITSTUN &&
				next.players.p1?.isGrabbing === false,
		);
		const attacker = state.players.p1;
		const victim = state.players.p2;

		expect(attacker?.isGrabbing).toBe(false);
		expect(attacker?.grabbedPlayerId).toBeNull();
		expect(victim?.isGrabbing).toBe(false);
		expect(victim?.state).toBe(PlayerStateEnum.HITSTUN);
		expect(victim?.vy ?? 0).toBeLessThan(0);
		expect(victim?.hitstunFramesRemaining ?? 0).toBeGreaterThan(0);
	});

	it('down throw from GRAB_HOLDING applies hitstun launch and clears grab flags', () => {
		const engine = createEngine(['p1', 'p2']);
		primeGrabHoldingPair(engine, 1);

		let state = tick(engine, { p1: makeInput('p1', INPUT_BITS.DOWN), p2: null });
		expect(state.players.p1?.state).toBe(PlayerStateEnum.ATTACK);
		expect(state.players.p1?.currentMoveId).toBe(MoveId.DOWN_THROW);

		state = tickUntil(
			engine,
			(next) =>
				next.players.p2?.state === PlayerStateEnum.HITSTUN &&
				next.players.p1?.isGrabbing === false,
		);
		const attacker = state.players.p1;
		const victim = state.players.p2;

		expect(attacker?.isGrabbing).toBe(false);
		expect(attacker?.grabbedPlayerId).toBeNull();
		expect(victim?.isGrabbing).toBe(false);
		expect(victim?.state).toBe(PlayerStateEnum.HITSTUN);
		expect(Math.abs(victim?.vx ?? 0)).toBeGreaterThan(0);
		expect(victim?.hitstunFramesRemaining ?? 0).toBeGreaterThan(0);
	});

	it('gracefully exits GRAB_HOLDING when grabbed victim is missing (desync safety)', () => {
		const engine = createEngine(['p1', 'p2']);
		primeGrabHoldingPair(engine, 1);

		const stateRef = getMutableState(engine);
		delete stateRef.players.p2;

		let state = tick(engine, { p1: null });
		expect(state.players.p1?.isGrabbing).toBe(false);
		expect(state.players.p1?.grabbedPlayerId).toBeNull();

		state = tick(engine, { p1: null });
		expect(state.players.p1?.state).toBe(PlayerStateEnum.IDLE);
	});
});
