# Todo 04 Evidence — character raw art authored (18 assets)

Date: 2026-10-31

Generator command:

```bash
node scripts/assets/generate-all-rounder-parts.mjs
```

Validator hard-gate command:

```bash
pnpm -F @smash/client assets:validate
```

Observed hard-gate output:

```text
assets-checked=18
violations=0
```

## Per-asset dimensions + alpha bounding boxes

| Asset | Canvas (px) | Alpha bounding box (minX,minY,maxX,maxY) | Alpha size |
|---|---:|---:|---:|
| `all-rounder/head.png` | 160×160 | 50,52,110,108 | 61×57 |
| `all-rounder/body.png` | 160×160 | 36,34,123,131 | 88×98 |
| `all-rounder/arm_l.png` | 64×128 | 24,8,39,63 | 16×56 |
| `all-rounder/arm_r.png` | 64×128 | 24,8,39,63 | 16×56 |
| `all-rounder/leg_l.png` | 64×128 | 20,8,43,71 | 24×64 |
| `all-rounder/leg_r.png` | 64×128 | 20,8,43,71 | 24×64 |
| `abe-lincoln/head.png` | 160×160 | 48,12,111,121 | 64×110 |
| `abe-lincoln/body.png` | 160×160 | 36,30,123,151 | 88×122 |
| `abe-lincoln/arm_l.png` | 64×128 | 23,8,40,67 | 18×60 |
| `abe-lincoln/arm_r.png` | 64×128 | 23,8,40,67 | 18×60 |
| `abe-lincoln/leg_l.png` | 64×128 | 19,8,44,75 | 26×68 |
| `abe-lincoln/leg_r.png` | 64×128 | 19,8,44,75 | 26×68 |
| `swift/head.png` | 160×160 | 52,53,115,107 | 64×55 |
| `swift/body.png` | 160×160 | 36,32,123,127 | 88×96 |
| `swift/arm_l.png` | 64×128 | 25,8,38,61 | 14×54 |
| `swift/arm_r.png` | 64×128 | 25,8,38,61 | 14×54 |
| `swift/leg_l.png` | 64×128 | 21,8,42,69 | 22×62 |
| `swift/leg_r.png` | 64×128 | 21,8,42,69 | 22×62 |

## Lincoln placement checks (contract-specific)

- `abe-lincoln/head.png` paints alpha above and below HEAD reference bounds:
  - reference raw Y range: `52..107`
  - alpha Y range: `12..121` (hat above, beard below)
- `abe-lincoln/body.png` paints alpha below BODY reference bounds:
  - reference raw Y range: `36..123`
  - alpha Y range: `30..151` (coattails extend below)

## Failure QA (required)

Mutation:

1. Back up and remove `raw-assets/fighters{m}/abe-lincoln{tps}/head.png`
2. Run `pnpm -F @smash/client assets:validate`

Observed failing output:

```text
assets-checked=17
violations=1
  - character=abe-lincoln part=HEAD rule=missing-part expected-filename=head.png actual-filename=absent
```

Restoration:

3. Restore backed-up `head.png`
4. Re-run `pnpm -F @smash/client assets:validate`

Observed restored output:

```text
assets-checked=18
violations=0
```
