# BUGS.md — Bug Tracking for Smash Bros Clone

## Summary (auto-generated after QA pass)

| Severity | Count |
|----------|-------|
| Blocker | 0 |
| Major | 5 |
| Minor | 2 |
| Cosmetic | 1 |
| **Total** | **8** |

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

- Area: physics
- Repro steps:
  1. Spawn any character near a vertical wall surface.
  2. Walk into the wall so the character is flush against it.
  3. Press jump once to leave the ground, then immediately press jump again while still touching the wall.
- Expected: The second jump fires as a double jump, launching the character upward with the standard double-jump velocity curve.
- Actual: The engine treats the wall contact as a grounded state, silently consuming the double-jump token without producing any upward movement. The character then has no remaining jumps until they land again.
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

## [Major] FSM skips WALK state — IDLE transitions directly to DASH on held input

- Area: combat
- Repro steps:
  1. Start any local match.
  2. From a standing idle position, press and hold a directional key (right arrow or left arrow).
  3. Observe the player state.
- Expected: Character enters WALK state first, then transitions to DASH after the dash input threshold.
- Actual: Character transitions directly from IDLE to DASH, bypassing WALK entirely. The WALK state is never entered on a simple direction hold.
- Related ROADMAP gap (if any): None explicitly, but walk/dash distinction is required for correct move differentiation (forward tilt vs forward smash charge).
- Found in: Tier 3 (existing tests) — `src/fsm/fsm.test.ts:65` expected WALK, received DASH.

---

## [Major] Fast fall velocity not capped at TERMINAL_VELOCITY×0.8

- Area: physics
- Repro steps:
  1. Start a local match.
  2. Jump with any character.
  3. While airborne and descending, hold the down arrow key.
- Expected: Fast fall sets downward velocity (`vy`) to `TERMINAL_VELOCITY × 0.8` (approximately 14.4 units/frame).
- Actual: Actual `vy` is 16.2 — the velocity cap check runs before gravity is applied, so one extra gravity tick accumulates on top of the cap, producing a value 1.8 units above the intended ceiling.
- Related ROADMAP gap (if any): None.
- Found in: Tier 3 (existing tests) — `src/physics/physics.test.ts:215` expected vy ≈ 14.4, received 16.2.

---

## [Major] Hitstun formula produces 3 excess frames at high knockback

- Area: combat
- Repro steps:
  1. Start a local 2-player match.
  2. Let P2 accumulate 120% damage.
  3. Land a forward smash (highest-base-knockback move) on P2.
  4. Count the frames P2 is locked in hitstun.
- Expected: Hitstun for fsmash at 120% = 79 frames (per engine regression target).
- Actual: Hitstun = 82 frames. Three extra frames of lockout are applied, extending combos and reducing defender options beyond the designed window.
- Related ROADMAP gap (if any): None. Note: a separate "BUG CHARACTERIZATION" test in the suite also flags that the legacy knockback formula makes jab (3%) and fsmash (18%) produce identical knockback at 100% — a related formula divergence.
- Found in: Tier 3 (existing tests) — `src/hitbox/hitbox.test.ts:316`.

---

## [Minor] Hitbox damage returned as float instead of integer

- Area: combat
- Repro steps:
  1. Any hit connects (simplest: jab in a 2-player local match at close range).
  2. Read the `damage` field on the resolved hit result.
- Expected: Damage value is an integer (e.g. 8).
- Actual: Damage value is a float (e.g. 8.4). The hitbox resolver returns raw floating-point damage without flooring or rounding.
- Related ROADMAP gap (if any): None. May cause accumulated floating-point drift in percent display over a long match.
- Found in: Tier 3 (existing tests) — `src/hitbox/hitbox.test.ts:217` expected 8, received 8.4.

---

## [Minor] ROADMAP-vs-code discrepancy — ledge grab states present in FSM but claimed absent

- Area: combat
- Repro steps:
  1. Open `packages/shared/src/types/PlayerFSMState.ts`.
  2. Observe states: `LEDGE_HANG`, `LEDGE_CLIMB`, `LEDGE_ATTACK`, `LEDGE_ROLL`, `LEDGE_JUMP`.
  3. Open `ROADMAP.md` and search for "ledge grab".
  4. Note the ROADMAP claim that ledge grab is not implemented.
- Expected: ROADMAP accurately reflects implementation status.
- Actual: FSM enum defines five ledge states. Whether they are reachable (wired to transitions) or dead code cannot be determined without runtime FSM verification in local mode (Tier 1 debug API unavailable in local mode). ROADMAP may be outdated, or the states may be stubs.
- Related ROADMAP gap (if any): ROADMAP Phase 2 — "no ledge grab" claim.
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
