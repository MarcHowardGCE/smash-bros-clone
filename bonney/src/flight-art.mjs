import {FLIGHT_ANCHORS} from './flight-anchors.mjs';
export function flightJetLayout(character,p,time,jumpHeld,x=0,y=0){
 if(p.power!=='egghead'||p.ability!=='active'||p.grounded||p.activeMs<=0||!jumpHeld)return [];
 const hero=character==='luffy'?'luffy':'bonney',row=p.hits>=3?0:p.hits===2?1:2;
 const col=p.attackMs>0?(p.attackKind==='kick'?1:0):Math.floor(time*8)%4;
 const anchors=FLIGHT_ANCHORS[hero][p.attackMs>0?'attack':'flight'][row][col];
 const scale=[1,5/6,.6][row];
 return anchors.map((a,i)=>{
  const local=-8+a.x/2;
  return {x:x+(p.facing<0?32-local:local),y:y+a.y/2,width:5*scale,height:16*scale*(.96+.07*Math.sin(time*37+i*2)),
   frame:(Math.floor(time*15)+i*2)%6,row:hero==='luffy'?1:0,angle:Math.max(-.18,Math.min(.18,(p.vx||0)*.0015)),index:i};
 });
}
export function drawFlightJets(c,images,p,character,x,y,time,jumpHeld){
 const jets=flightJetLayout(character,p,time,jumpHeld,x,y);
 for(const jet of jets){
  c.save();c.translate(jet.x,jet.y);c.rotate(jet.angle);
  c.drawImage(images.flightThrusters,jet.frame*32,jet.row*64,32,64,-jet.width/2,0,jet.width,jet.height);
  c.fillStyle='#ecfeff';c.fillRect(-1.5,-.5,3,1);
  for(let i=0;i<3;i++){
   const life=(time*2.8+i/3+jet.index*.17)%1;
   c.globalAlpha=(1-life)*.6;c.fillStyle=jet.row===0?(i%2?'#d7b6ff':'#bdfaff'):(i%2?'#ffdb89':'#d0fcff');
   c.fillRect(Math.round(Math.sin(time*11+i*3)*life*2),Math.round(jet.height*.65+life*9),1,life<.5?2:1);
  }
  c.restore();
 }
}
