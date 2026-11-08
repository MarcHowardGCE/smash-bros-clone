/** Per-browser controller profiles. Calibrated stick values can be transmitted; device settings do not certify analog parity. */
export interface StickCalibration {centerX:number;centerY:number;deadzone:number;threshold:number;stickJump:boolean;smashSensitivity:-1|0|1;rightStick:"smash"|"tilt";abSmash:boolean}
export const DEFAULT_STICK_CALIBRATION:Readonly<StickCalibration>={centerX:0,centerY:0,deadzone:.2,threshold:.45,stickJump:true,smashSensitivity:0,rightStick:"smash",abSmash:true};
const finite=(v:unknown,fallback:number,min:number,max:number)=>typeof v==='number'&&Number.isFinite(v)?Math.max(min,Math.min(max,v)):fallback;
export function normalizeCalibration(value:Partial<StickCalibration>={}):StickCalibration{return{centerX:finite(value.centerX,0,-.25,.25),centerY:finite(value.centerY,0,-.25,.25),deadzone:finite(value.deadzone,.2,.05,.4),threshold:finite(value.threshold,.45,.2,.8),stickJump:value.stickJump!==false,smashSensitivity:value.smashSensitivity===-1||value.smashSensitivity===1?value.smashSensitivity:0,rightStick:value.rightStick==="tilt"?"tilt":"smash",abSmash:value.abSmash!==false};}
const cache=new Map<string,StickCalibration>();
const key=(id:string)=>'smash:stick:v1:'+id;
export function loadStickCalibration(id:string):StickCalibration{
 if(cache.has(id))return{...cache.get(id)!};
 let profile=normalizeCalibration();try{const raw=globalThis.localStorage?.getItem(key(id));if(raw){const parsed=JSON.parse(raw);if(parsed&&typeof parsed==='object')profile=normalizeCalibration(parsed);}}catch{/* Storage unavailable or invalid: use defaults. */}
 cache.set(id,profile);return{...profile};
}
export function saveStickCalibration(id:string,value:Partial<StickCalibration>):StickCalibration{const p=normalizeCalibration(value);cache.set(id,p);try{globalThis.localStorage?.setItem(key(id),JSON.stringify(p));}catch{/* Session settings remain usable without storage. */}return{...p};}
export function resetStickCalibration(id:string):void{cache.delete(id);try{globalThis.localStorage?.removeItem(key(id));}catch{}}
/** Reject a held/moving stick rather than capturing it as neutral. */
export function calibrateNeutral(samples:ReadonlyArray<readonly[number,number]>,current:StickCalibration):StickCalibration|null{
 if(samples.length<30||samples.some(([x,y])=>!Number.isFinite(x)||!Number.isFinite(y)||Math.hypot(x,y)>.25))return null;
 const x=samples.reduce((n,v)=>n+v[0],0)/samples.length,y=samples.reduce((n,v)=>n+v[1],0)/samples.length;
 const noise=Math.max(...samples.map(v=>Math.hypot(v[0]-x,v[1]-y)));
 if(noise>.08)return null;
 return normalizeCalibration({...current,centerX:x,centerY:y,deadzone:Math.max(.12,noise+.05)});
}
