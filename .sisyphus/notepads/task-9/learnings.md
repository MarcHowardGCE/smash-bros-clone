2026-07-09
- @smash/server can consume @smash/engine workspace code cleanly once the server has the workspace dependency and the engine root index re-exports the needed physics/FSM/hitbox APIs.
- Msgpack binary state transport works cleanly with socket.io by encoding to Uint8Array and emitting a Buffer view to avoid JSON serialization.
