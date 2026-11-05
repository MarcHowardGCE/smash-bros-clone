/** Illustrated main-menu pilot; other screens retain their current theme. */
export const mainMenuStyles = `
.menu-shell .main-menu-panel.fight-cabinet {
 width:min(760px,calc(100vw - 40px));padding:88px 72px 42px;
 max-height:calc(100dvh - 90px);border:0;border-radius:0;background:#201a27;
 border-image:none;
 scrollbar-color:#96764f #201a27;
}
.menu-shell .fight-cabinet::before {content:'';position:absolute;inset:0;background:url('/menu-ui/hero-frame.png') center/100% 100% no-repeat;pointer-events:none;}
.fight-cabinet > * {position:relative;}
.menu-shell .fight-cabinet > img {max-height:150px;margin:0 auto 20px;display:block;}
.fight-cabinet .fight-actions {display:grid;gap:12px;margin-bottom:20px;}
.menu-shell .fight-cabinet .cabinet-button {
 position:relative;isolation:isolate;background:transparent;border:0;border-radius:10px;
 width:100%;min-height:60px;padding:16px 42px;margin:0;color:#f1e3bf;font:700 18px system-ui,sans-serif;
}
.menu-shell .fight-cabinet .cabinet-button::before {
 content:'';position:absolute;inset:0;z-index:-1;pointer-events:none;
 background:url('/menu-ui/secondary-button.png') center/100% 100% no-repeat;
}
.menu-shell .fight-cabinet .cabinet-primary {color:#201a27!important;}
.menu-shell .fight-cabinet .cabinet-primary::before {background-image:url('/menu-ui/primary-button.png');}
.menu-shell .fight-cabinet .cabinet-button:hover::before {filter:brightness(1.12);}
.menu-shell .fight-cabinet .cabinet-button:is(.menu-selected,:focus-visible) {
 background:transparent;outline:3px solid #95d1c6;outline-offset:4px;
}
.menu-shell .fight-cabinet .cabinet-button:is(.menu-selected,:focus-visible)::after {
 content:'';position:absolute;left:-23px;top:50%;transform:translateY(-50%);width:42px;height:30px;
 background:url('/menu-ui/focus-eye.png') center/contain no-repeat;pointer-events:none;
}
.menu-shell .fight-cabinet .cabinet-button:active {transform:translateY(1px);}
.fight-cabinet .room-join {display:grid;grid-template-columns:minmax(0,1fr) 150px;align-items:center;gap:16px;}
.menu-shell .fight-cabinet .ui-input {width:100%;min-width:0;min-height:48px;box-sizing:border-box;text-align:center;letter-spacing:.12em;}
.fight-cabinet .menu-utilities {display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:18px 0;}
.menu-shell .fight-cabinet .menu-utilities .ui-btn {font-size:15px;padding:16px 20px;min-height:56px;}
.fight-cabinet .cabinet-section-label {font-size:12px;text-transform:uppercase;letter-spacing:.16em;color:#d5bb8f;margin:18px 0 10px;}
.fight-cabinet #audio-settings {flex-direction:row;flex-wrap:wrap;justify-content:center;gap:12px;margin:0;}
.menu-shell .fight-cabinet #audio-settings .ui-btn,.menu-shell .fight-cabinet .audio-volume-row {
 font-size:14px;padding:10px 14px;min-height:44px;background:#302635;
}
.fight-cabinet .room-label {padding:12px;background:#302635;border:1px solid #96764f;}
@media(max-height:800px){
 .menu-shell .main-menu-panel.fight-cabinet {padding:82px 64px 34px;}
 .menu-shell .fight-cabinet > img {max-height:95px;margin-bottom:12px!important;}
 .fight-cabinet .fight-actions {gap:9px;margin-bottom:12px;}
 .menu-shell .fight-cabinet .cabinet-button {min-height:52px;padding:13px 32px;font-size:17px;}
 .fight-cabinet .menu-utilities {margin:12px 0;}
 .fight-cabinet .cabinet-section-label {margin:12px 0 8px;}
}
@media(max-width:560px){
 .menu-shell .main-menu-panel.fight-cabinet {padding:76px 32px 32px;border-image-width:38px;}
 .fight-cabinet .menu-utilities {grid-template-columns:1fr;gap:10px;}
 .fight-cabinet .room-join {grid-template-columns:minmax(0,1fr) 100px;gap:10px;}
 .menu-shell .fight-cabinet .cabinet-button {padding-left:24px;padding-right:24px;}
}
`;

