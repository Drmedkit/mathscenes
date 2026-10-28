// CaseTable: a truth table (or a value table) that fills in column by column.
// Key columns on the left (p and q, or a value of x) list the cases; each statement column (p → q, q → p ...)
// gets its T / F one row at a time. An F in a statement column is red: that is the case that breaks it. Rows can be
// ringed (the case in focus) and cells can wait as '?' (the student's answer) until their column is revealed.
// The four rows of p and q match the four zones of the Euler picture: TT = in both, TF = P outside Q (the only row
// where p → q is false), FT = Q outside P, FF = outside both.
//
// Steps: head, r0..r5 (the key cells of a row), c<j> (statement column j, top to bottom).
// Could move to the kit: a truth table / value table with marks (logic, identities, equivalence on a domain).
import { type Box, box, clamp, lag } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import type { Canvas } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { type Formula, tex, texDraw, texWidth } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { wash } from '../../wash';

export interface CaseParams {
  /** TeX of every column head */
  head: readonly string[];
  /** colour of every head (key columns: 'first' for p, 'second' for q, 'dim' for x) */
  headCol: readonly Paint[];
  /** cells: 'T', 'F', '' (blank) or any TeX; key columns first */
  rows: readonly (readonly string[])[];
  keys: number;
}
export type CaseStep = 'head' | `r${number}` | `c${number}` | `v${number}_${number}`;
export interface CaseFocus { rings?: readonly { i: number; col: Paint; k: number }[]; ask?: readonly (readonly [number, number])[] }
export interface CaseBlock {
  readonly kind: 'CaseTable';
  readonly where: { row(i: number): Box; cell(i: number, j: number): Box; head(j: number): Box; table: Box };
  draw(c: Canvas, P: Progress<CaseStep>, f?: CaseFocus): void;
}
const NAME = 'CaseTable';
const cellTex = (s: string) => (s === 'T' || s === 'F' ? `\\text{${s}}` : s);

export function CaseTable(p: CaseParams, fr: Frame, th: Theme): CaseBlock {
  const nr = p.rows.length, nc = p.head.length;
  check(nr >= 1 && nr <= 6, NAME, '1 to 6 rows');
  check(p.keys >= 1 && p.keys < nc, NAME, 'key columns and at least one statement column');
  for (const r of p.rows) check(r.length === nc, NAME, 'a cell for every column');
  const H = p.head.map(s => tex(s) as Formula);
  const C = p.rows.map(r => r.map(s => (s ? tex(cellTex(s)) as Formula : null)));
  const Q = tex('?') as Formula;
  let size = 64, hs = 60, colW: number[] = [];
  for (;;) {
    colW = Array.from({ length: nc }, (_, j) => Math.max(texWidth(H[j]!, hs), ...C.map(r => (r[j] ? texWidth(r[j]!, size) : 0)), 50) + 46);
    if (colW.reduce((s, w) => s + w, 0) <= fr.w - 24 || size <= 60) break;
    size -= 2; hs = Math.max(56, hs - 2);
  }
  const spare = fr.w - 24 - colW.reduce((s, w) => s + w, 0);
  check(spare >= 0, NAME, 'the table is too wide');
  colW = colW.map(w => w + spare / nc);
  const xs: number[] = []; { let x = fr.x + 12; for (const w of colW) { xs.push(x); x += w; } xs.push(x); }
  const rh = Math.min(116, (fr.h - 130) / nr);
  check(rh >= 84, NAME, 'the rows do not fit');
  const headY = fr.y + 58, rowY = (i: number) => fr.y + 130 + rh * (i + 0.5);
  const cellBox = (i: number, j: number) => box(xs[j]!, rowY(i) - rh / 2, xs[j + 1]!, rowY(i) + rh / 2);
  const rowBox = (i: number) => box(fr.x + 6, rowY(i) - rh / 2 + 4, fr.x + fr.w - 6, rowY(i) + rh / 2 - 4);
  const table = box(fr.x, fr.y, fr.x + fr.w, rowY(nr - 1) + rh / 2 + 14);

  function draw(c: Canvas, P: Progress<CaseStep>, f: CaseFocus = {}): void {
    const kH = P.k('head');
    if (kH <= 0) return;
    const a = E.smooth(clamp(kH));
    wash(c, rectPts(table.x0, table.y0, table.w, table.h, 20), '#1D2248', { seed: 444, rough: 1.2, ink: null, alpha: a * 0.92, shade: 0.08 });
    H.forEach((F, j) => texDraw(c, F, (xs[j]! + xs[j + 1]!) / 2, headY, { size: hs, align: 'center', valign: 'center', k: kH, col: p.headCol[j] ?? 'ink' }));
    const { g } = c;
    g.save(); g.globalAlpha *= a; g.strokeStyle = paint(th, 'faint', 'line'); g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(fr.x + 16, headY + 50); g.lineTo(fr.x + fr.w - 16, headY + 50);
    for (let j = p.keys; j < nc; j++) { g.moveTo(xs[j]!, headY - 40); g.lineTo(xs[j]!, rowY(nr - 1) + rh / 2); }
    g.stroke(); g.restore();
    const ask = new Set((f.ask ?? []).map(([i, j]) => `${i},${j}`));
    for (let i = 0; i < nr; i++) {
      const kr = P.k(`r${i}`);
      if (kr <= 0) continue;
      for (const R of f.rings ?? []) if (R.i === i && R.k > 0) {
        const b = rowBox(i);
        g.save(); g.globalAlpha *= clamp(R.k);
        g.fillStyle = paint(th, R.col, 'fill'); g.globalAlpha *= 0.16; g.beginPath(); g.roundRect(b.x0, b.y0, b.w, b.h, 16); g.fill();
        g.globalAlpha /= 0.16; g.strokeStyle = paint(th, R.col, 'fill'); g.lineWidth = 4.5; g.beginPath(); g.roundRect(b.x0, b.y0, b.w, b.h, 16); g.stroke();
        g.restore();
      }
      for (let j = 0; j < nc; j++) {
        const F = C[i]![j], cx = (xs[j]! + xs[j + 1]!) / 2, y = rowY(i);
        const k = j < p.keys ? kr : Math.max(E.smooth(lag(P.k(`c${j}`), i, nr, 0.5)), P.k(`v${i}_${j}`));
        if (ask.has(`${i},${j}`) && k < 1) texDraw(c, Q, cx, y, { size, align: 'center', valign: 'center', col: 'pick', alpha: kr * (1 - k) });
        if (!F || k <= 0) continue;
        const col: Paint = j < p.keys ? (p.rows[i]![j] === 'T' || p.rows[i]![j] === 'F' ? 'dim' : 'ink') : p.rows[i]![j] === 'F' ? 'wrong' : p.rows[i]![j] === 'T' ? 'link' : 'ink';
        texDraw(c, F, cx, y, { size, align: 'center', valign: 'center', k, col });
      }
    }
  }
  return {
    kind: 'CaseTable',
    where: { row: rowBox, cell: cellBox, head: j => box(xs[j]!, headY - 40, xs[j + 1]!, headY + 40), table },
    draw,
  };
}
