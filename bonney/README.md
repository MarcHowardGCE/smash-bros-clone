# Bonney: Harbor Breakout

A standalone browser platformer with a separate tutorial and a complete first-pass full level. Everything lives in C:\Github\smash-bros-clone\bonney.

## Play
Open this folder in VS Code and run:
node server.mjs
Then open http://127.0.0.1:4174/
No dependency installation or build step is required to play. Requires Node.js and a desktop browser.
Use the Course selector for Harbor Breakout or Tutorial. Harbor Breakout is selected by default.
Direct links:
- http://127.0.0.1:4174/?mode=full
- http://127.0.0.1:4174/?mode=tutorial
Stop the server with Ctrl+C. npm start is equivalent. Set PORT if 4174 is occupied.
The preview listens only on your computer.

## Controls
- Arrows or A/D: move left/right.
- Space: jump. A second press in the air activates Egghead flight.
- Hold Space during active flight: rise. Release: fall under gravity.
- X: Captain cannonball, in the facing direction.
- E: operate a marked purple switch while Egghead is equipped.
- P / Escape: pause. The game also pauses on losing browser focus.
- R / Restart: reset the whole selected course.
- Enter or the overlay button: start, retry from checkpoint after full-level defeat, or play again after victory.
- Toolbar Sound button: optional synthesized effects.

## Full level
Harbor Breakout has six connected districts: Market Quay, Warehouse Row, Crane Basin, Customs Gate, Shipyard Approach, Flagship Deck.
A 6,400-pixel route and vertical spaces include rooftop branches, moving cargo lifts, swinging hooks, falling cargo, marked breakables, food and coins.
Patrols, Lookouts, Shield Guards and Swoop Gulls have different counterplay; see the in-game enemy field guide.
The objective strip updates as progression changes.
Customs and flagship gates each require two persistent mechanisms.
Three optional treasures reward a hidden cargo break, a high crane ascent, and a bell/hatch sequence.
Treasure collection is not required to finish.

## Health and recovery
Adult -> teenage -> baby -> defeat. All ages have the same movement, collision size and abilities.
Food restores one stage, capped at adult, without changing the power.
Falls cost one stage and return to a recovery anchor.
In the full level, defeat offers Continue from checkpoint as adult, with the checkpoint's power ready.
Coins, collected treasure, food already consumed and secured switches/locks persist for the current run.
Enemies return to starting positions and projectiles clear on retry.
R / Restart resets the entire run, including collectibles and switches.
No save survives a browser refresh. Tutorial defeat retains its original full restart behavior.

## Powers
One equipped power at a time. A different pickup replaces the old one at full charge immediately.
Either ability can activate with any nonzero recovered charge: 50% yields half the duration.
- Egghead: up to five seconds of lift fuel. Fuel drains only while Space supplies lift in the air. Release preserves fuel and applies gravity. Landing immediately ends flight and starts the five-second recharge. Empty airborne fuel waits for landing.
- Captain: up to 0.55 seconds at 360 pixels/second, defeating exposed enemies and breaking marked cargo. Duration scales with available charge; speed and damage do not.
- Shield Guards block a charge from the protected front; bait a swing, attack from the rear during its opening, or stomp.
Full level movement includes a 90ms coyote-time window and a 100ms jump buffer.
Walking sprites use six frames at a fixed cadence per distance, with horizontal padding preserving body scale.

## Project structure
- src/engine.mjs: shared physics, health, powers and collisions.
- src/level-data.mjs: full route, rooms, enemies, hazards, mechanisms and collectible placement.
- src/encounters.mjs: enemy states, moving geometry, puzzles and checkpoint retry.
- src/game.mjs: input, camera, canvas integration, HUD and menus.
- src/full-level-art.mjs: district backgrounds, new enemies, hazards and puzzle visuals.
- src/world-art.mjs: refined harbor scenery, guards, props, water and effects.
- src/locomotion.mjs: distance-based animation.
- assets/: preserved concepts/references and exported pixel art.
- scripts/: artwork packers and browser verification.
- docs/: design history, current implementation notes and screenshots.

## Verify
npm test
npm run check
With the preview running, and the parent's existing Playwright install/browser available:
node scripts/browser-smoke.mjs
node scripts/full-level-browser.mjs
node scripts/verify-walking-browser.mjs

33 unit/integration tests passed at delivery, including new enemy behavior, moving-platform carry, gate/secret requirements, persistence, full terrain traversal and physically reachable high routes.
Browser checks cover both courses and full-level progression. Some scene transitions are set up with test-only positioning; this is not a claim of a blind start-to-finish combat playthrough.
The running game has no Playwright/pngjs dependency; art packing and browser checks reuse the parent's installed development tools.

## Delivery notes
This is the complete first playable level, ready for player feedback. Difficulty, clue placement and actual completion time still need human playtesting; the earlier 8-12 minute target is not a measured claim.
Additional enemy animation in-betweens, architectural detail, music and terrain variants can be polished after that review.
No public deployment, parent fighter integration, controller/touch support, multiplayer or full boss system was added.
See docs/full-level-implementation-v1.md for details.

District rendering repair: docs/district-rendering-repair.md. Scenery loads by world bounds; enemies and decorations have supported placement; machinery artwork is in assets/machinery-v2/. Current suite: 38 passing tests.

Market Quay polish slice: the first 960 pixels use authored facades, smaller coin trails, curated props, compact HUD and lower grounded camera framing. See docs/market-polish-v1.md and docs/screenshots/market-polish-v1/. Current suite: 41 passing tests.

Market grounding and Warehouse Row polish: docs/warehouse-polish-v1.md. First two districts now use authored architecture, smaller coin trails, curated props, compact HUD and grounded camera framing. Current suite: 44 passing tests.

Remaining-district polish: docs/remaining-district-polish-v1.md. All six districts now use compact framing and authored reward/decor placement; 68 total coins, 16 enemies, 16 power-ups and three treasures remain. New district structures are in assets/district-polish-v1/. Current suite: 47 passing tests.

Current cloud course: see docs/cloud-full-v1.md. The original discovery prototype has expanded into a four-district alternate level with its own cyan flag, robots, architecture, hazards and mandatory puzzle. Only Egghead/Gear costume pickups spawn there. Cloud and harbor flags reserve distinct future next-level entrances.

Character roster: choose Jewelry Bonney or Monkey D. Luffy beneath the canvas. Selection changes sprites only and preserves the run. Luffy has all four outfits, all three age stages and full movement/melee animation sets. See docs/luffy-v1.md and assets/luffy-v1/manifest.json.

## Underwater route: Coral Current
Harbor water now leads into a separate 2,560-pixel underwater course without fall damage. Both heroes automatically wear their diving suit at the current age. Walk speed is 62% of normal, gravity is 280 instead of 760, and grounded jump impulse is 285 instead of 255. There is no free swimming, flight, or midair jump; Shift still runs. Z punches, C kicks, and stomps remain available. Power costumes are stowed on entry and restored upon surfacing.

Four districts contain four animated coral crabs, three high-route treasures, health food, and a checkpoint. Press E at the entry lift to surface early; complete the far lift to record the separate deep-research-dock destination, then choose Return to harbor. Surface return uses nearby solid ground and respects locked harbor gates. Harbor and underwater progress persist independently. Cloud falls retain their existing harbor return.

This is a first playable pass. Reef ledges still use simple drawn stonework; Bonney's helmet/hair seal artwork needs another pass. The sealed suit is fan-game fiction, not a canonical exemption to Devil Fruit sea weakness. See docs/underwater-route-v1.md.

## Full underwater course (version 2)
Coral Current now spans 4,608 × 1,152 pixels, with five districts and a high route more than 800 pixels above the seabed. It includes two mandatory gated puzzles (paired pressure valves and ordered research relays), 14 enemies across four encounter types, warning vents, a moving lift, playable building roofs, three optional secrets, four food pickups and three checkpoint bells. E operates controls; Z/C break the optional cracked cache. Shift runs. No swimming or power pickups are required.

This supersedes the smaller first-pass map described above. Current design, art provenance, controls, verification and remaining balance work: docs/underwater-full-v2.md. Full browser audit: node scripts/underwater-full-browser.mjs. All 103 gameplay tests pass; harbor and cloud progression checks also pass.

## Connected-level design audit — November 2, 2026
Current review: docs/connected-level-design-audit.md. It covers all three routes, evidence, fairness repairs, encounter pacing, secrets, recovery costs and a prioritized fun/difficulty pass. This audit fixes visible underwater gunfire/aim cues, projectile blocking at solid gates/crates, checkpoint-respecting cloud re-entry and area-specific rules. It does not yet implement the proposed movement, camera, supply or puzzle redesigns. Verification: 106 tests, all three browser progression checks and scripts/level-design-audit-browser.mjs. Reproduce layout/movement measurements with node scripts/level-design-metrics.mjs.

## Movement and recovery refinement — pass 1
Tap Space for a low hop; hold for the original full-height jump. The camera now eases toward the direction of travel and looks farther down while falling. Damage bounds follow each age's standing artwork without changing shared movement collision. A safe practice fading cloud, one additional cloud checkpoint, two additional underwater bells and an unlocked-only crane return reduce repeated traversal. The original cloud discovery still requires the full-flight ascent. Details and verification: docs/refinement-movement-v1.md. New browser check: node scripts/refinement-browser.mjs.

## Xbox / Xbox 360 controllers
Connect a recognized controller, open the game and press/release a button. Left stick or D-pad moves; A jumps (hold for height/flight), X punches/charges Gear, B kicks, Y interacts, RB uses the Captain special, RT or LB runs, and Menu/Start pauses. A confirms start/resume/retry/route return. In menus, LB/RB chooses the character; D-pad left/right chooses the initial course. Disconnecting pauses play. Keyboard controls remain available. Full guide and hardware-test limitation: docs/controller-support-v1.md. Automated verification: 119 tests plus node scripts/controller-browser.mjs with simulated Xbox/Xbox 360 input.

Underwater-only camera correction: falling look-down applies only inside Coral Current. Harbor/cloud framing and land gravity remain separate. Regression suite: 121 passing tests.

## Deliberate supplies and physical puzzle effects
Marked supply trays now require E / Xbox Y to choose a replacement costume; walking past keeps the current power. Harbor supplies are curated from 16 to 12, with required recovery supplies preserved. The harbor winch frees boarding rigging, the cloud reactor powers a lift to its console, underwater valves activate a pressure platform and shut off vents, and relay A powers the research lift. Gates retain their original required solutions. Full details: docs/deliberate-puzzles-v1.md. Verification: 128 tests, all three progression checks, and node scripts/puzzle-effects-browser.mjs.

## Background music and volume
ANCHORS AWEIGH! (MARINE PORT) now loops during gameplay across all three areas. Use Volume and Mute beside the game; expand Music and effects for separate levels. Preferences survive refreshes. Music pauses/resumes with the game and restarts on a new run. See docs/level-audio-v1.md. Verified with the actual MP3, 133 tests, node scripts/audio-browser.mjs, and the controller browser regression.
