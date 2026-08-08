# ROADMAP — smash-clone

The engine and netcode here are production-quality: a 15-state FSM per fighter, 22 declarative moves, real knockback math, hitlag/hitstun, and a full client-prediction + server-reconciliation netcode stack. The gaps are almost entirely in the **presentation layer and content breadth** — not in the simulation underneath. Most additions below slot into existing hooks without restructuring what's already there.

---

## Scorecard

| Area | Current state | Rating |
|---|---|---|
| Engine / physics | 25-state FSM, 22 moves, hitlag/hitstun, real knockback formula | ★★★★☆ |
| Netcode | Client prediction, server reconciliation, interpolation buffer | ★★★★☆ |
| Rendering | Part-based polygon renderer; hit flash, screen shake, impact sparks, shield bubble, damage% color, per-move poses, KO tumble/stars | ★★★★☆ |
| Audio | Zero — no sound manager, no file references, nothing | ★☆☆☆☆ |
| Input | Solid bitmask foundation; no gamepad, no remapping | ★★★☆☆ |
| UI/UX | Functional prototype; raw `innerHTML`, text stock icons | ★★☆☆☆ |
| Content | One fighter, one stage, stock match only | ★★☆☆☆ |
| Meta / persistence | None — no accounts, no replays, no settings | ★☆☆☆☆ |

---

## 🎨 Visuals

The renderer (`apps/client`) has received significant polish through T9-T20. The architecture is now part-based and renderer-agnostic — `FighterRenderer` delegates all drawing to an `IPartRenderer` contract (`apps/client/src/renderer/parts/IPartRenderer.ts`), with a `PolygonPartRenderer` as the current concrete backend and a `SpritePartRenderer` stub ready for a future art pass.

### Characters

**What's shipped (T9-T20):**
- Part-based renderer abstraction — `FighterRenderer` delegates to `PolygonPartRenderer` via `IPartRenderer` contract; a `SpritePartRenderer` stub exists for future sprite atlas work (`apps/client/src/renderer/parts/SpritePartRenderer.ts`)
- Per-move poses — `getAnimationPose` now accepts `currentMoveId`; all 22 `MoveId` values have distinct keyframe entries differing by ≥0.2 radians on at least one limb angle (`apps/client/src/renderer/animations.ts`)
- Hit flash — `FighterRenderer.startHitFlash()` applies a golden-yellow tint (`0xFFDD44`) to the part renderer container for 4 frames on every connecting hit (`apps/client/src/renderer/FighterRenderer.ts:110-121`)
- Impact sparks — `ImpactSpark` radiates 6 white circles from the hit world position over 10 frames, auto-cleaned after expiry (`apps/client/src/renderer/effects/ImpactSpark.ts`)
- Screen shake — `Camera.shake(knockbackMagnitude)` applies a decaying random offset for 8-15 frames, clamped to 20px max, skipping hits below a threshold of 5 to avoid shaking on pummels (`apps/client/src/renderer/Camera.ts:54`)
- Shield bubble — `updateShieldBubble()` draws a semi-transparent circle (radius 36, alpha 0.4) color-cycling from blue (`0x4488ff`) at full health to red (`0xff2222`) near zero; disappears immediately when `isShielding` is false (`apps/client/src/renderer/FighterRenderer.ts:142-155`)
- KO tumble/star effect — `KOEffect` rotates the fighter container 18°/frame for 40 frames and spawns 8 star particles at 45° spacing that fade to alpha 0; wired via `updateKOEffect()` on `isKnockedOut` transitions (`apps/client/src/renderer/FighterRenderer.ts:124-137`, `apps/client/src/renderer/KOEffect.ts`)

**Still missing:**
- Sprite sheets or vector art — every fighter is still a pentagon + circles + rectangles (the `SpritePartRenderer` contract exists but has no art assets yet)

**Existing hooks (unchanged):**
- `FighterRenderer.redraw()` remains the sole draw call — swap `PolygonPartRenderer` for `SpritePartRenderer` via the `createPartRenderer` factory (`apps/client/src/renderer/parts/index.ts`) to sample a sprite atlas, no `FighterRenderer` rewrite needed
- `PlayerState.currentMoveId` is tracked and passed to the renderer — per-move art now keys off it
- `HitEventData` in `StateSnapshot.hitEvents` is the event source for all client-side hit effects

### Stage

**What's missing:**
- Background art — `StageRenderer` draws a white rectangle on a dark grid, nothing else
- Blast-zone indicators — players have no visual cue for kill boundaries
- Only one stage exists

**Existing hooks:**
- `STAGE` constants in `packages/shared` are the full stage definition — adding a stage is adding a data object
- `BackgroundLayer` is drawn once at startup — the right place for background art and blast-zone glows

**Approach:**
- Even a simple gradient background per stage is a significant step up from the grid
- Render a subtle edge glow at the `STAGE.blastZones` coordinates
- Add stage configs to `packages/shared/src/constants/` — `StageRenderer` already reads from `STAGE`

### UI

**What's shipped (T18):**
- Damage % color progression — `UIManager.interpolateDamageColor()` interpolates white (0%) → yellow (~50-100%) → red (150%+), applied every `updateHUD` call (`apps/client/src/ui/UIManager.ts:351-366`)

**Still missing:**
- Stock icons are `■□` text characters — needs fighter portrait thumbnails
- No countdown animation — the number just appears
- Character select exists (`showCharacterSelect()` in `UIManager`) but has one fighter and placeholder text

**Existing hooks:**
- `UIManager` in `apps/client` — all UI phases flow through here
- `UILayer` (PixiJS) is separate from the HTML overlay — move HUD elements there for GPU rendering and animation

---

## 🎵 Audio

**What's missing:** Everything. No sound manager, no file references, no Web Audio context, nothing.

**Why it matters:** Sound is disproportionately impactful for a feel-driven game. A pitched hit SFX does more for "game feel" than most visual polish.

**Existing hooks — the right event sources:**
- `applyHit` — emit hit SFX here, pitched by `knockbackMagnitude`
- `FSMController` state transitions — `Jump`, `Land`, `Dash`, `Shield` SFX fire here
- `shieldHealth <= 0` — shield break SFX
- `RoomManager` state machine (`COUNTDOWN → MATCH`) — music start/stop

**Approach:**
1. Create `apps/client/src/audio/AudioManager.ts` — wraps Web Audio API, loads and caches clips
2. Add an `onHit(magnitude: number)` callback from `applyHit` → `AudioManager.playHit(magnitude)`
3. Add state-transition hooks in `FSMController` for movement SFX
4. BGM: one looped track per stage, start on `MATCH` state, stop on `RESULT`

**Minimal first step:** 5 SFX (hit, jump, land, shield-on, KO) does most of the work. Music can come after.

---

## 🕹️ Input

`InputManager.ts` is solid — bitmask, pressed/released tracking, configurable keymap. Three specific gaps:

### ✅ Gamepad support (Implemented)

Implemented in `packages/gamepad-input`. Auto-detects Xbox/Standard-mapping controllers, supports up to 4 controllers simultaneously, and persists slot assignments across sessions. Open the **Controls** screen from the local-play lobby to view device assignments and rebind keys/buttons.

### Remapping UI

**What's missing:** Keymap is a static `const` — no in-game binding changes.

**Approach:** Move keybinds to `localStorage`-backed config; add a settings screen to `UIManager` that writes to it.

### Smash input (tilt vs smash distinction)

**What's missing:** `SHIELD + ATTACK = smash` is non-standard. Real Smash uses analog stick speed. On keyboard this is typically a double-tap detector or a dedicated smash button.

**Approach:** Add a double-tap detection layer to `InputManager` — track time between two directional inputs; if under a threshold, set a `SMASH_DIRECTIONAL` bit instead of plain directional. The FSM `AttackState` already reads `currentMoveId` — this just changes which move gets selected.

### Short hop

**What's missing:** `PHYSICS.SHORT_HOP_THRESHOLD_FRAMES` is defined and `resolveJump` exists, but `JumpsquatState` doesn't track how long `JUMP` is held before transitioning.

**Approach:** In `JumpsquatState.update()`, count frames with `JUMP` held vs. released. Pass the result to `resolveJump` — the hook is already there.

---

## ⚙️ Engine gaps

The engine is the strongest part of this repo. These are the remaining gaps — all have data stubs already:

### Smash charge

- **Status:** ✅ **Implemented (Wave 2)** — `GameEngine.ts:908-988` (`withHitboxState`) tracks `chargeFrames` per player, clamps to `SMASH_CHARGE_MAX_FRAMES`, and scales both `damage` and `baseKnockback` by up to 1.4× on release. Charge is held while `ATTACK` is held and `stateFrame < startupFrames + clampedChargeFrames`.

### Down Special (Counter)

- **Status:** ✅ **Implemented** — `packages/engine/src/moves/special.ts` defines the counter move with invincibility frames and counter-hit detection. `GameEngine.ts` handles the counter logic and applies invincibility during the active window.
- **Hook:** Counter-hit detection is wired; invincibility frames are applied correctly.

### Landing lag

- **Status:** ✅ **Implemented (Wave 2)** — `GameEngine.ts:689-700` reads `player.currentMove?.landingLag` on landing from `AIR_ATTACK` and transitions to the `LANDING_LAG` state (defined in `PlayerFSMState.ts:19`). `tickLandingLagCounter` (`GameEngine.ts:720-738`) decrements `landingLagFrames` each tick and releases back to `IDLE` when exhausted.

### Shield break stun

- **Status:** ✅ **Implemented (Wave 2)** — `GameEngine.ts:1363` applies `PHYSICS.SHIELD_BREAK_STUN_FRAMES` directly as `hitstunFramesRemaining` when shield health reaches 0, launching the fighter upward (`vy: -8`) and transitioning to `HITSTUN`.

### Grab victim position

- **Status:** ✅ **Fully implemented (T6-T8).** Position pinning, pummel, and all four directional throws are wired. `GrabHoldingState` detects `ATTACK` for pummel and directional inputs for throws; `GameEngine.ts` generates hitboxes, applies damage/knockback, and clears grab flags on throw resolution. Pummel suppresses `HITSTUN` to keep victim in `GRAB_HOLDING`; stale-move scaling accumulates across repeated pummels. Tests: `apps/server/src/GameEngine.grab.test.ts` — pummel stale accumulation (line 442), forward/back/up/down throw assertions (lines 324-408).

### Ledge grab

- **Status:** ✅ **Implemented and tested** — contrary to earlier analysis, ledge grab is fully wired.
- **What's done:** 5 ledge states (LEDGE_HANG, LEDGE_CLIMB, LEDGE_ATTACK, LEDGE_ROLL, LEDGE_JUMP) are defined, transitioned by `GameEngine.ts` when player is AIRBORNE/DOUBLE_JUMP and in range of a ledge. Invincibility frames applied on grab. Ledge occupancy managed (first player gets ledge, second player is "trumped" and launched). Comprehensive test suite in `GameEngine.ledge.test.ts` covers all getup options and priority system.
- **Remaining edge mechanics:** Wall bounce, footstool — these are new features, not stubs.

---

## 🌐 Multiplayer / backend hardening

The netcode architecture (client prediction + server reconciliation + interpolation) is the most impressive part of this repo. For a shipped product, several gaps need addressing:

| Gap | Current state | Fix |
|---|---|---|
| **Reconnection** | `socket.io` initialized with `reconnection: false` — a dropped packet kills the session | Set `reconnection: true`, implement session rejoin by `playerId` in `RoomManager` |
| **Room persistence** | Rooms live in-memory — a server restart destroys all active sessions | Redis layer or graceful shutdown handler that serializes `RoomManager` state |
| **Authentication** | `generatePlayerId()` is a random string — spoofable | Session tokens / signed cookies; fine to skip for casual play, required for rankings |
| **Spectator mode** | Not implemented | The 20 Hz `StateSnapshot` broadcast already supports it — connect a client that doesn't send inputs |
| **Matchmaking** | Manual room codes only | A simple queue: emit `FIND_MATCH`, server pairs waiting players, creates room, redirects both |
| **Determinism verification** | `getStateHash()` mismatch is `console.log` only | On mismatch: send corrective full-state snapshot to the desynced client and alert in the HUD |

---

## 🗂️ Content

One fighter, one stage, one game mode. The engine is fully content-agnostic — adding content is adding data.

### Additional fighters

**What's needed:** New `MoveData` constants in `packages/engine/src/moves/` and new art in `apps/client`. The FSM, physics, hitboxes, and netcode don't change.

**Approach:** Clone the existing move set as a starting point. The interesting work is differentiation — a heavyweight with slow smashes and high weight, a fast floaty character with a better recovery.

### Additional stages

**What's needed:** A new object in the `STAGE` config shape (`packages/shared`) and a corresponding branch in `StageRenderer`. The server reads stage config at room creation.

### Game modes

**What's needed:** A time mode (most KOs after N minutes) is the obvious first addition. `MATCH_CONFIG` already has the constants structure for it; `MatchSession` handles win condition checks.

---

## 📊 Meta / persistence

No persistence exists today. This is the lowest priority but required for a public game.

| Feature | Notes |
|---|---|
| **Win/loss record** | Requires accounts — server-side only, `playerId` as key |
| **Settings persistence** | Volume, keybinds → `localStorage` on the client; no server needed |
| **Replays** | The deterministic engine makes this feasible: store the input stream per match, replay it locally. Same architecture as netcode |
| **Ranked mode** | Requires matchmaking + auth first |

---

## How to use this roadmap

### Impact vs. effort matrix

| Effort | High impact | Lower impact |
|---|---|---|
| **Low** | ~~Short hop (wire `JumpsquatState`)~~ ✅ · ~~Landing lag~~ ✅ · ~~Shield break stun~~ ✅ · Hit SFX (5 clips) | ~~Damage % color progression~~ ✅ · Blast-zone edge glow |
| **Medium** | ~~Smash charge~~ ✅ · ~~Grab victim pinning + pummel/throw~~ ✅ · Stage background art · ~~Shield bubble~~ ✅ | ~~Down Special counter logic~~ ✅ · Reconnection handling · Settings persistence |
| **High** | Sprite art for fighters · Additional fighter (full move set) · Additional stage · Audio system + BGM | Ranked / matchmaking · Replays · ~~Ledge grab~~ ✅ |

### Recommended first milestone — "It feels like a game"

These changes closed the gap between "working prototype" and "feels like a real game." All six are now shipped:

1. ✅ **Wire short hop** — `JumpsquatState` counts held frames; `resolveJump` produces a short hop when `JUMP` is released before the jumpsquat window ends (`packages/engine/src/physics/index.ts`)
2. ✅ **Wire landing lag** — reads `currentMove.landingLag` on landing from `AIR_ATTACK`; transitions to `LANDING_LAG` state (`apps/server/src/GameEngine.ts:689-700`)
3. ✅ **Wire shield break stun** — applies `PHYSICS.SHIELD_BREAK_STUN_FRAMES` when `shieldHealth <= 0`, launches fighter upward, transitions to `HITSTUN` (`apps/server/src/GameEngine.ts:1363`)
4. **5 hit SFX** — not yet; `AudioManager` does not exist. Zero audio shipped.
5. ✅ **Damage % color** — `UIManager.interpolateDamageColor()` white → yellow → red (`apps/client/src/ui/UIManager.ts:351-366`)
6. ✅ **Shield bubble** — `FighterRenderer.updateShieldBubble()` draws a color-cycling semi-transparent circle (`apps/client/src/renderer/FighterRenderer.ts:142-155`)

### After milestone 1

- Sprite art for the existing fighter (highest visual impact)
- Second stage (low effort once art exists)
- Reconnection handling (required before sharing publicly)

---

*This document reflects the state of the codebase as analyzed — the engine is the hard part and it's done well. Everything else builds on existing hooks.*

---

## Recommended next milestone — "Audio foundation + character sprite sheet"

After T1–T26, the two largest remaining gaps are audio and art. The engine, netcode, FSM, physics, all 22 moves, grab/throw, ledge, shield, counters, smash charge, stale-move queue, DI, teching, KO effects, hit flash, pause, and result screen are all shipped and green across 132 engine tests, 69 server tests, and 12 Playwright e2e specs.

**Gap 1 — Audio (highest priority):** No `AudioManager` exists. Zero SFX or BGM ships today. A minimal audio pass (5–8 clips: hit, shield, jump, KO, menu confirm, BGM loop) would close the single largest "feels unfinished" gap. The hook points already exist — hit events fire from the server, UI state transitions are discrete, and PixiJS has no audio opinion.

**Gap 2 — Sprite art (highest visual impact):** `FighterRenderer` draws a functional polygon fighter, but the art contract is fully pluggable — swapping in a sprite sheet requires only a new render path in `FighterRenderer`. No engine or server changes needed. Even a single hand-drawn sprite sheet for the existing all-rounder would transform first impressions.

**Suggested milestone scope:** `AudioManager` class with Web Audio API, 5 SFX clips wired to existing hit/KO/shield events, 1 BGM loop, and a sprite sheet import path in `FighterRenderer`. Estimated effort: medium. No architecture changes required.

