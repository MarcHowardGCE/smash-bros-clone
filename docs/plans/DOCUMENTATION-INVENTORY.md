# Documentation inventory and cleanup priorities

Step 1 of the [documentation refresh](DOCUMENTATION-REFRESH.md) classifies all 53 documents from the [audit](DOCUMENTATION-AUDIT.md), plus the audit report and refresh plan added afterward. This register covers 55 existing documents. The verification checks below are scheduled for later phases.

**Keep current** retains a current entry point. **Revise** corrects guidance in place. **Split** separates maintained guidance from dated evidence in the same file or a linked archive. **Archive with pointer** preserves the original and keeps the old entry path useful. **Historical** retains dated claims as evidence.

## P1 — Contributor and art entry points

| Document | Disposition | Source and verification |
| --- | --- | --- |
| [README.md](../../README.md) | Revise | Use the workspace, operating guides, and full-body loader. Walk the quick start and verify the art source paths. |
| [INSTRUCTIONS.md](../../INSTRUCTIONS.md) | Revise | Use the architecture boundaries and refresh maintenance rule. Follow the art, build, test, deploy, and signoff links as a contributor. |
| [AGENTS.md](../../AGENTS.md) | Revise | Preserve scope and architecture invariants. Check claims against workspace and client/server entry points. Replace duplicated commands with links and add the maintenance rule in step 5. |
| [SPRITE-GENERATION-GUIDE.md](../../SPRITE-GENERATION-GUIDE.md) | Archive with pointer | Preserve the design-era guide. Verify that the root pointer reaches the new full-body workflow and the fallback guide. |
| [docs/README.md](../README.md) | Revise | Use the document map and this register. Follow the links to operating guides, art, active work, and history. |
| [docs/assets/REPLACING-FIGHTER-ART.md](../assets/REPLACING-FIGHTER-ART.md) | Split | Check the parts contract, AssetPack config, validator, and fallback renderer. Label the six-part workflow as fallback and separate full-body batch notes. |
| [docs/assets/FIGHTER-PRODUCTION-ATLAS.md](../assets/FIGHTER-PRODUCTION-ATLAS.md) | Split | Check both source and packed manifests, packer, verifier, loader, and Vite transport. Walk both packaging paths and state the scope of each check. |

## P2 — Operating guides, player guidance, and status

| Document | Disposition | Source and verification |
| --- | --- | --- |
| [docs/guides/DEVELOPMENT.md](../guides/DEVELOPMENT.md) | Revise | Check workspace and package scripts, Vite config, and the optional just recipes. Run clean-checkout setup with an empty environment directory. |
| [docs/guides/TESTING.md](../guides/TESTING.md) | Revise | Check package scripts, Playwright configuration, and recent evidence. Run the documented portable smoke and reconcile full-suite expectations. |
| [docs/guides/DEPLOYMENT.md](../guides/DEPLOYMENT.md) | Split | Use Dockerfile, Render and Fly manifests, and Express startup for the runbook. Validate local production and the two-client smoke. Keep dated signoff separate. |
| [docs/REFINEMENT.md](../REFINEMENT.md) | Revise | Reconcile current baselines with shared rules, engine and server fixtures, and the active index. Preserve the playtest log and provisional reference checks. |
| [docs/TRAINING-DOJO.md](../TRAINING-DOJO.md) | Split | Check the curriculum, practice panel, pause tabs, and KO presentation. Walk Free Practice and guided lessons, then separate earlier curriculum and test evidence. |
| [docs/TRAINING-LAB.md](../TRAINING-LAB.md) | Split | Check the live practice panel, input trace, and local match loop. Exercise recording, stepping, and current prompts and readouts in the Dojo. |
| [docs/MENU-POLISH-PLAN.md](../MENU-POLISH-PLAN.md) | Split | Check menu code and keyboard, native accessibility, and hosted loading evidence. Surface current signoff ahead of earlier release gates. |
| [docs/ANALOG-MOVEMENT-REFINEMENT.md](../ANALOG-MOVEMENT-REFINEMENT.md) | Split | Check InputManager, shared movement settings, and movement tests. Keep dated input comparisons. |
| [docs/LANDING-INPUT-REFINEMENT.md](../LANDING-INPUT-REFINEMENT.md) | Split | Check recovery and buffer logic, fixtures, and a Dojo trace. Keep earlier buffer iterations dated. |
| [docs/FATIGUE-PARRY-SEQUENCE-AUDIT.md](../FATIGUE-PARRY-SEQUENCE-AUDIT.md) | Split | Check dodge profiles, hit resolution, and input cadence fixtures. Separate current rules and native blockers from earlier packet-delay evidence. |
| [docs/LAUNCH-MOTION-REFINEMENT.md](../LAUNCH-MOTION-REFINEMENT.md) | Split | Check launch, contact, and ledge code, regressions, and Dojo probes. Put current behavior and open timing questions ahead of past experiments. |
| [docs/assets/ART-SOURCE.md](../assets/ART-SOURCE.md) | Split | Use shipped manifests and source folders for the current pipeline. Keep dated provenance and earlier atlas notes. |
| [docs/assets/ULTIMATE-ANIMATION-CHECKLIST.md](../assets/ULTIMATE-ANIMATION-CHECKLIST.md) | Split | Check both packed manifests, runtime hooks, and the curriculum. Separate current coverage from proposed mechanics and old art passes. |
| [ROADMAP.md](../../ROADMAP.md) | Keep current | Follow the pointers to current priorities and the archived roadmap. |
| [docs/plans/ACTIVE-WORK.md](ACTIVE-WORK.md) | Keep current | Reconcile each row with the latest evidence. Verify that pending items name a next action or blocker. |
| [docs/plans/DOCUMENTATION-REFRESH.md](DOCUMENTATION-REFRESH.md) | Keep current | Update phase progress from this inventory and validation evidence. |

## P3 — Historical and design records

Label records where readers could mistake an earlier command, status, or next step for current guidance.

| Document | Disposition | What to preserve |
| --- | --- | --- |
| [docs/AIR-MOVEMENT-REFINEMENT.md](../AIR-MOVEMENT-REFINEMENT.md) | Historical | Air mobility, fast fall, and measured jumps. |
| [docs/DEFENSIVE-TRANSITION-AUDIT.md](../DEFENSIVE-TRANSITION-AUDIT.md) | Historical | Recovery transition defects and targeted validation. |
| [docs/DODGE-PROFILE-REFINEMENT.md](../DODGE-PROFILE-REFINEMENT.md) | Historical | Reference profile choices and fresh-value tests. |
| [docs/MOVEMENT-LAUNCH-AUDIT.md](../MOVEMENT-LAUNCH-AUDIT.md) | Historical | Initial movement and launch findings. |
| [docs/OOS-DODGE-PARRY-REFINEMENT.md](../OOS-DODGE-PARRY-REFINEMENT.md) | Historical | Early out-of-shield and fatigue tuning evidence. |
| [docs/SHIELD-DODGE-TIMING-REFINEMENT.md](../SHIELD-DODGE-TIMING-REFINEMENT.md) | Historical | Earlier shield-drop, parry, and dodge timing evidence. |
| [docs/assets/FIGHTER-ART-PILOT-V1.md](../assets/FIGHTER-ART-PILOT-V1.md) | Historical | Pilot revisions and review decisions. |
| [docs/assets/FIGHTER-ART-ROSTER-V1.md](../assets/FIGHTER-ART-ROSTER-V1.md) | Historical | Original-roster art batches and consistency checks. |
| [docs/assets/FIGHTER-CONTACT-SIGNOFF.md](../assets/FIGHTER-CONTACT-SIGNOFF.md) | Historical | Revision 18 contact and gameplay-scale measurements. |
| [docs/assets/FIGHTER-ENGINE-HANDOFF.md](../assets/FIGHTER-ENGINE-HANDOFF.md) | Historical | Dated art integration decisions and tests. |
| [docs/assets/FIGHTER-MOVESET-BASELINE.md](../assets/FIGHTER-MOVESET-BASELINE.md) | Historical | Design-era moveset choices and their artwork requirements. |
| [docs/assets/FIGHTER-PALETTE-AUDIT.md](../assets/FIGHTER-PALETTE-AUDIT.md) | Historical | Palette, face, and costume review evidence. |
| [docs/assets/FIGHTER-POLISH-AUDIT.md](../assets/FIGHTER-POLISH-AUDIT.md) | Historical | Revision 16 corrections and review outputs. |
| [docs/assets/evidence/todo-01-parts-inventory.md](../assets/evidence/todo-01-parts-inventory.md) | Historical | First articulated parts inventory. |
| [docs/assets/evidence/todo-04-character-art.md](../assets/evidence/todo-04-character-art.md) | Historical | Raw part exports and original authoring checks. |
| [docs/assets/evidence/todo-14-doc-walkthrough.md](../assets/evidence/todo-14-doc-walkthrough.md) | Historical | Artist walkthrough for the original parts pipeline. |
| [docs/assets/evidence/f3-visual/report.md](../assets/evidence/f3-visual/report.md) | Historical | Visual QA run and captures. |
| [docs/history/clean-checkout-verification.md](../history/clean-checkout-verification.md) | Historical | Dated local, container, and hosted results. Append new dated evidence as collected. |
| [docs/history/legacy-readme.md](../history/legacy-readme.md) | Historical | Original README snapshot. |
| [docs/history/legacy-refinement.md](../history/legacy-refinement.md) | Historical | Original refinement milestones and case counts. |
| [docs/history/legacy-roadmap.md](../history/legacy-roadmap.md) | Historical | Original roadmap and project context. |
| [docs/plans/DOCUMENTATION-AUDIT.md](DOCUMENTATION-AUDIT.md) | Historical | Original 53-document audit and link-check baseline. |
| [docs/sprint/DESIGN-DECISIONS.md](../sprint/DESIGN-DECISIONS.md) | Historical | Input and settings choices at the end of the sprint. |
| [docs/sprint/FIGHTER-3-DESIGN.md](../sprint/FIGHTER-3-DESIGN.md) | Historical | Swift's original design proposals. |
| [docs/sprint/INPUT-SETTINGS-DESIGN.md](../sprint/INPUT-SETTINGS-DESIGN.md) | Historical | Sprint design discussion and trade-offs. |
| [docs/sprint/NETCODE-HARDENING-DESIGN.md](../sprint/NETCODE-HARDENING-DESIGN.md) | Historical | Network rationale before later reconnect changes. |
| [docs/sprint/SFX-DESIGN.md](../sprint/SFX-DESIGN.md) | Historical | Original audio design and implementation decisions. |
| [docs/sprint/TEAM-SPRINT-PACK.md](../sprint/TEAM-SPRINT-PACK.md) | Historical | Facilitator material and sprint outcomes. Label old status boxes as dated. |
| [docs/sprint/plans/netcode-disconnect-layers.md](../sprint/plans/netcode-disconnect-layers.md) | Historical | Proposed disconnect design. Route current operations to the deployment runbook. |
| [apps/client/public/fighter-art-pilot-v1/ART-SOURCE.md](../../apps/client/public/fighter-art-pilot-v1/ART-SOURCE.md) | Historical | Asset provenance shipped with the pilot pack. |
| [apps/client/public/fighter-art-pilot-v1/BATCH-20.md](../../apps/client/public/fighter-art-pilot-v1/BATCH-20.md) | Historical | Batch 20 art and handoff notes. |
| [apps/client/public/fighter-art-pilot-v1/BATCH-21.md](../../apps/client/public/fighter-art-pilot-v1/BATCH-21.md) | Historical | Batch 21 integration notes. |

## Related contributor surfaces

- The [justfile](../../justfile) is outside the Markdown count. Its help text skips fighter and world selection after Ready and describes a 67-test engine suite, while the recipe calls the workspace suite. In P2, reconcile the help text, document Bash and port assumptions, and review the scope of the cleanup recipes before recommending them.
- The older task notes referenced by the sprint pack describe past work. The sampled sprint and docs-audit plans are historical context. The docs index and active-work index remain the current entry points.
- The contributor-facing scan found no checked-in PR template or workflow directory. Step 5 owns the review prompt and portable link check.
