/** @fileoverview Injects global CSS styles for UI overlays, buttons, inputs, and splash screen. */

export function injectStyles(): void {
  const style = document.createElement('style');
  style.textContent = `
    .overlay-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 10;
      text-align: center;
      color: white;
      font-family: monospace;
      pointer-events: all;
    }
    .ui-btn {
      padding: 12px 28px;
      font-family: monospace;
      font-size: 18px;
      background: #000;
      color: #fff;
      border: 2px solid #fff;
      cursor: pointer;
      transition: background 0.1s;
      display: block;
      margin: 0 auto;
    }
    .ui-btn:hover, .ui-btn.menu-selected, .ui-btn.seat-focused { background: #222; outline: 3px solid white; outline-offset: 3px; }
    .ui-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .audio-volume-row {
      padding: 12px 28px;
      font-family: monospace;
      font-size: 18px;
      background: #000;
      color: #fff;
      border: 2px solid #fff;
      cursor: ew-resize;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      width: fit-content;
      user-select: none;
    }
    .audio-volume-row:hover, .audio-volume-row.menu-selected { background: #222; outline: 3px solid white; outline-offset: 3px; }
    #audio-settings {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    .menu-hint {
      position: absolute;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      font-family: monospace;
      font-size: 13px;
      color: rgba(255,255,255,0.45);
      pointer-events: none;
      white-space: nowrap;
    }
    .ui-input {
      padding: 10px;
      font-family: monospace;
      font-size: 18px;
      background: #000;
      color: #fff;
      border: 1px solid #fff;
      text-transform: uppercase;
      width: 140px;
    }
    #ui-overlay { pointer-events: all; z-index: 10; }

    /* Shared illustrated menu surface. Game and pause retain the live arena. */
    .menu-shell { --menu-ink:#201a27; --menu-paper:#f1e3bf; --menu-gold:#e0b567; isolation:isolate; }
    .menu-shell[data-menu-surface="menu"]::before {
      content:''; position:fixed; inset:0; z-index:0; pointer-events:none;
      background:linear-gradient(100deg,rgba(23,17,31,.96),rgba(23,17,31,.89)),url('/backgrounds/stage4.png') center/cover;
    }
    .menu-shell[data-menu-surface="pause"]::before { content:''; position:fixed; inset:0; z-index:0; background:#100c18b8; pointer-events:none; }
    .menu-shell:not([data-menu-surface="game"]) .overlay-center {
      display:flex; flex-direction:column; align-items:center; gap:12px;
      box-sizing:border-box; width:max-content; max-width:calc(100vw - 64px);
      max-height:calc(100dvh - 120px); overflow:auto; padding:28px;
      border:1px solid #96764f; border-radius:6px; background:#2b2332;
      color:var(--menu-paper); font-family:system-ui,sans-serif;
    }
    .menu-shell .main-menu-panel {
      position:absolute; z-index:10; top:50%; left:50%; transform:translate(-50%,-50%);
      width:min(680px,calc(100vw - 48px)); max-height:calc(100dvh - 110px); overflow:auto;
      box-sizing:border-box; text-align:center; padding:24px 30px; background:#2b2332;
      border:1px solid #96764f; border-radius:6px; color:var(--menu-paper); font-family:system-ui,sans-serif;
    }
    .menu-shell .main-menu-panel > img { max-width:100%!important; max-height:190px; object-fit:contain; }
    .menu-shell .ui-btn,.menu-shell .audio-volume-row,.menu-shell .ui-input {
      background:#332939; border:1px solid #b19465; border-radius:3px; color:var(--menu-paper); font-family:system-ui,sans-serif;
    }
    .menu-shell .ui-btn:hover,.menu-shell .ui-btn.menu-selected,.menu-shell .ui-btn.seat-focused,
    .menu-shell .audio-volume-row.menu-selected { background:#514051; outline:2px solid var(--menu-gold); outline-offset:3px; }
    .menu-shell button:focus-visible,.menu-shell input:focus-visible { outline:3px solid #7cbab0; outline-offset:3px; }
    .menu-shell .menu-hint { position:fixed; bottom:18px; z-index:15; color:#eadbc3; background:#201a27; border:1px solid #79634c; padding:9px 16px; border-radius:3px; white-space:normal; text-align:center; width:max-content; max-width:calc(100vw - 48px); box-sizing:border-box; font-family:system-ui,sans-serif; }
    .menu-shell .fighter-option,.menu-shell .network-fighter-option { background:#3c3043; border-radius:3px; }
    .menu-shell:not([data-menu-surface="game"]) .overlay-center > * { flex-shrink:0; }
    @media(max-height:800px) { .menu-shell .main-menu-panel { padding:18px 24px; } .menu-shell .main-menu-panel > img { max-height:130px; margin-bottom:16px!important; } .menu-shell .main-menu-panel .ui-btn,.menu-shell .main-menu-panel .audio-volume-row { padding:9px 22px; font-size:16px; } }
    @media(max-width:720px) { .menu-shell:not([data-menu-surface="game"]) .overlay-center { max-width:calc(100vw - 24px); padding:18px; flex-wrap:wrap; } .menu-shell .main-menu-panel { padding:18px; } }
    @media(prefers-reduced-motion:reduce) { .menu-shell * { transition:none!important; animation:none!important; } }

    .menu-shell .overlay-center.character-selection { align-items:stretch; display:grid; grid-template-columns:repeat(var(--players),minmax(0,1fr)); gap:18px; width:min(1320px,calc(100vw - 64px)); padding:22px; }
    .fighter-player-panel { min-width:0; text-align:center; border-top:3px solid var(--player-color); padding:12px; background:#372c3d; border-radius:4px; }
    .selection-portrait { width:100%; height:210px; object-fit:contain; display:block; filter:drop-shadow(0 8px 6px #0005); }
    .fighter-identity { min-height:88px; font-size:13px; color:#e6d3b2; }
    .fighter-identity strong { color:#e0b567; text-transform:uppercase; letter-spacing:.1em; font-size:11px; }
    .fighter-identity p { margin:8px 0; }
    .fighter-player-panel .fighter-option { width:100%; box-sizing:border-box; display:block; padding:8px; margin:7px 0; color:#f1e3bf; cursor:pointer; font:15px system-ui,sans-serif; }
    .network-fighter-option { color:var(--menu-paper); font-family:system-ui,sans-serif; display:grid!important; grid-template-columns:64px 1fr; align-items:center; gap:8px; text-align:left; width:100%!important; }
    .network-selection-portrait { grid-row:span 2; max-height:85px;
 height:125px; width:100%; object-fit:contain; display:block; }
    .network-fighter-option small { display:block; color:#e0b567; }
    .menu-shell .overlay-center.world-selection { display:block; width:min(1320px,calc(100vw - 64px)); text-align:left; padding:24px; }
    .world-selection header small { color:#e0b567; font-size:11px; letter-spacing:.17em; }
    .world-selection h1 { margin:5px 0 22px; font:36px Georgia,serif; }
    .world-layout { display:grid; grid-template-columns:1fr 1fr; gap:24px; align-items:start; }
    .world-layout .stage-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; }
    .world-layout .stage-grid-btn { padding:0; margin:0; min-width:0; overflow:hidden; width:100%; text-align:left; }
    .stage-grid-btn img { display:block; width:100%; aspect-ratio:16/10; object-fit:cover; }
    .stage-grid-btn span { display:block; padding:9px; font:16px/1.2 Georgia,serif; min-height:57px; }
    #stage-back-btn { position:absolute; top:18px; right:24px; }
    .world-random { margin:16px 0!important; }
    #stage-preview { background:#f1e3bf; color:#201a27; border-radius:4px; overflow:hidden; }
    .world-preview-art { display:block; width:100%; aspect-ratio:16/8; object-fit:cover; }
    .world-copy { padding:20px; font-size:14px; }
    .world-copy h2 { font:30px/1.1 Georgia,serif; margin:8px 0 16px; }
    .world-copy small { color:#79583d; letter-spacing:.12em; }
    .world-copy .ui-btn { background:transparent; color:#201a27; margin:12px 0; border-color:#8f7250; font-size:14px; }
    .world-arena-note { font-size:11px; color:#5d5046; }
    @media(max-height:800px) { .selection-portrait { height:150px; } .fighter-identity { min-height:75px; } .world-preview-art { aspect-ratio:16/6; } }
    @media(max-width:850px) { .menu-shell .overlay-center.character-selection { grid-template-columns:repeat(2,minmax(0,1fr)); } .world-layout { grid-template-columns:1fr; } }
    /* Splash screen */
    .splash-screen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: #000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      opacity: 1;
      transition: opacity 0.8s ease-out;
    }
    .splash-screen.fade-out {
      opacity: 0;
      pointer-events: none;
    }
    .splash-logo {
      max-width: 400px;
      width: 80vw;
      height: auto;
      animation: fadeInLogo 1.5s ease-in;
    }
    .splash-continue {
      margin-top: 60px;
      font-family: monospace;
      font-size: 18px;
      color: rgba(255, 255, 255, 0.6);
      animation: fadeInContinue 1s ease-in 1.5s both;
      cursor: pointer;
    }
    .splash-continue:hover {
      color: rgba(255, 255, 255, 0.9);
    }
    @keyframes fadeInLogo {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes fadeInContinue {
      from { opacity: 0; }
      to { opacity: 0.6; }
    }
  `;
  document.head.appendChild(style);
}
