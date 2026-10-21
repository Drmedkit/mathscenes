// Counters: two-color counters on a felt mat, the concrete model of integer × and ÷ (TEKS 6.3C/D).
//   + counter = +1 (yellow, a plus mark), − counter = −1 (rose, a minus mark); a zero pair (+ over −) is worth 0.
//   put      3 × (−4): put IN 3 groups of 4 negatives                      → −12
//   remove   (−3) × 4: the mat starts at 0, so seed zero pairs first, then take OUT 3 groups of 4 positives → −12
//   split    −12 ÷ 3: share −12 into 3 equal groups → −4 each;  −12 ÷ (−4): how many groups of −4 → 3
// Groups are drawn in dashed frames; removed groups are lifted and faded. computeMat() counts the value of what is
// left counter by counter. Pure layout inside a Frame, throws BlockError when the counters would not fit.
import { type Box, box, clamp, unionBox } from '../../../core/math';
import { rectPts, circlePts } from '../../../core/pts';
import { type Canvas, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Theme, paint } from '../../../core/theme';
import { type Frame, check } from '../../../blocks/block';
import { drawWords, wordsBox } from '../../words';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';

export interface CounterGroup { counters: number[]; removed?: boolean; frame?: boolean; label?: string }
export interface CounterParams { groups: CounterGroup[]; caption: string }
export type MatStep = 'mat' | 'counters' | 'frames' | 'remove';
export interface MatBlock {
  readonly kind: 'Counters';
  readonly value: number;
  readonly where: { mat: Box; group(i: number): Box; left: Box };
  draw(c: Canvas, p: Progress<MatStep>): void;
}
const NAME = 'Counters';
const R = 27, STEP = 66, GAP = 40, ROWS = 2;
export const POS = '#F2C14E', NEG = '#C2689A';

/** the value left on the mat (removed groups do not count) */
export function computeMat(groups: readonly CounterGroup[]): number {
  let v = 0;
  for (const g of groups) { if (g.removed) continue; for (const x of g.counters) { check(x === 1 || x === -1, NAME, 'a counter is +1 or −1'); v += x; } }
  return v;
}
const colsOf = (n: number) => Math.max(1, Math.ceil(n / ROWS));
/** do the groups fit (one or two lines of groups inside a 940 px frame)? */
export function matFits(groups: readonly CounterGroup[], width = 880): boolean {
  let line = 0, lines = 1;
  for (const g of groups) {
    const w = colsOf(g.counters.length) * STEP + 20;
    if (line > 0 && line + GAP + w > width) { lines++; line = w; } else line += (line > 0 ? GAP : 0) + w;
    if (w > width) return false;
  }
  return lines <= 3;
}

export function Counters(p: CounterParams, fr: Frame, th: Theme): MatBlock {
  const value = computeMat(p.groups);
  check(matFits(p.groups, fr.w - 60), NAME, 'too many counters for the mat');
  // lay out the groups in lines, centred
  const lines: number[][] = [[]];
  let lw = 0;
  const widths = p.groups.map(g => colsOf(g.counters.length) * STEP + 20);
  p.groups.forEach((_, i) => {
    const w = widths[i]!;
    if (lw > 0 && lw + GAP + w > fr.w - 60) { lines.push([]); lw = 0; }
    lines[lines.length - 1]!.push(i); lw += (lw > 0 ? GAP : 0) + w;
  });
  const lineH = ROWS * STEP + 70;
  const totalH = lines.length * lineH;
  const top = fr.y + 120 + (fr.h - 300 - totalH) / 2;
  const boxes: Box[] = [];
  const centres: [number, number][][] = [];
  lines.forEach((ids, li) => {
    const w = ids.reduce((s, i) => s + widths[i]!, 0) + GAP * (ids.length - 1);
    let x = fr.x + (fr.w - w) / 2;
    const y0 = top + li * lineH + 30;
    for (const i of ids) {
      const g = p.groups[i]!, cols = colsOf(g.counters.length), rows = Math.min(ROWS, g.counters.length);
      const B = box(x, y0, x + widths[i]!, y0 + rows * STEP + 20);
      boxes[i] = B;
      // column-major: a zero pair (+, −) stays one above the other
      centres[i] = g.counters.map((_, k) => [B.x0 + 10 + STEP / 2 + Math.floor(k / ROWS) * STEP, B.y0 + 10 + STEP / 2 + (k % ROWS) * STEP] as [number, number]);
      void cols;
      x += widths[i]! + GAP;
    }
  });
  const mat = box(fr.x + 20, fr.y + 100, fr.x + fr.w - 20, fr.y + fr.h - 150);
  const kept = p.groups.map((g, i) => (g.removed ? null : boxes[i]!)).filter((b): b is Box => !!b);
  const left = kept.length ? unionBox(kept) : box(mat.cx - 40, mat.cy - 40, mat.cx + 40, mat.cy + 40);
  const capBox = wordsBox(p.caption, fr.x + 30, fr.y + 52, { size: 46 });
  check(capBox.x1 <= fr.x + fr.w + 60, NAME, 'the caption is too long');
  for (const g of p.groups) if (g.label) check(wordsBox(g.label, 0, 0, { size: 44 }).w <= colsOf(g.counters.length) * STEP + 120, NAME, `the label "${g.label}" is wider than its group`);

  function counter(c: Canvas, x: number, y: number, s: number, k: number): void {
    if (k <= 0) return;
    withAlpha(c, k, () => {
      wash(c, circlePts(x, y, R, 36), s > 0 ? POS : NEG, { seed: Math.round(x * 3 + y), ink: DUSK.ink, inkW: 2.5, shade: 0.3, rough: 0.9 });
      inkLine(c, [[x - 11, y], [x + 11, y]], { col: DUSK.ink, w: 5, seed: 7, rough: 0.2 });
      if (s > 0) inkLine(c, [[x, y - 11], [x, y + 11]], { col: DUSK.ink, w: 5, seed: 8, rough: 0.2 });
    });
  }
  function draw(c: Canvas, P: Progress<MatStep>): void {
    const kM = P.k('mat'), kC = P.k('counters'), kF = P.k('frames'), kR = P.k('remove');
    if (kM > 0) withAlpha(c, E.smooth(kM), () => {
      wash(c, rectPts(mat.x0, mat.y0, mat.w, mat.h, 26), '#2D5446', { seed: 61, ink: DUSK.ink, inkW: 3, shade: 0.35, rough: 1.8 });
      drawWords(c, p.caption, fr.x + 30, fr.y + 52, 'dim', 1, { size: 46 });
    });
    const n = p.groups.length;
    p.groups.forEach((g, i) => {
      const B = boxes[i]!;
      const kg = clamp(kC * (n + 1) - i);
      const lift = g.removed ? -40 * E.smooth(kR) : 0, fade = g.removed ? 1 - 0.7 * E.smooth(kR) : 1;
      c.g.save(); c.g.translate(0, lift); c.g.globalAlpha *= fade;
      if ((g.frame ?? true) && kF > 0) {
        const { g: gg } = c;
        gg.save(); gg.setLineDash([12, 9]); gg.globalAlpha *= E.smooth(kF) * 0.85; gg.lineWidth = 3;
        gg.strokeStyle = paint(th, g.removed ? 'dim' : 'second', 'line');
        gg.beginPath(); gg.roundRect(B.x0, B.y0, B.w, B.h, 16); gg.stroke(); gg.restore();
        if (g.label) drawWords(c, g.label, B.cx, B.y1 + 34, g.removed ? 'dim' : 'second', E.smooth(kF), { size: 44, align: 'center' });
      }
      g.counters.forEach((s, k) => { const [x, y] = centres[i]![k]!; counter(c, x, y, s, E.smooth(clamp(kg * 1.5 - k / Math.max(1, g.counters.length) * 0.5))); });
      c.g.restore();
    });
  }
  return { kind: 'Counters', value, where: { mat, group: i => boxes[i]!, left }, draw };
}
