# Landing input buffering and transition polish — November 5, 2026

## Current project landing buffer

Ordinary recovery uses a six-tick press buffer. During landing recovery, an eligible Jump or face Attack press can be stored for nine ticks. A carried Jump or face Attack hold can commit once with three locked ticks left. Shield and right-stick attacks do not use that hold path. A fresh action at unlock has priority. Compare press, release, and first action in the Dojo trace. [Action buffer](../packages/engine/src/physics/actionBuffer.ts) · [Human feel pass](REFINEMENT.md#next-human-feel-pass)

## November 5 evidence

The original six-tick edge-buffer pass is retained below.

## Implemented
A deterministic six-tick edge buffer stores recent jump, attack, special, grab or shield presses during ATTACK, AIR_ATTACK, LANDING_LAG and HELPLESS_LAND recovery. It does not refresh from a held button. A newer fresh command supersedes queued intent. Direction/stick/shortcut metadata from the original press is retained for move selection.

A grounded fighter still labeled AIRBORNE now routes immediately through grounded input priorities, fixing the dropped landing-tick jump. Once landing lag reaches zero, fresh or buffered actions route directly into the next action instead of showing an extra idle frame. Recovery lengths, hitboxes, attack timing and artwork are unchanged.

Descending fighters without a double jump can retain a jump-only press for imminent landing; available double jumps still execute normally. Released buffered jumps remain short hops. Jump-plus-attack retains the existing short-hop aerial shortcut.

Damage, KO/respawn and incompatible state interruptions discard queued intent. Both MatchSession.pause and LocalMatch.pause explicitly clear engine action buffers. Inputs do not survive a pause through this queue. State snapshots retain optional actionBuffer metadata; offline and online use the same authoritative GameEngine. Combat/recovery actions remain server-authoritative rather than newly predicted by the client.

## Validation
- Full engine suite: 977 passed, one skip.
- Full client suite: 590 passed.
- Final broad server run: 309 passed, 16 skips and one legacy expectation failure. That test expected an idle frame despite a fresh attack after lag reached zero. Its during-lag lockout assertions were retained; the release assertion now expects ATTACK. The corrected ledge suite and eight action-buffer integration cases then passed: 45 passing tests, 13 existing skips in that focused run. This is combined server evidence, not a single final 310-test broad run.
- Shared/engine/server/client builds and server/client typechecks passed.
- Focused checks cover exact landing-tick jump, released buffered short hop, attack/special direction, expiration, one-time execution, pause clearing, short-hop aerial shortcut, unavailable/available double jump and zero-lag transition routing.
- Production controller-input browser scenario passed aerial attack -> landing lag -> queued released jump -> jumpsquat -> upward takeoff.
- The final art trace contains land_soft -> jump_squat -> takeoff_neutral with no intermediate idle. The earlier trace exposed the idle flash and prompted its removal.
- Browser trigger samples within the supported buffer window; one earlier retry missed the narrower three-frame capture window under load. The completed capture used the last five lag ticks.
- No new WAN, physical-controller or final balance signoff is claimed.

## Deliberate limits / next work
This is a project-tuned six-tick edge buffer, not full Ultimate input-buffer parity. It does not add a general hold buffer, tech/dodge/taunt queues, hitstun escape buffering or new cancel windows. Airborne attack presses retain their normal aerial behavior and are not duplicated into grounded attacks.

Next: human landing/action feel checks, then recovery and defensive cancel-transition audit. Preserve the accepted launch and ground tuning; the recently added air tuning also still needs human signoff. Broader matchup balance, real controllers, latency/jitter and atlas/device performance remain outstanding.

## Files / evidence
- packages/engine/src/physics/actionBuffer.ts and its tests
- packages/shared/src/types/GameState.ts
- apps/server/src/GameEngine.ts, MatchSession.ts and action-buffer tests
- apps/client/src/local/LocalMatch.ts
- Task output action-buffer-v1/browser-trace.json and buffered-jump.png

No environment files or Bonney content were inspected.

