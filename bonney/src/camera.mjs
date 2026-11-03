import {cameraTarget} from './market-scene.mjs';
export function cameraGoal(g){
 const p=g.player,full=g.mode==='full',fall=full&&g.scene==='underwater'&&!p.grounded?Math.max(0,Math.min(64,(p.vy-40)*.5)):0;
 return {x:Math.max(0,Math.min(g.width-384,p.x-(p.facing<0?240:104))),y:full?Math.max(g.secretLaunchEligible?-500:-38,Math.min(g.height-216,p.y-cameraTarget(g)+fall)):0};
}
export function followCamera(g,previous,dt=1/60){
 const goal=cameraGoal(g),p=g.player,scene=g.scene||'harbor';
 const snap=!previous||previous.scene!==scene||Math.abs(previous.px-p.x)>192||Math.abs(previous.py-p.y)>192;
 const blend=rate=>1-Math.exp(-rate*Math.max(0,Math.min(.05,dt)));
 return {x:snap?goal.x:previous.x+(goal.x-previous.x)*blend(9),y:snap?goal.y:previous.y+(goal.y-previous.y)*blend(12),px:p.x,py:p.y,scene};
}

const views=new WeakMap();
export const recordCameraView=(g,view)=>views.set(g,view);
export const renderedCameraView=g=>views.get(g);

