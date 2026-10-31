# Art Source Decision — Todo 1

Date: 2026-10-31

## Route taken

**Route B (fallback): script-authored placeholders (no external art pack imported).**

Reason: I evaluated Kenney CC0 candidate packs first, but did not find a pack I could confidently use as-is for the exact 6-part contract required by this plan (single isolated part PNGs at exact canvases/joints, near-white tintable clothing regions, glove/shoe-only limbs, and explicit 12px opaque underlap below limb joints). To avoid blocking, I generated placeholders programmatically via a local script.

## Route B provenance (what was actually done)

- Tool: local Node.js script (`scripts/assets/generate-all-rounder-parts.mjs`)
- Generator libraries: `pngjs@^7.0.0` (root devDependency)
- Model: **none** (no text/image model used)
- Generation date: 2026-10-31
- Command run: `node scripts/assets/generate-all-rounder-parts.mjs`
- Output path: `raw-assets/fighters{m}/all-rounder{tps}/{head,body,arm_l,arm_r,leg_l,leg_r}.png`

### Verbatim prompts

No AI prompt was used. These placeholders are script-authored raster drawings, generated deterministically from hardcoded geometric instructions in the script.

### Commercial-use terms

Because the files were authored in-repo by script (no third-party art imported), usage follows this repository's own licensing/distribution terms. No attribution or paid license requirement was introduced by the generated placeholder art.

### Non-copyrightability caveat + replacement intent

This plan's standing caveat remains recorded: raw AI outputs may be non-copyrightable under current U.S. Copyright Office guidance. In this run, no AI output was used; however these files are still temporary placeholders intended for replacement by final production art in later todos.

## Kenney packs evaluated before fallback

| Candidate | URL | Observed license text | Decision | Disqualifying reason for this todo |
|---|---|---|---|---|
| Toon Characters (Kenney) | https://kenney.nl/assets/toon-characters | `License Creative Commons CC0` | Rejected for Todo 1 | Page confirms CC0, but catalog metadata alone did not prove immediate contract-fit for this repo's exact per-part raster contract (exact part decomposition + exact joint/underlap/tintable constraints). |
| Modular Character Pack (Kenney on OGA mirror) | https://opengameart.org/content/modular-character-pack | `License(s): CC0` | Rejected for Todo 1 | Large modular set; not imported in this todo because suitability for exact 6-part fighter rig and strict contract constraints was not established from page-level evidence alone. |

## Deliberately rejected non-CC0 candidate (required failure-path evidence)

| Candidate | URL | License text (verbatim excerpt) | Decision | Reason |
|---|---|---|---|---|
| Character & Animated Sprites Pack | https://opengameart.org/content/character-animated-sprites-pack | `License(s): CC-BY 3.0` and `Licence: Creative Commons CC-BY 3.0` | Rejected | Todo forbids CC-BY / attribution-required third-party packs. |

## CC0 reference text captured during evaluation

Source: https://creativecommons.org/publicdomain/zero/1.0/

> The person who associated a work with this deed has dedicated the work to the public domain by waiving all of his or her rights to the work worldwide under copyright law, including all related and neighboring rights, to the extent allowed by law.

> You can copy, modify, distribute and perform the work, even for commercial purposes, all without asking permission.
