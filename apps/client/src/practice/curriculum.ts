import {INPUT_BITS as B,type GameState,type InputEvent,type PlayerState} from '@smash/shared';
export type DummyMode='still'|'shield'|'jab'|'mixed';
export interface PracticeConfig {fighter:string;dummy:string;stageId:string;lessonId:string|null;dummyMode:DummyMode}
export interface Lesson {id:string;tier:'Basics'|'Advanced'|'Subtle';title:string;hint:string;buttons:string;arm:number;dummy:DummyMode;check:(p:PlayerState,old:PlayerState)=>boolean}
const entered=(p:PlayerState,o:PlayerState,state:string)=>p.state===state&&o.state!==state;
const move=(name:string)=>(p:PlayerState,o:PlayerState)=>p.currentMoveId===name&&(o.currentMoveId!==p.currentMoveId||p.state!==o.state);
export const LESSONS:Lesson[]=[
 {id:'walk',tier:'Basics',title:'Find your footing',hint:'Move gently with the stick. Keyboard direction starts a dash. Either valid ground movement counts.',buttons:'Left stick gently · Arrow keys',arm:B.LEFT|B.RIGHT,dummy:'still',check:(p,o)=>p.isGrounded&&p.x!==o.x&&['WALK','DASH','RUN'].includes(p.state)},
 {id:'dash',tier:'Basics',title:'Commit to a dash',hint:'Flick a direction from rest. Release and repeat.',buttons:'Flick left stick · Arrow keys',arm:B.LEFT|B.RIGHT,dummy:'still',check:(p,o)=>entered(p,o,'DASH')},
 {id:'jump',tier:'Basics',title:'Leave the floor',hint:'Jump from the ground. Land before the next repetition.',buttons:'X / Y · Space / X',arm:B.JUMP,dummy:'still',check:(p,o)=>p.state==='AIRBORNE'&&o.state==='JUMPSQUAT'},
 {id:'jab',tier:'Basics',title:'Throw a jab',hint:'Stand still and press Attack. Let the jab recover before repeating.',buttons:'B · Z',arm:B.ATTACK,dummy:'still',check:move('JAB')},
 {id:'up-tilt',tier:'Basics',title:'Aim a tilt',hint:'Hold up, then Attack without a fresh stick flick. A smash does not count.',buttons:'Hold stick Up + B · Up + Z',arm:B.ATTACK,dummy:'still',check:move('UP_TILT')},
 {id:'special',tier:'Basics',title:'Your neutral special',hint:'Release directional input, then use Special.',buttons:'A · S',arm:B.SPECIAL,dummy:'still',check:move('NEUTRAL_SPECIAL')},
 {id:'shield',tier:'Basics',title:'Catch a strike',hint:'Hold Shield before the partner strikes. A real blocked contact counts. Release between attempts.',buttons:'LT / RT · Shift',arm:B.SHIELD,dummy:'jab',check:(p,o)=>p.shieldReaction==='hit'&&p.hitlagFramesRemaining>o.hitlagFramesRemaining},
 {id:'grab',tier:'Basics',title:'Make contact',hint:'Approach and grab the partner. Starting a missed grab does not count.',buttons:'LB / RB · C',arm:B.GRAB,dummy:'still',check:(p,o)=>p.isGrabbing&&!o.isGrabbing},
 {id:'throw',tier:'Advanced',title:'Grab and send',hint:'Grab, then tilt toward the partner to forward throw. Reset the arena if you need to regroup.',buttons:'LB / RB, then stick toward · C, then direction',arm:B.LEFT|B.RIGHT,dummy:'still',check:move('FORWARD_THROW')},
 {id:'double-jump',tier:'Advanced',title:'A second chance',hint:'Jump, release Jump, then press it again while airborne.',buttons:'X / Y twice · Space twice',arm:B.JUMP,dummy:'still',check:(p,o)=>entered(p,o,'DOUBLE_JUMP')},
 {id:'aerial',tier:'Advanced',title:'Attack in the air',hint:'Jump first, then press Attack while airborne.',buttons:'X / Y, then B · Space, then Z',arm:B.ATTACK,dummy:'still',check:(p,o)=>entered(p,o,'AIR_ATTACK')&&Boolean(p.currentMoveId?.endsWith('_AIR'))},
 {id:'short-hop',tier:'Advanced',title:'Keep it low',hint:'Tap and release Jump quickly, or press both jump buttons together. The engine must produce a short hop.',buttons:'Tap X / Y, or X + Y · Tap Space',arm:B.JUMP,dummy:'still',check:(p,o)=>p.state==='AIRBORNE'&&o.state==='JUMPSQUAT'&&p.shortHop===true},
 {id:'fast-fall',tier:'Advanced',title:'Drop with intent',hint:'Jump, wait until falling, then make a fresh downward input. Holding Down before the apex does not count.',buttons:'Fresh stick Down while falling · Down',arm:B.DOWN,dummy:'still',check:(p,o)=>p.isFastFalling&&!o.isFastFalling},
 {id:'spot-dodge',tier:'Advanced',title:'Disappear in place',hint:'Hold Shield, then make a fresh Down input. Release before trying again.',buttons:'LT / RT + stick Down · Shift + Down',arm:B.DOWN,dummy:'jab',check:(p,o)=>entered(p,o,'SPOT_DODGE')},
 {id:'roll',tier:'Advanced',title:'Slip past',hint:'Hold Shield, then make a fresh sideways input. Recovery changes as you repeat dodges.',buttons:'LT / RT + stick Left / Right · Shift + direction',arm:B.LEFT|B.RIGHT,dummy:'jab',check:(p,o)=>entered(p,o,'ROLL')},
 {id:'parry',tier:'Subtle',title:'Release at the last moment',hint:'Raise Shield, then release it just before the strike. Each successful release parry counts once.',buttons:'Release LT / RT before impact · Release Shift',arm:B.SHIELD,dummy:'jab',check:(p,o)=>p.shieldParryConsumed===true&&!o.shieldParryConsumed&&p.shieldReaction==='parry'},
 {id:'oos-special',tier:'Subtle',title:'Recover out of shield',hint:'From a held, unstunned shield, aim Up and press Special. Dropping shield first does not count.',buttons:'Hold LT / RT, Up + A · Shift, Up + S',arm:B.SPECIAL,dummy:'still',check:(p,o)=>o.state==='SHIELD'&&move('UP_SPECIAL')(p,o)},
 {id:'oos-smash',tier:'Subtle',title:'Punish from guard',hint:'From held Shield, flick the right stick Up. Confirm UP SMASH rather than grab or jump.',buttons:'Hold LT / RT + right stick Up · Shift + Up + Z',arm:B.ATTACK,dummy:'still',check:(p,o)=>o.state==='SHIELD'&&move('UP_SMASH')(p,o)}
];
/** Counts separate armed engine outcomes, never held poses or buttons alone. */
export class LessonTracker {
 count=0;private previous:PlayerState|null=null;private armedUntil=-1;
 constructor(readonly lesson:Lesson){}
 observe(state:GameState,input:InputEvent|null|undefined,id:string):boolean {
  const p=state.players[id];if(!p)return false;
  const bits=this.lesson.id==='parry'?(input?.released??0):(input?.pressed??0);
  if(bits&this.lesson.arm)this.armedUntil=state.tick+180;
  const credit=this.count<3&&this.previous!==null&&state.tick<=this.armedUntil&&this.lesson.check(p,this.previous);
  this.previous=p;
  if(credit){this.count++;this.armedUntil=-1;}return credit;
 }
 reset():void{this.count=0;this.previous=null;this.armedUntil=-1;}
}
