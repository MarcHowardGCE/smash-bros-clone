# Roster art pack 1

Added 74 drawings: side kick, overhead kick and low sweep for all three fighters (six drawings each), plus Lincoln and Swift idle (four) and walk (six). Total: All-Rounder 69 drawings / 12 clips; Lincoln 28 / 5; Swift 28 / 5.

Open index.html or the live review, choose Fighter, then Animation. Pause and scrub contact drawing 4. Walk remains 24 simulation ticks per cycle.

These are review candidates. Full-body rendering remains opt-in with ?renderer=fullbody. Missing actions retain existing articulated artwork. Remaining batches include smashes, aerials, specials, grabs/throws, ledges, getups and additional movement/defense/reaction coverage for Lincoln and Swift; the Ultimate checklist tracks further engine-dependent actions. Existing move-data/FSM timing disagreements remain unresolved. No engine combat mechanics changed.

The built-in imagegen tool generated the artwork from the approved master designs. prompts.json records prompts and selected source files; manifest.json records frame crops, pivots, timing, support-foot sockets and scale. PNGs include alpha transparency.

## Smash animation batch

Added54drawings: forward,up and down smash for each fighter,six drawings per clip. Current totals: All-Rounder87drawings/15clips; Lincoln46/8; Swift46/8 (179drawings/31clips combined).

Separate anticipation,charge hold,contact and recovery. Review offers uncharged,half and full charge. Down smash has distinct front/rear contacts and current-engine collision circles. Renderer reads server chargeFrames; no server combat rules changed. Existing Ultimate timing discrepancies remain unresolved. Missing actions retain existing artwork. Next:five aerial attacks per fighter.

Validation:19focused unit tests,9browser tests and client production build passed. New sheets passed transparency/cell-boundary checks. Built-in imagegen prompts and source selections are in prompts.json. These remain review candidates; full roster replacement is incomplete.

## Roster coverage gap filled

Added Lincoln and Swift jab (9 drawings), run (6), jump/airborne/landing (6), shield (4), spot dodge (6), roll (6), and damage/recoil/tumble/prone (4): 41 drawings each, 82 total across 14 clips. All three fighters now have the same 15 clip families and 87 drawings each (261 drawings / 45 clips). Equal current pilot coverage; full Ultimate animation coverage remains incomplete.

New jabs use planted support-foot registration and character-specific timings. Airborne jump poses use torso registration; roll and tumble use center pivots. Existing 31 clips are unchanged. Optional full-body mode uses the new clips and retains fallback artwork for unfinished actions.

Validation: 19 focused unit tests, 10 browser tests and client build passed. New sheets passed alpha and cell-boundary checks. Built-in imagegen prompts and selected sources are in prompts.json. Both portable reviews are updated.

Next: review transitions and visual consistency across the equal roster, then five aerial attacks per fighter (15 clips). Engine timing disagreements and broader Ultimate mechanics remain open.

## Synchronized roster consistency review

Added roster-consistency.html alongside both individual reviews. All three fighters share the same world scale, ground line and playback tick. Controls include all 15 clips, idle-reference overlays, slow playback, single-tick stepping, light/dark backgrounds and a 364-tick staged transition sequence generated with the actual selectPilotFrame implementation.

Checked standing scale (All-Rounder 80, Lincoln 96, Swift 76), 24-tick walk cycles, 18-tick run cycles, complete 15-clip coverage and state changes through movement, jump/landing, jab, shield/dodge/roll and damage/tumble/prone. Browser checks exercise every clip and transition checkpoints; 11 browser tests pass. Gameplay physics and combat are not simulated in this review. Existing engine timing disagreements remain open. This pass did not change source artwork or gameplay. Minor palette and pose differences remain; automated checks do not certify final visual quality.

The review builder now regenerates the synchronized comparison whenever build-fighter-art-review.mjs runs. Next production batch remains five aerial attacks per fighter (15 clips), followed by specials and grab/throw coverage.

## Aerial animation batch

Added neutral, forward, back, up and down aerials for all three fighters: 15 clips / 90 drawings. Every fighter now has 20 clip families and 117 drawings (351 drawings / 60 clips). The previous 45 clips are unchanged. Source images and built-in imagegen prompts are included in this pack.

Aerials are selected only in AIR_ATTACK and follow character move-data startup, contact and recovery windows. Their fixed source-cell torso pivots use offsetY=0, freeing the legs from ground registration. Air-ready height is normalized to90percent of standing height; precise pose alignment remains a visual-review item. Landing lag switches immediately to the existing landing pose; damage and physics are unchanged. Current hitbox circles and landing-lag metadata are exposed for review, not verified Ultimate frame-data parity.

The synchronized review loads current clips on demand, avoiding decoding all60sheets at once. Its staged transition sequence includes all five aerials and landing. Both portable reviews are updated.

Validation:20focused tests,12browser tests,TypeScript and the client code bundle passed. All15new sheets passed alpha/cell checks. Full packaging failed with Windows EPERM while copying unrelated menu-audio/branding files; code bundling passed with public copying disabled. These are review candidates, not final full-roster replacement. Next:each fighter neutral, side, up and down special, including ground/air variants and effects as needed.

## Specials and counter batch

Added four six-drawing specials and one four-drawing successful-counter reaction per fighter:15bodyclips/84drawings. All three fighters now have25clips/145drawings each (435bodydrawings). Four shared effect sheets add16frames:neutral burst, side trail, recovery trail and counter flash.19new sheets,100new body/effect frames combined; prior60bodyclips unchanged.

Neutral special shows a one-tick release cue at startup completion, including the zero-active-frame declaration. Current server hitbox execution indexes its one-entry hitbox array; no travelling-projectile implementation was found in that path despite projectile wording in move-data comments. This remains an engine/design gap, not a new projectile mechanic. Counter readiness/failed recovery is separate from counter success; confirmed DOWN_SPECIAL hit events trigger only the attacking fighter retaliation clip, which progresses on state frames and cancels on state interruption.

Ground/air special versions reuse source poses with alternate torso anchors; up special is airborne. The individual review has Airborne special pose and Preview special effects controls. Effects are staged visual candidates in the review and saved as a separate manifest.effects library; live engine effect triggers are not integrated yet. Existing impact sparks remain in gameplay. Upward recovery artwork and effect pages use explicit row crop boundaries to preserve crossing extrema; the recovery effect orientation is corrected by rotation metadata.

Validation:21focused unit tests,13browser tests,TypeScript and code bundling passed. New sheets passed alpha/cell checks. Full public-file packaging remains blocked by earlier unrelated Windows file-copy errors; code bundling skips public copying. Built-in imagegen prompts/source records are in prompts.json. Broader Ultimate timing parity and precise palette/pose alignment remain review work.

Next:grab, hold, pummel, four throws and matching victim/release reactions across all three fighters.

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


Validation for the 2026-11-03 combat/presentation batch: all 78 new sheets passed alpha/cell/page-size checks; all 267 prior clips compare unchanged. TypeScript, 33 focused unit tests and 25 browser tests passed, including both facings, 36 footstool pair/mode/facing cases, runtime interruption/fallback and offline folder playback. Dash-attack, Lincoln/Swift footstool-contact and three-fighter victory screenshots were inspected. Code-only Vite bundle passed with environment loading redirected to the empty directory and public copying disabled. Full production public-file packaging was not revalidated. Final review/report: outputs/fighter-art-roster-v1/BATCH-14.md (also copied to fighter-art-v1).


## Airborne families and moveset baseline — 2026-11-03

Added 18 six-drawing families per fighter: neutral/forward/backward takeoff; rise/apex/fall/fastfall loops; double-jump transition; five directional air-dodge sheets with mirroring for eight directions; helpless enter/loop/land; jab 2 and jab 3. This adds 54 sheets / 324 drawings. Current totals: 133 clips / 745 body drawings per fighter, 399 clips / 2235 body drawings plus 16 shared effect frames.

airborne-review.html includes single clips, contextual flight, double jump, recovery/helplessness, jab chains and all eight dodge directions. New families remain preview-only; 54 existing live clips per fighter and prior runtime behavior are preserved. No new mechanic or timing is implemented by generating artwork. Short/full hop share drawings, leftward dodge variants use an explicit mirrored-pose policy, backward roll reuses current mirrored art, and Swift wall jump reuses wall-tech launch plus rising-air art. Source poses/loops are pilot candidates; in-betweening, seam/pivot/facing consistency and transition/contact approval belong to the final polish pass.

See docs/assets/FIGHTER-MOVESET-BASELINE.md and moveset-decisions.html/json for the selected core kits: three-hit punch-punch-kick jabs for all; up-special helpless fall for all; one air jump; Swift-only wall jump; four existing special categories without a new projectile/weapon/transform subsystem. No rapid jab, angled variants, crawl, cling, tether, reflector/absorber, stance or extra jumps in this baseline. Current engine differs from this target (including ungated wall jumping). Items, Final Smashes and conditional content remain later expansion work. Canonical move timing and server action/event replication must be resolved before final gameplay animation signoff.


Validation for the airborne/moveset batch: all 54 new sheets passed alpha/cell/page-size checks. verify-airborne-pack.mjs checks 54 family clips, eight unique dodge directions, finite pivots and planted jab support feet; all 345 prior clips and shared effects compare unchanged. TypeScript, 33 focused unit tests, 28 browser tests and the client code-only bundle passed. Airborne loops, jab-chain finisher and directional-dodge screenshots were inspected. Full production public-file packaging was not revalidated. Airborne and selected moveset families remain preview-only; final polish and authoritative engine handoff are still required. Run node scripts/assets/verify-airborne-pack.mjs to verify the current pack contract.


## Polish audit and scale correction — 2026-11-03

Revision 16 adds polish-audit.html: 399 clip measurements, 18 visually inspected first/key/last comparison boards and a prioritized correction list. Three tumble-recovery scales now normalize from their upright final pose (100% standing height), correcting previous endpoints of 135.2%, 111.5% and 118.4%. All source drawings, the other 396 clips and runtime behavior are unchanged; these clips remain preview-only. New jab 2/3 support-foot drift measures zero. Priorities remain directional-dodge facing, canonical combat timing, tumble/gait loop spacing, cross-clip/contact approval, effects, multiplayer identification and production packaging. See docs/assets/FIGHTER-POLISH-AUDIT.md. The strict pack check, all 28 browser tests and the new report offline/filter/image checks passed. This audit is not final approval of every drawing.


## Facing, loop spacing and transition polish — revision 17

Added nine backward-dodge sheets and three run-v2 sheets (72 generated drawings; nine new clips / 54 net registered frames). The pack now has 136 clips / 763 registered body frames per fighter, 408 clips / 2289 frames plus 16 shared FX frames. Original source PNGs remain intact. New backward-dodge selection preserves apparent facing across all sixteen world-direction/facing combinations. Run keeps its 18-tick period with clearer alternating footfalls. Every walk and jab clip is unchanged, including the accepted All-Rounder 24-tick walk and planted jab; Lincoln high kick is untouched.

Tumble now reuses the existing coiled source pose with uniform centered rotation over 18 simulation ticks. Six metadata views store orientation samples; runtime and playback advance rotation on simulation ticks. It does not add six new hand-drawn angles. Duplicate upright beats and angle-spacing jumps are removed, repeated snapshots do not advance spin, and interruption resets rotation. Run/tumble changes apply in optional full-body mode; live loading remains 54 clips per fighter. The nine new backward-dodge clips remain preview-only.

Airborne contextual review uses torso-anchored continuous flight, double-jump, recovery and dodge paths. All tested phase-boundary torso movements are below ten canvas pixels per tick; these are staged review trajectories, not new movement physics or guaranteed final pose in-betweening. Grounded actions retain foot registration. loop-polish-review.html compares revision 16 and current run/tumble/walk playback, and airborne-review.html demonstrates facing/transitions. The art baseline version 2 supersedes the earlier five-direction/mirroring policy.

Validation: twelve selected sheets pass alpha/cell/page-size checks; pack contract and TypeScript pass; 33 focused unit tests and 30 browser tests pass; client code-only bundle passes with environment loading redirected to the empty directory and public copying disabled. Before/after and backward-dodge captures were visually inspected. A pre-change manifest comparison verifies only run/tumble changed among prior clips (393 unchanged), plus nine new clips. Final palette/in-between/contact approval, canonical timing, engine state/event integration, VFX, four-player identification and production atlas/public-file packaging remain open.


## Contact and gameplay-scale pass — revision 18

Corrected 20 hand anchors across Lincoln grab_hold/pummel/ledge_catch and Swift forward_throw approach/ledge_hang, based on inspected hand regions. The selected 126-anchor audit now has no active-contact proximity flags above three world pixels; corrected points are within 0.108 world pixel of opaque hand artwork. This diagnostic does not replace anatomical/contact visual approval. Only five clips of metadata changed; 403 clips, source PNGs/colors, durations, scales and gameplay rules are unchanged. Ledge roots follow their corrected grips. contactVersion is 2.

contact-signoff.html provides the before/after measurements and all-nine-pair gameplay-size board. Grab/throw, footstool and ledge reviews now have 1x gameplay and 0.4x distant-sprite scale controls plus enlarged detail. The native pair board and corrected ledge capture were visually inspected. 32 browser tests, the pack contract and TypeScript passed; new tests cover 288 grab/action/pair/facing/scale scenes, 72 footstool cases and 32 three-fighter ledge scenes. See docs/assets/FIGHTER-CONTACT-SIGNOFF.md. Palette/face approval, effects, duplicate-fighter identification, production atlases/public-file packaging and missing engine mechanics remain open.


### Palette audit — 2026-11-03 (batch 19)

Added a portable palette/face/costume comparison at fighter-art-pilot-v1/palette-review.html. Screened 2,289 registered frames, visually scanned all 408 first poses on 12 boards, and inspected ten flagged drawings enlarged. No confirmed palette defect warranted source-art edits; Lincoln’s accepted high kick is retained. Pack revision 18 and gameplay behavior are unchanged. This is sampled visual evidence, not every-frame approval. See docs/assets/FIGHTER-PALETTE-AUDIT.md. Remaining work: remaining-frame visual checks, effects/player identification, final packaging and engine integration.


## Shared effects, player identification and handoff — batch 20 (2026-11-03)

Optional full-body rendering now loads the four existing shared effect sheets and displays effects at special-move active startup, or the confirmed counter-success cue. Effects use simulation frames, stop after eight ticks and cancel on interruption/KO; missing effect sheets time out and leave body rendering available. Initial placements sit near the special-action hands/trails and still need real-match visual approval. No combat/hitbox rules changed.

Full-body players have upright colored badges with one through four pips, preserving costume colors and allowing duplicate-fighter identification without color alone. Badges hide on KO. Added every-frame-review.html: 96 pages cover all 2,289 registered frames. All pages loaded successfully; nine additional pages (selected kicks/smashes, turns/braking/crouch and backward dodges for all fighters) were visually inspected. Fitted boards do not establish gameplay scale or every-frame approval. Source artwork and manifest revision 18 remain unchanged.

Validation: TypeScript passed; 47 existing focused renderer tests plus two new effect/marker tests passed; all 32 browser tests passed. Live browser loaded all four effect sheets and rendered four facing-correct duplicate-player badges. Code-only client production build passed with public copying disabled and environment loading redirected to the empty directory. The portable asset folder has a SHA-256 inventory of 413 manifest/source-image files. This is not full production packaging, an optimized atlas or default-renderer cutover.

Remaining: every-frame visual signoff, real-match effect placement and four-player distant-camera checks, texture-memory/atlas optimization, full public-file build, then missing authoritative mechanics/state-event hooks. There are still 54 live clips and 82 prepared clips per fighter; do not enable prepared art as implemented mechanics. See outputs engine-art-handoff.json and docs/assets/FIGHTER-ENGINE-HANDOFF.md.



## Production atlas and replicated movement hooks — batch 21 (2026-11-03)

Completed the drawing screen for all 2,289 registered body frames on 24 inspected montages: no new blocking palette, costume, silhouette or clipping issue found. This signs off the static drawing screen for integration, not the authoritative motion timing of unimplemented actions. Source PNGs and source manifest revision 18 are preserved.

Added production atlases (two pixels per world unit, premultiplied-alpha bilinear sampling, two-pixel extrusion): 15 pages total, eight loaded live. Live decoded texture storage drops from 1,214,237,188 bytes across 193 equivalent source sheets to 134,217,728 bytes (128 MiB), an 88.9% reduction; live PNG downloads total 30,726,124 bytes. The verifier checks all 2,305 body/effect frame entries, bounds and world-space roots/sockets; maximum registration error is zero. Memory figures exclude GPU overhead, mipmaps and legacy renderer resources.

Connected nine additional clips per fighter: rise/apex/fall/fast-fall loops, double-jump transition, soft landing and three downward dodge variants. Fast-fall/dodge-direction metadata now survives local, remote and predicted-local render paths. Double jump uses the replicated resource change to play twelve simulation ticks even if a snapshot misses the one-tick trigger; repeated snapshots freeze and interruption cancels. Current supported dodge vectors are inherited from the engine; no new combat or movement physics was introduced. Runtime loading is now 63 clips per fighter; the original source manifest retains its historical 54-live/82-prepared flags. Runtime policy and production manifest supersede those flags for the nine promoted clips.

Four actual browser clients passed atlas rendering, duplicate-player identification, movement propagation, synchronized pause and refresh/rejoin. All 35 browser tests passed, along with TypeScript and ten focused hook/contact/effect/marker/metadata unit tests. A complete Vite production build with staged public assets passed. The packaged game loaded all eight live atlas pages with no failed requests or page errors. Original review sheets are excluded from the production distribution; legacy part rendering remains available. Development/review distributions retain source-sheet fallback (?atlas=source); the staged production distribution falls back to legacy parts when atlas art is unavailable.

Remaining engine integration: 73 prepared clips per fighter still need mappings, event metadata or mechanics. This includes overlapping legacy/alternative variants, not 73 independent mechanics. Prioritize jab 2/3 and dash attack, floor/getup actions and shield reactions, then paired footstools, recovery lockout, movement transition cues and presentation. Full-body mode remains optional (?renderer=fullbody). Low-end device/memory testing, WAN/packet-loss stress and exhaustive animation-in-context testing are outside this local validation. See docs/assets/FIGHTER-PRODUCTION-ATLAS.md and integration-signoff.html/json.


### Engine integration batch 22 — 2026-11-03

74 clips per fighter now have runtime hooks; 62 prepared clips remain. The original revision-18 artwork is preserved. Jab 2/3 chain from fresh buffered attack presses, and dash attack uses authoritative timing. Ground recovery records face-up/down orientation, locks inputs for 18 ticks, and supports standing, rolls and two-sided floor attacks. Automatic stand-up begins after 30 ticks and lasts 24 ticks. Rolls move 36 world units over 12 ticks; stand/roll invincibility lasts 8/18 ticks. Floor attacks use 6 startup, 4 active and 14 recovery ticks, with startup invincibility. These are initial custom settings requiring playtesting, not verified Ultimate timings.

Validation: 37 browser checks passed, including four actual clients, movement, pause and refresh/rejoin; 275 engine tests passed (one skipped), 9 combat server tests, 10 ground-recovery server tests, and 37 ledge tests (13 skipped) passed. Three focused client tests and TypeScript checks passed. Source drawing review remains unchanged. Remaining priorities: shield reactions, footstools, helpless/recovery lockout, and remaining movement/presentation hooks. Prepared clips include overlapping variants, not 62 separate mechanics.
