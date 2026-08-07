import {
	applyFastFall,
	applyGravity,
	applyDI,
	applyMovement,
	checkHitboxCollision,
	checkLedgeGrab,
	checkPlatformCollision,
	DEFAULT_STAGE,
	FSMController,
	getMoveData,
	NO_HIT,
	resolveHitTrade,
	type StageData,
	startJump,
	calculateKnockback,
} from "@smash/engine";
import {
	knockbackAngleToVelocity,
	type GameState,
	INPUT_BITS,
	type InputEvent,
	MATCH_CONFIG,
	MoveId,
	PHYSICS,
	SMASH_CHARGE_MAX_FRAMES,
	type PlayerId,
	type PlayerState,
	PlayerStateEnum,
	STAGE,
	type StateSnapshot,
} from "@smash/shared";

const DEFAULT_SPAWN = { x: 640, y: MATCH_CONFIG.RESPAWN_PLATFORM_Y };
// EMPTY_INPUT is used when no real input has arrived for a player (network lag or
// disconnect). Physics functions require a non-null InputEvent to read bitfields;
// zeroed bits cause the player to coast to a stop with no movement applied.
const EMPTY_INPUT: InputEvent = {
	tick: -1,
	seq: -1,
	playerId: "__server__",
	held: 0,
	pressed: 0,
	released: 0,
};

function clonePlayer(player: PlayerState): PlayerState {
	return {
		...player,
		activeHitbox: player.activeHitbox ? { ...player.activeHitbox } : null,
		hitPlayerIds: new Set(player.hitPlayerIds),
		staleMoveQueue: [...(player.staleMoveQueue ?? [])],
	};
}

function isHeld(input: InputEvent | null, bit: number): boolean {
	return Boolean((input?.held ?? 0) & bit);
}

function isPressed(input: InputEvent | null, bit: number): boolean {
	return Boolean((input?.pressed ?? 0) & bit);
}

function isLedgeLockedState(state: string): boolean {
	return [
		PlayerStateEnum.LEDGE_HANG,
		PlayerStateEnum.LEDGE_CLIMB,
		PlayerStateEnum.LEDGE_ATTACK,
		PlayerStateEnum.LEDGE_ROLL,
		PlayerStateEnum.LEDGE_JUMP,
	].includes(state as PlayerStateEnum);
}

export interface GameEngineOptions {
	playerIds: PlayerId[];
}

/**
 * GameEngine is the server-authoritative tick driver that orchestrates the full
 * simulation pipeline each frame: FSM transitions → physics → hitbox state →
 * hit detection → KOs → win condition.
 *
 * ## Why GameEngine exists separately from FSMController
 *
 * FSMController is pure state logic — it answers "which state am I in?" and
 * "when do I transition?". GameEngine owns the *side effects* of those transitions.
 * For example, when JumpSquat → Airborne fires, it is GameEngine (via
 * `applyStateTransitions`) that calls `startJump()` to set the initial `vy`.
 * The FSM drives the state; GameEngine drives the physics consequences of
 * state changes.
 *
 * ## Why `fsmControllers` is a Map keyed by PlayerId
 *
 * Each fighter needs its own independent FSMController instance — the controller is
 * stateful (it tracks `stateFrame`, hitlag freeze, transition history, etc.).
 * A Map gives O(1) lookup per tick when processing each player independently.
 */
export class GameEngine {
	private state: GameState;
	private readonly fsmControllers = new Map<PlayerId, FSMController>();
	private readonly techAttemptBuffered = new Map<PlayerId, boolean>();
	private ledgeState: Map<
		string,
		{ occupantId: string | null; cooldowns: Map<string, number> }
	>;
	private tick = 0;

	constructor(options: GameEngineOptions) {
		const players = Object.fromEntries(
			options.playerIds.map((id, index) => {
				const spawn = STAGE.SPAWN_POSITIONS[index] ?? DEFAULT_SPAWN;
			const player: PlayerState = {
				id,
				slotIndex: index,
				x: spawn.x,
				y: spawn.y,
				vx: 0,
				vy: 0,
				facing: index % 2 === 0 ? 1 : -1,
				state: PlayerStateEnum.AIRBORNE,
					stateFrame: 0,
					hitlagFramesRemaining: 0,
					sdiInputCooldown: 0,
					hitstunFramesRemaining: 0,
				isTumbling: false,
				techWindowFrames: 0,
				techLockoutFrames: 0,
				landingLagFrames: 0,
				percent: 0,
				stocks: MATCH_CONFIG.STOCKS,
				isGrounded: false,
				isKnockedOut: false,
				hasDoubleJump: true,
				isFastFalling: false,
				isInvincible: false,
				invincibilityFrames: 0,
				isShielding: false,
				shieldHealth: PHYSICS.SHIELD_MAX_HEALTH,
				shieldStunFrames: 0,
				isGrabbing: false,
				grabbedPlayerId: null,
				ledgeId: null,
				activeHitbox: null,
				currentMoveId: null,
				currentMove: undefined,
				hitPlayerIds: new Set<string>(),
					chargeFrames: 0,
					asdiDriftAccumulated: 0,
					staleMoveQueue: [],
					lastHitByFacing: null,
					lastHitKnockbackAngle: null,
					pendingKnockbackVx: null,
					pendingKnockbackVy: null,
				respawnTimer: 0,
			};

				this.techAttemptBuffered.set(id, false);
				this.fsmControllers.set(
					id,
					new FSMController(PlayerStateEnum.AIRBORNE),
				);
				return [id, player];
			}),
		) as Record<PlayerId, PlayerState>;

		this.state = {
			tick: 0,
			players,
			matchPhase: "match",
			winnerId: null,
			ledges: {},
		};
		this.ledgeState = new Map(
			STAGE.LEDGES.map((ledge) => [
				ledge.id,
				{ occupantId: null, cooldowns: new Map<string, number>() },
			]),
		);
	}

	tickGame(inputs: Map<PlayerId, InputEvent | null>): GameState {
		if (this.state.winnerId) {
			return this.state;
		}

		this.tick += 1;
		const players = Object.fromEntries(
			Object.entries(this.state.players).map(([playerId, player]) => [
				playerId,
				clonePlayer(player),
			]),
		) as Record<PlayerId, PlayerState>;

		for (const playerId of Object.keys(players) as PlayerId[]) {
			const currentPlayer = players[playerId];
			if (!currentPlayer) {
				continue;
			}

			players[playerId] = this.updatePlayer(
				playerId,
				currentPlayer,
				inputs.get(playerId) ?? null,
				players,
			);
		}

		this.applyHitDetection(players, inputs);
		this.syncGrabState(players);
		this.applyKnockouts(players);
		this.tickLedgeCooldowns();

		const ledgesSnapshot: Record<string, string | null> = {};
		for (const [id, data] of this.ledgeState) {
			ledgesSnapshot[id] = data.occupantId;
		}

		const alivePlayers = Object.values(players).filter(
			(player) => player.stocks > 0,
		);
		const winnerId =
			alivePlayers.length === 1 ? (alivePlayers[0]?.id ?? null) : null;

		this.state = {
			tick: this.tick,
			players,
			matchPhase: winnerId ? "result" : "match",
			winnerId,
			ledges: ledgesSnapshot,
		};

		return this.state;
	}

	getSnapshot(
		timestamp: number,
		lastConfirmedSeq: Record<PlayerId, number>,
	): StateSnapshot {
		return {
			tick: this.tick,
			timestamp,
			lastConfirmedSeq,
			players: this.state.players,
			matchPhase: this.state.matchPhase,
			winnerId: this.state.winnerId,
			ledges: this.state.ledges,
		};
	}

	isMatchOver(): boolean {
		return this.state.winnerId !== null;
	}

	getWinnerId(): PlayerId | null {
		return this.state.winnerId;
	}

	getCurrentTick(): number {
		return this.tick;
	}

	// Determinism debugging: rounded integer values eliminate false-positive mismatches
	// caused by floating-point arithmetic differences between JS engine runs or execution
	// order. Server and client both log this hash at the same tick; a mismatch means
	// the simulations have diverged.
	getStateHash(): string {
		return Object.values(this.state.players)
			.sort((left, right) => left.slotIndex - right.slotIndex)
			.map(
				(player) =>
					`${player.slotIndex}:${Math.round(player.x)},${Math.round(player.y)},${Math.round(
						player.vx,
					)},${Math.round(player.vy)},${Math.round(player.percent)},${player.stocks},${player.state}`,
			)
			.join("|");
	}

	private updatePlayer(
		playerId: PlayerId,
		current: PlayerState,
		input: InputEvent | null,
		players: Record<PlayerId, PlayerState>,
	): PlayerState {
		let player = clonePlayer(current);
		player = {
			...player,
			chargeFrames: Number.isFinite(player.chargeFrames) ? player.chargeFrames : 0,
		};
		player = this.updateTechFrameCounters(playerId, player, input);

		if (player.stocks <= 0) {
			return {
				...player,
				activeHitbox: null,
				currentMoveId: null,
				currentMove: undefined,
				chargeFrames: 0,
				sdiInputCooldown: 0,
				vx: 0,
				vy: 0,
			};
		}

		if (player.respawnTimer > 0) {
			this.techAttemptBuffered.set(playerId, false);
			return {
				...player,
				respawnTimer: player.respawnTimer - 1,
				activeHitbox: null,
				currentMoveId: null,
				currentMove: undefined,
				hitPlayerIds: new Set<string>(),
				chargeFrames: 0,
				asdiDriftAccumulated: 0,
				hitlagFramesRemaining: 0,
				sdiInputCooldown: 0,
				hitstunFramesRemaining: 0,
				isTumbling: false,
				techWindowFrames: 0,
				techLockoutFrames: 0,
				landingLagFrames: 0,
				lastHitByFacing: null,
				lastHitKnockbackAngle: null,
				pendingKnockbackVx: null,
				pendingKnockbackVy: null,
				vx: 0,
				vy: 0,
			};
		}

		const ledgeEligibleStates: string[] = [
			PlayerStateEnum.AIRBORNE,
			PlayerStateEnum.DOUBLE_JUMP,
		];
		if (ledgeEligibleStates.includes(player.state)) {
			const ledge = checkLedgeGrab(player, DEFAULT_STAGE);
			if (ledge) {
				const previousOccupantId = this.getLedgeOccupant(ledge.id);
				const result = this.tryGrabLedge(player.id, ledge.id);
	
				if (result === "granted") {
					player = this.snapPlayerToLedge(player, ledge.id);
				} else if (
					result === "trumped" &&
					previousOccupantId &&
					players[previousOccupantId as PlayerId]
				) {
					const poppedPlayer = players[previousOccupantId as PlayerId];
					if (!poppedPlayer) {
						return player;
					}

					const popVx =
						ledge.id === "left"
							? PHYSICS.LEDGE_TRUMP_POP_VX
							: -PHYSICS.LEDGE_TRUMP_POP_VX;
					players[previousOccupantId as PlayerId] = {
						...poppedPlayer,
						state: PlayerStateEnum.AIRBORNE,
						stateFrame: 0,
						ledgeId: null,
						vx: popVx,
						vy: PHYSICS.LEDGE_TRUMP_POP_VY,
						isGrounded: false,
					isInvincible: true,
					invincibilityFrames: PHYSICS.LEDGE_TRUMP_INVINCIBILITY_FRAMES,
					activeHitbox: null,
					currentMoveId: null,
					currentMove: undefined,
					landingLagFrames: 0,
					hitPlayerIds: new Set<string>(),
					chargeFrames: 0,
				};
					player = this.snapPlayerToLedge(player, ledge.id);
				}
			}
		}

		const controller = this.fsmControllers.get(playerId);
		if (!controller) {
			return player;
		}

		const beforeTick = clonePlayer(player);
		let nextPlayer = controller.tick(player, input);
		nextPlayer = this.applyStateTransitions(beforeTick, nextPlayer, input);
		nextPlayer = this.applyDirectionalInfluenceOnHitlagEnd(player, nextPlayer, input);
		nextPlayer = this.tickLandingLagCounter(nextPlayer);
		const gainedInvincibilityThisTick =
			!current.isInvincible &&
			nextPlayer.isInvincible &&
			nextPlayer.invincibilityFrames > current.invincibilityFrames;
		const droppedFromLedgeThisTick =
			beforeTick.state === PlayerStateEnum.LEDGE_HANG &&
			nextPlayer.state === PlayerStateEnum.AIRBORNE &&
			isPressed(input, INPUT_BITS.DOWN);

		if (nextPlayer.hitlagFramesRemaining > 0) {
			return this.withHitboxState(nextPlayer, input);
		}

		nextPlayer = this.applyPhysicsToPlayer(
			playerId,
			nextPlayer,
			input,
			droppedFromLedgeThisTick,
		);
		nextPlayer = this.applyFacing(nextPlayer, input);
		if (!gainedInvincibilityThisTick) {
			nextPlayer = this.updateInvincibility(nextPlayer);
		}
		nextPlayer = this.withHitboxState(nextPlayer, input);

		if (nextPlayer.state === PlayerStateEnum.SHIELD) {
			nextPlayer = {
				...nextPlayer,
				isShielding: true,
				shieldHealth: Math.max(
					0,
					nextPlayer.shieldHealth - PHYSICS.SHIELD_DRAIN_PER_FRAME,
				),
			};

			if (nextPlayer.shieldHealth <= 0 && player.shieldHealth > 0) {
				nextPlayer = this.applyShieldBreak(nextPlayer);
			}
		} else {
			nextPlayer = {
				...nextPlayer,
				isShielding: false,
				shieldHealth: Math.min(
					PHYSICS.SHIELD_MAX_HEALTH,
					nextPlayer.shieldHealth + PHYSICS.SHIELD_REGEN_PER_FRAME,
				),
				shieldStunFrames: 0,
			};
		}

		if (!nextPlayer.isTumbling) {
			this.techAttemptBuffered.set(playerId, false);
			nextPlayer = {
				...nextPlayer,
				techWindowFrames: 0,
			};
		}

		return nextPlayer;
	}

	private updateTechFrameCounters(
		playerId: PlayerId,
		player: PlayerState,
		input: InputEvent | null,
	): PlayerState {
		let nextPlayer: PlayerState = {
			...player,
			techWindowFrames: Math.max(0, player.techWindowFrames - 1),
			techLockoutFrames: Math.max(0, player.techLockoutFrames - 1),
		};

		const shouldStartTechWindow =
			isPressed(input, INPUT_BITS.SHIELD) &&
			!nextPlayer.isGrounded &&
			nextPlayer.isTumbling &&
			nextPlayer.techLockoutFrames === 0;

		if (!shouldStartTechWindow) {
			return nextPlayer;
		}

		this.techAttemptBuffered.set(playerId, true);
		nextPlayer = {
			...nextPlayer,
			techWindowFrames: PHYSICS.TECH_WINDOW_FRAMES,
		};

		return nextPlayer;
	}

	/**
	 * Applies the one-time physics side effects that correspond to FSM state transitions.
	 *
	 * ## Why this exists as a separate step after the FSM tick
	 *
	 * The FSM is "pure logic" — after `controller.tick()` it simply reports "I am now in
	 * AIRBORNE state". The physics consequence of that (e.g. setting vy = JUMP_VELOCITY)
	 * must happen *exactly once*, on the tick the transition fires. Comparing
	 * `previous.state` vs `player.state` (captured before/after the FSM tick) detects
	 * fresh transitions and applies their one-time side effects.
	 *
	 * ## Why `previous.state !== player.state` is the trigger
	 *
	 * If the states differ, a transition fired this tick — the side effect runs once.
	 * If they are equal, the player is mid-state and no side effect is needed.
	 */
	private applyStateTransitions(
		previous: PlayerState,
		player: PlayerState,
		input: InputEvent | null,
	): PlayerState {
		let nextPlayer = player;

		if (
			previous.state === PlayerStateEnum.JUMPSQUAT &&
			player.state === PlayerStateEnum.AIRBORNE
		) {
			nextPlayer = startJump(nextPlayer, false);
		}

		if (
			player.state === PlayerStateEnum.DOUBLE_JUMP &&
			previous.state !== PlayerStateEnum.DOUBLE_JUMP
		) {
			nextPlayer = startJump(nextPlayer, false);
		}

		if (
			previous.state === PlayerStateEnum.LEDGE_JUMP &&
			player.state === PlayerStateEnum.AIRBORNE
		) {
			nextPlayer = startJump(nextPlayer, false);
			if (previous.ledgeId) {
				this.releaseLedge(player.id, previous.ledgeId);
			}
			nextPlayer = { ...nextPlayer, ledgeId: null };
		}

		if (
			previous.state === PlayerStateEnum.LEDGE_HANG &&
			player.state === PlayerStateEnum.AIRBORNE
		) {
			if (previous.ledgeId) {
				this.releaseLedge(player.id, previous.ledgeId);
			}
			nextPlayer = { ...nextPlayer, ledgeId: null };
		}

		if (
			[
				PlayerStateEnum.LEDGE_CLIMB,
				PlayerStateEnum.LEDGE_ATTACK,
				PlayerStateEnum.LEDGE_ROLL,
			].includes(previous.state as PlayerStateEnum) &&
			player.state === PlayerStateEnum.IDLE
		) {
			if (previous.ledgeId) {
				this.releaseLedge(player.id, previous.ledgeId);
			}
				nextPlayer = {
					...nextPlayer,
					ledgeId: null,
					y: STAGE.MAIN_PLATFORM.y - PHYSICS.HURTBOX_RADIUS,
					vy: 0,
					isGrounded: true,
					isFastFalling: false,
				};
			}

		if (
			previous.state === PlayerStateEnum.LEDGE_HANG &&
			[
				PlayerStateEnum.LEDGE_CLIMB,
				PlayerStateEnum.LEDGE_ATTACK,
				PlayerStateEnum.LEDGE_ROLL,
				PlayerStateEnum.LEDGE_JUMP,
			].includes(player.state as PlayerStateEnum)
		) {
			nextPlayer = { ...nextPlayer, ledgeId: previous.ledgeId };
		}

		if (
			(player.state === PlayerStateEnum.ATTACK ||
				player.state === PlayerStateEnum.AIR_ATTACK ||
				player.state === PlayerStateEnum.LEDGE_ATTACK ||
				player.state === PlayerStateEnum.GRAB ||
				player.state === PlayerStateEnum.GRAB_HOLDING) &&
			previous.state !== player.state
		) {
			const moveId = this.selectMoveId(player, input);
			nextPlayer = {
				...nextPlayer,
				currentMoveId: moveId,
				currentMove: {
					landingLag: getMoveData(moveId).landingLag,
				},
				hitPlayerIds: new Set<string>(),
				chargeFrames: 0,
			};
		}

		const leftRegularAttackState =
			(previous.state === PlayerStateEnum.ATTACK ||
				previous.state === PlayerStateEnum.AIR_ATTACK) &&
			player.state !== PlayerStateEnum.ATTACK &&
			player.state !== PlayerStateEnum.AIR_ATTACK;

		if (leftRegularAttackState) {
			nextPlayer = {
				...nextPlayer,
				hitPlayerIds: new Set<string>(),
			};
		}

		if (![PlayerStateEnum.ATTACK, PlayerStateEnum.AIR_ATTACK, PlayerStateEnum.LEDGE_ATTACK].includes(
			player.state as PlayerStateEnum,
		)) {
			nextPlayer = {
				...nextPlayer,
				currentMoveId: null,
				currentMove: undefined,
				hitPlayerIds: new Set<string>(),
				chargeFrames: 0,
			};
		}

		if (player.state === PlayerStateEnum.HITSTUN) {
			nextPlayer = {
				...nextPlayer,
				currentMoveId: null,
				currentMove: undefined,
				chargeFrames: 0,
				activeHitbox: null,
			};
		}

		if (
			previous.state === PlayerStateEnum.HITSTUN &&
			player.state === PlayerStateEnum.AIRBORNE
		) {
			nextPlayer = {
				...nextPlayer,
				isTumbling: false,
			};
		}

		return nextPlayer;
	}

	private applyPhysicsToPlayer(
		playerId: PlayerId,
		player: PlayerState,
		input: InputEvent | null,
		preventImmediateFastFall = false,
	): PlayerState {
		const effectiveInput = input ?? {
			...EMPTY_INPUT,
			playerId: player.id,
			tick: this.tick,
		};
		let nextPlayer = player;

		if (isLedgeLockedState(player.state)) {
			return nextPlayer;
		}

		if (player.state === PlayerStateEnum.JUMPSQUAT) {
			nextPlayer = {
				...nextPlayer,
				vx: nextPlayer.vx * PHYSICS.GROUND_FRICTION,
			};
		} else if (player.hitstunFramesRemaining > 0) {
			const withGravity = applyGravity(nextPlayer);
			nextPlayer = checkPlatformCollision(
				{
					...withGravity,
					x: withGravity.x + withGravity.vx,
					y: withGravity.y + withGravity.vy,
				},
				DEFAULT_STAGE,
			);
		} else if (
			player.state !== PlayerStateEnum.SHIELD &&
			player.state !== PlayerStateEnum.ROLL &&
			player.state !== PlayerStateEnum.SPOT_DODGE &&
			player.state !== PlayerStateEnum.TECH_NEUTRAL &&
			player.state !== PlayerStateEnum.TECH_ROLL &&
			player.state !== PlayerStateEnum.HARD_LANDING &&
			player.state !== PlayerStateEnum.LANDING_LAG
		) {
			nextPlayer = preventImmediateFastFall
				? checkPlatformCollision(
						applyMovement(applyGravity(nextPlayer), effectiveInput),
						DEFAULT_STAGE,
				  )
				: this.applyMovementPipeline(nextPlayer, effectiveInput);
		}

		const landedThisTick = !player.isGrounded && nextPlayer.isGrounded;
		if (landedThisTick && player.isTumbling) {
			nextPlayer = this.resolveTumbleLanding(playerId, nextPlayer, effectiveInput);
		}

			if (landedThisTick && player.state === PlayerStateEnum.AIR_ATTACK) {
				const landingLagFrames = player.currentMove?.landingLag ?? 0;
				nextPlayer = {
					...nextPlayer,
					state:
						landingLagFrames > 0
							? PlayerStateEnum.LANDING_LAG
							: PlayerStateEnum.IDLE,
					stateFrame: 0,
					landingLagFrames,
					sdiInputCooldown: 0,
				};
			}

			if (landedThisTick && player.state !== PlayerStateEnum.AIR_ATTACK) {
				nextPlayer = {
					...nextPlayer,
					sdiInputCooldown: 0,
				};
			}

		if (nextPlayer.hitstunFramesRemaining > 0) {
			nextPlayer = {
				...nextPlayer,
				state: PlayerStateEnum.HITSTUN,
			};
		}

		return nextPlayer;
	}

	private tickLandingLagCounter(player: PlayerState): PlayerState {
		if (player.state !== PlayerStateEnum.LANDING_LAG) {
			return player.landingLagFrames > 0
				? {
						...player,
						landingLagFrames: 0,
				  }
				: player;
		}

		if (player.landingLagFrames <= 0) {
			return player;
		}

		return {
			...player,
			landingLagFrames: player.landingLagFrames - 1,
		};
	}

	private applyMovementPipeline(
		player: PlayerState,
		input: InputEvent,
	): PlayerState {
		// Drop-through mechanic: when the player holds DOWN, we pass an empty platforms
		// array to checkPlatformCollision. With no soft platforms registered, the physics
		// code finds nothing to land on and the fighter falls through. The main platform
		// (a separate field on StageData) is unaffected, so fighters cannot fall through
		// the stage floor.
		const stage: StageData = isHeld(input, INPUT_BITS.DOWN)
			? {
					...DEFAULT_STAGE,
					platforms: [],
				}
			: DEFAULT_STAGE;

		return checkPlatformCollision(
			applyMovement(applyFastFall(applyGravity(player), input), input),
			stage,
		);
	}

	private resolveTumbleLanding(
		playerId: PlayerId,
		player: PlayerState,
		input: InputEvent,
	): PlayerState {
		if (player.techWindowFrames > 0) {
			this.techAttemptBuffered.set(playerId, false);
			const rollLeft = isHeld(input, INPUT_BITS.LEFT);
			const rollRight = isHeld(input, INPUT_BITS.RIGHT);
			const isTechRoll = rollLeft !== rollRight;
			const invincibilityFrames = isTechRoll
				? PHYSICS.TECH_ROLL_FRAMES
				: PHYSICS.TECH_NEUTRAL_FRAMES;

			return {
				...player,
				state: isTechRoll ? PlayerStateEnum.TECH_ROLL : PlayerStateEnum.TECH_NEUTRAL,
				stateFrame: 0,
				isInvincible: true,
				invincibilityFrames,
				isTumbling: false,
				techWindowFrames: 0,
				landingLagFrames: 0,
				isFastFalling: false,
				vx: 0,
				vy: 0,
			};
		}

		const attemptedTech = this.techAttemptBuffered.get(playerId) === true;
		this.techAttemptBuffered.set(playerId, false);

		return {
			...player,
			state: PlayerStateEnum.HARD_LANDING,
			stateFrame: 0,
			isInvincible: false,
			invincibilityFrames: 0,
			isTumbling: false,
			techWindowFrames: 0,
			landingLagFrames: 0,
			isFastFalling: false,
			techLockoutFrames: attemptedTech
				? PHYSICS.TECH_LOCKOUT_FRAMES
				: player.techLockoutFrames,
			vx: 0,
			vy: 0,
		};
	}

	private applyFacing(
		player: PlayerState,
		input: InputEvent | null,
	): PlayerState {
		if (isHeld(input, INPUT_BITS.LEFT) && !isHeld(input, INPUT_BITS.RIGHT)) {
			return { ...player, facing: -1 };
		}
		if (isHeld(input, INPUT_BITS.RIGHT) && !isHeld(input, INPUT_BITS.LEFT)) {
			return { ...player, facing: 1 };
		}
		return player;
	}

	private updateInvincibility(player: PlayerState): PlayerState {
		if (!player.isInvincible) {
			return player;
		}

		const remainingFrames = Math.max(0, player.invincibilityFrames - 1);
		return {
			...player,
			invincibilityFrames: remainingFrames,
			isInvincible: remainingFrames > 0,
		};
	}

	private applyDirectionalInfluenceOnHitlagEnd(
		playerBeforeTick: PlayerState,
		playerAfterTick: PlayerState,
		input: InputEvent | null,
	): PlayerState {
		const hitlagEndedThisFrame =
			playerBeforeTick.hitlagFramesRemaining === 1 &&
			playerAfterTick.hitlagFramesRemaining === 0;

		if (!hitlagEndedThisFrame) {
			return playerAfterTick;
		}

		const hasPendingKnockback =
			playerBeforeTick.pendingKnockbackVx !== null &&
			playerBeforeTick.pendingKnockbackVx !== undefined &&
			playerBeforeTick.pendingKnockbackVy !== null &&
			playerBeforeTick.pendingKnockbackVy !== undefined;

		if (!hasPendingKnockback) {
			return playerAfterTick;
		}

		const baseVx = playerBeforeTick.pendingKnockbackVx ?? playerBeforeTick.vx;
		const baseVy = playerBeforeTick.pendingKnockbackVy ?? playerBeforeTick.vy;
		const knockbackMagnitude = Math.hypot(baseVx, baseVy);
		if (knockbackMagnitude === 0) {
			return {
				...playerAfterTick,
				pendingKnockbackVx: null,
				pendingKnockbackVy: null,
			};
		}

		const { inputX, inputY } = this.getDirectionalInputVector(input);
		const knockbackAngle = Math.atan2(-baseVy, baseVx);
		const attackerFacing = playerBeforeTick.lastHitByFacing ?? 1;
		const adjustedAngle = applyDI(knockbackAngle, inputX, inputY, attackerFacing);
		const adjustedAngleDegs = (adjustedAngle * 180) / Math.PI;
		const adjustedVelocity = knockbackAngleToVelocity(
			knockbackMagnitude,
			adjustedAngleDegs,
			1,
		);

			return {
				...playerAfterTick,
				vx: adjustedVelocity.x,
				vy: adjustedVelocity.y,
				lastHitKnockbackAngle: ((adjustedAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2),
				pendingKnockbackVx: null,
				pendingKnockbackVy: null,
			};
		}

	private getDirectionalInputVector(input: InputEvent | null): {
		inputX: -1 | 0 | 1;
		inputY: -1 | 0 | 1;
	} {
		const leftHeld = isHeld(input, INPUT_BITS.LEFT);
		const rightHeld = isHeld(input, INPUT_BITS.RIGHT);
		const upHeld = isHeld(input, INPUT_BITS.JUMP);
		const downHeld = isHeld(input, INPUT_BITS.DOWN);

		const inputX = leftHeld === rightHeld ? 0 : leftHeld ? -1 : 1;
		const inputY = upHeld === downHeld ? 0 : upHeld ? 1 : -1;

		return { inputX, inputY };
	}

	private withHitboxState(
		player: PlayerState,
		input: InputEvent | null,
	): PlayerState {
		if (![PlayerStateEnum.ATTACK, PlayerStateEnum.AIR_ATTACK, PlayerStateEnum.LEDGE_ATTACK].includes(
			player.state as PlayerStateEnum,
		)) {
			return {
				...player,
				activeHitbox: null,
			};
		}

		// `currentMoveId` may not be set yet on the very first frame of an attack (it is
		// assigned in applyStateTransitions which runs before this). Falling back to
		// selectMoveId ensures the hitbox is never stale for one frame.
		const moveId = (player.currentMoveId ?? this.selectMoveId(player, input)) as MoveId;
		const move = getMoveData(moveId);
		const isSmashMove =
			move.id === MoveId.FORWARD_SMASH ||
			move.id === MoveId.UP_SMASH ||
			move.id === MoveId.DOWN_SMASH;

		const safeChargeFrames = Number.isFinite(player.chargeFrames)
			? player.chargeFrames
			: 0;
		const clampedChargeFrames = Math.max(
			0,
			Math.min(safeChargeFrames, SMASH_CHARGE_MAX_FRAMES),
		);

		const activeFrameWithoutAdditionalCharge =
			player.stateFrame - move.startupFrames - clampedChargeFrames;

		if (isSmashMove && activeFrameWithoutAdditionalCharge < 0) {
			const attackHeld = isHeld(input, INPUT_BITS.ATTACK);
			const attackJustPressed = isPressed(input, INPUT_BITS.ATTACK);
			const canCharge =
				attackHeld && !attackJustPressed && clampedChargeFrames < SMASH_CHARGE_MAX_FRAMES;

			if (canCharge) {
				return {
					...player,
					currentMoveId: move.id,
					chargeFrames: clampedChargeFrames + 1,
					activeHitbox: null,
				};
			}
		}

		// activeFrame maps stateFrame onto the hitboxPerActiveFrame array by subtracting
		// startup frames. Index 0 = first active frame, 1 = second, etc. Different frames
		// can have different hitbox positions/sizes (e.g. a sweetspot only on frame 0).
		const activeFrame = isSmashMove
			? player.stateFrame - move.startupFrames - clampedChargeFrames
			: player.stateFrame - move.startupFrames;
		const baseActiveHitbox =
			activeFrame >= 0 && activeFrame < move.hitboxPerActiveFrame.length
				? (move.hitboxPerActiveFrame[activeFrame] ?? null)
				: null;

		const smashChargeMultiplier = isSmashMove
			? 1 + (clampedChargeFrames / SMASH_CHARGE_MAX_FRAMES) * 0.4
			: 1;

		const activeHitbox =
			baseActiveHitbox && isSmashMove
				? {
					...baseActiveHitbox,
					damage: baseActiveHitbox.damage * smashChargeMultiplier,
					baseKnockback: baseActiveHitbox.baseKnockback * smashChargeMultiplier,
				}
				: baseActiveHitbox;

		return {
			...player,
			currentMoveId: move.id,
			chargeFrames: isSmashMove ? clampedChargeFrames : 0,
			activeHitbox,
		};
	}

	private snapPlayerToLedge(player: PlayerState, ledgeId: string): PlayerState {
		const ledgeConfig = STAGE.LEDGES.find((ledge) => ledge.id === ledgeId);
		if (!ledgeConfig) {
			return player;
		}

		const hangX = ledgeId === "left" ? ledgeConfig.x + 15 : ledgeConfig.x - 15;
		const hangY = ledgeConfig.y + 10;
		return {
			...player,
			state: PlayerStateEnum.LEDGE_HANG,
			stateFrame: 0,
			ledgeId,
			x: hangX,
			y: hangY,
			vx: 0,
			vy: 0,
			isGrounded: false,
			isFastFalling: false,
			isInvincible: true,
			invincibilityFrames: PHYSICS.LEDGE_HANG_INVINCIBILITY_FRAMES,
		};
	}

	private getLedgeOccupant(ledgeId: string): string | null {
		return this.ledgeState.get(ledgeId)?.occupantId ?? null;
	}

	private tryGrabLedge(
		playerId: string,
		ledgeId: string,
	): "granted" | "trumped" | "denied" {
		const ledge = this.ledgeState.get(ledgeId);
		if (!ledge) return "denied";

		const cooldown = ledge.cooldowns.get(playerId) ?? 0;
		if (cooldown > 0) return "denied";

		if (!ledge.occupantId) {
			ledge.occupantId = playerId;
			return "granted";
		}

		if (ledge.occupantId === playerId) return "denied";

		const previousOccupantId = ledge.occupantId;
		ledge.occupantId = playerId;
		ledge.cooldowns.set(
			previousOccupantId,
			PHYSICS.LEDGE_REGRAB_COOLDOWN_FRAMES,
		);
		return "trumped";
	}

	private releaseLedge(playerId: string, ledgeId: string): void {
		const ledge = this.ledgeState.get(ledgeId);
		if (!ledge) return;
		if (ledge.occupantId === playerId) {
			ledge.occupantId = null;
		}
		ledge.cooldowns.set(playerId, PHYSICS.LEDGE_REGRAB_COOLDOWN_FRAMES);
	}

	private tickLedgeCooldowns(): void {
		for (const ledge of this.ledgeState.values()) {
			for (const [playerId, frames] of ledge.cooldowns) {
				if (frames > 0) {
					ledge.cooldowns.set(playerId, frames - 1);
				}
			}
		}
	}

	private selectMoveId(player: PlayerState, input: InputEvent | null): MoveId {
		const wantsUp = isHeld(input, INPUT_BITS.JUMP) || isPressed(input, INPUT_BITS.JUMP);
		const wantsDown = isHeld(input, INPUT_BITS.DOWN);
		const wantsLeft = isHeld(input, INPUT_BITS.LEFT);
		const wantsRight = isHeld(input, INPUT_BITS.RIGHT);
		const wantsHorizontal = wantsLeft !== wantsRight;
		const wantsSpecial = isPressed(input, INPUT_BITS.SPECIAL);
		const wantsGrab = isPressed(input, INPUT_BITS.GRAB);
		const wantsSmash = isHeld(input, INPUT_BITS.SHIELD) && isPressed(input, INPUT_BITS.ATTACK);
		const wantsToward =
			(player.facing === 1 && wantsRight) || (player.facing === -1 && wantsLeft);
		const wantsAway = wantsHorizontal && !wantsToward;

		if (player.state === PlayerStateEnum.LEDGE_ATTACK) {
			return MoveId.LEDGE_ATTACK;
		}

		if (player.state === PlayerStateEnum.AIR_ATTACK || !player.isGrounded) {
			if (wantsSpecial) {
				if (wantsUp) return MoveId.UP_SPECIAL;
				if (wantsDown) return MoveId.DOWN_SPECIAL;
				if (wantsHorizontal) return MoveId.SIDE_SPECIAL;
				return MoveId.NEUTRAL_SPECIAL;
			}

			if (wantsUp) return MoveId.UP_AIR;
			if (wantsDown) return MoveId.DOWN_AIR;
			if (wantsAway) return MoveId.BACK_AIR;
			if (wantsToward || wantsHorizontal) return MoveId.FORWARD_AIR;
			return MoveId.NEUTRAL_AIR;
		}

		if (wantsGrab) {
			if (isPressed(input, INPUT_BITS.ATTACK)) return MoveId.PUMMEL;
			if (wantsUp) return MoveId.UP_THROW;
			if (wantsDown) return MoveId.DOWN_THROW;
			if (wantsAway) return MoveId.BACK_THROW;
			if (wantsToward || wantsHorizontal) return MoveId.FORWARD_THROW;
			return MoveId.GRAB;
		}

		if (wantsSpecial) {
			if (wantsUp) return MoveId.UP_SPECIAL;
			if (wantsDown) return MoveId.DOWN_SPECIAL;
			if (wantsHorizontal) return MoveId.SIDE_SPECIAL;
			return MoveId.NEUTRAL_SPECIAL;
		}

		if (wantsSmash) {
			if (wantsUp) return MoveId.UP_SMASH;
			if (wantsDown) return MoveId.DOWN_SMASH;
			return MoveId.FORWARD_SMASH;
		}

		if (wantsUp) return MoveId.UP_TILT;
		if (wantsDown) return MoveId.DOWN_TILT;
		if (wantsHorizontal) return MoveId.FORWARD_TILT;
		return MoveId.JAB;
	}

	private applyHitDetection(
		players: Record<PlayerId, PlayerState>,
		inputs: Map<PlayerId, InputEvent | null> = new Map<PlayerId, InputEvent | null>(),
	): void {
		const playerList = Object.values(players);

		// O(n²) over player pairs using i < j to avoid checking the same pair twice
		// and to keep hitOnA / hitOnB both resolved in a single iteration.
		// Both directions are checked per pair because either player may be attacking.
		for (let i = 0; i < playerList.length; i += 1) {
			for (let j = i + 1; j < playerList.length; j += 1) {
				const playerAEntry = playerList[i];
				const playerBEntry = playerList[j];
				if (!playerAEntry || !playerBEntry) {
					continue;
				}

				const playerA = players[playerAEntry.id];
				const playerB = players[playerBEntry.id];
				if (!playerA || !playerB) {
					continue;
				}

				const playerAInput = inputs.get(playerA.id) ?? null;
				const playerBInput = inputs.get(playerB.id) ?? null;

				const playerACountered = this.tryApplyCounterHit(players, playerB, playerA, playerAInput);
				if (playerACountered) {
					continue;
				}

				const playerBCountered = this.tryApplyCounterHit(players, playerA, playerB, playerBInput);
				if (playerBCountered) {
					continue;
				}

				const playerAHitPlayerIds = playerA.hitPlayerIds ?? new Set<string>();
				const playerBHitPlayerIds = playerB.hitPlayerIds ?? new Set<string>();

				const playerAGrabConnected = this.tryApplyGrabConnect(
					players,
					playerA.id,
					playerB.id,
					playerBInput,
				);
				if (playerAGrabConnected) {
					continue;
				}

				const playerBGrabConnected = this.tryApplyGrabConnect(
					players,
					playerB.id,
					playerA.id,
					playerAInput,
				);
				if (playerBGrabConnected) {
					continue;
				}

				if (!this.canInteract(playerA) || !this.canInteract(playerB)) {
					continue;
				}

				let hitOnA = NO_HIT;
				let hitOnB = NO_HIT;
				const playerAAlreadyHitByB =
					!playerA.id || playerBHitPlayerIds.has(playerA.id);
				const playerBAlreadyHitByA =
					!playerB.id || playerAHitPlayerIds.has(playerB.id);

				// When both players have active hitboxes we run trade resolution first.
				// resolveHitTrade uses hitbox priority to determine whether both hits land,
				// only one, or neither. The direct collision results are used as fallback
				// for whichever side the trade ruled out.
					if (playerA.activeHitbox && playerB.activeHitbox) {
						const [tradeA, tradeB] = resolveHitTrade(
							playerA,
							playerB,
							playerAInput,
							playerBInput,
						);
						const directA = playerAAlreadyHitByB
							? NO_HIT
							: checkHitboxCollision(playerB, playerA, playerAInput);
						const directB = playerBAlreadyHitByA
							? NO_HIT
							: checkHitboxCollision(playerA, playerB, playerBInput);
						hitOnA = playerAAlreadyHitByB ? NO_HIT : tradeA.hit ? tradeA : directA;
						hitOnB = playerBAlreadyHitByA ? NO_HIT : tradeB.hit ? tradeB : directB;
					} else {
						hitOnA = playerAAlreadyHitByB
							? NO_HIT
							: checkHitboxCollision(playerB, playerA, playerAInput);
						hitOnB = playerBAlreadyHitByA
							? NO_HIT
							: checkHitboxCollision(playerA, playerB, playerBInput);
					}

				if (hitOnA.hit) {
					const updatedA = players[playerA.id];
					const updatedB = players[playerB.id];
					if (!updatedA || !updatedB) {
						continue;
					}

					const hitShieldOnA =
						(updatedA.state === PlayerStateEnum.SHIELD || updatedA.isShielding) &&
						updatedA.shieldHealth > 0;

					players[playerA.id] = this.applyHit(updatedA, hitOnA, updatedB.facing);
						const staleMoveId = updatedB.currentMoveId;
						const attackerAfterHit = this.consumeAttackOnHit(updatedB, hitOnA.hitlagFrames);
						const trackedHitIds = new Set(attackerAfterHit.hitPlayerIds);
						trackedHitIds.add(updatedA.id);
						if (hitShieldOnA) {
							const attackerPushback = hitOnA.damage * 0.1;
							players[playerB.id] = {
								...attackerAfterHit,
								hitPlayerIds: trackedHitIds,
								staleMoveQueue: this.pushStaleMoveToQueue(attackerAfterHit, staleMoveId),
								vx: attackerAfterHit.vx + -attackerPushback * updatedB.facing,
							};
						} else {
							players[playerB.id] = {
								...attackerAfterHit,
								hitPlayerIds: trackedHitIds,
								staleMoveQueue: this.pushStaleMoveToQueue(attackerAfterHit, staleMoveId),
							};
						}
					}

				if (hitOnB.hit) {
					const updatedA = players[playerA.id];
					const updatedB = players[playerB.id];
					if (!updatedA || !updatedB) {
						continue;
					}

					const hitShieldOnB =
						(updatedB.state === PlayerStateEnum.SHIELD || updatedB.isShielding) &&
						updatedB.shieldHealth > 0;

					players[playerB.id] = this.applyHit(updatedB, hitOnB, updatedA.facing);
						const staleMoveId = updatedA.currentMoveId;
						const attackerAfterHit = this.consumeAttackOnHit(updatedA, hitOnB.hitlagFrames);
						const trackedHitIds = new Set(attackerAfterHit.hitPlayerIds);
						trackedHitIds.add(updatedB.id);
						if (hitShieldOnB) {
							const attackerPushback = hitOnB.damage * 0.1;
							players[playerA.id] = {
								...attackerAfterHit,
								hitPlayerIds: trackedHitIds,
								staleMoveQueue: this.pushStaleMoveToQueue(attackerAfterHit, staleMoveId),
								vx: attackerAfterHit.vx + -attackerPushback * updatedA.facing,
							};
						} else {
							players[playerA.id] = {
								...attackerAfterHit,
								hitPlayerIds: trackedHitIds,
								staleMoveQueue: this.pushStaleMoveToQueue(attackerAfterHit, staleMoveId),
							};
						}
					}
			}
		}
	}

	private tryApplyGrabConnect(
		players: Record<PlayerId, PlayerState>,
		attackerId: PlayerId,
		victimId: PlayerId,
		victimInput: InputEvent | null,
	): boolean {
		const attacker = players[attackerId];
		const victim = players[victimId];

		if (!attacker || !victim) {
			return false;
		}

		if (attacker.currentMoveId !== MoveId.GRAB || !attacker.activeHitbox) {
			return false;
		}

		if (!this.canInteract(attacker) || !this.isGrabVictimEligible(victim)) {
			return false;
		}

		if (attacker.hitPlayerIds.has(victim.id)) {
			return false;
		}

		const hit = checkHitboxCollision(attacker, victim, victimInput);
		if (!hit.hit) {
			return false;
		}

		const trackedHitIds = new Set(attacker.hitPlayerIds);
		trackedHitIds.add(victim.id);

		players[attacker.id] = {
			...attacker,
			state: PlayerStateEnum.GRAB_HOLDING,
			stateFrame: 0,
			isGrabbing: true,
			grabbedPlayerId: victim.id,
			hitPlayerIds: trackedHitIds,
			activeHitbox: null,
			currentMoveId: null,
			currentMove: undefined,
			vx: 0,
			vy: 0,
		};

		players[victim.id] = {
			...victim,
			state: PlayerStateEnum.GRAB_HOLDING,
			stateFrame: 0,
			isGrabbing: true,
			x: attacker.x + PHYSICS.GRAB_OFFSET_X * attacker.facing,
			y: attacker.y,
			vx: 0,
			vy: 0,
			activeHitbox: null,
			currentMoveId: null,
			currentMove: undefined,
		};

		return true;
	}

	private isGrabVictimEligible(victim: PlayerState): boolean {
		return (
			this.canInteract(victim) &&
			victim.state !== PlayerStateEnum.GRAB_HOLDING &&
			!victim.isGrabbing
		);
	}

	private syncGrabState(players: Record<PlayerId, PlayerState>): void {
		for (const attacker of Object.values(players)) {
			if (!attacker.isGrabbing || !attacker.grabbedPlayerId) {
				continue;
			}

			const victim = players[attacker.grabbedPlayerId as PlayerId];
			if (!victim) {
				players[attacker.id] = {
					...attacker,
					isGrabbing: false,
					grabbedPlayerId: null,
				};
				continue;
			}

			const bothHolding =
				attacker.state === PlayerStateEnum.GRAB_HOLDING &&
				victim.state === PlayerStateEnum.GRAB_HOLDING;

			if (bothHolding) {
				players[victim.id] = {
					...victim,
					x: attacker.x + PHYSICS.GRAB_OFFSET_X * attacker.facing,
					y: attacker.y,
					vx: 0,
					vy: 0,
				};
				continue;
			}

			const bothIdle =
				attacker.state === PlayerStateEnum.IDLE &&
				victim.state === PlayerStateEnum.IDLE;

			if (!bothIdle) {
				continue;
			}

			players[attacker.id] = {
				...attacker,
				isGrabbing: false,
				grabbedPlayerId: null,
			};
			players[victim.id] = {
				...victim,
				isGrabbing: false,
			};
		}
	}

	private tryApplyCounterHit(
		players: Record<PlayerId, PlayerState>,
		attacker: PlayerState,
		defender: PlayerState,
		defenderInput: InputEvent | null,
	): boolean {
		if (defender.currentMoveId !== MoveId.DOWN_SPECIAL || defender.stateFrame >= 6) {
			return false;
		}

		const connectingHit = checkHitboxCollision(attacker, defender, defenderInput);
		if (!connectingHit.hit || !attacker.activeHitbox) {
			return false;
		}

		const currentAttacker = players[attacker.id];
		const currentDefender = players[defender.id];
		if (!currentAttacker || !currentDefender) {
			return false;
		}

		const counterDamage = Math.floor(connectingHit.damage * PHYSICS.COUNTER_DAMAGE_MULTIPLIER);
		const counterKnockbackMagnitude =
			calculateKnockback(
				currentAttacker.percent,
				counterDamage,
				attacker.activeHitbox.baseKnockback,
				attacker.activeHitbox.knockbackGrowth,
				PHYSICS.FIGHTER_WEIGHT,
			) * PHYSICS.COUNTER_KNOCKBACK_MULTIPLIER;
		const counterVelocity = knockbackAngleToVelocity(
			counterKnockbackMagnitude,
			PHYSICS.COUNTER_ANGLE_DEGREES,
			currentDefender.facing,
		);

		players[attacker.id] = this.applyHit(
			currentAttacker,
			{
				hit: true,
				damage: counterDamage,
				knockbackVx: counterVelocity.x,
				knockbackVy: counterVelocity.y,
				hitlagFrames: connectingHit.hitlagFrames,
				hitstunFrames: connectingHit.hitstunFrames,
			},
			currentDefender.facing,
		);

		return true;
	}

	private pushStaleMoveToQueue(
		player: PlayerState,
		moveId: PlayerState['currentMoveId'],
	): PlayerState['staleMoveQueue'] {
		const staleMoveQueue = player.staleMoveQueue ?? [];
		if (!moveId) {
			return [...staleMoveQueue];
		}

		const updatedQueue = [...staleMoveQueue, moveId];
		if (updatedQueue.length > 9) {
			updatedQueue.shift();
		}

		return updatedQueue;
	}

	private consumeAttackOnHit(player: PlayerState, hitlagFrames: number): PlayerState {
		return {
			...player,
			state: player.isGrounded ? PlayerStateEnum.IDLE : PlayerStateEnum.AIRBORNE,
			stateFrame: 0,
			hitlagFramesRemaining: Math.max(player.hitlagFramesRemaining, hitlagFrames),
			sdiInputCooldown: 0,
			activeHitbox: null,
			currentMoveId: null,
			currentMove: undefined,
			landingLagFrames: 0,
			chargeFrames: 0,
		};
	}

	private applyHit(
		player: PlayerState,
		hit: typeof NO_HIT,
		attackerFacing: 1 | -1,
	): PlayerState {
		if ((player.state === PlayerStateEnum.SHIELD || player.isShielding) && player.shieldHealth > 0) {
			const shieldStunFrames = Math.floor(hit.damage * 0.8) + 2;
			const remainingShieldHealth = player.shieldHealth - hit.damage;

			// Perfect shield (powershield): if hit lands within PERFECT_SHIELD_WINDOW_FRAMES of shield raise,
			// skip shield stun and shield health drain
			const isPerfectShield = player.stateFrame < PHYSICS.PERFECT_SHIELD_WINDOW_FRAMES;

			if (remainingShieldHealth <= 0) {
				return this.applyShieldBreak(player);
			}

			const pushStrength = hit.damage * 0.3;

			return {
				...player,
				shieldHealth: isPerfectShield ? player.shieldHealth : remainingShieldHealth,
				shieldStunFrames: isPerfectShield ? 0 : shieldStunFrames,
				vx: player.vx + pushStrength * attackerFacing,
				hitlagFramesRemaining: Math.max(player.hitlagFramesRemaining, hit.hitlagFrames),
				activeHitbox: null,
				currentMoveId: null,
				currentMove: undefined,
				landingLagFrames: 0,
				chargeFrames: 0,
			};
		}

		if (player.ledgeId) {
			this.releaseLedge(player.id, player.ledgeId);
		}

		const knockbackMagnitude = Math.hypot(hit.knockbackVx, hit.knockbackVy);
		const knockbackAngleRadians =
			((Math.atan2(-hit.knockbackVy, hit.knockbackVx) % (Math.PI * 2)) + Math.PI * 2) %
			(Math.PI * 2);

		return {
			...player,
			percent: player.percent + hit.damage,
			vx: hit.knockbackVx,
			vy: hit.knockbackVy,
			hitlagFramesRemaining: hit.hitlagFrames,
			hitstunFramesRemaining: hit.hitstunFrames,
			isTumbling: knockbackMagnitude > PHYSICS.TUMBLE_THRESHOLD,
			techWindowFrames: 0,
			state: PlayerStateEnum.HITSTUN,
			stateFrame: 0,
			ledgeId: null,
			isGrounded: false,
			activeHitbox: null,
			currentMoveId: null,
			currentMove: undefined,
				landingLagFrames: 0,
				sdiInputCooldown: 0,
				chargeFrames: 0,
				asdiDriftAccumulated: 0,
				shieldStunFrames: 0,
			lastHitByFacing: attackerFacing,
			lastHitKnockbackAngle: knockbackAngleRadians,
			pendingKnockbackVx: hit.knockbackVx,
			pendingKnockbackVy: hit.knockbackVy,
		};
	}

	private applyShieldBreak(player: PlayerState): PlayerState {
		return {
			...player,
			state: PlayerStateEnum.HITSTUN,
			stateFrame: 0,
			hitlagFramesRemaining: 0,
			hitstunFramesRemaining: PHYSICS.SHIELD_BREAK_STUN_FRAMES,
			isShielding: false,
			shieldHealth: 0,
			vx: 0,
			vy: -8,
			isGrounded: false,
			isTumbling: false,
			techWindowFrames: 0,
			techLockoutFrames: 0,
				landingLagFrames: 0,
				sdiInputCooldown: 0,
				asdiDriftAccumulated: 0,
				activeHitbox: null,
			currentMoveId: null,
			currentMove: undefined,
			hitPlayerIds: new Set<string>(),
			chargeFrames: 0,
			shieldStunFrames: 0,
			lastHitKnockbackAngle: null,
			pendingKnockbackVx: null,
			pendingKnockbackVy: null,
		};
	}

	private canInteract(player: PlayerState): boolean {
		return (
			player.stocks > 0 &&
			player.respawnTimer <= 0 &&
			!player.isKnockedOut &&
			!player.isInvincible &&
			player.hitlagFramesRemaining <= 0
		);
	}

	private applyKnockouts(players: Record<PlayerId, PlayerState>): void {
		for (const [playerId, player] of Object.entries(players)) {
			if (!player.isKnockedOut) {
				continue;
			}

			if (player.ledgeId) {
				this.releaseLedge(player.id, player.ledgeId);
			}

			const remainingStocks = Math.max(0, player.stocks - 1);
			if (remainingStocks === 0) {
				this.techAttemptBuffered.set(playerId as PlayerId, false);
				players[playerId as PlayerId] = {
					...player,
					stocks: 0,
					percent: 0,
					vx: 0,
					vy: 0,
					isFastFalling: false,
					activeHitbox: null,
					currentMoveId: null,
					currentMove: undefined,
					landingLagFrames: 0,
					sdiInputCooldown: 0,
					lastHitKnockbackAngle: null,
				shieldStunFrames: 0,
			};
				continue;
			}

			const spawn = STAGE.SPAWN_POSITIONS[player.slotIndex] ?? DEFAULT_SPAWN;
			players[playerId as PlayerId] = {
				...player,
				stocks: remainingStocks,
				x: spawn.x,
				y: MATCH_CONFIG.RESPAWN_PLATFORM_Y,
				vx: 0,
				vy: 0,
				percent: 0,
				state: PlayerStateEnum.AIRBORNE,
				stateFrame: 0,
				hitlagFramesRemaining: 0,
				hitstunFramesRemaining: 0,
				isTumbling: false,
				techWindowFrames: 0,
				techLockoutFrames: 0,
					landingLagFrames: 0,
					sdiInputCooldown: 0,
					isGrounded: false,
					isKnockedOut: false,
					lastHitByFacing: null,
					lastHitKnockbackAngle: null,
					pendingKnockbackVx: null,
					pendingKnockbackVy: null,
					hasDoubleJump: true,
				isFastFalling: false,
				isInvincible: true,
				invincibilityFrames: MATCH_CONFIG.RESPAWN_INVINCIBILITY_FRAMES,
				activeHitbox: null,
			currentMoveId: null,
			currentMove: undefined,
			chargeFrames: 0,
			asdiDriftAccumulated: 0,
			shieldStunFrames: 0,
				respawnTimer: MATCH_CONFIG.RESPAWN_DELAY_FRAMES,
			};
			this.techAttemptBuffered.set(playerId as PlayerId, false);
			// Reset the FSMController on respawn — the old controller may be mid-animation
			// (e.g. HITSTUN with frames remaining). A fresh controller in AIRBORNE state
			// matches the respawning fighter's physical situation (falling from above stage).
			this.fsmControllers.set(
				playerId as PlayerId,
				new FSMController(PlayerStateEnum.AIRBORNE),
			);
		}
	}
}
