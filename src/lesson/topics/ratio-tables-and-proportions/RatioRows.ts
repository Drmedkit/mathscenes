// RatioRows: the model of "ratio tables and proportional relationships". A ratio table is a list of PAIRS that travel
// together; every new row comes from doing the SAME thing to both columns (× the same number, ÷ the same number, add
// two rows, subtract two rows). Never "add the same number to both".
//   shelf{i}   painted objects above the table (cups of lemon juice and water in trays, or cases of bottles): config i
//              regroups the objects of config i-1 (the cups move, new ones pop in) -- the concrete stage
//   table      the table card writes in (headers: a name and a unit per column), the given rows one by one
//   op{j}      operation j: × / ÷ arrows on BOTH sides of the table with the same label, or a + / − sign and a sum
//              line (row addition / subtraction written like column addition), then its result row writes in
//   zero       the row with input 0 (if any) writes in
//   quot       a third card: second ÷ first in every row (the constant of proportionality, or the row that breaks)
//   fill       hidden cells (shown as ?) turn into their values (the answer, link colour)
//   strike/fix a struck cell (red) that turns into its right value
//   axes, points, line, origin   a small first-quadrant graph of the pairs beside the table (enrichment)
// Two tables side by side (compare two ratios): the second table's keys start with 'B' (Btable, Bop0, Bquot, Bfill).
// Pure maths in computeTable() (exact rationals); the layout is pure too (planLayout with a measure function), so the
// tests check that every practice picture fits; the block throws BlockError instead of drawing something unreadable.
import { type Box, type Pt, type Q, box, clamp, lerp, qAdd, qDiv, qEq, qMul, rat } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas, arrow, dot, strike, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { type Frame, check } from '../../../blocks/block';
import { drawWords, wordsBox } from '../../words';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';

const NAME = 'RatioRows';
export const NUM = 60, LAB = 44;

// ---------- params ----------
/** how a column shows its numbers: plain (whole / decimal), money ($4.50), halves and fourths (2½) */
export type Fmt = 'n' | '$' | 'h';
export interface MulOp { kind: 'mul' | 'div'; from: number; to: number; f: number }
/** build-up: add one more copy of the base pair (+da on the left, +db on the right) */
export interface StepOp { kind: 'step'; from: number; to: number; da: number; db: number }
export interface RowOp { kind: 'add' | 'sub'; a: number; b: number; to: number }
export type Op = MulOp | StepOp | RowOp;
export type ArcOp = MulOp | StepOp;
/** an op drawn as arcs on both sides of the table */
export const isMul = (o: Op): o is ArcOp => o.kind === 'mul' || o.kind === 'div' || o.kind === 'step';
export interface TableSpec {
  /** [name, unit] of each column, e.g. [['lemon', '(cups)'], ['water', '(cups)']] */
  heads: readonly [readonly [string, string], readonly [string, string]];
  rows: readonly (readonly [number, number])[];
  fmt?: readonly [Fmt, Fmt];
  /** cells shown as ? until 'fill' */
  hide?: readonly (readonly [number, 0 | 1])[];
  ops?: readonly Op[];
  /** a third card: second ÷ first, with this header */
  quot?: readonly [string, string] | null;
  /** a title above the card (two tables side by side) */
  title?: string;
  /** the row revealed by 'zero' instead of 'table' */
  zero?: number | null;
  /** every row writes in with 'table' (ops only draw their arcs / signs): practice pictures ask about a shown row */
  showAll?: boolean;
  /** the tallest row (default 108 px) and whether the card sits at the top of its room instead of centred */
  rowH?: number; top?: boolean;
}
export interface ShelfSpec {
  /** cups: amber and teal cups in trays; case: an amber case per group holding teal bottles */
  style: 'cups' | 'case';
  /** each config: the groups, each [amber items, teal items] */
  configs: readonly (readonly (readonly [number, number])[])[];
  /** optional words under the trays of a config (null = none) */
  tags?: readonly (readonly (string | null)[] | null)[];
  /** the shelf in the middle of the frame (no table shown yet) instead of at the top */
  middle?: boolean;
}
export interface GraphSpec {
  pts: readonly (readonly [number, number])[];
  xMax: number; yMax: number; xGrid?: number; yGrid?: number;
  xName: string; yName: string;
}
export interface RRParams { tables: readonly TableSpec[]; shelf?: ShelfSpec | null; graph?: GraphSpec | null }

// ---------- maths ----------
/** an exact value from a number with at most 2 decimals (money, tenths, halves 0.5, fourths 0.25 / 0.75) */
export function q2(x: number): Q {
  check(Number.isFinite(x) && x >= 0, NAME, `values are numbers >= 0 (got ${x})`);
  const p = Math.round(x * 100);
  check(Math.abs(x * 100 - p) < 1e-6, NAME, `${x} has more than 2 decimals`);
  return rat(p, 100);
}
export type ZeroKind = 'none' | 'origin' | 'start';
export interface TableMaths {
  a: Q[]; b: Q[];
  /** second ÷ first per row (null when the first is 0) */
  quots: (Q | null)[];
  /** every row with a positive first value has the same quotient */
  constant: boolean;
  /** that quotient (or null) */
  k: Q | null;
  /** the first row (in table order) whose quotient differs from the first positive row's (-1 when constant) */
  firstBreak: number;
  zero: ZeroKind;
  /** constant and no start amount at 0 */
  proportional: boolean;
  /** for every op: does its result row follow from the arithmetic on both columns? */
  opOk: boolean[];
}
const qSub = (a: Q, b: Q): Q => rat(a.p * b.q - b.p * a.q, a.q * b.q);
export function computeTable(T: Pick<TableSpec, 'rows' | 'ops' | 'hide' | 'zero'>): TableMaths {
  check(T.rows.length >= 1 && T.rows.length <= 7, NAME, `1 to 7 rows (got ${T.rows.length})`);
  const a = T.rows.map(r => q2(r[0])), b = T.rows.map(r => q2(r[1]));
  const quots = a.map((x, i) => (x.p === 0 ? null : qDiv(b[i]!, x)));
  const pos = quots.map((q, i) => [q, i] as const).filter(([q]) => q !== null) as [Q, number][];
  let firstBreak = -1;
  for (const [q, i] of pos) if (!qEq(q, pos[0]![0])) { firstBreak = i; break; }
  const constant = pos.length > 0 && firstBreak < 0;
  const zi = a.findIndex(x => x.p === 0);
  const zero: ZeroKind = zi < 0 ? 'none' : b[zi]!.p === 0 ? 'origin' : 'start';
  const opOk = (T.ops ?? []).map(op => {
    const n = T.rows.length;
    if (isMul(op)) {
      check(op.from >= 0 && op.from < n && op.to >= 0 && op.to < n && op.from !== op.to, NAME, 'an arrow joins two different rows');
      if (op.kind === 'step') return qEq(qAdd(a[op.from]!, q2(op.da)), a[op.to]!) && qEq(qAdd(b[op.from]!, q2(op.db)), b[op.to]!);
      check(Number.isInteger(op.f) && op.f >= 2, NAME, `a multiplier is a whole number >= 2 (got ${op.f})`);
      const f = rat(op.f);
      const ta = op.kind === 'mul' ? qMul(a[op.from]!, f) : qDiv(a[op.from]!, f), tb = op.kind === 'mul' ? qMul(b[op.from]!, f) : qDiv(b[op.from]!, f);
      return qEq(ta, a[op.to]!) && qEq(tb, b[op.to]!);
    }
    check(op.b === op.a + 1 && op.to === op.b + 1 && op.to < n, NAME, 'row addition / subtraction is written on three rows in a row (a, b, result)');
    const ta = op.kind === 'add' ? qAdd(a[op.a]!, a[op.b]!) : qSub(a[op.a]!, a[op.b]!), tb = op.kind === 'add' ? qAdd(b[op.a]!, b[op.b]!) : qSub(b[op.a]!, b[op.b]!);
    if (op.kind === 'sub') check(ta.p > 0 && tb.p > 0, NAME, 'subtract the smaller row from the larger one');
    return qEq(ta, a[op.to]!) && qEq(tb, b[op.to]!);
  });
  check(opOk.every(Boolean), NAME, 'an operation does not give its result row on both columns');
  for (const [r, c] of T.hide ?? []) check(r >= 0 && r < T.rows.length && (c === 0 || c === 1), NAME, `hidden cell ${r},${c} does not exist`);
  if (T.zero !== undefined && T.zero !== null) check(a[T.zero]?.p === 0, NAME, 'the zero row has input 0');
  return { a, b, quots, constant, k: constant ? pos[0]![0] : null, firstBreak, zero, proportional: constant && zero !== 'start', opOk };
}

// ---------- number text ----------
const FR_GLYPH: Record<number, string> = { 25: '¼', 50: '½', 75: '¾' };
/** a value as the table shows it */
export function fmtVal(v: number, f: Fmt, cents = false): string {
  if (f === '$') return '$' + (cents || !Number.isInteger(v) ? v.toFixed(2) : String(v));
  if (f === 'h') {
    const w = Math.floor(v + 1e-9), r = Math.round((v - w) * 100);
    if (r === 0) return String(w);
    const g = FR_GLYPH[r];
    if (g) return (w ? String(w) : '') + g;
  }
  return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100);
}
/** a quotient as text: 8, 1.5, 4.25, else 7/4 */
export function fmtQ(q: Q | null): string {
  if (!q) return 'none';
  if (q.q === 1) return String(q.p);
  let d = q.q;
  while (d % 2 === 0) d /= 2;
  while (d % 5 === 0) d /= 5;
  if (d === 1) { const v = q.p / q.q; const s = String(Math.round(v * 1000) / 1000); if (s.length <= 5) return s; }
  return `${q.p}/${q.q}`;
}
export function cellTexts(T: TableSpec): [string, string][] {
  const f = T.fmt ?? ['n', 'n'];
  const cents = [0, 1].map(c => f[c] === '$' && T.rows.some(r => !Number.isInteger(r[c]!)));
  return T.rows.map(r => [fmtVal(r[0], f[0], cents[0]), fmtVal(r[1], f[1], cents[1])]);
}
export const opLabel = (op: Op, side: 0 | 1 = 0): string => (op.kind === 'mul' ? `×${op.f}` : op.kind === 'div' ? `÷${op.f}` : op.kind === 'step' ? `+${fmtVal(side ? op.db : op.da, 'n')}` : op.kind === 'add' ? '+' : '−');

// ---------- layout (pure: a measure function gives text widths) ----------
export type Measure = (t: string, size: number, weight?: number) => number;
/** a generous estimate for tests (no canvas in node) */
export const roughMeasure: Measure = (t, size) => [...t].reduce((w, ch) => w + size * (/[0-9$.]/.test(ch) ? 0.58 : /[il1.,'|]/.test(ch) ? 0.3 : /[mwMW]/.test(ch) ? 0.88 : /[A-Z]/.test(ch) ? 0.68 : 0.56), 0);

interface Lab { t: string; x: number; y: number; size: number; align: 'left' | 'center' | 'right'; b: Box }
interface OpGeom { op: Op; lane: number; labL: Lab | null; labR: Lab | null; sign: Lab | null; sumY: number }
export interface TableGeom {
  spec: TableSpec; m: TableMaths; texts: [string, string][];
  card: Box; qcard: Box | null; title: Lab | null;
  heads: Lab[]; qheads: Lab[];
  cells: [Lab, Lab][]; qcells: Lab[];
  rowY: number[]; rh: number;
  xA0: number; xB0: number; xB1: number; xQ0: number;
  ops: OpGeom[];
  /** the row an op reveals (or -1) */ revealBy: number[];
}
export interface GraphGeom { spec: GraphSpec; card: Box; grid: Box; px: (x: number, y: number) => Pt; xt: Lab[]; yt: Lab[]; xn: Lab; yn: Lab; xGrid: number; yGrid: number }
export interface ShelfItem { x: number; y: number; w: number; h: number }
export interface ShelfConfig { trays: Box[]; amber: ShelfItem[]; teal: ShelfItem[]; tags: (Lab | null)[] }
export interface Layout { tables: TableGeom[]; graph: GraphGeom | null; shelf: ShelfConfig[] | null; shelfBox: Box | null }

export function planLayout(P: RRParams, fr: Frame, measure: Measure): Layout {
  const fx0 = fr.x, fy0 = fr.y, fx1 = fr.x + fr.w, fy1 = fr.y + fr.h;
  check(P.tables.length >= 1 && P.tables.length <= 2, NAME, 'one or two tables');
  check(!(P.graph && P.tables.length > 1), NAME, 'a graph sits beside one table');
  const lab = (t: string, x: number, y: number, size: number, align: Lab['align'] = 'center', weight = 600): Lab => {
    const w = measure(t, size, weight), x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    return { t, x, y, size, align, b: box(x0, y - size * 0.42, x0 + w, y + size * 0.42) };
  };
  // ----- shelf -----
  let shelf: ShelfConfig[] | null = null, shelfBox: Box | null = null, top = fy0;
  if (P.shelf) {
    const sy = P.shelf.middle ? (fy0 + fy1) / 2 - 150 : fy0 + 4;
    shelfBox = box(fx0 + 6, sy, fx1 - 6, sy + 232);
    shelf = P.shelf.configs.map((cf, i) => {
      const L = layoutShelf(P.shelf!.style, cf, shelfBox!);
      const tg = P.shelf!.tags?.[i] ?? null;
      L.tags = L.trays.map((T, g) => {
        const t = tg?.[g];
        if (!t) return null;
        const l = lab(t, T.cx, T.y1 + 44, LAB, 'center', 600);
        check(l.b.w <= T.w + 30, NAME, `the tag "${t}" is wider than its tray`);
        return l;
      });
      return L;
    });
    // a shelf in the middle stands alone (part 1): the table, not shown yet, keeps the full frame
    top = P.shelf.middle ? fy0 : shelfBox.y1 + 40;
  }
  // ----- regions -----
  const regions: Box[] = [];
  if (P.tables.length === 2) { const mid = (fx0 + fx1) / 2; regions.push(box(fx0, top, mid - 14, fy1), box(mid + 14, top, fx1, fy1)); }
  else if (P.graph) regions.push(box(fx0, top, fx0 + 520, fy1));
  else regions.push(box(fx0, top, fx1, fy1));
  const tables = P.tables.map((T, j) => layoutTable(T, regions[j]!, lab, measure));
  // ----- graph -----
  let graph: GraphGeom | null = null;
  if (P.graph) graph = layoutGraph(P.graph, box(fx0 + 560, top, fx1, fy1), lab, measure);
  return { tables, graph, shelf, shelfBox };
}

function layoutShelf(style: 'cups' | 'case', groups: readonly (readonly [number, number])[], S: Box): ShelfConfig {
  const n = groups.length;
  check(n >= 1 && n <= 8, NAME, 'the shelf holds 1 to 8 groups');
  const gap = 22, trayW = Math.min(style === 'case' ? 170 : 560, (S.w - (n - 1) * gap) / n);
  const x0 = S.cx - (n * trayW + (n - 1) * gap) / 2;
  const trays: Box[] = [], amber: ShelfItem[] = [], teal: ShelfItem[] = [];
  groups.forEach(([na, nb], g) => {
    const tx = x0 + g * (trayW + gap);
    if (style === 'case') {
      check(na === 1, NAME, 'a case group is one case');
      const rows = nb > 5 ? 2 : 1, cols = Math.max(1, Math.ceil(nb / rows));
      const pitch = Math.min(46, (trayW - 34) / cols);
      check(pitch >= 20, NAME, `${nb} bottles do not fit in a case ${Math.round(trayW)} px wide`);
      const bw = pitch * 0.66, bh = bw * 2.3, th = rows * (bh + 12) + 34;
      const T = box(tx, S.cy - th / 2, tx + trayW, S.cy + th / 2);
      trays.push(T); amber.push({ x: T.cx, y: T.cy, w: T.w, h: T.h });
      for (let i = 0; i < nb; i++) {
        const r = Math.floor(i / cols), c = i % cols, inRow = Math.min(cols, nb - r * cols);
        teal.push({ x: T.cx + (c - (inRow - 1) / 2) * pitch, y: T.y0 + 17 + bh / 2 + 6 + r * (bh + 12), w: bw, h: bh });
      }
      return;
    }
    const cnt = na + nb;
    check(cnt >= 1, NAME, 'an empty tray');
    const rows = cnt * 34 > trayW - 24 ? 2 : 1, cols = Math.ceil(cnt / rows);
    const pitch = Math.min(50, (trayW - 26) / cols);
    check(pitch >= 20, NAME, `${cnt} cups do not fit in a tray ${Math.round(trayW)} px wide`);
    const cw = pitch * 0.76, ch = cw * 1.3, th = rows * (ch + 14) + 30;
    const T = box(tx, S.cy - th / 2, tx + trayW, S.cy + th / 2);
    trays.push(T);
    for (let i = 0; i < cnt; i++) {
      const r = Math.floor(i / cols), c = i % cols, inRow = Math.min(cols, cnt - r * cols);
      const it = { x: T.cx + (c - (inRow - 1) / 2) * pitch, y: T.y0 + 15 + ch / 2 + 7 + r * (ch + 14), w: cw, h: ch };
      (i < na ? amber : teal).push(it);
    }
  });
  return { trays, amber, teal, tags: [] };
}

function layoutTable(T: TableSpec, R: Box, lab: (t: string, x: number, y: number, size: number, align?: Lab['align'], weight?: number) => Lab, measure: Measure): TableGeom {
  const m = computeTable(T);
  const texts = cellTexts(T);
  const n = T.rows.length;
  for (const [s] of [T.heads[0], T.heads[1]]) check(s.trim().length > 0, NAME, 'a column needs a name');
  const hw = (h: readonly [string, string]) => Math.max(measure(h[0], LAB, 650), measure(h[1], LAB, 500));
  const numW = (c: 0 | 1) => Math.max(...texts.map(t => measure(t[c], NUM, 600)), measure('?', NUM));
  const wA = Math.max(170, hw(T.heads[0]) + 30, numW(0) + 44), wB = Math.max(170, hw(T.heads[1]) + 30, numW(1) + 44);
  const ops = T.ops ?? [];
  // lanes: × / ÷ arcs whose row spans overlap go further out
  const spans: [number, number, number][] = [];
  const lanes = ops.map(op => {
    if (!isMul(op)) return 0;
    const lo = Math.min(op.from, op.to), hi = Math.max(op.from, op.to);
    let lane = 0;
    while (spans.some(([a, b, l]) => l === lane && a < hi && lo < b)) lane++;
    spans.push([lo, hi, lane]);
    return lane;
  });
  const muls = ops.filter(o => o.kind === 'mul' || o.kind === 'div');
  const nLanes = muls.length ? Math.max(...lanes.filter((_, i) => ops[i]!.kind === 'mul' || ops[i]!.kind === 'div')) + 1 : 0;
  const labWL = muls.length ? Math.max(...muls.map(o => measure(opLabel(o, 0), NUM, 700))) : 0;
  const labWR = muls.length ? Math.max(...muls.map(o => measure(opLabel(o, 1), NUM, 700))) : 0;
  const hasSign = ops.some(o => o.kind === 'add' || o.kind === 'sub');
  const zL = Math.max(muls.length ? 40 + nLanes * 46 + labWL + 10 : 24, hasSign ? 76 : 0), zR = muls.length ? 40 + nLanes * 46 + labWR + 10 : 24;
  const quot = T.quot ?? null;
  const qtexts = m.quots.map(fmtQ);
  const wQ = quot ? Math.max(170, hw(quot) + 30, ...qtexts.map(t => measure(t, t === 'none' ? LAB : NUM, 600) + 40)) : 0;
  const gapQ = quot ? (muls.length ? 8 : 36) : 0;
  const W = zL + wA + wB + zR + gapQ + wQ;
  check(W <= R.w + 2, NAME, `the table is ${Math.round(W)} px wide, the room is ${Math.round(R.w)} px`);
  const x0 = R.cx - W / 2;
  const xA0 = x0 + zL, xB0 = xA0 + wA, xB1 = xB0 + wB, xQ0 = xB1 + zR + gapQ;
  // vertical: optional title, two header lines, the rows (a sum line adds a gap above its result row)
  const sumAbove = new Set(ops.filter(o => o.kind === 'add' || o.kind === 'sub').map(o => o.to));
  const gapSum = 18;
  const headH = 172, titleH = T.title ? 70 : 0;
  const avail = R.h - titleH - headH - 24 - sumAbove.size * gapSum;
  const rh = Math.min(T.rowH ?? 108, n > 1 ? avail / (n - 1 + 0.62) : 108);
  check(rh >= 84, NAME, `${n} rows do not fit (row height ${Math.round(rh)} px)`);
  const H = titleH + headH + (n - 1) * rh + rh * 0.62 + sumAbove.size * gapSum;
  const y0 = R.y0 + (T.top ? 0 : Math.max(0, Math.min(60, (R.h - H) / 2))) + titleH;
  const title = T.title ? lab(T.title, (xA0 + xB1) / 2, y0 - 40, LAB, 'center', 700) : null;
  const headY = y0 + 48, unitY = y0 + 96, row0 = y0 + headH;
  const rowY: number[] = [];
  let extra = 0;
  for (let i = 0; i < n; i++) { if (sumAbove.has(i)) extra += gapSum; rowY.push(row0 + i * rh + extra); }
  const xAc = (xA0 + xB0) / 2, xBc = (xB0 + xB1) / 2, xQc = xQ0 + wQ / 2;
  const heads = [lab(T.heads[0][0], xAc, headY, LAB, 'center', 650), lab(T.heads[0][1], xAc, unitY, LAB, 'center', 500), lab(T.heads[1][0], xBc, headY, LAB, 'center', 650), lab(T.heads[1][1], xBc, unitY, LAB, 'center', 500)];
  check(heads[0]!.b.x1 + 12 < heads[2]!.b.x0 && heads[1]!.b.x1 + 12 < heads[3]!.b.x0, NAME, 'the headers collide');
  const qheads = quot ? [lab(quot[0], xQc, headY, LAB, 'center', 650), lab(quot[1], xQc, unitY, LAB, 'center', 500)] : [];
  const cells = texts.map((t, i) => [lab(t[0], xAc, rowY[i]!, NUM), lab(t[1], xBc, rowY[i]!, NUM)] as [Lab, Lab]);
  const qcells = qtexts.map((t, i) => lab(t, xQc, rowY[i]!, t === 'none' ? LAB : NUM));
  const last = rowY[n - 1]! + rh * 0.62;
  const card = box(xA0 - 12, y0, xB1 + 12, last);
  const qcard = quot ? box(xQ0 - 6, y0, xQ0 + wQ + 6, last) : null;
  const revealBy = T.rows.map(() => -1);
  const og: OpGeom[] = ops.map((op, j) => {
    if (!isMul(op)) {
      if (!T.showAll) revealBy[op.to] = j;
      return { op, lane: 0, labL: null, labR: null, sign: lab(opLabel(op), xA0 - 40, rowY[op.b]!, NUM, 'center', 700), sumY: rowY[op.to]! - rh / 2 - gapSum / 2 + 4 };
    }
    if (!T.showAll) revealBy[op.to] = j;
    const lane = lanes[j]!, bul = 30 + lane * 46, ym = (rowY[op.from]! + rowY[op.to]!) / 2;
    return { op, lane, labL: lab(opLabel(op, 0), xA0 - 18 - bul - 14, ym, NUM, 'right', 700), labR: lab(opLabel(op, 1), xB1 + 18 + bul + 14, ym, NUM, 'left', 700), sign: null, sumY: 0 };
  });
  // labels of different arcs must not collide
  const L = og.flatMap(o => [o.labL, o.labR, o.sign].filter((x): x is Lab => !!x));
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
    const a = L[i]!.b, b = L[j]!.b;
    check(!(a.x0 < b.x1 + 6 && b.x0 < a.x1 + 6 && a.y0 < b.y1 + 4 && b.y0 < a.y1 + 4), NAME, 'two operation labels collide');
  }
  if (T.zero !== undefined && T.zero !== null) check(revealBy[T.zero] === -1, NAME, 'the zero row is not an op result');
  return { spec: T, m, texts, card, qcard, title, heads, qheads, cells, qcells, rowY, rh, xA0, xB0, xB1, xQ0, ops: og, revealBy };
}

function layoutGraph(G: GraphSpec, R: Box, lab: (t: string, x: number, y: number, size: number, align?: Lab['align'], weight?: number) => Lab, measure: Measure): GraphGeom {
  const xGrid = G.xGrid ?? 1, yGrid = G.yGrid ?? 1;
  check(G.xMax % xGrid === 0 && G.yMax % yGrid === 0, NAME, 'axis tops sit on grid lines');
  const nx = G.xMax / xGrid, ny = G.yMax / yGrid;
  check(nx <= 12 && ny <= 10, NAME, 'too many grid lines');
  for (const [x, y] of G.pts) check(x >= 0 && y >= 0 && x <= G.xMax && y <= G.yMax, NAME, `point (${x}, ${y}) is off the grid`);
  const tw = measure(String(G.yMax), NUM);
  const gx0 = R.x0 + tw + 50, gx1 = R.x1 - 30, gy0 = R.y0 + 96, gy1 = R.y1 - 150;
  check(gx1 - gx0 >= 300 && gy1 - gy0 >= 300, NAME, 'the graph is too small');
  const sx = (gx1 - gx0) / G.xMax, sy = (gy1 - gy0) / G.yMax;
  const px = (x: number, y: number): Pt => [gx0 + x * sx, gy1 - y * sy];
  const xs = (gx1 - gx0) / nx >= measure(String(G.xMax), NUM) + 30 ? 1 : 2, ys = (gy1 - gy0) / ny >= NUM + 4 ? 1 : 2;
  check((gx1 - gx0) / nx * xs >= measure(String(G.xMax), NUM) + 12, NAME, 'x tick labels collide');
  const xt = Array.from({ length: nx + 1 }, (_, i) => i).filter(i => i % xs === 0).map(i => lab(String(i * xGrid), px(i * xGrid, 0)[0], gy1 + 50, NUM));
  const yt = Array.from({ length: ny + 1 }, (_, i) => i).filter(i => i % ys === 0 && i > 0).map(i => lab(String(i * yGrid), gx0 - 26, px(0, i * yGrid)[1], NUM, 'right'));
  const xn = lab(G.xName, (gx0 + gx1) / 2, gy1 + 112, LAB, 'center', 650), yn = lab(G.yName, gx0 - 10, gy0 - 52, LAB, 'left', 650);
  check(yn.b.x1 <= R.x1 + 30, NAME, `the axis name "${G.yName}" runs off the frame`);
  return { spec: G, card: box(R.x0, gy0 - 96, R.x1 + 4, gy1 + 150), grid: box(gx0, gy0, gx1, gy1), px, xt, yt, xn, yn, xGrid, yGrid };
}

/** can this picture be drawn? (tests; rough text widths) */
export function rrFits(P: RRParams, fr: Frame): boolean {
  try { planLayout(P, fr, roughMeasure); return true; } catch { return false; }
}

// ---------- the block ----------
export interface TFocus {
  /** rows lit (pick, or litCol) */ lit?: number[]; litCol?: Paint;
  /** rows whose numbers turn red (a counterexample) */ hot?: number[];
  /** quotient cells in red */ hotQ?: number[];
  /** quotient cells not shown (a claimed row that is not data) */ hideQ?: number[];
  /** the struck cell (key 'strike') and its right text (key 'fix') */ strike?: readonly [number, 0 | 1]; fixText?: string;
}
export interface RRFocus { t?: (TFocus | undefined)[]; groups?: number[]; groupCol?: Paint; origin?: Paint }
export interface RRBlock {
  readonly kind: 'RatioRows';
  readonly maths: TableMaths[];
  readonly lay: Layout;
  readonly where: {
    card(j?: number): Box; row(i: number, j?: number): Box; cell(i: number, c: 0 | 1, j?: number): Box; quot(i: number, j?: number): Box;
    /** a small box at the right edge of the rightmost card at row i: a leader from the board ends here */ rowEdge(i: number, j?: number): Box;
    /** a point right of the second number of row i, at the row's middle (a leader along the row) */ rowMid(i: number, j?: number): Box;
    op(o: number, j?: number): Box; group(g: number, config: number): Box; shelf: Box | null;
    point(i: number): Box; origin: Box | null;
  };
  draw(c: Canvas, p: Progress<string>, f?: RRFocus): void;
}

export function RatioRows(P: RRParams, fr: Frame, th: Theme): RRBlock {
  const lay = planLayout(P, fr, (t, size, weight) => wordsBox(t, 0, 0, { size, weight: weight ?? 600 }).w);
  const ink: Paint = 'ink';
  const K = (j: number, s: string) => (j === 0 ? s : 'B' + s);

  function card(c: Canvas, B: Box, seed: number, col: Paint = '#262B57'): void {
    wash(c, rectPts(B.x0, B.y0, B.w, B.h, 18), col, { seed, rough: 1.3, ink: DUSK.ink, inkW: 3, shade: 0.25 });
  }
  function words(c: Canvas, L: Lab, col: Paint, k: number, weight = 600): void { drawWords(c, L.t, L.x, L.y, col, k, { size: L.size, align: L.align, weight }); }
  function ring(c: Canvas, B: Box, col: Paint, k: number, r = 14): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k);
    g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = 5;
    g.shadowColor = paint(th, col, 'fill'); g.shadowBlur = 10 * th.glow * Math.hypot(g.getTransform().a, g.getTransform().b);
    g.beginPath(); g.roundRect(B.x0 - 10, B.y0 - 8, B.w + 20, B.h + 16, r); g.stroke(); g.restore();
  }
  function arc(c: Canvas, x: number, ya: number, yb: number, dir: 1 | -1, bul: number, k: number): void {
    if (k <= 0) return;
    const P: Pt[] = [];
    const a = ya + (yb > ya ? 16 : -16), b = yb - (yb > ya ? 18 : -18);
    for (let i = 0; i <= 30; i++) { const t = i / 30; P.push([x + dir * bul * Math.sin(Math.PI * t), lerp(a, b, t)]); }
    arrow(c, P, E.inOut(clamp(k)), { col: ink, lw: 4, head: 16 });
  }

  // ----- the shelf -----
  function cup(c: Canvas, it: ShelfItem, col: Paint, seed: number, s: number): void {
    if (s <= 0) return;
    const w = it.w * s, h = it.h * s, x = it.x, y = it.y;
    wash(c, [[x - w / 2, y - h / 2], [x + w / 2, y - h / 2], [x + w * 0.38, y + h / 2], [x - w * 0.38, y + h / 2]], col, { seed, rough: 0.9, inkW: 2.5, shade: 0.3 });
    inkLine(c, [[x - w * 0.42, y - h * 0.28], [x + w * 0.42, y - h * 0.28]], { col: DUSK.cream, w: 2, seed: seed + 3, rough: 0.3, alpha: 0.5 });
  }
  function bottle(c: Canvas, it: ShelfItem, seed: number, s: number): void {
    if (s <= 0) return;
    const w = it.w * s, h = it.h * s, x = it.x, y = it.y, nk = w * 0.36;
    wash(c, [[x - w / 2, y - h * 0.18], [x - nk, y - h * 0.34], [x - nk, y - h / 2], [x + nk, y - h / 2], [x + nk, y - h * 0.34], [x + w / 2, y - h * 0.18], [x + w / 2, y + h / 2], [x - w / 2, y + h / 2]], 'second', { seed, rough: 0.7, inkW: 2.5, shade: 0.3 });
  }
  function drawShelf(c: Canvas, p: Progress<string>, f: RRFocus): void {
    const S = lay.shelf;
    if (!S || !P.shelf) return;
    const ks = S.map((_, i) => p.k('shelf' + i));
    let cur = -1;
    for (let i = 0; i < ks.length; i++) if (ks[i]! > 0) cur = i;
    if (cur < 0) return;
    const kc = E.smooth(clamp(ks[cur]!)), prev = cur > 0 ? S[cur - 1]! : null, now = S[cur]!;
    const style = P.shelf.style;
    const lerpIt = (a: ShelfItem, b: ShelfItem, k: number): ShelfItem => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), w: lerp(a.w, b.w, k), h: lerp(a.h, b.h, k) });
    // trays (cups): the old ones fade, the new ones come in
    if (style === 'cups') {
      const tray = (B: Box, a: number, seed: number) => withAlpha(c, a, () => wash(c, rectPts(B.x0, B.y0, B.w, B.h, 16), '#2E335F', { seed, rough: 1.2, inkW: 3, shade: 0.3 }));
      if (prev && cur > 0) prev.trays.forEach((B, i) => tray(B, 1 - kc, 300 + i));
      now.trays.forEach((B, i) => tray(B, prev ? kc : kc, 300 + i));
    }
    if (prev) prev.tags.forEach(L => { if (L) words(c, L, 'dim', 1 - kc); });
    now.tags.forEach(L => { if (L) words(c, L, 'dim', kc); });
    const ga = f.groups ?? [];
    if (ga.length) now.trays.forEach((B, i) => { if (ga.includes(i)) ring(c, B, f.groupCol ?? 'pick', kc, 18); });
    // amber items (cups or cases): move from where they were, pop in when new, fade when gone
    const nA = Math.max(now.amber.length, prev?.amber.length ?? 0);
    for (let i = 0; i < nA; i++) {
      const a = prev?.amber[i], b = now.amber[i];
      let it: ShelfItem, s = 1, al = 1;
      if (a && b) it = lerpIt(a, b, kc);
      else if (b) { it = b; s = prev ? E.back(clamp(kc * 1.6 - 0.6 * ((i % 8) / 8))) : 1; al = prev ? 1 : kc; }
      else { it = a!; al = 1 - kc; }
      withAlpha(c, al, () => {
        if (style === 'case') { const w = it.w * s, h = it.h * s; wash(c, rectPts(it.x - w / 2, it.y - h / 2, w, h, 12), 'first', { seed: 500 + i, rough: 1.1, inkW: 3, shade: 0.35, lift: 0.0 }); }
        else cup(c, it, 'first', 500 + i, s);
      });
    }
    const nT = Math.max(now.teal.length, prev?.teal.length ?? 0);
    for (let i = 0; i < nT; i++) {
      const a = prev?.teal[i], b = now.teal[i];
      let it: ShelfItem, s = 1, al = 1;
      if (a && b) it = lerpIt(a, b, kc);
      else if (b) { it = b; s = prev ? E.back(clamp(kc * 1.6 - 0.6 * ((i % 12) / 12))) : 1; al = prev ? 1 : kc; }
      else { it = a!; al = 1 - kc; }
      withAlpha(c, al, () => { if (style === 'case') bottle(c, it, 700 + i, s); else cup(c, it, 'second', 700 + i, s); });
    }
  }

  // ----- a table -----
  function drawTable(c: Canvas, j: number, p: Progress<string>, f: TFocus = {}): void {
    const G = lay.tables[j]!, T = G.spec, n = T.rows.length;
    const kT = p.k(K(j, 'table'));
    if (kT <= 0) return;
    withAlpha(c, E.smooth(clamp(kT * 3)), () => {
      card(c, G.card, 31 + j * 10);
      const yl = G.card.y0 + 132;
      inkLine(c, [[G.xA0 + 6, yl], [G.xB1 - 6, yl]], { col: DUSK.rule, w: 3, seed: 32 + j });
      inkLine(c, [[G.xB0, G.card.y0 + 18], [G.xB0, G.card.y1 - 16]], { col: DUSK.rule, w: 3, seed: 33 + j });
      if (G.title) words(c, G.title, 'ink', 1, 700);
    });
    const kh = E.smooth(clamp(kT * 3 - 0.3));
    G.heads.forEach((H, i) => words(c, H, i % 2 === 0 ? 'ink' : 'dim', kh, i % 2 === 0 ? 650 : 500));
    // lit rows (behind the numbers)
    for (const r of f.lit ?? []) {
      const y = G.rowY[r]!, B = box(G.xA0 + 4, y - G.rh / 2 + 8, G.xB1 - 4, y + G.rh / 2 - 8);
      withAlpha(c, 0.24 * rowK(r), () => { c.g.fillStyle = paint(th, f.litCol ?? 'pick', 'fill'); c.g.beginPath(); c.g.roundRect(B.x0, B.y0, B.w, B.h, 12); c.g.fill(); });
    }
    function rowK(i: number): number {
      if (T.zero === i) return E.smooth(clamp(p.k(K(j, 'zero')) * 1.4));
      const by = G.revealBy[i]!;
      if (by >= 0) return E.smooth(clamp(p.k(K(j, 'op' + by)) * 2 - 1));
      const order = G.revealBy.slice(0, i).filter((x, r) => x < 0 && T.zero !== r).length;
      return E.smooth(clamp(kT * (n + 2) - 1.4 - order));
    }
    const hidden = (i: number, col: 0 | 1) => (T.hide ?? []).some(([r, cc]) => r === i && cc === col);
    const kFill = p.k(K(j, 'fill'));
    const kS = j === 0 ? p.k('strike') : 0, kF = j === 0 ? p.k('fix') : 0;
    for (let i = 0; i < n; i++) {
      const k = rowK(i);
      if (k <= 0) continue;
      const hot = f.hot?.includes(i) ?? false;
      ([0, 1] as const).forEach(col => {
        const L = G.cells[i]![col];
        const role: Paint = hot ? 'wrong' : col === 0 ? 'first' : 'second';
        if (hidden(i, col)) {
          const kf = E.smooth(clamp(Math.max(kFill, p.k(K(j, 'fill' + i))) * 1.5));
          if (kf < 1) {
            const qb = box(L.x - 40, L.y - 38, L.x + 40, L.y + 38);
            withAlpha(c, k * (1 - kf), () => {
              c.g.save(); c.g.strokeStyle = paint(th, 'pick', 'fill'); c.g.lineWidth = 3; c.g.setLineDash([9, 7]);
              c.g.beginPath(); c.g.roundRect(qb.x0, qb.y0, qb.w, qb.h, 12); c.g.stroke(); c.g.restore();
              drawWords(c, '?', L.x, L.y, 'pick', 1, { size: NUM, align: 'center', weight: 700 });
            });
          }
          if (kf > 0) withAlpha(c, k, () => words(c, L, 'link', kf, 700));
          return;
        }
        const struck = f.strike && f.strike[0] === i && f.strike[1] === col;
        if (struck && kF > 0 && f.fixText) {
          withAlpha(c, 1 - E.smooth(clamp(kF * 2)), () => words(c, L, 'wrong', k));
          drawWords(c, f.fixText, L.x, L.y, 'link', E.smooth(clamp(kF * 2 - 1)), { size: NUM, align: 'center', weight: 700 });
          return;
        }
        words(c, L, struck && kS > 0 ? 'wrong' : role, k, 650);
        if (struck && kS > 0) strike(c, L.b.x0 - 12, L.b.y1 + 4, L.b.x1 + 12, L.b.y0 - 4, kS * (1 - E.smooth(clamp(kF * 2))));
      });
    }
    // operations
    G.ops.forEach((o, i) => {
      const k = p.k(K(j, 'op' + i));
      if (k <= 0) return;
      const op = o.op;
      if (!isMul(op)) {
        if (o.sign) words(c, o.sign, ink, E.smooth(clamp(k * 2)), 700);
        const ka = E.inOut(clamp(k * 2 - 0.4));
        if (ka > 0) inkLine(c, [[G.xA0 + 8, o.sumY], [lerp(G.xA0 + 8, G.xB1 - 8, ka), o.sumY]], { col: ink, w: 4, seed: 900 + i, rough: 0.4 });
        return;
      }
      const ya = G.rowY[op.from]!, yb = G.rowY[op.to]!, bul = 30 + o.lane * 46, ka = clamp(k * 1.5);
      arc(c, G.xA0 - 18, ya, yb, -1, bul, ka);
      arc(c, G.xB1 + 18, ya, yb, 1, bul, ka);
      const kl = E.smooth(clamp(k * 2 - 0.5));
      if (o.labL) words(c, o.labL, ink, kl, 700);
      if (o.labR) words(c, o.labR, ink, kl, 700);
    });
    // the quotient card
    const kQ = p.k(K(j, 'quot'));
    if (G.qcard && kQ > 0) {
      withAlpha(c, E.smooth(clamp(kQ * 3)), () => card(c, G.qcard!, 61 + j, '#24324F'));
      G.qheads.forEach((H, i) => words(c, H, i === 0 ? 'link' : 'dim', E.smooth(clamp(kQ * 3 - 0.3)), i === 0 ? 650 : 500));
      for (let i = 0; i < n; i++) {
        const vis = rowK(i);
        if (vis <= 0 || f.hideQ?.includes(i)) continue;
        const k = E.smooth(clamp(kQ * (n + 1) - 0.8 - i)) * vis;
        const L = G.qcells[i]!, bad = f.hotQ?.includes(i) ?? false;
        words(c, L, bad ? 'wrong' : L.t === 'none' ? 'dim' : 'link', k, 650);
      }
    }
  }

  // ----- the graph -----
  function drawGraph(c: Canvas, p: Progress<string>, f: RRFocus): void {
    const G = lay.graph;
    if (!G) return;
    const kA = p.k('axes'), kP = p.k('points'), kL = p.k('line'), kO = p.k('origin');
    const { grid } = G;
    if (kA > 0) {
      withAlpha(c, E.smooth(clamp(kA * 2)), () => {
        card(c, G.card, 41);
        const { g } = c;
        g.save(); g.strokeStyle = '#4A4F82'; g.lineWidth = 2;
        for (let i = 1; i * G.xGrid <= G.spec.xMax; i++) { const x = G.px(i * G.xGrid, 0)[0]; g.beginPath(); g.moveTo(x, grid.y0); g.lineTo(x, grid.y1); g.stroke(); }
        for (let i = 1; i * G.yGrid <= G.spec.yMax; i++) { const y = G.px(0, i * G.yGrid)[1]; g.beginPath(); g.moveTo(grid.x0, y); g.lineTo(grid.x1, y); g.stroke(); }
        g.restore();
      });
      const ka = E.inOut(clamp(kA * 1.6 - 0.2));
      const seg = (a: Pt, b: Pt, k: number, col: Paint, w: number) => { if (k <= 0) return; const { g } = c; g.save(); g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(lerp(a[0], b[0], k), lerp(a[1], b[1], k)); g.stroke(); g.restore(); };
      seg([grid.x0, grid.y1], [grid.x1 + 6, grid.y1], ka, ink, 4);
      seg([grid.x0, grid.y1], [grid.x0, grid.y0 - 6], ka, ink, 4);
      const kl = E.smooth(clamp(kA * 2 - 0.9));
      for (const L of [...G.xt, ...G.yt]) words(c, L, 'dim', kl, 600);
      words(c, G.xn, 'ink', kl, 650); words(c, G.yn, 'ink', kl, 650);
    }
    const pts = G.spec.pts;
    const line = lineThrough(pts);
    if (kL > 0 && line) {
      // the straight line through all the points, across the grid (from x = 0 or where it meets y = 0)
      const { s, r } = line, f0 = (x: number) => s + r * x;
      let xa = 0, xb = G.spec.xMax;
      if (r > 0) xb = Math.min(xb, (G.spec.yMax - s) / r);
      if (f0(xa) < 0 && r > 0) xa = -s / r;
      if (r < 0) xb = Math.min(xb, -s / r);
      const A = G.px(xa, f0(xa)), B = G.px(xb, f0(xb));
      const k = E.inOut(clamp(kL));
      const { g } = c; g.save(); g.strokeStyle = paint(th, 'link', 'fill'); g.lineWidth = 5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(lerp(A[0], B[0], k), lerp(A[1], B[1], k)); g.stroke(); g.restore();
    }
    if (kP > 0) pts.forEach(([x, y], i) => {
      const k = E.back(clamp(kP * (pts.length + 1) - i));
      if (k <= 0) return;
      const [X, Y] = G.px(x, y);
      dot(c, X, Y, 13 * Math.max(0, k), DUSK.ink); dot(c, X, Y, 10 * Math.max(0, k), 'first');
    });
    if (kO > 0) { const [X, Y] = G.px(0, 0); ring(c, box(X - 14, Y - 14, X + 14, Y + 14), f.origin ?? 'link', kO, 18); }
  }

  const tbl = (j = 0) => lay.tables[j]!;
  const rightX = (j: number) => { const G = tbl(j); return G.qcard ? G.qcard.x1 : G.card.x1; };
  return {
    kind: 'RatioRows', maths: lay.tables.map(t => t.m), lay,
    where: {
      card: (j = 0) => tbl(j).card,
      row: (i, j = 0) => { const G = tbl(j), y = G.rowY[i]!; return box(G.xA0, y - G.rh / 2 + 8, G.xB1, y + G.rh / 2 - 8); },
      cell: (i, c, j = 0) => tbl(j).cells[i]![c].b,
      quot: (i, j = 0) => tbl(j).qcells[i]!.b,
      rowMid: (i, j = 0) => { const y = tbl(j).rowY[i]!, x = tbl(j).cells[i]![1].b.x1; return box(x - 4, y - 12, x, y + 12); },
      rowEdge: (i, j = 0) => { const y = tbl(j).rowY[i]!, x = rightX(j); return box(x - 16, y - 24, x - 4, y + 24); },
      op: (o, j = 0) => { const g = tbl(j).ops[o]!; return (g.labR ?? g.sign)!.b; },
      group: (g, cf) => lay.shelf?.[cf]?.trays[g] ?? box(0, 0, 1, 1),
      shelf: lay.shelfBox,
      point: i => { const G = lay.graph!; const [x, y] = G.px(G.spec.pts[i]![0], G.spec.pts[i]![1]); return box(x - 14, y - 14, x + 14, y + 14); },
      origin: lay.graph ? (() => { const [x, y] = lay.graph!.px(0, 0); return box(x - 14, y - 14, x + 14, y + 14); })() : null,
    },
    draw(c, p, f = {}) {
      drawShelf(c, p, f);
      lay.tables.forEach((_, j) => drawTable(c, j, p, f.t?.[j]));
      drawGraph(c, p, f);
    },
  };
}

/** the straight line through all the points (intercept s, slope r), or null when they are not on one line */
export function lineThrough(pts: readonly (readonly [number, number])[]): { s: number; r: number } | null {
  if (pts.length < 2) return null;
  const [x0, y0] = pts[0]!, [x1, y1] = pts[1]!;
  if (x1 === x0) return null;
  const r = (y1 - y0) / (x1 - x0), s = y0 - r * x0;
  for (const [x, y] of pts) if (Math.abs(s + r * x - y) > 1e-9) return null;
  return { s, r };
}
