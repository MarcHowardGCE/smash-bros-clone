/**
 * @fileoverview Authoritative fixed-timestep game loop for a single match.
 *
 * Runs a 60 Hz tick loop driven by `setImmediate` + a `performance.now()` accumulator.
 * Every third tick (20 Hz) the full game snapshot is msgpack-encoded and broadcast
 * to all players in the room as a binary `game:state` event.
 */

import { Buffer } from 'node:buffer';
import { performance } from 'node:perf_hooks';
import { decode, encode, ExtensionCodec } from '@msgpack/msgpack';
import type { CharacterId, InputEvent, PlayerId } from '@smash/shared';
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
 * Authoritative fixed-timestep game loop for a single match.
 *
 * Owns one {@link GameEngine} instance and drives it at 60 Hz via a
 * `setImmediate` + `performance.now()` accumulator loop. Every three ticks
 * (20 Hz) it encodes the full game snapshot with msgpack and forwards it to
 * all room members through the injected `onBroadcast` callback.
 *
 * @remarks
 * **Why `setImmediate` instead of `setInterval` / `setTimeout`**
 *
 * `setImmediate` fires after I/O callbacks but before any `setTimeout` /
 * `setInterval` callbacks in the same event loop iteration. This gives tighter,
 * more consistent scheduling than `setInterval` (which can drift and stack
 * multiple callbacks when the process is busy) or `setTimeout(fn, 16)` (which
 * has a minimum ~1 ms variance and accumulates jitter across hundreds of ticks
 * per second). The tick runs as soon as I/O has drained, not after an arbitrary
 * timer delay.
 *
 * **Why the fixed-timestep accumulator pattern**
 *
 * `accumulator += deltaTime` then `while (accumulator >= TICK_MS)` prevents the
 * "spiral of death". If one tick takes longer than TICK_MS (e.g. a GC pause),
 * the accumulator simply grows. On the next loop call we run as many
 * TICK_MS-sized steps as needed to drain it, keeping simulation time aligned
 * with wall-clock time even under CPU spikes. A naive `setInterval` approach
 * would either skip ticks or run them late, causing the simulation to fall
 * behind real time permanently.
 *
 * **Why `BROADCAST_EVERY = 3`**
 *
 * Game simulation runs at 60 Hz (TICK_MS ~16.67 ms). Broadcasting every tick
 * would send 60 snapshots/second — far more than necessary and expensive on
 * bandwidth. Broadcasting every 3 ticks gives 20 snapshots/second, sufficient
 * for smooth client-side interpolation. The client's InterpolationBuffer stores
 * the last 3 snapshots and lerps remote player positions between them, producing
 * visually smooth 60 fps rendering from a 20 Hz update stream.
 *
 * **Why callbacks (`onBroadcast`, `onMatchOver`) rather than owning a socket**
 *
 * Injecting transport callbacks instead of passing a socket directly decouples
 * the game simulation from the networking layer. `MatchSession` (and the
 * `GameEngine` it wraps) can be instantiated and exercised in unit tests without
 * any socket infrastructure. The caller (RoomManager) decides how to route the
 * encoded snapshot — over one socket, a broadcast room, or a test spy — without
 * any changes to this class.
 */

interface MatchSessionConfig {
	playerIds: PlayerId[];
	characterIds: Record<PlayerId, CharacterId>;
	onBroadcast: (data: Uint8Array | Buffer) => void;
	onMatchOver: (winnerId: PlayerId) => void;
}

/** @see {@link MatchSessionConfig} for constructor options. */
export class MatchSession {
  private readonly engine: GameEngine;
  private readonly inputQueue = new Map<PlayerId, InputEvent[]>();
  private readonly lastConfirmedSeq: Record<PlayerId, number> = {};
  private readonly characterIds: Record<PlayerId, CharacterId>;
  private readonly onBroadcast: (data: Uint8Array | Buffer) => void;
  private readonly onMatchOver: (winnerId: PlayerId) => void;
  private tickCount = 0;
  private isRunning = false;
  private paused = false;
  private accumulator = 0;
  private lastTime = 0;
  private loopHandle: ReturnType<typeof setImmediate> | null = null;

  /**
   * Creates a new MatchSession.
   * @param config - Player IDs, character selections, and transport callbacks.
   */
  constructor(config: MatchSessionConfig) {
    this.engine = new GameEngine({ playerIds: config.playerIds });
    this.characterIds = config.characterIds;
    this.onBroadcast = config.onBroadcast;
    this.onMatchOver = config.onMatchOver;

    for (const playerId of config.playerIds) {
      this.inputQueue.set(playerId, []);
      this.lastConfirmedSeq[playerId] = -1;
    }
  }

  /**
   * Starts the tick loop. No-ops if already running.
   * Resets the accumulator and captures the current wall-clock time as the
   * loop's time origin.
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.accumulator = 0;
    this.lastTime = performance.now();
    this.loop();
  }

  /**
   * Stops the tick loop immediately, cancelling any pending `setImmediate` handle.
   * Safe to call from within a tick callback.
   */
  stop(): void {
    this.isRunning = false;
    if (this.loopHandle) {
      clearImmediate(this.loopHandle);
      this.loopHandle = null;
    }
  }

  /**
   * Pauses simulation without stopping the loop scheduler.
   *
   * While paused the accumulator continues draining each `setImmediate` call
   * (preventing a spike on resume), but no game ticks are processed and no
   * snapshots are broadcast. A `game:paused` msgpack event is emitted to all
   * clients immediately.
   *
   * No-ops if not running or already paused.
   */
  pause(): void {
    if (!this.isRunning || this.paused) return;
    this.paused = true;
    // Broadcast pause event as a simple msgpack-encoded object.
    // Keep the loop scheduling alive (don't call stop()), just skip tick processing.
    const pauseEvent = encode({ type: 'game:paused' }, { extensionCodec });
    this.onBroadcast(Buffer.from(pauseEvent.buffer, pauseEvent.byteOffset, pauseEvent.byteLength));
  }

  /**
   * Resumes a paused session.
   *
   * Resets `lastTime` to the current wall-clock instant so the accumulator
   * doesn't try to catch up on the entire pause duration. Emits a
   * `game:resumed` msgpack event to all clients.
   *
   * No-ops if not running or not paused.
   */
  resume(): void {
    if (!this.isRunning || !this.paused) return;
    this.paused = false;
    // Reset lastTime to prevent accumulator spike after pause duration.
    this.lastTime = performance.now();
    const resumeEvent = encode({ type: 'game:resumed' }, { extensionCodec });
    this.onBroadcast(Buffer.from(resumeEvent.buffer, resumeEvent.byteOffset, resumeEvent.byteLength));
  }

  /**
   * Enqueues a player input for the next tick.
   *
   * Accepts either a decoded {@link InputEvent} or raw msgpack bytes (Uint8Array
   * / ArrayBuffer) sent directly from the client over the binary WebSocket
   * transport. Inputs are silently dropped while the session is paused.
   *
   * @param playerId - The player whose input this belongs to.
   * @param rawInput - Decoded event or raw msgpack bytes.
   */
  queueInput(playerId: PlayerId, rawInput: InputEvent | Uint8Array | ArrayBuffer): void {
    // Drop inputs when paused. Buffering them would cause a burst of stale inputs on
    // resume (e.g., 10 seconds of accumulated "held RIGHT" would replay and desync the
    // client's prediction). Dropping ensures clean state on resume.
    if (this.paused) return;

    const queue = this.inputQueue.get(playerId);
    if (!queue) return;

    const input = this.decodeInput(rawInput);
    if (!input) return;

		queue.push(input);
  }

  /**
   * Core `setImmediate` callback — advances the accumulator, runs as many
   * fixed-size ticks as needed, optionally broadcasts, then reschedules itself.
   *
   * @remarks
   * **Tick accumulator pattern:**
   * Each call computes `deltaTime = now - lastTime` and adds it to `accumulator`.
   * The `while (accumulator >= TICK_MS)` loop then drains it in TICK_MS-sized
   * steps. This means if a single callback fires 32 ms late (two ticks worth),
   * we process two simulation steps before rescheduling — keeping wall-clock
   * and simulation time aligned. Without this, a late callback would process
   * only one step, causing the simulation to drift behind real time permanently.
   *
   * Broadcast happens once per callback after the entire accumulator is drained,
   * not mid-loop, so the snapshot always reflects a fully advanced simulation
   * state for that wall-clock instant.
   */
  private loop(): void {
    if (!this.isRunning) return;

    const now = performance.now();
    this.accumulator += now - this.lastTime;
    this.lastTime = now;

    let processedTick = false;
    while (this.accumulator >= TICK_MS) {
      // When paused, drain accumulator without processing ticks. This prevents a massive
      // accumulator spike when resuming after a long pause (e.g., 10 seconds paused would
      // otherwise try to process 600 ticks in one loop call on resume).
      if (this.paused) {
        this.accumulator -= TICK_MS;
        continue;
      }

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

  /**
   * Drains each player's input queue for this tick, advances the engine one
   * fixed step, logs a state hash every 60 ticks for determinism checks, and
   * triggers match-over handling if the engine reports the match has ended.
   */
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

  /**
   * Encodes the current game snapshot with msgpack and passes it to the
   * `onBroadcast` callback. Character selections are injected into each
   * player's snapshot entry before encoding since the `GameEngine` doesn't
   * store character metadata.
   */
  private broadcastState(): void {
    const snapshot = this.engine.getSnapshot(performance.now(), this.lastConfirmedSeq);
    // Forward character selections to each player in the snapshot
    for (const playerId in snapshot.players) {
      const player = snapshot.players[playerId];
      if (player) {
        player.characterId = this.characterIds[playerId];
      }
    }
    // msgpack binary encoding is ~3× smaller than JSON for PlayerState structs
    // (binary ints vs. string-encoded numbers). At 20 Hz × 4 players this is the
    // hottest network write in the server; every byte saved reduces bandwidth and
    // client decode time.
		const encoded = encode(snapshot, { extensionCodec });
    this.onBroadcast(Buffer.from(encoded.buffer, encoded.byteOffset, encoded.byteLength));
		this.engine.clearHitEvents();
  }

  /**
   * Normalises a raw socket payload to an {@link InputEvent}.
   *
   * Accepts an already-decoded `InputEvent` object (from tests or internal
   * callers) or raw msgpack bytes (Uint8Array / ArrayBuffer) sent over the
   * binary WebSocket transport. Returns `null` on any decode or validation
   * failure so malformed client data is silently dropped.
   */
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

  /**
   * Type guard that checks whether an unknown value conforms to the
   * {@link InputEvent} shape. Used to validate decoded msgpack payloads before
   * passing them into the simulation.
   */
  private isInputEvent(value: unknown): value is InputEvent {
    return typeof value === 'object' && value !== null
      && typeof (value as InputEvent).seq === 'number'
      && typeof (value as InputEvent).tick === 'number'
      && typeof (value as InputEvent).held === 'number'
      && typeof (value as InputEvent).pressed === 'number'
      && typeof (value as InputEvent).released === 'number'
      && typeof (value as InputEvent).playerId === 'string';
  }

	/**
	 * Consumes all inputs queued since the last tick and merges them into a
	 * single {@link InputEvent} for this tick window.
	 *
	 * `pressed` and `released` bits are OR-ed across every queued input so that
	 * a button-press that arrived between two server ticks is never silently
	 * dropped. The continuous `held` state is taken from the latest input only
	 * since it represents current intent. The queue is drained atomically in
	 * O(1) to avoid races with new inputs arriving mid-drain.
	 *
	 * @param queue - Mutable input queue for one player. Emptied by this call.
	 * @returns Merged input, or `null` if the queue was empty.
	 */
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
