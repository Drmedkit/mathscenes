// LongDiv: the US long-division layout of P ÷ D, column by column. Every power of x has its own column (the
// dividend is written complete, with 0 placeholders), the quotient sits above the bracket in the column of its power,
// and every cycle adds two rows: the product −(t · D) and, under a rule, the new residual S − t·D written in full
// (every lower-degree term kept, so each residual row is the S of P = D·Q + S). The last residual is the remainder.
// Colours: dividend amber (first), divisor teal (second), quotient lime (link), remainder lavender (pick).
//
// Steps: frame (divisor, bracket, dividend row), then per cycle i: q<i> (the quotient term), m<i> (the product row),
//        s<i> (the rule and the new residual). A cycle's steps can run one after another so a solve animates row by row.
// Focus: rings around rows, the cancelled leading terms struck, a quotient term asked ('?'), the remainder glowing.
// Could move to the kit (with SynthTab): polynomial-theorems and rational-functions divide too.
import { type Box, box, clamp, unionBox } from '../../../core/math';
import { type Canvas } from '../../../core/draw';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { type Formula, tex, texDraw, texWidth } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { type Co, type Q, degOf, divide, isZ, pT, qNeg, trim } from './pd';
import { T, termTex } from '../polynomials/poly';

export interface LdParams { P: Co; D: Co; /** largest type size (px) */ max?: number }
/** a row of the layout: 'q' (quotient), 'P' (dividend), 'm0', 's0', 'm1', ... */
export type LdRow = string;
export interface LdFocus {
  /** rings around whole rows */
  rings?: readonly { row: LdRow; col: Paint; k: number }[];
  /** strike the cancelled leading terms of cycle i (the residual's lead and the product's lead) */
  cancel?: readonly { i: number; k: number }[];
  /** the quotient term of cycle i shows '?' until reveal 1 */
  ask?: { i: number; reveal: number };
  /** the remainder glows (lavender) */
  rem?: number;
  /** dim everything but these rows (0..1) */
  only?: { rows: readonly LdRow[]; k: number };
}
export interface LdBlock {
  readonly kind: 'LongDiv';
  readonly cycles: number;
  readonly size: number;
  readonly where: { all: Box; row(r: LdRow): Box; divisor: Box; remainder: Box };
  draw(c: Canvas, P: Progress<string>, f?: LdFocus): void;
}
const NAME = 'LongDiv';
interface Cell { F: Formula; pow: number; tail?: Formula }
interface Row { id: LdRow; y: number; cells: Cell[]; step: string; col: Paint; rule?: [number, number] }

/** one signed term as TeX: first in its row → '-3x^{2}', later → '- 3x^{2}' / '+ 0x' (zero placeholders written) */
function termSrc(c: Q, pow: number, first: boolean): string {
  const body = isZ(c) ? (pow === 0 ? '0' : pow === 1 ? '0x' : `0x^{${pow}}`) : termTex(T(c.p < 0 ? qNeg(c) : c, pow, 0, c.q === 1 ? undefined : 'over'));
  const neg = c.p < 0;
  return first ? (neg ? '-' : '') + body : `${neg ? '-' : '+'}\\,${body}`;
}

export function LongDiv(p: LdParams, fr: Frame, th: Theme): LdBlock {
  const P = trim(p.P), D = trim(p.D);
  const n = degOf(P), m = degOf(D);
  check(n !== null && m !== null, NAME, 'P and D must be nonzero polynomials');
  check(n! <= 5 && m! <= 3, NAME, 'degree too large to lay out');
  const dv = divide(P, D);
  const N = n!;
  const colOf = (pow: number) => N - pow;            // column index of a power
  const rowsSrc: { id: LdRow; step: string; col: Paint; terms: { c: Q; pow: number }[]; product?: boolean }[] = [];
  // the quotient row: one cell per cycle, in the column of its power
  rowsSrc.push({ id: 'q', step: 'q', col: 'link', terms: dv.cycles.map(cy => ({ c: cy.t, pow: cy.pow })) });
  rowsSrc.push({ id: 'P', step: 'frame', col: 'first', terms: P.map((c, i) => ({ c, pow: N - i })) });
  dv.cycles.forEach((cy, i) => {
    const pr = trim(cy.prod), dp = pr.length - 1;
    rowsSrc.push({ id: 'm' + i, step: 'm' + i, col: 'dim', product: true, terms: pr.slice(0, m! + 1).map((c, j) => ({ c, pow: dp - j })) });
    const af = trim(cy.after), da = degOf(af);
    rowsSrc.push({ id: 's' + i, step: 's' + i, col: i === dv.cycles.length - 1 ? 'pick' : 'ink', terms: da === null ? [{ c: { p: 0, q: 1 } as Q, pow: 0 }] : af.map((c, j) => ({ c, pow: da - j })) });
  });
  // TeX per cell (the product row is written −(… ) with the minus and brackets around its terms)
  const built = rowsSrc.map(r => r.terms.map((t, j) => {
    let src = termSrc(t.c, t.pow, j === 0);
    if (r.product && j === 0) src = `-(${src}`;
    return { src, pow: t.pow, last: r.product && j === r.terms.length - 1 };
  }));
  // the quotient row's first term carries no plus; later quotient terms do (they sit in later columns)
  const FD = tex(pT(D)) as Formula, FR = tex(')') as Formula, FQm = tex('?') as Formula;
  const cellsF = built.map(r => r.map(c => ({ F: tex(c.src) as Formula, pow: c.pow, tail: c.last ? FR : undefined })));
  // widths at 100 px
  const colW = Array.from({ length: N + 1 }, (_, j) => Math.max(60, ...cellsF.flatMap(r => r.filter(c => colOf(c.pow) === j).map(c => texWidth(c.F, 100) + (c.tail ? texWidth(FR, 100) + 8 : 0)))));
  const GAP = 34;
  const divW = texWidth(FD, 100) + 70;
  const w100 = divW + colW.reduce((a, b) => a + b + GAP, 0);
  const nRows = rowsSrc.length;
  const RH = 1.36;
  let S = Math.min(p.max ?? 84, (fr.w * 100) / w100, (fr.h - 30) / (nRows * RH + 0.4));
  S = Math.floor(S);
  check(S >= 60, NAME, `the layout needs ${Math.round((w100 * 60) / 100)} px by ${Math.round(nRows * RH * 60)} px at 60 px type`);
  const k = S / 100;
  const W = w100 * k, H = nRows * RH * S;
  const x0 = fr.x + (fr.w - W) / 2, y0 = fr.y + Math.max(0, (fr.h - H) / 2) + S * 0.7;
  const bx = x0 + divW * k - 18;                                       // the bracket
  const colR: number[] = [];                                          // right edge of each column
  let xx = bx + 30;
  for (let j = 0; j <= N; j++) { xx += colW[j]! * k; colR.push(xx); xx += GAP * k; }
  const right = colR[N]! + 10;
  const rowY = (i: number) => y0 + i * RH * S + (i >= 1 ? S * 0.25 : 0);
  const rows: Row[] = rowsSrc.map((r, i) => ({ id: r.id, y: rowY(i), cells: cellsF[i]!, step: r.step, col: r.col }));
  // rules under each product row, spanning its columns
  rows.forEach((r, i) => {
    if (!rowsSrc[i]!.product) return;
    const cs = r.cells;
    const l = colR[colOf(cs[0]!.pow)]! - texWidth(cs[0]!.F, S) - 6, rr = colR[colOf(cs[cs.length - 1]!.pow)]! + texWidth(FR, S) + 8;
    r.rule = [l, rr];
  });
  const cellBox = (r: Row, c: Cell) => { const x1 = colR[colOf(c.pow)]!; return box(x1 - texWidth(c.F, S), r.y - S * 0.55, x1 + (c.tail ? texWidth(FR, S) + 6 : 0), r.y + S * 0.45); };
  const rowBox = (id: LdRow) => { const r = rows.find(x => x.id === id); check(r, NAME, `no row ${id}`); return r.cells.length ? unionBox(r.cells.map(c => cellBox(r, c))) : box(bx, r.y - S / 2, right, r.y + S / 2); };
  const all = box(x0, y0 - S * 0.7, right, rows[rows.length - 1]!.y + S * 0.6);
  check(all.x1 <= fr.x + fr.w + 2 && all.y1 <= fr.y + fr.h + 2, NAME, 'layout leaves the frame');
  const divBox = box(bx - 22 - texWidth(FD, S), rows[1]!.y - S * 0.55, bx - 22, rows[1]!.y + S * 0.45);
  const remRow = rows[rows.length - 1]!;

  function ring(c: Canvas, b: Box, col: Paint, kk: number): void {
    if (kk <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(kk); g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = 5;
    g.beginPath(); g.roundRect(b.x0 - 16, b.y0 - 10, b.w + 32, b.h + 20, 14); g.stroke(); g.restore();
  }
  function draw(c: Canvas, PR: Progress<string>, f: LdFocus = {}): void {
    const kF = PR.k('frame');
    if (kF <= 0) return;
    const { g } = c;
    const dimOf = (id: string) => (f.only && !f.only.rows.includes(id) ? 0.65 * clamp(f.only.k) : 0);
    // divisor and bracket
    texDraw(c, FD, bx - 22, rows[1]!.y, { size: S, align: 'right', k: kF, col: 'second', alpha: 1 - dimOf('D') });
    g.save(); g.globalAlpha *= clamp(kF * 1.5); g.strokeStyle = paint(th, 'ink', 'line'); g.lineWidth = 4; g.lineCap = 'round';
    const top = rows[1]!.y - S * 0.78, bot = rows[1]!.y + S * 0.55;
    g.beginPath(); g.moveTo(right, top); g.lineTo(bx, top); g.quadraticCurveTo(bx + 16, (top + bot) / 2, bx - 4, bot); g.stroke(); g.restore();
    rows.forEach((r, ri) => {
      const isQ = r.id === 'q';
      const alpha = 1 - dimOf(r.id);
      r.cells.forEach((cell, j) => {
        const kk = isQ ? PR.k('q' + j) : PR.k(r.step);
        if (kk <= 0) return;
        const x1 = colR[colOf(cell.pow)]!;
        const asked = isQ && f.ask && f.ask.i === j ? f.ask : null;
        if (asked && asked.reveal < 1) texDraw(c, FQm, x1, r.y, { size: S, align: 'right', k: kk, col: 'link', alpha: alpha * (1 - asked.reveal) });
        const kv = asked ? Math.min(kk, asked.reveal) : kk;
        const col = r === remRow && ri > 1 ? (f.rem ? 'pick' : r.col) : r.col;
        if (kv > 0) texDraw(c, cell.F, x1, r.y, { size: S, align: 'right', k: kv, col, alpha, glow: r === remRow && f.rem ? 10 * f.rem : 0, glowCol: 'pick' });
        if (cell.tail && kk > 0) texDraw(c, cell.tail, x1 + 4, r.y, { size: S, align: 'left', k: kk, col: r.col, alpha });
      });
      if (r.rule) {
        const kr = PR.k('s' + r.id.slice(1));
        if (kr > 0) {
          g.save(); g.globalAlpha *= clamp(kr * 2) * alpha; g.strokeStyle = paint(th, 'ink', 'line'); g.lineWidth = 3.5;
          const yR = r.y + S * 0.62;
          g.beginPath(); g.moveTo(r.rule[0], yR); g.lineTo(r.rule[0] + (r.rule[1] - r.rule[0]) * clamp(kr * 1.6), yR); g.stroke(); g.restore();
        }
      }
    });
    for (const cc of f.cancel ?? []) {
      if (cc.k <= 0) continue;
      const before = cc.i === 0 ? rows[1]! : rows.find(r => r.id === 's' + (cc.i - 1))!;
      const prod = rows.find(r => r.id === 'm' + cc.i)!;
      const lead = degOf(dv.cycles[cc.i]!.before)!;
      for (const r of [before, prod]) {
        const cell = r.cells.find(x => x.pow === lead);
        if (!cell) continue;
        const b = cellBox(r, cell);
        g.save(); g.globalAlpha *= clamp(cc.k); g.strokeStyle = paint(th, 'wrong', 'fill'); g.lineWidth = 5; g.lineCap = 'round';
        g.beginPath(); g.moveTo(b.x0 + 4, b.y1 - 6); g.lineTo(b.x0 + 4 + (b.w - 8) * clamp(cc.k), b.y1 - 6 - (b.h - 14) * clamp(cc.k)); g.stroke(); g.restore();
      }
    }
    for (const rg of f.rings ?? []) ring(c, rowBox(rg.row), rg.col, rg.k);
  }
  return {
    kind: 'LongDiv', cycles: dv.cycles.length, size: S,
    where: { all, row: rowBox, divisor: divBox, remainder: rowBox(remRow.id) },
    draw,
  };
}
/** the steps of the whole division in order (frame, q0, m0, s0, q1, ...) */
export const ldSteps = (cycles: number): string[] => ['frame', ...Array.from({ length: cycles }, (_, i) => [`q${i}`, `m${i}`, `s${i}`]).flat()];
export { qNeg };
