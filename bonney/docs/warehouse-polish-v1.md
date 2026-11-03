# Grounding fix and Warehouse Row polish v1

Market facades previously ended at y=396 while the quay top is y=400, causing a visible four-world-pixel gap.
All market and warehouse facades now use a common y=400 foundation anchor, deriving top position from their height.
Curated props retain explicit top coordinates and also end at y=400.
Regression tests cover both building and prop bottom alignment.

Warehouse Row (x=960..2176) now uses two authored facade assets: a broad stone-and-timber loading warehouse and a brick/teal-door annex.
Three building placements establish local architecture while keeping the harbor visible in the spaces between.
Regularly repeated decoration is replaced with four curated warehouse props.
Fourteen authored coins replace the previous twenty-nine, with enemy cue lanes kept clear.
Small coins, reduced pickup scale, compact HUD, quieter distant scenery and grounded camera framing continue through the warehouse.
The camera/background treatment blends out at the Crane Basin boundary.
Existing collisions, enemies, required outfit access, treasure conditions and power rules remain unchanged.

Assets: assets/warehouse-polish-v1/ (source, warehouse-wide.png, warehouse-annex.png).
Built-in image generation used; exact prompt: docs/warehouse-polish-prompts-v1.txt.
Reproduction: scripts/pack-warehouse-art.mjs.
Scene helpers: src/market-scene.mjs.
Captures: docs/screenshots/warehouse-polish-v1/.

Validation: 44 tests pass, including grounded facade/prop and clear encounter-lane checks.
Warehouse/market browser captures load without page errors; the full-level progression browser checks pass.
Native screenshots inspected for foundation alignment and actor readability.
Human review of architectural scale and composition is still welcome.
Next district in the polish sequence: Crane Basin.
