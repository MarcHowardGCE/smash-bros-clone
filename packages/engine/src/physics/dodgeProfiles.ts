import type {CharacterId,PlayerState} from '@smash/shared';
export interface DodgeProfile {total:number;intangibleStart:number;intangibleEnd:number;attackCancel?:number}
/** Source values are human frames: inclusive invulnerability bounds, total duration, attack cancel. */
export const DODGE_PROFILES={
 'all-rounder':{reference:'Mario',source:'https://ultimateframedata.com/mario',spot:{total:25,attackCancel:20,intangibleStart:3,intangibleEnd:17},forward:{total:29,intangibleStart:4,intangibleEnd:15},backward:{total:34,intangibleStart:5,intangibleEnd:16},neutralAir:{total:52,intangibleStart:3,intangibleEnd:29},directionalAir:{intangibleStart:3,intangibleEnd:21,totals:[71,77,87,102,116]}},
 'abe-lincoln':{reference:'Ganondorf',source:'https://ultimateframedata.com/ganondorf',spot:{total:28,attackCancel:23,intangibleStart:3,intangibleEnd:18},forward:{total:32,intangibleStart:4,intangibleEnd:16},backward:{total:37,intangibleStart:5,intangibleEnd:17},neutralAir:{total:46,intangibleStart:4,intangibleEnd:32},directionalAir:{intangibleStart:4,intangibleEnd:22,totals:[66,73,79,91,103]}},
 'swift':{reference:'Fox',source:'https://ultimateframedata.com/fox',spot:{total:23,attackCancel:18,intangibleStart:3,intangibleEnd:14},forward:{total:26,intangibleStart:4,intangibleEnd:12},backward:{total:32,intangibleStart:4,intangibleEnd:14},neutralAir:{total:38,intangibleStart:2,intangibleEnd:26},directionalAir:{intangibleStart:2,intangibleEnd:19,totals:[54,59,64,70,75]}}
}as const;
export type DodgeContext=Partial<Pick<PlayerState,'characterId'|'dodgeKind'|'dodgeLevel'|'airDodgeDirection'|'state'|'floorRollDirection'|'facing'>>;
export function freshDodgeProfile(p:DodgeContext):DodgeProfile {
 const roster=DODGE_PROFILES[p.characterId??'all-rounder'];
 const kind=p.dodgeKind??(p.state==='AIR_DODGE'?'air':p.state==='ROLL'?(p.floorRollDirection!==undefined&&p.floorRollDirection!==p.facing?'backward':'forward'):'spot');
 if(kind!=='air')return roster[kind];
 const d=p.airDodgeDirection;
 if(!d||(!d.x&&!d.y))return roster.neutralAir;
 const index=d.y>0?(d.x?1:0):d.y<0?(d.x?3:4):2;
 return {...roster.directionalAir,total:roster.directionalAir.totals[index]!};
}
