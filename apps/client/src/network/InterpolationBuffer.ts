import { lerp } from '@smash/shared';
import type { StateSnapshot, PlayerState, PlayerId, MoveId, CharacterId } from '@smash/shared';

export interface RenderPlayerState {
  id: PlayerId;
  slotIndex: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  state: string;
  stateFrame: number;
  percent: number;
  stocks: number;
  isInvincible: boolean;
  isKnockedOut: boolean;
  isShielding: boolean;
  shieldHealth: number;
  currentMoveId: MoveId | null;
  characterId?: CharacterId;
}

export interface RenderState {
  players: Map<PlayerId, RenderPlayerState>;
  matchPhase: string;
  winnerId: PlayerId | null;
}

/**
 * Bridges the gap between the server's 20 Hz broadcast rate and the client's 60 fps render loop.
 *
 * WHY this class exists: The server broadcasts authoritative game state at 20 Hz (every 3 game
 * ticks at 60 Hz), but the renderer runs at 60 fps via requestAnimationFrame. Without
 * interpolation, remote players would visually teleport every ~50ms instead of moving smoothly.
 * This buffer stores the last N snapshots and lerps remote player positions between them,
 * producing fluid 60 fps visuals from a 20 Hz data stream.
 *
 * WHY bufferSize = 3: Three snapshots at 20 Hz provides 150ms of buffer depth. This covers
 * typical network jitter (10–80ms) without introducing excessive visual latency. Fewer snapshots
 * risks running out of data to interpolate during a delayed packet; more adds unnecessary lag
 * between what happened on the server and what the player sees.
 *
 * WHY the local player is NOT interpolated here: The local player's position is driven by
 * `LocalPredictor` (client-side prediction), which applies inputs immediately without waiting
 * for a server snapshot. Interpolating the local player on top of prediction would cause
 * double-movement and visual jitter — the player would feel laggy on their own machine.
 */
export class InterpolationBuffer {
  private snapshots: StateSnapshot[] = [];
  private readonly bufferSize = 3;

  pushSnapshot(snapshot: StateSnapshot): void {
    this.snapshots.push(snapshot);
    // Keep last 3 snapshots
    if (this.snapshots.length > this.bufferSize) {
      this.snapshots.shift();
    }
  }

  /**
   * Get interpolated state at the given timestamp.
   * Uses the two most recent snapshots and lerps between them.
   */
  getInterpolatedState(now: number, localPlayerId: PlayerId): RenderState | null {
    if (this.snapshots.length < 2) {
      // Not enough snapshots yet — return latest if available
      if (this.snapshots.length === 1) {
        return this.snapshotToRenderState(this.snapshots[0]!);
      }
      return null;
    }

    const snap0 = this.snapshots[this.snapshots.length - 2]!;
    const snap1 = this.snapshots[this.snapshots.length - 1]!;

    const duration = snap1.timestamp - snap0.timestamp;
    if (duration <= 0) {
      return this.snapshotToRenderState(snap1);
    }

    // WHY alpha is clamped to [0, 1]: If `now` is ahead of snap1.timestamp (we're slightly
    // behind the broadcast schedule), alpha would exceed 1.0 and we'd extrapolate beyond the
    // known state — producing speculative positions that may diverge from reality. Clamping
    // keeps rendering strictly between two known-good authoritative states.
    const alpha = Math.max(0, Math.min(1, (now - snap0.timestamp) / duration));

    const players = new Map<PlayerId, RenderPlayerState>();

    for (const [id, p1] of Object.entries(snap1.players)) {
      const p0 = snap0.players[id as PlayerId];

      if (!p0) {
        // New player — use latest state directly
        players.set(id as PlayerId, this.playerToRenderState(p1));
        continue;
      }

      // WHY local player uses snap-to-latest instead of lerp: The local player's rendering
      // position is already managed by `LocalPredictor` (client-side prediction). The caller
      // (`GameClient.renderTick`) overwrites the local player's entry in the returned map with
      // the predicted state immediately after this call. The snap-to-latest here is just a
      // safe fallback that ensures the map always contains an entry for the local player.
      if (id === localPlayerId) {
        players.set(id as PlayerId, this.playerToRenderState(p1));
        continue;
      }

      // For remote players: interpolate numeric position fields
      const interpolated: RenderPlayerState = {
        id: id as PlayerId,
        slotIndex: p1.slotIndex,
        x: lerp(p0.x, p1.x, alpha),
        y: lerp(p0.y, p1.y, alpha),
        vx: lerp(p0.vx, p1.vx, alpha),
        vy: lerp(p0.vy, p1.vy, alpha),
        // WHY facing/state/stateFrame/percent/stocks snap rather than lerp: These are discrete
        // values where interpolation produces nonsense. Lerping `facing` between -1 and 1 yields
        // 0 (no direction). Lerping `state` (a string enum) is impossible. Lerping `percent`
        // would display fractional damage like "12.4%" between two integer server states. All
        // are snapped to the authoritative latest value from the most recent snapshot.
        facing: p1.facing,        // snap to latest (no lerp)
        state: p1.state,          // snap to latest
        stateFrame: p1.stateFrame, // snap to latest
        percent: p1.percent,      // snap to latest (avoid fractional damage display)
        stocks: p1.stocks,        // snap to latest
        isInvincible: p1.isInvincible,
        isKnockedOut: p1.isKnockedOut,
        isShielding: p1.isShielding,
        shieldHealth: p1.shieldHealth,
        currentMoveId: p1.currentMoveId,
        characterId: p1.characterId,
      };

      players.set(id as PlayerId, interpolated);
    }

    return {
      players,
      matchPhase: snap1.matchPhase,
      winnerId: snap1.winnerId,
    };
  }

  getLatestSnapshot(): StateSnapshot | null {
    return this.snapshots[this.snapshots.length - 1] ?? null;
  }

  hasData(): boolean {
    return this.snapshots.length > 0;
  }

  clear(): void {
    this.snapshots = [];
  }

  private snapshotToRenderState(snap: StateSnapshot): RenderState {
    const players = new Map<PlayerId, RenderPlayerState>();
    for (const [id, p] of Object.entries(snap.players)) {
      players.set(id as PlayerId, this.playerToRenderState(p));
    }
    return { players, matchPhase: snap.matchPhase, winnerId: snap.winnerId };
  }

  private playerToRenderState(p: PlayerState): RenderPlayerState {
    return {
      id: p.id,
      slotIndex: p.slotIndex,
      x: p.x,
      y: p.y,
      vx: p.vx,
      vy: p.vy,
      facing: p.facing,
      state: p.state,
      stateFrame: p.stateFrame,
      percent: p.percent,
      stocks: p.stocks,
      isInvincible: p.isInvincible,
      isKnockedOut: p.isKnockedOut,
      isShielding: p.isShielding,
      shieldHealth: p.shieldHealth,
      currentMoveId: p.currentMoveId,
      characterId: p.characterId,
    };
  }
}
