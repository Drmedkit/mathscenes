// ProductBox: a product of two polynomials as a box of partial products. The terms of one factor run down the left,
// the terms of the other across the top; every cell is (its row's term) × (its column's term), so the box holds
// EVERY partial product (four for two binomials, six for a binomial times a trinomial, nine for two trinomials).
// Cells are washed in the colour of their degree; with both factors in standard form, like terms (same degree, same
// colour) sit on the box's diagonals, which is where collecting happens: a group of cells is ringed and added.
// Cells that cancel (a sum times a difference) are struck. A cell can be held back as '?' (asked) or shown as a
// dashed gap (a missed partial product: FOIL's firsts and lasts only).
// Not to scale: each part keeps room for its label. Optional side notes (units: "ft") sit outside the box.
//
// Steps: frame (the empty box), sides (the factor terms on the edges), cells (cells write on in reading order),
//        collect (like-term groups ringed in their colour).
// Could move to the kit: an m × n partial-products box (multiplying polynomials, area models with units).
import { type Box, box, clamp } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { type Formula, tex, texDraw, texWidth } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { wash } from '../../wash';
import { drawWords, wordsBox } from '../../words';
import { degRole } from './poly';

export interface BoxSide { tex: string; deg: number }
export interface BoxParams {
  left: BoxSide[]; top: BoxSide[];
  /** [row][col] TeX of the partial product; '' = not shown at all (held back) */
  cells: string[][];
  /** [row][col] degree of each cell (its colour) */
  deg: number[][];
  /** words beside the left side / over the top (e.g. "x + 3 ft"), optional */
  noteL?: string; noteT?: string;
}
export type BoxStep = 'frame' | 'sides' | 'cells' | 'collect';
export interface BoxFocus {
  /** cells written so far: 0..1 over all cells in reading order (default: P.k('cells')) */
  cellsK?: number;
  /** per-row write-on 0..1 (overrides cellsK): a row's cells fill left to right */
  rowK?: readonly number[];
  /** groups of like cells, ringed in a colour at 'collect' (or by k) */
  groups?: readonly { cells: readonly [number, number][]; col: Paint; k?: number }[];
  /** struck cells (they cancel), k 0..1 */
  strike?: readonly { r: number; c: number; k: number }[];
  /** asked cells: a '?' instead of the product (until reveal k) */
  ask?: readonly { r: number; c: number; reveal: number }[];
  /** missed cells: dashed gap in 'wrong' (FOIL's firsts-and-lasts slip), k 0..1 */
  missed?: readonly { r: number; c: number; k: number }[];
  /** a ring around a whole row / column (lime) */
  row?: { i: number; k: number }; col?: { i: number; k: number };
  /** dim every cell but these (0..1) */
  only?: { cells: readonly [number, number][]; k: number };
}
export interface BoxBlock {
  readonly kind: 'ProductBox';
  readonly where: { all: Box; cell(r: number, c: number): Box; left(i: number): Box; top(j: number): Box };
  draw(c: Canvas, P: Progress<BoxStep>, f?: BoxFocus): void;
}
const NAME = 'ProductBox';
const INK_ON_WASH = '#101330';

export function ProductBox(p: BoxParams, fr: Frame, th: Theme): BoxBlock {
  const R = p.left.length, C = p.top.length;
  check(R >= 1 && R <= 3 && C >= 1 && C <= 3, NAME, 'the box draws 1-3 rows and 1-3 columns');
  check(p.cells.length === R && p.cells.every(r => r.length === C), NAME, 'cells do not match the sides');
  const FL = p.left.map(s => tex(s.tex) as Formula), FT = p.top.map(s => tex(s.tex) as Formula);
  const FC = p.cells.map(r => r.map(s => (s ? (tex(s) as Formula) : null)));
  const FQ = tex('?') as Formula;
  const SIDE = 72;
  let CELL = R * C >= 6 ? 66 : 76;
  const noteW = p.noteL ? 64 : 0;
  const leftW = Math.max(...FL.map(F => texWidth(F, SIDE))) + 56 + noteW;
  const topH = 120 + (p.noteT ? 56 : 0);
  const x0 = fr.x + leftW, x1 = fr.x + fr.w - 20;
  const W = x1 - x0;
  // column widths: proportional to what they hold (each at least 26 % of the width)
  const need = Array.from({ length: C }, (_, j) => Math.max(texWidth(FT[j]!, SIDE), ...FC.map(r => (r[j] ? texWidth(r[j]!, CELL) : 0))) + 50);
  const tot = need.reduce((a, b) => a + b, 0);
  const ws = need.map(n => Math.max(W * (C === 1 ? 1 : 0.26), (W * n) / tot));
  const sc = W / ws.reduce((a, b) => a + b, 0);
  for (let j = 0; j < C; j++) ws[j]! *= sc;
  const cellH = Math.min(230, (fr.h - topH - 60) / R, Math.max(150, ...ws) * 0.8);
  const y0 = fr.y + topH + Math.max(0, (fr.h - topH - 60 - cellH * R) / 2), y1 = y0 + cellH * R;
  const xs = [x0]; for (let j = 0; j < C; j++) xs.push(xs[j]! + ws[j]!);
  const cellBox = (r: number, c: number) => box(xs[c]!, y0 + r * cellH, xs[c + 1]!, y0 + (r + 1) * cellH);
  // fit checks: every label inside its cell / edge
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    const F = FC[r]![c];
    if (F) { while (CELL > 60 && texWidth(F, CELL) > cellBox(r, c).w - 30) CELL -= 2; check(texWidth(F, CELL) <= cellBox(r, c).w - 24, NAME, `cell ${r},${c} does not fit`); }
  }
  for (let j = 0; j < C; j++) check(texWidth(FT[j]!, SIDE) <= ws[j]! - 16, NAME, `top label ${j} does not fit`);
  check(cellH >= 120, NAME, 'cells too short');
  const all = box(x0, y0, x1, y1);
  const leftBox = (i: number) => { const b = cellBox(i, 0); const w = texWidth(FL[i]!, SIDE); return box(x0 - 28 - w, b.cy - SIDE * 0.5, x0 - 28, b.cy + SIDE * 0.5); };
  const topBox = (j: number) => { const b = cellBox(0, j); const w = texWidth(FT[j]!, SIDE); return box(b.cx - w / 2, y0 - 60 - SIDE * 0.5, b.cx + w / 2, y0 - 60 + SIDE * 0.5); };
  if (p.noteT) check(wordsBox(p.noteT, all.cx, y0 - 150, { size: 44, align: 'center' }).w < W, NAME, 'top note too wide');

  function ring(c: Canvas, b: Box, col: Paint, k: number, pad = 8, w = 6): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k); g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = w;
    g.beginPath(); g.roundRect(b.x0 + pad, b.y0 + pad, b.w - 2 * pad, b.h - 2 * pad, 14); g.stroke(); g.restore();
  }
  function draw(c: Canvas, P: Progress<BoxStep>, f: BoxFocus = {}): void {
    const kF = P.k('frame'), kS = P.k('sides'), kC = f.cellsK ?? P.k('cells'), kG = P.k('collect');
    if (kF <= 0) return;
    const a = E.smooth(clamp(kF)), { g } = c;
    const n = R * C;
    const missedK = (r: number, cc: number) => f.missed?.find(m => m.r === r && m.c === cc)?.k ?? 0;
    const onlyDim = (r: number, cc: number) => (f.only && !f.only.cells.some(([a, b]) => a === r && b === cc) ? 0.7 * clamp(f.only.k) : 0);
    for (let r = 0; r < R; r++) for (let cc = 0; cc < C; cc++) {
      const b = cellBox(r, cc), i = r * C + cc;
      const kc = f.rowK ? clamp((f.rowK[r] ?? 0) * (1 + (C - 1) * 0.85) - cc * 0.85) : clamp(kC * n - i * 0.85);   // reading order
      const ms = missedK(r, cc);
      const dim = onlyDim(r, cc);
      // the empty cell (frame), then its wash
      wash(c, rectPts(b.x0 + 5, b.y0 + 5, b.w - 10, b.h - 10, 8), '#262B57', { seed: 900 + i, rough: 1.0, alpha: a * 0.9, inkW: 2.5 });
      const fill = kc * (1 - ms) * (1 - dim);
      if (fill > 0 && FC[r]![cc]) wash(c, rectPts(b.x0 + 9, b.y0 + 9, b.w - 18, b.h - 18, 8), degRole(p.deg[r]![cc]!), { seed: 930 + i, rough: 1.3, alpha: fill * 0.82, inkW: 2.5 });
      if (ms > 0) {
        g.save(); g.globalAlpha *= clamp(ms); g.setLineDash([12, 9]); g.strokeStyle = paint(th, 'wrong', 'fill'); g.lineWidth = 4;
        g.strokeRect(b.x0 + 14, b.y0 + 14, b.w - 28, b.h - 28); g.restore();
      }
      const F = FC[r]![cc];
      const asked = f.ask?.find(q => q.r === r && q.c === cc);
      if (F && kc > 0 && ms < 1) {
        if (asked && asked.reveal < 1) texDraw(c, FQ, b.cx, b.cy, { size: CELL, align: 'center', k: kc, alpha: (1 - asked.reveal) * (1 - ms), col: INK_ON_WASH });
        const kk = asked ? asked.reveal : kc;
        if (kk > 0) texDraw(c, F, b.cx, b.cy, { size: CELL, align: 'center', k: kk, alpha: (1 - ms) * (1 - dim * 0.8), col: INK_ON_WASH });
      }
    }
    // the box's outline over the cells, and the grid lines
    g.save(); g.globalAlpha *= a; g.strokeStyle = paint(th, 'ink', 'line'); g.lineWidth = 3.5;
    g.strokeRect(x0, y0, W, y1 - y0);
    g.lineWidth = 2.5; g.globalAlpha *= 0.8;
    for (let j = 1; j < C; j++) { g.beginPath(); g.moveTo(xs[j]!, y0); g.lineTo(xs[j]!, y1); g.stroke(); }
    for (let r = 1; r < R; r++) { g.beginPath(); g.moveTo(x0, y0 + r * cellH); g.lineTo(x1, y0 + r * cellH); g.stroke(); }
    g.restore();
    if (kS > 0) {
      for (let i = 0; i < R; i++) texDraw(c, FL[i]!, x0 - 28, cellBox(i, 0).cy, { size: SIDE, align: 'right', k: kS, col: degRole(p.left[i]!.deg) });
      for (let j = 0; j < C; j++) texDraw(c, FT[j]!, cellBox(0, j).cx, y0 - 60, { size: SIDE, align: 'center', k: kS, col: degRole(p.top[j]!.deg) });
      // brackets: the left factor and the top factor are each ONE quantity
      g.save(); g.globalAlpha *= clamp(kS) * 0.85; g.strokeStyle = paint(th, 'dim', 'line'); g.lineWidth = 3;
      const bx = fr.x + noteW + 12;
      g.beginPath(); g.moveTo(bx + 14, y0 + 6); g.lineTo(bx, y0 + 6); g.lineTo(bx, y1 - 6); g.lineTo(bx + 14, y1 - 6); g.stroke();
      const by = y0 - 112;
      g.beginPath(); g.moveTo(x0 + 6, by + 14); g.lineTo(x0 + 6, by); g.lineTo(x1 - 6, by); g.lineTo(x1 - 6, by + 14); g.stroke();
      g.restore();
      if (p.noteT) drawWords(c, p.noteT, all.cx, y0 - 150, 'dim', kS, { size: 44, align: 'center' });
      if (p.noteL) {
        g.save(); g.translate(fr.x + 22, all.cy); g.rotate(-Math.PI / 2);
        drawWords(c, p.noteL, 0, 0, 'dim', kS, { size: 44, align: 'center' }); g.restore();
      }
    }
    for (const G of f.groups ?? []) {
      const k = G.k ?? kG;
      for (const [r, cc] of G.cells) ring(c, cellBox(r, cc), G.col, k, 4, 7);
    }
    for (const s of f.strike ?? []) {
      if (s.k <= 0) continue;
      const b = cellBox(s.r, s.c);
      g.save(); g.globalAlpha *= clamp(s.k); g.strokeStyle = paint(th, 'wrong', 'fill'); g.lineWidth = 6; g.lineCap = 'round';
      g.beginPath(); g.moveTo(b.x0 + 22, b.y1 - 22); g.lineTo(b.x0 + 22 + (b.w - 44) * E.inOut(clamp(s.k)), b.y1 - 22 - (b.h - 44) * E.inOut(clamp(s.k))); g.stroke(); g.restore();
    }
    if (f.row) ring(c, box(x0, cellBox(f.row.i, 0).y0, x1, cellBox(f.row.i, 0).y1), 'link', f.row.k, -6);
    if (f.col) ring(c, box(xs[f.col.i]!, y0, xs[f.col.i + 1]!, y1), 'link', f.col.k, -6);
  }
  return { kind: 'ProductBox', where: { all, cell: cellBox, left: leftBox, top: topBox }, draw };
}
