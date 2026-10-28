// DataPlot: the one-variable data plot of the Statistics course (a candidate for src/lesson/kit/). One card with ONE
// measurement axis at the bottom and any number of panels stacked above it on that shared scale:
//   dot    a dot plot: one dot per observation, stacked at its exact value (repeated values stack up)
//   hist   an equal-width histogram with chosen bins [start + k·w, start + (k + 1)·w) (lower end in), bars touching,
//          a count scale on the left (or the counts on top of the bars, or neither)
//   box    a box plot computed from the data (min, Q1, median, Q3, max; quartiles = median of each half, the median
//          left out for odd n), or from a given five-number summary; `modified` ends the whiskers at the most extreme
//          non-outliers (1.5·IQR fences) and plots the outliers as points
// Marks drawn over the panels, each on its own step key: vline (median, mean, a fence, with a label), bracket (IQR,
// range), fulcrum (the mean as a balance point under a dot plot), devs (each dot's distance to the mean), band (a
// shaded stretch of the axis: a bin, the zone between the fences).
// Steps: 'axis' (card, axis, ticks, name), each panel's key (its marks come in), a box panel's parts on their own keys
// when wanted (`<key>.med`, `.q`, `.box`, `.whisk`, `.out`), each mark's key. Focus: coloured / faded / shifted dots,
// dimmed panels, rings on any `where` box. Pure layout inside a Frame; throws BlockError when dots would overlap, a
// value falls outside the axis, or a label does not fit.
import { type Box, type Pt, box, clamp, lag } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas, dot, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { type Frame, check } from '../../../blocks/block';
import { drawWords, wordsBox } from '../../words';
import { wash } from '../../wash';
import { DUSK } from '../../dusk';
import { type Five, binCounts, five as fiveOf, fences, isOutlier, r9, sorted, whiskers } from './stats';

const NAME = 'DataPlot';
export interface DAxis {
  min: number; max: number; step: number;
  /** the measured variable with its unit ("Commute (minutes)") */ name?: string;
  /** tick label text; '' leaves a tick unlabelled */ fmt?: (v: number) => string;
  /** label only ticks that are multiples of every·step (unlabelled ticks in between) */ every?: number;
}
export interface DPanel {
  key: string;
  kind: 'dot' | 'hist' | 'box';
  data?: readonly number[];
  /** box only: a given summary instead of data, with its outliers (modified plot) */ five?: Five; outs?: readonly number[];
  /** box: whiskers end at the most extreme non-outliers; outliers are points */ modified?: boolean;
  /** hist: bins */ bins?: { start: number; width: number };
  /** hist: 'axis' (count scale, default), 'top' (count on each bar), 'none' */ counts?: 'axis' | 'top' | 'none';
  /** the panel's name above it, left ("Team A", "Bins of 10") */ label?: string;
  col?: Paint;
  /** the band's share of the height (default 1) */ weight?: number;
}
export type DMark =
  | { kind: 'vline'; key: string; x: number; col?: Paint; label?: string; panels?: readonly string[]; dash?: boolean }
  | { kind: 'bracket'; key: string; panel: string; a: number; b: number; col?: Paint; label?: string }
  | { kind: 'fulcrum'; key: string; panel: string; x: number; col?: Paint; label?: string }
  | { kind: 'devs'; key: string; panel: string; about: number; col?: Paint }
  | { kind: 'band'; key: string; a: number; b: number; col?: Paint; panels?: readonly string[]; label?: string };
export interface DParams { axis: DAxis; panels: readonly DPanel[]; marks?: readonly DMark[] }
export interface DFocus {
  /** recolour dots (sorted index within the panel) */ dots?: readonly { panel: string; idx: readonly number[]; col: Paint; k: number }[];
  /** fade dots to a dashed ghost */ fade?: readonly { panel: string; idx: readonly number[]; k: number }[];
  /** slide every dot of a panel by dx data units (and its marks) */ shift?: { panel: string; dx: number; k: number };
  /** panels drawn faint */ dim?: readonly string[];
  /** glow rings on where() boxes */ ring?: readonly { key: string; col: Paint; k: number }[];
  /** the axis name glows */ heads?: number;
}
export interface PanelGeo {
  key: string; kind: DPanel['kind']; band: Box; base: number; head: number; label?: { t: string; b: Box };
  data: number[];
  /** dot: centre and radius of the dot of sorted index i */ dots: Pt[]; r: number;
  /** hist */ bars: { a: number; b: number; n: number; box: Box }[]; yMax: number; yStep: number;
  /** box */ five?: Five; wEnds?: [number, number]; outs: number[]; boxY: [number, number];
}
export interface DataPlotBlock {
  readonly kind: 'DataPlot';
  readonly box: Box;
  readonly panels: readonly PanelGeo[];
  /** the x pixel of a data value */ px(v: number): number;
  /** the data value of an x pixel */ toData(X: number): number;
  /** keys of marks whose label found no room (not drawn) */ readonly dropped: readonly string[];
  where(key: string): Box;
  draw(c: Canvas, P: Progress<string>, f?: DFocus): void;
}

const NUM = 54, LAB = 46, HEAD = 60;
export const fmtTick = (v: number): string => { const r = Math.round(v * 1000) / 1000; return (r < 0 ? '−' : '') + String(Math.abs(r)); };
const niceStep = (m: number): number => [1, 2, 5, 10, 20, 25, 50, 100].find(s => m / s <= 5) ?? 200;

export function DataPlot(p: DParams, fr: Frame, th: Theme): DataPlotBlock {
  const X = p.axis, marks = p.marks ?? [];
  const fx0 = fr.x, fy0 = fr.y, fx1 = fr.x + fr.w, fy1 = fr.y + fr.h;
  check(X.max > X.min && X.step > 0, NAME, 'empty axis');
  const nT = Math.round((X.max - X.min) / X.step);
  check(Math.abs(nT * X.step - (X.max - X.min)) < 1e-9, NAME, 'the axis ends on a tick');
  check(nT >= 2 && nT <= 30, NAME, `too many or too few ticks (${nT})`);
  check(p.panels.length >= 1 && p.panels.length <= 4, NAME, '1 to 4 panels');
  const keys = new Set<string>(['axis']);
  for (const k of [...p.panels.map(q => q.key), ...marks.map(m => m.key)]) { check(!keys.has(k), NAME, `key "${k}" used twice`); keys.add(k); }
  const fx = X.fmt ?? fmtTick;
  const hasCountAxis = p.panels.some(q => q.kind === 'hist' && (q.counts ?? 'axis') === 'axis');
  const gx0 = fx0 + (hasCountAxis ? 110 : 66), gx1 = fx1 - 66;
  // a fulcrum (the mean's triangle) under the bottom panel needs room between the axis and its tick labels
  const under = marks.some(m => m.kind === 'fulcrum' && m.panel === p.panels[p.panels.length - 1]?.key) ? 34 : 0;
  const axisY = fy1 - (X.name ? 150 : 86) - under;
  check(gx1 - gx0 >= 360, NAME, 'the axis is too short');
  const sx = (gx1 - gx0) / (X.max - X.min);
  const px = (v: number) => gx0 + (v - X.min) * sx, toData = (Xp: number) => X.min + (Xp - gx0) / sx;
  const inAx = (v: number) => v >= X.min - 1e-9 && v <= X.max + 1e-9;

  // ----- ticks: every tick when the labels fit, else every 2nd / 4th / 5th -----
  const tickVals = Array.from({ length: nT + 1 }, (_, i) => r9(X.min + i * X.step));
  const tw = Math.max(...tickVals.map(v => wordsBox(fx(v), 0, 0, { size: NUM }).w));
  const cell = (gx1 - gx0) / nT;
  const stride = [1, 2, 4, 5].find(s => cell * s * (X.every ?? 1) >= tw + 22);
  check(stride, NAME, 'tick labels collide');
  const z = tickVals.findIndex(v => Math.abs(v) < 1e-9), a0 = z < 0 ? 0 : z % stride!;
  const ev = X.every ?? 1, onEvery = (v: number) => ((Math.round(v / X.step) % ev) + ev) % ev === 0;
  const ticks = tickVals.map((v, i) => ({ v, x: px(v), lab: (ev > 1 ? onEvery(v) : (i - a0) % stride! === 0) && fx(v) !== '' ? fx(v) : '' }));
  const tickLabs = ticks.filter(t => t.lab).map(t => ({ t: t.lab, x: t.x, y: axisY + 46 + under, b: wordsBox(t.lab, t.x, axisY + 46 + under, { size: NUM, align: 'center' }) }));
  for (const L of tickLabs) check(L.b.x0 >= fx0 + 4 && L.b.x1 <= fx1 - 4, NAME, `tick label ${L.t} leaves the card`);
  const nameL = X.name ? { t: X.name, b: wordsBox(X.name, (gx0 + gx1) / 2, axisY + 112 + under, { size: LAB, align: 'center' }) } : null;
  if (nameL) check(nameL.b.x0 >= fx0 && nameL.b.x1 <= fx1, NAME, `the axis name "${X.name}" is too wide`);

  // ----- panels: a head row (panel name + mark labels) and a band, stacked down to the axis -----
  const top = fy0 + 24, bottom = axisY - 14, wsum = p.panels.reduce((s, q) => s + (q.weight ?? 1), 0);
  const avail = bottom - top - HEAD * p.panels.length;
  check(avail / wsum >= 110, NAME, 'the panels are too thin');
  let y = top;
  const geo: PanelGeo[] = p.panels.map((q, pi) => {
    const head = y + HEAD / 2, bh = (avail * (q.weight ?? 1)) / wsum;
    const band = box(gx0, y + HEAD, gx1, y + HEAD + bh);
    y += HEAD + bh;
    const base = pi === p.panels.length - 1 ? axisY : band.y1 - 8;
    const label = q.label ? { t: q.label, b: wordsBox(q.label, fx0 + 30, head, { size: LAB, align: 'left' }) } : undefined;
    if (label) check(label.b.x1 <= fx1 - 20, NAME, `panel name "${q.label}" is too wide`);
    const data = sorted(q.data ?? []);
    for (const v of data) check(inAx(v), NAME, `${v} is outside the axis`);
    const G: PanelGeo = { key: q.key, kind: q.kind, band, base, head, label, data, dots: [], r: 0, bars: [], yMax: 0, yStep: 1, outs: [], boxY: [0, 0] };
    if (q.kind === 'dot') {
      check(data.length >= 1, NAME, `${q.key}: no data`);
      const cnt = new Map<number, number>();
      for (const v of data) cnt.set(v, (cnt.get(v) ?? 0) + 1);
      const maxStack = Math.max(...cnt.values());
      const vals = [...cnt.keys()].sort((a, b) => a - b);
      const gap = Math.min(Infinity, ...vals.slice(1).map((v, i) => (v - vals[i]!) * sx));
      const r = Math.min(21, (base - band.y0 - 10) / (2.12 * maxStack), (gap - 3) / 2);
      check(r >= 6.5, NAME, `${q.key}: dots would overlap (r = ${r.toFixed(1)})`);
      G.r = r;
      const seen = new Map<number, number>();
      G.dots = data.map(v => { const j = seen.get(v) ?? 0; seen.set(v, j + 1); return [px(v), base - r - 3 - j * 2.12 * r] as Pt; });
    } else if (q.kind === 'hist') {
      check(q.bins && q.bins.width > 0 && data.length >= 1, NAME, `${q.key}: bins and data needed`);
      const { start, width } = q.bins!;
      const nB = Math.floor(r9((data[data.length - 1]! - start) / width)) + 1;
      check(data[0]! >= start - 1e-9, NAME, `${q.key}: a value lies below the first bin`);
      check(inAx(start) && inAx(r9(start + nB * width)), NAME, `${q.key}: the bins run past the axis`);
      const counts = binCounts(data, start, width, nB);
      const mx = Math.max(...counts), hgt = base - band.y0 - ((q.counts ?? 'axis') === 'top' ? 56 : 12);
      // the count scale: the smallest nice step whose labels sit at least 50 px apart
      const st = [1, 2, 5, 10, 20, 25, 50, 100].find(s => (s / Math.max(s, Math.ceil(mx / s) * s)) * hgt >= 70) ?? niceStep(mx);
      G.yStep = st; G.yMax = Math.max(st, Math.ceil(mx / st) * st);
      G.bars = counts.map((n, k) => { const a = r9(start + k * width), b = r9(a + width); return { a, b, n, box: box(px(a), base - (n / G.yMax) * hgt, px(b), base) }; });
      check((px(start + width) - px(start)) >= 26, NAME, `${q.key}: bins too narrow to read`);
    } else {
      const F = q.five ?? (data.length ? fiveOf(data) : undefined);
      check(F, NAME, `${q.key}: data or a five-number summary needed`);
      G.five = F;
      for (const v of [F!.min, F!.q1, F!.med, F!.q3, F!.max]) check(inAx(v), NAME, `${v} is outside the axis`);
      if (q.five) { G.outs = [...(q.outs ?? [])]; G.wEnds = [F!.min, F!.max]; }
      else if (q.modified) { const Fe = fences(F!); G.outs = data.filter(v => isOutlier(v, Fe)); G.wEnds = whiskers(data); }
      else G.wEnds = [F!.min, F!.max];
      if (q.five && G.outs.length) { const lo = Math.min(...G.outs, F!.min), hi = Math.max(...G.outs, F!.max); check(inAx(lo) && inAx(hi), NAME, 'an outlier is outside the axis'); }
      const cy = (band.y0 + base) / 2 + 4, hh = Math.min(64, (base - band.y0) * 0.3);
      G.boxY = [cy - hh, cy + hh];
    }
    return G;
  });
  const geoOf = (k: string) => geo.find(g => g.key === k);
  const panelOf = (k: string) => p.panels.find(q => q.key === k)!;

  // ----- mark labels: in the head row of the topmost panel a mark covers, off the panel names and each other -----
  const placed: Box[] = geo.flatMap(g => (g.label ? [g.label.b] : []));
  const labels = new Map<string, { t: string; x: number; y: number; al: 'left' | 'center' | 'right'; b: Box }>();
  const dropped: string[] = [];
  const covers = (m: DMark): PanelGeo[] => {
    if (m.kind === 'vline' || m.kind === 'band') return m.panels ? geo.filter(g => m.panels!.includes(g.key)) : geo;
    return geo.filter(g => g.key === m.panel);
  };
  for (const m of marks) {
    const cs = covers(m);
    check(cs.length, NAME, `mark ${m.key}: no panel`);
    if (m.kind === 'vline' || m.kind === 'fulcrum') check(inAx(m.x), NAME, `mark ${m.key} is outside the axis`);
    if (m.kind === 'bracket' || m.kind === 'band') check(inAx(m.a) && inAx(m.b) && m.b > m.a, NAME, `mark ${m.key} runs outside the axis`);
    const t = 'label' in m ? m.label : undefined;
    if (!t) continue;
    const g0 = cs[0]!;
    const x = m.kind === 'vline' || m.kind === 'fulcrum' ? px(m.x) : m.kind === 'devs' ? px(m.about) : (px(m.a) + px(m.b)) / 2;
    const ys = [g0.head, g0.head - 52];
    let got = null as null | { t: string; x: number; y: number; al: 'left' | 'center' | 'right'; b: Box };
    search: for (const yy of ys) for (const [dx, al] of [[0, 'center'], [14, 'left'], [-14, 'right']] as const) {
      const b = wordsBox(t, x + dx, yy, { size: LAB, align: al });
      if (b.x0 < fx0 + 10 || b.x1 > fx1 - 10 || b.y0 < fy0 + 4) continue;
      if (placed.some(o => b.x0 < o.x1 + 14 && o.x0 - 14 < b.x1 && b.y0 < o.y1 + 4 && o.y0 - 4 < b.y1)) continue;
      got = { t, x: x + dx, y: yy, al, b }; break search;
    }
    if (!got) { dropped.push(m.key); continue; }
    placed.push(got.b); labels.set(m.key, got);
  }

  // ----- painters -----
  const col = (c: Paint) => paint(th, c, 'fill');
  const ink = DUSK.cream;
  function stroke(c: Canvas, P: readonly Pt[], cl: Paint | string, w: number, dash?: number[], alpha = 1): void {
    if (P.length < 2 || alpha <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= alpha; g.strokeStyle = cl.startsWith('#') || cl.startsWith('rgba') ? cl : col(cl as Paint); g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round';
    if (dash) g.setLineDash(dash);
    g.beginPath(); g.moveTo(P[0]![0], P[0]![1]); for (const q of P.slice(1)) g.lineTo(q[0], q[1]); g.stroke(); g.restore();
  }
  function plate(c: Canvas, B: Box, k: number): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k) * 0.9; g.fillStyle = '#1A1E44';
    g.beginPath(); g.roundRect(B.x0 - 10, B.y0 - 6, B.w + 20, B.h + 12, 10); g.fill(); g.restore();
  }
  function glowRing(c: Canvas, B: Box, cl: Paint, k: number): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k); g.strokeStyle = col(cl); g.lineWidth = 5;
    g.shadowColor = col(cl); g.shadowBlur = 10 * th.glow * Math.hypot(g.getTransform().a, g.getTransform().b);
    g.beginPath(); g.roundRect(B.x0 - 9, B.y0 - 7, B.w + 18, B.h + 14, 14); g.stroke(); g.restore();
  }
  function blob(c: Canvas, at: Pt, r: number, cl: Paint, k: number, open = false): void {
    if (k <= 0) return;
    dot(c, at[0], at[1], (r + 2.6) * k, DUSK.ink);
    dot(c, at[0], at[1], r * k, cl);
    if (open) dot(c, at[0], at[1], Math.max(0, r - 5) * k, '#262B57');
  }
  function ghost(c: Canvas, at: Pt, r: number, a: number): void {
    if (a <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(a); g.setLineDash([4, 4]); g.strokeStyle = 'rgba(239,230,247,0.6)'; g.lineWidth = 2;
    g.beginPath(); g.arc(at[0], at[1], r - 1, 0, Math.PI * 2); g.stroke(); g.restore();
  }
  const partK = (P: Progress<string>, key: string, part: string) => Math.max(P.k(key), P.k(`${key}.${part}`));

  function draw(c: Canvas, P: Progress<string>, f: DFocus = {}): void {
    const kA = P.k('axis');
    const dim = new Set(f.dim ?? []);
    const sh = f.shift && f.shift.k > 0 ? f.shift : null;
    const dxOf = (k: string) => (sh && sh.panel === k ? sh.dx * sx * E.inOut(clamp(sh.k)) : 0);
    if (kA > 0) {
      withAlpha(c, E.smooth(clamp(kA * 2)), () => {
        wash(c, rectPts(fx0, fy0, fx1 - fx0, fy1 - fy0, 18), '#262B57', { seed: 43, rough: 1.3, ink: DUSK.ink, inkW: 3, shade: 0.25 });
        // faint guide lines at the ticks through every band, and each upper panel's own baseline
        for (const t of ticks) stroke(c, [[t.x, geo[0]!.band.y0], [t.x, axisY]], '#3A3F6E', 2);
        for (const g of geo.slice(0, -1)) stroke(c, [[gx0, g.base], [gx1, g.base]], '#6A6FA2', 2.5);
      });
      const kax = E.inOut(clamp(kA * 1.6 - 0.2));
      stroke(c, [[gx0 - 14, axisY], [gx0 - 14 + (gx1 + 28 - gx0) * kax, axisY]], ink, 4);
      const kl = E.smooth(clamp(kA * 2 - 0.9));
      for (const t of ticks) stroke(c, [[t.x, axisY], [t.x, axisY + (t.lab ? 14 : 8)]], ink, 3, undefined, kl);
      for (const L of tickLabs) drawWords(c, L.t, L.x, L.y, 'dim', kl, { size: NUM, align: 'center' });
      if ((f.heads ?? 0) > 0 && nameL) glowRing(c, nameL.b, 'pick', f.heads!);
      if (nameL) drawWords(c, nameL.t, (gx0 + gx1) / 2, axisY + 112 + under, 'ink', kl, { size: LAB, align: 'center', weight: 650 });
      for (const g of geo) if (g.label) drawWords(c, g.label.t, g.label.b.x0, g.head, 'ink', kl, { size: LAB, align: 'left', weight: 650 });
    }
    // bands first (behind the data)
    for (const m of marks) if (m.kind === 'band') {
      const k = P.k(m.key);
      if (k <= 0) continue;
      for (const g of covers(m)) {
        const { g: G } = c;
        G.save(); G.globalAlpha *= 0.16 * E.smooth(clamp(k)); G.fillStyle = col(m.col ?? 'pick');
        G.fillRect(px(m.a), g.band.y0 - 6, px(m.b) - px(m.a), g.base - g.band.y0 + 6); G.restore();
      }
    }
    for (const g of geo) {
      const q = panelOf(g.key), cl = q.col ?? (g.kind === 'box' ? 'second' : g.kind === 'hist' ? 'second' : 'first');
      withAlpha(c, dim.has(g.key) ? 0.3 : 1, () => {
        if (g.kind === 'dot') {
          const k = P.k(g.key), n = g.dots.length, dx = dxOf(g.key);
          const recol = new Map<number, { col: Paint; k: number }>(), fade = new Map<number, number>();
          for (const d of f.dots ?? []) if (d.panel === g.key) for (const i of d.idx) recol.set(i, { col: d.col, k: d.k });
          for (const d of f.fade ?? []) if (d.panel === g.key) for (const i of d.idx) fade.set(i, Math.max(fade.get(i) ?? 0, d.k));
          for (let i = 0; i < n; i++) {
            const ki = E.back(clamp(lag(k, i, n, 0.5)));
            if (ki <= 0) continue;
            const at: Pt = [g.dots[i]![0] + dx, g.dots[i]![1] - (1 - clamp(ki)) * 30];
            const fd = clamp(fade.get(i) ?? 0), rc = recol.get(i);
            if (fd > 0) ghost(c, at, g.r, fd);
            withAlpha(c, 1 - 0.85 * fd, () => {
              blob(c, at, g.r, cl, ki);
              if (rc && rc.k > 0) withAlpha(c, clamp(rc.k), () => blob(c, at, g.r, rc.col, ki));
            });
          }
        } else if (g.kind === 'hist') {
          const k = P.k(g.key), n = g.bars.length, mode = q.counts ?? 'axis';
          if (mode === 'axis') {
            const kl = clamp(Math.max(kA, k));
            const st = g.yStep;
            const hgt = g.base - g.band.y0 - 12;
            for (let v = 0; v <= g.yMax + 1e-9; v += st) {
              const yy = g.base - (v / g.yMax) * hgt;
              stroke(c, [[gx0 - 10, yy], [gx0, yy]], ink, 3, undefined, kl);
              if (v > 0) stroke(c, [[gx0, yy], [gx1, yy]], '#3A3F6E', 2, [6, 8], kl);
              drawWords(c, String(v), gx0 - 18, yy, 'dim', kl, { size: LAB, align: 'right' });
            }
            stroke(c, [[gx0, g.base], [gx0, g.band.y0 + 4]], ink, 3, undefined, kl);
          }
          g.bars.forEach((B, i) => {
            const ki = E.inOut(clamp(lag(k, i, n, 0.5)));
            if (ki <= 0 || B.n === 0) return;
            const y0 = g.base - (g.base - B.box.y0) * ki;
            wash(c, rectPts(B.box.x0, y0, B.box.w, g.base - y0, 4), cl, { seed: 70 + i, rough: 0.8, ink: DUSK.ink, inkW: 3, shade: 0.3 });
            if (mode === 'top' && ki > 0.9) drawWords(c, String(B.n), B.box.cx, B.box.y0 - 30, 'ink', clamp((ki - 0.9) * 10), { size: LAB, align: 'center', weight: 700 });
          });
        } else {
          const F = g.five!, [y0, y1] = g.boxY, cy = (y0 + y1) / 2, [w0, w1] = g.wEnds!;
          const kq = partK(P, g.key, 'q'), kb = partK(P, g.key, 'box'), km = partK(P, g.key, 'med'), kw = partK(P, g.key, 'whisk'), ko = partK(P, g.key, 'out');
          if (kb > 0) withAlpha(c, E.smooth(clamp(kb)), () => wash(c, rectPts(px(F.q1), y0, px(F.q3) - px(F.q1), y1 - y0, 6), cl, { seed: 91, rough: 0.9, ink: null, alpha: 0.55, shade: 0.2 }));
          if (kb > 0) { const kk = E.inOut(clamp(kb)); for (const yy of [y0, y1]) stroke(c, [[px(F.q1), yy], [px(F.q1) + (px(F.q3) - px(F.q1)) * kk, yy]], ink, 4); }
          if (kq > 0) for (const v of [F.q1, F.q3]) stroke(c, [[px(v), cy], [px(v), cy + (y0 - 8 - cy) * E.inOut(clamp(kq))]], ink, 5), stroke(c, [[px(v), cy], [px(v), cy + (y1 + 8 - cy) * E.inOut(clamp(kq))]], ink, 5);
          if (km > 0) stroke(c, [[px(F.med), cy], [px(F.med), cy + (y0 - 10 - cy) * E.inOut(clamp(km))]], 'link', 8), stroke(c, [[px(F.med), cy], [px(F.med), cy + (y1 + 10 - cy) * E.inOut(clamp(km))]], 'link', 8);
          if (kw > 0) {
            const kk = E.inOut(clamp(kw));
            stroke(c, [[px(F.q1), cy], [px(F.q1) + (px(w0) - px(F.q1)) * kk, cy]], ink, 4);
            stroke(c, [[px(F.q3), cy], [px(F.q3) + (px(w1) - px(F.q3)) * kk, cy]], ink, 4);
            if (kk > 0.95) for (const v of [w0, w1]) stroke(c, [[px(v), cy - 24], [px(v), cy + 24]], ink, 4);
          }
          if (ko > 0) g.outs.forEach((v, i) => blob(c, [px(v), cy], 14, 'first', E.back(clamp(lag(ko, i, g.outs.length, 0.4))), true));
        }
      });
    }
    // marks
    for (const m of marks) {
      const k = P.k(m.key);
      if (k <= 0 || m.kind === 'band') continue;
      const cl = m.col ?? 'pick';
      if (m.kind === 'vline') {
        const cs = covers(m), yTop = cs[0]!.band.y0 - 4, yBot = cs[cs.length - 1]!.base, x = px(m.x) + dxOf(cs[0]!.key);
        stroke(c, [[x, yBot], [x, yBot + (yTop - yBot) * E.inOut(clamp(k))]], cl, 5, m.dash === false ? undefined : [14, 10]);
      } else if (m.kind === 'bracket') {
        const g = geoOf(m.panel)!, yy = g.band.y0 + 14, a = px(m.a), b = px(m.b), kk = E.inOut(clamp(k)), mid = (a + b) / 2;
        stroke(c, [[mid - (mid - a) * kk, yy + 16], [mid - (mid - a) * kk, yy], [mid + (b - mid) * kk, yy], [mid + (b - mid) * kk, yy + 16]], cl, 5);
      } else if (m.kind === 'fulcrum') {
        const g = geoOf(m.panel)!, x = px(m.x) + dxOf(g.key), yy = g.base + 6, s = 26 * E.back(clamp(k));
        const { g: G } = c;
        G.save(); G.fillStyle = col(cl); G.strokeStyle = DUSK.ink; G.lineWidth = 3;
        G.beginPath(); G.moveTo(x, yy); G.lineTo(x + s, yy + s * 1.4); G.lineTo(x - s, yy + s * 1.4); G.closePath(); G.fill(); G.stroke(); G.restore();
      } else if (m.kind === 'devs') {
        // each value's distance to the mean as its own bar, one row per value above the dots (a dashed drop to the dot)
        const g = geoOf(m.panel)!, dx = dxOf(g.key), xm = px(m.about) + dx, n = g.dots.length;
        const topDot = Math.min(...g.dots.map(d => d[1] - g.r)), y0 = g.band.y0 + 14, room = topDot - 16 - y0;
        const gap = Math.min(20, room / Math.max(1, n - 1));
        stroke(c, [[xm, g.base], [xm, g.band.y0 + 6]], cl, 3, [8, 8], clamp(k));
        g.dots.forEach((d, i) => {
          const ki = E.inOut(clamp(lag(k, i, n, 0.5)));
          if (ki <= 0 || Math.abs(d[0] + dx - xm) < 1) return;
          const yy = gap >= 8 ? y0 + i * gap : d[1], x1 = xm + (d[0] + dx - xm) * ki;
          stroke(c, [[xm, yy], [x1, yy]], cl, 5);
          if (gap >= 8 && ki > 0.98) stroke(c, [[x1, yy], [x1, d[1] - g.r - 4]], 'rgba(213,198,247,0.35)', 2, [4, 6]);
        });
      }
    }
    for (const m of marks) {
      const L = labels.get(m.key), k = P.k(m.key);
      if (!L || k <= 0) continue;
      plate(c, L.b, clamp(k * 1.4 - 0.4)); drawWords(c, L.t, L.x, L.y, m.col ?? 'pick', clamp(k * 1.4 - 0.4), { size: LAB, align: L.al, weight: 700 });
    }
    for (const r of f.ring ?? []) glowRing(c, where(r.key), r.col, r.k);
  }

  function where(key: string): Box {
    const g = geoOf(key);
    if (g) return box(g.band.x0, g.band.y0, g.band.x1, g.base);
    const L = labels.get(key);
    if (L) return L.b;
    const m = marks.find(q => q.key === key);
    if (m) {
      if (m.kind === 'vline' || m.kind === 'fulcrum') { const cs = covers(m); return box(px(m.x) - 8, cs[0]!.band.y0, px(m.x) + 8, cs[cs.length - 1]!.base); }
      if (m.kind === 'bracket') { const G = geoOf(m.panel)!; return box(px(m.a), G.band.y0 + 8, px(m.b), G.band.y0 + 34); }
      if (m.kind === 'band') { const cs = covers(m); return box(px(m.a), cs[0]!.band.y0, px(m.b), cs[cs.length - 1]!.base); }
      const G = geoOf(m.panel)!; return box(G.band.x0, G.band.y0, G.band.x1, G.base);
    }
    const [pk, part, idx] = key.split('.');
    const P0 = geoOf(pk ?? '');
    check(P0, NAME, `no box for "${key}"`);
    const G = P0!;
    if (part === 'label' && G.label) return G.label.b;
    if (part === 'dot') { const d = G.dots[Number(idx)]; check(d, NAME, `no dot ${key}`); return box(d![0] - G.r, d![1] - G.r, d![0] + G.r, d![1] + G.r); }
    if (part === 'bar') { const B = G.bars[Number(idx)]; check(B, NAME, `no bar ${key}`); return B!.box; }
    if (G.kind === 'box') {
      const F = G.five!, [y0, y1] = G.boxY, cy = (y0 + y1) / 2, [w0, w1] = G.wEnds!;
      const at = (v: number) => box(px(v) - 8, y0 - 10, px(v) + 8, y1 + 10);
      switch (part) {
        case 'box': return box(px(F.q1), y0, px(F.q3), y1);
        case 'med': return at(F.med);
        case 'q1': return at(F.q1);
        case 'q3': return at(F.q3);
        case 'lo': return box(px(w0), cy - 24, px(F.q1), cy + 24);
        case 'hi': return box(px(F.q3), cy - 24, px(w1), cy + 24);
        case 'out': { const v = G.outs[Number(idx ?? 0)]; check(v !== undefined, NAME, `no outlier ${key}`); return box(px(v!) - 16, cy - 16, px(v!) + 16, cy + 16); }
      }
    }
    check(false, NAME, `no box for "${key}"`);
    return box(0, 0, 0, 0);
  }
  return { kind: 'DataPlot', box: box(fx0, fy0, fx1, fy1), panels: geo, px, toData, dropped, where, draw };
}

/** a tidy axis for data on [lo, hi]: a step from 1, 2, 2.5, 5 × 10^k with 6 to 14 ticks, ends on ticks, a margin */
export function axisFor(lo: number, hi: number, o: { name?: string; ticks?: [number, number]; pad?: number } = {}): DAxis {
  const [tMin, tMax] = o.ticks ?? [6, 14];
  const span = Math.max(hi - lo, 1e-6);
  const cands = [0.1, 0.2, 0.5, 1, 2, 2.5, 5, 10, 20, 25, 50, 100, 200, 250, 500];
  for (const s of cands) {
    const pad = o.pad ?? 0;
    const min = r9(Math.floor((lo - pad * s) / s) * s), max = r9(Math.ceil((hi + pad * s) / s) * s);
    const n = Math.round((max - min) / s);
    if (n >= tMin && n <= tMax) return { min, max, step: s, name: o.name };
    if (n < tMin) {
      const extra = tMin - n;
      let mn = r9(min - Math.floor(extra / 2) * s), mx = r9(max + Math.ceil(extra / 2) * s);
      if (lo >= 0 && mn < 0) { mx = r9(mx - mn); mn = 0; }
      return { min: mn, max: mx, step: s, name: o.name };
    }
  }
  return { min: lo, max: hi, step: (hi - lo) / 10, name: o.name };
}
