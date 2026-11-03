# Coral Current — full underwater level, version 2

Coral Current is now a 4,608 × 1,152 world, replacing the shallow first-pass layout. Its highest authored catwalk is at y256, over 800 pixels above the lower seabed. The same heavier movement and buoyant jumps apply at all ages; no swimming or flight is needed. Sprinting with Shift makes cross-gap jumps more forgiving.

## Districts and route

| District | Horizontal range | Play pattern |
| --- | --- | --- |
| Coral Landing | 0–768 | Safe arrival bell, successive ledges, first crab and floor gap. |
| Coral Cathedral | 768–1920 | Alternating high ledges, two pressure valves, jellyfish, optional summit pearl. |
| Sunken Wreck | 1920–2816 | Checkpoint, playable wreck roof, armored crab, cracked cargo hiding a chart. |
| Pressure Lab | 2816–3904 | Playable habitat roof, relay climb, submarine crossfire, moving research lift, second gate. |
| Deep Research Dock | 3904–4608 | Final checkpoint, roof shortcut, armored sentinel and separate underwater exit. |

Lower ground provides recovery paths. Missing a high jump usually drops to a lower route rather than killing the player. Three short seabed gaps remain fall hazards. Every building has a collision roof, and freestanding ledges do not pass through its facade. Doors, valves, food, checkpoints, crates and grounded enemies use world-space support surfaces.

## Mandatory puzzles

1. Turn the cathedral's lower and upper brass valves with E. Both remain secured after defeat. The first pressure gate blocks every height until both are turned.
2. Power relay A on the middle research catwalk with E, then climb to relay B near the top. Relay B cannot activate before A. The second gate blocks every height until both are secured. A lift provides an additional route through the lab; it does not bypass the puzzle.

Four status lamps and the HUD puzzle-progress bar report secured controls. Nearby prompts show what E does and explain an unpowered relay. The objective below the game updates with the current puzzle. Closed gates show a narrow vertical energy barrier; this matches their collision bounds.

## Optional secrets

- Cathedral Pearl: climb beyond the required valves to the highest coral shelf; the pearl is only fully shown when close. A small glint hints at its location.
- Wreck Captain Chart: take the high wreck route and break the cracked cargo with two separate punches/kicks. Kelp obscures the cache until the seal is broken. One held animation cannot count as multiple hits.
- Research Prism: explore the top relay shelf after powering relay B. The main exit does not require any treasure.

## Encounters and hazards

14 enemies: five ordinary coral crabs, two armored crabs, four pulsing jellyfish and three security submarine drones. Ordinary crabs patrol supported terrain. Armored crabs use front shielding, a warning, a lunge and a recovery window. Jellyfish move within a bounded hover patrol; drones warn and fire aimed shots only when on screen. Existing punches, kicks and stomps remain valid attacks.

Three pressure vents warn before becoming damaging. They can be timed or bypassed through upper routes. Four food pickups give recovery opportunities. Three checkpoint bells, including the arrival bell, save safe grounded positions. Checkpoints require landing nearby and cannot activate from a distant overhead path.

## State and routing

Harbor entry preserves age and stows the equipped power. Diving suits remain environmental equipment, with no underwater power pickups. Returning restores the stowed power and preserves harbor puzzle state. Revisiting the underwater course preserves its controls, treasures, enemy state and checkpoint. Retry restores adult health at the underwater checkpoint while keeping solved puzzles and collected treasures.

The far dock requires reaching the physical exit at seabed height with both gates solved. It records next-level entry deep-research-dock; that future level is not implemented. Return to harbor chooses supported ground and respects locked harbor gates. Cloud routing remains unchanged.

## Art

Built-in image generation produced the new structure, prop and enemy art. Files are in assets/underwater-full-v1; prompts.json records the three initial prompts. The production building strip was regenerated because the first sheet retained an opaque background. The prop sheet was cleaned with the built-in background-extraction tool. Original accepted source sheets are preserved, and scripts/pack-underwater-full.mjs exports 23 isolated runtime assets with a manifest. The earlier coral panorama and four-frame crab atlas are reused, as are the 60 diving character frames.

The level uses new reef stone and metal block/ledge textures, ruined arch, research habitats, wreck cabin, valves, closed gates, pressure vents, pearls, consoles, bells, chests, kelp, jellyfish and drone animation frames. No temporary rectangle enemies or untextured ledges remain. Small indicator lights, gate fields, bubbles and warning effects are drawn by the renderer.

## Verification

- 103 gameplay tests and syntax checks pass.
- Real-physics traversal checks cover every authored climb, all building roofs, floor gaps and the highest final descent at all three ages.
- Placement checks cover enemy patrol ranges, pickups, controls, roof collision and facade overlap.
- Puzzle tests cover relay ordering, full-height gate blocking, separate cache strikes, grounded checkpoints, exit height and vent warning timing.
- Enemy tests cover bounded jellyfish motion and visible submarine fire.
- scripts/underwater-full-browser.mjs records 28 staged views across both heroes and uses actual E/Z/C inputs for puzzles, cache combat and exit/return. Enemies are held still during those staged captures; they are tested separately in gameplay checks.
- Harbor and cloud browser progression checks pass. The harbor retry fixture now uses an enemy projectile because water intentionally enters the underwater course.
- Runtime audit confirms 109 nonempty textures load without errors.

Screenshots: docs/screenshots/underwater-full-v1. This is a complete first iteration of the course, with fixture-based visual checks and simulated traversal. A sustained human end-to-end difficulty/balance playtest is still needed. Bonney's previously noted helmet/hair seam remains a separate character-art polish item.
