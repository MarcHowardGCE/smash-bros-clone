# Full-roster animation audit

Initial audit November 17, 2026; [current movement completion](#movement-drawing-targets-completed--2026-11-20). Source of truth is each shipped production manifest,
the runtime clip filter and the renderer selection paths.

## Pixel and registration scan

Scanned loaded clips across all ten fighters. Every registered crop was
within its decoded atlas, had positive dimensions and contained visible
alpha. All roots were finite. This detects empty/cutoff rectangles, not
whether a drawn extremity was cropped from its original source art.

The initial metadata screen flagged zero-duration jump-squat slots on
the original three fighters and zero-width neutral/down-special active
windows. These conventions are used by the current timeline. They do
not establish malformed gameplay triggers on their own.

## Trigger findings

- Original and Pack 02 fighters lack a separate roll_back key. The renderer
  uses roll art and its direction when dedicated backward art is absent.
- Generic air_dodge_directional is absent or preview-only on several packs.
  Runtime directional selection uses the dedicated up/down/side/diagonal
  clips, so that generic key is not by itself a missing-animation defect.
- Pack 03 lacks generic reaction art. A HITSTUN snapshot without a specialized
  reaction cue could select that missing key and fall back to idle. The local
  renderer now selects existing hit_mid art for this case. The regression
  passed for all three Pack 03 fighters. Deployment remains pending.

## Distinct crop counts for movement

The table below is the November 17 historical baseline. See the [November 20 completion audit](#movement-drawing-targets-completed--2026-11-20) for current counts.

These count different page/rectangle references within each clip, not
semantic poses or unique pixel hashes.

| Fighters | Squat | Each directional takeoff | Rise | Apex | Fall | Fast fall | Double jump | Soft landing | Heavy landing |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Original three | inspect timing separately | 6 | 6 | 6 | 6 | inspect separately | 6 | inspect separately | inspect separately |
| Moonshine | 3 | 3 | 6 | 6 | 6 | 6 | 6 | 6 | 6 |
| Hoagie | 3 | 3 | 6 | 6 | 6 | 6 | 6 | 6 | 6 |
| Pack 03 three | 2 | 2 | 2 | 2 | 2 | 3 | 3 | 3 | 3 |
| Zane | 3 | 3 | 6 | 6 | 6 | 6 | 6 | 6 | 6 |
| Velvet | 3 | 3 | 6 | 6 | 6 | 6 | 6 | 6 | 6 |

This is a remaining movement-polish gap despite earlier slot-count parity
milestones. Add distinct transition drawings where gameplay footage shows
a visible jump between endpoints. Preserve intentional short holds and
authoritative movement timings. Avoid increasing counts by repeating crops.

## Validation

Before the reaction correction, all 86 tests in the full-body renderer
directory passed. After correction, all 19 movement-presentation tests
passed, including the new cue-free hitstun regression. The crop scan passed
for all loaded fighters. These checks do not certify every gameplay path
or eliminate the need to inspect animation in motion.

## Next drawing and review sequence

1. Review and repair Pack 04 neutral, forward and backward takeoff, rise,
   apex, fall and double-jump boundaries using shipped costumes and scale.
   Review one pose against the approved model before producing a batch.
2. Apply the same review to Pack 02 and Pack 03. Inspect torso/pelvis anchors,
   silhouette changes, facing, alpha edges and landing contact.
3. Extend live fallback traces to rare interruptions and paired state changes
   across the ten-fighter roster, then review damage and defensive transitions.

## Zane rise drawing review — 2026-11-17

Created a representative intermediate rise drawing against Zane's shipped
idle and airborne references. Visual review found the jacket, waistcoat,
chain, trousers and cream-laced boots consistent with those references.
The pose was inspected against light and dark backgrounds.

The initial source is `concept-art/sprite/pack-04/zane-corvo-rise-between-v1.png`.
Its alpha scan found 650 nonzero pixels farther than four pixels from an
alpha-128 silhouette, with maximum opacity 5/255. A transparency-only edit,
`concept-art/sprite/pack-04/zane-corvo-rise-between-clean-v1.png`, increased
that count to 3,328, although maximum opacity fell to 3/255. Reject the
edited candidate for production. Neither drawing is registered in the
atlas; neither changes shipped gameplay or closes a pose-parity target.

Before registration, remove detached alpha through the established asset
preparation workflow and recheck composites, then compare head/torso scale
and the pelvis anchor with both existing rise endpoints. Preserve the
current ten-tick rise presentation and verify both facings in the Dojo.
Do not treat a visually clear checkerboard preview as proof of clean alpha,
or count a generated source as a shipped animation.

## Zane rise preparation and Dojo verification — 2026-11-17

Registered the initial drawing through reproducible alpha preparation in
`build-pack-04-pilot.mjs`; the rejected generated cleanup remains unused.
The builder zeros only RGBA pixels at opacity 5/255 or below. It removed
11,154 faint pixels without redrawing the costume or changing stronger
edge pixels. A repeat scan of the prepared crop found zero nonzero pixels
farther than four pixels from the alpha-128 silhouette.

The prepared crop is 727 by 1,169 pixels, scaled by 82/1169
(0.0701454234). Head and torso scale were compared with both shipped rise
endpoints on a common review board. The existing center-of-body airborne
anchor remains in use. Zane's rise now uses three distinct drawings with
durations [3, 3, 4], preserving its ten-tick presentation. Velvet is
unchanged. Source and production manifests are revision 105; production
atlases were rebuilt successfully (four live pages, 9,695,654 bytes).

Local Chromium Dojo verification passed:

- Held neutral jump: all three production crop rectangles play in order
  once in each facing, remain visible, and return to the floor.
- Existing jump, double-jump, apex, fall, fast-fall and landing checks:
  Zane and Velvet passed in both facings (two tests).
- Renderer movement regressions: 19 passed.

A first short-hop probe reached apex before the final rise drawing. The
full-rise assertion therefore uses held Jump; it does not stretch the
short-hop ascent to force all drawings to appear. Inspecting the six
captured Dojo poses found no halo, costume change, or abrupt size swap.
[Both-facing Dojo captures](reviews/zane-rise-both-facings-2026-11-17.png).
This is local verification, not deployed or human feel signoff. It adds
one Zane rise drawing, not full roster movement parity.

Next: inspect Zane's rise-to-apex-to-fall boundary and directional takeoffs,
then apply the same source, scale and live-playback checks to Velvet before
expanding further movement drawings.

## Zane phase and directional takeoff review — 2026-11-17

Added a live Dojo trace for held neutral and forward jumps in both
facings: four keyboard-driven cases. Each passed takeoff, rise, apex,
fall and grounded return with visible sprite art. During rise, apex and
fall the drawn root stayed at the simulation position (zero x/y offset).
Reviewed the captured phase drawings in both facings for costume and
scale continuity. No new origin snap, missing drawing or polygon fallback
was found in these cases; no additional renderer change was made.

[Phase review board](reviews/zane-phase-handoffs-2026-11-17.png): rows are
left-neutral, left-forward, right-neutral, right-forward; columns are
first takeoff, rise, apex and fall drawings. These are live Dojo screenshots
from frame stepping, not a claim of human gameplay-speed approval.

An initial attempt to request drift only after Jump correctly emitted a
neutral takeoff. Forward coverage was corrected to establish movement
before Jump. Backward coverage is explicitly narrower: a separate browser
renderer fixture loads the production textures and drives the authored
backward cue in both facings. It passed takeoff ticks 0–5, rise at tick 6,
apex at tick 24, fall at tick 30, finite transforms and zero root offsets
from tick 5 onward. This fixture does not certify that a keyboard sequence
naturally triggers backward takeoff or establish its native Ultimate parity.
Both new browser tests passed locally in Chromium DPR 1.

Next: review Velvet's movement boundaries using the same live neutral and
forward traces, and establish a reproducible live backward-takeoff input
sequence before claiming that path verified for either fighter. Remaining
pose-count and rare-interruption work stays open in this audit.

## Velvet handoffs and live backward takeoffs — 2026-11-17

Closed the prior live backward-input verification gap. The Dojo regression
now runs both Zane and Velvet through neutral, forward and backward full
jumps in each facing: twelve keyboard-driven cases in two passing local
Chromium DPR-1 tests. No player state or velocity is injected.

Reproducible backward sequence, using frame step:

1. Reset the arena, establish the intended facing, then release direction
   and step twelve ticks to settle.
2. Hold the opposite direction for four ticks to build approach momentum.
3. Press and hold Jump, step once, release the approach direction, and hold
   the intended facing direction during jump squat. Step once more.
4. Continue stepping. On the first takeoff tick the authoritative cue is
   `takeoff_backward` at age zero and vx multiplied by facing is below -0.5.
5. Release Jump and direction fourteen trace ticks later, then follow rise,
   apex, fall and grounded return. Facing remains the intended direction.

Forward takeoff separately requires signed velocity above 0.5 on its first
cue tick. All twelve cases retained visible sprite artwork. All rise,
apex and fall samples had zero drawn-root offset from the simulated player.
Captured every distinct texture rectangle and phase change, then inspected
Velvet's six sequences and both fighters' backward boundary pairs. No new
position snap, abrupt costume/scale substitution, or polygon fallback was
found, so this pass did not change art, physics or renderer behavior.
The artwork still changes poses discretely; these results do not certify
full pose-count parity or native Ultimate timing.

Evidence:

- [Velvet live phase review](reviews/velvet-live-handoffs-2026-11-17.png):
  rows left-neutral, left-forward, left-backward, right-neutral,
  right-forward, right-backward; columns takeoff, rise, apex, fall.
- [Velvet backward boundaries](reviews/velvet-backward-boundaries-2026-11-17.png).
- [Zane backward boundaries](reviews/zane-backward-boundaries-2026-11-17.png).

Boundary boards show last takeoff, first rise, last rise, first apex,
last apex and first fall, with left-facing above right-facing. These are
local frame-stepped Dojo captures; human gameplay-speed approval and
hosted verification are not implied. The prior scripted backward fixture
is retained as a narrower regression, but live coverage now supersedes its
previous input-trigger limitation.

Next: review double-jump and fast-fall interruptions for both Pack 04
fighters, especially transitions out of a partially played rise/apex
sequence and the first grounded landing pose. Keep the broader distinct
movement drawing gaps separate from this completed handoff review.

## Pack 04 interrupted jumps and landing fix — 2026-11-17

Found and fixed an airborne registration bug shared by Zane and Velvet.
On entering `double_jump_transition`, the renderer used the drawing's
foot root and added the grounded 28-unit radius offset. The new live Dojo
checks failed for both fighters with bodyY minus simulation y equal to
28 instead of zero. Double-jump transition now uses the same proportional
airborne root and zero position offset as rise, apex, fall and fast-fall.
This is a presentation change; jump physics, input timing and source
artwork are unchanged.

Verified eight keyboard-driven local Dojo cases: both fighters, both
facings, with a fresh double jump interrupting either the first rise
phase or apex. Every case passed immediate double-jump selection, zero
x/y root offset, continued visible artwork and facing, rejected early
fast-fall during upward travel, accepted fresh Down at nonnegative vy,
fast-fall art, and the first grounded landing pose with fast-fall cleared.
Reviewed the before-interruption, double-jump, fast-fall and first-landing
captures without finding a further scale/costume substitution or fallback.

- [Zane interruption and landing captures](reviews/zane-interruption-landing-2026-11-17.png).
- [Velvet interruption and landing captures](reviews/velvet-interruption-landing-2026-11-17.png).

For each board the rows are left-rise, left-apex, right-rise, right-apex;
columns are before interruption, first double-jump drawing, fast-fall
activation and first grounded landing. Camera position changes between
captures; these are frame-stepped local evidence, not native Ultimate
comparison or human gameplay-speed signoff.

Validation after the fix: both interruption browser tests passed (eight
cases), both existing jump-to-fast-fall Dojo tests passed, the soft/heavy
landing sole-alignment browser test passed, all 20 movement-presentation
unit tests passed, and client type checking passed. The unit regression
covers rise to double-jump to rise for both fighters and facings.

Next: review aerial-attack and air-dodge interruptions out of these airborne
phases, including their return to ordinary fall and landing. Distinct
movement drawing gaps and the broader roster audit remain open. This
fix and evidence are local and have not been deployed.

## Pack 04 aerial and dodge interruption review — 2026-11-17

Extended the live Dojo handoff matrix to all five aerial attacks (neutral,
forward, back, up and down), neutral air dodge and downward air dodge.
Both fighters, both facings and rise/apex starts give 56 keyboard-driven
cases in two passing local Chromium DPR-1 tests. Each case checks the
initial action clip, visible artwork, retained facing, zero drawn-root
x/y offset on every airborne sample, first landing art and eventual return
to grounded IDLE. These are natural jumps with no position or state injection.

Each fighter returned to normal fall in 12 cases: all five aerials begun
in rise in both facings, plus apex up-air in both facings. The other 16
cases landed directly from action recovery. First landing art must be
land_soft, land_heavy or air_dodge_land; a leftover aerial/dodge clip fails
the check. Every case reached the ground and subsequently unlocked IDLE.
The matrix does not require an artificial fall frame when landing happens
before action recovery ends.

Reviewed representative screenshots of every action, drawn from both
facings and both start phases. No additional anchor snap, costume/scale
substitution or polygon fallback was found. No renderer, physics or artwork
change was needed in this pass. The previous double-jump registration fix
remains in place.

- [Zane aerial and dodge review](reviews/zane-aerial-dodge-handoffs-2026-11-17.png).
- [Velvet aerial and dodge review](reviews/velvet-aerial-dodge-handoffs-2026-11-17.png).

Boards show neutral air, forward air, back air, up air, down air, neutral
dodge and down dodge, from top to bottom. Even-numbered zero-based rows
use right-facing rise starts; odd rows use left-facing apex starts.
Columns show before interruption, first action drawing, first fall when
present, and first landing. Where there was no fall phase, the third
column deliberately repeats the landing screenshot. Full tests cover all
56 cases; the boards are representative visual evidence, not every pose
or native Ultimate/gameplay-speed approval.

Next: apply the movement and interruption review to Packs 02 and 03,
starting with double-jump registration and landing handoffs. Full distinct
movement-drawing parity remains open; Zane's rise count in the current
inventory is now three, while Velvet's remains two. Changes and evidence
remain local; this pass does not claim deployment or full roster signoff.

## Pack 02 and 03 interruption and landing review — 2026-11-17

Expanded the live interruption matrix to Moonshine, Hulk Hoagie,
Mr. Wrong, Loopy and Mrs. Tasselbottom. Twenty double-jump cases covered
rise/apex interruptions, both facings, fast-fall eligibility and the first
landing. All passed. The same run also rechecked the eight Pack 04 cases.
The five newcomers additionally passed 140 aerial-attack/dodge cases:
five aerials plus neutral/downward dodge, both facings and both start phases.
All retained their artwork, facing and registration through grounded IDLE.
Pack 02 uses its authored guided-pelvis/root-offset convention, so its
checks preserve the pre-interruption offset rather than imposing Pack 04's
zero-offset convention. Pack 03 and 04 continue to require zero offsets.

| Fighter | Aerial/dodge cases | Returned to normal fall | Landed directly from recovery |
| --- | ---: | ---: | ---: |
| Moonshine | 28 | 16 | 12 |
| Hulk Hoagie | 28 | 10 | 18 |
| Mr. Wrong | 28 | 12 | 16 |
| Loopy | 28 | 14 | 14 |
| Mrs. Tasselbottom | 28 | 2 | 26 |

Visual inspection caught a separate defect that body-origin checks did
not detect: the first soft-landing drawing floated above the ground by
4.8654 world units for Moonshine and approximately 7 for Hoagie. It used
the next drawing's shared baseline although it was already grounded.
A new production-texture browser fixture reproduced the Moonshine failure
at tick zero. Corrected each first land_soft drawing to its own sole line,
preserving its horizontal root, art, timing and all other frames. Checked
both landing clips across ages 0–12 in both facings for all five fighters,
with a 1.5-world-unit tolerance for crop padding. The fixture now passes.
Both affected fighters' eight live jump/fast-fall/landing cases were rerun
and passed against the final corrected production manifest.

The legacy Pack 02 base builder does not reproduce the newer expanded
source manifest. Its initial rebuild was discarded after the diff revealed
unrelated pose losses. Preserved the expanded revision-73 manifest and all
four existing atlas pages, applied the two-frame correction using the
idempotent `fix-newcomer-landing-roots.mjs`, and rebuilt production metadata
at revision 74. The final pack retains 1,014 packed frame slots; atlas
image bytes are unchanged. A second correction run reports changed:false.
The base builder's own landing calculation was also corrected for future
isolated reviews; it must not overwrite the expanded production manifest.

Evidence:

- [Pack 02 corrected jump/landing review](reviews/pack-02-jump-landing-2026-11-17.png).
- [Pack 03 jump/landing review](reviews/pack-03-jump-landing-2026-11-17.png).
- [Initial aerial/dodge review](reviews/pack-02-03-aerial-handoffs-2026-11-17.png),
  captured before the two soft-landing registrations were corrected.

Jump boards show each fighter's left-rise then right-apex case, with
columns before, double jump, fast-fall and first landing. The aerial board
shows representative neutral-air, back-air, up-air, neutral-dodge and
down-dodge cases in roster order. Its third column repeats landing where
there was no fall phase. These are representative frame-stepped local
captures, not full-pose or native Ultimate signoff. The 140-case matrix
passed before the landing metadata correction; the focused landing fixture
and affected live jump sequences passed afterward.

Next: return to the distinct movement drawing gaps in the inventory,
starting with Velvet's missing rise in-between using her shipped costume.
Do not repeat this handoff matrix without a relevant change or failure.
The fixes remain local and are not deployed.

## Velvet rise in-between integrated — 2026-11-17

Created one intermediate rise drawing using Velvet's shipped idle as the
identity/costume reference and the two existing rise endpoints as pose
references. The pose bends the trailing knee toward the existing two-knee
tuck. Reviewed her face, beauty mark, copper hair, fishnet/crossed straps,
gold-piped flared jumpsuit and silver belt/cuffs/hoops against those sources.
[Source drawing](../../concept-art/sprite/pack-04/velvet-reply-rise-between-v1.png)
and [exact generation prompt and references](../../concept-art/sprite/pack-04/velvet-reply-rise-between-v1.prompt.json)
are saved in the repository. Used built-in image generation, one candidate.

Preparation removed 17,463 nonzero alpha pixels at opacity 5/255 or below;
stronger ink and antialiasing were unchanged. The original source remains
untouched. Both the prepared comparison and final registered crop passed
the detached-alpha scan: zero nonzero pixels farther than four pixels from
the alpha-128 silhouette. Inspected on [light](reviews/velvet-rise-scale-light-2026-11-17.png)
and [dark](reviews/velvet-rise-scale-dark-2026-11-17.png) backgrounds.

The initial same-height comparison made the intermediate head/torso too
large. Accepted a 70-world-unit pose height after comparison with both
endpoints. Final crop is 773 by 1,208 pixels, scale 70/1208
(0.0579470199). The shorter total silhouette reflects the bending trailing
leg; it does not use the straight-leg pose's overall height as a size rule.
The existing airborne anchor convention remains in effect.

Both Pack 04 rises now contain three distinct drawings with [3, 3, 4]
timing, retaining the ten-tick duration. Source and production revisions
are 106; packed frame count is 1,282 and the four-page count is unchanged.
Download size is 9,712,490 bytes, 16,836 bytes more than revision 105.
[Both-facing live Dojo captures](reviews/velvet-rise-both-facings-2026-11-17.png)
show the three rise drawings in order, left-facing above right-facing.

Four local Chromium DPR-1 browser tests passed: both fighters' three-pose
rise order and grounded return, Velvet's six neutral/forward/backward
jump paths, and her four rise/apex double-jump/fast-fall/landing cases.
Reviewed the live rise captures for scale and costume continuity; found
no halo or polygon fallback. This is local frame-stepped verification,
not native Ultimate parity or hosted/human gameplay-speed signoff.

Next: use the distinct-drawing inventory to prioritize apex/fall
in-betweens, beginning with Pack 04. Both rise clips now have three
unique crops, which is still below the original fighters' six; this pass
closes one drawing gap and does not claim complete roster animation parity.

## Zane apex and fall in-betweens integrated — 2026-11-17

Added two distinct drawings, one halfway from the tucked apex to extended
legs and one from open-handed descent to the guarded fall. Used the shipped
idle as identity/costume reference and the adjacent gameplay poses only for
motion. Reviewed the apex drawing before generating the fall drawing.
Both preserve the leather jacket/waistcoat, silver hardware and chain,
dark trousers, cream-laced boots, face and hair.

- Apex [source](../../concept-art/sprite/pack-04/zane-corvo-apex-between-v1.png),
  [exact prompt/references](../../concept-art/sprite/pack-04/zane-corvo-apex-between-v1.prompt.json),
  [light comparison](reviews/zane-apex-light-2026-11-17.png),
  [dark comparison](reviews/zane-apex-dark-2026-11-17.png).
- Fall [source](../../concept-art/sprite/pack-04/zane-corvo-fall-between-v1.png),
  [exact prompt/references](../../concept-art/sprite/pack-04/zane-corvo-fall-between-v1.prompt.json),
  [light comparison](reviews/zane-fall-light-2026-11-17.png),
  [dark comparison](reviews/zane-fall-dark-2026-11-17.png).

Used built-in image generation, one candidate per drawing. Preparation
cleared nonzero alpha at opacity 5/255 or below: 16,319 pixels for apex and
13,064 for fall. Both prepared comparisons had zero detached nonzero alpha
farther than four pixels from the alpha-128 silhouette. Sources are retained
untouched. Final apex crop is 948 by 1,370, scaled to 74 world units high;
fall is 679 by 1,416, scaled to 82. Compared head and torso scale with both
adjacent endpoints before accepting those sizes.

Zane now has three distinct drawings each for rise, apex and fall. Apex
uses [2, 2, 6], preserving its ten-tick total while displaying all three
poses during the six-tick ordinary apex window. Fall uses [4, 4, 4],
preserving its twelve-tick total. Both phases still advance once and hold
the final drawing; physics, authoritative phase thresholds and airborne
registration are unchanged. Velvet's apex/fall clips are unchanged.

Production revision 107 retains four pages and has 1,284 packed slots.
Download size is 9,741,304 bytes, an increase of 28,814 from revision 106.
Five local Chromium DPR-1 browser tests passed, covering both fighters'
full rise/apex/fall pose order in both facings, Zane's six directional
jumps, his four double-jump/fast-fall interruptions, and two normal-speed
jumps (16 jump paths total). The normal-speed requestAnimationFrame trace
observed all three apex and all three fall crops in order in each facing.
No skipped drawing, phase restart, invisible art or wrong landing was found.

[Both-facing Dojo pose board](reviews/zane-apex-fall-both-facings-2026-11-17.png)
shows apex drawings 1–3 then fall drawings 1–3, left-facing above right.
[Recorded normal-speed playback](reviews/zane-apex-fall-normal-speed-2026-11-17.webm)
is saved for review. These are local game checks, not version-matched
Ultimate comparison or deployment signoff.

Next: add Velvet's apex and fall in-betweens with the same shipped-costume,
alpha, scale and live-window checks. Three poses per phase is an incremental
improvement; the six-drawing benchmark is not yet met. Preserve that
remaining gap in the inventory rather than closing movement parity early.

## Velvet apex and fall in-betweens integrated — 2026-11-18

Added one distinct apex and one fall drawing using Velvet's shipped idle
identity and adjacent gameplay poses. Reviewed the apex before generating
the fall pose. Checked her face/beauty mark, copper hair, fishnet/crossed
straps, gold-piped flared jumpsuit, silver belt/cuffs/hoops and heeled boots
against the shipped design. Used built-in image generation, one candidate
per pose, with exact prompts saved for reuse.

- Apex [source](../../concept-art/sprite/pack-04/velvet-reply-apex-between-v1.png),
  [prompt/identity/pose references](../../concept-art/sprite/pack-04/velvet-reply-apex-between-v1.prompt.json),
  [light](reviews/velvet-apex-light-2026-11-18.png) and
  [dark](reviews/velvet-apex-dark-2026-11-18.png) comparisons.
- Fall [source](../../concept-art/sprite/pack-04/velvet-reply-fall-between-v1.png),
  [prompt/identity/pose references](../../concept-art/sprite/pack-04/velvet-reply-fall-between-v1.prompt.json),
  [light](reviews/velvet-fall-light-2026-11-18.png) and
  [dark](reviews/velvet-fall-dark-2026-11-18.png) comparisons.

Preparation cleared 20,278 faint nonzero alpha pixels for apex and 23,181
for fall at opacity 5/255 or below. The originals are retained. Both
prepared comparisons passed the detached-alpha scan with zero nonzero
pixels farther than four pixels from the alpha-128 silhouette. Do not use
the raw generated preview as the production transparency check.
Final apex crop is 861 by 1,446 at scale 74/1446; fall is 715 by 1,622 at
82/1622. Compared head and torso size with both endpoints before accepting.

Both Pack 04 fighters now have three distinct drawings each for rise,
apex and fall. Velvet's apex uses [2, 2, 6] and fall [4, 4, 4], retaining
the ten/twelve-tick totals. All three apex drawings fit inside the live
ordinary apex window. Physics and root conventions are unchanged.
Pack 04 revision 108 has 1,286 packed slots, still four atlas pages,
and 9,774,040 download bytes, 32,736 more than revision 107.

Six local Chromium DPR-1 browser tests passed: both fighters' complete
rise/apex/fall pose order in both facings, Velvet's six directional jump
paths, her four double-jump/fast-fall interruptions, and both fighters'
two-facing normal-speed playback. This covers 18 jump paths. The real-time
RAF traces observed all three apex and fall drawings in order, without
invisible art or a missed pose, and returned to grounded idle.

[Both-facing Velvet Dojo board](reviews/velvet-apex-fall-both-facings-2026-11-18.png)
shows three apex then three fall drawings, left-facing above right-facing.
[Normal-speed recording](reviews/velvet-apex-fall-normal-speed-2026-11-18.webm)
is saved alongside it. Reviewed the captured poses for scale and costume
continuity. These remain local game checks, not deployed verification or
version-matched Ultimate timing evidence.

Next concrete drawing target: finish Zane's rise from three to six distinct
drawings, adding three correctly scaled intermediate drawings and verifying
each appears within the existing rise duration. Then apply that completed
six-pose approach to Velvet. The current three-pose checkpoints reduce
visible gaps but do not close full six-drawing movement parity.

## Zane six-drawing rise completed — 2026-11-18

Added three distinct rise drawings: an early trailing-leg bend, the late
knee lift and a settling pose before the final two-knee tuck. Reviewed the
first candidate before continuing, then checked all three against shipped
identity/wardrobe and the existing neighboring rise poses. Each passed
light/dark background inspection and a detached-alpha scan after the
standard opacity-at-most-5 preparation. No stronger ink was changed.

| New step | Final crop | Accepted world height | Faint pixels cleared | Detached residue after preparation |
| --- | --- | ---: | ---: | ---: |
| Early | 825 × 1,507 | 82 | 14,106 | 0 |
| Late | 886 × 1,294 | 76 | 17,069 | 0 |
| Settle | 898 × 1,329 | 70 | 16,749 | 0 |

Original sources, generated with the built-in image tool, and exact prompts:

- [Early source](../../concept-art/sprite/pack-04/zane-corvo-rise-early-between-v1.png)
  · [prompt/reference record](../../concept-art/sprite/pack-04/zane-corvo-rise-early-between-v1.prompt.json).
- [Late source](../../concept-art/sprite/pack-04/zane-corvo-rise-late-between-v1.png)
  · [prompt/reference record](../../concept-art/sprite/pack-04/zane-corvo-rise-late-between-v1.prompt.json).
- [Settle source](../../concept-art/sprite/pack-04/zane-corvo-rise-settle-between-v1.png)
  · [prompt/reference record](../../concept-art/sprite/pack-04/zane-corvo-rise-settle-between-v1.prompt.json).

The sequence is existing leading-knee pose, new early, existing midpoint,
new late, new settle and existing final tuck. All six source RGBA crops
have different pixel hashes, and visual inspection confirms distinct poses
rather than repeated slots. The falling total silhouette follows the legs
folding inward; head and torso scale were matched separately.

The initial ten-tick layout [2, 1, 2, 1, 2, 2] passed frame stepping but
failed normal-speed verification: the two one-tick in-betweens were absent
from the requestAnimationFrame trace. Revised the visual sequence to
[2, 2, 2, 2, 2, 2]. Its total is now twelve visual ticks instead of ten.
This is a deliberate presentation-duration change, not a change to jump
physics, rise/apex velocity thresholds, input buffering, jump height or
landing timing. Ordinary full-rise playback has enough time to show all
six; a short hop or interruption still exits naturally. The renderer
continues to advance once and hold the final pose.

After the timing revision, five local Chromium DPR-1 tests passed: both
fighters' complete rise/apex/fall crop order in both facings; Zane's six
directional jump paths; his four interrupted rise/apex-to-double-jump,
fast-fall and landing paths; and his two normal-speed jumps. Normal-speed
traces observed all six rise drawings in order in each facing. There were
no phase restarts, invisible art or incorrect grounded returns in those
cases. Do not treat the failed initial timing as a passing result.

[Six-pose Dojo board](reviews/zane-six-rise-both-facings-2026-11-18.png)
shows left-facing above right-facing, poses 1–6 from left to right.
[Normal-speed recording](reviews/zane-six-rise-normal-speed-2026-11-18.webm)
is retained. Scale/alpha comparisons:
[early light](reviews/zane-rise-early-light-2026-11-18.png),
[early dark](reviews/zane-rise-early-dark-2026-11-18.png),
[late light](reviews/zane-rise-late-light-2026-11-18.png),
[late dark](reviews/zane-rise-late-dark-2026-11-18.png),
[settle light](reviews/zane-rise-settle-light-2026-11-18.png),
[settle dark](reviews/zane-rise-settle-dark-2026-11-18.png).

Pack 04 revision 109 has 1,289 packed slots and still four atlas pages.
Both source characters retain 140 clip keys. Page recompression/repacking
resulted in 9,637,178 download bytes (136,862 fewer than revision 108),
without removing drawings. These are local results, not hosted or native
Ultimate timing verification.

Zane's rise now meets the six-distinct-drawing benchmark. Next finish
Velvet's rise from three to six with the same identity/alpha/scale and
normal-speed checks. Apex, fall and the other movement inventory gaps
remain separate; completing this one clip does not close full roster parity.

## Velvet six-drawing rise completed — 2026-11-18

Added three distinct drawings to Velvet's rise: early trailing-leg bend,
late knee lift and the final settling step into the two-knee tuck. Reviewed
one representative pose first, then the remaining candidates against the
shipped idle and existing rise poses. Preserved copper hair, cheek mark,
face, fishnet/crossed straps, gold-piped flared jumpsuit, silver hardware
and heeled boots. One built-in image-generation candidate per drawing.

| New step | Final crop | Accepted world height | Faint pixels cleared | Detached residue after preparation |
| --- | --- | ---: | ---: | ---: |
| Early | 924 × 1,505 | 76 | 21,982 | 0 |
| Late | 919 × 1,393 | 68 | 18,012 | 0 |
| Settle | 965 × 1,391 | 65.5 | 16,312 | 0 |

Sources and exact generation context:

- [Early source](../../concept-art/sprite/pack-04/velvet-reply-rise-early-between-v1.png)
  · [prompt/reference record](../../concept-art/sprite/pack-04/velvet-reply-rise-early-between-v1.prompt.json).
- [Late source](../../concept-art/sprite/pack-04/velvet-reply-rise-late-between-v1.png)
  · [prompt/reference record](../../concept-art/sprite/pack-04/velvet-reply-rise-late-between-v1.prompt.json).
- [Settle source](../../concept-art/sprite/pack-04/velvet-reply-rise-settle-between-v1.png)
  · [prompt/reference record](../../concept-art/sprite/pack-04/velvet-reply-rise-settle-between-v1.prompt.json).

Preparation zeros RGBA only at alpha 5/255 or lower and preserves the raw
sources. After preparation, all three scans found zero nonzero pixels
farther than four pixels from the alpha-128 silhouette. Inspected every
candidate on light and dark backgrounds and matched head/torso size
independently from the leg-dependent overall height.

Velvet's sequence now has six visually distinct drawings and six different
RGBA crop hashes. It uses [2, 2, 2, 2, 2, 2], matching Zane's twelve-tick
visual rise. This extends her former ten-tick presentation by two ticks;
jump physics, jump height, velocity phase thresholds, input timing and
landing rules are unchanged. Both Pack 04 rise clips now meet the
six-drawing benchmark. Short hops and interruptions still leave the phase
naturally; do not force completion of every drawing when the motion ends.

Six local Chromium DPR-1 tests passed: both fighters' complete rise/apex/
fall order in both facings, Velvet's six directional jumps, her four
rise/apex double-jump/fast-fall/landing paths, and both fighters' normal-speed
jumps in both facings. All six rise drawings appeared in order at 1x for
both fighters, with no replay of an earlier phase. Source manifests retain
140 clip keys per fighter. Production revision 110 has 1,292 packed slots,
four pages and 9,688,998 download bytes (51,820 more than revision 109).

[Six-pose Dojo board](reviews/velvet-six-rise-both-facings-2026-11-18.png)
shows left-facing above right-facing, poses 1–6 left to right.
[Normal-speed recording](reviews/velvet-six-rise-normal-speed-2026-11-18.webm).
Scale/alpha review:
[early light](reviews/velvet-rise-early-light-2026-11-18.png),
[early dark](reviews/velvet-rise-early-dark-2026-11-18.png),
[late light](reviews/velvet-rise-late-light-2026-11-18.png),
[late dark](reviews/velvet-rise-late-dark-2026-11-18.png),
[settle light](reviews/velvet-rise-settle-light-2026-11-18.png),
[settle dark](reviews/velvet-rise-settle-dark-2026-11-18.png).

Next concrete drawing target: finish Zane's fall from three to six distinct
drawings within its existing twelve-tick presentation, then Velvet's fall.
Before expanding apex to six, account for its shorter ordinary live window:
six two-tick holds cannot fit inside the current six-tick apex phase.
Resolve that presentation-window/cadence constraint before spending on
additional apex drawings. Full movement parity remains open. These are
local results and have not been deployed or certified against native
Ultimate footage.

## Zane six-drawing fall completed — 2026-11-18

Added three distinct fall drawings between the open-handed descent,
existing midpoint and final guard. The first early draft was too close
to the existing midpoint and was rejected rather than counted. A targeted
pose edit moved its arms outward and trailing boot forward; accepted v2
now bridges the open start to the midpoint. Late and settling drawings
progressively curl the hands and bring the boots toward the guarded hold.
All accepted poses retain the shipped face, hair, leather jacket/waistcoat,
silver hardware/chain, dark trousers and cream-laced boots.

| Accepted step | Final crop | World height | Faint pixels cleared | Detached residue after preparation |
| --- | --- | ---: | ---: | ---: |
| Early v2 | 946 × 1,410 | 82 | 17,070 | 0 |
| Late v1 | 729 × 1,753 | 82 | 14,484 | 0 |
| Settle v1 | 640 × 1,648 | 82 | 14,410 | 0 |

Sources and generation context (built-in image tool; four candidates,
three accepted):

- [Accepted early source](../../concept-art/sprite/pack-04/zane-corvo-fall-early-between-v2.png)
  · [edit prompt/reference record](../../concept-art/sprite/pack-04/zane-corvo-fall-early-between-v2.prompt.json).
- [Rejected early draft](../../concept-art/sprite/pack-04/zane-corvo-fall-early-between-v1.png)
  · [rejection/prompt record](../../concept-art/sprite/pack-04/zane-corvo-fall-early-between-v1.prompt.json).
  This draft is not referenced by either atlas manifest.
- [Late source](../../concept-art/sprite/pack-04/zane-corvo-fall-late-between-v1.png)
  · [prompt/reference record](../../concept-art/sprite/pack-04/zane-corvo-fall-late-between-v1.prompt.json).
- [Settle source](../../concept-art/sprite/pack-04/zane-corvo-fall-settle-between-v1.png)
  · [prompt/reference record](../../concept-art/sprite/pack-04/zane-corvo-fall-settle-between-v1.prompt.json).

Preparation preserves the originals and zeros alpha 5/255 or lower.
Late additionally had five detached gray pixels at (408–410, 347–348),
alpha 6–16, farther than four pixels from solid ink. Removed only that
low-alpha detached speck; nearby antialiasing and stronger ink remain.
The source builder supports the accepted early v2 explicitly, so rebuilding
does not silently substitute the rejected v1. All three pass the prepared
alpha scan and light/dark review.

The fall now has six distinct source crop hashes and six reviewed poses.
It uses [2, 2, 2, 2, 2, 2], preserving the original twelve-tick total and
its advance-once/final-hold behavior. No change to physics, input timing,
phase thresholds, airborne anchors or landing rules.

Six local Chromium DPR-1 browser tests passed: both fighters' full rise/
apex/fall crop order in both facings, Zane's six directional jump paths,
his four interrupted double-jump/fast-fall/landing paths, and both fighters'
normal-speed jumps in both facings. Zane's six fall drawings appeared in
order at 1x in each facing, without skipped drawings or a phase restart.

[Six-pose Dojo board](reviews/zane-six-fall-both-facings-2026-11-18.png)
shows left-facing above right-facing, poses 1–6 left to right.
[Normal-speed recording](reviews/zane-six-fall-normal-speed-2026-11-18.webm).
Scale/alpha comparisons:
[early light](reviews/zane-fall-early-light-2026-11-18.png),
[early dark](reviews/zane-fall-early-dark-2026-11-18.png),
[late light](reviews/zane-fall-late-light-2026-11-18.png),
[late dark](reviews/zane-fall-late-dark-2026-11-18.png),
[settle light](reviews/zane-fall-settle-light-2026-11-18.png),
[settle dark](reviews/zane-fall-settle-dark-2026-11-18.png).

Pack 04 revision 111 retains 140 source clip keys per fighter and four
atlas pages, with 1,295 packed slots. Download size is 9,972,414 bytes,
283,416 more than revision 110. Local verification only; no deployment or
native Ultimate timing signoff is implied.

Next: finish Velvet's fall from three to six distinct drawings within its
twelve-tick total. Both rise clips and Zane's fall now meet the six-drawing
benchmark; apex and other movement gaps remain open. Resolve the short
apex presentation-window constraint before generating its remaining poses.

## Velvet six-drawing fall completed — 2026-11-18

Added early, late and settle fall drawings using the shipped idle costume.
Reviewed the silhouettes against the adjacent shipped poses: silver accessories,
fishnet and crossed straps, plum flared jumpsuit and heeled boots remain consistent.
Sources and exact built-in image-generation prompts are preserved together:

- [Early source](../../concept-art/sprite/pack-04/velvet-reply-fall-early-between-v1.png) · [prompt](../../concept-art/sprite/pack-04/velvet-reply-fall-early-between-v1.prompt.json).
- [Late source](../../concept-art/sprite/pack-04/velvet-reply-fall-late-between-v1.png) · [prompt](../../concept-art/sprite/pack-04/velvet-reply-fall-late-between-v1.prompt.json).
- [Settle source](../../concept-art/sprite/pack-04/velvet-reply-fall-settle-between-v1.png) · [prompt](../../concept-art/sprite/pack-04/velvet-reply-fall-settle-between-v1.prompt.json).

Preparation preserves source files, clears alpha 5/255 or lower, and removes
one detached alpha-6 pixel in settle, farther than four pixels from solid ink.
Early and late have zero detached residual pixels after the alpha floor.
All new frames use 82 world-unit height. Six distinct source crops are packed;
fall remains twelve visual ticks, now six two-tick holds. Physics and input
windows are unchanged.

Six local Chromium DPR-1 Dojo tests passed: both fighters' prepared air poses,
Velvet's directional takeoffs and interrupted jumps through first landing,
and both fighters' normal-speed airborne playback. All six fall drawings
appear in order in both facings at 1x.
[Both-facing captured poses](reviews/velvet-six-fall-both-facings-2026-11-18.png)
· [normal-speed recording](reviews/velvet-six-fall-normal-speed-2026-11-18.webm).

Pack 04 revision 112 retains 140 source clip keys per fighter and four atlas
pages: 1,298 packed slots, 10,020,288 download bytes (47,874 above revision 111).
Local only; not deployed. Both Pack 04 rises and falls now have six drawings.

Next resolve the short apex presentation window and cadence before creating
its remaining drawings: its ordinary six-tick window cannot display six
new two-tick poses. Other movement gaps in the roster audit remain open.

## Pack 04 apex presentation window resolved — 2026-11-18

The shared prepared selector switches from rise to apex at vertical speed
-2 and from apex to fall above +2. In ordinary Pack 04 jumps this exposed
about six ticks, insufficient for six readable two-tick drawings. Adding
three drawings without changing that window would leave drawings unseen.

FullBodyPilot now widens only Pack 04's ordinary airborne visual apex band
to inclusive -4 through +4 world units per tick. It replaces only selected
rise/apex/fall clips, leaving takeoff cues, attacks, double-jump transitions,
fast fall and other interruptions in control. The phase clock still advances
once and holds the last pose. Shared selection, simulation, gravity,
velocity, jump height and action timing are unchanged. This is a project
presentation decision, not a verified Ultimate timing rule.

Both fighters' held full jumps in both facings now pass a live frame-step
assertion of at least twelve apex ticks. Existing six-drawing rise and fall
sequences still display every crop in order at frame step and 1x. All 13
focused browser tests passed: prepared pose order, both fighters' six
neutral/forward/backward paths, all seven newer fighters' interrupted-jump
and landing checks, and both Pack 04 normal-speed checks. The 21 movement
presentation unit tests and client type check passed. The new unit case
covers the inclusive visual boundaries and fast-fall priority in both facings.

No artwork was generated or atlas rebuilt for this window change. Apex
still has three distinct drawings per Pack 04 fighter; this does not close
its drawing gap. Local only, not deployed. Next draw Zane's three additional
apex poses against his shipped costume, with a representative-pose review,
then require all six two-tick poses in frame-step and normal-speed Dojo
playback before repeating the pass for Velvet. Short hops and interruptions
may legitimately leave a visual phase early; do not delay gameplay for art.

## Zane six-drawing apex completed — 2026-11-18

Reviewed the early pose before producing late and settle. The shipped idle
locks Zane's brown-black silver-studded biker jacket, dark buttoned waistcoat,
silver chain/buckle, dark trousers, cream-laced chunky boots, hair and stubble.
New knee, boot and hand silhouettes bridge the existing tuck, middle and
open endpoints. Light/dark comparisons retain head/torso scale and show no
halo. Sources and exact built-in image-generation records:

- [Early source](../../concept-art/sprite/pack-04/zane-corvo-apex-early-between-v1.png) · [prompt and references](../../concept-art/sprite/pack-04/zane-corvo-apex-early-between-v1.prompt.json).
- [Late source](../../concept-art/sprite/pack-04/zane-corvo-apex-late-between-v1.png) · [prompt and references](../../concept-art/sprite/pack-04/zane-corvo-apex-late-between-v1.prompt.json).
- [Settle source](../../concept-art/sprite/pack-04/zane-corvo-apex-settle-between-v1.png) · [prompt and references](../../concept-art/sprite/pack-04/zane-corvo-apex-settle-between-v1.prompt.json).

Preparation preserves originals and zeros alpha 5/255 or lower. All three
have zero detached residual pixels farther than four pixels from solid ink.
Prepared source bounds: early 964×1413, late 997×1451, settle 1006×1469;
world heights 70, 76 and 77 respectively. Six source crop hashes are distinct,
and the reviewed silhouettes—not hashes alone—establish the drawing count.
The clip now uses six two-tick holds, twelve visual ticks, within the widened
Pack 04 apex window. Physics, controls and interruption timing are unchanged.

Six local Chromium DPR-1 browser tests passed: both fighters' prepared air
pose order in both facings, Zane's six directional takeoff paths and four
interrupted jump/landing paths, and both fighters' normal-speed airborne
playback. The normal-speed frame trace observed all six Zane apex crops in
order in both facings. No skipped drawing, phase restart or polygon fallback
was observed in these tested paths.
[Six-pose Dojo board](reviews/zane-six-apex-both-facings-2026-11-18.png)
(left facing above right facing) · [normal-speed recording](reviews/zane-six-apex-normal-speed-2026-11-18.webm).
Comparisons: [early light](reviews/zane-apex-early-light-2026-11-18.png),
[early dark](reviews/zane-apex-early-dark-2026-11-18.png),
[late light](reviews/zane-apex-late-light-2026-11-18.png),
[late dark](reviews/zane-apex-late-dark-2026-11-18.png),
[settle light](reviews/zane-apex-settle-light-2026-11-18.png),
[settle dark](reviews/zane-apex-settle-dark-2026-11-18.png).

Pack 04 revision 113 retains 140 source clip keys per fighter and four
production atlas pages, with 1,301 packed slots and 10,013,938 download bytes.
Repacking reduced the download total by 6,350 bytes despite adding poses.
Local only, not deployed; no native Ultimate timing certification is implied.
Next finish Velvet's three missing apex poses using the same one-pose-first
costume review and six-pose normal-speed requirement. Other roster movement
gaps in the inventory remain open.

## Velvet six-drawing apex completed — 2026-11-18

Reviewed the early pose against the shipped idle and adjacent apex drawings
before producing late and settle. All preserve copper-auburn waves, cheek
beauty mark, silver accessories, fishnet/crossed straps and the gold-piped
plum flared jumpsuit with heeled boots. Knee extension, boot separation and
hand changes form distinct intermediate silhouettes. Sources and exact
built-in generation records are preserved together:

- [Early source](../../concept-art/sprite/pack-04/velvet-reply-apex-early-between-v1.png) · [prompt/references](../../concept-art/sprite/pack-04/velvet-reply-apex-early-between-v1.prompt.json).
- [Late source](../../concept-art/sprite/pack-04/velvet-reply-apex-late-between-v1.png) · [prompt/references](../../concept-art/sprite/pack-04/velvet-reply-apex-late-between-v1.prompt.json).
- [Settle source](../../concept-art/sprite/pack-04/velvet-reply-apex-settle-between-v1.png) · [prompt/references](../../concept-art/sprite/pack-04/velvet-reply-apex-settle-between-v1.prompt.json).

Preparation preserves originals, clears alpha 5/255 or lower, and finds
zero detached residual pixels farther than four pixels from solid ink in
all three drawings. Prepared bounds are 945×1478, 855×1561 and 859×1666;
world heights are 69, 77 and 80. Light/dark review passed costume, scale
and alpha checks. All six apex source crop hashes are distinct, corroborating
the reviewed pose differences. The clip uses six two-tick holds within the
previously verified apex visual window. Physics and input timing are unchanged.

Six local Chromium DPR-1 Dojo tests passed: both fighters' full prepared air
pose order in both facings, Velvet's six directional takeoffs and four
interrupted double-jump/fast-fall/landing paths, and both fighters' normal-speed
playback. All six apex crops appeared in order at 1x in both facings.
[Both-facing six-pose Dojo board](reviews/velvet-six-apex-both-facings-2026-11-18.png)
(left facing above right facing) · [normal-speed recording](reviews/velvet-six-apex-normal-speed-2026-11-18.webm).
Comparisons: [early light](reviews/velvet-apex-early-light-2026-11-18.png),
[early dark](reviews/velvet-apex-early-dark-2026-11-18.png),
[late light](reviews/velvet-apex-late-light-2026-11-18.png),
[late dark](reviews/velvet-apex-late-dark-2026-11-18.png),
[settle light](reviews/velvet-apex-settle-light-2026-11-18.png),
[settle dark](reviews/velvet-apex-settle-dark-2026-11-18.png).

Pack 04 revision 114 retains 140 source clip keys per fighter and four atlas
pages, with 1,304 packed slots and 10,058,694 download bytes (+44,756).
Both Pack 04 rises, apexes and falls now reach six distinct drawings.
Local only, not deployed; this is not full movement parity or native Ultimate
certification. The table above still records squat, directional takeoff,
fast fall, double jump and landing gaps. Next expand Zane's double-jump
transition from three distinct drawings to six, then Velvet's, using a
representative-pose review and checking interruption/return-to-rise at 1x.

## Zane six-drawing double jump completed — 2026-11-18

Reviewed early before producing tuck and settle. All three preserve the shipped
brown-black silver-studded jacket, buttoned waistcoat, silver chain/buckle,
dark trousers and cream-laced chunky boots. The drawings bridge the lowered
fist/rotating boot, folding trailing leg and compact tuck. Sources and exact
built-in generation prompts/reference records:

- [Early source](../../concept-art/sprite/pack-04/zane-corvo-double-early-between-v1.png) · [prompt](../../concept-art/sprite/pack-04/zane-corvo-double-early-between-v1.prompt.json).
- [Tuck source](../../concept-art/sprite/pack-04/zane-corvo-double-tuck-between-v1.png) · [prompt](../../concept-art/sprite/pack-04/zane-corvo-double-tuck-between-v1.prompt.json).
- [Settle source](../../concept-art/sprite/pack-04/zane-corvo-double-settle-between-v1.png) · [prompt](../../concept-art/sprite/pack-04/zane-corvo-double-settle-between-v1.prompt.json).

Prepared alpha clears 5/255 or lower while preserving originals. All three
have zero detached residual pixels farther than four pixels from solid ink.
Bounds/world heights: early 778×1504/82, tuck 870×1308/75, settle 915×1420/67.
Light/dark review passed. Six source crop hashes and six reviewed silhouettes
are distinct. Six two-tick poses replace duplicated slots within the existing
twelve-tick cue; simulation and input timing are unchanged.

Found and corrected an additional Pack 04 presentation handoff: after the
completed double-jump tuck, ordinary rise restarted on its extended-leg
first drawing. The renderer now holds the final rise tuck on this handoff,
then follows the ordinary apex/fall selection. Both Pack 04 fighters share
the correction. A unit regression covers both fighters/facings and a live
check requires Zane's first post-double rise crop to be the final tuck.

Both new live six-pose tests passed: frame-step and normal-speed double jumps
in both facings, with return-to-rise and center-anchor assertions. Zane's
four interrupted jump/fast-fall/landing paths and Velvet's ordinary 1x jump
also passed. The ordinary Zane 1x jump check missed its final rise sample
once in the combined run; it passed on isolated recheck without code changes.
This sampling intermittency remains noted rather than reporting a clean
five-test combined run. All 22 movement unit tests and client type check passed.

[Six-pose Dojo board](reviews/zane-six-double-both-facings-2026-11-18.png)
(left facing above right facing) · [normal-speed recording](reviews/zane-six-double-normal-speed-2026-11-18.webm).
Comparisons: [early light](reviews/zane-double-early-light-2026-11-18.png),
[early dark](reviews/zane-double-early-dark-2026-11-18.png),
[tuck light](reviews/zane-double-tuck-light-2026-11-18.png),
[tuck dark](reviews/zane-double-tuck-dark-2026-11-18.png),
[settle light](reviews/zane-double-settle-light-2026-11-18.png),
[settle dark](reviews/zane-double-settle-dark-2026-11-18.png).

Revision 115 retains 140 source clip keys per fighter, four atlas pages and
1,304 packed slots; download total 10,106,734 bytes (+48,040). Slot count is
unchanged because distinct drawings replace repeated references. Local only,
not deployed. Next expand Velvet's double-jump transition from three distinct
drawings to six with the same single-pose-first costume review and both-facing
1x handoff checks. Other movement gaps remain in the inventory.

## Velvet six-drawing double jump completed — 2026-11-18

Reviewed early before generating tuck and settle against the shipped idle.
All retain the plum flared jumpsuit, gold piping, fishnet/crossed straps,
silver accessories, heeled boots and copper hair. New silhouettes bridge
the opening fist, trailing-leg fold and compact tuck. Sources and exact
built-in generation prompt/reference records:

- [Early source](../../concept-art/sprite/pack-04/velvet-reply-double-early-between-v1.png) · [prompt](../../concept-art/sprite/pack-04/velvet-reply-double-early-between-v1.prompt.json).
- [Tuck source](../../concept-art/sprite/pack-04/velvet-reply-double-tuck-between-v1.png) · [prompt](../../concept-art/sprite/pack-04/velvet-reply-double-tuck-between-v1.prompt.json).
- [Settle source](../../concept-art/sprite/pack-04/velvet-reply-double-settle-between-v1.png) · [prompt](../../concept-art/sprite/pack-04/velvet-reply-double-settle-between-v1.prompt.json).

Preparation preserves originals, clears alpha 5/255 or lower and leaves zero
detached residual pixels farther than four pixels from solid ink in all three.
Prepared bounds: early 801×1492, tuck 869×1223, settle 784×1294; world heights
82, 70 and 65 respectively. Light/dark review passed costume, scale and alpha.
Six crop hashes are distinct and the reviewed silhouettes establish six poses.
Six two-tick holds preserve the existing twelve-tick cue. No physics or input
changes; the prior Pack 04 return-to-rise tuck correction remains in use.

The combined seven-test browser run passed six: Velvet's four interrupted
jump/fast-fall/landing paths, both ordinary normal-speed jumps, both fighters'
stepped double jumps and Zane's normal-speed double jump. Velvet's normal-speed
run missed the second crop once. Without artwork/timing changes, isolated
recheck and three subsequent repeated runs passed all six crops in both
facings and the first return-to-rise tuck. The initial missed sample remains
an intermittent observation, not a proven sampling-only cause; pre-assert
frame traces now include elapsed time for future diagnosis. Do not report the
combined run as seven clean passes or relax the exact crop-order assertion.

[Six-pose Dojo board](reviews/velvet-six-double-both-facings-2026-11-18.png)
(left facing above right facing) · [successful normal-speed recording](reviews/velvet-six-double-normal-speed-2026-11-18.webm).
Comparisons: [early light](reviews/velvet-double-early-light-2026-11-18.png),
[early dark](reviews/velvet-double-early-dark-2026-11-18.png),
[tuck light](reviews/velvet-double-tuck-light-2026-11-18.png),
[tuck dark](reviews/velvet-double-tuck-dark-2026-11-18.png),
[settle light](reviews/velvet-double-settle-light-2026-11-18.png),
[settle dark](reviews/velvet-double-settle-dark-2026-11-18.png).

Revision 116 retains 140 source clip keys per fighter, four atlas pages and
1,304 packed slots; download total 10,161,618 bytes (+54,884). Distinct poses
replace repeated slots. Both Pack 04 rise/apex/fall/double-jump clips now
have six drawings. Squat, takeoff, fast fall and landing gaps remain.
Local only, not deployed. Next inspect the Pack 04 fast-fall live window and
choose readable pose timing before expanding Zane's three drawings, then
Velvet's; retain interruption and first-landing priority. Track the intermittent
normal-speed missing-sample observation alongside this work.

## Pack 04 fast-fall live window and cadence — 2026-11-18

Measured real keyboard-driven Dojo jumps at frame step, both fighters and
both facings. Each row below has four cases (two fighters × two facings).
The first grounded tick always selected land_heavy and cleared fast fall.

| Activation | Airborne fast-fall ticks | Old drawings exposed [4,4,4] | New drawings exposed [2,2,8] |
| --- | ---: | ---: | ---: |
| First eligible apex tick after normal jump | 6 | 2 | 3 |
| Late, vertical speed at least 8 | 4 | 1 | 2 |
| First eligible apex tick after early double jump | 9 | 3 | 3 |

The twelve-tick old presentation budget exceeded the available flight in
all measured cases. Changed only both Pack 04 fast-fall clip durations from
[4,4,4] to [2,2,8]: the first two drawings receive two ticks and the last
holds until landing. Total authored duration remains twelve. Root, artwork,
physics, movement speed, inputs, landing recovery and interruption rules are
unchanged. This improves current exposure without manufacturing airtime.
The clip still contains only three drawings; this is not six-drawing parity.

Four Chromium DPR-1 browser tests passed: twelve frame-step paths plus
normal-speed jumps in both facings for both fighters. Frame-step asserts
exact age-to-crop progression, available-pose prefix, visibility, center
anchor, and immediate landing selection. At 1x all three current drawings
were observed in order in both facings, followed by landing and fast-fall
reset. Existing intermittent normal-speed missing-sample observations from
prior passes remain recorded; this pass does not prove their cause.
[Zane normal-speed recording](reviews/zane-corvo-fastfall-cadence-2026-11-18.webm)
· [Velvet normal-speed recording](reviews/velvet-reply-fastfall-cadence-2026-11-18.webm).

Revision 117 retains 1,304 packed slots, four pages and the same 10,161,618
asset bytes as revision 116. No new art was generated. Local, not deployed.

Next expand Zane's fast-fall from three to six distinct drawings, followed
by Velvet. Use readable two-tick holds and preserve immediate interruption
and landing priority. A normal six-tick descent can show only three such
poses; late activation fewer. Verify the appropriate prefix in natural
jumps, and use a documented sufficiently high airborne/drop fixture to
check all six at frame step and 1x in both facings. Do not slow physics,
delay landing, or call six one-tick poses proven readable at 1x.

## Zane six-drawing fast fall completed — 2026-11-18

Reviewed early before generating late and settle against the shipped idle.
Costume remains the brown-black silver-studded biker jacket, buttoned waistcoat,
silver chain/buckle, dark trousers and cream-laced boots. The drawings bridge
unfolding knees and sweeping elbows, then loosening arms and the descent settle.
Sources and exact built-in generation prompt/reference records:

- [Early source](../../concept-art/sprite/pack-04/zane-corvo-fast-early-between-v1.png) · [prompt](../../concept-art/sprite/pack-04/zane-corvo-fast-early-between-v1.prompt.json).
- [Late source](../../concept-art/sprite/pack-04/zane-corvo-fast-late-between-v1.png) · [prompt](../../concept-art/sprite/pack-04/zane-corvo-fast-late-between-v1.prompt.json).
- [Settle source](../../concept-art/sprite/pack-04/zane-corvo-fast-settle-between-v1.png) · [prompt](../../concept-art/sprite/pack-04/zane-corvo-fast-settle-between-v1.prompt.json).

Preparation preserves originals and clears alpha 5/255 or lower. All three
have zero detached residual pixels farther than four pixels from solid ink.
Prepared bounds: 760×1420, 809×1740 and 672×1695. Final world heights are
72, 88 and 88; the initial late/settle fits of 77/80 were too small at the
head/torso and were corrected before packing. Light/dark review passed.
Six source crop hashes are distinct; pose differences were visually reviewed.
Six two-tick holds preserve twelve authored ticks, advance once and hold the
last pose. Physics, speed, input timing and landing rules are unchanged.

Four natural-jump browser tests passed: twelve frame-step paths across both
fighters/facings and both fighters' normal-speed apex fast falls. Zane shows
3/2/5 drawings for normal/late/double-jump drops with 6/4/9 airborne ticks.
This is the expected available prefix, not a failure to finish an animation.
The first grounded tick takes land_heavy and clears fast fall immediately.

Two additional high-drop tests passed at frame step and 1x, all six crops in
order in both facings, with visibility, center anchor and landing assertions.
This is a controlled visual fixture using forcePosition at (640,-100), zero
velocity, and ordinary Down input. It is not presented as a naturally reachable
jump. The first setup used an unsafe relative height and crossed the top blast
boundary; later frame-step attempts also retained turn_stand after immediate
repositioning. The final fixture waits for reset and turnaround to settle to
idle before lifting, then gives the airborne snapshot eight settling ticks.
No gameplay exception or renderer override was added to make the test pass.

[Six-pose high-drop Dojo board](reviews/zane-six-fastfall-both-facings-2026-11-18.png)
(left facing above right facing) · [normal-speed high-drop recording](reviews/zane-six-fastfall-highdrop-normal-speed-2026-11-18.webm).
Comparisons: [early light](reviews/zane-fastfall-early-light-2026-11-18.png),
[early dark](reviews/zane-fastfall-early-dark-2026-11-18.png),
[late light](reviews/zane-fastfall-late-light-2026-11-18.png),
[late dark](reviews/zane-fastfall-late-dark-2026-11-18.png),
[settle light](reviews/zane-fastfall-settle-light-2026-11-18.png),
[settle dark](reviews/zane-fastfall-settle-dark-2026-11-18.png).

Revision 118 retains 140 source clip keys per fighter and four atlas pages:
1,307 packed slots, 10,256,120 download bytes (+94,502). Local, not deployed.
Next expand Velvet's fast fall from three to six distinct drawings using
single-pose-first costume review, valid natural-flight prefixes, and the
corrected high-drop fixture to inspect all six at 1x in both facings.
Other movement gaps and prior intermittent sample observations remain open.

## Velvet six-drawing fast fall completed — 2026-11-18

Reviewed early before generating late and settle against the shipped idle.
All preserve the plum flared jumpsuit, gold piping, fishnet/crossed straps,
silver accessories, heeled boots and copper hair. The first late drawing
straightened too early, nearly duplicating the endpoint; rejected it and
accepted v2 with an intermediate diagonal body angle. The builder explicitly
selects v2 so a rebuild cannot silently restore the rejected drawing.
Sources and exact built-in generation prompt/reference records:

- [Early source](../../concept-art/sprite/pack-04/velvet-reply-fast-early-between-v1.png) · [prompt](../../concept-art/sprite/pack-04/velvet-reply-fast-early-between-v1.prompt.json).
- [Accepted late v2](../../concept-art/sprite/pack-04/velvet-reply-fast-late-between-v2.png) · [prompt](../../concept-art/sprite/pack-04/velvet-reply-fast-late-between-v2.prompt.json).
- [Rejected late v1](../../concept-art/sprite/pack-04/velvet-reply-fast-late-between-v1.png) · [rejection record](../../concept-art/sprite/pack-04/velvet-reply-fast-late-between-v1.prompt.json). Not packed.
- [Settle source](../../concept-art/sprite/pack-04/velvet-reply-fast-settle-between-v1.png) · [prompt](../../concept-art/sprite/pack-04/velvet-reply-fast-settle-between-v1.prompt.json).

Preparation preserves originals, zeros alpha 5/255 or lower, and leaves zero
detached residual pixels farther than four pixels from solid ink in all three
accepted drawings. Prepared bounds: 798×1519, 704×1409 and 633×1998; world
heights 75, 82 and 84. Light/dark comparisons passed costume, scale and alpha.
All six source crop hashes differ, corroborating the reviewed silhouettes.
Six two-tick holds preserve twelve authored ticks. Physics, controls and
landing recovery are unchanged.

All eight Chromium DPR-1 browser tests passed in one run. Both fighters'
natural-input frame-step cases cover both facings and normal/late/double-jump
activation: 6/4/9 airborne ticks expose 3/2/5 drawings. Both normal-speed
ordinary-jump checks show the three available poses in order. Both fighters'
high-drop frame-step and 1x checks show all six drawings in both facings,
with center anchors and the first grounded landing/fast-fall reset asserted.
The high-drop fixture is explicitly controlled at (640,-100), after reset
and turnaround reach idle; it is not claimed to be a natural jump height.
Prior intermittent missing-sample observations remain recorded separately.

[Six-pose high-drop Dojo board](reviews/velvet-six-fastfall-both-facings-2026-11-18.png)
(left facing above right facing) · [normal-speed high-drop recording](reviews/velvet-six-fastfall-highdrop-normal-speed-2026-11-18.webm).
Comparisons: [early light](reviews/velvet-fastfall-early-light-2026-11-18.png),
[early dark](reviews/velvet-fastfall-early-dark-2026-11-18.png),
[late light](reviews/velvet-fastfall-late-light-2026-11-18.png),
[late dark](reviews/velvet-fastfall-late-dark-2026-11-18.png),
[settle light](reviews/velvet-fastfall-settle-light-2026-11-18.png),
[settle dark](reviews/velvet-fastfall-settle-dark-2026-11-18.png).

Revision 119 retains 140 source clip keys per fighter and four atlas pages:
1,310 packed slots, 10,295,664 download bytes (+39,544). Local, not deployed.
Both Pack 04 rise/apex/fall/fast-fall/double-jump sets now have six drawings.
Squat, directional takeoff, soft landing and heavy landing still have gaps;
other packs remain below these movement targets. Next inspect Pack 04 soft
and heavy landing presentation windows and sole contact, then set the missing
landing drawing targets without delaying actionable gameplay or repeating
crops to inflate counts.

## Pack 04 landing timing, contact and trigger audit — 2026-11-18

Found and fixed a real authoritative art-cue gap: movementArt only requested
land_soft for Pack 03 gentle ground contact. Zane and Velvet retained an
airborne/apex drawing on their first grounded tick. Include Pack 04 in this
existing gentle-touchdown cue path. It changes presentation metadata only,
not landing recovery, position, velocity or action availability. Heavy contact
classification remains the existing incoming vertical speed above 10 rule.

Rebuilt the engine consumed by the browser before final live validation.
Six engine movement-art unit tests pass, including both Pack 04 gentle-contact
cues, heavy priority, and interruption by Jump/Attack/Shield/movement.
Three browser tests pass: the loaded-atlas sole-root test and a forty-case live
matrix (two fighters × two facings × soft/heavy × neutral/Jump/Attack/Shield/Special).
The controlled drops start at (640,452) for gentle contact and (640,300) for
heavy contact, after reset and turnaround reach idle.

| Check | Soft | Heavy |
| --- | --- | --- |
| First ground contact | AIRBORNE with isGrounded true, cue age 0 | Same |
| Landing lag field | 0 | 0 |
| Uninterrupted visual cue | 12 ticks | 18 ticks |
| Fresh Jump on following simulation tick | JUMPSQUAT; landing art interrupted | Same |
| Fresh Attack / Special on following tick | ATTACK; landing art interrupted | Same |
| Fresh Shield on following tick | SHIELD; landing art interrupted | Same |
| Current distinct drawings | 3 | 3 |

These are visual cues, not twelve/eighteen ticks of input lockout. Do not add
recovery to finish drawings. The loaded renderer keeps the frame bottom at
floor Y=28 in both facings. A source alpha>=128 scan of all twelve current
landing frame references found zero empty rows below visible ink; root-to-last
visible row is only one source pixel, 0.062–0.177 world units after scale.
This checks bottom contact, not whether both boots are anatomically placed
correctly or whether a source shadow has been mistaken for a sole.

Visual inspection uncovered a separate drawing defect: both soft-land middle
frames reuse stance-3/takeoff (arms raised, a launch-like stretch). It is not
an appropriate relaxed landing recovery and must be replaced, not counted as
finished art. Heavy landing uses impact, low crouch and idle, leaving large
compression/recovery steps rather than that raised-arm mistake.
[Zane board](reviews/zane-corvo-landing-audit-2026-11-18.png)
· [Velvet board](reviews/velvet-reply-landing-audit-2026-11-18.png).
Each board: soft left/right, then heavy left/right; poses left to right.

Drawing targets before generation:

| Fighter / clip | Keep | New drawings required | Intended visual schedule |
| --- | --- | ---: | --- |
| Zane soft | contact and shipped idle | 4; replace raised-arm middle plus three bridges | Six two-tick poses within existing 12-tick cue |
| Velvet soft | contact and shipped idle | 4; same correction | Six two-tick poses within existing 12-tick cue |
| Zane heavy | impact, low crouch, shipped idle | 3 | Six three-tick poses within existing 18-tick cue |
| Velvet heavy | impact, low crouch, shipped idle | 3 | Six three-tick poses within existing 18-tick cue |

Fourteen appropriate drawings remain for these four clips, not twelve. Review
one costume-matched pose per fighter before batching, keep soles at floor
through compression and rise, and use explicit durations plus the art-cue age
in the Pack 04 renderer (the existing duration path covers Pack 03 landings).
Verify all six at 1x with neutral input, first-contact contact and all four
fresh action interruptions. Do not reuse takeoff or victory gestures as
landing bridges, repeat crops to inflate counts, or delay action availability.

No new artwork or atlas revision in this audit; revision 119 is unchanged.
Local only, not deployed. Next draw Zane's four soft-landing replacements/
in-betweens, review one first, then test the full six-pose recovery and
interruptions in both facings. Follow with Velvet soft, Zane heavy, Velvet
heavy. Squat/takeoff and other-pack movement gaps remain separately tracked.

## Zane six-drawing soft landing completed — 2026-11-18

Replaced the inappropriate raised-arm takeoff middle with four dedicated
landing drawings: compression, rebound, rise and settle. Kept the existing
contact and shipped idle as endpoints. Reviewed compression before producing
the remaining drawings against the shipped costume: brown-black silver-studded
jacket, buttoned waistcoat, silver chain/buckle, dark trousers and cream-laced
boots. Both soles stay on the floor as knees compress then return to stance.
Sources and exact built-in generation prompt/reference records:

- [Compression](../../concept-art/sprite/pack-04/zane-corvo-soft-compress-between-v1.png) · [prompt](../../concept-art/sprite/pack-04/zane-corvo-soft-compress-between-v1.prompt.json).
- [Rebound](../../concept-art/sprite/pack-04/zane-corvo-soft-rebound-between-v1.png) · [prompt](../../concept-art/sprite/pack-04/zane-corvo-soft-rebound-between-v1.prompt.json).
- [Rise](../../concept-art/sprite/pack-04/zane-corvo-soft-rise-between-v1.png) · [prompt](../../concept-art/sprite/pack-04/zane-corvo-soft-rise-between-v1.prompt.json).
- [Settle](../../concept-art/sprite/pack-04/zane-corvo-soft-settle-between-v1.png) · [prompt](../../concept-art/sprite/pack-04/zane-corvo-soft-settle-between-v1.prompt.json).

Preparation preserves originals and zeros alpha 5/255 or lower. Rebound had
three detached alpha-6/7 pixels farther than four pixels from solid ink;
removed only detached pixels at alpha <=7 for that named source. All four
prepared drawings have zero detached residuals. Bounds: compression 646×1232,
rebound 814×1665, rise 748×1419, settle 756×1310; world heights 67/72/77/80.
Light/dark review passed. All six source crop hashes differ and each visible
ink crop reaches its bottom row (zero transparent bottom gap).

The clip now has six two-tick holds within the existing twelve-tick soft
landing cue. Added Pack 04 landing-duration playback by art-cue age rather
than unrelated state-frame age. The frame root stays at the floor and action
interruptions retain priority. No physics or recovery time was added.

The first production-atlas write failed partway through with a Windows file
open error. The successful retry completed revision 120; discarded browser
results from the partial atlas and reran against the complete build.
All four final Chromium DPR-1 tests passed: loaded-atlas floor roots, both
fighters' forty-case soft/heavy landing/input matrix, and Zane's six-pose 1x
soft landing in both facings. All six drawings appeared in order; fresh Jump,
Attack, Shield and Special still interrupt on the next simulation tick.
All 23 movement-presentation unit tests and client type check passed.

[Six-pose Dojo board](reviews/zane-six-soft-landing-both-facings-2026-11-18.png)
(left facing above right facing) · [normal-speed recording](reviews/zane-six-soft-landing-normal-speed-2026-11-18.webm).
Comparisons: [compression light](reviews/zane-soft-landing-compress-light-2026-11-18.png),
[compression dark](reviews/zane-soft-landing-compress-dark-2026-11-18.png),
[rebound light](reviews/zane-soft-landing-rebound-light-2026-11-18.png),
[rebound dark](reviews/zane-soft-landing-rebound-dark-2026-11-18.png),
[rise light](reviews/zane-soft-landing-rise-light-2026-11-18.png),
[rise dark](reviews/zane-soft-landing-rise-dark-2026-11-18.png),
[settle light](reviews/zane-soft-landing-settle-light-2026-11-18.png),
[settle dark](reviews/zane-soft-landing-settle-dark-2026-11-18.png).

Revision 120 retains 140 source clip keys per fighter and four atlas pages:
1,313 packed slots, 10,356,962 download bytes (+61,298). Local, not deployed.
Ten landing drawings remain: Velvet soft four, Zane heavy three, Velvet
heavy three, in that order. Next replace Velvet's soft-landing takeoff middle
and fill its six-pose sequence, preserving this cue timing and action matrix.
Squat/takeoff and other-pack movement gaps remain separately tracked.

## Velvet six-drawing soft landing completed — 2026-11-18

Four dedicated compression/rebound/rise/settle drawings replace the raised-arm
takeoff middle and fill the six-pose sequence with existing contact and idle.
Reviewed compression first against the shipped plum flared jumpsuit, gold
piping, fishnet/crossed straps, silver accessories, heeled boots and copper hair.
Both heel tips and forefeet share the floor baseline through recovery.
Sources and exact built-in generation prompt/reference records:

- [Compression](../../concept-art/sprite/pack-04/velvet-reply-soft-compress-between-v1.png) · [prompt](../../concept-art/sprite/pack-04/velvet-reply-soft-compress-between-v1.prompt.json).
- [Rebound](../../concept-art/sprite/pack-04/velvet-reply-soft-rebound-between-v1.png) · [prompt](../../concept-art/sprite/pack-04/velvet-reply-soft-rebound-between-v1.prompt.json).
- [Rise](../../concept-art/sprite/pack-04/velvet-reply-soft-rise-between-v1.png) · [prompt](../../concept-art/sprite/pack-04/velvet-reply-soft-rise-between-v1.prompt.json).
- [Settle](../../concept-art/sprite/pack-04/velvet-reply-soft-settle-between-v1.png) · [prompt](../../concept-art/sprite/pack-04/velvet-reply-soft-settle-between-v1.prompt.json).

Preparation preserves originals, clears alpha 5/255 or lower, and removes one
measured detached alpha-6 pixel from compression farther than four pixels
from solid ink. All four then have zero detached residual pixels.
Prepared bounds: 732×1266, 817×1475, 670×1326 and 690×1308. World heights are
73, 76, 79 and 81 respectively. Light/dark costume, scale and alpha review
passed. Six distinct source crop hashes and visible pose differences were
verified. All six crops have visible alpha>=128 ink reaching the last row,
with no empty strip below the feet.

The sequence uses six two-tick holds within the existing twelve-tick cue,
using the previously added cue-age renderer path. Physics, input timing and
landing recovery are unchanged. All five Chromium DPR-1 browser tests passed:
loaded floor roots, both fighters' forty-case soft/heavy landing/action matrix,
and both fighters' six-pose normal-speed soft landing in both facings.
Every crop appeared in order; fresh Jump/Attack/Shield/Special still interrupt
on the following simulation tick. No raised-arm stretch remains in either
Pack 04 soft-landing clip. The atlas build completed cleanly this pass.

[Six-pose Dojo board](reviews/velvet-six-soft-landing-both-facings-2026-11-18.png)
(left facing above right facing) · [normal-speed recording](reviews/velvet-six-soft-landing-normal-speed-2026-11-18.webm).
Comparisons: [compression light](reviews/velvet-soft-landing-compress-light-2026-11-18.png),
[compression dark](reviews/velvet-soft-landing-compress-dark-2026-11-18.png),
[rebound light](reviews/velvet-soft-landing-rebound-light-2026-11-18.png),
[rebound dark](reviews/velvet-soft-landing-rebound-dark-2026-11-18.png),
[rise light](reviews/velvet-soft-landing-rise-light-2026-11-18.png),
[rise dark](reviews/velvet-soft-landing-rise-dark-2026-11-18.png),
[settle light](reviews/velvet-soft-landing-settle-light-2026-11-18.png),
[settle dark](reviews/velvet-soft-landing-settle-dark-2026-11-18.png).

Revision 121 retains 140 source clip keys per fighter and four atlas pages:
1,316 packed slots, 10,433,858 download bytes (+76,896). Local, not deployed.
Six landing drawings remain: Zane heavy three, then Velvet heavy three.
Next review one Zane heavy in-between before completing its six-pose sequence,
with six three-tick holds within the existing eighteen-tick visual cue.
Preserve soles and immediate action interruption. Squat/takeoff and other-pack
movement gaps remain separately tracked.

## Zane six-drawing heavy landing completed — 2026-11-18

Reviewed compression before producing rebound and settle. Keep the existing
impact, low crouch and shipped idle, and insert three dedicated drawings.
All preserve the shipped brown-black silver-studded jacket, buttoned waistcoat,
silver chain/buckle, dark trousers, cream-laced boots, hair and stubble.
Both soles stay planted as the guard folds inward then returns to stance.
Sources and exact built-in generation prompt/reference records:

- [Compression](../../concept-art/sprite/pack-04/zane-corvo-heavy-compress-between-v1.png) · [prompt](../../concept-art/sprite/pack-04/zane-corvo-heavy-compress-between-v1.prompt.json).
- [Rebound](../../concept-art/sprite/pack-04/zane-corvo-heavy-rebound-between-v1.png) · [prompt](../../concept-art/sprite/pack-04/zane-corvo-heavy-rebound-between-v1.prompt.json).
- [Settle](../../concept-art/sprite/pack-04/zane-corvo-heavy-settle-between-v1.png) · [prompt](../../concept-art/sprite/pack-04/zane-corvo-heavy-settle-between-v1.prompt.json).

Preparation preserves originals and clears alpha 5/255 or lower. All three
have zero detached residual pixels farther than four pixels from solid ink.
Prepared bounds: 810×1197, 846×1309 and 749×1290, with world heights 65, 71
and 78. Floor-aligned light/dark review passed costume, scale and alpha.
Six distinct crop hashes corroborate six reviewed poses. Visible alpha>=128
ink reaches the final row in every crop, with no empty strip below the feet.

Six three-tick holds use the existing eighteen-tick visual cue and the Pack 04
cue-age renderer path. No physics, input availability or recovery changes.
All six Chromium DPR-1 Dojo browser tests passed in one run: loaded sole
roots, both fighters' forty-case landing/action matrix, both six-pose soft
landings at 1x, and Zane's six-pose heavy landing at 1x in both facings.
All six heavy crops appeared in order, the first contact stayed grounded,
and Jump/Attack/Shield/Special still interrupt on the next simulation tick.

[Six-pose Dojo board](reviews/zane-six-heavy-landing-both-facings-2026-11-18.png)
(left facing above right facing) · [normal-speed recording](reviews/zane-six-heavy-landing-normal-speed-2026-11-18.webm).
Comparisons: [compression light](reviews/zane-heavy-landing-compress-light-2026-11-18.png),
[compression dark](reviews/zane-heavy-landing-compress-dark-2026-11-18.png),
[rebound light](reviews/zane-heavy-landing-rebound-light-2026-11-18.png),
[rebound dark](reviews/zane-heavy-landing-rebound-dark-2026-11-18.png),
[settle light](reviews/zane-heavy-landing-settle-light-2026-11-18.png),
[settle dark](reviews/zane-heavy-landing-settle-dark-2026-11-18.png).

Revision 122 retains 140 source clip keys per fighter and four atlas pages:
1,319 packed slots, 10,485,378 download bytes (+51,520). Local, not deployed.
Three landing drawings remain: Velvet heavy compression/rebound/settle.
Next finish that six-pose sequence with the same single-pose-first costume
review, eighteen-tick visual timing, planted feet and action matrix. Zane's
landing drawing targets are complete; squat/takeoff and other-pack movement
gaps remain open. This is not complete roster parity or Ultimate certification.

## Velvet six-drawing heavy landing completed — 2026-11-18

Reviewed compression first against shipped idle, impact and crouch, then added
rebound and settle. The dark flared jumpsuit, gold piping, fishnets, crossed
straps, silver accessories, copper hair and heeled boots remain consistent.
The original impact, crouch and idle remain in the six-pose sequence.

- [Compress](../../concept-art/sprite/pack-04/velvet-reply-heavy-compress-between-v1.png) · [exact built-in prompt and reference record](../../concept-art/sprite/pack-04/velvet-reply-heavy-compress-between-v1.prompt.json).
- [Rebound](../../concept-art/sprite/pack-04/velvet-reply-heavy-rebound-between-v1.png) · [exact built-in prompt and reference record](../../concept-art/sprite/pack-04/velvet-reply-heavy-rebound-between-v1.prompt.json).
- [Settle](../../concept-art/sprite/pack-04/velvet-reply-heavy-settle-between-v1.png) · [exact built-in prompt and reference record](../../concept-art/sprite/pack-04/velvet-reply-heavy-settle-between-v1.prompt.json).

Originals preserved; preparation clears alpha <=5. Compression/rebound/settle
bounds are 902×1174, 718×1262 and 681×1298, at world heights 62/71/79.
Cleared 14,419/16,081/15,431 faint pixels respectively; zero remaining detached
pixels farther than four pixels from solid ink. Floor-aligned dark/light
comparisons passed costume, silhouette, scale and edge inspection.

Seven Chromium DPR-1 Dojo tests passed in one run: loaded sole roots,
forty landing/action cases across both fighters, and all four six-pose soft/heavy
clips at normal speed in both facings. Every expected crop appeared in order.
Heavy landing retains six three-tick holds within its existing 18-tick visual
cue; Jump, Attack, Shield and Special remain available on the next tick.
No gameplay timing or physics changed.

[Both-facing six-pose board](reviews/velvet-six-heavy-landing-both-facings-2026-11-18.png)
· [normal-speed recording](reviews/velvet-six-heavy-landing-normal-speed-2026-11-18.webm).

Compress comparisons: [light](reviews/velvet-heavy-landing-compress-light-2026-11-18.png), [dark](reviews/velvet-heavy-landing-compress-dark-2026-11-18.png).

Rebound comparisons: [light](reviews/velvet-heavy-landing-rebound-light-2026-11-18.png), [dark](reviews/velvet-heavy-landing-rebound-dark-2026-11-18.png).

Settle comparisons: [light](reviews/velvet-heavy-landing-settle-light-2026-11-18.png), [dark](reviews/velvet-heavy-landing-settle-dark-2026-11-18.png).

Source/production revision 123: 1,322 packed slots, four pages, 10,544,372
transfer bytes; 140 source clip keys per fighter. Local, not deployed.
Both Pack 04 landing targets are complete: zero landing drawings remain in
this pass. Next audit jump-squat and directional-takeoff timing and drawing
targets before generating more poses. Other-pack movement gaps remain open;
this does not certify complete roster parity or native Ultimate timing.

## Pack 04 squat and takeoff timing audit — 2026-11-18

Three Chromium DPR-1 browser tests passed: Zane and Velvet directional takeoff
through apex/fall/landing in both facings, plus Zane backward-takeoff root
handoff. Twelve live input sequences cover neutral/forward/backward in both
facings across both fighters. Added explicit first/second squat screenshots
and attached state-frame traces to the existing browser test.

The engine constant is three squat ticks. Live squat samples at state frames
0 and 1 select two different crops, with grounded feet and body offset (0,28).
Current art durations are [1,2]. Both use the stance sheet's raised-arm
extension before the deep crouch. Visual review flags that reversed physical
progression; this pass does not mark squat art complete.

Takeoff cue ages 0–5 show two crops held three ticks each; age 6 selects rise.
Observed root offsets progress 28,22.4,16.8,11.2,5.6,0, then remain zero into
rise. All bodies remain visible and facing correctly; backward momentum is
opposite facing at cue age zero. Neutral and forward share the same two
source drawings; backward has its own final drawing but reuses the same
raised-arm first drawing. Those are art gaps, not missing-atlas fallbacks.
The backward endpoint into the forward rise also deserves targeted silhouette
review when replacing the takeoff drawings; passing root positions alone
cannot certify a smooth silhouette.

[Zane neutral sequence, both facings](reviews/zane-corvo-squat-takeoff-audit-2026-11-18.png)
· [Velvet neutral sequence, both facings](reviews/velvet-reply-squat-takeoff-audit-2026-11-18.png).
Columns: first squat, second squat, takeoff first/second drawing, first rise.
Screenshots are frame-stepped evidence; this pass did not capture new 1x video
or certify normal-speed readability of future drawings.

Bounded next drawing targets, without extending physical timing:

- Squat: three appropriate poses across three ticks, [1,1,1]. Retain the low
  crouch; draw a modest grounded compression entry and a grounded extension
  exit. Two new drawings per fighter, four total. Verify the third actual
  grounded tick explicitly when implementing and test tapped/held jump.
- Each directional takeoff: three poses across six ticks, [2,2,2]. Replace
  the raised-arm first pose with a directional push-off and add a midpoint,
  retaining the endpoint only if its silhouette matches rise. Two new
  drawings per direction per fighter: twelve total. Review neutral, forward
  and backward separately; allow replacement of a flagged endpoint rather
  than counting an inappropriate reused pose as complete.

Initial budget: sixteen new drawings, reviewed one fighter/pose at a time,
plus any endpoint correction substantiated by that review. Grounded squat
roots stay at the soles; takeoff transitions to the existing airborne root.
Do not stretch jumps to show artwork. Single-tick squat poses may be skipped
by a normal-speed display; verify progression rather than requiring a
three-frame capture at every render cadence. Both facings, tapped/held jump,
short/full hop and takeoff-to-rise must pass before closing this group.

Next: Zane squat entry review against shipped costume, then the three-pose
squat sequence and input timing checks. No new drawings or runtime behavior
changed in this audit. Atlas remains revision 123. Local, not deployed.

## Zane three-pose jump squat completed — 2026-11-18

Reviewed one entry drawing first against shipped idle and low crouch, then
produced grounded extension. The three-pose sequence is new compression entry,
existing low crouch, new extension. It removes the raised-arm squat drawing
while retaining the brown-black biker jacket, silver hardware, dark buttoned
waistcoat, chain/buckle, trousers, cream-laced boots, hair and stubble.

- [Entry source](../../concept-art/sprite/pack-04/zane-corvo-squat-entry-between-v1.png) · [exact built-in prompt/references](../../concept-art/sprite/pack-04/zane-corvo-squat-entry-between-v1.prompt.json).
- [Extension source](../../concept-art/sprite/pack-04/zane-corvo-squat-extend-between-v1.png) · [exact built-in prompt/references](../../concept-art/sprite/pack-04/zane-corvo-squat-extend-between-v1.prompt.json).

Prepared entry/extension bounds: 726×1159 and 711×1229; world heights 77/79.
Alpha <=5 cleanup clears 11,380/12,697 faint pixels, with zero detached residual
pixels farther than four pixels from solid ink. Originals preserved. Dark/light
comparisons and the both-facing Dojo board pass costume, scale and foot review.
Durations [1,1,1] match the existing three-tick squat; no engine or physics edits.

Two focused browser tests pass: all three ordered crops and grounded state
frames 0/1/2 in four tapped/held/facing cases, plus loaded sprite sole-root
checks for every crop in both facings. Short hop leaves at vy -9.35 after
first-tick gravity, reaches y400 from grounded y472, and returns after 29
additional airborne steps. Held jump leaves at -15.35, reaches y283, and returns
after 48 steps. Results match across facings and the existing jump constants.
The initial new test sampled before Dojo startup completed; added a readiness
wait, then both focused tests passed. Three existing takeoff/apex/root tests
also passed, covering twelve direction/facing sequences; no invisible bodies.

[Both-facing three-pose board](reviews/zane-three-jump-squat-both-facings-2026-11-18.png)
· [four-case timing trace](reviews/zane-three-jump-squat-timing-2026-11-18.json).
[Entry light](reviews/zane-jump-squat-entry-light-2026-11-18.png) ·
[entry dark](reviews/zane-jump-squat-entry-dark-2026-11-18.png) ·
[extension light](reviews/zane-jump-squat-extend-light-2026-11-18.png) ·
[extension dark](reviews/zane-jump-squat-extend-dark-2026-11-18.png).

Revision 124: 1,323 packed slots, four pages, 10,579,792 transfer bytes and
140 source clip keys per fighter. Local, not deployed. The live tests are
frame-stepped; a one-tick pose is not guaranteed to appear on every display
refresh. Do not lengthen squat for artwork. Directional takeoff still uses its
old raised-arm start and remains a separate open task. Next Velvet squat,
then both fighters' takeoff drawings: fourteen new drawings remain in the
sixteen-drawing squat/takeoff budget (two Velvet squat, twelve takeoff).
This is not complete roster parity or version-matched Ultimate certification.

## Velvet three-pose jump squat completed — 2026-11-18

Reviewed entry first against shipped idle and low crouch, then drew extension.
Three ordered drawings now use [1,1,1]: new entry, shipped low crouch, new
extension. Costume review retains flared dark jumpsuit/gold piping, fishnet
sleeves/chest and straps, silver belt/cuffs/hoops, copper hair, beauty mark
and glossy heeled boots. The old raised-arm squat start is removed.

- [Entry](../../concept-art/sprite/pack-04/velvet-reply-squat-entry-between-v1.png) · [exact built-in prompt/reference record](../../concept-art/sprite/pack-04/velvet-reply-squat-entry-between-v1.prompt.json).
- [Extension](../../concept-art/sprite/pack-04/velvet-reply-squat-extend-between-v1.png) · [exact built-in prompt/reference record](../../concept-art/sprite/pack-04/velvet-reply-squat-extend-between-v1.prompt.json).

Prepared bounds 719×1245 and 746×1317, world heights 76/79. Alpha <=5
cleanup clears 15,275/15,302 faint pixels; zero detached residue farther than
four pixels from solid ink. Originals preserved. Dark/light comparisons and
the both-facing live Dojo board passed costume, proportions and floor review.

Four Chromium DPR-1 tests passed in one run: both fighters' eight total
face/tap/hold cases and loaded sole roots for all three drawings in both
facings. All squat state frames 0/1/2 remain grounded at y472, with the expected
three crops in order and no invisible body. Velvet retains short-hop launch
vy -9.35, apex y400 and 29 additional steps to touchdown; held launch -15.35,
apex y283 and 48 steps to touchdown. Both facings match Zane's existing baseline.
No physics, input, recovery, jump timing or renderer changes.

[Both-facing pose board](reviews/velvet-three-jump-squat-both-facings-2026-11-18.png)
· [four-case timing trace](reviews/velvet-three-jump-squat-timing-2026-11-18.json).
[Entry light](reviews/velvet-jump-squat-entry-light-2026-11-18.png) ·
[entry dark](reviews/velvet-jump-squat-entry-dark-2026-11-18.png) ·
[extension light](reviews/velvet-jump-squat-extend-light-2026-11-18.png) ·
[extension dark](reviews/velvet-jump-squat-extend-dark-2026-11-18.png).

Revision 125: 1,324 packed slots, four pages, 10,623,084 transfer bytes,
140 source clip keys per fighter. Local only, not deployed. Validation is
frame-stepped; a one-tick pose may fall between display refreshes. Preserve
three-tick timing. Squat drawing targets are complete for Pack 04. Next Zane
neutral/forward/backward takeoffs, then Velvet's: twelve new drawings remain
in this subpass (two per direction per fighter). Takeoff still reuses the old
raised-arm start; no claim of full roster parity or Ultimate certification.

## Zane three-pose directional takeoffs completed — 2026-11-18

Reviewed neutral start first against shipped idle, squat extension and rise,
then generated five further starts/midpoints. Costume/alpha review retains
silver-hardware brown-black jacket, dark buttoned waistcoat, chain/buckle,
dark trousers, cream-laced boots, hair and stubble. Each direction now uses
two dedicated new drawings followed by the existing first rise pose. Backward
also ends in that exact rise drawing, replacing its old raised-fist endpoint
and avoiding a separate arm-drop at the rise boundary.

Sources and exact built-in prompts/reference records:

- [neutral-start](../../concept-art/sprite/pack-04/zane-corvo-takeoff-neutral-start-between-v1.png) · [prompt](../../concept-art/sprite/pack-04/zane-corvo-takeoff-neutral-start-between-v1.prompt.json).

- [neutral-mid](../../concept-art/sprite/pack-04/zane-corvo-takeoff-neutral-mid-between-v1.png) · [prompt](../../concept-art/sprite/pack-04/zane-corvo-takeoff-neutral-mid-between-v1.prompt.json).

- [forward-start](../../concept-art/sprite/pack-04/zane-corvo-takeoff-forward-start-between-v1.png) · [prompt](../../concept-art/sprite/pack-04/zane-corvo-takeoff-forward-start-between-v1.prompt.json).

- [forward-mid](../../concept-art/sprite/pack-04/zane-corvo-takeoff-forward-mid-between-v1.png) · [prompt](../../concept-art/sprite/pack-04/zane-corvo-takeoff-forward-mid-between-v1.prompt.json).

- [backward-start](../../concept-art/sprite/pack-04/zane-corvo-takeoff-backward-start-between-v1.png) · [prompt](../../concept-art/sprite/pack-04/zane-corvo-takeoff-backward-start-between-v1.prompt.json).

- [backward-mid](../../concept-art/sprite/pack-04/zane-corvo-takeoff-backward-mid-between-v1.png) · [prompt](../../concept-art/sprite/pack-04/zane-corvo-takeoff-backward-mid-between-v1.prompt.json).

Prepared bounds in the order above: 641×1325, 589×1426, 985×1230, 655×1290,
1039×1293, 697×1376. World heights 82 except backward start 80. Alpha <=5
cleanup clears 14,427/11,839/15,348/10,863/13,465/13,166 faint pixels;
zero detached residue farther than four pixels from solid ink. Original
sources preserved. Reviewed full-size drawings, dark comparison board and
both-facing frame-stepped Dojo captures for costume, proportions and edges.

Each clip has three distinct crops, durations [2,2,2], within the unchanged
six-tick cue. Fixed the Pack 04 explicit-duration takeoff renderer branch to
select by cue age instead of holding the last drawing. Other packs retain
their previous branch. The existing five-tick sole-to-center root blend is
unchanged. The final takeoff crop matches the first rise crop exactly.

Seven Chromium DPR-1 Dojo checks passed in one run: both fighters' directional
jump sequences, backward root handoff, and both fighters' tapped/held squat
and sole checks. All six Zane direction/facing cases show cue ages 0–5 with
three crops held exactly twice, then rise at age6. All bodies remain visible;
backward initial velocity opposes facing. Twelve direction/facing sequences
across both fighters continue through apex/fall/landing. Eight tap/hold/facing
cases retain three squat ticks, short/full jump vy -9.35/-15.35, apex y400/y283
and 29/48 additional steps to touchdown. Client typecheck passes. No engine,
physics, jump availability or recovery changes.

[Six new drawing review](reviews/zane-takeoff-six-new-drawings-2026-11-18.png)
· [three poses in all directions/facings](reviews/zane-three-directional-takeoffs-both-facings-2026-11-18.png)
· [six complete jump traces](reviews/zane-three-directional-takeoffs-traces-2026-11-18.json).
Board rows: neutral left/right, forward left/right, backward left/right.
These are frame-step captures; normal-speed visual signoff is not claimed.

Revision 126: 1,327 packed slots, four atlas pages, 10,720,826 transfer bytes,
140 source clip keys per fighter. Local, not deployed. Six new drawings remain
in this squat/takeoff subpass: Velvet neutral/forward/backward starts and
midpoints next, followed by normal-speed review of both fighters' complete
squat-to-takeoff-to-rise sequences. Other-pack gaps remain separately open.

## Velvet three-pose directional takeoffs completed — 2026-11-18

Reviewed neutral start first against shipped costume, squat extension and rise.
Added six dedicated start/midpoint drawings across neutral/forward/backward;
each sequence ends on the existing first rise pose, replacing raised-arm starts
and the old backward endpoint. All retain flared dark jumpsuit, gold piping,
fishnets/straps, silver accessories, copper waves, beauty mark and heeled boots.

The first neutral midpoint candidate reproduced brown haze from the old rise
reference. Rejected it; regenerated with only clean idle/squat references and
used those references for the remaining four drawings. The rejected candidate
is not registered or packaged. Do not use contaminated source crops as image
generation references even when their cleaned gameplay preparation looks fine.

Sources and exact built-in prompts/reference records:

- [neutral-start](../../concept-art/sprite/pack-04/velvet-reply-takeoff-neutral-start-between-v1.png) · [prompt](../../concept-art/sprite/pack-04/velvet-reply-takeoff-neutral-start-between-v1.prompt.json).

- [neutral-mid](../../concept-art/sprite/pack-04/velvet-reply-takeoff-neutral-mid-between-v1.png) · [prompt](../../concept-art/sprite/pack-04/velvet-reply-takeoff-neutral-mid-between-v1.prompt.json).

- [forward-start](../../concept-art/sprite/pack-04/velvet-reply-takeoff-forward-start-between-v1.png) · [prompt](../../concept-art/sprite/pack-04/velvet-reply-takeoff-forward-start-between-v1.prompt.json).

- [forward-mid](../../concept-art/sprite/pack-04/velvet-reply-takeoff-forward-mid-between-v1.png) · [prompt](../../concept-art/sprite/pack-04/velvet-reply-takeoff-forward-mid-between-v1.prompt.json).

- [backward-start](../../concept-art/sprite/pack-04/velvet-reply-takeoff-backward-start-between-v1.png) · [prompt](../../concept-art/sprite/pack-04/velvet-reply-takeoff-backward-start-between-v1.prompt.json).

- [backward-mid](../../concept-art/sprite/pack-04/velvet-reply-takeoff-backward-mid-between-v1.png) · [prompt](../../concept-art/sprite/pack-04/velvet-reply-takeoff-backward-mid-between-v1.prompt.json).

Prepared bounds in the order above: 656×1320, 785×1394, 1015×1270, 738×1338,
1013×1285, 888×1326. World heights 82 except backward start80. Alpha <=5
cleanup clears 14,942/14,119/15,261/17,038/14,840/15,760 faint pixels;
zero detached residue farther than four pixels from solid ink. Originals
preserved. Inspected the six-drawing comparison and both-facing Dojo captures
for costume, proportions, full silhouette and clean edges.

Each direction uses three distinct crops held [2,2,2] within the unchanged
six-tick cue. Existing Pack 04 cue-age playback and sole-to-center root blend
remain unchanged. Seven Chromium DPR-1 browser checks pass in one run:
both fighters' twelve direction/facing jump sequences, backward root handoff,
and both fighters' eight total tap/hold/facing squat cases plus sole checks.
Every takeoff now shows ages0–5, with three crops each held twice and the first
rise crop matching the final takeoff. Visible bodies/facing and backward
momentum pass. Short/full launch vy -9.35/-15.35, apex y400/y283, and 29/48
additional steps to touchdown remain unchanged. No engine/physics edits.

[Six new drawings](reviews/velvet-takeoff-six-new-drawings-2026-11-18.png)
· [both-facing Dojo board](reviews/velvet-three-directional-takeoffs-both-facings-2026-11-18.png)
· [six full jump traces](reviews/velvet-three-directional-takeoffs-traces-2026-11-18.json).
Board rows: neutral left/right, forward left/right, backward left/right.
Frame-step evidence only; normal-speed full-sequence visual review remains open.

Revision127: 1,330 packed slots, four pages, 11,123,670 transfer bytes and
140 source clip keys per fighter. Local only, not deployed. Zero new drawings
remain in the sixteen-drawing Pack 04 squat/takeoff subpass. Next record/review
both fighters' complete squat/takeoff/rise/apex/fall/landing at normal speed in
both facings, including short/full and backward takeoffs. Other-pack movement
gaps remain separately open; this is not complete roster parity.

## Pack 04 complete jump normal-speed review — 2026-11-18

Added a repeatable browser capture test covering 24 cases: both fighters,
both facings, neutral/forward/backward takeoff, and short/full jump. Both
Chromium DPR-1 tests pass all twelve cases each. Neutral/forward include the
entire squat at normal speed; backward prepares the opposite-momentum facing
reversal through squat frame1 with frame stepping, then resumes takeoff through
landing at normal speed. The earlier frame-step tests cover all squat ticks.
Partner is stationary All-Rounder. No combat or interruptions are added here.

Each case shows all three takeoff crops in order at normal speed, followed by
rise, apex, fall, soft/heavy landing and idle. Every airborne sample has a
visible body with correct facing and finite root coordinates; backward launch
velocity opposes facing. Every case returns grounded. Observed short-hop apex
samples are y400–400.25 and full-hop samples y283–283.25; fractional differences
are render sampling rather than changed simulation targets. Prior frame-step
results remain exact. No physics, artwork, atlas or renderer changes this pass;
revision127 remains current.

The capture initially sent a 20ms short tap immediately on resuming freeze;
no jump was captured. Allowing resume to settle before a 30ms tap fixed this
fixture startup issue; final run passes without weakening pose-order checks.
This does not certify minimum supported tap duration or controller latency.

Reviewed decoded frames from the normal-speed recordings, including complete
recording overview sheets and 40ms-spaced full-jump crops. No new skin fallback,
costume drift, whole-body size snap or takeoff/rise position jump was identified
in those samples. Airborne tucked-to-extended posture changes remain discrete
sprite drawings; this review does not claim skeletal interpolation. The
recordings are 800×450 at 25fps and RAF traces have occasional longer gaps,
so this is not a 60fps performance signoff or proof that every one-tick squat
pose appears in a recording. Do not extend gameplay timing to fill video frames.

- [Zane recording](reviews/zane-complete-jumps-normal-speed-2026-11-18.webm) · [overview](reviews/zane-complete-jumps-overview-2026-11-18.png) · [dense full-jump crop](reviews/zane-complete-jumps-dense-full-jump-2026-11-18.png).
- [Velvet recording](reviews/velvet-complete-jumps-normal-speed-2026-11-18.webm) · [overview](reviews/velvet-complete-jumps-overview-2026-11-18.png) · [dense full-jump crop](reviews/velvet-complete-jumps-dense-full-jump-2026-11-18.png).
- [24-case summary](reviews/pack04-complete-jumps-normal-speed-summary-2026-11-18.json) · [all RAF traces](reviews/pack04-complete-jumps-normal-speed-traces-2026-11-18.json).

The Pack 04 basic jump/squat/takeoff drawing and local playback subpass is
complete with the limits above. No additional drawings were identified by this
review. Local only, not deployed. Next reconcile the remaining Pack 02/03
movement drawing counts and live phase budgets against the current audit table
before starting their movement expansion. Other roster parity gaps and native
Ultimate timing evidence remain separate; this is not whole-game release signoff.

## Pack 02/03 movement reconciliation — 2026-11-18

Decoded every movement crop from the actual loaded Dojo manifests: Pack02
revision74 dojo atlas, Pack03 revision72 production atlas. All 55 fighter/clip
entries match the earlier distinct-count table. RGBA hashes confirm that
pixel-identical references do not inflate these counts. Pixel differences do
not establish semantic pose approval.

[Reproducible ledger](reviews/pack02-03-movement-ledger-2026-11-18.json), generated
with `node scripts/assets/audit-movement-parity.mjs --output <output.json>`.
The script reads pixels without rebuilding art. Do not rerun the legacy
newcomer base builder: it can discard previously expanded clips.

### Minimum drawing ledger

Cells show current distinct pixels → target (minimum additional drawings).
Takeoff is three separate directional clips. This is the movement subset,
not every animation or a promise that existing poses need no replacement.

| Clip | Moonshine / Hoagie, each | Pack03 fighter, each |
| --- | --- | --- |
| Squat | 3 → 3 (+0) | 2 → 3 (+1) |
| Each takeoff direction | 2 → 3 (+1 each; +3 total) | 2 → 3 (+1 each; +3 total) |
| Rise | 2 → 6 (+4) | 2 → 6 (+4) |
| Apex | 2 → 6 (+4) | 2 → 6 (+4) |
| Fall | 2 → 6 (+4) | 2 → 6 (+4) |
| Fast fall | 2 → 6 (+4) | 3 → 6 (+3) |
| Double jump | 3 → 6 (+3) | 3 → 6 (+3) |
| Soft landing | 3 → 6 (+3) | 3 → 6 (+3) |
| Heavy landing | 2 → 6 (+4) | 3 → 6 (+3) |
| Per fighter minimum | **29** | **28** |

Total minimum: **142 new drawings**, plus any unsuitable-pose replacements
identified during review. Do not count replacements as progress toward the
additional-pose target. Pack04's completed subpass remains closed.

### Live budgets and defects

Five Chromium DPR-1 browser tests pass40 cases: five fighters × both facings ×
short/full/double/fast jump. Bodies stay visible, facing remains correct and
all cases land. All use three squat ticks and six takeoff ticks; double jump
presentation lasts twelve ticks. Full-jump phase counts and natural fast fall:

| Fighter | Rise | Apex | Fall | Natural fast fall | Short landing cue | Heavy cue |
| --- | ---: | ---: | ---: | ---: | --- | ---: |
| Moonshine | 16 | 6 | 22 | 7 | absent | 18 |
| Hoagie | 14 | 6 | 19 | 5 | absent | 18 |
| Mr. Wrong | 15 | 6 | 21 | 6 | 12 | 18 |
| Loopy | 15 | 6 | 20 | 6 | 12 | 18 |
| Mrs. Tasselbottom | 8 | 5 | 14 | 3 | 12 | 18 |

Two verified defects take priority over new drawing:

1. Pack02 takeoff registers two drawings with durations [3,6], but live
   six-tick takeoff displays only the final crop. The renderer's non-Pack03/04
   explicit-duration takeoff branch holds the last pose. Correct cue-age
   playback and fit existing poses to six ticks before adding the third.
2. Pack02 short hops land directly into idle without a soft-landing cue.
   `withMovementArt` emits gentle `land_soft` only for Packs03/04. Add Pack02
   presentation coverage without recovery or physics changes; verify contact
   and immediate Jump/Attack/Shield/Special interruption.

Pack03 squat metadata sums to four ([2,2]) despite three actual state ticks.
Use [1,1,1] when adding the third drawing; do not lengthen the state. Pack03
apex currently selects two poses by velocity sign: six registered crops alone
would leave most unused. Resolve its clock/window before generating apex art.
Natural fast fall can last three ticks; verify full six-pose art from a high
fixture, accept natural prefixes, and never postpone landing to finish art.

[All 40 traces and counts](reviews/pack02-03-movement-budgets-2026-11-18.json).
Reviewed current squat/takeoff thumbnails:

- [hulk-hoagie](reviews/hulk-hoagie-current-squat-takeoff-2026-11-18.png).

- [loopy](reviews/loopy-current-squat-takeoff-2026-11-18.png).

- [moonshine](reviews/moonshine-current-squat-takeoff-2026-11-18.png).

- [mr-wrong](reviews/mr-wrong-current-squat-takeoff-2026-11-18.png).

- [mrs-tasselbottom](reviews/mrs-tasselbottom-current-squat-takeoff-2026-11-18.png).

Boards normalize thumbnail size; they are not gameplay scale measurements.

### Fixed next order

1. Correct the two Pack02 playback/trigger defects using existing art:
   **zero new drawings**. Verify directions/facings, contact and actions.
2. Expand Moonshine: directional takeoffs, rise, phase-budgeted apex, fall,
   fast fall, double jump and soft/heavy landing. Review one pose first and
   track new drawings separately from replacements.
3. Repeat for Hoagie, then Mr. Wrong, Loopy and Mrs. Tasselbottom. Maintain
   this ledger instead of restarting the audit.
4. Review full motion at 1x and interruptions. Reconcile the original three
   fighters' separate timing/landing exceptions before all-roster signoff;
   rare paired, combat and defensive transitions remain separate work.

No game code, artwork or atlas revision changed this pass. Local only, not
deployed or version-matched Ultimate timing certification.

## Pack 02 takeoff and gentle landing playback fixed — 2026-11-18

Corrected both verified defects using existing art. Pack02 takeoff now selects
by cue age, showing both drawings for three ticks each within the six-tick
window. `withMovementArt` now emits gentle `land_soft` for Moonshine and Hoagie;
Pack02 landing playback selects by cue age and holds its three existing poses
[3,3,6] within twelve ticks. Heavy cue priority remains unchanged. No added
recovery, physics, input lockout or new drawings.

The narrow, idempotent `scripts/assets/fix-newcomer-movement-timing.mjs` patches
only durations and synchronized source/dojo revision fields. Revision75 retains
146 clip keys per fighter and all existing frame rectangles/roots. All four
packed PNG SHA256 values remain unchanged. A second invocation reports no
changes. The legacy base atlas builder was not run.

Validation:

- Seven engine movement-cue tests passed; rebuilt engine output for live client.
- All91 full-body renderer unit tests and client typecheck passed.
- Both directional browser tests passed twelve fighter/direction/facing cases:
  takeoff ages0–5 show the two crops in [3,3] order and continue through rise,
  apex, fall and touchdown with visible skins.
- Both landing browser tests passed40 soft/heavy/facing/action cases. Gentle
  contact immediately selects pose0 and cue age0, all three soft crops play,
  the cue lasts twelve ticks, and Jump/Attack/Shield/Special interrupt on the
  next tick. Heavy presentation still lasts eighteen ticks. Contact has zero
  landing recovery. Initial fixture assumptions used Pack04 radius28; corrected
  expectations to Moonshine27 and Hoagie30 before the successful rerun.
- Both post-fix phase-budget tests passed16 short/full/double/fast/facing cases.
  Compared every sampled state/frame/y/vy/grounded/facing value with the earlier
  pre-fix traces: all sixteen physical traces are identical. Short landings
  now show three soft poses, and takeoffs now show both existing poses.

[Combined traces, action results and physical comparison](reviews/pack02-movement-fix-results-2026-11-18.json).
Restored landing crop boards: [Moonshine](reviews/moonshine-soft-landing-restored-2026-11-18.png),
[Hoagie](reviews/hulk-hoagie-soft-landing-restored-2026-11-18.png).
These are frame-step checks of existing art, not a new-drawing or normal-speed
visual signoff. Existing raised-foot/contact silhouettes remain unchanged.

Local only, not deployed. New-drawing baseline remains142; these corrections
close playback defects and do not reduce the pixel-count gaps. Next expand
Moonshine directional takeoffs from two to three distinct drawings per clip,
reviewing one pose first against his shipped costume and checking actual
start/end suitability before deciding whether a replacement is also needed.

## Moonshine three-pose directional takeoffs completed — 2026-11-18

Reviewed one neutral midpoint against the shipped idle costume and actual
existing takeoff endpoints before generating forward/backward midpoints.
Retained all six existing endpoints and inserted three dedicated drawings.
Costume remains raccoon cap/tail, cream undershirt, dark suspenders, red scarf,
cream wraps, patched blue jeans/rolled cuffs, hip rope and brown yellow-laced
boots. Shipped idle reference is a reproducible crop, not the old sketch.

- [Neutral source](../../concept-art/sprite/pack-02/moonshine-takeoff-neutral-mid-between-v1.png) · [exact built-in prompt/reference record](../../concept-art/sprite/pack-02/moonshine-takeoff-neutral-mid-between-v1.prompt.json).
- [Forward source](../../concept-art/sprite/pack-02/moonshine-takeoff-forward-mid-between-v1.png) · [exact built-in prompt/reference record](../../concept-art/sprite/pack-02/moonshine-takeoff-forward-mid-between-v1.prompt.json).
- [Backward source](../../concept-art/sprite/pack-02/moonshine-takeoff-backward-mid-between-v1.png) · [exact built-in prompt/reference record](../../concept-art/sprite/pack-02/moonshine-takeoff-backward-mid-between-v1.prompt.json).

Neutral source preview haze consists of alpha<=5 pixels; normal preparation
removes it without redrawing. A background-edit alternative reproduced haze
and is unused. Prepared bounds neutral/forward/backward: 529×1310, 719×1298,
1058×1240; final reviewed world heights76/74/74. Alpha<=5 cleanup clears
18,142/17,809/18,022 pixels. Forward also had exactly two distant alpha6
specks; remove only those beyond four pixels from solid ink. The original
sources are preserved. No detached residue remains after preparation.

Narrow reproducible integration: `node scripts/assets/expand-moonshine-takeoffs.mjs`,
then `node scripts/assets/build-production-fighter-atlas.mjs --dojo`. It edits
only Moonshine's three takeoff clips in the expanded source manifest, inserts
prepared images/anchors and uses [2,2,2] within the existing six ticks. It does
not run the legacy base generator. The earlier timing-fix script now respects
three-pose schedules. Both scripts rerun idempotently. Existing start/end art
and its registration remain unchanged; new midpoint anchors are explicit.

Six browser regression tests passed: twelve takeoff direction/facing cases
across both fighters, forty soft/heavy landing/action cases, and sixteen
short/full/double/fast phase-budget cases. Moonshine shows all three takeoff
crops twice in cue ages0–5; Hoagie retains two poses [3,3]. Bodies stay visible,
facing and backward momentum pass, and landing actions remain immediate.
One normal-speed browser test also passes all twelve Moonshine cases: both
facings × neutral/forward/backward × short/full. Each observes all three
crops, then rise/apex/fall/landing/idle. The normal capture retains the earlier
backward squat setup protocol and 25fps recording limitation.

Reviewed frame-step boards, light/dark composites and decoded recording
overview. No new visible halo or skin fallback was identified in those samples.
This does not close the two-pose rise/apex/fall gaps or certify every display
refresh. No physics, engine or gameplay timing changes in this art step.

[Both-facing takeoff board](reviews/moonshine-three-directional-takeoffs-both-facings-2026-11-18.png)
· [normal-speed recording](reviews/moonshine-three-takeoffs-normal-speed-2026-11-18.webm)
· [recording overview](reviews/moonshine-three-takeoffs-normal-overview-2026-11-18.png)
· [twelve-case summary](reviews/moonshine-three-takeoffs-normal-summary-2026-11-18.json)
· [regression traces](reviews/moonshine-three-takeoffs-dojo-traces-2026-11-18.json).
Comparisons:

- neutral: [light](reviews/moonshine-takeoff-neutral-mid-light-2026-11-18.png), [dark](reviews/moonshine-takeoff-neutral-mid-dark-2026-11-18.png).

- forward: [light](reviews/moonshine-takeoff-forward-mid-light-2026-11-18.png), [dark](reviews/moonshine-takeoff-forward-mid-dark-2026-11-18.png).

- backward: [light](reviews/moonshine-takeoff-backward-mid-light-2026-11-18.png), [dark](reviews/moonshine-takeoff-backward-mid-dark-2026-11-18.png).

Pack02 source/dojo revision76 retains146 clip keys per fighter, four pages,
1,017 packed slots and17,424,091 transfer bytes. Local only, not deployed.
[Updated pixel ledger](reviews/pack02-03-ledger-after-moonshine-takeoffs-2026-11-18.json):
minimum139 new movement drawings remain in this subset: Moonshine26, Hoagie29,
Mr.Wrong/Loopy/Mrs.Tasselbottom28 each. This step added exactly three drawings,
zero endpoint replacements. Next Moonshine rise: add four distinct drawings
between/reconciled with the two current poses, review one first, preserve jump
physics and verify phase scheduling in both facings. Original-three timing
exceptions and non-movement parity remain separate.

## Moonshine six-pose rise completed — 2026-11-18

Reviewed early rise first against shipped costume and both existing rise
endpoints. Added four compact airborne drawings; retained the two original
endpoints. One split-leg candidate was rejected because it reopened the leg
shape too far between compact poses. Sources and exact built-in prompts:

- [early](../../concept-art/sprite/pack-02/moonshine-rise-early-between-v1.png) · [prompt/reference record](../../concept-art/sprite/pack-02/moonshine-rise-early-between-v1.prompt.json).
- [mid](../../concept-art/sprite/pack-02/moonshine-rise-mid-between-v1.png) · [prompt/reference record](../../concept-art/sprite/pack-02/moonshine-rise-mid-between-v1.prompt.json).
- [late](../../concept-art/sprite/pack-02/moonshine-rise-late-between-v1.png) · [prompt/reference record](../../concept-art/sprite/pack-02/moonshine-rise-late-between-v1.prompt.json).
- [settle](../../concept-art/sprite/pack-02/moonshine-rise-settle-between-v1.png) · [prompt/reference record](../../concept-art/sprite/pack-02/moonshine-rise-settle-between-v1.prompt.json).

Costume remains the shipped raccoon cap/tail, cream shirt, suspenders, red
kerchief, wraps, patched blue jeans/cuffs, hip rope and yellow-laced boots.
Prepared bounds early/mid/late/settle: 576×1248, 568×1232, 675×1305, 661×1498;
reviewed world heights66/65/66/65. Alpha<=5 cleanup removes
14,037/13,581/17,062/17,706 faint pixels. Settle also has four distant pixels
at alpha<=7; narrow cleanup removes only those beyond four pixels from solid
ink. Originals retained; prepared crops have no detached residue.

Reproducible narrow expansion: `node scripts/assets/expand-moonshine-rise.mjs`,
then `node scripts/assets/build-production-fighter-atlas.mjs --dojo`.
Six distinct drawings use [2,2,2,2,2,2] within the existing twelve-tick art
schedule. The rise now uses its own phase clock and holds the last drawing
when the physical rise lasts longer; expiring takeoff cues cannot rewind it.
The existing guided airborne registration is retained, with explicit midpoint
anchors and support seven world units below boot extent. The Pack04 clock
branch is reused only for Moonshine rise; other Pack02 phases and Hoagie stay
unchanged. No jump physics or authoritative timing edits.

Three browser tests passed in one run:

- Sixteen short/full/double/fast/facing cases across Moonshine and Hoagie.
  Moonshine full rise shows all six rectangles in order: five two-tick holds,
  then the final drawing through the remaining rise ticks. No pose cycling.
- Twelve Moonshine normal-speed direction/facing/short-full cases. All six
  rise drawings appear in every held full jump, with all three takeoff poses,
  followed by apex/fall/landing. Natural short hops show a valid prefix.
- All bodies remain visible, facing and touchdown pass, jump apex measurements
  remain consistent with the existing baseline. Double jump and fast fall
  still interrupt the rise. All91 renderer unit tests and client typecheck pass.

Reviewed the six-pose both-facing board, light/dark comparisons and decoded
normal-speed recording overview; no new visible halo or missing skin appeared
in those samples. Recording remains800×450/25fps; this is not a 60fps performance
or native Ultimate motion signoff.

[Six-pose board](reviews/moonshine-six-rise-both-facings-2026-11-18.png)
· [normal-speed recording](reviews/moonshine-six-rise-normal-speed-2026-11-18.webm)
· [overview](reviews/moonshine-six-rise-normal-overview-2026-11-18.png)
· [normal-speed summary](reviews/moonshine-six-rise-normal-summary-2026-11-18.json)
· [all traces](reviews/moonshine-six-rise-traces-2026-11-18.json).
Comparisons:

- early: [light](reviews/moonshine-rise-early-light-2026-11-18.png), [dark](reviews/moonshine-rise-early-dark-2026-11-18.png).

- mid: [light](reviews/moonshine-rise-mid-light-2026-11-18.png), [dark](reviews/moonshine-rise-mid-dark-2026-11-18.png).

- late: [light](reviews/moonshine-rise-late-light-2026-11-18.png), [dark](reviews/moonshine-rise-late-dark-2026-11-18.png).

- settle: [light](reviews/moonshine-rise-settle-light-2026-11-18.png), [dark](reviews/moonshine-rise-settle-dark-2026-11-18.png).

Source/dojo revision77 retains146 clips per fighter and four pages, now1,021
packed slots and17,499,215 transfer bytes. Expansion reruns without changes.
Local only, not deployed. [Updated pixel ledger](reviews/pack02-03-ledger-after-moonshine-rise-2026-11-18.json)
records135 minimum additional movement drawings: Moonshine22, Hoagie29 and
Pack03 fighters28 each. This step adds four drawings and no replacements.
Next Moonshine apex: settle its current six-tick live presentation window and
clock before generating four new poses. Do not slow the jump to fit artwork;
verify a renderer-only window adjustment or explicit natural prefix policy.
Other fighters' timing exceptions and non-movement gaps remain separate.


## Moonshine six-pose apex completed — 2026-11-18

Four new apex drawings were reviewed against the shipped idle costume:
raccoon cap/tail, cream undershirt, suspenders, red kerchief, wraps, patched
blue jeans/cuffs, rope and yellow-laced boots. The early pose was reviewed
before the other three. Both existing apex drawings remain in the sequence.
Order: early, mid, original0, late, settle, original1.

Preparation clears alpha<=5 reproducibly, preserving raw sources and prompt
sidecars. Early/mid/late/settle prepared bounds are730×1533,589×1378,745×1806,
571×1440, with world heights67/70/75/75. Late additionally removes24 isolated
pixels at alpha<=42 and settle removes7 at alpha<=7, only farther than four
pixels from solid alpha>=128. Nearby edge antialiasing is retained. Existing
apex drawings are registered at world heights76/75; all six use a common
vertical root73 world units below crop top. This corrects the original smaller
apex silhouette while keeping the upper-body anchor consistent with rise/fall.

A renderer-only inclusive velocity band abs(vy)<=4 gives short hops thirteen
apex ticks and full jumps twelve, rather than seven/six. Six two-tick poses
advance once on a phase-local clock and hold the last if needed. Full rise
still has thirteen ticks. Attacks, dodges and fast falls keep their priorities.
No engine movement, airtime, jump height or action timing changed. All eight
Moonshine physical traces match the previous rise baseline exactly for state,
state frame, y, vy, grounded, facing and fast-fall flag.

Validation:
- Frame-stepped Moonshine and Hoagie budget tests pass sixteen cases covering
  both facings and short/full/double/fast jumps. Both natural apexes show all
  six drawings in order; final hold is three ticks for short, two for full.
- Isolated live Dojo review passes all twelve Moonshine direction/facing/
  short-full cases, showing three takeoff and six apex crops in order.
  All full jumps show the six rise crops. Bodies stay visible through landing.
- The first combined capture failed to sample the final takeoff crop, not an
  apex crop. The unchanged isolated run passes; capture cadence is a limitation
  of this live sampling check, not proof of a missing runtime slot.
- Client typecheck and all91 full-body renderer unit tests pass.
- Reviewed the six-pose both-facing board, anchor-aligned light/dark sequence
  and decoded half-second recording overview. No new halo or missing skin in
  those samples. The800×450/25fps recording and sampled overview do not certify
  60fps performance or exact Ultimate motion.

[Both-facing Dojo board](reviews/moonshine-six-apex-both-facings-2026-11-18.png)
· [normal recording](reviews/moonshine-six-apex-normal-speed-2026-11-18.webm)
· [overview](reviews/moonshine-six-apex-normal-overview-2026-11-18.png)
· [summary](reviews/moonshine-six-apex-normal-summary-2026-11-18.json)
· [traces](reviews/moonshine-six-apex-traces-2026-11-18.json)
· [physical comparison](reviews/moonshine-six-apex-physical-comparison-2026-11-18.json)
· [light registration](reviews/moonshine-six-apex-registration-light-2026-11-18.png)
· [dark registration](reviews/moonshine-six-apex-registration-dark-2026-11-18.png).

Run the narrow apex expansion then the dojo packer. Expansion reruns unchanged.
Source/dojo revision78 retains146 clips per fighter and four pages, with1,025
slots and17,586,523 transfer bytes. Local only, not deployed.
[Updated pixel ledger](reviews/pack02-03-ledger-after-moonshine-apex-2026-11-18.json)
records131 minimum movement drawings left: Moonshine18, Hoagie29, each Pack03
fighter28. Four drawings added, none replaced. Next: Moonshine fall, four new
drawings, first-pose review and rise/apex/fall continuity. Other timing and
non-movement gaps remain separate.


## Moonshine six-pose fall completed — 2026-11-18

Four new fall drawings use the shipped idle costume, with the early drawing
reviewed before the remaining three. Brown raccoon cap/tail, cream undershirt,
suspenders, red kerchief, wraps, patched blue jeans/cuffs, rope and yellow-laced
boots remain consistent. Sequence: original0, early, mid, late, settle,
original1. Both original drawings are retained. Exact built-in image generation
prompts and the canonical reference are saved beside each new source under
concept-art/sprite/pack-02/moonshine-fall-*-between-v1.prompt.json.

Preparation clears alpha<=5. Early/mid/late/settle bounds are643×1811,
592×1414,651×1604,582×1592. Cleared low-alpha pixels:24,826/21,086/25,588/
22,419. Late additionally removes two detached alpha<=7 pixels farther than
four pixels from solid alpha>=128; other crops have no detached residue.
All new drawings use world height75 and root73 from the crop top. Original
fall0/fall1 use heights74/75 with the same root, matching the preceding apex.
Raw sources are preserved.

Six two-tick poses progress on Moonshine's phase-local clock, then hold final,
instead of looping on global state age. Full jump fall lasts nineteen ticks:
the first five drawings hold two ticks each, then the last nine ticks. Natural
short hops use the first four drawings across eight ticks and immediately land.
Double-jump fall lasts twenty-two ticks; fast fall keeps its existing priority.
No engine, jump height, airtime, gravity, landing or action timing edits.

Validation:
- Two frame-stepped budget tests pass sixteen Moonshine/Hoagie cases, including
  both facings, short/full/double/fast. Full and short fall order is asserted
  every tick, and all bodies stay visible.
- Twelve normal-speed Moonshine direction/facing/short-full cases pass. Every
  full jump samples all six rise, apex and fall rectangles in order, with all
  three takeoff poses. Backward cases prepare the precise facing reversal
  through squat frame1, then run takeoff-to-landing at1x.
- Eight Moonshine physical traces exactly match the previous apex baseline for
  state, frame, y, vy, grounded, facing and fast-fall flag.
- Client typecheck and all91 full-body renderer tests pass.
- Reviewed both-facing Dojo board, light/dark apex-fall-landing registration
  and decoded half-second overview of normal-speed recording. No new halo,
  empty sprite or root snap in those samples. Recording is800×450/25fps;
  sampled visual review does not certify60fps performance or Ultimate parity.

[Both-facing board](reviews/moonshine-six-fall-both-facings-2026-11-18.png)
· [recording](reviews/moonshine-six-fall-normal-speed-2026-11-18.webm)
· [overview](reviews/moonshine-six-fall-normal-overview-2026-11-18.png)
· [summary](reviews/moonshine-six-fall-normal-summary-2026-11-18.json)
· [traces](reviews/moonshine-six-fall-traces-2026-11-18.json)
· [physics comparison](reviews/moonshine-six-fall-physical-comparison-2026-11-18.json)
· [light registration](reviews/moonshine-six-fall-registration-light-2026-11-18.png)
· [dark registration](reviews/moonshine-six-fall-registration-dark-2026-11-18.png).

Narrow builder expand-moonshine-fall.mjs reruns unchanged. Source/dojo revision79
retains146 clips per fighter and four atlas pages, now1,029 slots and17,666,088
transfer bytes. Local only, not deployed.
[Updated ledger](reviews/pack02-03-ledger-after-moonshine-fall-2026-11-18.json)
records127 minimum movement drawings left: Moonshine14, Hoagie29, each Pack03
fighter28. Four drawings added, no replacements. Next: budget Moonshine fast
fall, then add its four missing drawings; short natural windows may show only
a prefix. Keep physics unchanged. Other timing/non-movement gaps remain separate.


## Moonshine six-pose fast fall completed — 2026-11-18

Four new fast-fall in-betweens match the shipped raccoon cap/tail, cream
undershirt, suspenders, red kerchief, wraps, patched blue jeans/cuffs, hip rope
and yellow-laced boots. Early pose reviewed before remaining drawings. Existing
two compact fast-fall drawings retained; sequence original0,early,mid,late,
settle,original1. Exact built-in image generation prompts and reference are
saved beside sources as moonshine-fastfall-*-between-v1.prompt.json.

Prepared early/mid/late/settle bounds683×1217,597×1306,691×1391,604×1402.
Alpha<=5 cleanup removes15,319/16,510/15,527/17,665 low-alpha pixels. Mid has
fifteen detached alpha<=7 pixels removed only farther than four pixels from
solid alpha>=128; other crops have no detached residue. Raw originals retained.
New compact poses use world height60; original endpoints60/59. Common top-to-root
distance73 matches preceding apex/fall registration while allowing the compact
knees and boots to remain above the airborne root.

Playback now uses phase-local age, six two-tick poses and final hold. The
natural full-jump fast fall lasts seven ticks and shows the first four drawings,
then immediately lands. Do not slow descent to finish art. A controlled Dojo
high-drop fixture starts at640,-100 with zero velocity, inside the blast boundary;
it provides room to show all six. That fixture is visual coverage, not a claim
that an ordinary jump reaches that height. No authoritative physics changed.

Four browser tests pass:
- Sixteen Moonshine/Hoagie short/full/double/fast cases across both facings.
  Moonshine's seven fast-fall ticks assert exact pose order and retain landing.
- High-drop stepped and normal-speed tests in both facings show all six crops,
  visible and correctly mirrored. On first grounded sample fast-fall is cleared
  and landing art takes priority.
- Eight Moonshine physical traces exactly match the prior six-fall baseline
  for state/frame/y/vy/grounded/facing/fast flag.
- Client typecheck and all91 full-body renderer unit tests pass.

Reviewed both-facing six-pose Dojo board, light/dark registered apex-to-fastfall-
to-landing sequence, and decoded half-second overview of the normal recording.
No new visible halo or empty sprite in those samples. Capture800×450/25fps and
sampled overview do not certify60fps motion, human feel or exact Ultimate parity.

[Both-facing board](reviews/moonshine-six-fastfall-both-facings-2026-11-18.png)
· [normal recording](reviews/moonshine-six-fastfall-normal-speed-2026-11-18.webm)
· [overview](reviews/moonshine-six-fastfall-normal-overview-2026-11-18.png)
· [traces and physical comparison](reviews/moonshine-six-fastfall-traces-2026-11-18.json)
· [light registration](reviews/moonshine-six-fastfall-registration-light-2026-11-18.png)
· [dark registration](reviews/moonshine-six-fastfall-registration-dark-2026-11-18.png).

Reproducible narrow expansion expand-moonshine-fastfall.mjs reruns unchanged.
Source/dojo revision80 retains146 clips per fighter, four pages, now1,033slots
and17,735,595 transfer bytes. Local only, not deployed.
[Pixel ledger](reviews/pack02-03-ledger-after-moonshine-fastfall-2026-11-18.json)
records123 minimum movement drawings remaining: Moonshine10, Hoagie29 and each
Pack03 fighter28. Four additions, no replacements. Next Moonshine double jump:
add three drawings to reach six, review first pose, preserve jump timing and
verify the transition back into rise/apex/fall. Other gaps remain separate.


## Moonshine six-pose double jump completed — 2026-11-18

Three new in-betweens match shipped costume and retain all three existing
double-jump drawings. Early pose reviewed before remaining drawings. Sequence:
original0,early,original1,mid,late,original2. New scale was adjusted against
existing head size, not copied from a shared full-body bounding height.
Exact built-in generation prompts/reference are preserved in the source folder
as moonshine-double-*-between-v1.prompt.json.

Prepared early/mid/late bounds624×1482,588×1436,607×1126; world heights78/82/74.
Alpha<=5 preparation clears17,546/18,934/19,430 pixels. Narrow detached cleanup
removes361 at alpha<=64,13 at alpha<=9 and5 at alpha<=9, respectively, only
farther than four pixels from solid alpha>=128. Nearby antialiasing retained.
Raw images remain intact. Retained drawings preserve their scales; all six use
a common root73 world units below crop top to prevent head-anchor jumps.

Durations are six two-tick poses within the existing twelve-tick double-jump
presentation. Existing renderer cue indexing supports six directly; no runtime
renderer or authoritative engine edits in this step. The transition returns
to the final rise tuck, followed by apex/fall/landing.

Four browser tests pass:
- Sixteen short/full/double/fast cases across Moonshine and Hoagie, both facings.
  Moonshine double-jump order is asserted on every tick: all six poses hold twice.
- Dedicated stepped and normal-speed double jumps in both facings show all six
  crops, visible and correctly mirrored. First subsequent rise crop equals the
  final rise drawing. Landing remains available.
- Eight Moonshine physical traces match the prior fast-fall baseline exactly
  for state/frame/y/vy/grounded/facing/fast flag.
- Preparation reruns unchanged; pixel ledger confirms six distinct drawings.

Reviewed both-facing Dojo board, light/dark rise-double-rise registration and
decoded half-second overview from the normal-speed recording. No new halo,
empty skin or anchor snap in those samples. Recording800×450/25fps and sampled
visual review do not certify60fps performance, human feel or Ultimate parity.

[Both-facing board](reviews/moonshine-six-double-both-facings-2026-11-18.png)
· [recording](reviews/moonshine-six-double-normal-speed-2026-11-18.webm)
· [overview](reviews/moonshine-six-double-normal-overview-2026-11-18.png)
· [traces and physics comparison](reviews/moonshine-six-double-traces-2026-11-18.json)
· [light registration](reviews/moonshine-six-double-registration-light-2026-11-18.png)
· [dark registration](reviews/moonshine-six-double-registration-dark-2026-11-18.png).

Narrow expansion expand-moonshine-double.mjs preserves expanded clips. Source/
dojo revision81 retains146 clips/fighter and four pages, now1,036 slots,
17,803,839 transfer bytes. Local only, not deployed.
[Updated ledger](reviews/pack02-03-ledger-after-moonshine-double-2026-11-18.json)
records120 minimum movement drawings left: Moonshine7, Hoagie29, each Pack03
fighter28. Three additions, no replacements. Moonshine's remaining movement
drawings are soft landing3 and heavy landing4. Next soft landing, first-pose
review and planted-foot/action-interruption validation. Other timing and
non-movement gaps remain separate.


## Moonshine six-pose soft landing completed — 2026-11-18

Three new drawings retain the three shipped landing drawings. Sequence:
original0,early-v2,original1,mid,late,original2; six two-tick poses fit the
unchanged twelve-tick visual window. First early candidate was rejected for a
small head. The corrected early-v2 was reviewed before remaining drawings,
using shipped idle and landing0 references. Costume remains raccoon cap/tail,
cream undershirt, suspenders, red kerchief, wraps, patched blue jeans/cuffs,
rope and yellow-laced boots. Exact built-in image generation prompts and
references are saved beside sources; rejected v1 is explicitly marked unused.

The registered fall-soft-idle comparison then exposed inherited oversized heads
in the original landing set. All landing scales were reduced together to80%
of the initial landing registration. This aligns the head/body size with fall
and idle while keeping crouched poses physically shorter. Original drawings
remain intact; only their per-frame scale changes. New early/mid/late world
heights56/57.6/60.8. Prepared bounds1008×1439,761×1420,723×1443.
Alpha<=5 cleanup removes22,442/19,457/18,905 pixels; zero detached residue after
preparation. New roots use the center of solid sole support in the bottom2%
of each crop, with rootY two source pixels above crop bottom. All six measured
solid sole bottoms lie within0.274 world units of their planted roots.

Validation:
- Initial seven browser regressions pass forty movement-budget cases across
  Packs02/03 and forty landing/action cases across Pack02.
- After final scale correction, Moonshine's budget and landing tests pass eight
  jump cases and twenty landing/action cases, both facings. Soft landing holds
  each of six poses twice; no extra recovery is introduced.
- Jump, Attack, Shield and Special interrupt soft/heavy landing on the first
  input tick, with zero landing lag in these non-attack landing fixtures.
- Twelve final normal-speed direction/facing/short-full cases pass. All six
  soft-landing crops appear in every short-hop case and return to idle.
- Eight physical traces match the previous double-jump baseline exactly for
  state/frame/y/vy/grounded/facing/fast flag. No engine or renderer code edits.
- Narrow preparation reruns unchanged; pixel ledger confirms six distinct crops.

Reviewed both-facing Dojo board, light/dark fall-soft-idle registration and
decoded half-second recording overview. No new halo or missing skin in those
samples. CPU overlap obscures parts of some landing screenshots; source
registration board provides unobstructed comparison. The800×450/25fps recording
and sampled overview do not certify60fps motion or Ultimate parity.

[Both-facing board](reviews/moonshine-six-soft-both-facings-2026-11-18.png)
· [normal recording](reviews/moonshine-six-soft-normal-speed-2026-11-18.webm)
· [overview](reviews/moonshine-six-soft-normal-overview-2026-11-18.png)
· [summary](reviews/moonshine-six-soft-normal-summary-2026-11-18.json)
· [traces/physics comparison](reviews/moonshine-six-soft-traces-2026-11-18.json)
· [action results](reviews/moonshine-six-soft-actions-2026-11-18.json)
· [sole measurements](reviews/moonshine-six-soft-sole-check-2026-11-18.json)
· [light registration](reviews/moonshine-six-soft-registration-light-2026-11-18.png)
· [dark registration](reviews/moonshine-six-soft-registration-dark-2026-11-18.png).

Source/dojo revision83 retains146clips/fighter and four pages, now1,039 slots
and17,893,771 transfer bytes. Local only, not deployed.
[Updated ledger](reviews/pack02-03-ledger-after-moonshine-soft-2026-11-18.json)
records117 minimum movement drawings left: Moonshine4, Hoagie29, each Pack03
fighter28. Three additions, no original pixel replacements. Next Moonshine
heavy landing: four additions, idle-relative head scale, planted support and
first-input interruption checks. Other timing/non-movement gaps stay separate.


## Moonshine six-pose heavy landing completed — 2026-11-18

Four new recovery drawings match the shipped idle and heavy-landing costume:
raccoon cap/tail, cream undershirt, suspenders, red kerchief, wraps, patched
blue jeans/cuffs, rope and yellow-laced boots. Early drawing reviewed before
the remaining set. Both original drawings retained, with their existing scales
and roots. Final order: original touchdown, early, mid, late, original wide
recovery, new settling guard. Placing the wide recovery before the new settle
avoids reopening the stance immediately before idle.

New early/mid/late/settle world heights are 56/60/65/73. Prepared bounds:
1226×1140, 1058×1177, 1102×1292, 736×1465. Alpha<=5 preparation clears
19,828/16,552/18,631/19,654 pixels; no detached residue remains in the prepared
crops. Raw artwork and exact built-in generation prompts/reference paths are
preserved beside sources as moonshine-heavy-*-between-v1.prompt.json.
New roots center the solid sole span in the bottom 2% of each crop. All six
solid sole bottoms are within 0.261 world units of the planted root.

Playback now uses the heavy-landing cue age for Moonshine, with six three-tick
poses across the existing eighteen-tick visual window. This replaces the old
two-drawing resampling path. No engine timing, airtime, landing lag or action
availability changes. Hoagie's existing heavy-landing path remains unchanged.

Validation:
- Moonshine movement-budget and landing/action browser tests pass eight jump
  cases and twenty landing cases across both facings.
- Heavy landing shows six distinct crops, each for three ticks, after full,
  double and fast-fall jumps. Jump, Attack, Shield and Special interrupt the
  landing on the first input tick; non-attack landing lag remains zero.
- Final isolated normal-speed run passes twelve direction/facing/short-full
  jumps. Every held full jump shows all six heavy-landing crops in order.
- Eight physical traces match the prior soft-landing baseline exactly for
  state/frame/y/vy/grounded/facing/fast flag.
- Client typecheck and all 91 full-body renderer tests pass.
- Narrow preparation reruns unchanged. Pixel ledger verifies six distinct
  heavy-landing drawings and no remaining Moonshine movement drawing deficit.

The first normal-speed capture missed an existing takeoff midpoint, jumping
from cue age 1 to 4 with a maximum 40.9 ms RAF gap. The unchanged isolated
rerun passed. The failed trace is retained; it is a capture/render-cadence
limit and is not evidence of a missing heavy-landing drawing.
Reviewed the both-facing Dojo board, unobstructed light/dark fall-heavy-idle
registration and decoded half-second overview of the final recording. CPU
overlap obscures parts of some Dojo frames. No new halo or missing sprite in
the reviewed samples. The 800×450/25fps recording does not certify 60fps
performance, human feel or exact Ultimate motion.

[Both-facing board](reviews/moonshine-six-heavy-both-facings-2026-11-18.png)
· [recording](reviews/moonshine-six-heavy-normal-speed-2026-11-18.webm)
· [overview](reviews/moonshine-six-heavy-normal-overview-2026-11-18.png)
· [summary](reviews/moonshine-six-heavy-normal-summary-2026-11-18.json)
· [traces and physics comparison](reviews/moonshine-six-heavy-traces-2026-11-18.json)
· [action results](reviews/moonshine-six-heavy-actions-2026-11-18.json)
· [sole checks](reviews/moonshine-six-heavy-sole-check-2026-11-18.json)
· [failed takeoff capture](reviews/moonshine-heavy-initial-takeoff-capture-2026-11-18.json)
· [light registration](reviews/moonshine-six-heavy-registration-light-2026-11-18.png)
· [dark registration](reviews/moonshine-six-heavy-registration-dark-2026-11-18.png).

Source/dojo revision 85 retains 146 clips per fighter and four pages, with
1,043 slots and 17,987,145 transfer bytes. Local only, not deployed.
[Updated movement ledger](reviews/pack02-03-ledger-after-moonshine-heavy-2026-11-18.json)
records 113 minimum drawings left: Moonshine 0, Hoagie 29, and each Pack 03
fighter 28. This closes Moonshine's eleven-clip movement drawing targets,
not all roster animation or timing work. Four additions, no original pixel
replacements. Next: Hoagie's three directional takeoff midpoints, one-pose-first
review against shipped costume, followed by both-facing Dojo checks.


## Hoagie three-pose directional takeoffs completed — 2026-11-19

Three new midpoints expand neutral, forward and backward takeoffs to three
drawings each. Both original drawings and their registration are retained in
each clip. Neutral midpoint reviewed before the directional drawings, using
the shipped idle and respective takeoff endpoint. Costume is locked to brown
flat cap, short dark beard, burgundy singlet with cream edging, cream wraps,
dark rounded studded knee pads and tall brown boots with cream laces.
Exact built-in generation prompts/reference paths are saved beside sources as
hoagie-takeoff-*-mid-between-v1.prompt.json.

Neutral/forward/backward prepared bounds are 705×1605, 915×1319, 1050×1308.
Alpha<=5 preparation clears 12,012/13,195/9,341 low-alpha pixels. Prepared
crops have no detached residue; raw sources remain intact. World heights are
80/76/76, with top-to-root distances 81/75/80 world units, between the retained
support registrations. Forward/backward body inclinations follow the respective
shipped endpoint; backward art faces toward the opponent while momentum is away.

Each clip uses [2,2,2] within its unchanged six-tick takeoff cue. No renderer,
jump physics, airtime or input timing changes. The narrow expansion preserves
the expanded manifest. The earlier timing-maintenance script now recognizes
six-frame soft landings, so running it cannot reset Moonshine's completed
landing to the old three-duration array. Its verification reruns unchanged,
with atlas PNG hashes unchanged.

Validation:
- Six browser tests pass twelve direction/facing takeoff cases, forty Pack 02
  soft/heavy landing and action cases, and sixteen Pack 02 movement-budget cases.
  Takeoff cue ages 0–5 map exactly to two holds per drawing.
- Twelve Hoagie normal-speed direction/facing/short-full cases pass. All three
  takeoff crops appear in order; backward launch momentum opposes facing.
  Bodies remain visible and return through apex/fall/landing to idle.
- Eight Hoagie physical traces exactly match the prior baseline for state,
  frame, y, vy, grounded, facing and fast-fall flag.
- Narrow preparation reruns unchanged; ledger verifies three distinct drawings
  per directional takeoff.

Reviewed both-facing midpoint Dojo board, unobstructed light/dark registered
three-pose sequences and decoded half-second normal recording overview.
No new visible halo or missing skin in those samples. Some frames have partner
overlap. Recording is 800×450/25fps; RAF gaps reach 46.1 ms in the initial live
case, so this is not a 60fps performance or exact Ultimate motion signoff.

[Both-facing board](reviews/hoagie-three-takeoffs-both-facings-2026-11-19.png)
· [recording](reviews/hoagie-three-takeoffs-normal-speed-2026-11-19.webm)
· [overview](reviews/hoagie-three-takeoffs-normal-overview-2026-11-19.png)
· [summary](reviews/hoagie-three-takeoffs-normal-summary-2026-11-19.json)
· [traces and physics comparison](reviews/hoagie-three-takeoffs-traces-2026-11-19.json)
· [light registration](reviews/hoagie-three-takeoffs-registration-light-2026-11-19.png)
· [dark registration](reviews/hoagie-three-takeoffs-registration-dark-2026-11-19.png).

Source/dojo revision 86 retains 146 clips per fighter, four pages, 1,046 slots
and 18,060,705 transfer bytes. Local only, not deployed.
[Updated movement ledger](reviews/pack02-03-ledger-after-hoagie-takeoffs-2026-11-19.json)
records 110 minimum drawings left: Moonshine 0, Hoagie 26, and each Pack 03
fighter 28. Three additions, no replacements. Next: Hoagie rise, four new
drawings, with first-pose costume review and phase-clock/budget verification.
Other timing and non-movement gaps remain separate.


## Hoagie six-pose rise completed — 2026-11-19

Four new rise drawings match shipped brown cap, dark beard, burgundy singlet
with cream trim, wraps, rounded studded knee pads and brown cream-laced boots.
Early pose reviewed before the remaining set, against shipped idle and rise
references. Both original rise drawings remain, with their original scales.
Sequence: original0, early, mid, late, settle, original1. Exact built-in image
generation prompts/reference paths are preserved beside sources as
hoagie-rise-*-between-v1.prompt.json.

Prepared early/mid/late/settle bounds: 749×1435, 823×1541, 747×1322, 679×1348.
Alpha<=5 cleanup removes 10,733/9,632/8,415/9,789 pixels. No detached residue
remains; raw sources retained. New world heights are 74/72/70/68.
All six rise roots use 83 world units below crop top, including re-registered
original roots. This stabilizes the upper body through contraction and aligns
with the existing apex roots around 83–85. Source drawings are not replaced.

Hoagie rise now uses the existing phase-local animation clock, advancing once
and holding its final drawing. Six two-tick poses fit the fourteen-tick full
rise: first five hold twice, final holds four ticks. A five-tick short-hop rise
naturally shows the first three poses. Double jump returns to the final rise
tuck rather than restarting the opening pose. No engine timing, jump height,
airtime, input or attack availability changes.

Validation:
- Two browser budget tests pass sixteen short/full/double/fast cases across
  Moonshine and Hoagie, both facings. Hoagie full and short rise order is
  asserted every tick; double-jump and fast-fall interruptions remain valid.
- Twelve Hoagie normal-speed direction/facing/short-full cases pass.
  Every full jump samples all six rise rectangles in order, all three takeoff
  poses, and the apex/fall/landing return to idle. Backward launch momentum
  still opposes facing.
- Both recorded double-jump handoffs select the final rise rectangle.
- Eight Hoagie physical traces exactly match the takeoff baseline for state,
  frame, y, vy, grounded, facing and fast-fall flag.
- Client typecheck and all 91 full-body renderer tests pass.
- Narrow expansion reruns unchanged; ledger confirms six distinct rise crops.

Reviewed the both-facing Dojo board, light/dark registered takeoff-rise-apex
sequence and decoded half-second overview from the normal recording.
No new halo, missing skin or upper-body anchor snap in those samples.
The 800×450/25fps recording and sampled visual review do not certify 60fps
performance, human feel or exact Ultimate motion.

[Both-facing board](reviews/hoagie-six-rise-both-facings-2026-11-19.png)
· [normal recording](reviews/hoagie-six-rise-normal-speed-2026-11-19.webm)
· [overview](reviews/hoagie-six-rise-normal-overview-2026-11-19.png)
· [summary](reviews/hoagie-six-rise-normal-summary-2026-11-19.json)
· [traces, physics and handoff checks](reviews/hoagie-six-rise-traces-2026-11-19.json)
· [light registration](reviews/hoagie-six-rise-registration-light-2026-11-19.png)
· [dark registration](reviews/hoagie-six-rise-registration-dark-2026-11-19.png).

Source/dojo revision 87 retains 146 clips per fighter, four pages, 1,050 slots
and 18,156,531 transfer bytes. Local only, not deployed.
[Updated movement ledger](reviews/pack02-03-ledger-after-hoagie-rise-2026-11-19.json)
records 106 minimum drawings remaining: Moonshine 0, Hoagie 22, each Pack 03
fighter 28. Four additions, no original pixel replacements.
Next Hoagie apex: budget its current six-tick window before adding four poses.
If widening the renderer's apex band, preserve at least twelve full-rise ticks
to expose the completed six rise drawings; do not blindly reuse another
fighter's velocity threshold or extend physical airtime. Other animation and
timing gaps remain separate.


## Hoagie six-pose apex completed — 2026-11-19

Four new apex drawings match shipped brown cap, beard, burgundy singlet with
cream trim, wraps, rounded studded knee pads and brown cream-laced boots.
Early reviewed first against shipped idle and final-rise references; remaining
drawings use shipped idle/apex references. Both original apex drawings and
scales remain. Order: early, mid, original0, late, settle, original1.
Exact built-in generation prompts/reference paths are preserved beside sources
as hoagie-apex-*-between-v1.prompt.json.

Prepared early/mid/late/settle bounds are 765×1392, 772×1654, 697×1601,
732×1693. Alpha<=5 cleanup removes 11,755/11,639/13,304/11,989 pixels.
Additional detached cleanup removes 2/1/1/0 pixels at alpha<=6, only farther
than four pixels from solid alpha>=128. Nearby antialiasing and raw originals
are preserved. New world heights are 68/72/76/75; all six roots use 83 world
units below crop top to match the completed rise.

The renderer uses an inclusive asymmetric apex band -3.5<=vy<=4.5 for Hoagie
only, gated to rise/apex/fall art. This gives twelve apex ticks in short and
full jumps while preserving twelve full-rise ticks. Reusing the symmetric
Moonshine band would reduce the completed rise below its twelve-tick budget.
Six two-tick apex poses advance once on the phase-local clock. Short rise is
now three ticks; natural fall is fifteen ticks after a full jump and seven
after a short hop. These are presentation phase allocations only: no engine
velocity, airtime, jump height, landing or action timing changes.
Attack/dodge/fast-fall art keeps its existing priority.

Validation:
- Two budget browser tests pass sixteen Moonshine/Hoagie short/full/double/
  fast cases in both facings. Hoagie's rise and apex order is asserted every
  tick: full rise twelve, short rise three, both apexes twelve.
- Twelve normal-speed direction/facing/short-full cases pass. Every full jump
  shows six rise and six apex crops in order; short hops show all six apex
  drawings. Three takeoff crops and landing return remain visible.
- Both double-jump handoffs still return to the final rise crop.
- Eight Hoagie physical traces exactly match the previous rise baseline for
  state/frame/y/vy/grounded/facing/fast flag.
- Client typecheck and all 91 full-body renderer tests pass.
- Narrow preparation reruns unchanged; ledger confirms six distinct apex crops.

Reviewed both-facing Dojo board, light/dark registered rise-apex-fall sequence
and decoded half-second overview from normal recording. No new halo, missing
skin or root snap in reviewed samples. The 800×450/25fps capture is sampled
visual evidence, not a 60fps performance or Ultimate parity certification;
the initial live case has a maximum 45.7 ms RAF gap despite exposing all poses.

[Both-facing board](reviews/hoagie-six-apex-both-facings-2026-11-19.png)
· [recording](reviews/hoagie-six-apex-normal-speed-2026-11-19.webm)
· [overview](reviews/hoagie-six-apex-normal-overview-2026-11-19.png)
· [summary](reviews/hoagie-six-apex-normal-summary-2026-11-19.json)
· [traces, physics and handoff checks](reviews/hoagie-six-apex-traces-2026-11-19.json)
· [light registration](reviews/hoagie-six-apex-registration-light-2026-11-19.png)
· [dark registration](reviews/hoagie-six-apex-registration-dark-2026-11-19.png).

Source/dojo revision 88 retains 146 clips per fighter, four pages, 1,054 slots
and 18,242,489 transfer bytes. Local only, not deployed.
[Updated ledger](reviews/pack02-03-ledger-after-hoagie-apex-2026-11-19.json)
records 102 minimum movement drawings remaining: Moonshine 0, Hoagie 18,
each Pack 03 fighter 28. Four additions, no original pixel replacements.
Next: Hoagie fall, four drawings, first-pose costume review, phase-local final
hold and both-facing apex-to-fall-to-landing validation. Other timing and
non-movement gaps remain separate.


## Hoagie six-pose fall completed — 2026-11-19

Expanded fall from two to six distinct drawings: original first, early, mid, late, settle, original last. All six last two ticks, play once from phase entry, and hold the final drawing on longer drops. Four new drawings use the shipped brown cap, burgundy singlet with cream edging, wraps, knee pads and brown boots. Original drawings and scales remain; all fall roots are registered 83 world units below the crop top. New world heights are 82, 82, 81 and 80.

Preparation retained source originals and exact prompt/reference sidecars. Prepared sizes are 757×1759, 806×1799, 773×1634 and 712×1720. Cleared only alpha<=5 (13,223 / 13,009 / 13,841 / 12,999 pixels); the settle also removes two detached pixels of alpha<=8 farther than four pixels from solid artwork. Dark/light registration boards were inspected for costume, scale and haze.

Local Dojo checks passed 16 movement-budget cases across Moonshine and Hoagie and 12 Hoagie normal-speed jumps (both facings, neutral/forward/backward, tapped/held). Full fall visits six drawings over 15 ticks; short fall uses the natural seven-tick prefix; double-jump fall holds its final drawing through 19 ticks. Eight physical traces exactly match the previous apex baseline, and double-jump release still returns to the final rise drawing in both facings. Typecheck and 91 focused renderer tests passed. The narrow builder rerun reports unchanged revision 89. Source/Dojo atlas: 1,058 slots, four pages, 18,332,318 transfer bytes, 146 clips per fighter.

The first normal-speed run missed the first forward-takeoff crop in one right-facing case; its trace begins takeoff at cue age two. The unchanged isolated rerun passed every case. Retain this as a sampling limitation: normal-speed video is 800×450 at 25 fps and the overview samples half-second intervals; neither certifies every 60 Hz frame or Ultimate parity. The stepped trace supplies exact phase coverage.

Evidence: [traces and unchanged physics](reviews/hoagie-six-fall-traces-2026-11-19.json), [normal-speed summary](reviews/hoagie-six-fall-normal-summary-2026-11-19.json), [recording](reviews/hoagie-six-fall-normal-speed-2026-11-19.webm), [overview](reviews/hoagie-six-fall-normal-overview-2026-11-19.png), [both facings](reviews/hoagie-six-fall-both-facings-2026-11-19.png), [dark registration](reviews/hoagie-six-fall-registration-dark-2026-11-19.png), [light registration](reviews/hoagie-six-fall-registration-light-2026-11-19.png), [remaining movement ledger](reviews/pack02-03-ledger-after-hoagie-fall-2026-11-19.json).

Minimum remaining movement drawings: 102 → 98. Moonshine zero; Hoagie 14; Mr. Wrong, Loopy and Mrs. Tasselbottom 28 each. Hoagie still needs fast fall four, double jump three, soft landing three and heavy landing four. These changes are local and have not been deployed.

**Next:** budget Hoagie's five-tick natural fast-fall window, then add four in-betweens. Use a controlled higher drop to verify all six drawings without changing jump physics; ordinary short falls must retain their natural prefix.


## Hoagie six-pose fast fall completed — 2026-11-19

Expanded fast fall from two to six dedicated drawings, retaining both shipped endpoints and inserting early, mid, late and settle poses. The early pose was reviewed against the shipped idle and fast-fall references before generating the remainder. Brown flat cap, burgundy singlet with cream edging, cream wraps, studded knee pads and brown cream-laced boots are retained. Original endpoint scales remain unchanged. New poses have 68-world-unit visible height, horizontal root at 42% of the trimmed crop, and a common top-to-root distance of 76 world units for all six. This preserves the compact fast-fall tuck rather than inflating it to the standing height. Dark/light boards show no visible glow or fringe.

Each drawing lasts two ticks, progresses once from fast-fall entry and holds the final drawing. The natural jump fixture has only five fast-fall ticks, so it correctly uses the first three drawings. A controlled high drop from (640,-100), zero velocity, inside the blast boundary gives eighteen fast-fall ticks: first five drawings twice each, then the final drawing for eight ticks. This is a visual fixture, not a claim about naturally reachable jump height. No physics, velocity, timing or collision code changed.

Both-facing stepped and normal-speed high-drop tests passed: six distinct crops in order, visible body, correct facing, no polygon fallback, and fast-fall cleared on the first grounded tick with heavy-landing art. Eight ordinary Hoagie movement traces exactly match the before-change physical state, position, velocity, grounding, facing and fast-fall flags. The full five-fighter movement-budget suite plus the two high-drop cases passed (seven browser tests). Client typecheck and 91 focused renderer tests passed. Packaging is repeatable: rerun reports unchanged revision 90, 1,062 slots, four pages, 18,409,188 transfer bytes, and 146 clips per fighter. The prepared sources clear only alpha<=5: 9,171 / 10,426 / 8,768 / 11,152 pixels; original generated artwork and exact prompt/reference sidecars are retained.

Evidence: [Dojo traces and unchanged physics](reviews/hoagie-six-fastfall-traces-2026-11-19.json), [both facings](reviews/hoagie-six-fastfall-both-facings-2026-11-19.png), [dark registration](reviews/hoagie-six-fastfall-registration-dark-2026-11-19.png), [light registration](reviews/hoagie-six-fastfall-registration-light-2026-11-19.png), [normal-speed recording](reviews/hoagie-six-fastfall-normal-speed-2026-11-19.webm), [sampled overview](reviews/hoagie-six-fastfall-normal-overview-2026-11-19.png), [movement ledger](reviews/pack02-03-ledger-after-hoagie-fastfall-2026-11-19.json). Registration and recorded samples were visually reviewed. Video is 800×450 at 25 fps; overview samples half-second intervals. Exact pose scheduling comes from stepped traces, not the sparse video overview. No version-matched Ultimate certification or deployed signoff is implied.

Minimum remaining movement drawings: 98 → 94. Hoagie has ten left: double jump three, soft landing three and heavy landing four. Moonshine has zero; each Pack 03 fighter has 28. **Next: expand Hoagie's double-jump transition from three to six poses using his shipped costume, preserve its twelve-tick cue and verify return to the final rise tuck in both facings.** Local only, not deployed.


## Hoagie six-pose double jump completed — 2026-11-19

Added three dedicated in-betweens in his shipped brown flat cap, burgundy/cream singlet, cream wraps, studded knee pads and brown cream-laced boots. Early pose reviewed first; exact prompts and reference sidecars are saved with source originals. Sequence: original tuck, early opening, original extension, mid return, late guard, original recovery. All six last two ticks, retaining the twelve-tick cue. Original pixels and scales remain; roots share a top-to-root distance of 83 world units, matching the rise handoff. New heights are 82/92/88 world units; alpha<=5 cleanup cleared 19,244 / 13,315 / 13,281 pixels. Dark/light registration boards and recorded samples were inspected.

Dedicated stepped and normal-speed tests passed both facings: six distinct crops in order, visible body throughout, correct facing, and first post-cue rise uses its final tuck. Exact movement-budget rerun passed all eight Hoagie cases, including twelve double-jump ticks with each crop repeated twice. Eight physical traces exactly match the previous fast-fall baseline. No engine, physics or renderer changes were needed. Client typecheck passed. Initial broader run passed six browser tests but the Hoagie budget failed because a test edit incorrectly applied the double-jump requirement to soft landing; corrected the assertion scope and the focused rerun passed. Other four fighters' budget checks passed in the initial run.

Narrow builder rerun is unchanged at source/Dojo revision 91: 1,065 slots, four pages, 18,502,662 transfer bytes, 146 clips per fighter. Evidence: [Dojo traces and unchanged physics](reviews/hoagie-six-double-traces-2026-11-19.json), [dark registration](reviews/hoagie-six-double-registration-dark-2026-11-19.png), [light registration](reviews/hoagie-six-double-registration-light-2026-11-19.png), [normal-speed video](reviews/hoagie-six-double-normal-speed-2026-11-19.webm), [sampled overview](reviews/hoagie-six-double-normal-overview-2026-11-19.png), [movement ledger](reviews/pack02-03-ledger-after-hoagie-double-2026-11-19.json). Video is 800×450 at 25 fps and overview samples every half-second; exact timing is established by the stepped trace, not sparse video samples. Local only, not deployed; no Ultimate capture signoff implied.

Movement minimum: 94 → 91 drawings. Hoagie has seven left: soft landing three and heavy landing four. Each Pack 03 fighter has 28; Moonshine zero. **Next: expand Hoagie's soft landing from three to six poses, preserving its twelve-tick recovery, and verify floor contact and return to idle in both facings.**


## Hoagie six-pose soft landing completed — 2026-11-19

Added three in-betweens using his shipped brown cap, burgundy/cream singlet, cream wraps, dark studded knee pads and brown cream-laced boots. Reviewed early drawing before remaining poses; original sources and exact prompt/reference sidecars retained. Sequence is original contact, early absorption, original compression, mid recovery, late recovery, original standing recovery. Original pixels, scale and registration remain intact. New visible heights are 79/83/87 world units, with the root two source pixels above the crop bottom at the midpoint of solid sole support in its bottom 2%. Alpha<=5 cleanup cleared 15,182 / 14,472 / 14,306 pixels. Light/dark registration boards and recorded samples were inspected for costume, scale, transparency and floor alignment.

Six two-tick drawings preserve twelve-tick recovery. Both-facing stepped and normal-speed local Dojo tests passed: all six crops in order, visible body and correct facing, constant floor position and render-root offset, and return to idle. The movement-budget test passed all eight Hoagie cases, including exact landing crop order on both short jumps. All eight physical traces exactly match the previous double-jump baseline. No engine, physics or renderer code changed. Client typecheck passed. The first dedicated tests failed while sampling before fighter artwork existed; guarded startup sampling and both reruns passed. This was a test startup issue, not an animation change.

Idempotent narrow builder reports unchanged revision 92. Source/Dojo atlas: 1,068 slots, four pages, 18,597,828 transfer bytes, 146 clips per fighter. Evidence: [traces and physical comparison](reviews/hoagie-six-soft-traces-2026-11-19.json), [dark registration](reviews/hoagie-six-soft-registration-dark-2026-11-19.png), [light registration](reviews/hoagie-six-soft-registration-light-2026-11-19.png), [normal-speed recording](reviews/hoagie-six-soft-normal-speed-2026-11-19.webm), [sampled overview](reviews/hoagie-six-soft-normal-overview-2026-11-19.png), [movement ledger](reviews/pack02-03-ledger-after-hoagie-soft-2026-11-19.json). Video is 800×450 at 25 fps; overview samples every half-second, so stepped traces establish the exact tick schedule. Local only, not deployed; no Ultimate reference certification implied.

Movement minimum: 91 → 88 drawings. Hoagie has four left, all for heavy landing; Moonshine zero; each Pack 03 fighter 28. **Next: expand Hoagie's heavy landing from two to six poses, preserve eighteen-tick recovery, and verify full jump and fast-fall floor contact through idle in both facings.**


## Hoagie six-pose heavy landing completed — 2026-11-19

Added four dedicated drawings using his shipped brown flat cap, burgundy/cream singlet, cream wraps, rounded studded knee pads and brown cream-laced boots. Early hand-lift pose reviewed before the remaining recovery drawings. Sequence: original floor touch, early hand lift, mid recovery, late recovery, original guarded crouch, settle toward idle. Retained both original drawings, scales and roots. New visible heights 67/71/77/86 world units; planted roots use solid sole support in the bottom 2% and sit two source pixels above crop bottom. Alpha<=5 preparation cleared 12,203 / 17,547 / 11,673 / 14,457 pixels, preserving originals and exact prompt/reference sidecars. Dark/light registration boards were inspected for costume, scale, floor contact and halo.

Six three-tick poses preserve eighteen-tick heavy-landing recovery. Extended the existing duration-based landing renderer path to Hoagie. Full-jump and fast-fall landings passed in both facings, stepped and normal speed (four dedicated browser tests, eight scenarios): all six distinct crops in order, exact three-tick scheduling in stepped traces, grounded position and root offset through recovery, visible correct-facing art, and idle handoff. The eight-case movement-budget audit passed, including double-jump heavy landings. All eight physical traces exactly match the previous soft-landing baseline. No physics, collision, engine timing or input behavior changed. Typecheck and 91 focused renderer tests passed.

Narrow builder rerun reports unchanged revision 93. Source/Dojo atlas: 1,072 slots, four pages, 18,716,359 transfer bytes, 146 clips per fighter. Evidence: [traces and physical comparison](reviews/hoagie-six-heavy-traces-2026-11-19.json), [dark registration](reviews/hoagie-six-heavy-registration-dark-2026-11-19.png), [light registration](reviews/hoagie-six-heavy-registration-light-2026-11-19.png), [full-jump recording](reviews/hoagie-six-heavy-full-normal-speed-2026-11-19.webm), [full-jump overview](reviews/hoagie-six-heavy-full-overview-2026-11-19.png), [fast-fall recording](reviews/hoagie-six-heavy-fast-normal-speed-2026-11-19.webm), [fast-fall overview](reviews/hoagie-six-heavy-fast-overview-2026-11-19.png), [movement ledger](reviews/pack02-03-ledger-after-hoagie-heavy-2026-11-19.json). Recorded samples were visually inspected. Video is 800×450 at 25 fps and overview samples half-second intervals; stepped traces establish exact pose scheduling. This is local evidence, not a deployed release or version-matched Ultimate certification.

**Hoagie now meets all eleven movement pose-count targets**, as does Moonshine. This is the movement scope only, not a claim that every animation or all production signoff is complete. Remaining movement minimum: 88 → 84 drawings, entirely Pack 03 (28 per fighter). **Next: Mr. Wrong's jump squat, from two to three distinct poses, then his directional takeoffs. Review shipped costume and natural phase budget before drawing; preserve the three-tick squat and all physics.**


## Mr. Wrong three-pose jump squat completed — 2026-11-19

Inserted one dedicated midpoint between the two shipped squat drawings; original pixels, scale and roots remain. Costume is the shipped yellow jacket with burgundy dots, burgundy button vest, cream ruff/cuffs, pink shorts with dark dots, lavender hair, cream/burgundy striped floppy cap and turquoise tentacles with pink suckers. Initial v1 was rejected after registration-board review for narrow body/tall cap proportions. Corrected v2 uses the shipped squat endpoints as direct references and is the only new drawing registered in the clip. Source originals and exact prompts remain for provenance. Prepared v2 is 1026×1216, visible height 82.5 world units; only alpha<=5 was cleared (38,616 pixels). Sole root is (456.5,1214), two source pixels above crop bottom at solid sole support midpoint. Dark/light boards were reviewed for proportions, costume, fringe and floor alignment.

Three one-tick poses preserve the three-tick jump squat. All five final browser tests passed: the eight-case Mr. Wrong movement budget and tapped/held jumps at stepped and normal speed in both facings. Stepped cases verify each distinct crop once; normal-speed checks verify an ordered sampled subset because a three-tick phase is shorter than reliable video capture of every pose. All squat samples are grounded and visible with correct facing, y=472 and render-root offset (0,28), returning to idle after landing. The initial dedicated tests mistakenly reused Hoagie's y=470/offset=30 expectation; corrected to Mr. Wrong's existing registration. Eight physical traces exactly match baseline. No renderer or engine changes; physics and input timing unchanged. Typecheck passed.

Narrow builder rerun is unchanged at Pack 03 source/production revision 74: 1,771 slots, nine pages, 40,410,086 transfer bytes. Evidence: [traces and unchanged physics](reviews/mr-wrong-three-squat-traces-2026-11-19.json), [dark registration](reviews/mr-wrong-three-squat-dark-2026-11-19.png), [light registration](reviews/mr-wrong-three-squat-light-2026-11-19.png), [tapped recording](reviews/mr-wrong-three-squat-tapped-normal-2026-11-19.webm), [held recording](reviews/mr-wrong-three-squat-held-normal-2026-11-19.webm), [sampled overview](reviews/mr-wrong-three-squat-overview-2026-11-19.png), [remaining ledger](reviews/pack02-03-ledger-after-mr-wrong-squat-2026-11-19.json). Recorded samples visually reviewed. Video is 800×450 at 25 fps and overview samples every half-second; use stepped evidence for the three individual ticks. Local only, not deployed or Ultimate-certified.

Movement minimum: 84 → 83 drawings. Mr. Wrong 27, Loopy 28, Mrs. Tasselbottom 28; Moonshine and Hoagie zero. **Next: Mr. Wrong's neutral/forward/backward takeoffs, each two to three drawings. Inspect six-tick cue scheduling and Pack 03 playback routing before adding the in-betweens; preserve physics.**


## Mr. Wrong three-pose directional takeoffs completed — 2026-11-19

Added dedicated neutral, forward and backward midpoint drawings using the shipped yellow/burgundy-dot jacket, burgundy button vest, cream ruff/cuffs, pink dark-dot shorts, lavender hair, cream/burgundy floppy cap and turquoise/pink tentacles. Neutral reviewed first, then directional drawings; source artwork and exact prompt/reference sidecars retained. Both original endpoint pixels/scales/roots and airborne roots remain. New visible heights are neutral 92, forward/backward 90 world units. New airborne top-to-root distances are 59.872 / 58.224 / 60.471, the averages of their shipped endpoint distances; horizontal crop fractions .48/.41/.46. Alpha<=5 cleanup cleared 39,369 / 25,395 / 22,360 pixels. Light/dark registration boards were inspected for costume, proportions, halo and airborne placement.

Each takeoff now has three two-tick drawings, preserving six cue ticks. Existing Pack 03 duration/cue-age routing already supports this, so no renderer change was needed. Dedicated stepped checks passed twelve cases (three directions × two facings × tapped/held), showing every drawing for exactly two ticks and backward momentum opposite facing. Normal-speed checks passed the same twelve cases, including all three takeoff crops, visible correct-facing art and subsequent landing. Eight movement-budget cases passed on focused rerun after replacing its stale two-drawing expectation; all eight physical traces exactly match the prior squat baseline. Client typecheck passed. No engine, physics, input or movement timing changes.

Narrow builder rerun is unchanged at Pack 03 revision 75. Production atlas: 1,774 slots, nine pages, 40,542,844 transfer bytes. Evidence: [traces and physical comparison](reviews/mr-wrong-three-takeoffs-traces-2026-11-19.json), [dark registration](reviews/mr-wrong-three-takeoffs-dark-2026-11-19.png), [light registration](reviews/mr-wrong-three-takeoffs-light-2026-11-19.png), [normal-speed recording](reviews/mr-wrong-three-takeoffs-normal-2026-11-19.webm), [normal-speed summary](reviews/mr-wrong-three-takeoffs-normal-summary-2026-11-19.json), [sampled overview](reviews/mr-wrong-three-takeoffs-overview-2026-11-19.png), [movement ledger](reviews/pack02-03-ledger-after-mr-wrong-takeoffs-2026-11-19.json). Recorded samples visually reviewed. Video is 800×450 at 25 fps, overview at half-second intervals; exact tick scheduling comes from stepped traces. Local only, not deployed or version-matched Ultimate-certified.

Remaining movement minimum: 83 → 80 drawings. Mr. Wrong 24, Loopy 28, Mrs. Tasselbottom 28; Moonshine and Hoagie zero. **Next: Mr. Wrong's rise, two to six drawings. Preserve the current fifteen-tick full-rise and six-tick short-rise windows, use phase-local progression with final hold, and review double-jump release before changing the rise handoff.**


## Mr. Wrong six-pose rise completed — 2026-11-19

Added early/mid/late/settle rise drawings using shipped yellow/burgundy-dot jacket, burgundy button vest, cream ruff/cuffs, pink dark-dot shorts with patch, lavender hair, cream/burgundy floppy cap and turquoise/pink tentacles. Early pose reviewed before the remaining set; exact prompts, shipped references and source originals retained. Shipped endpoint pixels, scales, roots and airRoot values remain. New visible heights are 90/88/86/85 world units; airborne top-to-root distance is 60 world units. Alpha<=5 cleanup cleared 34,759 / 25,772 / 35,683 / 43,141 pixels. Light/dark registration and recorded samples were visually reviewed for costume, proportion, halo and placement.

Six two-tick poses now progress once from rise phase entry and hold the final drawing. The natural fifteen-tick full rise shows each first-five pose twice and final pose five ticks; the six-tick short rise shows the first three poses. Both windows and all physics remain unchanged. The previous double-jump handoff briefly chose the last rise frame and then wrapped to the first; Mr. Wrong's double jump actually ends on the first rise crop. His new phase clock therefore restarts at that matching first crop, unlike the final-tuck handoff used by Packs 02/04. No other fighter's clock rule changed.

Verification passed: eight stepped movement-budget cases; twelve ordinary normal-speed cases (three directions, two facings, tapped/held), including all six rise crops on full jumps; dedicated double-jump stepped and normal-speed checks in both facings, confirming identical first-rise/last-double crop and visible art through landing. Eight physical traces exactly match the previous takeoff baseline. Client typecheck and 91 focused renderer tests passed. No engine, collision, jump timing or input changes. Narrow builder rerun is unchanged at Pack 03 source/production revision 76: 1,778 slots, nine pages, 40,698,920 transfer bytes.

Evidence: [traces and physical comparison](reviews/mr-wrong-six-rise-traces-2026-11-19.json), [dark registration](reviews/mr-wrong-six-rise-dark-2026-11-19.png), [light registration](reviews/mr-wrong-six-rise-light-2026-11-19.png), [ordinary recording](reviews/mr-wrong-six-rise-normal-2026-11-19.webm), [normal summary](reviews/mr-wrong-six-rise-normal-summary-2026-11-19.json), [ordinary overview](reviews/mr-wrong-six-rise-overview-2026-11-19.png), [double-jump recording](reviews/mr-wrong-six-rise-double-normal-2026-11-19.webm), [double-jump overview](reviews/mr-wrong-six-rise-double-overview-2026-11-19.png), [movement ledger](reviews/pack02-03-ledger-after-mr-wrong-rise-2026-11-19.json). Video is 800×450 at 25 fps; overviews sample half-second intervals. Exact tick scheduling comes from stepped traces. Local only, not deployed or version-matched Ultimate-certified.

Remaining movement minimum: 80 → 76 drawings. Mr. Wrong 20; Loopy/Mrs. Tasselbottom 28 each; Moonshine/Hoagie zero. **Next: budget Mr. Wrong's six-tick apex before expanding two drawings to six. Preserve physical timing and enough full-rise exposure for the new rise sequence; decide the visual phase allocation from measured traces before generating apex drawings.**


## Mr. Wrong six-pose apex completed — 2026-11-19

Measured the original six-tick apex before drawing. A renderer-only |vy|<=4 crest band yields twelve apex ticks for both jump heights while retaining twelve full-rise ticks; full rise/apex/fall becomes 12/12/18, short becomes 3/12/8. Double-jump apex has twelve ticks; fast fall interrupts its natural presentation after seven in the standard fixture. This reallocates visual phases only; physical state, velocity, collision and input timing are unchanged.

Added early/mid/late/settle drawings in the shipped yellow/burgundy-dot jacket, burgundy button vest, cream ruff/cuffs, pink dark-dot shorts with patch, lavender hair, cream/burgundy floppy cap and turquoise/pink tentacles. Early drawing reviewed first. Original endpoint pixels/scales remain; airborne roots now share a sixty-world-unit top distance, matching rise and preventing the previous endpoint pivot difference from introducing a vertical bob. New heights are 80/81/82/82.5. Alpha<=5 cleanup cleared 56,339 / 21,288 / 28,344 / 27,775 pixels. Sources and exact prompts/references retained; light/dark registration and recorded samples inspected.

Six two-tick poses use the phase-local clock and final hold rather than the old two-frame velocity-sign switch. Eight movement-budget cases passed, including exact twelve-tick apex crop order for short/full jumps in both facings; twelve normal-speed direction/facing/tap-hold cases passed with all six apex crops and full-rise crops. Both stepped and normal-speed double-jump handoff checks passed in both facings. All eight physical traces exactly match the previous rise baseline. Client typecheck and 91 focused renderer tests passed. No engine or physics edits. Narrow builder rerun unchanged at Pack 03 source/production revision 77: 1,782 slots, nine pages, 40,842,892 transfer bytes.

Evidence: [traces and physical comparison](reviews/mr-wrong-six-apex-traces-2026-11-19.json), [dark registration](reviews/mr-wrong-six-apex-dark-2026-11-19.png), [light registration](reviews/mr-wrong-six-apex-light-2026-11-19.png), [normal recording](reviews/mr-wrong-six-apex-normal-2026-11-19.webm), [normal summary](reviews/mr-wrong-six-apex-normal-summary-2026-11-19.json), [sampled overview](reviews/mr-wrong-six-apex-overview-2026-11-19.png), [movement ledger](reviews/pack02-03-ledger-after-mr-wrong-apex-2026-11-19.json). Video is 800×450 at 25 fps, overview samples half-second intervals; stepped evidence establishes exact tick scheduling. Local only, not deployed or Ultimate-certified.

Movement minimum: 76 → 72 drawings. Mr. Wrong sixteen, Loopy/Mrs. Tasselbottom 28 each, Moonshine/Hoagie zero. **Next: expand Mr. Wrong's fall from two to six poses, use phase-local progression and final hold, verify the new eighteen-tick full-fall and eight-tick short-fall windows plus landing in both facings without changing physics.**


## Mr. Wrong six-pose fall completed — 2026-11-19

Added early/mid/late/settle fall drawings using shipped yellow/burgundy-dot jacket, burgundy yellow-button vest, cream ruff/cuffs, pink dark-dot shorts with patch, lavender hair, cream/burgundy floppy cap and turquoise/pink tentacles. Early drawing reviewed first; exact prompt/reference sidecars and originals retained. Both shipped endpoint pixels and scales remain. New visible heights are 93 world units; all fall airborne roots are sixty world units below crop top, matching apex to avoid a pivot bob. Alpha<=5 cleanup cleared 24,702 / 25,794 / 32,497 / 58,571 pixels. Dark/light registration boards and recorded samples were inspected.

Six two-tick poses use phase-local progression and final hold. Full fall remains eighteen ticks (first five drawings twice, final drawing eight ticks); short remains eight ticks (first four drawings twice); double-jump fall remains twenty-one ticks (final pose eleven ticks). Eight movement-budget cases passed in both facings; exact crop scheduling and visibility were checked. Double-jump stepped and normal-speed tests passed in both facings through landing. All eight physical traces exactly match the previous apex baseline. Six focused normal-speed full jumps passed across neutral/forward/backward and both facings, showing every fall crop and the landing handoff. No engine, physics, collision or input timing changes. Client typecheck and 91 focused renderer tests passed.

Capture limitation: initial broader normal-speed attempts missed a fall drawing and later an unchanged apex drawing. The trace includes a 53 ms RAF gap and a sampled state-frame jump from 27 to 30 across the final apex drawing. The final normal-speed gate is scoped to full-jump fall coverage and still requires all six fall drawings. It does not demand every rise/apex drawing from sparse RAF sampling; those remain exactly checked by the stepped budget and their dedicated tests. Short-jump prefix is signed off by stepped evidence, not a claim that a normal-speed camera captured every short phase tick. Failed-attempt traces are retained alongside final traces. Video is 800×450 at 25 fps and overview samples half-second intervals.

Narrow builder rerun unchanged at Pack 03 source/production revision 78: 1,786 slots, nine pages, 40,999,644 transfer bytes. Evidence: [all traces and physical comparison](reviews/mr-wrong-six-fall-traces-2026-11-19.json), [dark registration](reviews/mr-wrong-six-fall-dark-2026-11-19.png), [light registration](reviews/mr-wrong-six-fall-light-2026-11-19.png), [normal recording](reviews/mr-wrong-six-fall-normal-2026-11-19.webm), [normal summary](reviews/mr-wrong-six-fall-normal-summary-2026-11-19.json), [sampled overview](reviews/mr-wrong-six-fall-overview-2026-11-19.png), [movement ledger](reviews/pack02-03-ledger-after-mr-wrong-fall-2026-11-19.json). Local only, not deployed or version-matched Ultimate-certified.

Movement minimum: 72 → 68 drawings. Mr. Wrong twelve, Loopy/Mrs. Tasselbottom 28 each; Moonshine/Hoagie zero. **Next: expand Mr. Wrong's fast fall from three to six poses. Budget the natural six-tick window and use a controlled higher drop for the complete sequence, preserve physics, and verify landing in both facings.**


## Mr. Wrong six-pose fast fall completed — 2026-11-19

Added three dedicated in-betweens using shipped yellow/burgundy-dot jacket, burgundy vest with yellow buttons, cream ruff/cuffs, pink dark-dot shorts with patch, lavender hair, cream/burgundy floppy cap and turquoise/pink tentacles. Early drawing reviewed first; source originals and exact prompt/reference sidecars retained. Sequence: original tuck, early, original midpoint, mid, late, original long descent. Original pixels and scales remain. New visible heights 98/104/110 world units. Alpha<=5 cleanup cleared 20,372 / 21,748 / 33,209 pixels. Initial interpolated pivot registration passed tests but the art board still showed head-height bobbing; final registration gives all six airborne roots a common seventy-world-unit top distance. Both-facing checks rerun after that correction. Light/dark boards and recorded samples visually inspected.

Six two-tick poses use phase-local progression and final hold. Natural fast fall remains six ticks and shows first three drawings twice each. Controlled high drop from (640,-100), zero velocity, inside the top blast boundary supplies nineteen fast-fall ticks: first five drawings twice, final drawing nine ticks. This fixture verifies presentation and does not claim a naturally reachable jump height. Stepped and normal-speed high-drop cases passed in both facings: six crops in order, visible correct-facing body, finite registration, and first grounded tick clears fast fall and shows heavy landing. All eight ordinary movement-budget cases passed; eight physical traces exactly match the previous fall baseline. Client typecheck and 91 focused renderer tests passed. No engine, physics, collision or input timing changes.

Narrow builder rerun unchanged at Pack 03 source/production revision 80: 1,789 slots, nine pages, 41,116,294 transfer bytes. Evidence: [traces and physical comparison](reviews/mr-wrong-six-fastfall-traces-2026-11-19.json), [dark registration](reviews/mr-wrong-six-fastfall-dark-2026-11-19.png), [light registration](reviews/mr-wrong-six-fastfall-light-2026-11-19.png), [normal recording](reviews/mr-wrong-six-fastfall-normal-2026-11-19.webm), [sampled overview](reviews/mr-wrong-six-fastfall-overview-2026-11-19.png), [movement ledger](reviews/pack02-03-ledger-after-mr-wrong-fastfall-2026-11-19.json). Video is 800×450 at 25 fps; overview samples every half-second, so exact tick scheduling comes from stepped traces. Local only, not deployed or Ultimate-certified.

Movement minimum: 68 → 65 drawings. Mr. Wrong nine (double jump three, soft landing three, heavy landing three); Loopy/Mrs. Tasselbottom 28 each; Moonshine/Hoagie zero. **Next: expand Mr. Wrong's double jump from three to six poses, preserve the twelve-tick cue and its matching first-rise handoff, and verify both facings through landing.**


## Mr. Wrong six-pose double jump completed — 2026-11-19

Added early/mid/late in-betweens using his shipped yellow/burgundy-dot jacket, burgundy three-button vest, cream ruff/cuffs, pink dark-dot shorts with patch, lavender hair, cream/burgundy floppy cap and turquoise/pink tentacles. Early drawing reviewed first; exact prompts, shipped references and source originals retained. Sequence: original arm-up jump, early lowering arm, original second jump pose, mid gathering legs, late tuck, original final rise tuck. All original pixels/scales remain. First two original airborne roots and new drawings use sixty-world-unit top-to-root distance; final original root is unchanged so its crop, scale and airborne registration exactly match rise frame zero. New visible heights are 96/90/90. Alpha<=5 cleanup cleared 24,942 / 48,123 / 26,614 pixels. Light/dark registration boards and recorded samples were visually reviewed for costume, proportion, transparency and placement.

Six two-tick poses preserve the twelve-tick double-jump cue. No renderer changes needed: existing Pack 03 elapsed-cue routing plays all six, and the Mr. Wrong phase-local rise clock restarts on its matching first crop. Stepped and normal-speed dedicated tests passed both facings, including all six drawings in order, correct-facing visible art, first-rise/last-double matching crop and subsequent landing. Eight movement-budget cases passed, with exact two ticks per double-jump crop. Eight physical traces exactly match the prior fast-fall baseline. Client typecheck passed. No engine, physics, collision or input timing changes.

Narrow builder rerun unchanged at Pack 03 source/production revision 81: 1,792 slots, nine pages, 41,245,750 transfer bytes. Evidence: [traces and physical comparison](reviews/mr-wrong-six-double-traces-2026-11-19.json), [dark registration](reviews/mr-wrong-six-double-dark-2026-11-19.png), [light registration](reviews/mr-wrong-six-double-light-2026-11-19.png), [normal recording](reviews/mr-wrong-six-double-normal-2026-11-19.webm), [sampled overview](reviews/mr-wrong-six-double-overview-2026-11-19.png), [movement ledger](reviews/pack02-03-ledger-after-mr-wrong-double-2026-11-19.json). Video is 800×450 at 25 fps and overview samples half-second intervals; exact timing comes from stepped evidence. Local only, not deployed or version-matched Ultimate-certified.

Movement minimum: 65 → 62 drawings. Mr. Wrong six (soft landing three, heavy landing three); Loopy/Mrs. Tasselbottom 28 each; Moonshine/Hoagie zero. **Next: expand Mr. Wrong's soft landing from three to six poses, preserve twelve-tick recovery and verify planted tentacle feet and idle handoff in both facings.**


## Mr. Wrong six-pose soft landing completed — 2026-11-19

Added early/mid/late recovery drawings in shipped yellow/burgundy-dot jacket, burgundy three-button vest, cream ruff/cuffs, pink dark-dot shorts with patch, lavender hair, cream/burgundy floppy cap and turquoise/pink tentacles. Early pose reviewed before remaining drawings. Source originals and exact prompt/reference sidecars retained. Sequence: original contact, early crouch, original compressed recovery, mid rise, late rise, original standing recovery. Original pixels, scale and roots remain unchanged. New visible heights 74/82/87 world units; new roots are two source pixels above crop bottom at solid sole-support midpoint in bottom 2%. Alpha<=5 cleanup cleared 31,707 / 30,597 / 33,800 pixels. Dark/light registration boards and recorded samples visually reviewed for costume, proportion, fringe and planted feet.

Six two-tick poses preserve twelve-tick soft-landing recovery. Existing Pack 03 duration routing plays the full sequence; no renderer changes needed. Stepped and normal-speed tests passed both facings: all six crops in order, exact two-tick scheduling in stepped traces, grounded y=472 and render-root offset (0,28), correct-facing visible body and return to idle. Eight ordinary movement-budget cases passed, including exact six-pose short-jump landings in both facings. Eight physical traces exactly match the double-jump baseline. Client typecheck passed. No engine, physics, collision or input timing changes.

Narrow builder rerun unchanged at Pack 03 source/production revision 82: 1,795 slots, nine pages, 41,339,174 transfer bytes. Evidence: [traces and physical comparison](reviews/mr-wrong-six-soft-traces-2026-11-19.json), [dark registration](reviews/mr-wrong-six-soft-dark-2026-11-19.png), [light registration](reviews/mr-wrong-six-soft-light-2026-11-19.png), [normal recording](reviews/mr-wrong-six-soft-normal-2026-11-19.webm), [sampled overview](reviews/mr-wrong-six-soft-overview-2026-11-19.png), [movement ledger](reviews/pack02-03-ledger-after-mr-wrong-soft-2026-11-19.json). Video is 800×450 at 25 fps and overview samples half-second intervals; exact tick scheduling comes from stepped evidence. Local only, not deployed or Ultimate-certified.

Movement minimum: 62 → 59 drawings. Mr. Wrong three, all heavy landing; Loopy/Mrs. Tasselbottom 28 each; Moonshine/Hoagie zero. **Next: expand Mr. Wrong's heavy landing from three to six poses, preserve eighteen-tick recovery and verify full-jump/fast-fall contact through idle in both facings.**


## Mr. Wrong six-pose heavy landing completed — 2026-11-19

Added three dedicated heavy-landing in-betweens using shipped yellow/burgundy-dot jacket, burgundy three-button vest, cream ruff/cuffs, pink dark-dot shorts with patch, lavender hair, cream/burgundy floppy cap and turquoise/pink tentacles. Early deep-compression drawing reviewed first. Shipped heavy landing reused the three original soft-landing drawings; those pixels, scales and roots remain, but heavy now adds its own deeper crouch and distinct recovery drawings. Sequence: original contact, early deep compression, original recovery crouch, mid recovery, late recovery, original standing recovery. New visible heights 70/82/87 world units; planted roots two source pixels above crop bottom at solid sole-support midpoint. Sources and exact prompt/reference sidecars retained.

Transparency preparation cleared only alpha<=5 (21,679 / 33,605 / 32,755 pixels), plus measured detached fringe farther than four pixels from alpha>=128 ink: early 147 pixels with alpha<=27, mid one pixel and late nine pixels with alpha<=6. Nearby antialiased edges remain. The generated preview haze was checked in the actual alpha before cleanup; final light/dark registration boards show no visible mist. Boards and recorded samples were visually reviewed for costume, proportion and planted feet.

Six three-tick poses preserve eighteen-tick heavy-landing recovery. Existing Pack 03 duration routing plays the sequence without renderer changes. Full-jump and fast-fall dedicated tests passed in both facings, stepped and normal speed (four browser tests, eight scenarios): all six crops in order, exact three ticks each in stepped traces, grounded y=472/render-root offset (0,28), correct-facing visible art and idle handoff. Eight ordinary movement-budget cases passed, including double-jump heavy landings. Eight physical traces exactly match the previous soft-landing baseline. Client typecheck passed. No engine, physics, collision or input timing changes.

Narrow builder rerun unchanged at Pack 03 source/production revision 83: 1,798 slots, nine pages, 41,449,492 transfer bytes. Evidence: [traces and physical comparison](reviews/mr-wrong-six-heavy-traces-2026-11-19.json), [dark registration](reviews/mr-wrong-six-heavy-dark-2026-11-19.png), [light registration](reviews/mr-wrong-six-heavy-light-2026-11-19.png), [full-jump recording](reviews/mr-wrong-six-heavy-full-normal-2026-11-19.webm), [full-jump overview](reviews/mr-wrong-six-heavy-full-overview-2026-11-19.png), [fast-fall recording](reviews/mr-wrong-six-heavy-fast-normal-2026-11-19.webm), [fast-fall overview](reviews/mr-wrong-six-heavy-fast-overview-2026-11-19.png), [movement ledger](reviews/pack02-03-ledger-after-mr-wrong-heavy-2026-11-19.json). Video is 800×450 at 25 fps and overview samples half-second intervals; exact tick scheduling comes from stepped traces. Local only, not deployed or Ultimate-certified.

**Mr. Wrong now meets all eleven movement pose-count targets**, alongside Moonshine and Hoagie. This completes his movement drawing scope, not every animation or production signoff. Remaining movement minimum: 59 → 56 drawings, Loopy/Mrs. Tasselbottom 28 each. **Next: Loopy's three-pose jump squat, then directional takeoffs. Start from his shipped blank cream jersey with purple trim and no numbers; inspect actual idle references and phase budget before drawing.**


## Loopy three-pose jump squat completed — 2026-11-19

Added one midpoint between the two shipped squat drawings, retaining their pixels, scales and roots. Costume reviewed against shipped references: golden fur, brown antlers and hooves, blank cream jersey with purple trim, ragged purple shorts and striped wristbands. No jersey number or lettering. Original generation and exact prompt retained. Prepared midpoint is 982×1353, visible height 88.5 world units, sole root (438,1351); narrowly cleared 23,263 pixels at alpha<=5. Dark/light root-aligned review includes full antlers and planted hooves. The new pose is narrower through the crouch; this is pose variation, not a change in registered height.

All five browser tests passed: tapped/held squat at stepped and normal speed in both facings, plus the eight-case movement budget. Three distinct poses run one tick each, preserving the three-tick squat. Stepped checks cover every pose; normal-speed capture checks an ordered sampled subset because the entire phase lasts only three ticks. Grounded samples retain y=472 and render offset (0,28). Eight physical traces exactly match baseline. Client typecheck passed. No physics, input timing or renderer changes.

Pack 03 source/production revision 84: 1,799 slots, nine pages, 41,486,034 download bytes. [Traces](reviews/loopy-three-squat-traces-2026-11-19.json), [dark registration](reviews/loopy-three-squat-dark-2026-11-19.png), [light registration](reviews/loopy-three-squat-light-2026-11-19.png), [tapped recording](reviews/loopy-three-squat-tapped-normal-2026-11-19.webm), [held recording](reviews/loopy-three-squat-held-normal-2026-11-19.webm), [sampled overview](reviews/loopy-three-squat-overview-2026-11-19.png), [remaining ledger](reviews/pack02-03-ledger-after-loopy-squat-2026-11-19.json). Registration and sampled recording reviewed; 800×450, 25fps video and half-second overview cannot certify every animation tick. Local only, not deployed.

Movement minimum 56 → 55 drawings: Loopy 27, Mrs. Tasselbottom 28; Moonshine, Hoagie and Mr. Wrong zero in this movement scope. **Next: Loopy's neutral, forward and backward takeoffs, each two to three drawings. Preserve the six-tick cue and physics; retain the shipped blank cream jersey.**


## Loopy three-pose directional takeoffs completed — 2026-11-19

Added neutral, forward and backward midpoint drawings using shipped endpoint references. Costume remains golden fur, brown antlers and hooves, blank cream jersey with purple trim, ragged purple shorts and striped wristbands. No number or lettering. Initial neutral and its attempted halo correction were rejected; a fresh clean generation is registered. Original sources and exact prompt/reference sidecars retained. Both shipped endpoints and their roots/scales remain unchanged. New heights are 100.25 / 96 / 97.75 world units. Airborne top-to-root distances 65.554 / 65.088 / 69.752 interpolate their shipped endpoints; horizontal crop fractions .41/.40/.41. Alpha<=5 cleanup cleared 17,220 / 17,070 / 16,002 pixels. Dark/light registration boards reviewed for costume, scale, edges and airborne placement.

Three two-tick poses retain each six-tick takeoff cue. Twelve stepped cases and twelve normal-speed cases passed (three directions × two facings × tapped/held), including backward momentum opposite facing. Each stepped drawing appears exactly twice; all three crops were observed at normal speed. Normal recordings continue through rise, apex, fall, landing and idle without missing art. The initial movement-budget run failed its stale two-drawing expectation; after updating only that expectation, the focused rerun passed all eight cases. Eight physical traces exactly match the pre-edit baseline. Client typecheck passed. No renderer, engine, physics or input timing changes.

Pack 03 revision 85: 1,802 slots, nine pages, 41,582,490 transfer bytes. [Traces and physical comparison](reviews/loopy-three-takeoffs-traces-2026-11-19.json), [dark registration](reviews/loopy-three-takeoffs-dark-2026-11-19.png), [light registration](reviews/loopy-three-takeoffs-light-2026-11-19.png), [normal-speed recording](reviews/loopy-three-takeoffs-normal-2026-11-19.webm), [normal-speed summary](reviews/loopy-three-takeoffs-normal-summary-2026-11-19.json), [sampled overview](reviews/loopy-three-takeoffs-overview-2026-11-19.png), [remaining ledger](reviews/pack02-03-ledger-after-loopy-takeoffs-2026-11-19.json). Recording samples visually reviewed; 800×450 at 25fps, half-second overview sampling. Exact tick coverage comes from stepped traces. Local only, not deployed.

Movement minimum 55 → 52 drawings: Loopy 24, Mrs. Tasselbottom 28; Moonshine, Hoagie and Mr. Wrong zero within this movement scope. **Next: Loopy's rise, two to six poses. Preserve full/short rise physics and inspect the double-jump handoff and phase-local playback before adding drawings.**


## Loopy six-pose rise completed — 2026-11-19

Added early, mid, late and settle rise drawings between shipped endpoints. Reviewed early first, then full dark/light registration: blank cream jersey with purple trim, purple shorts/wristbands, golden fur, brown antlers and split hooves; no number, haze or halo. Endpoint pixels/scales/roots remain unchanged. New visible heights 99.5/99/98.5/98 world units interpolate the shipped 100/97.5 endpoints. Airborne top-to-root distances 69.4/69.8/70.2/70.6 interpolate their 68.9745/71.108 anchors. Horizontal crop fractions .37/.395/.42/.445; narrowly clearing alpha<=5 removed 29,257 / 21,623 / 18,858 / 20,469 pixels. Sources and exact prompts/reference sidecars retained.

Six two-tick poses progress from rise entry and hold the final drawing. Natural full-rise window remains fifteen ticks, short rise six; full rises show the first five poses twice and final pose five ticks. Loopy's existing three-drawing double jump ends on rise frame zero, so the new rise phase starts there. The previous generic final-tuck backdating rule is bypassed for Loopy just as for Mr. Wrong; other fighters retain their existing rules. No engine, input or physics changes; apex/fall clips are not expanded by this pass.

Verification passed: eight stepped movement-budget cases, twelve ordinary normal-speed jumps (three directions × two facings × tapped/held), with all six rise crops observed on full jumps; dedicated stepped and normal-speed double-jump handoffs in both facings. The dedicated double test initially inherited Mr. Wrong's six-drawing assumption; corrected to Loopy's existing three, without expanding that separate clip. Handoff uses the matching first-rise crop with visible correct-facing art through landing. Eight physical traces exactly match the prior takeoff baseline. Client typecheck and 40 focused renderer tests passed. Light/dark registration and ordinary/double recording samples visually reviewed.

Pack 03 source/production revision 86: 1,806 slots, nine pages, 41,696,000 transfer bytes. [Traces and physical comparison](reviews/loopy-six-rise-traces-2026-11-19.json), [dark registration](reviews/loopy-six-rise-dark-2026-11-19.png), [light registration](reviews/loopy-six-rise-light-2026-11-19.png), [ordinary recording](reviews/loopy-six-rise-normal-2026-11-19.webm), [normal summary](reviews/loopy-six-rise-normal-summary-2026-11-19.json), [ordinary overview](reviews/loopy-six-rise-overview-2026-11-19.png), [double-jump recording](reviews/loopy-six-rise-double-normal-2026-11-19.webm), [double overview](reviews/loopy-six-rise-double-overview-2026-11-19.png), [movement ledger](reviews/pack02-03-ledger-after-loopy-rise-2026-11-19.json). Video 800×450 at 25fps and half-second overviews cannot certify every tick; exact scheduling is checked by stepped traces. Local only, not deployed or Ultimate-certified.

Movement minimum 52 → 48 drawings: Loopy 20, Mrs. Tasselbottom 28; Moonshine, Hoagie and Mr. Wrong zero within movement scope. **Next: Loopy's apex phase-budget review, then four in-betweens for a six-pose apex. Preserve physics and inspect rise exposure before widening the presentation band.**


## Loopy six-pose apex completed — 2026-11-19

Measured the existing crest, then reserved a renderer-only |vy|<=4 presentation band, matching the established approach used for other completed fighters. Full jump now presents twelve rise, twelve apex and seventeen fall ticks; short jump three rise, eleven apex and eight fall ticks. The prior full-rise/apex/fall allocation was fifteen/six/twenty; short six/five/eleven. Physics and total airtime are unchanged. All six full-rise drawings remain exposed for two ticks. Fast fall interrupts apex after seven ticks; double-jump apex lasts eleven.

Added four dedicated apex drawings using the shipped blank cream/purple-trim jersey, purple shorts/wristbands, golden fur and brown antlers/hooves, without numbers, haze or halo. Initial late/settle samples were rejected at registration review for elongated lower legs and reduced apparent torso/head scale. Corrected v2 drawings retain bent knees. Final sequence is shipped start, late-v2, settle-v2, early-v1, mid-v1, shipped end, ordered by actual tuck-to-extension rather than generation labels. Originals, rejected candidates and exact prompts remain. Visible in-between heights 93.5/95.5/97.5/99.5 world units. All apex airborne roots are normalized to 71.108 world units below crop top, matching the shipped final-rise anchor; endpoint artwork/scales retained, first endpoint vertical root corrected from 66.487. Horizontal fractions .405/.442/.479/.516; alpha<=5 cleanup cleared 19,411 / 24,774 / 17,582 / 27,153 pixels in playback order. Light/dark boards reviewed for edge quality, full antlers, scale and progression.

Six two-tick poses progress once from phase entry. Stepped checks verify all six crops in both facings: full jump [2,2,2,2,2,2] ticks, short [2,2,2,2,2,1]. Twelve normal-speed direction/facing/tapped-held cases passed, with all six apex crops required for full jumps. The first normal run missed the one-tick final crop in a backward short hop; short-hop normal checks now require at least five distinct crops in order, while stepped checks retain exact six-pose scheduling. Dedicated stepped/normal double-jump handoffs passed in both facings. All eight physical traces exactly match the pre-apex rise baseline. Client typecheck and 40 focused renderer tests passed. Ordinary/double recording samples reviewed.

Final Pack 03 source/production revision 89: 1,810 slots, nine pages, 41,812,424 transfer bytes. Narrow builder rerun unchanged. [Traces and physical comparison](reviews/loopy-six-apex-traces-2026-11-19.json), [dark registration](reviews/loopy-six-apex-dark-2026-11-19.png), [light registration](reviews/loopy-six-apex-light-2026-11-19.png), [ordinary recording](reviews/loopy-six-apex-normal-2026-11-19.webm), [normal summary](reviews/loopy-six-apex-normal-summary-2026-11-19.json), [ordinary overview](reviews/loopy-six-apex-overview-2026-11-19.png), [double recording](reviews/loopy-six-apex-double-normal-2026-11-19.webm), [double overview](reviews/loopy-six-apex-double-overview-2026-11-19.png), [remaining ledger](reviews/pack02-03-ledger-after-loopy-apex-2026-11-19.json). Recordings are 800×450 at 25fps and overviews sample half-second intervals; exact coverage comes from stepped traces. Local only, not deployed or Ultimate-certified.

Movement minimum 48 → 44 drawings: Loopy sixteen, Mrs. Tasselbottom 28; Moonshine, Hoagie and Mr. Wrong zero within movement scope. **Next: Loopy's fall, two to six drawings, with phase-local final hold and both-facing transitions from apex through landing. Preserve the measured seventeen/eight-tick full/short fall windows and physics.**


## Loopy six-pose fall completed — 2026-11-19

Added four fall in-betweens with the shipped golden fur, brown antlers/hooves, blank cream jersey with purple trim, purple shorts and striped wristbands. Reviewed the early drawing before completing the set, then both dark/light registration boards for costume, scale, full antlers and clean edges. A red crop-contamination fringe was visible on shipped fall frame zero. A dedicated edit replaced that endpoint in this clip with a clean rendition of its spread-hoof pose; the original source and atlas remain for provenance. This is a redrawn endpoint, not a pixel-identical cleanup. The final shipped endpoint artwork/scale remains. No global changes to other clips sharing the original crop. Exact prompts and references saved beside each generated source.

Playback is cleaned start / early / mid / late / settle / shipped end, six two-tick poses progressing once then holding the final drawing. Visible heights 105.5/105/104.5/104/103.5 for the new sources, then shipped 102.5. All airborne top-to-root distances are 71.108 world units, matching apex registration. Horizontal fractions .4863/.498/.51/.522/.534. Alpha<=5 cleanup cleared 27,678 / 21,012 / 21,190 / 19,442 / 21,584 pixels. Common root avoids positional changes when the new fall phase begins; no authoritative motion or timing changes.

Verification passed eight stepped movement-budget cases, twelve normal-speed direction/facing/tap-hold cases and dedicated stepped/normal double-jump handoffs in both facings. Full/short/double fall windows remain seventeen/eight/twenty-one ticks: exact stepped crops advance every two ticks with final hold; short hop uses first four poses. Six full-jump normal-speed cases initially observed all six crops. In the expanded tap/hold capture, one full-jump recording missed a two-tick middle crop; recorded RAF sampling is not exact tick coverage. Final normal checks require at least five ordered crops plus final pose on full jumps, at least three ordered crops on short hops, visible correct-facing art and return to idle. Exact stepped assertions remain six poses and precise tick scheduling. [Capture attempt](reviews/loopy-six-fall-capture-attempt-2026-11-19.json) retained. Eight physical traces exactly match the pre-fall apex baseline. Client typecheck and 40 focused renderer tests passed. Ordinary and double-jump recording samples visually reviewed.

Pack 03 source/production revision 90: 1,814 slots, ten pages, 41,988,186 download bytes, 167,772,160 live texture bytes. The pack crosses from nine to ten live pages; future production loading checks must include that increased texture footprint. Narrow builder rerun unchanged. [Traces and physical comparison](reviews/loopy-six-fall-traces-2026-11-19.json), [dark registration](reviews/loopy-six-fall-dark-2026-11-19.png), [light registration](reviews/loopy-six-fall-light-2026-11-19.png), [ordinary recording](reviews/loopy-six-fall-normal-2026-11-19.webm), [normal summary](reviews/loopy-six-fall-normal-summary-2026-11-19.json), [ordinary overview](reviews/loopy-six-fall-overview-2026-11-19.png), [double recording](reviews/loopy-six-fall-double-normal-2026-11-19.webm), [double overview](reviews/loopy-six-fall-double-overview-2026-11-19.png), [remaining ledger](reviews/pack02-03-ledger-after-loopy-fall-2026-11-19.json). Video 800×450 at 25fps and half-second overview cannot certify every tick; stepped traces provide exact scheduling. Local only, not deployed or Ultimate-certified.

Movement minimum 44 → 40 drawings: Loopy twelve, Mrs. Tasselbottom 28; Moonshine, Hoagie and Mr. Wrong zero within movement scope. **Next: Loopy fast fall, three to six poses. Preserve the natural six-tick window and use a controlled higher drop to expose the full sequence, then verify both-facing landing transitions without changing physics.**


## Loopy six-pose fast fall completed — 2026-11-19

Added three in-betweens using shipped fast-fall references: golden fur, brown antlers/hooves, blank cream jersey with purple trim, purple shorts and striped wristbands. Early pose reviewed first. Initial mid sample had a diffuse halo and was rejected; fresh v2 is registered. Original sources and exact prompt/reference sidecars retained. Playback is original tuck / early-v1 / original midpoint / mid-v2 / late-v1 / original long descent. Original endpoint pixels, scales and horizontal roots remain. New visible heights 109/116/120 world units; alpha<=5 cleanup cleared 14,744 / 15,337 / 16,902 pixels. Light/dark registration reviewed with enough padding for the full muzzle, antlers and hooves.

All airborne roots now use a common 71.108-world-unit top distance, matching fall/apex. The shipped roots previously differed (70.6575 / 83.6515 / 79.285); normalizing them removes an artificial vertical displacement between poses. Three new horizontal crop fractions .45/.47/.41. Six two-tick poses progress once using the phase-local clock and hold the final drawing. Natural fast fall remains six ticks and shows the first three poses twice. No engine, collision, input or physics changes.

All three browser tests passed: eight natural movement-budget cases plus stepped and normal-speed controlled high drops in both facings. High fixture starts at (640,-100) with zero velocity, inside the top blast boundary; it is a presentation fixture, not a claim of naturally reachable jump height. Each stepped high drop supplies seventeen fast-fall ticks: first five drawings twice, last drawing seven ticks. Both normal-speed cases observed all six crops in order. Bodies stay visible with correct facing, finite registration and fast-fall state; the first grounded tick clears fast fall and shows a landing clip. Normal playback returns to idle. Eight physical traces exactly match the prior fall baseline. Client typecheck and 40 focused renderer tests passed. Registration boards and sampled normal recording visually reviewed.

Pack 03 source/production revision 91: 1,817 slots, ten pages, 42,095,222 transfer bytes and 167,772,160 live texture bytes. Narrow builder rerun unchanged. [Traces and physical comparison](reviews/loopy-six-fastfall-traces-2026-11-19.json), [dark registration](reviews/loopy-six-fastfall-dark-2026-11-19.png), [light registration](reviews/loopy-six-fastfall-light-2026-11-19.png), [normal recording](reviews/loopy-six-fastfall-normal-2026-11-19.webm), [sampled overview](reviews/loopy-six-fastfall-overview-2026-11-19.png), [both-facing pose captures](reviews/loopy-six-fastfall-both-facings-2026-11-19.png), [remaining ledger](reviews/pack02-03-ledger-after-loopy-fastfall-2026-11-19.json). Video is 800×450 at 25fps; overview samples every half-second. Exact scheduling comes from stepped traces. Local only, not deployed or Ultimate-certified.

Movement minimum 40 → 37 drawings: Loopy nine (double jump three, soft landing three, heavy landing three), Mrs. Tasselbottom 28; Moonshine, Hoagie and Mr. Wrong zero within movement scope. **Next: Loopy double jump, three to six poses. Preserve the twelve-tick cue and matching first-rise endpoint, then verify both facings through landing.**


## Loopy six-pose double jump completed — 2026-11-19

Added early/mid/late in-betweens using shipped double-jump references. Costume remains golden fur, brown antlers/hooves, blank cream jersey with purple trim, purple shorts and striped wristbands. Early pose reviewed before the remaining set. A dedicated edit replaced the red-contaminated starting crop with a clean rendition of its raised-fist/asymmetric-knee pose; this is redrawn artwork, not a pixel-identical cleanup. Shipped middle and final artwork/scales are retained. Source originals and exact prompts/reference sidecars remain. Light/dark boards reviewed for body mass, costume, transparency, complete antlers/hooves and gesture progression.

Sequence: clean start / early / shipped middle / mid / late / shipped final. New heights are 107.5/103.5/100/100 world units with horizontal crop fractions .4385/.47/.46/.40. Alpha<=5 cleanup cleared 18,494 / 23,580 / 20,274 / 19,620 pixels. New poses and shipped midpoint use a 68.9745-world-unit airborne top distance matching the unchanged final drawing and first rise. The midpoint's prior 62.357 distance introduced a positional difference; the common anchor removes it. Builder embeds the shipped endpoint metadata for repeatability and never regenerates the base manifest. Final release crop and airRoot exactly match first rise; no renderer change required in this pass.

Six two-tick drawings preserve the twelve-tick cue. Three browser tests passed: eight movement-budget cases plus dedicated stepped/normal double-jump playback in both facings. Stepped cases verify every crop twice, normal-speed cases observed all six in order, and both show visible correct-facing art through the rise/fall/landing sequence. Release checks additionally confirm identical last-double/first-rise crop, airRoot and sampled render offsets. Eight physical traces exactly match the prior fast-fall baseline. Client typecheck and 40 focused renderer tests passed. Recorded samples visually reviewed. No engine, physics, collision, input or cue timing changes.

Pack 03 source/production revision 92: 1,820 slots, ten pages, 42,220,676 transfer bytes and 167,772,160 live texture bytes. Narrow builder rerun unchanged. [Traces and physical comparison](reviews/loopy-six-double-traces-2026-11-19.json), [dark registration](reviews/loopy-six-double-dark-2026-11-19.png), [light registration](reviews/loopy-six-double-light-2026-11-19.png), [normal recording](reviews/loopy-six-double-normal-2026-11-19.webm), [sampled overview](reviews/loopy-six-double-overview-2026-11-19.png), [both-facing poses](reviews/loopy-six-double-both-facings-2026-11-19.png), [remaining ledger](reviews/pack02-03-ledger-after-loopy-double-2026-11-19.json). Video 800×450 at 25fps; overview samples half-second intervals. Exact scheduling comes from stepped traces. Local only, not deployed or Ultimate-certified.

Movement minimum 37 → 34 drawings: Loopy six (soft landing three, heavy landing three), Mrs. Tasselbottom 28; Moonshine, Hoagie and Mr. Wrong zero within movement scope. **Next: Loopy soft landing, three to six poses, preserving twelve-tick recovery and checking sole contact through idle in both facings. Then heavy landing completes Loopy's eleven movement drawing targets.**


## Loopy six-pose soft landing completed — 2026-11-19

Added early/mid/late recovery drawings using the shipped golden fur, brown antlers/hooves, blank cream jersey with purple trim, purple shorts and striped wristbands. Early pose reviewed first. Initial mid/late samples were rejected on the registration board for elongated legs and reduced apparent head/torso scale; corrected v2 drawings retain compact knee/torso proportions. Shipped contact, compressed recovery and standing endpoint pixels/scales/roots remain unchanged. Source originals, rejected candidates and exact prompt/reference sidecars retained. Light/dark boards and recorded samples reviewed for costume, proportions, clean edges, complete antlers/hooves and planted feet.

Sequence: shipped contact / early-v1 / shipped compressed recovery / mid-v2 / late-v2 / shipped standing recovery. New visible heights 92/98/102.5 world units; support roots use the solid sole midpoint in the bottom 2% of the crop. New sole depths .99825/.83617/.73983 world units interpolate the shipped endpoints' visible depth below their roots. This avoids changing the hoof baseline solely because generated source resolution is higher. Alpha<=5 cleanup cleared 18,456 / 22,607 / 21,485 pixels; no broad matte or speck removal applied. Prepared crops 1006×1207, 958×1343 and 817×1535.

Six two-tick drawings preserve twelve-tick recovery. Existing Pack 03 duration playback supports the sequence without renderer changes. Three browser tests passed: dedicated stepped and normal-speed soft landings in both facings plus eight movement-budget cases. All six crops observed in order at normal speed; exact stepped traces show each twice. Landing samples remain grounded, visible and correctly facing at y=472 with render offset (0,28), then return to idle. All eight physical traces exactly match the prior double-jump baseline. Client typecheck passed. No engine, physics, collision, input timing or renderer changes.

Pack 03 source/production revision 94: 1,823 slots, ten pages, 42,322,022 transfer bytes and 167,772,160 live texture bytes. Narrow builder rerun unchanged. [Traces and physical comparison](reviews/loopy-six-soft-traces-2026-11-19.json), [dark registration](reviews/loopy-six-soft-dark-2026-11-19.png), [light registration](reviews/loopy-six-soft-light-2026-11-19.png), [normal recording](reviews/loopy-six-soft-normal-2026-11-19.webm), [sampled overview](reviews/loopy-six-soft-overview-2026-11-19.png), [both-facing poses](reviews/loopy-six-soft-both-facings-2026-11-19.png), [remaining ledger](reviews/pack02-03-ledger-after-loopy-soft-2026-11-19.json). Video 800×450 at 25fps, overview at half-second intervals; exact scheduling comes from stepped traces. Local only, not deployed or Ultimate-certified.

Movement minimum 34 → 31 drawings: Loopy three, all heavy landing; Mrs. Tasselbottom 28. Moonshine, Hoagie and Mr. Wrong have zero gaps within this movement scope. **Next: Loopy heavy landing, three to six poses. Preserve eighteen-tick recovery and verify full-jump/fast-fall contact through idle in both facings. This completes Loopy's eleven movement drawing targets, not broader release signoff.**


## Loopy six-pose heavy landing completed — 2026-11-20

Added three dedicated heavy-landing drawings using shipped references and the blank cream/purple-trim jersey, purple shorts/wristbands, golden fur and brown antlers/hooves. Early compression reviewed first, then complete light/dark registration. Original contact, compressed recovery and standing endpoint pixels/scales/roots retained. Sequence is shipped contact / deeper compression / shipped recovery / mid rise / late rise / shipped standing. New visible heights 88.5/98/102.5 world units; the lower second pose is deliberate impact compression through knee/hip angles. Sources and exact prompts/reference sidecars retained. Boards and sampled recordings reviewed for costume, scale, full antlers/hooves, edges and planted sole line.

New roots use solid sole support midpoint and the same interpolated world-depth registration as soft landing: .99825/.83617/.73983 world units below root. Prepared crops 974×1116, 888×1284 and 865×1384; support x=467.5/416.5/379. Alpha<=5 cleanup cleared 17,008 / 15,338 / 18,929 pixels, with no detached-speck removal. Six three-tick drawings preserve eighteen-tick recovery. Existing duration routing plays the sequence; no renderer changes needed.

All five browser tests passed: full-jump and fast-fall landings at stepped/normal speed, each in both facings, plus eight movement-budget cases. Dedicated stepped traces show each of six poses three times; normal samples observed all six crops in order. Grounded samples retain visible correct-facing art at y=472 and render offset (0,28), then return to idle. Fast-fall cases verify fast-fall activation before landing. Eight physical traces exactly match the soft-landing baseline. Client typecheck passed. No engine, physics, collision, input or recovery timing changes.

Pack 03 source/production revision 95: 1,826 slots, ten pages, 42,440,206 transfer bytes and 167,772,160 live texture bytes. Narrow builder rerun unchanged. [Traces and physical comparison](reviews/loopy-six-heavy-traces-2026-11-20.json), [dark registration](reviews/loopy-six-heavy-dark-2026-11-20.png), [light registration](reviews/loopy-six-heavy-light-2026-11-20.png), [full-jump recording](reviews/loopy-six-heavy-full-normal-2026-11-20.webm), [full-jump overview](reviews/loopy-six-heavy-full-overview-2026-11-20.png), [fast-fall recording](reviews/loopy-six-heavy-fast-normal-2026-11-20.webm), [fast-fall overview](reviews/loopy-six-heavy-fast-overview-2026-11-20.png), [both-facing poses](reviews/loopy-six-heavy-both-facings-2026-11-20.png), [remaining ledger](reviews/pack02-03-ledger-after-loopy-heavy-2026-11-20.json). Video 800×450 at 25fps, overviews at half-second intervals; exact scheduling comes from stepped traces. Local only, not deployed or Ultimate-certified.

**Loopy now meets all eleven movement drawing targets**, alongside Moonshine, Hoagie and Mr. Wrong. This closes his pose-count work in this movement scope, not every animation family or broader release signoff. Remaining movement minimum 31 → 28 drawings, all Mrs. Tasselbottom. **Next: inspect Mrs. Tasselbottom's shipped idle, squat and directional takeoff references and live phase budgets. Begin her jump squat, two to three poses, preserving three ticks, then directional takeoffs. Use shipped costume references rather than concept/sketch colors.**


## Mrs. Tasselbottom three-pose jump squat completed — 2026-11-20

Reviewed shipped idle, squat and all three directional takeoff references before drawing. Canonical costume is royal-purple draped gown, gold ropes/swags, tassels and shoulder ornaments, cream ruffled collar/cuffs and layered lace hem, white/lavender curls, tiny burgundy hat with gold crown/pins and burgundy buckle shoes. Do not use the black/brown sketch costume. Initial midpoint v1 was rejected on the root-aligned board because face and fists were too small relative to shipped crouches. Corrected v2 uses only the two shipped crouch references and locks those proportions; v1 source/prompt retained. The two shipped squat drawings, pixels, scales and roots remain. Final dark/light boards reviewed for costume, body mass, complete crown/dress/shoes, clean edges and shoe baseline.

Inserted one midpoint at visible height 72.5 world units, prepared 1090×1239. Alpha<=5 cleanup cleared 39,623 pixels. Solid shoe-support midpoint x=537; root y=1228.0540758620689 keeps .6405 world units of visible sole below root, matching both shipped endpoints rather than copying a source-pixel depth. Three one-tick poses preserve the existing three-tick squat. Mrs. Tasselbottom has hurtbox radius 34, so Dojo floor is y=466 and render offset (0,34); do not reuse Loopy's y472/offset28 assertion.

Baseline and final movement-budget checks cover short/full/double/fast jumps in both facings. Current full rise/apex/fall windows are 8/5/14 ticks; short 2/5/8, double-jump cue twelve ticks, natural fast fall three ticks, soft/heavy landing twelve/eighteen. These short airborne windows must be budgeted separately before expanding their art; do not copy another fighter's phase timing. All five final browser tests passed: the eight-case movement budget and tapped/held jump squats at stepped and normal speed in both facings. Every stepped squat shows three distinct crops for one tick each; normal capture checks an ordered sampled subset because the phase lasts only three ticks. Grounded visible correct-facing samples retain y466/offset34, then land and return to idle. Eight physical traces exactly match baseline. Client typecheck passed. No renderer, engine, physics or input timing changes.

Pack 03 source/production revision 97: 1,827 slots, ten pages, 42,474,202 transfer bytes and 167,772,160 live texture bytes. Narrow builder rerun unchanged. [Traces and physical comparison](reviews/tasselbottom-three-squat-traces-2026-11-20.json), [dark registration](reviews/tasselbottom-three-squat-dark-2026-11-20.png), [light registration](reviews/tasselbottom-three-squat-light-2026-11-20.png), [tapped recording](reviews/tasselbottom-three-squat-tapped-normal-2026-11-20.webm), [held recording](reviews/tasselbottom-three-squat-held-normal-2026-11-20.webm), [sampled overview](reviews/tasselbottom-three-squat-overview-2026-11-20.png), [both-facing poses](reviews/tasselbottom-three-squat-both-facings-2026-11-20.png), [remaining ledger](reviews/pack02-03-ledger-after-tasselbottom-squat-2026-11-20.json). Video 800×450 at 25fps and half-second overview cannot certify every tick; stepped traces provide exact scheduling. Local only, not deployed or Ultimate-certified.

Movement minimum 28 → 27 drawings, all Mrs. Tasselbottom. **Next: her neutral, forward and backward takeoffs, each two to three poses. Preserve six-tick cues, use shipped purple/gold costume references and interpolate airborne anchors before both-facing playback checks.**


## Mrs. Tasselbottom three-pose directional takeoffs completed — 2026-11-20

Neutral, forward and backward takeoffs expanded from two to three drawings. Each retains six ticks with [2,2,2] durations. Shipped endpoint pixels, roots and scales are preserved. Midpoints use the shipped purple gown, gold ropes/tassels, cream lace, lavender curls, burgundy hat and buckled shoes; exact generation prompts and shipped references are retained beside source art. Dark/light registration boards reviewed. Original endpoint edge contamination remains outside this midpoint change; this is not a global source cleanup.

Midpoint world heights: 81.75 / 77.25 / 78.75. Horizontal crop fractions: .465 / .436 / .460. Airborne top-to-root distances: 44.12625 / 42.75875 / 45.24525. Prepared sizes: 957×1224 / 1022×1103 / 912×1186. Alpha<=5 preparation cleared 10,411 / 12,917 / 12,329 pixels; no broad edge removal. Builder rerun is idempotent.

Three focused browser tests passed: twelve stepped cases and twelve normal-speed cases cover three directions, both facings and tapped/held jumps. Each stepped pose lasts two ticks; all three drawings were observed at normal speed. All eight movement traces exactly match the preceding squat baseline. Client typecheck passed. No engine, renderer, physics or input timing changes. Pack 03 revision 98: 1830 pose slots, 10 pages, 42,566,472 page transfer bytes.

[Traces](reviews/tasselbottom-three-takeoffs-traces-2026-11-20.json), [dark registration](reviews/tasselbottom-three-takeoffs-dark-2026-11-20.png), [light registration](reviews/tasselbottom-three-takeoffs-light-2026-11-20.png), [normal recording](reviews/tasselbottom-three-takeoffs-normal-2026-11-20.webm), [summary](reviews/tasselbottom-three-takeoffs-normal-summary-2026-11-20.json), [sampled overview](reviews/tasselbottom-three-takeoffs-overview-2026-11-20.png), [remaining ledger](reviews/pack02-03-ledger-after-tasselbottom-takeoffs-2026-11-20.json). Recorded samples were visually reviewed; half-second overview sampling cannot certify every two-tick transition. Exact tick coverage comes from stepped traces. Local only, not deployed or version-matched Ultimate signoff.

Remaining movement minimum: 27 → 24 drawings, all Mrs. Tasselbottom. **Next: audit the natural rise window before expanding her rise from two to six poses. Full rise currently lasts eight ticks and short rise two ticks after takeoff; inspect double-jump handoff and preserve physics rather than copying another fighter's phase budget.**


## Mrs. Tasselbottom rise phase budget audit — 2026-11-20

Fresh local Dojo movement-budget test passed all eight cases: short, full, double and fast-fall inputs in both facings. Full/fast jumps have eight rise ticks after the six-tick takeoff; short jumps have two. Double jump has a twelve-tick transition and then enters apex directly, with no post-transition rise. Do not copy Loopy's twelve-tick rise or require an unreachable double-to-rise handoff. [Complete traces and registration targets](reviews/tasselbottom-rise-budget-2026-11-20.json).

The current rise holds drawing 1 for six ticks and drawing 2 for two ticks on full jumps. For six drawings within the same eight-tick window, use proposed durations [1,1,1,1,2,2], phase-local non-looping progression and a held final pose. Short hop must truncate naturally after its two available ticks; do not stretch jump physics to display all six. Double jump must preserve its direct apex handoff. The art-only twelve-tick apex band used by other fighters would consume her short rise and must not be copied into this change.

Preserve the two shipped endpoints. Their world heights are 81 and 78.5; airborne top-to-root distances 44.375 and 45.1395. Interpolate four new heights and airborne anchors between them, keeping crown, face and gown proportions consistent with shipped purple/gold costume references. Review one new pose before producing the remaining three.

This audit changes no runtime code, art, timing or physics. Source revision remains 98. Remaining movement minimum remains 24 drawings, all Mrs. Tasselbottom. **Next: produce and review the first rise in-between, complete the other three, register the eight-tick sequence, and verify full/short jumps and direct double-to-apex handoff in both facings.** Local evidence only.


## Mrs. Tasselbottom first rise in-between review — 2026-11-20

Created and reviewed the early rise drawing against both shipped rise endpoints and shipped idle. Purple gown, gold ropes/tassels, cream lace, lavender curls, burgundy crown hat and buckled shoes retained. Compared equal-world-scale images on [dark](reviews/tasselbottom-rise-first-dark-2026-11-20.png) and [light](reviews/tasselbottom-rise-first-light-2026-11-20.png) backgrounds. Crown and shoes are inside the source bounds; no broad white haze is visible. Original source and exact prompt/reference sidecar retained under concept-art/sprite/pack-03-pilot/mrs-tasselbottom-rise-early-between-v1.*.

[Registration and alpha report](reviews/tasselbottom-rise-first-review-2026-11-20.json): source 1098×1433, trimmed 958×1358, proposed world height 80.5, horizontal fraction .4749745818, airborne top-to-root distance 44.5279. Source alpha is predominantly 252–253 in the character interior (nearly opaque); 748,258 fully transparent pixels and 26,687 nonzero pixels at alpha<=5. Retain original alpha and apply only the established alpha<=5 preparation when registering. Do not describe the interiors as fully opaque or use broad threshold cleanup. Existing shipped endpoint red contamination was not copied into the new drawing.

This is an art-review checkpoint, not completed six-pose playback or Dojo signoff. Runtime manifest remains revision 98, unchanged; remaining movement minimum remains 24 unregistered drawings. **Next: create the mid, late and settle rise in-betweens from the same shipped references, register all four with [1,1,1,1,2,2] durations, implement phase-local progression, and verify both facings for full/short jumps and the direct double-jump-to-apex handoff.**


## Mrs. Tasselbottom six-pose rise completed — 2026-11-20

Completed the mid, late and settle drawings after the early-pose review; registered all four between the two shipped endpoints. Shipped purple/gold costume, cream lace, lavender curls, crown hat and buckled shoes retained; original prompts/references preserved. Reviewed six equal-world-scale drawings in both facings on dark/light backgrounds. Endpoints and their roots/scales unchanged. Heights 80.5/80/79.5/79; horizontal crop fractions .4749745818/.4950576907/.5151407997/.5352239086; airborne anchor distances 44.5279/44.6808/44.8337/44.9866. Alpha<=5 preparation cleared 26,687/40,333/28,238/47,037 pixels. Source interiors remain nearly opaque; no broad alpha normalization. Original endpoint fringe remains a separate source limitation. Builder is idempotent.

Playback now advances by rise-local age and holds the final drawing; change is restricted to Mrs. Tasselbottom rise. [1,1,1,1,2,2] durations fit the existing eight-tick full rise. Short rise uses first two drawings in two ticks. Double jump remains a twelve-tick transition straight into apex. Apex thresholds and other movement clips unchanged. All eight physics traces exactly match the pre-edit baseline.

Two browser tests passed: eight stepped movement cases and twelve normal-speed directional jump cases across both facings. Stepped full/fast rises display all six in exact order; normal-speed samples advance monotonically to the final rise pose, remain visible, and continue through landing to idle. One-tick drawings may be skipped by browser/recording sampling; exact coverage is established by stepped traces, not every normal capture. Twenty-four movement renderer unit tests and client typecheck passed. Pack 03 revision 99: 1,834 slots, ten pages, 42,684,680 page transfer bytes, 167,772,160 live texture bytes. Local only, not deployed.

[Traces and physical comparison](reviews/tasselbottom-six-rise-traces-2026-11-20.json), [dark board](reviews/tasselbottom-six-rise-dark-2026-11-20.png), [light board](reviews/tasselbottom-six-rise-light-2026-11-20.png), [Dojo both-facings poses](reviews/tasselbottom-six-rise-both-facings-2026-11-20.png), [normal recording](reviews/tasselbottom-six-rise-normal-2026-11-20.webm), [normal summary](reviews/tasselbottom-six-rise-normal-summary-2026-11-20.json), [sampled overview](reviews/tasselbottom-six-rise-overview-2026-11-20.png), [remaining ledger](reviews/pack02-03-ledger-after-tasselbottom-rise-2026-11-20.json). Visual review uses registration boards, stepped screenshots and half-second video samples; it is not native Ultimate timing signoff.

Movement minimum 24 → 20 drawings, all Mrs. Tasselbottom. **Next: her apex, two to six poses. First budget the existing five-tick ordinary apex and six-tick double-jump apex; design an art-only phase window sufficient for six readable drawings without stealing the newly completed eight-tick full rise or changing physics.**


## Mrs. Tasselbottom six-pose apex completed — 2026-11-20

Reviewed the first new apex pose against shipped early/late apex, then completed three more. All four retain purple/gold gown, cream lace, lavender curls, crown hat and buckled shoes. Sources and exact prompt/reference sidecars retained. Endpoints, scales and anchors preserved. New heights 75.2/74.9/74.6/74.3, airborne top-to-root distances 42.5832/43.2779/43.9726/44.6673. Prepared sizes 1068×1376, 1069×1401, 1068×1400, 1095×1402. Alpha<=5 cleanup cleared 42,995/33,240/35,926/24,288 pixels; no broad interior opacity normalization. Light/dark boards reviewed in both facings. Original endpoint fringe is retained, not a claim of global source cleanup.

Apex uses six two-tick poses and phase-local progression. Its art-only velocity band is -2 through +6.75, preserving the newly completed eight-tick full rise and two-tick short rise. Ordinary short/full and post-double apex now last twelve ticks; fast fall interrupts after four apex ticks in the fixture. This uses early descent artwork: short fall now lasts one tick, full fall seven, double-jump fall eleven. No physics, input, apex trajectory or landing-recovery changes; eight complete physical traces exactly match the preceding rise baseline. Do not copy a symmetric band that consumes her rise.

Eight stepped movement cases passed across both facings, verifying all six apex drawings twice each and exact fast-fall interruption. Twelve normal-speed neutral/forward/backward tapped/held cases passed, including all six observed apex crops, visibility, facing and return to idle. Initial normal run failed because its inherited assertion required observing a one-tick short-hop fall at normal sampling speed; trace showed apex then landing while the exact stepped test confirms the fall tick. The corrected normal assertion requires fall visibility on held jumps and keeps exact short-hop coverage in stepped tests. Final normal rerun passed. Twenty-five movement renderer tests and client typecheck passed. Builder rerun is idempotent.

Pack 03 revision 100: 1,838 slots, ten pages, 42,802,910 page transfer bytes, 167,772,160 live texture bytes. [Traces/physics comparison](reviews/tasselbottom-six-apex-traces-2026-11-20.json), [dark board](reviews/tasselbottom-six-apex-dark-2026-11-20.png), [light board](reviews/tasselbottom-six-apex-light-2026-11-20.png), [Dojo both-facings poses](reviews/tasselbottom-six-apex-both-facings-2026-11-20.png), [normal recording](reviews/tasselbottom-six-apex-normal-2026-11-20.webm), [normal summary](reviews/tasselbottom-six-apex-normal-summary-2026-11-20.json), [sampled overview](reviews/tasselbottom-six-apex-overview-2026-11-20.png), [remaining ledger](reviews/pack02-03-ledger-after-tasselbottom-apex-2026-11-20.json). Visual review uses registered poses, stepped screenshots and half-second video samples; exact tick verification comes from traces, not the sampled recording. Local only, not deployed or version-matched Ultimate signoff.

Movement minimum 20 → 16 drawings, all Mrs. Tasselbottom. **Next: expand fall from two to six drawings using its seven-tick full-hop window, with one-tick short-hop truncation. Preserve apex/rise budgets, inspect double-hop fall and landing handoffs, and use phase-local playback without altering physics.**


## Mrs. Tasselbottom six-pose fall completed — 2026-11-20

Reviewed early drawing against both shipped fall endpoints, then completed mid, late and settle. Four new poses retain purple/gold gown, cream lace, lavender curls, crown hat and buckled shoes. Original source/prompt/reference sidecars preserved. Both shipped endpoint pixels, roots and scales retained; their pre-existing edge contamination remains outside this change. Reviewed six registered poses on light/dark backgrounds in both facings. New heights 79.3/78.6/77.9/77.2, airborne top-to-root distances 43.754/44.1275/44.501/44.8745. Prepared sizes 1075×1356, 1063×1356, 1052×1358, 1056×1395. Alpha<=5 cleanup cleared 34,659/28,242/52,933/31,396 pixels; no broad opacity normalization. Builder rerun is idempotent.

Six poses use [1,1,1,1,1,2] durations over the existing seven-tick full-hop fall. Phase-local playback advances once and holds the last pose during eleven-tick double-hop falls; short-hop fall remains one tick using the first drawing. Rise, apex, fast-fall selection and physics unchanged. All eight physical traces exactly match the preceding apex baseline.

Two browser tests passed: eight stepped movement cases and twelve normal-speed neutral/forward/backward tapped/held cases across both facings. Stepping verifies every full-hop fall drawing and double-hop endpoint hold. Normal traces progress monotonically through fall to the final pose on held jumps and return to grounded idle after landing; exact one-tick short-hop coverage comes from stepping. All bodies remain visible and correctly faced. Twenty-six movement renderer tests and client typecheck passed. Pack 03 revision 101: 1,842 slots, ten pages, 42,927,752 page transfer bytes and 167,772,160 live texture bytes.

[Traces/physics comparison](reviews/tasselbottom-six-fall-traces-2026-11-20.json), [dark board](reviews/tasselbottom-six-fall-dark-2026-11-20.png), [light board](reviews/tasselbottom-six-fall-light-2026-11-20.png), [Dojo both-facings poses](reviews/tasselbottom-six-fall-both-facings-2026-11-20.png), [normal recording](reviews/tasselbottom-six-fall-normal-2026-11-20.webm), [normal summary](reviews/tasselbottom-six-fall-normal-summary-2026-11-20.json), [sampled overview](reviews/tasselbottom-six-fall-overview-2026-11-20.png), [remaining ledger](reviews/pack02-03-ledger-after-tasselbottom-fall-2026-11-20.json). Visual review uses registration boards, stepped poses and half-second video samples; normal recording can skip single-tick poses. Exact coverage comes from stepped traces. Local only, not deployed or native Ultimate signoff.

Movement minimum 16 → 12 drawings, all Mrs. Tasselbottom: fast fall +3, double jump +3, soft landing +3, heavy landing +3. **Next: expand fast fall from three to six poses. Review one drawing first and use a controlled higher drop to verify the complete sequence; ordinary fixture fast fall lasts only three ticks. Preserve physics and natural truncation on early landing.**


## Mrs. Tasselbottom six-pose fast fall completed — 2026-11-20

Reviewed the early new drawing against shipped fast-fall references before completing mid and late. Three new poses retain shipped purple/gold gown, cream lace, lavender curls, crown hat and buckled shoes. Original source/prompt/reference sidecars retained. All three shipped drawings and their roots/scales preserved. Sequence: original 1, new early, original 2, new mid, new late, original 3. New heights 87.5/94.5/96.5, airborne top-to-root distances 48.662/54.13/52.7215 interpolate surrounding shipped anchors. Prepared sizes 973×1429, 961×1519, 923×1534. Alpha<=5 cleanup cleared 18,476/22,590/29,845 pixels; no broad opacity normalization. Source bounds checked: solid artwork remains inside all four edges. Light/dark registration boards reviewed in both facings. Original source edge limitations retained. Builder rerun is idempotent.

Six two-tick poses use the existing fast-fall-local playback and hold their final drawing. No renderer or engine change required. Three browser tests passed: eight ordinary movement cases plus controlled high-drop stepped and normal-speed tests in both facings. A forced position (640,-100), inside the upper blast boundary, is a controlled art fixture rather than a natural jump. All six fast-fall crops appear in order in both stepped and normal traces. Stepping checks two ticks per pose then endpoint hold. Bodies stay visible/correctly faced, landing clears fast-fall state and plays landing art, then normal-speed returns to idle. Ordinary fast fall still lands after three ticks, displaying [pose1,pose1,pose2]; no stretching to force the full clip. Eight ordinary physical traces exactly match the preceding fall baseline. Client typecheck passed.

Pack 03 revision 102: 1,845 slots, ten pages, 43,029,982 page transfer bytes, 167,772,160 live texture bytes. [Traces/physics comparison](reviews/tasselbottom-six-fastfall-traces-2026-11-20.json), [dark board](reviews/tasselbottom-six-fastfall-dark-2026-11-20.png), [light board](reviews/tasselbottom-six-fastfall-light-2026-11-20.png), [Dojo both-facings poses](reviews/tasselbottom-six-fastfall-both-facings-2026-11-20.png), [normal recording](reviews/tasselbottom-six-fastfall-normal-2026-11-20.webm), [sampled overview](reviews/tasselbottom-six-fastfall-overview-2026-11-20.png), [remaining ledger](reviews/pack02-03-ledger-after-tasselbottom-fastfall-2026-11-20.json). Exact coverage comes from stepped traces; half-second video samples cannot certify every pose. Local only, not deployed or native Ultimate signoff.

Movement minimum 12 → 9 drawings, all Mrs. Tasselbottom: double jump +3, soft landing +3, heavy landing +3. **Next: expand double jump to six two-tick poses, preserving its twelve-tick cue and direct transition into apex. Review one new drawing against shipped costume first; verify cue starts, both facings, interruption and apex handoff.**


## Mrs. Tasselbottom six-pose double jump completed — 2026-11-20

Reviewed early new drawing against shipped double-jump endpoints, then completed mid and late. Costume retains purple/gold gown, cream lace, lavender curls, crown hat and buckled shoes. Sources and exact prompt/reference sidecars retained. Three shipped drawings, roots and scales preserved. Sequence: original 1, new early, original 2, new mid, new late, original 3. New heights 83.75/80.6667/80.8333; airborne top-to-root distances 43.762/43.8893/44.1322 interpolate surrounding shipped anchors. Prepared sizes 1076×1382, 963×1329, 917×1336. Alpha<=5 preparation cleared 48,379/38,794/27,812 pixels; no broad opacity normalization. Light/dark boards reviewed in both facings. Original endpoint fringe remains outside this insertion. Builder is idempotent.

Six two-tick poses preserve the twelve-tick cue and direct apex handoff. No runtime renderer or engine change required. Eight movement cases passed and their physical traces exactly match the preceding fast-fall baseline. Separate stepped and normal-speed double-jump tests passed in both facings, with all six crops observed, exact two-tick stepping, visible/correctly faced sprites, first apex crop verified and return to grounded idle. Initial dedicated tests failed a copied Loopy rise-handoff assertion; after correcting the fixture to the documented Mrs. Tasselbottom direct apex handoff, both reruns passed.

Twenty-eight focused movement/cue renderer tests passed, including a new Mrs. Tasselbottom test in both facings for duplicate-snapshot stability, cue advancement, hit cancellation and no stale cue after hitstun. Interruption coverage is a renderer unit check; these new browser cases exercise uninterrupted jumps. Client typecheck passed. Pack 03 revision 103: 1,848 slots, ten pages, 43,112,668 page transfer bytes, 167,772,160 live texture bytes.

[Traces/physics comparison](reviews/tasselbottom-six-double-traces-2026-11-20.json), [dark board](reviews/tasselbottom-six-double-dark-2026-11-20.png), [light board](reviews/tasselbottom-six-double-light-2026-11-20.png), [Dojo both-facings poses](reviews/tasselbottom-six-double-both-facings-2026-11-20.png), [normal recording](reviews/tasselbottom-six-double-normal-2026-11-20.webm), [sampled overview](reviews/tasselbottom-six-double-overview-2026-11-20.png), [remaining ledger](reviews/pack02-03-ledger-after-tasselbottom-double-2026-11-20.json). Visual review uses registration boards, stepped captures and half-second video samples; exact pose duration comes from traces. Local only, not deployed or native Ultimate signoff.

Movement minimum 9 → 6 drawings, all Mrs. Tasselbottom: soft landing +3 and heavy landing +3. **Next: expand soft landing to six poses within its twelve-tick cue, preserving floor contact, recovery timing and buffered input unlock. Review one drawing against shipped costume first, then verify both facings and airborne-to-floor handoff.**


## Mrs. Tasselbottom soft landing color correction — 2026-11-20

User rejected the first early soft-landing draft for incorrect color. It used brighter magenta-purple gown fabric. Preserved rejected source and prompt as mrs-tasselbottom-soft-early-between-v1-rejected-color.*; it was never registered. Generated corrected candidate mrs-tasselbottom-soft-early-between-v2.png using the shipped idle and original landing as explicit palette authorities, with a representative shipped gown midtone RGB(74,5,62), #4A053E. The color is deep dark plum-purple with restrained highlights, not generic bright royal purple. Visually reviewed corrected output; user signoff on the corrected candidate has not been reported.

No runtime manifest, physics, or recovery changes. Revision remains 103. All six missing landing drawings remain unregistered, including this corrected source candidate. Next: compare the corrected candidate at gameplay scale with shipped idle/landing, then complete the other two soft-landing in-betweens using shipped idle as the primary color reference. Preserve twelve-tick cue and floor contact.


## Mrs. Tasselbottom six-pose soft landing completed — 2026-11-20

Compared the corrected early v2 against shipped idle/landing at equal display height before drawing mid/late with shipped idle as primary palette authority. Kept deep dark plum-purple, gold ropes/tassels, cream lace, lavender curls, crown hat and burgundy buckled shoes. Rejected bright v1 remains archived and unregistered. Exact sources/prompts/references retained. New pose heights 67.5/71.5/76, planted sole depths .36025/.5918333/.6311667 world units; support root centers measured from bottom shoe pixels. Prepared sizes 1202×1190, 1078×1185, 1050×1410. Alpha<=5 preparation cleared 24,407/24,859/45,298 pixels; no broad opacity normalization.

Preserved all three shipped drawings and scales. Visual review found shipped frame 1 anchored to crop-bottom residue, leaving shoes above the floor. Corrected only that drawing's root Y from 135.664 to 127.664 source pixels (four world units lower); other original roots unchanged. Original stray source pixels remain preserved and are a separate cleanup limitation. Re-reviewed light/dark boards in both facings.

Six two-tick poses preserve twelve visual cue ticks. This cue is not a twelve-tick gameplay recovery lock: the first grounded idle tick is cue age 1. Four final browser tests passed: eight movement cases, dedicated stepped and normal-speed soft landings in both facings, and fresh Attack at grounded cue age 1 in both facings. Stepping verifies every drawing twice; normal captures observe all six and return to idle. Attack starts ATTACK and replaces landing artwork immediately. Grounded player Y466/render offset34 remains stable. All eight physical traces exactly match the preceding double-jump baseline. Client typecheck passed; no runtime renderer, engine or input changes. Initial three playback tests passed before the root correction; all four final tests passed after it. Builder rerun is idempotent.

Pack 03 revision 105: 1,851 slots, ten pages, 43,209,350 page transfer bytes, 167,772,160 live texture bytes. [Traces/physics and attack interruption](reviews/tasselbottom-six-soft-traces-2026-11-20.json), [palette comparison](reviews/tasselbottom-soft-palette-check-2026-11-20.png), [dark board](reviews/tasselbottom-six-soft-dark-2026-11-20.png), [light board](reviews/tasselbottom-six-soft-light-2026-11-20.png), [Dojo both-facings poses](reviews/tasselbottom-six-soft-both-facings-2026-11-20.png), [normal recording](reviews/tasselbottom-six-soft-normal-2026-11-20.webm), [sampled overview](reviews/tasselbottom-six-soft-overview-2026-11-20.png), [remaining ledger](reviews/pack02-03-ledger-after-tasselbottom-soft-2026-11-20.json). Visual review uses registration boards, stepped screenshots and half-second video samples; exact duration comes from traces. Local only, not deployed or native Ultimate signoff.

Movement minimum 6 → 3 drawings, all Mrs. Tasselbottom heavy landing. **Next: six-pose heavy landing within its eighteen-tick cue; review one new drawing against shipped idle colors, verify planted soles, both facings, landing handoff and input interruption, then perform the final movement parity/coverage audit.**


## Movement drawing targets completed — 2026-11-20

Finished Mrs. Tasselbottom heavy landing with three dedicated recoil/recovery drawings, after reviewing the early pose against shipped idle and landing references. Deep dark-plum gown, gold ropes/tassels, cream lace, lavender curls, crown hat and burgundy buckled shoes retained. Exact source/prompt/reference sidecars preserved. New heights 66.5/71.5/76; sole depths .36025/.5918333/.6311667 world units. Prepared sizes 1221×1201, 1162×1177, 1083×1425. Alpha<=5 preparation cleared 27,219/47,607/30,090 pixels. Six three-tick poses retain eighteen visual cue ticks. All original pixels/scales retained; original first root Y corrected from135.664 to127.664 for visible shoe contact, matching the soft-landing correction. Other original roots unchanged. Existing original source fringe/residue remains a separate cleanup limitation. Light/dark boards inspected in both facings. Builder rerun is idempotent.

Ten final browser tests passed: five movement-budget tests (40 cases: five fighters × two facings × short/full/double/fast), four dedicated heavy landing tests (ordinary/fast-fall × stepped/normal speed, both facings), and fresh Attack interruption at grounded cue age1 in both facings. All six heavy landing crops appear in order, stepping verifies three ticks each, y466/render offset34 stays fixed, and playback returns to idle. Cue duration is visual, not an added input lock. Eight Mrs. Tasselbottom physical traces exactly match the pre-heavy baseline. No runtime renderer, engine, input or physics changes in this step. Full-body renderer suite passed 95 tests in16 files; client typecheck passed.

Extended portable checker: `node scripts/assets/audit-movement-parity.mjs --all-roster --output docs/assets/reviews/all-roster-movement-parity-final-2026-11-20.json`. Scanned all ten fighters × eleven movement clips (110 rows), validating decoded crop extraction, visible alpha, finite roots/positive scale, nonnegative finite durations with positive total, and decoded crop hashes. Every row meets its drawing minimum; **zero movement drawings remain under these targets**. Original three retain their established six-slot/three-tick squat convention with zero-duration slots; this is not six independently displayed squat ticks. Crop-hash parity does not establish semantic pose quality or certify every runtime trigger.

| Current fighters | Squat minimum | Each takeoff minimum | Rise/apex/fall/fast fall/double jump/each landing minimum | Remaining drawings |
| --- | ---: | ---: | ---: | ---: |
| All ten shipped fighters | 3 | 3 | 6 | 0 |

Original three have additional authored slots in some clips; exact counts/durations remain in the ledger. The final live rerun covers Packs02/03; the original three and Pack04 are covered by decoded manifest scan in this run, not a new ten-fighter live playback signoff. Pack03 revision106: 1,854 slots, ten pages, 43,309,012 page transfer bytes, 167,772,160 live texture bytes.

[Final all-roster ledger](reviews/all-roster-movement-parity-final-2026-11-20.json), [40 movement cases, heavy landings and interruption](reviews/tasselbottom-six-heavy-traces-2026-11-20.json), [dark board](reviews/tasselbottom-six-heavy-dark-2026-11-20.png), [light board](reviews/tasselbottom-six-heavy-light-2026-11-20.png), [Dojo both-facings poses](reviews/tasselbottom-six-heavy-both-facings-2026-11-20.png), [ordinary normal recording](reviews/tasselbottom-six-heavy-full-normal-2026-11-20.webm), [ordinary overview](reviews/tasselbottom-six-heavy-full-overview-2026-11-20.png), [fast-fall normal recording](reviews/tasselbottom-six-heavy-fast-normal-2026-11-20.webm), [fast-fall overview](reviews/tasselbottom-six-heavy-fast-overview-2026-11-20.png). Visual review uses registration boards, stepped captures and half-second video samples; exact durations come from traces. Local only, not deployed or native Ultimate signoff.

**This closes the movement drawing-count workstream, not the complete full-roster animation audit or production release.** Next: retained source-edge residue and rare interruptions/paired state changes in the broader roster audit, followed by release packaging and hosted verification. Do not add more movement slots merely to equalize totals.


## Production edge review and roster interruptions — 2026-11-20

Reviewed all54 registered Mrs. Tasselbottom movement frames using decoded production crops, not enlarged source previews alone. Red-pixel counts are candidates: skin/mouth details can be red and most source outline contamination has low alpha. No blanket hue deletion or redrawing was performed. The visible detached scrap below original landing frame1 was confirmed on the production board. Tightened its source atlas rectangle from [2,1208,139,136] to [2,1208,139,129] for both soft/heavy landing; retained root [74.754,127.664], scale and all retained character pixels. Original image files are untouched. Character shoes end above the excluded rows; floor contact remains as previously corrected. Production before/after boards show the scrap removed. This is a targeted cleanup, not an assertion that every roster source edge is clean.

Added portable rosterInterruptions.test.ts using all ten shipped manifests and the runtime preview/live clip filter. Sixty renderer checks passed: ten fighters × two facings × three sequences (double jump → hit → fall; grab escape → hit → fall; ledge drop → hit → fall). Each checks visible art, finite pivots, intended hit_high selection and no stale cue on recovery. Double-jump duplicates also remain stable. These use stub textures with shipped frame metadata; they verify selection/cancellation, not live paired contact or network timing.

Live landing regression: initial run eight passed, one failed. The fast normal-speed fixture held Down for60ms beyond the three-tick fast fall and correctly entered crouch, replacing the landing cue. Trace showed full-hop height365.02, fast-fall then crouch, so this was input overlap rather than missing art. Changed only that fixture to release Down as soon as fast fall is observed. Focused final rerun passed both facings with all six landing poses. Thus all nine landing/movement tests passed across initial valid cases plus corrected rerun. Eight physical traces remain exactly unchanged. Client typecheck passed. Both narrow builders rerun without changes.

All-roster movement ledger rerun still reports110 rows and zero missing movement drawings. Pack03 revision108: 1,854 slots, ten pages, 43,346,820 page transfer bytes and 167,772,160 live texture bytes. [Traces, crop correction and test scope](reviews/landing-residue-and-interruptions-2026-11-20.json), [edge scan before](reviews/landing-edge-scan-before-2026-11-20.json), [edge scan after](reviews/landing-edge-scan-after-2026-11-20.json), [production board before](reviews/landing-edge-board-before-2026-11-20.png), [production board after](reviews/landing-edge-board-after-2026-11-20.png), [updated all-roster ledger](reviews/all-roster-movement-after-residue-2026-11-20.json). Local only, not deployed.

**Next:** live Dojo interrupted releases and paired-state transitions (grab/pummel/throw and footstool), prioritizing Pack03/04 and recording exact cases. This renderer pass does not close those live checks or claim a fresh full-roster source-edge visual signoff. Movement drawing-count work remains complete; no extra slots are called for by this audit.


## Pack 03 and 04 live paired transition audit — 2026-11-20

Added portable roster-paired-transitions.spec.ts and ran the real local Dojo renderer/simulation. Five ordered pairings: Mr. Wrong→Loopy, Loopy→Mrs. Tasselbottom, Mrs. Tasselbottom→Zane, Zane→Velvet, Velvet→Mr. Wrong. Each appears as holder/attacker and victim. Both facings covered. This is five sampled pairings, not all20 ordered non-mirror matches or all ten fighters.

Forty grab/pummel/throw cases passed (five pairs × two facings × four throws). Real Grab input creates the hold, Attack pummels, victim reaction is observed, and both return to grab_hold/grabbed before direction initiates a throw. Forward/back/up/down throws show matching owner/victim artwork and leave throw_victim afterward. Twenty footstool cases passed (five pairs × both facings × grounded/airborne victim). Jump resolves the paired footstool, immediate Attack replaces the attacker cue with an aerial, and the victim recovers out of the footstool animation. Bodies remain visible, labels nonempty and render positions finite throughout all sampled ticks.

Initial five throw tests failed because forcePosition temporarily sets airborne state even at floor height: immediate Grab became an aerial action. Corrected the fixture to settle for three ticks and assert both grounded before pressing Grab. All five throw reruns passed; the original five footstool tests passed. This was a setup correction, not a game fix. Client typecheck passed.

Reviewed20 footstool contact screenshots and20 throw-release screenshots (negative-facing throws) on comparison boards. They show paired contact/pose placement without a missing sprite. The orange/red palette seen during throw impact is the renderer's documented four-frame golden hit-flash tint, not recolored source art. Compared the [impact close-up](reviews/paired-hit-flash-detail-2026-11-20.png) with the [untinted Mrs. Tasselbottom victim crop](reviews/paired-victim-untinted-reference-2026-11-20.png); retain source costume colors. Screenshot boards do not quantify socket error or establish continuous normal-speed smoothness.

[All60 traces and exact pair scope](reviews/pack03-04-paired-transition-audit-2026-11-20.json), [footstool contacts](reviews/pack03-04-paired-foot-contacts-2026-11-20.png), [throw-release contacts](reviews/pack03-04-paired-throw-contacts-2026-11-20.png). Controlled debug positioning and frame stepping are explicitly part of these fixtures; actions, paired resolution and subsequent physics use the live engine. No runtime, artwork, physics, atlas or production changes were needed. Movement drawing minima remain complete. Local only, not deployed.

**Next:** replay these same five pairs at normal gameplay speed, concentrating on pummel return, throw release/recovery and immediate footstool-to-aerial handoff; log any visible discontinuity before adding more drawings. Delayed two-client verification and remaining pairings remain separate coverage.


## Normal-speed paired replay and release reconstruction — 2026-11-20

Replayed the same five ordered Pack03/04 pairs at continuous gameplay speed after controlled placement: 40 pummel/throw sequences and 20 grounded/airborne footstool-to-aerial sequences, both facings. Five browser tests passed. Pummels returned to hold, all four throws showed both roles and exited the victim clip, and immediate footstool attacks replaced the attacker cue. Render labels remained present and positions finite. Recorded each run and inspected one-second contact boards for all five pairs; these sampled boards alone do not establish frame-by-frame visual smoothness.

Initial playback assertions passed, but an exact-state comparison against stepped traces exposed a real renderer defect: Zane and Velvet release offsets depended on the last held pose actually rendered. Maximum difference was 6.9898 world units across 2,128 matching samples; pose labels and crops matched. Their release drawings omit grabGrip after separation, so the old path retained a prior render's attachment. FullBodyPilot now reconstructs contact from the nearest preceding authored held grip for Pack04, using the current victim pose and authoritative owner position. Artwork, costume, physics, atlas revision and timing are unchanged.

Added a regression covering two Pack04 holders × all ten victims × four throws × both facings (160 combinations), with two different last-rendered held poses. It failed before the fix and passes after it. Fresh stepped throws: five tests passed. Fresh normal-speed scenarios: five tests passed. The after comparison matched 2,003 samples across 80 pummel/release phases with zero label, crop or root-position differences. Full-body renderer suite: 156 tests passed; client typecheck passed.

[Before comparison](reviews/paired-normal-comparison-before-2026-11-20.json), [after comparison](reviews/paired-normal-comparison-after-2026-11-20.json), [normal-speed traces](reviews/paired-normal-traces-2026-11-20.json), [corrected stepped release traces](reviews/paired-stepped-release-fixed-2026-11-20.json). Capture boards: [Mr. Wrong](reviews/paired-normal-mr-wrong-2026-11-20.png), [Loopy](reviews/paired-normal-loopy-2026-11-20.png), [Mrs. Tasselbottom](reviews/paired-normal-mrs-tasselbottom-2026-11-20.png), [Zane](reviews/paired-normal-zane-corvo-2026-11-20.png), [Velvet](reviews/paired-normal-velvet-reply-2026-11-20.png). Local only, not deployed. Original stepped evidence above is retained as history.

**Next:** delayed two-client paired replay, prioritizing Zane and Velvet throw release. Remaining ordered pairings and broad source-edge/full-animation review remain separate; these five sampled pairs do not close the entire roster's visual signoff.


## Delayed two-client Pack 04 releases — 2026-11-20

Added paired-delayed-online.spec.ts using an isolated real createApp/MatchSession server, two independent browser contexts, normal online room/lineup/countdown flow and keyboard actions. A test-only wrapper delays every queued player input by 120 ms; server simulation and normal binary snapshot delivery remain unchanged. Private engine access only places/reset pairs between cases. No production debug endpoint or runtime behavior was added.

Zane→Mr. Wrong and Velvet→Mr. Wrong each passed forward/back/up/down throw in both facings: 16 scenarios, 32 client traces, 2163 sampled render frames, 5741 delayed input packets. Both clients observed pummel_victim, returned to grab_hold/grabbed, showed the selected throw and throw_victim, and left throw_victim afterward. All sampled bodies remained visible with finite positions, and neither client reported a page error. Two browser tests passed. [Exact traces and scope](reviews/paired-delayed-online-2026-11-20.json).

Initial fixture failed to grab because forcePosition replaces the engine player object: the subsequent facing reset wrote to an obsolete reference. Corrected the fixture to update the replacement player. These setup failures are not a gameplay defect; no new art or game changes were required this pass. The preceding Pack04 deterministic attachment fix remains covered by its renderer regression.

This closes the delayed-input replication sample for these two holders only. It does not establish pixel-level grip error, continuous visual smoothness, identical client frame timing, downstream latency, jitter/loss, every ordered matchup or deployed behavior. No new video-based visual signoff is claimed. Local only, not deployed.

**Next:** extend this fixture to the remaining three Pack03 holders, then capture close-up release sequences on both clients to inspect interpolation handoffs under downstream delay/jitter. Keep broad roster visual signoff distinct from these replication assertions.


## Pack 03 delayed holders and ordered snapshot jitter — 2026-11-20

Completed the remaining Pack03 holders with two independent online browser clients: Mr. Wrong→Loopy, Loopy→Mrs. Tasselbottom, Mrs. Tasselbottom→Mr. Wrong. All four throws, both facings, with a pummel/return-to-hold before each. Three browser tests passed: 24 scenarios and 48 client traces with 120 ms server input delay. Radius-based floor placement includes Mrs. Tasselbottom's different height. Reran the final synchronized fixture in delay-only mode: all three tests passed again (24 scenarios,48 client traces). No new art or production runtime changes.

Extended paired-delayed-online.spec.ts with PAIRED_NETWORK_MODE=jitter. Five holders (the three Pack03 fighters plus Zane and Velvet holding Mr. Wrong), eight scenarios each: 40 scenarios, 80 client traces and 5267 sampled render frames. Input delay stays120 ms; outgoing snapshots use a repeating40/110/65/150/80 ms requested delay, clamped to preserve TCP/WebSocket ordering. Measured scheduled delay range 40–150 ms; 15143 input packets delayed. This models ordered bunching/stalls, not loss, reordering, independent client routes or a deployed host.

**Not signed off:** final jitter run finished all40 scenarios, with two browser tests passing and three failing. 4 client traces missed the victim throw reaction despite the owner throw appearing and defender damage increasing. Exact failures:

- loopy → mrs-tasselbottom, left facing, DOWN_THROW, defender client: throw_victim not observed.
- mr-wrong → loopy, right facing, DOWN_THROW, holder client: throw_victim not observed.
- mr-wrong → loopy, right facing, DOWN_THROW, defender client: throw_victim not observed.
- zane-corvo → mr-wrong, right facing, UP_THROW, defender client: throw_victim not observed.

Both clients otherwise showed pummel and return-to-hold, selected owner throw, eventual recovery and finite visible sprites (see detailed checks for exact assertions). Preserve these failing checks; do not disable them or declare parity. The active production path drains presented hit events against the buffered timeline, while FullBodyPilot only accepts throw reactions during HITSTUN. Event/state timeline disagreement is a hypothesis requiring instrumentation, not a proven root cause. A missing clip observation is not missing source artwork and does not justify generating new drawings.

Initial exploratory jitter attempts mixed genuine missed reactions with fixture holds expiring before delayed throw input. Corrected the fixture to wait for authoritative grab and pummel transitions, rather than stale rendered hold/default slow polling, and settle controlled resets before input. Final failures above all have increased damage from the requested throw; historical early failures are not included as confirmed bugs.

Captured100 close-up screenshots across both clients (forward/up throws, left-facing only, five samples each) and reviewed all five contact boards. Artwork stayed present; holding/release silhouettes and client phase differences are visible. Some samples return to ordinary poses earlier on one client. These sparse stills do not prove smoothness, quantify pixel socket error or cover the flagged right-facing/down throws visually. Board rows: forward holder client, forward defender client, up holder client, up defender client; columns follow capture order. Capture cadence includes screenshot overhead, so it is not frame-accurate footage.

[Trace ledger and exact cases](reviews/pack03-delayed-and-paired-jitter-2026-11-20.json). Boards: [Mr. Wrong](reviews/paired-jitter-mr-wrong-2026-11-20.png), [Loopy](reviews/paired-jitter-loopy-2026-11-20.png), [Mrs. Tasselbottom](reviews/paired-jitter-mrs-tasselbottom-2026-11-20.png), [Zane](reviews/paired-jitter-zane-corvo-2026-11-20.png), [Velvet](reviews/paired-jitter-velvet-reply-2026-11-20.png). Local only; not deployed.

**Next:** instrument hit-event presentation and rendered victim state/age in the flagged jitter cases; make confirmed throw reactions survive their proper presentation handoff without extending gameplay hitstun, then rerun this40-case gate and capture the flagged releases. Full visual/network signoff remains open.


## Confirmed throw cue handoff under jitter — 2026-11-20

Instrumented actual FullBodyPilot.startGrabReaction calls and the next renderer update in both online clients. The reproduced missed events reached victims already rendering IDLE: the old valid-state guard discarded the confirmed cue on that same update. Before-fix five-holder rerun completed40 scenarios and missed 6 victim reactions; the captured event/update records establish this cause, replacing the hypothesis in the preceding audit. Exact failure combinations can vary with wall-clock scheduling even with the same delay pattern.

FullBodyPilot now tracks throw reaction age across state-frame resets. A confirmed throw can wait up to six simulation/presentation ticks for an interpolated held victim to release, and uses a six-tick passive-recovery bridge so a late cue is not silently lost. Normal hitstun reactions retain their18-tick upper bound. Attack, Shield, double jump, fresh grounded takeoff, other active states and hidden victims cancel the cue immediately. A late recovered cue clears the obsolete holder attachment instead of snapping back to a historical grip. Pummels retain their existing state/timing behavior. This is a bounded project presentation rule, not newly certified Ultimate timing. It changes no hitstun, physics, input unlock, atlas or costume.

Added eight focused regression cases. Three handoff tests failed before the fix; after it, all18 throw-contact tests pass. All164 full-body renderer tests and client typecheck pass. An initial test fixture typo used an invalid fall clip key; corrected it to air_fall_loop before typecheck signoff. Online instrumentation remains confined to the test fixture; there is no production debug endpoint. The fixture gives the authoritative return-to-hold150 ms to present before the next delayed input, preserving pummel/hold visual assertions without passive grab expiry.

Two complete post-fix jitter runs passed (five browser tests each). Final run:40 scenarios,80 client traces,6690 sampled frames, zero skipped victim poses or missing pummel/return/owner phases. It includes all previously flagged combinations. 2 final reactions began outside HITSTUN and remained observable, directly exercising the corrected path. The scheduled network pattern remains120 ms input delay plus ordered40/110/65/150/80 ms snapshot jitter; no packet-loss or arbitrary asymmetric-route claim.

Captured200 close-up stills in the final matrix: left-facing forward/up and right-facing up/down throws, five samples per client per case. Reviewed the five right-facing up/down boards; rows are up holder client, up defender client, down holder client, down defender client. Both roles remain present through contact and separation, with client phase differences still visible. Stills with capture overhead cannot establish frame-accurate smoothness or zero socket error. Impact tint is unchanged; no drawings were recolored.

[Instrumented before/after ledger](reviews/paired-cue-handoff-before-after-2026-11-20.json). Final boards: [Mr. Wrong](reviews/paired-cue-fixed-mr-wrong-2026-11-20.png), [Loopy](reviews/paired-cue-fixed-loopy-2026-11-20.png), [Mrs. Tasselbottom](reviews/paired-cue-fixed-mrs-tasselbottom-2026-11-20.png), [Zane](reviews/paired-cue-fixed-zane-corvo-2026-11-20.png), [Velvet](reviews/paired-cue-fixed-velvet-reply-2026-11-20.png). A further Loopy jitter run passed all eight cases and16 client traces; reviewed the formerly flagged [left-facing down-throw close-up](reviews/paired-cue-fixed-loopy-left-down-2026-11-20.png) on both clients. [Extra run traces](reviews/paired-cue-fixed-loopy-left-detail-2026-11-20.json). This supersedes the prior red jitter checkpoint for skipped victim cues, while preserving that evidence. Local only; not deployed.

**Next:** expand paired coverage to the unsampled roster matchups and test deliberate defender actions during the visual bridge in live clients; keep packet loss, long stalls and deployed checks separate from this completed jitter-handoff fix.


## Release preflight and live defender actions — 2026-11-20

Completed40 fresh defender action checks (Jump/Attack/Shield/Special, both facings, all five Pack03/04 fighters as defenders) in two real clients with120 ms input delay and ordered snapshot jitter. A late event initially covered an already-started local jump; fixed the renderer's takeoff cue guard and the predictor's accepted-jump marker. Final five browser tests passed all80 client action checks. New renderer/predictor regressions passed, final client suite1,220 passed. Production build and all ten fighter Dojo smoke checks passed; reviewed the production roster board. [Release evidence, limits and remaining commit/deployment steps](../plans/ANIMATION-RELEASE-2026-11-20.md). This supersedes the prior live-action next step.
