/** Client-only scenery treatment. Never changes collision, timing or network state. */
export interface VisualPreferences {fade:number;saturation:number;motion:'system'|'off'|'on';atmosphere:boolean;}
export const DEFAULT_VISUAL_PREFERENCES:VisualPreferences={fade:45,saturation:55,motion:'system',atmosphere:true};
export const VISUAL_STORAGE_KEY='smash:visuals:v1';
export const SCENE_PROFILES:Record<string,{theme:string;haze:string;farSeconds:number;nearSeconds:number}>={
 stage1:{theme:'clouds',haze:'247,242,228',farSeconds:150,nearSeconds:105},
 stage2:{theme:'underwater',haze:'187,235,231',farSeconds:170,nearSeconds:125},
 stage3:{theme:'steam',haze:'247,221,215',farSeconds:130,nearSeconds:90},
 stage4:{theme:'cosmic',haze:'222,208,244',farSeconds:190,nearSeconds:145},
 stage5:{theme:'banquet',haze:'250,231,197',farSeconds:155,nearSeconds:115},
 stage6:{theme:'library',haze:'241,220,176',farSeconds:180,nearSeconds:135},
};
function normalize(raw:Partial<VisualPreferences>):VisualPreferences {
 const bounded=(value:unknown,fallback:number)=>typeof value==='number'&&Number.isFinite(value)?Math.max(0,Math.min(100,Math.round(value))):fallback;
 return {fade:bounded(raw.fade,45),saturation:bounded(raw.saturation,55),motion:['system','off','on'].includes(raw.motion??'')?raw.motion!:'system',atmosphere:typeof raw.atmosphere==='boolean'?raw.atmosphere:true};
}
const css=`
 #background-layer {overflow:hidden;pointer-events:none;isolation:isolate;background-color:#f3eee1;}
 #background-layer .scene-art {position:absolute;inset:0;background-position:center;background-size:cover;will-change:auto;z-index:0;}
 #background-layer .scene-wash {position:absolute;inset:0;background:#f3eee1;opacity:var(--scene-fade,.45);z-index:3;pointer-events:none;}
 #background-layer .scene-atmosphere {position:absolute;inset:-12%;pointer-events:none;will-change:auto;z-index:1;opacity:.32;}
 #background-layer .scene-atmosphere--near {z-index:2;opacity:.23;}
 #background-layer .scene-atmosphere-texture {position:absolute;inset:0;background-repeat:no-repeat;animation:scene-far-drift var(--scene-far-duration,150s) ease-in-out infinite alternate;animation-play-state:paused;}
 #background-layer .scene-atmosphere--near .scene-atmosphere-texture {animation-name:scene-near-drift;animation-duration:var(--scene-near-duration,105s);}
 #background-layer[data-motion="on"] .scene-art,#background-layer[data-motion="on"] .scene-atmosphere {will-change:transform;}
 #background-layer[data-motion="on"] .scene-atmosphere-texture {animation-play-state:running;}
 #background-layer[data-atmosphere="off"] .scene-atmosphere {display:none;}
 #background-layer[data-theme="clouds"] .scene-atmosphere-texture {background-image:radial-gradient(ellipse 28% 13% at 14% 18%,rgba(var(--scene-haze),.9),transparent 80%),radial-gradient(ellipse 32% 12% at 84% 28%,rgba(var(--scene-haze),.85),transparent 80%),radial-gradient(ellipse 38% 15% at 20% 88%,rgba(var(--scene-haze),.7),transparent 85%);}
 #background-layer[data-theme="clouds"] .scene-atmosphere--near .scene-atmosphere-texture {background-image:radial-gradient(ellipse 30% 10% at 4% 58%,rgba(var(--scene-haze),.95),transparent 83%),radial-gradient(ellipse 32% 11% at 98% 72%,rgba(var(--scene-haze),.9),transparent 84%);}
 #background-layer[data-theme="underwater"] .scene-atmosphere-texture {background-image:linear-gradient(110deg,transparent 15%,rgba(var(--scene-haze),.17) 20%,transparent 27%,transparent 70%,rgba(var(--scene-haze),.22) 75%,transparent 82%),radial-gradient(ellipse 40% 45% at 8% 75%,rgba(var(--scene-haze),.6),transparent 80%),radial-gradient(ellipse 35% 30% at 96% 28%,rgba(var(--scene-haze),.6),transparent 85%);}
 #background-layer[data-theme="underwater"] .scene-atmosphere--near .scene-atmosphere-texture {background-image:radial-gradient(circle at 12% 20%,rgba(var(--scene-haze),.7) 0 1.5px,transparent 2.5px),radial-gradient(circle at 85% 36%,rgba(var(--scene-haze),.65) 0 2px,transparent 3px),radial-gradient(circle at 20% 65%,rgba(var(--scene-haze),.5) 0 2.5px,transparent 4px),radial-gradient(ellipse 28% 45% at 95% 85%,rgba(var(--scene-haze),.65),transparent 83%);}
 #background-layer[data-theme="steam"] .scene-atmosphere-texture,#background-layer[data-theme="banquet"] .scene-atmosphere-texture {background-image:radial-gradient(ellipse 18% 38% at 7% 76%,rgba(var(--scene-haze),.85),transparent 85%),radial-gradient(ellipse 20% 32% at 95% 44%,rgba(var(--scene-haze),.8),transparent 86%);}
 #background-layer[data-theme="steam"] .scene-atmosphere--near .scene-atmosphere-texture,#background-layer[data-theme="banquet"] .scene-atmosphere--near .scene-atmosphere-texture {background-image:radial-gradient(ellipse 12% 30% at 12% 95%,rgba(var(--scene-haze),.9),transparent 85%),radial-gradient(ellipse 16% 26% at 89% 92%,rgba(var(--scene-haze),.85),transparent 85%);}
 #background-layer[data-theme="cosmic"] .scene-atmosphere-texture {background-image:radial-gradient(ellipse 38% 28% at 8% 28%,rgba(var(--scene-haze),.65),transparent 85%),radial-gradient(ellipse 35% 35% at 98% 78%,rgba(var(--scene-haze),.7),transparent 85%);}
 #background-layer[data-theme="cosmic"] .scene-atmosphere--near .scene-atmosphere-texture,#background-layer[data-theme="library"] .scene-atmosphere-texture {background-image:radial-gradient(circle at 9% 14%,rgba(var(--scene-haze),.8) 0 1px,transparent 2px),radial-gradient(circle at 23% 37%,rgba(var(--scene-haze),.7) 0 1px,transparent 2px),radial-gradient(circle at 73% 18%,rgba(var(--scene-haze),.6) 0 1px,transparent 2px),radial-gradient(circle at 87% 62%,rgba(var(--scene-haze),.7) 0 1.5px,transparent 2.5px),radial-gradient(ellipse 22% 45% at 95% 70%,rgba(var(--scene-haze),.55),transparent 85%);}
 #background-layer[data-theme="library"] .scene-atmosphere--near .scene-atmosphere-texture {background-image:linear-gradient(118deg,transparent 12%,rgba(var(--scene-haze),.15) 16%,transparent 22%,transparent 74%,rgba(var(--scene-haze),.18) 80%,transparent 86%);}
 @keyframes scene-far-drift {from{transform:translate3d(-1.2%,-.7%,0) scale(1.02)}to{transform:translate3d(1.2%,.8%,0) scale(1.055)}}
 @keyframes scene-near-drift {from{transform:translate3d(1.6%,1%,0) scale(1.04)}to{transform:translate3d(-1.6%,-1.2%,0) scale(1.09)}}
 @media(prefers-reduced-motion:reduce){#background-layer[data-motion-mode="system"] .scene-atmosphere-texture{animation:none;}}
`;
export class StageBackdrop {
 private preferences:VisualPreferences;
 private media:MediaQueryList|null;
 private listeners=new Set<()=>void>();
 private art:HTMLElement|null=null;
 private far:HTMLElement|null=null;
 private near:HTMLElement|null=null;
 private nodes:HTMLElement[]=[];
 private active=false;
 private moving=false;
 private focus={x:0,y:0,spread:0};
 private current={x:0,y:0,spread:0};
 stageId='stage1';
 imagePath='';
 private onMedia=()=>this.apply();
 private onStorage=(event:StorageEvent)=>{if(event.key===VISUAL_STORAGE_KEY){this.preferences=this.read();this.apply();}};
 constructor(private root:HTMLElement|null){
  this.preferences=this.read();this.media=typeof window.matchMedia==='function'?window.matchMedia('(prefers-reduced-motion: reduce)'):null;
  this.media?.addEventListener?.('change',this.onMedia);window.addEventListener('storage',this.onStorage);
  if(root){if(!document.getElementById('stage-backdrop-style')){const style=document.createElement('style');style.id='stage-backdrop-style';style.textContent=css;document.head.append(style);}
   const make=(className:string)=>{const el=document.createElement('div');el.className=className;el.style.transform='none';el.setAttribute('aria-hidden','true');root.append(el);this.nodes.push(el);return el;};
   this.art=make('scene-art');this.far=make('scene-atmosphere scene-atmosphere--far');this.near=make('scene-atmosphere scene-atmosphere--near');
   for(const layer of[this.far,this.near]){const texture=document.createElement('div');texture.className='scene-atmosphere-texture';layer.append(texture);}
   make('scene-wash');
  }this.setStage('stage1',(import.meta.env.BASE_URL||'/')+'backgrounds/stage1.png');
 }
 private read():VisualPreferences {try{return normalize(JSON.parse(localStorage.getItem(VISUAL_STORAGE_KEY)??'{}')??{});}catch{return {...DEFAULT_VISUAL_PREFERENCES};}}
 getSettings():VisualPreferences{return {...this.preferences};}
 get motionEnabled():boolean{return this.preferences.motion==='on'||(this.preferences.motion==='system'&&!this.media?.matches);}
 subscribe(listener:()=>void):()=>void {this.listeners.add(listener);return()=>this.listeners.delete(listener);}
 setSettings(patch:Partial<VisualPreferences>):void {this.preferences=normalize({...this.preferences,...patch});try{localStorage.setItem(VISUAL_STORAGE_KEY,JSON.stringify(this.preferences));}catch{/* Per-session preferences still work. */}this.apply();}
 reset():void {this.setSettings({...DEFAULT_VISUAL_PREFERENCES});}
 setStage(stageId:string,imagePath:string):void {this.stageId=SCENE_PROFILES[stageId]?stageId:'stage1';this.imagePath=imagePath;const profile=SCENE_PROFILES[this.stageId]!;
  if(this.root){this.root.dataset.stage=this.stageId;this.root.dataset.theme=profile.theme;this.root.style.setProperty('--scene-haze',profile.haze);this.root.style.setProperty('--scene-far-duration',profile.farSeconds+'s');this.root.style.setProperty('--scene-near-duration',profile.nearSeconds+'s');}
  if(this.art)this.art.style.backgroundImage='url("'+imagePath+'")';this.apply();
 }
 private apply():void {
  if(this.root){this.root.style.setProperty('--scene-fade',String(this.preferences.fade/100));this.root.dataset.atmosphere=this.preferences.atmosphere?'on':'off';this.root.dataset.motionMode=this.preferences.motion;this.root.dataset.fade=String(this.preferences.fade);}
  if(this.art)this.art.style.filter='saturate('+this.preferences.saturation/100+') blur('+Math.min(1,this.preferences.fade/75)+'px)';
  this.update(this.active);for(const listener of this.listeners)listener();
 }
 setFocus(positions:Iterable<{x:number;y:number}>):void {const points=[...positions];if(!points.length)return;const xs=points.map(p=>p.x),ys=points.map(p=>p.y);const bound=(x:number)=>Math.max(-1,Math.min(1,x));this.focus={x:bound((xs.reduce((a,b)=>a+b,0)/xs.length-640)/640),y:bound((ys.reduce((a,b)=>a+b,0)/ys.length-360)/360),spread:Math.min(1,(Math.max(...xs)-Math.min(...xs))/1280)};}
 update(active:boolean):void {
  this.active=active;const moving=active&&this.motionEnabled;if(this.root&&this.root.dataset.motion!==(moving?'on':'off'))this.root.dataset.motion=moving?'on':'off';
  if(!moving){if(this.motionEnabled){this.moving=false;return;}if(!this.moving&&this.art?.style.transform==='none')return;if(this.art)this.art.style.transform='none';if(this.far)this.far.style.transform='none';if(this.near)this.near.style.transform='none';this.current={x:0,y:0,spread:0};this.moving=false;return;}
  this.moving=true;for(const key of['x','y','spread'] as const)this.current[key]+=(this.focus[key]-this.current[key])*.035;
  const{x,y,spread}=this.current;
  if(this.art)this.art.style.transform='translate3d('+(-x*5)+'px,'+(-y*3)+'px,0) scale('+(1.035+spread*.012)+')';
  if(this.far)this.far.style.transform='translate3d('+(-x*10)+'px,'+(-y*6)+'px,0) scale(1.02)';
  if(this.near)this.near.style.transform='translate3d('+(-x*19)+'px,'+(-y*11)+'px,0) scale(1.05)';
 }
 destroy():void {this.media?.removeEventListener?.('change',this.onMedia);window.removeEventListener('storage',this.onStorage);this.nodes.forEach(n=>n.remove());this.listeners.clear();}
}
