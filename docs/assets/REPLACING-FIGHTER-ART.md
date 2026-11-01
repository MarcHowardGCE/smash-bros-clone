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
