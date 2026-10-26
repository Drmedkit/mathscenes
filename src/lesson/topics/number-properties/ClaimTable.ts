// ClaimTable: a claim that says "always" put to the test, one row of values at a time.
// The claim sits on top (left side ?= right side); the table has a column per letter, the value of each side, and a
// mark: ✓ when the two sides are equal for that row, ✗ when they differ. A ✗ row is a counterexample: it glows red
// and the claim is struck. Rows that agree never prove an "always" claim about infinitely many numbers; that is
// the lesson the picture carries.
//
// Steps: claim, head, r0..r3 (the letters' values of a row), v0..v3 (the two sides worked out), m0..m3 (the mark), strike.
// Could move to the kit: a value table for testing identities and claims (with marks and a struck claim).
import { type Box, box, clamp } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas, strike } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { type Formula, tex, texBox, texDraw, texWidth } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { drawWords } from '../../words';
import { wash } from '../../wash';

/** a row; without left/right the sides are not worked out yet (only the letters' values show) */
export interface ClaimRow { vals: readonly string[]; left?: string; right?: string; ok?: boolean }
export interface ClaimParams {
  /** TeX of the two sides */
  left: string; right: string;
  /** the letters (TeX) */
  vars: readonly string[];
  rows: readonly ClaimRow[];
  /** words under the claim ("for every number a and b") */
  scope?: string;
}
export type ClaimStep = 'claim' | 'head' | 'strike' | `r${number}` | `v${number}` | `m${number}`;
export interface ClaimFocus { rings?: readonly { i: number; col: Paint; k: number }[]; hideMarks?: boolean }
export interface ClaimBlock {
  readonly kind: 'ClaimTable';
  readonly where: { claim: Box; row(i: number): Box; cell(i: number, col: number): Box; left(i: number): Box; right(i: number): Box };
  draw(c: Canvas, P: Progress<ClaimStep>, f?: ClaimFocus): void;
}
const NAME = 'ClaimTable';

export function ClaimTable(p: ClaimParams, fr: Frame, th: Theme): ClaimBlock {
  check(p.rows.length <= 4, NAME, 'at most 4 rows');
  const nRows = Math.max(1, p.rows.length);
  check(p.vars.length >= 1 && p.vars.length <= 3, NAME, '1 to 3 letters');
  for (const r of p.rows) {
    check(r.vals.length === p.vars.length, NAME, 'a value for every letter');
    if (r.left === undefined || r.right === undefined) continue;
    if (r.ok) check(r.left === r.right, NAME, `a ✓ row has equal sides (${r.left} vs ${r.right})`);
    else check(r.left !== r.right, NAME, 'a ✗ row has different sides');
  }
  const claimF = tex(`${p.left} \\overset{?}{=} ${p.right}`) as Formula;
  let cs = 80;
  while (cs > 60 && texWidth(claimF, cs) > fr.w - 60) cs -= 2;
  check(texWidth(claimF, cs) <= fr.w - 40, NAME, 'the claim is too wide');
  const head = [...p.vars, p.left, p.right].map(s => tex(s) as Formula);
  const cells = p.rows.map(r => [...r.vals, r.left ?? '', r.right ?? ''].map(s => (s ? tex(s) as Formula : null)));
  const nc = p.vars.length + 2;
  const MARK = 110;
  let size = 66, colW: number[] = [];
  for (;;) {
    colW = Array.from({ length: nc }, (_, j) => Math.max(texWidth(head[j]!, Math.min(size, 64)), ...cells.map(r => (r[j] ? texWidth(r[j]!, size) : 0))) + 44);
    if (colW.reduce((s, w) => s + w, 0) + MARK <= fr.w - 40 || size <= 60) break;
    size -= 2;
  }
  // spread the spare width over the columns
  const spare = fr.w - 40 - MARK - colW.reduce((s, w) => s + w, 0);
  check(spare >= 0, NAME, 'the table is too wide');
  colW = colW.map(w => w + spare / nc);
  const xs: number[] = []; { let x = fr.x + 20; for (const w of colW) { xs.push(x); x += w; } xs.push(x); }
  const markX = xs[nc]! + MARK / 2;
  const claimY = fr.y + 78, scopeY = fr.y + 168, headY = fr.y + (p.scope ? 290 : 250), rowY = (i: number) => headY + 150 + i * 138;
  check(rowY(nRows - 1) + 70 <= fr.y + fr.h, NAME, 'the rows do not fit');
  const cellBox = (i: number, j: number) => box(xs[j]!, rowY(i) - 64, xs[j + 1]!, rowY(i) + 64);
  const rowBox = (i: number) => box(fr.x + 12, rowY(i) - 64, fr.x + fr.w - 12, rowY(i) + 64);
  const claimBox = texBox(claimF, fr.x + fr.w / 2, claimY, { size: cs, align: 'center' });
  const CHECK = tex('\\checkmark') as Formula, CROSS = tex('\\times') as Formula;

  function draw(c: Canvas, P: Progress<ClaimStep>, f: ClaimFocus = {}): void {
    const kC = P.k('claim');
    if (kC > 0) {
      texDraw(c, claimF, fr.x + fr.w / 2, claimY, { size: cs, align: 'center', k: kC });
      if (p.scope) drawWords(c, p.scope, fr.x + fr.w / 2, scopeY, 'dim', kC, { size: 44, align: 'center' });
      const ks = P.k('strike');
      if (ks > 0) strike(c, claimBox.x0 - 14, claimBox.cy + 8, claimBox.x1 + 14, claimBox.cy - 8, ks, { col: 'wrong' });
    }
    const kH = P.k('head');
    if (kH > 0) {
      const a = E.smooth(clamp(kH));
      const tb = box(fr.x + 6, headY - 74, fr.x + fr.w - 6, rowY(nRows - 1) + 74);
      wash(c, rectPts(tb.x0, tb.y0, tb.w, tb.h, 20), '#1D2248', { seed: 404, rough: 1.2, ink: null, alpha: a * 0.9, shade: 0.08 });
      head.forEach((F, j) => texDraw(c, F, (xs[j]! + xs[j + 1]!) / 2, headY, { size: Math.min(size, 64), align: 'center', k: kH, col: j < p.vars.length ? 'second' : 'first' }));
      // crisp rules: under the header, between the letters and the sides, before the mark column
      const { g } = c;
      g.save(); g.globalAlpha *= a; g.strokeStyle = paint(th, 'faint', 'line'); g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(fr.x + 20, headY + 72); g.lineTo(fr.x + fr.w - 20, headY + 72);
      for (const j of [p.vars.length, p.vars.length + 1, nc]) { g.moveTo(xs[j]!, headY - 60); g.lineTo(xs[j]!, rowY(nRows - 1) + 62); }
      g.stroke(); g.restore();
    }
    p.rows.forEach((r, i) => {
      const kr = P.k(`r${i}`), kv = P.k(`v${i}`), km = f.hideMarks ? 0 : P.k(`m${i}`);
      if (kr <= 0) return;
      const bad = !r.ok && km > 0;
      if (bad) {
        const b = rowBox(i);
        wash(c, rectPts(b.x0, b.y0, b.w, b.h, 18), 'wrong', { seed: 410 + i, rough: 1, ink: null, alpha: 0.18 * clamp(km), shade: 0 });
      }
      cells[i]!.forEach((F, j) => {
        if (!F) return;
        const k = j < p.vars.length ? kr : kv;
        if (k > 0) texDraw(c, F, (xs[j]! + xs[j + 1]!) / 2, rowY(i), { size, align: 'center', k, col: j < p.vars.length ? 'ink' : bad ? 'wrong' : 'ink' });
      });
      if (km > 0 && r.left !== undefined) texDraw(c, r.ok ? CHECK : CROSS, markX, rowY(i), { size: 70, align: 'center', k: km, col: r.ok ? 'link' : 'wrong' });
      for (const R of f.rings ?? []) if (R.i === i && R.k > 0) {
        const b = rowBox(i), { g } = c;
        g.save(); g.globalAlpha *= clamp(R.k); g.strokeStyle = paint(th, R.col, 'fill'); g.lineWidth = 5;
        g.beginPath(); g.roundRect(b.x0, b.y0, b.w, b.h, 18); g.stroke(); g.restore();
      }
    });
  }
  return {
    kind: 'ClaimTable',
    where: {
      claim: claimBox, row: rowBox, cell: cellBox,
      left: i => cellBox(i, p.vars.length), right: i => cellBox(i, p.vars.length + 1),
    },
    draw,
  };
}
