import type{GamepadPoller}from'@smash/gamepad-input';
import{StageBackdrop,type VisualPreferences}from'../renderer/StageBackdrop';
import{MenuNavigator,type MenuButton}from'./MenuNavigator';
import{XBOX360_PROFILE}from'../input/xbox360Profile';
import{WORLD_STORIES}from'./selectionContent';
/** All adjustments are presentation preferences local to this browser. */
export function renderVisualSettingsScreen(container:HTMLElement,scene:StageBackdrop,onBack:()=>void,poller?:GamepadPoller|null):{destroy:()=>void}{
 container.innerHTML=`<div class="overlay-center visual-settings"><header><small>VISUAL ACCESSIBILITY</small><h1>Keep the fight in focus</h1><p id="visual-description">Lighten and quiet distant scenery. Fighters and platforms keep their original artwork.</p></header><div class="visual-settings-layout"><div class="visual-settings-controls"><button class="ui-btn" id="visual-fade" aria-describedby="visual-description"></button><div class="visual-adjust"><button class="ui-btn" id="visual-fade-less" aria-label="Decrease background fade">−</button><button class="ui-btn" id="visual-fade-more" aria-label="Increase background fade">+</button></div><button class="ui-btn" id="visual-color"></button><button class="ui-btn" id="visual-motion"></button><button class="ui-btn" id="visual-atmosphere"></button><button class="ui-btn" id="visual-reset">Restore defaults</button><button class="ui-btn" id="visual-back">← Back</button><p class="visual-helper">Left / right adjusts the highlighted setting. Motion follows your system preference by default and stops while paused.</p></div><section><div class="visual-preview" aria-label="Preview of the selected world with an unchanged fighter and platform"><div class="visual-preview-art"></div><div class="visual-preview-wash"></div><img class="visual-preview-platform" src="${import.meta.env.BASE_URL||'/'}platform-art/${scene.stageId}-main.png" alt=""><img class="visual-preview-fighter" src="${import.meta.env.BASE_URL||'/'}menu-art/abe-lincoln.png" alt="Abe Lincoln remains in the foreground"></div><p class="visual-preview-caption"></p><p id="visual-motion-status" role="status"></p></section></div></div><div class="menu-hint">↑↓ Navigate • ←→ Adjust • Enter / ${XBOX360_PROFILE.menuLabels.confirm} Activate • Esc / ${XBOX360_PROFILE.menuLabels.cancel} Back</div>`;
 const nav=new MenuNavigator(poller);const settings=()=>scene.getSettings();
 const change=(key:'fade'|'saturation',amount:number)=>scene.setSettings({[key]:Math.max(0,Math.min(100,settings()[key]+amount))});
 const cycleMotion=(direction=1)=>{const modes:VisualPreferences['motion'][]=['system','off','on'];scene.setSettings({motion:modes[(modes.indexOf(settings().motion)+direction+3)%3]!});};
 const actions:{id:string;activate:()=>void;adjust?:(d:-1|1)=>void}[]=[
  {id:'visual-fade',activate:()=>{const fade=settings().fade;scene.setSettings(fade<45?{fade:45,saturation:55}:fade<65?{fade:65,saturation:30}:{fade:0,saturation:100});},adjust:d=>change('fade',d*5)},
  {id:'visual-fade-less',activate:()=>change('fade',-5)},
  {id:'visual-fade-more',activate:()=>change('fade',5)},
  {id:'visual-color',activate:()=>change('saturation',settings().saturation>=100?-100:10),adjust:d=>change('saturation',d*10)},
  {id:'visual-motion',activate:()=>cycleMotion(),adjust:d=>cycleMotion(d)},
  {id:'visual-atmosphere',activate:()=>scene.setSettings({atmosphere:!settings().atmosphere})},
  {id:'visual-reset',activate:()=>scene.reset()},
  {id:'visual-back',activate:onBack},
 ];
 const buttons:MenuButton[]=actions.map((action,index)=>{const element=container.querySelector<HTMLElement>('#'+action.id)!;element.addEventListener('click',action.activate);element.addEventListener('focus',()=>nav.selectIndex(index));return{id:action.id,element,onActivate:action.activate,onAdjust:action.adjust};});
 function update():void {const p=settings();container.querySelector('#visual-fade')!.textContent='Background fade: '+p.fade+'%';container.querySelector('#visual-color')!.textContent='Background color: '+p.saturation+'%';container.querySelector('#visual-motion')!.textContent='Scenery motion: '+p.motion[0]!.toUpperCase()+p.motion.slice(1);const atmosphere=container.querySelector('#visual-atmosphere')!;atmosphere.textContent='Atmosphere layers: '+(p.atmosphere?'On':'Off');atmosphere.setAttribute('aria-pressed',String(p.atmosphere));const art=container.querySelector<HTMLElement>('.visual-preview-art')!;art.style.backgroundImage='url("'+scene.imagePath+'")';art.style.filter='saturate('+p.saturation/100+') blur('+Math.min(1,p.fade/75)+'px)';container.querySelector<HTMLElement>('.visual-preview-wash')!.style.opacity=String(p.fade/100);container.querySelector('.visual-preview-caption')!.textContent=WORLD_STORIES[scene.stageId]?.name??'Stage preview';container.querySelector('#visual-motion-status')!.textContent=scene.motionEnabled?'Motion may run during matches. This preview is still.':'Scenery motion is disabled. Gameplay animation is unchanged.';}
 update();const unsubscribe=scene.subscribe(update);nav.setButtons(buttons);nav.start(onBack);
 return{destroy:()=>{nav.stop();unsubscribe();}};
}
