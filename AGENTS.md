# AGENTS.md — Everybody Throws Hands

A multiplayer browser platform fighter with percent-based damage, blast-zone KOs, stocks, and 22 moves per fighter, built on a deterministic engine with hybrid client-prediction netcode.

---

## 🤖 Model Routing (inherit from root AGENTS.md)
See `C:\Github\AGENTS.md` for the full model selection table.
**This repo's palace wing:** `smash-bros` — use `wing="smash-bros"` in mempalace_search calls.
Quick tasks → `github-copilot/claude-haiku-4-5`. Default → `github-copilot/claude-sonnet-4.6`.

---

## Monorepo Structure

```
smash-bros-clone/
├── apps/
│   ├── client/          # @smash/client  — Vite + TypeScript + PixiJS v8 browser game
│   └── server/          # @smash/server  — Node.js + socket.io authoritative game server
└── packages/
    ├── engine/          # @smash/engine  — Deterministic game simulation (pure TS, no I/O)
    ├── shared/          # @smash/shared  — Types, constants, pure math (zero deps)
    └── gamepad-input/   # @smash/gamepad-input — Gamepad polling + button-mapping persistence
```

| Package | npm name | Purpose | Key files |
|---|---|---|---|
| `packages/shared` | `@smash/shared` | Zero-dependency types, enums, constants, math | `src/types/`, `src/constants/`, `src/math/vectors.ts` |
| `packages/engine` | `@smash/engine` | Deterministic physics + FSM + hitbox + AI | `src/physics/index.ts`, `src/fsm/FSMController.ts`, `src/hitbox/index.ts`, `src/moves/` |
| `packages/gamepad-input` | `@smash/gamepad-input` | Gamepad polling, standard-mapping, preference persistence | `src/GamepadPoller.ts`, `src/standardMapping.ts`, `src/persistence.ts` |
| `apps/server` | `@smash/server` | Authoritative 60 Hz server, room management, binary broadcast | `src/GameEngine.ts`, `src/MatchSession.ts`, `src/RoomManager.ts`, `src/createApp.ts` |
| `apps/client` | `@smash/client` | Browser client, input capture, prediction, interpolation, PixiJS renderer | `src/main.ts`, `src/network/GameClient.ts`, `src/network/LocalPredictor.ts`, `src/renderer/FighterRenderer.ts` |

---

## Package Dependency Graph

```
shared          (zero deps — root of the graph)
  ↑
engine          (imports @smash/shared only — pure TS, no Node, no browser APIs)
  ↑         ↑
server      client
(engine +   (engine + shared + gamepad-input)
 shared)
```

`packages/shared` is the dependency root. Nothing imports into it.

`packages/engine` is pure TypeScript. It has no Node.js imports, no browser APIs, no I/O of any kind. This is what makes the simulation deterministic: the same input sequence always produces the same output regardless of which runtime or thread executes it. The client runs the engine locally for movement prediction; the server runs the same engine as the source of truth. If engine ever grows an I/O dependency, prediction divergence and desyncs follow immediately.

---

## The Critical Invariants

### 1. Engine determinism

`packages/engine` contains no `Date.now()`, no `Math.random()`, and no I/O. Every exported function is pure: same inputs, same outputs, always. Verify:

```bash
# Must return zero matches
Get-ChildItem -Path packages/engine/src -Recurse -Filter "*.ts" |
  Select-String -Pattern "Date\.now|Math\.random"
```

Breaking this breaks the client-side prediction/reconciliation loop. Any divergence between client and server simulations produces rubber-banding.

### 2. Server authority

All game state lives on the server. `GameEngine.ts` (in `apps/server`) is the single source of truth. The client predicts **movement only** via `LocalPredictor`. It never predicts attacks, damage, hitstun, KOs, or grab state. Combat results always arrive from the server snapshot. Never put hit detection, knockback calculation, or stock-loss logic in the client.

### 3. Binary protocol

All game state is encoded with `@msgpack/msgpack`. The server sends binary `game:state` frames and the client sends binary `game:input` frames. `JSON.stringify` is never used on hot-path game state. The `Set` type requires a custom extension codec (type ID `1`, registered in both `MatchSession.ts` and `GameClient.ts`) because msgpack doesn't encode JS `Set` natively.

### 4. 60 Hz server / 20 Hz broadcast

The server ticks at 60 Hz (`TICK_MS = 1000 / 60`) using a `setImmediate` + `performance.now()` accumulator loop. It broadcasts a full snapshot every third tick (`BROADCAST_EVERY = 3`), giving a 20 Hz update stream. The client's `InterpolationBuffer` stores the last 3 snapshots and lerps remote player positions between them, producing visually smooth 60 fps rendering from the 20 Hz stream. Do not change `BROADCAST_EVERY` without also adjusting the interpolation buffer depth.

---

## Key Files — Read These First

1. **`packages/shared/src/index.ts`** — barrel export for every shared type, enum, and constant. Reading this tells you the full data model (`PlayerState`, `GameState`, `InputEvent`, `MoveData`, `PlayerStateEnum`, `PHYSICS`, `STAGE`).

2. **`packages/engine/src/physics/index.ts`** — all physics functions: gravity, movement, jump resolution, fast fall, platform collision, blast-zone detection, ledge grab. Pure functions, no side effects.

3. **`packages/engine/src/fsm/FSMController.ts`** — per-fighter FSM driver. Routes each tick through the active `IFSMState`, handles hitlag freeze, and manages the enter/update/exit lifecycle across all 25 states.

4. **`packages/engine/src/hitbox/index.ts`** — circle overlap collision, Smash Bros knockback formula, hit trading by priority. `resolveHit` and `resolveHitTrade` are the core combat functions.

5. **`apps/server/src/GameEngine.ts`** — authoritative server-side game loop. Runs the full 17-step pipeline per tick: FSM, physics, hitbox, grab sync, KO detection, win condition. Also defines `EMPTY_INPUT` used when no input arrives for a player.

6. **`apps/server/src/MatchSession.ts`** — owns the `setImmediate` tick loop, drives `GameEngine`, and broadcasts msgpack snapshots at 20 Hz. Read the inline comments explaining why `setImmediate` beats `setInterval` and why `BROADCAST_EVERY = 3`.

7. **`apps/client/src/network/GameClient.ts`** — top-level network facade. Orchestrates input encoding, prediction, snapshot reconciliation, interpolation, and the render-state assembly passed to PixiJS. Lines 9-21 show the msgpack `Set` extension codec.

8. **`apps/client/src/network/LocalPredictor.ts`** — client-side movement prediction and reconciliation. Applies movement physics locally on every input, then on each server snapshot prunes confirmed inputs and replays the unconfirmed tail on top of the server state.

---

## How to Run / Test / Build

```bash
# Install all workspace dependencies
pnpm install

# Start server + client, open browser, clean up on exit (recommended)
just play

# Run all unit tests (regression gate — must exit 0 before any commit)
pnpm test

# Build all packages in dependency order
pnpm build
```

### All `just` commands

```bash
just            # list available commands
just play       # start server + client + open browser + auto-cleanup
just dev        # start server + client without opening browser
just build      # build all packages
just test       # run engine unit tests (same as pnpm test)
just clean      # remove all dist/ and node_modules/
just stop       # kill any running server/client processes
just logs       # tail live server logs
```

`pnpm test` is the regression gate. It runs all Vitest unit tests. It must exit 0 before merging any change.

---

## Adding a Fighter

1. **Define stats** in `packages/shared/src/constants/characters.ts`. Copy `ALL_ROUNDER_STATS` as a base, adjust `weight`, `walkSpeed`, `runSpeed`, `jumpVelocity`, `airSpeed`, and `size`. Register the new ID in `CHARACTER_IDS` and `CHARACTER_REGISTRY`.

2. **Add the `CharacterId` literal** to `packages/shared/src/types/Character.ts` so the union type covers the new fighter.

3. **Override moves** (optional) in `packages/engine/src/moves/`. Create a file analogous to `lincoln.ts`. Call `getMoveDataForCharacter(characterId, moveId)` in `packages/engine/src/moves/index.ts` to route to your overrides.

4. **Add renderer visuals** in `apps/client/src/renderer/`. Create a character-specific accessory/animation file (see `lincolnAccessories.ts` and `lincolnAnimations.ts` for reference). Wire it into `FighterRenderer.ts`.

5. **Write tests** covering frame-data validity (see `packages/engine/src/characters/characters.test.ts`) and any custom move overrides (see `packages/engine/src/moves/lincoln.test.ts`).

6. Run `pnpm test` and confirm zero failures.

---

## Adding a Stage

1. **Define geometry** in `apps/client/src/stages/stageConfig.ts`. Add a `StageConfig` entry with `id`, `name`, main platform bounds, and any soft platforms.

2. **Update blast zones** if the stage is a different size. Blast zone constants live in `packages/shared/src/constants/stage.ts` (`STAGE.blastZone`). If you want per-stage blast zones, extend `StageConfig` to carry them and thread the values through `MatchSession` into `GameEngine`.

3. **Background rendering** lives in `apps/client/src/renderer/` (the `BackgroundLayer`). Add a branch or strategy for your stage ID.

4. **Test** platform collision with a targeted Vitest test using `checkPlatformCollision` from `packages/engine/src/physics/index.ts`.

---

## Adding a Move

1. **Add a `MoveId` enum value** in `packages/shared/src/types/MoveData.ts`.

2. **Write the `MoveData` object** in the appropriate file under `packages/engine/src/moves/` (`ground.ts`, `aerial.ts`, `special.ts`, `grab.ts`, or `ledge.ts`). Specify `startupFrames`, `activeFrames`, `recoveryFrames`, per-frame `hitboxes` (each with `offsetX`, `offsetY`, `radius`, `damage`, `knockbackAngle`, `knockbackGrowth`, `baseKnockback`), and `flags`.

3. **Wire the input** in the relevant FSM state. Ground attacks are triggered in `AttackState.ts`, aerials in `AirAttackState.ts`, specials via `INPUT_BITS.special` checks in the appropriate state.

4. **Assign the move** to a fighter by adding an entry to `getMoveDataForCharacter` in `packages/engine/src/moves/index.ts`, or to the base move map if it's shared.

5. **Test** startup/active/recovery counts and hitbox placement with a Vitest test in `packages/engine/src/moves/moves.test.ts` or a character-specific file.

---

## Common Gotchas

**msgpack `Set` encoding.** JS `Set` is not a native msgpack type. Both `MatchSession.ts` and `GameClient.ts` register an `ExtensionCodec` with type ID `1` that serialises `Set` as a plain array and deserialises it back to `Set`. If you add a new socket event that carries a `Set`, use the same codec on both sides. Forgetting this produces a plain `Array` on the receiving end, which breaks `Set.has()` calls silently.

**FSM state transitions.** States transition by returning a `FSMTransition` object from `update()`. Returning `null` stays in the current state. An invalid target state (one not in the `FSMController` map) throws at runtime. When adding a new state, register it in `FSMController`'s constructor Map before wiring any transitions to it.

**Physics function purity.** Every function in `packages/engine/src/physics/index.ts` takes a `PlayerState` and returns a new `PlayerState`. None mutate in place. When calling them in `GameEngine.ts`, always assign the return value — ignoring it silently drops the update.

**Server-only game state.** Fields like `stocks`, `percent`, `hitstunFrames`, `grabState`, and `invincibilityFrames` live only in the server's `GameState`. The client's `LocalPredictor` only tracks position, velocity, and FSM state for movement prediction. Never read `stocks` or `percent` from the predictor.

**Test isolation.** `GameEngine` tests construct a fresh engine with `makeDefaultGameState()` helpers at the top of each test file. They don't share state across tests. If you see flaky tests, check for shared mutable objects leaking between `it()` blocks.

**`EMPTY_INPUT` sentinel.** When a player's input doesn't arrive in time for a tick (network lag, disconnection), `GameEngine` substitutes `EMPTY_INPUT`: all bits cleared, no directional input, sequence number carried over. Never pass `null` or `undefined` to `GameEngine.tick()` for a missing player — use `EMPTY_INPUT`.

---

## Netcode Mental Model

The server is always right. The client predicts only to hide latency, never to determine outcomes.

When a local player presses a key, `InputManager` encodes the input as a binary msgpack frame and sends it to the server. Simultaneously, `LocalPredictor` applies the movement physics locally using the same `@smash/engine` functions the server uses — this makes the player feel instantaneously responsive. The input is tagged with a sequence number and kept in a pending queue.

Every ~50 ms the server sends a `game:state` snapshot. When `LocalPredictor` receives it, it checks the sequence number of the last confirmed input. It discards all pending inputs older than that, resets position to the server's authoritative value, then replays the remaining unconfirmed inputs forward from that point. If the re-simulated position matches the local prediction closely, nothing visible happens. If there's a divergence (packet loss, lag spike), the local player snaps to the correct position.

Remote players don't get prediction. Their positions come only from server snapshots. `InterpolationBuffer` stores the last 3 snapshots and lerps between them, so a 20 Hz update stream renders as smooth 60 fps motion with roughly 50 ms of added latency on remote players. That's the correct trade-off: remote player positions are always slightly behind real time but never wrong.

---

## Test Map

| Test file | What it covers |
|---|---|
| `packages/engine/src/physics/physics.test.ts` | Gravity, terminal velocity, ground movement, jump, fast fall, platform collision, blast-zone detection, wall collision, ledge snap |
| `packages/engine/src/fsm/fsm.test.ts` | FSM state transitions for all 25 states, hitlag freeze, edge-fall detection, enter/exit lifecycle |
| `packages/engine/src/hitbox/hitbox.test.ts` | Circle overlap, knockback formula, hit trading by priority, `NO_HIT` sentinel |
| `packages/engine/src/moves/moves.test.ts` | Frame data validity for all 22 base moves (startup, active, recovery, hitbox fields) |
| `packages/engine/src/moves/lincoln.test.ts` | Frame data validity for Lincoln's 7 move overrides |
| `packages/engine/src/characters/characters.test.ts` | Character registry — Lincoln stats, move override shapes |
| `packages/engine/src/ai/botAI.test.ts` | Bot decision logic for Easy/Medium/Hard at various game states |
| `packages/engine/src/ai/sensors.test.ts` | `readSensors` output for edge proximity, percent thresholds, opponent position |
| `apps/server/src/GameEngine.ts` (multiple test files) | Full integration ticks: combat, grabs, counters, shields, ledge, wavedash, wall-tech, L-cancel, AI edge-guard, AI platform jump, character-specific behavior |
| `apps/server/src/MatchSession.*.test.ts` | Pause/resume, hit-event forwarding from match session |
| `apps/server/src/RoomManager.test.ts` | Room creation, player join/leave, lobby-to-match state machine |
| `apps/server/src/createApp.test.ts` | Socket.io event wiring, room code flow, game start handshake |
| `apps/server/src/createApp.production.test.ts` | Static file serving in `NODE_ENV=production` |
| `apps/server/src/PlayerState.msgpack.test.ts` | Round-trip msgpack encode/decode for `PlayerState` including `Set` fields |
| `apps/client/src/network/GameClient.character-select.test.ts` | Character select socket flow |
| `apps/client/src/local/LocalMatch.test.ts` | Local-play (offline) match loop with CPU opponents |
| `apps/client/src/renderer/FighterRenderer.test.ts` | Polygon fighter rendering, joint pose interpolation, slot patterns |
| `apps/client/src/ui/UIManager.test.ts` | UI phase transitions: lobby, countdown, in-match HUD, winner screen |
| `apps/client/src/ui/MenuNavigator.test.ts` | Keyboard/gamepad menu navigation |
| `apps/client/src/ui/ControlsScreen.test.ts` | Controls screen display and rebind flow |
| `apps/client/src/ui/LocalPlaySetupScreen.test.ts` | Local-play seat config, CPU difficulty selection |
| `apps/client/src/ui/StageSelectScreen.test.ts` | Stage selection screen |
| `apps/client/src/main.test.ts` | Top-level app bootstrap |
| `apps/client/src/main.local-play-flow.test.ts` | Full local-play flow integration |
| `apps/client/src/main.network-character-select-flow.test.ts` | Full network character-select flow integration |

---

## Versioning Workflow

`packages/shared/src/version.ts` is the single source of truth for the project version. Nothing else owns the version number. All `package.json` files across the monorepo are downstream — they get updated by a script, not by hand.

### The 3-step process

**Step 1 — Edit `version.ts`**

Open `packages/shared/src/version.ts` and update the version string:

```ts
// packages/shared/src/version.ts
export const VERSION = "0.1.2";
```

Bump according to semantic versioning: patch for bug fixes, minor for new features, major for breaking changes.

**Step 2 — Run the sync script**

```bash
node scripts/sync-version.js
```

This reads `VERSION` from `version.ts` and writes it into every `package.json` in the monorepo. Expected output:

```
Synced version 0.1.2 to:
  packages/shared/package.json
  packages/engine/package.json
  packages/gamepad-input/package.json
  apps/server/package.json
  apps/client/package.json
```

Commit both `version.ts` and the updated `package.json` files together in a single commit:

```bash
git add packages/shared/src/version.ts packages/*/package.json apps/*/package.json
git commit -m "chore: bump version to 0.1.2"
```

**Step 3 — Tag the release**

```bash
bash scripts/tag-release.sh
```

The script reads the current version from `version.ts`, creates an annotated git tag (`v0.1.2`), and pushes the tag to origin. Expected output:

```
Tagging v0.1.2...
To github.com:you/smash-bros-clone.git
 * [new tag]         v0.1.2 -> v0.1.2
Done.
```

If the tag already exists (you ran the script twice by accident), the script exits with an error rather than overwriting. Fix by deleting the tag locally and on origin, then re-running:

```bash
git tag -d v0.1.2
git push origin :refs/tags/v0.1.2
bash scripts/tag-release.sh
```

### GitHub release (optional)

After the tag is pushed, create a GitHub release to attach release notes and make the version visible on the repo's Releases page:

1. Go to your repo on GitHub → **Releases** → **Draft a new release**
2. Select the tag you just pushed (`v0.1.2`)
3. Set the title to `v0.1.2`
4. Write release notes (what changed, what's fixed)
5. Click **Publish release**

Alternatively, use the GitHub CLI:

```bash
gh release create v0.1.2 --title "v0.1.2" --notes "Describe what changed here"
```

This step is optional but recommended for any version you deploy to production.

---

## Pre-Push Checklist

Run through this before pushing to `main` or opening a PR against it.

```
[ ] pnpm test passes (zero failures)
[ ] pnpm build passes (no TypeScript errors)
[ ] packages/engine has no Date.now() or Math.random() (see Critical Invariants)
[ ] Version bumped in packages/shared/src/version.ts if this is a stable release
[ ] scripts/sync-version.js run and all package.json files committed alongside version.ts
[ ] Git tag created with scripts/tag-release.sh if this is a release commit
[ ] No console.log left in hot-path code (GameEngine.ts, physics/index.ts, hitbox/index.ts)
[ ] No JSON.stringify on game state (binary msgpack only on hot path)
```

### Version verification

To confirm the version is consistent across the monorepo before pushing:

```bash
node -e "
const { VERSION } = require('./packages/shared/src/version.ts');
const pkgs = [
  'packages/shared/package.json',
  'packages/engine/package.json',
  'packages/gamepad-input/package.json',
  'apps/server/package.json',
  'apps/client/package.json',
].map(p => require('./' + p).version);
const allMatch = pkgs.every(v => v === VERSION);
console.log(allMatch ? 'OK — all versions match ' + VERSION : 'MISMATCH: ' + pkgs.join(', '));
"
```

If any package is out of sync, re-run `node scripts/sync-version.js` and commit the changes before pushing.
