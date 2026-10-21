// CircleGraph: a circle graph built the way a kid builds it by hand. The whole circle is ONE named data set
// (100% and 360°, the amber rim); its sectors are the categories (teal washes), each starting where the last ended.
//   circle   the empty circle and its centre (the whole)
//   dots     one dot per observation just inside the rim (n ≤ 72): each one is 360/n degrees of the circle
//   ring     the double scale outside the rim: 0% 0°, 25% 90°, 50% 180°, 75% 270° (or a percent circle, 1% ticks)
//   sweep    the sectors sweep in one after another, clockwise from the start ray (k: 1/m per sector)
//   labels   name + percent beside each sector, outside the rim (pushed apart, never on a line)
//   title    the collection and its total n
// Maths in pieMaths.ts (exact, checked); the block lays out in a Frame and throws BlockError when unreadable.
import { type Box, type Pt, box, clamp, lerp } from '../../../core/math';
import { type Canvas, dot, strokePts, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { type Frame, check } from '../../../blocks/block';
import { drawWords, wordsBox } from '../../words';
import { wash } from '../../wash';
import { DUSK } from '../../dusk';
import { type Cat, type PieMaths, computePie } from './pieMaths';

export type CircleStep = 'circle' | 'dots' | 'ring' | 'sweep' | 'labels' | 'title';
export const CIRCLE_STEPS: readonly CircleStep[] = ['circle', 'dots', 'ring', 'sweep', 'labels', 'title'];

/** the sector washes: one cool family (they are all PARTS of the whole), told apart by tone and by their labels */
export const TONES = ['#3CC6C2', '#2E8FA8', '#67B9A2', '#4277A6', '#86D9CC', '#2F6A80', '#59A9C9', '#3E9C8A'] as const;

export interface CircleParams {
  cats: readonly Cat[];
  /** the stated whole (default: the sum of the counts); more than the counts leaves an unaccounted gap */
  n?: number;
  /** drawn angles in degrees (default: the closed drawing list); a wrong graph passes its own */
  angles?: readonly number[];
  /** start ray, degrees clockwise from 12 o'clock */
  start?: number;
  cx?: number; cy?: number; r?: number;
  /** label lines per sector ([name, value]); default name + rounded percent; 'none' = no labels */
  labels?: readonly (readonly [string, string] | null)[] | 'none';
  /** label i is drawn beside sector labelAt[i] (swapped labels) */
  labelAt?: readonly number[];
  title?: string;
  dots?: boolean;
  ring?: 'quarters' | 'pct100' | null;
  /** label of the unaccounted gap when the counts are less than the whole (null = no label) */
  gap?: string | null;
  /** all sectors in one plain tone (shape pictures) */
  plain?: boolean;
}
export interface CircleFocus {
  /** light one sector in a role colour, dim the rest */
  sector?: number; col?: Paint; k?: number; dim?: number;
  /** light the dots of one category */
  dotsOf?: number; dotsK?: number;
  /** a dashed wedge outline (what a sector should be), degrees clockwise from the start ray */
  ghost?: { a0: number; a1: number; col: Paint; k: number };
  /** a right-angle mark in a sector */
  right?: { sector: number; k: number; col: Paint };
  /** 0 = labels where labelAt puts them, 1 = every label beside its own sector */
  unswap?: number;
  /** the value line of the focus sector's label turns into this text (a worked answer) */
  reveal?: { text: string; k: number };
  /** pulse of the rim (the whole) */
  rim?: number;
  /** a marked ray (degrees from the start ray) with a short text beside its end */
  ray?: { deg: number; text?: string; k: number; col: Paint };
  /** an arc arrow along the rim from a0 to a1 (degrees from the start ray): "go around" */
  arc?: { a0: number; a1: number; k: number; col: Paint };
}
interface Label { name: string; value: string; x: number; y: number; align: 'left' | 'right' | 'center'; box: Box; sector: number }
export interface CircleBlock {
  readonly kind: 'CircleGraph';
  readonly maths: PieMaths;
  readonly angles: readonly number[];
  readonly steps: readonly CircleStep[];
  readonly box: Box;
  readonly where: {
    centre: Box; circle: Box;
    /** a box inside sector i (the target for a leader) */ sector(i: number): Box;
    /** the rim at the middle of sector i */ rim(i: number): Box;
    /** start / end angle (from 12 o'clock, clockwise) of sector i */ a0(i: number): number; a1(i: number): number;
    label(i: number): Box; title: Box;
  };
  draw(c: Canvas, p: Progress<CircleStep>, f?: CircleFocus): void;
}

const NAME = 'CircleGraph';
const NAME_PX = 44, VAL_PX = 48, LINE = 50, LBL_H = 100, PAD = 34;

export function CircleGraph(p: CircleParams, fr: Frame, th: Theme): CircleBlock {
  const m = computePie(p.cats, p.n);
  const angles = p.angles ? [...p.angles] : m.draw;
  check(angles.length === m.cats.length, NAME, 'one angle per category');
  const sumA = angles.reduce((s, a) => s + a, 0);
  check(sumA <= 360 + 1e-9, NAME, `the drawn angles total ${sumA}°, more than a full turn`);
  const start = p.start ?? 0;
  const r = p.r ?? Math.min(270, fr.w / 2 - 200, fr.h / 2 - 150);
  check(r >= 90, NAME, 'the circle is too small to read');
  const cx = p.cx ?? fr.x + fr.w / 2 + 10, cy = p.cy ?? fr.y + fr.h / 2 + 40;
  const A0: number[] = [], A1: number[] = [];
  let acc = 0;
  for (const a of angles) { A0.push(start + acc); acc += a; A1.push(start + acc); }
  const pt = (deg: number, R: number): Pt => { const t = (deg * Math.PI) / 180; return [cx + R * Math.sin(t), cy - R * Math.cos(t)]; };
  const mid = (i: number) => (A0[i]! + A1[i]!) / 2;
  const wedge = (a0: number, a1: number, R: number): Pt[] => {
    const span = a1 - a0, n = Math.max(2, Math.ceil(span / 3));
    const P: Pt[] = [];
    if (span < 359.9) P.push([cx, cy]);
    for (let j = 0; j <= n; j++) P.push(pt(a0 + (span * j) / n, R));
    return P;
  };
  const circle = box(cx - r, cy - r, cx + r, cy + r);
  const centre = box(cx - 8, cy - 8, cx + 8, cy + 8);
  const sectorBox = (i: number): Box => { const q = pt(mid(i), r * (angles[i]! >= 40 ? 0.6 : 0.75)); return box(q[0] - 26, q[1] - 26, q[0] + 26, q[1] + 26); };
  const rimBox = (i: number): Box => { const q = pt(mid(i), r); return box(q[0] - 14, q[1] - 14, q[0] + 14, q[1] + 14); };

  // ---- labels: outside the rim, beside the middle of their sector, pushed apart on each side ----
  const want: (readonly [string, string] | null)[] = p.labels === 'none' ? m.cats.map(() => null)
    : p.labels ? [...p.labels] : m.cats.map((c, i) => [c.name, `${m.pctLabel[i]}%`] as const);
  const labelAt = p.labelAt ? [...p.labelAt] : m.cats.map((_, i) => i);
  const outR = r + PAD;
  function boxAt(name: string, value: string, x: number, y: number, align: Label['align']): Box {
    const b1 = wordsBox(name, x, y - LINE / 2, { size: NAME_PX, align }), b2 = wordsBox(value, x, y + LINE / 2, { size: VAL_PX, align, weight: 700 });
    return box(Math.min(b1.x0, b2.x0), b1.y0, Math.max(b1.x1, b2.x1), b2.y1);
  }
  /** distance from the centre to the nearest point of a box */
  const near = (b: Box) => Math.hypot(clamp(cx, b.x0, b.x1) - cx, clamp(cy, b.y0, b.y1) - cy);
  function place(sector: number, name: string, value: string): Label {
    const a = mid(sector), s = Math.sin((a * Math.PI) / 180);
    const align: Label['align'] = s > 0.2 ? 'left' : s < -0.2 ? 'right' : 'center';
    let R = outR - 30, x = 0, y = 0, b: Box;
    do { R += 6; [x, y] = pt(a, R); b = boxAt(name, value, x, y, align); } while (near(b) < outR - 4);
    return { name, value, x, y, align, box: b, sector };
  }
  const labels: (Label | null)[] = want.map((w, i) => (w && angles[labelAt[i]!]! > 0 ? place(labelAt[i]!, w[0], w[1]) : null));
  const own: (Label | null)[] = want.map((w, i) => (w && angles[i]! > 0 ? place(i, w[0], w[1]) : null));
  /** push labels on the same side apart vertically (then out again, clear of the rim) */
  function spread(L: (Label | null)[]): void {
    for (const side of ['left', 'right'] as const) {
      const S = L.filter((l): l is Label => !!l && l.align === side).sort((a, b) => a.y - b.y);
      for (let pass = 0; pass < 6; pass++) {
        for (let j = 1; j < S.length; j++) { const d = S[j]!.y - S[j - 1]!.y; if (d < LBL_H + 8) { const push = (LBL_H + 8 - d) / 2; S[j - 1]!.y -= push; S[j]!.y += push; } }
      }
      for (const l of S) {
        l.box = boxAt(l.name, l.value, l.x, l.y, l.align);
        while (near(l.box) < outR - 4) { l.x += side === 'left' ? 6 : -6; l.box = boxAt(l.name, l.value, l.x, l.y, l.align); }
      }
    }
  }
  spread(labels); spread(own);
  for (const L of [labels, own]) {
    const live = L.filter((l): l is Label => !!l);
    for (const l of live) {
      check(l.box.y0 >= fr.y - 10 && l.box.y1 <= fr.y + fr.h + 20, NAME, `the label "${l.name}" runs off the top or bottom`);
      check(l.box.x0 >= 24 && l.box.x1 <= 1200, NAME, `the label "${l.name}" runs off the side`);
      check(near(l.box) > r + 16, NAME, `the label "${l.name}" sits on the circle`);
    }
    for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) {
      const a = live[i]!.box, b = live[j]!.box;
      check(!(a.x0 < b.x1 + 8 && b.x0 < a.x1 + 8 && a.y0 < b.y1 + 4 && b.y0 < a.y1 + 4), NAME, `labels "${live[i]!.name}" and "${live[j]!.name}" overlap`);
    }
  }
  const titleY = Math.min(cy - r - (p.ring ? 170 : 150), fr.y + 40);
  const titleBox = p.title ? wordsBox(p.title, fr.x + 10, titleY, { size: 44 }) : box(fr.x, titleY, fr.x, titleY);
  if (p.title) {
    check(titleBox.y0 >= 20, NAME, 'the title does not fit above the circle');
    for (const l of labels) if (l) check(!(l.box.y0 < titleBox.y1 + 6 && l.box.x0 < titleBox.x1 && l.box.x1 > titleBox.x0), NAME, `the title runs into the label "${l.name}"`);
  }
  const showDots = !!p.dots;
  if (showDots) check(m.n <= 72, NAME, 'one dot per observation needs n ≤ 72');
  const gapA0 = start + sumA, gapA1 = start + 360;
  const hasGap = sumA < 359.9;

  function ring(c: Canvas, k: number): void {
    if (k <= 0 || !p.ring) return;
    withAlpha(c, k, () => {
      if (p.ring === 'pct100') {
        for (let i = 0; i < 100; i++) {
          const big = i % 10 === 0, a = start + i * 3.6;
          strokePts(c, [pt(a, r + 6), pt(a, r + (big ? 30 : i % 5 === 0 ? 22 : 14))], { col: big ? 'dim' : 'faint', lw: big ? 3 : 2 });
        }
      } else {
        for (let i = 0; i < 20; i++) {
          const a = start + i * 18, big = i % 5 === 0;
          strokePts(c, [pt(a, r + 6), pt(a, r + (big ? 30 : 18))], { col: big ? 'dim' : 'faint', lw: big ? 3.5 : 2.5 });
        }
      }
      for (let qd = 0; qd < 4; qd++) {
        const a = start + qd * 90, [x, y] = pt(a, r + 60);
        const s = Math.sin((a * Math.PI) / 180), cc = -Math.cos((a * Math.PI) / 180);
        const align = s > 0.5 ? 'left' : s < -0.5 ? 'right' : 'center';
        const yy = align === 'center' ? (cc < 0 ? y - 26 : y + 26) : y;
        const xx = align === 'left' ? x - 18 : align === 'right' ? x + 18 : x;
        drawWords(c, `${qd * 25}%`, xx, yy - 26, 'ink', 1, { size: 46, align, weight: 700 });
        drawWords(c, `${qd * 90}°`, xx, yy + 24, 'dim', 1, { size: 44, align });
      }
    });
  }

  function draw(c: Canvas, P: Progress<CircleStep>, f: CircleFocus = {}): void {
    const kC = P.k('circle'), kD = P.k('dots'), kR = P.k('ring'), kS = P.k('sweep'), kL = P.k('labels'), kT = P.k('title');
    const dim = clamp(f.dim ?? 0) * clamp(f.k ?? 0);
    if (kC > 0) withAlpha(c, E.smooth(kC), () => {
      // the paper disc and the whole (amber rim)
      wash(c, wedge(0, 360, r + 4), '#2A2F5E', { seed: 31, ink: null, rough: 1.2, shade: 0.25 });
    });
    ring(c, kR);
    // sectors
    const live = angles.map((a, i) => (a > 0 ? i : -1)).filter(i => i >= 0);
    const ms = live.length;
    live.forEach((i, j) => {
      const ks = clamp(kS * ms - j);
      if (ks <= 0) return;
      const a1 = lerp(A0[i]!, A1[i]!, ks);
      const lit = f.sector === i ? clamp(f.k ?? 0) : 0;
      const tone = p.plain ? TONES[0] : TONES[i % TONES.length]!;
      withAlpha(c, 1 - (f.sector !== undefined && f.sector !== i ? dim * 0.6 : 0), () => {
        wash(c, wedge(A0[i]!, a1, r), tone, { seed: 50 + i, ink: null, rough: 1.0, shade: 0.2 });
        if (lit > 0) withAlpha(c, lit, () => wash(c, wedge(A0[i]!, a1, r), f.col ?? 'link', { seed: 70 + i, ink: null, rough: 1.0, shade: 0.15 }));
      });
    });
    // the gap of an incomplete whole: dashed, empty
    if (hasGap && kS >= 1 && kC > 0) {
      const W = wedge(gapA0, gapA1, r - 3);
      withAlpha(c, 0.22, () => wash(c, W, 'wrong', { seed: 97, ink: null, rough: 0.8, shade: 0 }));
      strokePts(c, W, { col: 'wrong', lw: 4, dash: [12, 10], closed: true });
    }
    // sector edges (crisp radii: this is where precision matters) and the rim
    if (kC > 0) {
      const edges = new Set<number>();
      live.forEach((i, j) => { const ks = clamp(kS * ms - j); if (ks > 0) { edges.add(A0[i]!); if (ks >= 1) edges.add(A1[i]!); else edges.add(lerp(A0[i]!, A1[i]!, ks)); } });
      if (!(live.length === 1 && angles[live[0]!]! >= 359.9 && kS >= 1)) for (const a of edges) strokePts(c, [[cx, cy], pt(a, r)], { col: DUSK.cream, lw: 3.5, alpha: 0.92 });
      const rimPulse = clamp(f.rim ?? 0);
      strokePts(c, wedge(0, 360, r), { col: 'first', lw: 4.5 + 3 * rimPulse, closed: true, alpha: E.smooth(kC), glow: rimPulse ? 14 * rimPulse : 0 });
      dot(c, cx, cy, 7, DUSK.cream, E.smooth(kC));
    }
    // one dot per observation
    if (showDots && kD > 0) {
      const step = 360 / m.n;
      let C0 = 0;
      const owner: number[] = [];
      m.cats.forEach((cat, i) => { for (let j = 0; j < cat.count; j++) owner.push(i); C0 += cat.count; });
      for (let j = 0; j < m.n; j++) {
        const kd = clamp(kD * 1.4 - (j / m.n) * 0.4);
        if (kd <= 0) continue;
        const [x, y] = pt(start + (j + 0.5) * step, r - 20);
        const on = f.dotsOf !== undefined && owner[j] === f.dotsOf ? clamp(f.dotsK ?? 1) : 0;
        dot(c, x, y, 6 + 2 * on, on > 0 ? 'second' : DUSK.cream, kd * (0.8 + 0.2 * on));
        if (on > 0) dot(c, x, y, 3, DUSK.navy, kd * on);
      }
    }
    // a ghost wedge (what a sector should be)
    if (f.ghost && f.ghost.k > 0) {
      const g0 = start + f.ghost.a0, g1 = start + f.ghost.a1;
      const W = wedge(g0, lerp(g0, g1, E.inOut(clamp(f.ghost.k))), r + 14);
      strokePts(c, W, { col: f.ghost.col, lw: 4.5, dash: [16, 12], closed: true, glow: 8 });
    }
    // a right-angle mark
    if (f.right && f.right.k > 0) {
      const i = f.right.sector, s = 46;
      const a = pt(A0[i]!, s), b = pt(A0[i]! + 45, s * Math.SQRT2), d = pt(A0[i]! + 90, s);
      strokePts(c, [a, b, d], { col: f.right.col, lw: 4.5, alpha: E.smooth(clamp(f.right.k)) });
    }
    // a marked ray
    if (f.ray && f.ray.k > 0) {
      const a = start + f.ray.deg;
      withAlpha(c, E.smooth(clamp(f.ray.k)), () => {
        strokePts(c, [[cx, cy], pt(a, r + 40)], { col: f.ray!.col, lw: 5, glow: 8 });
        if (f.ray!.text) {
          const [x, y] = pt(a, r + 74), s = Math.sin((a * Math.PI) / 180);
          drawWords(c, f.ray!.text, x, y, f.ray!.col, 1, { size: 46, align: s > 0.3 ? 'left' : s < -0.3 ? 'right' : 'center', weight: 700 });
        }
      });
    }
    // go around: an arc arrow just outside the rim
    if (f.arc && f.arc.k > 0) {
      const a0 = start + f.arc.a0, a1 = lerp(a0, start + f.arc.a1, E.inOut(clamp(f.arc.k)));
      const W = wedge(a0, a1, r + 22).slice(1);
      strokePts(c, W, { col: f.arc.col, lw: 5, glow: 6 });
      if (W.length > 1) { const e = W[W.length - 1]!; dot(c, e[0], e[1], 8, f.arc.col); }
    }
    // labels
    if (kL > 0) {
      const u = E.smooth(clamp(f.unswap ?? 0));
      labels.forEach((l, i) => {
        if (!l) return;
        const o = own[i] ?? l;
        const x = lerp(l.x, o.x, u), y = lerp(l.y, o.y, u);
        const align = u < 0.5 ? l.align : o.align;
        const lit = f.sector !== undefined && (u < 0.5 ? l.sector : o.sector) === f.sector ? clamp(f.k ?? 0) : 0;
        withAlpha(c, E.smooth(kL) * (1 - (f.sector !== undefined && !lit ? dim * 0.5 : 0)), () => {
          drawWords(c, l.name, x, y - LINE / 2, lit > 0 && f.col ? f.col : 'ink', 1, { size: NAME_PX, align });
          const rk = f.reveal && i === f.sector ? clamp(f.reveal.k) : 0;
          const vcol = lit > 0 && f.col ? f.col : 'ink';
          if (rk < 1) drawWords(c, l.value, x, y + LINE / 2, vcol, 1 - rk, { size: VAL_PX, align, weight: 700 });
          if (rk > 0) drawWords(c, f.reveal!.text, x, y + LINE / 2, 'link', rk, { size: VAL_PX, align, weight: 700 });
        });
      });
    }
    if (hasGap && kL > 0 && p.gap) {
      const a = (gapA0 + gapA1) / 2, [x, y] = pt(a, outR), s = Math.sin((a * Math.PI) / 180);
      drawWords(c, p.gap, x, y, 'wrong', E.smooth(kL), { size: NAME_PX, align: s > 0.3 ? 'left' : s < -0.3 ? 'right' : 'center', weight: 700 });
    }
    if (p.title && kT > 0) drawWords(c, p.title, fr.x + 10, titleY, 'dim', E.smooth(kT), { size: 44 });
  }

  return {
    kind: 'CircleGraph', maths: m, angles, steps: CIRCLE_STEPS, box: box(fr.x, fr.y, fr.x + fr.w, fr.y + fr.h),
    where: {
      centre, circle, sector: sectorBox, rim: rimBox, a0: i => A0[i]!, a1: i => A1[i]!,
      label: i => labels[i]?.box ?? rimBox(i), title: titleBox,
    },
    draw,
  };
}

// ---------- a plain bar graph (for data that a circle graph does not fit) ----------
export interface BarParams { bars: readonly { name: string; value: number }[]; unit: string; title?: string; max?: number }
export interface BarBlock { readonly box: Box; draw(c: Canvas, k: number): void }
export function BarGraph(p: BarParams, fr: Frame): BarBlock {
  const n = p.bars.length;
  check(n >= 2 && n <= 6, 'BarGraph', '2 to 6 bars');
  const top = fr.y + 150, left = fr.x + 250, right = fr.x + fr.w - 150;
  const rowH = Math.min(118, (fr.h - 220) / n);
  check(rowH >= 70, 'BarGraph', 'bars too thin to label');
  const max = p.max ?? Math.max(...p.bars.map(b => b.value));
  const X = (v: number) => left + ((right - left) * v) / max;
  for (const b of p.bars) check(wordsBox(b.name, left - 24, 0, { size: 44, align: 'right' }).x0 >= fr.x - 10, 'BarGraph', `the name "${b.name}" does not fit`);
  return {
    box: box(fr.x, fr.y, fr.x + fr.w, fr.y + fr.h),
    draw(c: Canvas, k: number): void {
      if (k <= 0) return;
      if (p.title) drawWords(c, p.title, fr.x + 10, fr.y + 40, 'dim', clamp(k * 3), { size: 44 });
      strokePts(c, [[left, top - 20], [left, top + n * rowH]], { col: 'dim', lw: 3, alpha: clamp(k * 3) });
      p.bars.forEach((b, i) => {
        const kb = E.smooth(clamp(k * 1.5 - (i / n) * 0.5));
        if (kb <= 0) return;
        const y = top + i * rowH + rowH * 0.15, h = rowH * 0.62;
        const x1 = lerp(left, X(b.value), kb);
        if (x1 - left > 4) wash(c, [[left, y], [x1, y], [x1, y + h], [left, y + h]], TONES[i % TONES.length]!, { seed: 90 + i, ink: null, rough: 1, shade: 0.2 });
        drawWords(c, b.name, left - 24, y + h / 2, 'ink', kb, { size: 44, align: 'right' });
        drawWords(c, `${b.value}${p.unit}`, x1 + 18, y + h / 2, 'ink', kb, { size: 46, weight: 700 });
      });
    },
  };
}
export const paintOf = (th: Theme, col: Paint): string => paint(th, col, 'fill');
