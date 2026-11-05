# Launch motion refinement — November 5, 2026

Ordinary body hits and counters now convert raw knockback into world speed: raw × 0.03 × 4. The 0.03 launch and 0.051 reference-decay factors follow the calculator author implementation. Four world units per reference unit is provisional project calibration, not an official scale.

Optional launchVx/launchVy/launchFallVy fields separate launch momentum from gravity. Vector momentum decays by 0.204 world units per tick without reversing. Gravity still uses 0.65 acceleration and an 18-unit fall cap; that cap now applies only to falling velocity. Current velocity moves the fighter before decay. Final-hitlag DI/LSI converts once; zero-hitlag hits initialize immediately and clear pending launch. Zero-hitlag DI/LSI remains follow-up work.

Server and tracked-launch shared movement use the same helpers. Offline matches use the same GameEngine. Client prediction still excludes combat/hitstun. Landing and tech exits clear tracked launch; a missed ceiling tech redirects momentum downward.

Damage, hitstun, raw tumble threshold, weights, move data, accepted attack reach and artwork are unchanged.

## Measurements
Free-space horizontal trajectories, excluding collisions, DI and KOs:
- Raw 50, 19 ticks: old 950 world units; current 79.116.
- Raw 100, 39 ticks: old 3900; current 316.836.
- Raw 200, 79 ticks: old 15800; current 1267.476.
The 12-case output covers three magnitudes and four angles. These are equation comparisons, not measured stage KO thresholds.

## Validation
- Engine: 949 passed, one skip.
- Server: 300 passed, 16 skips, in the final full run.
- Focused client local-match, metadata, prediction/stage and local-flow tests: 23 passed.
- Shared/engine/server/client builds and server typecheck passed.
- Launch tests cover unit conversion, decay/direction, exhaustion, gravity separation, landing/expiry, shared pipeline and ceiling bounce/cancel. Five authoritative LSI tests include actual ticking and one-time application.
- Bounded four-client production test passed contact, replicated damage, finite state, atlas art and pause/resume.
- Older broad multiplayer-atlas scenario timed out and is not reported as passing. The successful focused check does not replace its refresh/rejoin/taunt coverage. Earlier focused attempts had setup and facing/overshoot errors, diagnosed from captured states and corrected in the test.
- Human balance and full Ultimate parity remain unverified.

## Next
1. Human launch/recovery/KO-distance checks for all fighters and stage layouts; tune world scale from results.
2. Analog walking/dash separation, with keyboard compatibility and consistent client/server behavior.
3. Gravity boost, vertical launch normalization/caps, post-hitstun launch behavior and zero-hitlag influence.
4. Per-character air mobility/fast fall, action transitions and real-controller/WAN validation.

Legacy untracked hitstun and non-hit impulses retain their old paths. The older 0.95 helper is not used for tracked body-hit launches; this does not replace every impulse in the game.

## Evidence and implementation
- packages/engine/src/physics/launchMotion.ts
- packages/shared/src/types/GameState.ts
- apps/server/src/GameEngine.ts
- packages/engine/src/physics/index.ts
- packages/engine/src/physics/ceilingTech.ts
- Research source: https://raw.githubusercontent.com/rubendal/SSBU-Calculator/master/js/formulas.js
- Task output: outputs/launch-motion-v1/index.html, trajectories.json and multiplayer-launch-check.json

No environment files or Bonney content were inspected.

