// PercentTape: percent tapes (tape diagrams) stacked on ONE dollar scale, the model of "percent applications".
// Each row is one amount drawn as a tape whose length is its dollars; the row's 100% amount is amber (`base`), a
// percent added on top is a teal extension (`change`), a percent taken off is a faded teal end (`cut`), the answer is a
// lime tape (`result`). A row's percent labels sit inside their piece (or above it when the piece is narrow), the
// dollars under it, the row's amount on its left (`lead`) and an answer on its right (`end`). Rows share one scale, so
// "the output of one change is the next 100%" is visible: the kept part of a row is exactly as long as the next row.
//   rows     draw-on per row: key `r<i>` (the tape grows left to right), `l<i>` its labels (`v<i>` the dollar
//            labels alone), `e<i>` its end label,
//            `d<i>` dims the row
//   focus    hi (a lit piece), marks (a dashed tick at a dollar value + a word under it), guides (a dashed drop from
//            one row to another at a dollar value), ask (a '?' label that turns into its value)
// Layout inside a Frame (design px): numbers 60 px, labels never overlap (pushed apart), throws BlockError when the
// rows cannot be read. Pure: draw() depends on its inputs only.
import { type Box, box, clamp } from '../../../core/math';
import { type Canvas, strokePts } from '../../../core/draw';
import { type Paint, paint } from '../../../core/theme';
import { type Frame, check } from '../../../blocks/block';
import { drawWords, wordsBox } from '../../words';
import { wash } from '../../wash';
import { DUSK } from '../../dusk';
import { rectPts } from '../../../core/pts';

export type SegRole = 'base' | 'change' | 'cut' | 'result' | 'plain' | 'ghost';
export interface Seg {
  /** length in dollars */ amt: number;
  role: SegRole;
  /** percent text in or above the piece ("80%") */ pct?: string;
  /** dollar text under the piece ("$64") */ val?: string;
}
export interface TapeRow {
  /** the row's amount on its left ("$80") */ lead?: string;
  leadCol?: Paint;
  segs: Seg[];
  /** an answer right of the tape end ("$57.60") */ end?: string;
  endCol?: Paint;
}
export interface TapeParams { rows: TapeRow[]; /** dollars the full width stands for (default: the longest row) */ max?: number }
export type Slot = 'lead' | 'end' | `pct${number}` | `val${number}`;
export interface TapeFocus {
  hi?: { r: number; i: number; col: Paint; k: number }[];
  marks?: { r: number; at: number; text?: string; col: Paint; k: number; above?: boolean }[];
  guides?: { at: number; r0: number; r1: number; col: Paint; k: number }[];
  ask?: { r: number; slot: Slot; k: number };
}
interface Lbl { text: string; x: number; y: number; w: number; box: Box; col: Paint; inside: boolean }
interface RowL { y0: number; ty0: number; ty1: number; segX: [number, number][]; pct: (Lbl | null)[]; val: (Lbl | null)[]; lead: Lbl | null; end: Lbl | null }
export interface TapeBlock {
  readonly kind: 'PercentTape';
  readonly box: Box;
  readonly x0: number;
  readonly scale: number;
  readonly where: {
    seg(r: number, i: number): Box; tape(r: number): Box; lead(r: number): Box; end(r: number): Box;
    pct(r: number, i: number): Box; val(r: number, i: number): Box; row(r: number): Box; x(dollars: number): number;
  };
  draw(c: Canvas, k: (key: string) => number, f?: TapeFocus): void;
}

const NAME = 'PercentTape';
const PX = 60, ABOVE = 64, TAPE = 78, BELOW = 68, GAP = 16, ROW = ABOVE + TAPE + BELOW + GAP, PAD = 22, SEP = 26;
const FILL: Record<SegRole, Paint> = { base: 'first', change: 'second', cut: 'second', result: 'link', plain: '#8C86B0', ghost: 'faint' };
const TEXT: Record<SegRole, Paint> = { base: 'first', change: 'second', cut: 'second', result: 'link', plain: 'dim', ghost: 'dim' };
const ON_WASH = DUSK.ink;

export function PercentTape(p: TapeParams, fr: Frame): TapeBlock {
  check(p.rows.length > 0, NAME, 'no rows');
  const totals = p.rows.map(r => r.segs.reduce((s, g) => s + g.amt, 0));
  for (const r of p.rows) for (const g of r.segs) check(Number.isFinite(g.amt) && g.amt >= 0, NAME, `a piece of ${g.amt} dollars`);
  const max = p.max ?? Math.max(...totals);
  check(max > 0, NAME, 'nothing to draw');
  const n = p.rows.length;
  check(n * ROW - GAP <= fr.h, NAME, `${n} rows do not fit in ${fr.h} px`);
  const W = (t: string) => wordsBox(t, 0, 0, { size: PX, weight: 700 }).w;
  const leadW = Math.max(0, ...p.rows.map(r => (r.lead ? W(r.lead) + SEP : 0)));
  const x0 = fr.x + leadW, xMax = fr.x + fr.w;
  // a narrow LAST piece of a row without an end label puts its labels beside the tape end (never across the end,
  // where a guide from the row above can land); the room for them is reserved on the right like an end label
  const fits = (g: Seg, w: number) => w >= W(g.pct ?? '') + PAD * 2 && g.role !== 'ghost';
  const sideOf = (row: TapeRow, sc: number): boolean => {
    const g = row.segs[row.segs.length - 1];
    return !row.end && !!g && (!!g.pct || !!g.val) && (g.pct ? !fits(g, g.amt * sc) : g.amt * sc < W(g.val ?? '') + 8);
  };
  let endW = Math.max(0, ...p.rows.map(r => (r.end ? W(r.end) + SEP : 0)));
  let scale = (xMax - endW - x0) / max;
  for (let it = 0; it < 4; it++) {
    const need = Math.max(endW, ...p.rows.map(r => {
      if (!sideOf(r, scale)) return 0;
      const g = r.segs[r.segs.length - 1]!;
      return SEP + Math.max(g.pct ? W(g.pct) : 0, g.val ? W(g.val) : 0);
    }));
    if (need <= endW) break;
    endW = need; scale = (xMax - endW - x0) / max;
  }
  check(scale * max >= 380, NAME, 'the tape is too short to read');
  const X = (d: number) => x0 + d * scale;
  const top = fr.y + Math.max(0, (fr.h - (n * ROW - GAP)) / 2);

  const rows: RowL[] = p.rows.map((row, r) => {
    const y0 = top + r * ROW, ty0 = y0 + ABOVE, ty1 = ty0 + TAPE, cy = (ty0 + ty1) / 2;
    const segX: [number, number][] = [];
    let acc = 0;
    for (const g of row.segs) { segX.push([X(acc), X(acc + g.amt)]); acc += g.amt; }
    const endX = X(totals[r]!), side = sideOf(row, scale), last = row.segs.length - 1;
    // percent labels: inside the piece when they fit, else above it (or beside the tape end, see above)
    const pct = row.segs.map((g, i) => {
      if (!g.pct) return null;
      const w = W(g.pct), [a, b] = segX[i]!;
      if (side && i === last) return lbl(g.pct, endX + SEP + w / 2, cy, TEXT[g.role]);
      const inside = fits(g, b - a), cx = (a + b) / 2;
      const l = lbl(g.pct, cx, inside ? cy : ty0 - ABOVE / 2 - 2, inside ? (g.role === 'cut' ? TEXT.cut : ON_WASH) : TEXT[g.role]);
      l.inside = inside;
      return l;
    });
    const val = row.segs.map((g, i) => {
      if (!g.val) return null;
      const w = W(g.val), [a, b] = segX[i]!, y = ty1 + BELOW / 2 + 4;
      return lbl(g.val, side && i === last ? endX + SEP + w / 2 : (a + b) / 2, y, TEXT[g.role]);
    });
    spread(pct.filter((l, i): l is Lbl => !!l && !l.inside && !(side && i === last)), fr.x, side ? endX : xMax);
    spread(val.filter((l, i): l is Lbl => !!l && !(side && i === last)), fr.x, side ? endX : xMax);
    const lead = row.lead ? lbl(row.lead, x0 - SEP / 2 - W(row.lead) / 2, cy, row.leadCol ?? 'first') : null;
    const end = row.end ? lbl(row.end, endX + SEP + W(row.end) / 2, cy, row.endCol ?? 'link') : null;
    return { y0, ty0, ty1, segX, pct, val, lead, end };
  });
  function lbl(text: string, cx: number, y: number, col: Paint): Lbl { const w = W(text); return { text, x: cx, y, w, box: box(cx - w / 2, y - PX * 0.42, cx + w / 2, y + PX * 0.42), col, inside: false }; }
  // readability: labels of a row never overlap each other, and above-labels stay clear of the previous row
  rows.forEach((L, r) => {
    const ls = [...L.pct, ...L.val, L.lead, L.end].filter((l): l is Lbl => !!l && !l.inside);
    for (let i = 0; i < ls.length; i++) for (let j = i + 1; j < ls.length; j++) {
      const a = ls[i]!.box, b = ls[j]!.box;
      check(a.x1 + 8 <= b.x0 || b.x1 + 8 <= a.x0 || a.y1 <= b.y0 || b.y1 <= a.y0, NAME, `row ${r}: labels "${ls[i]!.text}" and "${ls[j]!.text}" overlap`);
    }
    for (const l of ls) check(l.box.x0 >= fr.x - 4 && l.box.x1 <= xMax + 4, NAME, `row ${r}: label "${l.text}" leaves the frame`);
  });
  const allLabels = rows.flatMap(L => [...L.pct, ...L.val, L.lead, L.end]).filter((l): l is Lbl => !!l && !l.inside).map(l => l.box);
  /** a vertical dashed line from y0 to y1 at x, broken where it would cross a label */
  function vline(c: Canvas, x: number, y0: number, y1: number, o: Parameters<typeof strokePts>[2]): void {
    let cuts: [number, number][] = allLabels.filter(b => x > b.x0 - 10 && x < b.x1 + 10).map(b => [b.y0 - 8, b.y1 + 8]);
    cuts = cuts.sort((a, b) => a[0] - b[0]);
    let y = y0;
    for (const [a, b] of cuts) {
      if (b <= y || a >= y1) continue;
      if (a > y) strokePts(c, [[x, y], [x, a]], o);
      y = Math.max(y, b);
    }
    if (y < y1) strokePts(c, [[x, y], [x, y1]], o);
  }
  const empty = (x: number, y: number) => box(x - 10, y - 10, x + 10, y + 10);
  const where = {
    seg: (r: number, i: number) => { const L = rows[r]!, s = L.segX[i]!; return box(s[0], L.ty0, s[1], L.ty1); },
    tape: (r: number) => { const L = rows[r]!; return box(x0, L.ty0, X(totals[r]!), L.ty1); },
    lead: (r: number) => rows[r]!.lead?.box ?? empty(x0 - 20, (rows[r]!.ty0 + rows[r]!.ty1) / 2),
    end: (r: number) => rows[r]!.end?.box ?? empty(X(totals[r]!) + 20, (rows[r]!.ty0 + rows[r]!.ty1) / 2),
    pct: (r: number, i: number) => rows[r]!.pct[i]?.box ?? where.seg(r, i),
    val: (r: number, i: number) => rows[r]!.val[i]?.box ?? where.seg(r, i),
    row: (r: number) => box(fr.x, rows[r]!.y0, xMax, rows[r]!.y0 + ROW - GAP),
    x: X,
  };

  function label(c: Canvas, l: Lbl | null, a: number, ask: { slot: boolean; k: number }): void {
    if (!l || a <= 0) return;
    if (ask.slot) {
      drawWords(c, '?', l.x, l.y, l.col, a * (1 - ask.k), { size: PX, align: 'center', weight: 700 });
      drawWords(c, l.text, l.x, l.y, l.col, a * ask.k, { size: PX, align: 'center', weight: 700 });
    } else drawWords(c, l.text, l.x, l.y, l.col, a, { size: PX, align: 'center', weight: 700 });
  }

  return {
    kind: 'PercentTape', x0, scale,
    box: box(fr.x, top, xMax, top + n * ROW - GAP),
    where,
    draw(c, k, f = {}) {
      p.rows.forEach((row, r) => {
        const L = rows[r]!, kr = clamp(k(`r${r}`));
        if (kr <= 0) return;
        const dim = 1 - 0.6 * clamp(k(`d${r}`));
        c.g.save(); c.g.globalAlpha *= dim;
        const shown = kr * totals[r]!;
        let acc = 0;
        row.segs.forEach((g, i) => {
          const vis = clamp(shown - acc, 0, g.amt); acc += g.amt;
          const [a] = L.segX[i]!, w = vis * scale;
          if (w < 1.5) return;
          const P = rectPts(a, L.ty0, w, TAPE, 6);
          if (g.role === 'ghost') { strokePts(c, [...P, P[0]!], { col: 'dim', lw: 3, dash: [12, 10] }); return; }
          if (g.role === 'cut') {
            wash(c, P, FILL.cut, { seed: 31 + r * 7 + i, alpha: 0.42, ink: null, rough: 1.6 });
            strokePts(c, [...P, P[0]!], { col: 'second', lw: 3, dash: [10, 8] });
            return;
          }
          wash(c, P, FILL[g.role], { seed: 11 + r * 7 + i, rough: 1.6, inkW: 3 });
        });
        // labels
        const la = clamp(k(`l${r}`));
        const ask = (slot: Slot) => ({ slot: f.ask?.r === r && f.ask.slot === slot, k: clamp(f.ask?.k ?? 0) });
        L.pct.forEach((l, i) => label(c, l, la * (l?.inside ? clamp((kr * totals[r]! - (L.segX[i]![1] - x0) / scale) * 4 + 1) : 1), ask(`pct${i}`)));
        L.val.forEach((l, i) => label(c, l, Math.max(la, clamp(k(`v${r}`))), ask(`val${i}`)));
        label(c, L.lead, kr, ask('lead'));
        label(c, L.end, clamp(k(`e${r}`)), ask('end'));
        c.g.restore();
      });
      // lit pieces: a glowing outline around a piece (drawn over the rows, under nothing else)
      for (const hl of f.hi ?? []) {
        if (hl.k <= 0) continue;
        const L = rows[hl.r]!, s = L.segX[hl.i]!;
        const P = rectPts(s[0] - 5, L.ty0 - 5, s[1] - s[0] + 10, TAPE + 10, 9);
        strokePts(c, [...P, P[0]!], { col: hl.col, lw: 5, alpha: hl.k, glow: 12, glowCol: hl.col });
      }
      // marks: a dashed tick at a dollar value, its word under the tape (or above it); never across a label
      for (const m of f.marks ?? []) {
        if (m.k <= 0) continue;
        const L = rows[m.r]!, x = X(m.at);
        const up = m.above === true, ty = up ? L.ty0 - ABOVE / 2 - 2 : L.ty1 + BELOW / 2 + 4;
        vline(c, x, up ? ty + PX * 0.42 + 6 : L.ty0 - 16, up ? L.ty1 + 12 : L.ty1 + 12, { col: m.col, lw: 4, dash: [9, 7], alpha: m.k });
        if (m.text) drawWords(c, m.text, x, ty, m.col, m.k, { size: PX, align: 'center', weight: 700 });
      }
      // guides: a dashed drop from the bottom of one tape to the top of another at the same dollar value
      for (const g of f.guides ?? []) {
        if (g.k <= 0) continue;
        const A = rows[g.r0]!, B = rows[g.r1]!, x = X(g.at);
        const ya = A.ty1 + 4, yb = B.ty0 - 4;
        vline(c, x, ya, ya + (yb - ya) * clamp(g.k), { col: g.col, lw: 3.5, dash: [10, 9] });
      }
    },
  };
}

/** push labels apart along x (keep order, SEP apart), then pull them back inside [lo, hi] */
function spread(ls: Lbl[], lo: number, hi: number): void {
  if (ls.length === 0) return;
  ls.sort((a, b) => a.x - b.x);
  for (let i = 1; i < ls.length; i++) {
    const a = ls[i - 1]!, b = ls[i]!, need = a.x + a.w / 2 + SEP + b.w / 2;
    if (b.x < need) b.x = need;
  }
  const over = ls[ls.length - 1]!.x + ls[ls.length - 1]!.w / 2 - hi;
  if (over > 0) for (const l of ls) l.x -= over;
  for (let i = ls.length - 2; i >= 0; i--) {
    const a = ls[i]!, b = ls[i + 1]!, lim = b.x - b.w / 2 - SEP - a.w / 2;
    if (a.x > lim) a.x = lim;
  }
  const under = lo - (ls[0]!.x - ls[0]!.w / 2);
  if (under > 0) for (const l of ls) l.x += under;
  for (const l of ls) l.box = box(l.x - l.w / 2, l.box.y0, l.x + l.w / 2, l.box.y1);
}
