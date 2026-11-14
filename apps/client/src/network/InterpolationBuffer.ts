/**
 * @fileoverview InterpolationBuffer - snapshot interpolation for remote players
 * in the smash-bros-clone netcode stack.
 *
 * The server broadcasts authoritative game state at ~20 Hz, but the renderer
 * runs at 60 fps via requestAnimationFrame. This buffer bridges that gap by
 * storing the last N snapshots and lerping remote player positions between
 * them, producing fluid 60 fps visuals from a 20 Hz data stream.
 *
 * The local player is NOT interpolated here; that role belongs to
 * `LocalPredictor` (client-side prediction), which applies inputs immediately
 * without waiting for a server snapshot.
 */
import { lerp } from "@smash/shared";
import type {
  StateSnapshot,
  HitEventData,
  PlayerState,
  PlayerId,
  MoveId,
  CharacterId,
} from "@smash/shared";

export interface RenderPlayerState {
  id: PlayerId;
  slotIndex: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isGrounded: boolean;
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
  dodgeLevel?:number;dodgeKind?:import('@smash/shared').PlayerState['dodgeKind'];
  tauntKind?:'up'|'side'|'down';impactVx?:number;hitReaction?:'high'|'low'|'heavy'|'air';koVisual?:import('@smash/shared').PlayerState['koVisual'];artCue?:string;artCueFrame?:number;respawnTimer?:number;footstoolRole?:'attacker'|'ground'|'air';footstoolPartnerId?:string;footstoolFrame?:number;shieldReaction?:"hit"|"parry"|"break"|"drop";shieldReactionFrame?:number;hitstunFramesRemaining?:number;floorOrientation?:"up"|"down";floorRollDirection?:1|-1;isFastFalling?:boolean;airDodgeDirection?:{x:number;y:number}|null;hasDoubleJump?: boolean;isTumbling?:boolean;chargeFrames?:number;isGrabbing?:boolean;grabbedPlayerId?:PlayerId|null;ledgeId?:string|null;
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
  private readonly bufferSize = 12;
  private pendingHits: { tick: number; events: HitEventData[] }[] = [];
  private clockOffset: number | undefined;
  private static readonly tickMs = 1000 / 60;
  private static readonly delayMs = 100;

  pushSnapshot(snapshot: StateSnapshot, receivedAt = performance.now()): void {
    const previous = this.snapshots.at(-1);
    if (previous && snapshot.tick <= previous.tick) return;
    const offset = receivedAt - snapshot.tick * InterpolationBuffer.tickMs;
    // Re-anchor after a pause or long stall. Normal packet jitter leaves the clock alone.
    if (this.clockOffset === undefined || offset - this.clockOffset > 500) {
      this.clockOffset = offset;
      this.snapshots = [];
      this.pendingHits = [];
    }
    if (snapshot.hitEvents?.length) this.pendingHits.push({ tick: snapshot.tick, events: snapshot.hitEvents });
    this.snapshots.push(snapshot);
    if (this.snapshots.length > this.bufferSize) this.snapshots.shift();
  }

  /**
   * Computes an interpolated `RenderState` for the given timestamp.
   *
   * Samples the buffered simulation timeline at a fixed playback delay.
   * The local player's entry is snapped to the latest snapshot value as a
   * fallback; `GameClient.renderTick` immediately overwrites it with the
   * predicted state from `LocalPredictor`.
   *
   * @param now - Current timestamp in ms (typically `performance.now()`).
   * @param localPlayerId - ID of the local player, excluded from interpolation.
   * @returns Interpolated render state, or `null` if fewer than one snapshot exists.
   */
  getInterpolatedState(
    now: number,
    localPlayerId: PlayerId,
  ): RenderState | null {
    if (this.snapshots.length < 2) {
      // Not enough snapshots yet — return latest if available
      if (this.snapshots.length === 1) {
        return this.snapshotToRenderState(this.snapshots[0]!);
      }
      return null;
    }

    const newest = this.snapshots.at(-1)!;
    const target = this.targetTick(now);
    const next = this.snapshots.findIndex(snapshot => snapshot.tick > target + 1e-8);
    if (next <= 0) {
      const rendered = this.snapshotToRenderState(next < 0 ? newest : this.snapshots[0]!);
      const local = newest.players[localPlayerId];
      if (local) rendered.players.set(localPlayerId, this.playerToRenderState(local));
      return { ...rendered, matchPhase: newest.matchPhase, winnerId: newest.winnerId };
    }
    const snap0 = this.snapshots[next - 1]!;
    const snap1 = this.snapshots[next]!;
    const alpha = Math.max(0, (target - snap0.tick) / (snap1.tick - snap0.tick));

    const players = new Map<PlayerId, RenderPlayerState>();

    for (const [id, p0] of Object.entries(snap0.players)) {
      const playerId = id as PlayerId;
      const p1 = snap1.players[playerId];
      if (id === localPlayerId || !p1) {
        players.set(playerId, this.playerToRenderState(newest.players[playerId] ?? p0));
        continue;
      }

      const rendered = this.playerToRenderState(p0);
      if (p0.stocks === p1.stocks && p0.isKnockedOut === p1.isKnockedOut &&
          p0.grabbedPlayerId === p1.grabbedPlayerId &&
          (p0.state === "GRAB_HOLDING") === (p1.state === "GRAB_HOLDING")) {
        rendered.x = lerp(p0.x, p1.x, alpha);
        rendered.y = lerp(p0.y, p1.y, alpha);
        rendered.vx = lerp(p0.vx, p1.vx, alpha);
        rendered.vy = lerp(p0.vy, p1.vy, alpha);
        if (p0.state === p1.state && p0.currentMoveId === p1.currentMoveId &&
            p1.stateFrame >= p0.stateFrame) {
          rendered.stateFrame = Math.floor(lerp(p0.stateFrame, p1.stateFrame, alpha) + 1e-8);
        }
      }
      players.set(playerId, rendered);
    }

    return { players, matchPhase: newest.matchPhase, winnerId: newest.winnerId };
  }

  private targetTick(now: number): number {
    return (now - this.clockOffset! - InterpolationBuffer.delayMs) / InterpolationBuffer.tickMs;
  }

  drainPresentedHits(now: number): HitEventData[] {
    if (this.clockOffset === undefined) return [];
    const tick = this.snapshots.length === 1 ? this.snapshots[0]!.tick :
      Math.max(this.snapshots[0]!.tick, this.targetTick(now));
    const events: HitEventData[] = [];
    while (this.pendingHits[0] && this.pendingHits[0].tick <= tick + 1e-8) {
      events.push(...this.pendingHits.shift()!.events);
    }
    return events;
  }

  /** Returns the most recent authoritative snapshot, or `null` if the buffer is empty. */
  getLatestSnapshot(): StateSnapshot | null {
    return this.snapshots[this.snapshots.length - 1] ?? null;
  }

  /** Returns `true` if at least one snapshot has been received. */
  hasData(): boolean {
    return this.snapshots.length > 0;
  }

  /** Clears all buffered snapshots. Called on disconnect and match restart. */
  clear(): void {
    this.snapshots = [];
    this.clockOffset = undefined;
    this.pendingHits = [];
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
      isGrounded: p.isGrounded,
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
 dodgeLevel:p.dodgeLevel,dodgeKind:p.dodgeKind,koVisual:p.koVisual,tauntKind:p.tauntKind,hitReaction:p.hitReaction,impactVx:p.pendingKnockbackVx??p.vx,artCue:p.artCue,artCueFrame:p.artCueFrame,respawnTimer:p.respawnTimer,footstoolRole:p.footstoolRole,footstoolPartnerId:p.footstoolPartnerId,footstoolFrame:p.footstoolFrame,shieldReaction:p.shieldReaction,shieldReactionFrame:p.shieldReactionFrame,hitstunFramesRemaining:p.hitstunFramesRemaining,floorOrientation:p.floorOrientation,floorRollDirection:p.floorRollDirection,isFastFalling:p.isFastFalling,airDodgeDirection:p.airDodgeDirection,hasDoubleJump:p.hasDoubleJump,isTumbling:p.isTumbling,chargeFrames:p.chargeFrames,isGrabbing:p.isGrabbing,grabbedPlayerId:p.grabbedPlayerId,ledgeId:p.ledgeId,
    };
  }
}
