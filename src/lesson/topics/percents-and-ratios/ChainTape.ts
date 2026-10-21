// ChainTape: the model of "combine percents and ratios". A combined problem is a chain of steps, and every step has
// its OWN whole. Each row is one whole drawn as a tape that fills the same width (100%): a ratio step splits its
// tape into equal units grouped a : b, a percent step marks p% of its tape. The output of one step ZOOMS down into
// the next row and stretches to the full width: that is "the output is the new whole (100%)". Because every row
// has its own scale, the same 20% is a different amount on different rows, which is the whole point.
//
// Rows are stacked; the row's name and amount sit in a lead column on the left (words 44 px, amounts 60 px). Inside
// labels (44 px, dark ink) sit inside their piece or, when the piece is too narrow, above it; amounts (60 px) sit
// under their piece. Zoom guides (dashed, lavender) run from a piece of one row to the full width of the next and
// break around every label. Draw keys (k(name) -> 0..1):
//   r<i> tape grows   t<i> title   L<i> lead amount   s<i> split (0 = one amber whole, 1 = the pieces)
//   u<i> ratio unit dividers   k<i> percent ticks   h<i> "100%" label   z<i> zoom guides into row i   d<i> dim
//   n<i>.<j> inside label of piece j   v<i>.<j> amount under piece j
// Focus: hi (a ring on a piece), ghosts (a dashed outline over a stretch of a row + a word above it), marks (a dashed
// tick + a word above it), ask (the amount under a piece shows "?" while k > 0).
// Pure: draw() depends on its inputs only. Throws BlockError when a row cannot be read.
import { type Box, type Pt, box, clamp, lerp, unionBox } from '../../../core/math';
import { type Canvas, strokePts } from '../../../core/draw';
import { type Paint, paint } from '../../../core/theme';
import { type Frame, check } from '../../../blocks/block';
import { drawWords, wordsBox } from '../../words';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';
import { rectPts } from '../../../core/pts';

export type PieceRole = 'whole' | 'part' | 'rest' | 'cut' | 'add' | 'answer';
export interface CPiece { amt: number; role: PieceRole; inside?: string; under?: string }
export interface CRow {
  /** the row's name in the lead column ("budget", "art") */ title: string; titleCol?: Paint;
  /** the row's amount under its name ("$240") */ lead?: string; leadCol?: Paint;
  /** the amount drawn as the full width (the row's whole, its 100%) */ base: number;
  pieces: CPiece[];
  /** ratio units across the base (dashed dividers) */ units?: number;
  /** percent ticks: the base cut into this many equal parts (small ticks on the tape edge) */ ticks?: number;
  /** a "100%" word above the end of the base */ hundred?: boolean;
  /** the row is a zoom of row `row` from amount a to b */ zoomFrom?: { row: number; a: number; b: number };
}
export interface ChainParams { rows: CRow[]; /** max of (amount / base) any row or mark reaches (default: the rows) */ reach?: number }
export interface ChainFocus {
  hi?: readonly { r: number; j: number; col: Paint; k: number }[];
  ghosts?: readonly { r: number; a: number; b: number; text?: string; col: Paint; k: number }[];
  marks?: readonly { r: number; at: number; text?: string; col: Paint; k: number }[];
  ask?: readonly { r: number; j: number; k: number }[];
}
interface Lbl { text: string; cx: number; y: number; size: number; box: Box; col: Paint }
interface RowL { ty0: number; ty1: number; cy: number; x: (amt: number) => number; inside: (Lbl & { on: boolean } | null)[]; under: (Lbl | null)[]; title: Lbl; lead: Lbl | null; hundred: Lbl | null }
export interface ChainBlock {
  readonly kind: 'ChainTape';
  readonly x0: number;
  readonly w100: number;
  readonly where: { piece(r: number, j: number): Box; tape(r: number): Box; under(r: number, j: number): Box; lead(r: number): Box; row(r: number): Box; above(r: number, amt: number): Box };
  draw(c: Canvas, k: (key: string) => number, f?: ChainFocus): void;
}

const NAME = 'ChainTape';
const WORD = 44, NUM = 60, ABOVE = 72, TAPE = 84, BELOW = 76, SEP = 28, PAD = 18, RES = 74;
const FILL: Record<PieceRole, Paint> = { whole: 'first', part: 'second', rest: '#8C86B0', cut: 'second', add: 'second', answer: 'link' };
const TEXT: Record<PieceRole, Paint> = { whole: 'first', part: 'second', rest: 'dim', cut: 'second', add: 'second', answer: 'link' };

/** text width; a fallback estimate where there is no DOM (tests) */
function tw(text: string, size: number, weight = 600): number {
  if (typeof document === 'undefined') return text.length * size * 0.55;
  return wordsBox(text, 0, 0, { size, weight }).w;
}
const isAmount = (t: string) => /^[$−\d?]/.test(t);

export function ChainTape(p: ChainParams, fr: Frame): ChainBlock {
  const n = p.rows.length;
  check(n > 0, NAME, 'no rows');
  for (const row of p.rows) {
    check(row.base > 0, NAME, `row "${row.title}" has no whole`);
    for (const g of row.pieces) check(Number.isFinite(g.amt) && g.amt >= 0, NAME, `a piece of ${g.amt}`);
  }
  const sum = (row: CRow) => row.pieces.reduce((s, g) => s + g.amt, 0);
  const reach = Math.max(1, p.reach ?? 0, ...p.rows.map(r => sum(r) / r.base));
  // lead column: the name (44) over the amount (60), right-aligned
  const leadW = Math.max(...p.rows.map(r => Math.max(tw(r.title, WORD), r.lead ? tw(r.lead, NUM, 700) : 0))) + SEP;
  const x0 = fr.x + leadW, xMax = fr.x + fr.w;
  const w100 = (xMax - RES - x0) / reach;
  check(w100 >= 360, NAME, `the tape is too short to read (${Math.round(w100)} px)`);
  const band = ABOVE + TAPE + BELOW;
  check(n * band <= fr.h, NAME, `${n} rows do not fit in ${fr.h} px`);
  const gap = n > 1 ? Math.min(150, (fr.h - n * band) / (n - 1)) : 0;
  const top = fr.y + (fr.h - (n * band + (n - 1) * gap)) / 2;

  const lbl = (text: string, cx: number, y: number, size: number, col: Paint): Lbl => {
    const w = tw(text, size, size >= NUM ? 700 : 600);
    return { text, cx, y, size, col, box: box(cx - w / 2, y - size * 0.42, cx + w / 2, y + size * 0.42) };
  };
  const rows: RowL[] = p.rows.map((row, r) => {
    const ty0 = top + r * (band + gap) + ABOVE, ty1 = ty0 + TAPE, cy = (ty0 + ty1) / 2;
    const sc = w100 / row.base, x = (amt: number) => x0 + amt * sc;
    let acc = 0;
    const segs = row.pieces.map(g => { const s: [number, number] = [x(acc), x(acc + g.amt)]; acc += g.amt; return s; });
    const inside = row.pieces.map((g, j) => {
      if (!g.inside) return null;
      const [a, b] = segs[j]!, w = tw(g.inside, WORD);
      const on = w + 2 * PAD <= b - a;
      return { ...lbl(g.inside, (a + b) / 2, on ? cy : ty0 - ABOVE / 2, WORD, on ? DUSK.ink : TEXT[g.role]), on };
    });
    const under = row.pieces.map((g, j) => (g.under ? lbl(g.under, (segs[j]![0] + segs[j]![1]) / 2, ty1 + BELOW / 2 + 2, NUM, TEXT[g.role]) : null));
    // push under-labels apart left to right, then keep them in the frame
    const us = under.filter((l): l is Lbl => !!l);
    for (let i = 1; i < us.length; i++) {
      const a = us[i - 1]!, b = us[i]!, need = a.box.x1 + 22 - b.box.x0;
      if (need > 0) { b.cx += need; b.box = box(b.box.x0 + need, b.box.y0, b.box.x1 + need, b.box.y1); }
    }
    const tl = tw(row.title, WORD), lw = row.lead ? tw(row.lead, NUM, 700) : 0;
    const title = lbl(row.title, x0 - SEP - tl / 2, row.lead ? cy - 30 : cy, WORD, row.titleCol ?? 'dim');
    const lead = row.lead ? lbl(row.lead, x0 - SEP - lw / 2, cy + 28, NUM, row.leadCol ?? 'first') : null;
    const hundred = row.hundred ? lbl('100%', x(row.base), ty0 - ABOVE / 2, WORD, 'pick') : null;
    return { ty0, ty1, cy, x, inside, under, title, lead, hundred };
  });
  // readability: labels of a row never overlap each other and stay in the frame
  rows.forEach((L, r) => {
    const ls = [...L.inside.filter(l => l && !l.on), ...L.under, L.hundred, L.title, L.lead].filter((l): l is Lbl => !!l);
    for (let i = 0; i < ls.length; i++) for (let j = i + 1; j < ls.length; j++) {
      const a = ls[i]!.box, b = ls[j]!.box;
      check(a.x1 + 6 <= b.x0 || b.x1 + 6 <= a.x0 || a.y1 <= b.y0 || b.y1 <= a.y0, NAME, `row ${r}: labels "${ls[i]!.text}" and "${ls[j]!.text}" overlap`);
    }
    for (const l of ls) check(l.box.x0 >= fr.x - 2 && l.box.x1 <= xMax + 2, NAME, `row ${r}: label "${l.text}" leaves the frame`);
  });
  const allBoxes = rows.flatMap(L => [...L.inside.filter(l => l && !l.on), ...L.under, L.hundred, L.title, L.lead]).filter((l): l is Lbl => !!l).map(l => l.box);

  const pieceBox = (r: number, j: number): Box => {
    const row = p.rows[r]!, L = rows[r]!;
    const a = row.pieces.slice(0, j).reduce((s, g) => s + g.amt, 0);
    return box(L.x(a), L.ty0, L.x(a + row.pieces[j]!.amt), L.ty1);
  };
  const tapeBox = (r: number) => box(x0, rows[r]!.ty0, rows[r]!.x(sum(p.rows[r]!)), rows[r]!.ty1);

  /** a dashed line broken around every label box */
  function guide(c: Canvas, a: Pt, b: Pt, col: Paint, alpha: number): void {
    let cuts: [number, number][] = [];
    for (const B of allBoxes) {
      // Liang-Barsky clip of the segment against the padded box
      const P = 12, dx = b[0] - a[0], dy = b[1] - a[1];
      let t0 = 0, t1 = 1;
      const edges: [number, number][] = [[-dx, a[0] - (B.x0 - P)], [dx, B.x1 + P - a[0]], [-dy, a[1] - (B.y0 - P)], [dy, B.y1 + P - a[1]]];
      let hit = true;
      for (const [pp, q] of edges) {
        if (pp === 0) { if (q < 0) { hit = false; break; } continue; }
        const t = q / pp;
        if (pp < 0) t0 = Math.max(t0, t); else t1 = Math.min(t1, t);
      }
      if (hit && t0 < t1) cuts.push([t0, t1]);
    }
    cuts = cuts.sort((u, v) => u[0] - v[0]);
    let t = 0;
    const at = (s: number): Pt => [lerp(a[0], b[0], s), lerp(a[1], b[1], s)];
    const seg = (s0: number, s1: number) => { if (s1 - s0 > 0.01) strokePts(c, [at(s0), at(s1)], { col, lw: 3, dash: [12, 9], cap: 'butt', alpha }); };
    for (const [u, v] of cuts) { if (u > t) seg(t, u); t = Math.max(t, v); }
    if (t < 1) seg(t, 1);
  }
  function ring(c: Canvas, B: Box, col: Paint, k: number): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k);
    g.strokeStyle = paint(c.th, col, 'fill'); g.lineWidth = 5;
    g.shadowColor = paint(c.th, col, 'fill'); g.shadowBlur = 14 * c.th.glow * Math.hypot(g.getTransform().a, g.getTransform().b);
    g.beginPath(); g.roundRect(B.x0 - 10, B.y0 - 10, B.w + 20, B.h + 20, 14); g.stroke(); g.restore();
  }
  const word = (c: Canvas, l: Lbl, a: number, text = l.text, col: Paint = l.col) => {
    if (a <= 0) return;
    drawWords(c, text, l.cx, l.y, col, a, { size: l.size, weight: l.size >= NUM ? 700 : 600, align: 'center' });
  };

  function draw(c: Canvas, k: (key: string) => number, f: ChainFocus = {}): void {
    const { g } = c;
    // zoom guides first (under everything): a faint lavender trapezoid and two dashed edges
    p.rows.forEach((row, r) => {
      const z = row.zoomFrom, kz = clamp(k(`z${r}`));
      if (!z || kz <= 0) return;
      const A = rows[z.row]!, B = rows[r]!;
      const a0: Pt = [A.x(z.a), A.ty1 + 6], a1: Pt = [A.x(z.b), A.ty1 + 6];
      const b0: Pt = [lerp(a0[0], x0, kz), lerp(a0[1], B.ty0 - 6, kz)], b1: Pt = [lerp(a1[0], B.x(row.base), kz), lerp(a1[1], B.ty0 - 6, kz)];
      const dim = 1 - 0.7 * clamp(k(`d${r}`));
      g.save(); g.globalAlpha *= 0.07 * dim; g.fillStyle = paint(c.th, 'pick', 'fill');
      g.beginPath(); g.moveTo(...a0); g.lineTo(...a1); g.lineTo(...b1); g.lineTo(...b0); g.closePath(); g.fill(); g.restore();
      guide(c, a0, b0, 'pick', 0.85 * dim); guide(c, a1, b1, 'pick', 0.85 * dim);
    });
    p.rows.forEach((row, r) => {
      const L = rows[r]!, kr = clamp(k(`r${r}`));
      const dim = 1 - 0.6 * clamp(k(`d${r}`));
      if (kr <= 0) return;
      g.save(); g.globalAlpha *= dim;
      // the tape grows from the left: clip to the grown part
      const tot = L.x(sum(row)), grow = lerp(x0, tot, kr);
      g.save(); g.beginPath(); g.rect(x0 - 20, L.ty0 - 30, grow - x0 + 40, TAPE + 60); g.clip();
      const ks = clamp(k(`s${r}`));
      if (ks < 1) wash(c, rectPts(x0, L.ty0, L.x(Math.min(sum(row), row.base)) - x0, TAPE, 10), 'first', { seed: 11 + r * 7, inkW: 3, alpha: 1 - ks });
      if (ks > 0) row.pieces.forEach((pc, j) => {
        const B = pieceBox(r, j);
        if (B.w <= 0.5) return;
        if (pc.role === 'cut') {
          wash(c, rectPts(B.x0, B.y0, B.w, B.h, 10), 'second', { seed: 30 + r * 7 + j, alpha: 0.28 * ks, ink: null, lift: 0.3 });
          strokePts(c, rectPts(B.x0 + 2, B.y0 + 2, B.w - 4, B.h - 4, 9), { col: 'second', lw: 2.5, dash: [10, 8], closed: true, alpha: ks });
        } else wash(c, rectPts(B.x0, B.y0, B.w, B.h, 10), FILL[pc.role], { seed: 30 + r * 7 + j, inkW: 3, alpha: ks });
      });
      // ratio units: dashed dividers across the base
      const ku = clamp(k(`u${r}`));
      if (row.units && ku > 0) for (let i = 1; i < row.units; i++) {
        const xx = L.x((row.base * i) / row.units);
        // a divider never runs through a word inside the tape: it breaks into a top and a bottom stub there
        const hit = L.inside.some(l => l && l.on && xx > l.box.x0 - 10 && xx < l.box.x1 + 10);
        const segs: [number, number][] = hit ? [[L.ty0 + 6, L.ty0 + 22], [L.ty1 - 22, L.ty1 - 6]] : [[L.ty0 + 8, L.ty1 - 8]];
        for (const [y0, y1] of segs) strokePts(c, [[xx, y0], [xx, y1]], { col: DUSK.cream, lw: 2.5, dash: hit ? null : [8, 7], cap: 'butt', alpha: 0.75 * ku });
      }
      // piece borders (between pieces), crisp
      if (ks > 0) for (let j = 1; j < row.pieces.length; j++) {
        const xx = pieceBox(r, j).x0;
        inkLine(c, [[xx, L.ty0 + 2], [xx, L.ty1 - 2]], { col: DUSK.ink, w: 3.5, seed: 70 + j, alpha: ks });
      }
      // percent ticks along the top and bottom edges
      const kk = clamp(k(`k${r}`));
      if (row.ticks && kk > 0) for (let i = 1; i < row.ticks; i++) {
        const xx = L.x((row.base * i) / row.ticks);
        strokePts(c, [[xx, L.ty0 + 3], [xx, L.ty0 + 18]], { col: DUSK.ink, lw: 3, alpha: 0.8 * kk });
        strokePts(c, [[xx, L.ty1 - 18], [xx, L.ty1 - 3]], { col: DUSK.ink, lw: 3, alpha: 0.8 * kk });
      }
      g.restore();
      // labels
      word(c, L.title, clamp(k(`t${r}`)));
      if (L.lead) word(c, L.lead, clamp(k(`L${r}`)));
      if (L.hundred) word(c, L.hundred, clamp(k(`h${r}`)));
      // before the split only a piece that IS the whole keeps its word ("100%")
      const isBase = (j: number) => j === 0 && Math.abs(row.pieces[0]!.amt - row.base) < 1e-9;
      L.inside.forEach((l, j) => { if (l) word(c, l, clamp(k(`n${r}.${j}`)) * (ks > 0.5 || isBase(j) ? 1 : 0)); });
      L.under.forEach((l, j) => {
        if (!l) return;
        const kv = clamp(k(`v${r}.${j}`)), qa = clamp(f.ask?.find(q => q.r === r && q.j === j)?.k ?? 0);
        if (qa > 0) word(c, l, kv * qa, '?', 'pick');
        word(c, l, kv * (1 - qa));
      });
      g.restore();
    });
    // focus
    for (const h of f.hi ?? []) if (h.k > 0 && clamp(k(`r${h.r}`)) > 0.5) ring(c, pieceBox(h.r, h.j), h.col, h.k);
    for (const gh of f.ghosts ?? []) {
      if (gh.k <= 0) continue;
      // a tint over the stretch (no line through the words inside) and a bracket above it with its label
      const L = rows[gh.r]!, a = L.x(gh.a), b = L.x(gh.b), by = L.ty0 - 12;
      g.save(); g.globalAlpha *= 0.22 * clamp(gh.k); g.fillStyle = paint(c.th, gh.col, 'fill'); g.beginPath(); g.roundRect(a, L.ty0, b - a, TAPE, 10); g.fill(); g.restore();
      strokePts(c, [[a, L.ty0 - 2], [a, by], [b, by], [b, L.ty0 - 2]], { col: gh.col, lw: 4, alpha: gh.k });
      if (gh.text) word(c, lbl(gh.text, (a + b) / 2, L.ty0 - ABOVE / 2 - 12, isAmount(gh.text) ? NUM : WORD, gh.col), gh.k);
    }
    for (const m of f.marks ?? []) {
      if (m.k <= 0) continue;
      const L = rows[m.r]!, xx = L.x(m.at);
      strokePts(c, [[xx, L.ty0 - 14], [xx, L.ty1 + 14]], { col: m.col, lw: 4, dash: [9, 7], cap: 'butt', alpha: m.k });
      if (m.text) word(c, lbl(m.text, xx, L.ty0 - ABOVE / 2 - 4, isAmount(m.text) ? NUM : WORD, m.col), m.k);
    }
  }

  return {
    kind: 'ChainTape', x0, w100,
    where: {
      piece: pieceBox, tape: tapeBox,
      under: (r, j) => rows[r]!.under[j]?.box ?? pieceBox(r, j),
      lead: r => unionBox([rows[r]!.title.box, ...(rows[r]!.lead ? [rows[r]!.lead!.box] : [])]),
      row: r => box(fr.x, rows[r]!.ty0 - ABOVE, xMax, rows[r]!.ty1 + BELOW),
      above: (r, amt) => { const xx = rows[r]!.x(amt); return box(xx - 60, rows[r]!.ty0 - ABOVE, xx + 60, rows[r]!.ty0); },
    },
    draw,
  };
}
