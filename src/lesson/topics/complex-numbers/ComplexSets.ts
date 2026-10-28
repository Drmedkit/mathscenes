// ComplexSets: the number-set picture of `number-properties` (SetMap: counting ⊂ whole ⊂ integers ⊂ rational,
// irrational beside, together the reals) extended with the complex numbers. One outer region "Complex numbers" holds
// the SetMap (the reals, b = 0) and, beside it, the non-real numbers (b ≠ 0) with the purely imaginary ones
// (a = 0, b ≠ 0) in a region of their own. A number sits in the innermost region that holds it.
// Steps: 'complex', the SetMap steps ('real', 'rational', 'integer', 'whole', 'counting', 'irrational'), 'nonreal',
// 'imag', and t0 … tn (each number drops in). Focus: rings on regions, glows on numbers.
// Reuses SetMap read-only (number-properties). Could move to the kit with SetMap.
import { type Box, box, clamp } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import type { Canvas } from '../../../core/draw';
import { E } from '../../../core/easing';
import { type Progress, progressOf } from '../../../core/clock';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { type Formula, tex, texBox, texDraw } from '../../../core/tex';
import { type Frame, check, frame } from '../../../blocks/block';
import { drawWords, wordsBox } from '../../words';
import { inkLine, wash } from '../../wash';
import { SetMap, type MapStep } from '../number-properties/SetMap';
import type { Region } from './common';

export interface SetsToken { tex: string; at: Region }
export type SetsRegion = Region | 'real' | 'complex';
export interface SetsFocus { rings?: readonly { at: SetsRegion; col: Paint; k: number }[]; glows?: readonly { i: number; col: Paint; k: number }[] }
export interface SetsBlock {
  readonly kind: 'ComplexSets';
  readonly where: { region(r: SetsRegion): Box; token(i: number): Box };
  draw(c: Canvas, P: Progress<string>, f?: SetsFocus): void;
}
const NAME = 'ComplexSets';
const LAB = 46, NUM = 62;
const REAL = new Set<Region>(['counting', 'whole', 'integer', 'rational', 'irrational']);

export function ComplexSets(tokens: readonly SetsToken[], fr: Frame, th: Theme): SetsBlock {
  const outer = box(fr.x, fr.y, fr.x + fr.w, fr.y + fr.h);
  const setW = Math.round(fr.w * 0.64);
  const mapFr = frame(fr.x + 24, fr.y + 74, setW, fr.h - 98);
  const realIdx = tokens.map((t, i) => (REAL.has(t.at) ? i : -1)).filter(i => i >= 0);
  const map = SetMap({ tokens: realIdx.map(i => ({ tex: tokens[i]!.tex, at: tokens[i]!.at as never })) }, mapFr, th);
  const nr = box(mapFr.x + mapFr.w + 22, mapFr.y, outer.x1 - 24, outer.y1 - 24);
  const im = box(nr.x0 + 22, nr.y0 + Math.round(nr.h * 0.42), nr.x1 - 22, nr.y1 - 22);
  check(nr.w >= 300, NAME, 'the non-real column is too narrow');
  const nrName = 'Non-real (b ≠ 0)', imName = ['Purely', 'imaginary'];
  check(wordsBox(nrName, nr.x0 + 18, nr.y0 + 36, { size: 44 }).x1 <= nr.x1 - 8, NAME, 'the non-real name does not fit');
  // slots: the non-real numbers above the purely imaginary region, the purely imaginary ones inside it
  const F = tokens.map(t => tex(t.tex) as Formula);
  const pos: [number, number][] = new Array(tokens.length);
  const place = (ids: number[], b: Box, top: number) => {
    const gap = Math.min(130, (b.y1 - 50 - top) / Math.max(1, ids.length));
    ids.forEach((id, j) => { pos[id] = [b.cx, top + gap * (j + 0.5)]; });
  };
  place(tokens.map((t, i) => (t.at === 'nonreal' ? i : -1)).filter(i => i >= 0), box(nr.x0, nr.y0, nr.x1, im.y0), nr.y0 + 70);
  place(tokens.map((t, i) => (t.at === 'imag' ? i : -1)).filter(i => i >= 0), im, im.y0 + 120);
  const own = (i: number) => (tokens[i]!.at === 'imag' ? im : box(nr.x0, nr.y0, nr.x1, im.y0));
  const tb = (i: number): Box => (REAL.has(tokens[i]!.at) ? map.where.token(realIdx.indexOf(i)) : texBox(F[i]!, pos[i]![0], pos[i]![1], { size: NUM, align: 'center' }));
  tokens.forEach((t, i) => {
    if (REAL.has(t.at)) return;
    const b = tb(i), o = own(i);
    check(b.x0 >= o.x0 + 6 && b.x1 <= o.x1 - 6 && b.y0 >= o.y0 + 50 && b.y1 <= o.y1 - 6, NAME, `${t.tex} does not fit its region`);
  });
  const regionBox = (r: SetsRegion): Box => (r === 'complex' ? outer : r === 'nonreal' ? nr : r === 'imag' ? im : map.where.region(r as never));

  function ring(c: Canvas, b: Box, col: Paint, k: number): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k); g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = 6;
    g.shadowColor = paint(th, col, 'fill'); g.shadowBlur = 16 * th.glow * Math.hypot(g.getTransform().a, g.getTransform().b);
    g.beginPath(); g.roundRect(b.x0 - 4, b.y0 - 4, b.w + 8, b.h + 8, 28); g.stroke(); g.restore();
  }
  function region(c: Canvas, b: Box, fill: string, k: number, seed: number, name: string[], hot: Paint | null): void {
    if (k <= 0) return;
    const a = E.smooth(clamp(k)), P = rectPts(b.x0, b.y0, b.w, b.h, 26);
    wash(c, P, fill as never, { seed, rough: 1.4, ink: null, alpha: a, shade: 0.1 });
    inkLine(c, P, { col: '#8A90C4', w: 3, closed: true, seed: seed + 1, alpha: a, rough: 0.8 });
    name.forEach((t, j) => drawWords(c, t, b.x0 + 18, b.y0 + 36 + j * 50, hot ?? 'dim', a, { size: 44 }));
  }
  function draw(c: Canvas, P: Progress<string>, f: SetsFocus = {}): void {
    const hot = (r: SetsRegion) => (f.rings ?? []).find(x => x.at === r && x.k > 0.3)?.col ?? null;
    const kC = P.k('complex');
    if (kC > 0) {
      const Po = rectPts(outer.x0, outer.y0, outer.w, outer.h, 30), a = E.smooth(clamp(kC));
      wash(c, Po, '#171B3E' as never, { seed: 280, rough: 1.4, ink: null, alpha: a, shade: 0.1 });
      inkLine(c, Po, { col: '#A3A9DA', w: 3.5, closed: true, seed: 281, alpha: a, rough: 0.8 });
      drawWords(c, 'Complex numbers', outer.x0 + 24, outer.y0 + 40, hot('complex') ?? 'ink', a, { size: LAB });
    }
    // the reals: SetMap with its own tokens t0.. mapped to ours
    const PM = progressOf<MapStep>(s => (s.startsWith('t') ? P.k('t' + realIdx[Number(s.slice(1))]) : P.k(s)));
    map.draw(c, PM, {
      rings: (f.rings ?? []).filter(r => REAL.has(r.at as Region) || r.at === 'real').map(r => ({ at: r.at as never, col: r.col, k: r.k })),
      glows: (f.glows ?? []).filter(g => realIdx.includes(g.i)).map(g => ({ i: realIdx.indexOf(g.i), col: g.col, k: g.k })),
    });
    region(c, nr, '#2E2552', P.k('nonreal'), 340, [nrName], hot('nonreal'));
    region(c, im, '#3A2D63', P.k('imag'), 350, imName, hot('imag'));
    for (const r of f.rings ?? []) if (['complex', 'nonreal', 'imag'].includes(r.at)) ring(c, regionBox(r.at), r.col, r.k);
    tokens.forEach((t, i) => {
      if (REAL.has(t.at)) return;
      const ki = E.smooth(clamp(P.k(`t${i}`)));
      if (ki <= 0) return;
      const gl = (f.glows ?? []).find(g => g.i === i && g.k > 0);
      texDraw(c, F[i]!, pos[i]![0], pos[i]![1] - (1 - ki) * 40, { size: NUM, align: 'center', k: ki, col: gl && gl.k > 0.3 ? gl.col : 'ink', glow: (gl?.k ?? 0) * 0.9 });
    });
  }
  return { kind: 'ComplexSets', where: { region: regionBox, token: tb }, draw };
}
