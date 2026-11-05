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
