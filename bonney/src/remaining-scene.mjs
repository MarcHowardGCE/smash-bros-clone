// Building bounds and roof profiles are shared by scenery and playable terrain.
// Profiles omit chimneys, flags and masts: only structural roofs bear weight.
export const BUILDINGS=[
 {key:'marketFish',x:18,bottom:400,w:98,h:106,roof:[[.04,.24],[.40,.04],[.96,.25]]},
 {key:'marketSupply',x:692,bottom:400,w:158,h:86,roof:[[.04,.25],[.14,.21],[.88,.21],[.96,.36]]},
 {key:'warehouseWide',x:1108,bottom:400,w:268,h:124,roof:[[.03,.36],[.14,.16],[.85,.16],[.97,.36]]},
 {key:'warehouseAnnex',x:1424,bottom:400,w:128,h:160,roof:[[.04,.34],[.50,.04],[.96,.34]]},
 {key:'warehouseWide',x:1800,bottom:400,w:268,h:124,roof:[[.03,.36],[.14,.16],[.85,.16],[.97,.36]]},
 {key:'craneShed',x:2240,bottom:400,w:155,h:156,collisionOnly:true,roof:[[.02,.29],[.96,.04]]},
 {key:'yardHullDeck',x:4824,bottom:400,w:240,h:88,collisionOnly:true,roof:[[.03,.36],[.90,.20],[.98,.06]]},
 {key:'districtCustoms',x:4144,bottom:400,w:224,h:140,roof:[[.04,.44],[.18,.25],[.82,.25],[.96,.44]]},
 {key:'districtCabin',x:5392,bottom:400,w:176,h:110,roof:[[.06,.36],[.16,.31],[.87,.31],[.98,.38]]},
 {key:'districtCabin',x:6032,bottom:400,w:192,h:120,roof:[[.06,.36],[.16,.31],[.87,.31],[.98,.38]]},
];
export function roofHeight(b,worldX){
 const u=(worldX-b.x)/b.w,points=b.roof;
 let i=1;while(i<points.length-1&&u>points[i][0])i++;
 const [x0,y0]=points[i-1],[x1,y1]=points[i];
 const t=Math.max(0,Math.min(1,(u-x0)/(x1-x0)));
 return b.bottom-b.h+b.h*(y0+(y1-y0)*t);
}
export function buildingRoofs(){
 return BUILDINGS.flatMap(b=>{
  const start=Math.ceil(b.x+b.roof[0][0]*b.w),end=Math.floor(b.x+b.roof.at(-1)[0]*b.w),out=[];
  for(let x=start;x<end;x+=16)out.push({x,y:roofHeight(b,x+8),w:Math.min(16,end-x),h:8,oneWay:true,kind:'roof',building:b.key+'-'+b.x});
  return out;
 });
}
export const STRUCTURES=[
 ['districtGantry',2240,400,360,200],
 ['districtHull',4824,400,240,88],
];
export const PROPS=[
 ['rope',2270,391,17,9],['lantern',3064,370,10,30],
 ['barrel',3356,382,14,18],['rope',3584,391,17,9],['lantern',4268,370,10,30],
 ['barrel',4376,382,14,18],['rope',4728,391,17,9],
 ['lantern',4832,370,10,30],['barrel',5080,382,14,18],
 ['rope',5416,391,17,9],['lantern',5704,370,10,30],
 ['barrel',6212,382,14,18],['rope',6232,391,17,9],
];
export function remainingBackdrop(c,images,camera){
 for(const [key,x,baseline,w,h]of [...STRUCTURES,...BUILDINGS.filter(b=>b.key.startsWith('district')).map(b=>[b.key,b.x,b.bottom,b.w,b.h])]){
  if(x+w<camera||x>camera+384)continue;
  const im=images[key];if(im)c.drawImage(im,Math.round(x-camera),baseline-h,w,h);
 }
}
export function remainingProps(c,images,camera){
 for(const [key,x,y,w,h]of PROPS){
  if(x+w<camera||x>camera+384)continue;
  c.drawImage(images['prop_'+key],Math.round(x-camera),y,w,h);
 }
}


// Every elevated deck has load-bearing feet on an actual ground span.
export function platformFootings(g,s){
 const floors=g.platforms.filter(f=>f.h>8);
 const candidates=[s.x+6,s.x+s.w-10].filter(x=>floors.some(f=>x>=f.x&&x+4<=f.x+f.w));
 if(candidates.length)return [...new Set(candidates)];
 const f=floors.flatMap(f=>[f.x+6,f.x+f.w-10]).sort((a,b)=>Math.abs(a-(s.x+s.w/2))-Math.abs(b-(s.x+s.w/2)))[0];
 return [f];
}
