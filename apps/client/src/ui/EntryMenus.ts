import { escapeHtml } from './selectionContent';

export interface LobbySeat {
  playerId: string;
  slotIndex: number;
  ready?: boolean;
}

export function homeMenu(confirmPrompt: string): string {
  return `<section class="menu-workspace home-menu" aria-label="Main menu">
    <div class="home-brand"><span class="menu-kicker">The arcade is open</span>
      <img src="${import.meta.env.BASE_URL}branding/everybody-throws-hands-arcade.png" width="1536" height="1024" alt="Everybody Throws Hands">
    </div>
    <div class="home-choices"><header><span class="menu-kicker">Main menu</span><h1>Choose a mode</h1></header>
      <button class="menu-quiet home-mode" id="local-play-btn"><span>01</span><strong>Local Play</strong><small>Fight on one screen with friends or CPU opponents.</small></button>
      <button class="menu-quiet home-mode" id="online-play-btn"><span>02</span><strong>Online Play</strong><small>Host a private room or join with a code.</small></button>
      <button class="menu-quiet home-mode" id="practice-btn"><span>03</span><strong>Training Dojo</strong><small>Practice freely or work through guided lessons.</small></button>
      <div class="home-tools" aria-label="Settings">
        <button class="menu-quiet" id="controls-btn">Controls</button>
        <button class="menu-quiet" id="visual-settings-btn">Accessibility</button>
        <button class="menu-quiet" id="home-audio-btn">Sound</button>
      </div>
      <p class="menu-hint">↑↓ Navigate · ←→ Adjust · Enter / ${confirmPrompt} Select</p>
    </div>
  </section>`;
}

export function onlineEntry(code: string): string {
  return `<section class="menu-workspace online-entry" aria-labelledby="online-title">
    <header class="picker-header"><div><span class="menu-kicker">Online play</span><h1 id="online-title">Private rooms</h1></div>
      <button class="menu-quiet" id="online-back-btn">← Back</button></header>
    <div class="online-entry-grid">
      <section><span class="menu-kicker">Host</span><h2>Create a room</h2><p>Get an invite link and share it with up to three other players.</p>
        <button class="menu-quiet workspace-primary" id="create-btn">Create Room</button></section>
      <form id="online-join-form"><span class="menu-kicker">Guest</span><h2>Join a room</h2>
        <label for="join-code">Six-character room code</label>
        <div class="online-code-row"><input id="join-code" class="ui-input" autocomplete="off" spellcheck="false" aria-describedby="online-entry-status" maxlength="6" value="${escapeHtml(code)}">
        <button class="menu-quiet workspace-primary" id="join-btn" type="submit">Join Room</button></div></form>
    </div>
    <p id="online-entry-status" class="workspace-status" role="status"></p>
  </section>`;
}

export function roomLobby(code: string): string {
  return `<section class="menu-workspace online-room" aria-labelledby="online-room-title">
    <header class="picker-header"><div><span class="menu-kicker">Online play / Private room</span><h1 id="online-room-title">Room Lobby</h1></div>
      <button class="menu-quiet" id="leave-room-btn">Leave Room</button></header>
    <div class="online-room-grid"><section class="room-invite"><span class="menu-kicker">Room code</span><strong>${escapeHtml(code)}</strong>
      <p>Send the code or invite link to your players.</p>
      <button class="menu-quiet" id="copy-btn">Copy Invite Link</button><p id="copy-room-status" class="workspace-status" role="status"></p>
    </section><section class="room-roster"><div class="picker-header"><h2>Players</h2><span id="room-seat-count"></span></div>
      <div class="room-seats" id="player-list"></div></section></div>
    <footer class="workspace-footer"><p id="room-ready-status" class="workspace-status" role="status"></p>
      <button class="menu-quiet workspace-primary" id="ready-btn">Ready</button></footer>
  </section>`;
}

export function roomSeats(players: readonly LobbySeat[], localId: string | null, hostId?: string): string {
  return [0,1,2,3].map(slotIndex => {
    const player = players.find(seat => seat.slotIndex === slotIndex);
    const number = '<span class="room-seat-number">P'+(slotIndex+1)+'</span>';
    if (!player) return `<span class="room-seat room-seat-open">${number} Open seat</span>`;
    const tags = [player.playerId === localId ? 'You' : '', player.playerId === hostId ? 'Host' : ''].filter(Boolean);
    return `<div class="room-seat" data-ready="${Boolean(player.ready)}">${number}
      <strong>${tags.join(' · ') || 'Player '+(slotIndex+1)}</strong><small>${player.ready ? 'Ready' : 'Connected'}</small></div>`;
  }).join('');
}
