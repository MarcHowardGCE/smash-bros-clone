# Fighter pack production guide

Use this alongside the [full-body workflow](FULL-BODY-FIGHTER-ART.md), [clip inventory](PACK-03-ANIMATION-PARITY.md), and [atlas packaging guide](FIGHTER-PRODUCTION-ATLAS.md). The parity audit contains historical measurements. Refresh counts from the current production manifests before using them as targets.

## Set the targets before drawing

1. Enumerate every reachable clip from the renderer and compare the current production manifests for all shipped fighters. Record required poses, distinct drawings, frame slots, ticks, authoritative trigger, anchors and contact sockets in a clip ledger. Resolve aliases and presentation-only previews explicitly.
2. Set a shared drawing target per clip from the established roster and flag intentional holds for review. A reused pose can occupy multiple slots, but counts once. Count original full-body drawings separately from mirrored poses and asset aliases. Record each remaining gap by fighter and clip until the roster passes the shared target.
3. Approve a production model sheet and roster scale board. Include idle, front and back three-quarter views, palette swatches, foot baseline, pelvis, reach and hurtbox overlay. Match the production palette when earlier sketches disagree. Mirrored costumes use blank jerseys and avoid directional lettering or logos. Loopy uses a cream jersey with purple trim.

## Draw each animation family

| Family | Draw and verify |
| --- | --- |
| Idle and gait | Idle breathing with fixed support. Walk and run need alternating near/far contact, passing and push-off. Inspect both feet through the wrap and at walk-to-run, turn and brake. |
| Ground transitions | Crouch entry, stable hold, rise, both teeters and platform drop. Register the load-bearing sole to the floor. Check short releases and both ledges. |
| Air movement | Compression, directional takeoff, rise, apex, fall, fast-fall, double jump, soft and heavy landing. Register airborne poses to the pelvis and grounded poses to the soles. Step through phase boundaries and check that apex progresses once. |
| Attacks and specials | Draw startup, every distinct contact required by the move, follow-through and recovery. Align the visible limb with authoritative hitboxes on active ticks in both facings. Keep effects separate from body drawings. |
| Defense and damage | Shield raise, hold, impact, drop and parry. Include rolls, spot dodge, all directional air dodges and dodge landing. Draw high, low and heavy hits, launch, tumble, both knockdowns, recovery, techs, trip and jab locks. Step contact, interruption and return to actionable poses. |
| Paired actions | Standing, dash and pivot grabs, hold, pummel, release, four throws and victim reactions, plus footstool roles. Draw matched pairs with aligned contact sockets. Step capture through release and retest in mixed-size matchups. |
| Ledge and presentation | Catch, hang, every getup, drop and trump. Align the gripping hand with the ledge. Include helpless states, entry, respawn, taunts, alternate wins, defeat and KO reactions. Check Screen and Star KO sprite handoff separately from camera and travel. |

## Prepare and validate the pixels

- Export full-body RGBA masters. Leave generous transparent gutters and preserve every extremity. Remove stray pixels, halos, baked shadows and motion marks. Inspect alpha over light and dark game backgrounds at source resolution and gameplay size. Keep original source drawings and crop metadata reproducible.
- Record frame bounds and anchor coordinates in source pixels. Preserve consistent character scale across phases. Inspect the registered poses together before packing. For paired clips use the actual attacker and victim sockets and the authoritative release tick.
- Build and verify production atlases. Record source revision, page count, transfer size and decoded texture cost. Check packed frame bounds, expected alpha and missing textures. Play every reachable clip in the Dojo at normal and stepped speed, both facings. Verify local and online rendering of representative transitions and paired interactions. Record asset load failures and any fallback renderer use.
- For signoff, publish the current ledger with distinct-drawing counts and remaining exceptions. Keep frame coverage, timing, contact and visual continuity as separate checks. Update the active-work index with the next failing clip and the verification evidence.

## Verified clip targets

| Clip | Distinct full-body drawings | Timing and checks |
| --- | ---: | --- |
| Jump squat | 3 | Pack 04 has three physical ticks. Target compression entry, low crouch, extension exit with [1,1,1]; avoid raised arms before crouching. Test tapped/held jump without extending timing. Both Pack 04 fighters now have three appropriate drawings verified at state frames 0/1/2 in both facings, with tap/hold heights and landing ticks unchanged. |
| Each directional takeoff | 3 | Pack 04 has six visual ticks before rise. Target directional push-off, midpoint, rise-compatible endpoint with [2,2,2]. Both Pack 04 fighters now have three distinct poses per direction, verified on cue ages 0–5 in both facings; endpoints match rise. Explicit durations must select by cue age. Pack 04 local normal-speed review passed 24 short/full, direction and facing cases; saved 25fps recordings and RAF traces. Backward setup is frame-stepped through squat frame1. Do not treat this as a 60fps performance signoff. |
| Air rise | 6 | Use six distinct drawings, preserve physical jump timing, and verify every drawing in both facings at frame step and 1x. Both Pack 04 fighters use six two-tick visual holds; one-tick in-betweens were skipped at the observed live render cadence. A short hop may naturally exit the phase early. |
| Air apex | 6 | Budget the live visual window before drawing. Pack 04 uses a renderer-only inclusive vertical-speed band of -4 to +4, verified to expose at least twelve ticks in held full jumps. Use six two-tick poses; preserve gameplay and interruption timing. Both Pack 04 fighters now have six two-tick drawings verified at frame step and 1x in both facings. |
| Double jump | 6 | Count distinct drawings, not repeated slots. Both Pack 04 fighters use six two-tick drawings within the twelve-tick cue. Check all six at 1x in both facings, interruptions and the return to the final rise tuck. |
| Fast fall | 6 | Budget actual flight before drawing: Pack 04 natural normal/late/double-jump drops measured 6/4/9 ticks. Both Pack 04 fighters now use six two-tick drawings. Verify all six from a controlled high drop at (640,-100), after reset/turnaround settles to idle. Natural short drops display a valid prefix. Never delay landing to finish artwork. |
| Soft landing | 6 | Pack 04 has a 12-tick visual cue, interruptible on the next simulation tick with zero added recovery. Use six two-tick drawings and explicit cue-age playback. Both Pack 04 fighters now have six appropriate drawings; neither uses the raised-arm takeoff middle. Pack 04 explicit durations play by cue age, not unrelated state age. Check soles, 1x and Jump/Attack/Shield/Special interruption. |
| Heavy landing | 6 | Pack 04 has an 18-tick visual cue, not an input lockout. Both fighters now have six appropriate drawings between impact, low crouch and idle, with six three-tick holds. Preserve floor contact and immediate action interruption. |
| Air fall | 6 | Six distinct drawings with readable holds, then hold the final drawing. Both Pack 04 fighters use six two-tick holds within the original twelve-tick total. Check normal-speed playback, both facings and the first landing pose. |
| Shield raise | 6 | Show each pose through the six-tick raise where that is the live window. Keep soles fixed. |
| Shield drop | 6 | Distribute the poses over the live release window. Verify return to idle and the final pose in both facings. |
| Jab 1 | 9 | Three startup drawings, one contact held through ticks 3 and 4, five recovery drawings. Check standalone playback, both active ticks in both facings, and the buffered handoff into Jab 2. |
| Jab 2 | 6 | Three startup drawings, one compact strike on ticks 3 and 4, two recovery drawings. Check the actual scaled circle in both facings. |
| Jab 3 | 6 | Three startup drawings, one finisher on ticks 4–6, two recovery drawings. Align the visible fist with the live circle and replay the full chain. |

See the [damage-reaction inventory](PACK-03-ANIMATION-PARITY.md#damage-reaction-parity-inventory) for current drawing targets and the launch and tumble decisions still to verify.

For airborne recoil, test both a short hit and a longer non-tumbling hit. Airborne up tilt at 50% exercised all six poses in Packs 02 and 03. For tumble recovery, draw six distinct poses from tucked to upright, register each to the pelvis, and verify the handoff to fall at the end of the live cue.

## Costume reference and first-pose review

Use the shipped single-character idle PNG as the identity reference for each generation. Use a separate pose reference only when needed, and tell the generator to take anatomy and wardrobe from the identity reference. Preserve the following production details.

| Fighter | Identity reference | Costume details |
| --- | --- | --- |
| Moonshine | [Shipped idle](../../apps/client/public/fighter-art-newcomers-v1/moonshine-idle-v1.png) | Cream undershirt, red neckerchief, suspenders, patched blue jeans, rope and striped coonskin cap. |
| Hulk Hoagie | [Shipped idle](../../apps/client/public/fighter-art-newcomers-v1/hulk-hoagie-idle-v1.png) | Dark wine-red wrestling singlet with narrow cream trim, brown flat cap, black kneepads and cream wrist wraps. |
| Mr. Wrong | [Shipped idle](../../apps/client/public/fighter-art-pack-03-v1/mr-wrong-idle.png) | Burgundy gold-button vest, spotted yellow sleeves, pink shorts and teal tentacles. |
| Loopy | [Shipped idle](../../apps/client/public/fighter-art-pack-03-v1/loopy-idle.png) | Blank cream jersey with purple trim, purple shorts and antlers. |
| Mrs. Tasselbottom | [Shipped idle](../../apps/client/public/fighter-art-pack-03-v1/mrs-tasselbottom-idle.png) | Deep purple gown, gold ropes and tassels, cream lace at edges. |
| Zane Corvo | [Shipped idle](../../concept-art/sprite/pack-04/zane-corvo-idle.png) | Dark biker jacket and waistcoat, silver studs/chain, dark trousers, cream-laced boots. |
| The Velvet Reply | [Shipped idle](../../concept-art/sprite/pack-04/velvet-reply-idle.png) | Dark plum-black flared jumpsuit, fine gold piping, fishnet sleeves/chest, crossed black straps, silver belt/cuffs/hoops, dark heeled boots, copper-auburn hair and cheek beauty mark. |

Generate one representative pose first, preferably the pose with the greatest change in silhouette or viewing angle. Compare it beside shipped artwork at source and gameplay size. Check the dominant garment panels and trim individually, then inspect alpha, outline, scale, visible extremities and pose orientation. For prone poses check the back or stomach actually contacts the floor. Use the accepted pose with the shipped idle for the remaining drawings. Review every cell before packing. Keep rejected drafts out of source and production atlases.

Different pixel hashes do not prove different poses. Reject a candidate that simply redraws a neighbor; compare limb positions and silhouette before adding it to the count.

Check alpha before using a generated pose as a reference for follow-ups. Inspect on white and dark backgrounds, check empty gutters and corners, and scan for semi-transparent pixels away from solid ink across all RGB colors. Inspect any flagged pixels at full resolution to distinguish costume details from residue. A clear thumbnail or transparent corners alone are insufficient.

**Hit launch** uses two distinct drawings. Hold impact through hitlag and ticks 0–3, then show follow-through on ticks 4–9 and hand off to tumble at tick 10. Verify both facings and registration.

**Tumble** uses four distinct poses. When the renderer also rotates the sprite, use the same clock for pose and angle, starting at the launch-to-tumble handoff. Inspect a full loop and the wrap in both facings.

**Footstool** uses six distinct poses for each of the attacker, grounded victim and airborne victim. Start with the contact frame and register the sole and head sockets on that pose. Use the shared frame selector for both drawing and socket lookup. Replay both facings with mixed packs and give airborne victims enough clearance to play all 18 cue ticks.

## Preserve expanded Pack 02 metadata

`build-newcomer-pilot.mjs` rebuilds the historical isolated review. It does
not replay all later parity work represented by the expanded source
manifest. Do not replace that manifest with the base builder's output for
a production adjustment. Inspect the clip/frame inventory and atlas diff
before accepting any rebuild; a registration fix must not remove poses.

For the two first-soft-landing registrations, the narrow, repeatable path is:

```powershell
node scripts/assets/fix-newcomer-landing-roots.mjs
node scripts/assets/build-production-fighter-atlas.mjs --dojo
```

The correction preserves other clips and frames, bumps the source revision
only when needed, and is safe to rerun. The production rebuild consumes the
expanded source manifest. Check the first grounded drawing's actual sole
position, not only the sprite origin. See the [landing review and validation](FULL-ROSTER-ANIMATION-AUDIT.md#pack-02-and-03-interruption-and-landing-review--2026-11-17).

## Pack 02/03 movement baseline

Refresh decoded-crop counts with `node scripts/assets/audit-movement-parity.mjs --output <output.json>`.
This reads current artwork; do not use the legacy newcomer base builder to
refresh counts, because expanded clips can be lost. The current
[reconciliation and budgets](FULL-ROSTER-ANIMATION-AUDIT.md#pack-0203-movement-reconciliation--2026-11-18)
record minimum142 new drawings separately from replacements. Pack02 cue-age takeoff playback and gentle landing triggers are now corrected
at revision75 using existing pixels. Reapply metadata safely with
`node scripts/assets/fix-newcomer-movement-timing.mjs`; it is idempotent and
preserves all clips, roots and packed PNG bytes. Next expand Moonshine art.
Budget apex/fast-fall windows before drawing; accept natural prefixes and
preserve authoritative movement timing and immediate action availability.

For Moonshine's three-pose takeoffs, use the narrow
`node scripts/assets/expand-moonshine-takeoffs.mjs` followed by
`node scripts/assets/build-production-fighter-atlas.mjs --dojo`. It preserves
the expanded manifest and existing endpoints, prepares alpha reproducibly and
is idempotent. Do not substitute the legacy newcomer base builder. Revision76
uses [2,2,2]; Hoagie remains [3,3]. See the
[updated ledger and evidence](FULL-ROSTER-ANIMATION-AUDIT.md#moonshine-three-pose-directional-takeoffs-completed--2026-11-18).

Moonshine rise uses `node scripts/assets/expand-moonshine-rise.mjs` followed by
the dojo packer. Preserve the expanded146-clip source manifest and original
endpoints. Its six two-tick drawings use a phase-local clock and final hold;
do not derive age from an expiring takeoff cue or restart at the end of twelve
ticks. See the [rise verification](FULL-ROSTER-ANIMATION-AUDIT.md#moonshine-six-pose-rise-completed--2026-11-18).


Moonshine apex uses `node scripts/assets/expand-moonshine-apex.mjs`, then
`node scripts/assets/build-production-fighter-atlas.mjs --dojo`. Preserve the
expanded manifest and two original drawings. Six [2,2,2,2,2,2] poses use a
phase-local final-hold clock; the renderer-only abs(vy)<=4 apex band fits
twelve full-jump and thirteen short-hop ticks. Do not change physics to fit
drawings. All six apex roots share73 world units from crop top. The builder
records narrow, measured detached-alpha cleanup and reruns idempotently.
Check normal-speed captures separately from heavy test batches; frame-step
coverage establishes each slot while live sampling can miss a brief crop.
See [apex review and physical comparison](FULL-ROSTER-ANIMATION-AUDIT.md#moonshine-six-pose-apex-completed--2026-11-18).


Moonshine fall uses `node scripts/assets/expand-moonshine-fall.mjs`, then
`node scripts/assets/build-production-fighter-atlas.mjs --dojo`. Preserve the
expanded manifest and original endpoints. Six two-tick poses use phase-local
age and final hold; full jumps show all six, short hops naturally show four.
Never extend airtime to finish art. New sources retain exact prompts and shipped
costume reference. See [fall verification](FULL-ROSTER-ANIMATION-AUDIT.md#moonshine-six-pose-fall-completed--2026-11-18).


Moonshine fast fall uses `node scripts/assets/expand-moonshine-fastfall.mjs`
then the dojo packer. Six two-tick poses advance from phase entry and hold final.
Natural seven-tick drops expose four poses; use the controlled high-drop Dojo
fixture for all six, without changing physics. Preserve original endpoints,
raw alpha, prompt sidecars and the expanded manifest.
[Fast-fall evidence](FULL-ROSTER-ANIMATION-AUDIT.md#moonshine-six-pose-fast-fall-completed--2026-11-18).


Moonshine double jump uses `node scripts/assets/expand-moonshine-double.mjs`,
then the dojo packer. Retain all three original drawings and insert three
in-betweens; six two-tick poses fit the existing twelve-tick renderer cue.
Register head size against retained drawings and use common top-to-root73.
Keep the final-rise handoff and actual physics unchanged.
[Double-jump verification](FULL-ROSTER-ANIMATION-AUDIT.md#moonshine-six-pose-double-jump-completed--2026-11-18).


Moonshine soft landing uses `node scripts/assets/expand-moonshine-soft.mjs`,
then the dojo packer. Retain three originals; early-v2 is accepted, early-v1
is rejected. Six two-tick poses fit the twelve-tick visual cue. Center new
roots on solid boot support, not full-image width. Compare head size to shipped
idle/fall as well as existing landing frames: retained art can itself be
mis-scaled. The current landing set applies80% of its earlier registration.
Never add recovery to finish visual art.
[Soft-landing verification](FULL-ROSTER-ANIMATION-AUDIT.md#moonshine-six-pose-soft-landing-completed--2026-11-18).


Moonshine heavy landing uses `node scripts/assets/expand-moonshine-heavy.mjs`,
then the dojo packer. Keep the two originals; place the original wide recovery
before the new settling guard. Six three-tick poses use cue-local age within
the existing eighteen-tick landing visual. Center new roots on solid boot
support and preserve immediate action interruption. Check the full transition
to idle, not just adjacent new drawings.
[Heavy-landing verification](FULL-ROSTER-ANIMATION-AUDIT.md#moonshine-six-pose-heavy-landing-completed--2026-11-18).


Hoagie takeoffs use `node scripts/assets/expand-hoagie-takeoffs.mjs`, then
the dojo packer. Keep both shipped endpoints; insert one midpoint for each
direction, with [2,2,2] across six ticks. Use shipped Hoagie idle and the
respective endpoint as references, preserving burgundy singlet/cream trim and
brown flat cap. The shared timing repair now preserves six-frame soft-landing
durations; rerunning it must leave metadata and packed pixels unchanged.
[Hoagie takeoff verification](FULL-ROSTER-ANIMATION-AUDIT.md#hoagie-three-pose-directional-takeoffs-completed--2026-11-19).


Hoagie rise uses `node scripts/assets/expand-hoagie-rise.mjs`, then the dojo
packer. Retain two original drawings and insert four in-betweens, [2,2,2,2,2,2].
Use phase-local age and final hold; double-jump release must select the final
rise tuck. Shared root distance is 83 world units from crop top. Full rise is
fourteen ticks and short rise five; preserve natural prefixes. Before widening
Hoagie's next apex phase, ensure at least twelve full-rise ticks remain.
[Hoagie rise verification](FULL-ROSTER-ANIMATION-AUDIT.md#hoagie-six-pose-rise-completed--2026-11-19).


Hoagie apex uses `node scripts/assets/expand-hoagie-apex.mjs`, then the dojo
packer. Retain original drawings/scales and use common top-to-root distance 83.
Six two-tick poses use a phase-local clock. Renderer band -3.5<=vy<=4.5 retains
twelve full-rise ticks and gives twelve apex ticks in both jump heights.
Do not replace it blindly with another fighter's symmetric threshold or alter
physics to fit poses.
[Hoagie apex verification](FULL-ROSTER-ANIMATION-AUDIT.md#hoagie-six-pose-apex-completed--2026-11-19).


Hoagie fall uses `node scripts/assets/expand-hoagie-fall.mjs`, then `node scripts/assets/build-production-fighter-atlas.mjs --dojo`. Preserve both original drawings/scales and insert four in-betweens. Six two-tick poses use phase-local age and final hold, with a common 83-world-unit top-to-root distance. Short jumps show a natural prefix; never alter physics to force every pose into a shorter phase. Do not rebuild the expanded manifest with the legacy base builder. [Fall verification](FULL-ROSTER-ANIMATION-AUDIT.md#hoagie-six-pose-fall-completed--2026-11-19).


Hoagie fast fall uses `node scripts/assets/expand-hoagie-fastfall.mjs`, then `node scripts/assets/build-production-fighter-atlas.mjs --dojo`. Keep both original endpoint drawings/scales; insert four two-tick drawings at visible height 68 and common top-to-root distance 76. New horizontal roots are 42% of crop width. Use phase-local age and final hold. Verify the natural five-tick prefix plus a controlled high drop for the complete six-pose sequence and first grounded landing tick. Preserve physics. [Fast-fall evidence](FULL-ROSTER-ANIMATION-AUDIT.md#hoagie-six-pose-fast-fall-completed--2026-11-19).


Hoagie double jump uses `node scripts/assets/expand-hoagie-double.mjs`, then `node scripts/assets/build-production-fighter-atlas.mjs --dojo`. Retain three original drawings/scales and insert early/mid/late poses for six two-tick frames. Common top-to-root distance is 83; new heights 82/92/88. Verify exact twelve-tick cue and first release into the final rise crop in both facings. Do not change physics to accommodate drawings. [Double-jump evidence](FULL-ROSTER-ANIMATION-AUDIT.md#hoagie-six-pose-double-jump-completed--2026-11-19).


Hoagie soft landing uses `node scripts/assets/expand-hoagie-soft.mjs`, then `node scripts/assets/build-production-fighter-atlas.mjs --dojo`. Keep original three drawings/scales/roots; insert three poses at visible heights 79/83/87. Register planted soles two source pixels above crop bottom; use the midpoint of solid support in the bottom 2% for horizontal root. Six two-tick poses preserve twelve-tick recovery. Verify floor/root alignment, both facings, full crop sequence and idle handoff without physics changes. [Soft-landing verification](FULL-ROSTER-ANIMATION-AUDIT.md#hoagie-six-pose-soft-landing-completed--2026-11-19).


Hoagie heavy landing uses `node scripts/assets/expand-hoagie-heavy.mjs`, then `node scripts/assets/build-production-fighter-atlas.mjs --dojo`. Retain both original drawings/scales/roots, insert four poses at visible heights 67/71/77/86, and use six three-tick frames. Ground new roots two source pixels above the crop bottom at solid sole support midpoint. Include Hoagie in duration-based heavy-landing playback. Verify full-jump and fast-fall landings in both facings through eighteen recovery ticks and idle; compare physical traces before/after. [Heavy-landing evidence](FULL-ROSTER-ANIMATION-AUDIT.md#hoagie-six-pose-heavy-landing-completed--2026-11-19).


Mr. Wrong squat uses `node scripts/assets/expand-mr-wrong-squat.mjs`, then `node scripts/assets/build-production-fighter-atlas.mjs --pack-03`. Do not regenerate the base Pack 03 manifest. Retain shipped endpoints; v2 midpoint is registered at visible height 82.5 with planted sole root two source pixels above crop bottom. Three one-tick poses preserve the three-tick squat. Review torso-to-head/hat proportions at gameplay scale, not just costume colors. Mr. Wrong's floor sample is y=472 with render-root offset 28; do not copy Hoagie's dimensions into assertions. Frame-step every tick; normal-speed capture may only sample a subset. [Squat evidence](FULL-ROSTER-ANIMATION-AUDIT.md#mr-wrong-three-pose-jump-squat-completed--2026-11-19).


Mr. Wrong takeoffs use `node scripts/assets/expand-mr-wrong-takeoffs.mjs`, then `node scripts/assets/build-production-fighter-atlas.mjs --pack-03`. Preserve shipped endpoint drawings, scales, roots and airRoot values; add one midpoint per direction, durations [2,2,2]. New visible heights 92/90/90; airborne vertical anchors 59.872/58.224/60.471 world units interpolate shipped endpoints. Pack 03 draws airborne takeoffs with airRoot; do not substitute the ground sole root. Existing duration/cue-age routing works without a new renderer branch. Verify all twelve tapped/held, facing and direction combinations at stepped and normal speed, especially backward momentum with unchanged facing. [Evidence](FULL-ROSTER-ANIMATION-AUDIT.md#mr-wrong-three-pose-directional-takeoffs-completed--2026-11-19).


Mr. Wrong rise uses `node scripts/assets/expand-mr-wrong-rise.mjs`, then `node scripts/assets/build-production-fighter-atlas.mjs --pack-03`. Preserve shipped endpoints/airRoot; insert four drawings, durations six times two ticks, visible heights 90/88/86/85 and airborne top-to-root distance 60. Use phase-local progression and final hold. Mr. Wrong's current double jump ends on rise frame zero, so restart the rise phase there; do not copy the Packs 02/04 final-rise backdating rule. Verify natural full/short prefixes and matching release crop before/after double jump. [Rise verification](FULL-ROSTER-ANIMATION-AUDIT.md#mr-wrong-six-pose-rise-completed--2026-11-19).


Mr. Wrong apex uses `node scripts/assets/expand-mr-wrong-apex.mjs`, then `node scripts/assets/build-production-fighter-atlas.mjs --pack-03`. Keep endpoint artwork/scales and register every airborne root sixty world units from crop top, matching rise. New heights 80/81/82/82.5. Six two-tick poses use phase-local progression; renderer-only |vy|<=4 band reserves twelve apex ticks and retains twelve full-rise ticks. Check short/full prefixes, fast-fall interruption and the matching first-rise double-jump release; never modify physics to fit art. [Apex verification](FULL-ROSTER-ANIMATION-AUDIT.md#mr-wrong-six-pose-apex-completed--2026-11-19).


Mr. Wrong fall uses `node scripts/assets/expand-mr-wrong-fall.mjs`, then `node scripts/assets/build-production-fighter-atlas.mjs --pack-03`. Retain endpoint artwork/scales; four new drawings at visible height 93, common airborne root sixty world units below crop top. Six two-tick poses advance once and hold final. Verify eighteen-tick full fall, eight-tick short prefix and twenty-one-tick double-jump fall plus landing. Normal-speed RAF/video may skip brief poses; record gaps, retain failed traces, and keep exact stepped scheduling separate from targeted full-fall capture. Do not change physics to fit art or claim sparse video certifies every tick. [Fall evidence](FULL-ROSTER-ANIMATION-AUDIT.md#mr-wrong-six-pose-fall-completed--2026-11-19).


Mr. Wrong fast fall uses `node scripts/assets/expand-mr-wrong-fastfall.mjs`, then `node scripts/assets/build-production-fighter-atlas.mjs --pack-03`. Preserve all three shipped drawings/scales, insert three poses (heights 98/104/110), use six two-tick frames and common airborne top-to-root distance 70. Initial interpolated anchors still bobbed on the art board; final common anchor was visually reviewed and retested. Verify natural six-tick prefix and controlled nineteen-tick high drop, final hold and landing in both facings. Preserve physics. [Fast-fall verification](FULL-ROSTER-ANIMATION-AUDIT.md#mr-wrong-six-pose-fast-fall-completed--2026-11-19).


Mr. Wrong double jump uses `node scripts/assets/expand-mr-wrong-double.mjs`, then `node scripts/assets/build-production-fighter-atlas.mjs --pack-03`. Retain three shipped drawings/scales and final release registration; insert early/mid/late (visible heights 96/90/90), six two-tick frames. Normalize the first two old airborne roots and new poses to sixty world units from crop top; keep final crop/root identical to rise frame zero. Verify twelve cue ticks, both facings and release through landing. [Double-jump verification](FULL-ROSTER-ANIMATION-AUDIT.md#mr-wrong-six-pose-double-jump-completed--2026-11-19).


Mr. Wrong soft landing uses `node scripts/assets/expand-mr-wrong-soft.mjs`, then `node scripts/assets/build-production-fighter-atlas.mjs --pack-03`. Keep original three drawings/scales/roots and add early/mid/late (visible heights 74/82/87). Register new roots two source pixels above crop bottom at solid sole-support midpoint in bottom 2%; retain planted tentacle curls. Six two-tick poses preserve twelve-tick recovery. Check both facings, exact stepped sequence, normal-speed handoff and idle, using Mr. Wrong's y=472/offset=28 registration. [Soft-landing verification](FULL-ROSTER-ANIMATION-AUDIT.md#mr-wrong-six-pose-soft-landing-completed--2026-11-19).


Mr. Wrong heavy landing uses `node scripts/assets/expand-mr-wrong-heavy.mjs`, then `node scripts/assets/build-production-fighter-atlas.mjs --pack-03`. Retain three shipped drawings/scales/roots; insert distinct heavy recovery poses at heights 70/82/87. Six three-tick frames retain eighteen recovery ticks. Register planted tentacle soles and measure alpha before removing haze: this set uses alpha floor five and only measured detached fringe farther than four pixels from solid ink. Verify full-jump and fast-fall landings in both facings through idle. [Heavy-landing verification](FULL-ROSTER-ANIMATION-AUDIT.md#mr-wrong-six-pose-heavy-landing-completed--2026-11-19). Mr. Wrong's eleven movement targets are complete; next is Loopy, whose shipped blank cream/purple jersey must have no number.


Loopy squat: run `node scripts/assets/expand-loopy-squat.mjs`, then `node scripts/assets/build-production-fighter-atlas.mjs --pack-03`; do not rebuild the legacy base manifest. Retain shipped endpoints and register the midpoint at height 88.5, sole root (438,1351). Three one-tick poses preserve jump timing. Always use the blank cream jersey with purple trim, without numbers. Review full antlers with sufficient board padding and inspect dark/light edges. [Evidence](FULL-ROSTER-ANIMATION-AUDIT.md#loopy-three-pose-jump-squat-completed--2026-11-19).


Loopy takeoffs: `node scripts/assets/expand-loopy-takeoffs.mjs`, then `node scripts/assets/build-production-fighter-atlas.mjs --pack-03`. Preserve endpoint pixels and airRoot values; use three two-tick drawings. Midpoint heights 100.25/96/97.75 and air-root distances 65.554/65.088/69.752 interpolate shipped endpoints. Review light/dark backgrounds before registration and reject diffuse halos; never accept a cleanup request without inspecting its output. Costume is blank cream jersey with purple trim. [Evidence](FULL-ROSTER-ANIMATION-AUDIT.md#loopy-three-pose-directional-takeoffs-completed--2026-11-19).


Loopy rise: `node scripts/assets/expand-loopy-rise.mjs`, then `node scripts/assets/build-production-fighter-atlas.mjs --pack-03`. Preserve endpoint pixels/anchors; four in-betweens at visible heights 99.5/99/98.5/98 and airborne top-to-root distances 69.4/69.8/70.2/70.6. Use phase-local progression with final hold. Loopy's current double jump ends on first rise crop: restart there, without final-tuck backdating. Check actual double clip count rather than copying another fighter's expectations. Keep blank cream/purple jersey and review light/dark edges. [Evidence](FULL-ROSTER-ANIMATION-AUDIT.md#loopy-six-pose-rise-completed--2026-11-19).


Loopy apex: `node scripts/assets/expand-loopy-apex.mjs`, then `node scripts/assets/build-production-fighter-atlas.mjs --pack-03`. Playback order maps late-v2/settle-v2/early-v1/mid-v1 between shipped endpoints; use builder order, not generation labels. Heights 93.5/95.5/97.5/99.5; common airborne top-to-root distance 71.108. Six two-tick poses and renderer-only crest band preserve physics, retain twelve full-rise ticks and expose twelve/eleven apex ticks on full/short jumps. Review body mass as well as total height: elongated legs can hide a shrunken torso. Exact stepped checks cover a final one-tick short-hop pose that normal capture may miss. [Evidence](FULL-ROSTER-ANIMATION-AUDIT.md#loopy-six-pose-apex-completed--2026-11-19).


Loopy fall: `node scripts/assets/expand-loopy-fall.mjs`, then `node scripts/assets/build-production-fighter-atlas.mjs --pack-03`. Four in-betweens plus a clean-redrawn start replace the red-contaminated start only in this clip; keep the shipped final endpoint. New heights 105.5/105/104.5/104/103.5, common airborne top-to-root distance 71.108. Six two-tick poses progress once with final hold. Check natural seventeen/eight-tick full/short windows and twenty-one-tick double-jump falls. Normal sampling may skip a two-tick crop; exact stepped checks remain mandatory. Revision90 expands to ten live pages; include that footprint in release loading checks. [Evidence](FULL-ROSTER-ANIMATION-AUDIT.md#loopy-six-pose-fall-completed--2026-11-19).


Loopy fast fall: `node scripts/assets/expand-loopy-fastfall.mjs`, then `node scripts/assets/build-production-fighter-atlas.mjs --pack-03`. Retain three shipped drawings and add early-v1/mid-v2/late-v1 at heights 109/116/120. Common airborne top-to-root distance 71.108 matches preceding phases. Six two-tick poses progress once, then hold; natural six-tick fast fall shows only first three. Use controlled high drop (640,-100), zero velocity, for seventeen-tick full-sequence coverage and both-facing landing checks. Keep blank cream jersey, reject diffuse halos before packing, and pad review boards for the extended muzzle/antlers. [Evidence](FULL-ROSTER-ANIMATION-AUDIT.md#loopy-six-pose-fast-fall-completed--2026-11-19).


Loopy double jump: `node scripts/assets/expand-loopy-double.mjs`, then `node scripts/assets/build-production-fighter-atlas.mjs --pack-03`. Preserve the final shipped drawing/airRoot exactly: it matches first rise. Add early/mid/late and a clean-redrawn start; new heights 107.5/103.5/100/100. Common airborne top distance 68.9745 for new poses and midpoint, six two-tick drawings. Builder embeds shipped metadata so reruns cannot mistake its cleaned start for a missing original. Verify twelve exact ticks, both facings at normal speed, and matching release crop, airRoot and offsets through landing. [Evidence](FULL-ROSTER-ANIMATION-AUDIT.md#loopy-six-pose-double-jump-completed--2026-11-19).


Loopy soft landing: `node scripts/assets/expand-loopy-soft.mjs`, then `node scripts/assets/build-production-fighter-atlas.mjs --pack-03`. Preserve three shipped drawings; add early-v1/mid-v2/late-v2 at heights 92/98/102.5. Use solid sole-support midpoint and interpolate visible sole depth in world units (.99825/.83617/.73983) rather than copying a source-pixel offset between differently sized images. Six two-tick poses retain twelve-tick recovery. Reject elongated-leg samples even when total registered height matches. Review both facings through idle and exact crop order in live stepped/normal playback. [Evidence](FULL-ROSTER-ANIMATION-AUDIT.md#loopy-six-pose-soft-landing-completed--2026-11-19).


Loopy heavy landing: `node scripts/assets/expand-loopy-heavy.mjs`, then `node scripts/assets/build-production-fighter-atlas.mjs --pack-03`. Preserve three shipped drawings; add a deeper compression and two rise poses at heights 88.5/98/102.5. Use sole-support midpoint and interpolated world sole depths .99825/.83617/.73983. Six three-tick poses retain eighteen-tick recovery. Verify both full-jump and fast-fall landing through idle in both facings, with exact stepped crop order and normal playback. Loopy's eleven movement drawing targets are complete; broader clip/release signoff remains separate. [Evidence](FULL-ROSTER-ANIMATION-AUDIT.md#loopy-six-pose-heavy-landing-completed--2026-11-20).


Mrs. Tasselbottom squat: `node scripts/assets/expand-tasselbottom-squat.mjs`, then `node scripts/assets/build-production-fighter-atlas.mjs --pack-03`. Keep two shipped drawings and insert corrected v2 at height72.5, three one-tick poses. Solid shoe-support root keeps .6405 world units of visible sole beneath it; do not copy source-pixel offsets across image resolutions. Canonical gown is shipped deep dark plum-purple with gold swags/tassels and cream lace, never black/brown sketch colors. Compare face/fist size relative to gown on a root-aligned board before acceptance. Her floor sample is y466/render offset34. Her natural full rise is eight ticks and fast fall three: budget those short phases separately before expanding them. [Evidence](FULL-ROSTER-ANIMATION-AUDIT.md#mrs-tasselbottom-three-pose-jump-squat-completed--2026-11-20).


Mrs. Tasselbottom takeoffs: run `node scripts/assets/expand-tasselbottom-takeoffs.mjs`, then `node scripts/assets/build-production-fighter-atlas.mjs --pack-03`. Preserve both shipped endpoints and use three two-tick poses. Use shipped purple/gold costume references, never the brown/black sketch. Airborne anchors must interpolate endpoints, independently of grounded roots. Review on light/dark backgrounds and inspect both facings. [Registration and validation](FULL-ROSTER-ANIMATION-AUDIT.md#mrs-tasselbottom-three-pose-directional-takeoffs-completed--2026-11-20).


Mrs. Tasselbottom rise budget: eight full-hop ticks after takeoff, two short-hop ticks; double jump transitions directly to apex. Plan six poses with [1,1,1,1,2,2] durations and phase-local progression. Do not copy another fighter's twelve-tick rise/apex routing. Review one new shipped-costume pose before completing all four in-betweens. [Measured baseline](FULL-ROSTER-ANIMATION-AUDIT.md#mrs-tasselbottom-rise-phase-budget-audit--2026-11-20).


Mrs. Tasselbottom rise: `node scripts/assets/expand-tasselbottom-rise.mjs`, then `node scripts/assets/build-production-fighter-atlas.mjs --pack-03`. Six poses use [1,1,1,1,2,2] over eight available full-hop ticks; short hop truncates to the first two. Renderer advances only her rise by phase-local age and holds its endpoint. Preserve double-to-apex handoff and existing apex thresholds. Single-tick drawings need stepped verification; normal-speed sampling can miss individual ticks. [Evidence](FULL-ROSTER-ANIMATION-AUDIT.md#mrs-tasselbottom-six-pose-rise-completed--2026-11-20).


Mrs. Tasselbottom apex: `node scripts/assets/expand-tasselbottom-apex.mjs`, then `node scripts/assets/build-production-fighter-atlas.mjs --pack-03`. Six two-tick poses. Her asymmetric art band (-2 through +6.75 vertical velocity) preserves eight full-rise ticks while extending apex art into early descent. Never override fast fall. Short-hop fall has only one tick; verify it with stepping rather than requiring every normal recording to sample it. Next fall work must fit seven full-hop ticks and preserve this budget. [Evidence](FULL-ROSTER-ANIMATION-AUDIT.md#mrs-tasselbottom-six-pose-apex-completed--2026-11-20).


Mrs. Tasselbottom fall: `node scripts/assets/expand-tasselbottom-fall.mjs`, then `node scripts/assets/build-production-fighter-atlas.mjs --pack-03`. Six drawings use [1,1,1,1,1,2] over seven full-hop ticks, advance by local age and hold the final pose on longer drops. Short hop displays only its first drawing; never stretch physics to show an entire clip. Review all crops in both facings, then exact stepping and normal-speed landing. [Evidence](FULL-ROSTER-ANIMATION-AUDIT.md#mrs-tasselbottom-six-pose-fall-completed--2026-11-20).


Mrs. Tasselbottom fast fall: `node scripts/assets/expand-tasselbottom-fastfall.mjs`, then `node scripts/assets/build-production-fighter-atlas.mjs --pack-03`. Preserve the three shipped drawings and insert three, with six two-tick poses and endpoint hold. Use the controlled higher-drop fixture for full coverage; ordinary jumps land after only three fast-fall ticks and must truncate. Existing fast-fall-local renderer timing is sufficient. [Evidence](FULL-ROSTER-ANIMATION-AUDIT.md#mrs-tasselbottom-six-pose-fast-fall-completed--2026-11-20).


Mrs. Tasselbottom double jump: `node scripts/assets/expand-tasselbottom-double.mjs`, then `node scripts/assets/build-production-fighter-atlas.mjs --pack-03`. Keep three shipped drawings and insert three using six two-tick poses. Preserve twelve-tick cue and direct apex handoff; another fighter's rise-handoff test is inappropriate. Validate duplicate snapshots and hit cancellation separately from uninterrupted browser playback. [Evidence](FULL-ROSTER-ANIMATION-AUDIT.md#mrs-tasselbottom-six-pose-double-jump-completed--2026-11-20).


Mrs. Tasselbottom palette correction: do not use the phrase “royal purple” alone as color guidance. Every new drawing must include shipped idle as the primary palette reference, alongside pose endpoints. Gown base is deep dark plum-purple (representative shipped midtone #4A053E), with restrained highlights; bright magenta/violet fabric is incorrect. Compare equal-scale shipped and new crops before registration. Treat original sketch colors and newly generated candidates as non-authoritative. [Correction history](FULL-ROSTER-ANIMATION-AUDIT.md#mrs-tasselbottom-soft-landing-color-correction--2026-11-20).


Mrs. Tasselbottom soft landing: `node scripts/assets/expand-tasselbottom-soft.mjs`, then `node scripts/assets/build-production-fighter-atlas.mjs --pack-03`. Uses corrected early v2 and mid/late v1, six two-tick poses. Shipped idle is primary palette authority: deep dark plum-purple, not bright magenta. Planted sole depths interpolate originals; original first frame root Y corrected to127.664 to exclude bottom residue from floor registration. Twelve art ticks do not block input; verify fresh Attack interrupts at grounded idle cue age1. [Evidence](FULL-ROSTER-ANIMATION-AUDIT.md#mrs-tasselbottom-six-pose-soft-landing-completed--2026-11-20).


Mrs. Tasselbottom heavy landing: `node scripts/assets/expand-tasselbottom-heavy.mjs`, then `node scripts/assets/build-production-fighter-atlas.mjs --pack-03`. Six three-tick poses, eighteen visual ticks, planted soles and first-frame rootY127.664. Shipped idle is primary dark-plum palette authority. Validate ordinary/fast-fall arrivals, both facings, stepping and normal playback, plus early Attack interruption. Run `node scripts/assets/audit-movement-parity.mjs --all-roster` to check all ten fighters' eleven movement clips; default remains Packs02/03. Root, alpha, duration and decoded-hash checks do not replace costume/pose review or rare-trigger tests. [Completion and limits](FULL-ROSTER-ANIMATION-AUDIT.md#movement-drawing-targets-completed--2026-11-20).


Targeted landing residue cleanup: Mrs. Tasselbottom's first soft/heavy source rectangle is139×129 at(2,1208); root remains(74.754,127.664). The old136-pixel height included detached residue below the shoes. Exclude confirmed empty/residue gutters in atlas registration when retained art can stay pixel-identical; never redraw a costume merely to remove an unrelated scrap. Check actual production crops and retain before/after evidence. Red hue alone does not establish residue. Run `pnpm -F @smash/client test -- src/renderer/fullbody/rosterInterruptions.test.ts` for the60 metadata-driven cue interruption checks; live paired transitions remain separate. [Scope and results](FULL-ROSTER-ANIMATION-AUDIT.md#production-edge-review-and-roster-interruptions--2026-11-20).


Paired transition regression: `pnpm exec playwright test apps/client/e2e/roster-paired-transitions.spec.ts --project=chromium-dpr-1`. Covers five Pack03/04 pairings, forty pummel/throw sequences and twenty footstool interruption/recovery sequences. forcePosition sets airborne; settle and assert grounded before a grounded Grab. Use radius sums for footstool placement rather than copying a fixed56-pixel gap across fighters. Impact tint can make a purple costume look red/orange: compare untinted atlas pixels before declaring palette drift. Frame-step contact checks are separate from normal-speed and delayed-network review. [Results](FULL-ROSTER-ANIMATION-AUDIT.md#pack-03-and-04-live-paired-transition-audit--2026-11-20).


### Throw release across render rates — November 20 verification

Separated release drawings may omit grabGrip. Pack04 reconstructs the release attachment from the nearest preceding authored held grip and current victim/owner context. Never retain whichever held pose happened to render last: continuous playback may skip a simulation frame and then disagree with stepped playback. Do not add a fake grip to already separated artwork just to hide the issue. Compare identical engine states, positions and pose crops at stepped and normal speed, including body-root offsets; visibility and clip-label assertions alone missed this defect.

Run the throwReleaseContact.test.ts regression (160 Pack04 holder/victim/throw/facing combinations), then the roster-paired-transitions.spec.ts pummel-return cases and roster-paired-normal.spec.ts in chromium-dpr-1. Record exact pairing scope and distinguish local Dojo from network coverage. See the [normal-speed evidence](FULL-ROSTER-ANIMATION-AUDIT.md#normal-speed-paired-replay-and-release-reconstruction--2026-11-20).


### Online paired release audit

Use paired-delayed-online.spec.ts in chromium-dpr-1 for the three Pack03 holders with120 ms input delay. Set PowerShell $env:PAIRED_NETWORK_MODE='jitter' before the same test to exercise five holders with ordered outgoing snapshot delay40/110/65/150/80 ms. Remove that environment variable afterward when switching modes. The fixture starts an isolated real server, captures per-case traces, and uses soft phase assertions to finish the matrix while keeping missed phases failing. Placement uses500 minus each fighter's radius. Synchronize keyboard actions to authoritative grab/pummel transitions, so stale rendered hold does not consume the passive hold budget and create false misses. No production debug endpoint is needed.

As of November20 the jitter gate is red: confirmed throw reactions can be skipped. Do not mistake these presentation failures for missing source poses or waive them based on finite/visible sprite checks. Compare event presentation timestamps with rendered victim state and age before changing art or gameplay timing. [Results and next action](FULL-ROSTER-ANIMATION-AUDIT.md#pack-03-delayed-holders-and-ordered-snapshot-jitter--2026-11-20).


### Confirmed cue handoffs after gameplay recovery

The November20 skipped-cue jitter failure is fixed; retain the older red result as history. Confirmed throw artwork has a six-tick passive-recovery bridge and a bounded wait for an interpolated held victim. Accumulate visual age across state-frame resets; never extend gameplay hitstun to display art. Fresh Attack, Shield, jump and other active states cancel the overlay. Clear historical grip attachment when the first confirmed cue arrives after release, so the sprite does not snap back to the thrower's old hand. This presentation fallback is project tuning, not verified Ultimate frame data.

Keep throwReleaseContact.test.ts regressions for late IDLE, hitstun-to-idle reset, still-held snapshots, active action cancellation and hidden victims. paired-delayed-online.spec.ts instruments cue delivery and the next actual renderer update; compare those states when diagnosing missing art. Its hold-to-throw gap is150 ms after authoritative pummel recovery, allowing both clients to present the hold without exhausting the passive grab clock. The full jitter matrix covers40 cases and captures left forward/up plus right up/down; Loopy additionally captures left down. [Evidence](FULL-ROSTER-ANIMATION-AUDIT.md#confirmed-throw-cue-handoff-under-jitter--2026-11-20).


### Release checkpoint after live action verification

Use PAIRED_ACTION_CHECK=1 together with PAIRED_NETWORK_MODE=jitter in paired-delayed-online.spec.ts to test fresh defender Jump, Attack, Shield and Special after recovery. The five-pair ring gives each newer fighter a defender role in both facings. Require actual active-state rendering on both clients without throw_victim; early-held input behavior is a different test. Accepted locally predicted ground jumps must carry their takeoff cue so a delayed confirmed throw does not cover them. [November20 release preflight](../plans/ANIMATION-RELEASE-2026-11-20.md).

Production does not expose forcePosition or getArtState. release-roster.spec.ts uses read-only snapshots, asset responses and captured images; keep development-only staged lifecycle fixtures on the dev build. Use the testing guide's temporary configuration override for a compiled-server URL. Named raw browser outputs are ignored; preserve curated evidence under docs/assets/reviews.
