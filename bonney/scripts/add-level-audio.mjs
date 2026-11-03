import fs from 'node:fs';
const edit=(p,a,b)=>{let s=fs.readFileSync(p,'utf8').replaceAll('\r\n','\n');if(!s.includes(a))throw Error('Missing '+p+' '+a);fs.writeFileSync(p,s.replaceAll(a,b));};
edit('src/game.mjs',"import {ControllerInput", "import {GameAudio} from './audio.mjs';\nimport {LEVEL_MUSIC} from './audio-config.mjs';\nimport {ControllerInput");
edit('src/game.mjs',"loaded=false,muted=true,audio;", "loaded=false;\nconst mixer=new GameAudio(LEVEL_MUSIC);");
let p='src/game.mjs',s=fs.readFileSync(p,'utf8');const a=s.indexOf('function sound(event){'),b=s.indexOf('function restart()',a);s=s.slice(0,a)+"function sound(event){mixer.effect(sounds[event]||300);}\n"+s.slice(b);s=s.replace('function restart(){controller.clearActions();','function restart(){mixer.unlock();mixer.restart();controller.clearActions();');s=s.replace("function syncOverlay(){","function syncOverlay(){\n mixer.setPlaying(started&&!paused&&game.status==='playing'&&!document.hidden);");s=s.replace("playButton.addEventListener('click',()=>{","playButton.addEventListener('click',()=>{\n mixer.unlock();");
const start=s.indexOf("document.querySelector('#sound').addEventListener"),end=s.indexOf("canvas.addEventListener('keydown'",start);s=s.slice(0,start)+`document.querySelector('#sound').addEventListener('click',()=>{
 if(mixer.blocked)mixer.unlock();else {mixer.setMuted(!mixer.settings.muted);mixer.unlock();}
 syncAudioControls();
});
for(const channel of ['master','music','effects']){
 const slider=document.querySelector('#volume-'+channel);slider.value=Math.round(mixer.settings[channel]*100);
 slider.addEventListener('input',()=>{mixer.setLevel(channel,Number(slider.value)/100);mixer.unlock();syncAudioControls();});
}
function syncAudioControls(){
 const button=document.querySelector('#sound');button.textContent=mixer.blocked?'Enable audio':mixer.settings.muted?'Unmute':'Mute';button.setAttribute('aria-pressed',String(mixer.settings.muted));
 for(const channel of ['master','music','effects']){const value=Math.round(mixer.settings[channel]*100);document.querySelector('#volume-'+channel+'-value').textContent=value+'%';}
 const status=document.querySelector('#music-status');if(status.textContent!==mixer.status)status.textContent=mixer.status;
}
syncAudioControls();
`+s.slice(end);
s=s.replace(" inputSource='keyboard';"," inputSource='keyboard';mixer.unlock();");s=s.replace(" render(dt);requestAnimationFrame(loop);"," mixer.setPlaying(started&&!paused&&game.status==='playing'&&!document.hidden);syncAudioControls();\n render(dt);requestAnimationFrame(loop);");s=s.replace('get controller(){return','get audio(){return mixer;},get controller(){return');fs.writeFileSync(p,s);
edit('index.html','<button id="sound" aria-pressed="false">Sound off</button>','<button id="sound" aria-pressed="false" aria-label="Mute all audio">Mute</button>');
edit('index.html',' <p id="controller-status"',` <section class="audio-controls" aria-label="Audio controls"><label for="volume-master">Volume <output id="volume-master-value" for="volume-master">65%</output></label><input id="volume-master" type="range" min="0" max="100" step="1" value="65" aria-label="Master volume"><details><summary>Music and effects</summary><label for="volume-music">Music <output id="volume-music-value" for="volume-music">65%</output></label><input id="volume-music" type="range" min="0" max="100" value="65" aria-label="Music volume"><label for="volume-effects">Effects <output id="volume-effects-value" for="volume-effects">80%</output></label><input id="volume-effects" type="range" min="0" max="100" value="80" aria-label="Effects volume"></details><span id="music-status" role="status">Music: waiting for the song file</span></section>
 <p id="controller-status"`);
edit('server.mjs',"'.json':'application/json'", "'.json':'application/json','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg','.m4a':'audio/mp4','.aac':'audio/aac','.flac':'audio/flac'");
edit('server.mjs',"(puzzle-effects|", "(audio|audio-config|puzzle-effects|");
let pkg=JSON.parse(fs.readFileSync('package.json'));pkg.scripts.test+=' src/audio.test.mjs';pkg.scripts.check+=' && node --check src/audio.mjs && node --check src/audio-config.mjs';fs.writeFileSync('package.json',JSON.stringify(pkg,null,2)+'\n');
