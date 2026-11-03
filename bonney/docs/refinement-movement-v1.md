# Movement, fairness and recovery refinement — pass 1

Implements the first priorities from docs/connected-level-design-audit.md. This pass changes movement control, camera framing, combat fairness and retry cost. It does not yet redesign harbor supply placement or puzzle physical payoffs.

## Player-facing changes

- Tap Space for a short hop; hold Space for the original full jump. The held jump maximum is preserved at every age. Underwater full jumps still rise about 144 world pixels. Browser-controlled taps around 50ms rose roughly 56–58 pixels in the captured run; the exact height depends on release timing.
- Egghead flight still uses a second jump to activate, hold to rise, release to fall. The short-hop clamp does not replace flight behavior. Gear's second jump remains available and can also be shortened by release.
- Damage bounds now match the standing age silhouette more closely: adult unchanged, teenage top inset 3 world pixels, baby top inset 10. Movement collision remains 16×28 for all ages, and stomp feet stay in the same place. Active Captain cannonball retains its original full damage bounds.
- The camera eases between targets, looks farther down during descent and previews leftward travel. Pausing freezes normal camera easing. Scene changes and large relocations reset framing immediately. Enemy aiming uses the actual displayed view so a camera turn does not create off-screen warnings. Camera viewing data lives outside gameplay state, preserving visual-only character selection.
- A practice fading cloud at x320/y184 has solid ground underneath it. Its disappearance teaches the behavior without ejecting the player from the route. The original dangerous fading sequence remains.
- Cloud checkpoints increase from 3 to 4 with a recovery point at x1104 before the first dangerous fading section.
- Underwater checkpoint bells increase from 3 to 5 with recovery points at x832 before the cathedral climb and x2816 before the lab climb. Grounded activation is preserved.
- After the cloud route has been discovered, its crane-roof return pad appears on the highest platform. E returns to the saved cloud checkpoint. It is absent before discovery, so the original full-flight secret requirement remains intact.

## Implementation and tuning

Jump release clamps remaining upward velocity to 135 outside water and 150 underwater, once per normal/second jump. Holding preserves the original impulse and gravity. The engine treats an omitted jumpHeld field as unspecified for existing simulation callers; the real controller always supplies an explicit boolean. Coyote time and jump buffering remain unchanged.

Camera look-ahead ramps with descent speed, up to 64 additional vertical pixels. Horizontal framing targets 104 pixels from the left when facing right, 240 when facing left, easing rather than snapping on a turn. The browser probe measured about 92 pixels below the feet during one representative underwater descent; this is a sample, not a constant guarantee at world boundaries.

Files: src/player-body.mjs, src/camera.mjs, src/engine.mjs, src/encounters.mjs, src/game.mjs, src/cloud-level.mjs, src/cloud-art.mjs, src/cloud-data.mjs, src/underwater-data.mjs, src/combat.mjs and index.html. No new generated art was required; the return pad reuses the cloud fan art.

## Verification

112 tests cover the prior game plus short/held jumps at all ages, preserved full height, flight release behavior, age damage regions, camera smoothing/look-ahead, the safe fading lesson and unlocked-only crane return. Existing traversal checks still cover high routes, main gaps and building roofs; full jumps must now be held when intended.

Browser checks pass for all three route progressions, the real keyboard hidden cloud ascent, character selection with unchanged gameplay state, and exactly four projectile hits for powered adult Bonney/Luffy. scripts/refinement-browser.mjs exercises tap versus held jumps with real controls for both heroes, falling look-ahead, the practice platform and checkpoint-respecting crane return. Screenshots: docs/screenshots/refinement-v1.

The character-switch check caught camera view data being recorded in enumerable game state; that was corrected by keeping it in a separate per-game view store. The test now passes without weakening its unchanged-state assertion.

## Next design pass

Recompose harbor supplies into deliberate choices, then give the gate puzzles different physical payoffs such as pressure-driven platforms and powered lifts. Follow with distinctive optional-route rewards and a human difficulty/pacing playtest. The current changes improve control and reduce repetition; they do not substitute for player feedback on fun.

### Environment isolation correction
The additional downward camera look-ahead is now restricted to the underwater scene. Harbor and cloud jumps use their regular vertical framing; water gravity, movement resistance and terminal descent were already scene-specific and remain so. Added regression checks cover harbor/cloud/tutorial camera isolation and restoration of land movement after surfacing. Verification: 121 tests, syntax checks, harbor browser progression and the movement/recovery browser check pass.
