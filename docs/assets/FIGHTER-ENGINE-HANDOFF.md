# Fighter art integration handoff


## Shared effects, player identification and handoff — batch 20 (2026-11-03)

Optional full-body rendering now loads the four existing shared effect sheets and displays effects at special-move active startup, or the confirmed counter-success cue. Effects use simulation frames, stop after eight ticks and cancel on interruption/KO; missing effect sheets time out and leave body rendering available. Initial placements sit near the special-action hands/trails and still need real-match visual approval. No combat/hitbox rules changed.

Full-body players have upright colored badges with one through four pips, preserving costume colors and allowing duplicate-fighter identification without color alone. Badges hide on KO. Added every-frame-review.html: 96 pages cover all 2,289 registered frames. All pages loaded successfully; nine additional pages (selected kicks/smashes, turns/braking/crouch and backward dodges for all fighters) were visually inspected. Fitted boards do not establish gameplay scale or every-frame approval. Source artwork and manifest revision 18 remain unchanged.

Validation: TypeScript passed; 47 existing focused renderer tests plus two new effect/marker tests passed; all 32 browser tests passed. Live browser loaded all four effect sheets and rendered four facing-correct duplicate-player badges. Code-only client production build passed with public copying disabled and environment loading redirected to the empty directory. The portable asset folder has a SHA-256 inventory of 413 manifest/source-image files. This is not full production packaging, an optimized atlas or default-renderer cutover.

Remaining: every-frame visual signoff, real-match effect placement and four-player distant-camera checks, texture-memory/atlas optimization, full public-file build, then missing authoritative mechanics/state-event hooks. There are still 54 live clips and 82 prepared clips per fighter; do not enable prepared art as implemented mechanics. See outputs engine-art-handoff.json and docs/assets/FIGHTER-ENGINE-HANDOFF.md.

Runtime: apps/client/src/renderer/fullbody/FullBodyPilot.ts; player badges: apps/client/src/renderer/FighterRenderer.ts; effect timing test: sharedEffects.test.ts; marker test: renderer/__tests__/playerMarker.test.ts. Existing canonical move data drives effect cues; no independent real-time clock or renderer-driven damage. Rebuild drawings/package index through scripts/assets/build-fighter-art-review.mjs.



## Production atlas and replicated movement hooks — batch 21 (2026-11-03)

Completed the drawing screen for all 2,289 registered body frames on 24 inspected montages: no new blocking palette, costume, silhouette or clipping issue found. This signs off the static drawing screen for integration, not the authoritative motion timing of unimplemented actions. Source PNGs and source manifest revision 18 are preserved.

Added production atlases (two pixels per world unit, premultiplied-alpha bilinear sampling, two-pixel extrusion): 15 pages total, eight loaded live. Live decoded texture storage drops from 1,214,237,188 bytes across 193 equivalent source sheets to 134,217,728 bytes (128 MiB), an 88.9% reduction; live PNG downloads total 30,726,124 bytes. The verifier checks all 2,305 body/effect frame entries, bounds and world-space roots/sockets; maximum registration error is zero. Memory figures exclude GPU overhead, mipmaps and legacy renderer resources.

Connected nine additional clips per fighter: rise/apex/fall/fast-fall loops, double-jump transition, soft landing and three downward dodge variants. Fast-fall/dodge-direction metadata now survives local, remote and predicted-local render paths. Double jump uses the replicated resource change to play twelve simulation ticks even if a snapshot misses the one-tick trigger; repeated snapshots freeze and interruption cancels. Current supported dodge vectors are inherited from the engine; no new combat or movement physics was introduced. Runtime loading is now 63 clips per fighter; the original source manifest retains its historical 54-live/82-prepared flags. Runtime policy and production manifest supersede those flags for the nine promoted clips.

Four actual browser clients passed atlas rendering, duplicate-player identification, movement propagation, synchronized pause and refresh/rejoin. All 35 browser tests passed, along with TypeScript and ten focused hook/contact/effect/marker/metadata unit tests. A complete Vite production build with staged public assets passed. The packaged game loaded all eight live atlas pages with no failed requests or page errors. Original review sheets are excluded from the production distribution; legacy part rendering remains available. Development/review distributions retain source-sheet fallback (?atlas=source); the staged production distribution falls back to legacy parts when atlas art is unavailable.

Remaining engine integration: 73 prepared clips per fighter still need mappings, event metadata or mechanics. This includes overlapping legacy/alternative variants, not 73 independent mechanics. Prioritize jab 2/3 and dash attack, floor/getup actions and shield reactions, then paired footstools, recovery lockout, movement transition cues and presentation. Full-body mode remains optional (?renderer=fullbody). Low-end device/memory testing, WAN/packet-loss stress and exhaustive animation-in-context testing are outside this local validation. See docs/assets/FIGHTER-PRODUCTION-ATLAS.md and integration-signoff.html/json.


### Engine integration batch 22 — 2026-11-03

74 clips per fighter now have runtime hooks; 62 prepared clips remain. The original revision-18 artwork is preserved. Jab 2/3 chain from fresh buffered attack presses, and dash attack uses authoritative timing. Ground recovery records face-up/down orientation, locks inputs for 18 ticks, and supports standing, rolls and two-sided floor attacks. Automatic stand-up begins after 30 ticks and lasts 24 ticks. Rolls move 36 world units over 12 ticks; stand/roll invincibility lasts 8/18 ticks. Floor attacks use 6 startup, 4 active and 14 recovery ticks, with startup invincibility. These are initial custom settings requiring playtesting, not verified Ultimate timings.

Validation: 37 browser checks passed, including four actual clients, movement, pause and refresh/rejoin; 275 engine tests passed (one skipped), 9 combat server tests, 10 ground-recovery server tests, and 37 ledge tests (13 skipped) passed. Three focused client tests and TypeScript checks passed. Source drawing review remains unchanged. Remaining priorities: shield reactions, footstools, helpless/recovery lockout, and remaining movement/presentation hooks. Prepared clips include overlapping variants, not 62 separate mechanics.
