import { afterEach, expect, it, vi } from 'vitest';
import { renderPracticeSetup } from './PracticeSetup';
import { LESSONS } from './curriculum';

afterEach(() => { localStorage.clear(); document.body.innerHTML = ''; });

it('retains free practice fighter and world choices on reopening', () => {
  const root = document.body.appendChild(document.createElement('div'));
  const start = vi.fn();
  const click = (id: string) => root.querySelector<HTMLButtonElement>('#'+id)!.click();
  const handle = renderPracticeSetup(root, null, start, vi.fn());
  click('dojo-fighter');
  click('dojo-stage');
  handle.destroy();
  const reopened = renderPracticeSetup(root, null, start, vi.fn());
  click('practice-free');
  expect(start).toHaveBeenCalledWith(expect.objectContaining({fighter:'abe-lincoln',stageId:'stage2',lessonId:null}));
  reopened.destroy();
});

it('previews a lesson without starting and keeps existing per-fighter completion', () => {
  const root = document.body.appendChild(document.createElement('div'));
  const start = vi.fn();
  localStorage.setItem('eth:dojo:v1:all-rounder:parry','complete');
  const handle = renderPracticeSetup(root, null, start, vi.fn());
  const click = (id: string) => root.querySelector<HTMLButtonElement>('#'+id)!.click();
  expect(root.querySelectorAll('[data-lesson]')).toHaveLength(LESSONS.length);
  click('dojo-mode-lessons');
  click('dojo-tier-Subtle');
  click('practice-lesson-parry');
  expect(root.querySelector('#dojo-lesson-progress')?.textContent).toContain('Completed');
  expect(start).not.toHaveBeenCalled();
  click('dojo-start-lesson');
  expect(start).toHaveBeenCalledWith(expect.objectContaining({lessonId:'parry'}));
  handle.destroy();
});
