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

Generate one representative pose first, preferably the pose with the greatest change in silhouette or viewing angle. Compare it beside shipped artwork at source and gameplay size. Check the dominant garment panels and trim individually, then inspect alpha, outline, scale, visible extremities and pose orientation. For prone poses check the back or stomach actually contacts the floor. Use the accepted pose with the shipped idle for the remaining drawings. Review every cell before packing. Keep rejected drafts out of source and production atlases.

Check alpha before using a generated pose as a reference for follow-ups. Inspect on white and dark backgrounds, check empty gutters and corners, and scan for semi-transparent pixels away from solid ink across all RGB colors. Inspect any flagged pixels at full resolution to distinguish costume details from residue. A clear thumbnail or transparent corners alone are insufficient.

**Hit launch** uses two distinct drawings. Hold impact through hitlag and ticks 0–3, then show follow-through on ticks 4–9 and hand off to tumble at tick 10. Verify both facings and registration.

**Tumble** uses four distinct poses. When the renderer also rotates the sprite, use the same clock for pose and angle, starting at the launch-to-tumble handoff. Inspect a full loop and the wrap in both facings.

**Footstool** uses six distinct poses for each of the attacker, grounded victim and airborne victim. Start with the contact frame and register the sole and head sockets on that pose. Use the shared frame selector for both drawing and socket lookup. Replay both facings with mixed packs and give airborne victims enough clearance to play all 18 cue ticks.
