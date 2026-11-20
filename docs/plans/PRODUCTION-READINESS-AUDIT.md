# Production readiness and polish audit

November 17, 2026. This review checked current plans, implementation,
production manifests and deployed revisions. It does not replace a fresh
full regression run or human playthrough.

## Assessment

Bluehost and Render both reported 7700d56, and the latest release passed.
The game has ten fighters, ten worlds, local and online play, and a Dojo.
The latest revision includes the 058f489 jump and CPU descent fixes.

No defensible overall completion percentage exists. The plans lack a
shared commercial-release acceptance matrix. Pose counts and passing
state tests do not establish smooth, consistent animation, as the recent
jump report demonstrated.

## Existing open work

| Plan | Status and remainder |
| --- | --- |
| Pack 04 and CPU corrections | Fixes are deployed. Review jump cadence and CPU descent on the public build, including repeated pursuit and interrupted movement. |
| Fighter art parity | Pack 04 pose targets and focused checks passed. Finish brief transition review across ten fighters, mixed-size paired actions and actual unique drawings. |
| Selection redesign | Loading, keyboard focus and caption fills passed deployed checks. Native Narrator speech and focus contrast against surrounding artwork remain open. |
| Loading | Quality 96 is the automatic release default. The original lineup measured 28.08 s cold and 5.73 s warm at 8 Mbps on Bluehost. Repeatable budgets and worst-case three/four-player measurements remain. |
| Gameplay and balance | Many mechanics fixtures passed. Earlier five-fighter approvals apply to their tested scope. Expand balance checks to ten fighters and newly changed behavior. |
| Ultimate timing and Star KO | Project behavior works with provisional timing. Native captures remain unavailable for collision freeze/cinematics, directional recovery, adjacent parries, mixed inputs and Star KO handoff/shrink. |
| Controller verification | Simulated profiles and earlier physical menu checks passed. Extended combat, mixed seats, reconnect and connection-method checks remain. Newer Xbox hardware does not verify Xbox 360 hardware. |
| Training Dojo | Lessons and tools exist. The exhaustive curriculum integration test still loops over only the original five fighters. Add all Pack 03/04 fighters and resolve any failures. |
| Online readiness | Targeted reconnect, pause, resume, leave and retry checks passed. Current split-host deployment still needs sustained multi-room, long-session and adverse-network evidence. |
| Stages 07-10 | Integrated and deployed. Reconcile stale deployment handoffs. Carry forward approved human checks, then review expanded-roster framing, recovery and music seams where not already accepted. |
| Documentation | Link checking and maintenance guidance exist. Current inventories and top-level statuses need reconciliation with ten fighters. Historical completed next steps must not be treated as new work. |

## Verified documentation and coverage drift

REFINEMENT.md describes five fighters and nine layouts. The active index
and animation checklist also retain five-fighter inventory statements.
Stage 10's handoff still requests deployment despite subsequent releases.

Current packaged manifest totals are listed below. Slots include repeated
drawings, aliases and previews, so these totals alone cannot certify parity.

| Pack | Fighters | Clips each | Slots each |
| --- | --- | ---: | ---: |
| Original | All-Rounder, Abe Lincoln, Swift | 137 | 763 |
| 02 | Moonshine, Hoagie | 146 | 507 |
| 03 | Mr. Wrong, Loopy, Mrs. Tasselbottom | 139 | 590 |
| 04 | Zane, Velvet | 140 | 640 |

Ten fighters create 45 unique non-mirror matchups and 90 ordered pairs.
The historical 80-throw audit covered five fighters. Applying that same
exhaustive method to ten fighters would require 360 throw cases.

## Proposed professional-polish acceptance criteria

These are proposed work items, not assertions that every area is broken.

- Define supported browsers, devices, player counts and network conditions,
  with measurable release pass conditions.
- Review jump phase boundaries, turns, landings, hits and paired actions at
  gameplay speed. Use frame captures and anchor measurements for defects.
- Expand sustained CPU scenarios for targets above, below, overlapping,
  across gaps and near ledges, at every difficulty.
- Measure frame pacing, texture memory and long-session stability on
  representative hardware. Network throttling does not measure GPU cost.
- Review sound and impact feedback. SfxManager currently exposes hit, jump,
  land, shield and KO categories. Assess swing, grab, parry and menu feedback,
  variation, mix and music seams before commissioning additional assets.
- Verify traffic handling and operational readiness. Input validation and
  reconnect credentials exist. No explicit application-level rate limiter
  was found in the reviewed server entry point. Establish appropriate load
  limits, monitoring and a tested rollback for the intended audience.
- Review all menus, HUD, results and transitions at supported sizes.
  Recent selector evidence does not certify every screen.

## Recommended order

1. Verify the deployed jump and CPU fixes and resolve reproduced defects.
2. Expand the Dojo curriculum and reachable-animation audits to all ten.
3. Finish selector speech and remaining contrast checks.
4. Run animation, CPU, frame-pacing and sound reviews against the acceptance
   matrix, fixing findings as they appear.
5. Complete expanded matchup, controller and online soak checks.
6. Rehearse a clean release, hosted smoke and rollback. Keep native Ultimate
   reference comparisons explicitly provisional until captures are available.

## Evidence and scope

This audit inspected current code and documentation and confirmed matching
public revisions. It did not rerun the full workspace suite, perform a
security penetration test or validate every animation frame.

- [Active work](ACTIVE-WORK.md)
- [Refinement](../REFINEMENT.md)
- [Selection plan](SELECTION-REDESIGN.md)
- [Pack 03/04 plan](FIGHTER-PACKS-03-04.md)
- [Animation checklist](../assets/ULTIMATE-ANIMATION-CHECKLIST.md)
- [Future fighter production guide](../assets/FIGHTER-PACK-PRODUCTION.md)
- [Deployment guide](../guides/DEPLOYMENT.md)
- [Five-fighter lesson test loop](../../apps/client/src/practice/curriculum.integration.test.ts)
- [Sound categories](../../apps/client/src/audio/SfxManager.ts)
- [Server entry point](../../apps/server/src/createApp.ts)

## Follow-up evidence

The first execution pass expanded the Dojo lesson matrix to the live
registry and passed all 410 cases. The CPU descent matrix passed for
all ten fighters in both facings, including confirmed damage after
dropping. Zane's deployed neutral jump was recorded and sampled at
50 ms intervals. The broader directional and interrupted movement,
difficulty and stage matrices remain open.

The [full-roster animation audit](../assets/FULL-ROSTER-ANIMATION-AUDIT.md)
found valid loaded crops across all ten fighters but sparse distinct
jump-phase drawings on the seven newer fighters. A Pack 03 generic
hitstun fallback defect was corrected locally and regression-tested.
The next animation pass should target actual phase transitions and
distinct drawings rather than frame-slot totals.
