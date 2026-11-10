# Contributing to Everybody Throws Hands

Scope: fighter code in apps/, packages/, raw-assets/ and supporting scripts/docs. bonney/ is a separate project and must be excluded. Never inspect .env or .env.global files.

## Setup and verification

Use [Local development](docs/guides/DEVELOPMENT.md) for installation, the initial build, and environment overrides. Follow the [testing guide](docs/guides/TESTING.md) for the regression gate. Report skips and browser failures explicitly. Use the [deployment guide](docs/guides/DEPLOYMENT.md) for hosted checks.

## Boundaries
shared owns types/constants, engine owns runtime-independent primitives and seeded AI, server owns full match orchestration and transport, client owns presentation/input/prediction. Local play imports the browser-safe server/engine entry.
Combat is authoritative. Prediction approximates movement at 60 Hz; remote interpolation uses receipt time rather than subtracting browser/server clock origins.

## Content
Fighters need a shared ID and stats, roster and renderer integration, any move overrides, and tests. Use the [full-body art guide](docs/assets/FULL-BODY-FIGHTER-ART.md) for match artwork and the [atlas guide](docs/assets/FIGHTER-PRODUCTION-ATLAS.md#current-packaging-workflow) for packaging. Use the [fallback parts guide](docs/assets/REPLACING-FIGHTER-ART.md) for the articulated six-part contract.
StageConfig supplies world names, backgrounds, and music. Update packages/shared/src/constants/stageLayouts.ts for collision geometry and use the shared stage ID in selection and match initialization.
MoveData fields live in packages/shared/src/types/MoveData.ts; keep FSM duration tables consistent when changing frame data.

## Review and documentation
Update the affected current documentation in the same change. Use the [maintenance checklist](docs/plans/DOCUMENTATION-REFRESH.md#maintenance-rule-for-future-changes) to choose the right guide. Update the README for changes to onboarding, architecture, or its quick start. When a priority, milestone, signoff, or blocker changes, update [active work](docs/plans/ACTIVE-WORK.md) and link the dated evidence.

In the [PR checklist](.github/pull_request_template.md), list the docs changed or explain why no update was needed. Verify the guidance against the implementation, run changed instructions where practical, and run `pnpm docs:check` for documentation edits. Record validation limits and update incoming links when moving or renaming docs.
Do not commit generated output or unrelated changes.
Version source: packages/shared/src/version.ts. Run scripts/sync-version.js for an intentional release; tagging/publishing is a separate action.
