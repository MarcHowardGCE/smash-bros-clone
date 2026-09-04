/**
 * @fileoverview GameClient - top-level network facade for the smash-bros-clone client.
 *
 * Data flow overview:
 *   INPUT  → InputManager polls keyboard state each rAF tick → InputEvent (seq-stamped)
 *          → LocalPredictor.onInput() applies movement immediately (no server wait)
 *          → encode() serialises to binary msgpack → socket.emit('game:input')
 *
 *   SERVER → 'game:state' binary msgpack frame arrives at ~20 Hz
 *          → decode() → StateSnapshot
 *          → InterpolationBuffer.pushSnapshot() queues it for lerp
 *          → LocalPredictor.onServerSnapshot() reconciles prediction:
 *              prune confirmed inputs, replay unconfirmed on top of server state
 *
 *   RENDER → rAF loop calls renderTick() at 60 fps
 *          → InterpolationBuffer.getInterpolatedState() lerps remote players
 *          → LocalPredictor.getPredictedState() overrides the local player entry
 *          → onRenderState() callback hands the merged RenderState to PixiJS
 */
import { decode, encode, ExtensionCodec } from "@msgpack/msgpack";
import type { Socket } from "socket.io-client";
import { io } from "socket.io-client";
import type {
  InputEvent,
  PlayerId,
  StateSnapshot,
  HitEventData,
} from "@smash/shared";
import { InputManager } from "../input/InputManager.js";
import {
  InterpolationBuffer,
  type RenderState,
} from "./InterpolationBuffer.js";
import { LocalPredictor } from "./LocalPredictor.js";

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
  onCharacterSelectStart?: (playerIds: PlayerId[]) => void;
  onCharacterUpdated?: (data: {
    playerId: PlayerId;
    characterId: string;
    confirmed: boolean;
  }) => void;
  onPlayerLeft?: (playerId: PlayerId) => void;
}

/**
 * Top-level network facade. One instance per game session.
 *
 * @remarks
 * Data flow:
 * - **Input path**: Each rAF tick, `InputManager` polls keyboard state and produces
 *   a seq-stamped `InputEvent`. The event is applied immediately by `LocalPredictor`
 *   (client-side prediction), then encoded to binary msgpack and sent to the server
 *   via `socket.emit('game:input')`.
 * - **Snapshot path**: The server broadcasts `game:state` at ~20 Hz as a binary
 *   msgpack `StateSnapshot`. On receipt, the snapshot is pushed into
 *   `InterpolationBuffer` (for remote players) and handed to `LocalPredictor` for
 *   reconciliation (prune confirmed inputs, replay unconfirmed on top of server state).
 * - **Render path**: `requestAnimationFrame` drives `renderTick` at 60 fps.
 *   `InterpolationBuffer.getInterpolatedState()` lerps remote player positions.
 *   `LocalPredictor.getPredictedState()` overrides the local player entry so it
 *   reflects prediction rather than interpolation. The merged `RenderState` is
 *   forwarded to PixiJS via the `onRenderState` callback.
 */
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
      transports: ["websocket"],
      reconnection: true,
    });

    this.setupSocketHandlers();
  }

  /**
   * Asks the server to create a new room and assigns this client as the host.
   *
   * @remarks
   * On success the server returns a short alphanumeric `roomCode` that the host
   * can share with other players. The assigned `playerId` is stored locally so
   * all subsequent input events and snapshot lookups are keyed to the right slot.
   */
  createRoom(): void {
    this.socket.emit(
      "room:create",
      (data: { roomCode: string; playerId: PlayerId; slotIndex: number }) => {
        this.myPlayerId = data.playerId;
        this.myRoomCode = data.roomCode;
        this.inputManager.setPlayerId(data.playerId);
        // Persist session identity for rejoin on reconnect
        sessionStorage.setItem(
          "smash:rejoin",
          JSON.stringify({ roomCode: data.roomCode, playerId: data.playerId }),
        );
        this.options.onPlayerAssigned?.(data.playerId, data.roomCode);
        this.options.onRoomCreated(data.roomCode, data.playerId);
        this.options.onPlayerJoined(data.slotIndex);
      },
    );
  }

  /**
   * Joins an existing room by its room code.
   *
   * @param roomCode - The short alphanumeric code shared by the host.
   *
   * @remarks
   * The server validates the code, assigns a `playerId` and slot index, then
   * fires the `onPlayerAssigned` and `onPlayerJoined` callbacks so the UI can
   * transition into the lobby. An `error` response is logged and silently
   * ignored so the caller can surface it through UI state instead.
   */
  joinRoom(roomCode: string): void {
    this.socket.emit(
      "room:join",
      roomCode,
      (data: { playerId: PlayerId; slotIndex: number } | { error: string }) => {
        if ("error" in data) {
          console.error("[client] join error:", data.error);
          return;
        }

        this.myPlayerId = data.playerId;
        this.myRoomCode = roomCode.toUpperCase();
        this.inputManager.setPlayerId(data.playerId);
        // Persist session identity for rejoin on reconnect
        sessionStorage.setItem('smash:rejoin', JSON.stringify({ roomCode: this.myRoomCode, playerId: data.playerId }));
        this.options.onPlayerAssigned?.(data.playerId, this.myRoomCode);
        this.options.onPlayerJoined(data.slotIndex);
      },
    );
  }

  /** Signals to the server that this player is ready to start the match. */
  markReady(): void {
    if (this.myRoomCode) {
      this.socket.emit("player:ready", this.myRoomCode);
    }
  }

  /**
   * Selects a character during the character-select phase.
   *
   * @param characterId - The identifier of the chosen character.
   * @param callback - Optional acknowledgement from the server.
   */
  selectCharacter(
    characterId: string,
    callback?: (result: { ok: true } | { error: string }) => void,
  ): void {
    if (!this.myRoomCode) {
      return;
    }
    this.socket.emit(
      "character:select",
      this.myRoomCode,
      characterId,
      callback,
    );
  }

  /**
   * Confirms the currently selected character, locking in the choice.
   *
   * @param callback - Optional acknowledgement; `allConfirmed` is true when every
   *   player in the room has confirmed, which triggers match start on the server.
   */
  confirmCharacter(
    callback?: (
      result: { ok: true; allConfirmed: boolean } | { error: string },
    ) => void,
  ): void {
    if (!this.myRoomCode) {
      return;
    }
    this.socket.emit("character:confirm", this.myRoomCode, callback);
  }

  /** Whether the game is currently paused. */
  get isPaused(): boolean {
    return this.paused;
  }

  /** Requests a pause from the server. No-op if already paused. */
  emitPause(): void {
    if (this.paused) return;
    this.paused = true;
    this.socket.emit("game:pause");
  }

  /** Requests a resume from the server. No-op if not currently paused. */
  emitResume(): void {
    if (!this.paused) return;
    this.socket.emit("game:resume");
  }

  /** Stops the render loop and closes the socket connection. */
  disconnect(): void {
    this.stopRenderLoop();
    this.socket.disconnect();
  }

  /** Manually connects the socket if it is not already connected. */
  connect(): void {
    if (this.socket.connected) {
      return;
    }
    this.socket.connect();
  }

  /**
   * Injects a synthetic input event, bypassing `InputManager`. Used in tests and
   * debug tooling to drive the game without real keyboard events.
   *
   * @param input - Partial input with only the held/pressed/released bitmasks required.
   */
  debugSendInput(
    input: Pick<InputEvent, "held" | "pressed" | "released">,
  ): void {
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

  /** Returns the most recent authoritative snapshot from the server, or `null` if none has arrived yet. */
  getLatestSnapshot(): StateSnapshot | null {
    return this.interpolationBuffer.getLatestSnapshot();
  }

  private setupSocketHandlers(): void {
    this.socket.on("connect", () => {
      console.log("[client] connected to server:", this.socket.id);

      // Attempt rejoin if we have persisted session identity
      const rejoinData = sessionStorage.getItem("smash:rejoin");
      if (rejoinData) {
        try {
          const { roomCode, playerId } = JSON.parse(rejoinData);
          if (roomCode && playerId) {
            console.log("[client] attempting rejoin:", { roomCode, playerId });
            this.socket.emit(
              "room:rejoin",
              { roomCode, playerId },
              (response: { ok: boolean; error?: string }) => {
                if (response.ok) {
                  console.log("[client] rejoin successful");
                } else {
                  console.log("[client] rejoin failed:", response.error);
                  // Clear persisted session if rejoin fails (grace window expired, etc.)
                  sessionStorage.removeItem("smash:rejoin");
                }
              },
            );
          }
        } catch (e) {
          console.error("[client] failed to parse rejoin data:", e);
          sessionStorage.removeItem("smash:rejoin");
        }
      }
      this.options.onConnected?.();
    });

    this.socket.on("connect_error", (error) => {
      console.error("[client] connect error:", error.message);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("[client] disconnected:", reason);
      this.stopRenderLoop();
      this.interpolationBuffer.clear();
      this.predictor = null;
    });

    this.socket.on(
      "room:playerJoined",
      (data: { playerId: PlayerId; slotIndex: number }) => {
        console.log("[client] player joined:", data);
        this.options.onPlayerJoined(data.slotIndex);
      },
    );

    this.socket.on("game:countdown", (data: { seconds: number }) => {
      console.log("[client] countdown:", data.seconds);
      this.options.onMatchPhaseChange("countdown");
    });

    this.socket.on("game:start", (data: { playerIds: PlayerId[] }) => {
      console.log("[client] match started, players:", data.playerIds);
      this.interpolationBuffer.clear();
      this.predictor = null;
      this.options.onMatchPhaseChange("match");
      this.startRenderLoop();
    });

    // 'game:state' arrives at ~20 Hz as a binary msgpack-encoded StateSnapshot.
    // Local player: the snapshot is forwarded to LocalPredictor for reconciliation
    //   (prune confirmed inputs, replay unconfirmed on top of the authoritative state).
    // Remote players: the snapshot is queued in InterpolationBuffer; getInterpolatedState()
    //   lerps between the two most recent snapshots each rAF tick for smooth 60 fps visuals.
    this.socket.on("game:state", (binaryData: ArrayBuffer | Uint8Array) => {
      try {
        const data =
          binaryData instanceof Uint8Array
            ? binaryData
            : new Uint8Array(binaryData);
        const snapshot = decode(data, { extensionCodec }) as StateSnapshot;
        this.currentTick = snapshot.tick;
        this.inputManager.setCurrentTick(this.currentTick);
        this.interpolationBuffer.pushSnapshot(snapshot);
        if (snapshot.tick > 0 && snapshot.tick % 60 === 0) {
          console.log(
            `[state-hash][client] tick=${snapshot.tick} ${this.getStateHash(snapshot)}`,
          );
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
        console.error("[client] failed to decode game state:", error);
      }
    });

    this.socket.on("game:paused", () => {
      console.log("[client] game paused by server");
      this.paused = true;
      this.options.onPaused?.();
    });

    this.socket.on("game:resumed", () => {
      console.log("[client] game resumed by server");
      this.paused = false;
      this.options.onResumed?.();
    });

    this.socket.on("game:over", (data: { winnerId: PlayerId }) => {
      console.log("[client] match over, winner:", data.winnerId);
      this.paused = false;
      this.options.onMatchPhaseChange("result", data.winnerId);
      this.stopRenderLoop();
    });

    this.socket.on(
      "room:characterSelectStart",
      (data: { playerIds: PlayerId[] }) => {
        console.log(
          "[client] character select started, players:",
          data.playerIds,
        );
        this.options.onCharacterSelectStart?.(data.playerIds);
      },
    );

    this.socket.on(
      "character:updated",
      (data: {
        playerId: PlayerId;
        characterId: string;
        confirmed: boolean;
      }) => {
        console.log("[client] character updated:", data);
        this.options.onCharacterUpdated?.(data);
      },
    );

    this.socket.on("room:playerLeft", (data: { playerId: PlayerId }) => {
      console.log("[client] player left:", data.playerId);
      this.options.onPlayerLeft?.(data.playerId);
    });

    this.socket.on('room:playerDisconnected', (data: { playerId: PlayerId; graceSeconds: number }) => {
      console.log('[client] player disconnected (grace window:', data.graceSeconds + 's):', data.playerId);
      // Optionally display UI notification for grace window
    });

    this.socket.on('room:playerRejoined', (data: { playerId: PlayerId }) => {
      console.log('[client] player rejoined:', data.playerId);
      // Optionally clear UI notification
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

    const interpolated = this.interpolationBuffer.getInterpolatedState(
      performance.now(),
      this.myPlayerId,
    );
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
        isGrounded: predictedLocal.isGrounded,
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
    this.socket.emit("game:input", encoded);
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
      .join("|");
  }
}
