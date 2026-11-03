# Contact and gameplay-scale pass — revision 18

Completed 2026-11-03. The pack remains 136 clips / 763 registered body frames per fighter (408 clips / 2289 frames plus 16 shared FX frames).

## Corrections

Inspected 126 selected holder/ledge anchor points against the source silhouettes. Corrected 20 manually guided hand points across five clips: Abe Lincoln grab_hold, pummel and ledge_catch; Swift forward_throw approach and ledge_hang. Lincoln right-column grip/catch positions and Swift alternating-column hang positions had reused fractions that missed the actual hand. Points were chosen from the inspected hand regions, not blindly snapped to any opaque pixel. Corrected points are within 0.108 world pixel of opaque hand artwork. No active-contact proximity candidates above three world pixels remain in this selected audit. Open hands and anatomical contact still require visual judgment; this is not a proof that every sprite socket is perfect.

All source PNGs, colors, frame durations, clip scales, attacks, physics and game-state rules remain unchanged. 403 prior clips are unchanged. Ledge roots follow the corrected grip; existing optional full-body contact rendering consumes the new points. Manifest contactVersion is 2.

## Review tools

contact-signoff.html links grabs/throws, footstools and ledges at 1x gameplay, 0.4x distant-sprite and enlarged detail scales. Each page has a Scale control; scale selection does not change the animation tick. The grab/throw stage has more vertical headroom, and ledge columns are inset to keep the outer fighters visible. These are sprite-readability views, not complete camera simulations.

contact-gameplay-pairs.png captures all nine held attacker/victim combinations at native canvas/world scale. ledge-contact-gameplay.png captures corrected ledge-hang contacts. Individual animation review retains gameplay and distant-camera rows for attack poses. Source palettes were preserved; the sampled contact board and corrected ledge view were visually inspected. This pass does not constitute final palette/face approval of all 2289 frames.

## Validation

32 browser tests pass. Added scale coverage includes 288 grab/action/pair/facing/scale scenes, 72 ground/air footstool cases and 32 three-fighter ledge scenes. Existing live contact, release/interruption, attack, loop, facing and offline checks also pass. Footstool contact-marker gap remains below 0.001 canvas pixel at the tested contact pose. The pack contract and TypeScript pass. A focused rerun regenerated the comparison board with clean crops. Code bundling was not repeated because runtime source did not change; full production public-file packaging remains unvalidated.

The audit confirms all five changed clips use the original image files, scales and durations. Prior baseline data is preserved in contact-signoff-before.json. PNG source colors and the accepted walk/jab/Lincoln high-kick artwork are untouched. No environment files or bonney content were inspected.

Next: finish palette/face/costume and remaining in-between/contact visual approval, then effects/player identification and production atlas/loading/memory work. Canonical timing and missing authoritative mechanics/events still gate final game integration.

