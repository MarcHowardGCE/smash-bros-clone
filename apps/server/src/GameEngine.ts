/**
 * @fileoverview Authoritative server-side game engine for Everybody Throws Hands.
 *
 * `GameEngine` is the single source of truth for all match simulation. Every tick it
 * runs the full pipeline in order:
 *
 * 1. Clone player state (immutable-style update)
 * 2. Tech-frame counter bookkeeping
 * 3. Ledge-grab detection and ledge-trump resolution
 * 4. FSM tick via `FSMController` (state transitions, hitlag freeze)
 * 5. One-time physics side effects for FSM transitions (`applyStateTransitions`)
 * 6. Directional-influence application on hitlag end
 * 7. Landing-lag counter decrement
 * 8. Full physics pipeline: gravity, movement, fast fall, wall jump, platform collision
 * 9. Facing update
 * 10. Invincibility frame countdown
 * 11. Hitbox activation (`withHitboxState`)
 * 12. Shield drain / regen
 * 13. Hit detection across all player pairs (`applyHitDetection`)
 * 14. Grab-state synchronisation
 * 15. Knockout detection and respawn scheduling (`applyKnockouts`)
 * 16. Ledge-cooldown tick
 * 17. Win-condition check
 *
 * The engine is intentionally free of I/O. Callers (e.g. `MatchSession`) drive the
 * tick loop and own network transport; `GameEngine` only reads `InputEvent` maps and
 * returns a new `GameState`.
 *
 * ## Determinism contract
 *
 * All arithmetic uses standard IEEE 754 double-precision floats. The engine produces
 * identical output for the same input sequence across all V8 runtime versions. Use
 * `getStateHash()` to detect divergence between server and client simulations.
 */
import {
	applyFastFall,
	applyGravity,
	applyDI,
	applyMovement,
	checkHitboxCollision,
	checkLedgeGrab,
	checkPlatformCollision,
	checkWallCollision,
	DEFAULT_STAGE,
	FSMController,
	getMoveData,
	getMoveDataForCharacter,
	NO_HIT,
	resolveHit,
	resolveHitTrade,
	type StageData,
	startJump,
	calculateKnockback,
} from "@smash/engine";
import {
	knockbackAngleToVelocity,
	type CharacterId,
	type GameState,
	INPUT_BITS,
	type InputEvent,
	type KOEventData,
	MATCH_CONFIG,
	MoveId,
	PHYSICS,
	SMASH_CHARGE_MAX_FRAMES,
	type HitEventData,
	type PlayerId,
	type PlayerState,
	PlayerStateEnum,
	STAGE,
	type StateSnapshot,
} from "@smash/shared";

/** Default spawn position used when the stage config has no entry for a given slot index. */
const DEFAULT_SPAWN = { x: 640, y: MATCH_CONFIG.RESPAWN_PLATFORM_Y };
/**
 * Synthetic `InputEvent` used when no real input has arrived for a player (network lag
 * or disconnect). Physics functions require a non-null `InputEvent` to read bit-fields;
 * zeroed bits cause the player to coast to a stop with no movement applied.
 */
const EMPTY_INPUT: InputEvent = {
	tick: -1,
	seq: -1,
	playerId: "__server__",
	held: 0,
	pressed: 0,
	released: 0,
};

/**
 * Type guard that narrows `currentMoveId` to one of the four throw move IDs.
 *
 * Used inside `tryApplyThrowHit` to confirm the attacker is currently executing a throw
 * before attempting guaranteed-overlap hit resolution.
 *
 * @param playerMoveId - The `currentMoveId` field from a `PlayerState`.
 * @returns `true` when the move is FORWARD_THROW, BACK_THROW, UP_THROW, or DOWN_THROW.
 */
function isThrowMoveId(playerMoveId: PlayerState['currentMoveId']): playerMoveId is
	| MoveId.FORWARD_THROW
	| MoveId.BACK_THROW
	| MoveId.UP_THROW
	| MoveId.DOWN_THROW {
	return (
		playerMoveId === MoveId.FORWARD_THROW ||
		playerMoveId === MoveId.BACK_THROW ||
		playerMoveId === MoveId.UP_THROW ||
		playerMoveId === MoveId.DOWN_THROW
	);
}

/**
 * Creates a shallow clone of `player` with deep copies of the fields that are
 * mutated in place (`activeHitbox`, `hitPlayerIds`, `staleMoveQueue`).
 *
 * Every per-tick update starts with a clone so mutations never alias the
 * previous-frame state stored on `this.state`.
 *
 * @param player - The source `PlayerState` to clone.
 * @returns A new `PlayerState` that is structurally equal but shares no mutable references.
 */
function clonePlayer(player: PlayerState): PlayerState {
	return {
		...player,
		activeHitbox: player.activeHitbox ? { ...player.activeHitbox } : null,
		hitPlayerIds: new Set(player.hitPlayerIds),
		staleMoveQueue: [...(player.staleMoveQueue ?? [])],
	};
}

/**
 * Returns `true` when the given input bit is currently held down.
 *
 * @param input - The `InputEvent` for this tick, or `null` if no input arrived.
 * @param bit - An `INPUT_BITS` bitmask constant.
 */
function isHeld(input: InputEvent | null, bit: number): boolean {
	return Boolean((input?.held ?? 0) & bit);
}

/**
 * Returns `true` when the given input bit was newly pressed this tick (edge trigger).
 *
 * @param input - The `InputEvent` for this tick, or `null` if no input arrived.
 * @param bit - An `INPUT_BITS` bitmask constant.
 */
function isPressed(input: InputEvent | null, bit: number): boolean {
	return Boolean((input?.pressed ?? 0) & bit);
}

/**
 * Returns `true` when `state` is one of the ledge-locked states that freeze
 * normal physics (LEDGE_HANG, LEDGE_CLIMB, LEDGE_ATTACK, LEDGE_ROLL, LEDGE_JUMP).
 *
 * Physics is skipped entirely for players in these states; the engine instead
 * snaps them to ledge coordinates each tick via `snapPlayerToLedge`.
 *
 * @param state - A `PlayerStateEnum` string value.
 */
function isLedgeLockedState(state: string): boolean {
	return [
		PlayerStateEnum.LEDGE_HANG,
		PlayerStateEnum.LEDGE_CLIMB,
		PlayerStateEnum.LEDGE_ATTACK,
		PlayerStateEnum.LEDGE_ROLL,
		PlayerStateEnum.LEDGE_JUMP,
	].includes(state as PlayerStateEnum);
}

/**
 * Computes the wall-jump velocity components for a player jumping off a wall.
 *
 * The horizontal and vertical speeds decay with each successive wall jump in the
 * same airborne phase via `wallJumpStreak`, clamped at `WALL_JUMP_MIN_VELOCITY_MULTIPLIER`.
 *
 * @param player - Current player state (reads `wallJumpStreak`).
 * @param wall - Which wall the player is touching (`"left"` or `"right"`).
 * @returns New `vx`, `vy`, and incremented `wallJumpStreak` to spread onto the player.
 */
function applyWallJumpVelocity(
	player: PlayerState,
	wall: "left" | "right",
): { vx: number; vy: number; wallJumpStreak: number } {
	const decayMultiplier = Math.max(
		PHYSICS.WALL_JUMP_MIN_VELOCITY_MULTIPLIER,
		Math.pow(PHYSICS.WALL_JUMP_HEIGHT_DECAY, player.wallJumpStreak),
	);
	const vx =
		PHYSICS.WALL_JUMP_HORIZONTAL_VELOCITY *
		(wall === "left" ? 1 : -1) *
		decayMultiplier;
	const vy = PHYSICS.WALL_JUMP_VERTICAL_VELOCITY * decayMultiplier;
	const wallJumpStreak = player.wallJumpStreak + 1;
	return { vx, vy, wallJumpStreak };
}

/**
 * Construction options for `GameEngine`.
 *
 * @property playerIds - Ordered list of player IDs joining the match. Slot index
 *   (spawn position, facing direction) is derived from position in this array.
 * @property characterIds - Optional map from `PlayerId` to `CharacterId`. Players
 *   not listed default to `"all-rounder"`.
 */
export interface GameEngineOptions {
	playerIds: PlayerId[];
	characterIds?: Partial<Record<PlayerId, CharacterId>>;
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
	private readonly hitEvents: HitEventData[] = [];
	private readonly koEvents: KOEventData[] = [];
	private readonly fsmControllers = new Map<PlayerId, FSMController>();
	private readonly techAttemptBuffered = new Map<PlayerId, boolean>();
	private ledgeState: Map<
		string,
		{ occupantId: string | null; cooldowns: Map<string, number> }
	>;
	private tick = 0;

	/**
	 * Initialises the engine from a set of player IDs and optional character
	 * assignments.
	 *
	 * Spawns each fighter at the stage-configured spawn position for their slot
	 * index (falling back to `DEFAULT_SPAWN`), creates an `FSMController` per
	 * player, and seeds `ledgeState` from the stage ledge definitions.
	 *
	 * @param options - Player IDs and optional per-player character IDs.
	 */
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
				lCancelWindowFrames: 0,
				landingLagFrames: 0,
				percent: 0,
				stocks: MATCH_CONFIG.STOCKS,
			isGrounded: false,
			isKnockedOut: false,
			hasDoubleJump: true,
			hasAirDodge: true,
			wallJumpStreak: 0,
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
				airDodgeDirection: null,
				characterId: options.characterIds?.[id] ?? 'all-rounder',
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

	/**
	 * Advances the simulation by one tick and returns the new authoritative `GameState`.
	 *
	 * Runs the full per-frame pipeline for every player: FSM tick, physics, hitbox
	 * state, hit detection, grab sync, knockout processing, and win-condition check.
	 * If a winner is already set the method is a no-op and returns the current state.
	 *
	 * @param inputs - Map from `PlayerId` to the input received this tick, or `null`
	 *   when no input arrived (e.g. network lag). Missing players receive `EMPTY_INPUT`.
	 * @returns The fully updated `GameState` after this tick.
	 */
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
			alivePlayers.length === 1 && Object.values(players).length > 1 ? (alivePlayers[0]?.id ?? null) : null;

		this.state = {
			tick: this.tick,
			players,
			matchPhase: winnerId ? "result" : "match",
			winnerId,
			ledges: ledgesSnapshot,
		};

		return this.state;
	}

	/**
	 * Builds a `StateSnapshot` suitable for broadcasting to clients.
	 *
	 * Includes the current tick, a wall-clock timestamp, the last confirmed input
	 * sequence per player, all player states, match phase, winner, ledge occupancy,
	 * and any pending hit events.
	 *
	 * @param timestamp - Wall-clock millisecond timestamp to embed in the snapshot
	 *   (used by clients to measure round-trip latency).
	 * @param lastConfirmedSeq - Map of the highest input sequence number the server
	 *   has processed for each player (used for client-side reconciliation).
	 * @returns A complete `StateSnapshot` ready for msgpack encoding and broadcast.
	 */
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
			hitEvents: [...this.hitEvents],
		};
	}

	/**
	 * Drains the internal hit-event buffer.
	 *
	 * Called by `MatchSession` after each snapshot broadcast so that hit events are
	 * not re-sent in subsequent snapshots. Hit events accumulate inside
	 * `applyHitDetection` and are flushed here rather than inside `tickGame` so the
	 * caller can include them in the outgoing snapshot before clearing.
	 */
	clearHitEvents(): void {
		this.hitEvents.length = 0;
	}

	/**
	 * Returns and clears all pending KO events accumulated since the last call.
	 *
	 * Each entry describes a player that crossed a blast zone this tick, including
	 * which boundary they exited through. `MatchSession` consumes these to trigger
	 * client-side KO effects and stock-loss UI.
	 *
	 * @returns Array of `KOEventData` objects, empty when no knockouts occurred.
	 */
	getKOEvents(): KOEventData[] {
		if (this.koEvents.length === 0) {
			return [];
		}

		const events = [...this.koEvents];
		this.koEvents.length = 0;
		return events;
	}

	/**
	 * Teleports a player to an arbitrary world position and resets their combat state.
	 *
	 * Used by `MatchSession` to place respawning fighters at their designated spawn
	 * point after the respawn timer expires. Resets velocity, hitlag, hitstun,
	 * grab state, ledge state, and charge frames, then creates a fresh `FSMController`
	 * so no stale animation state carries over from the KO sequence.
	 *
	 * @param playerId - The ID of the player to reposition.
	 * @param x - Target world x coordinate.
	 * @param y - Target world y coordinate.
	 * @returns `true` if the player was found and repositioned; `false` if the ID
	 *   does not exist in the current state.
	 */
	forcePosition(playerId: PlayerId, x: number, y: number): boolean {
		const player = this.state.players[playerId];
		if (!player) {
			return false;
		}

		this.state.players[playerId] = {
			...player,
			x,
			y,
			vx: 0,
			vy: 0,
			isGrounded: false,
			isFastFalling: false,
			isKnockedOut: false,
			state: PlayerStateEnum.AIRBORNE,
			stateFrame: 0,
			hitlagFramesRemaining: 0,
			hitstunFramesRemaining: 0,
			isTumbling: false,
			techWindowFrames: 0,
			techLockoutFrames: 0,
			lCancelWindowFrames: 0,
			landingLagFrames: 0,
			activeHitbox: null,
			currentMoveId: null,
			currentMove: undefined,
			chargeFrames: 0,
			isGrabbing: false,
			grabbedPlayerId: null,
			airDodgeDirection: null,
			ledgeId: null,
		};

		this.techAttemptBuffered.set(playerId, false);
		this.fsmControllers.set(playerId, new FSMController(PlayerStateEnum.AIRBORNE));

		return true;
	}

	/**
	 * Returns `true` when the match has a winner and the simulation is over.
	 *
	 * Once this returns `true`, `tickGame` becomes a no-op.
	 */
	isMatchOver(): boolean {
		return this.state.winnerId !== null;
	}

	/**
	 * Returns the `PlayerId` of the match winner, or `null` if the match is still in progress.
	 */
	getWinnerId(): PlayerId | null {
		return this.state.winnerId;
	}

	/**
	 * Returns the current simulation tick counter.
	 *
	 * Increments by 1 every `tickGame` call. Used by `MatchSession` and clients
	 * to correlate snapshots with input sequence numbers.
	 */
	getCurrentTick(): number {
		return this.tick;
	}

	/**
	 * Produces a compact determinism fingerprint for the current game state.
	 *
	 * Rounded integer values eliminate false-positive mismatches caused by
	 * floating-point arithmetic differences between JS engine runs or execution
	 * order. Server and client both log this hash at the same tick; a mismatch
	 * means the simulations have diverged.
	 *
	 * @returns A pipe-delimited string encoding slot index, position, velocity,
	 *   percent, stocks, and FSM state for every player, sorted by slot index.
	 */
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

	/**
	 * Runs the full per-player update pipeline for one tick.
	 *
	 * Order of operations:
	 * 1. Sanitise `chargeFrames` (NaN guard).
	 * 2. Decrement tech/L-cancel window counters.
	 * 3. Early-exit for eliminated players (stocks = 0) and respawning players.
	 * 4. Ledge-grab detection and ledge-trump resolution.
	 * 5. FSM tick via `FSMController`.
	 * 6. One-time physics side effects for FSM transitions.
	 * 7. DI application on hitlag end.
	 * 8. Landing-lag counter decrement.
	 * 9. Hitlag freeze early-exit (hitbox state applied, physics skipped).
	 * 10. Full physics pipeline.
	 * 11. Facing update.
	 * 12. Invincibility countdown.
	 * 13. Hitbox activation.
	 * 14. Shield drain/regen and shield-break check.
	 * 15. Tech-attempt buffer clear when not tumbling.
	 *
	 * @param playerId - ID of the player being updated.
	 * @param current - Player state at the start of this tick (will be cloned).
	 * @param input - Input received this tick, or `null`.
	 * @param players - Mutable map of all players; ledge-trump code may modify
	 *   the displaced occupant's state in place.
	 * @returns The fully updated `PlayerState` for `playerId`.
	 */
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
				lCancelWindowFrames: 0,
				landingLagFrames: 0,
				lastHitByFacing: null,
				lastHitKnockbackAngle: null,
				pendingKnockbackVx: null,
				pendingKnockbackVy: null,
				vx: 0,
				vy: 0,
			};
		}

		// Capture state BEFORE ledge grab and other state changes
		const beforeTick = clonePlayer(player);
		const hadDoubleJumpBeforeTick = player.hasDoubleJump;

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

		let nextPlayer = controller.tick(player, input);
		nextPlayer = this.applyStateTransitions(beforeTick, nextPlayer, input);
		nextPlayer = this.applyDirectionalInfluenceOnHitlagEnd(player, nextPlayer, input);
		nextPlayer = this.tickLandingLagCounter(nextPlayer);
		const gainedInvincibilityThisTick =
			!beforeTick.isInvincible &&
			nextPlayer.isInvincible &&
			nextPlayer.invincibilityFrames > beforeTick.invincibilityFrames;
		const droppedFromLedgeThisTick =
			beforeTick.state === PlayerStateEnum.LEDGE_HANG &&
			nextPlayer.state === PlayerStateEnum.AIRBORNE &&
			isPressed(input, INPUT_BITS.DOWN);

		if (nextPlayer.hitlagFramesRemaining > 0) {
			return this.withHitboxState(nextPlayer, input);
		}

		const beforePhysics = clonePlayer(nextPlayer);
		nextPlayer = this.applyPhysicsToPlayer(
			playerId,
			nextPlayer,
			input,
			hadDoubleJumpBeforeTick,
			droppedFromLedgeThisTick,
		);
		const gainedInvincibilityFromWallJump =
			!beforePhysics.isInvincible &&
			nextPlayer.isInvincible &&
			nextPlayer.invincibilityFrames > beforePhysics.invincibilityFrames;
		nextPlayer = this.applyFacing(nextPlayer, input);
		if (!gainedInvincibilityThisTick && !gainedInvincibilityFromWallJump) {
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

	/**
	 * Decrements per-player tech-window, tech-lockout, and L-cancel window counters
	 * at the start of each tick, and opens new windows when the relevant inputs fire.
	 *
	 * - **Tech window**: opened when SHIELD is pressed while airborne and tumbling
	 *   with no active lockout. The buffered attempt is recorded so `resolveTumbleLanding`
	 *   can check it on the landing frame.
	 * - **L-cancel window**: opened when SHIELD is pressed during AIR_ATTACK state.
	 *   If active on the landing frame, landing lag is halved.
	 *
	 * @param playerId - ID of the player (used to write the tech-attempt buffer).
	 * @param player - Player state entering this tick.
	 * @param input - Input received this tick, or `null`.
	 * @returns Updated player with decremented counters and any newly opened windows.
	 */
	private updateTechFrameCounters(
		playerId: PlayerId,
		player: PlayerState,
		input: InputEvent | null,
	): PlayerState {
		let nextPlayer: PlayerState = {
			...player,
			techWindowFrames: Math.max(0, player.techWindowFrames - 1),
			techLockoutFrames: Math.max(0, player.techLockoutFrames - 1),
			lCancelWindowFrames: Math.max(0, player.lCancelWindowFrames - 1),
		};

		const shouldStartTechWindow =
			isPressed(input, INPUT_BITS.SHIELD) &&
			!nextPlayer.isGrounded &&
			nextPlayer.isTumbling &&
			nextPlayer.techLockoutFrames === 0;

		if (!shouldStartTechWindow) {
			// Check for L-cancel window: shield pressed during AIR_ATTACK
			const shouldStartLCancelWindow =
				isPressed(input, INPUT_BITS.SHIELD) &&
				nextPlayer.state === PlayerStateEnum.AIR_ATTACK;

			if (shouldStartLCancelWindow) {
				nextPlayer = {
					...nextPlayer,
					lCancelWindowFrames: PHYSICS.L_CANCEL_WINDOW_FRAMES,
				};
			}

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
			player.state === PlayerStateEnum.AIR_DODGE &&
			previous.state !== PlayerStateEnum.AIR_DODGE
		) {
			nextPlayer = {
				...nextPlayer,
				hasAirDodge: false,
			};
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
		const moveData = getMoveDataForCharacter(player.characterId, moveId);
		nextPlayer = {
			...nextPlayer,
			currentMoveId: moveId,
			currentMove: {
				landingLag: moveData.landingLag,
				isSpecial: moveData.isSpecial,
			},
			hitPlayerIds: new Set<string>(),
			chargeFrames: 0,
		};
		}

		if (
			previous.state === PlayerStateEnum.ATTACK &&
			player.state === PlayerStateEnum.IDLE &&
			previous.currentMoveId === MoveId.PUMMEL &&
			previous.isGrabbing
		) {
			nextPlayer = {
				...nextPlayer,
				state: PlayerStateEnum.GRAB_HOLDING,
				stateFrame: 0,
				currentMoveId: null,
				currentMove: undefined,
				hitPlayerIds: new Set<string>(),
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

		if (![PlayerStateEnum.ATTACK, PlayerStateEnum.AIR_ATTACK, PlayerStateEnum.LEDGE_ATTACK, PlayerStateEnum.GRAB_HOLDING].includes(
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

	/**
	 * Applies the full physics pipeline to one player for a single tick.
	 *
	 * Dispatches to different physics paths depending on player state:
	 * - **Ledge-locked states**: physics skipped entirely (position managed by ledge snap).
	 * - **JUMPSQUAT**: only ground friction applied to vx; no movement.
	 * - **Hitstun**: gravity + platform collision only (no player-controlled movement).
	 * - **Most other states**: full `applyMovementPipeline` (gravity, fast fall, wall
	 *   jump, movement, platform collision).
	 * - **SHIELD / ROLL / SPOT_DODGE / TECH_* / HARD_LANDING / LANDING_LAG**: physics
	 *   skipped (handled by FSM).
	 *
	 * Also resolves landing events: tumble landings, aerial-attack landing lag,
	 * wavedash landings, wall techs, and missed-tech lockout.
	 *
	 * @param playerId - ID of the player (used for tech-attempt buffer writes).
	 * @param player - Player state before physics this tick.
	 * @param input - Input received this tick, or `null`.
	 * @param hadDoubleJumpBeforePhysics - Whether the player had a double jump
	 *   available at the start of this tick (before the FSM may have consumed it).
	 * @param preventImmediateFastFall - When `true`, skips fast-fall processing;
	 *   used on the tick a player drops from a ledge so they don't instantly fast-fall.
	 * @returns Updated `PlayerState` after physics resolution.
	 */
	private applyPhysicsToPlayer(
		playerId: PlayerId,
		player: PlayerState,
		input: InputEvent | null,
		hadDoubleJumpBeforePhysics: boolean,
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
				: this.applyMovementPipeline(
						nextPlayer,
						effectiveInput,
						hadDoubleJumpBeforePhysics,
				  );
		}

		// Apply friction to grounded players in LANDING_LAG state (wavedash slide decay)
		if (nextPlayer.state === PlayerStateEnum.LANDING_LAG && nextPlayer.isGrounded) {
			const movingLeft = isHeld(effectiveInput, INPUT_BITS.LEFT);
			const movingRight = isHeld(effectiveInput, INPUT_BITS.RIGHT);
			if (!movingLeft && !movingRight) {
				nextPlayer = {
					...nextPlayer,
					vx: nextPlayer.vx * PHYSICS.GROUND_FRICTION,
				};
			}
		}

		const landedThisTick = !player.isGrounded && nextPlayer.isGrounded;
		if (landedThisTick && player.isTumbling) {
			nextPlayer = this.resolveTumbleLanding(playerId, nextPlayer, effectiveInput);
		}

		const shouldCheckWallTech = player.isTumbling || player.hitstunFramesRemaining > 0;
		if (shouldCheckWallTech) {
			const wallSide = checkWallCollision(nextPlayer, DEFAULT_STAGE);
			if (wallSide && nextPlayer.techWindowFrames > 0) {
				this.techAttemptBuffered.set(playerId, false);
				
				// Check if JUMP is held during tech window
				const jumpHeld = isHeld(effectiveInput, INPUT_BITS.JUMP);
				
			if (jumpHeld) {
				// Apply wall-jump velocity but keep wall-tech invincibility
				const { vx, vy, wallJumpStreak } = applyWallJumpVelocity(
					nextPlayer,
					wallSide,
				);
				nextPlayer = {
					...nextPlayer,
					vx,
					vy,
					state: PlayerStateEnum.AIRBORNE,
					stateFrame: 0,
					hitstunFramesRemaining: 0,
					isTumbling: false,
					isInvincible: true,
					invincibilityFrames: PHYSICS.WALL_TECH_INTANGIBILITY_FRAMES,
					techWindowFrames: 0,
					wallJumpStreak,
					hasDoubleJump: hadDoubleJumpBeforePhysics
						? true
						: nextPlayer.hasDoubleJump,
				};
				} else {
					// Plain wall-tech: cancel momentum
					nextPlayer = {
						...nextPlayer,
						vx: 0,
						state: PlayerStateEnum.AIRBORNE,
						stateFrame: 0,
						hitstunFramesRemaining: 0,
						isTumbling: false,
						isInvincible: true,
						invincibilityFrames: PHYSICS.WALL_TECH_INTANGIBILITY_FRAMES,
						techWindowFrames: 0,
					};
				}
			} else if (wallSide && nextPlayer.techWindowFrames === 0) {
				// Missed wall tech: wall contact during tumble/hitstun but no buffered tech
				// Apply tech lockout penalty (same as missed ground tech)
				this.techAttemptBuffered.set(playerId, false);
				nextPlayer = {
					...nextPlayer,
					techLockoutFrames: PHYSICS.TECH_LOCKOUT_FRAMES,
				};
			}
		}

		if (landedThisTick && player.state === PlayerStateEnum.AIR_ATTACK) {
			const rawLag = player.currentMove?.landingLag ?? 0;
			const landingLagFrames = (!player.currentMove?.isSpecial && player.lCancelWindowFrames > 0) ? Math.floor(rawLag / 2) : rawLag;
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

		// Wavedash landing: AIR_DODGE with downward + horizontal component
		// Only apply if player hasn't already been processed by resolveTumbleLanding
		if (
			landedThisTick &&
			player.state === PlayerStateEnum.AIR_DODGE &&
			player.airDodgeDirection &&
			player.airDodgeDirection.y > 0 &&
			player.airDodgeDirection.x !== 0
		) {
			nextPlayer = {
				...nextPlayer,
				vx: PHYSICS.WAVEDASH_INITIAL_SLIDE_VELOCITY * Math.sign(player.airDodgeDirection.x),
				state: PlayerStateEnum.LANDING_LAG,
				stateFrame: 0,
				landingLagFrames: PHYSICS.WAVEDASH_LANDING_LAG_FRAMES,
				sdiInputCooldown: 0,
			};
		} else if (
			landedThisTick &&
			player.state === PlayerStateEnum.AIR_DODGE &&
			!player.isTumbling
		) {
			// Default AIR_DODGE landing (neutral or non-wavedash): transition to IDLE
			// Only apply if player is not tumbling (tumbling players are handled by resolveTumbleLanding)
			nextPlayer = {
				...nextPlayer,
				state: PlayerStateEnum.IDLE,
				stateFrame: 0,
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

	/**
	 * Decrements `landingLagFrames` by one each tick while the player is in
	 * LANDING_LAG state. Clears the counter immediately when the player leaves
	 * LANDING_LAG so stale values never carry over into other states.
	 *
	 * @param player - Player state entering this tick.
	 * @returns Updated player with `landingLagFrames` adjusted.
	 */
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

	/**
	 * Runs the standard per-tick movement stack: fast fall, gravity, lateral movement,
	 * platform collision, and wall-jump detection.
	 *
	 * Handles two special cases before delegating to the engine helpers:
	 * - **Drop-through**: when DOWN is held, soft platforms are removed from the stage
	 *   so `checkPlatformCollision` finds nothing to land on and the fighter falls
	 *   through. The main floor is unaffected.
	 * - **Wall jump**: when the player is airborne, touching a wall, and presses JUMP
	 *   while holding the away direction, `applyWallJumpVelocity` fires and grants
	 *   brief invincibility.
	 *
	 * @param player - Player state before movement this tick.
	 * @param input - Non-null input (callers substitute `EMPTY_INPUT` when `null`).
	 * @param hadDoubleJumpBeforePhysics - Whether the double jump was available at
	 *   tick start; restored after a wall jump so the aerial option is not consumed.
	 * @returns Updated `PlayerState` after movement and collision resolution.
	 */
	private applyMovementPipeline(
		player: PlayerState,
		input: InputEvent,
		hadDoubleJumpBeforePhysics: boolean,
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
		const wall = checkWallCollision(player, stage);
		const jumpPressed = isPressed(input, INPUT_BITS.JUMP);
		const awayDirectionHeld =
			wall === "left"
				? isHeld(input, INPUT_BITS.RIGHT)
				: wall === "right"
					? isHeld(input, INPUT_BITS.LEFT)
					: false;

	if (wall && !player.isGrounded && jumpPressed && awayDirectionHeld) {
		const { vx, vy, wallJumpStreak } = applyWallJumpVelocity(player, wall);
		const wallJumped: PlayerState = {
			...player,
			vx,
			vy,
			hasDoubleJump: hadDoubleJumpBeforePhysics
				? true
				: player.hasDoubleJump,
			wallJumpStreak,
			isInvincible: true,
			invincibilityFrames: PHYSICS.WALL_JUMP_INTANGIBILITY_FRAMES,
		};

			return checkPlatformCollision(
				{
					...wallJumped,
					x: wallJumped.x + wallJumped.vx,
					y: wallJumped.y + wallJumped.vy,
				},
				stage,
			);
		}

		return checkPlatformCollision(
			applyMovement(applyGravity(applyFastFall(player, input)), input),
			stage,
		);
	}

	/**
	 * Resolves a tumble landing: either a successful tech (neutral or roll) or a
	 * failed landing that enters HARD_LANDING with optional tech-lockout penalty.
	 *
	 * Called from `applyPhysicsToPlayer` on the exact tick `landedThisTick` is true
	 * while the player is tumbling. The buffered tech attempt recorded by
	 * `updateTechFrameCounters` determines the outcome:
	 * - **Tech window active**: TECH_NEUTRAL or TECH_ROLL (direction from held input),
	 *   with invincibility frames and all momentum cleared.
	 * - **Tech window expired + attempted tech**: HARD_LANDING with full tech-lockout.
	 * - **No tech attempted**: HARD_LANDING without lockout.
	 *
	 * @param playerId - ID of the player (reads and clears the tech-attempt buffer).
	 * @param player - Player state on the landing frame (already grounded).
	 * @param input - Non-null input used to detect roll direction.
	 * @returns Updated `PlayerState` in the appropriate post-landing state.
	 */
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

	/**
	 * Updates the player's `facing` direction based on held directional input.
	 *
	 * Facing is locked while the player is grabbing an opponent — the attacker
	 * should face the grabbed victim regardless of which keys are held.
	 *
	 * @param player - Player state before this tick's facing update.
	 * @param input - Input received this tick, or `null`.
	 * @returns Updated player with `facing` set to `-1` (left) or `1` (right),
	 *   or the original player if no directional key is held or the player is grabbing.
	 */
	private applyFacing(
		player: PlayerState,
		input: InputEvent | null,
	): PlayerState {
		if (player.isGrabbing) {
			return player;
		}

		if (isHeld(input, INPUT_BITS.LEFT) && !isHeld(input, INPUT_BITS.RIGHT)) {
			return { ...player, facing: -1 };
		}
		if (isHeld(input, INPUT_BITS.RIGHT) && !isHeld(input, INPUT_BITS.LEFT)) {
			return { ...player, facing: 1 };
		}
		return player;
	}

	/**
	 * Decrements the invincibility frame counter by one and clears `isInvincible`
	 * when the counter reaches zero.
	 *
	 * A no-op when the player is not currently invincible.
	 *
	 * @param player - Player state entering this tick.
	 * @returns Updated player with `invincibilityFrames` decremented and
	 *   `isInvincible` set to `false` when frames are exhausted.
	 */
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

	/**
	 * Applies Directional Influence (DI) on the exact tick hitlag ends.
	 *
	 * During hitlag both players are frozen and the defender holds a direction to
	 * influence their knockback trajectory. The pending knockback vector (stored at
	 * hit time) is rotated by `applyDI` using the held input direction, then
	 * re-converted to velocity components and applied. The pending fields are cleared
	 * so DI only fires once per hit.
	 *
	 * A no-op if hitlag did not end this frame, or if no pending knockback is stored.
	 *
	 * @param playerBeforeTick - Player state before the FSM tick (reads hitlag counter
	 *   and pending knockback fields).
	 * @param playerAfterTick - Player state after the FSM tick (target for mutation).
	 * @param input - Input held this tick used to determine DI direction.
	 * @returns Updated `playerAfterTick` with DI-adjusted velocity, or the original
	 *   object unchanged when no DI applies.
	 */
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

	/**
	 * Converts raw input bits into a normalised directional vector for DI calculations.
	 *
	 * Opposing directions cancel out (both held = 0). UP maps to `inputY = 1` (away
	 * from gravity), DOWN maps to `inputY = -1`. The result is consumed by
	 * `applyDI` inside `applyDirectionalInfluenceOnHitlagEnd`.
	 *
	 * @param input - Input received this tick, or `null`.
	 * @returns Object with `inputX` and `inputY`, each one of `-1 | 0 | 1`.
	 */
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

	/**
	 * Computes and applies the active hitbox for the current attack frame.
	 *
	 * For non-attack states, clears `activeHitbox` to `null`. For attack states,
	 * maps `stateFrame` onto the move's `hitboxPerActiveFrame` array by subtracting
	 * startup frames (and charge frames for smash moves). Smash moves scale `damage`
	 * and `baseKnockback` by a charge multiplier (up to +40% at full charge). Also
	 * handles smash-charge hold: while the attack button is held before the active
	 * window, increments `chargeFrames` and keeps `activeHitbox` null.
	 *
	 * @param player - Player state after FSM tick and state-transition side effects.
	 * @param input - Input received this tick (used to detect attack-held for charging).
	 * @returns Updated player with `activeHitbox`, `chargeFrames`, and `currentMoveId`
	 *   reflecting the current attack frame.
	 */
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
		const move = getMoveDataForCharacter(player.characterId, moveId);
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

	/**
	 * Snaps a player to the correct hang position for a given ledge and transitions
	 * them into LEDGE_HANG state.
	 *
	 * The hang offset is mirrored left/right so the fighter always faces inward.
	 * Resets velocity, restores double jump and air dodge, clears fast-fall, and
	 * grants invincibility for `LEDGE_HANG_INVINCIBILITY_FRAMES`.
	 *
	 * @param player - Player state before the ledge snap.
	 * @param ledgeId - Stage ledge ID (`"left"` or `"right"`).
	 * @returns Updated player positioned at the ledge in LEDGE_HANG state.
	 */
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
			hasDoubleJump: true,
			hasAirDodge: true,
			wallJumpStreak: 0,
		};
	}

	/**
	 * Returns the `PlayerId` currently occupying a ledge, or `null` if vacant.
	 *
	 * @param ledgeId - Stage ledge ID to query.
	 */
	private getLedgeOccupant(ledgeId: string): string | null {
		return this.ledgeState.get(ledgeId)?.occupantId ?? null;
	}

	/**
	 * Attempts to grant a player occupancy of a ledge, handling trump logic.
	 *
	 * Three outcomes:
	 * - **`"granted"`**: ledge was vacant (or occupied by `playerId` — already theirs);
	 *   `playerId` is now the occupant.
	 * - **`"trumped"`**: ledge had a different occupant who is evicted; `playerId` takes
	 *   over and the previous occupant receives a `LEDGE_REGRAB_COOLDOWN_FRAMES` cooldown.
	 * - **`"denied"`**: `playerId` has an active regrab cooldown on this ledge.
	 *
	 * @param playerId - The player attempting to grab the ledge.
	 * @param ledgeId - Stage ledge ID to grab.
	 * @returns `"granted"`, `"trumped"`, or `"denied"`.
	 */
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

	/**
	 * Releases a player's occupancy of a ledge and starts their regrab cooldown.
	 *
	 * Called when a player leaves LEDGE_HANG via any exit (drop, jump, climb, roll,
	 * attack) or is trumped off by another player. The cooldown prevents immediately
	 * re-grabbing the same ledge.
	 *
	 * @param playerId - The player releasing the ledge.
	 * @param ledgeId - Stage ledge ID being released.
	 */
	private releaseLedge(playerId: string, ledgeId: string): void {
		const ledge = this.ledgeState.get(ledgeId);
		if (!ledge) return;
		if (ledge.occupantId === playerId) {
			ledge.occupantId = null;
		}
		ledge.cooldowns.set(playerId, PHYSICS.LEDGE_REGRAB_COOLDOWN_FRAMES);
	}

	/**
	 * Decrements all per-player ledge regrab cooldowns by one frame each tick.
	 *
	 * Cooldowns prevent a player from immediately re-grabbing a ledge they just
	 * released or were trumped from. Called at the end of `tickGame` after all
	 * player updates.
	 */
	private tickLedgeCooldowns(): void {
		for (const ledge of this.ledgeState.values()) {
			for (const [playerId, frames] of ledge.cooldowns) {
				if (frames > 0) {
					ledge.cooldowns.set(playerId, frames - 1);
				}
			}
		}
	}

	/**
	 * Determines which `MoveId` to assign when a player enters an attack or grab state.
	 *
	 * Priority order (highest to lowest):
	 * 1. LEDGE_ATTACK when already in that state.
	 * 2. Aerial moves (special, directional air, neutral air) when airborne or in AIR_ATTACK.
	 * 3. Grab/throw disambiguation when the player is grabbing or presses GRAB.
	 * 4. Grounded specials.
	 * 5. Smash attacks (SHIELD + ATTACK shortcut).
	 * 6. Grounded tilts and jab.
	 *
	 * @param player - Current player state (reads `state`, `isGrounded`, `facing`, `isGrabbing`).
	 * @param input - Input received this tick, or `null`.
	 * @returns The resolved `MoveId` for this input context.
	 */
	private selectMoveId(player: PlayerState, input: InputEvent | null): MoveId {
		const wantsUp = isHeld(input, INPUT_BITS.JUMP) || isPressed(input, INPUT_BITS.JUMP);
		const wantsDown = isHeld(input, INPUT_BITS.DOWN);
		const wantsLeft = isHeld(input, INPUT_BITS.LEFT);
		const wantsRight = isHeld(input, INPUT_BITS.RIGHT);
		const pressedUp = isPressed(input, INPUT_BITS.JUMP);
		const pressedDown = isPressed(input, INPUT_BITS.DOWN);
		const pressedLeft = isPressed(input, INPUT_BITS.LEFT);
		const pressedRight = isPressed(input, INPUT_BITS.RIGHT);
		const pressedHorizontal = pressedLeft !== pressedRight;
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

		if (player.isGrabbing || player.state === PlayerStateEnum.GRAB_HOLDING) {
			if (isPressed(input, INPUT_BITS.ATTACK)) return MoveId.PUMMEL;
			if (pressedUp) return MoveId.UP_THROW;
			if (pressedDown) return MoveId.DOWN_THROW;
			if (pressedHorizontal) {
				const pressedToward =
					(player.facing === 1 && pressedRight) ||
					(player.facing === -1 && pressedLeft);
				return pressedToward ? MoveId.FORWARD_THROW : MoveId.BACK_THROW;
			}
			return MoveId.GRAB;
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

	/**
	 * Runs O(n²) hit detection across all player pairs for one tick.
	 *
	 * For each ordered pair (A, B) the method runs, in priority order:
	 * 1. Counter-hit check (either direction).
	 * 2. Grab connect (A grabs B, then B grabs A).
	 * 3. Throw execution (A throws B, then B throws A).
	 * 4. Pummel hit (A pummels B, then B pummels A).
	 * 5. Standard hitbox collision with hit-trade resolution when both players
	 *    have active hitboxes simultaneously.
	 *
	 * A `continue` after any successful interaction skips remaining checks for that
	 * pair to prevent double-hitting in the same frame.
	 *
	 * @param players - Mutable map of all player states; updated in place on hit.
	 * @param inputs - Map of inputs this tick; used to pass victim input to hit
	 *   resolution functions for SDI and shield checks.
	 */
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

				const playerAThrowConnected = this.tryApplyThrowHit(
					players,
					playerA.id,
					playerB.id,
					playerBInput,
				);
				if (playerAThrowConnected) {
					continue;
				}

				const playerAPummelConnected = this.tryApplyPummelHit(
					players,
					playerA.id,
					playerB.id,
					playerBInput,
				);
				if (playerAPummelConnected) {
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

				const playerBPummelConnected = this.tryApplyPummelHit(
					players,
					playerB.id,
					playerA.id,
					playerAInput,
				);
				if (playerBPummelConnected) {
					continue;
				}

				const playerBThrowConnected = this.tryApplyThrowHit(
					players,
					playerB.id,
					playerA.id,
					playerAInput,
				);
				if (playerBThrowConnected) {
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
					if (updatedB.currentMoveId) {
						this.emitHitEvent(
							updatedB.id,
							updatedA.id,
							updatedB.currentMoveId,
							hitOnA.damage,
							hitOnA.knockbackVx,
							hitOnA.knockbackVy,
							updatedA.x,
							updatedA.y,
						);
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
					if (updatedA.currentMoveId) {
						this.emitHitEvent(
							updatedA.id,
							updatedB.id,
							updatedA.currentMoveId,
							hitOnB.damage,
							hitOnB.knockbackVx,
							hitOnB.knockbackVy,
							updatedB.x,
							updatedB.y,
						);
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

	/**
	 * Attempts to connect a grab between attacker and victim.
	 *
	 * Checks that the attacker is executing GRAB with an active hitbox, that the
	 * victim is eligible (not already grabbed, not invincible), and that the
	 * hitbox circle overlaps the victim's hurtbox. On success, transitions both
	 * players into GRAB_HOLDING state and positions the victim at the grab offset.
	 *
	 * @param players - Mutable player map; updated in place on success.
	 * @param attackerId - Player attempting the grab.
	 * @param victimId - Player being grabbed.
	 * @param victimInput - Victim's input this tick (passed to `checkHitboxCollision`).
	 * @returns `true` if the grab connected; `false` otherwise.
	 */
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

	/**
	 * Executes a throw move on the currently grabbed victim.
	 *
	 * Uses guaranteed-overlap resolution: the victim is temporarily repositioned to
	 * the hitbox offset so `resolveHit` always connects. On success, releases the
	 * grab state on both players and applies full knockback to the victim.
	 *
	 * @param players - Mutable player map; updated in place on success.
	 * @param attackerId - Player executing the throw.
	 * @param victimId - Player being thrown.
	 * @param victimInput - Victim's input this tick (passed to `resolveHit` for SDI).
	 * @returns `true` if the throw hit; `false` if preconditions are not met.
	 */
	private tryApplyThrowHit(
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

		if (!attacker.isGrabbing || attacker.grabbedPlayerId !== victim.id) {
			return false;
		}

		if (!isThrowMoveId(attacker.currentMoveId) || !attacker.activeHitbox) {
			return false;
		}

		const guaranteedOverlapVictim: PlayerState = {
			...victim,
			x: attacker.x + attacker.activeHitbox.offsetX * attacker.facing,
			y: attacker.y + attacker.activeHitbox.offsetY,
		};
		const hit = resolveHit(
			attacker,
			guaranteedOverlapVictim,
			attacker.activeHitbox,
			victimInput,
		);
		if (!hit.hit) {
			return false;
		}

		const trackedHitIds = new Set(attacker.hitPlayerIds);
		trackedHitIds.add(victim.id);

		if (attacker.currentMoveId) {
			this.emitHitEvent(
				attacker.id,
				victim.id,
				attacker.currentMoveId,
				hit.damage,
				hit.knockbackVx,
				hit.knockbackVy,
				victim.x,
				victim.y,
			);
		}

		players[victim.id] = this.applyHit(
			{
				...victim,
				isGrabbing: false,
				grabbedPlayerId: null,
			},
			hit,
			attacker.facing,
		);

		players[attacker.id] = {
			...attacker,
			isGrabbing: false,
			grabbedPlayerId: null,
			hitPlayerIds: trackedHitIds,
		};

		return true;
	}

	/**
	 * Applies a pummel hit to the grabbed victim.
	 *
	 * Pummels deal damage and hitlag but keep the victim locked in GRAB_HOLDING
	 * state rather than launching them. One pummel hit is allowed per PUMMEL move
	 * active window (`hitPlayerIds` prevents multi-hit within the same active frame).
	 *
	 * @param players - Mutable player map; updated in place on success.
	 * @param attackerId - Player executing the pummel.
	 * @param victimId - Player being pummeled.
	 * @param victimInput - Victim's input this tick (passed to `resolveHit`).
	 * @returns `true` if the pummel connected; `false` if preconditions are not met.
	 */
	private tryApplyPummelHit(
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

		if (
			!attacker.isGrabbing ||
			attacker.grabbedPlayerId !== victim.id ||
			attacker.currentMoveId !== MoveId.PUMMEL ||
			!attacker.activeHitbox
		) {
			return false;
		}

		if (attacker.hitPlayerIds.has(victim.id)) {
			return false;
		}

		const hit = resolveHit(attacker, victim, attacker.activeHitbox, victimInput);
		if (!hit.hit) {
			return false;
		}

		const trackedHitIds = new Set(attacker.hitPlayerIds);
		trackedHitIds.add(victim.id);

		this.emitHitEvent(
			attacker.id,
			victim.id,
			MoveId.PUMMEL,
			hit.damage,
			hit.knockbackVx,
			hit.knockbackVy,
			victim.x,
			victim.y,
		);

		players[victim.id] = {
			...victim,
			percent: victim.percent + hit.damage,
			hitlagFramesRemaining: Math.max(victim.hitlagFramesRemaining, hit.hitlagFrames),
			state: PlayerStateEnum.GRAB_HOLDING,
			isGrabbing: true,
			x: attacker.x + PHYSICS.GRAB_OFFSET_X * attacker.facing,
			y: attacker.y,
			vx: 0,
			vy: 0,
			activeHitbox: null,
			currentMoveId: null,
			currentMove: undefined,
		};

		players[attacker.id] = {
			...attacker,
			hitPlayerIds: trackedHitIds,
			staleMoveQueue: this.pushStaleMoveToQueue(attacker, MoveId.PUMMEL),
		};

		return true;
	}

	/**
	 * Returns `true` when a player can be grabbed.
	 *
	 * A player is ineligible if they are invincible, already in GRAB_HOLDING state,
	 * currently grabbing someone, or otherwise unable to interact (see `canInteract`).
	 *
	 * @param victim - The prospective grab target.
	 */
	private isGrabVictimEligible(victim: PlayerState): boolean {
		return (
			this.canInteract(victim) &&
			victim.state !== PlayerStateEnum.GRAB_HOLDING &&
			!victim.isGrabbing
		);
	}

	/**
	 * Keeps grabbed-victim positions locked to the attacker each tick and cleans up
	 * stale grab state when a player exits GRAB_HOLDING without going through a throw.
	 *
	 * Three cases handled per grabbing attacker:
	 * - **Missing victim**: victim no longer in the player map; release the attacker.
	 * - **Both GRAB_HOLDING**: pin victim to the attacker's grab-offset position.
	 * - **Both IDLE**: the grab sequence ended cleanly; clear `isGrabbing` on both.
	 *
	 * @param players - Mutable player map; updated in place.
	 */
	private syncGrabState(players: Record<PlayerId, PlayerState>): void {
		for (const attacker of Object.values(players)) {
			if (!attacker.isGrabbing || !attacker.grabbedPlayerId) {
				continue;
			}

			const victim = players[attacker.grabbedPlayerId as PlayerId];
			if (!victim) {
				players[attacker.id] = {
					...attacker,
					state: PlayerStateEnum.IDLE,
					stateFrame: 0,
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

	/**
	 * Checks whether the defender is executing a counter move and the attacker's
	 * hitbox is connecting during the active counter window, then applies the
	 * reflected hit to the attacker.
	 *
	 * The counter (DOWN_SPECIAL) is active only on `stateFrame < 6`. On success,
	 * damage is multiplied by `COUNTER_DAMAGE_MULTIPLIER` and knockback by
	 * `COUNTER_KNOCKBACK_MULTIPLIER`, then `applyHit` is called on the attacker.
	 *
	 * @param players - Mutable player map; attacker's state updated in place on success.
	 * @param attacker - Player whose hitbox may be connecting into the defender.
	 * @param defender - Player executing the counter move.
	 * @param defenderInput - Defender's input this tick (passed to `checkHitboxCollision`).
	 * @returns `true` if a counter hit fired; `false` otherwise.
	 */
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

		this.emitHitEvent(
			currentDefender.id,
			currentAttacker.id,
			MoveId.DOWN_SPECIAL,
			counterDamage,
			counterVelocity.x,
			counterVelocity.y,
			currentAttacker.x,
			currentAttacker.y,
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

	/**
	 * Pushes a move ID onto the player's stale-move queue (max 9 entries).
	 *
	 * The stale-move queue tracks the last 9 moves that connected. Repeated use of
	 * the same move reduces its knockback via the stale-move mechanic. The oldest
	 * entry is dropped when the queue exceeds 9 items.
	 *
	 * @param player - Current player state (reads `staleMoveQueue`).
	 * @param moveId - The move that just connected, or `null` to return the queue unchanged.
	 * @returns A new `staleMoveQueue` array with `moveId` appended (trimmed to 9).
	 */
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

	/**
	 * Transitions the attacker out of their attack state after a hit connects.
	 *
	 * Clears the active hitbox, move ID, charge frames, and landing-lag counter,
	 * then transitions back to IDLE (if grounded) or AIRBORNE (if not). Also applies
	 * hitlag to the attacker so both players freeze for the same number of frames.
	 *
	 * @param player - The attacking player state at the moment of hit.
	 * @param hitlagFrames - Number of hitlag frames granted by the hit data.
	 * @returns Updated player in the post-hit attacker state.
	 */
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

	/**
	 * Appends a `HitEventData` entry to the internal hit-event buffer.
	 *
	 * Hit events are consumed by `MatchSession` on each snapshot broadcast to drive
	 * client-side hit effects (particles, screen shake, sound). The buffer is cleared
	 * via `clearHitEvents` after each broadcast.
	 *
	 * @param attackerId - Player who dealt the hit.
	 * @param defenderId - Player who received the hit.
	 * @param moveId - Move that connected.
	 * @param damage - Raw damage dealt before stale-move scaling.
	 * @param knockbackVx - Horizontal knockback velocity component.
	 * @param knockbackVy - Vertical knockback velocity component.
	 * @param worldX - World x coordinate of the defender at the moment of impact.
	 * @param worldY - World y coordinate of the defender at the moment of impact.
	 */
	private emitHitEvent(
		attackerId: PlayerId,
		defenderId: PlayerId,
		moveId: MoveId,
		damage: number,
		knockbackVx: number,
		knockbackVy: number,
		worldX: number,
		worldY: number,
	): void {
		this.hitEvents.push({
			attackerId,
			defenderId,
			moveId,
			damage,
			knockbackMagnitude: Math.hypot(knockbackVx, knockbackVy),
			worldX,
			worldY,
		});
	}

	/**
	 * Applies a resolved hit to the defending player.
	 *
	 * Two paths depending on whether the defender is shielding:
	 * - **Shielding**: drains `shieldHealth` by hit damage, applies shield-stun frames
	 *   and pushback. A perfect shield (raised within `PERFECT_SHIELD_WINDOW_FRAMES`)
	 *   skips health drain and stun. Triggers `applyShieldBreak` if health drops to zero.
	 * - **Not shielding**: adds damage to `percent`, applies knockback velocity, sets
	 *   HITSTUN state, clears ledge occupancy, and stores pending knockback for DI
	 *   resolution on hitlag end. Sets `isTumbling` when knockback magnitude exceeds
	 *   `TUMBLE_THRESHOLD`.
	 *
	 * @param player - The defending player state.
	 * @param hit - Resolved hit data from `checkHitboxCollision` or `resolveHit`.
	 * @param attackerFacing - Facing direction of the attacker; used to compute
	 *   shield pushback direction and store `lastHitByFacing` for DI.
	 * @returns Updated player state after the hit is applied.
	 */
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

	/**
	 * Applies a shield-break stun to a player whose shield health has been depleted.
	 *
	 * Launches the player straight upward with a fixed `vy = -8` and locks them in
	 * HITSTUN for `SHIELD_BREAK_STUN_FRAMES` — far longer than normal hitstun — with
	 * `isTumbling = false` so they cannot tech the fall. All combat and animation state
	 * is fully reset.
	 *
	 * @param player - The player whose shield just broke.
	 * @returns Updated player in shield-break stun state.
	 */
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
			lCancelWindowFrames: 0,
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

	/**
	 * Returns `true` when a player can participate in hit interactions.
	 *
	 * A player cannot interact when they are eliminated (stocks = 0), still waiting
	 * on the respawn timer, knocked out this frame, currently invincible, or frozen
	 * in hitlag. All hit-detection paths guard with this check before processing.
	 *
	 * @param player - Player state to evaluate.
	 */
	private canInteract(player: PlayerState): boolean {
		return (
			player.stocks > 0 &&
			player.respawnTimer <= 0 &&
			!player.isKnockedOut &&
			!player.isInvincible &&
			player.hitlagFramesRemaining <= 0
		);
	}

	/**
	 * Processes all players flagged as knocked out this tick.
	 *
	 * For each knocked-out player:
	 * - Emits a `KOEventData` entry with the blast-zone boundary they crossed.
	 * - Releases any ledge they were holding.
	 * - If stocks reach zero: freezes the player in a terminal eliminated state.
	 * - If stocks remain: resets the player to the stage spawn position, restores
	 *   all resources (double jump, air dodge, invincibility), and starts the respawn
	 *   delay timer. A fresh `FSMController` is created to discard any stale animation
	 *   state from the KO sequence.
	 *
	 * @param players - Mutable player map; updated in place for each knocked-out player.
	 */
	private applyKnockouts(players: Record<PlayerId, PlayerState>): void {
		for (const [playerId, player] of Object.entries(players)) {
			if (!player.isKnockedOut) {
				continue;
			}

			const boundary = this.getBlastZoneBoundary(player);
			if (boundary) {
				this.koEvents.push({
					playerId: player.id,
					boundary,
					tick: this.tick,
				});
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
					hasAirDodge: true,
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

	/**
	 * Determines which blast-zone boundary a knocked-out player crossed.
	 *
	 * Re-runs `checkPlatformCollision` with `isKnockedOut` temporarily cleared so
	 * the physics helper can re-detect the blast-zone crossing without the player
	 * already being in a KO state. Then checks the player's position against each
	 * blast-zone edge in order: left, right, top, bottom.
	 *
	 * @param player - The knocked-out player state.
	 * @returns The boundary label (`"left"`, `"right"`, `"top"`, `"bottom"`) or
	 *   `null` if the position does not match any blast zone (should not happen in
	 *   normal play but guards against edge-case physics frames).
	 */
	private getBlastZoneBoundary(
		player: PlayerState,
	): KOEventData["boundary"] | null {
		const boundaryProbe = checkPlatformCollision(
			{
				...player,
				isKnockedOut: false,
			},
			DEFAULT_STAGE,
		);

		if (!boundaryProbe.isKnockedOut) {
			return null;
		}

		if (player.x < DEFAULT_STAGE.blastLeft) {
			return "left";
		}

		if (player.x > DEFAULT_STAGE.blastRight) {
			return "right";
		}

		if (player.y < DEFAULT_STAGE.blastTop) {
			return "top";
		}

		if (player.y > DEFAULT_STAGE.blastBottom) {
			return "bottom";
		}

		return null;
	}
}
