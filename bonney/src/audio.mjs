const clamp=v=>Math.max(0,Math.min(1,Number.isFinite(Number(v))?Number(v):0));
export class GameAudio{
 constructor({src=null,title='',storage,AudioClass=globalThis.Audio,ContextClass=globalThis.AudioContext||globalThis.webkitAudioContext}={}){
  this.storage=storage;this.AudioClass=AudioClass;this.ContextClass=ContextClass;this.settings={master:.65,music:.65,effects:.8,muted:false};
  try{this.storage??=globalThis.localStorage;const saved=JSON.parse(this.storage?.getItem('bonney.audio.v1')||'null');if(saved){for(const k of ['master','music','effects'])if(Number.isFinite(saved[k]))this.settings[k]=clamp(saved[k]);if(typeof saved.muted==='boolean')this.settings.muted=saved.muted;}}catch{}
  this.wanted=false;this.blocked=false;this.failed=false;this.playPending=false;this.title=title;this.setTrack(src,title);
 }
 setTrack(src,title=''){
  this.music?.pause();this.music=null;this.src=src;this.title=title;this.blocked=false;this.failed=false;this.playPending=false;
  if(src&&this.AudioClass){this.music=new this.AudioClass(src);this.music.loop=true;this.music.preload='metadata';this.music.addEventListener('error',()=>{this.failed=true;});}
  this.apply();this.sync();
 }
 setLevel(channel,value){if(!['master','music','effects'].includes(channel))return;this.settings[channel]=clamp(value);this.apply();this.save();}
 setMuted(value){this.settings.muted=!!value;this.apply();this.save();}
 save(){try{this.storage?.setItem('bonney.audio.v1',JSON.stringify(this.settings));}catch{}}
 apply(){const s=this.settings;if(this.music){this.music.volume=s.master*s.music;this.music.muted=s.muted;}if(this.bus)this.bus.gain.value=s.muted?0:s.master*s.effects;}
 setPlaying(value){this.wanted=!!value;this.sync();}
 sync(){
  const track=this.music;if(!track)return;
  if(!this.wanted){track.pause();return;}
  if(this.failed||this.blocked||this.playPending||!track.paused)return;
  this.playPending=true;
  try{Promise.resolve(track.play()).then(()=>{if(this.music===track&&!this.wanted)track.pause();}).catch(()=>{if(this.music===track){this.blocked=true;track.pause();}}).finally(()=>{if(this.music===track)this.playPending=false;});}catch{this.playPending=false;this.blocked=true;}
 }
 unlock(){this.blocked=false;try{const pending=this.context?.resume();pending?.catch?.(()=>{});}catch{}this.sync();}
 restart(){try{if(this.music)this.music.currentTime=0;}catch{}}
 effect(frequency){
  if(this.settings.muted||this.settings.master===0||this.settings.effects===0||!this.ContextClass)return;
  try{if(!this.context){this.context=new this.ContextClass();this.bus=this.context.createGain();this.bus.connect(this.context.destination);this.apply();}
   const resumed=this.context.resume();resumed?.catch?.(()=>{});const o=this.context.createOscillator(),g=this.context.createGain(),t=this.context.currentTime;o.type='square';o.frequency.setValueAtTime(frequency,t);g.gain.setValueAtTime(.025,t);g.gain.exponentialRampToValueAtTime(.001,t+.12);o.connect(g);g.connect(this.bus);o.start();o.stop(t+.12);o.onended=()=>{o.disconnect();g.disconnect();};
  }catch{}
 }
 get status(){return !this.src?'Music: waiting for the song file':this.failed?'Music could not be loaded':this.blocked?'Click Enable audio to start music':this.wanted?'Music: '+(this.title||'level theme'):'Music paused';}
}
