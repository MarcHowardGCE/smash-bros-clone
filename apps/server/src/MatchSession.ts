import { Buffer } from 'node:buffer';
import { performance } from 'node:perf_hooks';
import { decode, encode } from '@msgpack/msgpack';
import type { InputEvent, PlayerId } from '@smash/shared';
import { GameEngine } from './GameEngine.js';

const TICK_MS = 1000 / 60;
const BROADCAST_EVERY = 3;

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

    if (processedTick && this.tickCount % BROADCAST_EVERY === 0) {
      this.broadcastState();
    }

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
    const encoded = encode(snapshot);
    this.onBroadcast(Buffer.from(encoded.buffer, encoded.byteOffset, encoded.byteLength));
  }

  private decodeInput(rawInput: InputEvent | Uint8Array | ArrayBuffer): InputEvent | null {
    if (this.isInputEvent(rawInput)) {
      return rawInput;
    }

    try {
      const decoded = decode(rawInput instanceof Uint8Array ? rawInput : new Uint8Array(rawInput));
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

		let pressed = 0;
		let released = 0;
		for (const input of queue) {
			pressed |= input.pressed;
			released |= input.released;
		}

		queue.length = 0;
		return {
			...latest,
			pressed,
			released,
		};
	}
}
