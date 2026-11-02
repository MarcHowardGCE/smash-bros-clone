# First playable POC - verification

## Delivered
Standalone native Canvas/ES-module game in C:\Github\smash-bros-clone\bonney.
Local preview: http://127.0.0.1:4174
Run from this folder with node server.mjs; no installation required.
Short 1920-pixel scrolling harbor course, approved six age/outfit sprites, pickups, flight, cannonball, enemies, breakable crates, coins, checkpoint, death/restart, victory, pause, and optional synthesized sounds.

## Checks passed
- 11 Node gameplay tests.
- Syntax checks for simulation, renderer and server.
- Browser smoke test using the parent repository's existing Playwright installation and browser.
- Browser loaded all game assets with no captured page errors or failed game responses.
- Actual keyboard movement, double-jump flight, pause freezing timers, cooldown transition, pickup replacement preserving cooldown, and cannonball activation verified.
- Enemy collision reduced age through teenage and baby to death; restart and victory overlay verified.
- Narrow 700-pixel desktop layout checked for horizontal overflow.
- Terrain-only full traversal at all three ages verified without abilities or damage; this check isolates terrain from combat and is not a full combat playthrough.
- Captured and inspected docs/screenshots/playable-harbor.png.

## Fixes during verification
Moved a crate out from underneath a low platform to remove a blocked passage.
Replaced tiny anti-aliased browser text with a deterministic 3x5 bitmap font for a readable pixel HUD.

## Reproduce
node --test src/engine.test.mjs
npm run check
With preview server running, and the parent's Playwright dependencies/browser available:
node scripts/browser-smoke.mjs

## Limits and next work
Idle sprites currently bob while moving; full character animation cycles remain pending.
Controls and cannonball tuning are prototype defaults documented in README.md.
Manual player feedback on movement, combat difficulty and flight handling is still needed.
No touch/controller support, save persistence, or public deployment.
The existing parent multiplayer fighter was not integrated or changed.
