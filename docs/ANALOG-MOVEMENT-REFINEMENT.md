# Analog walking and dash separation — November 5, 2026

Launch calibration is retained after user approval of its feel.

## Behavior
- Calibrated horizontal stick input below 0.2 is neutral.
- Gentle input sustains WALK, including below the old digital-direction threshold.
- Walking speed varies with stick magnitude and reaches the character's walk speed at 0.8.
- Reaching 0.8 within six simulation ticks of neutral/reversal enters DASH through WALK, then the existing 15-frame dash phase reaches RUN.
- A slow increase to full tilt stays WALK; returning to neutral rearms the flick.
- Easing a dash/run below 0.8 returns to proportional walking, with bounded acceleration/deceleration.
- Neutral input uses existing ground friction. Analog low-tilt facing works without digital direction bits.
- Keyboard/digital progression and speeds are retained. Air mobility and launch physics are unchanged.

These are explicit project thresholds, not certified Ultimate sensitivity/frame-data values. They apply after controller calibration/deadzone filtering, so raw physical-axis positions differ.

## Architecture
A pure groundIntent helper records optional movementStickX/movementFlickAge in PlayerState for authoritative tick history and prediction replay. FSM states and shared movement distinguish analog walking from dash/run. Local matches use GameEngine. LocalPredictor uses the same ground intent and movement rules for supported movement states; it still does not predict combat. Analog air movement and the rest of the predictor FSM remain separate work.

## Verification
- Full engine suite: 961 passed, one pre-existing skip.
- Full server suite: 302 passed, 16 pre-existing skips.
- Focused client input/local/prediction tests: ten passed, including tick-for-tick server/predictor agreement over four sequences.
- Twelve new engine tests and two server tests cover gentle input, slow full tilt, fresh flick, easing, rearming/braking, mirrored walk, all three character speeds, keyboard progression, drift rejection and action interrupts.
- Shared/engine/server/client builds and server/client typechecks passed.
- Production browser checks using a simulated Xbox pad passed local and online flows; a remote client observed walking.
- Measured in both modes: gentle calibrated X 0.313 → WALK at 1.369375 units/tick; slow full tilt → WALK at 3.5; fresh full tilt → RUN at 6.5; eased input → WALK at 1.640625.
- Browser simulation does not certify physical wired/wireless controller feel or full Ultimate parity.

## Next
Physical-controller signoff of walk/flick sensitivity, then per-character air mobility and fast-fall refinement, with jump/landing/recovery and animation transitions across six stages. Keep the approved launch scale and reach unless new playtesting identifies an issue.

Sources: Nintendo's basic-controls manuals distinguish stick tilt from a dash tap; the exact thresholds here remain project tuning. https://csassets.nintendo.com/noaext/image/private/t_KA_PDF/manual-wiiu-supersmashbros-for-wiiu?_a=BATCtdAA0

Implementation: packages/engine/src/physics/groundIntent.ts, physics/index.ts, FSMController and Idle/Walk/Dash/Run states; apps/server/src/GameEngine.ts; apps/client/src/network/LocalPredictor.ts. Evidence: task output analog-walk-v1/browser-checks.json. Artwork, character canon, attack reach, launch tuning and environment files are untouched; Bonney excluded.
