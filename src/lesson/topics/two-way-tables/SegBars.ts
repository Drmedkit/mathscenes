// SegBars: the segmented (100%) bar graph. One bar per group, every bar the same length because every bar is 100% of
// ITS OWN group (the amber outline is the whole); the segments are that group's conditional percents, in the same
// order in every bar, coloured like the table's category tints. Bars can grow out of a table row / column (morph from
// the cells' boxes), so "a row of the table becomes a bar" is something you watch.
//
// Layouts (pure, tested): barsAlone (the graph on its own: horizontal or vertical, axis, key, group sizes) and
// barsUnder (bars aligned under a TwoWayTable: row bars under the label column, column bars under their columns).
import { type Box, box, clamp, lag, lerp } from '../../../core/math';
import { type Canvas, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import { type Formula, tex, texDraw } from '../../../core/tex';
import { type Paint, paint } from '../../../core/theme';
import { rectPts } from '../../../core/pts';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';
import { drawWords } from '../../words';
import { CAT_COL, LABEL, type TableLayout, headLines, numW, wordsW } from './TwoWayTable';
import { bounds, fmt } from './twoWayMaths';

export interface BarsSpec {
  groups: readonly string[];
  cats: readonly string[];
  /** per group, per category; each row sums to 100 */
  pcts: readonly (readonly number[])[];
  /** group sizes shown in a Total column (amber); null = not shown */
  sizes?: readonly (number | null)[] | null;
  /** segment percent labels */
  labels?: boolean;
  /** bars drawn as a dashed empty outline with '?' until revealed */
  hideBars?: readonly number[];
  /** bar length factor per group (a wrong graph that uses counts) */
  scale?: readonly number[];
  /** drawing order of the categories per bar (default 0, 1, 2); a wrong graph swaps it */
  order?: readonly (readonly number[])[];
  d?: number;
  axis?: 'none' | 'ends' | 'grid';
}
export interface BarsGeom {
  orient: 'h' | 'v';
  /** first category at the top of a vertical bar (bars grown from table columns) */
  topFirst: boolean;
  bars: Box[];
  group: { x: number; y: number; align: 'left' | 'center'; lines: string[] }[];
  size: { x: number; y: number }[];
  sizeHead: { x: number; y: number } | null;
  axis: { line: [number, number, number, number]; ticks: { v: number; x: number; y: number; label: boolean }[]; align: 'center' | 'right' } | null;
  key: { x: number; y: number }[];
  num: number;
}
const NUMS = 60;

export function barsAlone(spec: BarsSpec, area: Box, orient: 'h' | 'v', o: { key?: boolean; groupLabels?: boolean } = {}): BarsGeom {
  const G = spec.groups.length, axis = spec.axis ?? 'ends', wantKey = o.key ?? true, gl = o.groupLabels ?? true;
  const sizes = spec.sizes && spec.sizes.some(s => s !== null) ? spec.sizes : null;
  const key: { x: number; y: number }[] = [];
  if (orient === 'h') {
    const labW = gl ? Math.max(150, ...spec.groups.map(s => wordsW(s, LABEL) + 40)) : 0;
    const totW = sizes ? Math.max(150, ...sizes.map(s => numW(String(s ?? ''), NUMS) + 40)) : 0;
    const barH = G <= 2 ? 136 : G === 3 ? 112 : 92, gap = G <= 2 ? 70 : 52;
    const head = sizes ? 70 : 0, axH = axis === 'none' ? 0 : 110, keyH = wantKey ? 96 : 0;
    const H = head + G * barH + (G - 1) * gap + axH + keyH;
    const y0 = area.cy - H / 2, bx0 = area.x0 + labW + 10, bx1 = area.x1 - totW - (sizes ? 10 : 0);
    const bars = Array.from({ length: G }, (_, g) => box(bx0, y0 + head + g * (barH + gap), bx1, y0 + head + g * (barH + gap) + barH));
    const yb = bars[G - 1]!.y1;
    const ticks = axis === 'none' ? [] : Array.from({ length: 11 }, (_, i) => ({ v: i * 10, x: lerp(bx0, bx1, i / 10), y: yb + 72, label: i % 5 === 0 }));
    if (wantKey) {
      let x = bx0;
      const yk = yb + axH + 48;
      for (const s of spec.cats) { key.push({ x, y: yk }); x += 64 + wordsW(s, LABEL) + 40; }
    }
    return {
      orient, topFirst: false, bars, num: NUMS,
      group: bars.map((b, g) => ({ x: area.x0 + 10, y: b.cy, align: 'left' as const, lines: [spec.groups[g]!] })),
      size: sizes ? bars.map(b => ({ x: bx1 + 10 + totW / 2, y: b.cy })) : [],
      sizeHead: sizes ? { x: bx1 + 10 + totW / 2, y: y0 + 26 } : null,
      axis: axis === 'none' ? null : { line: [bx0, yb + 18, bx1, yb + 18], ticks, align: 'center' }, key,
    };
  }
  // vertical: axis on the left, key on the right, group labels (and sizes) under the bars
  const axW = axis === 'none' ? 20 : 170;
  // the key sits in one row under the group labels (so the bars get the width)
  const keyW = 0, keyH = wantKey ? 80 : 0;
  const span = area.w - axW - keyW;
  const gap = G <= 2 ? 110 : G === 3 ? 80 : 56;
  const barW = Math.min(150, (span - (G - 1) * gap - 40) / G);
  const bx0 = area.x0 + axW + (span - (G * barW + (G - 1) * gap)) / 2;
  const lines = spec.groups.map(s => headLines(s, barW + gap - 16));
  const two = lines.some(l => l.length > 1);
  const below = (gl ? (two ? 112 : 70) : 0) + (sizes ? 76 : 0) + keyH + 20;
  const top = area.y0 + 40, bot = area.y1 - below;
  const bars = Array.from({ length: G }, (_, g) => box(bx0 + g * (barW + gap), top, bx0 + g * (barW + gap) + barW, bot));
  const ticks = axis === 'none' ? [] : Array.from({ length: 11 }, (_, i) => ({ v: i * 10, x: area.x0 + axW - 38, y: lerp(bot, top, i / 10), label: axis === 'grid' ? i % 2 === 0 : i % 5 === 0 }));
  if (wantKey) { let x = area.x0 + axW; for (const s of spec.cats) { key.push({ x, y: area.y1 - 46 }); x += 64 + wordsW(s, LABEL) + 40; } }
  return {
    orient, topFirst: false, bars, num: NUMS,
    group: gl ? bars.map((b, g) => ({ x: b.cx, y: bot + 50, align: 'center' as const, lines: lines[g]! })) : [],
    size: sizes ? bars.map(b => ({ x: b.cx, y: bot + (gl ? (two ? 112 : 70) : 0) + 56 })) : [],
    sizeHead: null,
    axis: axis === 'none' ? null : { line: [area.x0 + axW - 10, top, area.x0 + axW - 10, bot], ticks, align: 'right' }, key,
  };
}

/** bars aligned with a table: 'h' = one bar per row under the table, 'v' = one bar under each data column */
export function barsUnder(spec: BarsSpec, TL: TableLayout, area: Box, orient: 'h' | 'v'): BarsGeom {
  const G = spec.groups.length;
  if (orient === 'h') {
    const nc = TL.C + 1;
    const bx0 = TL.cell(0, 0).x0, bx1 = TL.cell(0, nc - 1).x1;
    const barH = 82, gap = 30;
    const bars = Array.from({ length: G }, (_, g) => box(bx0, area.y0 + 14 + g * (barH + gap), bx1, area.y0 + 14 + g * (barH + gap) + barH));
    const yb = bars[G - 1]!.y1;
    return {
      orient, topFirst: false, bars, num: NUMS,
      group: bars.map((b, g) => ({ x: TL.all.x0 + 26, y: b.cy, align: 'left' as const, lines: [spec.groups[g]!] })),
      size: [], sizeHead: null, key: [],
      axis: { line: [bx0, yb + 16, bx1, yb + 16], ticks: Array.from({ length: 11 }, (_, i) => ({ v: i * 10, x: lerp(bx0, bx1, i / 10), y: yb + 70, label: i % 5 === 0 })), align: 'center' },
    };
  }
  const bw = Math.min(140, TL.colW * 0.64);
  const top = area.y0 + 16, bot = area.y1 - 12;
  const bars = Array.from({ length: G }, (_, g) => { const cx = TL.cell(0, g).cx; return box(cx - bw / 2, top, cx + bw / 2, bot); });
  const ax = TL.all.x0 + TL.labW - 30;
  return {
    orient, topFirst: true, bars, num: NUMS, group: [], size: [], sizeHead: null, key: [],
    axis: { line: [ax + 12, top, ax + 12, bot], ticks: Array.from({ length: 11 }, (_, i) => ({ v: i * 10, x: ax - 18, y: lerp(bot, top, i / 10), label: i % 5 === 0 })), align: 'right' },
  };
}

/** the box of segment s of bar g (k = how far the bar has grown, 0..1) */
export function segBox(G: BarsGeom, spec: BarsSpec, g: number, s: number, k = 1): Box {
  const B = G.bars[g]!, sc = (spec.scale?.[g] ?? 1) * k, ord = spec.order?.[g] ?? spec.pcts[g]!.map((_, i) => i);
  const pos = ord.indexOf(s), b = bounds(ord.map(i => spec.pcts[g]![i]!));
  const a = (b[pos]! / 100) * sc, z = (b[pos + 1]! / 100) * sc;
  if (G.orient === 'h') return box(lerp(B.x0, B.x1, a), B.y0, lerp(B.x0, B.x1, z), B.y1);
  if (G.topFirst) return box(B.x0, lerp(B.y0, B.y1, a), B.x1, lerp(B.y0, B.y1, z));
  return box(B.x0, lerp(B.y1, B.y0, z), B.x1, lerp(B.y1, B.y0, a));
}
/** the position of the boundary after segment s (for an alignment line) */
export function boundaryAt(G: BarsGeom, spec: BarsSpec, g: number, s: number): number {
  const S = segBox(G, spec, g, s);
  return G.orient === 'h' ? S.x1 : G.topFirst ? S.y1 : S.y0;
}

export interface BarsK { axis: number; bars: number | readonly number[]; labels: number; key?: number }
export interface BarsFocus {
  /** a lime ring round one segment (the answer) */
  seg?: { g: number; s: number; k: number } | null;
  /** an amber ring round one whole bar (100% of its group) */
  bar?: { g: number; k: number } | null;
  /** bars grow out of these boxes (the table cells); morph[g] 0 = at the cell, 1 = in the bar */
  from?: ((g: number, s: number) => Box | null) | null;
  morph?: readonly number[];
  /** reveal hidden bars 0..1 */
  reveal?: number;
  /** a dashed lime line along the boundary after segment s, across every bar */
  align?: { s: number; k: number } | null;
  /** dim bars other than this one */
  only?: number | null;
}
const FC = new Map<string, Formula>();
const F = (s: string): Formula => { let f = FC.get(s); if (!f) { f = tex(s) as Formula; FC.set(s, f); } return f; };

export function drawBars(c: Canvas, spec: BarsSpec, G: BarsGeom, k: BarsK, f: BarsFocus = {}): void {
  const { g } = c, th = c.th, n = G.bars.length;
  const kb = (i: number) => clamp(typeof k.bars === 'number' ? lag(k.bars, i, n, 0.45) : (k.bars[i] ?? 0));
  const hidden = new Set(spec.hideBars ?? []);
  const reveal = clamp(f.reveal ?? 0);
  const ka = clamp(k.axis);
  // axis and ticks
  if (G.axis && ka > 0) withAlpha(c, ka, () => {
    const [x0, y0, x1, y1] = G.axis!.line;
    inkLine(c, [[x0, y0], [x1, y1]], { col: DUSK.cream, w: 2.5, seed: 4, rough: 0.3, alpha: 0.7 });
    for (const t of G.axis!.ticks) {
      const tick = G.orient === 'h' ? [[t.x, y0 - 6], [t.x, y0 + (t.label ? 14 : 8)]] : [[x0 - (t.label ? 14 : 8), t.y], [x0 + 6, t.y]];
      g.save(); g.strokeStyle = DUSK.cream; g.globalAlpha *= 0.7; g.lineWidth = 2.5; g.beginPath(); g.moveTo(tick[0]![0]!, tick[0]![1]!); g.lineTo(tick[1]![0]!, tick[1]![1]!); g.stroke(); g.restore();
      if (t.label) texDraw(c, F(`${t.v}\\%`), t.x, t.y, { size: G.num, align: G.axis!.align, col: 'dim' });
    }
  });
  // bars
  for (let i = 0; i < n; i++) {
    const kk = kb(i);
    if (kk <= 0) continue;
    const B = G.bars[i]!, sc = spec.scale?.[i] ?? 1, dimA = f.only !== undefined && f.only !== null && f.only !== i ? 0.35 : 1;
    const hid = hidden.has(i) ? 1 - reveal : 0;
    const m = f.from && f.morph ? E.smooth(clamp(f.morph[i] ?? 1)) : 1;
    withAlpha(c, dimA, () => {
      // dashed empty outline (a bar to find)
      if (hid > 0) {
        g.save(); g.globalAlpha *= hid * kk; g.setLineDash([12, 9]); g.strokeStyle = paint(th, 'pick', 'fill'); g.lineWidth = 3;
        g.beginPath(); g.roundRect(B.x0, B.y0, B.w, B.h, 10); g.stroke(); g.restore();
        texDraw(c, F('?'), B.cx, B.cy, { size: 64, align: 'center', col: 'pick', alpha: hid * kk });
      }
      const show = (1 - hid) * (hidden.has(i) ? reveal : 1);
      if (show <= 0) return;
      const grow = f.from ? 1 : E.smooth(kk);
      spec.pcts[i]!.forEach((p, s) => {
        if (p <= 0) return;
        let S = segBox(G, spec, i, s, grow);
        const src = f.from?.(i, s);
        if (src && m < 1) S = box(lerp(src.x0, S.x0, m), lerp(src.y0, S.y0, m), lerp(src.x1, S.x1, m), lerp(src.y1, S.y1, m));
        if (S.w < 1 || S.h < 1) return;
        withAlpha(c, show * (f.from ? kk : 1), () => wash(c, rectPts(S.x0 + 1.5, S.y0 + 1.5, S.w - 3, S.h - 3, 6), CAT_COL[s % CAT_COL.length]!, { seed: 30 + i * 7 + s, rough: 0.9, inkW: 2.4, shade: 0.15 }));
      });
      // the whole: amber outline (100% of this group)
      const ko = show * (f.from ? clamp((m - 0.55) / 0.45) * kk : 1);
      if (ko > 0) {
        const L = sc * (G.orient === 'h' ? B.w : B.h);
        const O = G.orient === 'h' ? box(B.x0, B.y0, B.x0 + L, B.y1) : G.topFirst ? box(B.x0, B.y0, B.x1, B.y0 + L) : box(B.x0, B.y1 - L, B.x1, B.y1);
        g.save(); g.globalAlpha *= ko; g.strokeStyle = paint(th, 'first', 'fill'); g.lineWidth = 4; g.beginPath(); g.roundRect(O.x0 - 3, O.y0 - 3, O.w + 6, O.h + 6, 9); g.stroke(); g.restore();
      }
      // segment labels
      const kl = clamp(k.labels) * show * (f.from ? clamp((m - 0.7) / 0.3) : 1);
      if (spec.labels !== false && kl > 0) spec.pcts[i]!.forEach((p, s) => {
        const S = segBox(G, spec, i, s, grow), t = `${fmt(p, spec.d ?? 1)}\\%`;
        const fits = G.orient === 'h' ? S.w >= numW(fmt(p, spec.d ?? 1) + '%', G.num) + 18 : S.h >= 66 && S.w >= numW(fmt(p, spec.d ?? 1) + '%', G.num) + 8;
        if (fits) texDraw(c, F(t), S.cx, S.cy, { size: G.num, align: 'center', col: '#141733', alpha: kl });
      });
    });
  }
  // gridlines on top, faint (reading boundaries off the axis)
  if (G.axis && spec.axis === 'grid' && ka > 0) {
    g.save(); g.strokeStyle = '#0E1028'; g.globalAlpha *= 0.42 * ka; g.lineWidth = 2; g.setLineDash([6, 6]);
    for (const t of G.axis.ticks) {
      if (t.v === 0 || t.v === 100) continue;
      for (const B of G.bars) {
        g.beginPath();
        if (G.orient === 'h') { g.moveTo(t.x, B.y0); g.lineTo(t.x, B.y1); } else { g.moveTo(B.x0, t.y); g.lineTo(B.x1, t.y); }
        g.stroke();
      }
      g.beginPath();
      if (G.orient === 'v') { const [x0] = G.axis.line; g.moveTo(x0, t.y); g.lineTo(G.bars[n - 1]!.x1 + 10, t.y); g.globalAlpha = 0.18 * ka; g.strokeStyle = DUSK.cream; g.stroke(); g.strokeStyle = '#0E1028'; g.globalAlpha = 0.42 * ka; }
    }
    g.restore();
  }
  // group labels and sizes
  for (let i = 0; i < G.group.length; i++) {
    const L = G.group[i]!, a = Math.min(1, kb(i) * 2) * (f.only !== undefined && f.only !== null && f.only !== i ? 0.4 : 1);
    L.lines.forEach((s, j) => drawWords(c, s, L.x, L.y + (j - (L.lines.length - 1) / 2) * (G.orient === 'v' ? 46 : 48), 'ink', a, { size: LABEL, align: L.align }));
  }
  if (G.sizeHead) drawWords(c, 'Total', G.sizeHead.x, G.sizeHead.y, 'first', clamp(k.labels), { size: LABEL, align: 'center' });
  G.size.forEach((p, i) => { const v = spec.sizes?.[i]; if (v !== null && v !== undefined) texDraw(c, F(String(v)), p.x, p.y, { size: G.num, align: 'center', col: 'first', alpha: clamp(k.labels) }); });
  // key
  const kk = clamp(k.key ?? k.labels);
  if (kk > 0) G.key.forEach((p, s) => {
    wash(c, rectPts(p.x, p.y - 22, 44, 44, 8), CAT_COL[s % CAT_COL.length]!, { seed: 50 + s, rough: 0.6, inkW: 2, alpha: kk });
    drawWords(c, spec.cats[s]!, p.x + 62, p.y, 'ink', kk, { size: LABEL });
  });
  // focus: an amber ring on a whole bar, a lime ring on the answer segment, an alignment line
  if (f.bar && f.bar.k > 0) ringBox(c, G.bars[f.bar.g]!, 'first', f.bar.k, 12);
  if (f.seg && f.seg.k > 0) ringBox(c, segBox(G, spec, f.seg.g, f.seg.s), 'link', f.seg.k, 6);
  if (f.align && f.align.k > 0) {
    const ka2 = E.smooth(clamp(f.align.k));
    g.save(); g.strokeStyle = paint(th, 'link', 'fill'); g.lineWidth = 4; g.setLineDash([12, 9]);
    g.shadowColor = paint(th, 'link', 'fill'); g.shadowBlur = 10 * th.glow * Math.hypot(g.getTransform().a, g.getTransform().b);
    if (G.orient === 'h') {
      const x = boundaryAt(G, spec, 0, f.align.s), y0 = G.bars[0]!.y0 - 18, y1 = G.bars[n - 1]!.y1 + 18;
      g.beginPath(); g.moveTo(x, y0); g.lineTo(x, lerp(y0, y1, ka2)); g.stroke();
    } else {
      const y = boundaryAt(G, spec, 0, f.align.s), x0 = G.bars[0]!.x0 - 18, x1 = G.bars[n - 1]!.x1 + 18;
      g.beginPath(); g.moveTo(x0, y); g.lineTo(lerp(x0, x1, ka2), y); g.stroke();
    }
    g.restore();
  }
}
function ringBox(c: Canvas, B: Box, col: Paint, k: number, r: number): void {
  const { g } = c;
  g.save(); g.globalAlpha *= clamp(k); g.strokeStyle = paint(c.th, col, 'fill'); g.lineWidth = 5;
  g.shadowColor = paint(c.th, col, 'fill'); g.shadowBlur = 14 * c.th.glow * Math.hypot(g.getTransform().a, g.getTransform().b);
  g.beginPath(); g.roundRect(B.x0 - 8, B.y0 - 8, B.w + 16, B.h + 16, r); g.stroke(); g.restore();
}
