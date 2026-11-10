Latest update: tracked launch conversion and decay are implemented; see LAUNCH-MOTION-REFINEMENT.md. The following audit records the preceding baseline.

# Movement and launch audit — November 5, 2026

> Historical record. The decisions, commands, and next steps below reflect this pass. See the [current project documentation](LAUNCH-MOTION-REFINEMENT.md) for present guidance.

## Completed this pass
Added launch-speed influence (LSI) at the authoritative pending-launch / final-hitlag boundary. Eligible tumble launches use normalized vertical input: full up gives 1.095 speed, full down gives 0.92, partial input interpolates. Exclusions use the post-DI angle and strict 65–115 / 245–295 degree intervals. Neutral and non-tumble launch speeds remain unchanged. Pending launch is consumed once. The existing input transport already carries analog magnitude; no protocol or sprite changes were necessary.

This implements a dimensionless research formula in the current project launch system. It does not establish Ultimate launch trajectories, gravity behavior, tumble thresholds, world-unit conversion or zero-hitlag launch influence.

Reference: calculator author's implementation, https://raw.githubusercontent.com/rubendal/SSBU-Calculator/master/js/formulas.js (LSI function and parameter definitions, retrieved November 5). Input here is already normalized and calibrated, rather than the calculator's raw stick units. Agreement is not official game-version certification.

## Audit findings and next priorities
1. **P1: coherent launch units and decay.** shared/math/vectors.ts maps raw knockback directly into world units per tick. Server GameEngine.applyPhysicsToPlayer integrates horizontal velocity without decay while hitstun remains. A separate shared applyKnockbackDecay helper multiplies horizontal speed by 0.95, so helper behavior does not describe the authoritative branch. Establish and test one launch-unit conversion, separate launch components from gravity/fall velocity, then apply consistent decay in authoritative/local simulation. Measure travel and KO thresholds before/after rather than guessing a global multiplier. Current LSI does not change this.
2. **P1: genuine analog walking.** WalkState is a one-frame bridge into DASH. applyMovement uses held direction with an acceleration based on walkSpeed but caps at runSpeed regardless of stick magnitude. Introduce a deliberate walk/dash policy and analog movement response, with keyboard compatibility and identical client/server behavior.
3. **P2: air mobility and fast fall.** All fighters share air acceleration/friction, gravity and terminal fall speed; per-character stats currently vary ground speeds and jump velocities, not air-speed/gravity. Fast fall changes acceleration and retains the same terminal cap. Define the roster's intended mobility differences, then measure jump apex, air drift, landing and recovery on all six stage layouts.
4. **P2: release/turn/braking and action transitions.** Validate sustained walking, dash reversals, run-to-stop, jumps and landings against visible pose changes. Do not alter simulation duration just to display every drawing.
5. **P2: exceptions and playtesting.** Zero-hitlag launches, gravity-dependent angle handling, launch caps, tumble eligibility, shield/SDI exceptions and recovery settings still require follow-up. Real controllers and latency/jitter testing remain necessary.

## Preserved
Accepted attack reach, collision geometry, character weights, move damage/timing and all fighter artwork remain unchanged. Full Ultimate parity and human balance are not complete. Bonney and environment files were not inspected.

## Validation
20 pure formula tests and five authoritative tests pass, including actual tick sampling and proof that LSI is not reapplied on the next tick. Full engine and server regression runs passed before the additional integration assertion; that assertion then passed in the five-test focused rerun. Server typecheck and client production build passed. Broader launch behavior has not been retuned.


