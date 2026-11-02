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
