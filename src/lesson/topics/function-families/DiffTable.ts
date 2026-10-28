// DiffTable: the finite-difference table, the model of "Linear, quadratic or exponential?". A table of values on a
// card (an input column x and one or more output columns), and beside the LAST output column the three family tests
// as staggered columns, each with a header word:
//   step      (left of the card) the x-step between neighbouring rows: equal steps first
//   1st diff  y(i+1) − y(i) between rows, water          constant = linear
//   2nd diff  the difference of two neighbouring 1st diffs, amber, joined to them by two short strokes
//                                                         constant and nonzero = quadratic
//   ratio     y(i+1) ÷ y(i) between rows, teal           constant (no zero outputs, r > 0, r ≠ 1) = exponential
// Column heads: Δx, 1st Δ, 2nd Δ, ratio (44 px).
// Steps: card, rows (one after another), dx, d1, d2, rt (each column writes on top to bottom), reveal ('?' cells turn
// into their values). Focus: `hot` draws a column's labels in the wrong colour (not constant), `glow` rings a column
// in link colour (constant: the test passes), rings on rows, and `upto` (only the first n labels of a column).
// Could move to the kit next to exponential-functions' GrowthTable and linear-functions-slope's TableCard (a table
// with its changes is the third picture of a function after Plane and the number line).
// Pure layout inside a Frame (centred); throws BlockError when the table is too wide or the rows do not fit.
import { type Box, box, clamp, lag } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas, withAlpha } from '../../../core/draw';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { type Frame, check } from '../../../blocks/block';
import { drawWords, wordsBox } from '../../words';
import { wash } from '../../wash';
import { DUSK } from '../../dusk';

const NAME = 'DiffTable';
export type DStep = 'card' | 'rows' | 'dx' | 'd1' | 'd2' | 'rt' | 'reveal';
export type DKind = 'dx' | 'd1' | 'd2' | 'rt';
export interface DCol { name: string; vals: readonly (string | null)[]; reveal?: readonly (string | null)[]; col?: Paint }
export interface DParams {
  xName: string; xs: readonly string[]; cols: readonly DCol[];
  /** the change columns (labels between rows; d2 has one label fewer) */
  dx?: readonly string[]; d1?: readonly string[]; d2?: readonly string[]; rt?: readonly string[];
  /** number size (default 60) */ size?: number;
}
export interface DFocus {
  hot?: Partial<Record<DKind, boolean>>;
  glow?: Partial<Record<DKind, number>>;
  ring?: { row: number; col: Paint; k: number }[];
  upto?: Partial<Record<DKind, number>>;
}
export interface DiffBlock { readonly box: Box; row(i: number): Box; colBox(kind: DKind): Box | null; draw(c: Canvas, p: Progress<DStep>, f?: DFocus): void }

const HEAD = 44;
const COL: Record<DKind, Paint> = { dx: 'pick', d1: 'water', d2: 'first', rt: 'second' };
const HEADS: Record<DKind, string> = { dx: 'Δx', d1: '1st Δ', d2: '2nd Δ', rt: 'ratio' };

export function DiffTable(t: DParams, fr: Frame, th: Theme): DiffBlock {
  const n = t.xs.length, NUM = t.size ?? 60, CHG = Math.max(44, Math.min(46, NUM - 10));
  check(n >= 2 && n <= 8 && t.cols.length >= 1 && t.cols.every(c => c.vals.length === n), NAME, 'two to eight rows, one value per input');
  for (const k of ['dx', 'd1', 'rt'] as const) check(!t[k] || t[k]!.length === n - 1, NAME, `${k}: one label between each pair of rows`);
  check(!t.d2 || t.d2.length === n - 2, NAME, 'd2: one label fewer than d1');
  const w = (s: string, size: number, wt = 600) => wordsBox(s, 0, 0, { size, weight: wt }).w;
  const xW = Math.max(110, w(t.xName, HEAD, 650) + 44, ...t.xs.map(s => w(s, NUM) + 44));
  const cW = t.cols.map(c => Math.max(140, w(c.name, HEAD, 650) + 40, ...[...c.vals, ...(c.reveal ?? [])].map(s => w(s ?? '?', NUM, 650) + 48)));
  const chW = (k: DKind) => { const L = t[k]; return L ? Math.max(w(HEADS[k], HEAD, 650) + 20, ...L.map(s => w(s, CHG, 700) + 20)) : 0; };
  const dxW = t.dx ? chW('dx') + 34 : 0;
  const right: DKind[] = (['d1', 'd2', 'rt'] as const).filter(k => t[k]);
  // the gap before a column: 2nd differences sit a little further out (room for the two strokes from the 1st differences)
  const gap0 = right.length ? 40 : 0, gapB = (k: DKind) => (k === 'd2' ? 32 : 18);
  const rW = right.reduce((s, k, i) => s + chW(k) + (i ? gapB(k) : 0), 0);
  const cardW = xW + cW.reduce((a, b) => a + b, 0), W = dxW + cardW + gap0 + rW;
  check(W <= fr.w + 1, NAME, `the table is too wide (${Math.round(W)} > ${fr.w})`);
  const headH = 100, rowH = Math.min(112, (fr.h - headH - 10) / n);
  check(rowH >= Math.max(74, NUM + 14), NAME, 'the rows do not fit');
  const X0 = fr.x + (fr.w - W) / 2, x0 = X0 + dxW, y0 = fr.y + (fr.h - headH - rowH * n) / 2;
  const cardX1 = x0 + cardW;
  const rowY = (i: number) => y0 + headH + rowH * (i + 0.5);
  const midY = (i: number) => (rowY(i) + rowY(i + 1)) / 2;
  const colX = (j: number) => x0 + xW + cW.slice(0, j).reduce((a, b) => a + b, 0);
  const card = box(x0, y0, cardX1, y0 + headH + rowH * n);
  // left edge (x) of each change column; labels are centred in their column
  const cx: Partial<Record<DKind, number>> = {};
  let xx = cardX1 + gap0;
  right.forEach((k, i) => { if (i) xx += gapB(k); cx[k] = xx + chW(k) / 2; xx += chW(k); });
  if (t.dx) cx.dx = X0 + (dxW - 34) / 2;
  const labY = (k: DKind, i: number) => (k === 'd2' ? rowY(i + 1) : midY(i));
  const labBox = (k: DKind, i: number) => wordsBox(t[k]![i]!, cx[k]!, labY(k, i), { size: CHG, weight: 700, align: 'center' });
  const ink = DUSK.cream;

  function colBox(k: DKind): Box | null {
    const L = t[k];
    if (!L) return null;
    const bs = L.map((_, i) => labBox(k, i));
    const hx = cx[k]!, hw = chW(k) / 2;
    return box(Math.min(hx - hw, ...bs.map(b => b.x0)) - 4, Math.min(...bs.map(b => b.y0)) - 10, Math.max(hx + hw, ...bs.map(b => b.x1)) + 4, Math.max(...bs.map(b => b.y1)) + 10);
  }

  function draw(c: Canvas, P: Progress<DStep>, f: DFocus = {}): void {
    const kc = P.k('card');
    if (kc <= 0) return;
    const { g } = c;
    withAlpha(c, clamp(kc * 1.5), () => {
      wash(c, rectPts(card.x0, card.y0, card.w, card.h, 16), '#262B57', { seed: 31, rough: 1.2, ink: DUSK.ink, inkW: 3, shade: 0.25 });
      g.save(); g.strokeStyle = '#4A4F82'; g.lineWidth = 2;
      for (let i = 1; i < n; i++) { const y = y0 + headH + rowH * i; g.beginPath(); g.moveTo(x0 + 16, y); g.lineTo(cardX1 - 16, y); g.stroke(); }
      g.strokeStyle = ink; g.lineWidth = 3;
      g.beginPath(); g.moveTo(x0 + 16, y0 + headH); g.lineTo(cardX1 - 16, y0 + headH); g.stroke();
      for (let j = 0; j < t.cols.length; j++) { g.beginPath(); g.moveTo(colX(j), y0 + 16); g.lineTo(colX(j), card.y1 - 16); g.stroke(); }
      g.restore();
      drawWords(c, t.xName, x0 + xW / 2, y0 + headH / 2, 'second', 1, { size: HEAD, align: 'center', weight: 650 });
      t.cols.forEach((cl, j) => drawWords(c, cl.name, colX(j) + cW[j]! / 2, y0 + headH / 2, cl.col ?? 'first', 1, { size: HEAD, align: 'center', weight: 650 }));
    });
    const kr = P.k('rows'), kf = P.k('reveal');
    for (let i = 0; i < n; i++) {
      const k = lag(kr, i, n, 0.5);
      if (k <= 0) continue;
      drawWords(c, t.xs[i]!, x0 + xW / 2, rowY(i), 'ink', k, { size: NUM, align: 'center' });
      t.cols.forEach((cl, j) => {
        const mx = colX(j) + cW[j]! / 2, v = cl.vals[i] ?? null, rv = cl.reveal?.[i] ?? null;
        if (v !== null) { drawWords(c, v, mx, rowY(i), 'ink', k, { size: NUM, align: 'center', weight: 650 }); return; }
        drawWords(c, '?', mx, rowY(i), 'pick', k * (rv !== null ? 1 - clamp(kf * 2) : 1), { size: NUM, align: 'center', weight: 700 });
        if (rv !== null && kf > 0) drawWords(c, rv, mx, rowY(i), 'link', clamp(kf * 2 - 0.6), { size: NUM, align: 'center', weight: 700 });
      });
    }
    // the change columns
    for (const k of ['dx', 'd1', 'd2', 'rt'] as const) {
      const L = t[k];
      if (!L) continue;
      const kk = P.k(k);
      if (kk <= 0) continue;
      const m = L.length, upto = f.upto?.[k] ?? m;
      const col: Paint = f.hot?.[k] ? 'wrong' : COL[k];
      drawWords(c, HEADS[k], cx[k]!, y0 + headH / 2, COL[k], clamp(kk * 3), { size: HEAD, align: 'center', weight: 650 });
      for (let i = 0; i < Math.min(m, upto); i++) {
        const ki = lag(kk, i, m, 0.5);
        if (ki <= 0) continue;
        g.save(); g.globalAlpha *= clamp(ki); g.strokeStyle = ink; g.lineWidth = 3; g.lineCap = 'round';
        if (k === 'dx') {
          const bx = x0 + 6;
          g.beginPath(); g.moveTo(bx, rowY(i) + 8); g.quadraticCurveTo(bx - 34, midY(i), bx, rowY(i + 1) - 8); g.stroke();
        } else if (k === 'd2') {
          // two short strokes from the two 1st diffs it is made of
          const B = labBox('d2', i), a = labBox('d1', i), b = labBox('d1', i + 1);
          g.beginPath(); g.moveTo(a.x1 + 6, a.cy + 4); g.lineTo(B.x0 - 6, B.cy - 10); g.moveTo(b.x1 + 6, b.cy - 4); g.lineTo(B.x0 - 6, B.cy + 10); g.stroke();
        } else if (k === 'd1' || (k === 'rt' && (!t.d1 || P.k('d1') <= 0))) {
          g.beginPath(); g.moveTo(cardX1 - 6, rowY(i) + 8); g.quadraticCurveTo(cardX1 + 40, midY(i), cardX1 - 6, rowY(i + 1) - 8); g.stroke();
        }
        g.restore();
        drawWords(c, L[i]!, cx[k]!, labY(k, i), col, ki, { size: CHG, weight: 700, align: 'center' });
      }
      const gk = f.glow?.[k] ?? 0;
      if (gk > 0) {
        const B = colBox(k)!;
        g.save(); g.globalAlpha *= clamp(gk); g.strokeStyle = paint(th, f.hot?.[k] ? 'wrong' : 'link', 'line'); g.lineWidth = 5;
        g.beginPath(); g.roundRect(B.x0 - 6, B.y0, B.w + 12, B.h, 18); g.stroke(); g.restore();
      }
    }
    for (const R of f.ring ?? []) {
      if (R.k <= 0 || R.row < 0 || R.row >= n) continue;
      const B = row(R.row);
      g.save(); g.globalAlpha *= clamp(R.k); g.strokeStyle = paint(th, R.col, 'line'); g.lineWidth = 5;
      g.beginPath(); g.roundRect(B.x0, B.y0, B.w, B.h, 14); g.stroke(); g.restore();
    }
  }
  function row(i: number): Box { return box(x0 + 8, rowY(i) - rowH / 2 + 6, cardX1 - 8, rowY(i) + rowH / 2 - 6); }
  return { box: box(X0, card.y0, X0 + W, card.y1), row, colBox, draw };
}
