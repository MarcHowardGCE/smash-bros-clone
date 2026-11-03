// Xbox/Xbox 360 through the browser's standard Gamepad mapping.
const GAME_BUTTONS=[0,1,2,3,5];
const empty=()=>({left:false,right:false,up:false,down:false,jumpHeld:false,runHeld:false,punchHeld:false});
const EDGE={0:'jumpPressed',1:'kickPressed',2:'punchPressed',3:'interactPressed',5:'abilityPressed'};
const down=(p,n)=>!!p.buttons?.[n]?.pressed||(p.buttons?.[n]?.value||0)>.5;
export function decodeGamepad(p,suppressed=new Set()){
 const b=n=>!suppressed.has(n)&&down(p,n),x=Number.isFinite(p.axes?.[0])?p.axes[0]:0,y=Number.isFinite(p.axes?.[1])?p.axes[1]:0;
 const dpad=down(p,14)||down(p,15),vertical=down(p,12)||down(p,13);
 return {left:dpad?down(p,14)&&!down(p,15):x<-.25,right:dpad?down(p,15)&&!down(p,14):x>.25,up:vertical?down(p,12)&&!down(p,13):y<-.25,down:vertical?down(p,13)&&!down(p,12):y>.25,jumpHeld:b(0),punchHeld:b(2),runHeld:b(7)||b(4)};
}
export class ControllerInput{
 constructor(){this.key=null;this.index=null;this.previous=new Set();this.pending=new Set();this.suppressed=new Set();this.held=empty();this.armed=false;this.id='';}
 clearActions(){this.pending.clear();for(const n of GAME_BUTTONS)if(this.previous.has(n))this.suppressed.add(n);this.held.jumpHeld=false;this.held.punchHeld=false;}
 poll(pads=[]){
  const all=Array.from(pads||[]).filter(p=>p&&p.connected!==false),supported=all.filter(p=>p.mapping==='standard'&&p.buttons?.length>=16&&p.axes?.length>=2);
  let p=supported.find(p=>p.index===this.index&&p.id===this.id)||supported[0];
  const key=p?String(p.index)+':'+p.id:null,lost=this.key!==null&&key!==this.key,changed=key!==this.key;
  const menu={};
  if(changed){this.previous.clear();this.pending.clear();this.suppressed.clear();this.armed=false;this.key=key;this.index=p?.index??null;this.id=p?.id||'';}
  if(!p){this.held=empty();return {connected:false,disconnected:lost,unsupported:all.length>0,menu,active:false};}
  const pressed=new Set(Array.from({length:p.buttons.length},(_,i)=>i).filter(i=>down(p,i)));
  if(!this.armed){this.armed=pressed.size===0&&Math.abs(p.axes[0]||0)<.25&&Math.abs(p.axes[1]||0)<.25;this.previous=pressed;this.held=empty();return {connected:true,disconnected:lost,armed:this.armed,id:this.id,menu,active:false};}
  for(const n of this.suppressed)if(!pressed.has(n))this.suppressed.delete(n);
  const rising=n=>pressed.has(n)&&!this.previous.has(n);
  for(const [n,name]of Object.entries(EDGE))if(rising(+n)&&!this.suppressed.has(+n))this.pending.add(name);
  Object.assign(menu,{confirmPressed:rising(0),pausePressed:rising(9),previousCharacter:rising(4),nextCharacter:rising(5),leftPressed:rising(14),rightPressed:rising(15)});
  this.previous=pressed;this.held=decodeGamepad(p,this.suppressed);
  return {connected:true,disconnected:lost,armed:true,id:this.id,menu,active:Object.values(this.held).some(Boolean)||Object.values(menu).some(Boolean)||this.pending.size>0};
 }
 consume(keyboard={}){const result={...keyboard};for(const [k,v]of Object.entries(this.held))result[k]=!!keyboard[k]||v;for(const name of Object.values(EDGE))result[name]=!!keyboard[name]||this.pending.has(name);this.pending.clear();return result;}
}
export function controlHint(value,source){return source==='controller'?String(value).replace(/\b(X|Z|C|E|SPACE|SHIFT)\b/gi,k=>({X:'RB',Z:'X',C:'B',E:'Y',SPACE:'A',SHIFT:'RT'}[k.toUpperCase()])):value;}
