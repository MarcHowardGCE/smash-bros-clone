import {BUILDINGS} from './remaining-scene.mjs';
export const inMarket=(g)=>g.mode==='full'&&g.player.x<960;
export const inPolishedDistrict=g=>g.mode==='full';
const clamp=v=>Math.max(0,Math.min(1,v));
export function cameraTarget(g){
 if(g.mode!=='full')return 116;
 return 116+32*clamp((g.player.y-220)/100);
}
export function marketBackdrop(c,images,camera){
 // Authored buildings create a local midground; no district-sized overlay.
 for(const [key,x,baseline,w,h]of BUILDINGS.filter(b=>!b.collisionOnly&&!b.key.startsWith('district')).map(b=>[b.key,b.x,b.bottom,b.w,b.h])){
  const im=images[key];if(im)c.drawImage(im,Math.round(x-camera),baseline-h,w,h);
 }
}
export function marketProps(c,images,camera){
 const props=[['lantern',8,370,10,30],['barrel',132,382,14,18],['rope',149,391,17,9],['barrel',680,382,14,18],['barrel',1108,382,14,18],['rope',1140,391,17,9],['lantern',1752,370,10,30],['barrel',2070,382,14,18]];
 for(const [key,x,y,w,h]of props)c.drawImage(images['prop_'+key],Math.round(x-camera),y,w,h);
}
