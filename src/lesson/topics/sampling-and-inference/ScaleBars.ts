// ScaleBars: the model of "the sample's share, scaled up to the population". Two bars of the SAME length: the sample
// (teal outline, its n members) on top and the whole population (amber outline) below. The counted category is the
// same share of both bars (lime), so the picture says "the population is predicted to split like the sample";
// a curved arrow on the right carries the scale factor (x 20, x 15.2). Other categories (the complement, a third
// answer) are further segments with their own colours.
// Steps: top, bottom, shade (the population bar takes the sample's split), factor (the arrow), nums (the
// population numbers). Numbers >= 60 px sit UNDER their segment, never on a line; labels 46 px above each bar.
import { type Box, type Pt, box, clamp, lerp, unionBox } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas, arrow, fillPts, strokePts } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint, rgba } from '../../../core/theme';
import { type Frame, check } from '../../../blocks/block';
import { inkLine, wash } from '../../wash';
import { drawWords, wordsBox } from '../../words';
import { DUSK } from '../../dusk';

export interface ScaleSeg { share: number; col: Paint; top?: string; bottom?: string }
export interface ScaleBarsParams {
  /** e.g. 'sample: 40 students' (teal) */
  topLabel: string;
  /** e.g. 'all 800 students' (amber) */
  bottomLabel: string;
  segs: ScaleSeg[];
  /** the factor on the arrow, e.g. '×20' (omit: no arrow) */
  factor?: string;
  /** unit ticks on the sample bar (one per member) when n is small */
  ticks?: number;
}
export type ScaleBarsStep = 'top' | 'bottom' | 'shade' | 'factor' | 'nums';
export interface ScaleBarsBlock {
  readonly kind: 'ScaleBars';
  readonly box: Box;
  readonly where: { top: Box; bottom: Box; topSegs: Box[]; bottomSegs: Box[]; topNums: (Box | null)[]; bottomNums: (Box | null)[]; factor: Box | null; topLabel: Box; bottomLabel: Box };
  draw(c: Canvas, p: Progress<ScaleBarsStep>, f?: { pTop?: number; pBottom?: number; focusSeg?: number }): void;
}

const NAME = 'ScaleBars';
const LAB = 46, NUM = 62, BAR_H = 104;

export function ScaleBars(P: ScaleBarsParams, fr: Frame, th: Theme): ScaleBarsBlock {
  const tot = P.segs.reduce((a, s) => a + s.share, 0);
  check(Math.abs(tot - 1) < 1e-9, NAME, `the shares add up to ${tot}, not 1`);
  check(P.segs.every(s => s.share > 0), NAME, 'every share must be positive');
  const H = 46 + BAR_H + 86 + 150 + 46 + BAR_H + 86;
  check(H <= fr.h, NAME, `the bars need ${H} px, the frame has ${fr.h}`);
  const y0 = fr.y + (fr.h - H) / 2;
  const fw = P.factor ? wordsBox(P.factor, 0, 0, { size: NUM, weight: 650 }).w : 0;
  const bx0 = fr.x + 30, bx1 = fr.x + fr.w - (P.factor ? fw + 112 : 30);
  check(bx1 - bx0 >= 520, NAME, `the factor "${P.factor}" leaves too short a bar`);
  const topLabel = wordsBox(P.topLabel, bx0, y0 + 20, { size: LAB });
  const top = box(bx0, y0 + 46, bx1, y0 + 46 + BAR_H);
  const ty = top.y1 + 48;
  const bottomLabel = wordsBox(P.bottomLabel, bx0, ty + 150 + 20 - 4 + 40, { size: LAB });
  const bottom = box(bx0, bottomLabel.cy + 26, bx1, bottomLabel.cy + 26 + BAR_H);
  const by = bottom.y1 + 48;
  for (const L of [topLabel, bottomLabel]) check(L.x1 <= fr.x + fr.w, NAME, 'a bar label is too long');
  const segBoxes = (B: Box) => { let x = B.x0; return P.segs.map(s => { const w = s.share * B.w; const b = box(x, B.y0, x + w, B.y1); x += w; return b; }); };
  const topSegs = segBoxes(top), bottomSegs = segBoxes(bottom);
  const nums = (segs: Box[], y: number, which: 'top' | 'bottom') => P.segs.map((s, i) => (s[which] ? wordsBox(s[which]!, segs[i]!.cx, y, { size: NUM, weight: 650, align: 'center' }) : null));
  const topNums = nums(topSegs, ty, 'top'), bottomNums = nums(bottomSegs, by, 'bottom');
  for (const row of [topNums, bottomNums]) {
    const bs = row.filter((b): b is Box => !!b);
    for (let i = 1; i < bs.length; i++) check(bs[i]!.x0 - bs[i - 1]!.x1 >= 18, NAME, 'two segment numbers touch: a share is too small to label');
    for (const b of bs) check(b.x0 >= fr.x - 10 && b.x1 <= bx1 + 60, NAME, 'a segment number runs off the bar');
  }
  let factorB: Box | null = null;
  const arrowPts: Pt[] = [];
  if (P.factor) {
    const ax = bx1 + 22, a0: Pt = [ax, top.cy], a1: Pt = [ax, bottom.cy];
    for (let i = 0; i <= 24; i++) { const t = i / 24; arrowPts.push([ax + Math.sin(Math.PI * t) * 70, lerp(a0[1], a1[1], t)]); }
    factorB = wordsBox(P.factor, ax + 82, (top.cy + bottom.cy) / 2, { size: NUM, weight: 650 });
    check(factorB.x1 <= fr.x + fr.w + 40, NAME, `the factor "${P.factor}" does not fit`);
  }
  if (P.ticks !== undefined) check(top.w / P.ticks >= 7, NAME, `${P.ticks} unit ticks are too dense`);
  const all = unionBox([topLabel, top, bottom, ...(factorB ? [factorB] : []), ...bottomNums.filter((b): b is Box => !!b)]);

  function bar(c: Canvas, B: Box, segs: Box[], outline: Paint, kFill: number, k: number, seed: number, focus?: number): void {
    if (k <= 0) return;
    const g = c.g;
    g.save(); g.globalAlpha *= clamp(k);
    wash(c, rectPts(B.x0, B.y0, B.w, B.h, 10), '#2A2E5C', { seed, rough: 1.4, ink: null, shade: 0.12 });
    if (kFill > 0) segs.forEach((s, i) => {
      const w = s.w * E.out(clamp(kFill * 1.4 - i * 0.2));
      if (w <= 0) return;
      const col = P.segs[i]!.col;
      wash(c, rectPts(s.x0, s.y0, w, s.h, 4), paint(th, col, 'fill'), { seed: seed + 3 + i, rough: 1.2, ink: null, shade: 0.15, alpha: focus === undefined || focus === i ? 1 : 0.55 });
    });
    for (let i = 1; i < segs.length; i++) if (kFill > 0.3) inkLine(c, [[segs[i]!.x0, B.y0], [segs[i]!.x0, B.y1]], { col: DUSK.ink, w: 3.5, seed: seed + 9 + i });
    inkLine(c, rectPts(B.x0, B.y0, B.w, B.h, 10), { col: outline, w: 4.5, closed: true, seed: seed + 1 });
    g.restore();
  }
  function draw(c: Canvas, p: Progress<ScaleBarsStep>, f: { pTop?: number; pBottom?: number; focusSeg?: number } = {}): void {
    const g = c.g;
    const kT = p.k('top'), kB = p.k('bottom'), kS = p.k('shade'), kF = p.k('factor'), kN = p.k('nums');
    const glowLabel = (L: Box, col: Paint, k: number) => { if (k <= 0) return; g.save(); g.globalAlpha *= k * 0.5; g.fillStyle = rgba(paint(th, col, 'fill'), 0.35); g.fillRect(L.x0 - 10, L.y0 - 6, L.w + 20, L.h + 12); g.restore(); };
    if (kT > 0) {
      glowLabel(topLabel, 'second', f.pTop ?? 0);
      drawWords(c, P.topLabel, topLabel.x0, topLabel.cy, 'second', kT, { size: LAB });
      bar(c, top, topSegs, 'second', kT, kT, 51, f.focusSeg);
      if (P.ticks && kT > 0.5) {
        const n = P.ticks;
        for (let i = 1; i < n; i++) { const x = top.x0 + (top.w * i) / n; strokePts(c, [[x, top.y1 - 16], [x, top.y1]], { col: DUSK.ink, lw: 2, alpha: clamp(kT * 2 - 1) }); }
      }
      P.segs.forEach((s, i) => { if (s.top && topNums[i]) drawWords(c, s.top, topNums[i]!.cx, ty, s.col, clamp(kT * 2 - 0.6), { size: NUM, weight: 650, align: 'center' }); });
    }
    if (kB > 0) {
      glowLabel(bottomLabel, 'first', f.pBottom ?? 0);
      drawWords(c, P.bottomLabel, bottomLabel.x0, bottomLabel.cy, 'first', kB, { size: LAB });
      bar(c, bottom, bottomSegs, 'first', kS, kB, 61, f.focusSeg);
      if (kN > 0) P.segs.forEach((s, i) => { if (s.bottom && bottomNums[i]) drawWords(c, s.bottom, bottomNums[i]!.cx, by, s.col, kN, { size: NUM, weight: 650, align: 'center' }); });
    }
    if (P.factor && kF > 0) {
      arrow(c, arrowPts, E.inOut(clamp(kF)), { col: 'link', lw: 4.5, head: 18 });
      drawWords(c, P.factor, factorB!.x0, factorB!.cy, 'link', clamp(kF * 2 - 0.8), { size: NUM, weight: 650 });
    }
    void fillPts;
  }
  return { kind: 'ScaleBars', box: all, where: { top, bottom, topSegs, bottomSegs, topNums, bottomNums, factor: factorB, topLabel, bottomLabel }, draw };
}
