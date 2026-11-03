// Combat silhouette only; shared movement and foot placement remain unchanged.
export function playerHurtbox(p){
 const cannon=p.ability==='active'&&p.power==='pirateCaptain';
 const inset=cannon||p.hits>=3?0:p.hits===2?3:10;
 return {x:p.x,y:p.y+inset,w:p.w,h:p.h-inset};
}
