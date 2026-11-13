import { CHARACTER_REGISTRY, type CharacterId } from '@smash/shared';
import type { FighterChoice } from '../local/types';
import { escapeHtml, fighterPortrait, FIGHTER_PRESENTATION } from './selectionContent';

const metrics = [
  { label: 'Weight', key: 'fighterWeight', decimals: 0 },
  { label: 'Run speed', key: 'runSpeed', decimals: 2 },
  { label: 'Air speed', key: 'airSpeed', decimals: 2 },
] as const;

export function selectionPortrait(id: string, size: 'hero' | 'tile'): string {
  if (Object.hasOwn(FIGHTER_PRESENTATION, id)) {
    return (import.meta.env.BASE_URL || '/') + 'menu-art/' + id + '-select-' + size + '.webp';
  }
  return fighterPortrait(id);
}

export function fighterTile(fighter: FighterChoice, faceoff = false): string {
  return `<img src="${faceoff ? selectionPortrait(fighter.id, 'tile') : fighterPortrait(fighter.id)}" alt="" draggable="false"><span>${escapeHtml(fighter.displayName)}</span>`;
}

export function fighterComparison(root: HTMLElement, roster: readonly FighterChoice[], faceoff = false) {
  let current = roster[0];
  let reference = roster[1] ?? current;
  const artwork = faceoff ? '<picture><source media="(prefers-reduced-motion: no-preference)"><img alt=""></picture>' : '<img alt="">';
  const comparison = root.querySelector<HTMLElement>('.fighter-comparison')!;
  comparison.innerHTML = `
    <div class="fighter-hero">${artwork}<div><small data-role></small><h2></h2><p></p></div></div>
    ${faceoff ? `<div class="fighter-rival">${artwork}<h2></h2></div>` : ''}
    <div class="fighter-stat-sheet"><div class="fighter-stat-heading"><span class="menu-kicker">Fighter comparison</span>
      <button type="button" class="menu-quiet" id="fighter-compare-next" title="Cycle comparison fighter">Next fighter ▸</button></div>
      <div data-comparison-values aria-live="polite"></div>
    </div>`;
  const hero = comparison.querySelector('.fighter-hero')!;
  const values = comparison.querySelector<HTMLElement>('[data-comparison-values]')!;
  const next = comparison.querySelector<HTMLButtonElement>('#fighter-compare-next')!;
  next.disabled = roster.length < 2;
  function updateArtwork(panel: Element, id: string): void {
    const image = panel.querySelector('img')!;
    const portrait = faceoff ? selectionPortrait(id, 'hero') : fighterPortrait(id);
    const source = panel.querySelector('source');
    const idle = Object.hasOwn(FIGHTER_PRESENTATION, id)
      ? (import.meta.env.BASE_URL || '/') + 'menu-art/' + id + '-select-idle.webp'
      : '';
    if (source && source.getAttribute('srcset') !== idle) source.setAttribute('srcset', idle);
    if (image.getAttribute('src') !== portrait) image.src = portrait;
  }
  function render(): void {
    if (!current || !reference) return;
    const info = FIGHTER_PRESENTATION[current.id];
    updateArtwork(hero, current.id);
    hero.querySelector('[data-role]')!.textContent = info?.role ?? '';
    hero.querySelector('h2')!.textContent = current.displayName;
    hero.querySelector('p')!.textContent = info?.pitch ?? '';
    const rival = comparison.querySelector('.fighter-rival');
    if (rival) {
      updateArtwork(rival, reference.id);
      rival.querySelector('h2')!.textContent = reference.displayName;
    }
    const ids = [current.id, reference.id];
    const stats = ids.map(id => Object.hasOwn(CHARACTER_REGISTRY, id) ? CHARACTER_REGISTRY[id as CharacterId] : undefined);
    values.innerHTML = `<table><caption class="menu-visually-hidden">Fighter gameplay stats</caption><thead><tr><th scope="col">Stat</th>
      <th scope="col">${escapeHtml(current.displayName)}</th><th scope="col">${escapeHtml(reference.displayName)}</th></tr></thead>
      <tbody>${metrics.map(({label,key,decimals}) => {
        const max = Math.max(1, ...Object.values(CHARACTER_REGISTRY).map(entry => entry[key] ?? 0));
        const cells = stats.map(entry => {
          const value = entry?.[key];
          if (value === undefined) return '<td>—</td>';
          return `<td><b>${value.toFixed(decimals)}</b><span class="fighter-stat-meter" aria-hidden="true" style="--fill:${value / max * 100}%"></span></td>`;
        });
        return `<tr><th scope="row">${label}</th>${cells.join('')}</tr>`;
      }).join('')}</tbody></table>
      ${info ? `<p class="fighter-tradeoff"><span><b>Strength</b> ${escapeHtml(info.strength)}</span><span><b>Tradeoff</b> ${escapeHtml(info.trade)}</span></p>` : ''}`;
  }
  function cycle(delta = 1): void {
    if (roster.length < 2) return;
    const index = reference ? roster.indexOf(reference) : 0;
    const nextIndex = (index + delta + roster.length) % roster.length;
    const nextFighter = roster[nextIndex];
    reference = nextFighter?.id === current?.id
      ? roster[(nextIndex + delta + roster.length) % roster.length]
      : nextFighter;
    render();
  }
  next.addEventListener('click', () => cycle());
  render();
  return { next, cycle, show(fighter: FighterChoice, opponent?: FighterChoice) { current = fighter; if (opponent) reference = opponent; render(); } };
}
