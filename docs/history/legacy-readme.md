> Historical snapshot from the first documentation migration. For current setup and next steps, see the [project README](../../README.md) and [active work](../plans/ACTIVE-WORK.md). Bare repository paths are relative to the repository root. Output paths may refer to earlier task workspaces.

# Everybody Throws Hands

Newcomer review now includes eight-frame gait revisions, original/refined comparison and idle–jab transitions. [Open the pilot](../../apps/client/public/fighter-art-newcomers-v1/index.html). Hoagie walk contacts and remaining motion polish are still open; the fighters are not playable yet.

New fighters in production: [Moonshine and Hulk Hoagie animation pilot](../../apps/client/public/fighter-art-newcomers-v1/index.html) and [production plan](../../apps/client/public/fighter-art-newcomers-v1/plan.json). Five pilot clips and a portrait each are available for review; neither fighter is selectable yet.

Dodge/parry refinement, stale air-dodge travel and the production two-hit up-smash: [current status and remaining parity gaps](../FATIGUE-PARRY-SEQUENCE-AUDIT.md).

Browser platform fighter with online rooms and local human/CPU play. This project covers apps/, packages/, fighter assets and supporting scripts. bonney/ is a separate project and is excluded.

Target mechanics: Super Smash Bros. Ultimate. Current engine parity is incomplete. Sprite production and the later engine handoff are tracked in [the Ultimate checklist](../assets/ULTIMATE-ANIMATION-CHECKLIST.md).

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
Set SKIP_ASSETPACK=1 to use committed fighter atlases. Production builds trim unused space from full-body atlas pages and use smaller lossless WebP copies in the build output. The build verifies visible pixels and keeps the source PNG atlases.

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


### Menu refinement — shared foundation (November 4, 2026)

Controls, Accessibility, and Sound share a Settings screen. Choose a player seat before editing keyboard bindings, selecting a gamepad profile, or opening stick settings. Training Dojo separates Free Practice from Guided Lessons, saves the session choices on this device, and previews the lesson before you start it.

Standard match pause offers Resume, sound, visual accessibility, and a confirmation before leaving. Results show the winning fighter, arena, and lineup. Local Rematch reuses the fighters and arena, and Change Fighters restores the previous picks. Online results return to the Online Play room browser.

World Select shows arena art, a collision-based platform diagram, and an optional story. Random uses the same preview size. Online guests follow the host's highlighted world and can read its story. The match intro shows the selected world, fighters, and countdown.

The main menu separates Local Play, Online Play, and Training Dojo. Local Play shows two to four seat cards with controller and CPU information. Use Online Play to create a private room or join with a six-character code. The room lobby displays the invite link, connected seats, and server-confirmed readiness.

Local and online fighter selection now share a portrait roster and engine-backed weight, run speed, and air speed comparisons. Select a local seat to edit its choice, and use Next fighter to change the comparison independently. In Training Dojo, Escape or the controller pause button opens a wide console with Session, Timing & Display, Recordings, and Settings tabs. Menu navigation follows native Tab focus, compact Settings retains its navigation while content scrolls, and startup shows a loading status while the menu opens. Local Play and Dojo load the selected fighters on demand. Online Ready opens fighter selection immediately. After everyone confirms a fighter, the clients load the lineup and the server waits for artwork preparation before countdown. Moonshine and “Hulk” Hoagie use full-body menu cutouts. Completed Dojo cards reserve space for their status. The gameplay camera follows active fighters in local, online and Dojo matches. See the [menu polish plan](../MENU-POLISH-PLAN.md).

Selection design preview is in outputs/menu-prototype-v1. Fighter canon remains open for collaborative writing. The game now uses a scoped illustrated menu surface with readable panels and profile-derived Xbox B/A hints. Countdown/match keep the arena visible; pause uses a translucent scrim. This is the foundation pass; portrait-based character selection, story-based stage selection, state-preserving back navigation, and unified online selection remain upcoming integration work.


### Illustrated selection integration — November 4, 2026

Local fighter selection now uses approved portraits, archetype descriptions and player-colored panels. Online selection reuses those portraits and archetypes; its server-confirmation flow is retained. Six named worlds have optimized previews and source-based stories accessible through the Story button, I key or Xbox X. Stage IDs, background filenames, music and shared arena geometry are unchanged. Stage Back restores fighter picks without returning to seat setup; human slots reconfirm. Fighter canon is still open. Character polling is canceled on screen replacement, including the pending CPU timer. Host-synchronized online stage selection, unified local/online navigation, CPU fighter editing after automatic lock-in, and deeper ready/unlock interaction remain future work.


### Selection interaction refinement — November 4, 2026

Local humans can unlock their own ready choice with Xbox A, Escape for P1, or the Change fighter button while waiting for other players. Only the host controller backs out of the full local screen when its choice is not locked. CPU choices can be changed by clicking a fighter before the screen advances. Online fighter selection now uses the shared keyboard/gamepad MenuNavigator with real buttons. Confirmation remains server-authoritative; rejected confirmation resets pending state for retry, and acknowledged choices remain locked. Online unconfirm/back-to-lobby still requires an explicit server/room flow and is not simulated by the UI.


### Online selection protocol — November 4, 2026

Rooms now progress LOBBY → CHARACTER_SELECT → STAGE_SELECT → COUNTDOWN → MATCH. Every participant can server-unconfirm their own fighter before countdown; this returns the room to fighters while preserving other ready choices. Host Back from stage select returns everyone to fighters; Back from fighter selection returns the room to its lobby, clearing ready flags without removing players. The host is the lowest occupied slot and is recomputed after departures. Only the host can select a valid stage1–stage6 or start countdown. Live host previews, committed stage, countdown/start payloads and refresh/rejoin all carry the same stage ID. Geometry remains shared; this synchronizes artwork/music, not unique stage hazards. Disconnect during selection resets the room to lobby. Countdown closes selection, duplicate or wrong-phase requests are rejected, and stale countdown callbacks check the current phase. selection:sync allows client recovery after request errors. New clients and server must be deployed together.


### Stage layouts and platform art v1 — November 5, 2026

All six worlds now have registered illustrated main/soft platform sprites and stage-specific static geometry. Stage 1 preserves the baseline layout; the other worlds vary main width, platform count, spacing and elevation. Shared stageLayouts.ts is consumed by server physics, ledges, respawns, CPU off-stage sensing, offline matches, snapshots, client prediction and rendering. Stage ID is included in snapshots and online room selection. Platforms and fighters share the camera transform; the debug grid is removed. Decorative sprite undersides are non-colliding; the thin top rim marks the landing plane. Main platforms remain solid, upper platforms allow drop-through. Backgrounds and fighter art are unchanged. No conveyor motion, currents, moving books, other hazards or new KO spectacles are implemented. Human balance/recovery/readability signoff is still needed. Assets were generated with the built-in image_gen tool from the six-world artwork reference; exact prompts, source sheets and crop registrations are retained in art-source/platforms-v1. Run node scripts/assets/pack-stage-platforms.mjs to repack. Review screenshots and test evidence: outputs/stage-platforms-v1.


### Background readability and atmospheric depth — November 5, 2026

Gameplay backgrounds now default to a 45% warm cream wash and 55% color intensity, with a small background-only softening filter. Fighters, platform textures, collision geometry and gameplay timing are unchanged. Six procedural atmosphere themes add two low-detail planes behind the canvas: clouds, underwater haze/bubbles, factory steam, cosmic mist/stardust, banquet steam and library dust/light shafts. Far/near layers drift and scale at different rates; bounded parallax follows active fighter framing. Scenery motion defaults to the operating system reduced-motion preference, can be disabled, and pauses outside matches. Visual accessibility is available from the main and pause menus with a still preview, fade/color adjustments, atmosphere toggle, motion choice and reset. Preferences persist locally under smash:visuals:v1 and do not synchronize into gameplay. HUD and room codes have solid high-contrast backplates; ready instructions have higher contrast. Pause/resume also restores the arena surface correctly. This is a visual readability/depth pass, not a full accessibility certification; player testing, screen-shake preferences and broader accessibility remain follow-up work. Comparison and validation: outputs/visual-accessibility-v1.

### Fighter dodge timing

Fresh dodge profiles now use Mario (All-Rounder), Ganondorf (Abe Lincoln) and Fox (Swift) as defensive timing references. Neutral and directional air-dodge recovery differ; ordinary movement and source artwork are retained. Fully fatigued windows/rounding and air-dodge landing rules remain provisional. See [the dodge-profile refinement](../DODGE-PROFILE-REFINEMENT.md) and [current refinement status](../REFINEMENT.md).

### Training Dojo

Choose **Training Dojo** from the main menu for zero-damage free practice or 40 guided lessons, including Star and Screen KOs. Practice supports all five fighters and six worlds, passive/shielding/telegraphed partners, unlimited arena resets and no win/loss. Lessons require three real successful executions and save completion per fighter on this device. Star and Screen KO effects keep playing on valid launches after the lesson is complete. Star KO carries the outgoing tumble through the upper-edge handoff and recedes into the distance. Screen KO approaches the camera from above, clears the bottom edge, then plays a lower blast at the actual window edge before results appear. Hoagie falls back from the camera during his exit. R resets, F2 opens the dojo menu, and Escape/Start pauses with controller-accessible practice options. See [Training Dojo](../TRAINING-DOJO.md) for implementation, validation and planned simulator tools.

The dojo now includes a **Timing laboratory**: 1x/0.5x/0.25x playback, F6 freeze/run, F7 single-tick stepping and F3 collision overlays. Xbox Back freezes/steps; Start opens controller-accessible lab controls. Free Practice adds F8 recording, F9 partner playback and three saved routine slots with mirroring/repeat/delay. See [Training laboratory](../TRAINING-LAB.md).

## Ultimate controls refinement — independent attack presses

Xbox B and the right stick now have separate attack press detection. A held input no longer masks a new press from the other source or supplies its aim. If multiple attack presses reach the same server tick, the latest attack sample supplies the attack aim and shortcut while the newest input sample still drives movement. If both sources activate in one sample, right-stick aim takes precedence.

Next are real-controller checks against Ultimate 13.0.5, including right-stick neutral rearm, simultaneous input priority, and the existing smash-flick windows. Movement and landing timing still need their own parity pass.

The Dojo Timing laboratory includes an Input trace. It keeps the last eight input or state changes, with simulation ticks, presses/releases, stick aim and the move or state the engine entered. Use freeze and frame stepping to compare attack and jump sequences on a real controller.

Up smash now accepts a face-button press on the first two ticks after a grounded stick jump begins, following the older Ultimate Training measurements at https://w.atwiki.jp/smashsp_kensyou/pages/45.html. The simultaneous input still works. This cancel applies only to stick jump; hardware verification on Ultimate 13.0.5 remains open.

Right-stick attacks now rearm only after a sample inside the right-stick neutral deadzone. The current raw radial cutoff is 0.20, chosen from the existing controller deadzone; the attack threshold remains 0.55 after calibration. Physical-controller comparison against Ultimate 13.0.5 is still pending.

Controller stick settings now expose stick jump and Low/Normal/High smash-input sensitivity. Sensitivity changes the left-stick flick window by one tick in either direction without changing movement thresholds, following https://w.atwiki.jp/smashsp_kensyou/pages/45.html. The selected sensitivity is shown in the Dojo input trace and retained in new partner recordings. Hardware validation on Ultimate 13.0.5 remains open.

Controller Stick Settings also offers right-stick Smash or Tilt and an A+B Smash toggle. Tilt mode selects ground tilts and directional aerials and does not bypass shield drop. The selected right-stick mode is preserved with the attack through online input merging, buffering and Dojo recordings.

Analog dash now starts on the first qualifying horizontal flick or when the stick crosses the dash threshold on the following tick. Sustained analog dash uses a provisional 10-tick initial dash with a per-fighter duration field. The original keyboard dash timing still applies to digital input. Run brake and turnaround action windows remain the next movement pass.

Analog run release and reversal now use separate brake and turnaround states with matching sprite cues. Neutral braking retains forward drift until stopping, while reversal preserves the original velocity and accelerates against it. Early brake attacks become dash attack, and ordinary attacks reopen on the fifth combined brake/turn tick. Jump and up smash remain available early. Specialized grab, dodge, and special-cancel cases and console measurements remain open.

Analog run transitions now include early dash grab, pivot grab, backward roll during braking, and forward roll from the fifth brake tick. A grab or special pressed on the third or fourth brake tick is saved for the fifth; early turnaround up-special requires jump plus up-special. These are project implementations of the published movement reference and still need physical-controller signoff.

Button-jump squat now accepts later attack presses and starts the queued short-hop aerial on takeoff. A second held jump button can force a short hop during squat. A face-button attack on stick-jump takeoff can start a full-hop aerial, and right-stick attacks can still trigger the short-hop route. Right-stick direction expiry during the shortcut and version-matched hardware checks remain open. Reference: https://w.atwiki.jp/smashsp_kensyou/pages/75.html.

Aerial landing now uses move-specific early and late auto-cancel windows. Shield no longer shortens aerial landing lag. The current auto-cancel duration is four ticks including contact, while normal aerials use their existing move-specific durations counted from contact. Special and air-dodge landing recovery remain separate. The Dojo input trace shows remaining locked ticks and the first action after landing. Window endpoints are project tuning, using the Ultimate mechanic as the reference: https://w.atwiki.jp/smashsp_kensyou/pages/136.html.


Landing recovery now accepts jump and face-button attack presses up to nine ticks before the first actionable tick. An earlier press can still queue once if held through the third tick before recovery ends. Releasing before that cutoff lets the old press expire. The hold can start during an aerial already in progress. Right-stick presses and Shield retain their existing buffer rules. The timings follow published Ultimate input measurements (https://w.atwiki.jp/smashsp_kensyou/pages/111.html).


### Dojo launch and KO lab

In Free Practice, open **Timing laboratory → Launch and KO lab**. Set your fighter and partner independently to 0%, 50%, 100%, 150%, or 200%. Presets stay fixed through hits and arena resets and start at 0% in each new session. The lab reports the last launch for each fighter, including knockback, hitstun, tumble, base launch speed before directional influence, and maximum displacement during the tracked reaction. A real blast-zone crossing records the boundary before the arena resets. Screen and star KO previews use the selected fighter's existing art without moving fighters or using stocks.



### Steep upward launch tuning

Dojo testing across all five fighters found that steep up-smash launches were falling short of the top boundary until extreme damage. Tracked steep upward tumbles now use weight-scaled launch gravity and a dedicated fall cap. All-Rounder's center-stage mirror up-smash top KO moved from 238% to 161% on Stage 1 under neutral input. See docs/LAUNCH-MOTION-REFINEMENT.md for the five-fighter matrix and remaining hitstun timing work.



### Strong-hit launch timing

Strong tumble hits now traverse the early launch path faster and spend fewer real ticks in hitstun. The Dojo reports base and compressed hitstun side by side. The five-fighter browser timing results and KO regression matrix are in docs/LAUNCH-MOTION-REFINEMENT.md.



Gentle analog run reversals now update facing on the first turnaround tick, even below the stick threshold for digital Left/Right. Hoagie turns symmetrically while his remaining momentum carries him briefly in the old direction.


Tracked strong launches now sample tenths of a virtual frame and resolve bounces against solid floors, sides and ceilings. Floor rebounds are immediate. Wall and ceiling rebounds have contact freeze, and all three shorten remaining virtual hitstun. The Dojo records the contact, freeze, and hitstun change. See docs/LAUNCH-MOTION-REFINEMENT.md for reference limits and five-fighter verification.



Tracked tumble techs now use a 12-tick pre-contact input window, a 28-tick repeat lockout, and a 15-tick window for a recent air dodge. Ceiling tech has a 26-tick recovery and 17 intangible ticks. A tracked wall tech can select a wall jump through tick five, with movement on tick six. The Dojo shows both ceiling-tech timings. Authored hitboxes can block tech on the first launch collision, either on the floor only or on any surface. The Dojo identifies when a hitbox blocked a tech. Collision-freeze rounding, the disputed upper clamp, and cinematic tech timing remain provisional. See docs/LAUNCH-MOTION-REFINEMENT.md.


Tracked body launches now allow an air-dodge cancel after 40 live hitstun ticks at reference launch speed 2.5 or lower, or a regular aerial after 45 ticks at speed 2.0 or lower. Electric hits add one tick to either gate. These gates use remaining launch momentum without gravity. Jump and special wait for recovery during tracked body launches, including spikes. See docs/LAUNCH-MOTION-REFINEMENT.md.

Zero-hitlag tumbles now apply directional influence and launch-speed influence from the stick on the first movement tick. Weak launches, existing throw hitlag values, and hitstop displacement rules keep their current behavior. See docs/LAUNCH-MOTION-REFINEMENT.md.

Grounded grabs align fighters by their feet. The victim stays attached through pummel and throw startup, preventing a fall through the main platform before release. See [grab windup and platform crossing](../LAUNCH-MOTION-REFINEMENT.md#grab-windup-and-platform-crossing).

Ordinary throw releases have zero hitlag. An explicitly authored release can freeze the victim only, and a tumbling throw samples DI and LSI when the victim starts moving. The current checkpoint and next grounded-recovery audit are recorded in [Refinement](../REFINEMENT.md#current-combat-parity-checkpoint).

Grounded fighters can act on the first unlocked hitstun tick. A standing launch that lands before recovery ends accounts for its landing lock separately from the action transition. See [the combat parity checkpoint](../REFINEMENT.md#current-combat-parity-checkpoint).

Shield now starts a first-tick air dodge after ordinary body-hit tumble, including held input and recent taps. Same-tick floor contact routes to the existing tech check. See [the combat parity checkpoint](../REFINEMENT.md#current-combat-parity-checkpoint).

During airborne body-hit stun, Jump, aerial Attack and Special can buffer for the first unlocked tick. The [combat parity checkpoint](../REFINEMENT.md#current-combat-parity-checkpoint) records the tested windows and air-dodge landing follow-up.

Air-dodge landing counts floor contact as the first recovery tick. Neutral dodge unlocks grounded actions 10 ticks after contact. During a directional air dodge, holding Down prevents a ledge grab until you release it. Directional air dodges still land on soft platforms with Down held. The directional recovery curve and soft-platform behavior remain provisional. See [Air-dodge contact verification](../LAUNCH-MOTION-REFINEMENT.md#directional-air-dodge-platform-and-ledge-contacts).

A same-edge ledge regrab opens 44 ticks after leaving. Regrabs before landing or taking a reaction hit grant no fresh hang intangibility, and the seventh consecutive grab is denied. See [Ledge regrab verification](../LAUNCH-MOTION-REFINEMENT.md#ledge-regrab-cooldown-and-intangibility).

Neutral ledge getup, jump, roll, and attack now each grant their own protection window. Successive grabs shorten those windows and the fourth grab onward grants none. See [Ledge getup and catch timing](../LAUNCH-MOTION-REFINEMENT.md#ledge-getup-intangibility-and-catch-window).

Ledge grabs can now have up to two vulnerable approach ticks. A successful catch claims the edge, restores aerial resources, and locks getups for 19–23 ticks. A getup input during the lock plays on the first unlocked tick. See [Ledge approach and forced catch](../LAUNCH-MOTION-REFINEMENT.md#ledge-approach-and-forced-catch).

A ledge trump transfers ownership immediately. A displaced fighter finishes any forced catch before being ejected into 28 ticks of vulnerable recovery with horizontal steering. Their same-edge regrab cooldown starts at ejection. See [Ledge trump timing](../LAUNCH-MOTION-REFINEMENT.md#ledge-trump-displacement-and-recovery).

A fresh normal aerial can start with a double jump or on the next tick. The combined input applies the same launch and spends the same jump as Jump alone. See [Double-jump aerial input timing](../LAUNCH-MOTION-REFINEMENT.md#double-jump-aerial-input-timing).

Dodge fatigue recovery continues during ledge approach and forced catch. The one-shot refresh starts on the catch, on an air-dodge landing, or on the first unfrozen tick after an interrupted dodge. See [Five-fighter dodge fatigue audit](../FATIGUE-PARRY-SEQUENCE-AUDIT.md#five-fighter-fatigue-and-recovery-audit).

A successful parry preserves the attack's guardstun after parry hitstop. The defender is protected through both and can act on the first unlocked tick. Jump, face Attack, Special, and Grab can be tapped up to 29 ticks before unlock or qualified by an earlier hold through the three-tick cutoff. Shield re-raises if held at unlock. Right-stick tilts and smashes can also queue. For side attacks, the left stick chooses facing after the right-stick direction expires. Online input omits unset controller fields so they pass server validation. A tilt-only flick while face Attack stays held preserves a fresh face press in the same server tick. Dojo routines replay recorded Attack presses. The Dojo input trace shows face Attack and right-stick releases separately and reports the tick smash charge stops. See [Post-parry action buffer](../FATIGUE-PARRY-SEQUENCE-AUDIT.md#post-parry-action-buffer) and [two-client right-stick replay](../FATIGUE-PARRY-SEQUENCE-AUDIT.md#two-client-right-stick-replay).

Xbox 360, Nintendo Switch Pro, and PlayStation DualSense share the same Ultimate-style physical button positions when the browser reports a standard gamepad. Open **Controls → Controller profile** to check detection or select the profile manually. Menus, selection, pause, and Dojo show controller-specific prompts, including per-seat labels on local fighter select. Initial physical-controller checks were reported as passing. Extended mixed-seat and reconnect hardware checks remain open. See [Three-controller support plan](../REFINEMENT.md#three-controller-support-plan).
