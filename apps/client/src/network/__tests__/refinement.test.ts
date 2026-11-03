import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PlayerState, StateSnapshot } from "@smash/shared";
import { PlayerStateEnum } from "@smash/shared";
import { InterpolationBuffer } from "../InterpolationBuffer.js";
import { GameClient } from "../GameClient.js";
const { handlers, emit, disconnect } = vi.hoisted(() => ({
  handlers: {} as Record<string, (...args: any[]) => void>, emit: vi.fn(), disconnect: vi.fn(),
}));
vi.mock("socket.io-client", () => ({ io: () => ({
  on: (event: string, callback: (...args: any[]) => void) => { handlers[event] = callback; }, emit, disconnect,
}) }));
const player = (x: number): PlayerState => ({
  id: "remote", slotIndex: 1, x, y: 0, vx: 0, vy: 0, state: PlayerStateEnum.IDLE,
  stateFrame: 0, facing: 1, percent: 0, stocks: 3, characterId: "swift",
  hitPlayerIds: new Set(), staleMoveQueue: [],
} as unknown as PlayerState);
const snap = (tick: number, timestamp: number, x: number): StateSnapshot => ({
  tick, timestamp, players: { remote: player(x) }, lastConfirmedSeq: {},
  matchPhase: "match", winnerId: null, ledges: {}, hitEvents: [],
});
describe("interpolation receipt clock", () => {
  it.each([100_000, -100_000])("ignores server/browser time-origin offset %s", offset => {
    const buffer = new InterpolationBuffer();
    buffer.pushSnapshot(snap(1, offset, 0), 100); buffer.pushSnapshot(snap(4, offset+50, 100), 150);
    expect(buffer.getInterpolatedState(175, "local")?.players.get("remote")?.x).toBe(50);
    expect(buffer.getInterpolatedState(250, "local")?.players.get("remote")?.x).toBe(100);
  });
  it("ignores old snapshots and resets on a new match", () => {
    const buffer = new InterpolationBuffer();
    buffer.pushSnapshot(snap(4, 50, 100), 150); buffer.pushSnapshot(snap(1, 0, 0), 160);
    expect(buffer.getLatestSnapshot()?.tick).toBe(4);
    buffer.clear(); buffer.pushSnapshot(snap(1, 0, 25), 200);
    expect(buffer.getLatestSnapshot()?.tick).toBe(1);
  });
});
describe("online recovery and input cadence", () => {
  let client: GameClient;
  const onConnected = vi.fn(), onAssigned = vi.fn(), onPhase = vi.fn(), onRender = vi.fn();
  beforeEach(() => {
    for (const key of Object.keys(handlers)) delete handlers[key];
    vi.clearAllMocks(); sessionStorage.clear(); localStorage.clear();
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1)); vi.stubGlobal("cancelAnimationFrame", vi.fn());
    client = new GameClient({ serverUrl: "/", onConnected, onPlayerAssigned: onAssigned,
      onMatchPhaseChange: onPhase, onRenderState: onRender, onRoomCreated: vi.fn(), onPlayerJoined: vi.fn() });
  });
  afterEach(() => { client.disconnect(); vi.unstubAllGlobals(); });
  it.each([30, 60, 120, 144])("sends fixed-rate input independently of %s display Hz", hz => {
    const internal = client as unknown as { myPlayerId: string; renderTick(now: number): void };
    internal.myPlayerId = "p1";
    for (let frame=0;frame<=hz;frame++) internal.renderTick(frame*1000/hz);
    expect(emit.mock.calls.filter(c => c[0] === "game:input")).toHaveLength(61);
  });
  it("restores identity and rendering without opening the lobby", () => {
    sessionStorage.setItem("smash:rejoin", JSON.stringify({ roomCode: "ABC123", playerId: "p1" }));
    handlers.connect!(); emit.mock.calls.find(c => c[0] === "room:rejoin")![2]({ ok: true, phase: "MATCH", paused: false });
    expect(onAssigned).toHaveBeenCalledWith("p1", "ABC123"); expect(onConnected).not.toHaveBeenCalled();
    expect(onPhase).toHaveBeenCalledWith("match"); expect(requestAnimationFrame).toHaveBeenCalled();
  });
  it("clears expired identity and returns to normal connection flow", () => {
    sessionStorage.setItem("smash:rejoin", JSON.stringify({ roomCode: "ABC123", playerId: "p1" }));
    handlers.connect!(); emit.mock.calls.find(c => c[0] === "room:rejoin")![2]({ ok: false });
    expect(sessionStorage.getItem("smash:rejoin")).toBeNull(); expect(onConnected).toHaveBeenCalledOnce();
  });
  it("keeps selected character identity in predicted rendering", () => {
    const internal = client as unknown as { myPlayerId: string; predictor: { getPredictedState(): PlayerState; onInput(): void }; interpolationBuffer: InterpolationBuffer; renderTick(now: number): void };
    internal.myPlayerId = "remote"; internal.interpolationBuffer.pushSnapshot(snap(1, 0, 10), 0);
    internal.predictor = { getPredictedState: () => player(10), onInput: () => {} };
    internal.renderTick(0);
    expect(onRender.mock.calls[0]?.[0].players.get("remote").characterId).toBe("swift");
  });
});
