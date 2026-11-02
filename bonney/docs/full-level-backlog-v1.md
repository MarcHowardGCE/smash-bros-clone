# Harbor Breakout - staged implementation backlog
Companion design: full-level-plan-v1.md.
Status: proposed; nothing here has been implemented by this planning task.

## First implementation milestone: playable route blockout
Deliver a separately selectable tutorial and full-level route using existing art.
- Extract level/spawn/camera/puzzle data into a documented format.
- Add explicit per-room world bounds and vertical camera zones.
- Remove screen-height assumptions from ceiling and fall detection.
- Build six connected areas, safe return branches and checkpoint anchors.
- Sketch secret locations with placeholders rather than final reward logic.
- Use existing patrols and props initially.
- Check same traversal at baby, teenage and adult.
Review route length, camera, jump spacing and safe recovery before adding the full enemy roster.

## Second milestone: encounter prototype
- Lookout attack telegraph, projectile and recovery.
- Shield Guard directional defense and exposed counterplay.
- Swoop Gull perch, warning, committed dive and return.
- Shared hurt/defeat feedback and damage grace.
- Individual test encounters, then mixed combinations.

## Third milestone: traversal and hazard prototype
- Moving cargo platform carry/collision.
- Fixed-arc hook with warning and damage.
- Cargo-drop warning/shadow/reset.
- Marked breakables and obstacle readability.
- Flight-landing/recharge integration on movers.

## Fourth milestone: level progression
- Checkpoint snapshots / death recovery after review of proposed rules.
- Stable IDs for coins, three keepsakes and persistent latched switches.
- Warehouse stash, crane nest, captain's cabin.
- Customs gate and flagship bridge machinery.
- Results and full restart semantics.
- Recovery food only after confirming its proposed health behavior.

## Fifth milestone: art and playtest
- Interior/deck/crane terrain and background variants.
- Enemy anticipation, attack, hurt and defeat art.
- Treasure and puzzle state artwork.
- Sound feedback and readability pass.
- Full browser flow, pause and reset checks.
- Manual first-attempt playtest; tune main/secret routes separately.

## Scope discipline
Defer a full boss, new powers, controller/mobile support, permanent save, multiplayer, more than four enemy families and branching full-length levels.
Keep graybox iteration cheap. A fun route is the approval gate for expensive art production.
