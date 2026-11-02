# Pixel-scale study v1

## What was made
- Transparent 32x32 base Bonney: idle, run study, jump study.
- 96x32 pose sheet containing those three cells.
- 128x16 tile strip: quay top, stone fill, timber platform, water, crate, barrel, coin, transformation pickup.
- 384x216 harbor screen assembled from these assets; 4x nearest-neighbor preview.
- Review board showing enlarged poses, native-size poses, and tile samples.
- manifest.json records cell sizes and frame order.

All assets were drawn automatically from integer-coordinate palette definitions in scripts/generate-pixel-study.ps1. Run that script in PowerShell to reproduce them. Requires Windows System.Drawing; no downloads or Python dependencies.

## Review
Inspected the review board and assembled screen visually. Hat, pink hair, brown jacket, orange shorts, and boots provide the initial identity cues. The strict-size artwork is substantially simpler than the generated concept. This is a readability study, not a match for its final level of polish.

The run and jump images are individual pose proposals, not complete animation cycles. Enemy is a temporary silhouette. The background is a simple town massing study; ships, clouds, ropes, foliage, and richer environmental detail remain to be designed. The screen is static; jump feasibility and collision behavior have not been validated.

## Recommendations
Keep 16x16 tiles and provisionally keep a 32x32 base cell. Refine face/hair and jacket silhouette, then produce a short idle/run animation preview. If precise era outfit differences cannot read, compare 32x48 cells before completing all forms.

## Pending creative decisions
The user approved continuing the harbor direction; exact alternate era looks remain unspecified. Do not treat concept Form A/B as canon era references.
Select two era references and give each one a distinct gameplay purpose before producing their full animation sets. Suggested mechanics remain proposals: block breaking and a traversal ability.

## Next planning deliverables
1. Refined base sprite animation preview.
2. Selected era reference lineup and ability chart.
3. Harbor tile edge/corner expansion and enemy concept.
4. Level blockout with measured jump distances.
