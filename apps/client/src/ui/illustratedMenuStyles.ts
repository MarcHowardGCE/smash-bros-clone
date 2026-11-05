/** Shared cabinet skin. Decoration stays outside readable content and never handles input. */
export const illustratedMenuStyles = `
.menu-shell:not([data-menu-surface="game"]) {
 --menu-focus:#95d1c6;
}
.menu-shell:not([data-menu-surface="game"]) .overlay-center {
 background:#241c2b;border:3px double #b19465;border-radius:12px;
 box-shadow:0 12px 50px #0008,inset 0 0 0 5px #241c2b,inset 0 0 0 6px #695239;
 padding:32px;
}
.menu-shell:not([data-menu-surface="game"]) .ui-btn:not(.stage-grid-btn) {
 background:#302635 url('/menu-ui/secondary-button.png') center/100% 100% no-repeat;
 color:#f1e3bf;border:0;border-radius:10px;min-height:46px;
 padding:12px 26px;line-height:1.35;font-weight:650;
}
.menu-shell:not([data-menu-surface="game"]) .ui-btn:not(.stage-grid-btn):disabled {
 opacity:1;color:#c5b9bc;filter:saturate(.2);cursor:not-allowed;
}
.menu-shell:not([data-menu-surface="game"]) :is(.ui-btn,.audio-volume-row,.fighter-option,.network-fighter-option):is(.menu-selected,.seat-focused,:focus-visible) {
 outline:3px solid var(--menu-focus);outline-offset:4px;
}
.menu-shell:not([data-menu-surface="game"]) :is(.ui-btn,.fighter-option,.network-fighter-option):hover {filter:brightness(1.1);}
.menu-shell :is(#lps-start-btn,#resume-btn,#play-again-btn,#local-play-again-btn,#network-charselect-confirm-btn,.fighter-ready) {
 background-image:url('/menu-ui/primary-button.png')!important;color:#201a27!important;
}
.menu-shell .menu-hint {border:2px double #96764f;border-radius:8px;}
.menu-shell .selection-heading {grid-column:1/-1;text-align:center;}
.menu-shell .selection-heading h1,.menu-shell .world-selection h1 {
 display:inline-flex;align-items:center;justify-content:center;
 background:url('/menu-ui/title-ribbon.png') center/100% 100% no-repeat;
 min-height:68px;width:min(460px,100%);padding:16px 36px;color:#201a27;
 font:700 27px/1.15 Georgia,serif;margin:0 0 8px;
}
.selection-heading p {font-size:14px;color:#d5bb8f;margin:4px 0 12px;}
.menu-shell .fighter-player-panel {
 border:1px solid #96764f;border-top:4px solid var(--player-color);
 border-radius:16px 16px 8px 8px;background:linear-gradient(#3b2c40,#241c2b);
 padding:16px;box-shadow:inset 0 0 0 4px #241c2b;
}
.fighter-seat-title {font:700 19px Georgia,serif;margin-bottom:12px;color:#f1e3bf;}
.menu-shell .fighter-player-panel .fighter-option {
 position:relative;min-height:44px;background:#302635 url('/menu-ui/secondary-button.png') center/100% 100% no-repeat;
 border-radius:9px;padding:10px 24px;margin:9px 0;line-height:1.3;
}
.menu-shell .fighter-option[aria-pressed="true"] {
 background-image:url('/menu-ui/primary-button.png');color:#201a27;font-weight:750;
}
.menu-shell .fighter-option[aria-pressed="true"]::after {
 content:'✓';position:absolute;right:12px;top:50%;transform:translateY(-50%);font-weight:bold;
}
.menu-shell .fighter-player-panel[data-ready="true"] {box-shadow:inset 0 0 0 3px #95d1c6;}
.fighter-player-panel[data-ready="true"] [id$="-status"] {
 border:1px solid #95d1c6;border-radius:20px;padding:7px;background:#201a27;
}
.menu-shell .network-fighter-option {
 background:linear-gradient(100deg,#443047,#241c2b);border-radius:10px;
 box-shadow:inset 0 0 0 3px #241c2b;
}
.menu-shell .network-fighter-option[aria-pressed="true"] {background:#594051;border-color:#e0b567!important;}
.menu-shell .world-selection header {padding-right:110px;}
.menu-shell .world-selection header small {display:block;margin:0 0 8px;}
.menu-shell .world-layout .stage-grid-btn {
 border:3px double #b19465;border-radius:10px;background:#302635;overflow:hidden;
 box-shadow:0 4px 12px #0005;
}
.menu-shell .stage-grid-btn.menu-selected {outline:3px solid #95d1c6;outline-offset:4px;background:#453047;}
.menu-shell .stage-grid-btn span {font-size:17px;color:#f1e3bf;padding:10px;min-height:64px;}
.menu-shell #stage-preview {border:3px double #b19465;border-radius:10px;background:#f1e3bf;}
.menu-shell .world-copy {line-height:1.55;}
.menu-shell .world-copy .ui-btn {color:#f1e3bf;}
.menu-shell .world-random {min-width:240px;}
.menu-shell .controls-screen {background:#241c2b!important;border-radius:12px!important;padding:28px!important;}
.controls-screen .controls-heading,.setup-heading {font:700 30px Georgia,serif;letter-spacing:.02em!important;}
.controls-screen .controls-help {font-size:14px!important;line-height:1.5;}
.controls-screen .binding-label {font-size:13px!important;color:#eadbc3!important;}
.menu-shell .controls-screen .ui-btn {font-size:14px!important;min-height:44px;}
.menu-shell .controls-slot,.menu-shell .setup-seat {border:1px solid #96764f!important;background:#302635;border-radius:10px!important;}
.menu-shell .lps-count-btn[aria-pressed="true"] {background-image:url('/menu-ui/primary-button.png')!important;color:#201a27;font-weight:bold;}
.menu-shell .visual-settings h1 {color:#e0b567;}
.menu-shell #network-charselect-error {color:#ffb5ac!important;}
@media(max-height:800px){
 .menu-shell:not([data-menu-surface="game"]) .overlay-center {padding:24px;}
 .menu-shell .selection-heading h1,.menu-shell .world-selection h1 {min-height:54px;font-size:24px;padding:12px 30px;}
 .selection-heading p {display:none;}
 .menu-shell .overlay-center.character-selection {gap:10px;}
 .menu-shell .fighter-seat-title {font-size:17px;margin-bottom:8px;}
 .menu-shell .fighter-player-panel [id$="-status"] {font-size:12px!important;margin-top:8px!important;line-height:1.3;}
 .menu-shell .fighter-ready {min-height:40px!important;padding:9px 20px!important;font-size:14px;}
 .menu-shell .selection-portrait {height:112px;}
 .menu-shell .fighter-identity {min-height:58px;}
 .menu-shell .fighter-player-panel {padding:12px;}
 .menu-shell .fighter-player-panel .fighter-option {margin:6px 0;min-height:36px;padding:6px 20px;}
 .menu-shell .world-preview-art {aspect-ratio:16/6;}
}
@media(max-width:750px){
 .menu-shell .world-selection header {padding-right:0;padding-top:44px;}
 .menu-shell .world-selection h1 {font-size:23px;}
 .menu-shell .overlay-center.character-selection {gap:14px;padding:22px;}
 .menu-shell .controls-binding-grid {grid-template-columns:repeat(2,minmax(0,1fr))!important;}
}

/* Keep count selection in CSS: inline background shorthand reset the plaque sizing. */
.menu-shell #lps-player-btns {display:flex;gap:12px;}
.menu-shell #lps-player-btns .lps-count-btn {
 flex:1;min-width:0;margin:0;padding:12px 20px;
 background-size:100% 100%;background-position:center;background-repeat:no-repeat;
}
.menu-shell #lps-player-btns .lps-count-btn[aria-pressed="true"] {color:#201a27;}
/* Fixed outer shell; content scrolls inside it instead of moving the whole menu. */
.menu-shell .overlay-center.world-selection {
 height:calc(100dvh - 120px);max-height:calc(100dvh - 120px);
 display:flex;flex-direction:column;align-items:stretch;overflow:hidden;
}
.menu-shell .world-selection > header {flex:0 0 auto;}
.menu-shell .world-selection > .world-layout {
 flex:1 1 0;min-height:0;align-items:stretch;overflow:auto;padding:6px;
}
.menu-shell .world-layout > div {min-width:0;}
.menu-shell .world-layout #stage-preview {height:100%;min-height:0;overflow-y:auto;scrollbar-gutter:stable;}
.menu-shell .world-layout .world-preview-art {flex-shrink:0;}
@media(max-width:850px) {
 .menu-shell .world-layout #stage-preview {height:auto;min-height:360px;overflow:visible;}
}

`;

