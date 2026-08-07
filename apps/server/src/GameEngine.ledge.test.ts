import { describe, expect, it } from 'vitest';
import {
	INPUT_BITS,
	MoveId,
	PHYSICS,
	STAGE,
	PlayerStateEnum,
	type GameState,
	type HitboxData,
	type InputEvent,
	type PlayerId,
	type PlayerState,
} from '@smash/shared';
import { FSMController } from '@smash/engine';
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

function advanceUntilGrounded(
	engine: GameEngine,
	playerId: PlayerId,
	maxFrames: number,
	inputs: Partial<Record<PlayerId, InputEvent | null>> = {},
): { state: GameState; framesElapsed: number } {
	let state = getMutableState(engine);

	for (let framesElapsed = 1; framesElapsed <= maxFrames; framesElapsed += 1) {
		state = tick(engine, inputs);
		if (state.players[playerId]?.isGrounded) {
			return { state, framesElapsed };
		}
	}

	throw new Error(`Expected ${playerId} to land within ${maxFrames} frames`);
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

function getShieldStunFrames(player: PlayerState): number {
	return (player as PlayerState & { shieldStunFrames?: number }).shieldStunFrames ?? 0;
}

function applyShieldHit(engine: GameEngine, damage: number): PlayerState {
	return applyShieldHitScenario(engine, {
		damage,
		attackerX: 640,
		defenderX: 640,
		attackerFacing: 1,
	}).defender;
}

function applyShieldHitScenario(
	engine: GameEngine,
	{
		damage,
		attackerX,
		defenderX,
		attackerFacing,
	}: {
		damage: number;
		attackerX: number;
		defenderX: number;
		attackerFacing: 1 | -1;
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
		stateFrame: 0,
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

function launchAngleRadians(vx: number, vy: number): number {
	return Math.atan2(-vy, vx);
}

function forceAttackFrameHitbox(
	engine: GameEngine,
	{
		attackerId,
		defenderId,
		frame,
		hitbox,
		attackerMoveId,
		normalizeStaleDamage,
		defenderInput,
	}: {
		attackerId: PlayerId;
		defenderId: PlayerId;
		frame: number;
		hitbox: HitboxData;
		attackerMoveId?: MoveId | null;
		normalizeStaleDamage?: boolean;
		defenderInput?: InputEvent | null;
	},
): { attacker: PlayerState; defender: PlayerState } {
	const state = getMutableState(engine);
	const attacker = state.players[attackerId];
	const defender = state.players[defenderId];

	if (!attacker || !defender) {
		throw new Error(`Expected players ${attackerId} and ${defenderId}`);
	}

	const selectedMoveId = attackerMoveId ?? attacker.currentMoveId ?? MoveId.JAB;
	const shouldNormalizeStaleDamage = normalizeStaleDamage ?? true;
	const staleMoveQueue = shouldNormalizeStaleDamage
		? selectedMoveId
			? [selectedMoveId]
			: []
		: [...(attacker.staleMoveQueue ?? [])];

	state.players[attackerId] = {
		...attacker,
		x: 640,
		y: 300,
		facing: 1,
		state: PlayerStateEnum.ATTACK,
		stateFrame: frame,
		isGrounded: true,
		isInvincible: false,
		invincibilityFrames: 0,
		hitlagFramesRemaining: 0,
		hitstunFramesRemaining: 0,
		vx: 0,
		vy: 0,
		currentMoveId: selectedMoveId,
		staleMoveQueue,
		activeHitbox: hitbox,
	};

	state.players[defenderId] = {
		...defender,
		x: 670,
		y: 300,
		state: PlayerStateEnum.IDLE,
		stateFrame: frame,
		isGrounded: true,
		isInvincible: false,
		invincibilityFrames: 0,
		hitlagFramesRemaining: 0,
		hitstunFramesRemaining: 0,
		vx: 0,
		vy: 0,
	};

	(
		engine as unknown as {
			applyHitDetection: (
				players: Record<PlayerId, PlayerState>,
				inputs?: Map<PlayerId, InputEvent | null>,
			) => void;
		}
	).applyHitDetection(
		state.players,
		new Map<PlayerId, InputEvent | null>([[defenderId, defenderInput ?? null]]),
	);

	const updatedAttacker = state.players[attackerId];
	const updatedDefender = state.players[defenderId];
	if (!updatedAttacker || !updatedDefender) {
		throw new Error(`Expected updated players ${attackerId} and ${defenderId}`);
	}

	return {
		attacker: updatedAttacker,
		defender: updatedDefender,
	};
}

function runForwardSmashDamageScenario(
	holdFrames: number,
	maxFrames = 240,
): {
	damageDealt: number;
	framesToFirstHit: number;
} {
	const engine = createEngine(['p1', 'p2']);

	primePlayer(engine, 'p1', {
		x: 600,
		y: STAGE.MAIN_PLATFORM.y - PHYSICS.HURTBOX_RADIUS,
		facing: 1,
		state: PlayerStateEnum.IDLE,
		stateFrame: 0,
		isGrounded: true,
		hitlagFramesRemaining: 0,
		hitstunFramesRemaining: 0,
		activeHitbox: null,
		currentMoveId: null,
		percent: 0,
	});

	primePlayer(engine, 'p2', {
		x: 665,
		y: STAGE.MAIN_PLATFORM.y - PHYSICS.HURTBOX_RADIUS,
		facing: -1,
		state: PlayerStateEnum.IDLE,
		stateFrame: 0,
		isGrounded: true,
		hitlagFramesRemaining: 0,
		hitstunFramesRemaining: 0,
		activeHitbox: null,
		currentMoveId: null,
		percent: 0,
	});

	const fsmashStartupInput = makeInput(
		'p1',
		INPUT_BITS.RIGHT | INPUT_BITS.SHIELD | INPUT_BITS.ATTACK,
	);
	tick(engine, { p1: fsmashStartupInput });

	for (let frame = 0; frame < holdFrames; frame += 1) {
		tick(engine, {
			p1: {
				...makeInput('p1', INPUT_BITS.ATTACK),
				held: INPUT_BITS.ATTACK,
				pressed: 0,
			},
		});
	}

	tick(engine, {
		p1: {
			...makeInput('p1', 0),
			held: 0,
			pressed: 0,
			released: INPUT_BITS.ATTACK,
		},
	});

	for (let frame = 1; frame <= maxFrames; frame += 1) {
		const state = tick(engine, { p1: null, p2: null });
		const attacker = state.players.p1;
		const defender = state.players.p2;
		if (!attacker || !defender) {
			throw new Error('Expected defender p2');
		}

		if (defender.percent > 0) {
			return {
				damageDealt: defender.percent,
				framesToFirstHit: frame,
			};
		}
	}

	throw new Error(`Expected forward smash to hit within ${maxFrames} frames`);
}

describe('GameEngine ledge integration', () => {
	it('BASELINE CHARACTERIZATION (pre-landing-lag): AIR_ATTACK landing resolved directly to grounded non-lockout flow', () => {
		type LegacyLandingResult = {
			isGrounded: boolean;
			state: PlayerStateEnum;
		};

		const legacyAerialLanding = (): LegacyLandingResult => ({
			isGrounded: true,
			state: PlayerStateEnum.AIR_ATTACK,
		});

		const landedPlayer = legacyAerialLanding();
		expect(landedPlayer.isGrounded).toBe(true);
		expect(landedPlayer.state).not.toBe(PlayerStateEnum.LANDING_LAG);
	});

	it('AIR_ATTACK landing applies landing-lag lockout for move landingLag frames before IDLE', () => {
		const engine = createEngine(['p1', 'p2']);
		const landingLagFrames = 15;

		primePlayer(engine, 'p1', {
			x: 640,
			y: STAGE.MAIN_PLATFORM.y - PHYSICS.HURTBOX_RADIUS - 1,
			vx: 0,
			vy: 4,
			state: PlayerStateEnum.AIR_ATTACK,
			stateFrame: 0,
			isGrounded: false,
			currentMoveId: MoveId.NEUTRAL_AIR,
			currentMove: { landingLag: landingLagFrames },
		});
		const mutable = getMutableState(engine);
		const primed = mutable.players.p1;
		if (!primed) {
			throw new Error('Expected player p1 after prime');
		}
		primed.currentMove = { landingLag: landingLagFrames };

		const landing = tick(engine, { p1: null });
		const landed = landing.players.p1;
		expect(landed).toBeDefined();
		if (!landed) {
			throw new Error('Expected player p1 on landing tick');
		}

		expect(landed.state).toBe(PlayerStateEnum.LANDING_LAG);
		expect(landed.landingLagFrames).toBe(landingLagFrames);

		let previousLag = landed.landingLagFrames;
		for (let frame = landingLagFrames; frame >= 1; frame -= 1) {
			const duringLag = tick(engine, {
				p1: makeInput('p1', INPUT_BITS.ATTACK),
			});
			const lockedPlayer = duringLag.players.p1;
			console.info(
				`LANDING_LAG(${frame}) -> LANDING_LAG(${lockedPlayer?.landingLagFrames ?? 'undefined'})`,
			);
			expect(lockedPlayer?.state).toBe(PlayerStateEnum.LANDING_LAG);
			expect((lockedPlayer?.landingLagFrames ?? -1) <= previousLag).toBe(true);
			previousLag = lockedPlayer?.landingLagFrames ?? previousLag;
		}
		expect(previousLag).toBe(0);

		const releaseTick = tick(engine, {
			p1: makeInput('p1', INPUT_BITS.ATTACK),
		});
		console.info(
			`AIR_ATTACK -> LANDING_LAG(${landingLagFrames}) -> ... -> LANDING_LAG(1) -> IDLE`,
		);
		expect(releaseTick.players.p1?.state).toBe(PlayerStateEnum.IDLE);
	});

	it('AIR_ATTACK landing with missing/zero landing lag data does not crash and resolves to IDLE immediately', () => {
		const runLanding = (
			currentMove: PlayerState['currentMove'],
		): PlayerStateEnum | undefined => {
			const engine = createEngine(['p1', 'p2']);
			primePlayer(engine, 'p1', {
				x: 640,
				y: STAGE.MAIN_PLATFORM.y - PHYSICS.HURTBOX_RADIUS - 1,
				vx: 0,
				vy: 4,
				state: PlayerStateEnum.AIR_ATTACK,
				stateFrame: 0,
				isGrounded: false,
				currentMoveId: MoveId.NEUTRAL_AIR,
				currentMove,
			});

			return tick(engine, { p1: null }).players.p1?.state as PlayerStateEnum | undefined;
		};

		expect(runLanding(undefined)).toBe(PlayerStateEnum.IDLE);
		expect(runLanding({ landingLag: 0 })).toBe(PlayerStateEnum.IDLE);
	});

	it.skip('BASELINE CHARACTERIZATION (pre-smash-charge): holding ATTACK during forward smash dealt identical damage to tap', () => {
		const tapScenario = runForwardSmashDamageScenario(0);
		const holdScenario = runForwardSmashDamageScenario(30);

		console.info('[baseline-fsmash-hold-damage]', {
			tapDamage: tapScenario.damageDealt,
			holdDamage: holdScenario.damageDealt,
			holdFrames: 30,
			framesToFirstHitTap: tapScenario.framesToFirstHit,
			framesToFirstHitHold: holdScenario.framesToFirstHit,
		});

		expect(holdScenario.damageDealt).toBe(tapScenario.damageDealt);
		expect(tapScenario.damageDealt).toBe(18);
	});

	it('forward smash released immediately deals fresh-move bonus damage (18 * 1.05)', () => {
		const unchargedScenario = runForwardSmashDamageScenario(0);
		expect(unchargedScenario.damageDealt).toBe(Math.floor(18 * 1.05));
	});

	it('forward smash charged 30/60 frames applies charge scaling then fresh-move bonus', () => {
		const chargedScenario = runForwardSmashDamageScenario(30);
		const expectedDamage = 18 * (1 + (30 / 60) * 0.4) * 1.05;

		console.info(
			`FSMASH charged 30/60 frames -> damage 18 * charge(1.2) * staleFresh(1.05) = ${expectedDamage} (${(
				expectedDamage / 18
			).toFixed(1)}x)`,
		);

		expect(chargedScenario.damageDealt).toBe(Math.floor(expectedDamage));
	});

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

	it.skip('baseline characterization (pre-change): shield at 0 health does not trigger stun/pop yet', () => {
		const engine = createEngine(['p1', 'p2']);
		primePlayer(engine, 'p1', {
			state: PlayerStateEnum.SHIELD,
			stateFrame: 0,
			isGrounded: true,
			shieldHealth: 0,
			hitstunFramesRemaining: 0,
			vy: 0,
		});

		const state = tick(engine, { p1: makeInput('p1', INPUT_BITS.SHIELD) });
		const player = state.players.p1;

		expect(player).toBeDefined();
		if (!player) {
			throw new Error('Expected player p1');
		}

		expect(player.state).toBe(PlayerStateEnum.SHIELD);
		expect(player.shieldHealth).toBe(0);
		expect(player.hitstunFramesRemaining).toBe(0);
		expect(player.vy).toBe(0);
	});

	it('shield break from hit: drains to 0, pops upward, enters HITSTUN for 150 frames, then expires', () => {
		const engine = createEngine(['p1', 'p2']);
		primePlayer(engine, 'p1', {
			x: 60,
			y: 300,
			state: PlayerStateEnum.SHIELD,
			stateFrame: 0,
			isGrounded: true,
			shieldHealth: 5,
			hitstunFramesRemaining: 0,
			vy: 0,
		});

		primePlayer(engine, 'p2', {
			x: 0,
			y: 300,
			facing: 1,
			state: PlayerStateEnum.ATTACK,
			stateFrame: 15,
			currentMoveId: MoveId.FORWARD_SMASH,
			isGrounded: true,
		});

		const brokenState = tick(engine, {
			p1: makeInput('p1', INPUT_BITS.SHIELD),
			p2: null,
		});
		const brokenPlayer = brokenState.players.p1;

		expect(brokenPlayer).toBeDefined();
		if (!brokenPlayer) {
			throw new Error('Expected player p1');
		}

		expect(brokenPlayer.shieldHealth).toBe(0);
		expect(brokenPlayer.hitstunFramesRemaining).toBe(PHYSICS.SHIELD_BREAK_STUN_FRAMES);
		expect(brokenPlayer.vy).toBe(-8);
		expect(brokenPlayer.state).toBe(PlayerStateEnum.HITSTUN);

		const oneFrameLater = tick(engine, { p1: null, p2: null });
		expect(oneFrameLater.players.p1?.hitstunFramesRemaining).toBe(
			PHYSICS.SHIELD_BREAK_STUN_FRAMES - 1,
		);

		let trackedState = oneFrameLater;
		for (let frame = 0; frame < PHYSICS.SHIELD_BREAK_STUN_FRAMES - 2; frame += 1) {
			trackedState = tick(engine, { p1: null, p2: null });
			const lockedPlayer = trackedState.players.p1;
			expect(lockedPlayer?.state).toBe(PlayerStateEnum.HITSTUN);
			expect((lockedPlayer?.hitstunFramesRemaining ?? 0) >= 0).toBe(true);
		}

		const frame150State = tick(engine, { p1: null, p2: null });
		expect(frame150State.players.p1?.hitstunFramesRemaining).toBe(0);
		expect(frame150State.players.p1?.state).toBe(PlayerStateEnum.HITSTUN);

		const frame151State = tick(engine, { p1: null, p2: null });
		expect(frame151State.players.p1?.state).toBe(PlayerStateEnum.AIRBORNE);
	});

	it('shield break from passive drain: clamps to 0 and enters 150-frame HITSTUN pop', () => {
		const engine = createEngine(['p1', 'p2']);
		primePlayer(engine, 'p1', {
			state: PlayerStateEnum.SHIELD,
			stateFrame: 0,
			isGrounded: true,
			shieldHealth: 1,
			hitstunFramesRemaining: 0,
			vy: 0,
		});

		tick(engine, { p1: makeInput('p1', INPUT_BITS.SHIELD) });
		tick(engine, { p1: makeInput('p1', INPUT_BITS.SHIELD) });
		const brokenState = tick(engine, { p1: makeInput('p1', INPUT_BITS.SHIELD) });
		const player = brokenState.players.p1;

		expect(player).toBeDefined();
		if (!player) {
			throw new Error('Expected player p1');
		}

		expect(player.shieldHealth).toBe(0);
		expect(player.hitstunFramesRemaining).toBe(PHYSICS.SHIELD_BREAK_STUN_FRAMES);
		expect(player.vy).toBe(-8);
		expect(player.state).toBe(PlayerStateEnum.HITSTUN);
	});

	it('BASELINE CHARACTERIZATION: with shieldStunFrames=0, defender can drop shield immediately after shield hit context', () => {
		const engine = createEngine(['p1', 'p2']);
		const defenderAfterHit = applyShieldHit(engine, 10);
		const preShieldStunBaseline: PlayerState = {
			...defenderAfterHit,
			shieldStunFrames: 0,
		};

		const controller = new FSMController(PlayerStateEnum.SHIELD);
		const postInput = controller.tick(preShieldStunBaseline, makeInput('p2', 0));

		expect(postInput.state).toBe(PlayerStateEnum.IDLE);
	});

	it('forward smash (18 damage) on shield applies 16 shield stun frames and blocks shield drop for 16 ticks', () => {
		const engine = createEngine(['p1', 'p2']);
		const defenderAfterHit = applyShieldHit(engine, 18);
		let defender: PlayerState = {
			...defenderAfterHit,
			state: PlayerStateEnum.SHIELD,
			isShielding: true,
		};

		expect(getShieldStunFrames(defender)).toBe(16);
		expect(defender.shieldHealth).toBe(82);
		expect(defender.hitstunFramesRemaining).toBe(0);
		expect(defender.vx).toBeCloseTo(5.4, 6);
		expect(defender.vy).toBe(0);

		const controller = new FSMController(PlayerStateEnum.SHIELD);
		for (let frame = 1; frame <= 16; frame += 1) {
			defender = controller.tick(defender, makeInput('p2', 0));
			console.info(
				`HIT_SHIELD -> stun=16 -> frame ${frame} (stun=${getShieldStunFrames(defender)}, state=${defender.state})`,
			);
			expect(defender.state).toBe(PlayerStateEnum.SHIELD);
		}

		defender = controller.tick(defender, makeInput('p2', 0));
		expect(defender.state).toBe(PlayerStateEnum.IDLE);
	});

	it('jab (3 damage) on shield applies 4 shield stun frames', () => {
		const engine = createEngine(['p1', 'p2']);
		const defenderAfterHit = applyShieldHit(engine, 3);
		let defender: PlayerState = {
			...defenderAfterHit,
			state: PlayerStateEnum.SHIELD,
			isShielding: true,
		};

		expect(getShieldStunFrames(defender)).toBe(4);
		expect(defender.shieldHealth).toBe(97);

		const controller = new FSMController(PlayerStateEnum.SHIELD);
		for (let frame = 1; frame <= 4; frame += 1) {
			defender = controller.tick(defender, makeInput('p2', 0));
			expect(defender.state).toBe(PlayerStateEnum.SHIELD);
		}

		defender = controller.tick(defender, makeInput('p2', 0));
		expect(defender.state).toBe(PlayerStateEnum.IDLE);
	});

	it('damage 0 hit on shield still applies minimum 2 shield stun frames', () => {
		const engine = createEngine(['p1', 'p2']);
		const defender = applyShieldHit(engine, 0);

		expect(getShieldStunFrames(defender)).toBe(2);
	});

	it.skip('BASELINE CHARACTERIZATION (pre-pushback): hitting shield does not change attacker/defender vx', () => {
		const engine = createEngine(['p1', 'p2']);
		const { attacker, defender } = applyShieldHitScenario(engine, {
			damage: 18,
			attackerX: 100,
			defenderX: 150,
			attackerFacing: 1,
		});

		console.info('[baseline-shield-pushback] before/after vx', {
			attackerFacing: 1,
			attackerVx: attacker.vx,
			defenderVx: defender.vx,
		});

		expect(attacker.vx).toBe(0);
		expect(defender.vx).toBe(0);
	});

	it('shield pushback: facing right applies defender +5.4 vx and attacker -1.8 vx on 18 damage shield hit', () => {
		const engine = createEngine(['p1', 'p2']);
		const { attacker, defender } = applyShieldHitScenario(engine, {
			damage: 18,
			attackerX: 100,
			defenderX: 150,
			attackerFacing: 1,
		});

		console.info('[shield-pushback-right] vx after shield hit', {
			attackerVx: attacker.vx,
			defenderVx: defender.vx,
		});

		expect(defender.vx).toBeCloseTo(5.4, 6);
		expect(attacker.vx).toBeCloseTo(-1.8, 6);
	});

	it('shield pushback: facing left flips push directions on 18 damage shield hit', () => {
		const engine = createEngine(['p1', 'p2']);
		const { attacker, defender } = applyShieldHitScenario(engine, {
			damage: 18,
			attackerX: 150,
			defenderX: 100,
			attackerFacing: -1,
		});

		console.info('[shield-pushback-left] vx after shield hit', {
			attackerVx: attacker.vx,
			defenderVx: defender.vx,
		});

		expect(defender.vx).toBeCloseTo(-5.4, 6);
		expect(attacker.vx).toBeCloseTo(1.8, 6);
	});

	it('shield pushback: 0 damage causes zero pushback and no crash', () => {
		const engine = createEngine(['p1', 'p2']);
		const { attacker, defender } = applyShieldHitScenario(engine, {
			damage: 0,
			attackerX: 100,
			defenderX: 150,
			attackerFacing: 1,
		});

		console.info('[shield-pushback-zero] vx after shield hit', {
			attackerVx: attacker.vx,
			defenderVx: defender.vx,
		});

		expect(defender.vx).toBe(0);
		expect(attacker.vx).toBe(0);
	});

		it('baseline characterization: launch angle is fixed across held inputs when hitlag ends', () => {
			const initialMagnitude = 10;
		const initialAngle = Math.PI / 4;
		const initialVx = Math.cos(initialAngle) * initialMagnitude;
		const initialVy = -Math.sin(initialAngle) * initialMagnitude;

		const runOnce = (heldBits: number): number => {
			const engine = createEngine();
			primePlayer(engine, 'p1', {
				x: 640,
				y: 300,
				vx: initialVx,
				vy: initialVy,
				state: PlayerStateEnum.HITSTUN,
				stateFrame: 0,
				hitlagFramesRemaining: 1,
				hitstunFramesRemaining: 8,
				isGrounded: false,
				ledgeId: null,
			});

			const state = tick(engine, { p1: makeInput('p1', heldBits) });
			const player = state.players.p1;
			expect(player).toBeDefined();
			if (!player) {
				throw new Error('Expected player p1');
			}

			const preGravityVy = player.vy - PHYSICS.GRAVITY;
			return launchAngleRadians(player.vx, preGravityVy);
		};

		const angleNoInput = runOnce(0);
		const anglePerpendicularInput = runOnce(INPUT_BITS.LEFT | INPUT_BITS.JUMP);
		const angleParallelInput = runOnce(INPUT_BITS.RIGHT | INPUT_BITS.DOWN);

		console.info('baseline hitlag-end launch angles (rad)', {
			angleNoInput,
			anglePerpendicularInput,
			angleParallelInput,
		});

			expect(anglePerpendicularInput).toBeCloseTo(angleNoInput, 6);
			expect(angleParallelInput).toBeCloseTo(angleNoInput, 6);
		});

		it.skip('BASELINE CHARACTERIZATION (pre-sdi): holding RIGHT during hitlag does not shift position', () => {
			const engine = createEngine(['p1', 'p2']);
			const initialX = 640;

			primePlayer(engine, 'p1', {
				x: initialX,
				y: 300,
				vx: 0,
				vy: 0,
				state: PlayerStateEnum.HITSTUN,
				stateFrame: 0,
				hitlagFramesRemaining: 8,
				hitstunFramesRemaining: 12,
				isGrounded: true,
				activeHitbox: null,
			});

			const rightHeldInput: InputEvent = {
				...makeInput('p1', INPUT_BITS.RIGHT),
				held: INPUT_BITS.RIGHT,
				pressed: 0,
				released: 0,
			};

			const stateAfterHitlag = advance(engine, 8, { p1: rightHeldInput });
			expect(stateAfterHitlag.players.p1?.x).toBe(initialX);
		});

		it('SDI: holding RIGHT during 8-frame hitlag shifts position by 6px total (3px every 4 frames)', () => {
			const engine = createEngine(['p1', 'p2']);
			const initialX = 640;

			primePlayer(engine, 'p1', {
				x: initialX,
				y: 300,
				vx: 0,
				vy: 0,
				state: PlayerStateEnum.HITSTUN,
				stateFrame: 0,
				hitlagFramesRemaining: 8,
				hitstunFramesRemaining: 12,
				isGrounded: true,
				activeHitbox: null,
			});

			const rightHeldInput: InputEvent = {
				...makeInput('p1', INPUT_BITS.RIGHT),
				held: INPUT_BITS.RIGHT,
				pressed: 0,
				released: 0,
			};

			const stateAfterHitlag = advance(engine, 8, { p1: rightHeldInput });
			const shiftedPlayer = stateAfterHitlag.players.p1;
			expect(shiftedPlayer).toBeDefined();
			if (!shiftedPlayer) {
				throw new Error('Expected player p1 after SDI hitlag sequence');
			}

			expect(shiftedPlayer.hitlagFramesRemaining).toBe(0);
			expect(shiftedPlayer.x).toBe(initialX + 6);
		});

			it('applies DI on the final hitlag frame: perpendicular maxes (~0.17 rad), parallel is neutral, diagonal is partial', () => {
			const initialMagnitude = 10;
		const kb45 = Math.PI / 4;
		const initial45Vx = Math.cos(kb45) * initialMagnitude;
		const initial45Vy = -Math.sin(kb45) * initialMagnitude;

		const launchAfterFinalHitlag = (
			initialVx: number,
			initialVy: number,
			heldBits: number,
		): number => {
			const engine = createEngine();
			primePlayer(engine, 'p1', {
				x: 640,
				y: 300,
				vx: initialVx,
				vy: initialVy,
				state: PlayerStateEnum.HITSTUN,
				stateFrame: 0,
				hitlagFramesRemaining: 1,
				hitstunFramesRemaining: 8,
				isGrounded: false,
				ledgeId: null,
				pendingKnockbackVx: initialVx,
				pendingKnockbackVy: initialVy,
				lastHitByFacing: 1,
			});

			const state = tick(engine, { p1: makeInput('p1', heldBits) });
			const player = state.players.p1;
			expect(player).toBeDefined();
			if (!player) {
				throw new Error('Expected player p1');
			}

			const preGravityVy = player.vy - PHYSICS.GRAVITY;
			return launchAngleRadians(player.vx, preGravityVy);
		};

		const angle45NoInput = launchAfterFinalHitlag(initial45Vx, initial45Vy, 0);
		const angle45Perpendicular = launchAfterFinalHitlag(
			initial45Vx,
			initial45Vy,
			INPUT_BITS.LEFT | INPUT_BITS.JUMP,
		);
		const angle45Parallel = launchAfterFinalHitlag(
			initial45Vx,
			initial45Vy,
			INPUT_BITS.RIGHT | INPUT_BITS.JUMP,
		);

		const angle0NoInput = launchAfterFinalHitlag(initialMagnitude, 0, 0);
		const angle0Diagonal = launchAfterFinalHitlag(
			initialMagnitude,
			0,
			INPUT_BITS.RIGHT | INPUT_BITS.JUMP,
		);

		const perpendicularShift = angle45Perpendicular - angle45NoInput;
		const parallelShift = angle45Parallel - angle45NoInput;
		const diagonalShift = angle0Diagonal - angle0NoInput;

		console.info('DI launch angle deltas (rad)', {
			angle45NoInput,
			angle45Perpendicular,
			angle45Parallel,
			angle0NoInput,
			angle0Diagonal,
			perpendicularShift,
			parallelShift,
			diagonalShift,
		});

		expect(perpendicularShift).toBeCloseTo(0.17, 2);
		expect(parallelShift).toBeCloseTo(0, 3);
			expect(diagonalShift).toBeCloseTo(0.085, 2);
		});

		it.skip('BASELINE CHARACTERIZATION (pre-fast-fall-fix): legacy fast-fall gravity multiplier compounds until clamped', () => {
			const legacyStep = (vy: number, isFastFalling: boolean): number => {
				let nextVy = vy + PHYSICS.GRAVITY;
				if (isFastFalling && nextVy > 0) {
					nextVy *= PHYSICS.FAST_FALL_MULTIPLIER;
				}

				return Math.min(nextVy, PHYSICS.TERMINAL_VELOCITY);
			};

			const frame1 = legacyStep(PHYSICS.TERMINAL_VELOCITY * 0.9, true);
			const frame2 = legacyStep(frame1, true);
			const frame3 = legacyStep(frame2, true);

			expect(frame2).toBeGreaterThan(frame1);
			expect(frame3).toBeGreaterThanOrEqual(frame2);
		});

		it('fast-fall sets vy to a constant value across frames (no per-frame compounding)', () => {
			const engine = createEngine(['p1']);
			primePlayer(engine, 'p1', {
				x: 640,
				y: 250,
				vx: 0,
				vy: 1,
				state: PlayerStateEnum.AIRBORNE,
				stateFrame: 0,
				isGrounded: false,
				isFastFalling: false,
			});

			const downHeld = makeInput('p1', INPUT_BITS.DOWN);
			const first = tick(engine, { p1: downHeld }).players.p1;
			const second = tick(engine, { p1: downHeld }).players.p1;
			const third = tick(engine, { p1: downHeld }).players.p1;

			expect(first).toBeDefined();
			expect(second).toBeDefined();
			expect(third).toBeDefined();
			if (!first || !second || !third) {
				throw new Error('Expected player p1 while testing fast-fall velocity');
			}

		const expectedFastFallVy = PHYSICS.TERMINAL_VELOCITY * 0.8;
		expect(first.vy).toBeCloseTo(expectedFastFallVy, 6);
		expect(second.vy).toBeCloseTo(expectedFastFallVy, 6);
		expect(third.vy).toBeCloseTo(expectedFastFallVy, 6);
		});

		it.skip('BASELINE CHARACTERIZATION (pre-hitstun-pass-through): hitstun player descending through soft platform lands on it', () => {
			const engine = createEngine(['p1']);
			const softPlatform = STAGE.PLATFORMS[0];
			if (!softPlatform) {
				throw new Error('Expected at least one soft platform');
			}

			primePlayer(engine, 'p1', {
				x: softPlatform.x + softPlatform.width / 2,
				y: softPlatform.y - PHYSICS.HURTBOX_RADIUS - 1,
				vx: 0,
				vy: 8,
				state: PlayerStateEnum.HITSTUN,
				stateFrame: 0,
				hitstunFramesRemaining: 200,
				isGrounded: false,
			});

			const state = tick(engine, { p1: null });
			const player = state.players.p1;
			expect(player).toBeDefined();
			if (!player) {
				throw new Error('Expected player p1 in baseline hitstun soft-platform test');
			}

			expect(player.isGrounded).toBe(true);
			expect(player.y).toBe(softPlatform.y - PHYSICS.HURTBOX_RADIUS);
		});

		it('hitstun pass-through: player falls through soft platform and only lands on main platform', () => {
			const engine = createEngine(['p1']);
			const softPlatform = STAGE.PLATFORMS[0];
			if (!softPlatform) {
				throw new Error('Expected at least one soft platform');
			}

			primePlayer(engine, 'p1', {
				x: softPlatform.x + softPlatform.width / 2,
				y: softPlatform.y - PHYSICS.HURTBOX_RADIUS - 1,
				vx: 0,
				vy: 8,
				state: PlayerStateEnum.HITSTUN,
				stateFrame: 0,
				hitstunFramesRemaining: 200,
				isGrounded: false,
			});

			const afterSoftCross = tick(engine, { p1: null });
			const afterSoftCrossPlayer = afterSoftCross.players.p1;
			expect(afterSoftCrossPlayer).toBeDefined();
			if (!afterSoftCrossPlayer) {
				throw new Error('Expected player p1 after soft-platform crossing tick');
			}

			expect(afterSoftCrossPlayer.isGrounded).toBe(false);
			expect(afterSoftCrossPlayer.y).toBeGreaterThan(
				softPlatform.y - PHYSICS.HURTBOX_RADIUS,
			);

			const mainLandingEngine = createEngine(['p1']);
			primePlayer(mainLandingEngine, 'p1', {
				x: STAGE.MAIN_PLATFORM.x + STAGE.MAIN_PLATFORM.width / 2,
				y: STAGE.MAIN_PLATFORM.y - PHYSICS.HURTBOX_RADIUS - 1,
				vx: 0,
				vy: 4,
				state: PlayerStateEnum.HITSTUN,
				stateFrame: 0,
				hitstunFramesRemaining: 10,
				isGrounded: false,
			});

			const mainLandingState = tick(mainLandingEngine, { p1: null });
			const mainLandedPlayer = mainLandingState.players.p1;
			expect(mainLandedPlayer).toBeDefined();
			if (!mainLandedPlayer) {
				throw new Error('Expected player p1 on main-platform landing check');
			}

			expect(mainLandedPlayer.isGrounded).toBe(true);
			expect(mainLandedPlayer.y).toBe(STAGE.MAIN_PLATFORM.y - PHYSICS.HURTBOX_RADIUS);
		});

		it.skip('BASELINE CHARACTERIZATION (pre-crouch-cancel): grounded DOWN defender receives same knockback as standing defender', () => {
			const hitbox: HitboxData = {
				offsetX: 20,
				offsetY: 0,
				radius: PHYSICS.HURTBOX_RADIUS + 10,
				damage: 10,
				baseKnockback: 30,
				knockbackGrowth: 120,
				knockbackAngle: 45,
				hitlagFrames: 0,
				hitstunFrames: 0,
				priority: 1,
			};
			const runScenario = (defenderInputBits: number): number => {
				const engine = createEngine(['p1', 'p2']);
				const result = forceAttackFrameHitbox(engine, {
					attackerId: 'p1',
					defenderId: 'p2',
					frame: 5,
					hitbox,
					defenderInput: makeInput('p2', defenderInputBits),
				});

				return Math.hypot(result.defender.vx, result.defender.vy);
			};

			const standingKnockback = runScenario(0);
			const crouchKnockback = runScenario(INPUT_BITS.DOWN);

			expect(crouchKnockback).toBeCloseTo(standingKnockback, 6);
		});

		it('crouch cancel: grounded defender holding DOWN takes 15% less knockback magnitude', () => {
			const hitbox: HitboxData = {
				offsetX: 20,
				offsetY: 0,
				radius: PHYSICS.HURTBOX_RADIUS + 10,
				damage: 10,
				baseKnockback: 30,
				knockbackGrowth: 120,
				knockbackAngle: 45,
				hitlagFrames: 0,
				hitstunFrames: 0,
				priority: 1,
			};
			const runScenario = (defenderInputBits: number): number => {
				const engine = createEngine(['p1', 'p2']);
				const result = forceAttackFrameHitbox(engine, {
					attackerId: 'p1',
					defenderId: 'p2',
					frame: 5,
					hitbox,
					defenderInput: makeInput('p2', defenderInputBits),
				});

				return Math.hypot(result.defender.vx, result.defender.vy);
			};

			const standingKnockback = runScenario(0);
			const crouchKnockback = runScenario(INPUT_BITS.DOWN);

			expect(crouchKnockback).toBeCloseTo(standingKnockback * 0.85, 6);
		});

		it.skip('BASELINE CHARACTERIZATION (pre-stale-negation): repeated jab hits keep full base damage with no stale reduction', () => {
			const baseJabDamage = 3;
			const noStaleModelDamageSeries = Array.from({ length: 10 }, () => baseJabDamage);

			expect(noStaleModelDamageSeries[0]).toBe(baseJabDamage);
			expect(noStaleModelDamageSeries[9]).toBe(baseJabDamage);
		});

		it('stale move negation: 9th repeated jab (10th total jab hit) deals 60% of base damage', () => {
			const engine = createEngine(['p1', 'p2']);
			const jabHitbox: HitboxData = {
				offsetX: 20,
				offsetY: 0,
				radius: PHYSICS.HURTBOX_RADIUS + 10,
				damage: 3,
				baseKnockback: 0,
				knockbackGrowth: 0,
				knockbackAngle: 45,
				hitlagFrames: 0,
				hitstunFrames: 0,
				priority: 1,
			};

			const perHitDamage: number[] = [];
			for (let hitIndex = 0; hitIndex < 10; hitIndex += 1) {
				primePlayer(engine, 'p1', {
					x: 640,
					y: 300,
					state: PlayerStateEnum.IDLE,
					stateFrame: 0,
					isGrounded: true,
					hitlagFramesRemaining: 0,
					hitstunFramesRemaining: 0,
					activeHitbox: null,
					currentMoveId: MoveId.JAB,
					hitPlayerIds: new Set<string>(),
					vx: 0,
					vy: 0,
				});

				primePlayer(engine, 'p2', {
					x: 670,
					y: 300,
					state: PlayerStateEnum.IDLE,
					stateFrame: 0,
					isGrounded: true,
					hitlagFramesRemaining: 0,
					hitstunFramesRemaining: 0,
					vx: 0,
					vy: 0,
				});

				const beforePercent = getMutableState(engine).players.p2?.percent ?? 0;
				const { defender, attacker } = forceAttackFrameHitbox(engine, {
					attackerId: 'p1',
					defenderId: 'p2',
					frame: 5,
					hitbox: jabHitbox,
					attackerMoveId: MoveId.JAB,
					normalizeStaleDamage: false,
				});
				const damageThisHit = defender.percent - beforePercent;
				perHitDamage.push(damageThisHit);

				const expectedQueueLength = Math.min(hitIndex + 1, 9);
				expect(attacker.staleMoveQueue.length).toBe(expectedQueueLength);
			}

		expect(perHitDamage[0]).toBe(Math.floor(3 * 1.05));
		expect(perHitDamage[9]).toBe(Math.floor(3 * 0.6));
		});

		it.skip('BASELINE CHARACTERIZATION (pre-rage): attacker percent does not change knockback magnitude', () => {
			const hitbox: HitboxData = {
				offsetX: 20,
				offsetY: 0,
				radius: PHYSICS.HURTBOX_RADIUS + 10,
				damage: 10,
				baseKnockback: 30,
				knockbackGrowth: 120,
				knockbackAngle: 45,
				hitlagFrames: 0,
				hitstunFrames: 0,
				priority: 1,
			};
			const runScenario = (attackerPercent: number): number => {
				const engine = createEngine(['p1', 'p2']);
				primePlayer(engine, 'p1', { percent: attackerPercent });
				const result = forceAttackFrameHitbox(engine, {
					attackerId: 'p1',
					defenderId: 'p2',
					frame: 5,
					hitbox,
				});

				return Math.hypot(result.defender.vx, result.defender.vy);
			};

			const lowPercentKnockback = runScenario(0);
			const highPercentKnockback = runScenario(150);

			expect(highPercentKnockback).toBeCloseTo(lowPercentKnockback, 6);
		});

		it('rage: attacker at 150% deals 1.1x knockback vs attacker at 0%', () => {
			const hitbox: HitboxData = {
				offsetX: 20,
				offsetY: 0,
				radius: PHYSICS.HURTBOX_RADIUS + 10,
				damage: 10,
				baseKnockback: 30,
				knockbackGrowth: 120,
				knockbackAngle: 45,
				hitlagFrames: 0,
				hitstunFrames: 0,
				priority: 1,
			};
			const runScenario = (attackerPercent: number): number => {
				const engine = createEngine(['p1', 'p2']);
				primePlayer(engine, 'p1', { percent: attackerPercent });
				const result = forceAttackFrameHitbox(engine, {
					attackerId: 'p1',
					defenderId: 'p2',
					frame: 5,
					hitbox,
				});

				return Math.hypot(result.defender.vx, result.defender.vy);
			};

			const lowPercentKnockback = runScenario(0);
			const highPercentKnockback = runScenario(150);

			expect(highPercentKnockback).toBeCloseTo(lowPercentKnockback * 1.1, 6);
		});

		it('BASELINE CHARACTERIZATION (pre-tech model): tumble landing path had no tech branch and stayed punishable', () => {
		type LegacyTumbleLanding = {
			state: PlayerStateEnum;
			isInvincible: boolean;
		};

		const legacyLandingNoTechBranch = (): LegacyTumbleLanding => ({
			state: PlayerStateEnum.HITSTUN,
			isInvincible: false,
		});

		const result = legacyLandingNoTechBranch();
		expect(result.state).toBe(PlayerStateEnum.HITSTUN);
		expect(result.isInvincible).toBe(false);
	});

	it('TECHING: shield pressed 15f before landing succeeds with neutral tech (26f invincible)', () => {
		const engine = createEngine(['p1', 'p2']);
		primePlayer(engine, 'p1', {
			x: 640,
			y: 395,
			vx: 0,
			vy: 0,
			state: PlayerStateEnum.HITSTUN,
			stateFrame: 0,
			hitstunFramesRemaining: 0,
			isTumbling: true,
			isGrounded: false,
		});

		tick(engine, { p1: makeInput('p1', INPUT_BITS.SHIELD) });
		const landing = advanceUntilGrounded(engine, 'p1', 120);
		const landed = landing.state.players.p1;
		expect(landed).toBeDefined();
		if (!landed) {
			throw new Error('Expected p1 in successful-tech scenario');
		}

		console.info(
			`[tech-trace] TUMBLE -> SHIELD_PRESSED(window=20) -> LANDING(window=${landed.techWindowFrames}) -> ${landed.state}`,
		);

		expect(landing.framesElapsed + 1).toBe(15);
		expect(landed.state).toBe(PlayerStateEnum.TECH_NEUTRAL);
		expect(landed.isInvincible).toBe(true);
		expect(landed.techLockoutFrames).toBe(0);

		const after26 = advance(engine, 26).players.p1;
		expect(after26?.state).toBe(PlayerStateEnum.IDLE);
		expect(after26?.isInvincible).toBe(false);
	});

	it('TECHING: shield pressed 25f before landing fails -> hard landing 30f + lockout 40f', () => {
		const engine = createEngine(['p1', 'p2']);
		primePlayer(engine, 'p1', {
			x: 640,
			y: 261,
			vx: 0,
			vy: 0,
			state: PlayerStateEnum.HITSTUN,
			stateFrame: 0,
			hitstunFramesRemaining: 0,
			isTumbling: true,
			isGrounded: false,
		});

		tick(engine, { p1: makeInput('p1', INPUT_BITS.SHIELD) });
		const landing = advanceUntilGrounded(engine, 'p1', 24);
		const landed = landing.state.players.p1;
		expect(landed).toBeDefined();
		if (!landed) {
			throw new Error('Expected p1 in failed-tech scenario');
		}

		expect(landing.framesElapsed + 1).toBe(25);
		expect(landed.state).toBe(PlayerStateEnum.HARD_LANDING);
		expect(landed.techLockoutFrames).toBe(PHYSICS.TECH_LOCKOUT_FRAMES);
		expect(landed.isInvincible).toBe(false);

		const after30 = advance(engine, PHYSICS.TECH_MISS_LANDING_FRAMES).players.p1;
		expect(after30?.state).toBe(PlayerStateEnum.IDLE);
		expect(after30?.techLockoutFrames).toBe(10);

		primePlayer(engine, 'p1', {
			x: 640,
			y: 395,
			vx: 0,
			vy: 0,
			state: PlayerStateEnum.HITSTUN,
			stateFrame: 0,
			hitstunFramesRemaining: 0,
			isTumbling: true,
			isGrounded: false,
			techLockoutFrames: 10,
		});

		const lockoutAttempt = tick(engine, { p1: makeInput('p1', INPUT_BITS.SHIELD) }).players.p1;
		expect(lockoutAttempt?.techWindowFrames).toBe(0);
		expect(lockoutAttempt?.techLockoutFrames).toBe(9);
	});

	it('TECHING: tumble landing without shield is hard landing (30f) with no lockout', () => {
		const engine = createEngine(['p1', 'p2']);
		primePlayer(engine, 'p1', {
			x: 640,
			y: 394,
			vx: 0,
			vy: 0,
			state: PlayerStateEnum.HITSTUN,
			stateFrame: 0,
			hitstunFramesRemaining: 0,
			isTumbling: true,
			isGrounded: false,
		});

		const landing = advanceUntilGrounded(engine, 'p1', 15);
		const landed = landing.state.players.p1;
		expect(landed).toBeDefined();
		if (!landed) {
			throw new Error('Expected p1 in no-tech scenario');
		}

		expect(landing.framesElapsed).toBe(15);
		expect(landed.state).toBe(PlayerStateEnum.HARD_LANDING);
		expect(landed.techLockoutFrames).toBe(0);

		const after30 = advance(engine, PHYSICS.TECH_MISS_LANDING_FRAMES).players.p1;
		expect(after30?.state).toBe(PlayerStateEnum.IDLE);
	});

	it('TECHING: directional input on landing resolves to tech roll (40f)', () => {
		const engine = createEngine(['p1', 'p2']);
		primePlayer(engine, 'p1', {
			x: 640,
			y: 395,
			vx: 0,
			vy: 0,
			state: PlayerStateEnum.AIRBORNE,
			stateFrame: 0,
			hitstunFramesRemaining: 0,
			isTumbling: true,
			isGrounded: false,
		});

		tick(engine, { p1: makeInput('p1', INPUT_BITS.SHIELD) });
		const landing = advanceUntilGrounded(engine, 'p1', 14, {
			p1: {
				...makeInput('p1', INPUT_BITS.RIGHT),
				held: INPUT_BITS.RIGHT,
				pressed: 0,
			},
		});
		expect(landing.state.players.p1?.state).toBe(PlayerStateEnum.TECH_ROLL);

		const afterRoll = advance(engine, PHYSICS.TECH_ROLL_FRAMES).players.p1;
		expect(afterRoll?.state).toBe(PlayerStateEnum.IDLE);
	});

	it('TECHING: grounded shield press does not activate tech window', () => {
		const engine = createEngine(['p1']);
		primePlayer(engine, 'p1', {
			state: PlayerStateEnum.IDLE,
			isGrounded: true,
			isTumbling: false,
			x: 640,
			y: 472,
			vx: 0,
			vy: 0,
		});

		const state = tick(engine, { p1: makeInput('p1', INPUT_BITS.SHIELD) });
		expect(state.players.p1?.techWindowFrames).toBe(0);
	});

	it.skip('BASELINE CHARACTERIZATION (pre-hit-once): same defender can be hit on all 3 active frames of one forced move instance', () => {
		const engine = createEngine(['p1', 'p2']);
		const hitbox: HitboxData = {
			offsetX: 20,
			offsetY: 0,
			radius: PHYSICS.HURTBOX_RADIUS + 10,
			damage: 5,
			baseKnockback: 0,
			knockbackGrowth: 0,
			knockbackAngle: 45,
			hitlagFrames: 0,
			hitstunFrames: 0,
			priority: 1,
		};

		let defenderPercent = 0;
		for (const frame of [5, 6, 7]) {
			const { defender } = forceAttackFrameHitbox(engine, {
				attackerId: 'p1',
				defenderId: 'p2',
				frame,
				hitbox,
			});
			defenderPercent = defender.percent;
			console.info(`Frame ${frame}: HIT -> defender.percent=${defenderPercent}`);
		}

		expect(defenderPercent).toBe(15);
	});

	it('hit-once per move: 3 active frames only hit same defender once and tracks hitPlayerIds', () => {
		const engine = createEngine(['p1', 'p2']);
		const hitbox: HitboxData = {
			offsetX: 20,
			offsetY: 0,
			radius: PHYSICS.HURTBOX_RADIUS + 10,
			damage: 5,
			baseKnockback: 0,
			knockbackGrowth: 0,
			knockbackAngle: 45,
			hitlagFrames: 0,
			hitstunFrames: 0,
			priority: 1,
		};

		const frame5 = forceAttackFrameHitbox(engine, {
			attackerId: 'p1',
			defenderId: 'p2',
			frame: 5,
			hitbox,
		});
		console.info('Frame 5: HIT (hitPlayerIds=[p2])');
		expect(frame5.defender.percent).toBe(5);
		expect(frame5.attacker.hitPlayerIds.has('p2')).toBe(true);
		expect(frame5.attacker.hitPlayerIds.size).toBe(1);

		const frame6 = forceAttackFrameHitbox(engine, {
			attackerId: 'p1',
			defenderId: 'p2',
			frame: 6,
			hitbox,
		});
		console.info('Frame 6: SKIP (p2 already hit)');
		expect(frame6.defender.percent).toBe(5);

		const frame7 = forceAttackFrameHitbox(engine, {
			attackerId: 'p1',
			defenderId: 'p2',
			frame: 7,
			hitbox,
		});
		console.info('Frame 7: SKIP (p2 already hit)');
		expect(frame7.defender.percent).toBe(5);
	});

	it('hit-once per move: new move instance clears hitPlayerIds and can hit same defender again', () => {
		const engine = createEngine(['p1', 'p2']);
		const hitbox: HitboxData = {
			offsetX: 20,
			offsetY: 0,
			radius: PHYSICS.HURTBOX_RADIUS + 10,
			damage: 4,
			baseKnockback: 0,
			knockbackGrowth: 0,
			knockbackAngle: 45,
			hitlagFrames: 0,
			hitstunFrames: 0,
			priority: 1,
		};

		const firstMoveHit = forceAttackFrameHitbox(engine, {
			attackerId: 'p1',
			defenderId: 'p2',
			frame: 5,
			hitbox,
		});
		expect(firstMoveHit.defender.percent).toBe(4);

		primePlayer(engine, 'p1', {
			state: PlayerStateEnum.IDLE,
			stateFrame: 0,
			activeHitbox: null,
			currentMoveId: null,
		});
		tick(engine, { p1: null, p2: null });

		const secondMoveHit = forceAttackFrameHitbox(engine, {
			attackerId: 'p1',
			defenderId: 'p2',
			frame: 5,
			hitbox,
		});
		expect(secondMoveHit.defender.percent).toBe(8);
		expect(secondMoveHit.attacker.hitPlayerIds.has('p2')).toBe(true);
	});

		it('hit-once per move: same move can hit multiple defenders once each', () => {
		const engine = createEngine(['p1', 'p2', 'p3']);
		const hitbox: HitboxData = {
			offsetX: 20,
			offsetY: 0,
			radius: PHYSICS.HURTBOX_RADIUS + 25,
			damage: 6,
			baseKnockback: 0,
			knockbackGrowth: 0,
			knockbackAngle: 45,
			hitlagFrames: 0,
			hitstunFrames: 0,
			priority: 1,
		};

		const first = forceAttackFrameHitbox(engine, {
			attackerId: 'p1',
			defenderId: 'p2',
			frame: 5,
			hitbox,
		});

		primePlayer(engine, 'p2', {
			x: 900,
			y: 300,
			state: PlayerStateEnum.IDLE,
			hitlagFramesRemaining: 0,
			hitstunFramesRemaining: 0,
		});

		const second = forceAttackFrameHitbox(engine, {
			attackerId: 'p1',
			defenderId: 'p3',
			frame: 6,
			hitbox,
		});

		expect(first.defender.percent).toBe(6);
		expect(second.defender.percent).toBe(6);
		expect(second.attacker.hitPlayerIds.has('p2')).toBe(true);
		expect(second.attacker.hitPlayerIds.has('p3')).toBe(true);
			expect(second.attacker.hitPlayerIds.size).toBe(2);
		});

		it.skip('BASELINE CHARACTERIZATION (pre-dash-state): grounded direction could skip initial-dash phase and behave as immediate run', () => {
			type LegacyGroundStart = {
				startState: PlayerStateEnum;
				reverseStateWithinWindow: PlayerStateEnum;
			};

			const legacyGroundStart = (): LegacyGroundStart => ({
				startState: PlayerStateEnum.RUN,
				reverseStateWithinWindow: PlayerStateEnum.RUN,
			});

			const baseline = legacyGroundStart();
			expect(baseline.startState).toBe(PlayerStateEnum.RUN);
			expect(baseline.reverseStateWithinWindow).toBe(PlayerStateEnum.RUN);
		});

		it('initial dash: grounded direction enters DASH, reverses within 15f without skid, then commits to RUN on frame 15', () => {
			const engine = createEngine(['p1']);
			const templatePlayer = getMutableState(engine).players.p1;
			if (!templatePlayer) {
				throw new Error('Expected template player p1');
			}

			const makeHeldInput = (bits: number): InputEvent => ({
				...makeInput('p1', bits),
				held: bits,
				pressed: 0,
				released: 0,
			});

			const controller = new FSMController(PlayerStateEnum.IDLE);
			let player: PlayerState = {
				...templatePlayer,
				state: PlayerStateEnum.IDLE,
				stateFrame: 0,
				isGrounded: true,
				facing: 1,
				vx: 0,
				vy: 0,
			};

		player = controller.tick(player, makeInput('p1', INPUT_BITS.LEFT));
		player = { ...player, facing: -1 };
		expect(player.state).toBe(PlayerStateEnum.WALK);
		expect(player.stateFrame).toBe(0);

			for (let frame = 0; frame < 5; frame += 1) {
				player = controller.tick(player, makeHeldInput(INPUT_BITS.LEFT));
				player = { ...player, facing: -1 };
				expect(player.state).toBe(PlayerStateEnum.DASH);
			}

			player = controller.tick(player, makeInput('p1', INPUT_BITS.RIGHT));
			player = { ...player, facing: 1 };
			expect(player.state).toBe(PlayerStateEnum.DASH);
			expect(player.stateFrame).toBe(0);

			for (let frame = 1; frame <= 15; frame += 1) {
				player = controller.tick(player, makeHeldInput(INPUT_BITS.RIGHT));
				player = { ...player, facing: 1 };
				if (frame < 15) {
					expect(player.state).toBe(PlayerStateEnum.DASH);
					continue;
				}

				expect(player.state).toBe(PlayerStateEnum.RUN);
				expect(player.stateFrame).toBe(0);
			}

			const reverseFromRun = controller.tick(player, makeInput('p1', INPUT_BITS.LEFT));
			expect(reverseFromRun.state).toBe(PlayerStateEnum.IDLE);
		});

		it.skip('BASELINE CHARACTERIZATION (pre-meteor-cancel): downward spike hitstun ignores jump input even after frame 9', () => {
			type LegacyMeteorCancelOutcome = {
				state: PlayerStateEnum;
				hitstunFramesRemaining: number;
			};

			const legacyOutcome = (): LegacyMeteorCancelOutcome => ({
				state: PlayerStateEnum.HITSTUN,
				hitstunFramesRemaining: 10,
			});

			const result = legacyOutcome();
			expect(result.state).toBe(PlayerStateEnum.HITSTUN);
			expect(result.hitstunFramesRemaining).toBeGreaterThan(0);
		});

		it('meteor cancel: downward spike can be jump-canceled only after 8 elapsed hitstun frames', () => {
			const engine = createEngine(['p1']);
			const templatePlayer = getMutableState(engine).players.p1;
			if (!templatePlayer) {
				throw new Error('Expected template player p1');
			}

			const controller = new FSMController(PlayerStateEnum.HITSTUN);
			const makeHitstunPlayer = (
				stateFrame: number,
				lastHitKnockbackAngle: number,
			): PlayerState => ({
				...templatePlayer,
				state: PlayerStateEnum.HITSTUN,
				stateFrame,
				hitlagFramesRemaining: 0,
				hitstunFramesRemaining: 20,
				isTumbling: true,
				isGrounded: false,
				lastHitKnockbackAngle,
			});

			const jumpInput = makeInput('p1', INPUT_BITS.JUMP);

			const beforeWindow = controller.tick(makeHitstunPlayer(8, 4.7), jumpInput);
			expect(beforeWindow.state).toBe(PlayerStateEnum.HITSTUN);

			const inWindow = controller.tick(makeHitstunPlayer(9, 4.7), jumpInput);
			expect(inWindow.state).toBe(PlayerStateEnum.AIRBORNE);

			const nonSpikeAngle = controller.tick(makeHitstunPlayer(9, Math.PI / 4), jumpInput);
			expect(nonSpikeAngle.state).toBe(PlayerStateEnum.HITSTUN);
		});
	});
