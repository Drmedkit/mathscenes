// gallery.ts: every block with live sliders for its params and a progress slider (all build steps, one after another).
// Invalid params show the block's own validation message instead of a drawing.
import { begin } from '../src/core/draw';
import { sweep } from '../src/core/clock';
import { type Theme, THEMES } from '../src/core/theme';
import { onTexLoad, texReady } from '../src/core/tex';
import {
  type Block, type ParamSpec, frame, tryBlock,
  RatioTable, RATIO_TABLE_DEMO, ratioDemoParams,
  DoubleNumberLine, DNL_DEMO, dnlDemoParams,
  EquationMorph, EQM_DEMO, ratioFix,
  RatioGraph, GRAPH_DEMO, graphDemoParams,
  RatioTiles, TILES_DEMO, tilesDemoParams,
} from '../src/blocks';
import { el, initialTheme, liveCanvas, rememberTheme, tween } from './common';

interface CardDef<V extends Record<string, number>> {
  title: string; sub: string; w: number; h: number;
  specs: readonly ParamSpec<V>[]; init: V;
  make(v: V, th: Theme): Block<string>;
}

let theme = initialTheme();
const redraws: (() => void)[] = [];

function card<V extends Record<string, number>>(def: CardDef<V>): void {
  const v = { ...def.init };
  let u = 1;
  const cv = el('canvas'), err = el('div', { class: 'err' }), stepLab = el('output');
  const ctl = el('div', { class: 'ctl' });
  for (const s of def.specs) {
    const out = el('output', {}, String(v[s.key]));
    const inp = el('input', { type: 'range', min: String(s.min), max: String(s.max), step: String(s.step), value: String(v[s.key]) });
    inp.addEventListener('input', () => { (v as Record<string, number>)[s.key] = Number(inp.value); out.textContent = inp.value; rebuild(); });
    ctl.append(el('label', {}, s.label, out, inp));
  }
  const prog = el('input', { type: 'range', min: '0', max: '1', step: '0.001', value: '1' });
  const play = el('button', {}, 'play');
  let stop: (() => void) | null = null;
  prog.addEventListener('input', () => { stop?.(); u = Number(prog.value); paint(); });
  play.addEventListener('click', () => {
    stop?.();
    const n = block && 'steps' in block ? block.steps.length : 6;
    stop = tween(0.8 * n, p => { u = p; prog.value = String(p); paint(); });
  });
  ctl.append(el('div', { class: 'prog' }, el('label', {}, 'progress', stepLab, prog), play));
  document.getElementById('cards')!.append(
    el('section', { class: 'card' }, el('h2', {}, def.title), el('p', { class: 'sub' }, def.sub),
      el('div', { class: 'row' }, el('div', { class: 'stage' }, cv, err), ctl)));

  let block: Block<string> | null = null;
  function rebuild() {
    const r = tryBlock(() => def.make(v, theme));
    block = r.ok ? r.value : null;
    err.textContent = r.ok ? '' : r.error;
    err.classList.toggle('on', !r.ok);
    paint();
  }
  function paint() {
    const c = liveCanvas(cv, theme, def.w, def.h);
    begin(c);
    if (!block) return;
    const p = sweep(block.steps, u);
    const cur = block.steps.filter(s => p.k(s) > 0 && p.k(s) < 1);
    stepLab.textContent = cur.length ? cur.join(', ') : u >= 1 ? 'done' : '';
    block.draw(c, p);
  }
  redraws.push(rebuild);
  rebuild();
}

type RTV = { a: number; b: number; rows: number; highlight: number; consecutive: number; kColumn: number };
type DNV = { a: number; b: number; count: number; unitRate: number; target: number };
type EQV = { a: number; b: number; add: number; factor: number };
type GRV = { a: number; b: number; multiples: number; add: number; stairs: number };
type TIV = { a: number; b: number; groups: number; size: number };

await texReady();
card<RTV>({
  title: 'RatioTable', sub: 'rows a·k : b·k (exact), ×k arrows on both sides, row-by-row build, highlight a row. Try a = 0, 10 rows, or a highlight past the end.',
  w: 1400, h: 900, specs: RATIO_TABLE_DEMO.specs,
  init: { a: 2, b: 3, rows: 3, highlight: 2, consecutive: 0, kColumn: 0 },
  make: (v, th) => RatioTable(ratioDemoParams(v), frame(40, 30, 1320, 840), th),
});
card<DNV>({
  title: 'DoubleNumberLine', sub: 'two aligned lines, a : b per unit, the unit rate boxed, ×n arcs, a target with its answer. Try many units (labels would overlap) or a target past the end.',
  w: 1920, h: 900, specs: DNL_DEMO.specs,
  init: { a: 2, b: 3, count: 4, unitRate: 1, target: 5 },
  make: (v, th) => DoubleNumberLine(dnlDemoParams(v), frame(40, 30, 1840, 840), th),
});
card<EQV>({
  title: 'EquationMorph', sub: 'TeX A → B with matched parts: the wrong “+n” is struck and morphs into “×k”; results that change morph (5 → 6). Try a = b (adding keeps the ratio: nothing to strike) or times 1.',
  w: 1600, h: 420, specs: EQM_DEMO.specs, init: { ...EQM_DEMO.params },
  make: (v, th) => EquationMorph(ratioFix({ ...v, roles: ['first', 'second'], accent: 'link' }), frame(40, 40, 1520, 340), th),
});
card<GRV>({
  title: 'RatioGraph', sub: 'a : b as a line through zero: rectangles from the origin keep their shape, their corners are the points; a+n : b+n falls off the line (gap shown), the unit rate (1, b/a) and n unit steps land on the line. Try a = 0, or so many points that the labels would collide.',
  w: 1920, h: 1080, specs: GRAPH_DEMO.specs,
  init: { a: 2, b: 3, multiples: 3, add: 2, stairs: 4 },
  make: (v, th) => RatioGraph(graphDemoParams(v), frame(80, 60, 1760, 960), th),
});
card<TIV>({
  title: 'RatioTiles', sub: 'a : b as unit tiles: read it (for every a … b), close it into one group, copy the group (a stack of equivalent totals), turn it into a bar (the whole a+b, parts a/(a+b), b/(a+b)). Try 8 + 7 tiles, 7 groups or huge tiles.',
  w: 1600, h: 1000, specs: TILES_DEMO.specs, init: { ...TILES_DEMO.params },
  make: (v, th) => RatioTiles(tilesDemoParams(v), frame(60, 40, 1480, 920), th),
});

const btn = document.getElementById('theme') as HTMLButtonElement;
const applyTheme = () => { rememberTheme(theme); btn.textContent = `theme: ${theme.name}`; redraws.forEach(f => f()); };
btn.addEventListener('click', () => { theme = theme.name === 'ink' ? THEMES.paper : THEMES.ink; applyTheme(); });
applyTheme();
onTexLoad(() => redraws.forEach(f => f()));
window.addEventListener('resize', () => redraws.forEach(f => f()));
(window as unknown as { galleryReady: boolean }).galleryReady = true;
