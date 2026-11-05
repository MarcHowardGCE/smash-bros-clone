import {it,expect} from 'vitest';
import {GameEngine} from '@smash/server/engine';
import {INPUT_BITS as B} from '@smash/shared';
import {LocalPredictor} from './LocalPredictor';
it('predicts sustained walk, flick dash and eased run with the same positions as the server',()=>{
 for(const sequence of [Array(30).fill(.3),Array(30).fill(1),[...Array(12).fill(.3),...Array(15).fill(1)],[...Array(25).fill(1),...Array(15).fill(.4)]]){
 const engine=new GameEngine({playerIds:['a','b']}),state=(engine as any).state;
 Object.assign(state.players.a,{x:500,y:472,vx:0,vy:0,isGrounded:true,state:'IDLE',stateFrame:0,respawnTimer:0});
 const predictor=new LocalPredictor('a');predictor.initialize({...state.players.a});
 sequence.forEach((x,t)=>{
 const input={playerId:'a',tick:t,seq:t,held:x>=.5?B.RIGHT:0,pressed:0,released:0,stickX:x,stickY:0};
 const authoritative=engine.tickGame(new Map([['a',input]])).players.a!;
 predictor.onInput(input);const predicted=predictor.getPredictedState()!;
 expect(predicted.x).toBeCloseTo(authoritative.x,8);expect(predicted.vx).toBeCloseTo(authoritative.vx,8);
 expect(predicted.state).toBe(authoritative.state);
 });
 }
});

