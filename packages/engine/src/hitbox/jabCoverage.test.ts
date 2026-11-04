import {it,expect} from 'vitest';
import {getCharacterStats,MoveId,type PlayerState} from '@smash/shared';
import {getMoveDataForCharacter} from '../moves/index.js';
import {resolveHit} from './index.js';
it('jabs connect at point blank against every grounded fighter in both facings without extending their tips',()=>{
 const ids=['all-rounder','abe-lincoln','swift'] as const;
 for(const attacker of ids)for(const defender of ids)for(const facing of [-1,1] as const){
 const a={id:'a',characterId:attacker,x:600,y:500-getCharacterStats(attacker).hurtboxRadius,facing,state:'ATTACK',stateFrame:3,percent:0,isGrounded:true,isInvincible:false,currentMoveId:MoveId.JAB,staleMoveQueue:[]} as unknown as PlayerState;
 const d={id:'b',characterId:defender,x:600,y:500-getCharacterStats(defender).hurtboxRadius,facing:-facing,state:'IDLE',stateFrame:0,percent:0,isGrounded:true,isInvincible:false} as unknown as PlayerState;
 const h=getMoveDataForCharacter(attacker,MoveId.JAB).hitboxPerActiveFrame[0]!;
 expect(resolveHit(a,d,h).hit,attacker+' vs '+defender+' facing '+facing).toBe(true);
 expect(h.offsetX+h.radius).toBe(attacker==='abe-lincoln'?78:attacker==='swift'?68:67);
 d.x=600+facing*(h.offsetX+h.radius+getCharacterStats(defender).hurtboxRadius+1);
 expect(resolveHit(a,d,h).hit).toBe(false);
 }
});
