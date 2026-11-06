# Fatigue parameters and consecutive-parry audit

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
