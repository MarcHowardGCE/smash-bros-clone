import{INPUT_BITS as B,PHYSICS,inputVector,type InputEvent,type PlayerState}from'@smash/shared';
/** Digital input adaptation. Distances/cooldown remain explicit world-unit tuning. */
export function directionZone(held:number):number{const x=Number(!!(held&B.RIGHT))-Number(!!(held&B.LEFT)),y=Number(!!(held&B.DOWN))-Number(!!(held&B.UP));return(x<0?B.LEFT:x>0?B.RIGHT:0)|(y<0?B.UP:y>0?B.DOWN:0);}
export function inputDirectionZone(input:InputEvent|null):number{if(input?.stickX===undefined)return directionZone(input?.held??0);const v=inputVector(input);return(v.x>=.5?B.RIGHT:v.x<=-.5?B.LEFT:0)|(v.y>=.5?B.DOWN:v.y<=-.5?B.UP:0);}
function vector(zone:number,grounded=false):{x:number;y:number}{const x=Number(!!(zone&B.RIGHT))-Number(!!(zone&B.LEFT)),y=grounded?0:Number(!!(zone&B.DOWN))-Number(!!(zone&B.UP)),length=Math.hypot(x,y)||1;return{x:x/length,y:y/length};}
export function advanceHitstop(p:PlayerState,held:number,input?:InputEvent|null):PlayerState{
 const analog=input?.stickX!==undefined?inputVector(input):undefined;
 const remaining=Math.max(0,p.hitlagFramesRemaining-1),eligible=p.sdiEligible??(p.state==='HITSTUN'),shield=p.sdiMode==='shield',zone=(analog?directionZone((analog.x>=.5?B.RIGHT:analog.x<=-.5?B.LEFT:0)|(analog.y>=.5?B.DOWN:analog.y<=-.5?B.UP:0)):directionZone(held))&(shield?(B.LEFT|B.RIGHT):0xffff),cooldown=Math.max(0,(p.sdiInputCooldown??0)-1);
 let bx=p.sdiBufferedX,by=p.sdiBufferedY;let buffered=p.sdiBufferedDirection??0,dx=0,dy=0,nextCooldown=cooldown;
 if(eligible&&zone!==0&&(zone&~(p.sdiLastDirection??0))!==0){buffered=zone;const v=analog??vector(zone,p.sdiGrounded??false);bx=v.x;by=(shield||p.sdiGrounded)?0:v.y;}
 if(eligible&&remaining>0&&buffered&&(shield||cooldown===0)&&(shield||(p.sdiPulseCount??0)<16)){const v=bx!==undefined&&by!==undefined?{x:bx,y:by}:vector(buffered,p.sdiGrounded??false),distance=PHYSICS.SDI_DISTANCE_WORLD*(shield?.66:1)*(p.sdiMultiplier??1);dx=v.x*distance;dy=v.y*distance;buffered=0;nextCooldown=shield?0:PHYSICS.SDI_COOLDOWN_TICKS;}
 let asdi=0;if(!shield&&eligible&&remaining===0&&(p.asdiMultiplier??0)>0){const v=analog?{x:analog.x,y:p.sdiGrounded?0:analog.y}:vector(zone,p.sdiGrounded??false);asdi=PHYSICS.ASDI_EXIT_DISTANCE_WORLD*p.asdiMultiplier!;dx+=v.x*asdi;dy+=v.y*asdi;}
 return{...p,hitlagFramesRemaining:remaining,sdiBufferedX:remaining?bx:undefined,sdiBufferedY:remaining?by:undefined,sdiPulseCount:(p.sdiPulseCount??0)+(dx!==0||dy!==0?1:0),sdiInputCooldown:remaining?nextCooldown:0,sdiLastDirection:remaining?zone:0,sdiBufferedDirection:remaining?buffered:0,sdiEligible:remaining?eligible:false,asdiDriftAccumulated:asdi,x:p.x+dx,y:p.y+dy,vx:0,vy:0};
}
