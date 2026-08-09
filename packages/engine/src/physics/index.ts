import {
	INPUT_BITS,
	type InputEvent,
	PHYSICS,
	type PlayerState,
	STAGE,
	getCharacterStats,
} from "@smash/shared";
import type { LedgeData, StageData, WallData } from "./types.js";

export const DEFAULT_STAGE: StageData = {
	width: STAGE.WIDTH,
	height: STAGE.HEIGHT,
	blastTop: STAGE.BLAST_TOP,
	blastBottom: STAGE.BLAST_BOTTOM,
	blastLeft: STAGE.BLAST_LEFT,
	blastRight: STAGE.BLAST_RIGHT,
	mainPlatform: {
		id: "main",
		...STAGE.MAIN_PLATFORM,
	},
	platforms: STAGE.PLATFORMS.map((platform) => ({ ...platform })),
	ledges: STAGE.LEDGES.map((ledge) => ({ ...ledge })),
	walls: STAGE.WALLS.map((w) => ({ ...w })),
	spawnPositions: [...STAGE.SPAWN_POSITIONS],
};

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

// 18° (Melee/Brawl-style) vs. ~9.74° (Smash4/Ultimate-style)
// Design choice: wider DI cone for more player agency in knockback direction
const MAX_DI_ANGLE_RADIANS = 0.314159;

function isHeld(input: InputEvent, bit: number): boolean {
	return (input.held & bit) !== 0;
}

function isPressed(input: InputEvent, bit: number): boolean {
	return (input.pressed & bit) !== 0;
}

function isWithinPlatformBounds(
	playerX: number,
	platform: StageData["mainPlatform"],
): boolean {
	return playerX >= platform.x && playerX <= platform.x + platform.width;
}

function isWithinLandingBounds(
	playerX: number,
	platform: StageData["mainPlatform"],
): boolean {
	return playerX > platform.x && playerX < platform.x + platform.width;
}

function landOnPlatform(player: PlayerState, platformY: number): PlayerState {
	return {
		...player,
		y: platformY - getCharacterStats(player.characterId).hurtboxRadius,
		vy: 0,
		isGrounded: true,
		isFastFalling: false,
		hasDoubleJump: true,
		hasAirDodge: true,
		wallJumpStreak: 0,
	};
}

// Tunneling prevention: checks whether the player's bottom edge crossed the platform
// surface between the previous frame and this frame, rather than just checking current
// position. Without this, a fast-moving player (high vy) can pass entirely through a
// thin platform in a single tick and never trigger the landing check.
function crossesPlatformTop(player: PlayerState, platformY: number): boolean {
	const playerBottom = player.y + getCharacterStats(player.characterId).hurtboxRadius;
	const previousBottom = playerBottom - player.vy;

	return previousBottom <= platformY && playerBottom >= platformY;
}

// Applies per-frame gravitational acceleration. Only runs when airborne — grounded
// players are held at platform height by checkPlatformCollision instead.
// Design intent: both normal-fall and fast-fall share one terminal ceiling
// (PHYSICS.TERMINAL_VELOCITY = 18). Fast-fall only changes acceleration
// (GRAVITY * FAST_FALL_MULTIPLIER), not the max speed cap.
export function applyGravity(player: PlayerState): PlayerState {
	if (player.isGrounded) {
		return player;
	}

	const gravityAccel = player.isFastFalling
		? PHYSICS.GRAVITY * PHYSICS.FAST_FALL_MULTIPLIER
		: PHYSICS.GRAVITY;
	const vy = player.vy + gravityAccel;

	return {
		...player,
		vy: Math.min(vy, PHYSICS.TERMINAL_VELOCITY),
	};
}

export function applyMovement(
	player: PlayerState,
	input: InputEvent,
): PlayerState {
	if (player.hitstunFramesRemaining > 0) {
		return {
			...player,
			x: player.x + player.vx,
			y: player.y + player.vy,
		};
	}

	const movingLeft = isHeld(input, INPUT_BITS.LEFT);
	const movingRight = isHeld(input, INPUT_BITS.RIGHT);
	let vx = player.vx;

	if (player.isGrounded) {
		if (movingLeft) {
			vx = clamp(
				vx - getCharacterStats(player.characterId).walkSpeed * 0.2,
				-getCharacterStats(player.characterId).runSpeed,
				getCharacterStats(player.characterId).runSpeed,
			);
		}

		if (movingRight) {
			vx = clamp(
				vx + getCharacterStats(player.characterId).walkSpeed * 0.2,
				-getCharacterStats(player.characterId).runSpeed,
				getCharacterStats(player.characterId).runSpeed,
			);
		}

		if (!movingLeft && !movingRight) {
			vx *= PHYSICS.GROUND_FRICTION;
		}
	} else {
		const airSpeedLimit = PHYSICS.AIR_SPEED * 8;

		// Air speed cap is deliberately loose (8× the acceleration factor) so the player
		// has wide lateral freedom in the air. The tight limit only applies in rare edge
		// cases (e.g. extreme knockback velocity); normal aerial drift never reaches it.

		if (movingLeft) {
			vx = clamp(vx - PHYSICS.AIR_SPEED * 0.15, -airSpeedLimit, airSpeedLimit);
		}

		if (movingRight) {
			vx = clamp(vx + PHYSICS.AIR_SPEED * 0.15, -airSpeedLimit, airSpeedLimit);
		}

		if (!movingLeft && !movingRight) {
			vx *= PHYSICS.AIR_FRICTION;
		}
	}

	return {
		...player,
		vx,
		x: player.x + vx,
		y: player.y + player.vy,
	};
}

export function applyKnockbackDecay(player: PlayerState): PlayerState {
	if (player.hitstunFramesRemaining <= 0) {
		return player;
	}

	return {
		...player,
		vx: player.vx * 0.95,
	};
}

export function applyDI(
	knockbackAngle: number,
	inputX: number,
	inputY: number,
	_facing: number,
): number {
	if (inputX === 0 && inputY === 0) {
		return knockbackAngle;
	}

	const inputMagnitude = Math.hypot(inputX, inputY);
	if (inputMagnitude === 0) {
		return knockbackAngle;
	}

	const normalizedX = inputX / inputMagnitude;
	const normalizedY = inputY / inputMagnitude;

	const directionX = Math.cos(knockbackAngle);
	const directionY = Math.sin(knockbackAngle);
	const perpendicularX = -directionY;
	const perpendicularY = directionX;

	const perpendicularProjection = normalizedX * perpendicularX + normalizedY * perpendicularY;
	const parallelProjection = normalizedX * directionX + normalizedY * directionY;
	const projectionSum =
		Math.abs(perpendicularProjection) + Math.abs(parallelProjection);
	const perpendicularComponent =
		projectionSum === 0
			? 0
			: clamp(
					perpendicularProjection / projectionSum,
		-1,
		1,
			  );

	const angleShift = clamp(
		perpendicularComponent * MAX_DI_ANGLE_RADIANS,
		-MAX_DI_ANGLE_RADIANS,
		MAX_DI_ANGLE_RADIANS,
	);

	return knockbackAngle + angleShift;
}

// Sets the initial upward velocity for a jump. Called by GameEngine when the
// JUMPSQUAT → AIRBORNE transition fires (full hop or short hop is determined by
// how long JUMP was held, evaluated in JumpsquatState before the transition).
// For double jump: consumes hasDoubleJump and ignores isGrounded check, allowing
// one aerial jump regardless of current vy.
export function startJump(
	player: PlayerState,
	isShortHop: boolean,
): PlayerState {
	if (player.isGrounded) {
		return {
			...player,
			vy: isShortHop ? getCharacterStats(player.characterId).shortHopVelocity : getCharacterStats(player.characterId).jumpVelocity,
			isGrounded: false,
			isFastFalling: false,
		};
	}

	if (!player.hasDoubleJump) {
		return player;
	}

	return {
		...player,
		vy: PHYSICS.DOUBLE_JUMP_VELOCITY,
		hasDoubleJump: false,
		isFastFalling: false,
	};
}

export function resolveJump(
	player: PlayerState,
	input: InputEvent,
	jumpHeldFrames: number,
): PlayerState {
	if (!isPressed(input, INPUT_BITS.JUMP)) {
		return player;
	}

	const isShortHop = jumpHeldFrames < PHYSICS.SHORT_HOP_THRESHOLD_FRAMES;
	return startJump(player, isShortHop);
}

// Fast fall activates when the player holds DOWN while airborne and already moving
// downward (vy >= 0). The vy >= 0 guard prevents fast fall from triggering on the
// way up — it would cancel the jump arc. Once activated, isFastFalling is latched
// true and applyGravity will apply GRAVITY * FAST_FALL_MULTIPLIER per frame for
// progressive acceleration (capped by TERMINAL_VELOCITY).
export function applyFastFall(
	player: PlayerState,
	input: InputEvent,
): PlayerState {
	if (
		player.isGrounded ||
		player.isFastFalling ||
		!isHeld(input, INPUT_BITS.DOWN) ||
		player.vy < 0
	) {
		return player;
	}

	return {
		...player,
		isFastFalling: true,
	};
}

// Resolves platform landing and blast-zone KO detection.
// Blast zones are checked first: any position outside the stage boundary immediately
// sets isKnockedOut. Platform landing uses crossesPlatformTop (see above) to handle
// tunneling. Only checks landing (vy >= 0) — a player moving upward passes through
// platform bottoms freely, matching Smash Bros soft-platform behaviour.
export function checkPlatformCollision(
	player: PlayerState,
	stage: StageData,
): PlayerState {
	if (
		player.y > stage.blastBottom ||
		player.y < stage.blastTop ||
		player.x < stage.blastLeft ||
		player.x > stage.blastRight
	) {
		return {
			...player,
			isKnockedOut: true,
		};
	}

	if (player.isGrounded) {
		const onMain =
			isWithinPlatformBounds(player.x, stage.mainPlatform) &&
			Math.abs(player.y - (stage.mainPlatform.y - getCharacterStats(player.characterId).hurtboxRadius)) <= 1;

		const onSoft = stage.platforms.some(
			(p) =>
				isWithinPlatformBounds(player.x, p) &&
				Math.abs(player.y - (p.y - getCharacterStats(player.characterId).hurtboxRadius)) <= 1,
		);

		if (!onMain && !onSoft) {
			player = { ...player, isGrounded: false };
		}
	}

	if (player.vy < 0) {
		return player;
	}

	if (
		isWithinLandingBounds(player.x, stage.mainPlatform) &&
		crossesPlatformTop(player, stage.mainPlatform.y)
	) {
		return landOnPlatform(player, stage.mainPlatform.y);
	}

	for (const platform of stage.platforms) {
		if (player.hitstunFramesRemaining > 0 && !platform.solid) {
			continue;
		}

		if (
			isWithinLandingBounds(player.x, platform) &&
			crossesPlatformTop(player, platform.y)
		) {
			return landOnPlatform(player, platform.y);
		}
	}

	return player;
}

// Pure geometric ledge query used by GameEngine after movement/collision resolution.
// It intentionally stays separate from checkPlatformCollision so landing mutation and
// ledge-eligibility checks remain distinct responsibilities.
export function checkLedgeGrab(
	player: PlayerState,
	stage: StageData,
): LedgeData | null {
	if (player.isGrounded) {
		return null;
	}

	if (player.hitstunFramesRemaining > 0) {
		return null;
	}

	for (const ledge of stage.ledges) {
		const dx = Math.abs(player.x - ledge.x);
		const dy = Math.abs(player.y - ledge.y);

		if (
			dx <= PHYSICS.LEDGE_GRAB_RADIUS &&
			dy <= PHYSICS.LEDGE_GRAB_VERTICAL_TOLERANCE
		) {
			return ledge;
		}
	}

	return null;
}

// Pure geometric wall collision query used by GameEngine for wall-tech and wall-jump detection.
// Returns the wall's id ('left' or 'right') on first match, or null if no wall is in contact range.
// Only checks when airborne — grounded players never wall-detect.
export function checkWallCollision(
	player: PlayerState,
	stage: StageData,
): 'left' | 'right' | null {
	if (player.isGrounded) {
		return null;
	}

	for (const wall of stage.walls) {
		const dx = Math.abs(player.x - wall.x);

		if (
			dx <= PHYSICS.WALL_CONTACT_TOLERANCE_PX &&
			player.y >= wall.yTop &&
			player.y <= wall.yBottom
		) {
			return wall.id as 'left' | 'right';
		}
	}

	return null;
}

export function applyMovementInput(
	player: PlayerState,
	input: InputEvent,
): PlayerState {
	const stage: StageData = isHeld(input, INPUT_BITS.DOWN)
		? {
				...DEFAULT_STAGE,
				platforms: [],
			}
		: DEFAULT_STAGE;

	return applyKnockbackDecay(
		checkPlatformCollision(
			applyMovement(applyGravity(applyFastFall(player, input)), input),
			stage,
		),
	);
}
