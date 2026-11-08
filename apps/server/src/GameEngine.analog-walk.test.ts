import {it,expect} from 'vitest';
import {GameEngine} from './GameEngine.js';
import {INPUT_BITS as B} from '@smash/shared';
it('authoritative gentle analog walking turns without digital held bits and retains intent in snapshots',()=>{
 const e=new GameEngine({playerIds:['a','b']}),s=(e as any).state;
 Object.assign(s.players.a,{x:600,y:472,state:'IDLE',isGrounded:true,respawnTimer:0,vx:0,vy:0});
 for(let t=0;t<20;t++)e.tickGame(new Map([['a',{playerId:'a',tick:t,seq:t,held:0,pressed:0,released:0,stickX:-.3,stickY:0}]]));
 const p=e.getSnapshot(0,{}).players.a!;
 expect(p.state).toBe('WALK');expect(p.facing).toBe(-1);expect(p.vx).toBeCloseTo(-1.3125);expect(p.movementStickX).toBe(-.3);
 expect(p.movementFlickAge).toBeGreaterThan(6);
});
it('authoritative fast tilt runs and eased tilt walks again',()=>{
 const e=new GameEngine({playerIds:['a','b']}),s=(e as any).state;Object.assign(s.players.a,{x:500,y:472,state:'IDLE',isGrounded:true,respawnTimer:0,vx:0,vy:0});
 let p=s.players.a;for(let t=0;t<25;t++)p=e.tickGame(new Map([['a',{playerId:'a',tick:t,seq:t,held:B.RIGHT,pressed:0,released:0,stickX:1,stickY:0}]])).players.a!;
 expect(p.state).toBe('RUN');expect(p.vx).toBe(6.5);
 for(let t=25;t<40;t++)p=e.tickGame(new Map([['a',{playerId:'a',tick:t,seq:t,held:0,pressed:0,released:0,stickX:.4,stickY:0}]])).players.a!;
 expect(p.state).toBe('WALK');expect(p.vx).toBeCloseTo(1.75);
});


it.each([-1,1] as const)('Hoagie faces a gentle analog reversal toward %s on the first turn tick',direction=>{
 const engine=new GameEngine({playerIds:['a','b'],characterIds:{a:'hulk-hoagie'},practice:true});
 engine.resetPractice();
 const step=(stickX:number,held=0)=>engine.tickGame(new Map([['a',{
  playerId:'a',tick:0,seq:0,held,pressed:0,released:0,stickX,stickY:0,
 }]])).players.a!;
 for(let frame=0;frame<20;frame++)step(-direction,direction<0?B.RIGHT:B.LEFT);
 const turn=step(.325*direction);
 expect(turn).toMatchObject({state:'RUN_TURN',facing:direction});
 expect(turn.vx*direction).toBeLessThan(0);
 let player=turn;
 for(let frame=0;frame<24&&player.state==='RUN_TURN';frame++){
  player=step(.325*direction);
  expect(player.facing).toBe(direction);
 }
 expect(player.state).toBe('WALK');
 expect(player.artCue).toBeUndefined();
});

