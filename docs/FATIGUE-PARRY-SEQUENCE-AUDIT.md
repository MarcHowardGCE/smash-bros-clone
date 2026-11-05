# Fatigue parameters and consecutive-parry audit

November 5, 2026. This supersedes the temporary fatigue curve and the broad automatic-parry backlog wording in OOS-DODGE-PARRY-REFINEMENT.md.

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
