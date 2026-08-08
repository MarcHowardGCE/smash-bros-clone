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
    .ui-btn:hover { background: #111; }
    .ui-btn:disabled { opacity: 0.5; cursor: not-allowed; }
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
  `;
  document.head.appendChild(style);
}
