import fs from 'node:fs';
const edit=(p,a,b)=>{let s=fs.readFileSync(p,'utf8').replaceAll('\r\n','\n');if(!s.includes(a))throw Error('Missing '+p+' '+a);fs.writeFileSync(p,s.replaceAll(a,b));};
edit('src/game.mjs',"import {followCamera", "import {ControllerInput,controlHint} from './controller.mjs';\nimport {followCamera");
edit('src/game.mjs',"const held=new Set(),edges=new Set(),images={};", "const held=new Set(),edges=new Set(),images={};\nconst controller=new ControllerInput();let inputSource='keyboard',controllerStatus='';\nconst jumpIsHeld=()=>held.has('Space')||controller.held.jumpHeld;");
edit('src/game.mjs',"function restart(){cameraState", "function restart(){controller.clearActions();cameraState");
edit('src/game.mjs',"playButton.addEventListener('click',()=>{", "playButton.addEventListener('click',()=>{\n controller.clearActions();");
edit('src/game.mjs',"paused=!paused;held.clear();", "paused=!paused;controller.clearActions();held.clear();");
edit('src/game.mjs',"canvas.addEventListener('keydown',e=>{", "canvas.addEventListener('keydown',e=>{\n inputSource='keyboard';");
edit('src/game.mjs'," edges.clear();return i;", " edges.clear();return controller.consume(i);");
edit('src/game.mjs',"function rect(x,y,w,h,c){", `function pollController(){
 let pads=[];let unavailable=false;try{pads=navigator.getGamepads?.()||[];}catch{unavailable=true;}
 const state=controller.poll(pads),focused=document.hasFocus()&&!document.hidden;
 const message=unavailable?'Controller access unavailable. Keyboard controls remain available.':state.connected?(state.armed?'Controller connected: '+state.id:'Controller connected. Release buttons and center the stick.'):(state.unsupported?'Controller detected without a standard mapping. Try a current browser.':'Xbox / Xbox 360: connect your controller, then press and release a button.');
 if(message!==controllerStatus){controllerStatus=message;document.querySelector('#controller-status').textContent=message;}
 if(state.disconnected&&started&&!paused&&game.status==='playing'){togglePause();overlayText.textContent='Controller disconnected. Reconnect or use the keyboard to resume.';}
 if(!focused){controller.clearActions();return;}
 if(state.active)inputSource='controller';
 const m=state.menu,menuOpen=!started||paused||game.status!=='playing';
 if(menuOpen){
  if((m.confirmPressed||m.pausePressed)&&loaded){playButton.click();return;}
  if(m.previousCharacter||m.nextCharacter){characterSelect.value=selectedCharacter==='bonney'?'luffy':'bonney';characterSelect.dispatchEvent(new Event('change'));}
  if(!started&&(m.leftPressed||m.rightPressed)){selectedMode=selectedMode==='full'?'tutorial':'full';modeSelect.value=selectedMode;game=createGame(selectedMode);cameraState=undefined;syncOverlay();}
  controller.clearActions();
 }else if(m.pausePressed)togglePause();
}
function rect(x,y,w,h,c){`);
// Render prompts follow the most recent input device; gameplay stays shared.
edit('src/game.mjs',"function text(","function text(");
edit('src/game.mjs',"const objectiveText=", "const objectiveText=");
// Convert the final objective string without changing the authored notice or mission.
edit('src/game.mjs',"objective.textContent!==objectiveText", "objective.textContent!==controlHint(objectiveText,inputSource)");
edit('src/game.mjs',"objective.textContent=objectiveText;", "objective.textContent=controlHint(objectiveText,inputSource);");
edit('src/game.mjs',"game.time,held.has('Space')", "game.time,jumpIsHeld()");
edit('src/game.mjs',"function loop(now){", "function loop(now){\n pollController();");
edit('src/game.mjs',"get camera(){", "get controller(){return {connected:controller.key!==null,armed:controller.armed,source:inputSource};},get camera(){");
edit('index.html'," <p id=\"objective\"", " <p id=\"controller-status\" class=\"controller-status\" role=\"status\" aria-live=\"polite\">Xbox / Xbox 360: connect your controller, then press and release a button.</p>\n <p id=\"objective\"");
edit('index.html'," <article><h2>Explore</h2>", " <article><h2>Xbox controller</h2><p>Left stick / D-pad: move · <kbd>A</kbd> Jump (hold for height / flight) · <kbd>X</kbd> Punch (hold for Gear charge) · <kbd>B</kbd> Kick · <kbd>Y</kbd> Interact · <kbd>RB</kbd> Special · <kbd>RT</kbd> or <kbd>LB</kbd> Run</p><p><kbd>Menu / Start</kbd> Pause · <kbd>A</kbd> Start, resume or retry. In menus: <kbd>LB / RB</kbd> Choose character. On the title screen: D-pad left/right chooses the course.</p></article>\n  <article><h2>Explore</h2>");
edit('index.html',"Keyboard / desktop browser", "Keyboard or Xbox controller / desktop browser");
edit('server.mjs',"(player-body|", "(controller|player-body|");
let pkg=JSON.parse(fs.readFileSync('package.json'));pkg.scripts.test+=' src/controller.test.mjs';pkg.scripts.check+=' && node --check src/controller.mjs';fs.writeFileSync('package.json',JSON.stringify(pkg,null,2)+'\n');
