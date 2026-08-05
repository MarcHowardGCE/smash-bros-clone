# Local 2-Player Support

## TL;DR

> Add an **offline / local 2-player** mode to the existing Smash Bros clone. Two human players share one keyboard and one browser tab, using separate keymaps on a shared screen.
>
> **Deliverables**:
> - New injectable keymap support in `InputManager` (P1 + P2 mappings)
> - New `LocalMatch` client class that runs the authoritative `GameEngine` locally without a server
> - Character-select overlay before a local match
> - "Local Play" entry point from the main menu
> - Shared-screen camera that frames both fighters
> - Winner screen and Play Again for local matches
>
> **Estimated Effort**: Medium
>
> **Parallel Execution**: YES — 3 waves
>
> **Critical Path**: T1 (keymap abstraction) → T4 (LocalMatch) → T8 (camera) → F1-F4

---

## Context

### Original Request
> "Review the project code. I want to make 2 player available locally on the same computer. So we need the ability to have multi-layer local in addition to what we have now. This means we will need to implement player 2 controls for local play."

### Interview Summary
**Confirmed decisions**:
- P2 uses the same keyboard with a different keyset:
  | Action | P2 Keys |
  |---|---|
  | Move left / right | `J` / `L` |
  | Jump | `I` |
  | Down / fast fall | `K` |
  | Attack | `U` |
  | Special | `O` |
  | Shield | `P` |
  | Grab | `;` (Semicolon) |
- Display: shared single-camera (no split-screen).
- Match flow: "Local Play" button on main menu → character-select screen → offline 2P match.
- Characters: selectable in UI; first pass uses the same fighter archetype but stores a per-player choice for future expansion.
- Friendly fire / self-damage: enabled (default engine behavior).
- Post-match winner screen + Play Again: yes.
- Mode is offline/local-only; no socket/server changes for online flows.

### Research Findings
- Client entry: `/apps/client/src/main.ts` (Pixi setup, `GameClient`, `UIManager`, renderer wiring).
- Input layer: `/apps/client/src/input/InputManager.ts` — hardcoded single-keymap, single `playerId`.
- Network client: `/apps/client/src/network/GameClient.ts` — one `InputManager`, one `LocalPredictor`, socket based.
- Rendering: `/apps/client/src/renderer/FighterRenderer.ts` already supports multiple fighters keyed by `PlayerId` and varies appearance by `slotIndex`.
- Authoritative engine wrapper: `/apps/server/src/GameEngine.ts` runs the full 60 Hz simulation and accepts `playerIds: PlayerId[]`; deterministic and suitable for client-side instantiation because it imports only `@smash/engine` and `@smash/shared`.
- UI: `/apps/client/src/ui/UIManager.ts` — lobby, HUD, result. Assumes a `myPlayerId` for highlighting.

### Metis Review
**Incorporated guardrails**:
- Single-player online mode must remain untouched (no socket changes).
- Avoid duplicating `GameEngine` logic inside the client; import it directly from `@smash/server`.
- Character-select should not block the first pass with complex fighter data; choices are recorded but all fighters map to the same move set for now.
- Camera framing must clamp to stage bounds so fighters never render outside the visible world.
- Input polling and physics ticking must be synchronized at the same 60 Hz tick rate to avoid desyncs.
- Important note: importing `@smash/server` into the client may pull Node-only modules (socket.io, etc.). The executor must verify that `apps/server/src/GameEngine.ts` is cleanly importable by the client bundler, or fall back to moving `GameEngine` to a shared package if Vite fails to bundle it.

---

## Work Objectives

### Core Objective
Enable two human players to play a complete local match on the same computer, in the same browser tab, using distinct keyboard controls and a shared camera, without affecting the existing online multiplayer flow.

### Concrete Deliverables
- `InputManager` accepts an injected per-player keymap and `playerId`.
- New `LocalMatch` class under `/apps/client/src/local/` runs `GameEngine` directly, polls two `InputManager`s, and emits snapshots to the existing rendering pipeline.
- New `LocalPlayerController` class wraps one keymap + one `InputManager`.
- Character-select overlay in `UIManager` with keyboard/controller-ready selection for two players.
- Main menu gains a "Local Play" button that bypasses socket connection and starts local mode.
- Shared-screen camera in the renderer that zooms/pans to keep both fighters visible.
- Local match result screen with Play Again.

### Definition of Done
- [ ] `pnpm build` passes for all packages.
- [ ] `pnpm test` still passes (`packages/engine` Vitest suite).
- [ ] `just play` allows starting a Local Play match.
- [ ] P1 and P2 can move, jump, attack, special, shield, grab independently.
- [ ] Match ends when one player loses all stocks and shows the correct winner.
- [ ] Online Create/Join Room still works with one player per tab.

### Must Have
- Two simultaneous local keyboard players in one browser tab.
- Distinct keymaps for P1 and P2 with no overlap.
- Shared-screen camera.
- Character-select UI before local match start.
- Winner screen when one player runs out of stocks.

### Must NOT Have (Guardrails)
- No changes to server socket routing, `RoomManager`, `MatchSession`, or online flow.
- No gamepad support in this pass.
- No split-screen.
- No AI opponent.
- No new fighter move data; the single existing fighter is used for both players.

### Auto-Resolved Gaps (during self-review)
- **Default P2 keymap**: finalized to J/L/I/K/U/O/P/; with no overlap with P1.
- **Offline mode instead of server-backed**: plan uses `LocalMatch` with `GameEngine` client-side; no server changes needed.
- **Same fighter for both players**: character choice is recorded but does not change moves; minimizes UI/engine risk.
- **Camera clamping**: explicitly bounded to stage so fighters never render in empty space.

### Defaults Applied (override if needed)
- P2 keys default to the right-hand IJKL cluster.
- Play Again returns to character-select.
- Friendly fire / self-damage remain on (engine default).

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (Vitest in `packages/engine`).
- **Automated tests**: Tests-after for new code where practical; existing engine tests must continue to pass.
- **Framework**: Vitest (`pnpm test`).

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright to navigate the menu, click "Local Play", assert character-select renders, start match, and verify winner screen.
- **Controls**: Use `interactive_bash` / tmux or Playwright keyboard input to send key combinations and assert fighter positions/state via debug API or DOM/Canvas pixels.
- **Build**: Use Bash `pnpm build` and `pnpm test` to verify compilation and existing tests.
- **Manual QA scenarios** for controls must specify exact keys and expected observable behavior (fighter moves, percent increases, stocks decrease).

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation - inputs & local engine wiring):
├── T1: Refactor InputManager to accept injected keymaps
├── T2: Create LocalPlayerController wrapper
├── T3: Verify @smash/server GameEngine is importable by client
└── T4: Create LocalMatch class (offline engine runner)

Wave 2 (UI & camera):
├── T5: Add "Local Play" button and character-select overlay
├── T6: Extend UIManager for local match HUD/result flow
├── T7: Implement shared-screen camera for two fighters
└── T8: Wire LocalMatch into main.ts and add Play Again

Wave 3 (Integration & cleanup):
├── T9: Final integration of all components
└── T10: Add tests/build verification

Wave FINAL (Mandatory review):
├── F1: Plan compliance audit (oracle)
├── F2: Code quality review (unspecified-high)
├── F3: Real manual QA + screenshots/videos (unspecified-high)
└── F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay
```

### Dependency Matrix (full)

| Task | Depends On | Blocks |
|------|-----------|--------|
| T1 | — | T2, T4 |
| T2 | T1 | T4, T9 |
| T3 | — | T4 |
| T4 | T1, T2, T3 | T8, T9 |
| T5 | — | T8, T9 |
| T6 | — | T8, T9 |
| T7 | — | T9 |
| T8 | T4, T5, T6, T7 | T9 |
| T9 | T2, T4, T5, T6, T7, T8 | T10 |
| T10 | T9 | F1-F4 |
| F1-F4 | T10 | User okay |

### Agent Dispatch Summary

- **T1, T3, T7**: `quick` — targeted refactors or small standalone files.
- **T2, T5, T6, T8**: `visual-engineering` — UI, menu, camera (frontend-heavy).
- **T4, T9, T10**: `deep` — game loop integration.
- **F1, F4**: `oracle`/`deep` — verification.
- **F2, F3**: `unspecified-high` — code quality and hands-on QA.

---

## TODOs

> Implementation + Test = ONE Task. Never separate.
> EVERY task MUST have: Recommended Agent Profile + Parallelization info + QA Scenarios.
> **A task WITHOUT QA Scenarios is INCOMPLETE. No exceptions.**

- [x] T1. **Refactor InputManager to accept injected keymaps**

  **What to do**:
  - Modify `/apps/client/src/input/InputManager.ts` so the constructor accepts a `keymap: Record<string, InputBitmask>` and a `playerId: PlayerId` instead of using hardcoded mapping internally.
  - Keep P1 default keymap in a new `DEFAULT_KEYMAP_P1` constant (or object) exported from the same file or a new `keymaps.ts`.
  - Add `DEFAULT_KEYMAP_P2` with the bindings decided above (`J`/`L` left/right, `I` jump, `K` down, `U` attack, `O` special, `P` shield, `;` grab).
  - Ensure `keyToBit` reads from the injected map; treat any unmapped key as `0`.
  - Add a `destroy()` or `teardown()` method (or return cleanup function) so local mode can remove listeners without leaking when starting a new match.

  **Must NOT do**:
  - Do not change the existing single-player behavior when no keymap is provided, unless you also update `GameClient` in the same wave to pass P1 keymap. Prefer: make keymap optional and default to P1 mapping.
  - Do not add gamepad code.
  - Do not change `InputEvent` shape in shared types.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - Reason: focused single-file refactor, low complexity.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T2, T3, T4)
  - **Blocks**: T2, T4, T9
  - **Blocked By**: None

  **References**:
  - `/apps/client/src/input/InputManager.ts` — existing input handling.
  - `/packages/shared/src/types/InputEvent.ts` — `INPUT_BITS` constants.
  - `/apps/client/src/network/GameClient.ts` — shows how `InputManager` is constructed and used.

  **WHY Each Reference Matters**:
  - `InputManager.ts`: convert the hardcoded `keyToBit` switch statement into a lookup against the injected keymap.
  - `InputEvent.ts`: must continue emitting the same bit values (`INPUT_BITS.LEFT`, `RIGHT`, etc.).
  - `GameClient.ts`: will need to pass P1 keymap after this task; reference for how setPlayerId is currently called.

  **Acceptance Criteria**:
  - [ ] `InputManager` constructor signature is `(keymap, playerId)` or keymap is configurable after construction.
  - [ ] `pnpm test` still passes.
  - [ ] `pnpm -F @smash/client typecheck` passes.

  **QA Scenarios**:

  ```
  Scenario: P1 default keymap still works
    Tool: Playwright (or interactive_bash + browser)
    Preconditions: Build succeeds; run client dev server (`pnpm -F @smash/client dev`) with a temporary HTML page that constructs InputManager with P1 keymap and playerId='p1'.
    Steps:
      1. Focus page.
      2. Send keydown 'KeyA' then keyup 'KeyA'.
      3. Poll input for a few frames via a scriptable harness (e.g., expose pollInput on window).
    Expected Result: pollInput returns InputEvent with playerId='p1', held includes INPUT_BITS.LEFT when keydown is held.
    Evidence: screenshot of harness output and/or terminal log → .sisyphus/evidence/task-t1-p1-keymap.png

  Scenario: P2 keymap emits correct bits
    Tool: Playwright / harness
    Preconditions: InputManager constructed with P2 keymap and playerId='p2'.
    Steps:
      1. Send keydown 'KeyJ'.
      2. Poll input.
    Expected Result: InputEvent.playerId='p2' and held includes INPUT_BITS.LEFT.
    Evidence: .sisyphus/evidence/task-t1-p2-keymap.png
  ```

  **Evidence to Capture**:
  - [ ] task-t1-p1-keymap.png
  - [ ] task-t1-p2-keymap.png

  **Commit**: YES
  - Message: `refactor(client): make InputManager keymap and playerId injectable`
  - Files: `apps/client/src/input/InputManager.ts` (+ optional new `keymaps.ts`)
  - Pre-commit: `pnpm test && pnpm -F @smash/client typecheck`

- [x] T2. **Create LocalPlayerController wrapper**

  **What to do**:
  - Create `/apps/client/src/local/LocalPlayerController.ts` that owns one `InputManager` instance and exposes:
    - `playerId: PlayerId`
    - `pollInput(): InputEvent | null` (delegates to InputManager)
    - `setTick(tick: number)`: forwards to InputManager.setCurrentTick
    - `destroy()` / teardown
  - This wrapper represents one "seat" / local player.
  - Define exported `LocalPlayerConfig` type `{ playerId, keymap, slotIndex }`.

  **Must NOT do**:
  - Do not replicate InputManager logic inside the wrapper.
  - Do not couple this wrapper to `GameEngine` or `GameClient`.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - Reason: thin adapter, minimal logic.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: T4, T9
  - **Blocked By**: T1

  **References**:
  - `/apps/client/src/input/InputManager.ts` — to be wrapped.
  - `/packages/shared/src/types/InputEvent.ts` — for `InputEvent`, `PlayerId`.

  **Acceptance Criteria**:
  - [ ] New file compiles; `pnpm -F @smash/client typecheck` passes.
  - [ ] A temporary harness can create two controllers with different keymaps and distinct player IDs.

  **QA Scenarios**:
  ```
  Scenario: Two controllers poll independently
    Tool: Playwright / harness
    Preconditions: Create LocalPlayerController('p1', P1_KEYMAP) and LocalPlayerController('p2', P2_KEYMAP).
    Steps:
      1. Hold 'KeyA' (P1 left) and 'KeyL' (P2 right).
      2. Set tick to 0 on both and call pollInput() on both.
    Expected Result: Controller p1 event has held=INPUT_BITS.LEFT; controller p2 event has held=INPUT_BITS.RIGHT; playerIds match.
    Evidence: .sisyphus/evidence/task-t2-two-controllers.png
  ```

  **Evidence to Capture**:
  - [ ] task-t2-two-controllers.png

  **Commit**: YES
  - Message: `feat(client): add LocalPlayerController wrapper for per-player input`
  - Files: `apps/client/src/local/LocalPlayerController.ts`
  - Pre-commit: `pnpm -F @smash/client typecheck`

- [x] T3. **Verify @smash/server GameEngine imports cleanly in client build**

  **What to do**:
  - Try to import `GameEngine` from `@smash/server` inside the client (create a temporary test file or import in a throwaway module).
  - Run `pnpm -F @smash/client build` and/or `pnpm build`.
  - If Vite bundles `GameEngine` without pulling Node-only code, this task is done.
  - If the build fails because `apps/server/src/index.ts` or server-only dependencies leak in, move `/apps/server/src/GameEngine.ts` (and any private helpers it needs) to a shared location such as `/packages/engine/src/server/` OR create a barrel export from `@smash/server` that only re-exports `GameEngine` and ensures the client bundler tree-shakes the rest.
  - Prefer the minimal path: if `@smash/server` package.json is not already a workspace dependency of the client, add it to `apps/client/package.json` under `dependencies` or `devDependencies` and verify.

  **Must NOT do**:
  - Do not modify server behavior.
  - Do not copy-paste GameEngine code into the client.

  **Recommended Agent Profile**:
  - **Category**: `quick` / `unspecified-high` (depends on bundler issues found)
  - Reason: build verification + possible small package refactor.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T1/T2)
  - **Parallel Group**: Wave 1
  - **Blocks**: T4
  - **Blocked By**: None

  **References**:
  - `/apps/server/src/GameEngine.ts` — target to import.
  - `/apps/client/package.json` — dependency setup.
  - `/packages/engine/package.json` — boundary of determinism.

  **WHY Each Reference Matters**:
  - `GameEngine.ts`: imports only from `@smash/engine` and `@smash/shared`, making it a strong candidate for client reuse.
  - `apps/client/package.json`: may need `@smash/server` added as workspace dep.

  **Acceptance Criteria**:
  - [ ] `pnpm build` passes with a client-side import of `GameEngine`.
  - [ ] Client bundle size check: run `pnpm -F @smash/client build` and note bundled size; if socket.io/server code is included, reject and fix packaging.

  **QA Scenarios**:
  ```
  Scenario: Client build succeeds with GameEngine import
    Tool: Bash
    Preconditions: Checkout branch; add throwaway import in a client file.
    Steps:
      1. Add `import { GameEngine } from '@smash/server';` to a temporary client file.
      2. Run `pnpm build`.
    Expected Result: Build exits 0; no errors about Node-only modules in client build.
    Evidence: .sisyphus/evidence/task-t3-build-log.txt (last 50 lines of build output)

  Scenario: Reject bundle bloat from server-only modules
    Tool: Bash
    Preconditions: Build succeeded.
    Steps:
      1. Inspect `apps/client/dist/assets/` for unexpected large JS chunks mentioning socket.io or server bootstrap.
    Expected Result: No server bootstrap/socket.io code in client bundle.
    Failure Indicators: `index-[hash].js` contains references to `socket.io`, `cors`, `express`, or `http.createServer`.
    Evidence: .sisyphus/evidence/task-t3-bundle-grep.txt (grep results)
  ```

  **Evidence to Capture**:
  - [ ] task-t3-build-log.txt
  - [ ] task-t3-bundle-grep.txt

  **Commit**: YES
  - Message: `chore(client): verify server GameEngine is client-bundlable`
  - Files: `apps/client/package.json`, possibly relocation of `GameEngine.ts`
  - Pre-commit: `pnpm build`

- [x] T4. **Create LocalMatch class (offline engine runner)**

  **What to do**:
  - Create `/apps/client/src/local/LocalMatch.ts` that:
    - Imports `GameEngine` (from `@smash/server` or relocated package per T3).
    - Owns an array of `LocalPlayerController` instances.
    - Owns a `GameEngine` instance configured with two generated `PlayerId`s (e.g., `local-p1`, `local-p2`).
    - Runs a 60 Hz fixed loop using `setImmediate`/`requestAnimationFrame` or a `performance.now()` accumulator (mirror `MatchSession` loop style).
    - Each tick: set tick on each controller, poll inputs, build a `Map<PlayerId, InputEvent | null>`, call `engine.tickGame(inputs)`, store the resulting `GameState` as a `StateSnapshot` (timestamp = `performance.now()`).
    - Emits `onSnapshot(snapshot: StateSnapshot)` to a listener.
    - Provides `start() / stop()` and `cleanup()`.
  - Reuse the server loop style for consistency, but no socket/network code.

  **Must NOT do**:
  - Do not use socket.io or network serialization; local mode is synchronous.
  - Do not run two independent loops; keep one loop that processes both inputs.

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - Reason: owns the authoritative local game loop, must match server tick semantics precisely.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO within Wave 1 (needs T1/T2/T3), but Wave 1 itself can run in parallel after T1/T2/T3 finish
  - **Parallel Group**: Wave 1 (late)
  - **Blocks**: T8, T9
  - **Blocked By**: T1, T2, T3

  **References**:
  - `/apps/server/src/MatchSession.ts` — loop style reference.
  - `/apps/server/src/GameEngine.ts` — tickGame API.
  - `/apps/client/src/network/GameClient.ts` — rendering callback shape.
  - `/packages/shared/src/types/GameState.ts` — `StateSnapshot` shape.

  **WHY Each Reference Matters**:
  - `MatchSession.ts`: copy the accumulator + setImmediate pattern for deterministic 60 Hz.
  - `GameEngine.ts`: exact method name `tickGame(inputs)` and signature.
  - `GameState.ts`: construct `StateSnapshot` to match what renderer/InterpolationBuffer expects.

  **Acceptance Criteria**:
  - [ ] `LocalMatch` can be instantiated and started.
  - [ ] After starting, `onSnapshot` is called repeatedly with a valid `StateSnapshot` containing two players.
  - [ ] `stop()` halts the loop.

  **QA Scenarios**:
  ```
  Scenario: LocalMatch emits snapshots for two players
    Tool: Bash / harness
    Preconditions: LocalMatch compiled; run a short Node/Vitest test or browser harness.
    Steps:
      1. Instantiate LocalMatch with two LocalPlayerControllers.
      2. Call start().
      3. Wait 500ms, then call stop() and inspect last snapshot.
    Expected Result: Last snapshot has exactly two players with slotIndex 0 and 1, matchPhase='match', tick advanced > 0.
    Evidence: .sisyphus/evidence/task-t4-snapshot.json (snapshot serialized)

  Scenario: Inputs from both controllers affect respective players
    Tool: Browser harness
    Preconditions: LocalMatch started; controllers exposed on window.
    Steps:
      1. Hold P1 left ('KeyA') and P2 right ('KeyL') for several frames.
      2. Inspect latest snapshot player positions.
    Expected Result: Player 0 moves left (x decreases) and Player 1 moves right (x increases).
    Evidence: .sisyphus/evidence/task-t4-inputs-affect-players.json
  ```

  **Evidence to Capture**:
  - [ ] task-t4-snapshot.json
  - [ ] task-t4-inputs-affect-players.json

  **Commit**: YES (group with T1/T2/T3 as one feature)
  - Message: `feat(client): add LocalMatch offline engine runner`
  - Files: `apps/client/src/local/LocalMatch.ts`, `apps/client/src/local/LocalPlayerController.ts`
  - Pre-commit: `pnpm build && pnpm test`

- [x] T5. **Add "Local Play" button and character-select overlay**

  **What to do**:
  - In `UIManager`:
    - Update `showLobby()` to display two buttons: "Create Room" and "Join Room" stay in online section; add "Local Play" button.
    - Add `onLocalPlay` callback property.
    - Add `showCharacterSelect()` method that renders a simple overlay with two panels ("P1 Choose" / "P2 Choose"). Each panel shows the available fighters (only one for first pass, e.g., "All-Rounder"). Use keyboard controls to select:
      - P1 confirms with `Enter` or `Z`.
      - P2 confirms with `Enter` (numpad) or `U`.
    - When both players have confirmed, call a provided callback `onCharactersSelected(p1Choice, p2Choice)`.
  - Define a minimal `FighterChoice` type (string id + display name) in `/apps/client/src/local/types.ts`.
  - Use simple lock-in visuals (highlight border).

  **Must NOT do**:
  - Do not implement different move sets per fighter; character data is recorded but ignored by GameEngine.
  - Do not over-engineer the UI; no animations required.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - Reason: HTML/CSS overlay, input-driven UI.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: T8
  - **Blocked By**: None (pure UI, can be built before LocalMatch integration)

  **References**:
  - `/apps/client/src/ui/UIManager.ts` — existing lobby/result methods.
  - `/apps/client/src/main.ts` — callback wiring.
  - Fighter catalog: currently only one archetype (any `MoveId` from `@smash/shared`).

  **Acceptance Criteria**:
  - [ ] Lobby shows "Local Play" button.
  - [ ] Character-select renders when Local Play is clicked.
  - [ ] Both players can confirm and callback fires with choices.

  **QA Scenarios**:
  ```
  Scenario: Local Play button opens character select
    Tool: Playwright
    Preconditions: Client dev server running.
    Steps:
      1. Navigate to client URL.
      2. Wait for "Local Play" button visible.
      3. Click "Local Play".
    Expected Result: Overlay shows "P1 Choose" and "P2 Choose" panels.
    Evidence: .sisyphus/evidence/task-t5-charselect-visible.png

  Scenario: Both players can lock in fighter
    Tool: Playwright / keyboard
    Preconditions: Character-select open.
    Steps:
      1. Send P1 confirm key 'Enter'.
      2. Send P2 confirm key 'Enter'.
    Expected Result: Overlay disappears; a callback observable (e.g., route change) indicates selection complete.
    Evidence: .sisyphus/evidence/task-t5-lockin.png
  ```

  **Evidence to Capture**:
  - [ ] task-t5-charselect-visible.png
  - [ ] task-t5-lockin.png

  **Commit**: YES
  - Message: `feat(ui): add local play and character-select screens`
  - Files: `apps/client/src/ui/UIManager.ts`, `apps/client/src/local/types.ts`
  - Pre-commit: `pnpm -F @smash/client typecheck`

- [x] T6. **Extend UIManager for local match HUD/result flow**

  **What to do**:
  - Reuse `updateHUD` for local matches; remove or adjust `isMe` star highlighting for local mode because both players are local. For local mode, simply show `P1` and `P2` labels without the star.
  - Add `showLocalResult(winnerId)` method in `UIManager` that shows "P1 Wins!" / "P2 Wins!" / "Draw!" with a "Play Again" button.
  - Expose `onLocalPlayAgain` callback.
  - Hide room-code display in local mode.

  **Must NOT do**:
  - Do not rewrite online result flow (`showResult`); add local-specific methods.
  - Do not show room code during local play.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - Reason: HTML UI/HUD adjustments.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: T8
  - **Blocked By**: None

  **References**:
  - `/apps/client/src/ui/UIManager.ts` — existing `updateHUD`, `showResult`, `showMatch`.

  **Acceptance Criteria**:
  - [ ] Local HUD shows both players without online "star".
  - [ ] `showLocalResult` renders winner message.
  - [ ] `onLocalPlayAgain` callback is wired and resets the match.

  **QA Scenarios**:
  ```
  Scenario: Local HUD hides room code and shows both players
    Tool: Playwright
    Preconditions: In a local match.
    Steps:
      1. Assert no "Room:" display.
      2. Assert HUD shows "P1" and "P2" panels.
    Expected Result: Both labels visible; no star markers.
    Evidence: .sisyphus/evidence/task-t6-local-hud.png

  Scenario: Local result screen shows correct winner
    Tool: Playwright
    Preconditions: Simulate match end by directly calling uiManager.showLocalResult('local-p2').
    Steps:
      1. Call method.
      2. Assert text content contains "P2 Wins".
    Expected Result: Winner text renders with Play Again button.
    Evidence: .sisyphus/evidence/task-t6-local-result.png
  ```

  **Evidence to Capture**:
  - [ ] task-t6-local-hud.png
  - [ ] task-t6-local-result.png

  **Commit**: YES
  - Message: `feat(ui): local match HUD and result screen`
  - Files: `apps/client/src/ui/UIManager.ts`
  - Pre-commit: `pnpm -F @smash/client typecheck`

- [x] T7. **Implement shared-screen camera for two fighters**

  **What to do**:
  - Modify `/apps/client/src/main.ts` or create `/apps/client/src/renderer/Camera.ts` that, in local mode, rescales and repositions the Pixi stage to keep both fighters visible.
  - Approach:
    - Compute bounding box of both player positions, padded by e.g. 200 px.
    - Target scale = min(window.innerWidth / paddedWidth, window.innerHeight / paddedHeight), clamped so stage never zooms in too close or out beyond showing full stage.
    - Target center = midpoint of both players, clamped by stage bounds.
    - Apply scale/center to the Pixi `layers.game` container each frame with smoothing (lerp).
  - For online mode, leave existing fixed camera behavior (scale=1, centered).
  - Provide a flag/local-mode indicator so `main.ts` can choose which camera to apply.

  **Must NOT do**:
  - Do not implement split-screen.
  - Do not change online camera unless feature-flagged.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - Reason: PixiJS transforms and responsive viewport.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: T9
  - **Blocked By**: None

  **References**:
  - `/apps/client/src/main.ts` (lines 29–45): existing resize/scaling logic.
  - `/apps/client/src/renderer/layers.ts`: layer containers.
    - `/packages/shared/src/constants/stage.ts` (or STAGE constants): stage dimensions for clamping.

  **Acceptance Criteria**:
  - [ ] In local mode, moving one fighter to each side of the stage keeps both on screen.
    - [ ] In local mode, camera clamps so the stage edges remain visible (no empty void).
    - [ ] Online mode unaffected.

  **QA Scenarios**:
  ```
  Scenario: Camera frames separated fighters
    Tool: Playwright + exposed debug getters
    Preconditions: Local match running with both players spawned far apart (or manually set positions).
    Steps:
      1. Set player positions to left and right extremes via debug API.
      2. Read the stage container scale/position.
    Expected Result: Scale < 1 (zoomed out) and container translation places both fighters within viewport.
    Evidence: .sisyphus/evidence/task-t7-camera-wide.png

  Scenario: Camera clamps at stage edges
    Tool: Playwright
    Preconditions: Both fighters in center.
    Steps:
      1. Move both fighters to right edge.
      2. Read container translation.
    Expected Result: Camera centers on midpoint but does not scroll past stage right boundary.
    Evidence: .sisyphus/evidence/task-t7-camera-clamp.png
  ```

  **Evidence to Capture**:
  - [ ] task-t7-camera-wide.png
  - [ ] task-t7-camera-clamp.png

  **Commit**: YES
  - Message: `feat(client): shared-screen camera for local 2P`
  - Files: `apps/client/src/renderer/Camera.ts`, `apps/client/src/main.ts`
  - Pre-commit: `pnpm -F @smash/client typecheck`

- [x] T8. **Wire LocalMatch into main.ts and add Play Again**

  **What to do**:
  - In `/apps/client/src/main.ts`:
    - Add an `isLocalMode` flag.
    - On `UIManager.onLocalPlay`, do NOT create a `GameClient`. Instead:
      1. Instantiate `LocalMatch` with two `LocalPlayerController`s (`local-p1`, `local-p2`) and P1/P2 keymaps.
      2. Show character-select via `UIManager.showCharacterSelect()`.
      3. On `onCharactersSelected`, start `LocalMatch` and show countdown/match using existing UIManager methods.
    - Use `localMatch.onSnapshot` to:
      - Update `fighterRenderers` with `RenderState` assembled from `StateSnapshot`.
      - Apply local camera (T7) when in local mode.
      - Update HUD via `updateHUD(state, null)` (no myPlayerId in local mode) — update T6 if signature needs adjustment.
      - Detect match end (`snapshot.matchPhase === 'result'`) and call `showLocalResult`.
    - On `UIManager.onLocalPlayAgain`, stop/cleanup current `LocalMatch` and restart from character-select or directly reset.
  - Make sure cleanup removes window listeners from `InputManager` instances and stops the loop.

  **Must NOT do**:
  - Do not break online path.
  - Do not leave sockets open in local mode.

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - Reason: orchestrates engine, UI, input, and renderer in one file.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3
  - **Blocks**: T9
  - **Blocked By**: T4, T5, T6, T7

  **References**:
  - `/apps/client/src/main.ts` — wiring.
  - `/apps/client/src/local/LocalMatch.ts` — snapshot emission.
  - `/apps/client/src/ui/UIManager.ts` — new callbacks.
  - `/apps/client/src/renderer/Camera.ts` — camera updates.

  **Acceptance Criteria**:
  - [ ] Clicking "Local Play" starts a 2P offline match.
  - [ ] Both players controllable independently.
  - [ ] Play Again restarts the match.

  **QA Scenarios**:
  ```
  Scenario: End-to-end local match starts and ends
    Tool: Playwright
    Preconditions: `just play` or dev server running.
    Steps:
      1. Open client, click "Local Play".
      2. Confirm character selection for P1 and P2.
      3. During countdown, send no inputs; wait for "GO!".
      4. Use keyboard to attack P2 until stocks reach 0 (or speed up via debug API if available).
    Expected Result: Match ends with "P1 Wins!"; Play Again button appears; clicking it restarts to character-select or countdown.
    Evidence: .sisyphus/evidence/task-t8-e2e-local.mp4 (short screen recording)
  ```

  **Evidence to Capture**:
  - [ ] task-t8-e2e-local.mp4

  **Commit**: YES
  - Message: `feat(client): wire LocalMatch into main menu with play again`
  - Files: `apps/client/src/main.ts`, `apps/client/src/ui/UIManager.ts` (if signature changes)
  - Pre-commit: `pnpm build && pnpm test`

- [x] T9. **Final integration and regression checks**

  **What to do**:
  - Run `pnpm build` and `pnpm test`.
  - Verify online mode still works: create room, join from a second tab if possible, start match.
  - Verify local mode works end-to-end.
  - Fix any TypeScript errors.
  - Confirm no memory leaks from repeated Local Match Play Again cycles.

  **Must NOT do**:
  - Do not add new features at this stage (scope lock).

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - Reason: integration debugging.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: T8
  - **Blocks**: T10

  **Acceptance Criteria**:
  - [ ] `pnpm build` passes.
  - [ ] `pnpm test` passes.
  - [ ] Both local and online modes playable.

  **QA Scenarios**:
  ```
  Scenario: Build and test pass
    Tool: Bash
    Steps:
      1. Run `pnpm build && pnpm test`.
    Expected Result: Exit code 0, all 67 engine tests pass.
    Evidence: .sisyphus/evidence/task-t9-build.txt

  Scenario: Online mode regression
    Tool: Playwright (two contexts/pages if needed)
    Steps:
      1. Tab 1 creates room.
      2. Tab 2 joins via URL.
      3. Both ready; match starts.
    Expected Result: Both tabs enter match; no errors in console.
    Evidence: .sisyphus/evidence/task-t9-online-regression.txt (console logs)
  ```

  **Evidence to Capture**:
  - [ ] task-t9-build.txt
  - [ ] task-t9-online-regression.txt

  **Commit**: YES
  - Message: `chore(client): integration and regression checks for local 2P`
  - Files: all touched files
  - Pre-commit: `pnpm build && pnpm test`

- [x] T10. **Add minimal tests for new client code**

  **What to do**:
  - Add Vitest tests in `/apps/client/src/local/__tests__/` (or similar):
    - `InputManager` with injected keymap emits correct bits.
    - `LocalPlayerController` polls independently for two instances.
    - `LocalMatch` produces snapshots with two players and advances tick.
  - Add a test for camera math (compute target scale/center for given player positions).
  - Ensure client Vitest configuration exists; if not, add minimal `apps/client/vitest.config.ts`.

  **Must NOT do**:
  - Do not test Pixi rendering; focus on logic and state transitions.
  - Do not write elaborate UI tests (Playwright covers those).

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - Reason: unit tests.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T9, after T8)
  - **Parallel Group**: Wave 3
  - **Blocked By**: T8
  - **Blocks**: F1-F4

  **References**:
  - Existing engine tests in `/packages/engine/src/**/*.test.ts` for style.
  - `/packages/shared/src/types/InputEvent.ts` for test fixtures.

  **Acceptance Criteria**:
  - [ ] New client unit tests pass.
  - [ ] `pnpm test` (root) runs both engine and client tests.

  **QA Scenarios**:
  ```
  Scenario: Client tests pass
    Tool: Bash
    Steps:
      1. Run `pnpm test`.
    Expected Result: Client tests discovered and pass.
    Evidence: .sisyphus/evidence/task-t10-client-tests.txt
  ```

  **Evidence to Capture**:
  - [ ] task-t10-client-tests.txt

  **Commit**: YES
  - Message: `test(client): unit tests for local 2P input and match`
  - Files: `apps/client/src/local/__tests__/*.test.ts`
  - Pre-commit: `pnpm test`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing. Do NOT auto-proceed after verification.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, run command, inspect behavior). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in `.sisyphus/evidence/`. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `pnpm build` + `pnpm test`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, `console.log` in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (`data`/`result`/`item`/`temp`).
  Output: `Build [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (features working together, not isolation). Test edge cases: empty state, invalid input, rapid key mashing, both players holding the same direction, simultaneous attacks. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- Group commits by task (T1-T3 can be one feature commit, T4 its own, T5-T6 UI commits, T7 camera, T8 wiring, T9 integration, T10 tests).
- Each commit message follows `type(scope): description` and includes the relevant pre-commit command.

---

## Success Criteria

### Verification Commands
```bash
pnpm build          # Expected: exit code 0
pnpm test           # Expected: all 67 engine tests + new client tests pass
just play           # Expected: client opens; Local Play button visible
```

### Final Checklist
- [ ] Both players can move/jump/attack/special/shield/grab on one keyboard without conflicts.
- [ ] Shared camera keeps both fighters in view and clamps to stage.
- [ ] Character-select and winner screens work for local matches.
- [ ] Online Create/Join Room flow still works with one player per tab.
- [ ] All automated tests pass.
