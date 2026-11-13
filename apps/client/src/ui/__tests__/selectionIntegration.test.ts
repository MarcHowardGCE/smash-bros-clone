import { GenericInputBits } from '@smash/gamepad-input';
import { ULTIMATE_MENU } from '../../input/controllerProfiles';
import {afterEach,describe,it,expect,vi} from 'vitest';
import {UIManager} from '../UIManager';
import {renderStageSelectScreen} from '../StageSelectScreen';
import {STAGES} from '../../stages/stageConfig';
import {WORLD_STORIES} from '../selectionContent';
const fighters=[{id:'all-rounder',displayName:'All-Rounder'},{id:'abe-lincoln',displayName:'Abe Lincoln'},{id:'swift',displayName:'Swift'}];
afterEach(()=>{vi.useRealTimers();document.body.innerHTML='';});
describe('illustrated selection integration',()=>{
 it('tracks overlapping controller cursors and independently unlocks seats',()=>{
  vi.useFakeTimers();
  const el=document.createElement('div');document.body.append(el);
  const ui=new UIManager(el),done=vi.fn();
  const pads=new Map([[4,{bits:0}],[7,{bits:0}]]);
  ui._gamepadPoller={poll:()=>pads} as unknown as NonNullable<typeof ui._gamepadPoller>;
  ui.showCharacterSelect(fighters,4,done,[2,3],undefined,new Map([[4,0],[7,1]]),[fighters[0]!,fighters[0]!]);
  const tile=(id:string)=>el.querySelector(`.fighter-roster-shared [data-id="${id}"]`)!;
  const press=(index:number,bits:number)=>{
   pads.get(index)!.bits=bits;vi.advanceTimersByTime(32);
   pads.get(index)!.bits=0;vi.advanceTimersByTime(32);
  };
  expect(tile('all-rounder').querySelectorAll('[data-seat]')).toHaveLength(4);
  press(7,GenericInputBits.RIGHT);
  expect(tile('abe-lincoln').querySelector('[data-seat="1"]')).toBeTruthy();
  expect(tile('all-rounder').querySelector('[data-seat="0"]')).toBeTruthy();
  press(7,ULTIMATE_MENU.confirm);
  expect(tile('abe-lincoln').querySelector('[data-seat="1"]')?.getAttribute('data-locked')).toBe('true');
  press(4,GenericInputBits.RIGHT);
  expect(tile('abe-lincoln').querySelectorAll('[data-seat]')).toHaveLength(2);
  press(7,ULTIMATE_MENU.cancel);
  expect(tile('abe-lincoln').querySelector('[data-seat="1"]')?.getAttribute('data-locked')).toBe('false');
  expect(done).not.toHaveBeenCalled();
  ui.showMatch();
 });

 it('restores fighter identity and choice while requiring a human confirmation',()=>{vi.useFakeTimers();const el=document.createElement('div');document.body.append(el);const ui=new UIManager(el),done=vi.fn();ui.showCharacterSelect(fighters,2,done,[1],undefined,undefined,[fighters[2]!,fighters[1]!]);expect(el.querySelector<HTMLImageElement>('.fighter-hero img')?.src).toContain('swift-select-hero.webp');vi.advanceTimersByTime(500);expect(done).not.toHaveBeenCalled();window.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter'}));expect(done).toHaveBeenCalledWith([fighters[2],fighters[1]]);ui.showMatch();});
 it('cancels pending character work when switching screens',()=>{vi.useFakeTimers();const el=document.createElement('div');document.body.append(el);const ui=new UIManager(el),done=vi.fn();ui.showCharacterSelect(fighters,2,done,[1]);ui.showLobby();vi.advanceTimersByTime(1000);window.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter'}));expect(done).not.toHaveBeenCalled();ui.showMatch();});
 it('browses world stories without committing and selects the focused world',()=>{const el=document.createElement('div');document.body.append(el);const done=vi.fn();renderStageSelectScreen(el,STAGES,done);expect(el.querySelector('h2')?.textContent).toBe(STAGES[0]!.displayName);window.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight'}));expect(el.querySelector('h2')?.textContent).toBe(STAGES[1]!.displayName);expect(el.querySelector<HTMLElement>('#stage-story')?.hidden).toBe(false);expect(el.querySelector('#stage-story')?.textContent).toBe(WORLD_STORIES[STAGES[1]!.id]!.story);expect(el.querySelector('#stage-story-toggle')).toBeNull();expect(done).not.toHaveBeenCalled();window.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter'}));expect(done).toHaveBeenCalledOnce();expect(done).toHaveBeenCalledWith(STAGES[1]);});
});
