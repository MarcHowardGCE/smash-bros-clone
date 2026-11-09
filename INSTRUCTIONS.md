# Contributing to Everybody Throws Hands

Scope: fighter code in apps/, packages/, raw-assets/ and supporting scripts/docs. bonney/ is a separate project and must be excluded. Never inspect .env or .env.global files.

## Setup and verification

Use [Local development](docs/guides/DEVELOPMENT.md) for installation, the initial build, and environment overrides. Follow the [testing guide](docs/guides/TESTING.md) for the regression gate. Report skips and browser failures explicitly. Use the [deployment guide](docs/guides/DEPLOYMENT.md) for hosted checks.

## Boundaries
shared owns types/constants, engine owns runtime-independent primitives and seeded AI, server owns full match orchestration and transport, client owns presentation/input/prediction. Local play imports the browser-safe server/engine entry.
Combat is authoritative. Prediction approximates movement at 60 Hz; remote interpolation uses receipt time rather than subtracting browser/server clock origins.

## Content
Fighters need shared IDs/stats, optional move overrides, renderer/asset registry entries and tests. Follow docs/assets/REPLACING-FIGHTER-ART.md for the six-part contract.
StageConfig supplies world names, backgrounds, and music. Update packages/shared/src/constants/stageLayouts.ts for collision geometry and use the shared stage ID in selection and match initialization.
MoveData fields live in packages/shared/src/types/MoveData.ts; keep FSM duration tables consistent when changing frame data.

## Review and documentation
Describe resulting behavior, validation, and limits. Update the README when onboarding, architecture, commands, or deployment changes. Put progress and signoff in the relevant document under docs/ and update docs/plans/ACTIVE-WORK.md when the next action changes. Preserve dated evidence.
Do not commit generated output or unrelated changes.
Version source: packages/shared/src/version.ts. Run scripts/sync-version.js for an intentional release; tagging/publishing is a separate action.
