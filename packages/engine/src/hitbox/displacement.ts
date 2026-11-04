import { INPUT_BITS as B, PHYSICS, type HitboxData } from '@smash/shared';
/** Supported effect policy. Distances remain calibrated in this project's world units. */
export function asdiPolicy(hit:HitboxData,held:number,grounded:boolean,heldContact=false):{impactX:number;impactY:number;exitMultiplier:number}{
 const angle=((hit.knockbackAngle%360)+360)%360;
 // Vertical launch bands suppress automatic shifting; mirrored upward angles are equivalent.
 if(heldContact||(angle>=70&&angle<110))return{impactX:0,impactY:0,exitMultiplier:0};
 const multiplier=hit.hitlagMultiplier??(hit.hitlagFrames===0?0:1);
 const effect=hit.effect??(hit.electric?'electric':'normal');
 const dual=['electric','paralyze','crumple','autoshift'].includes(effect);
 const zeroProjectile=hit.isProjectile&&multiplier===0;
 const scale=hit.asdiMultiplier??((dual||zeroProjectile)?(hit.sdiMultiplier??1):0);
 const x=Number(!!(held&B.RIGHT))-Number(!!(held&B.LEFT));
 const y=grounded?0:Number(!!(held&B.DOWN))-Number(!!(held&B.UP));
 const length=Math.hypot(x,y)||1,distance=PHYSICS.ASDI_EXIT_DISTANCE_WORLD*scale;
 return{impactX:(dual||zeroProjectile)?x/length*distance:0,impactY:(dual||zeroProjectile)?y/length*distance:0,exitMultiplier:multiplier>0?scale:0};
}
