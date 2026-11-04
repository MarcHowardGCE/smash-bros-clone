import type{PilotFrame}from'./pilotTimeline.js';
/** Result-only presentation time; combat and movement continue to use simulation ticks. */
export function selectResultFrame(result:'win'|'lose',variant:number,ticks:number):PilotFrame{const t=Math.max(0,Math.floor(ticks));if(result==='lose')return{clip:'defeat',index:Math.floor(t/8)%4};let elapsed=t;const durations=[8,8,12,24,10,30];let index=0;while(index<5&&elapsed>=durations[index]!){elapsed-=durations[index++]!;}return{clip:variant%3===1?'victory_2':variant%3===2?'victory_3':'victory_1',index};}
