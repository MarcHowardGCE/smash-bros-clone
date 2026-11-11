import type {PlayerState} from '@smash/shared';
export interface DodgeProfile {total:number;intangibleStart:number;intangibleEnd:number;attackCancel?:number}
/** Source values are human frames: inclusive invulnerability bounds, total duration, attack cancel. */
export const DODGE_PROFILES={
 'all-rounder':{reference:'Mario',source:'https://ultimateframedata.com/mario',spot:{total:25,attackCancel:20,intangibleStart:3,intangibleEnd:17},forward:{total:29,intangibleStart:4,intangibleEnd:15},backward:{total:34,intangibleStart:5,intangibleEnd:16},neutralAir:{total:52,intangibleStart:3,intangibleEnd:29},directionalAir:{intangibleStart:3,intangibleEnd:21,totals:[71,77,87,102,116]}},
 'abe-lincoln':{reference:'Ganondorf',source:'https://ultimateframedata.com/ganondorf',spot:{total:28,attackCancel:23,intangibleStart:3,intangibleEnd:18},forward:{total:32,intangibleStart:4,intangibleEnd:16},backward:{total:37,intangibleStart:5,intangibleEnd:17},neutralAir:{total:46,intangibleStart:4,intangibleEnd:32},directionalAir:{intangibleStart:4,intangibleEnd:22,totals:[66,73,79,91,103]}},
 'swift':{reference:'Fox',source:'https://ultimateframedata.com/fox',spot:{total:23,attackCancel:18,intangibleStart:3,intangibleEnd:14},forward:{total:26,intangibleStart:4,intangibleEnd:12},backward:{total:32,intangibleStart:4,intangibleEnd:14},neutralAir:{total:38,intangibleStart:2,intangibleEnd:26},directionalAir:{intangibleStart:2,intangibleEnd:19,totals:[54,59,64,70,75]}}
}as const;
export type DodgeContext=Partial<Pick<PlayerState,'characterId'|'dodgeKind'|'dodgeLevel'|'airDodgeDirection'|'state'|'floorRollDirection'|'facing'>>;
function dodgeReference(p:DodgeContext):keyof typeof DODGE_PROFILES{
  const id = p.characterId;
  if (id === 'swift' || id === 'moonshine' || id === 'loopy') return 'swift';
  if (id === 'abe-lincoln' || id === 'hulk-hoagie' || id === 'mrs-tasselbottom') return 'abe-lincoln';
  return 'all-rounder';
}
export function freshDodgeProfile(p:DodgeContext):DodgeProfile {
 const roster=DODGE_PROFILES[dodgeReference(p)];
 const kind=resolveDodgeKind(p);
 if(kind!=='air')return roster[kind];
 const d=p.airDodgeDirection;
 if(!d||(!d.x&&!d.y))return roster.neutralAir;
 const index=d.y>0?(d.x?1:0):d.y<0?(d.x?3:4):2;
 return {...roster.directionalAir,total:roster.directionalAir.totals[index]!};
}

/** Independently measured Mario endpoints, human-frame inclusive bounds. */
export const ALL_ROUNDER_MAX_DODGE={
 source:'https://docs.google.com/spreadsheets/d/16fmsoqDoQaR1eteVk2uuzIH2DB4iQHVrqiG8VRbRA7Q/htmlview/sheet?gid=123650910&headers=true',
 spot:{total:33,attackCancel:27,intangibleStart:6,intangibleEnd:17},
 forward:{total:38,intangibleStart:8,intangibleEnd:14},backward:{total:52,intangibleStart:9,intangibleEnd:14},
 neutralAir:{total:52,intangibleStart:6,intangibleEnd:27},directionalAir:{intangibleStart:6,intangibleEnd:20}
}as const;
export function maximumDodgeProfile(p:DodgeContext):DodgeProfile|null{
 if(p.characterId&&p.characterId!=='all-rounder')return null;
 const kind=resolveDodgeKind(p);
 if(kind!=='air')return ALL_ROUNDER_MAX_DODGE[kind];
 if(!p.airDodgeDirection||(!p.airDodgeDirection.x&&!p.airDodgeDirection.y))return ALL_ROUNDER_MAX_DODGE.neutralAir;
 // Only side-air intangibility has a measured maximum-stale fixture so far.
 return p.airDodgeDirection.y===0?{...ALL_ROUNDER_MAX_DODGE.directionalAir,total:freshDodgeProfile(p).total}:null;
}

/** Use one identity for duration, animation, and source fixture lookup. */
export function resolveDodgeKind(p:DodgeContext):NonNullable<PlayerState['dodgeKind']>{
 return p.dodgeKind??(p.state==='AIR_DODGE'?'air':p.state==='ROLL'?(p.floorRollDirection!==undefined&&p.floorRollDirection!==p.facing?'backward':'forward'):'spot');
}
/** Original 2021 research observations, not current-version native motion-rate certification.
 * Conflicting older Mario neutral-air fresh/end and max back-roll totals are intentionally excluded.
 * The third fighter in the source table is Bowser, NOT Ganondorf.
 */
export const INTERMEDIATE_DODGE_SOURCE='https://w.atwiki.jp/smashsp_kensyou/pages/32.html';
const MARIO_OBSERVED={
 spot:{totals:[25,27,28,30,31],starts:[3,3,4,4,5],ends:[17,16,16,16,16]},
 forward:{totals:[29,31,33,35,36],starts:[4,4,5,6,7],ends:[15,14,14,14,14]},
 backward:{totals:[34,38,41,45,48],starts:[5,5,6,7,8],ends:[16,15,14,14,14]},
 neutralAir:{starts:[3,3,4,4,5],ends:[29,28,28,27,27]},
 directionalAir:{starts:[3,3,4,4,5],ends:[21,20,20,19,19]}
}as const;
export function observedIntermediateDodge(p:DodgeContext):DodgeProfile|null{
 const level=p.dodgeLevel??0,kind=resolveDodgeKind(p),fresh=freshDodgeProfile(p);
 if(!Number.isInteger(level)||level<1||level>4)return null;
 const directional=kind==='air'&&Boolean(p.airDodgeDirection&&(p.airDodgeDirection.x||p.airDodgeDirection.y));
 if(dodgeReference(p)==='swift'&&level===1){
  const bounds=kind==='spot'?[3,13]:kind==='forward'?[4,11]:kind==='backward'?[4,13]:directional?[2,18]:[2,25];
  // The aerial observation was horizontal; other directional angles are not certified by it.
  if(directional&&p.airDodgeDirection!.y!==0)return null;
  return {...fresh,total:kind==='spot'?25:kind==='forward'?28:kind==='backward'?36:fresh.total,intangibleStart:bounds[0]!,intangibleEnd:bounds[1]!};
 }
 if(p.characterId&&p.characterId!=='all-rounder')return null;
 if(directional&&p.airDodgeDirection!.y!==0)return null;
 const data=MARIO_OBSERVED[kind==='air'?(directional?'directionalAir':'neutralAir'):kind];
 return {...fresh,total:'totals'in data?data.totals[level]!:fresh.total,intangibleStart:data.starts[level]!,intangibleEnd:data.ends[level]!};
}
