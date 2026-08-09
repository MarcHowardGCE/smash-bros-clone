import { decode, encode, ExtensionCodec } from '@msgpack/msgpack';
import { describe, expect, it } from 'vitest';
import { MoveId, PlayerStateEnum, type CharacterId, type PlayerState } from '@smash/shared';

const extensionCodec = new ExtensionCodec();
extensionCodec.register({
	type: 1,
	encode: (input: unknown): Uint8Array | null => {
		if (!(input instanceof Set)) {
			return null;
		}

		return encode(Array.from(input), { extensionCodec });
	},
	decode: (data: Uint8Array): Set<string> =>
		new Set<string>(decode(data, { extensionCodec }) as string[]),
});

describe('PlayerState msgpack serialization with characterId', () => {
	it('round-trip encodes and decodes PlayerState without characterId (backward compatibility)', () => {
		const playerState: PlayerState = {
			id: 'p1',
			slotIndex: 0,
			x: 640,
			y: 300,
			vx: 0,
			vy: 0,
			facing: 1,
			state: PlayerStateEnum.IDLE,
			stateFrame: 0,
			hitlagFramesRemaining: 0,
			hitstunFramesRemaining: 0,
			isTumbling: false,
			techWindowFrames: 0,
			techLockoutFrames: 0,
			lCancelWindowFrames: 0,
			landingLagFrames: 0,
			percent: 0,
			stocks: 3,
			isGrounded: true,
			isKnockedOut: false,
			hasDoubleJump: true,
			hasAirDodge: true,
			wallJumpStreak: 0,
			isFastFalling: false,
			isInvincible: false,
			invincibilityFrames: 0,
			isShielding: false,
			shieldHealth: 60,
			shieldStunFrames: 0,
			isGrabbing: false,
			grabbedPlayerId: null,
			ledgeId: null,
			activeHitbox: null,
			currentMoveId: null,
			staleMoveQueue: [],
			hitPlayerIds: new Set<string>(),
			chargeFrames: 0,
			respawnTimer: 0,
			airDodgeDirection: null,
			// characterId intentionally omitted to test backward compatibility
		};

		const encoded = encode(playerState, { extensionCodec });
		const decoded = decode(encoded, { extensionCodec }) as PlayerState;

		expect(decoded.id).toBe('p1');
		expect(decoded.x).toBe(640);
		expect(decoded.y).toBe(300);
		expect(decoded.percent).toBe(0);
		expect(decoded.stocks).toBe(3);
		expect(decoded.characterId).toBeUndefined();
	});

	it('round-trip encodes and decodes PlayerState with characterId', () => {
		const playerState: PlayerState = {
			id: 'p1',
			slotIndex: 0,
			x: 640,
			y: 300,
			vx: 0,
			vy: 0,
			facing: 1,
			state: PlayerStateEnum.IDLE,
			stateFrame: 0,
			hitlagFramesRemaining: 0,
			hitstunFramesRemaining: 0,
			isTumbling: false,
			techWindowFrames: 0,
			techLockoutFrames: 0,
			lCancelWindowFrames: 0,
			landingLagFrames: 0,
			percent: 0,
			stocks: 3,
			isGrounded: true,
			isKnockedOut: false,
			hasDoubleJump: true,
			hasAirDodge: true,
			wallJumpStreak: 0,
			isFastFalling: false,
			isInvincible: false,
			invincibilityFrames: 0,
			isShielding: false,
			shieldHealth: 60,
			shieldStunFrames: 0,
			isGrabbing: false,
			grabbedPlayerId: null,
			ledgeId: null,
			activeHitbox: null,
			currentMoveId: null,
			staleMoveQueue: [],
			hitPlayerIds: new Set<string>(),
			chargeFrames: 0,
			respawnTimer: 0,
			airDodgeDirection: null,
			characterId: 'abe-lincoln' as CharacterId,
		};

		const encoded = encode(playerState, { extensionCodec });
		const decoded = decode(encoded, { extensionCodec }) as PlayerState;

		expect(decoded.id).toBe('p1');
		expect(decoded.x).toBe(640);
		expect(decoded.y).toBe(300);
		expect(decoded.percent).toBe(0);
		expect(decoded.stocks).toBe(3);
		expect(decoded.characterId).toBe('abe-lincoln');
	});

	it('round-trip with all-rounder characterId', () => {
		const playerState: PlayerState = {
			id: 'p2',
			slotIndex: 1,
			x: 800,
			y: 400,
			vx: 5,
			vy: -10,
			facing: -1,
			state: PlayerStateEnum.AIRBORNE,
			stateFrame: 15,
			hitlagFramesRemaining: 0,
			hitstunFramesRemaining: 0,
			isTumbling: false,
			techWindowFrames: 0,
			techLockoutFrames: 0,
			lCancelWindowFrames: 0,
			landingLagFrames: 0,
			percent: 45,
			stocks: 2,
			isGrounded: false,
			isKnockedOut: false,
			hasDoubleJump: false,
			hasAirDodge: true,
			wallJumpStreak: 0,
			isFastFalling: false,
			isInvincible: false,
			invincibilityFrames: 0,
			isShielding: false,
			shieldHealth: 60,
			shieldStunFrames: 0,
			isGrabbing: false,
			grabbedPlayerId: null,
			ledgeId: null,
			activeHitbox: null,
			currentMoveId: MoveId.NEUTRAL_AIR,
			staleMoveQueue: [MoveId.JAB, MoveId.FORWARD_TILT],
			hitPlayerIds: new Set<string>(['p1']),
			chargeFrames: 0,
			respawnTimer: 0,
			airDodgeDirection: null,
			characterId: 'all-rounder' as CharacterId,
		};

		const encoded = encode(playerState, { extensionCodec });
		const decoded = decode(encoded, { extensionCodec }) as PlayerState;

		expect(decoded.id).toBe('p2');
		expect(decoded.x).toBe(800);
		expect(decoded.y).toBe(400);
		expect(decoded.vx).toBe(5);
		expect(decoded.vy).toBe(-10);
		expect(decoded.facing).toBe(-1);
		expect(decoded.state).toBe(PlayerStateEnum.AIRBORNE);
		expect(decoded.stateFrame).toBe(15);
		expect(decoded.percent).toBe(45);
		expect(decoded.stocks).toBe(2);
		expect(decoded.hasDoubleJump).toBe(false);
		expect(decoded.currentMoveId).toBe(MoveId.NEUTRAL_AIR);
		expect(decoded.staleMoveQueue).toEqual([MoveId.JAB, MoveId.FORWARD_TILT]);
		expect(decoded.hitPlayerIds).toEqual(new Set(['p1']));
		expect(decoded.characterId).toBe('all-rounder');
	});
});
