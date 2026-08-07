import { decode, encode, ExtensionCodec } from '@msgpack/msgpack';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import type { InputEvent, PlayerId, StateSnapshot, HitEventData } from '@smash/shared';
import { InputManager } from '../input/InputManager.js';
import { InterpolationBuffer, type RenderState } from './InterpolationBuffer.js';
import { LocalPredictor } from './LocalPredictor.js';

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

export interface GameClientOptions {
  serverUrl: string;
  onConnected?: () => void;
  onPlayerAssigned?: (playerId: PlayerId, roomCode: string) => void;
  onRenderState: (state: RenderState, localPlayerId: PlayerId) => void;
  onMatchPhaseChange: (phase: string, winnerId?: PlayerId | null) => void;
  onRoomCreated: (roomCode: string, playerId: PlayerId) => void;
  onPlayerJoined: (slotIndex: number) => void;
  onHitEvents?: (hitEvents: HitEventData[]) => void;
  onPaused?: () => void;
  onResumed?: () => void;
}

export class GameClient {
  private readonly socket: Socket;
  private readonly interpolationBuffer = new InterpolationBuffer();
  private readonly inputManager = new InputManager();
  private predictor: LocalPredictor | null = null;
  private myPlayerId: PlayerId | null = null;
  private myRoomCode: string | null = null;
  private currentTick = 0;
  private readonly options: GameClientOptions;
  private rafHandle: number | null = null;
  private paused = false;

  constructor(options: GameClientOptions) {
    this.options = options;
    this.socket = io(options.serverUrl, {
      transports: ['websocket'],
      reconnection: false,
    });

    this.setupSocketHandlers();
  }

  createRoom(): void {
    this.socket.emit('room:create', (data: { roomCode: string; playerId: PlayerId; slotIndex: number }) => {
      this.myPlayerId = data.playerId;
      this.myRoomCode = data.roomCode;
      this.inputManager.setPlayerId(data.playerId);
      this.options.onPlayerAssigned?.(data.playerId, data.roomCode);
      this.options.onRoomCreated(data.roomCode, data.playerId);
      this.options.onPlayerJoined(data.slotIndex);
    });
  }

  joinRoom(roomCode: string): void {
    this.socket.emit(
      'room:join',
      roomCode,
      (data: { playerId: PlayerId; slotIndex: number } | { error: string }) => {
        if ('error' in data) {
          console.error('[client] join error:', data.error);
          return;
        }

        this.myPlayerId = data.playerId;
        this.myRoomCode = roomCode.toUpperCase();
        this.inputManager.setPlayerId(data.playerId);
        this.options.onPlayerAssigned?.(data.playerId, this.myRoomCode);
        this.options.onPlayerJoined(data.slotIndex);
      },
    );
  }

  markReady(): void {
    if (this.myRoomCode) {
      this.socket.emit('player:ready', this.myRoomCode);
    }
  }

  get isPaused(): boolean {
    return this.paused;
  }

  emitPause(): void {
    if (this.paused) return;
    this.paused = true;
    this.socket.emit('game:pause');
  }

  emitResume(): void {
    if (!this.paused) return;
    this.socket.emit('game:resume');
  }

  disconnect(): void {
    this.stopRenderLoop();
    this.socket.disconnect();
  }

	debugSendInput(input: Pick<InputEvent, 'held' | 'pressed' | 'released'>): void {
		if (!this.myPlayerId) {
			return;
		}

		const event: InputEvent = {
			tick: this.currentTick,
			seq: Date.now(),
			playerId: this.myPlayerId,
			held: input.held,
			pressed: input.pressed,
			released: input.released,
		};

		this.predictor?.onInput(event);
		this.sendInput(event);
	}

	getLatestSnapshot(): StateSnapshot | null {
		return this.interpolationBuffer.getLatestSnapshot();
	}

  private setupSocketHandlers(): void {
    this.socket.on('connect', () => {
      console.log('[client] connected to server:', this.socket.id);
      this.options.onConnected?.();
    });

    this.socket.on('connect_error', (error) => {
      console.error('[client] connect error:', error.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[client] disconnected:', reason);
      this.stopRenderLoop();
      this.interpolationBuffer.clear();
      this.predictor = null;
    });

    this.socket.on('room:playerJoined', (data: { playerId: PlayerId; slotIndex: number }) => {
      console.log('[client] player joined:', data);
      this.options.onPlayerJoined(data.slotIndex);
    });

    this.socket.on('game:countdown', (data: { seconds: number }) => {
      console.log('[client] countdown:', data.seconds);
      this.options.onMatchPhaseChange('countdown');
    });

    this.socket.on('game:start', (data: { playerIds: PlayerId[] }) => {
      console.log('[client] match started, players:', data.playerIds);
      this.interpolationBuffer.clear();
      this.predictor = null;
      this.options.onMatchPhaseChange('match');
      this.startRenderLoop();
    });

    this.socket.on('game:state', (binaryData: ArrayBuffer | Uint8Array) => {
      try {
        const data = binaryData instanceof Uint8Array ? binaryData : new Uint8Array(binaryData);
			const snapshot = decode(data, { extensionCodec }) as StateSnapshot;
        this.currentTick = snapshot.tick;
        this.inputManager.setCurrentTick(this.currentTick);
        this.interpolationBuffer.pushSnapshot(snapshot);
        if (snapshot.tick > 0 && snapshot.tick % 60 === 0) {
          console.log(`[state-hash][client] tick=${snapshot.tick} ${this.getStateHash(snapshot)}`);
        }

        if (snapshot.hitEvents && snapshot.hitEvents.length > 0) {
          this.options.onHitEvents?.(snapshot.hitEvents);
        }

        if (this.predictor) {
          this.predictor.onServerSnapshot(snapshot);
        } else if (this.myPlayerId) {
          const playerState = snapshot.players[this.myPlayerId];
          if (!playerState) {
            return;
          }

          this.predictor = new LocalPredictor(this.myPlayerId);
          this.predictor.initialize(playerState);
        }
      } catch (error) {
        console.error('[client] failed to decode game state:', error);
      }
    });

    this.socket.on('game:paused', () => {
      console.log('[client] game paused by server');
      this.paused = true;
      this.options.onPaused?.();
    });

    this.socket.on('game:resumed', () => {
      console.log('[client] game resumed by server');
      this.paused = false;
      this.options.onResumed?.();
    });

    this.socket.on('game:over', (data: { winnerId: PlayerId }) => {
      console.log('[client] match over, winner:', data.winnerId);
      this.paused = false;
      this.options.onMatchPhaseChange('result', data.winnerId);
      this.stopRenderLoop();
    });
  }

  private startRenderLoop(): void {
    if (this.rafHandle !== null) {
      return;
    }

    const loop = () => {
      this.renderTick();
      this.rafHandle = requestAnimationFrame(loop);
    };

    this.rafHandle = requestAnimationFrame(loop);
  }

  private stopRenderLoop(): void {
    if (this.rafHandle !== null) {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }
  }

  private renderTick(): void {
    if (!this.myPlayerId) {
      return;
    }

    if (!this.paused) {
      const inputEvent = this.inputManager.pollInput();
      if (inputEvent) {
        this.predictor?.onInput(inputEvent);
        this.sendInput(inputEvent);
      }
    }

    const interpolated = this.interpolationBuffer.getInterpolatedState(performance.now(), this.myPlayerId);
    if (!interpolated) {
      return;
    }

    const predictedLocal = this.predictor?.getPredictedState();
    if (predictedLocal) {
      interpolated.players.set(this.myPlayerId, {
        id: predictedLocal.id,
        slotIndex: predictedLocal.slotIndex,
        x: predictedLocal.x,
        y: predictedLocal.y,
        vx: predictedLocal.vx,
        vy: predictedLocal.vy,
        facing: predictedLocal.facing,
        state: predictedLocal.state,
        stateFrame: predictedLocal.stateFrame,
        percent: predictedLocal.percent,
        stocks: predictedLocal.stocks,
        isInvincible: predictedLocal.isInvincible,
        isKnockedOut: predictedLocal.isKnockedOut,
        isShielding: predictedLocal.isShielding,
        shieldHealth: predictedLocal.shieldHealth,
        currentMoveId: predictedLocal.currentMoveId,
      });
    }

    this.options.onRenderState(interpolated, this.myPlayerId);
  }

  private sendInput(inputEvent: InputEvent): void {
    const encoded = encode(inputEvent);
    this.socket.emit('game:input', encoded);
  }

	private getStateHash(snapshot: StateSnapshot): string {
		return Object.values(snapshot.players)
			.sort((left, right) => left.slotIndex - right.slotIndex)
			.map(
				(player) =>
					`${player.slotIndex}:${Math.round(player.x)},${Math.round(player.y)},${Math.round(
						player.vx,
					)},${Math.round(player.vy)},${Math.round(player.percent)},${player.stocks},${player.state}`,
			)
			.join('|');
	}
}
