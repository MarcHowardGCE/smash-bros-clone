# Documentation refresh and maintenance plan

**Status:** All five documentation steps are complete. The separately tracked [client regression gate](ACTIVE-WORK.md) has since passed. The [inventory](DOCUMENTATION-INVENTORY.md) classifies all audited documents and records verification sources. The [November 10 audit](DOCUMENTATION-AUDIT.md) preserves the original findings. Use the [active-work index](ACTIVE-WORK.md) to track execution.

## Document map

| Document | Owns |
| --- | --- |
| [README](../../README.md) | What the game does, repository layout, and the shortest supported setup, test, and deploy paths. |
| [Docs index](../README.md) | Where readers go for current guides, active work, and historical records. |
| [Contributor instructions](../../INSTRUCTIONS.md) and [repository rules](../../AGENTS.md) | Contributor and agent responsibilities, architectural boundaries, review expectations, and links to commands. |
| [Operating guides](../README.md#operating-guides) | Executable setup, testing, and deployment procedures, including prerequisites, supported shells, and expected results. |
| [Art and asset docs](../README.md#fighter-art-and-assets) | Source art locations, full-body authoring, fallback parts, packaging, and verification. |
| [Dojo and training lab](../README.md#play-and-practice) | Current player controls and workflows. Workstream notes record why behavior changed and how it was tested. |
| [Active work](ACTIVE-WORK.md), [refinement decisions](../REFINEMENT.md), and dated evidence | The index owns current priorities, next actions, and blockers. Refinement owns the current gameplay baseline. Workstream records and history preserve dated results, decisions, and earlier proposals. |

## Execution

- [x] **1. Classify the inventory.** Give every Markdown file in the audited scope one disposition: keep current, revise, split current guidance from history, archive with a pointer, or retain as historical evidence. Inspect other contributor-facing instructions and templates for the same drift. For each current document, identify the maintained source and how to verify it. Exclude the separate Bonney project and environment files. This phase is done when every file has a disposition and the priority list is reflected in the index.
- [x] **2. Fix the contributor and art entry points.** Replace the root sprite guide with a short pointer and archive its original text. Write the full-body workflow for both packs, covering source sheets, manifests, roots, sockets, review playback, packing, and verification. Label the six-part guide as the fallback workflow. Put the current atlas workflow ahead of dated batches and state which checks cover each pack. Align README, INSTRUCTIONS.md, AGENTS.md, and the docs index. This phase is done when a new artist can find the right source and complete an isolated packaging check without using a historical batch as instructions.
- [x] **3. Refresh the remaining current docs.** Verify setup, tests, and deploy guidance against package scripts, workspace configuration, and deployment manifests. Check player controls, menus, stages, the Dojo and its diagnostics, combat and network behavior, and the active plan against current code and recorded signoff. Label superseded directions, preliminary numbers, and sprint notes. Preserve dated evidence and existing links where practical. This phase is done when each retained current claim has a source and each active plan names its next action or blocker.
- [x] **4. Verify from a clean checkout.** Use an empty environment directory. Run the documented install, build, type checks, test commands, and a local browser smoke. Exercise the current full-body and fallback art paths, a Dojo lesson, and a local two-client flow. Validate both atlas workflows and production startup. Record exact commands, failures or skips, and any hosted, hardware, human, or reference checks that require separate evidence. Verify all current relative links and heading targets and spot-check the legacy pointers.
- [x] **5. Install the maintenance rule.** Put the change-to-doc checklist below into the contributor and agent instructions, and add a short PR template prompt for the impacted docs, evidence, or a reason the change needs no doc update. Add a portable relative-link and heading check, expose it as a documented command, and verify its baseline before making it a required CI check where CI is configured. Keep the manual source comparison in review. A valid link can still lead to obsolete instructions.

Step 2 verification is recorded with the [atlas workflow](../assets/FIGHTER-PRODUCTION-ATLAS.md#packaging-verification--november-10-2026). Both isolated builds, production transport checks, and two local browser cases passed. The original sprite guide was preserved in [history](../history/legacy-sprite-generation-guide.md).

Step 3 compared the current guides with the code, separated older workstream evidence, and passed the [targeted documentation verification](../history/clean-checkout-verification.md#documentation-refresh-step-3-verification). Step 4 finished the [clean-checkout rehearsal](../history/clean-checkout-verification.md#documentation-refresh-step-4-clean-checkout). Setup, build, type checks, both art workflows, and browser smoke passed. The full test run exposed client failures, which were subsequently repaired and [verified separately](../history/clean-checkout-verification.md#client-regression-gate-follow-up).

Step 5 added the maintenance rule to both contributor guides, the [GitHub PR checklist](../../.github/pull_request_template.md), and the [portable link and heading check](../guides/TESTING.md#documentation-links-and-headings). The repository scan passed. An isolated fixture verified both successful checks and a failing exit code for a missing file and a broken heading. The command is a local review check. This repository has no CI workflow to attach it to.

## Maintenance rule for future changes

The person making a change updates the matching current documentation in the same change. The reviewer checks that the docs describe what ships and that the verification claims match the evidence.

| Change | Update in the same change |
| --- | --- |
| Setup, scripts, configuration, dependencies, build, or hosting | The matching operating guide. Update the README when its quick-start or architecture changes. |
| Controls, gameplay, menus, accessibility, Dojo, or online behavior | The affected player guide or current workstream summary. Record the new behavior, evidence, and remaining limits. |
| Fighter, stage, animation, asset pipeline, or inventory | The current art workflow or inventory and any affected player guide. Include the validation that covers the change. |
| A priority, milestone, signoff result, or blocker changes | Update the active-work row and place the dated evidence in the linked workstream record. Record the next observable action. |
| A document moves, is renamed, or loses a section | Update incoming links and index entries. Keep a pointer where contributors have been sent to the old path. |

Before review, list the docs changed or state why the change has no documentation impact. Check affected links and anchors, and run any changed instructions where practical. Distinguish automated, local, hosted, physical hardware, human, and version-matched reference results. Record checks that could not run and who or what can unblock them. During release review, spot-check quick-start, deployment and smoke instructions, current player guidance, and the active-work index against the release.

The refresh is complete when the full inventory has a disposition, the current workflows have recorded validation, historical material is clearly labeled, and the maintenance rule is present in the contributor instructions and review workflow.
