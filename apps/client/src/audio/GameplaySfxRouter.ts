import { PlayerStateEnum, type PlayerId } from "@smash/shared";
import type { SfxManager } from "./SfxManager.js";

export interface GameplaySfxPlayerState {
  id: PlayerId;
  state: string;
  vy: number;
  isGrounded: boolean;
  stocks: number;
}

export interface GameplaySfxFrame {
  players: ReadonlyMap<PlayerId, GameplaySfxPlayerState>;
}

type PreviousPlayerState = Omit<GameplaySfxPlayerState, "id">;

const JUMP_ENTRY_STATES = new Set<string>([
  PlayerStateEnum.JUMPSQUAT,
  PlayerStateEnum.DOUBLE_JUMP,
  PlayerStateEnum.LEDGE_JUMP,
]);
const KO_DEDUPE_MS = 250;

/** Converts rendered player-state edges into one-shot gameplay sound effects. */
export class GameplaySfxRouter {
  private readonly previousPlayers = new Map<PlayerId, PreviousPlayerState>();
  private lastKoAt = Number.NEGATIVE_INFINITY;

  constructor(
    private readonly sfxManager: Pick<SfxManager, "play">,
    private readonly now: () => number = () => performance.now(),
  ) {}

  processFrame(frame: GameplaySfxFrame): void {
    const currentPlayerIds = new Set<PlayerId>();

    for (const [playerId, player] of frame.players) {
      currentPlayerIds.add(playerId);
      const previous = this.previousPlayers.get(playerId);

      if (previous) {
        if (this.didStartJump(previous, player)) {
          this.sfxManager.play("jump");
        }
        if (!previous.isGrounded && player.isGrounded) {
          this.sfxManager.play("land");
        }
        if (
          previous.state !== PlayerStateEnum.SHIELD &&
          player.state === PlayerStateEnum.SHIELD
        ) {
          this.sfxManager.play("shield");
        }
        if (player.stocks < previous.stocks) {
          this.playKo();
        }
      }

      this.previousPlayers.set(playerId, {
        state: player.state,
        vy: player.vy,
        isGrounded: player.isGrounded,
        stocks: player.stocks,
      });
    }

    for (const playerId of this.previousPlayers.keys()) {
      if (!currentPlayerIds.has(playerId)) {
        this.previousPlayers.delete(playerId);
      }
    }
  }

  /** Covers final network KOs when game-over arrives before a final state snapshot. */
  processMatchResult(): void {
    this.playKo();
  }

  reset(): void {
    this.previousPlayers.clear();
    this.lastKoAt = Number.NEGATIVE_INFINITY;
  }

  private didStartJump(
    previous: PreviousPlayerState,
    current: GameplaySfxPlayerState,
  ): boolean {
    if (
      previous.state !== current.state &&
      JUMP_ENTRY_STATES.has(current.state)
    ) {
      return true;
    }

    return (
      previous.state !== PlayerStateEnum.JUMPSQUAT &&
      previous.isGrounded &&
      !current.isGrounded &&
      current.state === PlayerStateEnum.AIRBORNE &&
      current.vy < 0
    );
  }

  private playKo(): void {
    const now = this.now();
    if (now - this.lastKoAt < KO_DEDUPE_MS) {
      return;
    }
    this.lastKoAt = now;
    this.sfxManager.play("ko");
  }
}
