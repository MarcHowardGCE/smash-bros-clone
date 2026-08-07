import { Buffer } from 'node:buffer';
import { decode, encode, ExtensionCodec } from '@msgpack/msgpack';
import { describe, expect, it } from 'vitest';
import { MoveId, PlayerStateEnum, type GameState, type PlayerId, type PlayerState, type StateSnapshot } from '@smash/shared';
import { GameEngine } from './GameEngine.js';
import { MatchSession } from './MatchSession.js';

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

function primePlayer(
	engine: GameEngine,
	playerId: PlayerId,
	overrides: Partial<PlayerState>,
): void {
	const state = (engine as unknown as { state: GameState }).state;
	const player = state.players[playerId];

	if (!player) {
		throw new Error(`Unknown player: ${playerId}`);
	}

	state.players[playerId] = {
		...player,
		...overrides,
	};
}

describe('MatchSession hit event broadcast wiring', () => {
	it('broadcastState includes hitEvents then clears them for next broadcast', () => {
		const packets: Uint8Array[] = [];
		const session = new MatchSession(
			['p1', 'p2'],
			(data) => {
				const bytes = data instanceof Buffer ? new Uint8Array(data) : data;
				packets.push(bytes);
			},
			() => {},
		);

		const sessionEngine = (session as unknown as { engine: GameEngine }).engine;
		primePlayer(sessionEngine, 'p1', {
			x: 640,
			y: 300,
			facing: 1,
			state: PlayerStateEnum.ATTACK,
			stateFrame: 2,
			isGrounded: true,
			isInvincible: false,
			invincibilityFrames: 0,
			hitlagFramesRemaining: 0,
			hitstunFramesRemaining: 0,
			currentMoveId: MoveId.JAB,
			hitPlayerIds: new Set<string>(),
			activeHitbox: {
				offsetX: 0,
				offsetY: 0,
				radius: 20,
				damage: 4,
				baseKnockback: 12,
				knockbackGrowth: 100,
				knockbackAngle: 45,
				hitlagFrames: 3,
				hitstunFrames: 8,
				priority: 2,
			},
		});

		primePlayer(sessionEngine, 'p2', {
			x: 650,
			y: 300,
			state: PlayerStateEnum.IDLE,
			stateFrame: 0,
			isGrounded: true,
			isInvincible: false,
			invincibilityFrames: 0,
			hitlagFramesRemaining: 0,
			hitstunFramesRemaining: 0,
			activeHitbox: null,
			currentMoveId: null,
		});

		(session as unknown as { processTick: () => void }).processTick();
		(session as unknown as { broadcastState: () => void }).broadcastState();
		(session as unknown as { broadcastState: () => void }).broadcastState();

		expect(packets).toHaveLength(2);

		const firstSnapshot = decode(packets[0] as Uint8Array, { extensionCodec }) as StateSnapshot;
		const secondSnapshot = decode(packets[1] as Uint8Array, { extensionCodec }) as StateSnapshot;

		expect(firstSnapshot.hitEvents).toHaveLength(1);
		expect(secondSnapshot.hitEvents).toEqual([]);
	});
});
