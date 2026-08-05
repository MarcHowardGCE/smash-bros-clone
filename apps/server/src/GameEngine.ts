import {
	applyFastFall,
	applyGravity,
	applyMovement,
	checkHitboxCollision,
	checkPlatformCollision,
	FSMController,
	getMoveData,
	NO_HIT,
	resolveHitTrade,
	type StageData,
	startJump,
} from "@smash/engine";
import {
	type GameState,
	INPUT_BITS,
	type InputEvent,
	MATCH_CONFIG,
	MoveId,
	PHYSICS,
	type PlayerId,
	type PlayerState,
	PlayerStateEnum,
	STAGE,
	type StateSnapshot,
} from "@smash/shared";

const DEFAULT_SPAWN = { x: 640, y: MATCH_CONFIG.RESPAWN_PLATFORM_Y };
const DEFAULT_STAGE_DATA: StageData = {
	width: STAGE.WIDTH,
	height: STAGE.HEIGHT,
	blastTop: STAGE.BLAST_TOP,
	blastBottom: STAGE.BLAST_BOTTOM,
	blastLeft: STAGE.BLAST_LEFT,
	blastRight: STAGE.BLAST_RIGHT,
	mainPlatform: { id: "main", ...STAGE.MAIN_PLATFORM },
	platforms: STAGE.PLATFORMS.map((platform) => ({ ...platform })),
	spawnPositions: [...STAGE.SPAWN_POSITIONS],
};
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
	};
}

function isHeld(input: InputEvent | null, bit: number): boolean {
	return Boolean((input?.held ?? 0) & bit);
}

function isPressed(input: InputEvent | null, bit: number): boolean {
	return Boolean((input?.pressed ?? 0) & bit);
}

export interface GameEngineOptions {
	playerIds: PlayerId[];
}

export class GameEngine {
	private state: GameState;
	private readonly fsmControllers = new Map<PlayerId, FSMController>();
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
					hitstunFramesRemaining: 0,
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
					isGrabbing: false,
					grabbedPlayerId: null,
					activeHitbox: null,
					currentMoveId: null,
					respawnTimer: 0,
				};

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
		};
	}

	tickGame(inputs: Map<PlayerId, InputEvent | null>): GameState {
		if (this.state.winnerId) {
			return this.state;
		}

		this.tick += 1;
		const players = Object.fromEntries(
			Object.entries(this.state.players).map(([playerId, player]) => {
				const nextPlayer = this.updatePlayer(
					playerId as PlayerId,
					player,
					inputs.get(playerId as PlayerId) ?? null,
				);
				return [playerId, nextPlayer];
			}),
		) as Record<PlayerId, PlayerState>;

		this.applyHitDetection(players);
		this.applyKnockouts(players);

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
	): PlayerState {
		const player = clonePlayer(current);

		if (player.stocks <= 0) {
			return {
				...player,
				activeHitbox: null,
				currentMoveId: null,
				vx: 0,
				vy: 0,
			};
		}

		if (player.respawnTimer > 0) {
			return {
				...player,
				respawnTimer: player.respawnTimer - 1,
				activeHitbox: null,
				currentMoveId: null,
				hitlagFramesRemaining: 0,
				hitstunFramesRemaining: 0,
				vx: 0,
				vy: 0,
			};
		}

		const controller = this.fsmControllers.get(playerId);
		if (!controller) {
			return player;
		}

		const beforeTick = clonePlayer(player);
		let nextPlayer = controller.tick(player, input);
		nextPlayer = this.applyStateTransitions(beforeTick, nextPlayer, input);

		if (nextPlayer.hitlagFramesRemaining > 0) {
			return this.withHitboxState(nextPlayer, input);
		}

		nextPlayer = this.applyPhysicsToPlayer(nextPlayer, input);
		nextPlayer = this.applyFacing(nextPlayer, input);
		nextPlayer = this.updateInvincibility(nextPlayer);
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
		} else {
			nextPlayer = {
				...nextPlayer,
				isShielding: false,
				shieldHealth: Math.min(
					PHYSICS.SHIELD_MAX_HEALTH,
					nextPlayer.shieldHealth + PHYSICS.SHIELD_REGEN_PER_FRAME,
				),
			};
		}

		return nextPlayer;
	}

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
			(player.state === PlayerStateEnum.ATTACK ||
				player.state === PlayerStateEnum.AIR_ATTACK ||
				player.state === PlayerStateEnum.GRAB ||
				player.state === PlayerStateEnum.GRAB_HOLDING) &&
			previous.state !== player.state
		) {
			nextPlayer = {
				...nextPlayer,
				currentMoveId: this.selectMoveId(player, input),
			};
		}

		if (![PlayerStateEnum.ATTACK, PlayerStateEnum.AIR_ATTACK].includes(
			player.state as PlayerStateEnum,
		)) {
			nextPlayer = {
				...nextPlayer,
				currentMoveId: null,
			};
		}

		if (player.state === PlayerStateEnum.HITSTUN) {
			nextPlayer = {
				...nextPlayer,
				currentMoveId: null,
				activeHitbox: null,
			};
		}

		return nextPlayer;
	}

	private applyPhysicsToPlayer(
		player: PlayerState,
		input: InputEvent | null,
	): PlayerState {
		const effectiveInput = input ?? {
			...EMPTY_INPUT,
			playerId: player.id,
			tick: this.tick,
		};
		let nextPlayer = player;

		if (player.state === PlayerStateEnum.JUMPSQUAT) {
			nextPlayer = {
				...nextPlayer,
				vx: nextPlayer.vx * PHYSICS.GROUND_FRICTION,
			};
		} else if (
			player.state !== PlayerStateEnum.SHIELD &&
			player.state !== PlayerStateEnum.ROLL &&
			player.state !== PlayerStateEnum.SPOT_DODGE
		) {
			nextPlayer = this.applyMovementPipeline(nextPlayer, effectiveInput);
		}

		if (nextPlayer.hitstunFramesRemaining > 0) {
			nextPlayer = {
				...nextPlayer,
				state: PlayerStateEnum.HITSTUN,
			};
		}

		return nextPlayer;
	}

	private applyMovementPipeline(
		player: PlayerState,
		input: InputEvent,
	): PlayerState {
		const stage: StageData = isHeld(input, INPUT_BITS.DOWN)
			? {
					...DEFAULT_STAGE_DATA,
					platforms: [],
				}
			: DEFAULT_STAGE_DATA;

		return checkPlatformCollision(
			applyMovement(applyFastFall(applyGravity(player), input), input),
			stage,
		);
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

	private withHitboxState(
		player: PlayerState,
		input: InputEvent | null,
	): PlayerState {
		if (![PlayerStateEnum.ATTACK, PlayerStateEnum.AIR_ATTACK].includes(
			player.state as PlayerStateEnum,
		)) {
			return {
				...player,
				activeHitbox: null,
			};
		}

		const moveId = (player.currentMoveId ?? this.selectMoveId(player, input)) as MoveId;
		const move = getMoveData(moveId);
		const activeFrame = player.stateFrame - move.startupFrames;
		const activeHitbox =
			activeFrame >= 0 && activeFrame < move.hitboxPerActiveFrame.length
				? (move.hitboxPerActiveFrame[activeFrame] ?? null)
				: null;

		return {
			...player,
			currentMoveId: move.id,
			activeHitbox,
		};
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

	private applyHitDetection(players: Record<PlayerId, PlayerState>): void {
		const playerList = Object.values(players);

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

				if (!this.canInteract(playerA) || !this.canInteract(playerB)) {
					continue;
				}

				let hitOnA = NO_HIT;
				let hitOnB = NO_HIT;

				if (playerA.activeHitbox && playerB.activeHitbox) {
					const [tradeA, tradeB] = resolveHitTrade(playerA, playerB);
					const directA = checkHitboxCollision(playerB, playerA);
					const directB = checkHitboxCollision(playerA, playerB);
					hitOnA = tradeA.hit ? tradeA : directA;
					hitOnB = tradeB.hit ? tradeB : directB;
				} else {
					hitOnA = checkHitboxCollision(playerB, playerA);
					hitOnB = checkHitboxCollision(playerA, playerB);
				}

				if (hitOnA.hit) {
					const updatedA = players[playerA.id];
					const updatedB = players[playerB.id];
					if (!updatedA || !updatedB) {
						continue;
					}

					players[playerA.id] = this.applyHit(updatedA, hitOnA);
					players[playerB.id] = this.consumeAttackOnHit(updatedB, hitOnA.hitlagFrames);
				}

				if (hitOnB.hit) {
					const updatedA = players[playerA.id];
					const updatedB = players[playerB.id];
					if (!updatedA || !updatedB) {
						continue;
					}

					players[playerB.id] = this.applyHit(updatedB, hitOnB);
					players[playerA.id] = this.consumeAttackOnHit(updatedA, hitOnB.hitlagFrames);
				}
			}
		}
	}

	private consumeAttackOnHit(player: PlayerState, hitlagFrames: number): PlayerState {
		return {
			...player,
			state: player.isGrounded ? PlayerStateEnum.IDLE : PlayerStateEnum.AIRBORNE,
			stateFrame: 0,
			hitlagFramesRemaining: Math.max(player.hitlagFramesRemaining, hitlagFrames),
			activeHitbox: null,
			currentMoveId: null,
		};
	}

	private applyHit(player: PlayerState, hit: typeof NO_HIT): PlayerState {
		return {
			...player,
			percent: player.percent + hit.damage,
			vx: hit.knockbackVx,
			vy: hit.knockbackVy,
			hitlagFramesRemaining: hit.hitlagFrames,
			hitstunFramesRemaining: hit.hitstunFrames,
			state: PlayerStateEnum.HITSTUN,
			stateFrame: 0,
			isGrounded: false,
			activeHitbox: null,
			currentMoveId: null,
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

			const remainingStocks = Math.max(0, player.stocks - 1);
			if (remainingStocks === 0) {
				players[playerId as PlayerId] = {
					...player,
					stocks: 0,
					percent: 0,
					vx: 0,
					vy: 0,
					activeHitbox: null,
					currentMoveId: null,
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
				isGrounded: false,
				isKnockedOut: false,
				hasDoubleJump: true,
				isFastFalling: false,
				isInvincible: true,
				invincibilityFrames: MATCH_CONFIG.RESPAWN_INVINCIBILITY_FRAMES,
				activeHitbox: null,
				currentMoveId: null,
				respawnTimer: MATCH_CONFIG.RESPAWN_DELAY_FRAMES,
			};
			this.fsmControllers.set(
				playerId as PlayerId,
				new FSMController(PlayerStateEnum.AIRBORNE),
			);
		}
	}
}
