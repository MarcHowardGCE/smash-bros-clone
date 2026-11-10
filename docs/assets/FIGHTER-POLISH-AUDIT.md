# Fighter polish audit — revision 16

> Historical record. The decisions, commands, and next steps below reflect this pass. See the [current project documentation](ULTIMATE-ANIMATION-CHECKLIST.md) for present guidance.

Date: 2026-11-03. All 399 body clips were measured; first/key/last boards for 18 representative families were visually inspected. This is targeted evidence, not approval of all 2235 drawings or final gameplay parity.

## Completed correction

Tumble-recovery normalization used the compressed first pose as the standing-size reference. Final upright visible heights were 135.2% of world standing height for All-Rounder, 111.5% for Abe Lincoln and 118.4% for Swift. Normalize these three clips from the final upright pose instead. Their final heights are now 100%; pose-dependent maxima can exceed that when limbs extend. Only three clip scale values changed. The other 396 clips, all source PNGs, roots, phases, runtime mappings and shared effects remain unchanged. These clips remain preview-only.

## Prioritized follow-up

1. P1: Resolve directional dodge apparent-facing reuse before engine integration. Five source directions plus whole-body mirroring can reverse the visible facing during backward travel. Approve the policy or author backward-travel variants.
2. P1: Resolve canonical combat timing, the previously recorded 20/23 timing disagreements and jab-chain events before final combat-animation timing signoff. Do not stretch simulation timings merely to show all drawings.
3. P2: Inspect tumble rotation spacing, Lincoln run/walk and other ranked loop candidates in slow and normal playback. Endpoint silhouette differences are signals, not automatic defects. Keep accepted All-Rounder walk and Lincoln high kick unless a new visual defect is confirmed.
4. P2: Approve cross-clip body/foot registration and attachment contacts: flight, landing, jab chains, grabs/throws, ledges and footstools. New jab 2/3 support-foot drift measures zero across all three fighters.
5. P2: Confirm face/costume/palette consistency by costume region against idle references. Sampled boards show no reason to apply blanket recoloring; this is not full pixel-level palette approval.
6. P3: Finish effects, duplicate-fighter identification, atlas/memory/loading checks and full public-file production packaging.

## Evidence and commands

polish-audit.html provides searchable 399-row measurements, 18 contact boards and correction evidence. polish-audit-before.json and polish-tumble-recover-before.png preserve pre-correction measurements and the original board. Current measurements use visibleHeight, excluding trim padding; the earlier rough 138% observation included crop padding.

Run: node scripts/assets/build-fighter-art-review.mjs OUTPUT_FOLDER (includes the audit), or node scripts/assets/build-polish-audit.mjs OUTPUT_FOLDER. The report and boards are also published into apps/client/public/fighter-art-pilot-v1. Keep the adjacent PNGs with saved offline HTML.

Validation: strict manifest generation and the airborne-pack contract passed. A comparison against the pre-polish manifest confirms exactly three intended scale changes. All 28 existing browser tests passed. A separate headless check confirmed 399 report rows, filtering to three tumble-recovery rows, image decoding, offline loading and no page errors. Contact boards were visually inspected before/after. No gameplay code, source artwork, environment files or bonney content was changed or inspected by this correction.



## Facing, loop spacing and transition polish — revision 17

Added nine backward-dodge sheets and three run-v2 sheets (72 generated drawings; nine new clips / 54 net registered frames). The pack now has 136 clips / 763 registered body frames per fighter, 408 clips / 2289 frames plus 16 shared FX frames. Original source PNGs remain intact. New backward-dodge selection preserves apparent facing across all sixteen world-direction/facing combinations. Run keeps its 18-tick period with clearer alternating footfalls. Every walk and jab clip is unchanged, including the accepted All-Rounder 24-tick walk and planted jab; Lincoln high kick is untouched.

Tumble now reuses the existing coiled source pose with uniform centered rotation over 18 simulation ticks. Six metadata views store orientation samples; runtime and playback advance rotation on simulation ticks. It does not add six new hand-drawn angles. Duplicate upright beats and angle-spacing jumps are removed, repeated snapshots do not advance spin, and interruption resets rotation. Run/tumble changes apply in optional full-body mode; live loading remains 54 clips per fighter. The nine new backward-dodge clips remain preview-only.

Airborne contextual review uses torso-anchored continuous flight, double-jump, recovery and dodge paths. All tested phase-boundary torso movements are below ten canvas pixels per tick; these are staged review trajectories, not new movement physics or guaranteed final pose in-betweening. Grounded actions retain foot registration. loop-polish-review.html compares revision 16 and current run/tumble/walk playback, and airborne-review.html demonstrates facing/transitions. The art baseline version 2 supersedes the earlier five-direction/mirroring policy.

Validation: twelve selected sheets pass alpha/cell/page-size checks; pack contract and TypeScript pass; 33 focused unit tests and 30 browser tests pass; client code-only bundle passes with environment loading redirected to the empty directory and public copying disabled. Before/after and backward-dodge captures were visually inspected. A pre-change manifest comparison verifies only run/tumble changed among prior clips (393 unchanged), plus nine new clips. Final palette/in-between/contact approval, canonical timing, engine state/event integration, VFX, four-player identification and production atlas/public-file packaging remain open.


## Contact and gameplay-scale pass — revision 18

Corrected 20 hand anchors across Lincoln grab_hold/pummel/ledge_catch and Swift forward_throw approach/ledge_hang, based on inspected hand regions. The selected 126-anchor audit now has no active-contact proximity flags above three world pixels; corrected points are within 0.108 world pixel of opaque hand artwork. This diagnostic does not replace anatomical/contact visual approval. Only five clips of metadata changed; 403 clips, source PNGs/colors, durations, scales and gameplay rules are unchanged. Ledge roots follow their corrected grips. contactVersion is 2.

contact-signoff.html provides the before/after measurements and all-nine-pair gameplay-size board. Grab/throw, footstool and ledge reviews now have 1x gameplay and 0.4x distant-sprite scale controls plus enlarged detail. The native pair board and corrected ledge capture were visually inspected. 32 browser tests, the pack contract and TypeScript passed; new tests cover 288 grab/action/pair/facing/scale scenes, 72 footstool cases and 32 three-fighter ledge scenes. See docs/assets/FIGHTER-CONTACT-SIGNOFF.md. Palette/face approval, effects, duplicate-fighter identification, production atlases/public-file packaging and missing engine mechanics remain open.
