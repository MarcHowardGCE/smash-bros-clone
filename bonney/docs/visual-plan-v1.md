# Bonney platformer: visual planning v1

Status: brainstorming; no game implementation started.

## First visual direction
Bright pirate harbor, turquoise water, warm stone and timber, pink character accents.
16-bit-inspired look. Proposed terrain tiles: 16x16. Proposed player cell: 32x32, with a 32x48 fallback if outfit readability needs it. Proposed logical viewport: 384x216, integer scaling with nearest-neighbor sampling.

The generated character board and harbor screen are concept references, not production sprite sheets or dimension-accurate pixel assets. The board exceeds the proposed pixel budget. Test an actual 32x32 sprite in a viewport before committing. Outfit studies A/B are exploratory, not approved canon-era representations. The harbor is a proposed original setting, not an identified canon location.

## Up-front asset kit
1. Base Bonney size test: idle at actual scale and enlarged; palette and silhouette.
2. Transformation lineup: base plus two selected era looks, labeled with references and distinct silhouettes.
3. One gameplay screen: terrain, player, enemy, pickup, obstacle, HUD.
4. Terrain tile sampler: ground top/middle/bottom/corners, platform ends/middle, water edge, hazard.
5. Gameplay icon sampler: transformation pickup, health, collectible, checkpoint, goal.
6. Enemy silhouette sheet: patrol and ranged enemy, readable against the environment.
7. Transformation storyboard: pickup, effect, changed form, ability demonstration.
8. Level blockout: safe introduction, practice, combined challenge, checkpoint and finish.

## Proposed production inventory
| Group | Initial budget |
|---|---|
| Player | 3 forms; 18 frames each: idle 2, run 6, jump 2, fall 1, land 2, hurt 1, ability 4; mirror left-facing if suitable |
| Transform effect | 6-8 frames shared across forms |
| Enemies | 2 types; about 8 frames each |
| Terrain | 24-40 reusable 16x16 tiles |
| Props | 8-12: crates, barrels, ropes, signs, checkpoint, goal |
| Background | 3 layers: sky, town/ships, water |
| Items and HUD | 6-10 icons; simple animated collectible/pickup |
| Effects | jump dust, landing dust, hit, block break, pickup sparkle |
| Screens | title/instructions, pause, death/restart, victory |
| Audio | one loop plus jump, pickup, transform, hit, break, checkpoint, victory |

Inventory is a planning budget; revise after movement and pixel-scale tests.

## Proposed level
Harbor Run: 3-5 minutes for a first playthrough, several connected screens.
- Safe quay introduces movement and jumping.
- First pickup demonstrates one transformation.
- Low-risk obstacle teaches that form's ability.
- Checkpoint before enemy/platform combination.
- Final short challenge and visible finish.
The concept screenshot compresses these elements for art review; it is not the full level layout. Validate jump reach, collision boundaries, camera framing, and enemy sightlines in a playable blockout.

## Decisions to resolve before full asset production
- Which two exact era looks should accompany base Bonney? Use supplied reference images or verify references before claiming canon accuracy.
- Are transformations cosmetic outfit changes, age/form abilities, or a mix?
- Suggested first mechanic: one form breaks marked crates; second ability remains open.
- Prefer compact 32x32 sprites or taller 32x48 sprites?
- Harbor setting and bright palette: keep or revise?
- Enemy interaction: stomp, attack, avoidance, or a combination?

## Recommended next milestone
Produce a strict-size base sprite and a small tile sampler, then a single playable screen with run/jump and one transformation. Expand only after silhouette and movement review.

## Pipeline and validation
Generate visual concepts; encode production pixels into reusable palette/template definitions; export transparent PNG sheets and frame metadata. Check grid size, transparency, frame alignment, palette consistency, silhouettes, and tile seams. Review animations in motion. Generation is automated; visual quality still needs iterative review.

## Files
- assets/concepts/bonney-character-study-v1.png
- assets/concepts/harbor-gameplay-study-v1.png
- docs/concept-prompts-v1.txt (exact built-in image generation prompts)

Generated with the built-in image tool. No CLI fallback used.
