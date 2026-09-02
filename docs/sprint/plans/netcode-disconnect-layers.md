# Netcode Disconnect Layers — Auto-Pause + Auto-Forfeit

## TL;DR

> **Quick Summary**: Build a 4-layer disconnect state machine on top of the existing `sprint/netcode-rejoin` scaffold: disconnected players absorb damage silently for 0.5s (already free via existing `EMPTY_INPUT`), then the match auto-pauses at 0.5s, then at 30s total the disconnected player is auto-forfeited (stocks forced to 0) via the existing elimination/win-condition pipeline — reusing `MatchSession.pause()/resume()` and `GameEngine`'s existing stock-elimination logic, with one new small `GameEngine.forceEliminate()` method.
>
> **Deliverables**:
> - Merge/rebase of `sprint/netcode-rejoin` scaffold onto working branch (or confirm it's current baseline)
> - `RoomManager` watchdog timer (1s cadence, lazy start/stop, fake-timer-compatible) driving Layer 1→2 and Layer 3 transitions from a single wall-clock `disconnectedAt` timestamp
> - Layer 1→2: auto-`pause()` at 0.5s if not reconnected
> - Layer 2→0 (resume): gated on room's disconnected-players map being empty, not per-player reconnect (fixes real double-disconnect race)
> - Layer 3: new `GameEngine.forceEliminate(playerId)` method (stocks=0) + wiring from watchdog + `game:over` payload gets optional `reason: "opponent_disconnected"` field
> - Minimal client UX signal for pause state (reuse existing `room:playerDisconnected`/`room:playerRejoined` events, already scaffolded)
> - Full Vitest coverage matching existing project test conventions (fake timers, real-socket integration tests)
>
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Baseline branch confirmation → RoomManager watchdog + timestamp plumbing → GameEngine.forceEliminate → createApp wiring (Layer transitions) → integration tests → final verification

---

## Context

### Original Request
User (via Team D netcode-hardening sprint context) wants a 4-layer disconnect handling state machine:
- Layer 0: connected & playing
- Layer 1 (0–0.5s disconnected): match keeps ticking, disconnected player absorbs damage (already works today via existing `EMPTY_INPUT` lag-tolerance — no new code for Layer 1 itself)
- Layer 2 (0.5s, not reconnected): match auto-pauses for everyone
- Layer 3 (30s total since disconnect, not reconnected): disconnected player is auto-forfeited. 2p match → immediate win for remaining player. 3-4p match → that player is eliminated (stocks=0), match continues among the rest.

### Interview Summary

**Key discussions/decisions**:
- Reuse `MatchSession.pause()`/`resume()` (already exists, already tested, whole-match freeze, idempotent no-ops, correct accumulator handling) — do NOT build a new pause primitive.
- No "pause reason" tracking — single boolean flag, per explicit user decision — BUT the double-disconnect resume race this creates must be fixed by gating auto-`resume()` on "disconnected-players map is empty," not on "this player reconnected."
- 30s in Layer 3 is TOTAL time since disconnect (Layer 2 pause lasts ~29.5s), matching the already-implemented `REJOIN_GRACE_MS = 30_000` in the `sprint/netcode-rejoin` branch — no change to that constant/check needed.
- Timer resets on most-recent-disconnect only (not cumulative across multiple drops in one match) — matches existing `disconnectedAt` overwrite behavior already in the branch.
- "3-4p boot" does NOT mean removing a player from the engine's live roster (no such capability exists, and was never going to be built here) — it means **auto-forfeit**, which maps directly onto the EXISTING stock-elimination mechanic (`stocks <= 0` → eliminated, win-condition already checks `players.filter(p => p.stocks > 0)`). One new small method needed: `GameEngine.forceEliminate(playerId)`.
- 2p forfeit `game:over` payload gets a new optional `reason: "opponent_disconnected"` field (existing natural-win payload is just `{ winnerId }`, no reason field today outside the old immediate-kill path on `main`, which this replaces).
- Test strategy: Vitest, matching existing patterns (`RoomManager.test.ts`, `MatchSession.pause.test.ts`, `createApp.test.ts` real-socket integration style), tests alongside implementation.

**Research findings**:
- `MatchSession.pause()`/`resume()` (`apps/server/src/MatchSession.ts:153-177`): whole-match freeze, idempotent (`if (!this.isRunning || this.paused) return`), broadcasts `game:paused`/`game:resumed`, drops stale input while paused, correct accumulator reset on resume (no tick-catchup spike). Already wired to manual `game:pause`/`game:resume` socket events in `createApp.ts:254,267`.
- `sprint/netcode-rejoin` branch already has `RoomManager.markDisconnected(playerId)` / `rejoinRoom(roomCode, playerId, newSocketId)` with `REJOIN_GRACE_MS = 30_000`, but grace expiry is checked ONLY lazily inside `rejoinRoom()` — no proactive watchdog exists. `cleanupExpiredDisconnects` is referenced in a planning doc but does not exist in code anywhere.
- `sprint/netcode-rejoin` branch's `handleDisconnect` in `createApp.ts` ALREADY replaced main's "kill on disconnect" behavior for MATCH phase (calls `markDisconnected`, lets session run) — main's immediate-kill/`reason: "disconnect"` path is already gone on this branch. This plan builds ON the branch, not on `main`.
- `GameEngine` (`apps/server/src/GameEngine.ts`): `stocks <= 0` = eliminated (line ~606 early-exit, ~2798-2821 elimination/KO handling); win-condition check `players.filter(p => p.stocks > 0)` declares `winnerId` when exactly one remains (~383-391). No public setter exists to force this externally — only `getSnapshot`/`getKOEvents`/`getWinnerId`/`getStateHash`/`getCurrentTick` are public.
- `GameEngine` already has `EMPTY_INPUT` sentinel substituted for any player with no fresh input each tick — this is what makes Layer 1 free (already-existing lag-tolerance mechanism, no new code).
- `RoomManager.getRoomBySocketId` already exists on main, used by `handleDisconnect` to look up room+playerId from a socketId.
- Client side on `sprint/netcode-rejoin`: `GameClient.ts` already has `reconnection: true`, `sessionStorage` persistence of `{roomCode, playerId}`, auto-rejoin-on-connect attempt, and handlers for `room:playerDisconnected`/`room:playerRejoined` (currently just `console.log` stubs).

### Metis Review

**Identified gaps (addressed)**:
- Diff against `sprint/netcode-rejoin`, not `main` — confirmed, this plan explicitly builds on that branch.
- Engine roster immutability concern — resolved: no roster mutation needed at all, `forceEliminate` (stocks=0) reuses 100% existing elimination/win-condition pipeline.
- Double-disconnect resume race — confirmed real bug, fix required (gate resume on map-empty).
- Timer double-bookkeeping risk — addressed: single `disconnectedAt` wall-clock timestamp is the only source of truth for both Layer 1→2 and Layer 3 thresholds.
- `vi.useFakeTimers()` collision risk — addressed: watchdog must use `setInterval`/`clearInterval` (fake-timer compatible), not `setImmediate`+accumulator, with explicit teardown.
- Disconnect-before-`session.start()` race — addressed as an explicit guard/task (mirrors existing `game:pause` handler's `if (!session) return` pattern).
- Room-evaporates-while-disconnected-player-pending race — addressed as an explicit test case.

---

## Work Objectives

### Core Objective
Implement the Layer 1→2→3 disconnect state machine (auto-pause at 0.5s, auto-forfeit at 30s) on top of the existing `sprint/netcode-rejoin` scaffold, reusing existing `pause()`/`resume()` and stock-elimination mechanics, with a proactive watchdog that doesn't depend on the player ever attempting to rejoin.

### Concrete Deliverables
- `RoomManager`: watchdog interval (lazy start/stop), Layer 1→2 auto-pause trigger, Layer 3 auto-forfeit trigger, resume-on-map-empty fix
- `GameEngine`: new `forceEliminate(playerId: PlayerId): void` method
- `createApp.ts`: wiring watchdog callbacks to `session.pause()`/`session.resume()`/`engine.forceEliminate()`, `game:over` payload extended with optional `reason` field
- `GameClient.ts`: minimal UX wiring for existing `room:playerDisconnected`/`room:playerRejoined` stub handlers (replace `console.log` with an actual UI signal call, if a hook point exists; otherwise leave stub with a clear TODO — see task for exact scope)
- Full Vitest test coverage: unit tests (RoomManager watchdog, GameEngine.forceEliminate) + integration tests (createApp.test.ts full disconnect→pause→boot flow)

### Definition of Done
- [ ] `pnpm test` passes with zero failures, including all new tests
- [ ] `pnpm build` passes with zero TypeScript errors
- [ ] Determinism scan still returns 0 matches for `Date.now`/`Math.random` under `packages/engine/src` (this work touches `apps/server`, not `packages/engine` — GameEngine.ts lives in `apps/server`, so this constraint is about a different package and should be unaffected, but verify)

### Must Have
- Layer 1→2 transition triggers `session.pause()` exactly once per disconnect, only if not reconnected within 0.5s
- Layer 2→0 transition (resume) only fires when ALL disconnected players in that room have reconnected (fixes the double-disconnect race)
- Layer 3 (30s from `disconnectedAt`) triggers `GameEngine.forceEliminate(playerId)` regardless of whether the player ever attempts `room:rejoin`
- 2p forfeit emits `game:over` with `{ winnerId, reason: "opponent_disconnected" }`
- 3-4p forfeit: eliminated player drops out via existing win-condition logic, match continues normally among survivors, no `game:over` fires until only one non-eliminated player remains (existing logic, unchanged)
- Watchdog timer is fake-timer-compatible (`setInterval`/`clearInterval`), lazily started/stopped, with explicit teardown callable from tests

### Must NOT Have (Guardrails)
- No changes to the 60Hz tick (`TICK_MS`) or `BROADCAST_EVERY = 3`
- No changes to LOBBY/CHARACTER_SELECT/COUNTDOWN-phase disconnect behavior (immediate removal stays as-is)
- No new msgpack `Set`-typed socket event without registering the existing type-1 extension codec in both `MatchSession.ts` and `GameClient.ts` (this plan should not need any new `Set`-typed payloads at all — flag immediately if one seems necessary)
- No "pause reason" field/tracking system — single boolean flag remains, per explicit user decision
- No engine roster removal/exclusion mechanism — `forceEliminate` only sets `stocks = 0`, does not touch `playerIds` or remove anyone from `GameEngine`'s construction-time roster
- No spectator mode work of any kind — stays out of scope entirely
- No new dependencies

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (Vitest across the monorepo)
- **Automated tests**: Tests alongside implementation, matching existing project convention (not strict TDD red-green)
- **Framework**: Vitest
- **Fake timers**: `vi.useFakeTimers()` + `vi.advanceTimersByTime(ms)` for all Layer-transition timing assertions — no real `setTimeout`/`sleep` in tests

### QA Policy
This is a server-side/backend feature with no new UI surface beyond existing stub handlers. QA scenarios use:
- **Unit-level**: Vitest + fake timers, asserting exact call counts on `pause`/`resume`/`forceEliminate`/`setInterval`/`clearInterval` spies
- **Integration-level**: real socket.io client/server pairs (matching `createApp.test.ts` existing style) for full disconnect→pause→boot flows
- Evidence: test output (pass/fail + assertion detail) saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.txt` via `pnpm test -- --reporter=verbose` output capture

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately - foundation):
├── Task 1: Confirm/rebase sprint/netcode-rejoin as working baseline [quick]
├── Task 2: RoomManager — disconnectedAt-based watchdog scaffold (setInterval lazy start/stop) [deep]
└── Task 3: GameEngine.forceEliminate(playerId) method + unit tests [unspecified-high]

Wave 2 (After Wave 1 - wiring, MAX PARALLEL):
├── Task 4: RoomManager — Layer 1→2 auto-pause trigger wiring (depends: 2) [deep]
├── Task 5: RoomManager — Layer 2→0 resume-on-map-empty fix (depends: 2) [deep]
├── Task 6: RoomManager — Layer 3 auto-forfeit trigger wiring (depends: 2, 3) [deep]
└── Task 7: createApp.ts — wire watchdog callbacks to session.pause/resume + engine.forceEliminate + game:over reason field (depends: 4, 5, 6) [unspecified-high]

Wave 3 (After Wave 2 - integration + edge cases):
├── Task 8: Integration test — full disconnect→pause→reconnect flow (Layer 1→2→0) (depends: 7) [unspecified-high]
├── Task 9: Integration test — full disconnect→pause→boot flow, 2p forfeit (depends: 7) [unspecified-high]
├── Task 10: Integration test — full disconnect→pause→boot flow, 3-4p forfeit + match continues (depends: 7) [unspecified-high]
├── Task 11: Edge case — double-disconnect in 3-4p match, resume race fix verification (depends: 7) [deep]
├── Task 12: Edge case — disconnect before session.start(), room evaporates mid-disconnect (depends: 7) [deep]
└── Task 13: Client — wire room:playerDisconnected/playerRejoined stub handlers to a minimal UX signal (depends: 7) [quick]

Wave FINAL (After ALL tasks — 4 parallel reviews, then user okay):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay

Critical Path: Task 1 → Task 2 → Task 4/5/6 → Task 7 → Task 8-13 → F1-F4 → user okay
Parallel Speedup: ~55% faster than sequential
Max Concurrent: 4 (Wave 2), 6 (Wave 3)
```

### Dependency Matrix

- **1**: none → 2, 3
- **2**: 1 → 4, 5, 6
- **3**: 1 → 6
- **4**: 2 → 7
- **5**: 2 → 7
- **6**: 2, 3 → 7
- **7**: 4, 5, 6 → 8, 9, 10, 11, 12, 13
- **8-13**: 7 → F1-F4

### Agent Dispatch Summary

- **Wave 1**: 3 tasks — T1 → `quick`, T2 → `deep`, T3 → `unspecified-high`
- **Wave 2**: 4 tasks — T4-T6 → `deep`, T7 → `unspecified-high`
- **Wave 3**: 6 tasks — T8-T10 → `unspecified-high`, T11-T12 → `deep`, T13 → `quick`
- **FINAL**: 4 tasks — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [ ] 1. Confirm/rebase `sprint/netcode-rejoin` as working baseline

  **What to do**:
  - Check out (or merge into current working branch) `origin/sprint/netcode-rejoin`. This branch already contains: `RoomManager.markDisconnected`/`rejoinRoom`, `createApp.ts` MATCH-phase disconnect handling (grace instead of immediate kill), client `reconnection: true` + sessionStorage rejoin persistence.
  - Run `pnpm test` on this baseline BEFORE making any new changes — confirm it's green (56 existing tests in `RoomManager.test.ts`/`createApp.test.ts` related to rejoin already pass on this branch).
  - Do NOT modify anything in this task — this is a verification-only task that establishes the starting point for Wave 2/3 tasks.

  **Must NOT do**:
  - Do not cherry-pick only parts of the branch — take it as a whole baseline.
  - Do not attempt to merge `main`'s old immediate-kill disconnect logic back in — the branch's replacement is correct and is what this plan builds on.

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Pure verification/checkout task, no design decisions, no code authored.
  - **Skills**: none needed
  - **Skills Evaluated but Omitted**: `git-master` — omitted because this is a simple checkout/merge, not a complex rebase/history operation.

  **Parallelization**:
  - **Can Run In Parallel**: NO (blocks all other tasks)
  - **Parallel Group**: Sequential, first task
  - **Blocks**: Tasks 2, 3 (all subsequent work)
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `apps/server/src/RoomManager.ts` (branch version) — `markDisconnected`/`rejoinRoom` methods to build on top of
  - `apps/server/src/createApp.ts` (branch version) — MATCH-phase `handleDisconnect` branch to extend
  - `apps/client/src/network/GameClient.ts` (branch version) — existing `reconnection: true` + rejoin stub handlers

  **WHY Each Reference Matters**:
  - These are the exact files every subsequent task modifies — confirming they're in their branch state (not main's old state) prevents building on the wrong baseline.

  **Acceptance Criteria**:
  - [ ] `git log --oneline` on current branch shows the 3 sprint/netcode-rejoin commits (`feat(server): disconnect grace window`, `feat(server): RoomManager rejoin spike`, `feat(client): enable reconnection`)
  - [ ] `pnpm test` passes with zero failures on this baseline

  **QA Scenarios**:

  ```
  Scenario: Baseline test suite is green before new work starts
    Tool: Bash
    Preconditions: Checked out onto sprint/netcode-rejoin baseline (or merged into working branch)
    Steps:
      1. Run `pnpm test` in repo root
      2. Capture full output
    Expected Result: Exit code 0, output shows all test files passing including RoomManager.test.ts "rejoin spike" describe block and createApp.test.ts MATCH-phase disconnect test
    Failure Indicators: Any test failure, especially in RoomManager.test.ts or createApp.test.ts
    Evidence: .sisyphus/evidence/task-1-baseline-tests.txt

  Scenario: Confirm branch content matches expected diff
    Tool: Bash
    Preconditions: On the working branch
    Steps:
      1. Run `git diff main..HEAD -- apps/server/src/RoomManager.ts apps/server/src/createApp.ts apps/client/src/network/GameClient.ts --stat`
    Expected Result: Non-empty diff showing changes to all 3 files matching the sprint/netcode-rejoin scaffold
    Evidence: .sisyphus/evidence/task-1-branch-diff.txt
  ```

  **Commit**: NO (verification only, no changes to commit)

- [ ] 2. `RoomManager` — disconnect watchdog scaffold (setInterval, lazy start/stop)

  **What to do**:
  - Add a private `watchdogInterval: NodeJS.Timeout | null = null` field to `RoomManager`.
  - Add a private method `startWatchdogIfNeeded(): void` that starts `setInterval(() => this.sweepDisconnected(), 1000)` ONLY if `watchdogInterval` is currently `null` AND `disconnectedPlayers.size > 0`. Call this at the end of `markDisconnected()`.
  - Add a private method `stopWatchdogIfIdle(): void` that calls `clearInterval(this.watchdogInterval)` and sets it to `null` if `disconnectedPlayers.size === 0`. Call this after any removal from `disconnectedPlayers` (in `rejoinRoom` success path and inside the sweep itself).
  - Add a private method `sweepDisconnected(): void` — the actual watchdog tick. For this task, stub its body to just iterate `disconnectedPlayers` and compute elapsed time (actual Layer 1→2/Layer 3 actions are wired in Tasks 4-6, NOT this task — this task only builds the timer scaffold + a hook point).
  - Expose a public `stopWatchdog(): void` method (calls `clearInterval` unconditionally, sets to `null`) — required for test teardown, so tests don't leak a real interval next to `vi.useFakeTimers()`.
  - Use `setInterval`/`clearInterval` explicitly (NOT `setImmediate` or any accumulator pattern) — this must be fake-timer-compatible with `vi.useFakeTimers()`.

  **Must NOT do**:
  - Do not touch `MatchSession`'s 60Hz tick loop or its `setImmediate`+accumulator pattern — this watchdog is entirely separate, owned by `RoomManager`.
  - Do not add any actual pause/resume/forceEliminate calls in this task — that's Tasks 4-6. This task is scaffold only.
  - Do not make the interval faster than 1s or slower than 1s without a stated reason — 1s cadence is the agreed design (grace-window precision doesn't need finer resolution).

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Requires careful lifecycle reasoning (lazy start/stop, avoiding leaked intervals across many rooms) and must interact correctly with existing fake-timer test patterns already in the file.
  - **Skills**: none
  - **Skills Evaluated but Omitted**: none applicable

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 3)
  - **Parallel Group**: Wave 1 (with Task 3)
  - **Blocks**: Tasks 4, 5, 6
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `apps/server/src/RoomManager.ts:markDisconnected` (branch) — existing method to extend with the watchdog-start call
  - `apps/server/src/RoomManager.ts:rejoinRoom` (branch) — existing method where watchdog-stop-if-idle should be added after `disconnectedPlayers.delete(playerId)`
  - `apps/server/src/RoomManager.test.ts` "RoomManager rejoin spike" describe block (branch) — existing `vi.useFakeTimers()`/`vi.setSystemTime()`/`vi.advanceTimersByTime()` pattern to follow exactly for new tests

  **Test References**:
  - `apps/server/src/RoomManager.test.ts` (branch, existing `beforeEach`/`afterEach` with `vi.useFakeTimers()`/`vi.useRealTimers()`) — new tests in this task must follow this exact setup/teardown pattern, and must call the new `stopWatchdog()` in `afterEach` to prevent leaking real intervals.

  **WHY Each Reference Matters**:
  - `markDisconnected`/`rejoinRoom` are the exact two integration points where the watchdog lifecycle must hook in — get these wrong and either the watchdog never starts, or it leaks forever.
  - The existing fake-timer test pattern is the proof this needs to be compatible with — `setInterval` under `vi.useFakeTimers()` behaves correctly, `setImmediate`-based accumulator loops (like `MatchSession`'s) do not, which is exactly why this must NOT copy `MatchSession`'s pattern.

  **Acceptance Criteria**:
  - [ ] `bun test` / `pnpm test -- RoomManager` passes (or equivalent monorepo test command)
  - [ ] New method `stopWatchdog()` is public and callable from tests
  - [ ] No TypeScript errors (`tsc --noEmit`)

  **QA Scenarios**:

  ```
  Scenario: Watchdog starts on first markDisconnected call
    Tool: Bash (vitest)
    Preconditions: Fresh RoomManager instance, vi.useFakeTimers() active
    Steps:
      1. Spy on global setInterval: `const spy = vi.spyOn(global, 'setInterval')`
      2. Create a room, call `manager.markDisconnected(playerId)`
      3. Assert `spy` was called exactly once with a 1000ms interval
    Expected Result: setInterval called exactly once, interval = 1000
    Failure Indicators: setInterval called 0 times, called more than once, or with wrong interval value
    Evidence: .sisyphus/evidence/task-2-watchdog-start.txt

  Scenario: Watchdog does NOT start twice for two disconnected players
    Tool: Bash (vitest)
    Preconditions: Fresh RoomManager instance, vi.useFakeTimers() active
    Steps:
      1. Spy on setInterval
      2. markDisconnected for player A, then markDisconnected for player B (different room or same room)
      3. Assert setInterval was called exactly once total (not twice)
    Expected Result: setInterval call count === 1
    Evidence: .sisyphus/evidence/task-2-watchdog-single-start.txt

  Scenario: Watchdog stops when disconnected-players map becomes empty
    Tool: Bash (vitest)
    Preconditions: One player marked disconnected, watchdog running
    Steps:
      1. Spy on clearInterval
      2. Call rejoinRoom to bring that player back within grace window
      3. Assert clearInterval was called exactly once
    Expected Result: clearInterval called once, watchdogInterval field is null afterward
    Evidence: .sisyphus/evidence/task-2-watchdog-stop.txt

  Scenario: stopWatchdog() is a safe no-op when nothing is running (test teardown safety)
    Tool: Bash (vitest)
    Preconditions: Fresh RoomManager instance, watchdog never started
    Steps:
      1. Call `manager.stopWatchdog()`
    Expected Result: No error thrown, no crash
    Evidence: .sisyphus/evidence/task-2-stopwatchdog-noop.txt
  ```

  **Commit**: YES (groups with Task 3)
  - Message: `feat(server): add RoomManager disconnect watchdog scaffold`
  - Files: `apps/server/src/RoomManager.ts`, `apps/server/src/RoomManager.test.ts`
  - Pre-commit: `pnpm test`

- [ ] 3. `GameEngine.forceEliminate(playerId)` method + unit tests

  **What to do**:
  - Add a new public method `forceEliminate(playerId: PlayerId): void` to `GameEngine`.
  - Implementation: locate the player in internal state, set their `stocks = 0` (reuse whatever internal player-lookup pattern the class already uses elsewhere, e.g. how `queueInput` or the tick loop looks up a player by id).
  - Do NOT duplicate elimination logic — setting `stocks = 0` and letting the NEXT `tick()` call run the existing early-exit-for-eliminated-players path (`~line 606`) and the existing win-condition check (`~line 383-391`) is sufficient. Confirm this is genuinely true by testing that calling `forceEliminate` then `tick()` produces the same observable state as a normal in-game KO to 0 stocks (same `KOEventData`/elimination freeze behavior, or explicitly document if `forceEliminate` intentionally skips the KO-event/blast-zone-freeze cosmetic path since there's no actual hit involved — recommend: skip KO event entirely, this isn't a real knockout, just set stocks directly and let win-condition check run naturally next tick).
  - If a player is already eliminated (`stocks <= 0`) when `forceEliminate` is called, this should be a safe no-op (idempotent), matching the idempotency style of `MatchSession.pause()`/`resume()`.

  **Must NOT do**:
  - Do not add a `removePlayer`/`eliminatePlayer` method that touches `playerIds` or the engine's constructor-time roster — this is explicitly out of scope (confirmed with user: auto-forfeit, not roster removal).
  - Do not fire a `KOEventData` for this (no real hit occurred) unless investigation shows the win-condition check specifically depends on a KO event being present — verify this first, don't assume.
  - Do not change `applyKnockouts` or any blast-zone detection logic.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Requires careful reading of existing elimination/win-condition code to correctly reuse it without duplicating or breaking existing KO behavior, but isn't a deep architectural decision — mechanism is already fully decided.
  - **Skills**: none
  - **Skills Evaluated but Omitted**: none applicable

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 2)
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Task 6
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `apps/server/src/GameEngine.ts:606` — existing early-exit for eliminated players (`stocks <= 0`) — the exact condition `forceEliminate` needs to trigger
  - `apps/server/src/GameEngine.ts:383-391` — existing win-condition check (`players.filter(p => p.stocks > 0)`, `winnerId` assignment) — must be confirmed to run correctly after `forceEliminate` on the next tick, with no changes needed to this block itself
  - `apps/server/src/GameEngine.ts:2798-2821` — existing elimination/KO handling detail (freezes player in terminal eliminated state) — read this to understand exactly what "eliminated" state looks like so `forceEliminate` produces a consistent result

  **API/Type References**:
  - `PlayerId` type from `@smash/shared` — parameter type for `forceEliminate`

  **WHY Each Reference Matters**:
  - Line 606 and 383-391 are the two places that must "just work" after `forceEliminate` runs — the whole point of this method is doing the absolute minimum (one field write) and trusting the existing machinery, so understanding exactly what these blocks check is what proves the minimal approach is sufficient.

  **Acceptance Criteria**:
  - [ ] `forceEliminate` is a public method on `GameEngine`, typed `(playerId: PlayerId) => void`
  - [ ] Calling `forceEliminate` then `tick()` results in that player having `stocks === 0` in the resulting snapshot
  - [ ] In a 2-player engine instance, calling `forceEliminate` on one player then `tick()` results in `getWinnerId()` returning the OTHER player's id
  - [ ] In a 3-4 player engine instance, calling `forceEliminate` on one player then `tick()` results in `getWinnerId()` still `null` (match continues), and the eliminated player no longer affects subsequent physics/hit resolution for themselves
  - [ ] Calling `forceEliminate` twice on the same already-eliminated player does not throw and does not change `getWinnerId()` unexpectedly

  **QA Scenarios**:

  ```
  Scenario: forceEliminate on one of two players ends the match with correct winner
    Tool: Bash (vitest)
    Preconditions: Fresh GameEngine with 2 playerIds ["p1", "p2"], MATCH_CONFIG.STOCKS default stocks
    Steps:
      1. Call `engine.forceEliminate("p2")`
      2. Call `engine.tick(EMPTY_INPUT, EMPTY_INPUT)` (or whatever the tick signature requires)
      3. Call `engine.getWinnerId()`
    Expected Result: Returns "p1"
    Failure Indicators: Returns null, returns "p2", or throws
    Evidence: .sisyphus/evidence/task-3-forceeliminate-2p-winner.txt

  Scenario: forceEliminate on one of four players does not end the match
    Tool: Bash (vitest)
    Preconditions: Fresh GameEngine with 4 playerIds
    Steps:
      1. Call `engine.forceEliminate("p2")`
      2. Call `engine.tick(...)` with EMPTY_INPUT for all 4
      3. Call `engine.getWinnerId()`
    Expected Result: Returns null (3 players still have stocks > 0)
    Evidence: .sisyphus/evidence/task-3-forceeliminate-4p-continues.txt

  Scenario: forceEliminate is idempotent on an already-eliminated player
    Tool: Bash (vitest)
    Preconditions: Fresh GameEngine, 2 players, one already at stocks=0
    Steps:
      1. Call `engine.forceEliminate(alreadyEliminatedPlayerId)` a second time
      2. Call `engine.tick(...)`
    Expected Result: No exception thrown, getWinnerId() unaffected/unchanged from before the redundant call
    Evidence: .sisyphus/evidence/task-3-forceeliminate-idempotent.txt
  ```

  **Commit**: YES
  - Message: `feat(server): add GameEngine.forceEliminate for disconnect auto-forfeit`
  - Files: `apps/server/src/GameEngine.ts`, `apps/server/src/GameEngine.forceEliminate.test.ts` (new test file, or append to existing GameEngine test file matching project convention)
  - Pre-commit: `pnpm test`

- [ ] 4. `RoomManager` — Layer 1→2 auto-pause trigger wiring

  **What to do**:
  - Extend `sweepDisconnected()` (from Task 2's scaffold) to check, for each entry in `disconnectedPlayers`: if `Date.now() - disconnectedAt >= 500` AND this player hasn't already been flagged as "paused for" (add a boolean or a `Set<PlayerId>` field like `pausedFor: Set<PlayerId>` to track this, to avoid re-triggering the callback every sweep tick once already paused) → invoke a registered callback.
  - `RoomManager` should NOT directly call `MatchSession.pause()` itself (it doesn't own `MatchSession` instances — those live in `createApp.ts`'s `matchSessions` map). Instead, add a way for `createApp.ts` to register callbacks, e.g. a constructor option or a settable field like `onDisconnectGraceElapsed?: (roomCode: string, playerId: PlayerId) => void` that `sweepDisconnected()` invokes once per player when the 0.5s threshold is crossed.
  - Add the `pausedFor` (or equivalent) tracking so this callback fires exactly ONCE per disconnect event, not on every subsequent 1s sweep tick.
  - Clear the `pausedFor` entry when the player is removed from `disconnectedPlayers` (on rejoin or on Layer 3 forfeit).

  **Must NOT do**:
  - Do not have `RoomManager` import or directly reference `MatchSession` — keep the callback-based decoupling so `RoomManager` stays testable in isolation (matching how it's tested today with plain unit tests, no socket/session mocking).
  - Do not fire the callback more than once per disconnect event.

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Requires careful state-tracking design (avoiding duplicate callback fires) integrated into the watchdog scaffold from Task 2, with correctness implications if done wrong (double-pause calls, though those are separately idempotent — but wasted work/confusing logs either way).
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 5, 6)
  - **Parallel Group**: Wave 2 (with Tasks 5, 6)
  - **Blocks**: Task 7
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `apps/server/src/RoomManager.ts` (this task's own Task 2 output) — the `sweepDisconnected()` stub to extend
  - `apps/server/src/createApp.ts:254` (branch) — existing `game:pause` handler calling `session.pause()`, showing the exact call this new callback needs to trigger from the `createApp.ts` side (wired in Task 7, but this task's callback signature must be designed to make that wiring trivial)

  **WHY Each Reference Matters**:
  - The existing `game:pause` handler shows exactly what needs to happen once this callback fires — `createApp.ts` needs enough info (roomCode + playerId, or just roomCode since pause is match-wide) to find the right `MatchSession` in its `matchSessions` map and call `.pause()` on it.

  **Acceptance Criteria**:
  - [ ] Callback fires exactly once, ~500ms after `markDisconnected` (verified with fake timers)
  - [ ] Callback does NOT fire again on subsequent sweep ticks for the same still-disconnected player
  - [ ] Callback does NOT fire if the player reconnects before 500ms elapses

  **QA Scenarios**:

  ```
  Scenario: Callback fires once at 500ms
    Tool: Bash (vitest, fake timers)
    Preconditions: RoomManager with onDisconnectGraceElapsed callback registered (mock fn)
    Steps:
      1. markDisconnected(playerId)
      2. vi.advanceTimersByTime(1000) (one sweep tick past 500ms threshold)
      3. Assert mock callback called exactly once with correct (roomCode, playerId)
      4. vi.advanceTimersByTime(1000) again (second sweep tick)
      5. Assert mock callback STILL called exactly once total (not twice)
    Expected Result: Callback invoked exactly once across both sweep ticks
    Evidence: .sisyphus/evidence/task-4-pause-trigger-once.txt

  Scenario: Callback does not fire if reconnect happens before 500ms
    Tool: Bash (vitest, fake timers)
    Preconditions: RoomManager with callback registered
    Steps:
      1. markDisconnected(playerId)
      2. vi.advanceTimersByTime(400) (before 500ms + before first 1s sweep even runs)
      3. rejoinRoom(roomCode, playerId, newSocketId)
      4. vi.advanceTimersByTime(1000)
      5. Assert callback was never called
    Expected Result: Callback call count === 0
    Evidence: .sisyphus/evidence/task-4-pause-trigger-cancelled.txt
  ```

  **Commit**: YES (groups with 5, 6)
  - Message: `feat(server): wire Layer 1-2-3 disconnect transitions in RoomManager`
  - Files: `apps/server/src/RoomManager.ts`, `apps/server/src/RoomManager.test.ts`
  - Pre-commit: `pnpm test`

- [ ] 5. `RoomManager` — Layer 2→0 resume-on-map-empty fix (double-disconnect race)

  **What to do**:
  - In `rejoinRoom()`'s success path, after removing the rejoining player from `disconnectedPlayers` (and from `pausedFor`), check: is `disconnectedPlayers` (filtered to this specific `roomCode`) now empty for this room?
  - Add/use a registered callback, e.g. `onAllDisconnectedPlayersReturned?: (roomCode: string) => void`, invoked ONLY when the room has zero remaining disconnected players — this is what `createApp.ts` (Task 7) will use to decide whether it's safe to call `session.resume()`.
  - This directly fixes the double-disconnect race Metis identified: if two players in the same 3-4p room are both disconnected and paused, and one reconnects, `onAllDisconnectedPlayersReturned` must NOT fire (the other player is still disconnected) — only when the LAST disconnected player in that room reconnects does the callback fire.
  - Note: `disconnectedPlayers` is currently a flat `Map<PlayerId, DisconnectedPlayerRecord>` (not scoped per room) — this task needs to filter/count by `roomCode` correctly (the `DisconnectedPlayerRecord` already stores `roomCode`, so `[...disconnectedPlayers.values()].filter(r => r.roomCode === roomCode).length === 0` is the check, or maintain a more efficient per-room count if performance is a concern — not expected to matter at this scale, correctness over micro-optimization).

  **Must NOT do**:
  - Do not gate resume on "this specific player reconnected" — that's the bug being fixed. Must gate on "zero disconnected players remain in this room."
  - Do not add a "pause reason" tracking field — this fix uses only the existing `disconnectedPlayers` map contents as the source of truth, no new parallel state needed beyond what's already there.

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: This is a correctness-critical fix for a real identified race condition — needs careful reasoning about room-scoped filtering of a flat map, and must be proven correct with a dedicated multi-disconnect test (this task's own acceptance criteria), not just trusted.
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 4, 6)
  - **Parallel Group**: Wave 2 (with Tasks 4, 6)
  - **Blocks**: Task 7
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `apps/server/src/RoomManager.ts:rejoinRoom` (branch, ~line 224-243 per the earlier diff shown in this session) — exact method to extend; the existing `disconnectedPlayers.delete(playerId)` line is where the room-empty check needs to be added immediately after
  - `apps/server/src/RoomManager.ts` `DisconnectedPlayerRecord` type (branch) — already has `roomCode` field, use this for filtering

  **WHY Each Reference Matters**:
  - `rejoinRoom` already deletes the player from `disconnectedPlayers` on success — this task's check must happen AFTER that deletion, checking what remains, not before (order matters: checking before would incorrectly count the just-reconnected player as still disconnected).

  **Acceptance Criteria**:
  - [ ] Two players marked disconnected in the same room; first player's rejoin does NOT trigger `onAllDisconnectedPlayersReturned`
  - [ ] Same scenario; second player's rejoin (now the last one) DOES trigger `onAllDisconnectedPlayersReturned`
  - [ ] Single-disconnect case (only one player ever disconnected) still triggers the callback correctly on that player's rejoin (no regression)

  **QA Scenarios**:

  ```
  Scenario: Double-disconnect in 3-4p room — first reconnect does not trigger resume
    Tool: Bash (vitest, fake timers)
    Preconditions: RoomManager, 4-player room, onAllDisconnectedPlayersReturned callback registered (mock fn)
    Steps:
      1. markDisconnected(playerA)
      2. markDisconnected(playerB)
      3. rejoinRoom(roomCode, playerA, newSocketA)
      4. Assert mock callback NOT called
    Expected Result: Callback call count === 0 after first reconnect
    Failure Indicators: Callback fires after only one of two disconnected players returns
    Evidence: .sisyphus/evidence/task-5-double-disconnect-partial-reconnect.txt

  Scenario: Double-disconnect in 3-4p room — second (last) reconnect triggers resume
    Tool: Bash (vitest, fake timers)
    Preconditions: Continuing from previous scenario state
    Steps:
      1. rejoinRoom(roomCode, playerB, newSocketB)
      2. Assert mock callback called exactly once, with correct roomCode
    Expected Result: Callback fires exactly once, only after the LAST disconnected player reconnects
    Evidence: .sisyphus/evidence/task-5-double-disconnect-full-reconnect.txt

  Scenario: Single-disconnect regression check
    Tool: Bash (vitest, fake timers)
    Preconditions: RoomManager, 2-player room, only one player ever disconnects
    Steps:
      1. markDisconnected(playerA)
      2. rejoinRoom(roomCode, playerA, newSocketA)
      3. Assert callback called exactly once
    Expected Result: Normal single-disconnect rejoin still triggers the callback correctly
    Evidence: .sisyphus/evidence/task-5-single-disconnect-regression.txt
  ```

  **Commit**: YES (groups with 4, 6)
  - Message: `feat(server): wire Layer 1-2-3 disconnect transitions in RoomManager`
  - Files: `apps/server/src/RoomManager.ts`, `apps/server/src/RoomManager.test.ts`
  - Pre-commit: `pnpm test`

- [ ] 6. `RoomManager` — Layer 3 auto-forfeit trigger wiring

  **What to do**:
  - Extend `sweepDisconnected()` further: for each entry in `disconnectedPlayers`, if `Date.now() - disconnectedAt >= REJOIN_GRACE_MS` (30_000, reuse the existing constant), invoke a registered callback, e.g. `onGraceExpired?: (roomCode: string, playerId: PlayerId) => void`.
  - After invoking the callback, remove that player from `disconnectedPlayers` AND `pausedFor` (Task 4's tracking set) — they're resolved now, no longer "disconnected and waiting," they're forfeited.
  - This removal must ALSO trigger the Task 5 "room now has zero disconnected players" check if applicable (i.e., if this was the last disconnected player in the room, both this callback's cleanup AND a potential resume-eligibility check happen — though in practice, a forfeited player's room won't need `resume()` called for them specifically; but if OTHER players were ALSO disconnected in the same room, removing this one might make the room disconnected-count hit zero, which should still correctly trigger Task 5's callback for the remaining pause state). Be careful to reuse the exact same "count remaining disconnected in this room" logic from Task 5, don't duplicate it with different logic.
  - Call `stopWatchdogIfIdle()` (Task 2) after this cleanup, same as Task 5 does.

  **Must NOT do**:
  - Do not call `GameEngine.forceEliminate` directly from `RoomManager` — `RoomManager` doesn't have a reference to `GameEngine`/`MatchSession` instances. Only invoke the registered callback; `createApp.ts` (Task 7) is responsible for calling `engine.forceEliminate(playerId)` when this callback fires.
  - Do not change `REJOIN_GRACE_MS`'s value (still 30_000, per confirmed decision).

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Integrates with both Task 2's watchdog scaffold and Task 5's room-empty-check logic — needs to correctly compose with sibling Wave 2 tasks without duplicating logic (shared "count disconnected in room" helper should be extracted and reused by both Task 5 and this task).
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 4, 5)
  - **Parallel Group**: Wave 2 (with Tasks 4, 5)
  - **Blocks**: Task 7
  - **Blocked By**: Tasks 2, 3

  **References**:

  **Pattern References**:
  - `apps/server/src/RoomManager.ts` `REJOIN_GRACE_MS` constant (branch) — reuse exactly, do not redefine
  - `apps/server/src/RoomManager.ts:rejoinRoom` (branch) — existing grace-expiry check (`elapsedMs > REJOIN_GRACE_MS`) inside `rejoinRoom` shows the exact comparison logic to mirror in the proactive watchdog sweep

  **WHY Each Reference Matters**:
  - The existing lazy check inside `rejoinRoom` is the reference implementation for "how do we know grace expired" — the watchdog sweep needs the identical comparison (`Date.now() - disconnectedAt > REJOIN_GRACE_MS`) applied proactively instead of only on rejoin attempt, using the same constant so the two paths can never disagree on timing.

  **Acceptance Criteria**:
  - [ ] Callback fires exactly once when `Date.now() - disconnectedAt >= 30_000` (verified with fake timers advancing to exactly that point)
  - [ ] Player is removed from `disconnectedPlayers` after the callback fires
  - [ ] If the player attempts `rejoinRoom` AFTER the watchdog has already fired the expiry callback, it correctly returns the existing `{ error: 'Rejoin grace window expired' }` (or equivalent — player is no longer in `disconnectedPlayers` at all at this point, so `rejoinRoom` should return `{ error: 'Player is not disconnected' }` — confirm which error message is accurate given the player was already swept, and this is fine as-is, just confirm no crash)

  **QA Scenarios**:

  ```
  Scenario: Layer 3 callback fires at 30s
    Tool: Bash (vitest, fake timers)
    Preconditions: RoomManager with onGraceExpired callback registered (mock fn)
    Steps:
      1. markDisconnected(playerId)
      2. vi.advanceTimersByTime(30_000)
      3. Assert mock callback called exactly once with correct (roomCode, playerId)
      4. Assert disconnectedPlayers no longer contains playerId
    Expected Result: Callback fires once at the 30s mark, player removed from tracking
    Evidence: .sisyphus/evidence/task-6-forfeit-trigger.txt

  Scenario: Late rejoin attempt after watchdog already expired the player does not crash
    Tool: Bash (vitest, fake timers)
    Preconditions: Continuing from previous scenario (player already swept/forfeited)
    Steps:
      1. Call rejoinRoom(roomCode, playerId, newSocketId)
      2. Assert it returns an error object (not throw), and does not re-add the player to disconnectedPlayers
    Expected Result: Graceful `{ error: string }` response, no exception
    Evidence: .sisyphus/evidence/task-6-late-rejoin-after-forfeit.txt
  ```

  **Commit**: YES (groups with 4, 5)
  - Message: `feat(server): wire Layer 1-2-3 disconnect transitions in RoomManager`
  - Files: `apps/server/src/RoomManager.ts`, `apps/server/src/RoomManager.test.ts`
  - Pre-commit: `pnpm test`

- [ ] 7. `createApp.ts` — wire watchdog callbacks to session.pause/resume + engine.forceEliminate + game:over reason field

  **What to do**:
  - When constructing/using the `RoomManager` instance in `createApp.ts`, register the three callbacks from Tasks 4-6:
    - `onDisconnectGraceElapsed(roomCode, playerId)` → look up the active `MatchSession` for `roomCode` in the existing `matchSessions` map; if found and running, call `session.pause()`. Guard: `if (!session) return;` (mirrors existing `game:pause` handler's exact guard pattern) — handles the disconnect-before-session-start race.
    - `onAllDisconnectedPlayersReturned(roomCode)` → look up the `MatchSession`, if found and paused, call `session.resume()`. Same guard pattern.
    - `onGraceExpired(roomCode, playerId)` → look up the `MatchSession`, if found, get its `GameEngine` instance (may require exposing a getter on `MatchSession` if one doesn't already exist — check first) and call `engine.forceEliminate(playerId)`. Additionally, check `roomManager.getPlayerIds(roomCode).length` (or equivalent) BEFORE vs the remaining count to determine if this was a 2-player match; if so, after the next tick resolves `winnerId`, ensure the `game:over` broadcast includes `reason: "opponent_disconnected"`.
  - For the `game:over` reason field: find where `game:over` is currently emitted in the normal win-condition path (search for `"game:over"` emit sites in `createApp.ts`/`MatchSession.ts`) and extend the payload type to include an optional `reason?: string` field, populated only when the winner resulted from this forced-elimination path (not from normal combat KOs). This likely requires threading a flag/reason through from the `forceEliminate` call site to wherever the `game:over` emit happens — investigate the exact call chain (does `MatchSession` already expose a way to know "why" the match ended, or does `createApp.ts` need to track this itself, e.g. in a small `Map<roomCode, reason>` set right before calling `forceEliminate` and read right when `game:over` fires)?
  - Register these callbacks once, at `RoomManager` construction time (or immediately after), not per-request.

  **Must NOT do**:
  - Do not introduce a new msgpack `Set`-typed payload for the `game:over` reason field — it's a simple optional string field on an existing plain-object payload, not a `Set`.
  - Do not change the `game:over` payload shape for NORMAL wins (no `reason` field, or `reason: undefined`, should be indistinguishable from today's `{ winnerId }` shape on the client side for existing combat-based wins).
  - Do not duplicate the `game:pause`/`game:resume`/`game:over` guard-and-lookup logic — extract a small shared helper if the pattern repeats 3+ times, following the existing code style in this file.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: This is integration/plumbing work across three separate callback wiring points plus a payload-shape change, requiring careful investigation of existing call chains (does MatchSession expose GameEngine? where exactly does game:over currently fire?) before writing code — not a deep architectural task, but requires diligence to avoid missing a call site.
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: NO (single task, but is itself the sync point for Wave 2)
  - **Parallel Group**: Sequential (last task in Wave 2)
  - **Blocks**: Tasks 8, 9, 10, 11, 12, 13
  - **Blocked By**: Tasks 4, 5, 6

  **References**:

  **Pattern References**:
  - `apps/server/src/createApp.ts:254,267` (branch) — existing `game:pause`/`game:resume` handlers, exact guard pattern (`if (!session) return`) to replicate for the new callbacks
  - `apps/server/src/createApp.ts` — search for existing `"game:over"` emit call site(s) in the normal win-condition path (not the old disconnect-immediate-kill path, which is already gone on this branch) — this is the exact spot needing the optional `reason` field extension

  **API/Type References**:
  - `MatchSession` public API (`apps/server/src/MatchSession.ts`) — check whether a getter for the internal `GameEngine` instance already exists; if not, this task needs to add a minimal one (e.g. `getEngine(): GameEngine` or expose just `forceEliminate` as a pass-through method on `MatchSession` itself, whichever is more consistent with existing `MatchSession` API style — recommend checking how `queueInput` already delegates to the engine, and mirror that delegation style rather than exposing the whole engine instance)

  **WHY Each Reference Matters**:
  - The exact guard pattern in the existing pause/resume handlers is what prevents the disconnect-before-session-start race (session doesn't exist yet in the map) from crashing — every new callback needs the identical defensive check.
  - Finding the real `game:over` emit site (not the deleted old path) is essential — Metis specifically flagged confusing the two.

  **Acceptance Criteria**:
  - [ ] `onDisconnectGraceElapsed` correctly calls `session.pause()` when a session exists, and safely no-ops when it doesn't (session not yet started)
  - [ ] `onAllDisconnectedPlayersReturned` correctly calls `session.resume()` when a session exists
  - [ ] `onGraceExpired` correctly calls `forceEliminate` (via whatever delegation method was added) on the right `MatchSession`/`GameEngine` instance
  - [ ] `game:over` payload includes `reason: "opponent_disconnected"` when the win resulted from a 2-player forfeit, and has no `reason` field (or `undefined`) for normal combat wins
  - [ ] `tsc --noEmit` passes with the extended payload type

  **QA Scenarios**:

  ```
  Scenario: Full integration — disconnect triggers pause via real MatchSession
    Tool: Bash (vitest, fake timers + real socket.io server, matching createApp.test.ts style)
    Preconditions: Real createApp() instance, 2 connected clients, match in progress (MATCH phase)
    Steps:
      1. Disconnect client B's socket
      2. Advance fake timers by 600ms (past the 500ms Layer 1-2 threshold + one 1s sweep tick)
      3. Listen for `game:paused` event on client A's socket
    Expected Result: client A receives `game:paused` event within the advanced time window
    Failure Indicators: No `game:paused` event received, or session crashes
    Evidence: .sisyphus/evidence/task-7-integration-pause.txt

  Scenario: Disconnect-before-session-start does not crash
    Tool: Bash (vitest)
    Preconditions: Room created, players joined, but MATCH phase / session.start() has NOT yet been called (still in COUNTDOWN or the split-second race before start)
    Steps:
      1. Trigger the onDisconnectGraceElapsed callback path with a roomCode that has no entry in matchSessions yet
      2. Assert no exception is thrown
    Expected Result: Graceful no-op, no crash
    Evidence: .sisyphus/evidence/task-7-race-before-start.txt

  Scenario: 2p forfeit produces game:over with correct reason
    Tool: Bash (vitest, fake timers + real socket.io, createApp.test.ts style)
    Preconditions: Real createApp() instance, 2 connected clients, match in progress
    Steps:
      1. Disconnect client B's socket
      2. Advance fake timers by 30_000ms+
      3. Listen for `game:over` event on client A's socket
      4. Assert payload equals `{ winnerId: <clientA's playerId>, reason: "opponent_disconnected" }`
    Expected Result: game:over fires with correct winnerId and reason string
    Evidence: .sisyphus/evidence/task-7-2p-forfeit-reason.txt
  ```

  **Commit**: YES
  - Message: `feat(server): wire disconnect layer callbacks into createApp`
  - Files: `apps/server/src/createApp.ts`, `apps/server/src/MatchSession.ts` (if a delegation method is added), `apps/server/src/createApp.test.ts`
  - Pre-commit: `pnpm test`

- [ ] 8. Integration test — full disconnect→pause→reconnect flow (Layer 1→2→0)

  **What to do**:
  - Write a `createApp.test.ts`-style real-socket integration test: two real clients join, reach MATCH phase, client B disconnects, advance fake timers past 500ms, assert client A receives `game:paused`, then simulate client B reconnecting via `room:rejoin` within the 30s grace window, advance timers slightly, assert client A receives `game:resumed`.
  - This exercises the full Wave 2 wiring end-to-end (Tasks 4, 5, 7 combined) with real sockets, not mocks.

  **Must NOT do**: Do not mock `RoomManager` or `MatchSession` internals — this must be a genuine end-to-end test through real socket.io connections, matching the existing style already present in `createApp.test.ts`'s "keeps session alive during MATCH phase disconnect" test.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 9-13)
  - **Parallel Group**: Wave 3
  - **Blocks**: F1-F4
  - **Blocked By**: Task 7

  **References**:
  - `apps/server/src/createApp.test.ts` (branch) — existing "keeps session alive during MATCH phase disconnect and allows rejoin within grace window" test is the direct template to extend with pause/resume assertions

  **WHY it matters**: This existing test already builds the full room→match→disconnect→rejoin scaffolding; this task adds pause/resume event assertions to it (or a sibling test) rather than rebuilding setup from scratch.

  **Acceptance Criteria**:
  - [ ] Test passes, asserting `game:paused` received by remaining client after 500ms+ of disconnect
  - [ ] Test passes, asserting `game:resumed` received after reconnect

  **QA Scenarios**:
  ```
  Scenario: Full disconnect-pause-reconnect-resume cycle
    Tool: Bash (vitest, real socket.io + fake timers)
    Steps:
      1. Boot 2 clients into MATCH phase (reuse existing test helper)
      2. Disconnect client B
      3. Advance timers 600ms, assert client A gets game:paused
      4. Reconnect client B via room:rejoin
      5. Assert client A gets game:resumed
    Expected Result: Both events received in correct order
    Evidence: .sisyphus/evidence/task-8-full-cycle.txt
  ```
  **Commit**: YES (groups with 9, 10)
  - Message: `test(server): integration tests for disconnect layer transitions`
  - Files: `apps/server/src/createApp.test.ts`
  - Pre-commit: `pnpm test`

- [ ] 9. Integration test — full disconnect→pause→boot flow, 2p forfeit

  **What to do**:
  - Extend the same integration test family: two clients, client B disconnects and NEVER reconnects, advance fake timers past 30s, assert client A receives `game:over` with `{ winnerId: <clientA-playerId>, reason: "opponent_disconnected" }`.

  **Must NOT do**: Do not shortcut by calling `forceEliminate` directly in the test — must go through the real disconnect→watchdog→callback chain via actual socket disconnection.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 8, 10-13)
  - **Parallel Group**: Wave 3
  - **Blocks**: F1-F4
  - **Blocked By**: Task 7

  **References**:
  - `apps/server/src/createApp.test.ts` (branch) — same base template as Task 8

  **Acceptance Criteria**:
  - [ ] Test passes, asserting correct `game:over` payload after 30s of no reconnect in a 2p match

  **QA Scenarios**:
  ```
  Scenario: 2p match, disconnected player never returns, forfeit fires at 30s
    Tool: Bash (vitest, real socket.io + fake timers)
    Steps:
      1. Boot 2 clients into MATCH phase
      2. Disconnect client B, never reconnect
      3. Advance timers 30_000ms+
      4. Assert client A receives game:over with winnerId = clientA's id, reason = "opponent_disconnected"
    Expected Result: Correct payload received
    Evidence: .sisyphus/evidence/task-9-2p-forfeit.txt
  ```
  **Commit**: YES (groups with 8, 10)
  - Message: `test(server): integration tests for disconnect layer transitions`
  - Files: `apps/server/src/createApp.test.ts`
  - Pre-commit: `pnpm test`

- [ ] 10. Integration test — full disconnect→pause→boot flow, 3-4p forfeit + match continues

  **What to do**:
  - Extend test suite to a 3 or 4-player room: one client disconnects and never returns, advance past 30s, assert NO `game:over` fires (match continues), and assert the remaining players can keep playing (e.g., subsequent `game:input` events still produce `game:state` broadcasts).
  - Optionally verify (via a snapshot or exposed test hook) that the forfeited player's `stocks === 0` in the broadcast state, if the snapshot data is accessible in the test.

  **Must NOT do**: Do not assert the disconnected player is removed from the room's player list — they remain a room member, just eliminated within the running match (per the confirmed "auto-forfeit, not roster removal" decision).

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 8, 9, 11-13)
  - **Parallel Group**: Wave 3
  - **Blocks**: F1-F4
  - **Blocked By**: Task 7

  **References**:
  - `apps/server/src/createApp.test.ts` (branch) — extend the 3-4 player room-creation helpers already present (`bootAndConnect(N)` pattern seen in existing tests)

  **Acceptance Criteria**:
  - [ ] Test passes: 4p match, one disconnect never returns, no `game:over` after 30s+, remaining 3 players' `game:input`/`game:state` flow continues normally

  **QA Scenarios**:
  ```
  Scenario: 4p match, one disconnected player forfeits, match continues for the other 3
    Tool: Bash (vitest, real socket.io + fake timers)
    Steps:
      1. Boot 4 clients into MATCH phase
      2. Disconnect client D, never reconnect
      3. Advance timers 30_000ms+
      4. Assert no game:over received by remaining clients
      5. Send game:input from client A, assert game:state broadcast still occurs
    Expected Result: Match continues normally for remaining 3 players
    Evidence: .sisyphus/evidence/task-10-4p-continues.txt
  ```
  **Commit**: YES (groups with 8, 9)
  - Message: `test(server): integration tests for disconnect layer transitions`
  - Files: `apps/server/src/createApp.test.ts`
  - Pre-commit: `pnpm test`

- [ ] 11. Edge case — double-disconnect in 3-4p match, resume race fix verification (integration level)

  **What to do**:
  - Build on Task 5's unit-level test with a full integration-level version: 3-4p room, two clients disconnect close together, first one reconnects — assert `game:resumed` is NOT sent to remaining clients (match should stay paused), then the second reconnects — assert `game:resumed` IS sent.
  - This is the integration-level proof of the fix, complementing Task 5's `RoomManager`-only unit test.

  **Must NOT do**: Do not simplify to a single-disconnect scenario — the whole point is proving the multi-disconnect race is fixed at the real socket level, not just the unit level.

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: This is verifying a subtle race condition fix end-to-end; requires careful timing control with fake timers across multiple simulated disconnects to avoid a flaky/false-positive test.
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 8-10, 12, 13)
  - **Parallel Group**: Wave 3
  - **Blocks**: F1-F4
  - **Blocked By**: Task 7

  **References**:
  - Task 5's unit test (this plan) — mirror the scenario at the integration level
  - `apps/server/src/createApp.test.ts` (branch) — base test template

  **Acceptance Criteria**:
  - [ ] Integration test passes proving the double-disconnect resume race is fixed with real sockets, not just mocked `RoomManager` calls

  **QA Scenarios**:
  ```
  Scenario: Double-disconnect race fix, integration level
    Tool: Bash (vitest, real socket.io + fake timers)
    Steps:
      1. Boot 4 clients into MATCH phase
      2. Disconnect client B, then disconnect client C shortly after (both within the same room)
      3. Advance timers past 500ms for both (game:paused fires, once)
      4. Reconnect client B
      5. Assert client A does NOT receive game:resumed yet
      6. Reconnect client C
      7. Assert client A DOES receive game:resumed now
    Expected Result: Resume only fires after BOTH disconnected players return
    Evidence: .sisyphus/evidence/task-11-double-disconnect-integration.txt
  ```
  **Commit**: YES (groups with 12)
  - Message: `test(server): edge case coverage for disconnect layer races`
  - Files: `apps/server/src/createApp.test.ts`
  - Pre-commit: `pnpm test`

- [ ] 12. Edge case — disconnect before session.start(), room evaporates mid-disconnect

  **What to do**:
  - Test 1: simulate a disconnect happening in the narrow window between room reaching MATCH phase and `MatchSession.start()` actually being called (if this race is even reachable given the existing code structure — investigate first; if genuinely unreachable due to synchronous ordering, document why and write a test for the closest reachable equivalent, e.g. calling the callback handler directly with a roomCode not yet in `matchSessions`).
  - Test 2: simulate all players disconnecting/leaving a room such that the room itself gets deleted (per existing `removePlayer` logic) while a disconnected-player entry for it still exists in the watchdog's map — assert the watchdog correctly stops (via `stopWatchdogIfIdle`) and doesn't throw on its next sweep tick when it can no longer find the room.

  **Must NOT do**: Do not skip investigating whether the "disconnect before session.start()" race is actually reachable — Metis flagged this as a real concern, verify rather than assume either way.

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Requires investigating actual reachability of a race condition in existing async code before writing a meaningful test — not a rote test-writing task.
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 8-11, 13)
  - **Parallel Group**: Wave 3
  - **Blocks**: F1-F4
  - **Blocked By**: Task 7

  **References**:
  - `apps/server/src/createApp.ts` (branch) — room-phase transition to MATCH and `session.start()` call site, to determine if they're synchronous/atomic or if a gap exists
  - `apps/server/src/RoomManager.ts:removePlayer` (branch) — existing room-deletion-on-empty logic, if present, to understand the "room evaporates" scenario

  **Acceptance Criteria**:
  - [ ] Either a passing test demonstrating the pre-session-start race is safely handled, or documented evidence (in the test file as a comment, or in this task's completion notes) that the race is unreachable given current code structure, with a test for the nearest reachable equivalent
  - [ ] A passing test demonstrating the watchdog doesn't throw when its tracked room no longer exists

  **QA Scenarios**:
  ```
  Scenario: Watchdog sweep tolerates a room that no longer exists
    Tool: Bash (vitest, fake timers)
    Steps:
      1. markDisconnected(playerId) for a room
      2. Force-delete the room from RoomManager's internal rooms map (or trigger the natural all-players-left deletion path)
      3. Advance timers past the sweep interval
      4. Assert no exception thrown
    Expected Result: Graceful handling, no crash
    Evidence: .sisyphus/evidence/task-12-room-evaporates.txt
  ```
  **Commit**: YES (groups with 11)
  - Message: `test(server): edge case coverage for disconnect layer races`
  - Files: `apps/server/src/createApp.test.ts` or `apps/server/src/RoomManager.test.ts`
  - Pre-commit: `pnpm test`

- [ ] 13. Client — wire `room:playerDisconnected`/`room:playerRejoined` stub handlers to a minimal UX signal

  **What to do**:
  - In `GameClient.ts`, replace the existing `console.log`-only stubs for `room:playerDisconnected` and `room:playerRejoined` with a call to an options callback (e.g. `this.options.onPlayerDisconnected?.(data.playerId, data.graceSeconds)` and `this.options.onPlayerRejoined?.(data.playerId)`), matching the existing pattern used for other events in this file (e.g. `onPlayerLeft`, `onPlayerAssigned`).
  - Check `GameClientOptions` type definition and add these two optional callback fields if they don't exist.
  - Do NOT build actual UI (no new DOM elements, no CSS, no `UIManager` changes) — this task only ensures the network layer exposes the hook; wiring an actual visual indicator is explicitly out of scope for this plan (flag as a natural follow-up, not part of this deliverable).

  **Must NOT do**: Do not touch `UIManager.ts`, `MenuNavigator.ts`, or any rendering code — this task is network-layer-only, exposing a callback hook and nothing more.

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small, mechanical change following an existing established pattern in the same file (options-callback wiring already used repeatedly elsewhere in `GameClient.ts`).
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 8-12)
  - **Parallel Group**: Wave 3
  - **Blocks**: F1-F4
  - **Blocked By**: Task 7 (technically only needs the server to emit these events correctly, which already exists on the branch — but sequenced after Task 7 for wave-ordering simplicity, could be started earlier if desired)

  **References**:
  - `apps/client/src/network/GameClient.ts` (branch) — existing `room:playerDisconnected`/`room:playerRejoined` handlers (currently `console.log` only) and the `onPlayerLeft`/`onPlayerAssigned` callback pattern to mirror exactly

  **Acceptance Criteria**:
  - [ ] `GameClientOptions` type includes new optional `onPlayerDisconnected`/`onPlayerRejoined` fields
  - [ ] Existing tests (`GameClient.character-select.test.ts` or similar) still pass unchanged
  - [ ] New unit test confirms the callback is invoked with correct arguments when the corresponding socket event fires

  **QA Scenarios**:
  ```
  Scenario: onPlayerDisconnected callback invoked correctly
    Tool: Bash (vitest, mocked socket)
    Steps:
      1. Construct GameClient with onPlayerDisconnected mock callback
      2. Simulate server emitting room:playerDisconnected with { playerId: "p1", graceSeconds: 30 }
      3. Assert mock called with ("p1", 30)
    Expected Result: Callback invoked with correct args
    Evidence: .sisyphus/evidence/task-13-client-callback.txt
  ```
  **Commit**: YES
  - Message: `feat(client): expose disconnect/rejoin callbacks in GameClient`
  - Files: `apps/client/src/network/GameClient.ts`
  - Pre-commit: `pnpm test`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
>
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, run test). For each "Must NOT Have": search codebase for forbidden patterns (e.g., changes to `TICK_MS`, `BROADCAST_EVERY`, new `Set`-typed msgpack payloads without codec registration, any `playerIds`/roster mutation in `GameEngine`) — reject with file:line if found. Check evidence files exist. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `tsc --noEmit` + linter + `pnpm test`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log left in hot-path code (`GameEngine.ts`, `MatchSession.ts` tick loop), commented-out code, unused imports. Check the watchdog interval is genuinely `setInterval`/`clearInterval`-based (not `setImmediate`+accumulator) and has an explicit teardown method.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high`
  Execute every QA scenario from every task using real fake-timer-driven Vitest runs (not manual browser interaction — this is a server-logic feature). Specifically re-run: double-disconnect race test, disconnect-before-session-start guard, room-evaporates-mid-disconnect test, 2p forfeit reason string, 3-4p forfeit continuation. Save output to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (`git log`/`git diff`). Verify 1:1 — everything in spec was built, nothing beyond spec was built. Specifically check: no engine roster removal was added, no pause-reason field was added, no spectator-mode code was added, no `TICK_MS`/`BROADCAST_EVERY` changes. Flag any unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **1**: `chore(server): confirm sprint/netcode-rejoin baseline` - (rebase/merge notes), n/a
- **2-6**: `feat(server): disconnect watchdog + layer transitions` - RoomManager.ts, GameEngine.ts, `pnpm test`
- **7**: `feat(server): wire disconnect layers into createApp` - createApp.ts, `pnpm test`
- **8-12**: `test(server): disconnect layer integration + edge cases` - *.test.ts, `pnpm test`
- **13**: `feat(client): wire disconnect/rejoin UX stubs` - GameClient.ts, `pnpm test`

---

## Success Criteria

### Verification Commands
```bash
pnpm test   # Expected: all tests pass, including new RoomManager/GameEngine/createApp tests
pnpm build  # Expected: zero TypeScript errors
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All tests pass
- [ ] Double-disconnect resume race fixed and tested
- [ ] Watchdog interval lazily started/stopped, fake-timer-compatible
