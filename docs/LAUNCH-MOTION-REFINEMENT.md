# Launch motion refinement — November 5, 2026

## Current project baseline

The engine tracks launch momentum separately from gravity and handles hitstun, terrain contact, and ledge recovery. The later grab fixes keep grounded down-throw releases on the solid main platform. Exact native wall and ceiling freeze, cinematic tech rules, and directional ledge timing remain provisional. [Launch motion](../packages/engine/src/physics/launchMotion.ts) · [Main-platform contact](#grounded-grabs-and-main-platform-contact) · [Native capture checklist](REFINEMENT.md#ultimate-1305-capture-checklist)

## Dated launch and ledge experiments

Ordinary body hits and counters now convert raw knockback into world speed: raw × 0.03 × 4. The 0.03 launch and 0.051 reference-decay factors follow the calculator author implementation. Four world units per reference unit is provisional project calibration, not an official scale.

Optional launchVx/launchVy/launchFallVy fields separate launch momentum from gravity. Vector momentum decays by 0.204 world units per tick without reversing. Gravity still uses 0.65 acceleration and an 18-unit fall cap; that cap now applies only to falling velocity. Current velocity moves the fighter before decay. Final-hitlag DI/LSI converts once; zero-hitlag hits initialize immediately and clear pending launch. See the zero-hitlag follow-up below for the subsequent DI/LSI implementation.

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



## Dojo launch audit and steep upward gravity

The neutral-input Dojo sweep used the authoritative fixed-tick simulation with a fresh move and 0% attacker rage. The initial Stage 1 matrix covered 25 attacker/target pairings at 0%, 50%, 100%, 150%, and 200%, from center stage and 64 world units inside the right ledge. Each case started at the move's active window. Jab, forward tilt, forward air, forward smash, and up smash registered all 1,250 contacts. The follow-up included up throw from a held grab, for 1,500 successful cases. Exit results were observed for up to 220 ticks with no recovery inputs. The numbers are project stage thresholds, not Nintendo fighter or stage frame data.

All-Rounder as attacker on Stage 1. Percentages are pre-hit whole percentages. Side values are right-boundary KOs, excluding bottom exits after being launched offstage.

| Target | Forward smash right KO, center / edge | Up smash top KO, before → after | Up smash finisher hitstun at 150% |
| --- | ---: | ---: | ---: |
| Swift | 84% / 55% | 207% → 139% | 79 ticks |
| Moonshine | 91% / 60% | 222% → 149% | 75 ticks |
| All-Rounder | 98% / 65% | 238% → 161% | 71 ticks |
| Hulk Hoagie | 103% / 69% | 249% → 169% | 68 ticks |
| Abe Lincoln | 109% / 73% | 260% → 177% | 66 ticks |

The All-Rounder mirror check across all six stages found center up-smash top KOs at 161–163% after the change, versus 238–241% before. Forward-smash right KOs retained 98–99% center thresholds and 60–71% edge thresholds. The current up throw did not reach the top from center against any of the five targets by 300% with All-Rounder throwing.

During tracked tumble, post-DI upward angles from 70° to 110° now use the weight-scaled DamageFlyTop gravity and 1.8 reference-unit fall cap, converted with the existing ×4 world-unit scale. A downward rebound uses ordinary launch gravity. Base knockback, launch decay and base hitstun math were retained. This scope ends when tracked hitstun ends. The original measurements also describe an initial gravity boost, an extended post-hitstun gravity profile, and strong launches that advance the early trajectory faster while compressing real hitstun. Those are separate follow-ups. The browser checks used the current Dojo and simulated controller input. Physical-controller feel and an in-console comparison are still open.

Reference measurements: https://w.atwiki.jp/smashsp_kensyou/pages/64.html and https://w.atwiki.jp/smashsp_kensyou/pages/65.html.



## Strong-hit launch timing

Strong tumble hits now use a virtual launch clock. The clock can advance up to six normal trajectory steps on the first live tick and eases toward one step per tick. Gravity and momentum decay are applied at each whole trajectory step. Floor and blast checks run per step, and wall or ceiling contact hands control back to the existing tech logic. Hitlag stays on the normal clock; the first accelerated step occurs on the thaw tick. The same timing curve computes the real hitstun countdown. An aerial attack or jump can start on the first tick after the countdown ends. Neutral tumble can still persist, and Shield retains tech priority while tumbling.

The rate uses the published 1-to-6× schedule based on 0.4 × raw knockback. The project samples whole virtual steps along its existing trajectory. Ultimate's subframe rounding, collision-specific hitstun adjustments, and post-hitstun momentum behavior still need independent validation. The Dojo displays base → compressed ticks for strong hits; its speed line remains the base trajectory speed.

Browser Dojo, All-Rounder up smash finisher, target starting at 100%, neutral input on Stage 1:

| Target | Base → measured hitstun | First live tick displacement |
| --- | ---: | ---: |
| Swift | 58 → 41 | 51.2 |
| Moonshine | 55 → 40 | 48.3 |
| All-Rounder | 52 → 39 | 45.6 |
| Hulk Hoagie | 50 → 38 | 43.9 |
| Abe Lincoln | 48 → 38 | 28.7 |

All five contacts retained 14 ticks of hitlag. The repeated 1,250-case Dojo sweep registered all contacts and the same total of 449 KOs as the preceding gravity pass. The tested Stage 1 five-fighter center/edge side and top KO thresholds and the six-stage All-Rounder mirror thresholds were reproduced. Browser timing used simulated controller input.

Reference: https://w.atwiki.jp/smashsp_kensyou/pages/65.html



## Tenth-frame sampling and terrain contacts

The reference laboratory's published horizontal sample rounds virtual frame 3.22 up to 3.3. The engine now reproduces the published displacement of 16.1328 and internal speed of 4.8317 in reference units. The launch clock keeps its unrounded time for the rate calculation and samples the rounded position, including the fractional part of the next trajectory step.

Tracked tumbles sweep solid platform surfaces during each trajectory segment. Solid platform sides supply wall geometry. The old wall-tech markers near the blast boundaries are not physical barriers for tracked launches. A missed floor collision rebounds immediately at 90% of incident launch speed. A missed wall or ceiling collision reflects the corresponding component at 95% and freezes movement for 15% of the remaining virtual hitstun, clamped to 2–30 ticks. All three reduce remaining virtual hitstun by 20%. The floor and wall/ceiling collision minimums are 0.8 and 1.0 reference units per tick. Tech gates use internal speed before the rebound, with floor at 3.0 and wall/ceiling at 6.0 blocking tech at the boundary, following the published tech experiments. A grounded spike blocks the initial floor tech. The Dojo now shows the most recent contact and its hitstun change.

Browser Dojo controlled fixture, Stage 1, 150 raw knockback, no tech. Each of the five fighters produced the following. The equal launch magnitude isolates terrain timing from move power and weight differences.

| Contact | Freeze | Real hitstun at contact → after reduction |
| --- | ---: | ---: |
| Floor | 0 ticks | 41 → 38 |
| Wall | 8 ticks | 41 → 38 |
| Ceiling | 8 ticks | 41 → 38 |

The 1,250-case sweep registered every hit and 463 exits. The Stage 1 All-Rounder mirror moved from 98% to 100% for a center right KO, 65% to 66% for an edge right KO, and 161% to 163% for a center top KO. The check samples the project geometry with neutral inputs.

The published fractional trajectory calculation is inferred from Ultimate's results-screen measurements. For this project, the wall/ceiling freeze rounds down before clamping, and techs with an eligible buffer at impact resolve immediately. Native collision hulls, the exact rounding of collision freeze, and special tech exceptions still require console verification. Browser fixtures injected controlled launches through the normal engine hit path and frame-stepped them in the live Dojo. Hoagie's gentle left and right turnaround were also verified using simulated stick input.

Reference measurements: https://w.atwiki.jp/smashsp_kensyou/pages/65.html, https://w.atwiki.jp/smashsp_kensyou/pages/64.html and https://w.atwiki.jp/smashsp_kensyou/pages/37.html.



## Tech timing and collision-freeze evidence

The launch measurement page describes wall and ceiling collision freeze as 15% of remaining hitstun with a 2–30-frame clamp. The later tech experiment page describes a 2–20-frame range and does not provide a fractional-frame conversion. Neither resolves floor versus nearest-frame rounding, or the high-end clamp discrepancy, on Ultimate 13.0.5. The project still uses floor rounding and the earlier 2–30 clamp provisionally. Automated cases exercise the current formula just below and on integer boundaries, and at both clamps.

Tracked tumble contacts now accept a Shield or Grab edge through age 12, inclusive. A new input is accepted after 28 ticks from the most recent edge. Rejected repeats do not replace an accepted input already in the window. Input history is counted before and during hitlag. The simulation also recognizes an air dodge that started within the last 15 ticks when the fighter subsequently reaches an eligible tumble contact. Successful techs consume the buffered action. Wall and ceiling collisions can still accept a late tech input during collision freeze.

Ceiling tech now has a 26-tick recovery with 17 intangible ticks, counting the contact tick as the first. It cannot be canceled into a normal aerial action during recovery. Tracked wall techs accept Up or Jump at contact or through the following five ticks and start movement on tick six. Ordinary wall tech accepts an aerial action from tick six and gives up its intangibility when canceled. Cinematic exceptions and move-specific tech bans require separate verification.

Reference: https://w.atwiki.jp/smashsp_kensyou/pages/64.html and https://w.atwiki.jp/smashsp_kensyou/pages/37.html.



Browser Dojo verification used controlled launches on Stage 1 with simulated Xbox inputs. All 25 cases passed: each fighter teched the floor at input age 12 but rebounded at age 13, completed a wall tech from a Shield press during the 8-tick contact freeze, began a wall jump on tick six after a tick-five Jump press, and first accepted an aerial on tick 26 after ceiling tech. Automated cases also cover the 27/28-tick repeat and 15/16-tick air-dodge boundaries.

### 13.0.5 follow-up

[Nintendo's 13.0.5 notes](https://support.nintendo.com/jp/switch/software_support/aaab/1305.html) list an online invalid-data fix and give no collision timing. The [launch experiments](https://w.atwiki.jp/smashsp_kensyou/pages/64.html) and [tech experiments](https://w.atwiki.jp/smashsp_kensyou/pages/37.html) still disagree on the cap. The tech experiment reports that a held Shield press during blue zoom sometimes extends the tech window, with different results by move and position. Its red-zoom case is unmeasured. Screen and star KOs in this game happen after a blast-zone exit and provide no equivalent on-hit timing signal.

The documented first-collision restriction now travels with an authored hitbox and applies to its victim's tumble. Floor-only still permits wall and ceiling tech. The rule clears after the first launch collision or when hitstun ends. A blocked wall or ceiling remains blocked during that collision's freeze. The Dojo identifies blocked rebounds. Both settings are covered by test hitboxes. The five original movesets have no assigned restrictions.

To resolve the cap on 13.0.5, record the impact and first rebound ticks with neutral input for wall and ceiling cases with more than 20 predicted freeze ticks. Measure the remaining hitstun at contact separately from the displayed accelerated trajectory time. Under the published 15% model, 140 remaining predicts 21 ticks before clamping, and 56 predicts 8.4 while 59 predicts 8.85. Those fractional cases distinguish truncation, nearest rounding, and rounding up. Count the impact tick separately and exclude attack hitlag. For cinematics, compare a one-tick Shield press and a held press at each offset, with zoom and normal-hit controls at matching contact geometry. Repeat the blue-zoom Giant Punch and Falcon Punch examples, then capture a last-stock red-zoom hit separately. These are proposed measurement cases.


The browser Dojo passed 45 controlled-launch cases across the five fighters with simulated Xbox input. Each fighter passed both restriction types on floor, wall, and ceiling, including late wall input during freeze. Separate cases held the fighter in place for 8, 21, and 30 ticks and verified movement resumed on the next tick. These measurements confirm the project's provisional behavior.


### Hitstun cancel follow-up

[Published Ultimate hitstun measurements](https://w.atwiki.jp/smashsp_kensyou/pages/61.html) give separate time and speed gates for air dodge and aerial attack. The project opens them after 40 and 45 live hitstun ticks respectively, using the table's inclusive speed limits of 2.5 and 2.0 reference units per tick. Electric body hits delay both gates by one tick. The game uses remaining launch momentum rather than combined fall and launch velocity. A dodge consumes the usual air-dodge availability. Regular aerials use their existing directional selection. Jump and special cannot interrupt active tracked launch hitstun, including downward spikes. Untracked legacy reactions retain their existing path. The published tests predate 13.0.5.

The browser Dojo passed 50 controlled-launch cases across All-Rounder, Abe Lincoln, Swift, Moonshine, and Hulk Hoagie with simulated Xbox inputs. The trace and engine state confirmed early inputs and excessive speed stay locked, electric hits add one tick, air dodge consumes availability, and early jump and special inputs cannot escape a tracked spike. Hitlag exit cases counted the first live movement tick even though the normal state counter was still zero. Collision-freeze and zoom timing remain provisional.

### Zero-hitlag launch influence

The [Ultimate DI and LSI experiments](https://w.atwiki.jp/smashsp_kensyou/pages/67.html) describe sampling the stick at launch and report angle and speed influence on a throw. The [system experiments](https://w.atwiki.jp/smashsp_kensyou/pages/36.html) describe throw hitstop as exceptional. Applying the same launch-time rule to ordinary zero-hitlag tumbling hits is a project inference from that timing model. Per-move exceptions and 13.0.5 timing have no independent capture verification.

The engine queues the raw launch for one input sample. Zero-hitlag tumbles sample on the first movement tick, one simulation tick after contact in this engine. Frozen hits sample as hitlag ends, as before. Only the zero-hitlag tumble path is added. The usual steep-angle LSI exclusion, zero-hitlag projectile impact shift, and authored throw hitlag values remain in place. The launch clock advances once and changing stick direction on the second movement tick cannot rotate or rescale the launch again.

The browser Dojo passed 45 cases across all five fighters using simulated Xbox input. The matrix covered full and partial stick input, neutral input, the steep-angle LSI exclusion, weak launch, and the real throw-release path with a test-only zero-hitlag hitbox. In the 30-degree body-hit fixture, full Up shifted the angle to 38.44 degrees and added 1.14 world units per tick to launch speed. Full Down shifted it to 21.56 degrees and removed 0.96. Neither direction added hitlag or consumed an extra tick of hitstun.


### Throw-release timing audit

[Ultimate's system experiments](https://w.atwiki.jp/smashsp_kensyou/pages/36.html) distinguish normal throws from releases with victim-only hitstop. The previous body-hit path gave every ordinary roster throw 10–13 ticks of shared freeze. The four authored throw releases now have zero freeze for both fighters. A positive release value is a fixed duration on the victim only. The exception test uses three ticks to verify the route. No current fighter has an exception assigned.

Holding Down while grabbed no longer reduces base throw knockback through the crouch rule. For a tumbling throw, the defender's first movement tick supplies DI and LSI. The browser held Down through contact and changed the stick at launch, then reversed it on the next tick to confirm the sample was only consumed once. Authored startup, recovery, damage and launch values remain in place.

**Dojo timing at 150%.** Stage 1, fresh mirror matchups, neutral release. Tick 0 is the release. All 20 cases moved the victim on tick 1 after the update. The baseline attacker first left ATTACK on ticks 29–30 / 28–29 / 29 / 26 (forward / back / up / down). The updated values were 18 / 16 / 18 / 16 for every fighter. Each cell below gives the first tick after the hitstun countdown and, where different, the first accepted fresh Jump. A one-tick gap occurred for all down throws and Abe's up throw. This is a timing margin for follow-ups, with actual combo eligibility still depending on reach and defender options.

| Mirror | Forward | Back | Up | Down |
| --- | ---: | ---: | ---: | ---: |
| All-Rounder | 29 | 31 | 33 | 20 → 21 |
| Abe Lincoln | 29 | 30 | 31 → 32 | 19 → 20 |
| Swift | 30 | 32 | 34 | 23 → 24 |
| Moonshine | 30 | 32 | 33 | 21 → 22 |
| Hulk Hoagie | 32 | 33 | 32 | 20 → 21 |

**Neutral KO regression.** Stage 1, fresh mirrors, no stick input from the victim. Place the thrower 55 world units inside the appropriate platform edge for forward/back throw, or at center for up/down throw. The sweep sampled 0–500% in 10% steps and retested the nine intervening percentages before the first sampled exit, watching for 120 ticks from the throw command. All values matched before and after. The dash denotes no top exit found in the sampled range for down throw.

| Mirror | Forward right KO | Back left KO | Up top KO | Down top KO |
| --- | ---: | ---: | ---: | ---: |
| All-Rounder | 261% | 229% | 399% | — |
| Abe Lincoln | 285% | 249% | 436% | — |
| Swift | 228% | 199% | 346% | — |
| Moonshine | 244% | 214% | 371% | — |
| Hulk Hoagie | 206% | 184% | 417% | — |

Browser validation used the real throw data and a seeded grab, then frame-stepped the normal release in the Dojo. It covered 20 release/recovery cases at 150% and 40 neutral versus steered cases at 350%. The high-percent cases used controlled Xbox input and a test-only percent preset above the menu's 200% limit. The recovery probe submitted fresh Jump presses from the first post-stun tick to isolate eligibility. To rerun the committed release and exception tests, use `pnpm --filter @smash/server test src/GameEngine.grab.test.ts src/GameEngine.launch-influence.test.ts`.

**Resume here.** Reproduce the one-tick post-stun Jump gap with grounded down throw, then run the same inputs after ordinary grounded hitstun. Compare fresh Jump, Attack, Shield and Special with airborne recovery, and check that any fix preserves hard landing, tech, and jab-lock routes. After that, test real follow-up contact windows with a recorded partner at low and medium percent. Keep the collision-freeze cap, fractional rounding and blue/red zoom timing on the 13.0.5 capture backlog above. The project still needs physical-controller and native-console signoff.


### Grounded hitstun handoff

Grounded fighters now route fresh inputs directly through the normal grounded priorities on the first unlocked tick. Jump goes to jump squat, Attack and Special start their selected grounded move, and Shield raises guard. With no input the fighter goes directly to Idle. Jump plus Attack still queues the short-hop aerial. Airborne recovery retains its air actions. Shield-break recovery and tumble contact retain their separate paths.

[The Ultimate landing-during-hitstun measurements](https://w.atwiki.jp/smashsp_kensyou/pages/61.html) describe standing launch recovery as the longer of remaining hitstun plus one tick or the hard landing minimum. The project now records that lock at floor contact. It uses four ticks including contact as a roster-wide baseline, the standard value in the [published landing measurements](https://w.atwiki.jp/smashsp_kensyou/pages/136.html). Per-fighter landing minimums and 13.0.5 console timing are still unverified. A fighter already grounded when ordinary hitstun ends gets no extra transition tick.

The browser Dojo passed 90 cases across all five fighters. Each fighter accepted all four actions on the first unlocked tick in already-grounded, airborne, short landing-recovery and long landing-recovery cases. The short landing fixture had one stun tick before contact and three locked ticks remaining after contact. The long fixture had eight before contact and eight remaining after contact. Early presses stayed locked. Each fighter also passed a buffered floor tech and a missed-tech knockdown with an early get-up attempt blocked and a legal get-up accepted. Server regressions cover wall and ceiling tech, shield break, jab lock and the grounded short-hop shortcut.

All 20 Stage 1 throw replays at 150% accepted Jump on the first unlocked tick. Absolute Jump timing matched the preceding throw audit. The six cases with a prior gap now report the correct lock end directly, including every down throw and Abe Lincoln's up throw. Replay procedure is in the throw audit above. To rerun the committed boundary tests, use `pnpm --filter @smash/server test src/GameEngine.action-buffer.test.ts src/GameEngine.launch-influence.test.ts src/GameEngine.ledge.test.ts`.

**Resume here.** Use the recorded partner and the Input trace to measure throw follow-ups at 0%, 50%, and 100%. Record the first actual follow-up contact and the defender's first usable Jump, Shield or air dodge under neutral and DI inputs. Classify confirmed contacts separately from escape-dependent setups. Keep the 13.0.5 collision-freeze and zoom questions deferred.


### Recorded Dojo throw follow-ups

The audit used Stage 1 and all five mirror matchups at fixed 0%, 50%, and 100%. The partner began from a secured grab at center, facing right, with thrower x=640 and victim x=664 at their normal standing height. It replayed captured input frames through PracticeRoutine and PracticeDummy in a browser session. Each input tape used the real move data and ordinary combat simulation. The setup seeded the grab so movement and grab startup did not introduce extra spacing differences. Mirror and repeat were off for the matrix.

For each of four throws, the browser tested neutral, down-and-in, and up-and-out stick input on the first movement tick. In and out are relative to the horizontal sign of the throw, with right treated as outward for up and down throw. Separate throw-only replays found the first tick that accepted a fresh Jump or a fresh Shield input. Shield counted whichever defense the engine entered, including grounded guard, air dodge or tech. Follow-up contacts on that same tick were counted separately. Every passive contact was also checked against Jump and Shield held from their respective first accepted ticks. This is a timing and spacing audit of the recorded options.

The partner tried 13 routes. These were jab, forward tilt, one-tick walk-in forward tilt, up tilt, up smash, dash attack, flick forward smash, short-hop neutral/forward/back/up air, full-hop up air, and up special. Each began on the first usable input tick after throw recovery or 2, 4, or 6 ticks later. The dash-attack tape used a full initial stick flick followed by half stick with Attack. The forward-smash tape kept full stick when Attack was pressed. For the walk-in tilt, use a 0.35 stick input toward the throw side for one tick, then Attack with that direction. Short-hop attacks use Jump plus Attack together. Full-hop up air holds Jump for four input ticks, then presses Up plus Attack.

All 9,360 follow-up replays selected their intended move across 180 throw/percent/mirror/stick scenarios. There were 3,432 body contacts against the passive defender. Of those, 60 connected strictly before the first tested escape and survived both defense replays, 18 arrived on the same tick, and 3,354 arrived later. All 60 early contacts were from up throw at 100%. None of the tested forward, back, or down throw follow-ups beat the escape window. At 0%, the best margins still trailed the first escape by 7–9 ticks. At 50%, the best margins trailed by 3–5 ticks.

| Mirror | Immediate jab contact after release at 100% | Ticks before escape | Other up-throw routes before escape at 100% |
| --- | ---: | ---: | --- |
| All-Rounder | 22 | 4 | Jab with a 2-tick delay |
| Abe Lincoln | 22 | 3 | Jab with a 2-tick delay. Immediate up special on tick 23 |
| Swift | 22 | 7 | Jab with a 2-, 4-, or 6-tick delay. Forward tilt on tick 26 or 28. Walk-in forward tilt on tick 27. Dash attack on tick 28 |
| Moonshine | 22 | 5 | Jab with a 2- or 4-tick delay. Immediate forward tilt or dash attack on tick 26 |
| Hulk Hoagie | 22 | 3 | Jab with a 2-tick delay |

All 20 early tape-and-delay combinations repeated under all three stick settings. They came from non-tumbling up throws, so these results do not establish resistance to effective DI. Stick input changed the launch angle on five of the 60 base throw/percent/mirror combinations, all at 100%. Those were All-Rounder, Swift, Moonshine, and Hoagie back throw, plus Hoagie forward throw. None of those tumbling cases produced an early contact with the tested routines. Same-tick cases can be escaped. For example, All-Rounder's immediate forward tilt after up throw at 100% hit a fresh Jump attempt but was blocked by fresh Shield.

A visible Dojo spot check used the saved routine slot, Play partner routine, and Input trace. The All-Rounder tape presses Up on frame 1 of a secured grab and Attack on frame 32, with neutral input between. Up throw released on frame 13, so the jab contact was 22 ticks after release. At 50% the defender held Shield from frame 31 and blocked it. At 100% the jab hit before the first tested escape. The full matrix uses seeded grabs and generated tapes in the normal recorder format, so manual reproductions need equivalent starting placement and timing. No combat tuning changed during this audit.

**Resume here.** Replay the 100% up-throw routes in the 20 non-mirror pairings at center, then check which survive a change in spacing and weight. Use intermediate percents around the up-throw tumble threshold so the next pass includes effective DI. Separate durable routes from mirror-specific setups before changing throw recovery, reach or knockback.


### Non-mirror up-throw follow-ups and effective DI

The same browser Dojo recorder and partner controller replayed all 20 ordered non-mirror pairs on Stage 1. The matrix used 17 routes at delays of 0, 2, 4, and 6 ticks after the first usable input. It retained all 13 earlier routes and added one- and three-tick walks toward or away before jab. The grab was seeded at normal fighter heights with the thrower facing right, and the hold step placed the victim at its normal grab offset. The escape cutoff was the first accepted fresh Jump or Shield input in a throw-only replay. Every earlier hit was reproduced with Jump held from its first accepted tick and again with Shield held from its own first accepted tick.

#### At 100%

Immediate up throw → jab hit 22 ticks after release in all 20 pairs. The margin depended on the defender and held at center and with the thrower 55 world units inside either end of the main platform. These throws were below the tumble threshold.

| Defender | Ticks between jab contact and first tested escape |
| --- | ---: |
| All-Rounder | 4 |
| Abe Lincoln | 3 |
| Swift | 7 |
| Moonshine | 5 |
| Hulk Hoagie | 3 |

The same 127 pair/route/delay combinations beat the tested escape at all three stage placements. In addition to direct jab, a one-tick walk-in jab worked in every pair with at least one tested delay. Three-tick walk-in jab worked in the wider Swift and Moonshine windows. Every non-mirror attacker could confirm immediate forward tilt against Swift or Moonshine. Every non-mirror attacker confirmed dash attack against Swift. Moonshine also confirmed short-hop forward air against Swift on tick 28, and Abe Lincoln confirmed up special against Hoagie on tick 23. One-tick walk-in forward tilt beat the escape against Swift for all four other fighters.

Stage placement did not alter those routes, but changing the gap at attack startup did. A separate test-only fixture moved the thrower immediately before jab, keeping facing and timing fixed. Gap is horizontal fighter-origin separation on the jab's start tick.

| Thrower shift | Jab start gap | Pairs that connected before escape |
| --- | ---: | ---: |
| 24 units away | 56.9–59.0 | 0/20 |
| 12 units away | 44.9–47.0 | 8/20 |
| Original position | 32.9–35.0 | 20/20 |
| 12 units toward | 20.9–23.0 | 20/20 |
| 24 units toward | 8.9–11.0 | 20/20 |

#### At the tumble boundary

The first integer percent that tumbled was the same for each defender against all four other throwers. The thresholds were Swift 120%, Moonshine 129%, All-Rounder 138%, Hulk Hoagie 145%, and Abe Lincoln 152%. At center the test replayed one percent below each threshold, the threshold itself, one percent above, and ten percent above. The stick was neutral, fully toward the thrower, or fully away on the first movement tick.

| Percent relative to tumble | Neutral early contacts | Toward DI early contacts | Away DI early contacts |
| --- | ---: | ---: | ---: |
| −1 | 453 | 453 | 453 |
| 0 | 267 | 543 | 0 |
| +1 | 246 | 513 | 0 |
| +10 | 190 | 461 | 0 |

The below-threshold inputs produced the same launch. At and above threshold, full horizontal DI changed launch angle by 9.70° in both directions. Launch-speed differences were below 0.001 world units per tick. Each non-mirror pairing had a route before escape under neutral and toward DI at every tumbling preset tested. Away DI produced zero body contacts even against the passive defender with those same follow-up tapes. For example, at Abe Lincoln's 152% threshold, All-Rounder confirmed immediate forward tilt on tick 26 against neutral and immediate up special on tick 23 against toward DI. At Swift's 120% threshold, All-Rounder's immediate short-hop back air connected on tick 29 against neutral, and up tilt connected on tick 25 against toward DI.

The exact-threshold test repeated with the thrower facing left and the partner tapes mirrored. The outcome followed the defender's direction relative to the thrower. Neutral produced 526 passive contacts and 267 early contacts. Toward DI produced 935 passive contacts and 543 early contacts. Away DI produced neither. The mirrored immediate-jab start gap was about 11.8–11.9 units toward, 36.9 neutral, and 61.5–61.6 away.

Validation covered 20,400 replays in the main matrix, 4,080 mirrored replays, and 100 isolated spacing trials, excluding escape probes and threshold searches. Every replay selected the intended move. The report describes the current game's Stage 1 results with fresh, seeded grabs.

**Resume here.** Record longer dash and jump-drift chases for outward DI at the tumble threshold. Use dash into drifting forward air and a delayed full-hop forward air as separate tapes. Compare first actual body contact to the defender's first Jump, Shield or air-dodge window at center and near the edge, then keep guaranteed timing separate from chase pressure. Collision-freeze and cinematic timing remain on the deferred capture list.


### Outward-DI dash and aerial chases

The browser Dojo replayed up throw across all 20 ordered non-mirror pairs. Each defender started at the first integer percent that tumbled and ten points above it. The thrower faced either direction at center or 55 world units inside the edge toward the launch. The defender held full outward horizontal stick on the first movement tick, with a neutral comparison in every scenario. Launch angles confirmed the outward DI in both facings.

The partner began inputs on the first usable tick after throw recovery. The dash-attack tapes held full forward stick for 2, 4, 6, 8, 10, or 12 ticks, then pressed Attack with half forward stick. The drifting forward-air tapes began after 0, 2, 4, 6, 8, 10, or 12 dash-input ticks. Short-hop versions used Jump plus Attack together or pressed Attack 4 or 6 ticks after tapping Jump. Full-hop versions held Jump and pressed Attack 4, 6, or 8 ticks after starting the jump. Forward stick stayed held during the aerial approach. Facing-left tapes used the Dojo mirror option.

Separate throw-only runs found the first accepted fresh Jump and the first usable Shield option. At center the outward-DI Shield probe found a floor tech. At the edge the defender needed directional input to leave tumble before pressing Shield for an air dodge. In the All-Rounder versus Abe edge case, the first double jump was tick 32 and the directional air dodge was tick 33 after release. The cutoff across outward-DI cases was tick 32 or 33. A confirm required a body hit strictly before that cutoff, with the same contact in the Jump and Shield-option replays. Contacts on the cutoff tick were counted separately.

#### What connected

Every tested outward-DI scenario had an early dash attack. The two-tick dash reaches farther than the one-tick dash probe in the previous audit. With outward DI, 344 valid route replays hit before escape, all from dash attack. The result split evenly across facings and placements.

| Attacker | Dash lead-in ticks that worked against all four defenders at tumble | At tumble +10 |
| --- | --- | --- |
| All-Rounder | 2 or 4 | 2 or 4 |
| Abe Lincoln | 2 or 4 | 2 or 4 |
| Swift | 2 or 4 | 2 or 4 |
| Moonshine | 2, 4, or 6 | 6 |
| Hulk Hoagie | 2 or 4 | 2 or 4 |

Moonshine's two-tick dash attack hit Abe Lincoln at 152% on tick 27, five ticks before the first tested escape. That held at center, near the edge and in both facings. Against Swift at 130%, Moonshine needed the six-tick dash among the tested lengths. The four other attackers each had a tick-29 example with the two-tick dash. The visible Dojo spot check played Moonshine's tape from a saved slot and confirmed the tick-27 contact with simulated Xbox DI and the Input trace. To reproduce that tape from the seeded grab, press Up on tape tick 1, hold full forward stick on ticks 32 and 33, and press Attack with half stick on tick 34. The throw releases on tape tick 13 and the DI sample is the next tick.

Drifting forward air was a chase option after the defender could act. The earliest short-hop example was Swift against Abe Lincoln at 152%, with four dash ticks and the Jump-plus-Attack shortcut. It hit on tick 34, two ticks after the first escape, and still hit both sampled defense replays. Full-hop forward air never hit a passive outward-DI defender in the tested tapes, but 1,856 route cases hit at least one active defense replay. Those results describe reads on the tested responses.

| Launch input | Valid routes | Passive body hits | Before escape | On escape tick | After escape |
| --- | ---: | ---: | ---: | ---: | ---: |
| Neutral | 7,040 | 2,164 | 712 | 246 | 1,206 |
| Outward DI | 7,040 | 1,294 | 344 | 16 | 934 |

The 320 scenarios used 15,360 attempted route replays before separate defense replays and escape probes. The table excludes 1,280 edge short-hop tapes that did not enter the intended short-hop forward air. The findings apply to Stage 1, a seeded grab, the tested percentages and escape inputs, and the current movesets.

**Resume here.** Audit the airborne tumble-to-air-dodge handoff. Compare a fresh Shield press, held Shield, and direction-then-Shield at the first post-stun tick in the Dojo. Check published reference measurements, preserve floor-tech priority, then replay the tightest dash confirms with the verified defense timing. Collision freeze and cinematic tech timing remain on the 13.0.5 capture backlog.


### Airborne tumble-to-air-dodge handoff

A fresh Shield press now starts an air dodge on the first unlocked tick of ordinary body-hit tumble when the fighter is still in open air and has a dodge available. Shield held through that tick also fires once. A released Shield tap can carry from the previous nine ticks, and the live stick sets the dodge direction. Direction then fresh Shield still works, one tick later if direction was the first unlocked action. The existing early-cancel thresholds continue to apply during active hitstun. The new buffer is independent of the physical Shield or Grab edge used for the tech lockout.

Before resolving a possible air dodge, the server checks where the natural tumble would move on that tick. If it would touch the floor, the original input goes through the existing tech check. A valid fresh or buffered input produces the appropriate floor tech without spending the air dodge. A held Shield with an expired tech input results in the normal knockdown on contact. Legacy untracked tumble and footstool reactions keep their existing paths.

The [Ultimate input-buffer experiments](https://w.atwiki.jp/smashsp_kensyou/pages/111.html) describe the nine-tick ordinary buffer and accidental air dodges from holding the tech button. The [tech experiments](https://w.atwiki.jp/smashsp_kensyou/pages/37.html) describe the same conflict. The implementation covers a hold through unlock and released taps in the ordinary window. Version-matched capture is still needed for the exact earlier-release behavior after a long hold and interactions with cinematic freeze.

The browser Dojo passed 55 frame-stepped checks with simulated Xbox inputs. For each fighter, the tests covered a fresh tap, a 12-tick hold through recovery, released taps at ages nine and ten, simultaneous direction plus Shield, direction then Shield, neutral and directional floor tech, held Shield with a recent or expired tech input, and an already spent air dodge. To rerun the committed timing tests, use `pnpm --filter @smash/server test src/GameEngine.launch-influence.test.ts src/GameEngine.ledge.test.ts`.

The recorded dash audit replayed all 160 outward-DI scenarios from the previous chase pass with the new defense. Fresh Shield now selected an air dodge in all 160 throw-only controls. This is the first Shield option in those trajectories, which were still airborne at the unlock tick. Same-tick floor contact is covered by the separate priority fixtures above. In the All-Rounder versus Abe edge case, the direct dodge starts on tick 32 instead of the old direction-then-Shield dodge on tick 33. Jump was already available on tick 32. Across the matrix the first tested escape was still tick 32 or 33. All 344 early dash-attack route replays still connected before that cutoff, by 1–5 ticks. The 2-, 4-, and 6-tick lead-ins listed in the preceding report all reproduced under the new defense replays.

**Resume here.** Audit late-hitstun buffering for Jump, aerial Attack, and Special. Use separate fresh, held, and released-input Dojo traces to establish each first usable action. Then retest the same-tick and just-late chase contacts against the first intangible dodge tick. The 13.0.5 collision-freeze and cinematic capture backlog remains open.


### Late-hitstun action buffering and dodge intangibility

Jump, aerial Attack, and Special can now buffer during airborne body-hit stun. A released tap is accepted through nine ticks before the first unlocked tick. A longer button hold commits on the third-to-last locked tick and still fires if released after that tick. Releasing a long hold before the cutoff lets the old press expire. Right-stick Attack can buffer as a tap with its recorded aim, and a stale stick hold does not become a face-button hold. Fresh actions, fresh Shield or Grab, and held Shield retain priority over a saved command. The buffer fires once at normal unlock. Live early cancels retain their separate timing gates. Tech and new hits clear the queued action.

The [Ultimate input experiments](https://w.atwiki.jp/smashsp_kensyou/pages/111.html) report the nine-tick press and three-tick hold windows. The [launch survival experiments](https://w.atwiki.jp/smashsp_kensyou/pages/118.html) explicitly describe buffering recovery actions after a hit. The code applies those windows to ordinary airborne body hits, using the project's existing direction capture. Exact competing-buffer priorities, special move exceptions, and 13.0.5 behavior still need reference validation.

The browser Dojo passed 105 frame-stepped checks across five fighters with simulated Xbox input. Each action was tested fresh, held through unlock, tapped at nine and ten ticks, and held through or released before the three-tick cutoff. The browser also checked a right-stick tap, a stale right-stick hold, and fresh Shield competing with an older Attack. The focused regression command is `pnpm --filter @smash/engine test src/physics/actionBuffer.test.ts`. Engine and server suites and both type checks passed.

#### Dash chases at the first intangible tick

The 160 outward-DI chase scenarios replayed six dash lead-ins each. Of the 960 routes, 272 had passive contact from dodge start through three ticks later. Each was replayed with fresh neutral and outward directional air dodge. The audit sampled the engine's damage immunity before collision and checked overlap against a copy of the defender without immunity. Dodge entry is tick zero below.

| Defender | First intangible tick after dodge entry |
| --- | ---: |
| Swift, Moonshine | +1 |
| All-Rounder | +2 |
| Abe Lincoln, Hulk Hoagie | +3 |

Both dodge directions used the same first intangible tick for each fighter. Offsets in the next table are based on the passive defender's contact time. A later actual contact can occur at a different tick during the dodge replay.

| Passive contact offset | Cases | Body hits with neutral dodge | Body hits with outward dodge |
| --- | ---: | ---: | ---: |
| 0 | 16 | 16 | 16 |
| +1 | 144 | 96 | 96 |
| +2 | 12 | 0 | 0 |
| +3 | 100 | 26 | 0 |

Every non-hit in this matrix had overlap during intangibility. The 26 neutral-dodge hits in the last row occurred in landing lag, six or seven ticks after dodge entry. For example, All-Rounder's eight-tick dash against Abe at 152% hit on tick 35 against the passive defender. Neutral dodge began on tick 32, blocked the earlier overlap, then was hit on tick 38 at landing-lag frame zero. Outward directional dodge stayed protected in the replay. These observations separate same-tick startup vulnerability, airborne intangibility, and post-landing punishment.

**Resume here.** Audit neutral versus directional air-dodge landing recovery at floor contact. Measure when airborne intangibility ends, the first grounded vulnerable tick, and when Jump, Attack, and Shield become usable. Use the 26 neutral-dodge landing punishments as regression fixtures. Keep stale-dodge native rounding and 13.0.5 collision-freeze and cinematic timing on the deferred list.


### Neutral and directional air-dodge landings

The browser Dojo measured floor contact and grounded input across all five fighters. The baseline counted the landing frame and then locked the full recovery again. For example, neutral dodge reported 10 recovery ticks at contact and first accepted Jump, Attack or Shield 11 ticks later. Floor contact now counts as recovery tick one. At contact, the remaining counter is the authored total minus one.

Airborne dodge intangibility ends on the floor-contact tick, before combat checks. The mid-dodge fixtures were intangible immediately before contact and vulnerable in landing-lag frame zero. Early landings could occur before intangibility had started. Late landings could occur after it had expired in the air. In all tested landings, grounded Jump, Attack and Shield opened on the same tick. The air-dodge charge also refreshed on contact. The engine kept the prior dodge travel, collision, fatigue refresh and airborne intangibility rules.

The updated browser Dojo passed 360 checks on the Stage 1 main platform. Each fighter tested neutral, side, down and down-diagonal landings at three contact ages and at fatigue zero and five, with a separate run for each grounded action. The fixtures controlled the height immediately before contact so they could isolate the same dodge age across fighters. The late input probe stayed locked and the next fresh press was accepted. No tested landing count differed between fatigue endpoints.

| Fighter group | Neutral unlock after contact | Directional unlock at dodge age 0 | Down or down-diagonal at age 8 | Side or down-diagonal at age 35 | Down at age 35 |
| --- | ---: | ---: | ---: | ---: | ---: |
| All-Rounder, Abe Lincoln, Hulk Hoagie | 10 | 19 | 19 | 16 | 15 |
| Swift, Moonshine | 10 | 19 | 18 | 15 | 14 |

Dodge age zero is the entry tick. Side-dodge contact at age two also unlocked on tick 19 for every fighter. The [Ultimate landing experiments](https://w.atwiki.jp/smashsp_kensyou/pages/136.html) report 10 ticks for neutral and a directional recovery that decreases with a later landing. The [recorded frame-data notes](https://docs.google.com/spreadsheets/d/16fmsoqDoQaR1eteVk2uuzIH2DB4iQHVrqiG8VRbRA7Q/htmlview) and the landing experiments differ on the directional upper endpoint. The project keeps the existing 11–19 interpolation as provisional, including its direction-dependent duration. The Dojo timings verify the project rather than establish exact 13.0.5 behavior.

#### Replay of the 26 landing hits

The recorded up-throw chase reproduced all 26 exact fixtures after the counter correction. They used center Stage 1 and both facings. Up throw release is tick zero. The defender used full outward DI on the first movement tick, then started neutral dodge on tick 32. The dash attack hit the passive defender on tick 35 in every fixture. Against neutral dodge, the earlier overlap was protected and the actual hit arrived on landing-lag frame zero. Eight hit on tick 38 and 18 hit on tick 39. All 26 directional dodge replays avoided the hit.

| Thrower | Defender | Percent and actual hit tick | Dash lead-in |
| --- | --- | --- | ---: |
| All-Rounder | Abe Lincoln | 152% → 38, 162% → 39 | 8 |
| All-Rounder | Hulk Hoagie | 145% → 39 | 8 |
| Abe Lincoln | All-Rounder | 138% → 39 | 8 |
| Abe Lincoln | Hulk Hoagie | 145% → 39 | 8 |
| Swift | All-Rounder | 138% → 39 | 8 |
| Swift | Abe Lincoln | 152% → 38, 162% → 39 | 8 |
| Swift | Hulk Hoagie | 145% → 39 | 8 |
| Moonshine | Abe Lincoln | 152% → 38 | 10 |
| Hulk Hoagie | All-Rounder | 138% → 39 | 8 |
| Hulk Hoagie | Abe Lincoln | 152% → 38, 162% → 39 | 8 |

To rerun the committed input, immunity and countdown boundaries, use `pnpm --filter @smash/server test src/GameEngine.air-dodge-motion.test.ts src/GameEngine.wavedash.test.ts src/GameEngine.action-buffer.test.ts`. Both type checks and the full engine and server suites passed.

**Resume here.** Measure side and diagonal dodge contacts on soft platforms and at ledges. Compare landing, drop-through, and ledge-grab priority at the same dodge ages. Separately reconcile the directional 19 versus 20 tick endpoint and the decay curve with versioned reference footage before retuning them.



### Directional air-dodge platform and ledge contacts

The Stage 1 baseline grabbed either ledge while Down was held, including from inside the floor edge on a tick that would otherwise land. The server now uses the live Down input to suppress ledge grabs during air dodge. Releasing Down allows an eligible dodge to grab on the next processed tick if it is still in range. The captured dodge direction continues to drive travel. The input uses the game's existing Down mapping for keyboard and calibrated left stick.

The browser Dojo passed 280 seeded contact cases across all five fighters, both sides, side and downward-diagonal dodges, and fresh and maximum fatigue. The fixtures placed each fighter at the same collision boundary before stepping the normal simulation.

| Contact | Down released | Down held |
| --- | --- | --- |
| Soft platform, descending through its top | Landing lag | Landing lag |
| Solid main floor, away from ledge | Landing lag | Landing lag |
| Ledge range before the eligibility boundary | Continue dodge | Continue dodge |
| Ledge range at the eligibility boundary | Grab ledge | Continue dodge |
| Inside ledge range while crossing solid floor | Grab ledge | Landing lag |
| Enter ledge range during movement | Grab on the next tick if still in range | Continue dodge until Down is released |

The ledge query samples the start of the tick. The current gate checks stored dodge age 24, equivalent to action frame 25 when counting entry as frame one. Neutral dodge remains unable to grab while active. Both a successful ledge grab and a landing restore the air-dodge charge. The main-floor recheck also passed 180 browser Dojo cases covering neutral and downward-diagonal recovery, three ages, both fatigue endpoints, and separate Jump, Attack and Shield presses.

The [Ultimate dodge experiments](https://w.atwiki.jp/smashsp_kensyou/pages/32.html) report directional ledge eligibility from frame 25. The [demonstration of Down delaying ledge grabs](https://www.youtube.com/watch?v=TLGgeJ6yM-A&t=75s) supports the input behavior. The exact native stick threshold, whether live Down skips a soft platform during directional dodge, and which contact wins in a same-tick overlap with Down released still need versioned comparison. In this game, ordinary falling can pass through a soft platform with Down, while a directional dodge currently lands on it.

To rerun the committed boundaries, use the server air-dodge-motion, wavedash and action-buffer test files. Client and server type checks passed.

**Resume here.** Measure when all five fighters can regrab the same ledge and how long each regrab protects them. Include a clean drop, a trump, a landing and an intervening hit. Keep directional platform and landing constants provisional until the source behavior can be isolated.


### Ledge regrab cooldown and intangibility

The baseline reopened the same edge at tick 30 and refreshed hang protection on every grab. A clean drop also carried 44 protection ticks into the air. The engine now opens the same edge at tick 44 and ends its hang protection when the fighter drops. The first grab grants the existing 45 ticks of protection. Successive grabs share one count across both edges, grant zero new hang protection, and stop after six total grabs. A grounded update or a body hit that causes hitstun resets the count. A shielded hit or a hit without reaction does not reset it. The cooldown runs independently of the count reset.

The browser Dojo passed 60 controlled scenarios covering all five fighters at both edges. The fixtures used normal simulation ticks for drops, trumps, landings and regrabs. The hit scenario injected a reaction through the server hit resolver so it could isolate the reset from an attack's reach.

| Route after first grab | First successful attempt | New hang protection |
| --- | ---: | ---: |
| Drop and return to same edge | Tick 44 | 0 |
| Trump and return to same edge | Tick 44 | 0 |
| Land, then return to same edge | Tick 44 | 45 |
| Take a reaction hit, then return to same edge | Tick 44 | 45 |
| Drop and reach opposite edge | Tick 1 in seeded fixture | 0 |
| Reach the seventh grab with no reset | Denied | 0 |

The [Ultimate ledge measurements](https://w.atwiki.jp/smashsp_kensyou/pages/34.html) describe 44 frames after a ledge exit, six consecutive grabs, no regrab intangibility, and resets on landing or taking a reaction hit. The project applies the cooldown per edge and retains the existing 20-tick trump protection. Ultimate's cross-edge cooldown behavior, separate post-hit lockout, damage and airtime scaling for a fresh grab, and its training-mode fixed-damage exception remain unmodeled or unverified here.

Run the server ledge test file to reproduce the drop and six-grab boundaries. Client and server type checks passed.

**Resume here.** Measure vulnerability before the catch and intangibility during neutral getup, jump, roll and attack, including successive regrabs and a reset. Check the timing with attacks that overlap the ledge, then compare against the available Ultimate measurements before tuning.


### Ledge getup intangibility and catch window

The baseline spent the remainder of the hang counter during getups. After 40 ticks of hanging, all four options were vulnerable at getup tick 4 on a fresh grab and on tick 0 after a regrab. The engine now starts a new protection window on getup tick 0. After the first grab, the second uses 80% rounded up and the third uses 50% rounded down. Starting on the fourth grab, the getup grants no new protection. Landing resets the sequence.

| Getup option | First grab | Second grab | Third grab | Fourth onward |
| --- | ---: | ---: | ---: | ---: |
| Neutral getup | 33 | 27 | 16 | 0 |
| Jump | 12 | 10 | 6 | 0 |
| Roll | 25 | 20 | 12 | 0 |
| Attack | 28 | 23 | 14 | 0 |

The browser Dojo ran 200 getup sequences across five fighters and both ledges. Each sequence probed an overlapping hitbox through the normal collision resolver on every getup tick. The first contact matched the table, with fresh jump first hittable on the tick it entered airborne. Landing restored all four fresh windows. The ledge attack stayed active at zero-based ticks 20–27. The fresh protection covers that full active window.

The [Ultimate ledge experiments](https://w.atwiki.jp/smashsp_kensyou/pages/34.html) give standard neutral and jump windows and approximate regrab reductions. They also place the last active attack tick at the end of fresh intangibility. The shared 25-tick roll is provisional, using [Mario's measured window](https://ultimateframedata.com/stats.php#ledgeStats) as the reference. The project attack protection follows its authored hitbox timing. Exact native roll and attack reduction rounding and getup animation durations remain open.

Ten catch probes from below found a hittable approach followed immediately by a protected hang on the next simulation step. There is no separate vulnerable catch state. The Ultimate measurements report a 0–2 tick vulnerable approach that depends on contact geometry and precedes the forced catch. A reliable implementation needs a pending approach, explicit ownership timing, and tests that a hit before catch prevents resource refresh. The current step retains the measured snap.

**Resume here.** Split ledge approach, forced catch and hang. Test contacts from below and beside the ledge, a hit before capture, and contests between two fighters. Then measure buffered getups and forced catch timing on successive grabs.


### Ledge approach and forced catch

The simulation now separates the vulnerable approach from ownership. The approach interpolates toward the existing hang anchor for zero, one, or two ticks. The Stage 1 tests used points 5, 23, and 36 world units below the ledge. The current geometry thresholds are provisional and use vertical depth from the hang anchor. Live Down blocks an initial approach. A pending approach owns no ledge and grants neither double jump nor air dodge. A body hit cancels it. The ordinary body-hit rule can still restore the air dodge independently.

Successful catch takes ownership, refreshes both resources, and starts a forced catch. The first two consecutive catches lock options for 19 ticks. Catches three through six take 20, 21, 22, and 23 ticks. A fresh catch is protected throughout and starts the existing 45-tick hang protection when the lock ends. Regrabs grant neither catch nor hang protection. The forced catch uses the existing hang state and catch artwork, while the vulnerable approach has its own state and sprite mapping.

The most recent eligible input during approach or forced catch is buffered for the first unlocked tick. Jump, attack, roll, neutral getup, and drop each passed. A buffered occupant blocks a trump even if the challenger is processed first. Two unbuffered fighters reaching the same ledge on the same tick leave the higher-numbered slot holding it, with the lower slot popped. The project still applies that pop immediately, including during a forced catch.

The browser Dojo passed 140 scenarios across the five fighters and both edges. Each fighter and edge covered all three approach lengths, an overlapping hit on each vulnerable tick, a blocked hit on a fresh catch, same-tick and buffered-occupant contests, each buffered option, and a third consecutive grab. Hit fixtures used the normal combat resolver with a seeded overlapping hitbox. Regression tests exercise approach, resource and catch boundaries, getup protection, and the regrab limit.

The [Ultimate ledge experiments](https://w.atwiki.jp/smashsp_kensyou/pages/34.html) describe a geometry-dependent 0–2 tick approach, a 19–23 tick forced catch, and delayed trump displacement during catch. The project's approach thresholds, fixed fresh hang timer, and current trump pop and protection remain project rules.

**Resume here.** Move early trump displacement to the end of the displaced fighter's forced catch and audit the resulting recovery and punish window. Cover staggered contests in both slot orders, simultaneous grabs, a buffered occupant, and a challenger who is hit before the contest commits.


### Ledge trump displacement and recovery

Ownership transfers when the challenger catches. If the old holder is still in forced catch, they stay at the ledge until their existing catch clock ends. This applies in both slot orders and in same-tick grabs. An old holder who already buffered a getup blocks the trump. A getup input after ownership transfers cannot cancel the scheduled pop. The same-edge cooldown starts on actual departure. A body hit cancels a pending pop or interrupts recovery.

At pop tick zero the displaced fighter becomes hittable. They can steer horizontally during ticks 1–27 and their first ordinary action is available on tick 28. The simulation uses normal platform collision during recovery. The pop retains the project's existing horizontal and vertical speeds. The old 20-tick invincibility grace was removed. The new owner has their own catch and getup protection windows.

| Challenger catches after the old holder | Pop after ownership transfers | New owner can act after pop | Action lead before defender unlock | First getup attack hitbox after pop |
| --- | ---: | ---: | ---: | ---: |
| Same tick | 19 | 0 | 28 | 20 |
| 1 tick later | 18 | 1 | 27 | 21 |
| 8 ticks later | 11 | 8 | 20 | 28 |
| 20 ticks later | 0 | 19 | 9 | 39 |

The browser Dojo passed 70 timing sequences across five fighters, both ledges and both slot orders for staggered catches. Same-tick grabs used the existing higher-slot tie rule. A centered overlap probe could hit the displaced fighter on pop, while the fresh owner was protected during catch and during the opening getup attack ticks. Drift moved the defender during recovery and a fresh Jump worked on tick 28. Another 70 sequences ran the actual buffered ledge attack with stageward defender drift. None hit during the lock. At the two earliest timings an active hitbox existed before unlock, so the miss was a spacing result in those routes. The 140 approach, interrupted-grab, and buffered-getup fixtures also passed with delayed displacement.

The [Ultimate ledge experiments](https://w.atwiki.jp/smashsp_kensyou/pages/34.html) report delayed ejection, 28 ticks of recovery with horizontal movement, and +27 to +8 advantage for their early and late examples. The project's measured early stagger is +27 and its late stagger is +9 under the tick convention in the table. Exact native pop velocity, vulnerability, and the late one-tick difference remain provisional. The synthetic overlap probes isolate vulnerability from a fighter's ability to reach the target with a real move.

**Resume here.** Measure actual ledge-jump aerial punishes across the five fighters against inward, neutral and outward drift. Include a floor landing during recovery and compare the first actionable tick and trajectory before changing either.


### Ledge-jump aerial punishes and landing escapes

The browser Dojo replayed Stage 1 at the default fixed 0% with all 25 ordered fighter matchups, both ledges, challenger catch delays of 0, 1, 8 and 20 ticks, and inward, neutral and outward defender drift. The challenger buffered ledge jump and attempted all five aerials through the normal input, move and hit-resolution paths. The stageward pursuit used aerial presses on the first airborne action tick and three ticks later. Neutral and outward pursuit used that first tick and offsets of six and twelve ticks. Attack aim was supplied separately from movement so choosing an aerial did not change the drift tape.

| Challenger catch delay | Configured routes | Aerials started | Active before defender unlocked | Hits |
| --- | ---: | ---: | ---: | ---: |
| 0 ticks | 6,000 | 6,000 | 4,200 | 0 |
| 1 tick | 6,000 | 6,000 | 3,960 | 0 |
| 8 ticks | 6,000 | 6,000 | 630 | 0 |
| 20 ticks | 6,000 | 4,500 | 0 | 0 |
| Total | 24,000 | 22,500 | 8,790 | 0 |

The 1,500 unavailable routes were late-trump tapes where the attacker had already landed before the scheduled aerial press. They were excluded from the aerial count. The defender used only the selected drift, including after unlock when a move remained active. In the neutral and outward pursuit sweep, the closest pre-unlock probe was Abe's neutral air against Swift, whose hitbox was still 23.5 world units from the damage capsule after accounting for both radii. The closest forward and back aerial probes were almost horizontally aligned, yet their hitbox centers were roughly 71–72 units from the closest point on the defender's capsule axis vertically. That is evidence of a vertical spacing gap for those routes.

Thirty independent natural-pop traces covered five defenders, both ledges, and three drift directions. None landed during the lock. Even at the apex, the defender's physics feet stayed 9.9–18.5 world units below the main platform top, depending on fighter. The stock Stage 1 trajectory therefore provided no natural landing escape in this sweep.

Another 360 escape fixtures compared open air with a seeded main-platform landing on pop tick 5. In each condition, Jump, Attack and Shield taps on tick 27 stayed locked and expired when released. Fresh inputs fired on tick 28 in all 180 fresh-press cases. Open air yielded double jump, aerial attack, or air dodge. Landing yielded jumpsquat, grounded attack, or shield. The seeded contact isolates the lock rule from the current pop trajectory.

The test records project behavior and leaves gameplay tuning unchanged. The matrix does not cover every player-controlled pursuit, every stage, or the exact Ultimate pop and ledge-jump motion.

**Resume here.** Test ledge drop into immediate aerial and into double-jump aerial against the same drift options. Record whether those routes reach the defender below the ledge before tick 28. Use the measured geometry and versioned reference footage before retuning the launch or ledge jump.


### Ledge-drop aerial punishes

The browser Dojo replayed Stage 1 at the default fixed 0%. Both routes used all 25 ordered fighter matchups, both ledges, challenger catch delays of 0, 1, 8 and 20 ticks, all three defender drift directions, all three attacker drift directions, and all five aerials. The challenger buffered Down during forced catch and dropped on the first unlocked tick. The immediate route pressed Attack on the next tick. The double-jump route pressed Jump on that tick and Attack on the first tick after the double-jump handoff. The defender used drift alone. Pop is tick zero and the defender can act on tick 28.

| Route | Replays | Inward drift hits before 28 | Neutral drift hits before 28 | Outward drift hits before 28 | First-hit range before 28 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Drop into immediate aerial | 9,000 | 448 | 772 | 1,066 | 6–27 |
| Drop into double-jump aerial | 9,000 | 0 | 4 | 8 | 8–9 |

The immediate route hit before unlock in every ordered matchup and on both edges. Neutral air accounted for 994 early hits, up air 670, forward air 426, and back air 196. Down air landed 30 times after unlock, against outward drift on the late trump. Neither route hit on exactly tick 28. Those late contacts used a drift-only defender and do not establish a guaranteed punish.

The 12 early double-jump contacts were all neutral air against Abe. Abe's mirror produced ten and Hoagie produced two. They came from simultaneous catches or the one-tick stagger. The double-jump route missed in the other 23 ordered matchups under these inputs.

A separate sweep attempted Attack one tick earlier, on the double-jump takeoff tick itself. None of its 9,000 presses started an aerial. The engine stepped from DOUBLE_JUMP into AIRBORNE while ignoring that Attack edge. The main sweep waited one more tick and verified the requested aerial started in all 9,000 double-jump cases. These are current engine results and do not establish the native Ultimate input rule. This audit changed documentation only.

**Resume here.** Measure tapped and held Attack and C-stick on the tick before double-jump takeoff, on takeoff, and on the first following tick. Compare with reference behavior before editing the handoff. If it changes, rerun these Stage 1 tapes and confirm the successful immediate-drop routes still connect. Keep the native trump trajectory and late unlock difference provisional.


### Double-jump aerial input timing

The input trace corrected the prior audit's tick label. The existing engine launches and spends the aerial jump on the Jump press itself, when entering DOUBLE_JUMP. The old dropped Attack edge was on the following tick, when DOUBLE_JUMP handed off to AIRBORNE. In addition, simultaneous Jump and Attack used to start the aerial and leave the jump unused.

The [Ultimate jump measurements](https://w.atwiki.jp/smashsp_kensyou/pages/75.html) report that a normal aerial and aerial jump can start on the same frame. The engine now starts both from a fresh simultaneous input in open air, preserving the ordinary jump's velocity and consuming the resource once. A fresh normal aerial on the next tick also starts, without applying a second launch. The existing live face-button and C-stick move selection still supplies aim. Specials, grabs, and dodges are outside this simultaneous normal-aerial path. The [C-stick measurements](https://w.atwiki.jp/smashsp_kensyou/pages/31.html) describe special direction expiry rules for buffered commands. Those remain provisional, as does version-matched physical-controller behavior.

The browser Dojo ran 160 cases before and after the change. Each roster fighter tested both facings, tapped and held Attack and C-stick, and offsets of minus one, zero, one, and two ticks from the Jump press. An attack one tick before Jump still started immediately and used no jump. Simultaneous input now started the selected aerial and consumed the jump on tick zero. Both following ticks accepted a fresh attack. Held inputs produced one aerial per press. Engine build and client/server type checks passed. The targeted server suites passed 101 tests with 13 existing skips.

| Ledge-drop route | Replays | Hits before tick 28 | Ordered matchups with an early hit | Hit ticks before 28 |
| --- | ---: | ---: | ---: | ---: |
| Immediate aerial | 9,000 | 2,286 | 25 | 6–27 |
| Double jump, then Attack next tick | 9,000 | 196 | 13 | 7–8 |
| Simultaneous double jump and aerial | 9,000 | 772 | 25 | 6–9 |

The immediate route reproduced all 2,286 early contacts and all 30 late down-air contacts. The next-tick double-jump route's 196 early hits were neutral air. The simultaneous route yielded 760 neutral-air hits and 12 back-air hits. The prior two-tick-delay result was 12 early neutral-air hits. The new results use earlier inputs and the same Stage 1 matrix.

**Resume here.** Isolate directional air-dodge soft-platform pass-through and simultaneous floor/ledge contact across the five fighters. Compare Down held and released, side and diagonal angles, and contact before and after ledge eligibility. Keep exact native trump trajectory and the late one-tick difference provisional until the available reference can resolve them.


### Six-stage directional air-dodge contact audit

The browser Dojo passed 36,000 contact probes across all five fighters, six stages, and both sides. The fixtures seeded one soft platform per stage, center main floor, inside the floor edge, beside the ledge, and below it. They crossed four captured directions (side, down-in, straight down, up-in), stored dodge ages 7, 15, 23, 24 and 35, fatigue levels zero and five, and three live input states (neutral, Down held, and an explicit Down release). Stored age is the value entering the tick before the ledge query. The fixtures used normal simulation ticks.

| Contact | Down neutral or released | Down held |
| --- | --- | --- |
| Descending through soft platform while directionally dodging | Landing lag | Landing lag |
| Descending through center solid floor | Landing lag | Landing lag |
| Descending through solid floor inside the ledge radius, before stored age 24 | Landing lag | Landing lag |
| Same crossing at or after stored age 24 | Ledge catch | Landing lag |
| Eligible directional dodge beside ledge, outside floor | Ledge catch | Continue dodge |
| Eligible directional dodge below ledge | Vulnerable ledge approach | Continue dodge |

Early side and up-in dodges did not land on the seeded contact tick because their travel was horizontal or upward. After the travel phase, falling could land regardless of captured angle. At the edge, the start-of-tick ledge query runs before movement and can win over a floor crossing that would otherwise happen that tick. A direct catch and a floor landing restored the air dodge. The vulnerable approach granted no aerial resources or occupancy until catch. Landings ended dodge intangibility and counted as the first recovery tick, with authored totals from 14 to 19 in this fixture set.

Another 240 soft-platform controls confirmed that ordinary falls and neutral dodges pass through with Down held and land on release. All 120 ledge release sequences delayed capture while Down was held and resumed the catch or approach when it was released in range. A separate 360-case sweep started straight-down and both downward-diagonal dodges through ordinary Shield input. Every run landed on the selected soft platform at the same dodge age with Down held and released. Fresh versus fully fatigued travel changed the contact age from 6 to 7 for straight down and from 7 to 9 for diagonal input in that fixture.

The [Ultimate ledge measurements](https://w.atwiki.jp/smashsp_kensyou/pages/34.html) support Down suppressing ledge grab and directional eligibility from action frame 25. The [landing measurements](https://w.atwiki.jp/smashsp_kensyou/pages/136.html) describe landing recovery without establishing directional pass-through while Down is held or a simultaneous floor/ledge tie. This pass records current project behavior and changes documentation only. Directional soft-platform pass-through, same-tick floor/ledge priority, and the native directional recovery endpoint remain provisional.

**Resume here.** Audit fresh through fully fatigued dodge windows, spot cancel and travel, and the refresh clock after floor landing, ledge catch, and body-hit interruption. Start with the project Dojo matrix across all five fighters and use measured native fixtures only where the versions and conditions are known.

## Grounded grabs and main-platform contact

A grounded grab used the holder's center height for both fighters. Swift's collision radius is 26 world units and Abe Lincoln's is 32, so a Swift grab placed Lincoln's feet six units inside the solid main platform. Main-platform landing checks require a crossing from above, which cannot catch a victim who starts below the surface. On low-percent down throws the victim could fail to rise clear of that overlap and fall to the bottom blast zone. A pummel followed by grab timeout could produce the same symptom. The authored down throw launches upward.

Grab contact, held position, and pummel contact now use the victim's own collision radius to align their feet with the grounded holder's. The horizontal grab offset, airborne grab positioning, and throw launch values retain their existing behavior. The fix changes the position before the throw resolves, so the ordinary floor crossing still handles the landing.

| Center-stage sequence | Replays before fix | Bottom KOs before fix | Replays after fix | Bottom KOs after fix |
| --- | ---: | ---: | ---: | ---: |
| Grab into down throw | 300 | 120 | 300 | 0 |
| Grab, pummel, then timeout | 300 | 96 | 300 | 0 |
| Grab, pummel, then down throw | — | — | 300 | 0 |

The low-percent matrix used all 25 ordered fighter pairings, both facings, and all six main platforms. Every grab connected. After the fix, none of the 900 cases placed the victim below the surface. Twelve separate forward throws at 180% still carried the victim past the stage edge and took a stock. The committed regression covers both facings, smaller and larger grabbers, and a pummel before a down throw.

## Grab windup and platform crossing

A follow-up report reproduced the drop with human and CPU grabbers. The first fix aligned mixed-size fighters when a grounded grab connected. During throw startup, the holder entered its attack state and the victim stopped being pinned. At the ledge, a victim held just outside the lip fell before release. An inward back throw could then send the victim underneath the main platform. In a separate CPU replay, the victim's Attack and retained fast fall moved them during throw startup. Reconstructing the previous foot position from velocity could also round it slightly past the surface and miss the collision.

The victim now stays attached through pummel and throw startup, with independent actions and falling suspended until release. An interrupted holder releases the victim. Platform collision uses the previous position for tracked launches and tolerates floating-point error at exact surface contact.

- Replayed 288 near-ledge sequences across six stages and both sides. Before the fix, the victim sank during startup in 240 replays. After the fix, none sank while held and none of these low-percent replays lost a stock.
- Replayed 900 center-stage grab, pummel, and down-throw sequences across the full roster and six stages. All stayed at or above the surface while held, with zero stock losses.
- Replayed 450 seeded matches with CPU input. The original grab-through-floor trace no longer occurred. One remaining apparent crossing near a recent grab was a later ledge snap, with neither fighter grabbed on that tick.
- Automated regressions cover inward ledge throws on both sides, grab interruption, and exact floor contact versus an approach from below.
