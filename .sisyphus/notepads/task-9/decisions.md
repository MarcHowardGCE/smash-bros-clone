2026-07-09
- Implemented the authoritative match loop per-room in MatchSession so room lifecycle/socket concerns stay in index.ts while simulation stays in GameEngine.
- Kept GameEngine pure/no socket I/O; server integration owns msgpack decode/encode and room-scoped game:over/game:state emissions.
