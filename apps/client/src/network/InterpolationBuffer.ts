import { lerp } from '@smash/shared';
import type { StateSnapshot, PlayerState, PlayerId } from '@smash/shared';

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
}

export interface RenderState {
  players: Map<PlayerId, RenderPlayerState>;
  matchPhase: string;
  winnerId: PlayerId | null;
}

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

    const alpha = Math.max(0, Math.min(1, (now - snap0.timestamp) / duration));

    const players = new Map<PlayerId, RenderPlayerState>();

    for (const [id, p1] of Object.entries(snap1.players)) {
      const p0 = snap0.players[id as PlayerId];

      if (!p0) {
        // New player — use latest state directly
        players.set(id as PlayerId, this.playerToRenderState(p1));
        continue;
      }

      // For local player: don't interpolate position (T14 handles that with prediction)
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
        facing: p1.facing,        // snap to latest (no lerp)
        state: p1.state,          // snap to latest
        stateFrame: p1.stateFrame, // snap to latest
        percent: p1.percent,      // snap to latest (avoid fractional damage display)
        stocks: p1.stocks,        // snap to latest
        isInvincible: p1.isInvincible,
        isKnockedOut: p1.isKnockedOut,
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
    };
  }
}
