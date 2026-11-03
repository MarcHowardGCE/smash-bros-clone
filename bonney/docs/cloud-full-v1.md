# Skyward Egghead — full cloud course v1

## Delivered course
The hidden crane ascent now leads to an independent 3840x480 cloud course with four districts: Cloud Landing, Nimbus Gardens, Research Ring and Observatory. The Course selector does not expose the secret. This replaces the earlier three-island prototype and its automatic far-end harbor drop.

The level includes eight alternate robot enemies, three foreground research buildings with genuinely playable flat roofs, 13 costume pickups, 28 coins, three treasures, three checkpoints, two updrafts, three fading cloud pads, two timed energy hazards and a moving hover platform. All costume pickups are Egghead or Gear. Healing snack cases are health items, not extra costume powers.

Walkers patrol supported cloud surfaces; hover drones bob and fire telegraphed shots with vertical aim; shield sentinels guard their front and expose recovery windows. Existing punches, kicks, stomps, Gear shield-breaking lunge and Egghead flight work against them. Their artwork is a separate white/cyan robot atlas, not harbor pirates.

The research energy gate blocks every aerial route until both controls are secured: charge a Gear punch through the cracked casing at x2368, then operate the upper console at x2560 using Egghead and E. Required outfit swaps are provided near the controls. No cloud completion or movement ability bypasses the locked field.

## Alternate finish and future connection
The cloud course has its own cyan-and-white flag with a purple star, completion screen and exit record. Reach the flag at x3744 around the final cloud surface after solving the research gate. Flying far above the flag does not count as touching it. It does not automatically send the player to the harbor or into an unbuilt next level.

Cloud flag reserves {level: next-level, entry: sky-observatory, route: cloud}. Harbor flag separately reserves {level: next-level, entry: harbor-quay, route: harbor}. Completing the harbor after returning from a cloud victory updates the destination correctly; it cannot accidentally retain the cloud entrance. Future next-level routing can consume these identifiers. The next area itself is not connected yet. For now, the cloud completion screen offers Return to harbor.

Falling from clouds still drops into the harbor without damage, retaining cloud/harbor progress and current costume. Landings cannot pass the harbor's first locked gate. Re-entering the clouds preserves collected rewards and solved controls. Combat defeat permits checkpoint retry inside the cloud course. The initial return pad remains available with E.

## Graphics and data
New assets under assets/cloud-full-v1/: habitat.png, reactor.png, observatory.png, enemies-atlas.png, console.png, casing.png, fan.png, flag.png, pylon.png and snack.png. Buildings have flat roof rims aligned to collision. Cloud pads retain proportional silhouettes, visible landing caps and matching one-way collision thickness; disappearing pads show warnings and reform. Rear skyline stays distinct from foreground architecture.

Three sources are retained: buildings-source.png, enemies-source.png and props-source.png. Art was created with the built-in image-generation tool, not CLI fallback. Exact prompts: docs/cloud-full-v1-prompts.txt. Packer: scripts/pack-cloud-full.mjs. All source and runtime files live inside the Bonney project.

src/cloud-data.mjs owns course geometry, enemy/power placement and the cloud exit identifier. src/cloud-level.mjs manages hidden discovery, independent course snapshots and harbor returns. src/cloud-art.mjs owns alternate scenery, robot rendering, props, hazards and the finish flag. Shared movement/combat/checkpoint logic remains in the existing modules.

## Validation
82 tests pass. Route checks cross every main gap using both allowed powers at every age. Placement checks cover building foundations, roofs, facade clearance, item support, robot footing and patrol bounds. Mechanics checks cover fading/reforming clouds, safe updraft lift, both gate controls, checkpoint persistence, independent cloud finish and distinct next-level entry metadata.

Browser validation passes: nine district/roof/flag captures; drone firing; blocked aerial gate traversal; actual keyboard Gear casing break and Egghead console interaction; all three treasures; real checkpoint retry; cloud victory; safe harbor return. Hidden discovery still works with actual jump/flight controls. Existing harbor progression and Gear combat browser checks pass. All 63 runtime textures load successfully. Syntax checks pass.

Screenshots: docs/screenshots/cloud-full-v1/; contact sheet review.png. Representative finish view: sky-flag.png. Browser audit: scripts/cloud-full-browser.mjs. Tests: src/cloud-full.test.mjs.

## Next refinement
Playtest route pacing, drone visibility, fading-cloud timing and updraft discoverability. The sky course is a complete playable POC pass with independent objectives and art; difficulty and audiovisual polish can be tuned before the next-level entrance is connected.
