# ROADMAP — smash-clone

The engine and netcode here are production-quality: a 15-state FSM per fighter, 22 declarative moves, real knockback math, hitlag/hitstun, and a full client-prediction + server-reconciliation netcode stack. The gaps are almost entirely in the **presentation layer and content breadth** — not in the simulation underneath. Most additions below slot into existing hooks without restructuring what's already there.

---

## Scorecard

| Area | Current state | Rating |
|---|---|---|
| Engine / physics | 15-state FSM, 22 moves, hitlag/hitstun, real knockback formula | ★★★★☆ |
| Netcode | Client prediction, server reconciliation, interpolation buffer | ★★★★☆ |
| Rendering | Geometric polygons, no sprites, no hit effects | ★★☆☆☆ |
| Audio | Zero — no sound manager, no file references, nothing | ★☆☆☆☆ |
| Input | Solid bitmask foundation; no gamepad, no remapping | ★★★☆☆ |
| UI/UX | Functional prototype; raw `innerHTML`, text stock icons | ★★☆☆☆ |
| Content | One fighter, one stage, stock match only | ★★☆☆☆ |
| Meta / persistence | None — no accounts, no replays, no settings | ★☆☆☆☆ |

---

## 🎨 Visuals

The renderer (`apps/client`) is the biggest gap between "working prototype" and "polished game." The architecture is already renderer-agnostic — `FighterRenderer.redraw()` is the single choke point for all fighter art.

### Characters

**What's missing:**
- Sprite sheets or vector art — every fighter is a pentagon + circles + rectangles
- Per-move visuals — `ATTACK` always renders the same "arms out" pose regardless of `MoveId`
- Hit effects — no flash, no impact spark, no screen shake on hit
- Shield bubble — `isShielding` is tracked and health ticks, but nothing is drawn
- KO animation — `isKnockedOut` transitions immediately; no tumble, no star KO effect

**Existing hooks:**
- `FighterRenderer.redraw()` is the sole draw call — swap `g.drawPolygon()` here to sample a sprite atlas
- `PlayerState.currentMoveId` is already tracked and passed to the renderer — attack art just needs to key off it
- `applyHit` fires correctly on every hit — emit a visual event from there for impact effects
- `isShielding` and `isKnockedOut` are already on `PlayerState`

**Approach:**
1. Add a sprite atlas loader to `FighterRenderer`; fall back to polygon art if no atlas is found
2. Map `MoveId` → frame offset in the atlas for attack poses
3. Emit a `HitEffect` event from `applyHit` and render it in `GameLayer` for 3–5 frames
4. Draw a circle around the fighter when `isShielding === true` (color-cycle it as `shieldHealth` drops)

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

**What's missing:**
- Stock icons are `■□` text characters — needs fighter portrait thumbnails
- Damage % has no color progression (low % = white → high % = red is a Smash convention)
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

- **Missing:** `chargeMax: 60` is defined on smash moves in `packages/engine/src/moves/ground.ts`, but nothing in `GameEngine` or the FSM tracks how long `ATTACK` is held to charge.
- **Hook:** `AttackState` — add a `chargeFrames` counter, clamp to `chargeMax`, scale damage/knockback on release.

### Down Special (Counter)

- **Missing:** `MOVE_DOWN_SPECIAL` has `activeFrames: 0` and empty `hitboxPerActiveFrame` — it's a placeholder. No invincibility window, no counter-hit detection.
- **Hook:** Add `invincible: true` frames to the move data; `hitbox/` already handles invincibility flags.

### Landing lag

- **Missing:** `landingLag` is defined on aerial moves (e.g. Up Special = 14 frames) but `checkPlatformCollision` never reads it.
- **Hook:** `checkPlatformCollision` in `packages/engine/src/physics/` — on landing, check `currentMove.landingLag` and lock the FSM for N frames.

### Shield break stun

- **Missing:** `SHIELD_BREAK_STUN_FRAMES: 150` is defined but never applied when `shieldHealth` reaches 0.
- **Hook:** `Shield` state handler — when `shieldHealth <= 0`, transition to a `ShieldBreak` state (or re-use `Hitstun` with 150 frames).

### Grab victim position

- **Missing:** `GrabHoldingState` exists but the grabbed player's position is never pinned to the attacker — they'd stay at their original coordinates while being "held."
- **Hook:** In `GrabHoldingState.update()`, write `victim.x = attacker.x + GRAB_OFFSET_X` each tick.

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
| **Low** | Short hop (wire `JumpsquatState`) · Landing lag · Shield break stun · Hit SFX (5 clips) | Damage % color progression · Blast-zone edge glow |
| **Medium** | Smash charge · Grab victim pinning · Stage background art · Shield bubble | Down Special counter logic · Reconnection handling · Settings persistence |
| **High** | Sprite art for fighters · Additional fighter (full move set) · Additional stage · Audio system + BGM | Ranked / matchmaking · Replays · Ledge grab |

### Recommended first milestone — "It feels like a game"

These changes are high-impact, low-to-medium effort, and require no new architecture:

1. **Wire short hop** — `JumpsquatState` already has the physics; just count held frames
2. **Wire landing lag** — one read from `currentMove.landingLag` in `checkPlatformCollision`
3. **Wire shield break stun** — apply `SHIELD_BREAK_STUN_FRAMES` when `shieldHealth <= 0`
4. **5 hit SFX** — create `AudioManager`, hook `applyHit`, add jump/land sounds
5. **Damage % color** — low % white → mid % yellow → high % red in `UIManager`
6. **Shield bubble** — draw a circle in `FighterRenderer` when `isShielding`

These six changes close the gap between "working prototype" and "feels like a real game" faster than any art work. Art is higher polish but also higher effort — do the engine wiring first.

### After milestone 1

- Sprite art for the existing fighter (highest visual impact)
- Second stage (low effort once art exists)
- Reconnection handling (required before sharing publicly)

---

*This document reflects the state of the codebase as analyzed — the engine is the hard part and it's done well. Everything else builds on existing hooks.*
