# Everybody Throws Hands

A multiplayer browser-based platform fighter built as a production-quality proof of concept. Everybody Throws Hands features percent-based damage, blast-zone knockouts, stocks system, and a full move set. Black and white polygon art. 2–4 players per session over a shared link.

---

## Quick Start

```bash
pnpm install
just play
```

That's it. Your browser opens automatically. Share the room URL with others to play.

### What's next?

The engine and netcode are production-quality, but the game is still a prototype. See [**ROADMAP.md**](./ROADMAP.md) for a detailed gap analysis covering visuals, audio, input, engine wiring, backend hardening, content, and meta-game features — plus a recommended first milestone to bridge the gap from prototype to polished game.

---

## Requirements

| Tool | Version | Install |
|---|---|---|
| Node.js | 20+ | https://nodejs.org |
| pnpm | 9+ | `npm install -g pnpm` |
| just | any | `brew install just` |

---

## Playing the Game

### Start a game

```bash
just play
```

This starts both the game server (port 3001) and the client (port 5173), opens your browser, and shuts everything down cleanly when you close the browser tab or press `Ctrl+C`.

### Multiplayer

1. Run `just play` — your browser opens to the lobby
2. Click **Create Room** — a 6-character room code appears and the URL updates (e.g. `?room=K8826T`)
3. Share that URL with 1–3 friends
4. Everyone clicks **Ready**
5. Countdown: 3… 2… 1… **GO!**

### Controls

| Action | Keys |
|---|---|
| Move left / right | `←` `→` or `A` `D` |
| Jump | `↑` or `W` or `X` — tap for short hop, hold for full hop |
| Fast fall | `↓` (while airborne) |
| Attack | `Z` or `U` |
| Special | `S` or `I` |
| Shield | `Shift` or `O` |
| Grab | `C` or `P` |
| Dodge / Roll | `Shift` + direction (while shielding) |

**Xbox/Standard-mapping controllers** are auto-detected. Open the in-game **Controls** screen (from the local-play lobby) to view device assignments and rebind keys/buttons.

### Win condition

Last player with stocks remaining wins. Default: **3 stocks per player**, no time limit.

### Move reference

All 22 moves use the same fighter. Context determines which move fires:

| Input | Grounded | Airborne |
|---|---|---|
| Attack (neutral) | Jab — fast 3-frame startup combo starter | Neutral Air — full-body hitbox |
| Forward + Attack | Forward Tilt — mid-range poke | Forward Air — strong horizontal |
| Up + Attack | Up Tilt — anti-air launcher | Up Air — juggle tool |
| Down + Attack | Down Tilt — low profile | Down Air — spike (high risk) |
| Forward + Attack (hold) | Forward Smash ⚡ — KO move, chargeable | — |
| Up + Attack (hold) | Up Smash ⚡ — multi-hit KO | — |
| Down + Attack (hold) | Down Smash ⚡ — front + back hitbox | — |
| Special (neutral) | Neutral Special — burst hitbox | Neutral Special |
| Forward + Special | Side Special — dash hit | Side Special |
| Up + Special | **Recovery** — launches upward, hitbox on first frames | Recovery |
| Down + Special | Counter — brief invincibility window | Counter |
| Grab | Grab | — |
| Attack (while grabbing) | Pummel | — |
| Direction (while grabbing) | Directional throw (F/B/U/D) | — |

---

## Architecture

```
smash-clone/
├── apps/
│   ├── client/          # Vite + TypeScript + PixiJS v8
│   └── server/          # Node.js + TypeScript + socket.io
├── packages/
│   ├── engine/          # Deterministic game simulation (pure TS, no I/O)
│   └── shared/          # Types, constants, pure math (no deps)
├── Dockerfile           # Root — for Railway/Render/Fly.io
├── render.yaml          # Render.com deployment config
└── fly.toml             # Fly.io deployment config
```

### How it works

```
CLIENT (browser)                    SERVER (Node.js)
────────────────                    ────────────────
Keyboard input captured             60 Hz fixed game loop
  │                                   │
  ├─ Local movement predicted          Receives binary inputs
  │  immediately (no delay)            │
  │                                   Ticks physics + FSM + hitboxes
  └─ Input → binary msgpack ────────→  │
                                      20 Hz binary state broadcast
CLIENT receives snapshot ◄──────────  (msgpack, NOT JSON)
  │
  ├─ Local player: reconcile prediction
  └─ Remote players: interpolate between snapshots
        │
        └─ PixiJS v8 renders frame
```

### Key design decisions

| Decision | Choice | Why |
|---|---|---|
| Transport | WebSocket only (socket.io, no polling) | Lowest latency; no HTTP upgrade overhead |
| Serialization | msgpack binary | ~3× smaller than JSON; no parse overhead on hot path |
| Game loop | `setImmediate` + `performance.now()` accumulator | Accurate 60 Hz; avoids `setInterval` drift |
| Netcode | Hybrid: local movement prediction + server-auth combat | Movement feels instant; hits/damage never cheat |
| Renderer | PixiJS v8 (WebGL/WebGPU) | GPU-accelerated; scales to particles/shaders in future |
| Physics | Hand-rolled — no engine | Full control over hitboxes, hitstun, knockback |
| FSM | Explicit 25-state machine | No spaghetti `if/else`; transitions are auditable |

---

## Packages

### `packages/shared`

Zero-dependency types, constants, and pure math. Imported by all other packages.

- **Types**: `PlayerState`, `GameState`, `StateSnapshot`, `InputEvent`, `MoveData`, `HitboxData`
- **Enums**: `PlayerStateEnum` (25-state enum), `MoveId` (22 moves)
- **Constants**: `PHYSICS` (gravity, speeds, jump velocities), `STAGE` (platforms, blast zones), `MATCH_CONFIG` (stocks, respawn timers)
- **Math**: `lerp`, `clamp`, `circleOverlap`, `knockbackAngleToVelocity`, vector utils

### `packages/engine`

Deterministic game simulation. **No Node.js, no browser APIs, no I/O of any kind.** Fully unit-tested with Vitest. Imported by the server; also imported by the client for local movement prediction.

- **Physics** (`src/physics/`): gravity accumulation, terminal velocity, ground/air movement, short hop vs full hop, double jump, fast fall, platform collision, blast zone detection
- **FSM** (`src/fsm/`): 25-state finite state machine per fighter — `Idle`, `Walk`, `Dash`, `Run`, `Jumpsquat`, `Airborne`, `DoubleJump`, `Attack`, `AirAttack`, `Shield`, `Roll`, `SpotDodge`, `AirDodge`, `Hitstun`, `TechNeutral`, `TechRoll`, `HardLanding`, `LandingLag`, `Grab`, `GrabHolding`, `LedgeHang`, `LedgeClimb`, `LedgeAttack`, `LedgeRoll`, `LedgeJump`. Hitlag freezes `stateFrame`; hitstun holds exactly N frames.
- **Hitbox** (`src/hitbox/`): circle overlap collision, Smash Bros knockback formula, hit trading by priority
- **Moves** (`src/moves/`): 22 declarative `MoveData` const objects with startup/active/recovery frame data, per-frame hitbox definitions, knockback angles

```bash
pnpm test              # run all 131 engine unit tests
```

### `apps/server`

Authoritative game server. Owns all game state; clients cannot cheat.

- **Socket.io** on port 3001, **WebSocket-only** (no HTTP polling)
- **RoomManager**: creates rooms (6-char code), slots up to 4 players, manages `LOBBY → COUNTDOWN → MATCH → RESULT` state machine
- **MatchSession**: runs the 60 Hz fixed tick loop using `setImmediate` + `performance.now()` accumulator. Broadcasts compressed binary snapshots at **20 Hz**
- **GameEngine**: wraps engine packages — per-tick: physics → FSM → hitbox detection → KO check → respawn timers → win condition
- **Binary protocol**: all game state uses `@msgpack/msgpack` `encode`/`decode` — never `JSON.stringify`
- In production (`NODE_ENV=production`): serves the built client `dist/` as static files (single deployable)

### `apps/client`

Browser game client built with Vite + TypeScript.

- **PixiJS v8**: `Application` with `BackgroundLayer` (static stage, drawn once) / `GameLayer` (fighters, redrawn each frame) / `UILayer`
- **FighterRenderer**: polygon fighter — pentagon body, circle head, 4 limbs. Joint angles interpolated between keyframe poses per FSM state. 4 B&W slot patterns (solid, stripes, dots, crosshatch)
- **InputManager**: `keydown`/`keyup` → `InputBitmask` (uint16 bitfield) → `InputEvent` → binary msgpack → server
- **LocalPredictor**: applies movement physics locally on input (no attack prediction). On server snapshot: prune confirmed inputs, replay remaining from confirmed state
- **InterpolationBuffer**: stores last 3 snapshots; lerps remote player positions between snapshots for smooth 60fps rendering from 20Hz updates
- **GameClient**: orchestrates socket.io connection, prediction, interpolation, and render state assembly
- **UIManager**: HTML overlay for all UI phases — lobby, room code display, countdown, in-match HUD (damage %, stock squares), winner screen

---

## Development

### Install dependencies

```bash
pnpm install
```

### Run locally (recommended)

```bash
just play          # starts server + client, opens browser, cleans up on exit
```

### Run manually

```bash
# Terminal 1
pnpm -F @smash/server dev     # server on :3001 with hot reload

# Terminal 2
pnpm -F @smash/client dev     # client on :5173 with HMR
```

### Build

```bash
pnpm build         # builds all 4 packages in dependency order
```

### Test

```bash
pnpm test          # runs 131 Vitest unit tests in packages/engine
just test          # same
```

### All justfile commands

```bash
just               # list all available commands
just play          # start game + open browser + auto-cleanup on exit
just dev           # start server + client without opening browser
just build         # build all packages
just test          # run engine unit tests
just clean         # remove all dist/ and node_modules/
just stop          # kill any running server/client processes
just logs          # tail live server logs
```

---

## Deployment

The server serves the built client in production, so **one service handles everything**.

All three deployment paths below have been verified with the current `Dockerfile`, `render.yaml`, and `fly.toml`. The server requires **WebSocket support** (HTTP polling is disabled — see `transports: ["websocket"]` in `apps/server/src/index.ts`), so static-file-only hosts will not work.

### Render.com (recommended — free tier)

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New Web Service → connect your repo
3. Render auto-detects `render.yaml` — no manual config needed
4. Deploy

### Fly.io

```bash
fly launch         # first time — follow prompts
fly deploy         # subsequent deploys
```

### Railway / any Node host

```bash
pnpm build
NODE_ENV=production node apps/server/dist/index.js
```

Set environment variables:
- `PORT` — server port (default: `3001`)
- `CLIENT_ORIGIN` — allowed CORS origin (default: `http://localhost:5173`)
- `NODE_ENV=production` — enables static file serving of the client

### Docker

```bash
docker build -t smash-clone .
docker run -p 3001:3001 -e NODE_ENV=production smash-clone
```

---

## Game mechanics reference

### Damage system

Damage accumulates as a percentage (not HP). Higher percentage = more knockback on the next hit. There is no maximum — a fighter at 300% will be launched off-screen by a weak jab.

### Knockback formula

```
magnitude = ((percent/10 + (percent × baseDmg)/20) × (200/(weight+100)) × 1.4 + 18) × (growth/100) + baseKnockback
```

Derived from Super Smash Bros. Heavier fighters take less knockback.

### Stocks

Each player starts with 3 stocks (lives). Crossing any blast zone costs one stock. Last player with stocks remaining wins.

### Blast zones

| Edge | Position |
|---|---|
| Left | x = −300 |
| Right | x = 1580 |
| Top | y = −200 |
| Bottom | y = 820 |

### Stage

One stage. Main solid platform (full width, y=500) + two soft pass-through platforms (y=350, left and right). Fighters can land on soft platforms from above and drop through by holding `↓`.

### Respawn

After a KO: 2-second delay, then fighter respawns above center stage with 3 seconds of invincibility (indicated by blinking).

### Hitstun and hitlag

On hit:
- **Hitlag**: both attacker and defender freeze for 3–8 frames (gives the hit "impact weight")
- **Hitstun**: defender is locked out of actions for N frames (enables combos at low percent)

---

## License

MIT
