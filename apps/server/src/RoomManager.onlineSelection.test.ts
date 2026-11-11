import{describe,it,expect}from'vitest';import{RoomManager}from'./RoomManager';
const setup=()=>{const m=new RoomManager(),h=m.createRoom('host'),g=m.joinRoom(h.roomCode,'guest');if('error'in g)throw Error(g.error);m.setReady(h.roomCode,h.playerId);m.setReady(h.roomCode,g.playerId);return{m,h,g}};
const ready=(x:ReturnType<typeof setup>)=>{x.m.confirmCharacter(x.h.roomCode,x.h.playerId);x.m.confirmCharacter(x.h.roomCode,x.g.playerId)};
describe('authoritative online selection',()=>{
 it('accepts the new arena IDs and rejects filenames and inherited keys',()=>{
  const x=setup();ready(x);
  for(const stageId of ['stage7','stage8','stage9']){
   expect(x.m.selectStage(x.h.roomCode,x.h.playerId,stageId)).toEqual({ok:true});
   expect(x.m.getSelectionState(x.h.roomCode)?.stageId).toBe(stageId);
  }
  for(const invalid of ['stage07','stage08.webp','toString','__proto__']){
   expect(x.m.selectStage(x.h.roomCode,x.h.playerId,invalid)).toEqual({error:'Invalid stage'});
  }
  expect(x.m.getSelectionState(x.h.roomCode)?.stageId).toBe('stage9');
 });
 it('waits for a valid host stage confirmation before countdown',()=>{const x=setup();ready(x);expect(x.m.getRoom(x.h.roomCode)?.phase).toBe('STAGE_SELECT');expect(x.m.selectStage(x.h.roomCode,x.g.playerId,'stage6')).toHaveProperty('error');expect(x.m.selectStage(x.h.roomCode,x.h.playerId,'stage99')).toHaveProperty('error');expect(x.m.selectStage(x.h.roomCode,x.h.playerId,null)).toHaveProperty('error');expect(x.m.confirmStage(x.h.roomCode,x.g.playerId)).toHaveProperty('error');expect(x.m.selectStage(x.h.roomCode,x.h.playerId,'stage6')).toEqual({ok:true});expect(x.m.confirmStage(x.h.roomCode,x.h.playerId)).toEqual({ok:true});const preparation=x.m.getSelectionState(x.h.roomCode)?.preparation!;
  expect(x.m.getSelectionState(x.h.roomCode)?.stageId).toBe('stage6');
  expect(x.m.selectStage(x.h.roomCode,x.h.playerId,'stage1')).toHaveProperty('error');
  expect(x.m.markStagePrepared(x.h.roomCode,x.h.playerId,preparation.id)).toEqual({ok:true,allPrepared:false});
  expect(x.m.markStagePrepared(x.h.roomCode,x.h.playerId,preparation.id)).toEqual({ok:true,allPrepared:false});
  expect(x.m.getRoom(x.h.roomCode)?.phase).toBe('STAGE_SELECT');
  expect(x.m.markStagePrepared(x.h.roomCode,'stranger',preparation.id)).toHaveProperty('error');
  expect(x.m.markStagePrepared(x.h.roomCode,x.g.playerId,preparation.id)).toEqual({ok:true,allPrepared:true});
  expect(x.m.getRoom(x.h.roomCode)?.phase).toBe('COUNTDOWN');
  expect(x.m.unconfirmCharacter(x.h.roomCode,x.g.playerId)).toHaveProperty('error');expect(x.m.confirmStage(x.h.roomCode,x.h.playerId)).toHaveProperty('error');});
 it('unconfirms only the caller and returns the room to fighters',()=>{const x=setup();x.m.selectCharacter(x.h.roomCode,x.g.playerId,'swift');ready(x);expect(x.m.unconfirmCharacter(x.h.roomCode,x.g.playerId)).toEqual({ok:true});const s=x.m.getSelectionState(x.h.roomCode)!;expect(s.phase).toBe('CHARACTER_SELECT');expect(s.players.find(p=>p.playerId===x.g.playerId)).toMatchObject({confirmed:false,characterId:'swift'});expect(s.players.find(p=>p.playerId===x.h.playerId)?.confirmed).toBe(true);expect(x.m.selectStage(x.h.roomCode,x.h.playerId,'stage2')).toHaveProperty('error');});
 it('backs out safely with phase and membership checks',()=>{const x=setup();ready(x);expect(x.m.selectionBack(x.h.roomCode,x.g.playerId)).toHaveProperty('error');expect(x.m.selectionBack(x.h.roomCode,'stranger')).toHaveProperty('error');expect(x.m.selectionBack(x.h.roomCode,x.h.playerId)).toEqual({ok:true});expect(x.m.getSelectionState(x.h.roomCode)?.players.every(p=>!p.confirmed)).toBe(true);expect(x.m.selectionBack(x.h.roomCode,x.h.playerId)).toEqual({ok:true});expect(x.m.getRoom(x.h.roomCode)?.phase).toBe('LOBBY');expect(x.m.getRoom(x.h.roomCode)?.players.size).toBe(2);});
 it('resets selection on host departure and elects the next occupied slot',()=>{const x=setup();ready(x);x.m.removePlayer('host');const s=x.m.getSelectionState(x.h.roomCode)!;expect(s.phase).toBe('LOBBY');expect(s.hostPlayerId).toBe(x.g.playerId);expect(s.players[0]?.confirmed).toBe(false);});
});

it('invalidates artwork acknowledgments after changing the lineup or leaving', () => {
  const {m,h,g}=setup();
  const code=h.roomCode;
  ready({m,h,g});
  m.confirmStage(code,h.playerId);
  const oldId=m.getSelectionState(code)?.preparation?.id;
  expect(m.markStagePrepared(code,h.playerId,oldId)).toEqual({ok:true,allPrepared:false});
  expect(m.unconfirmCharacter(code,g.playerId)).toEqual({ok:true});
  m.confirmCharacter(code,g.playerId);
  m.confirmStage(code,h.playerId);
  const current=m.getSelectionState(code)?.preparation;
  expect(current?.id).not.toBe(oldId);
  expect(current?.readyPlayerIds).toEqual([]);
  expect(m.markStagePrepared(code,g.playerId,oldId)).toHaveProperty('error');
  m.removePlayer('guest');
  expect(m.getSelectionState(code)?.preparation).toBeUndefined();
  expect(m.markStagePrepared(code,h.playerId,current?.id)).toHaveProperty('error');
  expect(m.getSelectionState(code)?.phase).toBe('LOBBY');
});

it('preserves the host Zanda visual through preparation and rejects invalid variants',()=>{
 const x=setup();ready(x);const code=x.h.roomCode;
 for(const backgroundVariant of [0,1,2]){
  expect(x.m.selectStage(code,x.h.playerId,{id:'stage10',backgroundVariant})).toEqual({ok:true});
  expect(x.m.getSelectionState(code)).toMatchObject({stageId:'stage10',stageBackgroundVariant:backgroundVariant});
 }
 for(const backgroundVariant of [-1,3,1.5,'1',NaN])expect(x.m.selectStage(code,x.h.playerId,{id:'stage10',backgroundVariant})).toHaveProperty('error');
 expect(x.m.selectStage(code,x.g.playerId,{id:'stage10',backgroundVariant:0})).toHaveProperty('error');
 x.m.confirmStage(code,x.h.playerId);
 expect(x.m.selectStage(code,x.h.playerId,{id:'stage10',backgroundVariant:1})).toHaveProperty('error');
 expect(x.m.getSelectionState(code)?.stageBackgroundVariant).toBe(2);
 const id=x.m.getSelectionState(code)!.preparation!.id;
 x.m.markStagePrepared(code,x.h.playerId,id);x.m.markStagePrepared(code,x.g.playerId,id);
 expect(x.m.getRoom(code)).toMatchObject({phase:'COUNTDOWN',stageId:'stage10',stageBackgroundVariant:2});
});
