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
