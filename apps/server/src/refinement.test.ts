import { describe, it, expect, vi } from "vitest";
import { decode } from "@msgpack/msgpack";
import type { InputEvent, StateSnapshot } from "@smash/shared";
import { PlayerStateEnum } from "@smash/shared";
import { GameEngine } from "./GameEngine.js";
import { MatchSession } from "./MatchSession.js";
import { RoomManager } from "./RoomManager.js";
const input = (seq = 0): InputEvent => ({ playerId: "p1", tick: 0, seq, held: 1, pressed: 1, released: 0 });
const session = () => {
  const onBroadcast = vi.fn(), onMatchOver = vi.fn();
  return { match: new MatchSession({ playerIds: ["p1", "p2"], characterIds: { p1: "abe-lincoln", p2: "swift" }, onBroadcast, onMatchOver }), onBroadcast, onMatchOver };
};
describe("fighter refinement", () => {
  it("initializes online character physics before any broadcast", () => {
    const { match } = session(); let snapshot!: StateSnapshot;
    match.syncState(data => { snapshot = decode(data) as StateSnapshot; });
    expect(snapshot.players.p1?.characterId).toBe("abe-lincoln");
    expect(snapshot.players.p2?.characterId).toBe("swift");
  });
  it("forfeit ends a paused two-player match and emits its final state", () => {
    const { match, onMatchOver, onBroadcast } = session();
    match.start(); match.pause(); match.forfeitPlayer("p2");
    expect(onMatchOver).toHaveBeenCalledWith("p1");
    expect(onBroadcast).toHaveBeenCalled();
    expect((match as unknown as { isRunning: boolean }).isRunning).toBe(false);
  });
  it("three-player forfeit preserves the match and releases a grabbed victim", () => {
    const engine = new GameEngine({ playerIds: ["p1", "p2", "p3"] });
    const state = engine.getSnapshot(0, {}).players;
    state.p1!.isGrabbing = true; state.p1!.grabbedPlayerId = "p2";
    state.p2!.isGrabbing = true; state.p2!.state = PlayerStateEnum.GRAB_HOLDING;
    engine.forfeitPlayer("p1");
    expect(engine.isMatchOver()).toBe(false);
    expect(engine.getSnapshot(0, {}).players.p2?.isGrabbing).toBe(false);
    expect(engine.getSnapshot(0, {}).players.p2?.state).toBe(PlayerStateEnum.AIRBORNE);
    engine.forfeitPlayer("p2"); expect(engine.getWinnerId()).toBe("p3");
  });
  it("simultaneous final KOs end in a draw and stop future simulation", () => {
    const engine = new GameEngine({ playerIds: ["p1", "p2"] });
    for (const p of Object.values(engine.getSnapshot(0, {}).players)) p.stocks = 0;
    engine.tickGame(new Map());
    expect(engine.isMatchOver()).toBe(true); expect(engine.getWinnerId()).toBeNull();
    const tick = engine.getCurrentTick(); engine.tickGame(new Map());
    expect(engine.getCurrentTick()).toBe(tick);
  });
  it("rejects invalid masks, nonfinite sequences and replayed inputs", () => {
    const { match } = session();
    match.queueInput("p1", { ...input(), held: 256 });
    match.queueInput("p1", { ...input(), seq: NaN });
    match.queueInput("p1", input(2)); match.queueInput("p1", input(1));
    const queues = (match as unknown as { inputQueue: Map<string, InputEvent[]> }).inputQueue;
    expect(queues.get("p1")).toHaveLength(1); expect(queues.get("p1")?.[0]?.seq).toBe(2);
  });
  it("bounds input bursts and preserves button edges", () => {
    const { match } = session();
    for (let seq=0;seq<500;seq++) match.queueInput("p1", { ...input(seq), pressed: seq===0 ? 4 : 0 });
    const queue = (match as unknown as { inputQueue: Map<string, InputEvent[]> }).inputQueue.get("p1")!;
    expect(queue.length).toBeLessThanOrEqual(120);
    expect(queue.reduce((bits, i) => bits | i.pressed, 0)).toBe(4);
  });
  it("uses a free display slot after a middle player leaves", () => {
    const rooms = new RoomManager(); const { roomCode } = rooms.createRoom("s1");
    rooms.joinRoom(roomCode, "s2"); rooms.joinRoom(roomCode, "s3"); rooms.removePlayer("s2");
    expect(rooms.joinRoom(roomCode, "s4")).toMatchObject({ slotIndex: 1 });
  });
  it("does not let repeated Ready reset an active room", () => {
    const rooms = new RoomManager(); const { roomCode, playerId } = rooms.createRoom("s1");
    rooms.startMatch(roomCode); expect(rooms.setReady(roomCode, playerId)).toHaveProperty("error");
    expect(rooms.getRoom(roomCode)?.phase).toBe("MATCH");
  });
});

it("keeps movement continuous across 30 Hz input bursts and clears it on disconnect", () => {
  let now = 0;
  const match = new MatchSession({ playerIds: ["p1", "p2"],
    characterIds: { p1: "all-rounder", p2: "all-rounder" },
    onBroadcast: () => {}, onMatchOver: () => {}, now: () => now });
  const baseline = new GameEngine({ playerIds: ["p1", "p2"] });
  const internal = match as unknown as { processTick(): void; engine: GameEngine };
  for (let tick=0;tick<20;tick++) {
    now = tick * 1000 / 60;
    const current = { ...input(tick), pressed: tick===0 ? 1 : 0 };
    if (tick % 2 === 0) match.queueInput("p1", current);
    internal.processTick();
    baseline.tickGame(new Map([["p1", current]]));
  }
  expect(internal.engine.getStateHash()).toBe(baseline.getStateHash());
  match.releaseInput("p1");
  internal.processTick(); baseline.tickGame(new Map());
  expect(internal.engine.getStateHash()).toBe(baseline.getStateHash());
});
it("expires held input after 250 ms without replaying press edges", () => {
  let now = 0;
  const match = new MatchSession({ playerIds: ["p1", "p2"],
    characterIds: { p1: "all-rounder", p2: "all-rounder" },
    onBroadcast: () => {}, onMatchOver: () => {}, now: () => now });
  const internal = match as unknown as { processTick(): void; engine: GameEngine };
  const baseline = new GameEngine({ playerIds: ["p1", "p2"] });
  match.queueInput("p1", input()); internal.processTick();
  baseline.tickGame(new Map([["p1", input()]]));
  now = 251; internal.processTick(); baseline.tickGame(new Map());
  expect(internal.engine.getStateHash()).toBe(baseline.getStateHash());
});
