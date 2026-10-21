// RateTable: the table of a relationship on the notation board, with the same-order quotient column.
//   head     the column names (input amber, output teal, "output per input" lime)
//   row:<i>  a row writes on (input, output)
//   q:<i>    its quotient output ÷ input writes on (exact, from rateMaths); a zero-input row has no quotient
// Focus: one row lit (a soft band behind it, pick colour), rows / quotients marked wrong (red).
// Numbers are TeX (>= 60 px), headers sans words (>= 44 px); every cell is checked to fit its column.
import { type Box, box, clamp, unionBox } from '../../../core/math';
import { type Canvas } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Role, type Theme, paint, rgba } from '../../../core/theme';
import { type Formula, tex, texBox, texDraw, texWidth } from '../../../core/tex';
import { check } from '../../../blocks/block';
import { drawWords, wordsBox } from '../../words';
import { type Row, fmt, money, quotient, qTexDec } from './rateMaths';

const NAME = 'RateTable';
export interface RateTableParams {
  /** column names: input, output, and (optional) the quotient column */
  cols: readonly [string, string] | readonly [string, string, string];
  rows: readonly Row[];
  /** show the input / output as money (7.50) */
  money?: readonly [boolean, boolean];
  /** override a quotient cell's TeX (e.g. '?' for the kid's cell) */
  qTex?: Readonly<Record<number, string>>;
  /** a second TeX for a quotient cell, drawn instead while focus.alt names the row (the kid's "?") */
  qAlt?: Readonly<Record<number, string>>;
  /** number size (default 66) */
  size?: number;
}
export interface TableFocus { alt?: readonly number[]; row?: number | null; rowK?: number; rowCol?: Role; wrongQ?: readonly number[]; wrongRow?: readonly number[]; dimRows?: number }
export interface RateTableBlock {
  readonly kind: 'RateTable';
  readonly box: Box;
  readonly where: { cell(r: number, c: number): Box; row(r: number): Box; head(c: number): Box; bottom: number };
  draw(c: Canvas, p: Progress<string>, f?: TableFocus): void;
}

export function RateTable(p: RateTableParams, x0: number, y0: number, w: number, th: Theme): RateTableBlock {
  check(p.rows.length >= 1 && p.rows.length <= 6, NAME, 'a table has 1 to 6 rows');
  const nc = p.cols.length, size = p.size ?? 66, HEAD = 44, RH = Math.round(size * 1.42), HH = 78;
  const colW = nc === 3 ? [w * 0.31, w * 0.33, w * 0.36] : [w * 0.5, w * 0.5];
  const cx = (c: number) => x0 + colW.slice(0, c).reduce((a, b) => a + b, 0) + colW[c]! / 2;
  const left = (c: number) => x0 + colW.slice(0, c).reduce((a, b) => a + b, 0);
  const headY = y0 + HH / 2, rowY = (r: number) => y0 + HH + RH * r + RH / 2;
  const heads = p.cols.map((t, c) => { const B = wordsBox(t, cx(c), headY, { size: HEAD, align: 'center' }); check(B.w <= colW[c]! - 10, NAME, `the column name "${t}" is too wide`); return B; });
  const cellTex = (r: number, c: number): string => {
    const row = p.rows[r]!;
    if (c === 0) return p.money?.[0] ? money(row.x) : fmt(row.x);
    if (c === 1) return p.money?.[1] ? money(row.y) : fmt(row.y);
    const o = p.qTex?.[r];
    if (o !== undefined) return o;
    const q = quotient(row.x, row.y);
    return q ? qTexDec(q) : '\\text{none}';
  };
  const F: Formula[][] = p.rows.map((_, r) => Array.from({ length: nc }, (_, c) => tex(cellTex(r, c)) as Formula));
  const sizes: number[][] = F.map(row => row.map((f, c) => {
    let s = size;
    while (s > 60 && texWidth(f, s) > colW[c]! - 18) s -= 2;
    check(texWidth(f, s) <= colW[c]! - 12, NAME, `a cell is too wide for its column (${f.src ?? ''})`);
    return s;
  }));
  const alt = new Map<number, { F: Formula; size: number }>();
  for (const [r, src] of Object.entries(p.qAlt ?? {})) {
    const f = tex(src) as Formula; let s2 = size;
    while (s2 > 60 && texWidth(f, s2) > colW[2]! - 18) s2 -= 2;
    alt.set(Number(r), { F: f, size: s2 });
  }
  const cell = (r: number, c: number): Box => texBox(F[r]![c]!, cx(c), rowY(r), { size: sizes[r]![c]!, align: 'center' });
  const rowBox = (r: number): Box => box(x0 - 8, rowY(r) - RH / 2 + 6, x0 + w + 8, rowY(r) + RH / 2 - 6);
  const bottom = y0 + HH + RH * p.rows.length;
  const roles: Role[] = ['first', 'second', 'link'];

  function draw(c: Canvas, P: Progress<string>, f: TableFocus = {}): void {
    const kH = P.k('head');
    if (kH <= 0) return;
    const { g } = c;
    const a = E.smooth(clamp(kH));
    // the focus band behind one row
    if (f.row !== null && f.row !== undefined && (f.rowK ?? 1) > 0) {
      const B = rowBox(f.row);
      g.save(); g.globalAlpha *= clamp(f.rowK ?? 1) * 0.28; g.fillStyle = paint(th, f.rowCol ?? 'pick', 'fill');
      g.beginPath(); g.roundRect(B.x0, B.y0, B.w, B.h, 12); g.fill(); g.restore();
      g.save(); g.globalAlpha *= clamp(f.rowK ?? 1); g.strokeStyle = paint(th, f.rowCol ?? 'pick', 'fill'); g.lineWidth = 3;
      g.beginPath(); g.roundRect(B.x0, B.y0, B.w, B.h, 12); g.stroke(); g.restore();
    }
    // rules: under the header, and between the columns (quiet, crisp)
    g.save(); g.globalAlpha *= a; g.strokeStyle = rgba('#8A8EB8', 0.55); g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(x0, y0 + HH); g.lineTo(x0 + w, y0 + HH); g.stroke();
    g.strokeStyle = rgba('#8A8EB8', 0.3); g.lineWidth = 2;
    for (let col = 1; col < nc; col++) { const x = left(col); g.beginPath(); g.moveTo(x, y0 + 12); g.lineTo(x, bottom - 8); g.stroke(); }
    g.restore();
    p.cols.forEach((t, col) => drawWords(c, t, cx(col), headY, roles[col]!, a, { size: HEAD, align: 'center' }));
    for (let r = 0; r < p.rows.length; r++) {
      const kr = P.k('row:' + r), kq = nc === 3 ? P.k('q:' + r) : 0;
      const dimR = f.row !== null && f.row !== undefined && f.row !== r ? clamp(f.dimRows ?? 0) : 0;
      const al = 1 - 0.55 * dimR;
      for (let col = 0; col < nc; col++) {
        const k = col < 2 ? kr : kq;
        if (k <= 0) continue;
        const wrong = (col === 2 && f.wrongQ?.includes(r)) || (col < 2 && f.wrongRow?.includes(r));
        const A2 = col === 2 && f.alt?.includes(r) ? alt.get(r) : undefined;
        if (A2) texDraw(c, A2.F, cx(col), rowY(r), { size: A2.size, align: 'center', k, alpha: al, col: 'pick' });
        else texDraw(c, F[r]![col]!, cx(col), rowY(r), { size: sizes[r]![col]!, align: 'center', k, alpha: al, col: wrong ? 'wrong' : roles[col]! });
      }
    }
  }
  const all = unionBox([...heads, box(x0, y0, x0 + w, bottom)]);
  return { kind: 'RateTable', box: all, where: { cell, row: rowBox, head: c => heads[c]!, bottom }, draw };
}
