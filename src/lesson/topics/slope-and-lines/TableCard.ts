// TableCard: an input-output table as a painted card, the second model of this topic (tables of a relationship).
//   card     the card, its column heads (input amber, output teal, a third column dim, e.g. y/x)
//   rows     the rows (numbers 60 px); hl:<i> a lavender band behind row i (the rows a step uses)
//   gap:<k>  a change bracket between row i and row j: the input change on the left (amber), the output change on
//            the right (teal), labels beside the bracket tips (never on a line); brackets stack when spans overlap
//   col:2    the third column fades in (y/x worked out on a miss)
// Pure layout in a Frame; throws (BlockError) when the rows or the bracket labels do not fit.
import { type Box, type Pt, box, clamp, boxesOverlap, padBox } from '../../../core/math';
import { type Canvas, drawOn, withAlpha, arrow } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import type { Role, Theme } from '../../../core/theme';
import { type Frame, check, hitsLines } from '../../../blocks/block';
import { rectPts } from '../../../core/pts';
import { drawWords, wordsBox } from '../../words';
import { wash, inkLine } from '../../wash';
import { approxWidth } from './SlopeGrid';

const NAME = 'TableCard';
export interface TableGap { i: number; j: number; dx?: string; dy?: string }
export interface TableParams { heads: string[]; rows: string[][]; gaps?: TableGap[] }
export interface TableBlock {
  readonly kind: 'TableCard';
  readonly box: Box;
  readonly steps: string[];
  readonly where: { row(i: number): Box; cell(i: number, j: number): Box; card: Box };
  draw(c: Canvas, p: Progress<string>, f?: { rings?: { b: Box; col: Role; k: number }[] }): void;
}
const NUM = 60, HEAD = 46, LAB = 54;
const measure = (text: string, size: number): number => (typeof document === 'undefined' ? approxWidth(text, size) : wordsBox(text, 0, 0, { size }).w);

export function TableCard(p: TableParams, fr: Frame, _th: Theme): TableBlock {
  const nc = p.heads.length, nr = p.rows.length;
  check(nc >= 2 && nc <= 3, NAME, 'a table has 2 or 3 columns');
  check(nr >= 2 && p.rows.every(r => r.length === nc), NAME, 'every row needs one cell per column');
  const colW = p.heads.map((h, j) => Math.max(190, measure(h, HEAD) + 64, ...p.rows.map(r => measure(r[j]!, NUM) + 70)));
  const headH = 92, rowH = Math.min(100, (fr.h - headH - 40) / nr);
  check(rowH >= 78, NAME, 'too many rows to read');
  const cardW = colW.reduce((a, b) => a + b, 0), cardH = headH + rowH * nr;
  // bracket levels: a gap takes the lowest level whose spans it does not overlap
  const gaps = (p.gaps ?? []).map(g => ({ ...g, lo: Math.min(g.i, g.j), hi: Math.max(g.i, g.j), level: 0 }));
  for (const g of gaps) {
    check(g.lo >= 0 && g.hi < nr && g.lo !== g.hi, NAME, 'a change bracket joins two different rows');
    let l = 0; while (gaps.some(o => o !== g && o.level === l && gaps.indexOf(o) < gaps.indexOf(g) && o.lo < g.hi && g.lo < o.hi)) l++;
    g.level = l;
  }
  const bulge = (l: number) => 46 + l * 44;
  const labW = (side: 'dx' | 'dy') => Math.max(0, ...gaps.map(g => (g[side] ? measure(g[side]!, LAB) + bulge(g.level) + 34 : 0)));
  const leftNeed = labW('dx'), rightNeed = labW('dy');
  check(leftNeed + cardW + rightNeed <= fr.w, NAME, 'the table and its change labels are too wide');
  const x0 = fr.x + leftNeed + (fr.w - leftNeed - rightNeed - cardW) / 2, y0 = fr.y + (fr.h - cardH) / 2;
  const card = box(x0, y0, x0 + cardW, y0 + cardH);
  const colX = colW.map((_, j) => x0 + colW.slice(0, j).reduce((a, b) => a + b, 0));
  const rowY = (i: number) => y0 + headH + rowH * (i + 0.5);
  const cell = (i: number, j: number) => box(colX[j]!, rowY(i) - rowH / 2, colX[j]! + colW[j]!, rowY(i) + rowH / 2);
  const row = (i: number) => box(x0, rowY(i) - rowH / 2, x0 + cardW, rowY(i) + rowH / 2);
  // brackets: from the middle of row i to the middle of row j, bulging out on the left (dx) or right (dy)
  const brk = gaps.map(g => {
    const mk = (side: -1 | 1): Pt[] => {
      const x = side < 0 ? card.x0 - 12 : card.x1 + 12, ya = rowY(g.i) + (g.i < g.j ? 10 : -10), yb = rowY(g.j) + (g.i < g.j ? -10 : 10), d = bulge(g.level) * side;
      const P: Pt[] = [];
      for (let k = 0; k <= 24; k++) { const t = k / 24, u = 1 - t; P.push([u * u * x + 2 * u * t * (x + d * 1.6) + t * t * x, u * u * ya + 2 * u * t * ((ya + yb) / 2) + t * t * yb]); }
      return P;
    };
    return { g, L: mk(-1), R: mk(1) };
  });
  const all = brk.flatMap(b => [b.L, b.R]);
  const placed: Box[] = [card];
  const labs = brk.map(b => {
    const one = (side: -1 | 1, text: string | undefined) => {
      if (!text) return null;
      const P = side < 0 ? b.L : b.R, tip = P[12]!, w = measure(text, LAB);
      const cx = tip[0] + side * (w / 2 + 18), B = box(cx - w / 2, tip[1] - LAB * 0.42, cx + w / 2, tip[1] + LAB * 0.42);
      check(B.x0 >= fr.x - 2 && B.x1 <= fr.x + fr.w + 2, NAME, `the change label ${text} is outside the frame`);
      check(!hitsLines(B, all, 6), NAME, `the change label ${text} touches a bracket`);
      check(!placed.some(o => boxesOverlap(padBox(B, 6), o)), NAME, `the change label ${text} touches another label`);
      placed.push(B);
      return { text, x: cx, y: tip[1], B };
    };
    return { L: one(-1, b.g.dx), R: one(1, b.g.dy) };
  });
  const steps = ['card', 'rows', ...gaps.map((_, k) => 'gap:' + k), ...(nc === 3 ? ['col:2'] : [])];

  function draw(c: Canvas, P: Progress<string>, f: { rings?: { b: Box; col: Role; k: number }[] } = {}): void {
    const kc = P.k('card');
    if (kc > 0) {
      const a = E.smooth(clamp(kc));
      withAlpha(c, a, () => {
        wash(c, rectPts(card.x0, card.y0, card.w, card.h, 18), '#1A1E40', { seed: 31, rough: 1.2, ink: null, shade: 0.12 });
        inkLine(c, rectPts(card.x0, card.y0, card.w, card.h, 18), { col: '#4A4F80', w: 3, closed: true, seed: 32, rough: 0.7 });
        inkLine(c, [[card.x0 + 10, card.y0 + headH], [card.x1 - 10, card.y0 + headH]], { col: '#4A4F80', w: 3, seed: 33 });
        for (let j = 1; j < nc; j++) inkLine(c, [[colX[j]!, card.y0 + 12], [colX[j]!, card.y1 - 12]], { col: '#4A4F80', w: 2.5, seed: 34 + j });
      });
      p.heads.forEach((h, j) => drawWords(c, h, colX[j]! + colW[j]! / 2, card.y0 + headH / 2, j === 0 ? 'first' : j === 1 ? 'second' : 'dim', a * (j === 2 ? P.k('col:2') : 1), { size: HEAD, align: 'center' }));
    }
    for (let i = 0; i < nr; i++) {
      const kh = P.k('hl:' + i);
      if (kh > 0) { const R = row(i); withAlpha(c, kh * 0.32, () => wash(c, rectPts(R.x0 + 6, R.y0 + 6, R.w - 12, R.h - 12, 12), 'pick', { seed: 50 + i, rough: 1, ink: null, shade: 0 })); }
    }
    const kr = P.k('rows');
    if (kr > 0) p.rows.forEach((r, i) => r.forEach((t, j) => {
      const k = clamp(kr * 1.6 - (i / nr) * 0.6) * (j === 2 ? P.k('col:2') : 1);
      drawWords(c, t, colX[j]! + colW[j]! / 2, rowY(i), 'ink', k, { size: NUM, align: 'center' });
    }));
    brk.forEach((b, k) => {
      const kg = P.k('gap:' + k); if (kg <= 0) return;
      const ke = E.inOut(clamp(kg * 1.3));
      if (b.g.dx) arrow(c, b.L, ke, { col: 'first', lw: 4, head: 16 });
      if (b.g.dy) arrow(c, b.R, ke, { col: 'second', lw: 4, head: 16 });
      const L = labs[k]!, kl = clamp(kg * 1.5 - 0.5);
      if (L.L) drawWords(c, L.L.text, L.L.x, L.L.y, 'first', kl, { size: LAB, align: 'center' });
      if (L.R) drawWords(c, L.R.text, L.R.x, L.R.y, 'second', kl, { size: LAB, align: 'center' });
    });
    for (const r of f.rings ?? []) if (r.k > 0) drawOn(c, rectPts(r.b.x0 - 6, r.b.y0 - 4, r.b.w + 12, r.b.h + 8, 14), clamp(r.k), { col: r.col, lw: 4.5, closed: true });
  }
  return { kind: 'TableCard', box: card, steps, where: { row, cell, card }, draw };
}
