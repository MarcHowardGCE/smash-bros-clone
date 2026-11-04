import {loadStickCalibration,saveStickCalibration,resetStickCalibration,calibrateNeutral,sampleGamepadBits,GenericInputBits as B} from '@smash/gamepad-input';
/** Uses the same profile and sampler as gameplay. No hidden changes to network input semantics. */
export function renderControllerCalibration(host:HTMLElement,id:string,index:number):()=>void{
 host.innerHTML='<details><summary>Controller stick settings</summary><p>Release the left stick to set its center. Adjust drift filtering and direction sensitivity, then test all eight directions. Controllers with the same device name share these settings in this browser. X / Y jump. B attack. A special. LT / RT shield. LB / RB grab. Right stick: smash attacks on the ground, directional attacks in the air.</p><label>Drift filtering <input aria-label="Stick drift filtering" type="range" min=".05" max=".4" step=".01"></label> <label>Direction threshold <input aria-label="Stick direction threshold" type="range" min=".2" max=".8" step=".01"></label><p><button type="button" class="ui-btn" data-center>Set neutral center</button> <button type="button" class="ui-btn" data-reset>Reset stick settings</button></p><output aria-live="polite" data-message></output><pre style="white-space:pre-wrap" data-reading></pre></details>';
 const drift=host.querySelectorAll('input')[0]!,threshold=host.querySelectorAll('input')[1]!,message=host.querySelector('[data-message]')!,reading=host.querySelector('[data-reading]')!;
 let profile=loadStickCalibration(id),samples:Array<readonly[number,number]>|null=null,frame=0,stopped=false;
 const sync=()=>{drift.value=String(profile.deadzone);threshold.value=String(profile.threshold);};sync();
 const change=()=>{profile=saveStickCalibration(id,{...profile,deadzone:Number(drift.value),threshold:Number(threshold.value)});message.textContent='Stick settings saved.';};
 drift.addEventListener('input',change);threshold.addEventListener('input',change);
 host.querySelector('[data-center]')!.addEventListener('click',()=>{samples=[];message.textContent='Release the stick and keep it still…';});
 host.querySelector('[data-reset]')!.addEventListener('click',()=>{samples=null;resetStickCalibration(id);profile=loadStickCalibration(id);sync();message.textContent='Default stick settings restored.';});
 const tick=()=>{if(stopped)return;const pad=navigator.getGamepads?.()[index];if(!pad||pad.id!==id){reading.textContent='Controller disconnected. Reconnect to test.';samples=null;}else{
 const x=pad.axes[0]??0,y=pad.axes[1]??0,bits=sampleGamepadBits(pad,profile.deadzone,profile.threshold,profile.centerX,profile.centerY);
 const directions=[[B.LEFT,'LEFT'],[B.RIGHT,'RIGHT'],[B.UP,'UP'],[B.DOWN,'DOWN']] as const;
 reading.textContent='Left stick: '+x.toFixed(3)+', '+y.toFixed(3)+' | '+(directions.filter(([bit])=>bits&bit).map(([,name])=>name).join(' + ')||'NEUTRAL')+' | filtering '+profile.deadzone.toFixed(2)+' / threshold '+profile.threshold.toFixed(2);
 if(samples){samples.push([x,y]);if(samples.length>=60){const calibrated=calibrateNeutral(samples,profile);samples=null;if(calibrated){profile=saveStickCalibration(id,calibrated);sync();message.textContent='Neutral center saved. Test the full stick circle.';}else message.textContent='Stick moved or was held too far from center. Release it and try again.';}}
 }frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);
 return()=>{stopped=true;cancelAnimationFrame(frame);host.replaceChildren();};
}
