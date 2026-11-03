# Contributing to Everybody Throws Hands

Scope: fighter code in apps/, packages/, raw-assets/ and supporting scripts/docs. bonney/ is a separate project and must be excluded. Never inspect .env or .env.global files.

## Setup
Locally verified toolchain: Node.js 24.13.0 and pnpm 11.20.0.

    pnpm install --frozen-lockfile
    pnpm build
    pnpm dev

Browser port: 5173. Server port: 3001. Native Windows users can use pnpm; just recipes require a Unix-compatible shell.

## Regression gate
Build before testing a clean checkout because workspace packages export compiled modules.

    pnpm build
    pnpm test
    pnpm typecheck
    pnpm test:e2e

test includes all five fighter suites. E2E includes all browser specs; test:e2e:visual selects asset/visual scenarios. lint aliases TypeScript checking, not a style linter.
Set SMASH_ENV_DIR to a dedicated empty folder for verification that must not load environment files. Build-backed tests inherit it. SKIP_ASSETPACK=1 uses committed fighter atlases.
Report skips and browser failures explicitly; unit success alone does not validate multiplayer feel or deployment.

## Boundaries
shared owns types/constants, engine owns runtime-independent primitives and seeded AI, server owns full match orchestration and transport, client owns presentation/input/prediction. Local play imports the browser-safe server/engine entry.
Combat is authoritative. Prediction approximates movement at 60 Hz; remote interpolation uses receipt time rather than subtracting browser/server clock origins.

## Content
Fighters need shared IDs/stats, optional move overrides, renderer/asset registry entries and tests. Follow docs/assets/REPLACING-FIGHTER-ART.md for the six-part contract.
StageConfig describes visual/music themes only. Distinct arenas require shared geometry and a selected-stage protocol.
MoveData fields live in packages/shared/src/types/MoveData.ts; keep FSM duration tables consistent when changing frame data.

## Review and documentation
Describe resulting behavior, validation and limits. Update README, ROADMAP and relevant current design/status documents together with changes; preserve dated evidence. docs/REFINEMENT.md records current decisions.
Do not commit generated output or unrelated changes.
Version source: packages/shared/src/version.ts. Run scripts/sync-version.js for an intentional release; tagging/publishing is a separate action.
