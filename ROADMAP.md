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
- **Sprite specifications:** A comprehensive generation guide exists at [`SPRITE-GENERATION-GUIDE.md`](./SPRITE-GENERATION-GUIDE.md) covering all 22 moves, 4 player-slot color variants, VFX frames, and UI elements with AI-generation prompts ready for artist handoff

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

### Advanced tech mechanics (wavedash, L-cancel, wall-jump/wall-tech)

- **Status:** ✅ **Implemented (Waves 1–6)**

**Implementation evidence by todo (1–17):**
- Todo 1: `packages/shared/src/constants/stage.ts:43-48`, `packages/engine/src/physics/types.ts:16-34`, `packages/engine/src/physics/index.ts:10-25` — wall geometry and stage/type wiring (`WALLS`, `WallData`, `StageData.walls`).
- Todo 2: `packages/shared/src/constants/physics.ts:50-59` — wall-jump / wall-tech / L-cancel / wavedash constants.
- Todo 3: `packages/engine/src/physics/index.ts:386-407`, `packages/engine/src/index.ts:21` — pure `checkWallCollision` and package export.
- Todo 4: `packages/shared/src/types/GameState.ts:53`, `packages/engine/src/fsm/states/AirborneState.ts:22-24`, `apps/server/src/GameEngine.ts:618-625`, `packages/engine/src/physics/index.ts:57-67`, `apps/server/src/GameEngine.ts:1275-1299` — single-use `hasAirDodge` gate/consume/reset.
- Todo 5: `packages/engine/src/physics/physics.test.ts:621-685`, `packages/engine/src/fsm/fsm.test.ts:659-758`, `apps/server/src/GameEngine.wavedash.test.ts:215-327` — regression coverage protecting foundation fields/mechanics.
- Todo 6: `apps/server/src/GameEngine.ts:998-1035` — wall-jump detection + away-direction + velocity injection path.
- Todo 7: `packages/shared/src/types/GameState.ts:54`, `apps/server/src/GameEngine.ts:1008-1011`, `apps/server/src/GameEngine.ts:1022`, `packages/engine/src/physics/index.ts:66`, `apps/server/src/GameEngine.ts:1298`, `apps/server/src/GameEngine.wallJump.test.ts:249-363` — streak decay and landing/ledge resets, with integration tests.
- Todo 8: `apps/server/src/GameEngine.ts:1023-1024`, `apps/server/src/GameEngine.ts:870-880`, `apps/server/src/GameEngine.wallJump.test.ts:118-193` — wall-jump intangibility grant and decay.
- Todo 9: `apps/server/src/GameEngine.wallJump.test.ts:195-247` — regression guards that wall jump neither grants nor consumes double jump.
- Todo 10: `apps/server/src/GameEngine.ts:839-886`, `apps/server/src/GameEngine.wallTech.test.ts:50-81` — wall-tech success branch (momentum cancel + airborne return + intangibility).
- Todo 11: `apps/server/src/GameEngine.ts:845-873`, `apps/server/src/GameEngine.wallTech.test.ts:180-241` — wall-tech-jump chaining when jump is held.
- Todo 12: `apps/server/src/GameEngine.ts:887-895`, `apps/server/src/GameEngine.wallTech.test.ts:117-178` — missed wall-tech lockout penalty and enforcement.
- Todo 13: `apps/server/src/GameEngine.ts:543-547`, `apps/server/src/GameEngine.ts:557-566`, `apps/server/src/GameEngine.lcancel.test.ts:50-161` — L-cancel buffer countdown and shield-press window tracking.
- Todo 14: `apps/server/src/GameEngine.ts:690-698`, `apps/server/src/GameEngine.ts:898-910`, `packages/shared/src/types/GameState.ts:67-70`, `apps/server/src/GameEngine.lcancel.test.ts:217-311` — cached `isSpecial` plus aerial landing-lag halving rule.
- Todo 15: `packages/shared/src/types/GameState.ts:79`, `packages/engine/src/fsm/states/AirDodgeState.ts:5-17`, `packages/engine/src/fsm/states/AirDodgeState.ts:23-25`, `packages/engine/src/fsm/fsm.test.ts:709-757` — directional air-dodge capture and clear-on-exit.
- Todo 16: `apps/server/src/GameEngine.ts:913-943`, `apps/server/src/GameEngine.ts:822-831`, `apps/server/src/GameEngine.wavedash.test.ts:60-214` — wavedash landing branch and friction-driven slide decay.
- Todo 17: `packages/engine/src/fsm/states/AirborneState.ts:22-24`, `apps/server/src/GameEngine.wavedash.test.ts:215-327` — no repeat wavedash without a landing reset.

**Regression baseline:** full engine/server suites remain green for advanced-tech mechanics and associated integration specs.

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

### ✅ CPU opponents (Implemented — 2026-08-08)

Local-play CPU opponents are shipped. The lobby's participant-count-first flow lets the host set the number of human players, then assigns a CPU to each remaining slot at Easy, Medium, or Hard difficulty. The CPU runs a reactive targeting loop inside the server's authoritative game tick — no client-side simulation, no networking required.

**Remaining gap:** CPUs currently always target Player 1 and do not fight each other. Full multi-CPU targeting awareness is a planned future improvement.

---

## Next Steps

Ordered by impact-to-effort ratio. None of these require touching the engine's determinism invariants or the server-authority model.

- **Audio system (5–8 SFX + 1 BGM loop).** The single largest "feels unfinished" gap. Create `apps/client/src/audio/AudioManager.ts` wrapping the Web Audio API. Wire hit SFX to `applyHit` (pitch by knockback magnitude), movement SFX to FSM transitions, and one looped BGM track per stage that starts on `MATCH` and stops on `RESULT`. Five clips (hit, jump, land, shield-on, KO) closes most of the gap before adding music.

- **Second fighter: a fast floaty archetype.** The FSM, physics, and netcode don't change — this is purely new `MoveData` constants in `packages/engine/src/moves/` and new render assets in `apps/client`. A lightweight floaty character (low weight ~75, high air speed, multi-jump, weaker knockback) creates meaningful character-select decisions against Lincoln's heavyweight bruiser style.

- **Second stage: a moving-platform arena.** Add a new `StageConfig` in `apps/client/src/stages/stageConfig.ts` with a center platform and one or two moving soft platforms. Wire platform-position ticks through `GameEngine` (server-authoritative position update each tick) so the deterministic engine drives platform state. Gradient background in `StageRenderer` closes the "white rectangle on a dark grid" problem at the same time.

- **Blast-zone edge glow.** A subtle red glow at the `STAGE.blastZones` coordinates drawn in `BackgroundLayer` — low effort, immediately improves spatial awareness. Players currently have zero visual cue for kill boundaries.

- **Smash input distinction (double-tap detector).** `SHIELD + ATTACK` for smash is non-standard. Add a double-tap detection layer to `InputManager`: track time between two directional inputs and set a `SMASH_DIRECTIONAL` bit when under the threshold. `AttackState` already reads `currentMoveId` — this just changes which move gets selected.

- **Reconnection and session rejoin.** `socket.io` is initialized with `reconnection: false` — one dropped packet kills the match. Set `reconnection: true`, store `playerId` in `RoomManager` on disconnect, and re-slot the player on reconnect. No engine changes needed; the server's `GameState` is already the authoritative record.

- **Spectator mode.** The 20 Hz `StateSnapshot` broadcast already supports extra connected clients that never send inputs. Add a `SPECTATE` join path in `RoomManager` that skips slot assignment. The client renders the game state normally; `LocalPredictor` just never fires.

- **Replay system.** The deterministic engine makes this straightforward: store the full input stream per match (sequence of `InputEvent[]` per tick), then replay it by feeding those inputs back into a fresh `GameEngine` instance. No video encoding needed. Ship as a "watch last match" button on the result screen; persist to `localStorage` for the most recent match.

- **Training mode with frame-data display.** A local-play mode where: stocks are infinite, percent resets on a button press, and the HUD shows the current FSM state name and frame count for both fighters. Hooks into `UIManager`'s phase system; the server runs a normal match loop with a `TRAINING` flag that skips KO stock-loss.

- **Multi-CPU targeting awareness.** CPUs currently always target Player 1 and ignore each other. Update `botAI.ts` to select the nearest opponent by position (or lowest-stock opponent) rather than hardcoding index 0. Affects `apps/server/src/GameEngine.ts` where bot inputs are generated.

- **Settings persistence (keybinds + volume).** Move the keymap from a static `const` in `InputManager` to a `localStorage`-backed config object. Add a settings screen in `UIManager` that writes volume and keybind changes. No server work needed. Pairs naturally with the audio system addition.

- **Time mode (timed stock match).** `MATCH_CONFIG` already has the constants structure for it. Add a `timeLimit` field, a countdown clock to the HUD in `UIManager`, and a win-condition branch in `MatchSession` that checks elapsed ticks against `timeLimit × 60`. Tiebreak by stocks remaining, then by current percent (lower wins).

---

## Open initiatives — mechanics fidelity closed, three paths forward

**Gap A (mechanics fidelity) is now closed.** After Waves 1–6, the engine, netcode, FSM, physics, all 22 moves, grab/throw, ledge, shield, counters, smash charge, stale-move queue, DI, teching, KO effects, hit flash, pause, result screen, wavedash, L-cancel, wall-jump, and wall-tech are all shipped and green across 144 engine tests, 94 server tests, and 12 Playwright e2e specs.

Three open initiatives remain — none is blocked on the others, and none is clearly higher priority than the others. Pick the one that fits your next available effort:

**Option 1 — Audio:** No `AudioManager` exists. Zero SFX or BGM ships today. A minimal audio pass (5–8 clips: hit, shield, jump, KO, menu confirm, BGM loop) would close the single largest "feels unfinished" gap. Hook points are ready: hit events fire from the server, UI state transitions are discrete, and PixiJS has no audio opinion. Estimated effort: medium.

**Option 2 — Sprite art:** `FighterRenderer` draws a functional polygon fighter, but the art contract is fully pluggable. Swapping in a sprite sheet requires only a new render path in `FighterRenderer` — no engine or server changes. A `SpritePartRenderer` stub already exists at `apps/client/src/renderer/parts/SpritePartRenderer.ts`. Estimated effort: medium (art) + low (wiring).

**Option 3 — Second fighter / character architecture (Gap B):** Adding a second fighter requires new `MoveData` constants in `packages/engine/src/moves/` and new render assets in `apps/client`. The FSM, physics, hitboxes, and netcode don't change. The interesting work is differentiation: a heavyweight with slow smashes, a fast floaty character with a better recovery. This is also the natural forcing function for a character-select refactor if the single-fighter assumption is baked into any UI paths. Estimated effort: high.

