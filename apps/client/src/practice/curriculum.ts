import {INPUT_BITS as B,type GameState,type InputEvent,type PlayerState,type CharacterId,type HitEventData,type KOEventData} from '@smash/shared';
import { controllerBindingLabel, type ControllerProfile } from '../input/controllerProfiles';

export function dojoButtonGuide(profile: ControllerProfile, lesson?: Lesson): string {
 const labels = {
  attack:controllerBindingLabel(profile,'ATTACK'),special:controllerBindingLabel(profile,'SPECIAL'),
  jump:controllerBindingLabel(profile,'JUMP'),shield:controllerBindingLabel(profile,'SHIELD'),
  grab:controllerBindingLabel(profile,'GRAB'),bothJumps:profile.jumpLabels.join(' + '),
 };
 if (!lesson) return labels.attack+' Attack · '+labels.special+' Special · '+labels.jump+' Jump · '+labels.shield+' Shield · '+labels.grab+' Grab';
 return lesson.buttons.replace(/\{(attack|special|jump|shield|grab|bothJumps)\}/g,(_,action:keyof typeof labels)=>labels[action]);
}

export function dojoSimulationProfile(id:string):CharacterId{
  if(id==='moonshine'||id==='hulk-hoagie'||id==='swift'||id==='abe-lincoln')return id;
  return 'all-rounder';
}
export type DummyMode='still'|'shield'|'jab'|'mixed'|'up-smash';
export interface PracticeConfig {fighter:string;dummy:string;stageId:string;lessonId:string|null;dummyMode:DummyMode}
export const KO_LESSON_PERCENT = 350;
export type LessonSetup = 'center' | 'close' | 'ko-launch' | 'ledge' | 'floor-tech';
interface LessonContact {hits:readonly HitEventData[];playerId:string}
export interface Lesson {setup?:LessonSetup;ko?:'star'|'screen';id:string;tier:'Basics'|'Advanced'|'Subtle';title:string;hint:string;buttons:string;arm:number;dummy:DummyMode;check:(p:PlayerState,old:PlayerState,context?:LessonContact)=>boolean}
const entered=(p:PlayerState,o:PlayerState,state:string)=>p.state===state&&o.state!==state;
const move=(name:string)=>(p:PlayerState,o:PlayerState)=>p.currentMoveId===name&&(o.currentMoveId!==p.currentMoveId||p.state!==o.state);
export const LESSONS:Lesson[]=[
 {id:'walk',tier:'Basics',title:'Find your footing',hint:'Move gently with the stick. Keyboard direction starts a dash. Either valid ground movement counts.',buttons:'Left stick gently · Arrow keys',arm:B.LEFT|B.RIGHT,dummy:'still',check:(p,o)=>p.isGrounded&&p.x!==o.x&&['WALK','DASH','RUN'].includes(p.state)},
 {id:'dash',tier:'Basics',title:'Commit to a dash',hint:'Flick a direction from rest. Release and repeat.',buttons:'Flick left stick · Arrow keys',arm:B.LEFT|B.RIGHT,dummy:'still',check:(p,o)=>entered(p,o,'DASH')},
 {id:'jump',tier:'Basics',title:'Leave the floor',hint:'Jump from the ground. Land before the next repetition.',buttons:'{jump} · Space / X',arm:B.JUMP,dummy:'still',check:(p,o)=>p.state==='AIRBORNE'&&o.state==='JUMPSQUAT'},
 {id:'jab',tier:'Basics',title:'Throw a jab',hint:'Stand still and press Attack. Let the jab recover before repeating.',buttons:'{attack} · Z',arm:B.ATTACK,dummy:'still',check:move('JAB')},
 {id:'up-tilt',tier:'Basics',title:'Aim a tilt',hint:'Hold up, then Attack without a fresh stick flick. A smash does not count.',buttons:'Hold stick Up + {attack} · Up + Z',arm:B.ATTACK,dummy:'still',check:move('UP_TILT')},
 {id:'special',tier:'Basics',title:'Your neutral special',hint:'Release directional input, then use Special.',buttons:'{special} · S',arm:B.SPECIAL,dummy:'still',check:move('NEUTRAL_SPECIAL')},
 {id:'shield',tier:'Basics',title:'Catch a strike',hint:'Hold Shield before the partner strikes. A real blocked contact counts. Release between attempts.',buttons:'{shield} · Shift',arm:B.SHIELD,dummy:'jab',check:(p,o)=>p.shieldReaction==='hit'&&p.hitlagFramesRemaining>o.hitlagFramesRemaining},
 {id:'grab',tier:'Basics',title:'Make contact',hint:'Approach and grab the partner. Starting a missed grab does not count.',buttons:'{grab} · C',arm:B.GRAB,dummy:'still',check:(p,o)=>p.isGrabbing&&!o.isGrabbing},
 {id:'throw',tier:'Advanced',title:'Grab and send',hint:'Grab, then tilt toward the partner to forward throw. Reset the arena if you need to regroup.',buttons:'{grab}, then stick toward · C, then direction',arm:B.LEFT|B.RIGHT,dummy:'still',check:move('FORWARD_THROW')},
 {id:'double-jump',tier:'Advanced',title:'A second chance',hint:'Jump, release Jump, then press it again while airborne.',buttons:'{jump} twice · Space twice',arm:B.JUMP,dummy:'still',check:(p,o)=>entered(p,o,'DOUBLE_JUMP')},
 {id:'aerial',tier:'Advanced',title:'Attack in the air',hint:'Jump first, then press Attack while airborne.',buttons:'{jump}, then {attack} · Space, then Z',arm:B.ATTACK,dummy:'still',check:(p,o)=>entered(p,o,'AIR_ATTACK')&&Boolean(p.currentMoveId?.endsWith('_AIR'))},
 {id:'short-hop',tier:'Advanced',title:'Keep it low',hint:'Tap and release Jump quickly, or press both jump buttons together. The engine must produce a short hop.',buttons:'Tap {jump}, or {bothJumps} · Tap Space',arm:B.JUMP,dummy:'still',check:(p,o)=>p.state==='AIRBORNE'&&o.state==='JUMPSQUAT'&&p.shortHop===true},
 {id:'fast-fall',tier:'Advanced',title:'Drop with intent',hint:'Jump, wait until falling, then make a fresh downward input. Holding Down before the apex does not count.',buttons:'Fresh stick Down while falling · Down',arm:B.DOWN,dummy:'still',check:(p,o)=>p.isFastFalling&&!o.isFastFalling},
 {id:'spot-dodge',tier:'Advanced',title:'Disappear in place',hint:'Hold Shield, then make a fresh Down input. Release before trying again.',buttons:'{shield} + stick Down · Shift + Down',arm:B.DOWN,dummy:'jab',check:(p,o)=>entered(p,o,'SPOT_DODGE')},
 {id:'roll',tier:'Advanced',title:'Slip past',hint:'Hold Shield, then make a fresh sideways input. Recovery changes as you repeat dodges.',buttons:'{shield} + stick Left / Right · Shift + direction',arm:B.LEFT|B.RIGHT,dummy:'jab',check:(p,o)=>entered(p,o,'ROLL')},
 {id:'parry',tier:'Subtle',title:'Release at the last moment',hint:'Raise Shield, then release it just before the strike. Each successful release parry counts once.',buttons:'Release {shield} before impact · Release Shift',arm:B.SHIELD,dummy:'jab',check:(p,o)=>p.shieldParryConsumed===true&&!o.shieldParryConsumed&&p.shieldReaction==='parry'},
 {id:'oos-special',tier:'Subtle',title:'Recover out of shield',hint:'From a held, unstunned shield, aim Up and press Special. Dropping shield first does not count.',buttons:'Hold {shield}, Up + {special} · Shift, Up + S',arm:B.SPECIAL,dummy:'still',check:(p,o)=>o.state==='SHIELD'&&move('UP_SPECIAL')(p,o)},
 {id:'oos-smash',tier:'Subtle',title:'Punish from guard',hint:'From held Shield, flick the right stick Up. Confirm UP SMASH rather than grab or jump.',buttons:'Hold {shield} + right stick Up · Shift + Up + Z',arm:B.ATTACK,dummy:'still',check:(p,o)=>o.state==='SHIELD'&&move('UP_SMASH')(p,o)}
];

const smashLessons = [
 ['forward-smash','Forward smash','FORWARD_SMASH','Side'],
 ['up-smash','Up smash','UP_SMASH','Up'],
 ['down-smash','Down smash','DOWN_SMASH','Down'],
] as const;
const aerialLessons = [
 ['neutral-air','Neutral aerial','NEUTRAL_AIR','Release directions before attacking.'],
 ['forward-air','Forward aerial','FORWARD_AIR','Aim toward the direction you are facing.'],
 ['back-air','Back aerial','BACK_AIR','Aim behind you without turning around first.'],
 ['up-air','Up aerial','UP_AIR','Aim up as you attack.'],
 ['down-air','Down aerial','DOWN_AIR','Aim down as you attack.'],
] as const;
const throwLessons = [
 ['back-throw','Back throw','BACK_THROW',B.LEFT|B.RIGHT,'away from the partner'],
 ['up-throw','Up throw','UP_THROW',B.UP,'up'],
 ['down-throw','Down throw','DOWN_THROW',B.DOWN,'down'],
] as const;
const ledgeLessons = [
 ['ledge-climb','Neutral ledge climb','LEDGE_CLIMB',B.RIGHT,'Toward the stage'],
 ['ledge-roll','Ledge roll','LEDGE_ROLL',B.SHIELD,'{shield}'],
 ['ledge-jump','Ledge jump','LEDGE_JUMP',B.JUMP,'{jump}'],
 ['ledge-attack','Ledge attack','LEDGE_ATTACK',B.ATTACK,'{attack}'],
] as const;
LESSONS.push(
 ...smashLessons.map(([id,title,moveId,direction]):Lesson=>({
  id,title,tier:'Advanced',hint:'Start from the ground. Flick the direction with Attack, then release Attack to finish the smash.',
  buttons:'Right stick '+direction+' (Smash mode) · Shift + '+direction+' + Z, then release Z',arm:B.ATTACK,dummy:'still',
  check:(p,o)=>p.currentMoveId===moveId&&Boolean(p.activeHitbox)&&(!o.activeHitbox||o.currentMoveId!==moveId),
 })),
 ...aerialLessons.map(([id,title,moveId,hint]):Lesson=>({
  id,title,tier:'Advanced',hint:'Jump, then attack in the air. '+hint,
  buttons:id==='neutral-air'?'{jump}, then {attack} · Space, then Z':'{jump}, then direction + {attack} · Space, then direction + Z',arm:B.ATTACK,dummy:'still',check:move(moveId),
 })),
 {id:'neutral-air-dodge',tier:'Advanced',title:'Neutral air dodge',hint:'Jump, return the stick to neutral, then press Shield in the air. Land before repeating.',
  buttons:'{jump}, then {shield} without a direction · Space, then Shift',arm:B.SHIELD,dummy:'still',
  check:(p,o)=>entered(p,o,'AIR_DODGE')&&!p.airDodgeDirection?.x&&!p.airDodgeDirection?.y},
 {id:'directional-air-dodge',tier:'Advanced',title:'Directional air dodge',hint:'Jump, hold a direction, then press Shield in the air. Land before repeating.',
  buttons:'{jump}, then direction + {shield} · Space, then direction + Shift',arm:B.SHIELD,dummy:'still',
  check:(p,o)=>entered(p,o,'AIR_DODGE')&&Boolean(p.airDodgeDirection?.x||p.airDodgeDirection?.y)},
 {id:'pummel',tier:'Advanced',title:'Pummel from a grab',hint:'Grab the nearby partner, then press Attack while holding them. A pummel must connect.',
  buttons:'{grab}, then {attack} · C, then Z',arm:B.ATTACK,dummy:'still',setup:'close',
  check:(_p,_o,context)=>Boolean(context?.hits.some(hit=>hit.attackerId===context.playerId&&hit.moveId==='PUMMEL'))},
 ...throwLessons.map(([id,title,moveId,arm,direction]):Lesson=>({
  id,title,tier:'Advanced',hint:'Grab the nearby partner, then aim '+direction+'.',
  buttons:'{grab}, then '+direction+' · C, then direction',arm,dummy:'still',setup:'close',
  check:(_p,_o,context)=>Boolean(context?.hits.some(hit=>hit.attackerId===context.playerId&&hit.defenderId==='local-p2'&&hit.moveId===moveId)),
 })),
 ...ledgeLessons.map(([id,title,state,arm,input]):Lesson=>({
  id,title,tier:'Subtle',hint:'Wait for the ledge catch, then use the indicated option. Press R or Reset arena to start the next attempt.',
  buttons:input+' while hanging',arm,dummy:'still',setup:'ledge',check:(p,o)=>o.state==='LEDGE_HANG'&&entered(p,o,state),
 })),
 ...(['neutral','roll'] as const).map((kind):Lesson=>({
  id:'floor-tech-'+kind,tier:'Subtle',title:kind==='neutral'?'Neutral floor tech':'Floor tech roll',
  hint:'You start tumbling above the floor. Press Shield shortly before contact. '+(kind==='neutral'?'Keep direction neutral.':'Press Shield first, then hold left or right through impact.')+' Reset the arena between attempts.',
  buttons:kind==='neutral'?'{shield} · Shift':'{shield}, then direction · Shift, then Left/Right',arm:B.SHIELD,dummy:'still',setup:'floor-tech',
  check:(p,o)=>entered(p,o,kind==='neutral'?'TECH_NEUTRAL':'TECH_ROLL'),
 })),
 ...(['star','screen'] as const).map((kind):Lesson=>({
  id:kind+'-ko',tier:'Subtle',title:kind==='star'?'Star KO':'Screen KO',setup:'ko-launch',dummy:'still',ko:kind,arm:B.ATTACK,
  hint:'The partner starts at '+KO_LESSON_PERCENT+'%. Connect with an up smash and launch them through the top blast zone. The arena resets after each launch. Keep practicing after three successful repetitions.',
  buttons:'Right stick Up (Smash mode) · Shift + Up + Z, then release Z',check:()=>false,
 })),
);

/** Counts fresh inputs followed by real state transitions, contacts or blast-zone exits. */
export class LessonTracker {
  count = 0;
  private previous: PlayerState | null = null;
  private armedUntil = -1;
  private launchUntil = -1;

  constructor(readonly lesson: Lesson) {}

  observe(
    state: GameState, input: InputEvent | null | undefined, playerId: string,
    hits: readonly HitEventData[] = [], exits: readonly KOEventData[] = [],
  ): boolean {
    const player = state.players[playerId];
    if (!player) return false;
    const bits = this.lesson.id==='parry' ? input?.released ?? 0 : input?.pressed ?? 0;
    if (bits & this.lesson.arm) this.armedUntil = state.tick + 180;
    let outcome = false;
    if (this.lesson.ko) {
      for (const hit of hits) {
        if (hit.defenderId==='local-p2') {
          this.launchUntil = hit.attackerId===playerId && hit.moveId==='UP_SMASH' && state.tick<=this.armedUntil
            ? state.tick+180 : -1;
        }
      }
      outcome = state.tick<=this.launchUntil && exits.some(event=>event.playerId==='local-p2'&&event.boundary==='top');
      if (exits.length) this.launchUntil = -1;
    } else if (this.previous && state.tick<=this.armedUntil) {
      outcome = this.lesson.check(player,this.previous,{hits,playerId});
    }
    this.previous = player;
    if (!outcome || (this.count===3 && !this.lesson.ko)) return false;
    this.count = Math.min(this.count + 1, 3);
    this.armedUntil = -1;
    return true;
  }

  resetAttempt(): void { this.previous=null; this.armedUntil=-1; this.launchUntil=-1; }
  reset(): void { this.count=0; this.resetAttempt(); }
}
