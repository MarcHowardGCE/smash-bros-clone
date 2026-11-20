# Animation release preflight — November 20, 2026

## Decision

Released runtime commit [c6421bf](https://github.com/MarcHowardGCE/smash-bros-clone/commit/c6421bf55d04c3464b8033b1ee5ba7b618084da3) to Render and Bluehost. The clean CI build/tests and coordinated publication passed, both hosted revision markers match, and post-deploy checks passed. The local preflight below is preserved as dated evidence. Historical Ultimate timings stay provisional; unrelated exhaustive matchup, packet-loss and hardware work is not silently closed.

## Completed checks

| Check | Result |
| --- | --- |
| Fresh defender actions in two clients |40 cases,80 client checks, five newer fighters as defenders, both facings: Jump, Attack, Shield and Special replace the throw cue.120 ms input delay and ordered snapshot jitter. Five browser tests passed. |
| Workspace suites |Shared33, gamepad76, engine1,106, server755 passed;17 existing skips. The first complete workspace run also passed1,217 client tests. After the final client-only fixes, the full client rerun passed1,220 tests in86 files. Effective current package total3,190 passes; the final1,220-client result supersedes the earlier client count. |
| Final workspace type checks |All five packages passed after the final predictor/renderer changes. |
| Production build |pnpm build passed with SKIP_ASSETPACK=1, an empty SMASH_ENV_DIR and SMASH_ATLAS_QUALITY_96=1. Default build output, same-origin local server endpoint. The release workflow rebuilds with Render as VITE_SERVER_URL. |
| Movement targets |All110 rows across ten fighters and11 movement clips meet drawing minima. Hash counts validate pixel distinctness, not semantic art approval. |
| Source and staged manifests |All four packs passed image existence, crop bounds, finite roots and source/packed revision agreement: revisions20/93/108/127, packed slots2,289/1,072/1,854/1,330 respectively. |
| Compiled production smoke |Ten Dojo fighters, legacy-query local startup, local movement/pause/resume:12 browser checks passed. Saved production roster board reviewed; no missing fighter artwork visible in those samples. |
| Compiled online release smoke |Reconnect while paused, resume and confirmed leave passed. Pack04 cold8 Mbps and interrupted-artwork retry passed. Local selection for Zane/Velvet and delayed portrait replacement with both motion settings passed. These seven checks passed in the initial production run. |
| Development lifecycle |Staged movement/hit/pause/KO/results fixture passed in development, its intended environment. |
| Packaging |stage-bluehost-client.mjs succeeded under apps/client/dist-release-staged-20261120. All referenced staged images exist and crops/roots validate. Build and staging outputs remain ignored. |

At8 Mbps the cold Pack04 run took30.376 seconds navigation-to-live,15.221 seconds stage-confirmation-to-live. Interrupted retry showed the alert414 ms after abort, blocked entry to the match, and recovered the same lineup; after retry stage confirmation to live was14.144 seconds. These are single local production runs, including normal UI/countdown time, not hosted medians.

## Issues found and resolved during this pass

The live action pass found a late throw cue briefly covering an already-started jump. The renderer now recognizes takeoff art cues, and LocalPredictor marks accepted ground takeoffs immediately while snapshots catch up. Movement positions, velocities and input unlocks are unchanged. A renderer regression and two predictor checks cover late takeoff and rejected inputs during hitstun. Existing analog movement parity still passes.

Initial action experiments pressed during hitstun and tested buffering; final checks use a fresh press after authoritative IDLE recovery. Do not claim early-held buffer parity from these results. Some first attempts also found the jump marker gap described above; all40 final cases passed after repair.

The first production fixture incorrectly requested development-only forcePosition/getArtState diagnostics. Production correctly omits those functions. Replaced production assertions with read-only snapshots, atlas response checks and screenshots; kept the staged KO fixture in development. An initial atlas-response regex was over-escaped and was corrected before the12 passing production checks. No production debug access was added.

Staging into OneDrive failed with EPERM on chmod for an audio file. The unchanged staging script passed on the normal repository volume. This was a destination filesystem issue, not a failed build or missing asset; no broad permission changes were made.

## Commit contents

Named root test-results-* and playwright-report-* folders, plus isolated client dist-* builds, are ignored. Their files were preserved locally. Keep required source art/provenance, runtime manifests/atlases, source/tooling/tests, current docs and curated dated evidence. Do not use an indiscriminate add-all on raw browser output. The [file inventory](../assets/reviews/release-file-inventory-2026-11-20.json) records the reviewed candidate paths; none exceed GitHub's100 MiB per-file threshold. This remains a large accumulated art/evidence checkpoint; no history was deleted or source sheets discarded to shrink it.

## Release completion

1. Reviewed and committed the accumulated checkpoint as c6421bf, then pushed main. Raw browser output and isolated builds stayed excluded; source art and curated history were retained. Extra EOF blank lines in51 new test/tool files were removed before commit; no behavioral changes were made during publication.
2. [Coordinated workflow](https://github.com/MarcHowardGCE/smash-bros-clone/actions/runs/44812948686) succeeded. The clean runner passed3,193 tests with14 existing skips, built/staged the quality96 client, verified its Render endpoint, deployed the matching backend revision, then published Bluehost. The CI server suite ran three asset-serving checks skipped in the local gate.
3. Both the client eth-release meta tag and Render healthz report c6421bf55d04c3464b8033b1ee5ba7b618084da3. Eighteen hosted browser tests passed, plus the separate Stage10 two-client live/paused reconnect, resume and confirmed-leave scenario. This release checkpoint is complete.

The follow-up documentation-only commit records these results without rebuilding or redeploying unchanged runtime files. The published runtime version remains c6421bf.

Broader visual coverage, unsampled paired matchups, loss/long-stall testing and version-matched Ultimate evidence remain follow-ups; this preflight does not claim to finish them. Previously approved human signoffs are not reopened.

## Evidence

- [Live action checks](../assets/reviews/release-live-action-cancellation-2026-11-20.json)
- [Movement ledger](../assets/reviews/release-movement-ledger-2026-11-20.json)
- [Source manifests](../assets/reviews/release-manifest-validation-2026-11-20.json) and [staged manifests](../assets/reviews/release-staged-manifest-validation-2026-11-20.json)
- [Production roster board](../assets/reviews/release-roster-production-2026-11-20.png) and [asset responses](../assets/reviews/release-production-roster-2026-11-20.json)


## Hosted verification — November20

Fresh Chromium contexts at1280×720,DPR1 verified all ten fighters in Dojo, atlas responses, local movement/pause, the legacy-query local startup, Zane/Velvet local selection, and portrait replacement with normal/reduced motion. Reviewed the [hosted roster board](../assets/reviews/release-hosted-roster-c6421bf-2026-11-20.png); all ten fighter sprites appear in the sampled jump poses. These stills do not establish exhaustive animation smoothness.

At8 Mbps/80 ms latency, the cold Zane/Velvet online trial reached live play32.239 seconds after navigation and16.334 seconds after stage confirmation. The reset trial showed the artwork alert450 ms after abort, kept the match blocked, and recovered the same lineup; retry stage confirmation to live took14.283 seconds. These are single cold/reset trials, not warm-cache or statistical latency claims.

A separate fresh room used Zane/Velvet on Stage10. Movement reached both clients. Live refresh recovered the same Velvet seat in1.082 seconds; paused refresh took1.517 seconds and held tick99 during the250 ms observation. Resume advanced both clients; confirmed Leave cleared the guest room/session and returned the host to results. Zero uncaught page errors. [Machine-readable CI, hosted and reconnect evidence](../assets/reviews/release-hosted-c6421bf-2026-11-20.json).
