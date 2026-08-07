import { Buffer } from 'node:buffer';
import { performance } from 'node:perf_hooks';
import { decode, encode, ExtensionCodec } from '@msgpack/msgpack';
import type { InputEvent, PlayerId } from '@smash/shared';
import { GameEngine } from './GameEngine.js';

const TICK_MS = 1000 / 60;
const BROADCAST_EVERY = 3;

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

/**
 * MatchSession — authoritative fixed-timestep game loop for a single match.
 *
 * ## Why `setImmediate` instead of `setInterval` / `setTimeout`
 * `setImmediate` fires after I/O callbacks but before any `setTimeout` / `setInterval`
 * callbacks in the same event loop iteration. This gives us tighter, more consistent
 * scheduling than `setInterval` (which can drift and stack multiple callbacks when the
 * process is busy) or `setTimeout(fn, 16)` (which has a minimum ~1 ms variance and can
 * accumulate jitter across hundreds of ticks per second). We want the tick to run as
 * soon as I/O has had a chance to drain — not after an arbitrary timer delay.
 *
 * ## Why the fixed-timestep accumulator pattern
 * `accumulator += deltaTime` then `while (accumulator >= TICK_MS)` prevents the
 * "spiral of death". If one tick takes longer than TICK_MS (e.g., a GC pause), the
 * accumulator simply grows. On the next loop call we run as many TICK_MS-sized steps as
 * needed to drain the accumulator, keeping simulation time aligned with wall-clock time
 * even under CPU spikes. A naïve `setInterval` approach would either skip ticks or run
 * them late, causing the simulation to fall behind real time permanently.
 *
 * ## Why `BROADCAST_EVERY = 3`
 * Game simulation runs at 60 Hz (TICK_MS ≈ 16.67 ms). Broadcasting every tick would
 * send 60 snapshots/second — far more than necessary and expensive on bandwidth.
 * Broadcasting every 3 ticks gives 20 snapshots/second, which is sufficient for smooth
 * client-side interpolation. The client's InterpolationBuffer stores the last 3 snapshots
 * and lerps remote player positions between them, producing visually smooth 60 fps
 * rendering from a 20 Hz update stream.
 *
 * ## Why callbacks (`onBroadcast`, `onMatchOver`) rather than owning a socket
 * Injecting transport callbacks instead of passing a socket directly decouples the game
 * simulation from the networking layer. `MatchSession` (and the `GameEngine` it wraps)
 * can be instantiated and exercised in unit tests without any socket infrastructure. The
 * caller (RoomManager) decides how to route the encoded snapshot — over one socket, a
 * broadcast room, or a test spy — without any changes to this class.
 */
export class MatchSession {
  private readonly engine: GameEngine;
  private readonly inputQueue = new Map<PlayerId, InputEvent[]>();
  private readonly lastConfirmedSeq: Record<PlayerId, number> = {};
  private readonly onBroadcast: (data: Uint8Array | Buffer) => void;
  private readonly onMatchOver: (winnerId: PlayerId) => void;
  private tickCount = 0;
  private isRunning = false;
  private accumulator = 0;
  private lastTime = 0;
  private loopHandle: ReturnType<typeof setImmediate> | null = null;

  constructor(
    playerIds: PlayerId[],
    onBroadcast: (data: Uint8Array | Buffer) => void,
    onMatchOver: (winnerId: PlayerId) => void,
  ) {
    this.engine = new GameEngine({ playerIds });
    this.onBroadcast = onBroadcast;
    this.onMatchOver = onMatchOver;

    for (const playerId of playerIds) {
      this.inputQueue.set(playerId, []);
      this.lastConfirmedSeq[playerId] = -1;
    }
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.accumulator = 0;
    this.lastTime = performance.now();
    this.loop();
  }

  stop(): void {
    this.isRunning = false;
    if (this.loopHandle) {
      clearImmediate(this.loopHandle);
      this.loopHandle = null;
    }
  }

  queueInput(playerId: PlayerId, rawInput: InputEvent | Uint8Array | ArrayBuffer): void {
    const queue = this.inputQueue.get(playerId);
    if (!queue) return;

    const input = this.decodeInput(rawInput);
    if (!input) return;

		queue.push(input);
  }

  private loop(): void {
    if (!this.isRunning) return;

    const now = performance.now();
    this.accumulator += now - this.lastTime;
    this.lastTime = now;

    let processedTick = false;
    while (this.accumulator >= TICK_MS) {
      this.processTick();
      this.tickCount += 1;
      this.accumulator -= TICK_MS;
      processedTick = true;

      if (!this.isRunning) {
        return;
      }
    }

    // Broadcast AFTER draining the full accumulator, not mid-loop. This ensures the
    // snapshot reflects all ticks processed this wall-clock instant rather than a
    // partially-advanced simulation state.
    if (processedTick && this.tickCount % BROADCAST_EVERY === 0) {
      this.broadcastState();
    }

    // Yield to the event loop via setImmediate so I/O callbacks (incoming socket messages)
    // can be processed between ticks. Direct recursion would starve I/O entirely.
    this.loopHandle = setImmediate(() => this.loop());
  }

  private processTick(): void {
    const inputs = new Map<PlayerId, InputEvent | null>();
    for (const [playerId, queue] of this.inputQueue.entries()) {
			const input = this.consumeLatestInput(queue);
			inputs.set(playerId, input);
			if (input) {
				this.lastConfirmedSeq[playerId] = input.seq;
			}
    }

    this.engine.tickGame(inputs);

		// Determinism check: server and client both log this hash at the same tick count.
		// A mismatch between server and client logs means the simulations have diverged.
		if (this.tickCount > 0 && this.tickCount % 60 === 0) {
			console.log(
				`[state-hash][server] tick=${this.tickCount} ${this.engine.getStateHash()}`,
			);
		}

    if (this.engine.isMatchOver()) {
      const winnerId = this.engine.getWinnerId();
      if (winnerId) {
        this.onMatchOver(winnerId);
      }
      this.stop();
    }
  }

  private broadcastState(): void {
    const snapshot = this.engine.getSnapshot(performance.now(), this.lastConfirmedSeq);
    // msgpack binary encoding is ~3× smaller than JSON for PlayerState structs
    // (binary ints vs. string-encoded numbers). At 20 Hz × 4 players this is the
    // hottest network write in the server; every byte saved reduces bandwidth and
    // client decode time.
		const encoded = encode(snapshot, { extensionCodec });
    this.onBroadcast(Buffer.from(encoded.buffer, encoded.byteOffset, encoded.byteLength));
		this.engine.clearHitEvents();
  }

  private decodeInput(rawInput: InputEvent | Uint8Array | ArrayBuffer): InputEvent | null {
    if (this.isInputEvent(rawInput)) {
      return rawInput;
    }

    try {
			const decoded = decode(
				rawInput instanceof Uint8Array ? rawInput : new Uint8Array(rawInput),
				{ extensionCodec },
			);
      return this.isInputEvent(decoded) ? decoded : null;
    } catch {
      return null;
    }
  }

  private isInputEvent(value: unknown): value is InputEvent {
    return typeof value === 'object' && value !== null
      && typeof (value as InputEvent).seq === 'number'
      && typeof (value as InputEvent).tick === 'number'
      && typeof (value as InputEvent).held === 'number'
      && typeof (value as InputEvent).pressed === 'number'
      && typeof (value as InputEvent).released === 'number'
      && typeof (value as InputEvent).playerId === 'string';
  }

	private consumeLatestInput(queue: InputEvent[]): InputEvent | null {
		if (queue.length === 0) {
			return null;
		}

		const latest = queue[queue.length - 1];
		if (!latest) {
			queue.length = 0;
			return null;
		}

		// `pressed` and `released` are one-frame event bits — a player who pressed JUMP
		// between two server ticks must not have that input silently dropped. ORing all
		// queued inputs' pressed/released bits ensures every button-press event within
		// this tick window is preserved. The continuous `held` state from the latest input
		// is sufficient for positional intent.
		let pressed = 0;
		let released = 0;
		for (const input of queue) {
			pressed |= input.pressed;
			released |= input.released;
		}

		// O(1) atomic drain — avoids the risk of new inputs arriving mid-shift() loop.
		queue.length = 0;
		return {
			...latest,
			pressed,
			released,
		};
	}
}
