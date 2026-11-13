# Fighter Packs 03 and 04 production plan

November 10, 2026. Design proposal for five fighters. The concept sheets supply the names, roles, weights, and qualitative traits. The physics values, visual ratios, and moves below are first-pass proposals for the Dojo. Character backstories can be developed separately.

## What the sheets specify

| Pack | Fighter | Sheet weight | Sheet profile |
| --- | --- | ---: | --- |
| 03 | Mr. Wrong | 93 | Standard hurtbox, fast movement, long reach, versatile trickster |
| 03 | Loopy | 82 | Taller hurtbox, fast run, high mobility, lower damage |
| 03 | Mrs. Tasselbottom | 128 | Larger hurtbox, slow movement, low jump, devastating power |
| 04 | Zane Corvo | 100 | Standard movement, balanced starter, versatile close-range toolkit |
| 04 | The Velvet Reply | 100 | Standard movement, balanced starter, versatile movement and strikes |

The silhouettes in Pack 03 place Loopy tallest and Mrs. Tasselbottom shortest and widest. Those comparisons are within the pack. Swift is lighter than Loopy at 75 in the current registry, and Moonshine sits at 87. Mrs. Tasselbottom would become the heaviest fighter, above Abe Lincoln at 118 and Hoagie at 109. Mr. Wrong sits between Moonshine and All-Rounder. Both Pack 04 fighters share All-Rounder's baseline weight. [Pack 03 sheet](../../concept-art/char/fighter-pack-03.png) · [Pack 04 sheet](../../concept-art/char/fighter-pack-04.png) · [Current roster stats](../../packages/shared/src/constants/characters.ts)

## Loopy jersey correction

November 10, 2026. Pack 03 animation work is paused for a costume correction requested by the user. Loopy must have a plain, number-free jersey on the front and back. Do not include 49, other lettering, or directional emblems in future production drawings: gameplay mirrors the same artwork for left and right facing. The original concept and sketch sheets remain historical references; their printed number is no longer part of the approved production costume.

The current pilot has 24 Loopy source sheets under concept-art/sprite/pack-03-pilot. Audit every selected pose, including obscured and rotated torsos, and remove visible numbers at the source. Preserve the approved jersey colors, trim, shading, body contours, pose, transparent canvas, and registration. Use a small pilot edit for visual review before processing the remaining sheets. Rebuild the derived atlas and idle portrait with the existing builder; do not patch only the compiled atlas or add a runtime cover over the jersey. Check front, back, both facings, tumble, and transitions at gameplay speed, plus source dimensions, registration, and atlas bounds. Track each corrected source so partially completed work is explicit.

Status: completed November 10, 2026, atlas revision 16. All 24 production source sheets were edited with the built-in image tool and visually reviewed without jersey numbers, including back and rotated views. The compact-strike sheet was edited again after a contact-marker validation caught hand-placement drift; the accepted retry passes the original marker checks without changing their coordinates. Every source retains its original canvas dimensions. Generated edits can change small drawing details; pixel-identical silhouettes are not claimed. The rebuilt Loopy atlas and idle portrait now use the plain jersey. Historical concept/sketch references remain unchanged and are superseded by the production costume rule. [Source inventory, hashes and edit brief](../../concept-art/sprite/pack-03-pilot/loopy-jersey-correction.json)

Validation: all 95 prepared clips and 282 frame references are nonempty and inside atlas bounds; duration arrays and both other fighters' manifest entries are unchanged. All 16 real Dojo prone/get-up cases passed across both facings and floor orientations, with no page errors or missing pack assets. All 70 full-body tests and the client type check passed. An accidentally broader client test invocation passed 902 tests and failed one unrelated stale controller-prompt expectation for the removed World Select Story toggle; that follow-up is separate from this art correction. The pre-existing floor-attack reach mismatch remains open. Next Pack 03 work remains contact-art polish, then techs, trips, and jab locks.

## Loopy jab halo correction

November 10, 2026. User playback feedback exposed a broad brown/gold translucent matte on loopy-compact-strikes.png after the number-removal edit. The three jab contact drawings use this source, so its halo flashed between the clean anticipation and recovery frames. The earlier revision 16 visual review missed this alpha defect.

The built-in image edit removed background glow and retained the six poses, number-free cream jerseys, canvas size, and layout. The third jab art contact socket moved three source pixels to the nearest opaque fist edge; no simulation, hitbox, or timing changed. The packed atlas is revision 17. The [source inventory and edit brief](../../concept-art/sprite/pack-03-pilot/loopy-jersey-correction.json) now records its corrected hash and follow-up.

The source audit found translucent pixels with alpha 16–199 at about 65% of the opaque-pixel count on the defective sheet, versus about 6.4% after correction. Other Loopy sheets measured about 3–15%. The atlas builder now rejects Loopy sheets above 25% as a broad-residue warning. This is a targeted alpha check, not a complete visual-quality guarantee. Every current sheet passes it, along with opaque contact-marker and atlas-capacity validation.

Verification: all three jabs played with visible artwork in both facings using real keyboard inputs in the slow-motion Dojo (six move/facing cases). The packed contact drawings were visually reviewed on light and dark backgrounds with no broad halo. All 70 full-body tests and the client type check passed. The source was edited using the built-in image tool; the source alpha was retained during the normal atlas build. Remaining Pack 03 work is still get-up attack contact polish, then techs, trips, and jab locks.

## Shared scale and first-pass stats

Use All-Rounder's grounded body height as 1.00. Compare standing drawings on a common floor line, measuring from soles to crown and tracking full silhouette bounds separately for antlers, hats, hair and trailing costume. Review the lineup both close up and at normal match zoom over light and dark stages. Keep extended limbs inside the frame crop and mark the parts that actually connect on the active drawing.

| Fighter | Standing body height | Weight | Walk / run | Full hop / short hop / air jump | Air speed | Physics radius | Damage capsule height / radius |
| --- | ---: | ---: | --- | --- | ---: | ---: | --- |
| All-Rounder reference | 1.00 | 100 | 3.50 / 6.50 | −16.00 / −10.00 / −14.00 | 5.00 | 28 | 82 / 12 |
| Mr. Wrong | 1.00 | 93 | 3.60 / 6.75 | −16.00 / −10.00 / −14.00 | 5.10 | 28 | 82 / 12 |
| Loopy | 1.10 | 82 | 3.75 / 7.15 | −17.00 / −10.50 / −14.60 | 5.25 | 28 | 90 / 11 |
| Mrs. Tasselbottom | 0.92 | 128 | 2.90 / 5.25 | −12.60 / −8.20 / −11.50 | 3.90 | 34 | 76 / 17 |
| Zane Corvo | 1.00 | 100 | 3.50 / 6.50 | −16.00 / −10.00 / −14.00 | 5.00 | 28 | 82 / 12 |
| The Velvet Reply | 1.00 | 100 | 3.50 / 6.50 | −16.00 / −10.00 / −14.00 | 5.00 | 28 | 82 / 12 |

| Fighter | Air acceleration / braking | Gravity | Fall / fast-fall cap |
| --- | --- | ---: | --- |
| All-Rounder, Zane and Velvet | 0.135 / 0.050 | 0.650 | 18.0 / 28.8 |
| Mr. Wrong | 0.140 / 0.050 | 0.650 | 18.0 / 28.8 |
| Loopy | 0.150 / 0.055 | 0.700 | 19.0 / 30.4 |
| Mrs. Tasselbottom | 0.095 / 0.065 | 0.740 | 19.5 / 31.2 |

Speeds and jump velocities use the game's 60 Hz tick. Negative jump velocity means upward. Use the shared initial dash timing and jump resources for the first prototype. Loopy's faster ground run and firmer aerial braking give him a different movement rhythm from Swift, whose current air speed is 5.8. Verify actual jump apex, horizontal travel, braking, and recovery from gameplay traces because launch velocity, gravity, and caps act together. [Physics baseline](../../packages/shared/src/constants/physics.ts) · [Stat schema](../../packages/shared/src/types/Character.ts)

The current engine selects body damage capsule dimensions separately from the physics radius, and the capsule selector hardcodes three profiles. Prototype Loopy's height and Mrs. Tasselbottom's width in that separate body geometry while preserving existing fighters' effective dimensions. Review the proposed radius independently because the circular collision size also affects other interactions, including grab contact and stage movement. Align damage regions with the visible body at gameplay scale. Give any extended attack limb its own attack timing and verify it against the collision overlay before approving the sprite. [Collision implementation](../../packages/engine/src/hitbox/index.ts)

## Fighter profiles

| Fighter | Play pattern and tradeoff | Signature normals and throw | Proposed special directions in neutral / side / up / down order |
| --- | --- | --- | --- |
| **Mr. Wrong** · mobile spacing trickster | Use selected tentacle strikes to control midrange. Long attacks should telegraph their active reach and leave a recovery opening when they miss. His ordinary grab uses the shared reach for the pilot. | Long forward tilt, delayed low sweep, and a coiling back throw. Keep one clear striking limb visible at a time. | Short elastic lash / committed long sweep / upward spring / low delayed lash |
| **Loopy** · ground speedster | Run in and out, land quick aerials, and win through repeated openings. Lower damage and modest KO power reward clean positioning. A taller body and quicker descent give opponents ways to catch him. | Low dash attack, compact forward aerial, and an up throw that sets up a chase. Track antler clearance separately from the body. | Quick feint strike / running shoulder / rising leap / quick downward stomp |
| **Mrs. Tasselbottom** · superheavy punisher | Threaten big damage and launch on committed openings. Slow approach, large body, and weak natural jump expose her to spacing and edge pressure. Give her a dependable but telegraphed vertical recovery. | Heavy forward smash, grounded skirt sweep, and a down throw that reads clearly against both light and heavy victims. Keep shoe contact legible under the skirt. | Heavy palm strike / committed body check / vertical lift / ground slam |
| **Zane Corvo** · close-range starter | Step into close range with compact, quick attacks and simple follow-ups. His reach gives opponents a reason to keep him out. | Compact jab chain, advancing forward tilt, and a forward throw that sends the opponent back into close-range play. | Quick body strike / stepping strike / rising strike / low sweep |
| **The Velvet Reply** · spacing starter | Use midrange strikes and timing to punish an opponent's approach. Give longer-reaching moves a clearer windup and recovery than Zane's close tools. | Stepping forward kick, long forward aerial, and a turning back throw that trades sides. Let hair and flared cuffs settle after the feet plant. | Measured straight strike / sweeping step / rising kick / retreating strike |

The special directions describe animation and gameplay intent. Use existing move primitives where they fit. Resolve hitbox placement, damage, knockback, startup, recovery, and landing rules in the Dojo before signing off those drawings. Start with the existing input layout and shared actions. Each fighter needs an individual reason to pick them, including the two starters with identical base physics.

## Grounded scale board and sketch references

November 10, 2026. The local scale board compares the five live idle atlas frames with five studies clipped from the approved Pack 03 and Pack 04 artwork. It registers all ten to a shared floor line. It marks proposed body height separately from full silhouettes and shows schematic contact targets. The interactive stage preview compares the live sprites and newcomer silhouettes on Neighborhood and Cathedral at 1.0× and 1.65×. Desktop controls and narrow-window scrolling passed in Chromium. The PNG preview is the default board view.

- Mr. Wrong reads at the proposed 1.00× body height with a wider floor footprint from the curled tentacles. Preserve a consistent support contact through each walking step. Draw the long forward tilt with one readable striking limb.
- Loopy's 1.10× body stays separate from the antlers, which take the full silhouette above Abe's hat in this board. Leave headroom on crouch, jumps, and landings. Use the front and rear step references to distinguish each planted hoof.
- Mrs. Tasselbottom stays short at 0.92× and reads heavy through width and costume. Let her shoes break the skirt silhouette on movement and landing. Establish the actual hand and ledge lip contact with a dedicated hang drawing.
- Zane and Velvet both stand at 1.00×. Zane's compact boot stance and Velvet's trailing hair and flared cuffs provide distinct outlines at the same scale. Check that both sets of feet stay readable at gameplay zoom.

The five new sketch sheets are reference for stance, gait, crouch, jumps, and action posing. Their drawings and palettes are provisional. Use the approved Pack 03 and Pack 04 roster artwork for final colors. Preserve the sketch file spelling `zane-coro` in the source link and use **Zane Corvo** in the roster. No contact marker on the board is a finished sprite socket or an engine value. Confirm reach, paired grip, ledge placement, and stage contrast with actual Pack 03 drawings in the Dojo.

[Mr. Wrong sketch](../../concept-art/sprite/mr-wrong-sprite-sketch.png) · [Loopy sketch](../../concept-art/sprite/loopy-sprite-sketch.png) · [Mrs. Tasselbottom sketch](../../concept-art/sprite/mrs-tasselbottom-sprite-sketch.png) · [Zane Corvo sketch](../../concept-art/sprite/zane-coro-sprite-sketch.png) · [The Velvet Reply sketch](../../concept-art/sprite/velvet-reply-sprite-sketch.png)

## Pack 03 Dojo pilot

November 10, 2026. Mr. Wrong, Loopy, and Mrs. Tasselbottom are selectable as the fighter or practice partner in Free Practice. The pilot uses the approved concept palettes and six new transparent master sheets based on the sketch poses. The pack includes initial movement and landing drawings, run cycles, grabs, a down-throw pair, ledge catch and hang, Mr. Wrong's forward tilt, and Loopy's dash attack. Shared moves and placeholder pose reuse support the rest of the practice session while the full animation inventory is still in production.

The engine uses the proposed weights, ground and air movement, and damage capsule sizes. Dodge timings are borrowed from All-Rounder for Mr. Wrong, Swift for Loopy, and Abe Lincoln for Mrs. Tasselbottom. The forward tilt, dash attack, and down throw use provisional character-specific data. Pilot access is limited to Free Practice until the rest of the moveset and presentation are ready. [Pilot masters](../../concept-art/sprite/pack-03-pilot/mr-wrong-movement.png) · [Atlas builder](../../scripts/assets/build-pack-03-pilot.mjs) · [Runtime manifest](../../apps/client/public/fighter-art-pack-03-v1/manifest.json) · [Stats](../../packages/shared/src/constants/characters.ts)

| Check | Evidence |
| --- | --- |
| Mr. Wrong against Moonshine | The browser showed the active forward tilt drawing and contact at the extended tentacle. A scripted tilt-stick input selected the move through the normal local controller path. |
| Loopy against Swift | Keyboard inputs showed dash start, run, and the active dash attack drawing. The browser sampled all four authored stride and passing drawings. The collision overlay toggled, and the frozen Dojo advanced exactly one tick on F7. Exact hoof planting and cadence need visual review. |
| Mrs. Tasselbottom against Abe Lincoln | Keyboard grab and down throw showed Abe's paired victim drawing. The first measured gap between hand and victim grip rail was 0.81 world units. The hand reached each main-platform lip within one world unit. |
| Jump and landing | All three showed jump squat, takeoff, airborne poses, and heavy landing. Standing full-hop rise was approximately 189, 198, and 101 world units for Mr. Wrong, Loopy, and Mrs. Tasselbottom respectively. |
| Weight and recovery | In a deterministic practice fixture, All-Rounder's forward tilt produced increasing launch at 0%, 100%, and 200% for each fighter. At 200% the launch magnitudes were 96.97 for Mr. Wrong, 101.93 for Loopy, and 84.36 for Mrs. Tasselbottom. None crossed a blast zone from that starting position. The shared up special rose approximately 179, 164, and 154 world units respectively and entered helpless. This is a controlled vertical check. Practical recovery and KO thresholds need edge and blast-zone fixtures. |

The atlas builder preserves the source alpha and registers every frame with an explicit root. Rebuild with `node scripts/assets/build-pack-03-pilot.mjs` from the repo root. Next, review the pilot at gameplay speed in both facings. Refine alternating foot contacts, move transitions, and paired contact against light and heavy partners before commissioning the remaining sheets.

## Pack 03 gameplay-speed polish

November 10, 2026. The second pilot atlas revision uses dedicated contact and passing poses for walk and run across all three fighters. Walk no longer inserts the idle drawing between steps. The support point for each drawing registers to the floor. The walk loop is 24 ticks. Mr. Wrong, Loopy, and Mrs. Tasselbottom use 14-, 16-, and 20-tick run loops respectively. Dash start, the short turn, braking, and the three-drawing landing sequences use the pilot clip's durations. Landing timing is independent of which other fighter art is loaded.

Gentle touchdown now starts a short presentation cue on the first grounded tick, including the tick that still carries the airborne state label. Movement cancels the cue. This gives light landings a compression, settle, and return to stance. Heavy landings hold the compression longer. [Atlas builder](../../scripts/assets/build-pack-03-pilot.mjs) · [Movement cue](../../packages/engine/src/physics/movementArt.ts) · [Renderer timing](../../apps/client/src/renderer/fullbody/FullBodyPilot.ts)

| Local Dojo check at 1× | Result |
| --- | --- |
| Walk, run, and brake with each fighter in both facings | All six passes displayed four unique walk and run drawings and the brake clip. The marked support points met the main platform floor on all sampled grounded frames. |
| Gentle and heavy touchdown in both facings | All six passes sampled the three drawings for each landing. A separate renderer regression covered the same heavy-landing timing with and without the original reference fighter loaded. |
| Down throw against Swift and Hoagie with each fighter in both facings | All 12 confirmed throws displayed both full-body sprites and the paired victim reaction. Measured hold gaps were zero and first-release gaps ranged from 0 to 1.38 world units. |

The support measurement checks vertical registration at the marked foot. Review horizontal slide, alternating limb readability, and overall cadence by eye at gameplay speed. The test covered Neighborhood and one throw direction per pairing. The Pack 03 fighters remain Free Practice pilots. Next, expand the movement coverage with dedicated starts, turns, and airborne transitions before finishing the rest of the combat inventory.

## Pack 03 starts, turns, and airborne transitions

November 10, 2026. Atlas revision 3 adds twelve dedicated drawings per fighter. Dash anticipation and the launch step lead into the run cycle. A frontal standing pivot and a braced running turn replace the reused gait drawings. Jump squat and neutral, forward, and backward takeoffs have separate poses. Rise, apex, and fall each have their own drawing. The double jump displays an impulse pose, then hands off to rise.

Grounded drawings register to the sole line. The new airborne drawings use pelvis-based anchors calibrated to each fighter's standing pose. The renderer uses the clip's authored durations during takeoff and double jump. The full run-turn state keeps its braced art even when the shorter presentation cue expires. Fast fall shares the fall drawing for this batch. [Transition masters](../../concept-art/sprite/pack-03-pilot/loopy-transitions.png) · [Atlas builder](../../scripts/assets/build-pack-03-pilot.mjs) · [Renderer](../../apps/client/src/renderer/fullbody/FullBodyPilot.ts)

| Local Dojo check at 1× | Result |
| --- | --- |
| Dash start and running turnaround, both facings | All six cases showed four drawings during the ten-tick analog dash and both running-turn drawings on reversal. |
| Standing pivot, both facings | All six cases showed both pivot drawings, then returned to the walk or idle clip. |
| Neutral, forward, and backward takeoff | All 15 cases showed the requested takeoff followed by distinct rise, apex, and fall drawings. Neutral was sampled once per fighter. Forward and backward were each sampled in both facings. |
| Double jump, both facings | All six cases showed the dedicated impulse and follow-through drawings. The renderer regression also verified the handoff back to rise and the air anchor. |

All 33 browser cases passed in Free Practice on Neighborhood. The client type check and 57 focused renderer tests passed. The counts check playback and cue selection. Human review of cadence and limb continuity remains open. Next, finish the dedicated fast-fall, platform-drop, and teeter drawings before the first expanded ground-attack batch.

## Pack 03 fast fall, platform drop, and teeter

November 10, 2026. Atlas revision 4 adds eight dedicated drawings per fighter. Fast fall plays its snap for three ticks at entry and holds the descent drawing until the state clears. Platform drop plays its two drawings for eight ticks before passing to normal fall or fast fall. Both ledge teeters cycle two drawings on the floor line and end when the fighter walks away. The timing changes are limited to Pack 03 presentation. [Mr. Wrong master](../../concept-art/sprite/pack-03-pilot/mr-wrong-edges.png) · [Loopy master](../../concept-art/sprite/pack-03-pilot/loopy-edges.png) · [Mrs. Tasselbottom master](../../concept-art/sprite/pack-03-pilot/mrs-tasselbottom-edges.png) · [Renderer](../../apps/client/src/renderer/fullbody/FullBodyPilot.ts)

| Local Dojo check at 1× | Result |
| --- | --- |
| Fast fall in both facings | All six cases showed the normal fall drawing before Down, both distinct fast-fall drawings, then cleared fast fall on touchdown. The snap did not repeat during descent. |
| Drop through a soft platform | All six cases showed both platform-drop drawings, handed off to fall, and landed on the main platform. |
| Forward and backward teeter at both edges | All 12 cases showed both drawings with the fighter grounded and the expected facing. Each exited the teeter when the fighter moved inward. |

All 24 browser cases passed on Neighborhood, along with 60 focused renderer tests and the client type check. The browser checks verify cue selection and sprite playback. Human review of cadence and pose continuity remains open. Next, build dedicated jab and tilt sequences for all three pilots, then align the drawings to their active hit windows in the Dojo.

## Pack 03 jabs and tilts

November 10, 2026. Atlas revision 5 adds 54 drawings across Mr. Wrong, Loopy, and Mrs. Tasselbottom. Each of the three jab stages and three tilts has a dedicated windup, contact, and recovery. The existing renderer maps the authored contact drawing to the move's live hitbox window. Grounded drawings register to the sole line. [Sprite masters](../../concept-art/sprite/pack-03-pilot/) · [Atlas builder](../../scripts/assets/build-pack-03-pilot.mjs)

The built-in image generator used each fighter's approved pilot art as the visual reference. The brief specified transparent 3×3 sheets with right-facing, planted windup, contact, and recovery poses. The jab sheet uses a lead jab, follow-up, and finisher. The tilt sheet uses a long forward reach, raised arm, and low sweep.

| Move | Active state ticks, zero-based |
| --- | --- |
| Jab 1 and jab 2 | 3–4 |
| Jab 3 | 4–6 |
| Forward tilt | 9–11 for Mr. Wrong, 7–9 for Loopy and Mrs. Tasselbottom |
| Up tilt | 6–9 |
| Down tilt | 5–6 |

The Dojo checks used the Neighborhood stage at 0.25× with the collision overlay enabled. All 36 move and facing combinations displayed the contact drawing on every active tick and the corresponding windup and recovery on the adjacent ticks. The jab stages were played as a chain. In 12 additional checks, jab 1 and all three tilts hit a stationary or airborne Swift and held the correct drawing during hitlag. All 60 focused renderer tests and the client type check passed.

Spatial alignment remains open. For example, Loopy's forward-tilt drawing reaches approximately 84 world units ahead of his origin, while the live hitbox ends about 40 units ahead. Keep the current combat range as the reference for a shorter contact drawing. Review these poses with the overlay before the dash and smash attack batch. Gameplay-speed cadence still needs a human pass.

## Pack 03 jab and tilt spacing

November 10, 2026. Atlas revision 6 uses 18 new contact drawings for the existing jab and tilt sequences. Windup, recovery, and combat data carry forward from the prior revision. Loopy's forward-tilt contact silhouette now extends about 38 world units ahead of his origin, down from 84. The live hitbox ends 40 units ahead.

The built-in image generator used the previous attack masters as the character and palette reference. The compact sheet brief requested three planted, bent-elbow jabs, a short forward tilt, a close uppercut, and a crouched low strike on transparent alpha. The follow-up sheet moved the uppercut to the rear arm with the hand directly above the stance, and included revised forward and low alternatives. The builder packs the selected contact drawings and registers a marked strike point on each hand or tentacle. [Compact and raised strike masters](../../concept-art/sprite/pack-03-pilot/) · [Atlas builder](../../scripts/assets/build-pack-03-pilot.mjs)

At 0.25× in the Neighborhood Dojo, the rendered strike point was inside the live collision circle on every active tick in all 36 move and facing combinations. The smallest margin was 0.53 world units on Mrs. Tasselbottom's up tilt. All 12 repeat hits against Swift retained the correct contact drawing through hit freeze. These checks compare a marked point on the strike with the live circle. Human review of the full silhouette and animation cadence at 1× remains open. The client type check and 60 focused renderer tests passed.

Next, build dash attack and the three smash attacks for all three fighters. Use the live collision overlay to check the active poses, and cover uncharged and charged smash release timing.

## Pack 03 dash and smash attacks

November 10, 2026. Atlas revision 7 adds four drawings per move for dash attack and forward, up, and down smash for Mr. Wrong, Loopy, and Mrs. Tasselbottom. Dash attack and forward smash use two windup poses, contact, and recovery. Forward smash holds its coiled pose through charge. Up smash has separate setup and finishing drawings. Down smash uses separate front and rear contacts. Combat range, damage, and move timing carry forward. [Sprite masters](../../concept-art/sprite/pack-03-pilot/) · [Atlas builder](../../scripts/assets/build-pack-03-pilot.mjs) · [Renderer](../../apps/client/src/renderer/fullbody/FullBodyPilot.ts)

The built-in image generator used the movement and compact strike masters for palette, proportions, and linework. The brief requested transparent four-column sheets for dash and forward smash and for up and down smash. A supplementary two-pose sheet supplied rear-arm rising variants where the hand needed to sit closer to the vertical hitbox.

| Move | Uncharged active state ticks, zero-based |
| --- | --- |
| Dash attack | 8–12 |
| Forward smash | 15–17 |
| Up smash | 12–13 setup, 14–16 finisher |
| Down smash | 10–12 front, 13–15 rear |

The Neighborhood Dojo checks at 0.25× covered 6 dash cases and 54 smash cases. All three fighters played in both facings. Smash cases covered a right-stick tap, a 13-tick face Attack charge released early, and a right-stick hold through the 60-tick cap. All contact drawings changed on the corresponding live hitbox tick, and every marked contact point was inside the live circle. Fifteen additional cases against Swift confirmed the dash hit, forward smash, both up-smash hits, and separate front and rear down-smash hits. Contact drawings held through hit freeze. The client type check and 61 focused renderer tests passed. Full silhouettes and motion cadence still need human review at 1×.

Next, build the five aerial attacks for all three fighters. Register contact to their airborne anchors and check the landing handoff in the Dojo.

## Pack 03 aerial attacks

November 10, 2026. Atlas revision 8 adds 45 drawings across Mr. Wrong, Loopy, and Mrs. Tasselbottom. Neutral, forward, back, up, and down air each have a dedicated windup, contact, and recovery. The drawings use airborne anchors near the hips so the strike can extend around the fighter's simulation position. Back air shows contact behind the fighter in both facings. Touchdown uses the shared grounded landing sequence. [Aerial sprite masters](../../concept-art/sprite/pack-03-pilot/) · [Atlas builder](../../scripts/assets/build-pack-03-pilot.mjs) · [Runtime manifest](../../apps/client/public/fighter-art-pack-03-v1/manifest.json)

The built-in image generator used the pilot movement and airborne transition sheets for scale, palette, and costume. The brief requested transparent three-column masters with compact airborne windups, directional contact poses, and recoils. Horizontal attacks use three rows and vertical attacks use two.

| Move | Active state ticks, zero-based | Normal landing lag |
| --- | --- | --- |
| Neutral air | 5–10 | 4 ticks |
| Forward air | 8–11 | 6 ticks |
| Back air | 7–9 | 5 ticks |
| Up air | 7–11 | 6 ticks |
| Down air | 10–11 | 10 ticks |

At 0.25× in the Neighborhood Dojo, all 30 fighter, move, and facing combinations played the contact drawing on every active tick. Every marked strike point was inside the corresponding live collision circle. All 15 separate contacts against Swift hit on the first active tick and kept the contact art through hit freeze. The 45 landing checks covered early auto-cancel, normal landing lag, and late auto-cancel for each move and fighter. The landing art appeared at touchdown and the lockout lasted the expected number of ticks. Both auto-cancel windows used four ticks. These checks use the existing combat and landing rules. Human review of full silhouettes and cadence at 1× remains open.

The client type check, 61 focused renderer tests, and atlas bounds check passed. Next, build the four directional specials and counter-success art, then verify their active timing and recovery handoffs in the Dojo.

## Pack 03 specials and counter

November 10, 2026. Atlas revision 9 adds 54 drawings across Mr. Wrong, Loopy, and Mrs. Tasselbottom. Each has neutral, side, up, and down special art, a three-pose counter-success sequence, and distinct helpless entry, fall, and landing drawings. The attack and counter drawings include airborne registration. The special effects reuse the existing shared art. The counter cue starts from the hit event's move age and keeps its final recovery drawing through the end of the move. [Special sprite masters](../../concept-art/sprite/pack-03-pilot/) · [Atlas builder](../../scripts/assets/build-pack-03-pilot.mjs) · [Renderer](../../apps/client/src/renderer/fullbody/FullBodyPilot.ts)

The built-in image generator used the existing movement and vertical aerial masters for identity, color, and scale. The first transparent sheet requested a centered body pulse, compact side drive, and upward drive. The second requested a guard, successful retaliation, and loose airborne recovery followed by a planted landing.

| Special | Live or trigger state ticks, zero-based |
| --- | --- |
| Neutral | Body pulse on tick 8 |
| Side | Ticks 10–12 |
| Up | Ticks 4–6, with upward launch on tick 4 |
| Down | Counter detection on ticks 0–5. No independent hitbox. |

The 0.25× Neighborhood Dojo matrix passed 48 regular starts and 12 successful counters across all three fighters, both facings, and both grounded and airborne starts. All marked attack points were inside their live collision circles. All 12 unopposed up specials entered and exited helpless fall and used the 14-tick helpless landing sequence. Eighteen additional live-hit cases confirmed that neutral, side, and up special connected on their first active tick and retained their contact art through hit freeze. Six counter-boundary checks confirmed retaliation on tick 5 and a regular incoming hit on tick 6. The client type check, 63 focused renderer tests, and atlas bounds check passed. Gameplay-speed visual review remains open.

A confirmed up-special hit can shorten recovery travel. Shared hitstop currently zeros upward velocity. In the live fixtures, that caused the fighter to land directly in ordinary landing lag instead of completing the helpless fall. The art followed both observed paths. The physics issue remains open. Next, verify and fix the up-special momentum handoff after hitstop, then continue with shield, parry, and dodge art. [Shared hitstop](../../packages/engine/src/fsm/hitstop.ts) · [Landing state](../../apps/server/src/GameEngine.ts)

## Up-special recovery after a hit

November 10, 2026. Up special now retains its vertical speed through hit freeze while the attacker remains in the airborne attack. Position and animation age stay paused. Gravity resumes from the stored speed on the first unfrozen tick. This fixes the early landing observed in the specials pass above. [Hitstop logic](../../packages/engine/src/fsm/hitstop.ts) · [Recovery tests](../../apps/server/src/GameEngine.helpless.test.ts)

| Check | Result |
| --- | --- |
| Server recovery cases | All 16 combinations of fighter and grounded or airborne start hit, held position and action age during freeze, resumed the same vertical motion as the whiff control, and reached helpless landing. |
| Pack 03 in the Neighborhood Dojo | All 12 cases across the three pilots, two facings, and two starting states held the contact pose, resumed ascent, played helpless entry and fall, and used the 14-tick landing lockout. |
| Regression suites | 1,100 engine tests passed with one existing skip. All 123 focused server tests passed. Engine build and type check passed. |

The Dojo checks used a first-active-tick hit against Swift at 0.25×. Gameplay-speed feel and visual signoff remain open. Next, build shield, parry, and dodge art for all three pilots.

## Pack 03 shield, parry, and dodge

November 10, 2026. Atlas revision 10 adds 21 drawings each for Mr. Wrong, Loopy, and Mrs. Tasselbottom. Each fighter has a shield raise, hold, impact, and drop, a parry sequence, a spot dodge, separate forward and backward rolls, and a neutral air dodge. Grounded poses register to the floor. Air dodge poses use their airborne anchors, and the landing cue uses the current landing drawings. Directional air dodges temporarily share the neutral art while retaining their own timing and movement. [Atlas builder](../../scripts/assets/build-pack-03-pilot.mjs) · [Renderer](../../apps/client/src/renderer/fullbody/FullBodyPilot.ts)

| Local verification | Result |
| --- | --- |
| Shield and parry | 18 Dojo cases passed across three fighters and both facings. Shield raise showed both drawings in six ticks. Shield drop played both drawings over the 11 shield-release ticks. A Swift jab triggered shield hit and release parry. Each froze its impact drawing during hitlag and showed its follow-through afterward. |
| Spot dodge, rolls, and neutral air dodge | 48 Dojo cases passed across three fighters, both facings, and fatigue levels 0 and 5. All three drawings appeared. The middle drawing matched the collision overlay's intangibility window tick for tick. Forward and backward rolls traveled in the expected directions. |
| Provisional directional art | Six fresh side-air-dodge cases passed across three fighters and both facings. Directional movement and intangibility played with the neutral sprite and its airborne anchor. |
| Client regression checks | Client type check and all 65 full-body renderer tests passed. |

Next, draw the directional air-dodge and dodge-landing sequences, verify their continuous playback at the floor, then build shield-break launch, dizzy, and recovery. Keep gameplay-speed visual review open.

## Pack 03 directional air dodges and landings

November 10, 2026. Atlas revision 11 adds eight direction-specific active poses and four touchdown drawings per fighter. The art brief uses the approved movement and evade sheets for color and proportions, with eight right-facing air poses on transparent cells and a planted contact, compression, rise, and settle sequence. Each directional clip shares its anticipation and recovery with the neutral dodge. The renderer selects the active drawing during the existing intangibility window. [Mr. Wrong master](../../concept-art/sprite/pack-03-pilot/mr-wrong-air-dodge-land.png) · [Loopy master](../../concept-art/sprite/pack-03-pilot/loopy-air-dodge-land.png) · [Mrs. Tasselbottom master](../../concept-art/sprite/pack-03-pilot/mrs-tasselbottom-air-dodge-land.png)

The browser pass exposed that horizontal dodge aim turned the fighter on entry, which made backward and backward-diagonal clips resolve to their forward counterparts. The simulation now preserves entry facing during the dodge and its touchdown. Direction still determines travel, and a ledge catch can set its own facing. [Facing update](../../apps/server/src/GameEngine.ts) · [Air-dodge motion checks](../../apps/server/src/GameEngine.air-dodge-motion.test.ts)

| Local verification | Result |
| --- | --- |
| Direction and timing | 96 Dojo cases passed. All eight directions selected the intended clip in both facings for all three fighters at fatigue 0 and 5. Each clip showed anticipation, the active pose during intangibility, and recovery. |
| Air-to-floor handoff | 24 Dojo cases passed for neutral, down, down-forward, and down-back in both facings across all three fighters. The contact drawing appeared on the first grounded tick and intangibility ended on that tick. All four drawings stayed on the floor line. Neutral landing recovery lasted 10 ticks. The tested directional contacts took 17 or 18 ticks depending on contact age. |
| Client and server | Both type checks passed, along with 66 full-body renderer tests and 49 server air-dodge and wavedash tests. No opaque pixels touched the audited sprite-cell borders. All three atlas textures fit within 4,096 pixels on both axes. |

Next, build shield-break launch, dizzy, and recovery. Gameplay-speed human review and online facing under latency remain open.

## Pack 03 shield-break launch, dizzy, and recovery

November 10, 2026. Atlas revision 12 adds 12 drawings per fighter. The art brief used the approved guard and movement sheets for proportions, color, and line weight, with four airborne recoil poses, four planted stagger poses, and four grounded recovery poses on transparent cells. The airborne art holds through descent. The grounded stagger starts on actual contact, loops every 24 ticks, and gives way to recovery when 18 stun ticks remain. The renderer goes directly to grounded idle art on exit, including the simulation's one transitional airborne tick while the fighter is still standing. [Mr. Wrong master](../../concept-art/sprite/pack-03-pilot/mr-wrong-shield-break.png) · [Loopy master](../../concept-art/sprite/pack-03-pilot/loopy-shield-break.png) · [Mrs. Tasselbottom master](../../concept-art/sprite/pack-03-pilot/mrs-tasselbottom-shield-break.png)

Free Practice now has a **Preview shield break** action under **Timing laboratory → Launch and KO lab**. Pick **You** or **Partner** with the preview selector. The action uses the match shield-break reaction on the selected standing idle fighter while practice shield, percent, and stock protection stays active. It also works while frozen and publishes the initial break pose without advancing the clock. [Dojo guide](../TRAINING-DOJO.md#preview-a-shield-break)

| Local verification | Result |
| --- | --- |
| Full sequence | All 12 Dojo cases passed across three fighters, both facings, and both preview targets. All 12 drawings appeared for each fighter. The air pose gave way to the first dizzy pose on contact, every grounded pose stayed on the floor line, and recovery went straight to idle art. |
| Frozen preview | Three checks passed. Previewing while frozen kept the same simulation tick. F7 advanced the shield-break age by exactly one tick. |
| Regression and packaging | Four server shield tests and 75 client renderer and menu tests passed. Both type checks passed. All 36 source cells had clear opaque-pixel borders. The tallest atlas is Loopy at 4,048 pixels. |

Next, make room in the pilot atlases before adding dedicated hit reactions, launch, and tumble. Keep gameplay-speed visual review open.

## Pack 03 hit reactions, launch, and tumble

November 10, 2026. Atlas revision 13 adds high, mid, low, heavy, and aerial hit reactions, a two-pose launch, and a four-pose tumble loop for all three pilots. The art brief used the shield-break and movement sheets as references, with planted impact poses, airborne recoil, and a compact backward somersault in isolated transparent cells. Loopy's launch reuses the backward air-dodge drawing for its second pose so the jersey number stays consistent between drawings. [Mr. Wrong master](../../concept-art/sprite/pack-03-pilot/mr-wrong-hit-launch-tumble.png) · [Loopy master](../../concept-art/sprite/pack-03-pilot/loopy-hit-launch-tumble.png) · [Mrs. Tasselbottom master](../../concept-art/sprite/pack-03-pilot/mrs-tasselbottom-hit-launch-tumble.png)

Launch holds its impact pose through hitlag and transitions to tumble at hitstun age 10 if the fighter is still tumbling. Launch and tumble use airborne anchors and mirror to match horizontal travel. A non-trip down tilt now selects the low reaction. The existing heavy-hit classification works at fixed Dojo percentages. Knockback, damage, stun, and trip behavior use the existing rules. [Renderer](../../apps/client/src/renderer/fullbody/FullBodyPilot.ts) · [Atlas builder](../../scripts/assets/build-pack-03-pilot.mjs)

| Local verification | Result |
| --- | --- |
| Impact reactions | 30 live Dojo contacts passed across the three fighters and both facings. A grounded jab, up tilt, non-trip down tilt, forward smash, and airborne jab selected the mid, high, low, heavy, and airborne art respectively. All held the first drawing during hitlag. |
| Launch and tumble | 12 live Dojo cases passed at 50% and 150%. At 50%, both launch poses and all four tumble drawings played in each facing. At 150%, the sequence played until the actual KO exit. Mr. Wrong and Loopy crossed the blast line before tumble began in these cases. The initial grounded launch pose registered to the floor within 0.25 world units. |
| Atlas and regressions | Dynamic grid reflow reduced the tallest atlas from 4,048 to 3,289 pixels. All manifest rectangles fit, and the new sprite cells used in the atlas had clear opaque-pixel borders. Both type checks passed. The focused suites passed 68 client renderer tests and 32 server tests. |

Next, build tumble recovery and both knockdown orientations, then add prone holds and get-up options. Gameplay-speed visual review remains open.

## Pack 03 tumble recovery and knockdowns

November 10, 2026. Atlas revision 14 adds 12 drawings per fighter. The art brief uses the prior damage and movement sheets for proportions and palette, with four airborne uncurling poses and separate four-pose face-up and face-down impacts. Each floor sequence ends on a temporary static hold. Dedicated prone and get-up sequences are the next batch. [Mr. Wrong master](../../concept-art/sprite/pack-03-pilot/mr-wrong-tumble-recovery-knockdowns.png) · [Loopy master](../../concept-art/sprite/pack-03-pilot/loopy-tumble-recovery-knockdowns.png) · [Mrs. Tasselbottom master](../../concept-art/sprite/pack-03-pilot/mrs-tasselbottom-tumble-recovery-knockdowns.png)

| Local verification | Result |
| --- | --- |
| Missed tech and floor registration | 12 live Dojo contacts passed across the three fighters, both facings, and both knockdown orientations. A 50% forward smash from in front or behind produced the corresponding floor state. Each sequence began on the first grounded tick, played for 18 ticks, then used the same final drawing through the 12-tick hold. |
| Airborne recovery | Six Dojo cases passed using a seeded late-hitstun fixture to isolate the air recovery boundary. Directional input cleared tumble. All four recovery poses played over 12 ticks, then handed off to normal falling art. The renderer test also covers an early floor contact that cuts off the airborne pose. |
| Client and atlas | Client type check and all 69 full-body renderer tests passed. All 36 added cells had clear opaque-pixel borders. All three atlas textures fit within the 4,096-pixel limit. |

Next, draw dedicated face-up and face-down prone holds and their neutral, rolling, and attack get-ups. Gameplay-speed visual review remains open.

## Pack 03 prone holds and get-up options

November 10, 2026. Atlas revision 15 adds dedicated face-up and face-down breathing holds, neutral get-ups, rolling get-ups, and floor attacks. The built-in image-generation brief used the prior knockdown and movement masters to preserve character identity, palette, scale, and the starting floor orientation. The selected sheets contain 72 new drawings across the three fighters. Mrs. Tasselbottom uses a separate four-drawing contact sheet because the original wide attack poses overlapped their neighboring cells. Each knockdown now settles into the first breathing drawing before the hold begins. Each chosen get-up carries the displayed hold drawing through its first two ticks. [Mr. Wrong face-up master](../../concept-art/sprite/pack-03-pilot/mr-wrong-getup-up.png) · [Mr. Wrong face-down master](../../concept-art/sprite/pack-03-pilot/mr-wrong-getup-down.png) · [Loopy face-up master](../../concept-art/sprite/pack-03-pilot/loopy-getup-up.png) · [Loopy face-down master](../../concept-art/sprite/pack-03-pilot/loopy-getup-down.png) · [Mrs. Tasselbottom face-up master](../../concept-art/sprite/pack-03-pilot/mrs-tasselbottom-getup-up.png) · [Mrs. Tasselbottom face-down master](../../concept-art/sprite/pack-03-pilot/mrs-tasselbottom-getup-down.png) · [Mrs. Tasselbottom contact master](../../concept-art/sprite/pack-03-pilot/mrs-tasselbottom-getup-contacts.png)

The local Dojo pass started with real 50% forward-smash contacts from in front or behind, then used keyboard presses during the prone window. All 48 playback cases passed across three fighters, two orientations, two facings, and neutral, forward-roll, backward-roll, and attack choices. The 24-tick get-ups kept their floor registration. Rolling direction matched the input without changing fighter facing. All four attack ticks used the correct forward or rear contact drawing.

**Attack spacing remains open.** The marked strike points are outside the current live circles. These are maximum distances beyond the circle edge, measured in world units.

| Fighter | Face-up attack | Face-down attack |
| --- | ---: | ---: |
| Mr. Wrong | 19.58 | 22.10 |
| Loopy | 28.87 | 34.08 |
| Mrs. Tasselbottom | 12.34 | 16.99 |

Refine the attack drawings against the live circles before signing off contact. Playback success establishes clip selection and timing. It does not close the spacing gap.

The client type check, 70 full-body renderer tests, 11 menu tests, and 10 server floor-recovery tests passed. All 72 selected source cells had clear opaque-pixel borders and the atlas rectangles stayed within their textures. The largest texture is 3,510×3,542.

Next, polish the get-up attack contacts, then continue with techs, trips, and jab-lock reactions. Gameplay-speed human review remains open.

## Pack 03 get-up attack contact polish

November 10, 2026. Pilot atlas revision 18 replaces the wide front/rear floor-attack contacts with four compact crouched strike drawings per fighter (12 drawings total). The original revision 15 spacing measurements above are historical and superseded by this pass. The engine hitboxes, damage, recovery, and active ticks remain unchanged.

Contact markers were visually registered on the actual striking hands, including the upper knuckles on the compact punches. A nearest-opaque-pixel experiment was rejected because it could select facial pixels. The corrected 12 hand points lie inside the authoritative 13-unit circles, with a minimum edge margin of 0.98 world units. The circles overlap the striking hands; they do not describe the entire fist silhouette. Mirroring preserves contact alignment. Loopy retains a blank cream jersey and all sources have transparent backgrounds.

All 48 live Dojo playback cases passed after the final hand-marker corrections: three fighters × two orientations × two facings × neutral, forward roll, backward roll, and attack. Every active contact tick stayed inside its existing circle; no page or artwork-load errors were recorded. All 76 full-body renderer tests and the client type check passed. The new six-case regression covers every active tick in both facings and both floor orientations against the engine geometry. Atlas bounds passed for all frames; the largest texture is 3,712 × 3,289. A contact-overlay montage was reviewed for the windup, front contact, rear contact, and recovery. Human gameplay-speed cadence signoff remains open.

Next: dedicated ground and wall techs, then trips and jab-lock reactions for all three fighters. Pack 03 remains a Free Practice pilot; general roster release and Pack 04 remain later delivery gates.

## Pack 03 ground and wall techs

Pilot atlas revision 19 adds 36 drawings across Mr. Wrong, Loopy, and Mrs. Tasselbottom. Each fighter has distinct poses for a tech in place, a rolling tech, a wall tech, and a wall tech jump. The masters were generated from the approved get-up contact sheets and registered to the floor or an airborne body anchor. Loopy's jersey remains plain cream with purple trim. The Dojo renderer mirrors the wall contact poses toward the platform face recorded by the engine.

The four clips per fighter use the existing 26-tick neutral tech, 40-tick rolling tech, and 24-tick wall art cue timelines. All 76 renderer tests, 16 server wall-tech and ground-recovery tests, and the client type check passed. The three source grids had clear opaque-pixel gutters, the packed rectangles passed bounds checks, and the largest atlas is 3,712 × 3,542. Live Dojo wall contact and animation cadence still need a playthrough.

[Mr. Wrong tech master](../../concept-art/sprite/pack-03-pilot/mr-wrong-tech.png) · [Loopy tech master](../../concept-art/sprite/pack-03-pilot/loopy-tech.png) · [Mrs. Tasselbottom tech master](../../concept-art/sprite/pack-03-pilot/mrs-tasselbottom-tech.png)

The next drawing batch covers trips and jab-lock reactions. Ceiling-tech artwork also remains open.

## Pack 03 trips and jab locks

Pilot atlas revision 20 adds 33 packed drawings across the three fighters. The seven clips per fighter cover the slip and seated landing, the seated hold, standing and rolling recoveries, the seated floor attack, and face-up and face-down jab locks. The roll uses the compact tech drawings. The floor attack starts from the seated pose and uses the registered front and rear contacts from the get-up attack. Loopy keeps the blank cream jersey.

All 79 renderer and 25 server recovery tests passed. The floor-attack regression now checks the seated attack against the engine hit circles on every active tick for all three fighters in both facings. Source gutters and packed frame bounds passed. The largest atlas is 3,712 × 3,795. Live Dojo playback and animation cadence remain open.

[Mr. Wrong source](../../concept-art/sprite/pack-03-pilot/mr-wrong-trip-lock.png) · [Loopy source](../../concept-art/sprite/pack-03-pilot/loopy-trip-lock.png) · [Mrs. Tasselbottom source](../../concept-art/sprite/pack-03-pilot/mrs-tasselbottom-trip-lock.png)

Next, close the ceiling-tech artwork gap and continue to grab and throw reactions.

## Pack 03 ceiling tech

Pilot atlas revision 21 adds three dedicated drawings per fighter for overhead contact, compression, and release. The six frame entries span the existing 26-tick cue. The first pose places the raised hands within 0.25 world units of the collision underside for each fighter. The following poses pull clear while the tucked feet stay registered to the airborne body anchor. Loopy's jersey remains blank.

All 79 renderer tests and 103 server combat and launch tests passed. The new frames passed atlas bounds and opaque-pixel contact checks. Live Dojo playback at gameplay speed remains open.

[Mr. Wrong source](../../concept-art/sprite/pack-03-pilot/mr-wrong-ceiling-tech.png) · [Loopy source](../../concept-art/sprite/pack-03-pilot/loopy-ceiling-tech.png) · [Mrs. Tasselbottom source](../../concept-art/sprite/pack-03-pilot/mrs-tasselbottom-ceiling-tech.png)

Next, build grab and throw poses and their paired victim reactions.

## Pack 03 grab reaches

Pilot atlas revision 22 adds nine active grab drawings across the three fighters. Standing, dash, and pivot grabs each use their own reach on the active frames, with existing movement, reach preparation, and idle art for the surrounding frames. Successful grabs hand off to the existing hold clip. Loopy's jersey stays blank. Mr. Wrong's new sleeves are lighter than the neighboring poses and need a palette pass.

The atlas check confirmed three distinct active poses per fighter and verified all frame bounds. All 79 renderer tests and 55 server grab tests passed. Live Dojo contact spacing and cadence remain open.

Next, draw the paired hold, pummel, and escape reactions, then build all four throw directions with matching victim poses.

## Pack 03 holds, pummels, and escapes

Pilot atlas revision 23 adds five drawings per fighter. The holder has distinct hold and pummel poses, and the victim has distinct held, recoil, and escape poses. The pummel clip uses its authored impact drawing on the engine's active frame. The renderer resolves the victim against the active holder pose. Loopy's jersey remains blank.

All 18 packed hand and torso markers sit on opaque art. For each fighter, the grip position stayed within half a world unit between the hold and pummel poses. All frame bounds passed. The client type check, 79 renderer tests, and 55 server grab tests passed. Live paired Dojo playback is still needed to judge body overlap and escape timing.

Next, build the four directional throws and their paired release reactions. Mr. Wrong's grab reach sleeves still need the palette match noted above.

## Pack 03 directional throws

Pilot atlas revision 24 adds 24 release drawings across the three fighters. Every forward, back, up, and down throw has a dedicated thrower drawing and victim response. The held pair follows the existing grip through startup. The confirmed release selects its directional pose and aligns the victim to the registered release hand before blending back to simulation position.

The release regression checked all 72 combinations of direction, facing, thrower, and victim, including mirrors, using the actual packed frames. All 24 release markers landed on visible art. The client type check, full-body renderer suite, and server grab suite passed. Live Dojo review of body overlap, down-throw floor clearance, and recovery cadence remains open.

Next, play through the paired grab and throw sequences in the Dojo, including both facings and mixed fighter sizes. Correct any visible overlaps or handoff jumps before signing off the batch.

## Pack 03 live throw review

All 72 keyboard-driven Free Practice throws completed across the nine ordered Pack 03 pairings, four directions, and two facings. The browser recorded the first visible release at normal playback speed. The maximum sampled hand-to-victim gap was 5.94 world units. Animation-frame sampling can miss the exact release tick. The packed-frame regression verifies exact attachment on that tick. The maximum sampled down-throw bottom edge was 0.35 world units below the floor. Consecutive samples of the victim's vertical artwork offset changed by at most 2.94 units within the observed throw reaction.

The paired release board exposed substantial silhouette overlap in the down throws and some back throws, especially with wider fighters. Exact marker alignment alone does not establish a clear paired pose. Revision 25 isolates Mrs. Tasselbottom's forward victim drawing from stray pixels in the adjacent cell. The release regression passed after that crop correction.

Next, revise the down-throw poses and the worst back-throw pairs, then replay those directions at gameplay speed. The full throw art batch remains open for visual signoff.

## Pack 03 back and down throw spacing

Pilot atlas revision 26 adds six replacement release drawings. The back-throw arms extend behind the torso and attach to the victim's trailing ankle. The down-throw arms extend ahead of the knees and use the horizontal victim drawing mirrored toward the landing direction. This ankle-led staging reduces the torso overlap visible in revision 25. The revised Mrs. Tasselbottom source uses deep purple sleeves. Her first generated variant had incorrect sleeve colors and was rejected.

All 36 revised back and down throws completed in keyboard-driven Free Practice across nine ordered pairings and both facings. The deepest sampled down-throw bottom edge was 498.85 against the 500-unit floor, leaving 1.15 units of clearance. The first sampled contact gap reached 7.80 units on a back throw and 3.31 on a down throw as the victim separated. Exact release alignment passed the 72-case packed-frame regression. Every revised release marker landed on opaque art, and all atlas rectangles passed bounds checks.

The paired release board shows clearer torso separation in the revised directions. Forward-throw overlap with wider victims and the abrupt startup-to-release handoff still need a visual polish pass. Human feel signoff remains open.

[Mr. Wrong revised release sheet](../../concept-art/sprite/pack-03-pilot/mr-wrong-throw-spacing.png) · [Loopy revised release sheet](../../concept-art/sprite/pack-03-pilot/loopy-throw-spacing.png) · [Mrs. Tasselbottom revised release sheet](../../concept-art/sprite/pack-03-pilot/mrs-tasselbottom-throw-spacing.png) · [Generation brief and decisions](../../concept-art/sprite/pack-03-pilot/throw-spacing-provenance.json)

Next, refine forward-release spacing and add the intermediate throw windups before proceeding to footstools and ledges. The largest atlas is now 3,856 × 4,048. Additional drawings may require another atlas page.

## Pack 03 forward release and throw windups

November 11, 2026. Atlas revision 27 extends the forward release palms beyond the thrower's torso and adds a braced intermediate pose between the hold and each throw. Mr. Wrong and Loopy use a separate raised-hands windup for up throw. Mrs. Tasselbottom uses the braced windup in all directions because her generated raised-hands pose had an extra hand. During startup, victim attachment follows the currently displayed windup grip.

The eight selected drawings were made with built-in image generation from the approved holder sheets. The brief called for a compact braced hold, a two-palm shove extending beyond the knees, and a bent-elbow overhead preparation, with clean transparent gutters and the approved costumes. Loopy's jersey stays blank. Superseded release drawings were removed from packing to keep the largest atlas at 3,856 × 4,048.

All 18 keyboard-driven forward throws completed in Free Practice across nine ordered pairings and both facings. The largest first-sampled hand gap was 0.87 world units. The deepest sampled victim frame stayed 1.23 world units above the floor. The release board shows more torso separation, with some head and arm overlap on the widest pairs. All 80 renderer tests and the client type check passed, including the 72 packed release alignment cases. Human cadence review remains open.

[Mr. Wrong source](../../concept-art/sprite/pack-03-pilot/mr-wrong-throw-windup.png) · [Loopy source](../../concept-art/sprite/pack-03-pilot/loopy-throw-windup.png) · [Mrs. Tasselbottom source](../../concept-art/sprite/pack-03-pilot/mrs-tasselbottom-throw-windup.png)

Next, build paired footstool animations and check sole-to-head placement across the three fighter sizes.

## Pack 03 paired footstools

Pilot atlas revision 28 adds nine drawings. Each fighter has a planted airborne sole for the attacker, a grounded crumple, and an airborne victim reaction. The contact marker uses the visible top of the victim silhouette, including headwear or antlers. The existing renderer aligns the sole during the first four ticks and blends back to the simulation position as the attacker returns to the tuck drawing. The victim keeps its reaction drawing during the remaining cue.

All 36 Free Practice cases exercised a real footstool with controlled starting positions and a jump input. The matrix covered all nine ordered pairings, both attacker facings, and both victim roles. Rendered sole and head markers matched to rounding precision on the sampled contact frames. All nine markers landed on opaque pixels. All 80 renderer tests and the server footstool test passed. The longest atlas edge is 4,048 pixels. Human playback review of the bounce transition remains open.

The sheets were produced with built-in image generation using the approved held drawings as references. The brief called for three isolated right-facing poses with clear transparent gutters and the approved costume, including Loopy's blank jersey.

[Mr. Wrong source](../../concept-art/sprite/pack-03-pilot/mr-wrong-footstool.png) · [Loopy source](../../concept-art/sprite/pack-03-pilot/loopy-footstool.png) · [Mrs. Tasselbottom source](../../concept-art/sprite/pack-03-pilot/mrs-tasselbottom-footstool.png)

Next, build the ledge set and check hand and foot placement on both stage edges.

## Pack 03 ledge catch and hang

November 11, 2026. Atlas revision 29 adds a reaching catch and settled one-handed hang for each fighter. The catch settles into the hang drawing over the existing eight-tick transition. The curled hand registers to the platform lip, and the renderer mirrors the pose inward for the opposite edge. The six drawings were generated from the approved holder art using a brief for a diagonal reach and a relaxed hang with clear transparent gutters.

All six live Free Practice cases passed across the three fighters and both edges. Each run showed both drawings, and the 45 sampled grips were within 0.1 world units of the platform lip. All six packed grip markers landed on opaque hand pixels. The Loopy capture showed a clear silhouette and a blank jersey. Human cadence review remains open.

[Mr. Wrong source](../../concept-art/sprite/pack-03-pilot/mr-wrong-ledge-hang.png) · [Loopy source](../../concept-art/sprite/pack-03-pilot/loopy-ledge-hang.png) · [Mrs. Tasselbottom source](../../concept-art/sprite/pack-03-pilot/mrs-tasselbottom-ledge-hang.png)

Next, build ledge climb, roll, attack, jump, drop, and trump poses. Check hand-to-foot placement as the fighter crosses onto the platform.

## Pack 03 ledge climb and roll

November 11, 2026. Atlas revision 30 adds a pull-up, planted crouch, and tucked roll for each fighter. The existing hang starts both clips. The early pull-up retains its grip on the lip, then the crouch and roll register to the platform surface. Return to idle uses the fighter's own collision radius to place the feet on the floor. Ledge roll still uses the current simulation position at the edge, so this pass does not establish inward roll travel.

The nine drawings were made with built-in image generation using the approved hang sheets. The brief called for a shoulder-height pull-up grip, low planted crouch, and forward somersault in separate transparent cells. Loopy's jersey remains blank. The new drawings use a separate atlas page for each fighter because they exceed Loopy's main page capacity. Every packed frame fits its assigned page.

All 12 live Dojo cases passed across three fighters, two getups, and both edges. Sampled grips, the floor-registered phase, and first idle soles were within 0.15 world units of the intended surface. All three new grip markers landed on opaque pixels. The client type check and two renderer ledge tests passed. Server ledge tests had 43 passes and 13 existing skips. Human review of the hand-to-floor transition remains open.

[Mr. Wrong source](../../concept-art/sprite/pack-03-pilot/mr-wrong-ledge-getups.png) · [Loopy source](../../concept-art/sprite/pack-03-pilot/loopy-ledge-getups.png) · [Mrs. Tasselbottom source](../../concept-art/sprite/pack-03-pilot/mrs-tasselbottom-ledge-getups.png)

Next, build ledge attack, jump, drop, and trump.

## Pack 03 ledge attack, jump, drop, and trump

November 11, 2026. Pilot atlas revision 31 adds a planted ledge punch, rising jump, open-hand drop, and displaced trump reaction for each fighter. The ledge attack uses the pull-up and planted crouch before the active punch. The jump and drop return to existing airborne poses. The twelve drawings were generated with the built-in image tool from the approved hang references using a four-pose brief with transparent gutters and unchanged costumes, including Loopy's blank jersey. Sheets with visible background haze were replaced.

The shared ledge attack hitbox was previously centered 15 world units below the platform lip. The engine holds the fighter center 10 units below the lip during the option. The new move offset places the active circle 40 units above the lip, level with the three registered punch poses. Startup, active duration, radius, damage, and horizontal reach retain their existing values.

All 24 live Free Practice cases passed across the three fighters, four options, and two edges. In each of the six attack cases, the visible strike overlapped the active hit circle and a grounded partner entered hitstun. The three new packed contact regressions pass in both facings across all active ticks. The existing 80 renderer tests passed, and the server ledge suite reported 43 passes and 13 existing skips. Human transition and cadence review remains open.

[Mr. Wrong source](../../concept-art/sprite/pack-03-pilot/mr-wrong-ledge-actions.png) · [Loopy source](../../concept-art/sprite/pack-03-pilot/loopy-ledge-actions.png) · [Mrs. Tasselbottom source](../../concept-art/sprite/pack-03-pilot/mrs-tasselbottom-ledge-actions.png)

Next, build the entry, respawn, and results presentation clips, then resume full animation review.

## Pack 03 entry, respawn, and results

November 11, 2026. Pilot atlas revision 32 adds four drawings per fighter for the entrance flourish, suspended respawn, celebration, and defeat. Entry resolves to the existing idle pose. Respawn drop blends the suspended drawing into the existing airborne tuck. All three victory cue slots currently share the new celebration sequence. Defeat holds the slumped drawing.

The built-in image generation brief requested four isolated right-facing poses, transparent gutters, and the approved costume. Mr. Wrong's sheets with visible mattes were rejected before packing. The 12 selected drawings use compact presentation pages. Source gutters and every packed frame rectangle passed validation.

All 27 browser renderer cases passed with the real loaded textures and controlled cues. They cover entry and its return to idle, respawn wait and both drop phases, defeat, and all three victory cue slots for each fighter. Free Practice resets the entry cue and has no normal stock or results flow. Full match playback remains open until roster integration.

[Mr. Wrong source](../../concept-art/sprite/pack-03-pilot/mr-wrong-presentation.png) · [Loopy source](../../concept-art/sprite/pack-03-pilot/loopy-presentation.png) · [Mrs. Tasselbottom source](../../concept-art/sprite/pack-03-pilot/mrs-tasselbottom-presentation.png)

Next, add the taunts, alternate victory poses, and KO reactions before the full animation review.

## Delivery sequence

1. **Approve the five-fighter lineup.** Make one grounded scale board with the existing five as reference. Compare body height, full silhouette, foot line, grip and ledge hand placement. Sign off the first-pass stats and gameplay roles before full sheets.
2. **Build the Pack 03 Dojo pilot.** Produce idle, walk, run, jump and landing, a signature attack, a matched throw and victim reaction, and ledge hang for all three. Prioritize Mr. Wrong's forward tilt, Loopy's run-to-dash-attack, and Mrs. Tasselbottom's down throw and ledge placement. Compare Mr. Wrong with Moonshine, Loopy with Swift, and Mrs. Tasselbottom with Abe and Hoagie. Use frame stepping and collision overlays to verify contact in both facings. Confirm weight and KO behavior at several percents, and measure practical recovery for all three.
3. **Finish and release Pack 03.** Work through the current animation inventory by family. Finish movement and transitions, ground and air attacks and specials, shield and dodges, grab/throw pairs and victim reactions, damage and techs, ledges, and presentation. Review clips continuously at gameplay speed. Package atlases and menu portraits, verify Dojo and local/online selection, test two-client contact and delayed releases, and measure first-match loading with mixed art packs. Ship after Pack 03 passes.
4. **Build and release Pack 04.** Use the validated art and contact workflow. Prototype Zane and Velvet together against All-Rounder so their different ranges, rhythms, and recoveries are apparent before full production. Repeat the same animation, atlas, menu, Dojo, and two-client gates with Pack 03 included in the matchup coverage.

For throw verification, the five-to-eight roster step introduces 36 new ordered non-mirror pairings. The eight-to-ten step introduces 34. Test all four directions in those new pairings, spot-check opposite facings, and replay flagged cases under ordered guest-side delay. Verify existing-pack matchups with a regression sample. Also verify mirror player identification separately. [Animation inventory](../assets/ULTIMATE-ANIMATION-CHECKLIST.md#current-five-fighter-inventory) · [Throw-release verification](../assets/ULTIMATE-ANIMATION-CHECKLIST.md#throw-release-fix-and-two-client-verification) · [Art and atlas workflow](../assets/FULL-BODY-FIGHTER-ART.md)

## Pack 03 taunts, alternate victories, and KOs

Pack 03 pilot revision 33 adds three taunts, two alternate victory poses, and dedicated launch, Screen KO, and Star KO poses for Mr. Wrong, Loopy, and Mrs. Tasselbottom. Loopy retains the blank cream jersey. The KO effects remain separate from the fighter drawings. The taunts use held poses with idle at either end.

The atlas check verified nine distinct, in-bounds poses with transparency for each fighter. Next, review all cues at gameplay speed in the Dojo, including foot alignment, transitions, and the handoff into Screen and Star KO effects.

### Gameplay-speed Dojo review

At 1x in the local Dojo, all nine keyboard taunt cases entered the requested clip, kept the fighter art visible, and returned to idle. Atlas registration placed each taunt sole within 0.31 atlas pixels of its fighter's idle sole relative to the root. This measures vertical registration. Horizontal support-foot continuity and the direct idle-to-gesture cuts still need visual polish.

All six KO previews loaded and ran without browser or atlas-request errors. Screen KO advanced to below the 800 px viewport; Star KO changed from tumble to the dedicated tuck, shrank, and displayed the star accent. These are preview-path results. Next, record real hit-triggered Screen and Star KOs to inspect the launch handoff, and add intermediate taunt drawings where the gesture cuts or feet slide.

### Hit-triggered KO handoff

Six 1x browser runs paired All-Rounder with each Pack 03 fighter in the Screen and Star KO lessons. The isolated browser session bypassed the guided-roster restriction to select the pilot as partner. A keyboard up smash produced the hit, launch, and top exit in each case, and each lesson awarded one repetition. Renderer traces showed hit_low followed by hit_launch for each partner. Each Screen KO reached its bottom blast, and each Star KO reached its star accent. No browser or atlas-request errors were observed.

This verifies the game-triggered cue path in the guided Dojo. Match presentation and visual continuity at the handoff still need review. Next, draw and test taunt entry and recovery poses with planted feet.

### Taunt entry and recovery

Pilot revision 34 adds 18 full-body drawings for taunt entry and recovery. Each taunt now plays idle, entry, gesture hold, recovery, and idle on the existing timing. Transition roots were placed between the planted feet and aligned vertically to the soles. Loopy's jersey remains blank.

All nine keyboard taunts showed four distinct drawings at 1x in the browser Dojo, kept the fighter art visible, and returned to idle without browser or atlas-request errors. Check apparent foot slide in both facings during the final visual pass, alongside the match KO handoff.

### Taunt facing and foot placement

Pilot revision 35 registers the front sole of each taunt entry, hold, and recovery to the idle front sole. Before correction, the opaque front edge shifted by up to 25.1 atlas pixels between adjacent drawings. All 18 keyboard cases (three fighters, three taunts, two facings) passed at 1x in the Dojo with four distinct drawings, uninterrupted artwork, and a return to idle. Facing was verified from simulation state because the player marker counter-flips to stay readable.

Next, enable Pack 03 in an isolated match build for the visual KO handoff review before roster release.

### Isolated match KO handoff

Six local-match top exits covered Screen and Star KO for Mr. Wrong, Loopy, and Mrs. Tasselbottom. The browser test substituted the pilot into the second slot for that session. It placed the fighters close together and set a high defender percent, then used a keyboard up smash. Mrs. Tasselbottom needed a higher starting position to clear the platform with her larger hurtbox. Ordinary local-match stock, respawn, and KO presentation code ran for the successful hits.

All six traces showed hit_launch as the last visible fighter clip before the presentation cue, with upward exit velocity carried into the cue. Each Screen KO reached its bottom blast and each Star KO reached its star accent. The capture confirms the handoff and effect sequence under forced high-percent conditions. It leaves ordinary-percent visual feel and online timing open. Next, run the full Pack 03 clip coverage and fallback audit before production packaging and roster release.

### Full Pack 03 atlas audit

Revision 35 has 139 clips and 497 frame slots per fighter, drawn from 267 unique regions for Mr. Wrong and 266 each for Loopy and Mrs. Tasselbottom. All 1,491 frame slots loaded as browser textures. Every unique region was in bounds with opaque art, transparent pixels, and a finite root. The renderer type also lists reaction and air_dodge_directional. The current selectors use specific hit reactions and directional dodge clips; these two generic names are absent from the manifest and are not evidence of missing drawings on those paths. Texture coverage does not prove every gameplay state selects its intended clip.

Review boards exposed artwork drift that should be fixed before packaging:

- Mrs. Tasselbottom has the largest discontinuity. Her idle and movement use the long dark-purple skirt and repeated gold tassels. Several presentation, defensive, and floor poses shorten the skirt, expose more leg, simplify the tassel rows, and shift toward burgundy. A shared outfit redraw is needed across the affected batches.
- Mr. Wrong's idle uses bright teal branching tentacles and a vivid patchwork costume. Several presentation, grab, and floor poses turn the tentacles into muted gloves or single curled boots and replace the patchwork with brown and gold. Restore the idle anatomy and costume in the affected drawings.
- Loopy's jersey read as blank on the review boards. Later batches soften his outline and make the antlers, eyes, and muzzle rounder than the idle artwork. Inspect the softer air-hit, dodge, and tumble edges at native scale. The soft-alpha counts alone do not establish a glow. Inspect stray marks on the ledge and aerial crops for both Loopy and Mrs. Tasselbottom.

Next, correct costume and silhouette drift in the affected source sheets, then rerun the atlas audit and exercise the renderer state transitions for idle, air-fall, and polygon fallbacks before packaging.

### Artwork consistency corrections

Revision 36 replaces 28 drawings across Mr. Wrong and Mrs. Tasselbottom's finale and taunt transition sheets. The revised poses restore the branching teal tentacles and patchwork costume, and the full purple skirt with rows of gold tassels. The ledge jump and drop crop boundaries for Loopy and Mrs. Tasselbottom now fall in the clear gutters after the prior atlas scan found fragments at the edges of adjacent cells. The flagged up-air crop did not show a secondary component of eight or more pixels at alpha 128 in that scan.

All 139 clips and 497 frame slots per fighter loaded again. The 18 mirrored taunt playback checks passed with uninterrupted full-body art. Remaining before packaging are the older presentation, grab, defense, and floor sheets with costume drift, Loopy's native-scale edge review, and the broader gameplay-state fallback sweep.

### Entry, respawn, and results consistency

Revision 37 replaces four presentation drawings each for Mr. Wrong and Mrs. Tasselbottom. Entry, respawn, primary victory, and defeat now use the tentacles and bright patchwork or the full tasseled gown established in idle. One Mrs. Tasselbottom draft was discarded for its opaque matte and another for background residue. The installed respawn drawing uses a tucked silhouette.

All 1,491 frame slots loaded in the browser and all 27 controlled presentation cues passed across the three pilots. Remaining artwork includes grab, defensive, and floor sheets with costume drift, plus Loopy's native-scale edge review. The broader gameplay fallback sweep and production packaging remain open.

### Grab reach consistency

Revision 38 restores the standing, dash, and pivot grab reach drawings for Mr. Wrong and Mrs. Tasselbottom to their idle costume designs. Mr. Wrong's new one-row sheet uses revised horizontal registration and scale. Browser checks selected the correct active drawing at startup completion for all nine fighter and grab combinations, and all 1,491 frame slots loaded. Paired hand-to-victim alignment still needs a gameplay check. Next, review the grab-to-hold transition and restore the defensive and floor drawings that still drift from idle.

### Standing grab to hold review

At 1x in Free Practice, all nine ordered Pack 03 attacker/partner pairings, including mirrors, completed a standing grab in both facings. All 18 traces showed visible grab art followed by visible grab_hold and grabbed art on the first sampled hold tick. The held hand-to-torso anchor gap ranged from 0 to 4.71 world units and was identical in both facings for each pairing. The largest gap was Mrs. Tasselbottom holding Loopy. This measures the first held pose. Visual continuity of the reaching hand and paired dash/pivot contact remain open.

Next, restore the defensive and floor drawings to the idle designs, then rerun the wider gameplay fallback sweep before packaging.

### Shield and parry artwork consistency

Revision 39 replaces 18 guard drawings for Mr. Wrong and Mrs. Tasselbottom, covering shield raise, hold, impact, drop, and parry. The redraws use the idle costume references and updated ground registration. All 18 frame-traced Dojo checks passed for guard, shield impact, and parry across the three pilots and both facings. Next, review and restore drift in the evade and floor sheets, then return to Loopy's native-scale edge review and the full fallback sweep.

### Ground dodge and neutral air dodge consistency

Revision 40 replaces 24 drawings for Mr. Wrong and Mrs. Tasselbottom across spot dodge, both rolls, and neutral air dodge. The redraws restore the idle costume and update the airborne anchors. All 1,491 frame slots loaded. All 48 Dojo cases passed across both facings, fresh and fully fatigued, with three visible drawings aligned to the simulation's intangibility phase. An older directional-air test expected the neutral clip and was excluded from this sheet's sweep. Its trace showed the directional clip visible.

Next, restore the floor-reaction artwork and then review Loopy's native-scale edges and remaining fallback paths.

### Floor and tumble recovery consistency

Revision 41 replaces 24 tumble recovery and face-up and face-down knockdown drawings for Mr. Wrong and Mrs. Tasselbottom, with new crop boundaries and anchors. All 1,491 frame slots loaded. The Dojo sweep passed 12 knockdown-to-prone and six tumble-recovery checks across both facings and all three pilots. Grounded poses aligned to the platform and airborne recovery handed off to the fall loop after 12 ticks. The older test assumed a four-frame knockdown with a frozen prone pose. The rerun checked the current manifest schedules instead.

Next, inspect Loopy's suspect edges at native scale and complete the wider gameplay fallback sweep before production packaging.

### Loopy native-scale edge cleanup

Revision 42 trims diffuse alpha outside the ink silhouette on Loopy's jab, spot dodge, air-hit, and tumble source drawings during atlas building. A native-resolution comparison on light and dark backgrounds showed faint outer fringes concentrated in the air-hit, dodge, and tumble frames. The pre-cleanup sample counted up to 379 soft pixels more than two atlas pixels from opaque ink in one tumble drawing. The filter preserves opaque art and nearby antialiasing.

All 1,491 frame slots loaded after rebuild. Loopy passed all 16 dodge timing checks across both facings and both fatigue endpoints. Next, run the broader gameplay-state fallback sweep before production packaging.

### Gameplay renderer fallback sweep

Revision 42 passed 25,246 controlled browser renderer updates across the three pilots and both facings. Cases covered player states, move startup through recovery, directional dodge inputs, shield reactions, floor orientations, taunts, and selected transition cues. Browser-only instrumentation counted zero idle/fall substitutions and zero missing full-body draws. All 1,491 registered frame slots loaded. An initial run treated ledge attack as a generic ATTACK and produced fallback calls. The corrected sweep uses the dedicated LEDGE_ATTACK state.

The sweep covers renderer inputs. Actual Dojo and match transitions remain covered by the targeted checks above. Next, package the production atlas and repeat texture coverage and representative gameplay checks against the packaged assets before roster release.

### Pack 03 production atlas

Build the source atlas with `node scripts/assets/build-pack-03-pilot.mjs`, then run `node scripts/assets/build-production-fighter-atlas.mjs --pack-03`. The output lives under `apps/client/public/fighter-art-pack-03-v1/production/`. Revision 42 produced seven 2048-pixel pages with 1,491 frame slots, 39,832,958 encoded bytes for the full pack, and 112 MiB of estimated decoded RGBA texture memory. The report includes per-page hashes. The Pack 03 Dojo loader selects a revision-matched package, with `?atlas=source` available for comparison.

The packaged browser check loaded all 139 clips per fighter and the 25,246-update renderer sweep recorded zero missing sprites and zero idle/fall substitutions. Next, test production load cost and isolated match playback before enabling the release roster.

### Packaged load and match verification

Cache-disabled Chromium on local Vite with 8 Mbps throughput and 80 ms latency measured per-fighter artwork preload, excluding menu and countdown time. The package completed with all 139 clips in 18.63 seconds for Mr. Wrong (14.43 MB), 19.88 seconds for Loopy (15.16 MB), and 17.22 seconds for Mrs. Tasselbottom (12.53 MB). All three source-mode runs returned without fighter art after 17.55 to 17.62 seconds, so there is no successful source timing baseline at this throttle. These are local development-server measurements.

Six isolated local-match KO checks passed against the packaged assets. A browser-only lineup override selected the pilot, and preset high damage enabled repeatable up-smash exits. All three pilots reached the Screen KO bottom blast and Star KO accent, with successful packaged page requests and no browser exceptions. Next, reduce selected-fighter transfer cost and retest on a built client before enabling the release roster.

### Lossless atlas compression and built-client load

The Pack 03 packer now writes lossless WebP pages. The seven pages dropped from 39,832,958 to 32,206,914 bytes (19.1%). Decoded alpha and visible RGB matched the previous PNG pages pixel for pixel. The superseded packaged PNGs were removed. All 1,491 frame slots and page dimensions are retained.

The client build passed and was served by the local game server in production mode. With cache disabled, 8 Mbps throughput and 80 ms latency, Free Practice was ready in 30.64 seconds for Mr. Wrong, 31.66 for Loopy, and 29.57 for Mrs. Tasselbottom. Their WebP transfers were 10.84 MB, 11.62 MB, and 9.75 MB respectively. The elapsed time includes match setup and competing asset requests. The previous local development-server measurement timed only the artwork loader, so it is not an end-to-end comparison.

Next, profile the assets competing with the selected fighter during Dojo entry and measure a same-build baseline before release roster enablement.

### Cold Dojo request profile and same-build baseline

On the same production build with cache disabled, 8 Mbps throughput, and 80 ms latency, Pack 03 Free Practice opened in 30.59 seconds for Mr. Wrong, 31.61 for Loopy, and 29.53 for Mrs. Tasselbottom. The comparison lineups with the same All-Rounder partner opened in 37.30 seconds for Abe Lincoln, 35.73 for Swift, and 24.43 for Moonshine. These are single cold runs per lineup, measured from Enter Free Practice to the visible Dojo panel.

The Pack 03 captures recorded 28.97 to 30.84 MB after entry. The selected pilot pages accounted for 9.75 to 11.62 MB. All-Rounder's four texture pages accounted for 15.06 MB, and the original and production manifest requests made up the rest of that pack's 18.33 MB total. The shared effects page added 0.13 MB. No stage-art transfer was recorded during the measured interval. The bottleneck is the combined lineup payload, with the partner's pages costing more than any selected pilot.

Next, reduce All-Rounder's cold transfer cost and avoid fetching the full source manifest during normal packaged loading where revision validation can be preserved. Retest these same lineups before enabling Pack 03 in the release roster.

### Original roster transfer and revision check

The built client verifies the original production atlas against a small revision marker generated from the source manifest at build time. Normal packaged loads skip the 2.43 MB source manifest. A browser test supplied a mismatched marker and verified that the built client loaded the source manifest, skipped production atlas pages, and entered Free Practice. Stronger lossless WebP encoding cut All-Rounder's four pages from 15.06 MB to 14.69 MB. The build checks decoded alpha and visible RGB for each compressed page.

All six lineups were replayed on the local production-mode server at 8 Mbps with cache disabled and 80 ms latency. Free Practice opened in 28.06 seconds for Mr. Wrong, 28.55 for Loopy, 26.58 for Mrs. Tasselbottom, 34.74 for Abe Lincoln, 32.67 for Swift, and 21.39 for Moonshine. Each used All-Rounder as the partner and skipped the full original source manifest. These single-run comparisons improved by 2.54 to 3.07 seconds. Next, reduce the remaining initial lineup payload, then repeat the release checks before enabling the roster.

### Compressed manifests and Pack 03 revision marker

The production build now emits Brotli versions of the three packaged manifests and a source revision marker for Pack 03. The server negotiates compressed or plain JSON. Both encodings were verified to decode to identical manifests. Transfer sizes changed from 843,186 to 95,807 bytes for the original production manifest, 236,991 to 18,662 for the newcomers Dojo manifest, and 217,717 to 16,667 for Pack 03. Normal Pack 03 loads also skip the full source manifest while checking its build-generated revision marker.

The production client build and server typecheck passed. At 8 Mbps and 80 ms latency with cache disabled and All-Rounder as partner, the six Free Practice retests were Mr. Wrong 26.50 s, Loopy 27.04 s, Mrs. Tasselbottom 25.48 s, Abe Lincoln 33.70 s, Swift 32.15 s, and Moonshine 20.33 s. All skipped the original and Pack 03 full source manifests on the packaged path. The Pack 03 lineups improved by 1.10 to 1.55 seconds from the immediately preceding run. Next, run the packaged release checks, including isolated local and online selection, readiness, and reconnect, before enabling the roster.

### Isolated Pack 03 roster release check

All three pilots were selected through the local fighter picker, confirmed with Ready, and started on the Neighborhood stage with packaged sprites visible. Two isolated online rooms covered Mr. Wrong versus Loopy and Mrs. Tasselbottom versus All-Rounder. Both clients completed fighter selection and shared stage selection, reached a live match with the chosen sprites visible, and the guest recovered the same slot and artwork after refreshing. The browser used the development client with production atlas pages. The roster entries and server acceptance were injected only for the isolated session.

Next, wire Pack 03 into the shipped roster, including selection portraits and fighter stats, and rerun the local and online smoke tests on a production build. Paused reconnect and deployed-host checks remain open for Pack 03.

### Pack 03 regular roster integration

Mr. Wrong, Loopy, and Mrs. Tasselbottom are enabled in regular local and online fighter select. The picker uses the full-body idle sprites as portraits and reads the existing gameplay profiles for stat comparisons. The server accepts the three IDs in normal room selection. Guided Dojo lessons still use their existing roster.

The built client on a local production-mode server passed three local selections and two online rooms covering all three fighters. The tests verified chosen IDs in live snapshots, successful packaged artwork requests, and live guest refresh with the same slot. A separate Mr. Wrong versus Loopy room passed paused refresh and resume. Eleven focused selection regression tests passed. The production browser smoke used snapshots and request checks because the art diagnostics are development-only. Deployed-host verification remains open.

### Four-frame gameplay idle loops

Revision 43 adds dedicated four-drawing idle loops for Mr. Wrong, Loopy, and Mrs. Tasselbottom at 12 ticks per frame. The builder matches each neutral pose to its previous on-stage height and registers the soles to the ground. Loopy's jersey remains blank. All 1,500 packaged frame slots loaded, and each fighter showed all four idle frames in the normal-speed Dojo. Fighter Select uses four-frame derivatives of the same artwork, checked at three window sizes.

Next, compare distinct drawings and timings across corresponding clips for all eight fighters to identify remaining Pack 03 animation coverage gaps.

### Animation parity inventory

The [eight-fighter animation comparison](../assets/PACK-03-ANIMATION-PARITY.md) records distinct poses, registered frame slots, and declared timing for 147 clip names. It identifies 26 present Pack 03 clips below every earlier fighter in distinct pose count. Idle now has four drawings across the roster. Start the repair pass with walk, run, jump squat, crouch entry and hold, and the airborne loops. Recheck motion on the floor and through the full jump sequence before moving to combat.
