# Everybody Throws Hands

Browser platform fighter with online rooms and local human/CPU play. This project covers apps/, packages/, fighter assets and supporting scripts. bonney/ is a separate project and is excluded.

Target mechanics: Super Smash Bros. Ultimate. Current engine parity is incomplete. Sprite production and the later engine handoff are tracked in [the Ultimate checklist](docs/assets/ULTIMATE-ANIMATION-CHECKLIST.md).

## Start
Verified locally with Node.js 24.13.0 and pnpm 11.20.0. Containers use Node 24 and pnpm 11.20.0; Render pins the same package-manager version.

    pnpm install --frozen-lockfile
    pnpm build
    pnpm dev

Client: http://localhost:5173. Server: port 3001. pnpm commands work on Windows; just play/dev require a Unix-compatible shell.

## Play
Online: create a room, share its code/link, Ready, choose and confirm fighters, then play after the countdown.
Local: choose participant seats and CPU difficulty, select fighters and a stage theme.

Three stocks, percent damage and blast-zone KOs. Last survivor wins; simultaneous final KOs produce a draw.
All-Rounder, Abe Lincoln and Swift have different stats and move overrides.
CPUs select targets among all other active opponents.
The six stage choices currently change backgrounds/music and share one collision layout.

P1 defaults: A/D or arrows move, W/X/up jump, down fast-falls, Z attacks, S specials, Shift shields, C grabs.
Standard-mapping gamepads support local and online play. P1 saved keys apply only to seat 0; other seats retain their own layouts.

## Disconnects
Mid-match network drops retain the slot for 30 seconds while simulation continues.
Rejoin restores identity, current state and pause state. Expiry forfeits the player; explicit Leave forfeits immediately.
Two-player forfeits award the remaining player the match; larger matches continue.
Empty rooms and closed servers release sessions/timers.
Rejoin identity needs a secret session token before public competitive hosting.

## Architecture
- packages/shared: state/input types, character stats and shared constants.
- packages/engine: runtime-independent physics, 25-state fighter FSM, moves, combat and seeded AI.
- packages/gamepad-input: standard controller sampling and assignment persistence.
- apps/server: Express/Socket.IO application, rooms, scheduling and full GameEngine orchestrator.
- apps/client: Vite/PixiJS, HTML menus, audio, input, movement prediction and offline match runner.
- LocalMatch imports browser-safe @smash/server/engine to reuse full simulation.

Server simulation: 60 Hz. Binary MessagePack snapshots target 20 Hz, with a custom Set codec.
Client input/prediction steps at 60 Hz independently of display refresh.
Remote interpolation uses browser receipt times and server snapshot intervals.
Combat remains authoritative; prediction approximates the full server FSM.

## Verification
    pnpm test
    pnpm build
    pnpm typecheck
    pnpm test:e2e

test runs all five fighter suites. E2E runs all browser specs; test:e2e:visual selects asset replacement and visual baselines.
lint aliases real TypeScript checking; no style linter is configured.
Browser/asset tests write evidence; replacement-art tests temporarily swap generated assets and restore them.
For verification without reading environment files, set SMASH_ENV_DIR to a dedicated empty directory; Vite/Vitest and build-backed tests inherit it.
Set SKIP_ASSETPACK=1 to use committed fighter atlases.

## Assets
Six-part articulated sprites have polygon fallback; ?renderer=polygon forces it.
AssetPack packages raw-assets into apps/client/public/assets. Committed atlases support container builds.
Current fighter art is script-authored placeholders. See docs/assets/ART-SOURCE.md and docs/assets/REPLACING-FIGHTER-ART.md.
Final art and complete music/background provenance review are the next asset phase.


Illustrated fighter-art pilot revision 4 (51 All-Rounder drawings): three master designs and All-Rounder movement, defense/reactions and jab. Append ?renderer=fullbody to opt in; preview /fighter-art-pilot-v1/index.html. Partial coverage and quality gaps: docs/assets/FIGHTER-ART-PILOT-V1.md.

## Deployment
Root Dockerfile is the source of truth and Fly selects it. Production serves the client and WebSocket service together.
Docker includes only fighter workspace sources/assets and excludes Bonney and environment files.
Render builds the fighter workspace directly.
Process configuration: PORT, CLIENT_ORIGIN, NODE_ENV; optional VITE_SERVER_URL configures a separate browser server URL.

## Maintenance
Update current documentation with behavior and commands; preserve dated evidence as history.
Current decisions and remaining limitations: docs/REFINEMENT.md.
Version source: packages/shared/src/version.ts; scripts/sync-version.js synchronizes manifests.
License: MIT (see LICENSE).

### Full-body fighter art review

Optional renderer includes three smash clips per fighter with charge holds and distinct front/rear down-smash contacts. Review controls offer uncharged, half and full charge.2289 registered body frames across 408 clips are available; missing actions retain existing artwork. See docs/assets/FIGHTER-ART-ROSTER-V1.md for remaining coverage and timing limitations.

Lincoln and Swift now match All-Rounder with 15 clips / 87 drawings each. See docs/assets/FIGHTER-ART-ROSTER-V1.md for the new movement, defense, jab and reaction coverage, validation and remaining work.

The art review now links to a synchronized three-fighter comparison with idle overlays and a state-driven transition sequence: /fighter-art-pilot-v1/roster-consistency.html. It reviews artwork only; gameplay is not simulated there.

Aerial pilot coverage now includes five attacks per fighter, torso registration and landing interruption. All fighters have20clips/117drawings. Full packaging is currently blocked by unrelated public-file copy errors; see docs/assets/FIGHTER-ART-ROSTER-V1.md.

Specials batch:all fighters now have25clips/145drawings, plus16shared effect frames. The optional renderer supports ground/air anchors and confirmed counter reactions. Effects remain staged review assets; projectile and timing parity work remains open.

Grab/throw batch: all fighters have 36 clips / 203 drawings. The review includes grab-pairs.html for holder/victim combinations; optional full-body rendering uses grab roles and confirmed reaction events. Hand attachment and Ultimate rules remain refinement work.

Current sprite pack: 136 clips / 763 registered frames per fighter. Grab contact uses shared visual sockets; ledge-review.html shows eight ledge actions for all fighters on either edge. Collision and Ultimate behavior remain separate engine work. Individual review images load on demand.

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

Docker dependency installation uses pnpm 11's explicit allowBuilds policy in pnpm-workspace.yaml. The locked Linux x64 FFmpeg installer (4.1.0), pulled in by the asset tooling, is approved there; keep this policy in the Docker build context. Unreviewed dependency scripts remain blocked.

Sprite artwork is now enabled by default on ordinary game URLs, including production deployments. Use ?renderer=legacy only to explicitly select the old articulated renderer; ?renderer=fullbody remains compatible. Missing clips retain the existing fallback.
