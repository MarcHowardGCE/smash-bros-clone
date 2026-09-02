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

---

## Quick win (any group, ~10 min)

The README's *"Known limitation: CPUs currently always target Player 1"* is **stale** — `selectTarget` in `packages/engine/src/ai/botAI.ts:104` already scores across all opponents and `main.ts:431` passes all opponent IDs. Correct `README.md` + `ROADMAP.md` and add a regression test proving multi-opponent targeting. Good warm-up for whichever group finishes discussion early.

---

## End-of-hour readout (10 min)

Each group answers, from their design doc:
1. What did you decide? (the discussion questions above)
2. What did you *not* decide that needs a follow-up?
3. Is your skeleton green (`pnpm test` passes on your branch)?

**Merge order after the sprint:** D → C → A → B (server-affecting first, client-only last). The one shared file, `main.ts`, is wired in marked regions in the order A → B → C so branches merge cleanly.
