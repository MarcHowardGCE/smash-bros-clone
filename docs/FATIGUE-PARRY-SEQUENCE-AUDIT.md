# Fatigue parameters and consecutive-parry audit

## Current project baseline

Directional air dodge uses captured fatigue for travel. Body hits can refresh a spent air dodge while double jump stays spent. The project models separate hit waves and tracks right-stick and face Attack releases independently in the Dojo. The current smash charge uses the combined Attack hold. Exact fatigue conversion, adjacent-hit parry exceptions, and native input priority remain provisional. [Air-dodge motion](../packages/engine/src/physics/airDodgeMotion.ts) · [Mixed-input trace](#dojo-trace-for-mixed-input-charge) · [Native capture checklist](REFINEMENT.md#ultimate-1305-capture-checklist)

## Dated tests and implementation notes

November 5, 2026. This supersedes the temporary fatigue curve and the broad automatic-parry backlog wording in OOS-DODGE-PARRY-REFINEMENT.md.





## Current production multihit follow-up

The next actionable engine step is now implemented: the shared up-smash, already described as multihit in `MoveData.ts`, has actual independent hit waves for all three fighters. This is an authored Everybody Throws Hands moveset change, **not a claim that these custom fighters reproduce Mario/Ganondorf/Fox up-smashes**.

### Behavior

- Startup/active/recovery remain 12/5/22, charge limit 60, and geometry remains offset (0, -55), radius 32. Active frames 0–1 form setup group 0; frames 2–4 form finishing group 1.
- Base damage is split 4 + 12, retaining the prior 16-point full-connect budget. Setup knockback base/growth are zero; finisher uses the former launch parameters (base 10, growth 95, angle 80). Actual combined knockback/advantage differs from the former single hit and needs human balance review. There is no guaranteed autolink: spacing and SDI can cause the finisher to miss. Late entry can hit only the finisher.
- Charge scales both waves. Existing artwork is reused with the real hitlag/action clock; no source sprite or ordinary movement/reach tuning changed.
- First contact now captures a move-instance stale multiplier before the move inserts itself into history. Subsequent waves use it, preventing self-staling within one use. Queue insertion stays once per contacted victim. New actions, jab links, recovery and respawn clear the multiplier with contact history. Repeated independent uses still stale normally.
- Free Practice has a new **Telegraphed two-hit up smash** partner option in setup and the in-arena behavior cycle. It closes to anti-air range and sends one explicit up-smash input per 150-tick cycle, telegraphed at tick 90. Position yourself within its upward reach; this is not an artificially enlarged standing shield test. Recorded routines still take precedence.

### Validation and remaining work

Production-data tests cover all three fighters, charged/uncharged two-contact body hits, held-shield waves, unchanged geometry/timing, damage split and stale-ledger cleanup. Engine tests cover cached multipliers versus a new stale use. Partner tests verify explicit smash intent and nonrepeating input edges.

Passed: engine 1,042 / 1 existing skip; server 454 / 16 existing skips; client 674. Workspace production build passed. Browser check selected the new partner, observed a real `UP_SMASH`, and passed speed/freeze/step, collision overlay, recording/replay, controller stepping, saved slots and cleanup. Logs: task workspace `work/up-smash-{engine-final,server,client-final,build-final}.log`; browser script `work/check-dojo-up-smash.cjs`.

The native timing research did not establish remaining current-version fatigue/motion-rate/landing values. HDR's custom status replacements cannot be treated as vanilla implementations, and secondary stale tables are not promoted to primary fixtures. Existing provisional timing and narrow-parry-exception gaps remain open; no additional estimated timing changes were made in this pass. Next: human review of this two-hit move, then intentional additional multihit authoring alongside verified native-profile work.

## Current air-dodge movement follow-up

This section supersedes the stale-flight and air-dodge-ledge limitations described in earlier entries. Exact Ultimate parity remains incomplete.

- Directional travel now uses the captured `dodgeLevel`, rather than ignoring fatigue. The [original research](https://w.atwiki.jp/smashsp_kensyou/pages/32.html) gives standard-fighter fresh/stale speed 4.2/2.8 and distance 20/13.3333: a two-thirds endpoint ratio. The game's accepted fresh pixel speed/window are retained (6 px/tick for ten travel ticks); level five uses 4 px/tick. Levels 1–4 linearly interpolate the ratio: **a project approximation, not a verified native curve**. The source is a 2021 observation, not current-release certification. No direct game-unit-to-pixel conversion is asserted.
- Directional travel endpoints are shared by these three reference fighters; neutral-air drift is unchanged. Travel phase timing, post-travel damping/gravity and native velocity integration remain custom. Directional and neutral recovery durations are unchanged.
- Actual body hits restore a spent air dodge. Shield blocks, parries and intangible contacts do not grant that restoration; double jump remains spent. This agrees with the original research and is corroborated by [HDR's explicit patch removing vanilla hit-based air-dodge refresh](https://github.com/HDR-Development/HewDraw-Remix/blob/pre-release/fighters/common/src/function_hooks/mod.rs). The mod's replacement movement is not used as vanilla evidence.
- The server previously excluded all AIR_DODGE states from ledge capture. It now permits directional capture from human frame 25 (zero-based 24), using a guard shared with the geometric ledge query. Neutral and early directional air dodges remain blocked. Ledge capture restores the resource and starts the refresh clock as before.
- Landing recovery remains fatigue independent. The 11–19 directional interpolation is still provisional; exact descent-based/native scheduling remains open. No additional landing-speed injection was added.
- Dojo readout now displays air-dodge ready/spent and the captured fatigue of a current dodge separately from recovering fatigue history.

Focused tests cover captured history versus live history, both facings/diagonal travel for all three fighters, fresh/max displacement, ledge boundary gating, body-hit restoration without double-jump restoration, blocked/immune hits, and fatigue-independent directional/neutral landing recovery. Existing profile, parry, interruption and multihit tests remain in the regression gate.

Validation: engine 1,041 passed / 1 existing skip; server 444 passed / 16 existing skips; client 673 passed. Workspace build passed; the final readout was followed by another client build and two focused panel tests. Browser lab checks passed for six fatigue presets, speed/freeze/step, collision overlay, recorded routines, controller stepping, persistence and cleanup. Logs: task workspace `work/air-motion-{build,server,engine,client}.log`, `work/air-motion-client-build-final.log`.

Next: verify native intermediate travel/landing calculations and remaining profile fixtures; obtain current-version evidence for narrow parry exceptions; author intentional production multihit waves. Human feel signoff remains pending.

## Current follow-up: intermediate observations and full-loop contacts

This section supersedes the earlier backlog and refresh-clock descriptions below. Earlier sections remain as historical evidence.

### Changes

- `physics/dodgeProfiles.ts` now includes the original research team's [2021 dodge observations](https://w.atwiki.jp/smashsp_kensyou/pages/32.html): All-Rounder/Mario intermediate ground, neutral-air and horizontal-air windows, plus Swift/Fox first-stale comparisons. These replace interpolation where observations exist. The source's third fighter is Bowser; its data must not be assigned to Abe/Ganondorf. Nonhorizontal stale-air windows retain the previous provisional model.
- Older source discrepancies remain explicit: Mario's older maximum back-roll total is 51 versus 52 in the later 13.1 sheet; its older fresh neutral-air ending is 30 versus 29 in the later reference. The later endpoints remain authoritative for this project. The 2021 measurements are observations, **not certification against the current release**.
- Dodge direction is resolved once consistently for fresh profiles, maximum endpoints, duration scaling and animation. An inferred backward roll no longer accidentally receives forward-roll maximum timing.
- Inferred duration arithmetic now evaluates integer percentage numerators without an epsilon correction. This removes floating-point boundary adjustments from the project model; it does **not establish the native motion-rate algorithm**. Invalid/fractional fatigue levels normalize safely. Spot cancel remains separately calculated; its intermediate rounding is still inferred. The source endpoints remain explicit rather than forcing a fixed five-tick gap.
- Refresh now starts on air-dodge landing or directional ledge capture. A hit-interrupted dodge preserves a pending refresh through hitlag and starts it at thaw, including while airborne/in hitstun. This follows the original research observations and corrects the previous wait-until-actionable policy. Landing action lockout and buffered actions are unchanged. Exact native boundary/version validation remains open.
- Full `tickGame` tests now run one move instance through three waves, both without freeze and with real calculated hitlag. Separate tests cover held-shield contacts, ledger cleanup after recovery, and a first parry followed by ordinary blocks from the same move. Earlier tests had selected frames and invoked collision directly; those tests remain useful but were insufficient to demonstrate the full pipeline.

### Status against the five requested items

| Item | Status | Still needed |
| --- | --- | --- |
| Per-fighter fresh/stale windows and spot cancel | Fresh profiles and All-Rounder max endpoints already present; intermediate All-Rounder and first-stale Swift observations now used; all configured protection/cancel/recovery boundaries tested | Current-version intermediate/max fixtures for Abe and remaining Swift levels; independently measured spot-cancel rounding |
| Native motion-rate conversion and integer rounding | Project arithmetic is deterministic and explicit | Native motion/status data and per-frame conversion evidence; do not describe the normalized model as exact |
| Air profiles, stale motion, landing and interruption refresh | Existing fresh directional/neutral profiles retained; observed intermediate neutral/side windows added; landing, ledge and hitlag interruption clocks fixed | Stale flight speed/distance, landing interpolation, nonhorizontal stale windows, current-version refresh certification |
| Parry restrictions and narrow exceptions | Existing post-stun three-held-tick restriction and one-release policy retained and regression tested | Current-version primary evidence for adjacent-hit exceptions; no broad auto-parry added |
| Multiple-hit scheduling | Engine supports independent groups and interval rehit; full-loop body/shield/hitlag tests now verify it | Intentionally author and balance production move waves; simultaneous multiple hitboxes/projectiles remain a separate capability |

Validation for this follow-up: engine 1,038 passed / 1 existing skip; server 426 passed / 16 existing skips; client 673 passed. All workspace production builds passed. Browser checks passed for all six fatigue presets, lab speed/freeze/step, collision overlay, recording/replay, controller stepping, saved slots, guided jab/parry three-repetition completion, persistence and exit cleanup. Logs: task workspace `work/defense-followup-*-verified.log`, `work/defense-followup-client.log`; browser scripts `work/check-dojo-fatigue.cjs`, `work/check-dojo.cjs`.

Human feel signoff remains pending. Use the dojo fatigue selector and freeze/step tools to compare profiles. This update changes no ordinary movement, reach, launch tuning, source artwork or controller bindings.

## November 5 follow-up: measured endpoints, landing recovery and hit groups

This follow-up supersedes the older implementation totals and exit-clock wording below; the earlier section records the prior audit.

The [original patch 13.1 frame-data research sheet](https://docs.google.com/spreadsheets/d/16fmsoqDoQaR1eteVk2uuzIH2DB4iQHVrqiG8VRbRA7Q/htmlview/sheet?gid=123650910&headers=true) explicitly reports Mario maximum-fatigue endpoints. All-Rounder now uses those observations: spot invulnerability 6–17, attack/full totals 27/33; forward roll 8–14, total 38; backward roll 9–14, total 52; neutral air 6–27 with unchanged total; horizontal directional air 6–20 with unchanged total. Source windows are human inclusive; engine start indices subtract one. Fixtures: `packages/engine/src/physics/dodgeEndpoints.test.ts`.

Levels 1–4 interpolate the measured bounds and use inferred duration rounding. They are **not native-frame certified**. Abe/Swift maximum-fatigue endpoints and nonhorizontal directional windows also remain provisional. Directional flight speed/distance still uses the existing custom motion.

All air-dodge landings now enter landing recovery, including neutral and horizontal dodges. Neutral recovery is 10 ticks; directional recovery uses 11–19 ticks with a provisional progress interpolation. The source confirms variable early-landing recovery, maximum 19 and no fatigue effect; it does not certify this interpolation. Removed the artificial diagonal landing-speed injection. Natural directional-flight momentum remains. Buffered actions wait for recovery; the separate 60-tick refresh starts when landing recovery becomes actionable. Hits interrupt pending landing refresh. Other interruption-specific native refresh rules remain open.

Shieldstun now re-arms the project's three-held-tick parry eligibility lock. Immediate release after stun cannot parry; jump and other eligible out-of-shield actions remain available. This fixes a consistency gap, not certification of every native parry exception. One successful parry per release remains the rule. Narrow adjacent-hit exceptions remain unresolved.

`HitboxData.hitGroup` supports independently contacting waves within one move. Optional positive `rehitFrames` permits repeated contacts on an action-frame interval. Each victim/group has a contact ledger; frozen ticks cannot reopen the interval. New actions and jab links reset the ledger. Repeated waves against the same victim do not add duplicate stale-history slots. Authoritative fixture tests exercise actual hitbox-frame selection and collision application. **Production fighter moves have not been reauthored into multihit waves in this update.**

The dojo Lab now offers **Next dodge fatigue: N / 5**. Cycling it resets the arena and sets both fighters' next-dodge history to 0–5. History continues recovering normally; freeze/frame-step allows precise comparison. This is practice-only and does not change an already captured dodge level.

Validation: engine 1,034 passed / 1 existing skip; server 402 passed / 16 existing skips; client 673 passed, with the updated panel's two tests rerun afterward. All workspace builds passed. Browser lab checks passed for speed, freeze/step, collision overlays, recording, replay, controller stepping and persistence. Human feel signoff remains pending: the user will test after this update.

Remaining priorities: human comparison of all three fighters; measured intermediate/max-fatigue fixtures for the other profiles; directional stale travel and native landing interpolation; interruption-specific refresh rules; narrowly sourced parry exceptions; intentional per-move multihit authoring.

## Findings that changed the plan

[Nintendo's 3.0.0 fighter adjustments](https://en-americas-support.nintendo.com/app/answers/detail/a_id/45075/~/super-smash-bros.-ultimate-update-ver.-3.0.0---fighter-adjustments) explicitly changed repeated parries from one shield release. Broad automatic re-parrying would therefore reproduce obsolete behavior. The normal rule remains one successful parry per release. Deliberate consecutive releases are now covered by authoritative tests.

The original parameter editor's [published common.prc changes](https://gamebanana.com/mods/38616) identify a five-level maximum, 120-tick recovery clock, 60-tick post-dodge timer, 0.06 spot/forward-roll parameter and 0.10 backward-roll parameter. That publication concerns its contemporary game version, not a complete current-version implementation. Its fighter motion data also makes clear that air-dodge speed/distance and invulnerability are fighter-specific. These parameters support replacing the prior universal +2 ticks per level; they do not establish every rounding or profile rule.

## Implemented

- Shared history still covers spot dodges, forward/backward rolls and air dodges. The current dodge snapshots its level; later history recovery does not alter that dodge's timing.
- Ground recovery now uses the documented directional coefficients. Normalized project duration is ceil(base duration times (1 + coefficient times level)). This mapping is an explicit implementation inference, not a verified vanilla rounding routine. At level five, the current 25-tick spot dodge takes 33 ticks, the 20-tick forward roll takes 26, and the 20-tick backward roll takes 30. Fresh durations are retained.
- Added a separate one-shot 60-tick refresh clock armed when a dodge exits, alongside recurring 120-tick recovery from dodge start. Starting another dodge restarts both clocks. Both clocks pause during hitlag; respawn clears them. Interrupted and landing-specific actionability are not yet matched to vanilla scheduling.
- Roll direction is captured relative to facing on entry. Fatigued ground sprites play on the normalized animation timeline. Roll travel is spread across that timeline with the same total distance, rather than moving at full speed then holding the recovery drawing.
- Air dodge still contributes to shared history but no longer receives the prior unsupported +2-ticks-per-level recovery extension. Directional air-dodge speed/distance fatigue remains open; its existing movement is preserved.
- Holding shield through a successful parry re-raises it on thaw without an extra idle tick. This starts a new shield hold and resets the consumed release marker. A later eligible release can parry another contact. Releasing too early after that raise remains ineligible.
- A second contact from the same consumed release does not become another parry. No broad automatic re-parry, projectile reflection or special multihit exception was introduced.

## Verification

Engine suite: 987 passed, one existing skip. Server suite: 355 passed, 16 existing skips. Client suite: 590 passed. Shared/engine builds and server/client production builds passed. The final renderer-adapter field wiring was followed by five focused main tests and a fresh client build.

New checks cover all six fatigue levels, the two independent clock boundaries, clock restart, captured forward/backward direction, constant roll distance, one-release consumption, re-raise on thaw, separate timed successful releases, premature re-release and body vulnerability after parry exit. The sequence tests apply authoritative contacts; they do not introduce new rehit scheduling to move data.

The production browser passed a simulated-controller sequence: fresh spot dodge followed by a level-one backward roll. Evidence: task workspace outputs/defense-timing-v1/defense3-browser.json. Suite logs: work/defense3-engine.txt, defense3-server.txt and defense3-client.txt.

## Exact Ultimate parity remains incomplete

The request for exact fatigue tuning is only partially fulfilled. Published parameters replaced the arbitrary coefficient curve, but exact vanilla parity is not certified. Remaining work requires current-version fighter motion profiles and a verified frame/animation rounding reference:

1. Per-fighter fresh/stale intangibility bounds, forward/backward durations and spot-dodge cancel scheduling. Existing custom intangibility narrowing remains unchanged; the spot cancel still shifts with full recovery and retains its project five-tick gap.
2. Exact motion-rate conversion and integer rounding. Current normalized duration arithmetic is a documented inference.
3. Directional and neutral air-dodge profiles, stale distance/speed, landing lag and refresh scheduling when interrupted or landing early.
4. Post-shieldstun parry restrictions and any narrow adjacent-hit exceptions, validated against current-version primary evidence. Nintendo's general one-release rule is established; exceptions are not yet modeled.
5. True multiple-hit scheduling within one move instance. Current contact history normally prevents the same move instance from hitting a victim twice; the consecutive-release tests use successive authoritative contacts. Adding broad automatic parries would not solve that separate engine gap.

The next useful step is a small verified fighter-profile fixture with frame-by-frame fresh/stale observations, then replacing the remaining custom windows against that fixture. Human controller testing is still needed. Accepted ordinary movement, launch tuning, reach, source sprites and logo are retained. No environment files or bonney content were inspected.


## Five-fighter fatigue and recovery audit

The browser Dojo passed 270 complete dodge traces, 30 spot-cancel checks, and 240 recovery traces. The five fighters each tested entry ranks zero through five. The complete traces used spot dodge, both rolls, neutral air dodge and five directional air-dodge categories. Grounded traces started through Shield input. The aerial traces used normal Shield input and held the fixture clear of floors and ledges so each action could run to its full duration. Intangibility was sampled through the actual damage-immunity query. The spot-cancel probe tested the last blocked tick and the first accepted Attack tick.

Dodge entry captured the current rank, incremented the shared history with a cap of five, and started the regular 120-tick clock. Both rolls traveled 48 world units at every tested rank. Directional travel measured 60, 56, 52, 48, 44 and 40 units through ranks zero to five. Air-dodge action duration stayed fixed for each direction while the protection window changed. These observations verify project behavior. The intermediate travel values and unmeasured fighter-specific endpoints remain provisional.

| Fighter | Spot duration, fresh → max | Forward roll, fresh → max | Backward roll, fresh → max | Spot attack cancel, fresh → max |
| --- | ---: | ---: | ---: | ---: |
| All-Rounder | 25 → 33 | 29 → 38 | 34 → 52 | 20 → 27 |
| Abe Lincoln | 28 → 37 | 32 → 42 | 37 → 56 | 23 → 30 |
| Swift | 23 → 30 | 26 → 34 | 32 → 48 | 18 → 24 |
| Moonshine | 23 → 30 | 26 → 34 | 32 → 48 | 18 → 24 |
| Hulk Hoagie | 28 → 37 | 32 → 42 | 37 → 56 | 23 → 30 |

The baseline ledge path armed the one-shot clock at catch but skipped updates during the forced catch. It took 78 ticks to drop the first rank. The fix advances the regular clock during approach, advances both live clocks during forced catch, and starts the one-shot clock on the successful catch. An interrupted approach still waits for hitstop to end before arming the one-shot clock.

| Exit or interruption | When the one-shot clock starts | First rank drop after the clock starts |
| --- | --- | ---: |
| Neutral or directional floor landing | On floor contact | 60 |
| Direct or two-tick ledge catch | On successful catch | 60 |
| Body hit with 0, 4 or 8 ticks of hitstop | First unfrozen tick | 60 |
| Body hit during vulnerable ledge approach | First unfrozen tick | 60 |

The browser fixtures used the normal hit resolver for the body-hit input and verified that hitstop froze the running regular clock. The regular countdown continued independently and removed a further rank every 120 live ticks until zero. The two-tick approach neither armed the one-shot clock nor restored aerial resources before capture. The [published Ultimate dodge measurements](https://w.atwiki.jp/smashsp_kensyou/pages/32.html) document the 60-tick exit refresh, 120-tick rank countdown, and exit conditions. This pass leaves exact native motion rounding and the missing per-fighter stale intangibility windows open.

The focused server tests passed 134 checks with 13 existing skips. Engine build and client/server type checks passed.

**Resume here.** Record adjacent contacts after shieldstun in the Dojo. Compare a held shield, a new release, and an already consumed release for successive move instances and for separate waves of one move. Use current-version evidence before adding any narrow exception.


## Recorded post-shieldstun and adjacent parry audit

The browser Dojo passed 770 sequences across all five fighters. The 550 recorded partner tapes used the normal practice recorder and playback, all 25 ordered matchups, both facings, and production up-smash hitboxes. The other 220 sequences seeded adjacent contacts through the authoritative hit resolver to isolate timing and source identity.

| Recorded partner tape | Defender input | Result |
| --- | --- | --- |
| One up smash | Hold Shield | Block, block |
| One up smash | Parry the setup hit and stay released | Parry, body hit |
| One up smash | Parry the setup hit and rehold Shield | Parry, block |
| One up smash | Hold through the setup, then wait for a release 1–4 ticks after shieldstun | Both waves block before the intended release |
| Two up smashes | Fresh release on each setup hit and rehold for each finisher | Parry, block, parry, block |

The authored waves contacted on action frames 12 and 14. Their real separation was seven simulation ticks after a block and 18 after a parry. A release intended for the finisher after normal shieldstun never became available in the live tape. The separate-instance tapes also confirmed that releasing on only one setup hit parried only that setup.

The 160 controlled direct-contact sequences produced the same result for a second wave of one move and for a separate move instance. After an ordinary block, continuous Shield blocked. Releases on the first three live ticks after shieldstun allowed a body hit, while releases on tick four or five parried. After an initial parry, a continuous release did not create another parry. Reholding on the first live tick raised a new shield, and a fresh release could parry once that shield had reached its normal minimum hold. These fixtures placed the next hit on the specified tick to isolate release eligibility from attack travel.

The 60 additional probes used a third fighter, a detached projectile-tagged hitbox, or an attached projectile-tagged hitbox. In each category, contact was skipped while the defender remained frozen. A contact at thaw blocked ordinarily. On the following live tick it hit the body if Shield stayed released and blocked if Shield was reheld. No probe acquired an automatic second parry. The projectile tags were controlled fixtures and do not represent live item or projectile actors.

[Nintendo's 3.0.0 update](https://en-americas-support.nintendo.com/app/answers/detail/a_id/45075/~/super-smash-bros.-ultimate-update-ver.-3.0.0---fighter-adjustments) documents one perfect shield per release as the general rule. The [Ultimate shield measurements](https://w.atwiki.jp/smashsp_kensyou/pages/71.html) describe the first three ticks after an ordinary block and report narrow automatic cases for certain projectile, item, and third-party contacts. The measured direct behavior supports retaining the current release rule. The exceptions and their bounds still need version-matched verification. This pass updated documentation only. All 68 focused server shield and multihit tests passed.

**Resume here.** Measure parry hitstop, any remaining guardstun, and the first usable action for each side. Separate direct melee and projectile-tagged contact, then compare the clocks with measured native sequences before tuning the action boundary or introducing automatic exceptions.


## Parry hitstop, guardstun, and action timing

The baseline applied separate attacker and defender hitstop but set defender guardstun to zero. It also used a separate tick to leave shield before accepting a fresh non-shield action. The fix retains the guardstun already calculated for the hit, holds the consumed parry through both clocks, and routes fresh grounded actions on the first unlocked tick. The defender remains protected through the final locked tick. Holding Shield alone re-raises it on the same unlock boundary. Shield health, the one-release rule, and the hitstop formulas retain their existing behavior.

The browser Dojo passed 480 timing cases across all five fighters, both facings, two base damage values, and four defender actions. Each isolated probe used the authoritative hit resolver. The attacker returned to a neutral fixture after contact so the test could isolate the hitstop clock. The projectile categories were tagged hitboxes without live projectile actors.

| Contact type at 4 base damage | Defender hitstop | Attacker hitstop | Defender guardstun | First defender action | First neutral attacker action |
| --- | ---: | ---: | ---: | ---: | ---: |
| Direct melee | 13 | 16 | 5 | 19 | 17 |
| Indirect body hit | 4 | 13 | 5 | 10 | 14 |
| Attached, direct | 13 | 19 | 5 | 19 | 20 |
| Attached, indirect | 4 | 16 | 5 | 10 | 17 |
| Detached, direct | 13 | 0 | 2 | 16 | 1 |
| Detached, indirect | 4 | 0 | 2 | 7 | 1 |

Tick zero is contact. Jump, Attack, Special, and Shield all started on the first defender tick after the two sequential clocks. At 12 base damage, the direct melee fixture measured 17 defender hitstop, 20 attacker hitstop, and 12 guardstun. That made tick 30 the first defender action, versus tick 21 for the neutral attacker. These probes isolate the clocks and are separate from move recovery.

Another 100 recorded jab replays kept the attacker's actual recovery. All 25 ordered matchups and both facings compared ordinary block with parry. Parrying improved the defender's relative advantage by three ticks in every pair. For All-Rounder's jab, the defender and attacker first jumped on ticks 10 and 18 after a block, then on ticks 18 and 29 after a parry. The earlier 770 parry sequences were rerun. The recorded up-smash and separate-release outcomes reproduced. All 60 adjacent third-party and projectile-tagged probes now skipped contact during the protected period, including immediately after thaw while guardstun was still active.

The [Ultimate shield measurements](https://w.atwiki.jp/smashsp_kensyou/pages/71.html) describe unchanged guardstun following separate parry hitstop, protection during those clocks, and three additional advantage ticks for typical direct melee. The tagged hitstop formulas are still project behavior, especially for projectile ownership and multiplayer categories. The narrow automatic follow-up exceptions and expanded post-parry input buffer remain open.

**Resume here.** Record fresh, early-tapped, and held Jump, Attack, Special, Shield, and Grab across both clocks. Compare command retention, direction retention, and first execution against the reported post-parry buffer before changing its length.

## Post-parry action buffer

The [Ultimate input experiments](https://w.atwiki.jp/smashsp_kensyou/pages/111.html) measured a nine-tick ordinary tap window and a 20-tick extension after a perfect shield. The [shield experiments](https://w.atwiki.jp/smashsp_kensyou/pages/71.html) count the 30th tick as the action tick itself. The game now accepts Jump, face Attack, Special, and Grab beginning on the direct melee parry contact tick when it falls within that 29-tick lead. Earlier continuous holds qualify three ticks before unlock. A qualifying tap keeps its sampled direction, while an early hold uses the direction at the hold cutoff. Shield must still be held at unlock to re-raise. A fresh command at unlock supersedes a queued command under the project's input ordering.

The browser Dojo ran 660 controlled cases across all five fighters, both facings, six input types, and 11 timings. Before the change, recovery presses disappeared. After the change, a tap at minus 29 executed and one at minus 30 expired. A long hold released after minus three executed and one released after minus four expired. Queued upward face Attack and Special produced Up Tilt and Up Special on the first unlocked tick. The cases also checked Shield, Grab, fresh C-stick, and that no action started early. A match-server regression exercises a real melee hitbox contact with Attack pressed on the contact tick.

Queued C-stick direction expiry and native priority for competing commands remain provisional. The Dojo runs exercise the project simulation with automated inputs. Exact Ultimate 13.0.5 behavior still needs native capture evidence.

**Resume here.** Trace tilt and smash C-stick rearm and direction expiry around parry recovery in the Dojo, including face-button overlap and changes of aim after the right-stick edge. Use the published measurements to choose the next supported rule.

## Post-parry right-stick trace

The browser Dojo ran 600 cases. The matrix covered All-Rounder, Abe Lincoln, Swift, Moonshine, and Hulk Hoagie, both facings, both right-stick modes, and 30 sequences per mode. A simulated Xbox 360 pad went through the browser gamepad poller, calibration, and input manager. The Dojo trace logged presses and move starts against a controlled parry with 16 hitstop ticks and eight guardstun ticks. Contact was tick 0 and the first actionable tick was tick 25. The table expresses inputs relative to that first actionable tick. Results agreed across the roster and no attack started during recovery.

| Input sequence | Tilt mode | Smash mode |
| --- | --- | --- |
| Right-stick up tap or hold from contact, hitstop, or guardstun | No attack, including at −2 and −1 | No attack, including at −2 and −1 |
| Fresh right-stick up on unlock or one tick after | Up Tilt on the input tick | Up Smash on the input tick |
| Sweep up to down, or relax to 0.4 raw deflection and push again without reaching neutral | No second press | No second press |
| Return to neutral, then push down at −1 | Second press logged and discarded during guardstun | Second press logged and discarded during guardstun |
| Return to neutral, then push down on unlock | Down Tilt on unlock | Down Smash on unlock |
| Push opposite the fighter's facing on unlock | Forward Tilt with facing reversed | Forward Smash with facing reversed |
| Hold right-stick up, then press face Attack with left-stick down at −3 | Down Tilt on unlock | Down Tilt on unlock |
| Start face Attack with left-stick up in hitstop, then keep Attack held and flick right-stick up with left-stick down at −3 | Down Tilt on unlock. Face-only control produced Up Tilt. | Down Tilt on unlock. Face-only control produced Up Tilt. |
| Press face Attack and right-stick up together with left-stick down in hitstop or guardstun | Down Tilt on unlock | Down Tilt on unlock |
| Same overlap on unlock, or a fresh right-stick flick on unlock after a queued face Attack | Up Tilt on unlock | Up Smash on unlock |

A right-stick-only flick one tick early appears in the Dojo trace as an Attack press on tick 24, followed by Idle on tick 25. After a neutral reset, a down flick on tick 25 appears on the same trace line as the move start. The client emits right-stick axes on the press tick. The parry buffer discards right-stick-only presses during either lock and drops the right-stick axes when replaying a press tagged as face Attack. The overlap case with face Attack already held shows that the shared Attack bit and face-held flag can make a new right-stick edge overwrite a queued face command. Those paths explain the different outcomes during recovery and on unlock.

The published [Ultimate right-stick experiments](https://w.atwiki.jp/smashsp_kensyou/pages/31.html) report a neutral reset, a synthetic direction lasting up to three frames in tilt mode and four in smash mode depending on hold length, and separate treatment of a smash input while face Attack is held. The same experiments distinguish a buffered move from its direction. For buffered side attacks, left-stick input may determine facing after right-stick direction expires. The [Ultimate buffering experiments](https://w.atwiki.jp/smashsp_kensyou/pages/111.html) document the expanded parry action window separately. These sources do not establish the exact ground-parry expiry boundary, same-tick priority, or patch-specific behavior for 13.0.5. The Dojo used simulated hardware inputs. This was an audit pass with no gameplay changes.

**Resume here.** Separate fresh face Attack from a right-stick edge in the input trace and parry queue. Then validate queued move retention separately from the temporary direction using one-frame taps and multi-frame holds around unlock, with opposing left-stick aim and with face Attack already held. Preserve neutral rearming and the existing face-button buffer. Keep the exact 13.0.5 overlap order and expiry boundaries provisional until supported by a native capture.

## Queued right-stick attacks after parry

The parry buffer now distinguishes a fresh face Attack press from a right-stick edge. That distinction also survives Dojo recording and the match server's latest-attack packet merge. An eligible tilt or smash uses the existing 29-tick parry tap window. Earlier stick holds qualify if still held three ticks before unlock. A tilt flick while face Attack is already held leaves the queued face command alone. A smash flick can queue separately and supersede it under the project's existing latest-command policy. When both edges arrive on the same sample, the project selects the right-stick move. Multiple attack samples within one server tick still use the latest sample.

The queue keeps the selected move when its temporary right-stick direction expires. Direction lasts while the stick remains active, capped at three ticks for tilt and four for smash, counting the press tick. Once the direction expires, a queued side attack uses the live left-stick direction. With neutral horizontal input it keeps the fighter's facing. Up and down attacks keep their selected move. The Dojo also exposed a later facing update that overwrote the direction already chosen for a side attack. Grounded forward tilts and forward smashes now keep their startup facing through the attack.

| Dojo probe | Tilt mode | Smash mode |
| --- | --- | --- |
| One-tick right-stick tap at −29 | Queued tilt starts on unlock | Queued smash starts on unlock |
| Tap at −30, or release an early hold before −3 | No move | No move |
| Hold a side flick against opposing left-stick aim from −2 | Right-stick facing | Right-stick facing |
| Hold a side flick against opposing left-stick aim from −3 | Left-stick facing | Right-stick facing |
| Hold a side flick against opposing left-stick aim from −4 | Left-stick facing | Left-stick facing |
| Release the right stick on unlock | Side move starts with left-stick facing | Side move starts with left-stick facing |
| Flick up while face Attack is already held with a queued Down Tilt | Down Tilt survives | Up Smash starts |

The browser Dojo passed 860 cases across all five fighters, both facings, and both stick modes. The trace used simulated Xbox inputs, sampled from a controlled parry with unlock at tick 25 or 37. The cases covered the contact tick, tap and hold boundaries, rearming, overlap, and facing through active side hitboxes. The prior 550 non-right-stick parry cases also passed. The engine and server suites passed, along with the focused client input and Dojo tests. The full client run reported six failures in the local-play flow suite. Its KO presenter mock lacks the method called by the local-play flow.

The [Ultimate right-stick experiments](https://w.atwiki.jp/smashsp_kensyou/pages/31.html) support separating buffered move selection from temporary direction and distinguish tilt from smash when face Attack is held. The [Ultimate buffering experiments](https://w.atwiki.jp/smashsp_kensyou/pages/111.html) support the expanded action window. The exact 13.0.5 ground-parry boundaries and same-tick command priority remain provisional. The current implementation uses the published direction caps as project timing.

**Resume here.** Replay the same tap, hold, rearm, and face-overlap sequences through a live two-client match. Compare packet batching against Dojo playback and check whether releasing a buffered smash gives the same startup and charge timing in both paths. Keep the native overlap order provisional.

## Two-client right-stick replay

The audit opened a normal online room over loopback with two Socket.IO clients and completed ready, character select, and stage confirmation. It replayed inputs sampled by the actual Xbox controller input path using the production client encoder. The same inputs went through the direct Dojo simulation and the Dojo routine recorder and player. A controlled parry isolated input timing and charge from attack travel. In the 1,280 tick-aligned WebSocket cases, the harness waited for both packets before each server tick and checked that both clients received identical authoritative snapshots. Another 12 cases ran on the normal 60 Hz match clock. No input missed its intended tick in that paced sample. The clients were driven by a harness with simulated Xbox inputs on the same computer.

The first live pass exposed a wire issue. MessagePack encoded unset optional fields as null, which the server rejected. The client now omits unset fields when sending input. The network regression verifies that a smash packet retains false and true values where present and that an unset controller field is absent on the wire.

The 960 one-sample-per-tick cases matched direct Dojo input for move, first action tick, facing, first active hitbox, charge, and hitbox damage across five fighters, both facings, and both stick modes. Dojo **recorded** playback agreed in 940 of those cases. The 20 differences were all the same sequence. A partial release followed by deflection outside the deadzone restored the held Attack bit without a real right-stick press. The recorder's player inferred a new Attack press from that bit and started Jab. Direct input and online both retained the original Up Tilt or Up Smash.

The other 320 tick-aligned cases compared two packets drained in the same tick with the same packets delivered in adjacent ticks. A right-stick flick followed by a neutral sample in the same server tick retained the attack edge. In tilt mode, a face Attack sample followed by a right-stick edge while face Attack stayed held lost the face command when the two samples landed in one tick. The same order across separate ticks produced Down Tilt. This reproduced during guardstun and on unlock. A simultaneous face and right-stick press in one sample produced the stick move in both modes. A later smash edge could replace the face command. The paced sample reproduced the two-packet face-then-stick outcome in both modes.

All five fighters produced the same Up Smash timing for the charge probes. Tick 0 is the first actionable tick after parry.

| Input | Move starts | Charge accumulated | First active hitbox |
| --- | ---: | ---: | ---: |
| Tap during guardstun or release the hold on unlock | 0 | 0 | 12 |
| Hold and release on tick 4 | 0 | 3 | 15 |
| Hold and release on tick 9 | 0 | 8 | 20 |
| Release the stick on tick 4 while face Attack stays held until tick 9 | 0 | 8 | 20 |

The overlap result follows the project's shared held Attack bit for charge. These are loopback project results. Physical-controller timing, real-network jitter, and Ultimate 13.0.5 command priority and charge behavior still need separate evidence.

**Resume here.** Preserve the earlier face Attack when the later right-stick tilt edge is ineligible in the same server tick. In Dojo playback, keep recorded Attack edges authoritative so partial deflection cannot invent a press. Rerun both packet orders, simultaneous overlap, neutral rearming, and the charge release matrix on the normal match clock.

## Same-tick Attack and recorded rearm fixes

When a fresh face Attack and a later tilt-only flick arrive in the same server tick while face Attack remains held, the server retains the eligible attack sample and its aim. Live movement still comes from the newest packet. A later smash flick or a sample containing both fresh edges remains eligible under the project's existing ordering. The server reconstructs aim itself, including when the input queue is compacted. Dojo playback now uses the recorded Attack press bit. The partial-release sequence restores the held bit without creating a Jab, and a genuine press after neutral still rearms the stick.

The two-client loopback rerun passed all 1,280 tick-aligned cases across five fighters, both facings, and both stick modes. All 960 single-sample cases now agree between direct Dojo input, Dojo recordings, and the server for move, first action, facing, first active hitbox, and charge. The other 320 compare batched packets with packets on adjacent ticks. In tilt mode, a Down Tilt face press followed by an ineligible right-stick flick now starts Down Tilt on unlock whether the batch arrived during guardstun or on the unlock tick. A distinct earlier face press followed by a smash in the same batch can still start Up Smash. An input received after the first actionable tick cannot change the attack already started there.

Another 115 cases ran on the normal 60 Hz match clock across all five fighters. No inputs missed their scheduled tick in this loopback sample. These covered neutral rearm, partial release, both overlap orders, simultaneous presses, and five smash charge schedules. Releasing Up Smash at unlock, tick 4, or tick 9 still gave its first active hitbox at ticks 12, 15, and 20. If face Attack stayed held after the stick released, charge still followed the combined Attack hold. All 59 focused server tests, 23 focused client tests, and client and server type checks passed.

**Resume here.** Isolate which input owns smash charge after a right-stick start, including release of the stick while face Attack stays held and the reverse release order. Compare raw input, Dojo recordings, and two-client play with deliberately delayed packets. Treat exact Ultimate 13.0.5 behavior as provisional pending versioned evidence.

## Smash charge release with mixed inputs

The current game uses the combined held Attack bit for smash charge. Releasing the right stick while face Attack remains held keeps charging. Releasing face Attack first also keeps charging if the right stick remains held. Charge stops when the simulation observes both controls released. A newly pressed Attack edge skips charging on that tick, which is why joining with face Attack after the smash starts produces one fewer charge tick in the last row below.

The Dojo opened in the browser and compared simulated Xbox input with recorded routine playback. The 100 runs covered five fighters, both facings, five release patterns, and direct and recorded playback. A buffered right-stick Up Smash began on tick 0, the first actionable tick after parry, in every case.

| Right-stick release | Face Attack release | Accumulated charge ticks | First active hitbox |
| ---: | --- | ---: | ---: |
| 4 | 9 | 8 | 20 |
| 9 | 4 | 8 | 20 |
| 4 | 4 | 3 | 15 |
| 4 | Face Attack unused | 3 | 15 |
| 4 | 9, after pressing face Attack on tick 2 | 7 | 19 |

The two-client loopback matrix used the production client encoder and match server. All 350 tick-aligned cases and 75 cases on the normal 60 Hz match clock agreed with the expected delivery schedule. Both clients received identical authoritative snapshots. A release delay was applied to the defender's packet dispatch while the partner continued to send normally. The ordered tests held subsequent samples behind the delayed release and delivered them in sequence. The isolated tests delayed just one sampled state and let newer full-state samples reach the server first. These isolated tests simulate application-level stale input. The WebSocket transport still preserves delivery order for the packets as sent.

| Delay pattern with the two releases scheduled at ticks 4 and 9 | Server sees both up | Charge ticks | First active hitbox |
| --- | ---: | ---: | ---: |
| No delay | 9 | 8 | 20 |
| First release held back two ticks | 9 | 8 | 20 |
| First release held back six ticks, batching both releases at tick 10 | 10 | 9 | 21 |
| Final release held back two ticks | 11 | 10 | 22 |
| Final release held back four ticks | 13 | 12 | 24 |
| Final release sample delayed three ticks, newer neutral sample arrives first | 10 | 9 | 21 |

The two release orders gave the same results. An isolated first-release sample delayed by three ticks was superseded by the next sample at tick 5. That did not affect the final release or the hitbox. No gameplay tuning changed in this pass. The [Ultimate right-stick experiments](https://w.atwiki.jp/smashsp_kensyou/pages/31.html) show that a right-stick smash can start while face Attack is held. The [Ultimate buffering experiments](https://w.atwiki.jp/smashsp_kensyou/pages/111.html) describe charge and release timing but do not isolate these two release orders on 13.0.5. The project result therefore remains provisional as an Ultimate parity claim.

**Resume here.** Add separate face and right-stick hold transitions and charge-stop timing to the Dojo trace so a physical controller run can be compared directly. Keep the combined hold rule until versioned evidence distinguishes the two release orders.

## Dojo trace for mixed-input charge

In **Timing laboratory → Input trace**, the Dojo now records `Release face Attack` and `Release right stick` separately. It shows either release even if the other control keeps the shared Attack bit held. For the stick, release means it fell below the Attack activation threshold. Rearming still requires a return to neutral. The trace logs the simulation tick when smash charge stops and the accumulated charge ticks. Reaching the cap is labeled separately. A new Attack edge can skip one increment while charge remains held, so a single unchanged counter sample does not produce a stop.

All 100 browser checks passed across All-Rounder, Abe Lincoln, Swift, Moonshine, and Hulk Hoagie, both facings, five release patterns, and both direct input and recorded routine playback. In the fixture, the buffered Up Smash started on simulation tick 37. The trace matched the release and charge-stop events below. The first active hitbox stayed at the timing established in the prior audit.

| Release order | First trace event | Charge-stop trace event |
| --- | --- | --- |
| Right stick, then face Attack | Tick 41 · Release right stick | Tick 46 · Release face Attack · 8 charge ticks |
| Face Attack, then right stick | Tick 41 · Release face Attack | Tick 46 · Release right stick · 8 charge ticks |
| Both together | Tick 41 · Both releases | Tick 41 · 3 charge ticks |
| Right stick only | Tick 41 · Release right stick | Tick 41 · 3 charge ticks |
| Face Attack joins after startup, then right stick releases first | Tick 41 · Release right stick | Tick 46 · Release face Attack · 7 charge ticks |

The inputs came from a simulated Xbox pad. This pass added Dojo diagnostics and left charge mechanics untouched. The separate release and stop lines are now available for a physical-controller run. Exact Ultimate 13.0.5 behavior still needs versioned evidence.

**Resume here.** Compare the two release orders on a physical Xbox 360, Nintendo Switch Pro Controller, and PlayStation DualSense. Use the same attack and record the move start, both release ticks, the charge-stop tick, and the first active hitbox for each. Follow the [three-controller support plan](REFINEMENT.md#three-controller-support-plan) for mapping and signoff. Keep native charge ownership provisional until a versioned Ultimate run is available.
