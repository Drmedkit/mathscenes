// TableCard: paired data as a table on a calm dark card: a case table (one row = one case, its two measurements
// side by side) or a two-way frequency table with its margins (totals). Crisp row and column rules, numbers 60 px,
// words 44 px (a header may wrap onto two lines). A long case table splits into two halves side by side.
// Focus: rows appear one by one, a row / column / cell lights up in a role colour (rings on cells), the rest dims.
// Pure layout; draw(c, focus) keeps no state. Throws BlockError when the table does not fit its frame.
import { type Box, box, clamp } from '../../../core/math';
import { type Canvas, drawOn, strokePts, withAlpha } from '../../../core/draw';
import { rectPts } from '../../../core/pts';
import type { Paint } from '../../../core/theme';
import { type Frame, check } from '../../../blocks/block';
import { drawWords, wordsBox } from '../../words';
import { wash } from '../../wash';
import type { TableSpec } from './bivariate';

const NAME = 'TableCard';
const NUM = 60, WORD = 44, PADX = 18, ROW = 82, LINE = 50;
const isNum = (s: string) => /^[−\-$]?[\d.,]+%?$|^\?$/.test(s.trim());
export interface TableFocus {
  /** rows shown (float), default all */
  shown?: number;
  rows?: Readonly<Record<number, Paint>>;
  cols?: Readonly<Record<number, Paint>>;
  cells?: readonly { r: number; c: number; col: Paint; k: number }[];
  /** 0..1 dims what is not lit */
  dim?: number;
  /** 0..1 reveal of a "?" cell's real value */
  reveal?: { r: number; c: number; t: string; k: number };
}
export interface TableBlock {
  readonly kind: 'TableCard';
  readonly box: Box;
  readonly where: { cell(r: number, c: number): Box; row(r: number): Box; col(c: number): Box; card: Box };
  draw(c: Canvas, f?: TableFocus): void;
}

/** wrap a header into short lines (greedy, about 9 characters a line, at most 3 lines) */
function wrap(s: string): string[] {
  if (s.length <= 8 || !s.includes(' ')) return [s];
  const out: string[] = [];
  for (const w of s.split(' ')) {
    const last = out[out.length - 1];
    if (last !== undefined && (last + ' ' + w).length <= 9) out[out.length - 1] = last + ' ' + w;
    else out.push(w);
  }
  while (out.length > 3) { const a = out.pop()!; out[out.length - 1] += ' ' + a; }
  return out;
}

export function TableCard(t: TableSpec, fr: Frame): TableBlock {
  const nc = t.head.length;
  check(nc >= 2 && t.rows.every(r => r.length === nc), NAME, 'every row needs a cell for every column');
  const heads = t.head.map(wrap);
  const cellW = (s: string, c: number) => wordsBox(s, 0, 0, { size: isNum(s) && !(t.rowHead && c === 0) ? NUM : WORD, weight: 600 }).w;
  const colW = t.head.map((_, c) => Math.max(...heads[c]!.map(l => wordsBox(l, 0, 0, { size: WORD }).w), ...t.rows.map(r => cellW(r[c]!, c))) + 2 * PADX);
  const tw = colW.reduce((s, w) => s + w, 0);
  const halves = t.split ? [t.rows.slice(0, Math.ceil(t.rows.length / 2)), t.rows.slice(Math.ceil(t.rows.length / 2))] : [t.rows];
  const GAP = 34;
  const W = tw * halves.length + GAP * (halves.length - 1);
  const headH = Math.max(...heads.map(h => h.length)) * LINE + 26;
  const H = headH + Math.max(...halves.map(h => h.length)) * ROW;
  check(W <= fr.w && H <= fr.h, NAME, `the table (${Math.round(W)} x ${Math.round(H)}) does not fit its frame (${fr.w} x ${fr.h})`);
  const x0 = fr.x + (fr.w - W) / 2, y0 = fr.y + (fr.h - H) / 2;
  const half = (r: number) => (t.split && r >= halves[0]!.length ? 1 : 0);
  const rowIn = (r: number) => (half(r) ? r - halves[0]!.length : r);
  const colX = (h: number, c: number) => x0 + h * (tw + GAP) + colW.slice(0, c).reduce((s, w) => s + w, 0);
  const cell = (r: number, c: number): Box => { const h = half(r), x = colX(h, c), y = y0 + headH + rowIn(r) * ROW; return box(x, y, x + colW[c]!, y + ROW); };
  const row = (r: number): Box => { const h = half(r), y = y0 + headH + rowIn(r) * ROW; return box(colX(h, 0), y, colX(h, 0) + tw, y + ROW); };
  const col = (c: number): Box => box(colX(0, c), y0, colX(0, c) + colW[c]!, y0 + H);
  const card = box(x0, y0, x0 + W, y0 + H);

  function draw(c: Canvas, f: TableFocus = {}): void {
    const shown = f.shown ?? t.rows.length, dimK = clamp(f.dim ?? 0);
    halves.forEach((rows, h) => {
      const hx = colX(h, 0), hh = headH + rows.length * ROW;
      wash(c, rectPts(hx - 8, y0 - 8, tw + 16, hh + 16, 16), '#151938', { seed: 70 + h, rough: 1.0, ink: null, shade: 0.08 });
      c.g.save(); c.g.fillStyle = 'rgba(58,63,107,0.45)'; c.g.fillRect(hx, y0, tw, headH); c.g.restore();
      if (t.margins) { c.g.save(); c.g.fillStyle = 'rgba(58,63,107,0.28)'; c.g.fillRect(hx + tw - colW[nc - 1]!, y0 + headH, colW[nc - 1]!, hh - headH); c.g.fillRect(hx, y0 + hh - ROW, tw - colW[nc - 1]!, ROW); c.g.restore(); }
      // rules
      for (let r = 0; r <= rows.length; r++) { const y = y0 + headH + r * ROW; strokePts(c, [[hx, y], [hx + tw, y]], { col: '#3A3F6B', lw: r === 0 ? 3 : 2, cap: 'butt' }); }
      for (let k = 1; k < nc; k++) { const x = colX(h, k); strokePts(c, [[x, y0], [x, y0 + hh]], { col: '#3A3F6B', lw: (t.rowHead && k === 1) || (t.margins && k === nc - 1) ? 3 : 2, cap: 'butt' }); }
      // header
      heads.forEach((ls, k) => { const cx = colX(h, k) + colW[k]! / 2, n = ls.length; ls.forEach((l, j) => drawWords(c, l, cx, y0 + headH / 2 + (j - (n - 1) / 2) * LINE, 'dim', 1, { size: WORD, align: 'center' })); });
    });
    // lit row / column backgrounds
    for (const [r, colr] of Object.entries(f.rows ?? {})) { const B = row(Number(r)); withAlpha(c, 0.22, () => { c.g.fillStyle = c.th.roles[colr as 'pick']?.fill ?? '#AE93EE'; c.g.fillRect(B.x0, B.y0 + 2, B.w, B.h - 4); }); }
    for (const [k, colr] of Object.entries(f.cols ?? {})) { const B = col(Number(k)); withAlpha(c, 0.18, () => { c.g.fillStyle = c.th.roles[colr as 'pick']?.fill ?? '#AE93EE'; c.g.fillRect(B.x0 + 2, B.y0 + headH, B.w - 4, B.h - headH); }); }
    t.rows.forEach((cells, r) => {
      const a = clamp(shown - r);
      if (a <= 0) return;
      const lit = f.rows?.[r] !== undefined || cells.some((_, k) => f.cols?.[k] !== undefined || f.cells?.some(q => q.r === r && q.c === k));
      const rowA = a * (lit ? 1 : 1 - 0.6 * dimK);
      cells.forEach((s, k) => {
        const B = cell(r, k), num = isNum(s) && !(t.rowHead && k === 0), total = t.margins && (k === nc - 1 || r === t.rows.length - 1);
        const cellLit = f.cols?.[k] !== undefined || f.rows?.[r] !== undefined || f.cells?.some(q => q.r === r && q.c === k);
        const alpha = rowA * (cellLit || !dimK ? 1 : 0.6);
        const tcol: Paint = s === '?' ? 'pick' : total ? 'dim' : 'ink';
        const rv = f.reveal && f.reveal.r === r && f.reveal.c === k ? clamp(f.reveal.k) : 0;
        if (rv < 1) drawWords(c, s, num ? B.cx : B.x0 + PADX, B.cy, tcol, alpha * (1 - rv), { size: num ? NUM : WORD, align: num ? 'center' : 'left', weight: num ? 600 : 500 });
        if (rv > 0) drawWords(c, f.reveal!.t, B.cx, B.cy, 'link', alpha * rv, { size: NUM, align: 'center' });
      });
    });
    for (const q of f.cells ?? []) { if (q.k <= 0) continue; const B = cell(q.r, q.c); drawOn(c, rectPts(B.x0 + 6, B.y0 + 6, B.w - 12, B.h - 12, 12), q.k, { col: q.col, lw: 4, closed: true, glow: 8, glowCol: q.col }); }
  }
  return { kind: 'TableCard', box: card, where: { cell, row, col, card }, draw };
}
