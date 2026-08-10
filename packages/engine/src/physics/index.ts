/**
 * @fileoverview Physics subsystem for the deterministic game engine.
 *
 * Every function here is a pure transformation: it takes immutable state and
 * returns new state. No mutation, no I/O, no randomness. This makes the physics
 * fully deterministic and trivially unit-testable.
 *
 * Execution order per tick (as composed in `applyMovementInput`):
 *   1. `applyFastFall`   — latch fast-fall flag from input
 *   2. `applyGravity`    — accumulate vertical velocity
 *   3. `applyMovement`   — integrate position from velocity + handle input-driven acceleration
 *   4. `checkPlatformCollision` — resolve landing, grounding, and blast-zone KOs
 *   5. `applyKnockbackDecay`   — bleed off horizontal knockback while in hitstun
 *
 * Jump and ledge/wall queries (`startJump`, `checkLedgeGrab`, `checkWallCollision`)
 * are called separately by the FSM at the appropriate state transitions.
 */

import {
	INPUT_BITS,
	type InputEvent,
	PHYSICS,
	type PlayerState,
	STAGE,
	getCharacterStats,
} from "@smash/shared";
import type { LedgeData, StageData, WallData } from "./types.js";

/**
 * Default stage geometry built from the shared `STAGE` constants.
 *
 * Used as the canonical stage for all physics queries when no custom stage is
 * provided. The server and client both import this so they run the same geometry
 * without duplicating the constant definitions.
 */
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

/**
 * Applies per-frame gravitational acceleration to an airborne player.
 *
 * Grounded players are held at platform height by `checkPlatformCollision` and
 * are returned unchanged. Both normal-fall and fast-fall share the same terminal
 * velocity ceiling (`PHYSICS.TERMINAL_VELOCITY`). Fast-fall only changes the
 * acceleration rate (`PHYSICS.GRAVITY * PHYSICS.FAST_FALL_MULTIPLIER`), not the cap.
 *
 * @param player - Current immutable player state.
 * @returns New player state with `vy` incremented by gravity (capped at terminal velocity).
 */
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

/**
 * Integrates player position from velocity and applies input-driven acceleration.
 *
 * During hitstun the player has no control — position is updated from existing
 * velocity only. Otherwise, ground and air movement are handled separately:
 * - **Ground**: walk/run acceleration with `PHYSICS.GROUND_FRICTION` when no input.
 * - **Air**: looser speed cap (8× the acceleration factor) for wide lateral freedom.
 *
 * @param player - Current immutable player state.
 * @param input - This frame's input event (bitmask for held/pressed buttons).
 * @returns New player state with updated `vx`, `x`, and `y`.
 */
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

/**
 * Decays horizontal knockback velocity while a player is in hitstun.
 *
 * Applied every frame during hitstun so the player gradually slows rather than
 * travelling at full knockback speed until the hitstun window ends. Players not
 * in hitstun are returned unchanged.
 *
 * @param player - Current immutable player state.
 * @returns New player state with `vx` multiplied by 0.95, or the original state
 *   if `hitstunFramesRemaining` is zero.
 */
export function applyKnockbackDecay(player: PlayerState): PlayerState {
	if (player.hitstunFramesRemaining <= 0) {
		return player;
	}

	return {
		...player,
		vx: player.vx * 0.95,
	};
}

/**
 * Applies Directional Influence (DI) to a knockback angle.
 *
 * DI lets a defender steer their launch trajectory by holding a direction at
 * the moment of impact. The input is projected onto the perpendicular axis of
 * the knockback vector; that component shifts the angle by up to
 * `MAX_DI_ANGLE_RADIANS` (≈18°, matching Melee/Brawl-style DI).
 *
 * **Design choice — 18° vs. ~9.74°**: The wider Melee cone gives players more
 * agency over their survival trajectory. Smash 4/Ultimate narrowed this to
 * roughly 9.74° to reduce "DIing off the top" exploits, but we favour the
 * broader player control the Melee cone provides.
 *
 * The perpendicular-only projection means pushing directly into or away from
 * the knockback direction has no DI effect, which matches authentic Smash DI
 * behaviour.
 *
 * @param knockbackAngle - Launch angle in radians (0 = right, π/2 = up).
 * @param inputX - Horizontal stick input in the range [-1, 1].
 * @param inputY - Vertical stick input in the range [-1, 1].
 * @param _facing - Attacker facing direction (reserved for future SDI use).
 * @returns Adjusted knockback angle in radians, clamped within ±18° of the original.
 */
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
/**
 * Sets the initial upward velocity for a jump.
 *
 * Called by GameEngine when the `JUMPSQUAT → AIRBORNE` FSM transition fires.
 * Whether the jump is a full hop or short hop is determined by how long the
 * JUMP button was held — the caller evaluates that before passing `isShortHop`.
 *
 * For a double jump: consumes `hasDoubleJump` and bypasses the `isGrounded`
 * check, so the player gets one aerial re-jump regardless of current `vy`.
 * If `hasDoubleJump` is already false the player is returned unchanged.
 *
 * @param player - Current immutable player state.
 * @param isShortHop - `true` to use `shortHopVelocity`, `false` for `jumpVelocity`.
 * @returns New player state with `vy` set and `isGrounded`/`isFastFalling` cleared,
 *   or the original state if a double jump is not available.
 */
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

/**
 * Evaluates a jump input and calls `startJump` if the JUMP button was pressed.
 *
 * Short-hop vs. full-hop is decided here: if the button was held for fewer than
 * `PHYSICS.SHORT_HOP_THRESHOLD_FRAMES` frames the jump is classified as a short hop.
 *
 * @param player - Current immutable player state.
 * @param input - This frame's input event.
 * @param jumpHeldFrames - Number of consecutive frames JUMP has been held.
 * @returns New player state from `startJump`, or the original state if JUMP was
 *   not pressed this frame.
 */
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

/**
 * Latches the fast-fall flag when the player presses DOWN while falling.
 *
 * Fast fall activates only when the player is airborne, not already fast-falling,
 * holding DOWN, and moving downward (`vy >= 0`). The `vy >= 0` guard prevents
 * fast fall from triggering on the way up, which would cancel the jump arc.
 *
 * Once `isFastFalling` is latched `true`, `applyGravity` applies
 * `PHYSICS.GRAVITY * PHYSICS.FAST_FALL_MULTIPLIER` per frame until landing.
 *
 * @param player - Current immutable player state.
 * @param input - This frame's input event.
 * @returns New player state with `isFastFalling` set to `true`, or the original
 *   state if the fast-fall conditions are not met.
 */
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

/**
 * Resolves platform landing and blast-zone KO detection each tick.
 *
 * Evaluation order:
 * 1. **Blast zones** — any position outside stage boundaries sets `isKnockedOut`.
 * 2. **Grounding check** — if the player was grounded but is no longer over a
 *    platform, `isGrounded` is cleared (e.g. walking off an edge).
 * 3. **Landing** — uses `crossesPlatformTop` to detect tunneling: the player's
 *    bottom edge must cross the platform surface between the previous and current
 *    frame. Only fires when `vy >= 0`; upward movement passes freely through
 *    soft-platform bottoms, matching Smash Bros behaviour.
 *
 * Players in hitstun cannot land on soft (non-solid) platforms — they pass
 * through and only the main solid platform can catch them.
 *
 * @param player - Current immutable player state (position already updated by `applyMovement`).
 * @param stage - Stage geometry to test against.
 * @returns New player state with `isKnockedOut`, `isGrounded`, `vy`, and `y` updated
 *   as appropriate, or the original state if no collision applies.
 */
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
/**
 * Queries whether the player is within ledge-grab range of any stage ledge.
 *
 * This is a pure geometric query — it does not mutate state. The GameEngine calls
 * it after movement and collision resolution so that landing and ledge-eligibility
 * remain separate concerns.
 *
 * Players cannot grab ledges while grounded or while in hitstun.
 *
 * @param player - Current immutable player state.
 * @param stage - Stage geometry containing the `ledges` array.
 * @returns The matching `LedgeData` if the player is within `PHYSICS.LEDGE_GRAB_RADIUS`
 *   horizontally and `PHYSICS.LEDGE_GRAB_VERTICAL_TOLERANCE` vertically of a ledge,
 *   or `null` if no ledge is in range.
 */
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
/**
 * Queries whether the player is touching a stage wall while airborne.
 *
 * Pure geometric query — no state mutation. Called by GameEngine after movement
 * resolution for wall-tech and wall-jump detection. Grounded players are always
 * returned `null` because wall interactions only apply in the air.
 *
 * @param player - Current immutable player state.
 * @param stage - Stage geometry containing the `walls` array.
 * @returns `'left'` or `'right'` (the wall's id) if the player's x position is
 *   within `PHYSICS.WALL_CONTACT_TOLERANCE_PX` of a wall and their y is within
 *   the wall's vertical span, or `null` if no wall is in contact range.
 */
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

/**
 * Convenience pipeline that composes the per-tick physics steps in order.
 *
 * Execution sequence:
 * 1. `applyFastFall`          — latch fast-fall from DOWN input
 * 2. `applyGravity`           — accumulate `vy`
 * 3. `applyMovement`          — integrate position + apply horizontal acceleration
 * 4. `checkPlatformCollision` — resolve landing / blast-zone KO
 * 5. `applyKnockbackDecay`    — bleed off `vx` during hitstun
 *
 * When the DOWN button is held, soft platforms are removed from the stage so
 * the player can drop through them (the main solid platform is always present).
 *
 * @param player - Current immutable player state.
 * @param input - This frame's input event.
 * @returns New player state after all five physics steps have been applied.
 */
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
