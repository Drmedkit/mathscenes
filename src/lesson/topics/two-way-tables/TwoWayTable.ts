// TwoWayTable: the model of the topic. A two-way table painted as one card: row labels, column labels, the cells and
// the margins (totals in amber, because each total is a possible WHOLE). "Which whole?" is something you see: an
// amber ring goes round the whole (one row, one column, or the whole table) and the part glows lime inside it.
// Cells can be tinted by the category that becomes a bar segment (tint 'col' for row bars, 'row' for column bars), so
// the table and its segmented bar graph share one colour per category.
//
// Layout (tableLayout) is pure and tested: every cell inside the area, numbers >= 60 px, labels >= 44 px.
// Steps (k): grid, heads, cells, totals.
import { type Box, box, clamp, lag, unionBox } from '../../../core/math';
import { type Canvas, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import { type Formula, tex, texDraw } from '../../../core/tex';
import { type Paint, paint } from '../../../core/theme';
import { rectPts } from '../../../core/pts';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';
import { drawWords } from '../../words';
import { fmt } from './twoWayMaths';

/** one fill per category (segment / tint), never the role colours amber (whole) and lime (answer) */
export const CAT_COL = ['#3CC6C2', '#E58FB4', '#8FA8F0'] as const;
export const LABEL = 44, NUM = 64;
/** a practice table alone in the frame: bigger type, centred vertically */
export const SOLO = { area: box(80, 110, 1000, 1000), o: { maxRowH: 150, maxColW: 280, num: 78, lab: 52, center: true } } as const;

export interface TableSpec {
  rows: readonly string[];
  cols: readonly string[];
  /** (R + 1) x (C + 1) values when margins is true (last row / column = totals), else R x C; null = blank */
  vals: readonly (readonly (number | null)[])[];
  margins: boolean;
  fmt: 'count' | 'pct';
  /** decimals of percents */
  d?: number;
  /** cells drawn as '?' ('r,c'; r = R is the total row, c = C the total column) */
  hide?: readonly string[];
  tint?: 'row' | 'col' | null;
  /** a row header for the total row / column ("Total") */
  totalLabel?: string;
}
export const key = (r: number, c: number) => `${r},${c}`;

/** estimated widths (the canvas measures less; layout stays safe without a DOM) */
export const wordsW = (s: string, size: number) => s.length * size * 0.56;
export function numW(s: string, size: number): number {
  let w = 0;
  for (const ch of s) w += ch === '.' || ch === ',' ? 0.28 : ch === '%' ? 0.83 : ch === '?' ? 0.47 : 0.5;
  return w * size;
}
/** a count with a thousands comma from 10,000 up */
export const countText = (v: number) => (v >= 10000 ? v.toLocaleString('en-US') : String(v));
export const valText = (v: number | null, f: 'count' | 'pct', d = 1) => (v === null ? '' : f === 'pct' ? fmt(v, d) + '%' : countText(v));
export const valTex = (v: number | null, f: 'count' | 'pct', d = 1) => (v === null ? '' : f === 'pct' ? fmt(v, d) + '\\%' : countText(v).replace(/,/g, '{,}'));

/** split a header label into at most two lines that fit width w */
export function headLines(s: string, w: number, size = LABEL): string[] {
  if (wordsW(s, size) <= w || !s.includes(' ')) return [s];
  const i = s.indexOf(' ');
  return [s.slice(0, i), s.slice(i + 1)];
}

export interface TableLayout {
  area: Box; all: Box; R: number; C: number;
  labW: number; colW: number; headH: number; rowH: number; num: number; lab: number;
  /** r in 0..R (R = totals), c in 0..C (C = totals) */
  cell(r: number, c: number): Box;
  rowHead(r: number): Box;
  colHead(c: number): Box;
  /** the whole strip of a row / column (label + cells + total), or the whole table body */
  strip(kind: 'row' | 'col' | 'all', i: number): Box;
  colLines: string[][];
}
/** o.num / o.lab: bigger type for a table that has the frame to itself; o.center: centre it vertically in the area */
export function tableLayout(spec: TableSpec, area: Box, o: { maxRowH?: number; maxColW?: number; num?: number; lab?: number; center?: boolean } = {}): TableLayout {
  const LAB = o.lab ?? LABEL;
  const R = spec.rows.length, C = spec.cols.length, nr = R + (spec.margins ? 1 : 0), nc = C + (spec.margins ? 1 : 0);
  const tot = spec.totalLabel ?? 'Total';
  const rowLabs = [...spec.rows, ...(spec.margins ? [tot] : [])];
  const labW = Math.max(190, ...rowLabs.map(s => wordsW(s, LAB) + 50));
  let num = o.num ?? NUM;
  const texts = spec.vals.flat().map(v => valText(v, spec.fmt, spec.d)).concat(['?']);
  const numNeed = (n: number) => Math.max(...texts.map(t => numW(t, n))) + 46;
  let colW = Math.max(150, numNeed(num));
  const colLabs = [...spec.cols, ...(spec.margins ? [tot] : [])];
  const lines = colLabs.map(s => headLines(s, Math.min(o.maxColW ?? 230, (area.w - labW) / nc) - 24, LAB));
  colW = Math.max(colW, ...lines.flat().map(s => wordsW(s, LAB) + 24));
  colW = Math.min(colW, o.maxColW ?? 230);
  while (numNeed(num) > colW && num > 60) num -= 2;
  while (labW + nc * colW > area.w && num > 60) { num -= 2; colW = Math.max(numNeed(num), Math.min(colW, (area.w - labW) / nc)); }
  if (labW + nc * colW > area.w) colW = (area.w - labW) / nc;
  const two = lines.some(l => l.length > 1);
  const headH = (two ? 128 : 92) * (LAB / LABEL);
  const rowH = Math.min(o.maxRowH ?? 112, Math.max(86, (area.h - headH) / nr));
  // squeezed so far that the widest number no longer fits: give the labels less room first
  if (numNeed(num) - 26 > colW && LAB > LABEL) return tableLayout(spec, area, { ...o, lab: Math.max(LABEL, LAB - 4) });
  const W = labW + nc * colW, H = headH + nr * rowH;
  const x0 = area.cx - W / 2, y0 = o.center ? area.cy - H / 2 : area.y0;
  const cell = (r: number, c: number) => box(x0 + labW + c * colW, y0 + headH + r * rowH, x0 + labW + (c + 1) * colW, y0 + headH + (r + 1) * rowH);
  const rowHead = (r: number) => box(x0, y0 + headH + r * rowH, x0 + labW, y0 + headH + (r + 1) * rowH);
  const colHead = (c: number) => box(x0 + labW + c * colW, y0, x0 + labW + (c + 1) * colW, y0 + headH);
  const strip = (kind: 'row' | 'col' | 'all', i: number) => kind === 'row' ? unionBox([rowHead(i), cell(i, nc - 1)])
    : kind === 'col' ? unionBox([colHead(i), cell(nr - 1, i)]) : unionBox([cell(0, 0), cell(nr - 1, nc - 1)]);
  return { area, all: box(x0, y0, x0 + W, y0 + H), R, C, labW, colW, headH, rowH, num, lab: LAB, cell, rowHead, colHead, strip, colLines: lines };
}

export interface TableK { grid: number; heads: number; cells: number; totals: number }
export const TABLE_ALL: TableK = { grid: 1, heads: 1, cells: 1, totals: 1 };
export interface TableFocus {
  /** the amber ring round the whole */
  whole?: { kind: 'row' | 'col' | 'all'; i: number; k: number } | null;
  /** a second, dashed ring (a wrong whole, shown as evidence) */
  alt?: { kind: 'row' | 'col' | 'all'; i: number; k: number; col?: Paint } | null;
  /** the part glows lime */
  part?: { r: number; c: number; k: number } | null;
  /** extra glows (several parts, e.g. a whole row of joint cells) */
  glows?: readonly { r: number; c: number; k: number; col?: Paint }[];
  /** 0..1: fade everything outside the whole */
  dim?: number;
  /** hidden cells shown with their value (0..1) */
  reveal?: number;
  /** cells lifted out (they are moving into a bar): drawn faint in place */
  lifted?: readonly { r: number; c: number; k: number }[];
}

const FCACHE = new Map<string, Formula>();
const F = (s: string): Formula => { let f = FCACHE.get(s); if (!f) { f = tex(s) as Formula; FCACHE.set(s, f); } return f; };

export function drawTable(c: Canvas, spec: TableSpec, L: TableLayout, k: TableK = TABLE_ALL, f: TableFocus = {}): void {
  if (k.grid <= 0) return;
  const { g } = c, th = c.th;
  const R = L.R, C = L.C, nr = R + (spec.margins ? 1 : 0), nc = C + (spec.margins ? 1 : 0);
  const kg = E.smooth(clamp(k.grid));
  const hide = new Set(spec.hide ?? []);
  const inWhole = (r: number, cc: number): boolean => {
    const w = f.whole;
    if (!w) return true;
    return w.kind === 'all' ? true : w.kind === 'row' ? r === w.i : cc === w.i;
  };
  const dimA = (r: number, cc: number) => 1 - 0.62 * clamp(f.dim ?? 0) * (inWhole(r, cc) ? 0 : 1);
  withAlpha(c, kg, () => {
    // the card
    const A = L.all;
    wash(c, rectPts(A.x0 - 14, A.y0 - 10, A.w + 28, A.h + 22, 20), '#272C5C', { seed: 21, rough: 1.2, inkW: 3, shade: 0.12 });
    wash(c, rectPts(A.x0 - 6, A.y0 - 2, A.w + 12, L.headH, 14), '#30366B', { seed: 22, rough: 0.8, ink: null, shade: 0 });
    // category tints
    if (spec.tint) for (let r = 0; r < R; r++) for (let cc = 0; cc < C; cc++) {
      const B = L.cell(r, cc), col = CAT_COL[(spec.tint === 'col' ? cc : r) % CAT_COL.length]!;
      g.save(); g.globalAlpha *= 0.17 * dimA(r, cc); g.fillStyle = col; g.beginPath(); g.roundRect(B.x0 + 6, B.y0 + 6, B.w - 12, B.h - 12, 10); g.fill(); g.restore();
    }
    // crisp grid lines (precision): thin inside, heavier before the totals
    g.save(); g.strokeStyle = DUSK.cream; g.lineCap = 'round';
    const x0 = A.x0 + L.labW, y0 = A.y0 + L.headH;
    for (let r = 0; r <= nr; r++) {
      const y = y0 + r * L.rowH, heavy = r === 0 || (spec.margins && r === R);
      g.globalAlpha = (heavy ? 0.55 : 0.28) * kg; g.lineWidth = heavy ? 3 : 2;
      g.beginPath(); g.moveTo(A.x0 + 8, y); g.lineTo(A.x0 + 8 + (A.w - 16) * kg, y); g.stroke();
    }
    for (let cc = 0; cc <= nc; cc++) {
      const x = x0 + cc * L.colW, heavy = cc === 0 || (spec.margins && cc === C);
      g.globalAlpha = (heavy ? 0.55 : 0.28) * kg; g.lineWidth = heavy ? 3 : 2;
      g.beginPath(); g.moveTo(x, A.y0 + 8); g.lineTo(x, A.y0 + 8 + (A.h - 16) * kg); g.stroke();
    }
    g.restore();
  });
  // header words
  const kh = clamp(k.heads);
  if (kh > 0) {
    for (let r = 0; r < nr; r++) {
      const B = L.rowHead(r), tot = spec.margins && r === R;
      const col: Paint = tot ? 'first' : spec.tint === 'row' ? (CAT_COL[r % CAT_COL.length] as Paint) : 'ink';
      drawWords(c, tot ? spec.totalLabel ?? 'Total' : spec.rows[r]!, B.x0 + 26, B.cy, col, E.smooth(lag(kh, r, nr + nc, 0.5)) * dimA(r, -1), { size: L.lab });
    }
    for (let cc = 0; cc < nc; cc++) {
      const B = L.colHead(cc), tot = spec.margins && cc === C;
      const col: Paint = tot ? 'first' : spec.tint === 'col' ? (CAT_COL[cc % CAT_COL.length] as Paint) : 'ink';
      const lines = L.colLines[cc]!, a = E.smooth(lag(kh, nr + cc, nr + nc, 0.5)) * dimA(-1, cc);
      lines.forEach((s, i) => drawWords(c, s, B.cx, B.cy + (i - (lines.length - 1) / 2) * L.lab * 1.1, col, a, { size: L.lab, align: 'center' }));
    }
  }
  // part / glows under the numbers
  const glow = (r: number, cc: number, kk: number, col: Paint) => {
    if (kk <= 0) return;
    const B = L.cell(r, cc);
    g.save(); g.globalAlpha *= clamp(kk) * 0.3; g.fillStyle = paint(th, col, 'fill');
    g.beginPath(); g.roundRect(B.x0 + 8, B.y0 + 8, B.w - 16, B.h - 16, 12); g.fill(); g.restore();
    g.save(); g.globalAlpha *= clamp(kk); g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = 4;
    g.beginPath(); g.roundRect(B.x0 + 8, B.y0 + 8, B.w - 16, B.h - 16, 12); g.stroke(); g.restore();
  };
  if (f.part) glow(f.part.r, f.part.c, f.part.k, 'link');
  for (const q of f.glows ?? []) glow(q.r, q.c, q.k, q.col ?? 'link');
  // numbers
  const lifted = new Map((f.lifted ?? []).map(q => [key(q.r, q.c), q.k]));
  for (let r = 0; r < nr; r++) for (let cc = 0; cc < nc; cc++) {
    const tot = spec.margins && (r === R || cc === C);
    const kk = tot ? clamp(k.totals) : E.smooth(lag(clamp(k.cells), r * nc + cc, nr * nc, 0.4));
    if (kk <= 0) continue;
    const v = spec.vals[r]?.[cc] ?? null, hidden = hide.has(key(r, cc));
    const B = L.cell(r, cc);
    const isPart = f.part && f.part.r === r && f.part.c === cc && f.part.k > 0.5;
    const col: Paint = isPart ? 'link' : tot ? 'first' : 'ink';
    const a = dimA(r, cc) * (1 - 0.8 * clamp(lifted.get(key(r, cc)) ?? 0));
    if (hidden) {
      const rv = clamp(f.reveal ?? 0);
      if (rv < 1) texDraw(c, F('?'), B.cx, B.cy, { size: L.num, align: 'center', col: 'pick', alpha: a * (1 - rv), k: kk });
      if (rv > 0 && v !== null) texDraw(c, F(valTex(v, spec.fmt, spec.d)), B.cx, B.cy, { size: L.num, align: 'center', col: 'link', alpha: a * rv });
      continue;
    }
    if (v === null) continue;
    texDraw(c, F(valTex(v, spec.fmt, spec.d)), B.cx, B.cy, { size: L.num, align: 'center', col, alpha: a, k: kk });
  }
  // rings: the whole (amber) and an alternative whole (dashed)
  const ring = (kind: 'row' | 'col' | 'all', i: number, kk: number, col: Paint, dash: boolean) => {
    if (kk <= 0) return;
    const B = L.strip(kind, i);
    g.save(); g.globalAlpha *= clamp(kk); g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = 5;
    if (dash) g.setLineDash([14, 10]);
    g.shadowColor = paint(th, col, 'fill'); g.shadowBlur = 14 * th.glow * Math.hypot(g.getTransform().a, g.getTransform().b);
    g.beginPath(); g.roundRect(B.x0 + 4, B.y0 + 4, B.w - 8, B.h - 8, 16); g.stroke(); g.restore();
  };
  if (f.whole) ring(f.whole.kind, f.whole.i, f.whole.k, 'first', false);
  if (f.alt) ring(f.alt.kind, f.alt.i, f.alt.k, f.alt.col ?? 'wrong', true);
}

/** a count table spec with its margins */
export function countSpec(rows: readonly string[], cols: readonly string[], cells: readonly (readonly number[])[], o: { hide?: string[]; tint?: 'row' | 'col' | null; margins?: boolean } = {}): TableSpec {
  const m = o.margins ?? true;
  const row = cells.map(r => r.reduce((s, v) => s + v, 0)), col = cells[0]!.map((_, j) => cells.reduce((s, r) => s + r[j]!, 0));
  const all = row.reduce((s, v) => s + v, 0);
  const vals = m ? [...cells.map((r, i) => [...r, row[i]!]), [...col, all]] : cells.map(r => [...r]);
  return { rows, cols, vals, margins: m, fmt: 'count', hide: o.hide, tint: o.tint ?? null };
}
/** draw a single ink outline around a box (used for a "?" slot) */
export function slot(c: Canvas, B: Box, k: number, col: Paint = 'pick'): void {
  if (k <= 0) return;
  inkLine(c, rectPts(B.x0, B.y0, B.w, B.h, 12), { col: paint(c.th, col, 'fill'), w: 3, closed: true, alpha: k, seed: 9 });
}
