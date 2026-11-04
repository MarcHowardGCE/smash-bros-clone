# Fighter refinement roadmap

Scope: Everybody Throws Hands only. bonney/ is a separate project and is excluded.

## Ultimate mechanics and artwork target
User decision November 2, 2026: target Ultimate mechanics for the three original fighters. Complete the animation inventory and selected variants first, then implement missing/corrected engine behavior. See docs/assets/ULTIMATE-ANIMATION-CHECKLIST.md and docs/assets/ultimate-animation-inventory.json. Prioritize kick tilts, dash attack and remaining offense; retain conditional item, stage and fighter-kit content explicitly. Existing timing/control/air-dodge/parry behavior is not verified Ultimate parity.

## Current foundations
Three fighters, one shared arena with six visual/music themes, local human/CPU play, online rooms, deterministic engine primitives, percent/stock combat, advanced movement, controllers, saved controls/audio, articulated sprites and polygon fallback.

## Refinement pass
- Enforce 30-second disconnect grace with expiry and forfeiture.
- Restore identity/rendering on reconnect and align pause/resume control events.
- Initialize character simulation before the first tick and preserve predicted render identity.
- Step input at 60 Hz independently of display refresh; interpolate on browser receipt time.
- Bound catch-up/input queues, validate numeric fields and reject stale sequences.
- Preserve seat keyboard maps and follow live controller assignments.
- Resolve simultaneous final KOs as draws; reuse vacant lobby slots.
- Align Docker/Fly dependencies and exclude unrelated project content.
- Run all five package suites, expose the full browser suite, replace placeholder lint with TypeScript checking.

## Verification and hardening still needed
- Measure prediction corrections and perceived latency under jitter and 30/60/120/144 Hz displays.
- Add reconnect tokens and broader event validation before public competitive hosting.
- Benchmark multi-room CPU use; setImmediate still polls continuously.
- Verify clean Linux container builds and externally hosted WebSocket recovery.
- Exercise identical controllers, remapping and hot reconnects on physical devices.
- Align coverage/Vitest peer versions, establish tested Node versions and reconcile lockfile ownership.

## Later content
Final fighter art and complete asset provenance are the next requested phase.
Distinct arenas, accessibility, onboarding and balance require explicit product decisions.
Accounts, rankings, matchmaking, replays and persistent match storage are not implemented.

Maintain this roadmap with behavioral changes. Detailed decisions: docs/REFINEMENT.md.

### Fighter art production update

Smash batch available for review:nine clips/54new drawings across three fighters. Next:15aerial clips, then specials, grabs/throws and movement/recovery gaps. Engine timing parity remains pending.

## Roster coverage gap filled

Added Lincoln and Swift jab (9 drawings), run (6), jump/airborne/landing (6), shield (4), spot dodge (6), roll (6), and damage/recoil/tumble/prone (4): 41 drawings each, 82 total across 14 clips. All three fighters now have the same 15 clip families and 87 drawings each (261 drawings / 45 clips). Equal current pilot coverage; full Ultimate animation coverage remains incomplete.

New jabs use planted support-foot registration and character-specific timings. Airborne jump poses use torso registration; roll and tumble use center pivots. Existing 31 clips are unchanged. Optional full-body mode uses the new clips and retains fallback artwork for unfinished actions.

Validation: 19 focused unit tests, 10 browser tests and client build passed. New sheets passed alpha and cell-boundary checks. Built-in imagegen prompts and selected sources are in prompts.json. Both portable reviews are updated.

Next: review transitions and visual consistency across the equal roster, then five aerial attacks per fighter (15 clips). Engine timing disagreements and broader Ultimate mechanics remain open.

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


## Airborne families and moveset baseline — 2026-11-03

Added 18 six-drawing families per fighter: neutral/forward/backward takeoff; rise/apex/fall/fastfall loops; double-jump transition; five directional air-dodge sheets with mirroring for eight directions; helpless enter/loop/land; jab 2 and jab 3. This adds 54 sheets / 324 drawings. Current totals: 133 clips / 745 body drawings per fighter, 399 clips / 2235 body drawings plus 16 shared effect frames.

airborne-review.html includes single clips, contextual flight, double jump, recovery/helplessness, jab chains and all eight dodge directions. New families remain preview-only; 54 existing live clips per fighter and prior runtime behavior are preserved. No new mechanic or timing is implemented by generating artwork. Short/full hop share drawings, leftward dodge variants use an explicit mirrored-pose policy, backward roll reuses current mirrored art, and Swift wall jump reuses wall-tech launch plus rising-air art. Source poses/loops are pilot candidates; in-betweening, seam/pivot/facing consistency and transition/contact approval belong to the final polish pass.

See docs/assets/FIGHTER-MOVESET-BASELINE.md and moveset-decisions.html/json for the selected core kits: three-hit punch-punch-kick jabs for all; up-special helpless fall for all; one air jump; Swift-only wall jump; four existing special categories without a new projectile/weapon/transform subsystem. No rapid jab, angled variants, crawl, cling, tether, reflector/absorber, stance or extra jumps in this baseline. Current engine differs from this target (including ungated wall jumping). Items, Final Smashes and conditional content remain later expansion work. Canonical move timing and server action/event replication must be resolved before final gameplay animation signoff.


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


### Shield integration batch 23 — 2026-11-03

Sprite art is enabled by default. All three fighters now render shield raise, confirmed shield impact, shield drop, the existing raise-window perfect shield, shield-break launch, dizzy loop and recovery. Optional snapshot fields shieldReaction/shieldReactionFrame carry authoritative outcomes through local and remote render paths. Reaction age freezes in hitlag; interruptions suppress stale art. Six additional prepared clips are connected: 80 connected / 56 prepared per fighter. Shield raise was already counted live. This connects existing mechanics; Ultimate release-based parry and dedicated grounded shield-break stun mechanics remain gaps. The existing perfect shield now prevents a low-health shield breaking on a protected hit. No source PNGs changed.


### Footstool integration batch 24 — 2026-11-03

All three fighters now support authoritative footstool attacker, grounded victim and airborne victim clips: 83 connected / 53 prepared per fighter. A fresh jump press from AIRBORNE within 10 units vertically of an opponent head, and within 65% of the victim hurtbox radius horizontally, triggers the pair before per-player movement. Conflicting attack/special/grab/shield presses take priority. Bounce velocity is -14; no damage is dealt or double jump consumed. Ground/air victim lockout is 24/30 ticks, airborne victims tumble, and both participants have a 30-tick cooldown. Invincibility, hitlag, KO, respawn, attacks, grabs and existing hitstun reject contact. Target selection is deterministic by distance then ID; one pair per participant per tick.

These are initial custom rules, not verified Ultimate parity. Automatic/no-button footstools, short/full bounce variants and separate grounded footstool FSM states remain gaps. Paired art uses replicated roles, partner IDs and simulation age. Sole/head alignment is visual only and fades over six ticks as the bounce separates the fighters; drawing playback lasts 18 ticks and cancels on interruption. Prepared source artwork is unchanged. The atlas now has 16 pages total, ten live pages (160 MiB decoded textures). Next: helpless/recovery lockout and remaining movement/presentation hooks.


### Helpless recovery integration batch 25 — 2026-11-03

All three fighters now have HELPLESS and HELPLESS_LAND states with entry, fall-loop and landing clips: 86 connected / 50 prepared clips per fighter. Up special applies one shared -16 vertical impulse at its first active frame (including grounded startup), preserves its existing attack duration, and commits to helpless on completion. Grounded startup becomes AIR_ATTACK when launched. Helpless allows horizontal drift, blocks attacks/specials/grabs/jump/air-dodge/wall-jump/fast-fall/platform-drop inputs, and permits ledge grabs. Landing imposes 14 ticks of input lockout, without L-cancel reduction. Incoming hits replace helpless with normal hitstun; leaving hitstun restores ordinary aerial control. Double-jump and air-dodge resources are not consumed by entering helpless.

These are initial shared custom recovery settings, not verified Ultimate behavior or character-specific recovery designs. Existing pre-completion up-special landing still uses canonical move landing lag. Other specials do not automatically cause helpless. The three source sheets remain unchanged. The production atlas has 17 total pages / 11 live pages, using 176 MiB decoded textures. Validation includes 15 focused server recovery tests, the full engine suite (301 passed / one skipped), and browser coverage for both facings and all fighters. Next: remaining movement hooks and presentation/event gaps.


### Movement and presentation integration batch 26 — 2026-11-03

106 clips per fighter are connected, with 30 prepared clips remaining. Added CROUCH, with stationary enter/hold/exit art and action interrupts. Down on a soft platform retains actual drop-through behavior. Authoritative artCue/artCueFrame metadata selects standing/running turns, braking, heavy landings, platform drops, front/back edge balance and neutral/forward/backward takeoffs. These visual transitions add no turn/brake/edge lockout or crouch hurtbox reduction. Their simulation age cancels on incompatible states.

Entry is a cosmetic initial-spawn cue. Respawn wait uses the replicated respawn timer; respawn drop starts when that timer expires. Match result selects one of three victory variants by winner slot modulo three and defeat for other players. Result drawing playback uses a separate presentation clock because gameplay simulation stops; local result rendering continues on the display ticker. Eliminated fighters are shown at visual podium positions without moving engine positions. Taunts, cinematic KO variants, dash/pivot grabs, classified hit reactions, wall/ceiling techs, trips and jab-lock mechanics remain open; some remaining dodge variants overlap existing canonical actions. No source PNGs changed.

The atlas has 15 total pages / 11 live pages, 176 MiB decoded texture memory. Tests include the engine suite (303 passed, one skipped), 28 focused server movement/recovery checks, client presentation timelines and snapshot metadata. Current tuning and transition durations remain custom, not verified Ultimate parity.


### Taunt, KO, combat and tech integration batch 27 — 2026-11-03

128 clips per fighter are connected; eight remain prepared. Taunts are grounded 64-tick commitments, interrupted by hits or losing footing. P1 keyboard taunts: 1/2/3 (up/side/down); P2: 4/5/6; P3: numpad 7/9/decimal; P4: 7/8/9. Gamepad: Back/View plus directional up/side/down. Controls supports rebinding and migrates older maps without replacing occupied keys. Quick keyboard taunt taps are buffered until polling. The binary input validator accepts the eleven defined action bits (0x7ff); larger masks remain rejected.

Replicated koVisual records start cosmetic launch/screen/star copies. Side/bottom KOs use launch; top KO appearance uses tick parity to select screen/star. These are initial custom visual rules. Presentation starts on receipt, fades out, and does not delay stock loss, respawn or match results. Eliminated fighters no longer re-emit KO events on later ticks.

Dash grab uses 8/3/21 startup/active/recovery; pivot grab uses 10/3/22 and reverses facing. Unheld grab plus direction now attempts a grab rather than selecting a throw. Base grab total duration now matches its canonical 27 ticks. Hit reactions classify heavy hits (damage >=12), aerial victims, and high/low knockback trajectories; this is not segmented hurtbox impact classification. Wall tech and wall-jump tech now select their art. Buffered ceiling tech checks solid undersides; missed ceiling contact bounces downward with lockout. Tumble exit has a cue. All eight canonical directional dodge clips and dodge landing art are connected. Settings and timings remain custom, not verified Ultimate parity.

Remaining gameplay clips: trip_fall, trip_prone, trip_getup, floor_attack_trip, trip_roll, jab_lock_up, jab_lock_down. These require trip triggers, recovery actions and jab-lock eligibility/timing rules. air_dodge_directional is a legacy overview variant; eight directional alternatives are already connected. It does not represent another missing dodge mechanic.

The production atlas has 17 total pages / 14 live pages, 224 MiB decoded texture memory and about 64 MB of live PNG downloads. Texture loading allows 60 seconds for production atlases (15 for source sheets); manifests retain their shorter timeout. Slow-network/mobile GPU behavior is not yet certified. Original source PNGs remain unchanged. Validation includes 306 engine tests (one skipped), 44 focused server checks, client/control tests and browser/multiplayer coverage.


### Trip recovery and jab-lock integration batch 28 — 2026-11-03

The runtime policy now enables 135 clips per fighter; air_dodge_directional is retained as a legacy overview with eight canonical replacements. No prepared clips remain marked as pending hooks in the production manifest. This is asset coverage, including inherited/overlapping variants, not a count of unique mechanics or certification of Ultimate parity. Original revision-18 source PNGs and historical source flags remain unchanged.

Down tilt declares tripBelowPercent=30: it trips eligible grounded targets whose pre-hit damage is below 30%. Shielded/invincible/airborne targets and existing floor-recovery states do not trip. Trips preserve hit damage, cancel knockback, lock falling for 24 simulation ticks, then enter prone. Prone accepts fresh attack for FLOOR_ATTACK_TRIP, left/right for a roll, or jump/shield for stand-up; after 60 prone ticks stand-up begins automatically. Stand-up and roll last 24 ticks with the existing 8/18-tick invincibility; rolls travel 36 world units. Trip floor attack uses 6/4/14 startup/active/recovery, 7 damage and two-sided contacts. Ordinary incoming hits interrupt trip recovery. These are explicit custom roster rules; trip chance, thresholds and frame data are not verified Ultimate values.

Jab 1 or jab 2 with damage at most 5 can reset a grounded missed-tech prone target (HARD_LANDING/JAB_LOCK), up to twice per knockdown. Damage and hitlag remain; knockback is cancelled. Each lock has 16 simulation ticks, then returns to HARD_LANDING frame 18 so normal recovery choices are available. A third eligible hit, a finisher, heavier hit or hit on a non-prone victim resolves normally. New tumble landings reset the counter. Both face-up/down reaction sheets are connected.

Validation: 319 engine tests passed, one skipped; full server run passed 215 tests with two outdated shield expectations, then both corrected shield fixtures passed in focused suites (217 server cases pass in aggregate, 16 skipped). The production-entrypoint check passed. All 46 browser checks passed in one run, including controlled local trip/jab-lock gameplay and four clients. The existing perfect-shield protection fix was retained; its two old tests now reflect protected-hit behavior and ordinary shield breaks outside the protection window.

The production pack remains 17 pages total, 14 live pages / 224 MiB decoded textures, roughly 67 MB live PNG downloads. Next: gameplay and controller playtesting, balance/Ultimate-parity review, reachability/transition polish and performance checks. Completing these asset hooks does not complete those broader validations.


### Gameplay and Ultimate-parity audit pass 1 — 2026-11-04 (batch 29)

Fixed grounded direction+jump priority and short-hop release height; simultaneous jump+attack now queues a short-hop neutral aerial. Connected eight-way air-dodge travel and shield roll/spot-dodge/jump input paths. Dodge intangibility uses explicit custom windows. Protected attackers can now hit while defender immunity remains enforced. Corrected asymmetric trade recipient ownership and prevented priority-cancelled hits from returning through fallback collision. Roll artwork keeps its committed direction through recovery.

Abe jab offset/radius changed 58/20 to 50/28; Swift 50/18 to 44/24. Forward tips remain 78 and 68 world units. Point-blank coverage now hits all three victim sizes in both facings; circle growth also increases vertical coverage. Damage, knockback, weight, speed and attack timing are unchanged. Added pure collision regression and 26 authoritative foundation tests.

Three seeded CPU batches used the same six pairings, eight seeds and side swaps (96 matches each, 288 total). Finished-within-60-second counts: baseline 72, foundation fixes 81, jab tuning 83. Timeouts are not wins. This is deterministic bot evidence, not human balance certification; only the final state can be reproduced against the current source without restoring historical source. Human/controller and realistic remote-latency testing remain open.

Validation: 321 engine tests passed / 1 skipped; full server 243 passed / 16 skipped including production entrypoint; full client 559 passed. Workspace type checks and staged production build passed; plain production URL loaded 14 atlas pages with no failed requests/page errors. Browser review/local suite: 46 passed; the separate four-client regression passed, for 47 browser checks across two runs. Refreshed obsolete bootstrap mocks and explicit legacy-polygon enum coverage expectations; polygon fallbacks remain intentional.

Parity remains incomplete. Next priority: release-triggered parry, independent aim/jump input with sustained analog walking and buffering, directional short-hop attack selection and verified damage scaling. Then audit legacy L-cancel/meteor-cancel/crouch-cancel/wavedash rules, one-on-one damage, clanks/formulas, ledge/tech/grab details, stages and device performance. Nintendo 3.0.0 notes explicitly refer to perfect shielding after shield release: https://en-americas-support.nintendo.com/app/answers/detail/a_id/45075/~/super-smash-bros.-ultimate-update-ver.-3.0.0---fighter-adjustments . The official techniques page confirms directional air dodges, jump+attack short-hop attacks and different one-on-one damage, but supplies no numeric calibration: https://www.smashbros.com/en_US/howtoplay/technique.html .

Full prioritized evidence, acceptance checks, comparison JSON and unperformed human playtest matrix: outputs/ultimate-parity-v1/index.html and audit.json in the Codex task outputs. All 135 enabled clips per fighter remain enabled; the legacy overview is retained. Asset counts do not prove unique mechanics or complete runtime reachability. Source artwork is unchanged. No environment files or bonney were inspected.


### Parry, independent aim and damage rules — batch 30, 2026-11-04

Parry now starts on shield release after at least three held simulation frames, with a five-tick release window (0–4). Raising/holding shield no longer grants a parry. A success consumes the window, prevents percent/shield damage and shield stun, and starts the replicated parry cue. Reholding cancels release. Attacker receives 11 extra hitlag ticks as explicit custom tuning; full Ultimate hitstop/projectile/shield-drop timing is not certified.

UP now has its own 0x0800 bit; server accepts masks up to 0x0fff. Up aims attacks, specials, throws, dodges and DI/SDI independently of JUMP. Keyboard: P1 Up/W aims, X/Space jumps; P2 I aims/M jumps; P3 Numpad8 aims/NumpadEnter jumps; P4 T aims/N jumps. Gamepad stick/DPad Up aims, A jumps. Known default saved bindings migrate without replacing unrelated custom actions. No tap-jump toggle, analog walk/run or complete action buffer is claimed.

Jump+attack queues the directional neutral/forward/back/up/down aerial through jump squat. Short-hop ordinary aerial damage is 0.85x; specials are excluded. Double jump, landing and incoming hits clear the context. Damage retains fractions; two-participant matches apply 1.2x percent damage based on initial match size, without multiplying shield damage or base knockback. Pummels, throws, counters and floor hits use the same match damage rule; confirmed parry events report zero damage. Stale/rage/knockback, counter rounding and mixed legacy mechanics remain open for a versioned audit.

Sources: Prima Perfect Shield and Short Hop Attack author guides; Nintendo 3.0.0 fighter adjustments; Rubendal SSBU-Calculator author source global.js/formulas.js. See outputs/ultimate-parity-v2/index.html and audit.json in this task's outputs for direct links, numeric examples, test evidence and limits. No source artwork changed; 135 clips/fighter remain enabled. Human/physical-controller, remote-latency and performance sessions remain outstanding.

Validation for batch 30: full pnpm test gate passed 1,242 tests (71 shared / 31 gamepad-input / 322 engine / 256 server / 562 client; 17 skipped). An additional context-clear regression passed in the latest 13-case parry/input/damage suite. All 48 browser checks passed across the 47-case review/local run and separate four-client test, including independent Up replication. Type checks, staged production build and 14-page sprite smoke passed. New 96-match CPU batch: 73 finished / 23 timeouts; no nonfinite state. No human balance or complete Ultimate parity claim.


### Sprite contact-range correction — batch 31, 2026-11-04

Corrected the legacy hitbox/sprite scale mismatch. Registered free-contact attack geometry converts to half-size sprite units; grab geometry uses 0.75 scale. Grounded contacts originate 20 world units higher at the torso. Body damage uses narrow vertical capsules (All-Rounder radius12/height82, Abe15/98, Swift11/78), with crouch height reduction. Physics/ground/ledge sizes are unchanged; shield circles and confirmed pummel/throw contacts retain their own behavior. An inward torso contact preserves point-blank hits without extending the outer tip. This is not pixel-precise, per-pose collision.

Jab-to-All-Rounder maximum center distances changed from approximately 95/106/96 to 45/51/46 for All-Rounder/Abe/Swift; attack tips now reach 33.5/39/34 world units, close to measured drawn fists (35.1/38.0/32.4). All fighter pairings and both facings have close-hit/distant-whiff tests. Collision fixtures were moved into genuine close contact, including floor attacks, jab locks and parry. Attack damage, frame data, weights and movement tuning are unchanged. Current evidence: outputs/contact-range-v1/index.html and reach-measurements.json in this task outputs.

Batch 31 validation: complete single-worker workspace run passed 1,261 tests (17 skipped); type checks passed. All 48 review/local browser tests and the separate four-client test passed (49 total), including actual distant-jab whiff and close-jab contact. Staged production and 14-page sprite smoke passed.


### Combat formula audit — batch 32, 2026-11-04

Weighted stale moves replace the flat repeat penalty; queue order remains oldest-first, with newest-to-oldest weights .09/.08545/.07635/.0679/.05945/.05035/.04255/.03345/.025, freshness1.05 and all-nine-repeat factor .4695. Shield contacts contribute 85% of each weight through an aligned optional staleMoveShieldQueue array; throws now enter stale history. Normal launch calculation uses post-hit percent and a separate 30% stale adjustment to base launch damage. The current-hit one-on-one percent modifier remains excluded from launch. Rage was verified at 1 through35% and1.1 at150%. Hitstun is floor(KB*.4)-1, minimum4. DI uses .17 radians with normalized digital directions and a horizontal deadzone.

Fifty-four numeric comparison fixtures were generated from the calculator author source at https://raw.githubusercontent.com/rubendal/SSBU-Calculator/master/js/formulas.js with a recorded SHA256. These verify agreement with the research implementation, not official version-specific or full Ultimate parity. Accepted sprite contact geometry is retained. Hitlag remains move-authored; held-input SDI, continuing ASDI drift, analog/LSI, world-space launch speed/decay/gravity, counters and specialized interactions remain project rules requiring follow-up. See outputs/combat-formulas-v1/index.html and reference-cases.json in task outputs.

Batch 32 validation: 1,320 workspace tests passed (71 shared / 31 gamepad / 398 engine / 258 server / 562 client; 17 skipped), including 54 independent formula comparisons. Type checks passed. All 49 browser checks passed across 48 review/local cases and separate four-client regression. Final up-throw history assertions passed. Production build and fourteen-page sprite smoke passed. Seeded stability: 96 matches, 71 finishes / 25 timeouts, no nonfinite state. Next: replace authored hitlag and custom SDI/ASDI after validating metadata and world-space conversion; human re-testing remains required.


### Batch 33 — body hitlag and digital SDI/ASDI (2026-11-04)

Computed body hitlag replaces nonzero authored durations; separate attacker/target freeze preserves contact poses and resumes recovery. Victim SDI uses direction changes and buffered pulses; holding does not repeat. Continuous hitstun ASDI drift is removed. Ordinary ASDI is zero, with explicit one-time exit opt-in only. Accepted attack geometry and artwork remain unchanged.

96 independent numeric hitlag cases and focused 9 engine / 8 server checks passed. Full workspace tests, subsequent full server regression, 49 review/local browser checks and one four-client check passed. Final typecheck, staged production build and fourteen-page sprite smoke passed. See the task output hitstop-v1/index.html audit.

Full Ultimate parity remains incomplete: SDI 3-world-unit displacement / 4-tick cooldown and opt-in ASDI 2-world-unit exit shift are project tuning. Analog/C-stick rearm, grounded exceptions, ASDI effect catalog, shield hitlag/SDI, custom parry +11 freeze, projectile attachment, launch units and controller/remote validation remain open.


### Batch 34 — controller calibration and defensive hitstop (2026-11-04)

Controls now exposes live stick readings, 60-sample neutral capture, drift filtering, direction threshold, saved per-device-name profiles and reset. GamepadPoller uses the profile; navigation cancels sampling. Same-name controllers share settings. Controls now scrolls and has readable contrast. Network input remains digital; physical-controller calibration is not certified by simulated browser tests.

Normal shield hitlag now has separate defender/attacker rules, a minimum multiplier of 1 and .67 guard factor; unattached projectiles do not freeze their owner and attached projectile handling is explicit. Shield SDI is horizontal, tap-based, without the body cooldown or pulse cap, and without shield ASDI. Body pulses no longer trigger when a diagonal component is merely removed. ASDI effect metadata supports impact/exit policy for electric/paralyze/crumple/autoshift and impact-only zero-hitlag projectiles; the 70-to-below-110-degree upward launch band suppresses it. Existing roster moves were not relabeled, and this does not implement the underlying paralysis/crumple statuses.

Validation: 1,552 workspace tests passed (31 shared / 75 gamepad / 615 engine / 268 server / 563 client; 17 skipped), including 96 independent shield timing cases. All 52 browser checks and type checks passed. Shield browser fixture extends confirmed contact for deterministic sampling; actual jab shield freeze is five ticks in server checks. Research and audit: task output defensive-hitstop-v1/index.html and reference-cases.json.

Remaining custom rules: body/shield SDI and ASDI world distances (3 / 1.98 / 2 per boundary); analog magnitude/C-stick protocol and rearm; grounded early-frame and consecutive-hit escape exceptions; full later-version effect catalog/vertical-band verification; shieldstun, shield damage/pushback, custom parry +11 and shield-break interactions; launch units/LSI; real controllers and remote sessions. Full Ultimate parity remains incomplete.

Batch 34 production build and fourteen-page sprite smoke passed with no failed requests or page errors. Final platform-edge impact ASDI fix uses shifted horizontal position for floor clipping; ten focused server hitstop tests and server typecheck passed after the full regression run.


### Batch 36 — Xbox 360 Ultimate positional controller profile (2026-11-04)

Replaced the custom controller layout together: Xbox B attack, A special, X/Y jump, LT/RT shield, LB/RB grab, direct D-pad taunts, left-stick movement/stick jump, right-stick smash/aerial attacks and Start pause. Menus use B confirm/A cancel. One versioned profile (ultimate-xbox360-v1) drives actions, menus and labels. Existing slot assignments and calibration remain compatible; no customizable gamepad button bindings existed to migrate. Keyboard bindings remain separate.

Preserved individual jump-button edges and the X+Y short-hop shortcut through optional validated input fields. Controller A+B selects smash; shield+attack selects grab. Authoritative normal-sensitivity flick windows use 6 horizontal / 4 vertical simulation ticks. Physical jump+attack preserves short-hop aerial selection. Source packet merging retains rapid shortcut presses. Controls navigation/cleanup and four-slot labels are covered.

Profile contracts, seven authoritative combo cases, four production browser checks, four-client regression, type checks, production build and fourteen-page sprite smoke passed. Current regression evidence is recorded in the task output xbox360-controls-v1/validation.json. Real wired/wireless controller feel, exact analog calibration and full Ultimate gameplay parity remain incomplete; dedicated GameCube and sideways Joy-Con layouts are separate work.

Supporting work retained from the preceding input/defense pass: optional analog transport and magnitude-aware DI/SDI; category-specific shieldstun; separately calculated parry freeze with post-freeze guardstun retained. Three hundred numeric parry/shieldstun cases agree with the calculator author implementation. This is research-source agreement, not official complete version-specific parity.

Batch 36 final evidence: complete shared/gamepad/engine/server package runs passed (33/75/917/279 tests, 17 skips). Client full run passed 561/565; the four stale controller expectations/mock exports were corrected, then all 57 tests in the three affected files passed. All current known failures are resolved; this is combined evidence, not a single final full-workspace run. Four production controller/calibration browser cases and separate four-client regression passed.
