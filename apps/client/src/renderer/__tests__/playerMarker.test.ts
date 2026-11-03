import {describe,it,expect} from 'vitest';
import {Container} from 'pixi.js';
import {FighterRenderer} from '../FighterRenderer.js';
describe('full-body player markers',()=>{it('keeps all four slots upright and hides eliminated players',()=>{for(let slot=0;slot<4;slot++){const r=new FighterRenderer(new Container(),slot,'all-rounder',{fullBodyPilot:{characters:{}}});const state={x:0,y:0,facing:-1 as const,isInvincible:false,isKnockedOut:false,isShielding:false,shieldHealth:100,state:'IDLE',stateFrame:0,slotIndex:slot,currentMoveId:null};r.update(state);const m=r.container.children.find(c=>c.label==='player-marker')!;expect(m.visible).toBe(true);expect(m.scale.x*r.container.scale.x).toBe(1);r.update({...state,isKnockedOut:true});expect(m.visible).toBe(false);r.destroy();}});});
