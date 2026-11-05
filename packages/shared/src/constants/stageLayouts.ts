import {STAGE} from './stage.js';
/** Shared collision data. Decorative sprite depth does not add collision surfaces. */
export interface StageLayout {id:string;width:number;height:number;blastTop:number;blastBottom:number;blastLeft:number;blastRight:number;mainPlatform:{id:string;x:number;y:number;width:number;height:number;solid:boolean};platforms:{id:string;x:number;y:number;width:number;height:number;solid:boolean}[];ledges:{id:string;x:number;y:number}[];walls:{id:string;x:number;yTop:number;yBottom:number}[];spawnPositions:{x:number;y:number}[];}
const base:StageLayout={id:'stage1',width:STAGE.WIDTH,height:STAGE.HEIGHT,blastTop:STAGE.BLAST_TOP,blastBottom:STAGE.BLAST_BOTTOM,blastLeft:STAGE.BLAST_LEFT,blastRight:STAGE.BLAST_RIGHT,mainPlatform:{id:'main',...STAGE.MAIN_PLATFORM},platforms:STAGE.PLATFORMS.map(p=>({...p})),ledges:STAGE.LEDGES.map(p=>({...p})),walls:STAGE.WALLS.map(p=>({...p})),spawnPositions:STAGE.SPAWN_POSITIONS.map(p=>({...p}))};
function arena(id:string,x:number,y:number,width:number,platforms:number[][]):StageLayout{return {...base,id,mainPlatform:{id:'main',x,y,width,height:20,solid:true},platforms:platforms.map(([px,py,pw],i)=>({id:'platform-'+i,x:px!,y:py!,width:pw!,height:15,solid:false})),ledges:[{id:'left',x,y},{id:'right',x:x+width,y}],spawnPositions:[.25,.75,.38,.62].map(t=>({x:x+width*t,y:y-100}))};}
export const STAGE_LAYOUTS:Record<string,StageLayout>={
 stage1:base,
 stage2:arena('stage2',230,510,820,[[315,365,170],[565,285,150],[795,365,170]]),
 stage3:arena('stage3',140,510,1000,[[350,340,190],[740,390,190]]),
 stage4:arena('stage4',240,520,800,[[285,355,160],[560,260,160],[835,355,160]]),
 stage5:arena('stage5',170,510,940,[[300,380,240],[740,380,240]]),
 stage6:arena('stage6',240,500,800,[[310,365,170],[550,275,180],[800,365,170]])
};
export function getStageLayout(id:string='stage1'):StageLayout{return STAGE_LAYOUTS[id]??STAGE_LAYOUTS.stage1!;}
