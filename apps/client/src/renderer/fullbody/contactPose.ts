export interface ContactFrame {root:number[];offsetY?:number;sockets?:Record<string,number[]>}
export interface ContactClip {scale:number;mirrorSource?:boolean;frames:ContactFrame[]}
export function socketPoint(clip:ContactClip,frame:ContactFrame|undefined,name:string):[number,number]|null{
 const p=frame?.sockets?.[name];if(!frame||!p||p.length<2||frame.root.length<2)return null;
 return [(p[0]!-frame.root[0]!)*clip.scale*(clip.mirrorSource?-1:1),(p[1]!-frame.root[1]!)*clip.scale+(frame.offsetY??0)];
}
/** Artwork-only attachment. The simulation's body positions and hitboxes never move here. */
export function solveGrabContact(holder:ContactClip,hi:number,victim:ContactClip,vi:number,deltaX:number,deltaY:number,throwing=false):[number,number]{
 const hand=socketPoint(holder,holder.frames[hi],'grabGrip'),top=socketPoint(victim,victim.frames[vi],'gripTop'),bottom=socketPoint(victim,victim.frames[vi],'gripBottom');
 if(!hand||!top||!bottom)return [0,0];
 // A short contact rail allows a small fighter to hold a tall fighter at the chest,
 // while a tall fighter can lift a smaller opponent without sinking either into the floor.
 const y=throwing?(top[1]!+bottom[1])/2:Math.max(top[1]!,Math.min(bottom[1],hand[1]-deltaY));
 return [hand[0]-deltaX-top[0]!,hand[1]-deltaY-y];
}
