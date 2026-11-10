# Shield-drop, parry and dodge timing refinement

> Historical record. The decisions, commands, and next steps below reflect this pass. See the [current project documentation](FATIGUE-PARRY-SEQUENCE-AUDIT.md) for present guidance.

Implemented November 5, 2026.

## Result

Shield release now has 11 ticks of recovery, separate from the existing five-tick release-parry opportunity (release counters 0–4). An eligible released shield protects only during that opportunity; the remaining drop recovery exposes the body. Shield collision, authoritative hit handling, hitlag classification and the displayed shield bubble share the same active-shield helper. Consumed-parry freeze/guardstun behavior is retained.

Reholding shield cannot erase release recovery. Jump plus attack cannot bypass release recovery or shieldstun. Late shield-drop inputs use the existing six-tick edge buffer and can execute once recovery ends. Up special can now start from an unstunned held shield. Up-smash routing and post-shieldstun grab delay still require a separate audit.

Spot dodge now uses a shared original-roster baseline: 25 frames total, with ground attack/special cancellation available on human frame 20 (internal counter 19). Jump, grab and shield do not receive this early cancel. The controller shield-plus-attack grab shortcut is excluded, and jump plus attack stays grounded during the cancel. Rolls and air dodges retain their lockouts. No pre-cancel spot-dodge input buffer was added.

Shield-drop artwork runs across the release recovery instead of restarting on return to idle. Raising shield clears the previous release cue. Source sprites, movement, launch tuning, reach and logo are unchanged.

## Evidence and scope

[Ultimate Frame Data statistics](https://ultimateframedata.com/stats) lists fighter-dependent spot-dodge recovery and attack-cancel timing. The shared 20/25 choice is a project baseline, not a claim that every Ultimate fighter uses it. [Hero frame data](https://ultimateframedata.com/hero) documents the universal 11-frame shield drop. The [original spot-dodge-cancel tutorial](https://note.com/kdrevechinchin/n/n97207d59a754) describes ground attack/special cancellation and distinguishes it from jump and other dodge cancels.

Implementation references:

- packages/shared/src/constants/physics.ts: timing constants.
- packages/shared/src/math/shield.ts: active protection helper.
- packages/engine/src/fsm/states/ShieldState.ts: release recovery and out-of-shield special.
- packages/engine/src/fsm/states/SpotDodgeState.ts: attack-only early cancel.
- packages/engine/src/fsm/FSMController.ts: shortcut guards.
- packages/engine/src/physics/actionBuffer.ts: release recovery buffering.
- apps/server/src/GameEngine.ts: authoritative shield classification and presentation cues.
- apps/client/src/renderer/fullbody/preparedHooks.ts: shield-drop clip timing.
- apps/server/src/GameEngine.defense-timing.test.ts: 17 boundary/regression cases.

## Validation

Broad regression run passed: engine 977 tests (one existing skip), server 336 (16 existing skips), client 590. Shared, engine, server and client builds/typechecks passed. After the final re-raise animation cue correction, 20 focused server tests passed and engine/server/client production builds passed. The additional test was added after the broad run; these counts are intentionally reported separately.

An initial production-browser controller check captured vulnerable shield-drop artwork and grounded spot-dodge attack cancellation. The retry after the final cue correction was inconclusive: its animation-frame recorder failed to collect reliably. Therefore final live visual signoff remains open; deterministic timing checks passed. Evidence is retained in outputs/defense-timing-v1 and work/timing-*-final.txt in the task workspace.

## Remaining priorities

1. Human controller check: release shield into a late incoming hit; try jump/grab during spot dodge; compare early attack cancel with full dodge recovery.
2. Out-of-shield up-smash routing and shieldstun grab delay.
3. Dodge fatigue/staling and per-fighter intangibility/recovery profiles. Existing spot-dodge intangibility counters 3–11 remain custom and unchanged.
4. Parry freeze/advantage, multihit and projectile exceptions. The existing consumed-parry defensive behavior is preserved, not certified as Ultimate parity.

Full Ultimate parity and final balance signoff remain incomplete.
