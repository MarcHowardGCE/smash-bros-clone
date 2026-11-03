# White Gear costume and shared melee v1

## Playable controls
Z punches; C kicks in every costume, at every age, on the ground or in the air. Space remains jump. Shift remains run. X remains Pirate Captain's cannonball ability.

Gear is a replacement power-up on the first cloud island at x176/y200. It has the attached reference's white cloud-curled hair, white jacket, gold buttons, purple sash and sandals/boot covers. Adult, teenage and baby rows all exist. Gear multiplies walk and run speed by 1.5 (157.5 and 252 world pixels/second). The second airborne Space press performs one additional jump with a spin; landing restores it. Gear does not fly. Gear remains equipped when dropping or returning into the harbor, until another pickup replaces it.

## First balance pass
Normal punch: one damage, 18px reach, 220ms animation plus 70ms recovery. Kick: one damage, 26px reach, 340ms animation plus 70ms recovery, longer enemy stun. Each target can be hit only once per attack. Shield guards block strikes from the guarded front while not recovering; rear/recovery approaches and stomps remain valid.

Gear: tap Z for a normal punch. Hold Z for at least 700ms and release for a charged punch. A charge ring and HUD percentage communicate readiness. The charged punch lunges at 300px/s for up to 260ms (about78px), defeats all enemies hit including shield guards, and can break eligible crates. It respects solid walls and locked crate prerequisites. Special recharge is five seconds. Existing partial-energy behavior is preserved: recovered energy permits a proportionally shorter lunge, while zero energy produces a normal punch. Charge buildup is separate from recovered special energy. Normal punches/kicks and the spin jump do not spend the special bar.

## Artwork
48 new source poses: 30 Gear poses (idle, six strides, jump, punch, kick at three ages) and18 existing-costume melee poses (punch/kick for default, Captain and Egghead at three ages). Gear uses common physical scale within each age row, including crouched/jump poses; frames are not enlarged to fill their cells. Source transparency and bottom anchors are retained. Two touching adult stride sprites are separated along their source gutter during packing.

Generated with the built-in image-generation tool, not CLI/API fallback. Sources and exports live under assets/gear-combat-v1/. Sources: gear-source.png and melee-source.png. Runtime atlases: gear-atlas.png, gear-walk-atlas.png, gear-attacks.png, default-attacks.png, captain-attacks.png, egghead-attacks.png. Individual frames and manifest.json are alongside them. Exact prompts: docs/gear-combat-v1-prompts.txt. Reference: C:/Users/misac/Downloads/Bonney’s White Form Across Ages.png. Reproducible packer: scripts/pack-gear-combat.mjs. Sources and older artwork were preserved.

## Code and validation
src/combat.mjs owns input/charge state, attack timing, hit regions, shield rules and one-hit-per-target tracking. The engine applies Gear movement and jump changes; damage, costume swaps, scene transitions and respawn clear transient attack states. Enemy stun expires in both tutorial and full courses. Existing controls and pickup behavior are retained.

72 tests pass. Coverage includes every outfit/age/facing for both melee attacks, shield blocking/recovery, multi-target charged knockout, bounded lunge distance, partial/empty energy, solid walls, locked crates, speed multiplier, double-jump limit and landing reset, cloud pickup/return persistence, and quick taps between simulation ticks. Syntax checks pass. Real keyboard browser checks pass for punch/kick, charged shield break, Gear speed, spin jump and pickup. Cloud discovery, falling returns and upper-route exit pass. Full-level progression passes. All53 runtime textures load successfully. Screenshots and sprite comparison: docs/screenshots/gear-combat-v1/.

## Next tuning opportunities
Playtest charge vulnerability, lunge reach and kick recovery against ordinary encounter spacing. Gear can make the cloud route easier and should be balanced through route design before reducing its defining abilities. This is a playable combat/art first pass; multi-frame attack anticipation/recovery and richer hit reactions remain optional polish.


## Gear walking scale correction
Gear stride frames now match idle's 60/50/36-pixel silhouette height for adult/teenage/baby. Head and torso retain the common physical scale; the lower-body sampling corrects compressed legs rather than magnifying the whole character. Feet stay anchored at the existing baseline. The browser check measures exported PNG silhouette heights and foot positions across idle plus all six strides for each age. Jump and attack poses retain their original physical scale.
