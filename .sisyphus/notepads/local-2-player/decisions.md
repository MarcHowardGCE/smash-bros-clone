- T8: Reused the always-created `GameClient` bootstrap for online mode and disconnected it on first local-mode entry instead of restructuring startup, minimizing risk to the existing online flow.
- T8: `Play Again` in local mode returns to character select and destroys all existing fighter renderers before restarting, ensuring fresh controllers/camera state per match.

- 2026-08-05 audit decision: reject current implementation because DEFAULT_KEYMAP_P1 and DEFAULT_KEYMAP_P2 overlap on KeyU, KeyI, KeyO, and KeyP, violating the no-overlap plan requirement.
