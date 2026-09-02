# NETCODE-HARDENING-DESIGN

## 1) Problem statement verified from code

- `apps/client/src/network/GameClient.ts:93` sets `reconnection: false` on the socket client.
- `apps/server/src/createApp.ts:289-318` handles both `room:leave` and `disconnect` through `handleDisconnect(socketId)`.
- `handleDisconnect` calls `roomManager.removePlayer(socketId)` first, then stops/deletes an active `MatchSession` (`createApp.ts:300-304`), and emits `game:over` for `MATCH` rooms (`createApp.ts:311-314`) before `roomManager.endMatch(roomCode)`.

Current consequence: a transient network drop from one player can terminate the in-progress match for everyone.

## 2) Chosen server design

### Disconnect grace + rejoin contract

- Keep the player slot row on disconnect instead of immediate deletion.
- Record disconnect timestamp as `disconnectedAt`.
- Apply a 30-second grace window.
- Rejoin with `room:rejoin { roomCode, playerId }`, rebinding the player's new `socketId` to the same slot.

### RoomManager spike shape (this todo)

- `markDisconnected(playerId)` records disconnect metadata without altering existing `removePlayer` semantics.
- `rejoinRoom(roomCode, playerId, newSocketId)` validates room/player/disconnected state, enforces grace expiry, then rebinds socket identity.

### Pause-vs-keep-ticking decision

Decision: **keep ticking** during grace.

Reason: `apps/server/src/GameEngine.ts:77-88` already defines `EMPTY_INPUT` as the required missing-input sentinel (never `null`/`undefined`). Keeping the session alive with `EMPTY_INPUT` preserves server authority and avoids match teardown from short disconnects.

## 3) Client-side plan

Planned follow-up (not implemented in this todo):

- Flip `GameClient` socket option to `reconnection: true`.
- Persist `{ roomCode, playerId }` (e.g. `sessionStorage`) after room assignment.
- On reconnect, attempt `room:rejoin` using persisted identity.

This keeps session ownership server-side while allowing browser/socket reconnect recovery.

## 4) Spectator mode section (design only)

Planned path: `SPECTATE` join mode that subscribes a socket to room snapshots without consuming a player slot.

- No slot assignment.
- No gameplay input authority.
- Read-only consumption of existing 20 Hz `game:state` broadcasts.

Implementation is deferred; this section defines compatibility boundaries with the rejoin flow.
