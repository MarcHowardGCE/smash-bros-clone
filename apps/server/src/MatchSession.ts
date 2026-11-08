import{INPUT_BITS,validStickInput}from'@smash/shared';
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
 * Drives one authoritative match at 60 Hz. Catch-up is capped at six steps
 * per callback to bound event-loop stalls. Snapshots target 20 Hz; a catch-up
 * batch sends one fully advanced state once at least three ticks have elapsed.
 * Control events use onPauseChange, separate from binary snapshot transport.
 * createApp owns socket routing, disconnect expiry and shutdown cleanup.
 */
interface MatchSessionConfig {
  stageId?:string;
	playerIds: PlayerId[];
	characterIds: Record<PlayerId, CharacterId>;
	onBroadcast: (data: Uint8Array | Buffer) => void;
	onMatchOver: (winnerId: PlayerId | null) => void;
  onPauseChange?: (paused: boolean) => void;
  now?: () => number;
}

/** @see {@link MatchSessionConfig} for constructor options. */
export class MatchSession {
  private readonly engine: GameEngine;
  private readonly inputQueue = new Map<PlayerId, InputEvent[]>();
  private readonly lastConfirmedSeq: Record<PlayerId, number> = {};
  private readonly onBroadcast: (data: Uint8Array | Buffer) => void;
  private readonly onMatchOver: (winnerId: PlayerId | null) => void;
  private readonly onPauseChange?: (paused: boolean) => void;
  private readonly inputNow: () => number;
  private readonly lastHeldInput = new Map<PlayerId, InputEvent>();
  private readonly inputReceivedAt = new Map<PlayerId, number>();
  private ticksSinceBroadcast = 0;
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
    this.engine = new GameEngine({ playerIds: config.playerIds, characterIds: config.characterIds,stageId:config.stageId });
    this.onBroadcast = config.onBroadcast;
    this.onMatchOver = config.onMatchOver;
    this.onPauseChange = config.onPauseChange;
    this.inputNow = config.now ?? (() => performance.now());

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
   * snapshots are broadcast. A `game:paused` control notification is emitted to all
   * clients immediately.
   *
   * No-ops if not running or already paused.
   */
  pause(): void {
    if (!this.isRunning || this.paused) return;
    this.paused = true;
    this.engine.clearActionBuffers();
    // Keep control notifications separate from snapshot data.
    // Keep the loop scheduling alive (don't call stop()), just skip tick processing.
    this.accumulator = 0;
    for (const queue of this.inputQueue.values()) queue.length = 0;
    this.lastHeldInput.clear();
    this.inputReceivedAt.clear();
    this.onPauseChange?.(true);
  }

  /**
   * Resumes a paused session.
   *
   * Resets `lastTime` to the current wall-clock instant so the accumulator
   * doesn't try to catch up on the entire pause duration. Emits a
   * `game:resumed` control notification to all clients.
   *
   * No-ops if not running or not paused.
   */
  resume(): void {
    if (!this.isRunning || !this.paused) return;
    this.paused = false;
    // Reset lastTime to prevent accumulator spike after pause duration.
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.onPauseChange?.(false);
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

    const newestSeq = queue[queue.length - 1]?.seq ?? this.lastConfirmedSeq[playerId] ?? -1;
    if (input.seq <= newestSeq) return;
    // Bound memory while preserving edge bits from an unusually busy tick.
    if (queue.length >= 120) {
      const merged = this.consumeLatestInput(queue);
      if (merged) queue.push(merged);
    }
    // Only the server may attach press-time aim from a previous queue drain.
    queue.push({ ...input, playerId, attackAim: undefined });
    this.inputReceivedAt.set(playerId, this.inputNow());
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
    this.accumulator = Math.min(this.accumulator + now - this.lastTime, TICK_MS * 6);
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
      this.ticksSinceBroadcast += 1;
      this.accumulator -= TICK_MS;
      processedTick = true;

      if (!this.isRunning) {
        return;
      }
    }

    // Broadcast AFTER draining the full accumulator, not mid-loop. This ensures the
    // snapshot reflects all ticks processed this wall-clock instant rather than a
    // partially-advanced simulation state.
    if (processedTick && this.ticksSinceBroadcast >= BROADCAST_EVERY) {
      this.ticksSinceBroadcast %= BROADCAST_EVERY;
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
      if (input) this.lastHeldInput.set(playerId, input);
      const previous = this.lastHeldInput.get(playerId);
      // Keep continuous buttons through short delivery gaps, never repeat edges.
      // A stale connection becomes neutral after 250 ms.
      const held = previous && this.inputNow() - (this.inputReceivedAt.get(playerId) ?? -Infinity) <= 250
        ? { ...previous, pressed: 0, released: 0 } : null;
      inputs.set(playerId, input ?? held);
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
      this.broadcastState();
      this.stop();
      this.onMatchOver(winnerId);
    }
  }

  get isPaused(): boolean { return this.paused; }

  /** Send current state without consuming events queued for the regular broadcast. */
  syncState(send: (data: Uint8Array) => void): void {
    const snapshot = this.engine.getSnapshot(performance.now(), { ...this.lastConfirmedSeq });
    send(encode({ ...snapshot, hitEvents: [] }, { extensionCodec }));
  }

  releaseInput(playerId: PlayerId): void {
    const queue = this.inputQueue.get(playerId);
    if (queue) queue.length = 0;
    this.lastHeldInput.delete(playerId);
    this.inputReceivedAt.delete(playerId);
  }

  forfeitPlayer(playerId: PlayerId): void {
    this.releaseInput(playerId);
    this.inputQueue.delete(playerId);
    this.engine.forfeitPlayer(playerId);
    this.broadcastState();
    if (this.engine.isMatchOver()) {
      this.stop();
      this.onMatchOver(this.engine.getWinnerId());
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
    if (typeof value !== 'object' || value === null) return false;
    const input = value as InputEvent;
    return Number.isSafeInteger(input.seq) && input.seq >= 0
      && Number.isSafeInteger(input.tick) && input.tick >= 0
      && [input.held, input.pressed, input.released].every(
        bits => Number.isInteger(bits) && bits >= 0 && bits <= 0xfff)
      && typeof input.playerId === 'string' && validStickInput(input);
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
        let attack:InputEvent|undefined;
        let sawFacePress=false;
        let dualJump=false;
		for (const input of queue) {
			pressed |= input.pressed;
            dualJump||=!!((input.pressed&INPUT_BITS.JUMP)&&input.jumpButtons===3);
            if(input.pressed&INPUT_BITS.ATTACK){
              // A tilt-only flick while face Attack is held cannot replace a fresh face command in this batch.
              const faceHeldAtPress=input.attackAim?.faceAttackHeld??input.faceAttackHeld;
              const blockedTilt=input.cStickTilt===true&&input.faceAttackPressed===false&&faceHeldAtPress&&
                Math.hypot(input.cStickX??0,input.cStickY??0)>=.55;
              if(!sawFacePress||!blockedTilt)attack=input;
              sawFacePress ||= input.faceAttackPressed===true;
            }
			released |= input.released;
		}

		// O(1) atomic drain — avoids the risk of new inputs arriving mid-shift() loop.
		queue.length = 0;
		return {
			...latest,
            ...(dualJump?{jumpButtons:3}:{}),
            attackAim: attack ? attack.attackAim ?? {held:attack.held,stickX:attack.stickX,stickY:attack.stickY,faceAttackHeld:attack.faceAttackHeld} : undefined,
            cStickX: attack?.cStickX, cStickY: attack?.cStickY, cStickTilt: attack?.cStickTilt,
            faceAttackPressed: attack?.faceAttackPressed,
            smashAttack: attack?.smashAttack,
            smashSensitivity: attack?.smashSensitivity ?? latest.smashSensitivity,
			pressed,
			released,
		};
	}
}
