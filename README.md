# Everybody Throws Hands

Everybody Throws Hands is a browser platform fighter with an illustrated five-fighter roster and six surreal arenas. Play local matches with human or CPU seats, create an online room for up to four players, or practice in the Training Dojo. Matches use percent damage, stocks, and blast-zone KOs. Super Smash Bros. Ultimate is the reference for combat and controls. The [active work index](docs/plans/ACTIVE-WORK.md) tracks the remaining parity and signoff work.

## Run locally

Install **Node.js 24** and **pnpm 11.20.0**. The workspace has been used with Node.js 24.13.0. Run these commands from the repository root.

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm dev
```

Open [localhost:5173](http://localhost:5173). The game server listens on port **3001** by default. Build once after installation so the shared workspace packages have their compiled exports. These commands work in PowerShell and Unix shells. The optional `just` recipes require a Unix-compatible shell.

See the [local development guide](docs/guides/DEVELOPMENT.md) for an empty environment directory, alternate ports, and asset troubleshooting.

## Play

- **Local Play** lets you set the seats and CPU difficulty, then choose fighters and a world.
- **Online Play** uses room codes or invite links. Ready up, confirm the lineup, and choose a world. The countdown begins after the clients prepare the selected artwork.
- **Training Dojo** offers an infinite-stock sandbox, guided lessons, and a timing lab with recording, frame stepping, and collision overlays. See the [Dojo guide](docs/TRAINING-DOJO.md).

Player 1 uses **A/D** or **←/→** to move, **W/↑** to aim up, **↓** to aim down, **X/Space** to jump, **Z** to attack, **S** for special, **Shift** to shield, and **C** to grab. The Controls menu shows bindings and supports Xbox-layout, Nintendo Switch Pro, and DualSense profiles for standard browser gamepads.

## Architecture

| Workspace | Responsibility |
| --- | --- |
| [`apps/client`](apps/client/) | Vite and PixiJS client, menus, input, audio, rendering, prediction, and local match loop |
| [`apps/server`](apps/server/) | Express and Socket.IO service, room lifecycle, authoritative match loop, and `GameEngine` |
| [`packages/engine`](packages/engine/) | Runtime-independent fighter state machines, physics, moves, combat, and CPU logic |
| [`packages/shared`](packages/shared/) | State and input types, fighter stats, arena geometry, and shared constants |
| [`packages/gamepad-input`](packages/gamepad-input/) | Browser gamepad sampling, mappings, and preference persistence |

Local matches and Dojo reuse the browser-safe `@smash/server/engine` entry. Online, the server runs the simulation at **60 Hz** and sends MessagePack snapshots at a target **20 Hz**. The browser predicts local movement and interpolates remote snapshots. Combat and match results come from the server.

Full-body source sheets and manifests live in the [original roster pack](apps/client/public/fighter-art-pilot-v1/) and the [newcomer pack](apps/client/public/fighter-art-newcomers-v1/). The game uses packed full-body artwork by default. [`raw-assets/`](raw-assets/) supplies the articulated fallback parts. See the [full-body authoring guide](docs/assets/FULL-BODY-FIGHTER-ART.md) and [fallback parts guide](docs/assets/REPLACING-FIGHTER-ART.md). The `bonney/` directory is a separate project outside this workspace.

## Test

Run `pnpm test` and `pnpm typecheck` after the initial build. Install Chromium with `pnpm exec playwright install chromium`, then run the [portable browser smoke test](docs/guides/TESTING.md#portable-browser-smoke-test). See the [testing guide](docs/guides/TESTING.md) for the full suite, recorded baselines, and signoff.

## Build and deploy

Run `pnpm build` to build the workspace. The production Express service serves the client and WebSocket connection together. The [deployment guide](docs/guides/DEPLOYMENT.md) covers local production, Docker, Fly.io, Render, and a two-client hosted smoke test.

## Project documentation

- [Documentation index](docs/README.md)
- [Active work and signoff](docs/plans/ACTIVE-WORK.md)
- [Contributor instructions](INSTRUCTIONS.md)
- [MIT license](LICENSE)
