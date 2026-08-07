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

	it('pummel stale-move accumulation: 4 consecutive pummels decrease damage per stale formula', () => {
		const engine = createEngine(['p1', 'p2']);
		primeGrabHoldingPair(engine, 1);

		// Stale formula: Math.max(0.6, 1.05 - staleCount * 0.05)
		// PUMMEL base damage: 2
		// Expected damages:
		// Pummel 1 (staleCount=0): 2 * 1.05 = 2.1 → floor = 2
		// Pummel 2 (staleCount=1): 2 * 1.00 = 2.0 → floor = 2
		// Pummel 3 (staleCount=2): 2 * 0.95 = 1.9 → floor = 1
		// Pummel 4 (staleCount=3): 2 * 0.90 = 1.8 → floor = 1

		const damages: number[] = [];
		let state = tick(engine, { p1: null, p2: null });

		// Perform 4 pummels
		for (let i = 0; i < 4; i += 1) {
			// Record victim damage before pummel
			const damageBeforePummel = state.players.p2?.percent ?? 0;

			// Press ATTACK to start pummel
			state = tick(engine, { p1: makeInput('p1', INPUT_BITS.ATTACK), p2: null });

			// Tick until pummel connects (victim takes damage)
			let damageRecorded = false;
			for (let j = 0; j < 20; j += 1) {
				const damageAfter = state.players.p2?.percent ?? 0;
				if (damageAfter > damageBeforePummel && !damageRecorded) {
					damages.push(damageAfter - damageBeforePummel);
					damageRecorded = true;
				}
				state = tick(engine, { p1: null, p2: null });
				// Stop when back in GRAB_HOLDING (pummel recovery complete)
				if (state.players.p1?.state === PlayerStateEnum.GRAB_HOLDING) {
					break;
				}
			}

			// Verify victim stays in GRAB_HOLDING after pummel
			expect(state.players.p2?.state).toBe(PlayerStateEnum.GRAB_HOLDING);
			expect(state.players.p2?.isGrabbing).toBe(true);
		}

		// Verify 4 pummels connected
		expect(damages.length).toBe(4);

		// Verify damage decreases per stale formula
		// Pummel 1: fresh (1.05 multiplier) → 2 * 1.05 = 2.1 → floor = 2
		expect(damages[0]).toBe(2);
		// Pummel 2: 1 stale (1.00 multiplier) → 2 * 1.00 = 2.0 → floor = 2
		expect(damages[1]).toBe(2);
		// Pummel 3: 2 stale (0.95 multiplier) → 2 * 0.95 = 1.9 → floor = 1
		expect(damages[2]).toBe(1);
		// Pummel 4: 3 stale (0.90 multiplier) → 2 * 0.90 = 1.8 → floor = 1
		expect(damages[3]).toBe(1);

		// Verify total damage accumulation
		const totalDamage = damages.reduce((a, b) => a + b, 0);
		expect(totalDamage).toBe(6); // 2 + 2 + 1 + 1

		// Verify attacker's staleMoveQueue has 4 PUMMEL entries
		expect(state.players.p1?.staleMoveQueue?.length).toBe(4);
		expect(state.players.p1?.staleMoveQueue?.every((moveId) => moveId === MoveId.PUMMEL)).toBe(true);
	});
});
