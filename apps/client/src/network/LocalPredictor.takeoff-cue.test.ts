import {it,expect} from 'vitest';
import {GameEngine} from '@smash/server/engine';
import {INPUT_BITS as B} from '@smash/shared';
import {LocalPredictor} from './LocalPredictor';
function seeded(hitstun=0){const e=new GameEngine({playerIds:['a','b']}),p=(e as any).state.players.a;Object.assign(p,{x:500,y:472,vx:0,vy:0,isGrounded:true,state:'IDLE',stateFrame:0,respawnTimer:0,hitstunFramesRemaining:hitstun});const predictor=new LocalPredictor('a');predictor.initialize(p);return predictor;}
it('marks an accepted predicted takeoff so late reactions cannot cover the jump',()=>{const p=seeded();p.onInput({playerId:'a',tick:0,seq:0,held:B.JUMP,pressed:B.JUMP,released:0});expect(p.getPredictedState()!.artCue).toBe('takeoff_neutral');p.onInput({playerId:'a',tick:1,seq:1,held:B.JUMP,pressed:0,released:0});expect(p.getPredictedState()!.artCueFrame).toBe(1);});
it('does not mark an input rejected during hitstun as a takeoff',()=>{const p=seeded(5);p.onInput({playerId:'a',tick:0,seq:0,held:B.JUMP,pressed:B.JUMP,released:0});expect(p.getPredictedState()!.artCue).not.toMatch(/^takeoff_/);});
