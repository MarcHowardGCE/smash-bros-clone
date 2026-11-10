# Roster moveset production baseline

> Historical record. The decisions, commands, and next steps below reflect this pass. See the [current project documentation](../REFINEMENT.md) for present guidance.

Date: 2026-11-03

Production baseline for animation and later engine implementation; no gameplay changes in this batch. These choices settle art requirements for this core kit; they are not a claim of current gameplay or Ultimate feature parity. Original roster identities remain balanced starter / heavy reach / light mobility. User feedback can revise this versioned baseline before engine implementation.

## Jab chain

All three use jab 1 → opposite-hand jab 2 → front-kick jab 3. No rapid-jab branch.

Artwork: Existing nine-drawing jab 1 plus new six-drawing jab_2 and jab_3 sheets per fighter.

Engine handoff: Current MoveId.JAB is a single move. Add stage/cancel/buffer rules and separate combat data; preview timing is not final frame data.

Repository evidence: packages/engine/src/moves/ground.ts; packages/shared/src/types/MoveData.ts

## Recovery helplessness

Up special ends in helpless freefall for all three until landing or a valid ledge catch. Side special does not automatically cause helplessness.

Artwork: New helpless_enter, helpless_loop and helpless_land per fighter.

Engine handoff: Add explicit state/event, aerial resource eligibility and landing rules; do not infer from an animation ending.

Repository evidence: packages/engine/src/moves/special.ts

## Jump resources

One ground jump plus one air jump per fighter. Short/full hop share takeoff art. No multi-jump ability.

Artwork: Neutral/forward/back takeoff, rise/apex/fall/fastfall loops and double-jump transition.

Engine handoff: Retain hasDoubleJump contract; authoritative trigger/phase data must survive skipped snapshots. This batch changes no jump physics.

Repository evidence: packages/engine/src/physics/index.ts:303; packages/shared/src/types/GameState.ts

## Wall jump

Swift only; no wall cling. All-Rounder and Lincoln have no standalone wall-jump ability. Wall techs remain a shared defensive family.

Artwork: Swift reuses existing wall_tech_jump push-off and new air_rise_loop; no new bespoke wall-jump sheet required.

Engine handoff: Current server wall-jump path is not roster-gated. Add eligibility before claiming this kit is implemented; audit current resource/decay rules.

Repository evidence: apps/server/src/GameEngine.ts:1327; apps/server/src/GameEngine.wallJump.test.ts

## Directional air dodge

Eight world directions. Use five authored direction sheets, mirroring horizontal/diagonal poses for the three leftward directions.

Artwork: up, down, side, up_diagonal and down_diagonal; neutral dodge remains separate. Whole-body mirroring is an explicit pilot reuse policy and can reverse the apparent pose facing.

Engine handoff: Preserve authoritative facing independently of travel. Approve direction/facing appearance in final polish; current down-focused input capture is not eight-direction support.

Repository evidence: packages/engine/src/fsm/states/AirDodgeState.ts

## Backward roll

Reuse current mirrored roll drawings; independently tune forward/backward timing and travel.

Artwork: No additional body sheet required for this baseline.

Engine handoff: Separate timing/travel metadata and invulnerability policy remain engine work.

Repository evidence: apps/client/src/renderer/fullbody/pilotTimeline.ts

## Attack angling

No high/low angling of the same tilt or smash in the baseline. Existing up/down attacks remain separate moves.

Artwork: Existing directional attacks suffice.

Engine handoff: No new angle variants required.

Repository evidence: packages/engine/src/moves/ground.ts

## Special kit

Keep four current categories: neutral close-range burst, side rushing strike, up rising recovery and down counter. Ground/air uses shared body drawings with appropriate anchors; no transformation, tether, weapon, reflect or absorb variant.

Artwork: Existing specials/counter art plus helpless set. No new travelling-projectile artwork in this baseline.

Engine handoff: Neutral special comments mention projectile spawn but the existing execution path uses local hitbox data. Reconcile naming/zero-active-frame execution and canonical timing; no projectile feature is claimed here.

Repository evidence: packages/engine/src/moves/special.ts; apps/server/src/GameEngine.ts; scripts/assets/build-roster-pilot-pack.mjs

## Movement extras

No crawl, wall cling, extra air jumps, automatic turnaround, command-input subsystem or stance changes for these baseline kits.

Artwork: Existing crouch/turn/movement art suffices.

Engine handoff: These are intentional kit exclusions, not universally required shared actions.

Repository evidence: docs/assets/ultimate-animation-inventory.json

## Items and Final Smashes

Deferred to the later casual-mode expansion; remain outstanding toward broader Ultimate feature parity.

Artwork: Design each item interaction, status family and fighter Final Smash before producing its sheets.

Engine handoff: Not implemented or waived by completing the core roster.

Repository evidence: docs/assets/ultimate-animation-inventory.json

## Frame data

Lock animation families now, reconcile authoritative move timing before final combat polish.

Artwork: Jab 2/3 preview contact is drawing four; durations remain adjustable metadata.

Engine handoff: Resolve duplicated timing tables and previously recorded 20/23 entry disagreements, then author jab follow-up data and event markers.

Repository evidence: packages/engine/src/fsm/states/utils.ts; packages/engine/src/moves/



## Facing, loop spacing and transition polish — revision 17

Added nine backward-dodge sheets and three run-v2 sheets (72 generated drawings; nine new clips / 54 net registered frames). The pack now has 136 clips / 763 registered body frames per fighter, 408 clips / 2289 frames plus 16 shared FX frames. Original source PNGs remain intact. New backward-dodge selection preserves apparent facing across all sixteen world-direction/facing combinations. Run keeps its 18-tick period with clearer alternating footfalls. Every walk and jab clip is unchanged, including the accepted All-Rounder 24-tick walk and planted jab; Lincoln high kick is untouched.

Tumble now reuses the existing coiled source pose with uniform centered rotation over 18 simulation ticks. Six metadata views store orientation samples; runtime and playback advance rotation on simulation ticks. It does not add six new hand-drawn angles. Duplicate upright beats and angle-spacing jumps are removed, repeated snapshots do not advance spin, and interruption resets rotation. Run/tumble changes apply in optional full-body mode; live loading remains 54 clips per fighter. The nine new backward-dodge clips remain preview-only.

Airborne contextual review uses torso-anchored continuous flight, double-jump, recovery and dodge paths. All tested phase-boundary torso movements are below ten canvas pixels per tick; these are staged review trajectories, not new movement physics or guaranteed final pose in-betweening. Grounded actions retain foot registration. loop-polish-review.html compares revision 16 and current run/tumble/walk playback, and airborne-review.html demonstrates facing/transitions. The art baseline version 2 supersedes the earlier five-direction/mirroring policy.

Validation: twelve selected sheets pass alpha/cell/page-size checks; pack contract and TypeScript pass; 33 focused unit tests and 30 browser tests pass; client code-only bundle passes with environment loading redirected to the empty directory and public copying disabled. Before/after and backward-dodge captures were visually inspected. A pre-change manifest comparison verifies only run/tumble changed among prior clips (393 unchanged), plus nine new clips. Final palette/in-between/contact approval, canonical timing, engine state/event integration, VFX, four-player identification and production atlas/public-file packaging remain open.
