# Todo 14 — Artist doc walkthrough evidence

Date: 2026-10-31

## Goal

Prove `docs/assets/REPLACING-FIGHTER-ART.md` is executable as-written, and prove doc-vs-contract drift test fails when a table number is perturbed.

## Happy path (follow doc literally)

1. Use replacement-pack workflow pattern from `apps/client/e2e/todo-12-swap-proof.spec.ts`:
   - Create a temp `raw-assets/fighters{m}/<characterId>{tps}/` tree.
   - Write all 6 exact filenames per character.
   - Run AssetPack to generate a temp atlas/manifest set.
   - Swap generated assets into `apps/client/public/assets` with restore in `finally`.
2. Launch client and run through local play flow to in-match HUD.
3. Observe rendering succeeds with no production code edits.

Result: replacement pack renders successfully with the documented folder/tag conventions and filenames, no code changes required.

## Failure QA (doc number perturbation)

Perturbation applied (temporary): in `docs/assets/REPLACING-FIGHTER-ART.md`, change one numeric table value (`HEAD rawCanvasPx 160x160 -> 161x160`).

Command:

```bash
pnpm -F @smash/client test -- src/renderer/parts/__tests__/assetContractDocTable.test.ts
```

Observed failure (expected):

```text
AssertionError: expected rows to equal expectedRows
```

Restore: revert the temporary doc perturbation to the original contract value (`160x160`).

Re-run same command: test passes.

## Notes

- This evidence intentionally validates process and CI failure mode, not visual style quality.
- Drift guard is deterministic: if doc numbers diverge from `assetContract.ts`, CI fails.
