import { afterEach, describe, expect, it } from 'vitest';
import { UIManager } from '../UIManager';
import { XBOX360_PROFILE } from '../../input/xbox360Profile';

afterEach(() => { document.body.innerHTML = ''; });
describe('menu presentation boundaries', () => {
  it('covers the arena for menus, shows it for countdown/match, and dims it for pause', () => {
    const overlay=document.createElement('div');document.body.append(overlay);const ui=new UIManager(overlay);
    ui.showLobby();expect(overlay.dataset.menuSurface).toBe('menu');
    ui.showCountdown(3);expect(overlay.dataset.menuSurface).toBe('game');
    ui.showMatch();expect(overlay.dataset.menuSurface).toBe('game');
    ui.showPauseOverlay();expect(overlay.dataset.menuSurface).toBe('pause');
    ui.hidePauseOverlay();expect(overlay.dataset.menuSurface).toBe('game');
    ui.showLobby();expect(overlay.dataset.menuSurface).toBe('menu');
    ui.showMatch();
  });
  it('uses profile labels in the lobby, pause and result hints', () => {
    const overlay=document.createElement('div');document.body.append(overlay);const ui=new UIManager(overlay);
    ui.setActiveController('Xbox 360 Controller');
    for(const show of [()=>ui.showLobby(),()=>ui.showPauseOverlay(),()=>ui.showLocalResult(null)]){
      show();expect(overlay.querySelector('.menu-hint')?.textContent).toContain(`Enter / ${XBOX360_PROFILE.menuLabels.confirm} Select`);
    }
    ui.showMatch();
  });
});
