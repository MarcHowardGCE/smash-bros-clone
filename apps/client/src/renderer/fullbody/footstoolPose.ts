/** Select the displayed frame for both rendering and contact socket lookup. */
export function footstoolFrameIndex(age: number, frameCount: number, legacyNewcomer = false): number {
 const tick = Number.isFinite(age) ? Math.max(0, Math.floor(age)) : 0;
 const index = legacyNewcomer && frameCount < 6 ? (tick < 4 ? 1 : 2) : Math.min(5, Math.floor(tick / 3));
 return Math.max(0, Math.min(frameCount - 1, index));
}
export interface FootstoolFrame {readonly root:readonly number[];readonly offsetY?:number;readonly mirrorSource?:boolean;readonly sockets?:Readonly<Record<string,readonly number[]>>}
export interface FootstoolClip {readonly scale:number;readonly mirrorSource?:boolean;readonly frames:readonly FootstoolFrame[]}
export function footstoolPoint(clip:FootstoolClip,index:number,key:string,facing:1|-1=1):[number,number]|null{
 const f=clip.frames[index],p=f?.sockets?.[key];if(!f||!p||![clip.scale,f.root[0],f.root[1],p[0],p[1],f.offsetY??0].every(Number.isFinite)||clip.scale<=0)return null;
 return [(p[0]!-f.root[0]!)*clip.scale*(clip.mirrorSource?-1:1)*(f.mirrorSource?-1:1)*facing,(p[1]!-f.root[1]!)*clip.scale+(f.offsetY??0)];
}
/** Preview attachment only; never changes simulation positions, damage or jump resources. */
export function solveFootstoolContact(attacker:FootstoolClip,ai:number,victim:FootstoolClip,vi:number,facing:1|-1=1):[number,number]|null{
 const sole=footstoolPoint(attacker,ai,'footstoolSole',facing),head=footstoolPoint(victim,vi,'footstoolHead',facing);
 return sole&&head?[head[0]-sole[0],head[1]-sole[1]]:null;
}
