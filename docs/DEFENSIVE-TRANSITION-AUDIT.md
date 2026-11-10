# Recovery and defensive transition audit — November 5, 2026

> Historical record. The decisions, commands, and next steps below reflect this pass. See the [current project documentation](REFINEMENT.md) for present guidance.

## Verified defects fixed
1. RUN now accepts shield and special inputs without requiring movement release. Jump and attack/grab priorities are retained.
2. The shared jump+attack shortcut cannot bypass shieldstun. Checks cover one, two and ten remaining shieldstun ticks; the shortcut remains available from an unstunned shield.
3. Shield entry clears horizontal/vertical velocity. A run-to-shield transition no longer stores run momentum that could resume after shield release. Shield-hit pushback while already shielding is not reset by this entry-only change.
4. HELPLESS_LAND retains its existing recovery boundary, then accepts a queued action directly without an extra idle transition. Every locked recovery tick remains protected from jump/attack input.
5. Forced ledge catch clears an interrupted air-dodge direction and pending action buffer while retaining double-jump and air-dodge restoration.

## Guarded behavior
Helpless still rejects jump, attack, special and air-dodge attempts even with resources available. Roll and spot dodge do not acquire an early jump+attack cancel. No new defensive cancel windows, invincibility durations, parry timing, damage, reach, launch, ordinary movement or artwork changes were introduced.

## Validation
- Full engine suite: 977 passed, one pre-existing skip.
- Full server suite: 320 passed, 16 pre-existing skips.
- Full client suite: 590 passed.
- Ten new authoritative tests cover run defense/specials, shieldstun shortcut blocking, unstunned shield shortcut, helpless lockout/buffered exit, dodge lockouts, stopped shield momentum and ledge cleanup.
- Production browser controller check passed RUN -> SHIELD with vx=0, release to IDLE, then RUN -> SIDE_SPECIAL with matching rendered action.
- Shared engine and server/client builds passed; prior type checks and production TypeScript compilation passed.
- One old helpless test was updated: it repeatedly pressed attack during recovery and expected an idle frame after the lockout. It now expects the queued attack at the existing end boundary; all preceding lockout assertions remain.
- The full client run also found the old main-logo filename assertion. It now references the user-supplied arcade logo; logo artwork is unchanged.
- Human defensive feel and WAN/physical-controller stress are not certified by these checks.

## Remaining audit priorities
1. Separate and validate shield release/drop lockout, parry recovery and out-of-shield action permissions. ShieldState currently couples its release path to PERFECT_SHIELD_WINDOW_FRAMES; timing parity needs independent verification.
2. Audit dodge-specific endlag, attack-cancel eligibility and fatigue/staleness. Shared roll/spot-dodge and air-dodge timing remain project rules. Do not add broad early-cancel permissions based solely on sprite completion.
3. Expand forced-transition checks across air-dodge landing, ledge trump, wall/ceiling tech, shield break and interrupted recovery, including both facings and all fighters.
4. Review retained legacy L-cancel, wavedash and meteor-cancel behavior against the Ultimate target. This pass does not remove or certify them.
5. Human matchups, real controllers, latency/jitter, low-end memory and final balance remain open.

This is a verified transition correction, not complete Ultimate defensive parity.

## References
packages/engine/src/fsm/states/RunState.ts
packages/engine/src/fsm/states/ShieldState.ts
packages/engine/src/fsm/FSMController.ts
packages/engine/src/physics/actionBuffer.ts
apps/server/src/GameEngine.ts
apps/server/src/GameEngine.defensive-transitions.test.ts
Task output defensive-transitions-v1/browser-checks.json, run-shield.png and run-special.png.

No environment files or Bonney content were inspected.

