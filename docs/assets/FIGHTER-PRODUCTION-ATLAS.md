# Fighter production atlas and validation

Use the [full-body fighter art guide](FULL-BODY-FIGHTER-ART.md) to locate source sheets and author clip metadata.

## Current packaging workflow

Run from the repository root with installed dependencies and current compiled workspace exports. Follow the [development guide](../guides/DEVELOPMENT.md) for the initial build and an empty environment directory. Use an isolated checkout or copy for a trial. These commands write PNG pages, a packed manifest, and `atlas-report.json` under the pack output directories.

```sh
# All-Rounder, Abe Lincoln, and Swift
node scripts/assets/build-production-fighter-atlas.mjs
node scripts/assets/verify-production-fighter-atlas.mjs

# Moonshine and “Hulk” Hoagie
node scripts/assets/build-production-fighter-atlas.mjs --dojo
```

| Command | Output and scope |
| --- | --- |
| Default build | `apps/client/public/fighter-art-pilot-v1/production/`. The packer also derives timing for selected original-roster clips from the compiled engine. |
| Original-pack verifier | Reads the original source and packed manifests and PNG pages. It checks the revision's fixed frame and live-clip counts, bounds, and world-space registration, then writes `production/verification.json`. If the intended inventory count changes, review its assertions along with the content change. |
| Build with `--dojo` | `apps/client/public/fighter-art-newcomers-v1/dojo/`. Compare its manifest with the source revision and its report with the emitted pages. Check each referenced frame rectangle, its duration and root, and any affected socket. The standalone original-pack verifier covers only the original pack. |

Both packs use 2048 × 2048 PNG pages with two-pixel extrusion and two pixels per world unit. Keep the source art and the rebuilt pack together. The packer updates the public source tree. Run `pnpm build` again before checking changed atlases with `pnpm start`, which serves the compiled output. The Vite production build can trim and losslessly encode eligible pages as WebP in the build output and rewrite their manifest references. It validates decoded pixels before replacing a PNG. Review build output separately from the committed PNG atlases. [Packer](../../scripts/assets/build-production-fighter-atlas.mjs) · [Verifier](../../scripts/assets/verify-production-fighter-atlas.mjs) · [Vite transport](../../apps/client/atlas-transport.mjs)

## Verify in game

Open the normal dev game and start a local match with one fighter from each pack. In Fighter Select, click the CPU seat to choose its fighter, then confirm the human seat with its Ready button. Confirm the selected fighters have visible full-body sprites and that requests come from their respective packed directories. Use the Dojo to play affected clips and check ground and air alignment, contact, and transitions. `?atlas=source` is an original-pack development comparison when source sheets are available. `?renderer=legacy` opens the original roster using the fallback workflow.

## Packaging verification — November 10, 2026

Both pack commands ran against isolated copies of the manifest-referenced sources with the existing compiled workspace exports. The regenerated manifests matched the repository versions. The original verifier passed 2,305 frame entries across 17 pages with zero registration error. The newcomer inspection decoded three pages and checked all 844 frame rectangles, frame/duration counts, finite roots, and source revision. The counts describe these revisions. SHA-256 comparisons matched all 20 regenerated PNG pages with the committed versions. The Vite atlas transport step passed its decoded-pixel checks when invoked on the isolated output for both packs.

Two local Chromium smoke cases passed. A Moonshine versus Abe Lincoln match on Stage 1 showed both full-body sprites and fetched pages from the expected pack directories. The legacy match loaded articulated fallback textures without loading full-body atlas pages. These checks used the current development servers and committed PNG atlases. Full clean-checkout verification is tracked in the [refresh plan](../plans/DOCUMENTATION-REFRESH.md#execution).

## Historical integration batches

The dated sections below preserve earlier workflow, clip counts, and test results for reference.

## Production atlas and replicated movement hooks — batch 21 (2026-11-03)

Completed the drawing screen for all 2,289 registered body frames on 24 inspected montages: no new blocking palette, costume, silhouette or clipping issue found. This signs off the static drawing screen for integration, not the authoritative motion timing of unimplemented actions. Source PNGs and source manifest revision 18 are preserved.

Added production atlases (two pixels per world unit, premultiplied-alpha bilinear sampling, two-pixel extrusion): 15 pages total, eight loaded live. Live decoded texture storage drops from 1,214,237,188 bytes across 193 equivalent source sheets to 134,217,728 bytes (128 MiB), an 88.9% reduction; live PNG downloads total 30,726,124 bytes. The verifier checks all 2,305 body/effect frame entries, bounds and world-space roots/sockets; maximum registration error is zero. Memory figures exclude GPU overhead, mipmaps and legacy renderer resources.

Connected nine additional clips per fighter: rise/apex/fall/fast-fall loops, double-jump transition, soft landing and three downward dodge variants. Fast-fall/dodge-direction metadata now survives local, remote and predicted-local render paths. Double jump uses the replicated resource change to play twelve simulation ticks even if a snapshot misses the one-tick trigger; repeated snapshots freeze and interruption cancels. Current supported dodge vectors are inherited from the engine; no new combat or movement physics was introduced. Runtime loading is now 63 clips per fighter; the original source manifest retains its historical 54-live/82-prepared flags. Runtime policy and production manifest supersede those flags for the nine promoted clips.

Four actual browser clients passed atlas rendering, duplicate-player identification, movement propagation, synchronized pause and refresh/rejoin. All 35 browser tests passed, along with TypeScript and ten focused hook/contact/effect/marker/metadata unit tests. A complete Vite production build with staged public assets passed. The packaged game loaded all eight live atlas pages with no failed requests or page errors. Original review sheets are excluded from the production distribution; legacy part rendering remains available. Development/review distributions retain source-sheet fallback (?atlas=source); the staged production distribution falls back to legacy parts when atlas art is unavailable.

Remaining engine integration: 73 prepared clips per fighter still need mappings, event metadata or mechanics. This includes overlapping legacy/alternative variants, not 73 independent mechanics. Prioritize jab 2/3 and dash attack, floor/getup actions and shield reactions, then paired footstools, recovery lockout, movement transition cues and presentation. Full-body mode remains optional (?renderer=fullbody). Low-end device/memory testing, WAN/packet-loss stress and exhaustive animation-in-context testing are outside this local validation. See docs/assets/FIGHTER-PRODUCTION-ATLAS.md and integration-signoff.html/json.

Rebuild workflow (repository root):

1. node scripts/assets/build-production-fighter-atlas.mjs
2. node scripts/assets/verify-production-fighter-atlas.mjs
3. node scripts/assets/stage-production-public.mjs ABS_STAGING_DIRECTORY
4. From apps/client, run the Vite build with publicDir set to that staging directory, public copying enabled, SKIP_ASSETPACK=1 and SMASH_ENV_DIR pointing at the empty environment directory.
5. pnpm exec playwright test --config playwright.art-integration.config.ts (requires existing client on 5193 and server on 3001; does not auto-start environment-loading commands).

Runtime policy: apps/client/src/renderer/fullbody/preparedHooks.ts. Atlas generation carries the same nine promoted names; regenerate and verify after promotion changes. Never ship a stale atlas after source manifest changes. Production loading checks source revision before choosing the atlas. Four-player test: apps/client/e2e/multiplayer-atlas.spec.ts. Static drawing montage review is recorded in integration-signoff.json.


Production builds can set SMASH_PUBLIC_DIR to a staged public folder and SMASH_BUILD_OUT_DIR to an isolated output folder. Keep SMASH_ENV_DIR pointed at the empty environment folder and SKIP_ASSETPACK=1 for this pipeline. Batch 22 connects 74 clips per fighter; eight live atlas pages use 128 MiB decoded texture memory.


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
