# District rendering and placement repair

## Root causes and fixes
- District scenery was gated by the player's current theme: adjacent scenery appeared only after crossing a threshold. World-bound scenery now renders before entry and remains visible when looking back.
- The main renderer wrapped the camera at 1920 pixels, causing the harbor and props to jump. The panorama now tiles continuously; decorations use world coordinates.
- Decorative barrels and lanterns were repeated without checking floor support. They are now placed on actual ground segments.
- One upper lookout was left of its intended platform. It was relocated onto it, and all ground enemies snap to valid supporting surfaces at level initialization.
- Patrol ranges are clamped to those supports.
- Perched gulls lacked visible supports. Perch platforms, artwork and grounded posts now support them.
- Swing chains were drawn vertically while hooks moved sideways. Chains now connect pivot to hook along a consistent pendulum arc.
- Ship-deck artwork previously filled real floor gaps, suggesting nonexistent collision. It now respects the actual floor segments.
- Crane, gate, winch, lever, bell and chest placeholders have been replaced with dedicated generated art.

## New assets
assets/machinery-v2/ contains the source and eight exported machinery props.
scripts/pack-machinery.mjs reproduces the exports using the parent's existing pngjs dependency.
Built-in image generation was used, including an alpha/background cleanup request; no CLI/API-key fallback.
Prompts: docs/machinery-prompts-v2.txt.
Current district captures: docs/screenshots/full-level/.

## Verification
38 unit/integration tests passed, including new checks for:
- identical world scenery before/after player district entry;
- panorama coverage at district/wrap positions;
- supported ground enemies and safe patrol ranges;
- gull perch support;
- constant pivot-to-hook chain length;
- no painted ship floor over a real gap.
Full-level browser checks passed after the fixes, including asset loading, gate puzzles, checkpoint recovery, cabin treasure and victory.
Updated district montage visually inspected.
Existing game rules and power timing remain unchanged.

Follow-up: removed the flat ship-deck panel overlay shown in player feedback. Hull surfaces now use short textured planks, grain, bevels, seams, rivets and ribs, culled to the viewport. Replaced large opaque warehouse window blocks with open timber framing. Updated the ship-floor regression to use an on-screen camera. All 38 tests, syntax checks and full-level browser flow pass.

November 2 cleanup: removed the warehouse tint rectangle, repeated timber lattice, full-height supports beneath every raised platform, global panorama tint rectangle, and oversized ship mast/sail overlays. Replaced supports with short platform brackets and kept grounded bird posts. Rescaled crane assemblies to prop size on narrow grounded pilings. Added a regression against broad tint boxes and oversized background timber. All 39 tests and full-level browser checks pass; repaired crane and district captures visually reviewed.
