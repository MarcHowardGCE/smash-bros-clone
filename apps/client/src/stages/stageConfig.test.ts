import {afterEach,expect,it,vi} from 'vitest';
import {STAGES,chooseStageVisual,withStageVisual,getRandomStage} from './stageConfig';
import {renderStageSelectScreen} from '../ui/StageSelectScreen';
import {worldArtwork} from '../ui/WorldPreview';
afterEach(()=>{vi.restoreAllMocks();document.body.innerHTML='';});
it('selects each Zanda background and keeps it stable through preview and confirmation',()=>{
 const stage=STAGES.find(s=>s.id==='stage10')!;
 for(const [index,random]of [0.01,0.4,0.99].entries()){
  vi.spyOn(Math,'random').mockReturnValue(random);
  const resolved=chooseStageVisual(stage);
  expect(resolved.backgroundVariant).toBe(index);
  expect(worldArtwork(resolved)).toContain(resolved.backgroundImage);
  expect(withStageVisual(stage,index)).toEqual(resolved);
  expect(chooseStageVisual(resolved)).toEqual(resolved);
  const root=document.createElement('div');document.body.append(root);const preview=vi.fn(),select=vi.fn();
  const screen=renderStageSelectScreen(root,[STAGES[0]!,stage],select,undefined,null,preview);
  const tile=root.querySelector<HTMLElement>('[data-stage-idx="1"]')!;tile.dispatchEvent(new MouseEvent('mouseenter'));
  const image=root.querySelector<HTMLImageElement>('#stage-preview img')!.src;
  vi.spyOn(Math,'random').mockReturnValue(0.8);tile.focus();tile.click();
  expect(select).toHaveBeenCalledWith(resolved);expect(image).toContain(resolved.backgroundImage);
  screen.destroy();root.remove();vi.restoreAllMocks();
 }
});
it('includes Zanda in ordinary Random World and resolves invalid cosmetics safely',()=>{
 vi.spyOn(Math,'random').mockReturnValue(0.999);expect(getRandomStage()).toMatchObject({id:'stage10',backgroundVariant:2});
 const stage=STAGES.find(s=>s.id==='stage10')!;expect(withStageVisual(stage,999).backgroundVariant).toBe(0);
 expect(chooseStageVisual(STAGES[0]!)).toBe(STAGES[0]);
});
