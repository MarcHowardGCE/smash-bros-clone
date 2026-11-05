# Air mobility and fast fall — November 5, 2026

The user accepted launch and analog ground-movement feel; those settings are retained.

## Implemented
Each fighter now has explicit air speed, acceleration, linear braking, gravity, normal fall cap, fast-fall cap and double-jump velocity. Gentle analog input controls air drift as well as digital directions. Velocity approaches its target without snapping inherited ground/recovery momentum to the air cap.

Fast fall requires a fresh DOWN press while descending, not a down input held through ascent. It immediately reaches a distinct falling speed and stays latched until landing/double jump. It cannot activate through this path during hitstun. Existing fast-fall, double-jump and landing artwork is reused; source art and clip timing are unchanged.

| Fighter | Air speed | Air accel | Air brake | Gravity | Fall / fast fall | Double jump |
| --- | --- | --- | --- | --- | --- | --- |
| All-Rounder | 5 | .135 | .05 | .65 | 18 / 28.8 | -14 |
| Abe Lincoln | 4.2 | .11 | .06 | .68 | 19 / 30.4 | -13.3 |
| Swift | 5.8 | .16 | .04 | .62 | 17 / 27.2 | -14.5 |

Values are project tuning in world units at 60 Hz. Their 1.6 fast-fall ratio follows the common pattern recorded by Kurogane Hammer; it is not a claim that this original roster matches named Ultimate fighters. The separate air-control/fall/dive fields are also reflected in the research parameter-table documentation.

Sources:
- https://kuroganehammer.com/Ultimate/FallSpeed
- https://ultimate-research.github.io/skyline-rs-template/doc/smash/params/fighter_param/struct.FighterParamTable.html

## Jump measurements
Pure physics from takeoff to a flat floor, without jumpsquat or intermediate platforms:
| Fighter | Full-hop height | Normal / fast airtime | Short-hop height | Normal / fast airtime |
| --- | --- | --- | --- | --- |
| All-Rounder | 189 | 49 / 32 ticks | 72 | 30 / 19 ticks |
| Abe Lincoln | 162.36 | 44 / 29 | 61.62 | 27 / 17 |
| Swift | 211.38 | 53 / 35 | 80.48 | 33 / 20 |

Fast-fall traces activate on the first descending input opportunity, preserving ascent height. Full measurements: jump-measurements.json in the review output.

## Preserved
Approved ground walking, dash policy, combat launch conversion/decay, damage, weights, reach and artwork are unchanged. Tracked combat launch continues using its existing separate gravity model; ordinary air tuning does not silently retune it. Recovery uses the new air drift while its up-special launch setting is retained.

## Validation
- Full engine suite: 972 passed, one pre-existing skip.
- Full server suite: 302 passed, 16 pre-existing skips.
- Full client suite: 590 passed.
- Shared/engine/server/client builds and server/client typechecks passed.
- New air checks cover three fighters, proportional drift, inherited momentum, reversal, braking, early-held versus fresh down, double-jump reset, hitstun exclusion and six-stage landing collision.
- Production browser check with two simulated controllers and a stationary human opponent passed for all three fighters: early-held down did not fast fall, fresh down produced 28.8 / 30.4 / 27.2 velocity, correct air_fastfall_loop art was selected, and landing reset the flag.
- Earlier visual-check attempts had setup/assignment timing issues; the completed run waits for grounded IDLE before jumping and uses the assigned controller input.
- Browser work was local. No new WAN or multiplayer airborne stress signoff is claimed.

## Next refinements
1. Human air/recovery/landing feel checks across all fighters and stages.
2. Landing-tick input buffering: a fresh jump delivered while state is still AIRBORNE but isGrounded is true can be consumed by the return-to-idle transition. The visual fixture exposed this existing input-priority gap. A complete action-buffer policy remains open.
3. Jump/landing/action-transition and recovery polish, including input forgiveness and camera-scale readability.
4. Matchup balance, controller calibration on real hardware, latency/jitter and lower-end memory/performance checks.

This pass is not full Ultimate parity or final balance. No environment files or Bonney content were inspected.

