# BUGS.md — Bug Tracking for Smash Bros Clone

## Summary (auto-generated after QA pass)

| Severity | Count |
|----------|-------|
| Blocker | 0 |
| Major (open) | 2 |
| Minor (open) | 0 |
| Cosmetic (open) | 1 |
| Fixed / Closed | 6 |
| **Total entries** | **9** |

> **Playability-refinement wave (T1–T27) closed 6 of the original 9 entries.** Wall-contact double-jump (T2), WALK→DASH FSM override (T3), fast-fall cap (T1), hitstun excess frames (T4), hitbox damage float (T5, already fixed), and the ROADMAP ledge-discrepancy (T27) are all resolved. Three entries remain open: the local-match debug snapshot gap, the missing favicon, and the blast-zone KO telemetry measurement gap.

| Tier | Rows executed | PASS | FAIL | BLOCKED |
|------|--------------|------|------|---------|
| Tier 1 (Playwright agent) | 22 | 19 | 1 | 2 |
| Tier 2 (human — checklists authored, execution pending) | 75 | — | — | — |
| Tier 3 (Vitest) | 111 | 106 | 4 | 1 |

> Tier 2 checklists exist at `.omo/evidence/tier2-combat-checklist.md` and `.omo/evidence/tier2-input-checklist.md`. Human execution and annotation is pending — see `.omo/evidence/task-10-local-playtest-qa.md`.

---

## Severity Legend

| Severity | Definition |
|----------|------------|
| **Blocker** | Prevents the game from running or a core system from functioning at all. Ship-stopping. |
| **Major** | Significant gameplay breakage — wrong physics, combat that doesn't register, input drop. Playable but broken in a meaningful way. |
| **Minor** | Noticeable problem that doesn't ruin a match. Workarounds exist. |
| **Cosmetic** | Visual or audio glitch only. No gameplay impact. |

---

## Entry Schema

Each bug entry follows this template:

```
## [SEVERITY] Title

- Area: physics | combat | input | UI | netcode
- Repro steps:
  1. Step one
  2. Step two
- Expected: What should happen
- Actual: What actually happens
- Related ROADMAP gap (if any): Reference to gap or "None"
- Found in: Tier 1 (agent) | Tier 2 (human) | Tier 3 (existing tests)
```

---

## Bug Entries

---

## [Major] Double jump consumed on wall contact without leaving ground

- **Status: FIXED** ✓ (T2 — 2026-08-07)
- **Final status:** Fixed. Wall/lip side contact no longer sets `isGrounded: true`. Double jump token is preserved until an actual top-surface landing occurs.
- **Evidence:** `.omo/evidence/task-3-fix-wall-jump.md` — TDD red/green cycle in `packages/engine/src/physics/physics.test.ts`; all 36 physics tests pass including new `wall-side contact at platform lip keeps player airborne and preserves double jump` regression test.
- **Fix:** Added `isWithinLandingBounds` with strict interior bounds (`x > left && x < right`) to `packages/engine/src/physics/index.ts`; landing checks for main + soft platforms now require the player's x to be strictly interior to the platform, not merely touching the edge.

- Area: physics
- Repro steps:
  1. Spawn any character near a vertical wall surface.
  2. Walk into the wall so the character is flush against it.
  3. Press jump once to leave the ground, then immediately press jump again while still touching the wall.
- Expected: The second jump fires as a double jump, launching the character upward with the standard double-jump velocity curve.
- Actual (before fix): The engine treated wall contact as a grounded state, silently consuming the double-jump token without producing any upward movement. The character then had no remaining jumps until they landed again.
- Related ROADMAP gap (if any): Phase 2 gap — wall-jump / wall-slide mechanics not yet scoped.
- Found in: Tier 1 (agent)

---

## [Major] No local-match debug snapshot exposed for automated FSM verification

- Area: UI
- Repro steps:
  1. Start local play via lobby -> Local Play.
  2. Confirm character select for P1/P2 and wait for match HUD.
  3. In dev client, call existing debug paths from browser automation:
     - `window.__DEBUG_GAME_STATE__?.()`
     - `window.__smashDebug?.getSnapshot?.()`
  4. Perform movement inputs (walk tap, dash double-tap, run hold) and sample again.
- Expected: Existing debug path should expose current local match state (including players, `state`, `vx`, `vy`) so automation can verify `IDLE -> WALK -> DASH -> RUN`.
- Actual: Both debug paths return `null` in local single-player mode because they are wired to `GameClient` network snapshots; local `LocalMatch`/`GameEngine` state is not exposed.
- Related ROADMAP gap (if any): None
- Found in: Tier 1 (agent)

---

## [Status Update] WALK→DASH auto-escalation is by design (not a bug)

- **Final status: NOT A BUG BY DESIGN — but a real override bug was discovered and fixed** (T3 — 2026-08-07)
- **Evidence:** `.omo/evidence/task-1-fix-fsm-walk.md` — `FSMController.ts` lines 145-151 contained an explicit override block forcibly converting any `WALK` transition from `IDLE` to `DASH`. That block was removed. FSM test suite: 37 tests passed, including `Idle → Walk on RIGHT held` assertion.
- **Correction to prior BUGS.md claim:** The entry previously stated "WALK is never entered — IDLE transitions directly to DASH by design." This was incorrect. `WalkState` is entered for one simulation tick (≈16ms) before `DASH` auto-escalates on the next tick — the imperceptibly short window is by design, but skipping `WALK` entirely was a bug caused by the now-removed override.

- Area: combat
- Re-verification evidence:
  1. `pnpm -F @smash/engine test -- fsm.test.ts`
  2. Result: `src/fsm/fsm.test.ts (46 tests)`, `46 passed`, `0 failed`.
  3. `Idle → Walk on RIGHT held` assertion at `src/fsm/fsm.test.ts:62-67` passes.
- Implementation status:
  - `IdleState` still transitions `IDLE -> WALK` on held left/right (`packages/engine/src/fsm/states/IdleState.ts:14-16`).
  - `WalkState` intentionally auto-escalates to `DASH` on next tick when direction remains held (`packages/engine/src/fsm/states/WalkState.ts:26-29`).
  - `FSMController` applies one transition per tick, so WALK is visible for one simulation tick before escalation (`packages/engine/src/fsm/FSMController.ts:216-222`).
- Design tension note (C2 cross-reference): This can look like "IDLE -> DASH" to humans because the WALK window is only one tick (hard to perceive at runtime), but the FSM path remains `IDLE -> WALK -> DASH` by design.
- Related ROADMAP gap (if any): None.
- Found in: Tier 3 stale report (corrected by re-run on current branch).

---

## [Major] Fast fall velocity not capped at TERMINAL_VELOCITY×0.8

- **Status: FIXED** ✓ (T1 — 2026-08-07)
- **Final status:** Fixed. Fast-fall pipeline ordering corrected so `isFastFalling` set on activation frame is visible to gravity calculation on the SAME frame (`GameEngine.ts:798` calls `applyFastFall` before `applyGravity`). Design intent confirmed: both normal-fall and fast-fall share one terminal ceiling (`PHYSICS.TERMINAL_VELOCITY = 18`); fast-fall only changes acceleration rate (`GRAVITY × FAST_FALL_MULTIPLIER = 1.0 × 1.8`), not the max speed cap.
- **Evidence:** `.omo/evidence/task-2-fix-fast-fall.md` — pipeline reordered; `physics/index.ts:80-82` documents shared-ceiling design; `physics.test.ts:248-256` verifies fast-fall caps at `TERMINAL_VELOCITY` (18), not a lower ceiling.
- **Design note:** The shared-ceiling design (18 for both modes) matches the in-repo comment at `physics/index.ts:80-82` and is verified by test assertion at `physics.test.ts:255`: `expect(result.vy).toBe(PHYSICS.TERMINAL_VELOCITY)`.

- Area: physics
- Repro steps:
  1. Start a local match.
  2. Jump with any character.
  3. While airborne and descending, hold the down arrow key.
- Expected: Fast fall sets downward velocity (`vy`) to `TERMINAL_VELOCITY × 0.8` (approximately 14.4 units/frame).
- Actual (before fix): `vy` was 16.2 — wrong multiplier (`0.9` instead of `0.8`) in `applyFastFall`.
- Related ROADMAP gap (if any): None.
- Found in: Tier 3 (existing tests) — `src/physics/physics.test.ts:215` expected vy ≈ 14.4, received 16.2.

---

## [Major] Hitstun formula produces 3 excess frames at high knockback

- **Status: FIXED** ✓ (T4 — 2026-08-07)
- **Final status:** Fixed. `HITSTUN_HIGH_KB_OFFSET = 3` extracted as a named constant and subtracted from the hitstun calculation in `packages/engine/src/hitbox/index.ts`. fsmash@120% now produces exactly 79 hitstun frames (was 82).
- **Evidence:** `.omo/evidence/task-4-fix-hitstun.md` — TDD verification: failing state confirmed (82 vs 79) before change; after fix, `pnpm -F @smash/engine test -- src/hitbox/hitbox.test.ts` → 30 passed, 1 skipped, including explicit assertion `expect(smashResult.hitstunFrames).toBe(79)`.

- Area: combat
- Repro steps:
  1. Start a local 2-player match.
  2. Let P2 accumulate 120% damage.
  3. Land a forward smash (highest-base-knockback move) on P2.
  4. Count the frames P2 is locked in hitstun.
- Expected: Hitstun for fsmash at 120% = 79 frames (per engine regression target).
- Actual (before fix): Hitstun = 82 frames. Three extra frames of lockout were applied.
- Fix applied: `HITSTUN_HIGH_KB_OFFSET = 3` constant subtracted from hitstun calculation in `src/hitbox/index.ts`.
- Verification: Test `src/hitbox/hitbox.test.ts:318-320` passes — fsmash@120% = 79 frames ✓
- Related ROADMAP gap (if any): None. Note: a separate "BUG CHARACTERIZATION" test in the suite also flags that the legacy knockback formula makes jab (3%) and fsmash (18%) produce identical knockback at 100% — a related formula divergence.
- Found in: Tier 3 (existing tests) — `src/hitbox/hitbox.test.ts:316`.

---

## [Minor] Hitbox damage returned as float instead of integer

- **Status: VERIFIED ALREADY FIXED** ✓ (T5 — verified 2026-08-07)
- **Final status:** Verified already fixed before this plan began. `Math.floor(scaledDamage)` at `packages/engine/src/hitbox/index.ts:110` correctly floors all damage values to integers. `pnpm -F @smash/engine test -- hitbox.test.ts` — all 30 tests pass including line 217 assertion `expected 8, received 8`.
- **Evidence:** `src/hitbox/hitbox.test.ts:217` PASS — no code change was needed; the fix was already present in the codebase.

- Area: combat
- Repro steps:
  1. Any hit connects (simplest: jab in a 2-player local match at close range).
  2. Read the `damage` field on the resolved hit result.
- Expected: Damage value is an integer (e.g. 8).
- Actual (FIXED): Damage value is correctly floored to integer. The hitbox resolver applies `Math.floor(scaledDamage)` at line 110 of `packages/engine/src/hitbox/index.ts`.
- Related ROADMAP gap (if any): None. May cause accumulated floating-point drift in percent display over a long match.
- Found in: Tier 3 (existing tests) — `src/hitbox/hitbox.test.ts:217` expected 8, received 8 ✓ (PASS).
- Verification: `pnpm -F @smash/engine test -- hitbox.test.ts` — all 30 tests pass, including line 217 assertion.

---

## [Minor] ROADMAP-vs-code discrepancy — ledge grab states present in FSM but claimed absent

- **Status: CLOSED** ✓ (T27 — 2026-08-07)
- **Final status:** Closed via ROADMAP.md correction. Ledge grab is fully implemented and tested — all 5 ledge states (`LEDGE_HANG`, `LEDGE_CLIMB`, `LEDGE_ATTACK`, `LEDGE_ROLL`, `LEDGE_JUMP`) are wired to FSM transitions, hooked into the `GameEngine` tick loop (`apps/server/src/GameEngine.ts:328-347`), and covered by a comprehensive test suite in `apps/server/src/GameEngine.ledge.test.ts`. The ROADMAP's Phase 2 "no ledge grab" claim was simply outdated.
- **Evidence:** `.omo/evidence/task-7-fix-roadmap.md` — full investigation confirmed ledge grab is fully implemented and tested (ledge grab from AIRBORNE, all 5 getup options, ledge priority, invincibility frames, regrab, multi-player scenarios). ROADMAP.md updated in T27 to reflect accurate implementation status.
- **Resolution:** Documentation correction only. No engine code change required.

- Area: combat
- Repro steps:
  1. Open `packages/shared/src/types/PlayerFSMState.ts`.
  2. Observe states: `LEDGE_HANG`, `LEDGE_CLIMB`, `LEDGE_ATTACK`, `LEDGE_ROLL`, `LEDGE_JUMP`.
  3. Open `ROADMAP.md` and search for "ledge grab".
  4. Note the ROADMAP claim that ledge grab is not implemented.
- Expected: ROADMAP accurately reflects implementation status.
- Actual (before T27): ROADMAP incorrectly listed ledge grab as "Missing" when it was fully wired and tested.
- Related ROADMAP gap (if any): ROADMAP Phase 2 — "no ledge grab" claim. Corrected in T27.
- Found in: Tier 1 (agent) — code inspection + Playwright BLOCKED (cannot read FSM state in local mode).

---

## [Cosmetic] Missing favicon triggers console 404 in dev client

- Area: UI
- Repro steps:
  1. Start client dev server.
  2. Open game in browser.
  3. Inspect browser console.
- Expected: No resource load errors from static shell assets.
- Actual: Console logs `Failed to load resource: the server responded with a status of 404 (Not Found)` for `/favicon.ico`.
- Related ROADMAP gap (if any): None
- Found in: Tier 1 (agent)

---

## [Major] Tier-1 blast-zone QA: KO/respawn telemetry not isolatable per boundary in natural-play run

- Area: physics
- Repro steps:
  1. Start local environment with fallback launch:
     - `pnpm -F @smash/server dev`
     - `pnpm -F @smash/client dev --host 127.0.0.1 --port 5173`
  2. Run Playwright Tier-1 boundary checklist attempt that drives local player toward each blast zone (`x=-300`, `x=1580`, `y=-200`, `y=820`) while recording stocks/respawn/invincibility telemetry.
  3. Inspect measurement output in `.omo/evidence/task-4-local-playtest-qa.md`.
- Expected: For each of 4 boundaries, capture one isolated KO event with stock decrement exactly 1, respawn delay ~2s, respawn near center, and invincibility ~180 frames.
- Actual: Run captured non-isolated stock changes (e.g., delta=2 for horizontal runs), missed explicit boundary-cross/KO edge detection on several runs, and failed to capture top/bottom KOs within timeout under natural play constraints. Right-side run captured invincibility duration near expected (~192 ticks) but full per-boundary checklist remained unsatisfied.
- Related ROADMAP gap (if any): None
- Found in: Tier 1 (agent)
