# Everybody Throws Hands documentation

Start with the [project README](../README.md) to understand the game and run it locally. [Contributor instructions](../INSTRUCTIONS.md) cover verification and repository conventions.

## Operating guides

- [Local development](guides/DEVELOPMENT.md) covers setup, an empty environment directory, ports, and asset troubleshooting.
- [Testing and verification](guides/TESTING.md) covers workspace checks, browser tests, and recording signoff.
- [Deployment](guides/DEPLOYMENT.md) covers production, Docker, Fly.io, Render, and hosted verification.

## Play and practice

- [Training Dojo](TRAINING-DOJO.md) explains guided lessons, practice options, and KO presentation checks.
- [Training lab](TRAINING-LAB.md) covers frame stepping, collision overlays, and partner recordings.
- [Controller profiles and verification](REFINEMENT.md#three-controller-support-plan) describes the mappings and signoff procedure.

## Architecture and design

- [Architecture overview](../README.md#architecture) explains the workspace and simulation boundaries.
- [Netcode hardening design](sprint/NETCODE-HARDENING-DESIGN.md) and [disconnect design](sprint/plans/netcode-disconnect-layers.md) preserve design rationale. Check the [active work index](plans/ACTIVE-WORK.md) for current release gates.
- [Production configuration](guides/DEPLOYMENT.md#configuration) explains the server and client settings.
- [World presentation](../apps/client/src/stages/stageConfig.ts) owns the arena names, art, and audio references. [Shared stage layouts](../packages/shared/src/constants/stageLayouts.ts) own platform collision. Proposed world events remain in the [content backlog](assets/ULTIMATE-ANIMATION-CHECKLIST.md#current-five-fighter-inventory).

- [Zanda Infinity / Stage 10](assets/ZANDA-INFINITY.md) records the three background variants, shared vinyl arena, supplied music, and verification.

## Fighter art and assets

- [Asset source and provenance](assets/ART-SOURCE.md)
- [Full-body fighter art](assets/FULL-BODY-FIGHTER-ART.md)
- [Replacing fallback fighter parts](assets/REPLACING-FIGHTER-ART.md)
- [Production atlas and validation](assets/FIGHTER-PRODUCTION-ATLAS.md)
- [Animation inventory](assets/ULTIMATE-ANIMATION-CHECKLIST.md) and [machine-readable inventory](assets/ultimate-animation-inventory.json)
- [Archived sprite generation guide](history/legacy-sprite-generation-guide.md)

## Historical design and evidence

Earlier sprint proposals and dated art and combat audits preserve decisions and tests from their original passes. For current controls and rules, use the player guides and [current refinement decisions](REFINEMENT.md). The [classified inventory](plans/DOCUMENTATION-INVENTORY.md#p3--historical-and-design-records) lists the historical records.

## Plans, progress, and evidence

- [Active work and signoff](plans/ACTIVE-WORK.md) is the entry point for current next actions.
- [Documentation audit](plans/DOCUMENTATION-AUDIT.md) records stale guidance. The [documentation refresh plan](plans/DOCUMENTATION-REFRESH.md) covers the cleanup, validation, and ongoing review rule.
- [Current refinement decisions](REFINEMENT.md) summarizes the project baseline and links to the detailed workstream records.
- [Menu and performance work](MENU-POLISH-PLAN.md), [launch and ledge audit](LAUNCH-MOTION-REFINEMENT.md), and [fatigue and parry audit](FATIGUE-PARRY-SEQUENCE-AUDIT.md) contain the detailed implementation and validation records.
- The former [README](history/legacy-readme.md), [roadmap](history/legacy-roadmap.md), and [refinement log](history/legacy-refinement.md) preserve earlier progress, validation, and release notes. These snapshots can contain superseded commands and claims.
- [Clean-checkout verification](history/clean-checkout-verification.md) records the frozen install, default build, workspace suites, and portable browser rerun.
- [Asset evidence](assets/evidence/) contains repository-held visual and asset checks. References to task-workspace output identify evidence captured outside the checkout.
