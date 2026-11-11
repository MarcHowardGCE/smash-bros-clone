import{it,expect}from'vitest';import{withMovementArt}from'./movementArt.js';import{DEFAULT_STAGE}from'./index.js';import{INPUT_BITS,type PlayerState}from'@smash/shared';
const p={id:'a',characterId:'all-rounder',x:640,y:472,vx:0,vy:0,isGrounded:true,state:'IDLE',stateFrame:0,facing:1,stocks:3,isKnockedOut:false,respawnTimer:0}as PlayerState;
it('classifies turns, braking, heavy landing, takeoff and interruptions from authoritative motion',()=>{const run={...p,state:'RUN',vx:4};expect(withMovementArt(run,{...p,facing:-1},null,DEFAULT_STAGE).artCue).toBe('turn_run');expect(withMovementArt(run,p,null,DEFAULT_STAGE).artCue).toBe('brake');expect(withMovementArt(p,{...p,state:'WALK',facing:-1},null,DEFAULT_STAGE).artCue).toBe('turn_stand');expect(withMovementArt({...p,isGrounded:false,vy:14},p,null,DEFAULT_STAGE).artCue).toBe('land_heavy');for(const[vx,clip]of[[0,'takeoff_neutral'],[2,'takeoff_forward'],[-2,'takeoff_backward']]as const)expect(withMovementArt({...p,state:'JUMPSQUAT'},{...p,state:'AIRBORNE',isGrounded:false,vx},null,DEFAULT_STAGE).artCue).toBe(clip);expect(withMovementArt({...p,artCue:'brake',artCueFrame:3},{...p,state:'ATTACK'},null,DEFAULT_STAGE).artCue).toBeUndefined();});
it('selects front and back edge balance and preserves cue age',()=>{const x=DEFAULT_STAGE.mainPlatform.x+5;for(const facing of[-1,1]as const){const edge={...p,x,facing},a=withMovementArt(edge,edge,null,DEFAULT_STAGE);expect(a.artCue).toBe(facing===-1?'teeter_front':'teeter_back');expect(withMovementArt(a,edge,null,DEFAULT_STAGE).artCueFrame).toBe(1);}});

it('keeps takeoff art when down is held and only cues a drop from a soft platform',()=>{
 const down={playerId:'a',tick:0,seq:0,held:INPUT_BITS.DOWN,pressed:INPUT_BITS.DOWN,released:0};
 const air={...p,state:'AIRBORNE',isGrounded:false};
 expect(withMovementArt({...p,state:'JUMPSQUAT'},air,down,DEFAULT_STAGE).artCue).toBe('takeoff_neutral');
 expect(withMovementArt(p,air,down,DEFAULT_STAGE).artCue).toBeUndefined();
 const platform=DEFAULT_STAGE.platforms[0]!;
 expect(withMovementArt({...p,x:platform.x+5,y:platform.y-28},air,down,DEFAULT_STAGE).artCue).toBe('platform_drop');
});

it('a fresh leftward analog dash shows dash start instead of a standing turn',()=>{
 const input={playerId:'a',tick:0,seq:0,held:INPUT_BITS.LEFT,pressed:INPUT_BITS.LEFT,released:0,stickX:-1,stickY:0};
 const after={...p,state:'DASH',facing:-1} as PlayerState;
 expect(withMovementArt({...p,artCue:'turn_stand',artCueFrame:1},after,input,DEFAULT_STAGE).artCue).toBeUndefined();
});

it('cues a gentle Pack 03 touchdown and cancels the presentation when movement resumes', () => {
 const grounded = { ...p, characterId: 'loopy' as const };
 const descending = { ...grounded, state: 'AIRBORNE', isGrounded: false, vy: 6 };
 const soft = withMovementArt(descending, { ...grounded, state: 'AIRBORNE' }, null, DEFAULT_STAGE);
 expect(soft).toMatchObject({ state: 'AIRBORNE', isGrounded: true, artCue: 'land_soft', artCueFrame: 0 });
 expect(withMovementArt({ ...descending, vy: 14 }, grounded, null, DEFAULT_STAGE).artCue).toBe('land_heavy');
 expect(withMovementArt(soft, { ...grounded, state: 'WALK' }, null, DEFAULT_STAGE).artCue).toBeUndefined();
 expect(withMovementArt({ ...descending, characterId: 'swift' }, { ...grounded, characterId: 'swift' }, null, DEFAULT_STAGE).artCue).toBeUndefined();
});
