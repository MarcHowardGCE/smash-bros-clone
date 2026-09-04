# Team Sprint — Facilitator Pack (Everybody Throws Hands)

**Purpose:** divide the team into four groups for ~1 hour each, discuss and plan the work *together*, and leave each group with a starting skeleton — not finished code. This pack is the meeting artifact. The detailed engineering plan lives in `.omo/plans/team-sprint-next-steps.md`.

> **How to run the hour:** 10 min all-hands kickoff → 40 min in-track discussion + skeleton work → 10 min readouts. The goal at the buzzer is a *shared plan and a skeleton*, not a shipped feature.

---

## Ground rules for every group

1. **Discuss before you code.** Each track below opens with 3–4 discussion questions. Answer them out loud as a group *first* and record your decisions in the track's design doc.
2. **Don't touch the engine's core invariants.** No `Date.now()` / `Math.random()` under `packages/engine/`. No combat/hit/knockback logic in the client. Server is always authoritative.
3. **`pnpm test` must stay green.** It's the regression gate. If you break it, stop and fix before moving on.
4. **Skeletons are starting points, not answers.** Each group gets a scaffolded file with `TODO(team)` markers. Your job is to debate the approach, then fill them in — not to accept them as done.

---

## Team A — Sound Effects (client-only)

**The gap:** Music ships today, but there are **zero sound effects**. `apps/client/public/audio/` has only 8 music mp3s; `AudioManager` (`apps/client/src/audio/AudioManager.ts`) is music-only and has no `playSfx`.

**The goal:** five clips (hit, jump, land, shield, KO) + a way to play them, wired to real game events.

**Discuss first (15–20 min):**
- Where do hit events actually reach the client? (Hint: `HitEventData` in `StateSnapshot.hitEvents` — the same events already drive hit-flash and camera shake in `FighterRenderer.ts` / `Camera.ts`.)
- Should hit SFX pitch scale with knockback magnitude? What formula feels right?
- Jump/land/shield: fire from FSM state transitions — but *where* do you observe those on the client without adding latency?
- Do you source real clips now, or ship silence-tolerant stubs so a missing file never throws?

**Skeleton to start from:** create `apps/client/src/audio/SfxManager.ts` as a *separate* class that composes with `AudioManager` (don't modify the music path). A stub is provided in the worktree `sprint/sfx` branch — review it, argue about it, change it.

**Guardrails:** client-only; no new audio dependency (repo uses raw HTML Audio); never throw on a missing asset.

### ✅ Status — MERGED (PR #6, `sprint/sfx` → `main`)

**What shipped:**
- **`SfxManager.ts`** — voice-pooled SFX player composing with `AudioManager`. Supports 5 SFX IDs (`hit`, `jump`, `land`, `shield`, `ko`) with variant files (`hit-1`, `hit-2`). Per-play `gain` and `playbackRate` options. Never throws on missing assets.
- **`GameplaySfxRouter.ts`** — converts rendered player-state edges into one-shot SFX. Detects FSM transitions: `JUMPSQUAT`/`DOUBLE_JUMP`/`LEDGE_JUMP` → jump, landing states → land, shield states → shield. KO detection with 250 ms deduplication.
- **6 audio files** in `public/audio/sfx/`: `hit-1.wav`, `hit-2.wav`, `jump.wav`, `land.wav`, `shield.wav`, `ko.wav`.
- **Wired into `main.ts`** — `SfxManager` + `GameplaySfxRouter` instantiated alongside `AudioManager`; `processFrame()` called every render tick; `playHit()` fires on `HitEventData` with knockback-scaled gain; `processMatchResult()` on game end; `stopAll()` on cleanup.
- **Tests:** `SfxManager.test.ts` (9 tests), `GameplaySfxRouter.test.ts` (7 tests).
- **Design doc:** `docs/sprint/SFX-DESIGN.md`.

**Discussion outcomes:** Hit events arrive via `StateSnapshot.hitEvents` (same path as hit-flash/camera shake). Pitch scaling with knockback implemented via `playbackRate` option. Jump/land/shield observed from FSM state transitions in the render loop — no added latency. Real clips sourced and shipped.

---

## Team B — Input & Settings (client-only)

**The gap:** `SHIELD + ATTACK = smash` is non-standard (real Smash uses stick speed). Keymap is a static const; nothing persists.

**The goal:** a double-tap directional detector (tilt vs. smash) + a `localStorage`-backed settings store for volume and keybinds.

**Discuss first (15–20 min):**
- What's the double-tap threshold in ms? (250 ms is the current placeholder — does it feel right? Test it.)
- Should double-tap be opt-in or default-on? Why?
- Smash intent is a **client-side selection hint**, not a new network bit. Confirm the group understands why (it only changes which `currentMoveId` fires; `AttackState` already reads it). If anyone thinks it needs a protocol change, dig into that disagreement.
- What goes in the settings schema, and how do you version it for future migration?

**Skeleton to start from:** `SettingsStore.ts` + `InputManager.doubleTap` scaffolding exist on the `sprint/input-settings` branch with tests. Treat the threshold and the opt-in flag as *open questions*, not settled.

**Guardrails:** client-only; don't change `INPUT_BITS` or any shared type; don't change shield+attack (keep it as a fallback).

### ✅ Status — MERGED (PR #7, `sprint/input-settings` → `main`)

**What shipped:**
- **`SettingsStore.ts`** — `localStorage`-backed settings with in-memory fallback for private-mode browsers. Schema `smash:settings:v1` covers `volume` (0–1, default 0.7) and `keymapP1` (key-code → action-string map). `load()`, `save()`, `get()`, `set()` API.
- **Double-tap smash detection in `InputManager.ts`** — 250 ms threshold (`DOUBLE_TAP_THRESHOLD_MS`), opt-in via `InputManagerOptions.doubleTapSmash` (defaults `false` for backward compatibility). Tracks `lastDirectionalKeydown` direction + timestamp; sets `smashIntent` flag consumed by `AttackState` for move selection. Shield+attack remains as fallback.
- **Keymap persistence** — `GameClient.ts` constructor loads persisted keymap from `SettingsStore` on startup; falls back to `DEFAULT_KEYMAP_P1` on failure. `convertPersistedKeymap()` in `keymaps.ts` converts stored string map back to `Record<string, InputBitmask>`.
- **Default keymaps for P1–P4** in `keymaps.ts`.
- **Tests:** `SettingsStore.test.ts` (14 tests), `InputManager.doubleTap.test.ts` (17 tests).
- **Design docs:** `docs/sprint/INPUT-SETTINGS-DESIGN.md`, `docs/sprint/DESIGN-DECISIONS.md`.

**Discussion outcomes:** 250 ms threshold kept. Double-tap is opt-in (not default-on) to preserve existing behavior. Smash intent confirmed as client-side selection hint — no protocol change. Settings schema versioned as `v1` for future migration.

---

## Team C — Third Fighter (shared + engine data)

**The gap:** Two fighters today (All-Rounder + Abe Lincoln). The engine is content-agnostic — adding a fighter is adding data.

**The goal:** a fast/floaty third archetype (weight ~75, high air speed, multi-jump, weaker knockback) so character select creates a real decision against Lincoln's heavyweight bruiser.

**Discuss first (15–20 min):**
- Name + `CharacterId`? (A scaffold named **Swift** exists — keep it, rename it, your call.)
- Which 5–7 moves get overrides, and what's the *differentiation rationale* for each? Lincoln's 7-override file (`packages/engine/src/moves/lincoln.ts`) is the model.
- **Hard rule discovered during scaffolding:** override frame timing (startup/active/recovery) must stay **identical** to the defaults — the FSM timing tables and hard-coded engine logic (e.g. counter window) depend on it. Differentiate via damage/knockback/reach, not frame counts. Discuss whether the group agrees.
- Renderer plan: new accessory + animation files mirroring `lincolnAccessories.ts` / `lincolnAnimations.ts`. Plan only this hour — no art.

**Skeleton to start from:** stats block + registry + `swift.ts` overrides + frame-data tests exist on the `sprint/fighter-3` branch. The numbers are placeholders — the group should tune them.

**Guardrails:** data-only — **no** FSM/physics/hitbox changes; reuse existing `MoveId`s (no new enum values); determinism scan must return 0.

### ✅ Status — MERGED (PR #4, `sprint/fighter-3` → `main`)

**What shipped:**
- **Stats:** `SWIFT_STATS` in `packages/shared/src/constants/characters.ts` — weight 75 (-25%), hurtbox 26 (-7%), run 6.8 (+5%), walk 3.5 (parity), jump -16.5 (+3%), shortHop -10.3 (+3%). Fast/floaty "safe poker" archetype.
- **Type + registry:** `'swift'` added to `CharacterId` union, `CHARACTER_REGISTRY`, and `CHARACTER_IDS`.
- **7 move overrides** in `packages/engine/src/moves/swift.ts`: Jab, Forward Tilt, Neutral Air, Forward Air, Up Air, Neutral Special, Up Special. All frame timing identical to defaults; differentiated via damage (lower), knockback (weaker growth), and reach (extended offsets).
- **Move routing** in `packages/engine/src/moves/index.ts` — `SWIFT_MOVE_OVERRIDES` map checked before falling back to `MOVE_REGISTRY`.
- **Character select** — Swift listed in `AVAILABLE_FIGHTERS` in `main.ts`.
- **Tests:** `swift.test.ts` (21 tests) — frame-data validity for all 7 overrides.
- **Design doc:** `docs/sprint/FIGHTER-3-DESIGN.md`.

**Discussion outcomes:** Name "Swift" kept. 7 overrides chosen (same count as Lincoln). Frame-timing identity rule accepted — differentiation via damage/knockback/reach only. Renderer accessory/animation files deferred to follow-up.

---

## Team D — Netcode Hardening (server + client)

**The gap:** one dropped packet kills the match. Client socket is `reconnection: false` (`GameClient.ts:93`), and the server `handleDisconnect` (`createApp.ts:289-318`) *destroys* the whole match session on any disconnect.

**The goal:** design (and start) a rejoin flow: keep the player slot on disconnect with a grace window, rejoin by `playerId`, flip `reconnection: true`.

**Discuss first (15–20 min):**
- Grace window: how long? (30 s is the placeholder.) What should the other players see during it?
- During the grace window, does the match **keep ticking** with `EMPTY_INPUT` for the dropped player, or **pause**? (There's a real tradeoff: keep-ticking is consistent with network lag; pausing is fairer but exploitable.) Pick one and defend it.
- What happens on grace expiry — forfeit, or the current destroy-match fallback?
- Spectator mode is design-only this hour: what would a `SPECTATE` join path that skips slot assignment look like? (The 20 Hz broadcast already supports read-only clients.)

**Skeleton to start from:** `RoomManager.markDisconnected` / `rejoinRoom` / `cleanupExpiredDisconnects` + tests exist on the `sprint/netcode-rejoin` branch, plus a design doc. The keep-ticking-vs-pause decision is *the* open question — the scaffold assumes keep-ticking, challenge it.

**Guardrails:** don't change the 60 Hz tick or `BROADCAST_EVERY`; keep the existing lobby-phase disconnect behavior; no new msgpack-`Set` event without the type-1 codec; spectator stays design-only.

### ✅ Status — MERGED (PR #5, `sprint/netcode-rejoin` → `main`)

**What shipped:**

*Server-side:*
- **30-second grace window** — `RoomManager.markDisconnected()` records `disconnectedAt` timestamp without removing the player's slot. `RoomManager.rejoinRoom()` rebinds the player to a new socket ID within the window. Lobby-phase disconnect behavior unchanged (immediate removal).
- **`room:rejoin` socket handler** in `createApp.ts` — validates `{ roomCode, playerId }`, calls `rejoinRoom()`, emits `room:playerRejoined` to other players on success.
- **Disconnect notification** — other players receive `room:playerDisconnected` with `graceSeconds: 30`.
- **Grace expiry** — falls back to the existing destroy-match behavior.

*Client-side:*
- **`reconnection: true`** in `GameClient.ts` socket options.
- **Session persistence** — `{ roomCode, playerId }` stored in `sessionStorage` under `smash:rejoin` on `room:create` and `room:join` callbacks.
- **Automatic rejoin** — on `connect` event, reads persisted session and emits `room:rejoin`. Clears stored session on failure (grace expired, etc.).
- **New event handlers** — `room:playerDisconnected` (logs grace window info), `room:playerRejoined` (clears notification).

*Tests:* `RoomManager.test.ts` — rejoin within grace, unknown player, expired grace. `createApp.test.ts` — full socket integration for disconnect/rejoin flow.

*Docs:* `docs/sprint/NETCODE-HARDENING-DESIGN.md`, `docs/sprint/plans/netcode-disconnect-layers.md`.

**Discussion outcomes:** 30 s grace window kept. Keep-ticking with `EMPTY_INPUT` chosen over pausing (consistent with network lag, non-exploitable). Grace expiry falls back to match destruction. Spectator mode remains design-only.

---

## Quick win (any group, ~10 min)

The README's *"Known limitation: CPUs currently always target Player 1"* is **stale** — `selectTarget` in `packages/engine/src/ai/botAI.ts:104` already scores across all opponents and `main.ts:431` passes all opponent IDs. Correct `README.md` + `ROADMAP.md` and add a regression test proving multi-opponent targeting. Good warm-up for whichever group finishes discussion early.

### ⏳ Status — NOT STARTED

README.md and ROADMAP.md still contain the stale "Known limitation" text. No regression test for multi-opponent targeting was added.

---

## End-of-hour readout (10 min)

Each group answers, from their design doc:
1. What did you decide? (the discussion questions above)
2. What did you *not* decide that needs a follow-up?
3. Is your skeleton green (`pnpm test` passes on your branch)?

**Merge order after the sprint:** D → C → A → B (server-affecting first, client-only last). The one shared file, `main.ts`, is wired in marked regions in the order A → B → C so branches merge cleanly.

---

## Post-Sprint Summary

**Date merged:** 2026-09-04

**Merge order executed:** D → C → A → B (as specified). PRs #5, #4, #6, #7.

**Merge conflicts:** 2 branches required conflict resolution in shared files (`main.ts`, `GameClient.ts`, `main.network-character-select-flow.test.ts`). All conflicts were formatting differences (tabs vs. spaces, quote style) plus semantic additions from both sides. Resolved by taking the union of both changes with consistent formatting.

**Post-merge verification:**
- `pnpm build` — all 5 packages compile clean
- `pnpm test` — **854 tests pass** (engine: 271, server: 128, client: 455), 0 failures
- Engine determinism scan — 0 hits for `Date.now` / `Math.random` in `packages/engine`

| Team | Branch | PR | Status | Tests Added |
|------|--------|----|--------|-------------|
| **D** — Netcode Hardening | `sprint/netcode-rejoin` | #5 | ✅ Merged | RoomManager rejoin tests, createApp integration tests |
| **C** — Third Fighter (Swift) | `sprint/fighter-3` | #4 | ✅ Merged | 21 frame-data tests in `swift.test.ts` |
| **A** — Sound Effects | `sprint/sfx` | #6 | ✅ Merged | 9 SfxManager + 7 GameplaySfxRouter tests |
| **B** — Input & Settings | `sprint/input-settings` | #7 | ✅ Merged | 14 SettingsStore + 17 double-tap tests |
| Quick win — README fix | — | — | ⏳ Not started | — |

**Follow-up items:**
1. **Swift renderer** — accessory + animation files (mirroring `lincolnAccessories.ts` / `lincolnAnimations.ts`) planned but not started. Character is playable but renders with default polygon visuals.
2. **Quick win** — README/ROADMAP stale CPU targeting text + regression test still outstanding.
3. **Spectator mode** — design-only in Team D's doc; no implementation started.
4. **SFX pitch scaling** — `playbackRate` option exists in `SfxManager` but the formula for knockback-scaled pitch was not fine-tuned.
