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

## Pack 04 implementation

Branch: `fighter-pack-04`. Zane Corvo and The Velvet Reply have separate
character IDs and independent baseline stat records. Both start at weight 100
with standard movement. Workspace type checking passed with the new IDs.

- [x] Register both character IDs and baseline stats.
- [x] Implement both prototype move sets.
- [ ] Verify both kits against All-Rounder in playable Dojo bouts.
- [ ] Produce one gameplay idle sample per fighter using the approved color
  sheet. Check both facings, ground contact, gameplay scale, and alpha edges.
- [ ] Complete the animation matrix, including paired grabs, pummels and throws,
  ledge contacts, reactions, taunts, and results. Check atlas frames and triggers
  against the shipped roster and review both facings in the Dojo.
- [ ] Package gameplay atlases and selection art. Verify asset loading, roster
  selection, local play, and two-client matches before enabling general selection.

Zane's three jabs have tighter reach and one fewer recovery tick. His
forward tilt starts on tick 6 versus All-Rounder's 7, and his forward throw
has less launch force. Velvet's forward tilt starts on tick 9 with 16
recovery ticks, versus 7 and 12. Her forward aerial reaches farther, starts
two ticks later, and recovers three ticks later. Her back throw uses a
145-degree launch and 17 recovery ticks. These are prototype values.
Zane's forward-tilt step still needs animation and contact review.

Workspace type checking and the engine suite passed (1,104 passed, 1
skipped). Playable matchup and sprite-contact verification remain open.

The branch includes the latest fetched main changes (through 4deb165).
The first right-facing idle drawings use the approved roster colors and the
sketch sheets as pose reference. The source PNGs still need atlas
registration, mirrored floor-contact checks, and gameplay review.

[Zane idle](../../concept-art/sprite/pack-04/zane-corvo-idle.png) · [Velvet idle](../../concept-art/sprite/pack-04/velvet-reply-idle.png)

### Pack 04 Dojo idle pilot

Both fighters are available in Dojo setup as player or partner. Their
simulation uses the Pack 04 move overrides. The source atlas registers the
82-unit idle drawings at the base of their opaque bounds with a centered
horizontal pivot. The renderer reflects the horizontal axis for left-facing
play and keeps the floor pivot on the same vertical coordinate.

This milestone includes one idle drawing per fighter. Missing clips use
idle while the pilot art is loaded. Playable comparisons against All-Rounder,
dedicated combat and movement clips, and local and online release checks are
still open.

Chromium Free Practice passed for Zane versus passive All-Rounder and
Velvet versus passive All-Rounder. Both Pack 04 sprites loaded, turned
left and right, and landed a keyboard jab that put All-Rounder in hitstun.
Screenshots in both facings showed the boots meeting the main platform's
top edge. The default test server was serving an older build. The two
checks passed on a fresh Vite instance at port 5198 using
`PACK04_TEST_URL` with the `pack-04-dojo` Playwright spec.

Next is dedicated idle and grounded movement animation, followed by
authored jab, tilt, aerial and throw contact poses. This smoke test
covers the idle registration and jab input path. It does not establish
move-set balance or contact-pose alignment.

### Pack 04 idle loops

Source atlas revision 2 gives each fighter a resting and exhale drawing,
held for 24 ticks each. The checked Dojo idle drawings served as costume
references. Each drawing pivots at its sole baseline and uses the original
idle scale. Both Chromium Dojo smoke tests passed against All-Rounder.
Continuous playback has not been visually signed off. Grounded movement
is the next animation batch.

### Pack 04 walk cycles

Source atlas revision 3 adds four walk poses per fighter at five ticks
per pose. The sheets use the gameplay idle costumes as references. Each
pose uses a body-centered horizontal pivot and a sole baseline, with a
shared scale across the cycle. Both existing Chromium Dojo smoke tests
passed. Full-speed walk playback and alternating foot contact still need
review. Next are run, brake, and turnaround.

### Pack 04 run, brake, and turnaround

Source atlas revision 4 adds a two-pose run cycle and a dedicated drawing
each for braking and running turnaround. Both Chromium Dojo smoke tests
passed against All-Rounder. The tests did not exercise every new movement
clip. Alternating stride and transition continuity still need playback
review. Next are standing turn, crouch, jump squat, and takeoff.

### Pack 04 stance and takeoff

Source atlas revision 5 registers standing turn, a grounded crouch,
neutral takeoff, and an airborne tuck. Crouch entry, hold, exit, and jump
squat temporarily share the grounded drawing. The generated squat read
as airborne, so it was assigned to the apex clip. Both Chromium Dojo
smoke tests passed. Targeted transition playback remains open. Next
are dedicated rise, apex transitions, fall, double jump, fast fall,
and landing.

### Pack 04 airborne and landing poses

Source atlas revision 6 adds separate rise, apex, fall, double-jump,
fast-fall, and landing drawings. Soft and heavy landing currently share
the landing drawing. Each clip holds one pose. The source sheets have
transparent gutters despite the visible color in the generation preview.
Both Chromium Dojo smoke tests passed against All-Rounder. Targeted
jump-to-landing playback and separate landing transitions remain open.
The next art batch is jab and tilt contact poses.

### Pack 04 jab and tilt contact poses

Source atlas revision 7 adds separate contact drawings for all three jabs
and all three tilts for each fighter. Zane's forward tilt reads as a
stepping elbow strike and Velvet's as a horizontal boot kick. The
prototype clips hold each contact pose through the move. Dedicated startup
and recovery drawings and hitbox alignment in both facings remain open.
Both Chromium Dojo smoke tests passed against passive All-Rounder. They
cover landing a jab. Next are jab and tilt transitions and active-frame
alignment checks.

### Pack 04 strike transitions

Atlas revision 8 gives the six ground strikes a windup, contact, and
recovery. Forward tilt has its own lead-in and follow-through. Jab and
the other two tilts share the general punch transitions for now. The
renderer maps the authored contact window to each move's active ticks.
Type checking and both Dojo jab smoke tests passed. Contact alignment
in both facings remains open, followed by dash attack and smashes.

### Pack 04 ground strike contact audit

Measured estimated fist, elbow and boot contact points against the
grounded hit circles in atlas revision 8. Values below are world units
outside the circle, rounded to one decimal. Negative values indicate
overlap. Both facings have the same gaps because the sprite and hitbox
reflect about the same horizontal origin.

| Fighter | Jab 1 | Jab 2 | Jab 3 | Forward tilt | Up tilt | Down tilt |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Zane Corvo | 6.9 | 7.6 | -1.2 | 6.8 | -0.7 | 33.3 |
| The Velvet Reply | 5.4 | 5.2 | -0.6 | 0.0 | 5.8 | 34.8 |

Prioritize both down tilts. Draw the low strike with a shorter extension
and direct its striking surface toward the hit circle roughly 20 units
forward and 40.5 units above the floor. Shorten or lower the first two
jab contacts, bring Zane's elbow inward, and bring Velvet's rising fist
closer to the body axis. Velvet's forward kick sits at the circle edge
and needs a frame-step check. These are drawing measurements. Dojo
frame-step verification and the revised drawings remain open.

### Pack 04 corrected down tilts

Atlas revision 9 replaces both extended sweeps with compact crouching
body strikes using the gameplay costumes. Estimated knuckle contact is
25.0 forward and 37.7 above the floor for Zane, and 25.1 forward and
40.5 above the floor for Velvet. Both points fall within the existing
10-unit hit circle in either facing. Both Chromium Dojo smoke tests
passed. Down-tilt frame stepping remains open alongside corrections to
Jab 1, Jab 2, Zane's forward tilt, and Velvet's up tilt.

### Pack 04 ground strike offset tuning

Adjusted the prototype hit circles for Jab 1 and Jab 2 on both fighters,
Zane's forward tilt, and Velvet's up tilt to meet their drawn contact
points. This uses move-specific offsets, so it changes gameplay reach
and height. Sprite pivots, hitbox radii, and move timing stay as authored.
Remeasure the contacts and frame-step in the Dojo before balance signoff.

The rebuilt engine's hit circles contain all six sampled contact points on
every active tick in both facings. Minimum clearance inside the circle
was 1.73 units for Zane Jab 1, 1.41 for Jab 2, and 0.72 for forward tilt.
For Velvet it was 4.45 for Jab 1, 4.17 for Jab 2, and 3.66 for up tilt.
These are measurements from the registered artwork and engine geometry.
Dojo frame-step playback remains open.

Chromium Dojo frame stepping passed for both fighters' right-facing Jab 1.
The regression test uses F6 and F7 to sample seven successive ticks and
compares the renderer's frame rectangle with the atlas windup, contact,
and recovery entries. Contact is selected at move ages 3 and 4. Left-facing
playback, the rest of the jab chain, and the tilts remain open.

Jab 1 frame stepping now passes facing left and right for both fighters.
Both browser tests passed with the contact drawing at move ages 3 and 4
in all four cases. Next is the full jab chain, followed by the three tilts.

The full three-hit jab sequence now passes the Chromium Dojo test for
both fighters in both facings. Fresh Attack presses queue Jab 2 and Jab 3.
Frame stepping checks atlas frame selection through the windups and links,
including Jab 1 and 2 contact at ages 3–4 and Jab 3 at ages 4–6. The step
limit accounts for repeated move ages during hitstop. Next is frame stepping
forward, up and down tilts in both facings.

### Pack 04 tilt frame-step verification

Both Chromium Dojo tests passed all three tilts in both facings. Direction
and Attack were sampled on the same frozen tick to select the tilt from
idle. The frame checks covered windup, every active age, and the first
recovery age. Forward tilt contact ages were 6–8 for Zane and 9–11 for
Velvet. Up tilt used ages 6–9 and down tilt used ages 5–6 for both.
These checks verify clip timing. Matchup balance and gameplay-speed
review remain open. Next are dedicated dash attack and smash poses.

### Pack 04 dash attack and smash contacts

Atlas revision 10 adds dedicated dash attack and forward, up, and down
smash contact drawings for both fighters. Existing sprint, brake,
crouch and guard art supplies provisional transitions. Down smash
mirrors its contact drawing for the rear active window. Both existing
Dojo jab and tilt browser tests passed. The new moves still need
frame-step timing and contact measurements in both facings.

### Pack 04 power-strike frame stepping

The Chromium Dojo suite checked dash attack and all three smashes in
both facings for both fighters. Contact ages were 8–12 for dash attack,
15–17 for forward smash, 12–16 for up smash, and 10–15 for down smash.
The visible sprite flips on down smash ages 13–15 for the rear hit.
The check covers displayed pose timing and direction. Spatial contact
measurements and dedicated transition drawings remain open.

### Pack 04 power-strike contact audit

Estimated contact points from the source drawings were projected using
atlas revision 10 and compared with engine hit circles on every active
tick in both facings. Values are world units from the circle edge.
Negative values indicate overlap. Down smash includes the rear phase.

| Fighter | Dash attack | Forward smash | Up smash | Down smash |
| --- | ---: | ---: | ---: | ---: |
| Zane Corvo | -3.9 | 2.3 | 2.8 | 22.0 |
| The Velvet Reply | -3.5 | 0.9 | 6.3 | 36.1 |

Both dash contacts fit. Redraw the down smashes with compact sweeps
first, then align the forward and up smash contact points. Keep the
existing authored hit windows for the retest.

Atlas revision 11 replaces both down-smash sweeps with compact planted
forearm strikes. The sampled striking surface is the leading elbow.
Estimated world contacts are about (19.5, 43.3) for Zane and (20.4, 42.2)
for Velvet, measured forward and above the floor. Both are inside the
front circle centered at (22.5, 43) with radius 14. The rear pose and
circle reflect about the same origin. Forward and up smash remain open.

Forward and up smash now use Pack 04-specific hitbox offsets. The sampled
contact points fall inside the circles on every active tick in both
facings. Both Chromium Dojo frame-step tests passed. The offsets tune
gameplay reach and height. Dedicated power-strike transitions remain open.

### Pack 04 power-strike transitions

Atlas revision 12 adds one dedicated windup and one dedicated recovery
for dash attack and all three smashes on each fighter. Both Chromium
Dojo tests passed in both facings, including the rear down-smash
contact. The tests verify pose selection and timing. Full-speed motion
and charged-smash playback remain open. Next are the five aerial
attack contacts and their transitions.

### Pack 04 aerial contacts

Atlas revision 13 adds neutral, forward, back, up and down aerial contact
poses per fighter, with pelvis anchors and a shared tuck for startup and
recovery. Custom sheet cuts preserve the extended kick silhouettes.
Existing ground-strike Dojo regression tests passed. Aerial timing,
hitbox alignment, landing handoffs and dedicated transitions remain open.

### Pack 04 aerial transitions

Atlas revision 14 adds a dedicated windup and recovery for each of
Velvet's five aerials. Zane retains the shared tuck. His generated
transition sheet had a semi-opaque background and was rejected.
Aerial frame-step and landing checks remain open.

Atlas revision 15 adds Zane's replacement aerial windups and recoveries
for all five moves. The source column gutters contain no pixels at or
above 50% opacity. Existing Chromium ground-strike tests passed for
both fighters. Next is aerial frame stepping in both facings and
landing handoff verification.

### Pack 04 aerial frame stepping

Chromium passed all five aerials in both facings for both fighters.
All active ages selected the contact cel and landing cleared the aerial
clip while keeping the full-body sprite visible. Back air exposed a
shared facing bug: the away input reversed the fighter after move
selection. The simulation now preserves facing during AIR_ATTACK.
Spatial hitbox alignment and full-speed landing continuity remain open.

### Pack 04 aerial contact audit

Estimated strike tips from the atlas were compared with the engine
circles across active ticks in both facings. Positive values show
world units outside the circle.

| Fighter | Neutral | Forward | Back | Up | Down |
| --- | ---: | ---: | ---: | ---: | ---: |
| Zane Corvo | 0.7 | 16.4 | 4.3 | 21.1 | 10.0 |
| The Velvet Reply | 5.8 | 1.7 | 9.7 | 15.3 | 7.4 |

Prioritize both up airs, Zane's forward air, and both stomps. Shorten
the drawn extensions while keeping Velvet's longer forward reach.
Recheck the smaller gaps after those redraws. Full-speed landing
continuity remains open.

Atlas revision 16 replaces five contact drawings: Zane's forward-air
knee and both fighters' up-air strikes and down-air stomps. The builder
registers each redraw with a frame-specific scale and airborne pivot.
The full Chromium Dojo frame-step suite passed for both fighters,
including contact selection in both facings and the landing handoff.
Next is remeasurement against the engine hit circles. The timing test
does not establish spatial overlap.

Atlas revision 17 refines the airborne pivots for Zane's up air and
both down airs. Remeasured the five redraws using estimated strike-tip
coordinates and the current engine hit circles. The smaller gaps in
the other aerial contacts remain open.

Revision 17 passed both Chromium Dojo frame-step tests, including all
aerial contacts in both facings and the handoff to landing. Minimum
clearance inside the hit circle across active ticks was 1.78 world units
for Zane forward air, 1.55 for up air, and 1.71 for down air. Velvet
up air measured 3.03 and down air 0.99. These use estimated strike-tip
coordinates. Both neutral airs, both back airs, and Velvet forward air
are next for alignment. Full-speed landing playback remains open.

Revision 18 aligns the remaining aerial contacts through artwork pivots.
The minimum sampled margins inside the circles were 2.20 for Zane
neutral air and 1.79 for back air. Velvet measured 0.63 for neutral
air, 2.33 for forward air, and 1.52 for back air. Both Chromium Dojo
frame-step tests passed. Next is gameplay-speed landing playback,
including a check for visible shifts from the adjusted pivots.

### Pack 04 aerial landing handoff

Pack 04 now uses its authored soft landing pose during LANDING_LAG.
The legacy jump clip was absent from this atlas, so the renderer had
fallen back to idle during lag. Both Dojo frame-step tests passed in
both facings with the landing-pose assertion. Visual review at normal
speed remains open.

The normal-speed Chromium attempt timed out before reliably observing
the descent trigger for either fighter. The frame-step test remains the
verified coverage. Normal-speed visual review remains open.

Normal-speed neutral-air landing now passes for both fighters in Chromium.
The regression positions each fighter above the main platform, clears the
initial input gate with one neutral step, then starts neutral air and
resumes at 1×. Both runs observed the authored landing pose during lag
and the return to idle. Visual review of continuity across the five
aerials remains open. The next art batch is shields and dodges.

### Pack 04 first defensive poses

Atlas revision 19 registers shield guard, parry, spot dodge, and a
forward roll with a tucked contact drawing for both fighters. Shield
raise shares the guard drawing. Roll borrows crouch and idle for its
bookends. All four existing Chromium Dojo tests passed. Those tests
cover strikes and landings. Targeted defensive playback remains open.
Next are dedicated shield raise, impact and release, followed by air
dodges and dodge landing.

### Pack 04 shield transitions

Atlas revision 20 registers separate shield raise, impact and release
drawings for both fighters. Atlas generation and distinct clip
registration passed. The Chromium worker exited before the first test
ran, so targeted defensive playback remains open alongside air dodges.

### Pack 04 first air dodges

Atlas revision 21 adds neutral, forward and upward air-dodge poses
with pelvis anchors and a planted dodge-landing pose. The renderer
keeps the dodge-landing cue ahead of the generic aerial landing pose.
Atlas generation and workspace type checking passed. Downward, backward
and diagonal poses, directional transitions and targeted Dojo playback
remain open.

Atlas revision 22 covers neutral plus all eight directions for both
fighters. The up-back source faces left and is reflected into the
atlas's right-facing convention. The atlas check found nine clips
with airborne anchors per fighter. Each direction has a single
authored pose. Continuous dodge-to-landing playback and transition
drawings remain open.

### Pack 04 air-dodge playback checks

Chromium verified all nine dodge selections in both facings for both
fighters (36 cases). Four straight-down dodge cases resumed at 1x and
showed the authored dodge-landing clip. The tests cover rendered clip
selection. In-between cels and visual continuity still need review.

Atlas revision 23 adds shared tuck and recovery drawings around the
directional travel poses, and sequences dodge landing from plant to
settle to stand. Both targeted Chromium tests passed, covering all 36
dodge clip selections and four 1x landing handoffs. These assertions
check clip selection. Visual continuity and unique transition artwork
remain open for the polish pass. Next are hit reactions and tumble.

### Pack 04 first damage reactions

Atlas revision 24 adds grounded and airborne recoil, a six-tick launch
pose and a tucked tumble pose. Airborne reactions use pelvis anchors.
Launch and tumble use the impact direction to orient the body. Atlas
generation and workspace type checking passed. Next are high, low and
heavy reactions, followed by tumble recovery and knockdown. Targeted
Dojo playback remains open.

### Pack 04 high, low and heavy hit reactions

Atlas revision 25 registers separate grounded high, low and heavy recoil
drawings for both fighters. Each uses a sole anchor. Atlas generation
and crop registration checks passed. These are single-drawing clips.
Targeted Dojo playback remains open. Next are tumble recovery and knockdown.

### Pack 04 tumble recovery and knockdown

Atlas revision 26 adds an airborne uncurl and distinct face-up and
face-down knockdown poses for each fighter. The airborne pose uses a
pelvis anchor and the floor poses use bottom anchors. Atlas registration
and client type checking passed. Targeted Dojo playback remains open.
Next are prone holds and get-up options for both orientations.

### Pack 04 prone holds and neutral get-ups

Atlas revision 27 adds distinct face-up and face-down prone holds and
rising poses. Neutral get-up starts from the matching hold, uses the
dedicated seated or kneeling drawing, then uses crouch and idle for the
finish. Atlas checks verified floor anchors and the hold-to-get-up
registration. Dojo playback remains open. Next are get-up rolls and attacks.

### Pack 04 get-up rolls and attacks

Atlas revision 28 adds orientation-specific rolls and floor attacks.
Each sequence starts from its matching prone hold. Rolls use the
requested direction on the authored tuck. Floor attacks mirror the
strike for the rear active window. Registration passed for both
orientations on both fighters. Dojo playback and strike geometry
remain open. Next are ground and wall techs.

### Pack 04 ground and wall techs

Atlas revision 29 adds dedicated neutral ground tech, rolling ground
tech, wall brace and wall-jump push-off poses for each fighter.
Wall poses use airborne anchors and mirror for the contacted wall.
The atlas build and client type check passed. Collision playback and
hand and boot alignment remain open. Next are ceiling tech, trip
and jab-lock reactions.

### Pack 04 ceiling tech, trip and jab lock

Atlas revision 30 adds ceiling brace, trip fall, seated hold, neutral
trip get-up and both jab-lock orientations. The ceiling brace uses an
airborne anchor. Jab locks return to their matching prone holds.
Atlas generation and client type checking passed. Ceiling contact and
floor transitions still need targeted Dojo playback. Next are trip
roll and trip attack, followed by paired grabs and throws.

### Pack 04 seated trip options

Atlas revision 31 adds trip roll and trip attack sequences. Both start
from the seated hold and reuse the existing floor roll and strike art.
Atlas checks passed for hold continuity and floor anchors. Dojo
playback and strike alignment remain open. Next are paired grabs.

### Pack 04 standing grabs

Atlas revision 32 adds standing reach, hold, held and escape poses
for both fighters. The holder hand and victim collar sockets are
registered inside their respective frame bounds. Pair alignment
in both facings still needs Dojo review. Next are dash and pivot
grabs, pummels, and throws.

Atlas revision 33 adds dash and pivot grabs. Dash uses a sprint lead-in
and brake recovery. Pivot uses the standing turn lead-in. Both borrow
the standing grab reach for contact. Atlas registration passed, with
live playback and dedicated contact drawings still open.
Next is the paired pummel.

### Pack 04 first pummel poses

Atlas revision 34 adds a holder strike and a victim flinch for both
fighters, with authored grip sockets and a return to the held poses.
The contact solver now uses the displayed frame scale for sockets.
Atlas socket bounds and client type checking passed. The visible strike
and grip sync still need Dojo playback in both facings. Throws are next.

### Pack 04 first throw releases

Atlas revision 35 adds four distinct throw release drawings per fighter.
The clips share the standing grip before release and idle afterward.
Atlas generation and distinct release registration passed. Directional
windups, victim drawings, grip continuity and Dojo timing remain open.

Atlas revision 36 registers Zane's four directional throw victim poses.
Velvet's candidate sheet showed visible white and colored matte in the
gutters and was rejected. Velvet's replacement, airborne registration
in the renderer, and paired Dojo playback remain open.

Atlas revision 37 registers Velvet's replacement sheet after the source
edge and center gutter alpha check. Both fighters have four distinct
release poses with airborne anchors. The existing Pack 04 HITSTUN
renderer path consumes those anchors. The final throw-victim cel
retains the standalone tumble scale. Paired Dojo playback and
directional throw windups remain open.

Atlas revision 38 adds directional throw windups for both fighters.
Before release, the contact solver samples the same authored timeline
as the holder drawing. All eight windup sockets are inside their
registered sprites. Client type checking passed. Paired Dojo playback
and release alignment remain open.

### Pack 04 paired throw playback

Chromium passed all four throws with either Pack 04 fighter holding,
in both facings (16 cases). Frame stepping confirmed the grabbed pose
before the throw and visible thrower and victim clips on the first
reaction tick. Grip spacing across the windup and the visual handoff
into tumble remain open.

At 200% partner damage, both Chromium tests passed the follow-through
in both facings. Forward, back and up throw reach the tumble drawing.
Down throw exits the reaction without losing the sprite, and the
test allows the ensuing floor or airborne reaction. This run checks
visible frame selection. Grip spacing and gameplay-speed continuity
remain open.

### Pack 04 throw windup grip spacing

Measured the holder's grip movement from standing hold to the directional
windup using each frame's registered scale. Mirroring changes the sign
of horizontal movement and preserves its magnitude.

| Fighter | Forward | Back | Up | Down |
| --- | ---: | ---: | ---: | ---: |
| Zane Corvo | 18.5 | 31.1 | 26.5 | 38.5 |
| The Velvet Reply | 10.9 | 28.3 | 31.0 | 31.8 |

Values are world units. Each move makes this change on a single animation
tick. The largest jump is Zane's down throw, which pulls the grip inward
33.8 units and lowers it 18.4 units. These measurements describe the
holder's artwork. Verify the rendered victim displacement separately
because the solver constrains vertical placement along the collar rail.
Add intermediate windup drawings with sockets on the visible hand,
starting with back, up and down throws. Replay both facings at 1x.

Atlas revision 39 adds an intermediate hand pose for back, up and down
throws. Maximum adjacent grip changes are now 18.0, 15.9 and 23.3 world
units for Zane and 17.1, 16.7 and 18.9 for Velvet, in that order.
The paired Chromium tests passed in both facings. The measurements
cover grip sockets. Normal-speed visual review remains open.

At 1x speed, Chromium observed visible thrower and victim reaction
clips together on all 16 releases. The test stages the grab while
frozen and resumes for the windup and release. All four browser
tests passed across 1x and frame-step modes. This verifies release
visibility. The visual smoothness of victim movement remains open
for the polish pass. Next is the ledge animation set.

### Pack 04 ledge catch and hang

Atlas revision 40 adds distinct ledge catch and hang poses, with
a leading-hand socket registered inside each frame. Atlas checks
passed. Live hand placement and art scale need Dojo review in
both facings. Next are ledge climb, jump, roll and attack.

### Pack 04 ledge options

Atlas revision 41 registers dedicated climb, jump, roll and attack
drawings. Climb, roll and attack use the hang at entry and existing
idle at exit. Jump has an airborne pivot registered. Atlas generation
and clip structure checks passed. Renderer playback, hand and sole
placement, and jump anchor use remain open. Next are ledge drop and
trump, followed by the in-game ledge alignment pass.

### Pack 04 ledge drop and trump

Atlas revision 42 adds four-tick-indexed pose sequences for ledge drop
and trump using the existing fall, tuck and recoil drawings. The
renderer uses airborne anchors for ledge jump, drop and trump.
Atlas generation and client type checking passed. Next is targeted
Dojo playback and alignment at both stage edges.

### Pack 04 ledge alignment corrections

Ledge contact now samples the same clamped frame as the displayed sprite,
and socket offsets respect the frame scale. Pack 04 also uses platform
height for the planted portion of ledge climb, roll and attack. Client
type checking and the three existing contact helper tests passed during
this pass. Both-edge Dojo playback remains open.

### Pack 04 ledge renderer verification

The Chromium regression passed for Zane and Velvet at both platform edges.
It checks catch and hang hand placement against the platform lip and sole
placement during the planted part of the climb using the gameplay atlas.
Next is live Dojo playback of the ledge transitions and getup options.

### Pack 04 live Dojo ledge options

Chromium Free Practice passed all 16 fighter, edge and input combinations.
Zane and Velvet approached from below, caught the correct ledge, showed the
hang sprite, and used keyboard inputs to climb, jump, attack or roll.
Each option displayed its dedicated full-body clip and returned to the floor.
The separate renderer test measures grip position and planted climb height.
This live pass checks clip transitions and landing, with no additional
alignment changes. Ledge drop and trump remain outside this live check.

### Pack 04 live Dojo ledge drop and trump

The extended Chromium Free Practice tests passed all 24 combinations
across Zane and Velvet and both stage edges. The eight added cases check
Down input from hang and a partner contest from the held ledge position.
Drop and trump showed their dedicated full-body clips, and each contest
entered the engine's ledge trump state. The tests used debug positioning
to set up the approaches and did not measure per-frame release alignment.

### Pack 04 ledge release alignment

Drop and trump now carry the full hang sprite offset through the first
release tick, including the change from the grounded to the airborne
anchor. The offset then fades to zero over six ticks. The browser renderer
test measures all seven ticks for both moves, fighters and edges. Both live
Chromium Dojo tests also passed all 24 ledge combinations. The live tests
verify state and visible clips. The per-tick measurements use controlled
renderer states with the gameplay atlas.

### Pack 04 live ledge release captures

Chromium Dojo frame stepping captured eight drop and trump sequences across
both fighters and both edges. The first release tick kept the hang offset
in all eight cases. The first fall tick previously added 28 world units
to the vertical sprite offset. Pack 04 fall now uses the same airborne
pivot as the final release drawing. The rerun verified the full six-tick
offset fade and zero relative offset through the first fall tick.
Playwright attaches the live frame samples as JSON. These measure sprite
anchors and clip selection with debug-positioned approaches.

### Pack 04 up-special recovery baseline

A live Chromium Dojo frame-step check confirmed that Zane and Velvet
both enter helpless fall and helpless landing after a grounded up special
against a passive All-Rounder. Full-body art stays visible, but the up
special uses idle and generic fall poses. Helpless and helpless landing
both use idle. The next art batch needs each fighter's up-special
windup, ascent and recovery, followed by a distinct helpless entry,
fall loop and planted landing. Then retest grounded and aerial starts
in both facings, including confirmed hits and the first landing tick.

### Pack 04 up-special and helpless clips

Atlas revision 43 assembles dedicated move timelines from approved Pack 04
drawings for up special, helpless entry and fall, and helpless landing.
The pass reuses existing drawings. Newly drawn poses and a gameplay-speed
visual review remain open. Chromium Dojo frame stepping passed all 16 cases
across both fighters, both facings, grounded and aerial starts, and whiffs
and confirmed hits. Hit cases used debug-positioned All-Rounder and verified
attacker hit freeze. Every case displayed full-body recovery art and entered
the helpless landing clip on the first grounded tick.

### Pack 04 dedicated recovery drawings

Atlas revision 44 adds six new drawings per fighter based on the shipped
idle costume references. The sheet covers windup, upward strike, apex,
helpless entry, fall, and planted landing. Landing recovers into the
existing standing drawing. The atlas builder and the 16-case Chromium
Dojo frame-step regression passed with the new art installed. This covers
both facings, grounded and aerial starts, hit freeze and the first
landing tick. Gameplay-speed visual review remains open.

### Pack 04 normal-speed recovery playback

Four Chromium Dojo captures at 1x cover confirmed grounded up-special
hits for Zane and Velvet in both facings against debug-positioned
All-Rounder. Each run showed hit freeze, helpless fall, helpless landing
and return to idle with visible full-body art and consistent facing.
Playwright attaches frame samples with clip, atlas rectangle and
vertical anchor. Grounded confirmed-hit cases ran at 1x in this rerun.
Aerial entries retained frame-step coverage. The captures are renderer
telemetry, so visual pose continuity still needs direct playback review.

### Pack 04 recorded recovery footage

The Chromium recovery regression passed again with video recording
enabled. The recording includes both fighters and both facings at
normal speed for grounded confirmed hits. The recording was generated
successfully. Visual continuity remains pending review of the footage.

### Pack 04 recovery footage review and atlas gaps

November 14, 2026. Reviewed a contact sheet sampled every ninth frame
from the recorded Chromium Dojo playback. Both fighters and facings
showed continuous ascent and descent, with no clear displacement jump
in the sampled images. No sprite changes were made. The sampling can
miss single-frame pose jumps. The existing frame-step regression covers
hit freeze and the first landing tick.

The lists below apply to both Zane and Velvet. The comparison uses the
three shipped Pack 03 production manifests as the baseline. Counts are
atlas frame entries and can include repeated drawings. Preview keys
and the generic jump key require trigger verification before assigning
production drawings. Other shipped packs can have different counts.

#### Missing clip keys (34)

- `entry`
- `respawn_wait`
- `respawn_drop`
- `victory_1`
- `victory_2`
- `victory_3`
- `taunt_up`
- `taunt_side`
- `taunt_down`
- `ko_launch`
- `ko_screen`
- `ko_star`
- `defeat`
- `footstool_attacker`
- `footstool_ground_victim`
- `footstool_air_victim`
- `dash_start`
- `jump`
- `takeoff_forward`
- `takeoff_backward`
- `platform_drop`
- `teeter_front`
- `teeter_back`
- `back_throw_victim_preview`
- `up_throw_victim_preview`
- `down_throw_victim_preview`
- `neutral_special`
- `side_special`
- `down_special`
- `counter_success`
- `roll_back`
- `shield_break_launch`
- `shield_break_dizzy`
- `shield_break_recover`

#### Shared clips below all three Pack 03 frame counts (73)

| Clip | Pack 04 | Pack 03 minimum |
|---|---:|---:|
| `idle` | 2 | 4 |
| `walk` | 4 | 6 |
| `run` | 2 | 6 |
| `brake` | 1 | 3 |
| `turn_stand` | 1 | 2 |
| `crouch_enter` | 1 | 6 |
| `crouch_hold` | 1 | 4 |
| `crouch_exit` | 1 | 6 |
| `jump_squat` | 1 | 2 |
| `air_rise_loop` | 1 | 2 |
| `air_apex_loop` | 1 | 2 |
| `air_fall_loop` | 1 | 2 |
| `double_jump_transition` | 1 | 3 |
| `air_fastfall_loop` | 1 | 3 |
| `land_soft` | 1 | 3 |
| `land_heavy` | 1 | 3 |
| `takeoff_neutral` | 1 | 2 |
| `turn_run` | 1 | 2 |
| `jab` | 3 | 9 |
| `jab_2` | 3 | 6 |
| `jab_3` | 3 | 6 |
| `dash_attack` | 3 | 4 |
| `forward_smash` | 3 | 4 |
| `up_smash` | 3 | 4 |
| `shield` | 1 | 2 |
| `shield_raise` | 1 | 6 |
| `shield_hit` | 1 | 3 |
| `shield_drop` | 1 | 6 |
| `parry` | 1 | 3 |
| `dodge` | 1 | 3 |
| `hit_mid` | 1 | 4 |
| `hit_air` | 1 | 6 |
| `hit_launch` | 1 | 2 |
| `tumble` | 1 | 4 |
| `hit_high` | 1 | 4 |
| `hit_low` | 1 | 4 |
| `hit_heavy` | 1 | 6 |
| `tumble_recover` | 1 | 6 |
| `knockdown_up` | 1 | 6 |
| `knockdown_down` | 1 | 6 |
| `prone_up` | 1 | 4 |
| `getup_up` | 4 | 6 |
| `prone_down` | 1 | 4 |
| `getup_down` | 4 | 6 |
| `getup_roll_up` | 5 | 6 |
| `floor_attack_up` | 6 | 7 |
| `getup_roll_down` | 5 | 6 |
| `floor_attack_down` | 6 | 7 |
| `tech_neutral` | 4 | 6 |
| `tech_roll` | 5 | 6 |
| `wall_tech` | 1 | 6 |
| `wall_tech_jump` | 4 | 6 |
| `ceiling_tech` | 1 | 6 |
| `trip_fall` | 3 | 6 |
| `trip_prone` | 1 | 4 |
| `trip_getup` | 3 | 6 |
| `jab_lock_up` | 2 | 4 |
| `jab_lock_down` | 2 | 4 |
| `trip_roll` | 5 | 6 |
| `floor_attack_trip` | 5 | 7 |
| `grab` | 3 | 6 |
| `grab_hold` | 1 | 4 |
| `grabbed` | 1 | 4 |
| `grab_release` | 2 | 4 |
| `grab_dash` | 3 | 6 |
| `grab_pivot` | 3 | 6 |
| `pummel` | 3 | 6 |
| `forward_throw` | 4 | 5 |
| `ledge_catch` | 1 | 4 |
| `ledge_climb` | 4 | 6 |
| `ledge_jump` | 1 | 6 |
| `ledge_roll` | 4 | 6 |
| `ledge_attack` | 4 | 6 |

Next, complete entry, respawn, taunts, KO reactions and results, then
close the remaining runtime clip and frame gaps. Audit triggers,
distinct drawings and fallback behavior before production packaging.


### Pack 04 presentation cue registration

Atlas revision 45 registers 13 presentation clips per fighter for entry,
respawn wait and drop, three taunts, three victory slots, defeat and
launch, Screen and Star KO. These timelines reuse existing approved
drawings. Screen and Star KO share a temporary pose. The atlas rebuild
and Chromium Dojo recovery regression passed. Presentation cue playback
still needs verification. Next, author distinct presentation poses and
check taunts and KO previews in the Dojo, then entry, respawn and results
through the match flow.

### Pack 04 dedicated presentation poses

Revision 46 installs twelve original presentation drawings per fighter
based on their shipped idle costumes. The drawings cover entrance,
respawn tuck, three taunts, three victories, defeat and separate launch,
Screen and Star KO poses. Respawn drop and taunt transitions also reuse
existing movement and idle frames. Both Chromium Dojo tests passed,
covering all six taunts and four KO previews. The atlas rebuilt
successfully. Full-match entry, stock-loss respawn and results playback
still need verification with Pack 04 fighters as match participants.

### Pack 04 full local match presentation

Both Chromium local-match cases passed with Zane and Velvet swapping
human and CPU slots. Each fighter showed entry in the human slot,
respawn wait and drop after a stock loss in the CPU slot, and victory
or defeat after the final stock. The CPU could resume attacking
immediately after respawn, so the check expects a return to active
playback rather than requiring an idle frame. The test substitutes
the lineup in the local browser and puts the CPU past the blast
boundary to trigger real stock loss. No production playback change
was needed. Alternate victory slots remain outside this two-player
test.

### Pack 04 alternate victory playback

Four Chromium three-player local matches passed. Zane and Velvet each
won from the second and third slots, selecting victory_2 and victory_3
respectively. Each results screen showed the winner's full-body sprite.
Playwright saved a screenshot for each case. The browser test substituted
the lineup and moved the other two fighters past the blast boundary on
their final stock. The match engine resolved elimination and selected the
winner. No playback fix was required.

### Pack 04 remaining clip priorities

Revision 46 closes the 13 missing presentation keys in the original
33-key inventory. Local matches and Dojo previews cover their runtime
cues. The three directional throw victim keys with a preview suffix
are read by the renderer. They fall back to the shared throw victim
clip when absent, so keep them in the paired-art audit. Generic jump
is also a live timeline fallback for airborne and landing states.

The next art batch covers neutral, side and down specials and successful
counter. Then finish shield-break launch, dizzy and recovery and the
three footstool roles. Movement gaps are dash start, generic jump,
forward and backward takeoff, platform drop, both teeters and backward
roll. After closing those 20 missing keys, remeasure frame depth and
distinct poses before packaging.

### Pack 04 specials and successful counter

Revision 47 adds one dedicated drawing for each neutral, side and down
special and successful counter per fighter, using the shipped idle
costumes. The clips reuse approved idle for transitions. Both Chromium
Dojo tests passed all 16 fighter, facing and clip combinations. The
successful counter used an incoming All-Rounder jab staged with debug
positioning. This verifies clip triggering and mirrored full-body
playback. Contact alignment and gameplay-speed transitions remain open.
Next are shield-break launch, dizzy and recovery.

### Pack 04 shield-break poses

Revision 48 adds dedicated launch, dizzy and recovery drawings for
Zane and Velvet using their shipped costumes. Both Chromium Dojo tests
passed. The Preview shield break control exercised launch, dizzy,
recovery and return to idle in both facings for both fighters. Each
state displayed the expected full-body clip. This covers the preview
sequence rather than a shield depleted by an opponent. Each clip holds
one new drawing. Next are the three paired footstool roles.

### Pack 04 footstool drawings

Revision 49 adds one dedicated drawing per fighter for the attacker,
grounded victim and airborne victim. Each uses its shipped idle costume
as reference. The atlas rebuild passed. Sole and crown socket coordinates
are initial placements. Paired Dojo playback and mirrored contact
alignment remain open, along with additional recovery frames.

### Pack 04 paired footstool playback

Both Chromium Dojo tests passed all eight combinations of attacker,
facing and grounded or airborne victim. A Jump input triggered the
engine interaction from staged positions. Both sprites showed the
correct paired clips and opposite facings. This checks activation
and mirroring. Exact sole-to-crown alignment and release continuity
remain open. Ten atlas keys remain missing from the Pack 03 comparison.

### Pack 04 footstool release

The attacker sprite now retains full socket correction through tick 2
and eases it to zero by tick 8 for Pack 04. This lets the sprite separate
from the victim before its footstool clip ends. Both paired Dojo tests
passed all eight trigger and facing cases after the change. Exact
placement on the drawn sole and crown and gameplay-speed continuity
remain open.

### Pack 04 footstool socket placement

Revision 50 adjusts the boot and crown coordinates against the six
cropped drawings. The largest correction moves Velvet's airborne
victim socket from her swept hair to the crown above her forehead.
The atlas rebuilt and all eight Chromium Dojo trigger and facing
cases passed. This pass inspected source pixels and verified clip
playback. Gameplay-speed paired contact and separation still need
direct visual review.

### Pack 04 normal-speed footstool separation

Both Chromium tests passed all eight cases with normal-speed sampling
after the frame-stepped trigger. Visible attacker sprites returned to
their normal offsets by tick 8 and exited the footstool clip. The
tests attach renderer samples as JSON. Visual review of both silhouettes
through contact remains open. Next art batch is dash start and jump.

### Pack 04 dash start and generic jump fallback

Revision 51 registers six entries each for dash start and the generic
jump fallback for both fighters. Dash uses the approved idle and running
drawings. Jump uses the approved takeoff, rise, apex, fall, double-jump
and landing drawings. Atlas generation and all three selected Chromium
Dojo regressions passed. These checks cover loading, turning and
up-special recovery. Dedicated dash-start drawings and direct dash
playback verification remain open. Eight atlas keys remain missing.

### Pack 04 directional takeoff

Revision 52 registers forward and backward takeoff for both fighters
using the existing takeoff, rise and double-jump drawings. The atlas
rebuilt and the Chromium Dojo recovery regression passed. Direct
directional takeoff playback and dedicated poses remain open. Six
missing atlas keys remain per fighter: platform drop, both teeters,
backward roll and the directional throw-victim keys still unregistered.

### Pack 04 platform drop and teeters

Revision 53 registers platform drop and both teeters using existing
crouch, fall, turn, brake and idle drawings. Atlas generation and the
Chromium ledge renderer regression passed. Direct Dojo playback of
these three cues and dedicated drawings remain open. A fresh manifest
comparison against shipped Pack 03 found exactly four missing keys
per fighter: backward roll and the back-, up- and down-throw victim
variants. This supersedes the earlier hand count.

### Pack 04 backward roll

Revision 54 adds the backward-roll variant for Zane and Velvet. It reuses
the existing entry and recovery drawings and mirrors the tuck only.
Chromium renderer checks with the gameplay atlas passed for forward and
backward selection in both facings for both fighters. Live input playback
remains open. Next are the back-, up- and down-throw victim variants.

### Pack 04 directional throw victims

Revision 55 registers back, up and down victim variants using the
existing authored directional release drawings and tumble. Forward
release now retains its intended timeline index when using the shared
clip. Four Chromium Dojo tests passed, covering paired throws at 1x
and frame by frame with the two fighters swapping roles. The atlas
builder skips identical PNG writes after intermittent Windows write
failures. Next is the frame-depth and distinct-drawing parity audit.

### Pack 04 revision 55 frame and drawing parity

The table compares Zane and Velvet with the minimum across the three
shipped Pack 03 fighters. Each cell lists frame entries and distinct
source crops. Distinct counts identify unique image and rectangle
pairs within a clip. Mirroring, offsets and repeated holds do not add
drawings. Different crops can still contain similar artwork. The table
includes clips where either Pack 04 fighter falls below either baseline.

102 clips fall below at least one minimum. 84 have fewer frame
entries and 100 have fewer distinct crops. These groups overlap.

| Clip | Zane frames / crops | Velvet frames / crops | Pack 03 minimum |
|---|---:|---:|---:|
| `air_apex_loop` | 1 / 1 | 1 / 1 | 2 / 2 |
| `air_dodge_land` | 6 / 3 | 6 / 3 | 4 / 4 |
| `air_dodge_neutral` | 6 / 2 | 6 / 2 | 3 / 3 |
| `air_fall_loop` | 1 / 1 | 1 / 1 | 2 / 2 |
| `air_fastfall_loop` | 1 / 1 | 1 / 1 | 3 / 3 |
| `air_rise_loop` | 1 / 1 | 1 / 1 | 2 / 2 |
| `back_throw_victim_preview` | 4 / 2 | 4 / 2 | 4 / 4 |
| `brake` | 1 / 1 | 1 / 1 | 3 / 3 |
| `ceiling_tech` | 1 / 1 | 1 / 1 | 6 / 3 |
| `counter_success` | 3 / 2 | 3 / 2 | 3 / 3 |
| `crouch_enter` | 1 / 1 | 1 / 1 | 6 / 4 |
| `crouch_exit` | 1 / 1 | 1 / 1 | 6 / 4 |
| `crouch_hold` | 1 / 1 | 1 / 1 | 4 / 2 |
| `dash_attack` | 3 / 3 | 3 / 3 | 4 / 4 |
| `dash_start` | 6 / 3 | 6 / 3 | 6 / 6 |
| `defeat` | 1 / 1 | 1 / 1 | 4 / 1 |
| `dodge` | 1 / 1 | 1 / 1 | 3 / 3 |
| `double_jump_transition` | 1 / 1 | 1 / 1 | 3 / 3 |
| `down_smash` | 4 / 3 | 4 / 3 | 4 / 4 |
| `down_special` | 6 / 2 | 6 / 2 | 3 / 3 |
| `down_throw_victim_preview` | 4 / 2 | 4 / 2 | 4 / 4 |
| `entry` | 6 / 2 | 6 / 2 | 6 / 3 |
| `floor_attack_down` | 6 / 5 | 6 / 5 | 7 / 7 |
| `floor_attack_trip` | 5 / 5 | 5 / 5 | 7 / 7 |
| `floor_attack_up` | 6 / 5 | 6 / 5 | 7 / 7 |
| `footstool_air_victim` | 1 / 1 | 1 / 1 | 6 / 6 |
| `footstool_attacker` | 1 / 1 | 1 / 1 | 6 / 6 |
| `footstool_ground_victim` | 1 / 1 | 1 / 1 | 6 / 6 |
| `forward_smash` | 3 / 3 | 3 / 3 | 4 / 4 |
| `forward_throw` | 4 / 4 | 4 / 4 | 5 / 5 |
| `getup_down` | 4 / 4 | 4 / 4 | 6 / 6 |
| `getup_roll_down` | 5 / 5 | 5 / 5 | 6 / 6 |
| `getup_roll_up` | 5 / 5 | 5 / 5 | 6 / 6 |
| `getup_up` | 4 / 4 | 4 / 4 | 6 / 6 |
| `grab` | 3 / 3 | 3 / 3 | 6 / 6 |
| `grab_dash` | 3 / 3 | 3 / 3 | 6 / 6 |
| `grab_hold` | 1 / 1 | 1 / 1 | 4 / 4 |
| `grab_pivot` | 3 / 3 | 3 / 3 | 6 / 6 |
| `grab_release` | 2 / 2 | 2 / 2 | 4 / 4 |
| `grabbed` | 1 / 1 | 1 / 1 | 4 / 4 |
| `hit_air` | 1 / 1 | 1 / 1 | 6 / 6 |
| `hit_heavy` | 1 / 1 | 1 / 1 | 6 / 6 |
| `hit_high` | 1 / 1 | 1 / 1 | 4 / 4 |
| `hit_launch` | 1 / 1 | 1 / 1 | 2 / 2 |
| `hit_low` | 1 / 1 | 1 / 1 | 4 / 4 |
| `hit_mid` | 1 / 1 | 1 / 1 | 4 / 4 |
| `idle` | 2 / 2 | 2 / 2 | 4 / 4 |
| `jab` | 3 / 3 | 3 / 3 | 9 / 9 |
| `jab_2` | 3 / 3 | 3 / 3 | 6 / 6 |
| `jab_3` | 3 / 3 | 3 / 3 | 6 / 6 |
| `jab_lock_down` | 2 / 2 | 2 / 2 | 4 / 4 |
| `jab_lock_up` | 2 / 2 | 2 / 2 | 4 / 4 |
| `jump_squat` | 1 / 1 | 1 / 1 | 2 / 2 |
| `knockdown_down` | 1 / 1 | 1 / 1 | 6 / 6 |
| `knockdown_up` | 1 / 1 | 1 / 1 | 6 / 6 |
| `land_heavy` | 1 / 1 | 1 / 1 | 3 / 3 |
| `land_soft` | 1 / 1 | 1 / 1 | 3 / 3 |
| `ledge_attack` | 4 / 4 | 4 / 4 | 6 / 5 |
| `ledge_catch` | 1 / 1 | 1 / 1 | 4 / 2 |
| `ledge_climb` | 4 / 4 | 4 / 4 | 6 / 5 |
| `ledge_jump` | 1 / 1 | 1 / 1 | 6 / 3 |
| `ledge_roll` | 4 / 4 | 4 / 4 | 6 / 5 |
| `neutral_special` | 6 / 2 | 6 / 2 | 3 / 3 |
| `parry` | 1 / 1 | 1 / 1 | 3 / 3 |
| `prone_down` | 1 / 1 | 1 / 1 | 4 / 4 |
| `prone_up` | 1 / 1 | 1 / 1 | 4 / 4 |
| `pummel` | 3 / 2 | 3 / 2 | 6 / 6 |
| `pummel_victim` | 4 / 2 | 4 / 2 | 4 / 4 |
| `respawn_wait` | 1 / 1 | 1 / 1 | 4 / 1 |
| `run` | 2 / 2 | 2 / 2 | 6 / 6 |
| `shield` | 1 / 1 | 1 / 1 | 2 / 2 |
| `shield_break_dizzy` | 1 / 1 | 1 / 1 | 4 / 4 |
| `shield_break_launch` | 1 / 1 | 1 / 1 | 4 / 4 |
| `shield_break_recover` | 1 / 1 | 1 / 1 | 4 / 4 |
| `shield_drop` | 1 / 1 | 1 / 1 | 6 / 6 |
| `shield_hit` | 1 / 1 | 1 / 1 | 3 / 3 |
| `shield_raise` | 1 / 1 | 1 / 1 | 6 / 6 |
| `side_special` | 6 / 2 | 6 / 2 | 3 / 3 |
| `takeoff_neutral` | 1 / 1 | 1 / 1 | 2 / 2 |
| `taunt_down` | 6 / 2 | 6 / 2 | 6 / 4 |
| `taunt_side` | 6 / 2 | 6 / 2 | 6 / 4 |
| `taunt_up` | 6 / 2 | 6 / 2 | 6 / 4 |
| `tech_neutral` | 4 / 3 | 4 / 3 | 6 / 4 |
| `tech_roll` | 5 / 4 | 5 / 4 | 6 / 5 |
| `teeter_back` | 4 / 2 | 4 / 2 | 4 / 3 |
| `teeter_front` | 4 / 2 | 4 / 2 | 4 / 3 |
| `trip_fall` | 3 / 2 | 3 / 2 | 6 / 6 |
| `trip_getup` | 3 / 3 | 3 / 3 | 6 / 6 |
| `trip_prone` | 1 / 1 | 1 / 1 | 4 / 4 |
| `trip_roll` | 5 / 5 | 5 / 5 | 6 / 6 |
| `tumble` | 1 / 1 | 1 / 1 | 4 / 4 |
| `tumble_recover` | 1 / 1 | 1 / 1 | 6 / 6 |
| `turn_run` | 1 / 1 | 1 / 1 | 2 / 2 |
| `turn_stand` | 1 / 1 | 1 / 1 | 2 / 2 |
| `up_smash` | 3 / 3 | 3 / 3 | 4 / 4 |
| `up_throw_victim_preview` | 4 / 2 | 4 / 2 | 4 / 4 |
| `victory_1` | 1 / 1 | 1 / 1 | 6 / 3 |
| `victory_2` | 1 / 1 | 1 / 1 | 6 / 3 |
| `victory_3` | 1 / 1 | 1 / 1 | 6 / 3 |
| `walk` | 4 / 4 | 4 / 4 | 6 / 6 |
| `wall_tech` | 1 / 1 | 1 / 1 | 6 / 4 |
| `wall_tech_jump` | 4 / 2 | 4 / 2 | 6 / 4 |

Next, expand idle, walk and run, starting with contact poses that
keep the feet aligned through the loop in both facings.


### Pack 04 four-pose idle loops

Revision 56 adds two costumed idle drawings for each fighter. The four
entries hold for 12 ticks each and share a sole-height baseline. Atlas
generation and both Chromium Dojo loading and turning cases passed.
An in-game loop review for horizontal boot drift remains open. Walk
and run are next.

### Pack 04 six-pose walk loops

Revision 57 adds two weight-transfer drawings per fighter with the
shipped walk sheets as costume references. The loops use six crops
over the existing 20-tick period, with both new crops registered at
the sole baseline. Atlas generation and both Chromium Dojo loading
and turning tests passed. Gameplay-speed foot drift and the faint
ground marks beneath Velvet's generated heels still need review.
Run expansion is next.

### Pack 04 six-pose run loops

Revision 58 expands both run loops from two to six distinct crops.
Four new drawings per fighter use the shipped run costumes. The loops
retain an eight-tick period, with lifted anchors for the flight poses.
The atlas build and both Chromium Dojo loading and turning regressions
passed. Direct gameplay-speed review of gait, mirrored foot contacts and
idle-to-walk-to-run transitions remains open.

### Pack 04 locomotion loop verification

The Chromium renderer regression passed all twelve combinations of
fighter, facing and idle, walk or run. It steps through each loop using
the gameplay atlas and checks visible textures, distinct frame counts,
the ground anchor and wrap to the first frame. Full-speed visual
review of gait and transitions remains open.

### Pack 04 live locomotion transitions

Two Chromium Dojo tests passed using simulated analog stick input at
normal gameplay speed. Both fighters entered walk at partial deflection,
run at full deflection and idle after release, facing left and right.
The checks verify visible clips through live inputs. Visual foot-sliding
and pose continuity remain open. Next art targets are brake and turns.

### Pack 04 brake and turn frame depth

Revision 59 expands brake to three crops and the standing and running
turns to two crops each, matching Pack 03 minimum frame and crop counts
for those clips. The sequences reuse approved drawings. The atlas built
and both live analog locomotion regressions passed. These regressions
check walk, run and return to idle. Direct cue and pose continuity
checks for all three expanded clips remain open.

### Pack 04 live brake and turn cues

Both Chromium Dojo regressions passed with simulated analog input.
Each fighter showed standing turn into walk, running turn back into
run, and brake into idle with inputs exercised in both directions.
This verifies visible clip selection and sequence order. Visual foot
placement and continuity remain open. Next art target is crouch
entry, hold and rise.

### Pack 04 crouch entry, hold and rise

Revision 60 expands each fighter's crouch to six entry frames, four
hold frames and six rise frames, with four, two and four distinct
crops respectively. The sequences reuse approved stance and recovery
art. Both Chromium Dojo tests passed in both facings after the tests
waited for the initial idle sprite before sending input. The checks
cover entry, hold, rise and return to idle. Visual boot continuity
remains open. Next are jump squat and airborne movement frame depth.

### Pack 04 jump squat and airborne frame depth

Revision 61 adds two jump-squat, rise, apex and fall entries, six
double-jump entries and three fast-fall entries per fighter. The
sequences reuse approved art. Fall and fast fall are still single
drawings held across multiple entries. Both ledge regressions and
the up-special recovery regression passed in Chromium. These cover
the ledge release-to-fall and grounded and aerial special paths.
Dedicated jump-to-landing and fast-fall continuity checks remain open.

### Pack 04 live jump-to-landing cues

Both Chromium Dojo tests passed in both facings. Keyboard input
triggered jump squat and double jump, followed by rise, apex, fall,
fast fall and floor contact. The tests frame-stepped the simulation
and checked visible full-body art and facing throughout the airborne
sequence. Gameplay-speed visual continuity and distinct fall drawings
remain open. Next frame-depth targets are soft and heavy landing.

### Pack 04 soft and heavy landing

Revision 62 gives both landing clips three distinct crops per fighter.
Soft landing uses the existing touchdown and takeoff poses before
idle. Heavy landing uses the dedicated helpless touchdown drawing and
crouch before idle. Pack 04 landing lag now advances soft landing
and preserves a selected heavy or air-dodge landing clip. All four
Chromium jump and dodge landing regressions passed. Direct measurements
of the soft and heavy poses through touchdown remain open.

### Pack 04 touchdown anchor verification

Chromium rendered every tick of both nine-tick landing paths for each
fighter and facing. All eight cases displayed three distinct textures
and held the crop bottom 28 world units below the fighter root, matching
the floor contact height. The test uses controlled renderer states with
the gameplay atlas. It measures vertical registration. Live visual
continuity and horizontal boot drift remain open. Next frame-depth
targets are the three jab clips.

### Pack 04 Jab 1 timing expansion

Revision 63 expands Jab 1 from three atlas entries to nine using seven
distinct approved crops. The authored contact pose is held on both
active ticks. Both Chromium Dojo regressions passed in both facings,
including active pose selection and the full chain through Jab 3.
Distinct drawing parity for Jab 1 and frame-depth expansion for Jab 2
and Jab 3 remain open.

### Pack 04 Jab 2 and Jab 3 timing expansion

Revision 64 gives both fighters six entries per clip using approved
windup, contact and recovery crops. Jab 2 uses the contact pose on
ticks 3 and 4, and Jab 3 on ticks 4 through 6. Both Chromium Dojo
tests passed the full jab chain in both facings with the expected
active poses. These tests check timing and frame selection. Spatial
hitbox alignment and dedicated in-between drawings remain open.
Next are dash attack and smash frame depth.

### Pack 04 dash attack and smash timing

Revision 65 adds an initial pose before the dedicated windup for dash
attack, forward smash and up smash using the existing idle drawing.
Each now uses four distinct crops. Down smash retains its four entries
and mirrored rear contact. Both Chromium Dojo tests passed the smash
timing and active pose checks in both facings. The first test run
incorrectly applied the expanded timing to unchanged tilts. The
corrected test passed. Direct dash attack playback still needs coverage.

### Pack 04 live dash attack pose

Both Chromium Dojo tests passed in both facings. Keyboard input
entered Run and then Dash Attack. Frame stepping confirmed the
dedicated contact crop on every tick with a live hitbox, with
the full-body sprite visible throughout the move. This verifies
timing rather than spatial contact. Next are shield and dodge
frame-depth gaps.

### Pack 04 shield and dodge frame depth

Revision 66 expands shield hold, raise, impact, drop, parry and spot dodge
to 2, 6, 3, 6, 3 and 3 timeline entries per fighter. The sequences reuse
approved drawings, and shield hold repeats its single pose. Atlas generation
and the four Chromium air-dodge and shield-break regressions passed.
Direct checks of shield raise, impact, release, parry and spot-dodge
pose progression remain open.

### Pack 04 live defensive cues

Both Chromium Dojo tests passed the eight combinations per fighter of
facing and shield release, shield impact, parry or spot dodge. The
tests also checked raise and hold during shield scenarios. A staged
All-Rounder jab struck held shield or landed on the release tick.
Spot dodge used Down after shield was established. The checks verify
visible clip selection at the relevant ticks, with per-pose continuity
still open. Next frame-depth targets are the hit reactions and tumble.

### Pack 04 hit reaction and tumble frame depth

Revision 67 expands mid, high and low reactions to four entries each,
heavy and airborne reactions to six, launch to two, tumble to four,
and tumble recovery to six. These sequences reuse approved recoil,
tuck and recovery drawings and include holds. The atlas build and all
four paired Chromium Dojo throw regressions passed at 1x and frame by
frame. Direct damage-reaction and tumble playback is next, including
checking which entries advance and whether airborne anchors jump.

### Pack 04 hit reaction pose verification

Chromium checked 28 controlled sequences across both fighters and
facings, covering mid, high, low, heavy and airborne recoil, tumble
and airborne tumble recovery. Each clip advanced through multiple
textures. Airborne poses kept the sprite anchored to the fighter
root through launch, tumble and recovery. This measures renderer
offsets with the gameplay atlas. Live hit-to-recovery visual
continuity remains open. Next frame-depth targets are knockdown
and prone holds.

### Pack 04 knockdown and prone timing

Revision 68 adds six knockdown entries and four prone entries per
orientation. Knockdown uses the existing impact and settled crops,
and prone holds one drawing. Eight controlled Chromium renderer cases
passed on rerun after an initial atlas load failure. Both fighters
kept their ground anchor and selected the matching prone orientation
at tick 18 in both facings. This verifies timing and vertical
registration. Distinct drawings and live continuity remain open.
Next are the floor get-up options.

### Pack 04 floor get-up frame depth

Revision 69 expands both orientations to six neutral get-up entries,
six get-up roll entries and seven floor attack entries per fighter.
Existing idle art supplies the extra recovery poses. Atlas generation
and duration checks passed for all twelve clips. Total duration and
floor attack contact timing are preserved. Next is live Dojo playback
of the get-up options in both orientations and facings.

### Pack 04 live floor recovery

Both Chromium Dojo tests passed all 24 combinations of fighter,
facing, knockdown orientation and get-up option. Each test staged
an actionable knockdown, then used live Jump, direction or Attack
input to select neutral get-up, get-up roll or floor attack. The
first tick showed the correct mirrored full-body clip. Full-speed
pose continuity and floor attack contact placement remain open.
Next frame-depth targets are ground, wall and ceiling techs.

### Pack 04 tech frame depth

Revision 70 expands neutral tech, tech roll, wall tech, wall tech
jump and ceiling tech to six atlas entries per fighter. The sequences
reuse existing brace, push, recoil and recovery art with held poses.
The atlas build verified all ten clip counts and airborne anchors on
every wall and ceiling entry. Live Dojo playback and contact alignment
are next.

### Pack 04 tech pose progression

All 20 controlled Chromium renderer cases passed. Both fighters reached
the sixth entry for neutral tech, tech roll, wall tech, wall tech jump
and ceiling tech in both facings. Ground and airborne sprite offsets
remained consistent. Collision-triggered Dojo playback and artwork
contact against the floor, wall and ceiling remain open.

### Pack 04 collision-driven tech setup

The staged Dojo launch fixture stayed in hit recoil on the intended
floor collision tick for both fighters, even with Shield input.
The fixture did not establish a techable impact, so it cannot verify
tech animation playback. No production changes were made and the
failed fixture was removed. Next, use an actual launch hit or port
the engine launch-impact fixture before checking art against all
three surfaces.

### Pack 04 collision-driven floor tech

Both Chromium Dojo tests passed in both facings on stage2. A browser-only
fixture injects the engine's low-speed downward launch into the live
match. Shield input on the impact tick selected the visible neutral tech
clip. This closes neutral floor-tech activation. Directional floor tech,
wall and ceiling collisions and artwork contact alignment remain open.

### Pack 04 directional floor tech

Both Chromium Dojo tests passed eight cases across Zane, Velvet and
both facings. Shield alone produced neutral floor tech, and Shield
with direction produced the visible tech roll on impact. The fixture
uses the engine launch path in the live match. Wall and ceiling
activation and drawn contact alignment remain open.

### Pack 04 wall and ceiling tech activation

Both Chromium Dojo tests passed the expanded 20-case collision matrix,
including neutral floor tech, tech roll, wall tech, wall-tech jump and
ceiling tech. The staged launch fixture uses both solid platform sides
for wall impacts and the underside for ceiling impacts. The first wall
fixture targeted distant stage boundaries and was corrected. The tests
verify clip activation and visibility. Drawn contact alignment remains
open.

### Pack 04 tech contact screenshots

The 20-case Chromium collision matrix passed again and saves a screenshot
at the first visible tech pose in each case. Review of the left-wall and
ceiling captures for both fighters showed the hands and boots overlapping
the Cathedral platform art. Its decorative facade extends below the solid
body, and the wall captures also place the fighter near the viewport edge.
These images do not isolate the collision lines. Next, capture with the
collision overlay and compare hand and boot placement against the solid
bounds before adjusting sprite offsets. No offsets changed in this pass.

### Pack 04 tech collision overlay captures

All 20 collision-driven Dojo cases passed with F3 enabled. The overlay
shows collision bounds and fighter hurtboxes. In Velvet's sampled
ceiling capture, the initial brace extends into the solid band's
vertical span. The highlighted hurtbox partly obscures the hands.
The capture supports measuring an explicit hand contact point in
world units before setting a correction. No offsets changed.

### Pack 04 ceiling brace registration

Revision 71 aligns the top of the opening brace crop to the solid
underside at the ceiling impact position. The previous anchor placed
that edge 15.2 world units above the underside for Zane and 11.525
for Velvet. The build verified the corrected anchor on all three
brace entries. The Chromium tech progression test and both live
collision tests passed. This measures the crop edge as the contact
point. Wall hand and boot placement and release continuity remain open.

### Pack 04 wall brace registration

Revision 72 anchors the opening wall-tech and wall-tech-jump brace
two source pixels inside the wall-facing crop edge, where the palm
and boot soles line up. Launch contact puts the fighter root at the
wall and the renderer mirrors the brace for the opposite face.
The atlas build, Chromium progression check and both live collision
tests passed. The handoff from brace to the push-off drawing still
needs a continuity check because the push-off uses a body anchor.

### Pack 04 wall push-off transition

Revision 73 reduces the initial horizontal brace-to-push registration
step from 32.19 world units for Zane and 35.28 for Velvet to one third
of those values per pose change. Both wall tech variants ease back
toward the body anchor over the push-off entries. The Chromium
progression test and twenty-case live collision matrix passed. Direct
visual continuity at gameplay speed remains open. Next frame-depth
targets are trip and jab-lock reactions.

### Pack 04 trip and jab-lock frame depth

Revision 74 expands trip fall and get-up to six entries each, seated
hold to four, and face-up and face-down jab lock to four each. Existing
drawings and holds supply the added entries. The atlas build and all ten
manifest count checks passed. Live reaction playback, floor contact and
distinct-drawing parity remain open.

### Pack 04 trip and jab-lock recovery playback

Both Chromium Dojo tests passed all twelve cases across both facings.
Staged trip and jab-lock states stepped through engine recovery to
idle with visible full-body art. The original 100-tick capture ended
during trip get-up; the 160-tick bound captured the full sequence.
This verifies cue progression. Drawn floor contact remains open.
Next are seated trip roll and floor attack frame-depth gaps.

### Pack 04 seated recovery frame depth

Revision 75 expands trip roll to six entries and trip floor attack
to seven for both fighters. The extra recovery pose uses the existing
idle exhale drawing. Floor attack holds its contact crop across two
entries. The build verified 26 and 21 total ticks respectively and
the unchanged floor attack active window from tick 6 up to tick 10.
Next is input-driven Dojo playback of both options in both facings.

### Pack 04 live seated recovery options

Both Chromium Dojo tests passed all eight fighter, facing and option
combinations. A staged seated trip accepted direction for roll or
Attack for floor attack. Each correct full-body clip showed on the first
tick and recovered to idle. Contact alignment and normal-speed visual
review remain open. Next frame-depth targets are paired grabs and pummels.

### Pack 04 paired grab and pummel frame depth

Revision 76 expands standing, dash and pivot grab and holder pummel
to six entries. Hold, victim hold and release have four entries, and
victim pummel retains four. The sequences reuse existing crops, and
the paired grip and contact windows are preserved. The atlas build
and four paired-throw Chromium tests passed. Direct pummel sync and
dash and pivot grab playback are next.

### Pack 04 paired pummel playback

Both Chromium Dojo tests passed all four combinations of holder and
facing. Starting from a live keyboard grab, Attack triggered pummel.
Every sampled victim flinch overlapped the holder pummel clip, both
bodies stayed visible, and both returned to their paired hold clips.
The test stages spacing and steps the Dojo clock. Spatial grip review
and direct dash and pivot grab playback remain open.

### Pack 04 live dash and pivot grabs

Eight frame-stepped Chromium Dojo cases passed across both fighters,
both approaches and both grab types. Live run and grab inputs selected
the dedicated clip, and a reversal on the grab tick selected pivot
grab. With All-Rounder staged in range, both moves connected and showed
grab_hold and grabbed. This verifies trigger and paired state handoff.
Grip geometry at gameplay speed remains open. Next is the forward
throw frame-depth gap.

### Pack 04 forward throw frame depth

Revision 77 adds a fifth forward-throw entry for both fighters by
using the existing grab-release drawing as the first recovery pose.
The 19-tick timeline and tick-6 contact window are preserved. The
atlas build and both timing checks passed, followed by all four
paired Chromium throw regressions at 1x and frame by frame. No
new drawing was commissioned. Next frame-depth targets are ledge
catch, climb, jump, roll and attack.

### Pack 04 ledge frame depth

Revision 78 expands catch to four entries and climb, jump, roll and
attack to six each. Catch repeats its registered grip pose. Other
sequences use existing movements and holds, including a rise drawing
in ledge jump. The Chromium renderer and both live Dojo ledge tests
passed, including the 24-case input matrix and release anchor samples.
Distinct-drawing parity and gameplay-speed pose continuity remain open.
Next, rerun the frame and crop audit against the updated manifest.

### Pack 04 revision 78 parity audit

Both fighters cover all 139 Pack 03 baseline clip keys. 70 clips fall below at least one minimum across the three shipped Pack 03 fighters. 12 have too few timeline entries and 68 have too few distinct crops. The groups overlap. A distinct crop is an image and rectangle pair. Held entries and mirrored copies do not add crops. This is a manifest audit. Gameplay-speed continuity and release verification remain open.

| Clip | Pack 03 minimum entries / crops | Zane | Velvet |
|---|---:|---:|---:|
| `air_dodge_land` | 4 / 4 | 6 / 3 | 6 / 3 |
| `air_dodge_neutral` | 3 / 3 | 6 / 2 | 6 / 2 |
| `air_fall_loop` | 2 / 2 | 2 / 1 | 2 / 1 |
| `air_fastfall_loop` | 3 / 3 | 3 / 1 | 3 / 1 |
| `back_throw_victim_preview` | 4 / 4 | 4 / 2 | 4 / 2 |
| `counter_success` | 3 / 3 | 3 / 2 | 3 / 2 |
| `dash_start` | 6 / 6 | 6 / 3 | 6 / 3 |
| `defeat` | 4 / 1 | 1 / 1 | 1 / 1 |
| `down_smash` | 4 / 4 | 4 / 3 | 4 / 3 |
| `down_special` | 3 / 3 | 6 / 2 | 6 / 2 |
| `down_throw_victim_preview` | 4 / 4 | 4 / 2 | 4 / 2 |
| `entry` | 6 / 3 | 6 / 2 | 6 / 2 |
| `floor_attack_down` | 7 / 7 | 7 / 6 | 7 / 6 |
| `floor_attack_trip` | 7 / 7 | 7 / 6 | 7 / 6 |
| `floor_attack_up` | 7 / 7 | 7 / 6 | 7 / 6 |
| `footstool_air_victim` | 6 / 6 | 1 / 1 | 1 / 1 |
| `footstool_attacker` | 6 / 6 | 1 / 1 | 1 / 1 |
| `footstool_ground_victim` | 6 / 6 | 1 / 1 | 1 / 1 |
| `getup_down` | 6 / 6 | 6 / 5 | 6 / 5 |
| `getup_up` | 6 / 6 | 6 / 5 | 6 / 5 |
| `grab` | 6 / 6 | 6 / 3 | 6 / 3 |
| `grab_dash` | 6 / 6 | 6 / 5 | 6 / 5 |
| `grab_hold` | 4 / 4 | 4 / 1 | 4 / 1 |
| `grab_pivot` | 6 / 6 | 6 / 4 | 6 / 4 |
| `grab_release` | 4 / 4 | 4 / 2 | 4 / 2 |
| `grabbed` | 4 / 4 | 4 / 1 | 4 / 1 |
| `hit_air` | 6 / 6 | 6 / 3 | 6 / 3 |
| `hit_heavy` | 6 / 6 | 6 / 5 | 6 / 5 |
| `hit_high` | 4 / 4 | 4 / 3 | 4 / 3 |
| `hit_low` | 4 / 4 | 4 / 3 | 4 / 3 |
| `hit_mid` | 4 / 4 | 4 / 2 | 4 / 2 |
| `jab` | 9 / 9 | 9 / 7 | 9 / 7 |
| `jab_lock_down` | 4 / 4 | 4 / 2 | 4 / 2 |
| `jab_lock_up` | 4 / 4 | 4 / 2 | 4 / 2 |
| `knockdown_down` | 6 / 6 | 6 / 2 | 6 / 2 |
| `knockdown_up` | 6 / 6 | 6 / 2 | 6 / 2 |
| `ledge_catch` | 4 / 2 | 4 / 1 | 4 / 1 |
| `ledge_climb` | 6 / 5 | 6 / 4 | 6 / 4 |
| `ledge_jump` | 6 / 3 | 6 / 2 | 6 / 2 |
| `neutral_special` | 3 / 3 | 6 / 2 | 6 / 2 |
| `prone_down` | 4 / 4 | 4 / 1 | 4 / 1 |
| `prone_up` | 4 / 4 | 4 / 1 | 4 / 1 |
| `pummel` | 6 / 6 | 6 / 2 | 6 / 2 |
| `pummel_victim` | 4 / 4 | 4 / 2 | 4 / 2 |
| `respawn_wait` | 4 / 1 | 1 / 1 | 1 / 1 |
| `shield` | 2 / 2 | 2 / 1 | 2 / 1 |
| `shield_break_dizzy` | 4 / 4 | 1 / 1 | 1 / 1 |
| `shield_break_launch` | 4 / 4 | 1 / 1 | 1 / 1 |
| `shield_break_recover` | 4 / 4 | 1 / 1 | 1 / 1 |
| `shield_drop` | 6 / 6 | 6 / 4 | 6 / 4 |
| `shield_raise` | 6 / 6 | 6 / 3 | 6 / 3 |
| `side_special` | 3 / 3 | 6 / 2 | 6 / 2 |
| `takeoff_neutral` | 2 / 2 | 1 / 1 | 1 / 1 |
| `taunt_down` | 6 / 4 | 6 / 2 | 6 / 2 |
| `taunt_side` | 6 / 4 | 6 / 2 | 6 / 2 |
| `taunt_up` | 6 / 4 | 6 / 2 | 6 / 2 |
| `tech_neutral` | 6 / 4 | 6 / 3 | 6 / 3 |
| `tech_roll` | 6 / 5 | 6 / 4 | 6 / 4 |
| `teeter_back` | 4 / 3 | 4 / 2 | 4 / 2 |
| `teeter_front` | 4 / 3 | 4 / 2 | 4 / 2 |
| `trip_fall` | 6 / 6 | 6 / 2 | 6 / 2 |
| `trip_getup` | 6 / 6 | 6 / 4 | 6 / 4 |
| `trip_prone` | 4 / 4 | 4 / 1 | 4 / 1 |
| `tumble` | 4 / 4 | 4 / 3 | 4 / 3 |
| `tumble_recover` | 6 / 6 | 6 / 3 | 6 / 3 |
| `up_throw_victim_preview` | 4 / 4 | 4 / 2 | 4 / 2 |
| `victory_1` | 6 / 3 | 1 / 1 | 1 / 1 |
| `victory_2` | 6 / 3 | 1 / 1 | 1 / 1 |
| `victory_3` | 6 / 3 | 1 / 1 | 1 / 1 |
| `wall_tech` | 6 / 4 | 6 / 2 | 6 / 2 |

Finish the remaining timeline deficits first. Then use the crop column to prioritize new drawings and verify their playback before packaging.

### Pack 04 timeline count completion

Revision 79 adds explicit holds to the twelve clips below the Pack 03
minimum. Both fighters now meet the minimum timeline entry count for
all 139 baseline keys. The added entries repeat existing artwork.
Ten Chromium Dojo and local match regressions passed for shield break,
footstool, entry, respawn and results. Neutral takeoff was verified
by the manifest comparison. The 68 distinct-crop gaps remain open.
Next, prioritize new drawings rather than further timeline padding.

### Pack 04 distinct drawing priorities

Revision 79 is the starting point. Use the revision 78 crop column
for the remaining deficits because the final timeline changes add
holds only. Work in this order, checking off a clip after the new
drawing plays at the intended tick in both facings.

1. Core movement and attacks. Start with dash start, normal fall
   and fast fall, then finish the outstanding jab and smash poses.
2. Defense and damage. Prioritize shield transitions, dodges, hit
   reactions and tumble, then knockdown, prone and tech recovery.
3. Paired and edge actions. Finish grabs, pummels, throw victims,
   footstools and ledge options with contact checks for both sprites.
4. Specials and presentation. Finish remaining special, shield-break,
   entry, respawn and results art where the crop baseline calls for it.

The first batch needs six new drawings per fighter: three dash-start
poses, one normal-fall pose and two fast-fall poses. For dash, show
weight transfer, first drive and the step into the run loop. For fall,
preserve the pelvis anchor while changing the limb silhouette. Fast
fall needs distinct entry and sustained descent shapes. Use the
shipped idle, run and air sprites as references. Check alpha edges,
foot and pelvis placement, both facings and normal-speed Dojo
transitions before counting the new crops toward parity.

### Pack 04 Zane dash and fall drawings

Revision 80 installs six new Zane drawings based on his shipped
costume. Dash start now has six distinct crops, normal fall two,
and fast fall three. The atlas build and both targeted Chromium
Dojo regressions passed in both facings. They cover jump-to-fast-fall
and dash-to-attack cues. Full-speed visual review of boots and pelvis
registration remains open. Next is Velvet's corresponding sheet.

### Pack 04 Velvet dash and fall drawings

Revision 81 installs Velvet's six costumed dash and fall drawings.
The manifest confirms both fighters meet the targets of six dash-start,
two normal-fall and three fast-fall crops. Both Velvet Chromium Dojo
regressions passed in both facings for dash attack and jump through
fast-fall landing. In-game alpha, boot and pelvis continuity still need
visual review before closing the batch.

### Pack 04 normal-to-fast-fall anchor

Fast fall now shares the Pack 04 airborne registration used by normal
fall. Previously entering fast fall restored the 28-unit grounded
sprite offset. Both frame-stepped Chromium Dojo cases passed the new
zero-offset assertion in both facings. The installed PNGs contain
partial-alpha pixels, which were left intact. Direct visual review at
gameplay speed of transparency, dash foot placement and pose continuity
remains open.

### Pack 04 movement capture status

Both Chromium analog locomotion regressions passed with recording
enabled. A separate normal-speed capture confirmed dash start for both
fighters in the first tested direction. Its first setup ended at a ledge
teeter, and after resetting the arena between actions, the short jump
input did not yield the expected fall clip. The temporary capture test
was restored. Full-speed visual signoff for dash and fall remains open.
The existing frame-step fall and fast-fall anchor checks still stand.

### Pack 04 normal-speed descent captures

Holding Jump until airborne fixed the capture setup. Both Chromium
Dojo runs passed normal fall, fast fall and floor contact in both
facings. The videos are under test-results/pack04-descent. Sampled
contact sheets showed no obvious halo or abrupt vertical displacement
at the reviewed scale. This was a sampled visual review and cannot
rule out a single-frame jump or fine alpha fringe. No art changed.
Dash-specific boot placement still needs direct review.

### Pack 04 dash-start boot baseline

The Chromium locomotion regression now checks all six dash-start
textures in both facings for both fighters. Every crop bottom aligns
with the floor baseline. A pixel scan found opaque sole pixels on the
bottom row of all twelve textures. This establishes vertical crop
registration. Horizontal boot drift during live acceleration remains
unmeasured. Next artwork targets are the outstanding jab and smash
crops.

### Pack 04 Zane Jab 1 drawings

Revision 82 adds two Zane drawings using his shipped costume. The guard
drawing opens the move and the extension replaces the repeated crop on
active tick 4. The nine-entry clip now has nine distinct crops. The
Chromium Dojo chain test passed in both facings. It checks displayed
frames and timing. Exact fist alignment with the active hitbox remains
open. Next is Velvet's Jab 1 art.

### Pack 04 Velvet Jab 1 drawings

Revision 83 adds Velvet's opening guard and second active strike using
her shipped costume. Both Jab 1 clips now use nine distinct crops.
Velvet's Chromium Dojo chain regression passed in both facings,
including selection on active tick 4. Spatial fist-to-hitbox alignment
still needs verification for both fighters.

### Pack 04 Jab 1 fist alignment

Revision 84 shifts the two active crops horizontally while retaining
their floor baseline. Manually marked fist centers mapped inside the
configured Jab 1 circles on ticks 3 and 4 in both facings. Zane measured
17.66 and 16.84 world units from center with a radius of 20. Velvet
measured 19.66 and 20.41 with a radius of 22. These are atlas-space
measurements. Next are the remaining smash drawings.

### Pack 04 dedicated rear down smash

Revision 85 adds one costume-matched rear sweep drawing for each
fighter, replacing the mirrored copy of the front drawing. Runtime
mirroring still directs the new pose behind the fighter. Both Chromium
Dojo tests passed front and rear active pose timing in both facings.
Down smash now uses four distinct crops. Rear boot alignment against
the active hit circle still needs measurement.

### Pack 04 rear down-smash boot alignment

Manually marked boot centers on the rear-sweep crops land inside
the 28-unit rear hit circle in both facings throughout active ticks
13 through 15. The mirrored registration is within 11 world units
of center for Zane and 19 for Velvet. This measures atlas geometry.
The existing Dojo timing checks verify when the rear pose displays.
Next artwork targets are shield transitions and dodge poses.

### Pack 04 distinct shield transitions

Revision 86 adds four costume-matched guard drawings per fighter.
The atlas now uses six distinct crops each for shield raise and drop
and two for shield hold. Drop reuses the intermediate raise poses in
reverse after its original release drawing. Both Chromium Dojo defense
tests passed in both facings, covering the shield cues, parry and spot
dodge. Cue checks do not establish visual boot continuity. Next are
neutral air-dodge and air-dodge landing drawings.

### Pack 04 distinct air dodge and landing

Revision 87 adds a tucked neutral dodge and a planted landing recovery
drawing for each fighter. Neutral dodge has three distinct crops and
dodge landing has four. The atlas rebuilt and both Chromium Dojo air
dodge and landing checks passed in both facings. The checks cover cue
selection. Exact floor and pelvis continuity remain open. Next are
distinct hit reactions and tumble poses.

### Pack 04 Zane distinct recoil poses

Revision 88 adds six Zane drawings based on his shipped costume.
Mid, high and low recoil now have four distinct crops each. Heavy
recoil has six and tumble has four. The Chromium renderer regression
passed in both facings for both fighters, including airborne anchors.
Live visual continuity remains open. Next is Velvet's corresponding
sheet, followed by the airborne hit and tumble recovery deficits.

### Pack 04 Velvet distinct recoil poses

Revision 89 adds six Velvet drawings based on her shipped costume.
The atlas now verifies both fighters at four distinct crops each
for mid, high and low recoil and tumble, and six for heavy recoil.
The Chromium renderer progression and anchor regression passed
across both fighters and facings. Live visual continuity remains
open. Next are airborne hit and tumble recovery drawings.

### Pack 04 Zane airborne hit and tumble recovery

Revision 90 adds six Zane drawings based on his shipped costume.
Airborne hit and tumble recovery each use six distinct crops. The
initial build attempted to load the corresponding Velvet sheet and
was corrected to scope the addition to Zane. The atlas rebuild and
Chromium renderer progression and anchor check passed. Gameplay-speed
pelvis continuity remains open. Next is Velvet's matching sheet.

### Pack 04 Velvet airborne hit and tumble recovery

Pilot atlas revision 91 adds six dedicated Velvet poses using her shipped
costume. Airborne hit and tumble recovery each use six distinct crops,
mixing the new drawings with established transition poses. The targeted
Chromium Dojo renderer test passed for both fighters in both facings.
Gameplay-speed continuity from hit through recovery remains open.

### Pack 04 real-time airborne reaction playback

The live Chromium Dojo check passed for Zane Corvo and The Velvet Reply
facing left and right at normal simulation speed. The fixture exercises
a light airborne reaction and a separate tumbling launch. Matching
directional input carries the tumbling case through recovery. The
expected clips appeared and the sampled fighter body stayed visible in
all four cases. The check samples renderer state during playback.
Visual review of pose-to-pose jumps and any resulting art changes remain
open.

### Pack 04 recorded airborne reaction review

Recorded the live Chromium Dojo at normal simulation speed for Zane
and Velvet in both facings. The first recording showed the staged
launch entering near the top of the frame. Lowered the fixture start
from 400 to 270 world units above spawn and reduced upward speed from
8 to 4 so the launch and recovery stay in view. The recorded retest
passed all four cases. Sampled footage showed the tuck opening into
fall in both directions without a visible body snap at the sampled
points. The immediate jumps at launch setup and reset are fixture
repositioning. The two hit types are seeded separately. The visual
review used sampled video frames and cannot exclude single-frame
jumps. No production art or physics changes were warranted by this pass.

### Pack 04 revision 91 parity audit

Both fighters meet the Pack 03 minimum timeline length for all 139
shared clips. The number of clips below the distinct-crop minimum
fell from 68 at revision 78 to 51 at revision 91. Each fighter has
the same remaining gaps, totaling 218 missing clip-crop slots across
both fighters. One drawing can fill multiple slots where appropriate.
Counts use the minimum across the three Pack 03 fighters and count
each image and rectangle pair once per clip.

Next, expand the paired footstool animations. Each fighter has one
crop against a six-crop target in all three roles. Build the attacker
and airborne victim together, then the grounded victim. Verify contact
and separation in both facings against a shipped fighter in the Dojo.

#### Footstools

| Clip | Pack 03 minimum crops | Zane | Velvet |
|---|---:|---:|---:|
| `footstool_attacker` | 6 | 1 | 1 |
| `footstool_ground_victim` | 6 | 1 | 1 |
| `footstool_air_victim` | 6 | 1 | 1 |

#### Floor reactions and getups

| Clip | Pack 03 minimum crops | Zane | Velvet |
|---|---:|---:|---:|
| `trip_fall` | 6 | 2 | 2 |
| `trip_prone` | 4 | 1 | 1 |
| `trip_getup` | 6 | 4 | 4 |
| `floor_attack_trip` | 7 | 6 | 6 |
| `jab_lock_up` | 4 | 2 | 2 |
| `jab_lock_down` | 4 | 2 | 2 |
| `knockdown_up` | 6 | 2 | 2 |
| `prone_up` | 4 | 1 | 1 |
| `getup_up` | 6 | 5 | 5 |
| `floor_attack_up` | 7 | 6 | 6 |
| `knockdown_down` | 6 | 2 | 2 |
| `prone_down` | 4 | 1 | 1 |
| `getup_down` | 6 | 5 | 5 |
| `floor_attack_down` | 7 | 6 | 6 |

#### Collision techs

| Clip | Pack 03 minimum crops | Zane | Velvet |
|---|---:|---:|---:|
| `tech_neutral` | 4 | 3 | 3 |
| `tech_roll` | 5 | 4 | 4 |
| `wall_tech` | 4 | 2 | 2 |

#### Movement and ledge

| Clip | Pack 03 minimum crops | Zane | Velvet |
|---|---:|---:|---:|
| `takeoff_neutral` | 2 | 1 | 1 |
| `teeter_front` | 3 | 2 | 2 |
| `teeter_back` | 3 | 2 | 2 |
| `ledge_catch` | 2 | 1 | 1 |
| `ledge_climb` | 5 | 4 | 4 |
| `ledge_jump` | 3 | 2 | 2 |

#### Grabs and throws

| Clip | Pack 03 minimum crops | Zane | Velvet |
|---|---:|---:|---:|
| `grab` | 6 | 3 | 3 |
| `grab_dash` | 6 | 5 | 5 |
| `grab_pivot` | 6 | 4 | 4 |
| `grab_hold` | 4 | 1 | 1 |
| `pummel` | 6 | 2 | 2 |
| `pummel_victim` | 4 | 2 | 2 |
| `grab_release` | 4 | 2 | 2 |
| `grabbed` | 4 | 1 | 1 |
| `back_throw_victim_preview` | 4 | 2 | 2 |
| `up_throw_victim_preview` | 4 | 2 | 2 |
| `down_throw_victim_preview` | 4 | 2 | 2 |

#### Specials and shield break

| Clip | Pack 03 minimum crops | Zane | Velvet |
|---|---:|---:|---:|
| `neutral_special` | 3 | 2 | 2 |
| `side_special` | 3 | 2 | 2 |
| `down_special` | 3 | 2 | 2 |
| `counter_success` | 3 | 2 | 2 |
| `shield_break_launch` | 4 | 1 | 1 |
| `shield_break_dizzy` | 4 | 1 | 1 |
| `shield_break_recover` | 4 | 1 | 1 |

#### Presentation

| Clip | Pack 03 minimum crops | Zane | Velvet |
|---|---:|---:|---:|
| `entry` | 3 | 2 | 2 |
| `victory_1` | 3 | 1 | 1 |
| `victory_2` | 3 | 1 | 1 |
| `victory_3` | 3 | 1 | 1 |
| `taunt_up` | 4 | 2 | 2 |
| `taunt_side` | 4 | 2 | 2 |
| `taunt_down` | 4 | 2 | 2 |


### Pack 04 six-pose footstools

Atlas revision 92 gives Zane and Velvet six distinct crops for each
footstool role. The attacker and airborne victim use existing movement
and recoil drawings after the authored contact pose. The grounded
victim follows the contact crouch with existing brace and recovery art.
The original measured contact sockets remain on the first frames.
Follow-through socket positions are estimated from sprite registration.

Both Chromium Dojo tests passed, covering eight combinations of
attacker, grounded or airborne victim, and facing. They verified
visible paired contact cues after Jump and return to the regular
attacker anchor by the separated samples at age eight or later.
This test does not measure pixel-level sole-to-head alignment during
the blend. Gameplay-speed visual continuity remains open. Next are
the floor reaction and get-up crop gaps listed in the revision 91 audit.

### Pack 04 face-up and face-down floor reactions

Revision 93 adds three costume-matched floor drawings per orientation
for each fighter. The four distinct prone poses include the original
rest pose. Each knockdown has six timeline entries and five distinct
poses. The impact pose is held for two entries and needs one additional
transition drawing per fighter and orientation for parity. The new
settling poses are scaled to match the resting silhouette width.

The Chromium renderer check passed for both facings and orientations
on both fighters. It verified the knockdown-to-prone cue and floor
anchor at every sampled tick. Gameplay-speed visual review remains
open. Next are the four remaining impact transition drawings.

### Pack 04 knockdown rebound poses

Revision 94 adds one rebound drawing per fighter and orientation,
between impact and settling. The rebuilt atlas verifies six distinct
poses for each of the four knockdown clips. The Chromium Dojo renderer
check passed for both fighters, orientations, and facings, including
the floor anchor and prone handoff. Live visual review at gameplay speed
remains open. Next are the remaining get-up and floor attack poses.

### Pack 04 get-up and floor attack pose parity

Revision 95 brings face-up and face-down neutral get-ups to six
distinct crops per fighter using an existing idle transition.
All three floor attacks now have seven distinct crops per fighter.
The rear sweep uses the other floor orientation's attack drawing
mirrored behind the fighter. Authored timing and active windows
retain their previous values.

Both live Dojo floor-recovery matrix tests passed all 24 combinations
across fighters, facings, orientations and inputs. Both trip and
jab-lock playback tests also passed. The matrix verifies that the
requested clip appears. Rear-sweep contact geometry, floor anchors
through the full attack, and gameplay-speed continuity remain open.
Next are the remaining trip and jab-lock poses.

### Pack 04 trip and jab-lock pose parity

Revision 96 adds costume-matched trip and seated recovery drawings.
Both fighters now have six distinct trip-fall and trip-get-up poses,
four seated hold poses, and four jab-lock poses for each orientation.
Jab-lock recovery reuses existing rebound and prone drawings.

Both stepped Chromium Dojo tests passed in both facings. The checks
cover clip progression and return to idle. Full-speed continuity and
floor contact through the new drawings remain open. Next are the
neutral tech, roll tech, and wall tech pose gaps.

### Pack 04 collision tech pose parity

Revision 97 brings neutral tech to four distinct poses, roll tech to
five, and wall tech to four for each fighter. Ground techs reuse an
idle transition. Wall tech reuses a tuck and uncurl after the authored
brace, with the existing horizontal release offsets converted to each
drawing's scale. The initial wall contact uses the authored brace.

All three Chromium checks passed. The live Dojo cases exercised floor,
wall, and ceiling tech selection in both facings. The renderer check
verified the vertical anchors and final pose selection. Gameplay-speed
wall release and hand and boot placement remain open. Next are the
takeoff, teeter, and ledge pose gaps.

### Pack 04 takeoff, teeter, and ledge pose parity

Revision 98 closes six shared clip gaps using existing costume-matched
drawings. Per fighter, neutral takeoff and ledge catch have two distinct
poses, each teeter and ledge jump have three, and ledge climb has five.
The ledge catch settles into the hang drawing with its own grip socket.

Both live Dojo ledge option tests passed at both edges. The renderer
alignment test initially assumed the first grip socket was active even
when another drawing was displayed. It now tests the displayed socket,
and the rerun passed for both fighters at both edges. Takeoff and teeter
were verified by atlas counts. Gameplay-speed visual continuity remains
open. Next are paired grabs, pummels, and throw victim gaps.

### Pack 04 standing, dash, and pivot grab pose parity

Revision 99 adds a costume-matched grab extension for each fighter.
Standing, dash, and pivot grabs each have six distinct poses per
fighter. The extension follows the original reach within the existing
active window. Standing and pivot grabs also reuse idle transitions.

Three Chromium Dojo tests passed, covering dash and pivot cues and
the standing grab into paired pummel for both fighters. The tests
check cue selection and the handoff into the hold. Visual reach
against the grab volume throughout the active ticks remains open.
Next are the holder, victim, and pummel pose gaps.

### Pack 04 paired hold and pummel pose parity

Revision 100 brings both fighters to four distinct holder and victim
hold poses, six holder pummel poses, and four victim pummel poses.
New drawings have per-frame hand or chest sockets. The existing
pummel strike and initial victim flinch retain their timing.

The first combined Chromium run encountered Dojo startup timeouts and
failed grab acquisition. On separate reruns, both paired pummel tests
passed in both facings and all four stepped and normal-speed throw
release tests passed. These checks cover cue synchronization and
handoffs. Visual hand placement through the new hold and pummel poses
remains open. Next are grab escape release and throw victim pose gaps.

### Pack 04 grab release and throw victim pose parity

Revision 101 fills four clips per fighter with existing costume-matched
drawings. Grab release and back, up, and down throw victim sequences
each have four distinct poses. The directional release drawings remain
first, with existing recoil, tumble, or uncurl poses to carry the exit.

All four Chromium Dojo throw tests passed at stepped and normal speed
for both fighters. Grab-escape release was verified by atlas counts.
Live escape playback and visual spacing across the full release remain
open. Next are the specials, successful counter, and shield-break gaps.

### Pack 04 specials and shield-break pose parity

Revision 102 reuses costume-matched transition drawings to reach
three distinct poses for each neutral, side, and down special and
successful counter, and four for each shield-break phase. Both
fighters passed the Chromium Dojo specials and full shield-break
tests in both facings. Gameplay-speed pose continuity remains open.
Next are the entry, taunt, and victory pose gaps.

### Pack 04 presentation and final pose-count audit

Revision 103 adds existing idle transitions to the signature entry,
taunt, and victory drawings. Per fighter, entry and each victory now
have three distinct crops and each taunt has four. The atlas comparison
found zero timeline or distinct-crop gaps across all 139 clips shared
with Pack 03, using its per-clip minimum across the three fighters.

All eight Chromium presentation tests passed, covering Dojo cues,
full local match presentation, and both alternate victory routes for
each fighter. These tests cover cue selection. Next are gameplay-speed
visual continuity and release verification. Pose counts alone do not
establish that the reused transitions read naturally at gameplay speed.

### Pack 04 revision 103 recorded playback

Seven Chromium Dojo cases passed with recording enabled. The cases
cover both fighters' normal-speed throw tests, presentation cues,
shield break, and airborne reactions. Reviewed timestamped contact
sheets from all seven recordings. The sampled sequences showed
visible fighter art through the exercised transitions. The short
throw and taunt transitions need closer frame-by-frame review for
hand and foot placement. No atlas changes were made in this pass.

Next, run the production build and Pack 04 release checks for asset
loading, fighter selection, and local and online roster integration.
The recorded Dojo pass is sampled visual evidence.

### Pack 04 revision 103 production preflight

The production build passed. The built Pack 04 manifest reports
revision 103, and all 434 referenced images are present. The two
Pack 04 local presentation checks and the existing two-client online
selection and reconnect check passed against the development server.
Those local presentation checks use a staged Pack 04 lineup, and the
online check exercises released fighters.

Normal Fighter Select still lists the roster through Pack 03. Next
is to wire both Pack 04 fighters into regular selection and match art
loading, then verify cold loading and a real local and two-client
match with Zane and Velvet against the production build.

### Pack 04 regular roster integration

Zane and Velvet now appear in regular local and online Fighter Select
with their own portraits and kit descriptions. Online rooms accept both
IDs. The existing selection and match preload path serves their atlas.

The production build passed. Three Chromium checks against the built
server passed using fresh browser contexts: one two-client match with
Zane versus Velvet and one regular local match for each fighter. Each
check verified a successful Pack 04 manifest request and the expected
fighter IDs in the live match. The first online run logged a Windows
read error for stage audio. The three-case rerun did not reproduce it.
No deployed-host timings or in-match sprite captures were taken.
Next are throttled production loading, interrupted artwork retry, and
the remaining gameplay-speed art review.

### Pack 04 throttled production loading and retry

The source-sheet baseline never reached live play within the 75-second
assertion window in either 8 Mbps run. A guest manifest abort surfaced
the artwork alert in 118 ms, but reconfirming the lineup still missed
the same deadline.

Pack 04 now uses four lossless WebP atlas pages totaling 9,675,238
bytes and 64 MiB decoded. The source directory contains about 130 MB.
Rebuild the source manifest with
`node scripts/assets/build-pack-04-pilot.mjs`, then run
`node scripts/assets/build-production-fighter-atlas.mjs --pack-04`
from the repo root after building the engine. The production build
passed, and the loader checks the packed revision against the source.

On the built server with fresh Chromium contexts, 8 Mbps download and
upload, and 80 ms simulated latency, Zane versus Velvet reached live
play in 35.27 seconds from navigation and 20.18 seconds from stage
selection. Aborting a packed page on the guest showed the alert in
0.39 seconds and kept live play blocked. Reconfirming the same lineup
reached live play 19.18 seconds after selecting the stage again.
Both local selection smokes and five packed Dojo throw and ledge
checks also passed. The cold run logged an intermittent Windows
stage audio read error. Deployed-host timing and remaining visual
review are open.

### Pack 04 packed atlas floor alignment

The full Chromium Dojo run initially passed 53 of 56 tests.
Locomotion, landing, and knockdown floor checks caught fractional
anchor drift when the packer rounded sprite rectangles. The Pack 04
packer now preserves bottom-edge roots at the packed rectangle
boundary. After regeneration, all 56 tests passed. The four WebP
pages retain the same transfer size. Deployed-host timing and the
remaining gameplay-speed visual review are open.

### Pack 04 production retest after floor alignment

Rebuilt production with the corrected packed roots. All four Chromium
release cases passed against the built server. At 8 Mbps and 80 ms
simulated latency, the cold online match reached live play in 35.28 s
from navigation and 20.19 s from stage selection. Aborting one guest
atlas page showed the alert in 0.35 s and blocked live play. The same
lineup reached live play 19.14 s after selecting the stage again.
Both fighters also passed regular local selection and match startup.
Hosted timing and visual review of the remaining short transitions
stay open.

### Pack 04 Fighter Select idle sizing hotfix

The animated menu previews had used one resize factor across source
drawings of different resolutions. The generator now applies authored
Pack 04 frame scales before fitting and aligning each pose. Decoding
the resulting WebPs verified four poses per fighter with the same
bottom edge. Zane's silhouette height is 360 pixels throughout and
Velvet's varies by one pixel. The packed gameplay atlas already
applied per-frame scale.

Bluehost served the corrected bytes at the original URLs with a one-year immutable cache policy. Pack 04 previews now use new versioned filenames so cached copies cannot mask the sizing fix.
