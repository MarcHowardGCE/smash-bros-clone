# Fighter artwork pilot v1 — November 2, 2026

## Current revision 4
Added 20 defense/reaction drawings: four shield-guard, six planted spot-dodge, six roll and four reaction poses. All-Rounder now has 51 drawings. Selected files are all-rounder-shield-v1.png, all-rounder-dodge-v1.png, all-rounder-roll-v1.png and all-rounder-reaction-v1.png. Source imagery and recorded prompts use the built-in image generator; originals remain preserved.

SHIELD loops the sustained guard while the existing shield bubble remains visible. ROLL and SPOT_DODGE follow the existing 20-tick FSM duration and hold their recovery drawing instead of looping. Roll artwork mirrors to horizontal travel relative to facing; curled phases use a body-centre pivot. HITSTUN uses flinch/recoil, or the airborne curl when isTumbling is set. HARD_LANDING uses the prone pose; it does not play a fake recovery before the engine permits one. KO, AIR_DODGE and tech/ledge states retain existing fallback.

Spot-dodge/shield roots follow planted soles; roll/reaction curled poses use body-centre roots and zero vertical offset. Prone art is grounded and keeps its low silhouette. The reaction sheet has uneven pose spacing, so explicit non-overlapping source regions isolate all four complete figures; source PNG pixels are unchanged. Initial roll tuck-hop art and an edge-clipped reaction candidate were refined before selection.

Verification: all 51 frames passed transparency/non-clipping checks. Seventeen targeted unit tests and six browser checks passed, including actual FighterRenderer guard visibility, reverse-roll mirroring, airborne tumble anchoring and KO fallback. Client TypeScript/production build passed. Hash comparisons confirmed the five previous clip manifests are unchanged, including the slower 24-tick walk and accepted jab.

The pack remains optional and needs visual review for face/costume drift, roll continuity and reaction transitions. These checks establish integration, not final animation quality. No physics, hitboxes, invincibility windows or gameplay durations changed. Next: air dodge/tech/getup and ledge coverage, then remaining combat clips and player variants. Lincoln/Swift animation packs are still pending.

## Previous revision 3
User review accepted the improved gait and requested slower normal-speed playback. Walk now uses 4 ticks/drawing, 24 ticks/cycle (25% slower); idle and jab drawings/timing are unchanged.

Added six run drawings and six jump-phase drawings: 31 All-Rounder drawings total. DASH/RUN selects the running clip. JUMPSQUAT and landing lag select grounded compression poses. AIRBORNE chooses rise/apex/fall from vertical velocity; depleted double jump selects the alternate tuck on ascent. DOUBLE_JUMP itself is a one-tick engine trigger and is not guaranteed to be visible in a network snapshot. Missing/nonfinite airborne velocity falls back to existing artwork.

Airborne registration follows the torso, so tucked legs do not pin the feet to the ground. The review jump clip tours the six poses; it is not a simulated trajectory. Run and jump remain visual review candidates. Physical speed, gravity, jump strength, collision shapes and combat timing are unchanged. New sheets and prompts were produced with the built-in image generator and saved beside the pilot assets.

Verification: all 31 frames passed alpha/cell checks; 15 targeted unit tests, the client TypeScript/production build and four browser-review regressions passed. Environment loading remained redirected; Bonney and environment files were excluded.

## Previous revision 2
The review is now served over HTTP for the in-app browser; the portable HTML embeds its images. Use http://127.0.0.1:5193/fighter-art-pilot-v1/index.html while the preview server is running. Controls now wait for decoded images and display failures, with pause/play, stepping, frame scrubbing and collision overlays. Rebuild both reviews with node scripts/assets/build-fighter-art-review.mjs <output-directory>.

Current pack: 4 idle + 6 replacement walk + 9 replacement jab drawings (19 total). Walk cadence is 3 ticks/drawing, 18 ticks/cycle (~63 world units at current walk speed). The marked near leg and unmarked far leg exchange leading roles. Jab uses 3 startup drawings, 1 active drawing, 5 recovery drawings; actual engine phase lengths are unchanged.

Registration uses the planted sole-span midpoint for idle/jab and head alignment for walk. The previous jab had a 32-source-pixel horizontal registration error between cells; that error is removed. Revised jab sole width varies by one source pixel across drawings. Original sheets remain as v1; selected replacements are all-rounder-walk-v2.png and all-rounder-jab-v2.png.

Quality remains under review: small silhouette/costume drift, attack-height alignment, player variants and other actions/fighters are pending. An eight-frame walking candidate was rejected for repeating gait phases. No gameplay stats/timing changed.

## Initial pilot scope and source
Three illustrated full-body master designs based on the four user-supplied character reference sheets. Generated using the built-in image_gen tool, preserving the supplied costumes and archetypes. These are review candidates, not finished animation packs. No Bonney content or environment files were used.

Runtime assets: apps/client/public/fighter-art-pilot-v1/
Review: /fighter-art-pilot-v1/index.html (also opens as a standalone local HTML file).
Game: append ?renderer=fullbody. Default articulated sprites and ?renderer=polygon remain available.

## Implemented
- All-Rounder: four idle drawings, six walk drawings, five jab drawings.
- FullBodyPilot adapter selects these three clips from simulation state/stateFrame/currentMoveId.
- Idle: 12 ticks per drawing; walking: 6 ticks per drawing. Jab drawing 3 covers the engine move-data active window; startup/recovery drawings fill their existing phases.
- Source PNG sheets remain intact. Manifest rectangles trim at runtime, with explicit roots, source sizes, trim offsets and per-clip scale. Build with node scripts/assets/build-fighter-pilot-manifest.mjs.
- All-Rounder is 80 world units tall, foot baseline y+28 relative to its existing hurtbox-centre origin. This is a visual pilot scale, not a change to collision shapes.
- Horizontal facing, invincibility alpha and hit flash work through the existing fighter wrapper. KO and shield states, other actions and other characters fall back to the existing renderer.
- Loading failures/timeouts fall back to existing artwork.
- Three master images are supplied for review; Lincoln and Swift are not animated in the game yet.
- Pilot assets live outside AssetPack's generated assets directory, preventing normal placeholder rebuilds from replacing them.

## Quality findings and next gate
Do not promote this pilot to the default renderer yet.
1. Walking needs stronger alternating near/far leg poses; generated frames repeat similar silhouettes.
2. Idle has minor head/eye and costume drift. Register feet mechanically, then clean shapes manually or regenerate selected frames.
3. Jab is phase-aligned but its fist reach/vertical position has not been approved against debug hitboxes. Art does not define hit detection.
4. Drawings differ slightly in scale and proportions across clips; per-clip scale is a first registration pass.
5. Four player material-color variants are pending. Pilot uses the source costume for every slot, so duplicate All-Rounders are harder to distinguish.
6. Full action coverage (including running, aerials, reactions, grabs, throws and ledges), portrait integration and Lincoln/Swift animations remain pending.
7. Small-scale faces lose fine detail, particularly at 0.4×; silhouette/costume colors carry identity. Review before producing hundreds of frames.

## Acceptance before production
Inspect both facings, light/dark backgrounds, gameplay size and camera minimum. Approve the three master identities, refine the pilot loop, align attacks against existing gameplay, then expand one action family at a time. Preserve move timing and gameplay stats. Generate team-color masks/variants before multiplayer default rollout.

## Provenance
See prompts.json beside the images for source references, production briefs and animation prompts. Original tool outputs remain in the Codex generated_images directory. The reference-sheet backgrounds and typography are not included in gameplay art.

## Verification — November 2, 2026
- Client suite: 523 tests passed across 42 files (includes three new timeline checks).
- Client TypeScript check and production build passed; AssetPack was skipped and Vite/Vitest environment loading redirected away from project environment files.
- All 15 sheet frames passed transparency and non-clipping checks.
- Standalone review loaded all three masters without page errors. Browser screenshots verified transparent compositing, both facings and minimum zoom.
- In-browser adapter checks passed for idle, walk, jab active pose, shield/KO/other-character fallback. Blocking the manifest confirmed existing sprite fallback.
- This verifies pilot integration; full multiplayer gameplay and final art quality are not certified by these checks.

## Revision 2 verification
Four timing tests and the client production build passed. Three browser regression cases passed: live playback/stepping, distinct walk half-cycles and controls, and visible missing-image errors. Self-contained portable review loaded without page errors and without external master-image paths. Web preview was exercised in the in-app browser. All 19 source frames passed alpha and cell-bound checks; jab sole-span width is 204–205 source pixels. Final visual approval remains pending.

## Ultimate completion inventory
Ultimate is the confirmed mechanics target. The broader action-family checklist and later engine handoff are in ULTIMATE-ANIMATION-CHECKLIST.md, with machine-readable data in ultimate-animation-inventory.json. Existing 51-drawing pilot coverage is a partial foundation; it does not certify Ultimate parity.

## Roster expansion

See FIGHTER-ART-ROSTER-V1.md for 74 additional drawings, three-character review and optional renderer integration.

## Grab and throw animation batch

Added 11 sheets / 58 drawings per fighter (33 sheets / 174 drawings): standing grab, hold, pummel, four throws, held victim, pummel recoil, release and directional throw reactions. Current coverage is 36 body clips / 203 drawings per fighter, 108 clips / 609 body drawings total, plus 16 shared effect frames. Previous 75 body clips are unchanged.

Optional full-body rendering distinguishes holder and victim in GRAB_HOLDING. Confirmed PUMMEL and throw hit events select victim reactions; down throw uses impact/bounce/tumble drawings. Release to IDLE uses a short recovery, interrupted by another state. Directional throw poses are independent choices, not a six-pose linear animation. Source-facing metadata corrects the All-Rounder and Lincoln pummel sheets without changing source pixels.

The render snapshot now preserves grab ownership, charge, double-jump and tumble flags through local prediction and interpolation. Existing grab offset remains 40 world units. Combat physics, damage and input rules are unchanged. grab-pairs.html supports all nine fighter pairings, both facing directions, slow playback and stepping. Release trajectories in that page are staged illustrations; final hand attachment, movement during throw startup, air-release handling and Ultimate rules still need engine/design refinement. Dash and pivot grabs remain missing.

Validation: all new sheets passed alpha and frame-boundary checks; TypeScript, 51 animation/network unit tests, 15 animation browser tests and the production code bundle passed. All 75 previous body clips match the saved pre-batch manifest exactly. Full public-file packaging retains the prior unrelated Windows copy limitation; code bundling passed with public copying disabled. Built-in imagegen prompts and selected/refined sources are in prompts.json. These are review candidates, not final visual signoff or complete Ultimate parity.

Next art families: ledge transitions, knockdown/getup/tech variants, remaining movement/defense transitions and dash/pivot grabs.

## Grab contact polish and ledge batch

Grab contact now uses per-drawing holding-hand points and victim upper-body contact rails. Held sprites align at the hand across all nine fighter combinations, follow throw windup, and blend the remaining visual offset back to the physics position after release. The live renderer and paired review share the same contact calculation. Body positions, collision, damage and the 40-unit engine grab offset are unchanged. The paired review can show contact and physics-position markers.

Added eight ledge families per fighter: catch, hang, climb, roll, attack, jump, voluntary drop and trump reaction. Each fighter gains 40 drawings / 8 sheets; 24 sheets / 120 drawings total. Current coverage: 44 body clips / 243 drawings per fighter, 132 clips / 729 body drawings across the roster, plus 16 shared effect frames. Source PNGs for all 108 earlier clips are unchanged; contact sockets are new metadata.

Ledge grip pivots align catch/hang hands to the platform lip; getup drawings progress to the platform top. Runtime facing follows ledge identity, which is preserved in snapshot/interpolation/prediction render assembly. Catch plays for eight visual ticks before the breathing hang. Climb/roll/jump use current 40/45/12 tick lengths; ledge attack uses contact ticks 20-27 of its 60 tick sequence. Drop/trump are twelve-tick visual reactions inferred from hang-to-AIRBORNE and launch velocity, interrupted immediately by damage or other state changes. They add no new input lock. Separate authoritative release-reason markers would improve classification under skipped snapshots.

ledge-review.html offers all three fighters, both stage edges, grip markers, slow playback, tick stepping and staged catch/hang/action/recovery sequences. Actual getup displacement, jump resource rules, ledge eligibility, invulnerability/regrabs and Ultimate parity remain engine work. The current engine freezes ledge action positions and applies exit snaps; the artwork does not repair these mechanics.

The individual review now loads only the selected animation and matching effect, with a bounded cache, avoiding intermittent image-decoding failures as the library grew. Built-in imagegen prompts, selected sources and cleanup prompts are recorded in prompts.json. Baked-in ledge-hit flashes were removed.

Validation: TypeScript, 28 focused animation/contact/snapshot unit tests and 17 animation browser tests passed; all new sheets passed alpha/cell checks. These remain visual review candidates. Next art: knockdown/getup/floor attacks and tech variants, then remaining movement/defense transitions and dash/pivot grabs.

## Recovery and floor attack batch

Added 20 recovery families per fighter (60 sheets / 342 new body drawings): face-up/down knockdown, prone, neutral getup and getup roll; three floor attacks; trip fall, prone, getup and roll; neutral/directional ground techs, wall tech, wall-tech jump and ceiling tech. Current roster: 64 clips / 357 drawings each, 192 clips / 1071 body drawings plus 16 shared effect frames.

All new sources pass strict alpha, page-size and cell-boundary checks. Built-in imagegen prompts, original sources and transparency/padding refinements are recorded in the pack prompts.json. All 132 earlier clip manifests match the saved pre-batch baseline exactly, preserving the accepted walk, jab and Lincoln high-kick appearance.

recovery-review.html compares all three fighters with tick stepping, facing, roll direction and staged impact/prone/action/recovery chains. Floor attack contact uses source drawing 3 (zero-based index 2), matching the extended kick. Wall/ceiling surfaces are staging guides rather than authored collision/contact data. Per-drawing source mirroring aligns the first two face-down getup-roll poses with the preceding prone orientation.

Optional full-body mode maps HARD_LANDING to 18 impact ticks then prone; current neutral tech and roll tech follow the existing 26/40 tick state lengths. Only four new live clips are loaded per fighter; other recovery clips are preview-only. HARD_LANDING still returns directly to IDLE after 30 ticks. Engine floor orientation, getup inputs/timeouts, trip/floor-attack states and hitboxes remain missing. TECH_ROLL currently clears horizontal velocity, so the new drawing does not create travel. Wall techs resolve directly to AIRBORNE without an explicit visual event; ceiling tech and surface event markers remain engine work.

Validation: TypeScript and 29 focused unit tests passed; production code bundling passed with public copying disabled. Full public-file packaging retains the existing unrelated Windows copy limitation. All 19 browser checks passed (17 in the main run and two corrected setup reruns). These are artwork review candidates, not final visual signoff or a claim of Ultimate parity.

Next artwork families: remaining movement/defense transitions, dash/pivot grabs and presentation; then implement missing mechanics against the inventory.

## Movement, defense and grab approach batch

Added 25 families per fighter: dash start, standing/running turn, brake, crouch entry/hold/exit, jump squat, soft/heavy landing, platform drop, front/back teeter, shield raise/hit/drop, parry, neutral/directional air dodge, dodge landing, shield-break launch/dizzy/recovery and dash/pivot grab. This adds 75 sheets / 426 drawings. Current roster: 89 clips / 499 body drawings per fighter, 267 clips / 1497 body drawings plus 16 shared effect frames.

transition-review.html stages all three fighters, both facings, travel mirroring, single actions and ready/action/recovery sequences. Dash/pivot grab show a catch/whiff pose rather than simulating an opponent. Directional air dodge has one diagonal pose set plus mirroring, not a complete eight-direction solution. Parry body art has no baked-in effects; dedicated success effects remain open. Expanded takeoff/double-jump/air loops, footstool pairs, jab-lock reactions, dash attack and presentation remain on the inventory.

Optional full-body mode maps dash startup to the existing 15-tick DASH, jump compression to three JUMPSQUAT ticks (drawings 2/4/6), shield entry to six visual ticks then the existing guard loop, and generic AIR_DODGE to its existing 23-tick state. These add no input lock or physics changes. Only four new clips are loaded per fighter (52 live clips total); other new clips are preview-only. Turn/skid, crouch, normal/attack landing distinctions, release parry, shield-break identity and moving/pivot grabs need authoritative state/event support. Neutral air-dodge art does not repair current down-focused direction capture or wavedash/Ultimate differences.

Generation used built-in imagegen with approved idle sheets as identity/palette references. Prompts and selected/refined sources are in prompts.json. Earlier source art, accepted walk cadence and planted jab are preserved. All new sources passed strict alpha, cell-boundary and page-size checks; the saved pre-batch manifest is the regression baseline.

Validation: all 75 new sheets passed strict transparency, frame-boundary and page-size checks; all 192 earlier clip manifests are unchanged. TypeScript, 30 focused animation/contact/snapshot unit tests and 22 browser checks passed (one updated shield-entry expectation was rerun). The final production code bundle passed with public copying disabled; full public-file packaging retains the previous unrelated Windows copy limitation. The portable review is a folder bundle: HTML pages load adjacent PNG files on demand, avoiding the single-file embedding limit. Offline folder playback passed a browser check. Pivot-grab drawings 3-6 use per-drawing source mirroring; All-Rounder standing-turn frames 3/4 are reordered for continuity. New artwork remains under visual review.


## Combat, footstool and presentation art — 2026-11-03

Added 26 families per fighter: dash attack; high/middle/low, heavy and airborne hit reactions; tumble/recovery; face-up/down jab-lock flinches; footstool attacker and ground/air victims; entry; respawn wait/drop; three taunts; three victories; defeat applause; launch, screen and star KO bodies. This adds 78 transparent sheets / 414 drawings. Current coverage is 115 clips / 637 body drawings per fighter, 345 clips / 1911 body drawings plus 16 shared FX frames. All previous clips are preserved.

action-review.html shows all three fighters and contextual sequences. footstool-pairs.html covers all nine pairings, grounded/airborne victims and both facings, with sole/crown markers on drawing three. Approach, bounce and fall are staged artwork trajectories, with no collision or simulation. Review folders use adjacent PNG files and work offline. Prompts and selected source paths are recorded in prompts.json under actionBatch (built-in image_gen).

Optional full-body mode maps generic HITSTUN to hit_mid and existing isTumbling to a six-drawing tumble loop, increasing live loading from 52 to 54 clips per fighter. Height/intensity/aerial reaction choice, tumble recovery events, dash-attack mechanics, jab locks, footstool triggers/physics and presentation hooks remain engine work. KO fallback/effects remain unchanged. All new clips except hit_mid and tumble remain preview-only. These are illustrated pilot candidates; palette, silhouette and contact review remain necessary before final sprite compression/atlas replacement. Tumble rotation spacing and cross-clip transition continuity are not final animation polish.


## Airborne families and moveset baseline — 2026-11-03

Added 18 six-drawing families per fighter: neutral/forward/backward takeoff; rise/apex/fall/fastfall loops; double-jump transition; five directional air-dodge sheets with mirroring for eight directions; helpless enter/loop/land; jab 2 and jab 3. This adds 54 sheets / 324 drawings. Current totals: 133 clips / 745 body drawings per fighter, 399 clips / 2235 body drawings plus 16 shared effect frames.

airborne-review.html includes single clips, contextual flight, double jump, recovery/helplessness, jab chains and all eight dodge directions. New families remain preview-only; 54 existing live clips per fighter and prior runtime behavior are preserved. No new mechanic or timing is implemented by generating artwork. Short/full hop share drawings, leftward dodge variants use an explicit mirrored-pose policy, backward roll reuses current mirrored art, and Swift wall jump reuses wall-tech launch plus rising-air art. Source poses/loops are pilot candidates; in-betweening, seam/pivot/facing consistency and transition/contact approval belong to the final polish pass.

See docs/assets/FIGHTER-MOVESET-BASELINE.md and moveset-decisions.html/json for the selected core kits: three-hit punch-punch-kick jabs for all; up-special helpless fall for all; one air jump; Swift-only wall jump; four existing special categories without a new projectile/weapon/transform subsystem. No rapid jab, angled variants, crawl, cling, tether, reflector/absorber, stance or extra jumps in this baseline. Current engine differs from this target (including ungated wall jumping). Items, Final Smashes and conditional content remain later expansion work. Canonical move timing and server action/event replication must be resolved before final gameplay animation signoff.
