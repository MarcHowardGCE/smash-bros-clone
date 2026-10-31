# Todo 01 Evidence — all-rounder parts inventory

Date: 2026-10-31

Route used: **B (script-authored placeholders, no AI model used)**

Source path: `raw-assets/fighters{m}/all-rounder{tps}/`

## Inventory (dimensions + alpha bounding boxes)

| File | Canvas (px) | Alpha bounding box (minX,minY,maxX,maxY) | Alpha box size |
|---|---:|---:|---:|
| `head.png` | 160×160 | 52,54,108,106 | 57×53 |
| `body.png` | 160×160 | 36,36,123,123 | 88×88 |
| `arm_l.png` | 64×128 | 25,8,38,51 | 14×44 |
| `arm_r.png` | 64×128 | 25,8,38,51 | 14×44 |
| `leg_l.png` | 64×128 | 24,8,39,55 | 16×48 |
| `leg_r.png` | 64×128 | 24,8,39,55 | 16×48 |

Inventory command:

```bash
node scripts/assets/inventory-all-rounder-parts.mjs
```

## Rejected-candidates table (required failure-path evidence)

| Candidate | URL | License text seen | Decision | Reason |
|---|---|---|---|---|
| Character & Animated Sprites Pack | https://opengameart.org/content/character-animated-sprites-pack | `License(s): CC-BY 3.0` | Rejected | Plan forbids CC-BY / attribution-required third-party assets. |
