# Replacing Fighter Art (Artist-First Guide)

This guide is written for artists and content integrators who will never read TypeScript.

If you follow this document literally, you can replace fighter art with **zero code edits**.

---

## 1) Put files in the exact folders

Root input folder:

`raw-assets/fighters{m}/`

For each fighter, create one folder with this exact naming pattern:

`<characterId>{tps}`

Examples:

- `raw-assets/fighters{m}/all-rounder{tps}/`
- `raw-assets/fighters{m}/abe-lincoln{tps}/`
- `raw-assets/fighters{m}/swift{tps}/`

### About the literal tags `{m}` and `{tps}`

- Keep `{m}` in `fighters{m}` exactly as written.
- Keep `{tps}` in each character folder name exactly as written.
- These tags are consumed by the AssetPack pipeline configuration. Do **not** remove or rename them.

---

## 2) Use the exact 6 lowercase filenames

Inside each `<characterId>{tps}/` folder, provide exactly these files:

1. `head.png`
2. `body.png`
3. `arm_l.png`
4. `arm_r.png`
5. `leg_l.png`
6. `leg_r.png`

Filename matching is strict (including case).

---

## 3) Numeric contract table (source of truth)

This table is copied from `apps/client/src/renderer/parts/assetContract.ts` and must stay in sync.

| part | filename | rawCanvasPx | logicalCanvas | jointPx | anchor | referenceBoundsLogical |
|---|---|---|---|---|---|---|
| HEAD | head.png | 160x160 | 80x80 | 80,80 | 0.5,0.5 | 26,26,28,28 |
| BODY | body.png | 160x160 | 80x80 | 80,80 | 0.5,0.5 | 18,18,44,44 |
| ARM_L | arm_l.png | 64x128 | 32x64 | 32,8 | 0.5,0.0625 | 12.5,4,7,22 |
| ARM_R | arm_r.png | 64x128 | 32x64 | 32,8 | 0.5,0.0625 | 12.5,4,7,22 |
| LEG_L | leg_l.png | 64x128 | 32x64 | 32,8 | 0.5,0.0625 | 12,4,8,24 |
| LEG_R | leg_r.png | 64x128 | 32x64 | 32,8 | 0.5,0.0625 | 12,4,8,24 |

---

## 4) Authoring rules (mandatory)

### 2x authoring rule

- Author at `rawCanvasPx` dimensions (the large size in the table).
- Runtime logical size is half (`logicalCanvas`), because asset density is 2x.
- Do not hand-scale canvases to guess runtime size.

### Clothing base color rule

- Tintable clothing areas must be near-white `#F5F5F5`.
- Why: runtime slot colors are multiplicative tint. A darker base color muddies/desaturates player colors.

### No skin on limbs

- Limb parts (`arm_l`, `arm_r`, `leg_l`, `leg_r`) must contain gloves/shoes-only styling in reference regions.
- Do not paint skin tones on limb reference regions.

### Opaque joint underlap (12 px)

- Starting at `jointPx.y`, keep a fully opaque vertical band of **12 raw pixels**.
- This opaque band must span the full reference width.
- Why: rotated limbs otherwise reveal transparent seams at sockets.

---

## 5) Local workflow

### Live loop (auto repack)

Run:

```bash
pnpm dev
```

Then edit PNGs in `raw-assets/fighters{m}/...`. The dev asset pipeline repacks atlases for live testing.

### Regenerate current placeholder pack

```bash
node scripts/assets/generate-all-rounder-parts.mjs
```

### Force polygon fallback renderer (kill-switch)

Open:

`http://localhost:5173/?renderer=polygon`

### Skip AssetPack during build/test workflows

```bash
SKIP_ASSETPACK=1 pnpm build
```

### Run e2e verification

```bash
pnpm test:e2e
```

---

## 6) How to read validator failures

Validation entrypoint (used in tests/CI): `apps/client/src/renderer/parts/assetValidator.ts`

Representative real error messages and what they mean:

### Missing directory

```text
SKIP character=swift reason=missing-art-dir path=raw-assets/fighters{m}/swift{tps}
```

Meaning: character folder is missing.

### Missing file

```text
character=all-rounder part=LEG_R rule=missing-part expected-filename=leg_r.png actual-filename=absent
```

Meaning: required file is not present.

### Wrong filename case

```text
character=all-rounder part=HEAD rule=filename-casing expected-filename=head.png actual-filename=Head.png
```

Meaning: filename case does not match the strict lowercase contract.

### Wrong canvas size

```text
character=all-rounder part=ARM_L rule=dimensions expected=64x128 actual=63x128
```

Meaning: PNG dimensions do not match `rawCanvasPx`.

### Fully transparent image

```text
character=all-rounder part=BODY rule=empty-alpha expected=alpha>0 actual=all-alpha-zero
```

Meaning: image has no opaque pixels.

### Empty reference bounds

```text
character=all-rounder part=BODY rule=reference-alpha expected=painted-alpha-in-reference-bounds actual=none bounds=36,36,88,88
```

Meaning: nothing was painted inside required reference bounds.

### Joint underlap broken

```text
character=all-rounder part=LEG_L rule=joint-underlap expected=opaque-band-height=12 actual=transparent-pixel-found band=x:24..39,y:8..19
```

Meaning: a transparent pixel was found in the required 12px joint underlap band.

### Tint purity violation

```text
character=all-rounder part=ARM_R rule=tint-purity expected=#F5F5F5±10 actual=rgb(255,0,0) at=26,9
```

Meaning: tintable region pixel is not near-white enough for clean slot tinting.

### Decode error

```text
character=all-rounder part=HEAD rule=decode expected=decodable-png actual=decode-failed
```

Meaning: PNG cannot be decoded.

---

## 7) Sanity checks before handoff

1. `pnpm dev` and visually confirm sprite rendering.
2. Verify polygon fallback still renders: `?renderer=polygon`.
3. Run unit/integration checks:
   - `pnpm test`
   - `pnpm test:e2e`
4. Optional fast build path without repack: `SKIP_ASSETPACK=1 pnpm build`.

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
