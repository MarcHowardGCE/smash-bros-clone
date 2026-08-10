# INSTRUCTIONS.md — Contributing to Everybody Throws Hands

Welcome. This guide covers everything you need to go from zero to a merged pull request. It assumes you've already read [README.md](./README.md) for the high-level overview. Anything architectural lives in [AGENTS.md](./AGENTS.md) — this file focuses on the human side: setup, conventions, and the "why" behind the rules.

---

## Prerequisites & Setup

**Required tooling:**

- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`)
- [just](https://github.com/casey/just) — the command runner (`cargo install just` or `brew install just`)

**First-time setup:**

```bash
# Clone and install all workspace dependencies
git clone <repo-url>
cd smash-bros-clone
pnpm install
```

Copy the environment template before starting the server:

```bash
cp .env.example .env
```

The `.env.example` file documents every variable. Most have sensible defaults for local dev — you typically only need to change `PORT` if something conflicts.

**Start the game:**

```bash
just play     # starts server + client, opens browser, cleans up on exit
```

**Run tests before any commit:**

```bash
pnpm test
```

All other `just` commands are listed in the [justfile](./justfile). Run `just` with no arguments to see the full menu.

---

## Code Architecture in 5 Minutes

The repo is a monorepo with five packages arranged in a strict dependency chain:

```
shared  →  engine  →  server
                  →  client
gamepad-input     →  client
```

**`packages/shared`** is the root. It holds every shared type (`PlayerState`, `GameState`, `InputEvent`), constants (`PHYSICS`, `STAGE`), and math utilities. Nothing imports into it.

**`packages/engine`** is the simulation. It's pure TypeScript with zero Node.js or browser APIs. That purity is what makes the game work: the client runs the exact same engine code as the server for movement prediction, so both sides always agree on physics. If `packages/engine` ever grows an `import fs` or a `Date.now()` call, client/server divergence follows immediately and you get rubber-banding.

**`apps/server`** is the authority. It runs the engine at 60 Hz, resolves all combat, and broadcasts compressed snapshots at 20 Hz via msgpack over socket.io. The server's word is final. The client never determines who got hit or who lost a stock.

**`apps/client`** is the view layer. It predicts only movement (never combat) to hide network latency, interpolates remote players between server snapshots for visual smoothness, and renders everything with PixiJS v8.

**`packages/gamepad-input`** handles controller polling and button-mapping persistence. It's separate because it's browser-only and the engine must stay environment-agnostic.

For a deeper dive, read [AGENTS.md](./AGENTS.md), which documents every critical invariant, the netcode mental model, and the full test map.

---

## Branch & PR Conventions

**Branch names:**

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feat/<slug>` | `feat/add-zelda-fighter` |
| Bug fix | `fix/<slug>` | `fix/ledge-grab-snap` |
| Docs | `docs/<slug>` | `docs/sprite-guide-update` |
| Refactor | `refactor/<slug>` | `refactor/fsm-state-cleanup` |

**Pull requests should:**

1. Describe *what* changed and *why* — not just what the diff shows.
2. Link to the relevant [ROADMAP.md](./ROADMAP.md) item if one exists.
3. Include test output (paste the `pnpm test` summary or a screenshot).
4. Stay focused. One logical change per PR — a fighter addition and a stage addition should be separate PRs.

Keep commit messages short and use conventional format: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.

---

## Test Requirements

The test suite is the regression gate. **Every PR must leave `pnpm test` green.**

Current baselines:
- Engine unit tests: 131+
- Server integration tests: 94+

**When to write tests:**

- New engine logic (physics tweaks, FSM states, hitbox changes) needs unit tests in `packages/engine/src/`.
- New server logic (game engine integration, room management, socket events) needs integration tests under `apps/server/src/`.
- Client-only changes (renderer, UI, menus) have no mandatory test requirement. Playwright end-to-end tests exist and can be run manually with `pnpm exec playwright test`, but they're not part of the CI gate.

If you're fixing a bug, write a test that would have caught it before writing the fix. This prevents regressions and documents the exact scenario that was broken.

---

## Adding a Fighter — Step by Step

Adding a fighter touches four packages. Work through them in order.

**1. Define stats in `packages/shared`.**

Open `packages/shared/src/constants/characters.ts`. Copy `ALL_ROUNDER_STATS` as a baseline and adjust the numbers for your fighter's feel. Heavier weight means more knockback resistance but slower air speed. Then register the new ID in `CHARACTER_IDS` and `CHARACTER_REGISTRY`.

Add the `CharacterId` literal to `packages/shared/src/types/Character.ts` so the union type covers your new fighter everywhere.

**2. Override moves in `packages/engine` (optional but likely).**

Base moves are defined in `packages/engine/src/moves/`. If your fighter has a unique special or a signature attack with different frame data, create a file analogous to `lincoln.ts`. Then add a routing case in `getMoveDataForCharacter` inside `packages/engine/src/moves/index.ts`.

If your fighter uses all default moves, skip this step — they inherit the base move map automatically.

**3. Add visuals in `apps/client`.**

The renderer is part-based. Look at `lincolnAccessories.ts` and `lincolnAnimations.ts` for the shape of what's expected, then create matching files for your fighter. Wire them into `FighterRenderer.ts` by adding a branch for your new `CharacterId`.

For pixel-art sprites instead of polygon fallbacks, see [SPRITE-GENERATION-GUIDE.md](./SPRITE-GENERATION-GUIDE.md) for complete specs, AI generation prompts, and sheet layouts.

**4. Write tests.**

At minimum: a test in `packages/engine/src/characters/characters.test.ts` covering your fighter's registry entry and stats shape. If you added custom moves, add frame-data validity tests in `packages/engine/src/moves/` alongside the move file.

**5. Run `pnpm test` and confirm zero failures.**

---

## Adding a Stage — Step by Step

Stages are mostly client-side geometry with a server-side blast zone configuration.

**1. Define geometry in `apps/client/src/stages/stageConfig.ts`.**

Add a `StageConfig` entry with `id`, `name`, main platform bounds, and any soft platforms your stage has. Soft platforms are passable from below.

**2. Check blast zones.**

The defaults live in `packages/shared/src/constants/stage.ts` under `STAGE.blastZone`. If your stage is significantly wider or taller than the default layout, you'll want to extend `StageConfig` to carry per-stage blast zone values and thread them through `MatchSession` into `GameEngine`. For a standard-sized stage, the defaults work fine.

**3. Add background rendering.**

The `BackgroundLayer` renderer in `apps/client/src/renderer/` has a branch per stage ID. Add yours there — even a simple solid color works as a placeholder while art is pending.

**4. Test platform collision.**

Write a targeted Vitest test using `checkPlatformCollision` from `packages/engine/src/physics/index.ts`. Verify that a player standing on each platform registers as grounded, and that soft platforms let a player fall through from below.

---

## Adding a Move — Step by Step

**1. Add a `MoveId` enum value** in `packages/shared/src/types/MoveData.ts`.

**2. Write the `MoveData` object** in the correct file under `packages/engine/src/moves/`:
- Ground normals: `ground.ts`
- Aerials: `aerial.ts`
- Specials: `special.ts`
- Grabs and throws: `grab.ts`
- Ledge attacks: `ledge.ts`

Every move needs `startupFrames`, `activeFrames`, `recoveryFrames`, per-frame `hitboxes` (each with `offsetX`, `offsetY`, `radius`, `damage`, `knockbackAngle`, `knockbackGrowth`, `baseKnockback`), and `flags`.

**3. Wire the input** in the FSM. Ground attacks are triggered in `AttackState.ts`, aerials in `AirAttackState.ts`, specials via `INPUT_BITS.special` checks in the relevant state.

**4. Assign the move** by adding an entry to `getMoveDataForCharacter` in `packages/engine/src/moves/index.ts`, or to the shared base map if it's available to all fighters.

**5. Test frame data.** Verify startup/active/recovery counts and hitbox field completeness in `packages/engine/src/moves/moves.test.ts` or a character-specific file.

---

## Common Mistakes

**Putting game logic in the client.**
Hit detection, knockback, stock loss — none of that belongs in `apps/client`. The client predicts movement only. Combat results come from the server snapshot. If you catch yourself writing damage logic in `LocalPredictor.ts` or `GameClient.ts`, stop and move it to the server.

**Using `JSON.stringify` on game state.**
The binary protocol uses `@msgpack/msgpack`. JSON is never used on hot-path data. Switching to JSON breaks bandwidth efficiency and silently corrupts `Set` fields (which require a custom extension codec, type ID `1`, registered in both `MatchSession.ts` and `GameClient.ts`).

**Mutating FSM state directly.**
Physics functions in `packages/engine/src/physics/index.ts` return a new `PlayerState` — they never mutate in place. Always assign the return value. Ignoring it silently drops the update.

**Skipping `pnpm test` before opening a PR.**
The test suite catches regressions you won't notice manually. Run it. It takes under 30 seconds.

**Adding `Date.now()` or `Math.random()` to `packages/engine`.**
The engine must be deterministic. Both functions break that guarantee. Use a seeded RNG passed in from outside if you need randomness, and never call wall-clock time inside engine code.

**Returning `null` for a missing player input.**
When a player's input doesn't arrive in time, pass `EMPTY_INPUT` to `GameEngine.tick()`. Never pass `null` or `undefined` — the engine doesn't guard against it.

---

## File Navigation for New Developers

| I want to understand... | Start with... |
|-------------------------|---------------|
| Game physics (gravity, movement, jumps, collision) | `packages/engine/src/physics/index.ts` |
| Player state machine and FSM transitions | `packages/engine/src/fsm/FSMController.ts` |
| All shared types and constants | `packages/shared/src/index.ts` |
| Hit detection and knockback formula | `packages/engine/src/hitbox/index.ts` |
| Authoritative server game loop | `apps/server/src/GameEngine.ts` |
| How the server tick loop and broadcasting works | `apps/server/src/MatchSession.ts` |
| Client-side prediction and reconciliation | `apps/client/src/network/LocalPredictor.ts` |
| Top-level network facade (snapshots, input encoding) | `apps/client/src/network/GameClient.ts` |
| Fighter rendering and part-based draw system | `apps/client/src/renderer/FighterRenderer.ts` |
| Move frame data for all base attacks | `packages/engine/src/moves/` |
| Character stats and registry | `packages/shared/src/constants/characters.ts` |
| Room lifecycle and lobby state machine | `apps/server/src/RoomManager.ts` |
| Stage geometry and platform bounds | `apps/client/src/stages/stageConfig.ts` |

---

*For the full architectural reference, invariants, and test map, see [AGENTS.md](./AGENTS.md).*
