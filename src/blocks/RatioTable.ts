// RatioTable: a two-column ratio table. Row i holds a·k_i : b·k_i (computed exactly), with ×k arrows on BOTH sides
// (the same multiplier on both columns is the whole point), built row by row, one row can be highlighted.
//
//   const t = RatioTable({ a: 2, b: 3, ks: [1, 2, 3], headers: ['lemon', 'water'] }, frame(1000, 220, 840, 700), ink);
//   t.draw(c, progress)            // steps: grid, head, row0, arrow1, row1, arrow2, row2, hl, emph
import { type Box, type Pt, type Q, box, clamp, qDiv, qEq, qMul, qNum, qTex, unionBox } from '../core/math';
import { E } from '../core/easing';
import { curvePts, rectPts } from '../core/pts';
import { type Canvas, arrow, drawOn } from '../core/draw';
import type { Progress } from '../core/clock';
import { type Role, type Theme } from '../core/theme';
import { type Formula, tex, texBox, texDraw, texWidth } from '../core/tex';
import { type Block, type Frame, type ParamSpec, check, friendly, hitsLines, plainText } from './block';

const NAME = 'RatioTable';

export interface RatioTableParams {
  /** the base ratio a : b */
  readonly a: number; readonly b: number;
  /** row multipliers (k = 1 is the base ratio); whole numbers or friendly fractions */
  readonly ks: readonly number[];
  /** column headers (plain words) */
  readonly headers: readonly [string, string];
  /** colour roles of the two columns (default lemon, water) */
  readonly roles?: readonly [Role, Role];
  /** colour role of the ×k arrows and the highlight (default ratio) */
  readonly accent?: Role;
  /** ×k arrows: each row from the first row, from the row before, or none */
  readonly arrows?: 'fromFirst' | 'consecutive' | 'none';
  /** row index to highlight (step 'hl') */
  readonly highlight?: number | null;
  /** an optional leading column showing k itself, with this header (e.g. 'batches') */
  readonly kHeader?: string | null;
  /** number size in px (default theme.font.num; never below theme.font.minNum) */
  readonly size?: number;
}
export type RatioTableStep = 'grid' | 'head' | `row${number}` | `arrow${number}` | 'hl' | 'emph';

export interface RatioRow { readonly k: Q; readonly a: Q; readonly b: Q }
export interface RatioArrow { readonly from: number; readonly to: number; readonly factor: Q; readonly tex: string }
export interface RatioTableMaths { readonly a: Q; readonly b: Q; readonly rows: readonly RatioRow[]; readonly arrows: readonly RatioArrow[] }

/** TeX for a multiplier between rows: ×2, ÷2, ×2½ */
export function factorTex(f: Q): string {
  if (f.q === 1) return `\\times ${f.p}`;
  if (f.p === 1) return `\\div ${f.q}`;
  return `\\times ${qTex(f)}`;
}

export const RATIO_TABLE_MAX_ROWS = 8;

/** the maths of a ratio table, validated */
export function computeRatioTable(P: RatioTableParams): RatioTableMaths {
  const a = friendly(P.a, NAME, 'a'), b = friendly(P.b, NAME, 'b');
  check(P.ks.length >= 1, NAME, 'needs at least one row');
  check(P.ks.length <= RATIO_TABLE_MAX_ROWS, NAME, `at most ${RATIO_TABLE_MAX_ROWS} rows (got ${P.ks.length})`);
  const ks = P.ks.map((k, i) => friendly(k, NAME, `row ${i + 1} multiplier`));
  ks.forEach((k, i) => ks.slice(0, i).forEach((k2, j) => check(!qEq(k, k2), NAME, `rows ${j + 1} and ${i + 1} have the same multiplier ${qNum(k)}`)));
  const rows = ks.map(k => ({ k, a: qMul(a, k), b: qMul(b, k) }));
  // every row must be the same ratio as a : b (it is by construction: this guards any future change)
  const base = qDiv(a, b);
  rows.forEach((r, i) => check(qEq(qDiv(r.a, r.b), base), NAME, `row ${i + 1} is not equivalent to ${qTex(a)} : ${qTex(b)}`));
  const mode = P.arrows ?? 'fromFirst';
  const arrows: RatioArrow[] = [];
  if (mode !== 'none') for (let i = 1; i < rows.length; i++) {
    const from = mode === 'fromFirst' ? 0 : i - 1;
    const factor = qDiv(rows[i]!.k, rows[from]!.k);
    arrows.push({ from, to: i, factor, tex: factorTex(factor) });
  }
  if (P.highlight !== undefined && P.highlight !== null)
    check(Number.isInteger(P.highlight) && P.highlight >= 0 && P.highlight < rows.length, NAME, `highlight row ${P.highlight} does not exist`);
  plainText(P.headers[0], NAME, 'header 1'); plainText(P.headers[1], NAME, 'header 2');
  if (P.kHeader) plainText(P.kHeader, NAME, 'k header');
  return { a, b, rows, arrows };
}

export function ratioTableSteps(rows: number, withArrows: boolean): RatioTableStep[] {
  const s: RatioTableStep[] = ['grid', 'head', 'row0'];
  for (let i = 1; i < rows; i++) { if (withArrows) s.push(`arrow${i}`); s.push(`row${i}`); }
  s.push('hl', 'emph');
  return s;
}

export interface RatioTableBlock extends Block<RatioTableStep> {
  readonly maths: RatioTableMaths;
  /** centre of a cell: col 'k' | 'a' | 'b', row i */
  cell(col: 'k' | 'a' | 'b', row: number): Pt;
}

export function RatioTable(P: RatioTableParams, f: Frame, th: Theme): RatioTableBlock {
  const M = computeRatioTable(P);
  const roles = P.roles ?? (['lemon', 'water'] as const), acc: Role = P.accent ?? 'ratio';
  const n = M.rows.length, withK = !!P.kHeader;
  // ---- sizes: readability rules first ----
  const want = Math.max(th.font.minNum, P.size ?? th.font.num);
  const headSize = Math.max(th.font.label, Math.round(want * 0.64)), headH = Math.round(headSize * 1.9);
  let rowH = Math.min(want * 1.45, (f.h - headH) / n);
  const numSize = Math.min(want, rowH / 1.4);
  check(numSize >= th.font.minNum, NAME, `${n} rows do not fit in ${Math.round(f.h)} px (numbers would be ${Math.round(numSize)} px, minimum ${th.font.minNum}): at most ${Math.floor((f.h - headH) / (th.font.minNum * 1.4))} rows`);
  rowH = Math.max(rowH, numSize * 1.4);
  const arrowSize = Math.max(th.font.minNum, Math.round(numSize * 0.85));

  const cols: ('k' | 'a' | 'b')[] = withK ? ['k', 'a', 'b'] : ['a', 'b'];
  const headSrc = { k: `\\text{${P.kHeader ?? ''}}`, a: `\\text{${P.headers[0]}}`, b: `\\text{${P.headers[1]}}` };
  const valSrc = (c: 'k' | 'a' | 'b', r: RatioRow) => qTex(c === 'k' ? r.k : c === 'a' ? r.a : r.b);
  const HF = { k: tex(headSrc.k), a: tex(headSrc.a), b: tex(headSrc.b) };
  const VF = M.rows.map(r => ({ k: tex(valSrc('k', r)), a: tex(valSrc('a', r)), b: tex(valSrc('b', r)) }));
  const AF = M.arrows.map(ar => tex(ar.tex));
  const wOf = (F: Formula, size: number) => texBox(F, 0, 0, { size, align: 'center' }).w;
  const padX = 36;
  const colW = Math.max(170, ...cols.flatMap(c => [wOf(HF[c], headSize), ...VF.map(v => wOf(v[c], numSize))]).map(w => w + 2 * padX));
  // ×k arrows: the label sits in a column beside the row it makes ("×2  4 | 6  ×2"); the arc leaves the from-row,
  // swings outside that label column and points back at the label. Nested arcs (from the first row) bulge further.
  const bulge = (ar: RatioArrow) => 46 + 44 * (ar.to - ar.from - 1);
  const labelW = Math.max(0, ...AF.map(F => texWidth(F, arrowSize)));          // advance width (includes the × spacing)
  const gapT = 16, gapL = 14;                                       // table -> label column, label column -> arcs
  const zone = M.arrows.length ? gapT + labelW + gapL + Math.max(...M.arrows.map(bulge)) / 2 + 14 : 0;
  // rows holding fractions (1½) are taller than digits: the row pitch follows the tallest ink
  const inkH = Math.max(...VF.flatMap(v => cols.map(col => texBox(v[col], 0, 0, { size: numSize, align: 'center' }).h)));
  rowH = Math.max(rowH, inkH + 44);
  check(headH + n * rowH <= f.h + 1, NAME, `${n} rows of this height do not fit in ${Math.round(f.h)} px`);
  const tableW = cols.length * colW, totalW = tableW + 2 * zone, totalH = headH + n * rowH;
  check(totalW <= f.w, NAME, `table is ${Math.round(totalW)} px wide but the frame is ${Math.round(f.w)} px: use fewer columns or smaller numbers`);
  const x0 = f.x + (f.w - tableW) / 2, x1 = x0 + tableW, top = f.y + (f.h - totalH) / 2, bottom = top + totalH;
  const colX = (c: 'k' | 'a' | 'b') => x0 + (cols.indexOf(c) + 0.5) * colW;
  const rowY = (i: number) => top + headH + (i + 0.5) * rowH;
  const headY = top + headH / 2;

  // ---- geometry ----
  const ruleY = top + headH;
  const rule: Pt[] = [[x0 + 8, ruleY], [x1 - 8, ruleY]];
  const dividers: Pt[][] = cols.slice(1).map((_, j) => [[x0 + (j + 1) * colW, top + 14], [x0 + (j + 1) * colW, bottom - 14]]);
  interface ArrowGeo { L: Pt[]; R: Pt[]; labL: Pt; labR: Pt; F: Formula }
  const labelled = new Set(M.arrows.map(a => a.to));
  const arrowGeo: ArrowGeo[] = M.arrows.map((ar, j) => {
    const bl = bulge(ar), y0 = rowY(ar.from) + (labelled.has(ar.from) ? 30 : 0), y1 = rowY(ar.to);
    const side = (dir: -1 | 1): Pt[] => {
      const edge = dir < 0 ? x0 - gapT : x1 + gapT, xs = edge + dir * (labelW + gapL);
      const lead: Pt[] = labelled.has(ar.from) ? [] : [[edge, y0]];        // from an unlabelled row: a lead-in along it
      return [...lead, ...curvePts([xs, y0], [xs, y1 - 4], dir < 0 ? -bl : bl)];
    };
    return { L: side(-1), R: side(1), labL: [x0 - gapT, y1], labR: [x1 + gapT, y1], F: AF[j]! };
  });
  // ---- layout rules: no text over lines, labels inside the frame ----
  const lines: Pt[][] = [rule, ...dividers, ...arrowGeo.flatMap(g => [g.L, g.R])];
  const texts: Box[] = [];
  cols.forEach(c => texts.push(texBox(HF[c], colX(c), headY, { size: headSize, align: 'center' })));
  VF.forEach((v, i) => cols.forEach(c => texts.push(texBox(v[c], colX(c), rowY(i), { size: numSize, align: 'center' }))));
  arrowGeo.forEach(g => {
    texts.push(texBox(g.F, g.labL[0], g.labL[1], { size: arrowSize, align: 'right' }));
    texts.push(texBox(g.F, g.labR[0], g.labR[1], { size: arrowSize, align: 'left' }));
  });
  texts.forEach(b => check(!hitsLines(b, lines, 4), NAME, 'a label would sit on a line (try fewer rows or arrows between consecutive rows)'));
  const all = unionBox([...texts, box(x0, top, x1, bottom)]);
  check(all.x0 >= f.x - 1 && all.x1 <= f.x + f.w + 1, NAME, 'the arrow labels do not fit next to the table');

  const hl = P.highlight ?? null;
  const steps = ratioTableSteps(n, M.arrows.length > 0);
  const colRole = (c: 'k' | 'a' | 'b'): Role => (c === 'k' ? 'dim' : c === 'a' ? roles[0] : roles[1]);

  return {
    kind: NAME, steps, box: all, maths: M,
    cell: (c, r) => [colX(c), rowY(r)],
    draw(c: Canvas, p: Progress<RatioTableStep>) {
      const kg = p.k('grid'), kh = p.k('head'), emph = E.bump(p.k('emph'));
      // grid
      drawOn(c, rule, kg, { col: 'faint', lw: th.lw.thin });
      dividers.forEach(D => drawOn(c, D, clamp(kg * 1.3 - 0.3), { col: 'faint', lw: th.lw.thin }));
      // headers
      cols.forEach((col, j) => texDraw(c, HF[col], colX(col), headY, { size: headSize, align: 'center', col: colRole(col), k: clamp(kh * 1.6 - j * 0.3) }));
      // rows: k first (if shown), then a, then b
      VF.forEach((v, i) => {
        const kr = p.k(`row${i}`);
        if (kr <= 0) return;
        cols.forEach((col, j) => {
          const kc = clamp(kr * (cols.length === 3 ? 1.8 : 1.5) - j * (cols.length === 3 ? 0.4 : 0.5));
          texDraw(c, v[col], colX(col), rowY(i), { size: numSize, align: 'center', col: colRole(col), k: kc, lag: 0.5 });
        });
      });
      // ×k arrows on both sides, labels after the arcs
      arrowGeo.forEach((g, j) => {
        const ka = p.k(`arrow${M.arrows[j]!.to}`);
        if (ka <= 0) return;
        const kArc = clamp(ka / 0.7), kLab = clamp((ka - 0.45) / 0.55), gl = 16 * emph;
        const o = { col: acc, lw: th.lw.base, head: 18, glow: gl, glowCol: acc };
        arrow(c, g.L, kArc, o); arrow(c, g.R, kArc, o);
        texDraw(c, g.F, g.labL[0], g.labL[1], { size: arrowSize, align: 'right', col: acc, k: kLab, glow: gl });
        texDraw(c, g.F, g.labR[0], g.labR[1], { size: arrowSize, align: 'left', col: acc, k: kLab, glow: gl });
      });
      // highlight a row
      if (hl !== null) {
        const k = p.k('hl');
        if (k > 0) {
          const ink = unionBox(cols.map(col => texBox(VF[hl]![col], colX(col), rowY(hl), { size: numSize, align: 'center' })));
          const y0 = Math.min(rowY(hl) - (rowH - 14) / 2, ink.y0 - 12), y1 = Math.max(rowY(hl) + (rowH - 14) / 2, ink.y1 + 12);
          const R = rectPts(x0 + 6, y0, tableW - 12, y1 - y0, 22);
          drawOn(c, R, k, { col: acc, lw: th.lw.base, closed: true, glow: 12, glowCol: acc });
        }
      }
    },
  };
}

/** gallery: defaults + sliders */
export const RATIO_TABLE_DEMO: { params: RatioTableParams; specs: readonly ParamSpec<{ a: number; b: number; rows: number; highlight: number; consecutive: number; kColumn: number }>[] } = {
  params: { a: 2, b: 3, ks: [1, 2, 3], headers: ['lemon', 'water'], arrows: 'fromFirst', highlight: 2 },
  specs: [
    { key: 'a', label: 'a', min: 0, max: 12, step: 0.5 },
    { key: 'b', label: 'b', min: 0, max: 12, step: 0.5 },
    { key: 'rows', label: 'rows (k = 1..n)', min: 1, max: 10, step: 1 },
    { key: 'highlight', label: 'highlight row', min: -1, max: 9, step: 1 },
    { key: 'consecutive', label: 'arrows: from first / consecutive', min: 0, max: 1, step: 1 },
    { key: 'kColumn', label: 'k column', min: 0, max: 1, step: 1 },
  ],
};
export const ratioDemoParams = (v: { a: number; b: number; rows: number; highlight: number; consecutive: number; kColumn: number }): RatioTableParams => ({
  a: v.a, b: v.b, ks: Array.from({ length: v.rows }, (_, i) => i + 1), headers: ['lemon', 'water'],
  arrows: v.consecutive ? 'consecutive' : 'fromFirst', highlight: v.highlight < 0 ? null : v.highlight, kHeader: v.kColumn ? 'batches' : null,
});
