import{INPUT_BITS as B,type InputEvent}from'../types/InputEvent.js';
export function inputVector(input:InputEvent|null):{x:number;y:number}{
 if(Number.isFinite(input?.stickX)&&Number.isFinite(input?.stickY)){const x=Math.max(-1,Math.min(1,input!.stickX!)),y=Math.max(-1,Math.min(1,input!.stickY!)),m=Math.max(1,Math.hypot(x,y));return{x:x/m,y:y/m};}
 const held=input?.held??0,x=Number(!!(held&B.RIGHT))-Number(!!(held&B.LEFT)),y=Number(!!(held&B.DOWN))-Number(!!(held&B.UP)),m=Math.max(1,Math.hypot(x,y));return{x:x/m,y:y/m};
}
export function validStickInput(input:Partial<InputEvent>):boolean{return(input.jumpButtons===undefined||(Number.isInteger(input.jumpButtons)&&input.jumpButtons!>=0&&input.jumpButtons!<=3))&&(input.smashAttack===undefined||typeof input.smashAttack==='boolean')&&(['stickX','stickY','cStickX','cStickY']as const).every(k=>input[k]===undefined||(typeof input[k]==='number'&&Number.isFinite(input[k])&&Math.abs(input[k]!)<=1))&&(input.stickX===undefined)===(input.stickY===undefined)&&(input.cStickX===undefined)===(input.cStickY===undefined);}
