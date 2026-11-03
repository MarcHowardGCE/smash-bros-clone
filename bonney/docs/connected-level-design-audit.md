# Connected Level Design Audit — Harbor, Cloud and Underwater

Date: November 2, 2026. Scope: the three routes as one branching level, including all 15 districts. This review distinguishes observed behavior, design judgments, applied repairs and proposed changes.

## Verdict

The level has enough content for a full first-level prototype. Its strongest idea is choosing a route with a different movement fantasy: fast harbor action, expressive aerial movement, or buoyant underwater exploration. Preserve that identity and the option to finish through different exits.

The current design is not yet proven fun. Reachability and successful scripted progression establish that the game can be completed; they do not establish that a new player understands it, enjoys repeating it, or finds its difficulty fair. The largest design opportunity is to make each challenge ask a different question. Several gates currently repeat an outfit/control checklist, while the tall underwater route repeats nearly identical alternating jumps.

Recommended direction: readable approach -> a deliberate movement/combat choice -> execution -> visible payoff -> a short recovery. Make difficulty come from timing, positioning and route selection. Keep the current high-jump maximum, power durations, age rules, visual-only roster and mandatory puzzle gates unless a measured playtest supports changing them.

## Evidence and limits

Reviewed the three live layout definitions, shared movement/combat/AI, route snapshots, checkpoint/return rules, guides, authored roof geometry and current artwork. Ran the full gameplay suite and browser progression checks for all routes. The underwater visual audit includes 28 staged views across both heroes. New browser probes reproduce the first harbor-pit transition, the first fading-cloud failure, cloud checkpoint re-entry, visible underwater shots and contextual guides. Separate movement probes compare tap/held jumps with real simulation.

No representative first-time human playtest has been conducted. Browser progression uses staged positions for many interactions; it is not a complete unaided human playthrough. Enemy placement and reachability tests remove threats for isolated traversal; passing them does not establish encounter balance. Recommendations below are designer judgments to validate, not fabricated player feedback or measured enjoyment scores.

Evidence files: docs/level-design-audit-metrics.json, docs/level-design-audit-browser.json, docs/screenshots/level-design-audit/. Reproduce with scripts/level-design-metrics.mjs and scripts/level-design-audit-browser.mjs.

## Inventory and pacing measurements

| Route | World size | Districts | Enemies | Costume pickups | Coins | Treasures | Gates | Checkpoint records |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Harbor | 6400 × 480 | 6 | 16 | 16 | 68 | 3 | 2 | 3 |
| Cloud | 3840 × 480 | 4 | 8 | 6 | 28 | 3 | 1 | 3 |
| Underwater | 4608 × 1152 | 5 | 14 | 0 | 35 | 3 | 2 | 3 |

There are 38 enemies and nine treasures across the optional routes, not 38 enemies on one compulsory linear path. Cloud and underwater checkpoint records include their arrival point; harbor's three records are later checkpoints.

Unpowered running across each route's width would take approximately 38.1, 22.9 and 44.2 seconds respectively, before any vertical movement, enemies, puzzles or searching. These are traversal lower bounds, not measured completion times. Checkpoint spacing by horizontal distance alone hides the cost of vertical climbing.

A neutral harbor/cloud jump rises about 41.72 pixels and returns to level ground in 0.667 seconds. Underwater it rises about 143.86 pixels and takes 2.167 seconds. A short tap and a held jump produce identical results in both environments. The maximum underwater jump is useful; the inability to choose a smaller jump is a potential source of sluggishness.

## Accuracy and fairness repairs applied during this audit

1. **Invisible underwater fire:** submarine projectiles were simulated and damaging but were absent from the underwater renderer. They now render as visible shots with a short trail. Submarines also have a readable aiming warning.
2. **Shots passing solid puzzle barriers:** enemy projectiles now stop at intact crates and closed gates, including the gate's full-height blocking field. Open gates and destroyed crates permit shots.
3. **Cloud re-entry discarded the checkpoint position:** returning to the cloud route previously started at its entrance despite a later saved checkpoint. Re-entry now uses that saved checkpoint while retaining puzzle and collectible state. Initial discovery still uses the original entrance.
4. **Contradictory rules:** the static guide said all falls cost a hit and E required Egghead. Those statements did not describe underwater controls or route-changing falls. Guides now explain the active area's rules; the sky guide is hidden outside the sky. Underwater explains stowed powers and no swimming. Player-facing control messages use readable names instead of internal control IDs.

New regression checks cover these repairs. No movement rebalance, puzzle redesign, extra enemies or hidden-route shortcut was implemented as part of this audit.

## Route-by-route design review

### Harbor: strongest foundation, weakest costume decisions

Keep the market-to-flagship progression, recognizable buildings, playable roofs, crane landmark, rising approach to the hidden cloud route and the final two-part boarding gate. The space has a strong sense of travel and the most variety of landmarks.

The harbor has 16 costume pickups, mostly in the ground walking lane. Several late pickups are very close together: Captain/Egghead at x5376/5440 and x5952/6032. Because pickup replacement is automatic, a player can switch outfits through ordinary movement instead of making an intentional choice. This weakens the identity of the power they just selected and adds explanations during action.

First redesign: consolidate supplies into clearly marked choices near the required puzzle, placing optional alternatives above or beside the walking lane. Keep every required outfit recoverable after damage. Test roughly 10–12 deliberately placed supplies rather than treating that count as a hard target. Preserve guaranteed recovery at Customs and Flagship; removing a pickup must never create an outfit softlock.

The Customs and Flagship loops both rely on a Captain breach plus an Egghead high control. Give the second loop a new execution demand: a short moving-rigging traversal or a timed cargo opening after a visible windup, with solved controls staying solved. Its distinction should come from the set piece and timing, not repeating a longer supply hunt.

### Cloud: strongest ability contrast, costly first failure

Keep Gear speed/charged attacks contrasted with Egghead flight, the alternative lower route after power loss, the special sky exit and the ability to fall back to the harbor. The six-pickup layout is substantially more deliberate than the harbor's.

The first fading cloud at x1168 can drop a stationary player directly into the harbor after its warning expires. The new browser probe reproduces this without health loss. The rule is consistent with the intended branching level, but the first demonstration also ejects the player from the route. Teach fading over a safe lower island first; use the actual route-changing fall in the next challenge.

After initial discovery, consider a clearly visible crane return mechanism that only appears once the cloud route is unlocked. Preserve the original secret discovery requirement. The checkpoint re-entry repair removes repeated early sections, but players still must repeat the hidden ascent to re-enter. Repeated ascent can turn a good secret into a chore.

The reactor prism currently unlocks with the mandatory reactor breach. It is a reward on the required checklist, not a separate secret action. Move it into a short optional Gear-breach/flight alcove or give the dangerous observatory roof a distinct reward. Give the cyan exit a satisfying short finish flourish after the final sentinel.

### Underwater: strongest exploration space, repetitive required climbing

Keep the high jump, silhouette changes between reef/wreck/lab, hidden summit pearl, melee-broken wreck cache and no-swimming identity. Missing a high jump often returns the player to a lower route, which supports experimentation.

The cathedral and laboratory both use repeated left-right ledges. Their climb geometry is readable in the layout, but the required actions differ mainly by control labels. The valve puzzle should visibly change pressure or raise a physical platform. The relay puzzle should activate a different traversal route, such as the research lift. Avoid making both chains another long climb to an E prompt.

Underwater has only three checkpoint records, one of which is the arrival point. Consider additional bells at the cathedral approach and lab approach. The actual target should be a short retry of the current challenge, not a particular bell count. Preserve solved valves/relays and collected secrets.

Falling camera framing needs a focused pass. With the current deep-area camera target, the player's feet can sit about 40 logical pixels above the bottom of the viewport. At a 170-pixel/second terminal fall, that is only about 0.24 seconds of view below the feet. This is a geometric observation, not a measured player reaction time. Bias the camera downward while descending and toward the direction of travel on alternating climbs, with smooth transitions and no loss of the next landing.

## Shared design priorities

| Priority | Finding | Concrete next change | Acceptance criterion |
| --- | --- | --- | --- |
| First | Involuntary costume churn in harbor | Deliberate side/upper pickups and compact required supply stations | Walking the main lane does not repeatedly replace a chosen power; damaged players can still solve every gate. |
| First | Repetitive gate checklists | Different physical payoff for each puzzle: breach, pressure change, moving rigging, relay-powered lift | A player can describe each puzzle by what it changes in the world, not its control label. |
| First | Failure can cause repetition instead of learning | Safe fading-cloud introduction; review bells near major climbs; unlocked-only cloud return | Retrying a failed challenge usually returns to meaningful play within a provisional 10–20 seconds. Initial discovery remains secret. |
| First | Tall descents have limited preview | Fall-aware and direction-aware camera, stable landing view | Required landings are visible before the player must commit; no camera snapping across a hazard. |
| Next | Every jump has one height | Prototype a short-tap jump; retain current held-jump maximum and existing special activation | High-route tests still pass at every age; taps can make useful low hops; Egghead lift/release behavior remains unchanged. |
| Next | Age art and combat body may disagree | Calibrate hurt regions against visible baby/teen/adult frames, separately from movement collision | No hits through empty space above the visible head; identical movement and platform reach across ages. |
| Next | Many enemies can be bypassed, or become slow repeated hits | Author one clear combat problem at a time, then two-threat combinations with recovery space | First-time players can identify the warning and an escape before a combined encounter. |
| Next | Coins mostly increase a number | Use coin arcs to show takeoff/landing; give optional high paths a distinctive reward or faster line | Every major detour has a visible or discoverable reason to take it. |
| Later | Endings/progress feel disconnected | Distinct route-clear feedback and a discovered-routes/treasure journal | Only discovered areas are named; route clear feels complete even though the future level links are placeholders. |

The age-body concern is verified in structure, not yet exhaustively calibrated: movement collision is 16×28 at every age, while standing baby art is approximately 18 world pixels tall. That can leave roughly ten pixels of collision above the visible body. Do not shrink the movement collider casually; preserve the requested shared movement and evaluate a separate combat hurt region across all animation states.

## Combat, secrets and challenge

Keep punch as the quicker close option and kick as the longer-reach commitment. Teach that distinction with one safe early enemy, then demonstrate a shield's warning/recovery before combining it with a projectile lane or gap. Standard harbor patrols have three health points; use playtests to decide whether the first ordinary patrol should take two hits, reserving longer fights for visibly tougher variants. Increasing health globally is not the recommended difficulty pass.

Flight can cover substantial empty space and bypass some encounters. Preserve its freedom. Put optional rewards, a faster line or a recognizable set piece on the upper route so bypassing becomes an earned choice. Gates must remain mandatory until solved. Required post-damage traversal should remain possible without powers, except where a clearly recoverable supply is intentionally required by a puzzle.

A secret should combine a clue with an optional action. The high cathedral pearl and cracked wreck cache do this better than treasures unlocked by mandatory controls. Keep rare glints and distinctive scenery, then ensure the player sees a satisfying reveal. Do not require all nine treasures or all three routes to finish one run.

## Branching-world coherence

The routes are connected by authored state transitions, not a continuous physical world. All harbor water entry currently uses the underwater arrival/checkpoint; cloud falls use a horizontal mapping clamped before locked harbor gates. This protects progression but can make widely separated falls feel geographically similar.

A future coherence pass can author a few recognizable drop shafts/landing pockets and returning landmarks without rewriting the world into one continuous simulation. Clearly distinguish voluntary return from route completion. All three future next-level destinations are reserved metadata; none is a playable next level yet. Keep the ending feedback honest about that limitation.

## Recommended implementation order

1. Retain the fairness repairs from this audit. Add age hurt-region calibration and a controlled camera pass next.
2. Prototype variable jump height with the existing full-jump maximum; validate every current route and both heroes before adopting it.
3. Recompose harbor supplies and make the first fading-cloud lesson safe. Review retry distances around the underwater climbs.
4. Rework one puzzle in each area around a visible physical change. Do not add more switches to the current checklist.
5. Give upper routes a distinct payoff and complete each route's short finale.
6. Run a fresh-player playtest and tune the specific repeated-failure locations it reveals.

## Playtest protocol and provisional goals

Use five first-time players for an initial qualitative pass, including players comfortable with platformers and less experienced players. Give only the visible game controls. Observe the first ten minutes without coaching, then let them try a discovered alternate route. Follow with focused attempts at the cathedral and research ring. Do not treat five players as statistically representative.

Record locally during supervised tests: time to first intentional power use, accidental outfit swaps, source/location of damage, deaths, cloud falls, repeated secret ascents, supply waiting/backtracks, camera-blind landings, puzzle comprehension and whether a player voluntarily chooses a harder route. Ask what felt fair, what they wanted to retry and which moment they would replay. No telemetry was added in this audit.

Provisional acceptance goals:
- No invisible damage, mandatory outfit softlock, unsignaled closed-gate collision or required landing outside the camera.
- At least four of five testers can explain power loss and the active environment's movement rule after encountering it.
- Ordinary retries return to the current challenge within roughly 10–20 seconds; a longer retry must produce an observable route choice rather than idle repetition.
- Players can identify a puzzle's physical result and a reason to choose at least one optional route.
- At least some players voluntarily replay an optional challenge or attempt a secret. Secret discovery is not required of every tester.

Completion-time targets should be set after this baseline session; the width/speed estimates above are not a basis for declaring a first-time completion target or win rate.

## Design reference

Maddy Thorson's primary account, [Celeste & Forgiveness](https://www.mattmakesgames.com/articles/celeste_and_forgiveness/index.html), explains coyote time, buffered jumps and small positioning allowances. It is a useful benchmark for keeping controls generous while demanding deliberate execution. This game already has a 90ms ledge grace period and 100ms jump buffer in full mode; preserve those while tuning challenge. The reference supports the control principle, not a claim that this game's difficulty or enjoyment matches Celeste.

## Validation result

106 tests and syntax checks pass. Harbor, cloud and underwater browser progression checks all pass after the audit repairs. New browser checks verify contextual guides, visible underwater fire, health-preserving route changes and cloud checkpoint re-entry. The live preview serves the updated game. These results support functional playability; human fun and difficulty validation remains outstanding.
