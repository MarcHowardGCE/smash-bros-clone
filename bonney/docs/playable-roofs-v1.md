# Playable building roofs

All eight buildings now share architecture data between their scenery renderer and collision layout. Roof profiles follow structural roof surfaces, omitting flags, chimneys and masts. One-way roof collision is invisible: the artwork itself supplies the platform surface. Small slope steps support walking in both directions and permit jumping away.

Removed existing one-way platforms that crossed building facades. Added four approach ledges beside buildings. Elevated coins inside facades move onto the associated roof. The cabin bell now rests on its roof. Former rooftop enemies whose old ledges were removed are reassigned to supported ground with bounded patrol ranges. Existing ground-level puzzles remain.

Verification: 50 passing tests, syntax checks, all ages landing/walking/jumping on every roof, and eight browser landing captures in docs/screenshots/roof-review/. Full progression browser checks use the bell's current authored position.

Roof access uses approach ledges and Egghead flight for higher architecture; the lower route stays open. Remaining freestanding traversal platforms and crane routes are retained. Roofs are one-way surfaces rather than solid building interiors.


## Running and continuous inclines
Hold either Shift key while moving to run at 168 world pixels per second (walking: 105). Works in both courses and all ages. Release returns to walking; Captain charge retains its own speed. The existing distance-driven walk cycle speeds up with travel.

Roof contacts now evaluate the continuous roof profile at the player's foot position rather than snapping between 16px ledges. Ground contact stays stable uphill and downhill; jumping releases normally. Verification: 51 passing tests, syntax checks, eight roof browser captures, full-level progression, and a real keyboard Shift press/release check.
